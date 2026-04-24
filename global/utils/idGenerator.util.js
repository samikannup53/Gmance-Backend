import { customAlphabet } from "nanoid";
import Counter from "../models/counter.model.js";

/* ---------------------------------- */
/* HELPERS */
/* ---------------------------------- */

// Random numeric generator (6 digits)
const generateNumeric = customAlphabet("0123456789", 6);

// Date + Time generator (YYYYMMDDHHMMSS)
const getDateTime = () => {
  const now = new Date();

  const date =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const time =
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  return { date, time };
};

/* ---------------------------------- */
/* PUBLIC ID */
/* ---------------------------------- */

export const generatePublicId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  28,
);

/* ---------------------------------- */
/* TRN (Timestamp + Random) */
/* ---------------------------------- */

export const generateTRN = () => {
  const { date, time } = getDateTime();

  return `TRN${date}${time}${generateNumeric()}`;
};

/* ---------------------------------- */
/* SEQUENCE */
/* ---------------------------------- */

const getNextSequence = async (key, start = 0) => {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    {
      returnDocument: "after",
      upsert: true,
      lean: true,
    },
  );

  // First-time initialization fix
  if (counter.seq === 1 && start > 1) {
    const updated = await Counter.findOneAndUpdate(
      { key },
      { $set: { seq: start } },
      { returnDocument: "after", lean: true },
    );

    return Number(updated.seq);
  }

  return Number(counter.seq);
};

/* ---------------------------------- */
/* ERN (Timestamp + Sequence) */
/* ---------------------------------- */

export const generateERN = async () => {
  const { date, time } = getDateTime();

  const seq = await getNextSequence("ERN_GLOBAL", 1);

  return `ERN${date}${time}${String(seq).padStart(6, "0")}`;
};

/* ---------------------------------- */
/* USER ID (Role-based Sequential) */
/* ---------------------------------- */

const USER_BASE = {
  ADMIN: 4627391,
  EMPLOYEE: 5627391,
  ASSOCIATE: 9627391,
};

export const generateUserId = async (role) => {
  const roleKey = role?.trim().toUpperCase();

  const base = USER_BASE[roleKey];

  if (!base) {
    throw new Error("Invalid user role");
  }

  const seq = await getNextSequence(`USER_${roleKey}`, base);

  /* 🔒 RANGE GUARDS */

  if (roleKey === "ADMIN" && seq >= 5627391) {
    throw new Error("ADMIN ID limit reached");
  }

  if (roleKey === "EMPLOYEE" && seq >= 9627391) {
    throw new Error("EMPLOYEE ID limit reached");
  }

  return `${seq}`;
};
