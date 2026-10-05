import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
} from "firebase/firestore";

export type SequenceType = "quotation" | "invoice";

/**
 * Extracts year and 2-digit month from a date string or current date.
 * Example: "2026-10-05" -> { year: "2026", month: "10", yearMonth: "202610" }
 */
export function getYearMonth(dateStr?: string): { year: string; month: string; yearMonth: string } {
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const year = String(validDate.getFullYear());
  const month = String(validDate.getMonth() + 1).padStart(2, "0");
  const yearMonth = `${year}${month}`;

  return { year, month, yearMonth };
}

/**
 * Peeks or generates the next sequential ID without reserving it in the database.
 * Format:
 *  - Quotation: QT-YYYYMMNN (e.g. QT-20261001)
 *  - Invoice:   INV-YYYYMMNN (e.g. INV-20261001)
 *
 * Sequence resets to 01 whenever month or year changes.
 */
export async function peekNextDocumentNumber(
  type: SequenceType,
  userEmail: string,
  dateStr?: string
): Promise<string> {
  const prefix = type === "quotation" ? "QT" : "INV";
  const collectionName = type === "quotation" ? "quotations" : "invoices";
  const numberField = type === "quotation" ? "quotationNumber" : "invoiceNumber";
  const { yearMonth } = getYearMonth(dateStr);
  const patternPrefix = `${prefix}-${yearMonth}`;

  const normEmail = userEmail.toLowerCase().trim();

  // Query existing records for this user in this collection
  const q = query(
    collection(db, collectionName),
    where("userId", "==", normEmail)
  );

  const snapshot = await getDocs(q);
  const existingNums: number[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const val = String(data[numberField] || "");
    if (val.startsWith(patternPrefix)) {
      const suffix = val.slice(patternPrefix.length);
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > 0) {
        existingNums.push(parsed);
      }
    }
  });

  const maxSeq = existingNums.length > 0 ? Math.max(...existingNums) : 0;
  const nextSeq = maxSeq + 1;
  const formattedSuffix = String(nextSeq).padStart(2, "0");

  return `${prefix}-${yearMonth}${formattedSuffix}`;
}

/**
 * Commits and returns a guaranteed unique sequential number using a Firestore atomic transaction.
 * Resets to 01 each month.
 */
export async function commitNextDocumentNumber(
  type: SequenceType,
  userEmail: string,
  dateStr?: string
): Promise<string> {
  const prefix = type === "quotation" ? "QT" : "INV";
  const collectionName = type === "quotation" ? "quotations" : "invoices";
  const numberField = type === "quotation" ? "quotationNumber" : "invoiceNumber";
  const { yearMonth } = getYearMonth(dateStr);
  const patternPrefix = `${prefix}-${yearMonth}`;
  const normEmail = userEmail.toLowerCase().trim();

  const counterDocRef = doc(db, "sequences", `${normEmail}_${collectionName}_${yearMonth}`);

  // Query highest existing sequence in the collection first to handle any un-tracked items
  const q = query(
    collection(db, collectionName),
    where("userId", "==", normEmail)
  );
  const snapshot = await getDocs(q);
  let highestExisting = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const val = String(data[numberField] || "");
    if (val.startsWith(patternPrefix)) {
      const suffix = val.slice(patternPrefix.length);
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > highestExisting) {
        highestExisting = parsed;
      }
    }
  });

  // Run atomic transaction on the sequence counter doc
  const assignedNumber = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterDocRef);
    let currentCounter = 0;

    if (counterSnap.exists()) {
      currentCounter = Number(counterSnap.data()?.currentSequence) || 0;
    }

    // Next sequence must be strictly greater than both the counter doc and highest existing record
    const nextSeq = Math.max(currentCounter, highestExisting) + 1;

    transaction.set(
      counterDocRef,
      {
        userId: normEmail,
        type,
        yearMonth,
        currentSequence: nextSeq,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const formattedSuffix = String(nextSeq).padStart(2, "0");
    return `${prefix}-${yearMonth}${formattedSuffix}`;
  });

  return assignedNumber;
}
