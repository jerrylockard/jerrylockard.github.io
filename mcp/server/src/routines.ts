import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "routines.json");

/**
 * Pre-made tasks for things that should be checked regularly but are easy to
 * forget. One click on a pill in the Tasks view creates the real task, with the
 * next occurrence already worked out as the due date.
 *
 * Every civic date here is computed from a cadence recorded in
 * .remember/SCHEDULE.md, and the Academy dates come from Jerry's own paperwork
 * in ACADEMY_SCHEDULE.md. Nothing invents a meeting date — this feeds a series
 * about a real government body, and a wrong date is a correction he has to
 * publish under his own name.
 */

export type Cadence =
  | { type: "none" }
  | { type: "weekly"; weekday: number; seasonEnd?: string }
  | { type: "monthly-nth-weekday"; nth: number; weekday: number }
  | { type: "fixed-dates"; dates: string[] }
  | { type: "interval"; days: number };

export interface RoutineGroup {
  id: string;
  label: string;
  blurb: string;
}

export interface Routine {
  id: string;
  group: string;
  pill: string;
  title: string;
  detail: string;
  category: string;
  assignee: string | null;
  cadence: Cadence;
}

export interface RoutineWithDate extends Routine {
  /** YYYY-MM-DD, or null when the routine has no natural date. */
  nextDate: string | null;
  /** Human phrase for the pill's tooltip, e.g. "Tue 1 Sep". */
  nextLabel: string | null;
  /** Set when a seasonal routine is out of season. */
  dormant?: string;
}

interface RoutineFile {
  groups: RoutineGroup[];
  routines: Routine[];
}

function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Next occurrence at or after `from`.
 *
 * "At or after", not "strictly after": if today is the meeting, the task is for
 * today. Rolling to next week would be actively unhelpful on the one morning it
 * matters most.
 */
function nextOccurrence(cadence: Cadence, from: Date): { date: string | null; dormant?: string } {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  switch (cadence.type) {
    case "none":
      return { date: null };

    case "interval": {
      const next = new Date(today);
      next.setDate(today.getDate() + cadence.days);
      return { date: iso(next) };
    }

    case "weekly": {
      const next = new Date(today);
      const delta = (cadence.weekday - today.getDay() + 7) % 7;
      next.setDate(today.getDate() + delta);
      if (cadence.seasonEnd && iso(next) > cadence.seasonEnd) {
        return { date: null, dormant: `Out of season — runs again after ${cadence.seasonEnd}.` };
      }
      return { date: iso(next) };
    }

    case "monthly-nth-weekday": {
      // Try this month, then next: the nth weekday of the current month may
      // already have passed.
      for (const monthOffset of [0, 1]) {
        const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const shift = (cadence.weekday - first.getDay() + 7) % 7;
        const day = 1 + shift + (cadence.nth - 1) * 7;
        const candidate = new Date(first.getFullYear(), first.getMonth(), day);
        if (candidate.getMonth() === first.getMonth() && candidate >= today) return { date: iso(candidate) };
      }
      return { date: null };
    }

    case "fixed-dates": {
      const upcoming = [...cadence.dates].sort().find((d) => d >= iso(today));
      return upcoming
        ? { date: upcoming }
        : { date: null, dormant: "No dates left on the published schedule." };
    }

    default:
      return { date: null };
  }
}

function readFile(): RoutineFile {
  if (!existsSync(dataPath)) return { groups: [], routines: [] };
  try {
    const parsed = JSON.parse(readFileSync(dataPath, "utf-8"));
    return {
      groups: Array.isArray(parsed?.groups) ? parsed.groups : [],
      routines: Array.isArray(parsed?.routines) ? parsed.routines : [],
    };
  } catch {
    // A hand-edited file with a trailing comma should not take the dashboard
    // down — the pills just disappear until it parses again.
    return { groups: [], routines: [] };
  }
}

export function listRoutines(now = new Date()): { groups: RoutineGroup[]; routines: RoutineWithDate[] } {
  const { groups, routines } = readFile();
  return {
    groups,
    routines: routines.map((routine) => {
      const { date, dormant } = nextOccurrence(routine.cadence, now);
      return {
        ...routine,
        nextDate: date,
        nextLabel: date
          ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          : null,
        dormant,
      };
    }),
  };
}

export function getRoutine(id: string, now = new Date()): RoutineWithDate | undefined {
  return listRoutines(now).routines.find((r) => r.id === id);
}
