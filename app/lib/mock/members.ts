import type { Member } from "./types";

/**
 * Mock members. CURRENT_USER_ID stands in for the signed-in person until auth
 * is wired — the UI shows "You" for them and their real name elsewhere.
 */
export const CURRENT_USER_ID = "u-you";

export const MEMBERS: Record<string, Member> = {
  "u-you": { id: "u-you", name: "Mary Njeri", initials: "MN", color: "#e8a34a" },
  "u-amina": { id: "u-amina", name: "Amina Wanjiru", initials: "AW", color: "#e8784a" },
  "u-joseph": { id: "u-joseph", name: "Joseph Mwangi", initials: "JM", color: "#4abfb0" },
};

export const getMember = (id: string): Member =>
  MEMBERS[id] ?? { id, name: "Member", initials: "?", color: "#b3a06f" };
