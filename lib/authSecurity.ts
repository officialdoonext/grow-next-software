import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "grownext_secure_otp_encryption_secret_key_974e9b253c563e19160fed";

/**
 * Generates a cryptographically secure 6-digit OTP
 */
export function generateSecureOtp(): string {
  // Use crypto.randomInt for uniform distribution
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP with SHA-256 and secret salt
 * Raw OTPs should never be stored in plain text
 */
export function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${email.toLowerCase().trim()}:${otp}`)
    .digest("hex");
}

/**
 * Verifies an OTP against a stored hash
 */
export function verifyOtpHash(email: string, otp: string, expectedHash: string): boolean {
  const computedHash = hashOtp(email, otp);
  // Constant time comparison to prevent timing attacks
  const buf1 = Buffer.from(computedHash, "hex");
  const buf2 = Buffer.from(expectedHash, "hex");
  if (buf1.length !== buf2.length) return false;
  return crypto.timingSafeEqual(buf1, buf2);
}

/**
 * Creates an encrypted/signed session token
 */
export function createSessionToken(payload: {
  email: string;
  role: string;
  status: string;
  expiryDate: string | null;
}): string {
  const data = JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days (stay logged in until logout)
  });

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(SECRET).digest(),
    iv
  );

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(`${iv.toString("hex")}:${encrypted}`)
    .digest("hex");

  return `${iv.toString("hex")}.${encrypted}.${hmac}`;
}

/**
 * Verifies and decodes a session token
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  payload?: {
    email: string;
    role: string;
    status: string;
    expiryDate: string | null;
    iat: number;
    exp: number;
  };
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };

    const [ivHex, encryptedHex, hmacHex] = parts;

    // Verify HMAC
    const expectedHmac = crypto
      .createHmac("sha256", SECRET)
      .update(`${ivHex}:${encryptedHex}`)
      .digest("hex");

    const bufExpected = Buffer.from(expectedHmac, "hex");
    const bufActual = Buffer.from(hmacHex, "hex");

    if (
      bufExpected.length !== bufActual.length ||
      !crypto.timingSafeEqual(bufExpected, bufActual)
    ) {
      return { valid: false };
    }

    // Decrypt
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      crypto.createHash("sha256").update(SECRET).digest(),
      iv
    );

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const payload = JSON.parse(decrypted);

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
