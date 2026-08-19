import type { CollectionEntry } from "astro:content";

export const STATUS_LABELS: Record<CollectionEntry<"civicNotes">["data"]["status"], string> = {
  proposed: "Proposed",
  "advanced-from-caucus": "Advanced from caucus",
  approved: "Approved",
  deferred: "Deferred",
  rejected: "Rejected",
  implemented: "Implemented",
};

export function formatMeetingDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
