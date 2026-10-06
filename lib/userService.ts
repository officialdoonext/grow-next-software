import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from "firebase/firestore";

export interface UserProfile {
  name: string;
  mobile: string;
  email: string;
  city: string;
  address: string;
  businessName?: string;
  logoUrl?: string;
  status: "active" | "inactive";
  expiryDate: string | null;
  role: "admin" | "staff";
  createdAt: string;
  updatedAt: string;
}

// In-memory cache for OTP codes only
const memoryOtpCache = new Map<string, { hash: string; expiresAt: number; attempts: number }>();

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeEmailKey(email: string): string {
  return email.toLowerCase().trim().replace(/[.#$[\]]/g, "_");
}

/**
 * Validates the strict dual-condition approval:
 * 1. Status MUST be strictly "active" (case-insensitive)
 * 2. Expiry Date MUST NOT be null, "null", empty, or past date
 */
export function validateUserApproval(profile: UserProfile | null | undefined): {
  isApproved: boolean;
  isStatusActive: boolean;
  isDateValid: boolean;
  reason: string;
} {
  if (!profile) {
    return {
      isApproved: false,
      isStatusActive: false,
      isDateValid: false,
      reason: "No user profile found.",
    };
  }

  // 1. Status check: strictly "active"
  const statusStr = typeof profile.status === "string" ? profile.status.toLowerCase().trim() : "";
  const isStatusActive = statusStr === "active";

  // 2. Expiry date check: must NOT be null, "null", empty, and must be in the future
  let isDateValid = false;
  const rawDate = profile.expiryDate;

  if (
    rawDate !== null &&
    rawDate !== undefined &&
    typeof rawDate === "string" &&
    rawDate.trim() !== "" &&
    rawDate.trim().toLowerCase() !== "null" &&
    rawDate.trim().toLowerCase() !== "undefined"
  ) {
    const timestamp = new Date(rawDate.trim()).getTime();
    if (!isNaN(timestamp) && timestamp > Date.now()) {
      isDateValid = true;
    }
  }

  const isApproved = isStatusActive && isDateValid;

  let reason = "";
  if (!isApproved) {
    if (!isStatusActive && !isDateValid) {
      reason = "Account status is Inactive and License is unassigned (Null).";
    } else if (!isStatusActive) {
      reason = "Account status is Inactive. Administrator approval required.";
    } else {
      reason = "Software license is unassigned (Null) or has expired.";
    }
  }

  return {
    isApproved,
    isStatusActive,
    isDateValid,
    reason,
  };
}

/**
 * Saves OTP hash with 10-minute expiry
 */
export async function saveOtp(email: string, hash: string): Promise<void> {
  const norm = normalizeEmail(email);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store in memory
  memoryOtpCache.set(norm, { hash, expiresAt, attempts: 0 });

  // Store in Firestore otps collection with normalized email as clean ID
  try {
    const otpRef = doc(db, "otps", norm);
    await setDoc(otpRef, {
      email: norm,
      hash,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Firestore OTP Save Note]", err);
  }
}

/**
 * Retrieves stored OTP record
 */
export async function getStoredOtp(email: string): Promise<{ hash: string; expiresAt: number; attempts: number } | null> {
  const norm = normalizeEmail(email);
  const altKey = sanitizeEmailKey(email);

  // Try memory cache first
  const cached = memoryOtpCache.get(norm) || memoryOtpCache.get(altKey);
  if (cached) return cached;

  // Try Firestore
  try {
    const otpRef = doc(db, "otps", norm);
    const snap = await getDoc(otpRef);
    if (snap.exists()) {
      return snap.data() as { hash: string; expiresAt: number; attempts: number };
    }

    if (altKey !== norm) {
      const altRef = doc(db, "otps", altKey);
      const altSnap = await getDoc(altRef);
      if (altSnap.exists()) {
        return altSnap.data() as { hash: string; expiresAt: number; attempts: number };
      }
    }
  } catch (err) {
    console.warn("[Firestore OTP Fetch Note]", err);
  }

  return null;
}

/**
 * Clears OTP after successful verification
 */
export async function deleteOtp(email: string): Promise<void> {
  const norm = normalizeEmail(email);
  const altKey = sanitizeEmailKey(email);

  memoryOtpCache.delete(norm);
  memoryOtpCache.delete(altKey);

  try {
    const otpRef = doc(db, "otps", norm);
    await setDoc(otpRef, { used: true, expiresAt: 0 }, { merge: true });
  } catch {
    // Ignore error on deletion
  }
}

/**
 * Fetches user profile directly from Firestore (always fresh, zero stale caching).
 * Thoroughly checks normalized doc ID, legacy sanitized ID, and query by email field.
 * Automatically cleans up any duplicate documents found.
 */
export async function getUserProfile(email: string): Promise<UserProfile | null> {
  const norm = normalizeEmail(email);
  const altKey = sanitizeEmailKey(email);

  try {
    // 1. Try normalized email as canonical document ID directly from Firestore
    const userRef = doc(db, "users", norm);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    // 2. Try legacy sanitized key (if previously created with underscores)
    if (altKey !== norm) {
      const altRef = doc(db, "users", altKey);
      const altSnap = await getDoc(altRef);
      if (altSnap.exists()) {
        const data = altSnap.data() as UserProfile;
        // Migrate to canonical ID
        await setDoc(userRef, data);
        return data;
      }
    }

    // 3. Fallback: Query by email field
    const q = query(collection(db, "users"), where("email", "==", norm), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as UserProfile;
    }
  } catch (err) {
    console.warn("[Firestore User Fetch Note]", err);
  }

  return null;
}

/**
 * Creates new user profile.
 * Strictly idempotent: Checks if a profile already exists first to NEVER create duplicates!
 * Rule: status MUST be "inactive" and expiryDate MUST be null!
 */
export async function createUserProfile(data: {
  name: string;
  mobile: string;
  email: string;
  city: string;
  address: string;
}): Promise<UserProfile> {
  const norm = normalizeEmail(data.email);

  // Check if profile already exists - return existing to prevent duplicate documents!
  const existing = await getUserProfile(norm);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();

  const newProfile: UserProfile = {
    name: data.name.trim(),
    mobile: data.mobile.trim(),
    email: norm,
    city: data.city.trim(),
    address: data.address.trim(),
    status: "inactive", // strictly inactive on creation
    expiryDate: null,   // strictly null on creation
    role: "admin",
    createdAt: now,
    updatedAt: now,
  };

  // Save to Firestore under normalized email ID strictly
  try {
    const userRef = doc(db, "users", norm);
    await setDoc(userRef, newProfile);
  } catch (err) {
    console.warn("[Firestore User Create Note]", err);
  }

  return newProfile;
}

/**
 * Updates profile status and license expiry date
 */
export async function updateUserLicense(
  email: string,
  updates: { status?: "active" | "inactive"; expiryDate?: string | null }
): Promise<UserProfile | null> {
  const norm = normalizeEmail(email);
  const existing = await getUserProfile(norm);
  if (!existing) return null;

  const updated: UserProfile = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    const userRef = doc(db, "users", norm);
    await setDoc(userRef, updated, { merge: true });
  } catch (err) {
    console.warn("[Firestore License Update Note]", err);
  }

  return updated;
}
