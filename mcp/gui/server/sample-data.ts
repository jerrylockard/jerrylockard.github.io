import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createTask, updateTaskStatus, addTaskNote, proposeTaskCategory } from "../../server/src/tasks.js";
import { createWorkLogEntry, signOffWorkLogEntry } from "../../server/src/worklog.js";
import { postTeamUpdate } from "../../server/src/memory.js";
import { SAMPLE_TASKS, SAMPLE_WORKLOG, SAMPLE_TEAM_UPDATES } from "./sample-content.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const rememberDir = join(repoRoot, ".remember");

export interface SampleDataResult {
  tasks: number;
  worklog: number;
  teamUpdates: number;
}

/**
 * Populates the file-backed stores through the same functions the MCP tools and REST routes use,
 * so seeded rows are indistinguishable from real ones (ids, timestamps, activity log entries all
 * generated normally) rather than hand-written JSON that could drift from the real schema.
 */
export function loadSampleData(): SampleDataResult {
  const categories = new Set(SAMPLE_TASKS.map((task) => task.category));
  for (const category of categories) proposeTaskCategory(category);

  let taskCount = 0;
  const createdIds = new Map<string, string>();
  for (const sample of SAMPLE_TASKS) {
    const task = createTask({
      title: sample.title,
      detail: sample.detail,
      category: sample.category,
      priority: sample.priority,
      assignee: sample.assignee || null,
      createdBy: sample.assignee || "jerry",
      dueDate: sample.dueDate || undefined,
    });
    createdIds.set(sample.title, task.id);
    taskCount += 1;

    // Walk the real status transitions so Done timestamps (which drive the activity feed) are set
    // the same way a genuine hand-off would set them.
    const actor = sample.assignee || "jerry";
    if (sample.status === "in-progress" || sample.status === "done") {
      updateTaskStatus(task.id, "in-progress", actor, undefined, "backlog");
    }
    if (sample.status === "done") {
      updateTaskStatus(task.id, "done", actor, undefined, "in-progress");
    }
    if (sample.note) addTaskNote(task.id, actor, sample.note);
  }

  let worklogCount = 0;
  for (const sample of SAMPLE_WORKLOG) {
    const entry = createWorkLogEntry({
      by: sample.by,
      kind: sample.kind,
      summary: sample.summary,
      rationale: sample.rationale,
      tag: sample.tag,
      taskId: sample.taskTitle ? createdIds.get(sample.taskTitle) : undefined,
    });
    if (sample.signedOffBy) signOffWorkLogEntry(entry.id, sample.signedOffBy);
    worklogCount += 1;
  }

  let updateCount = 0;
  for (const sample of SAMPLE_TEAM_UPDATES) {
    postTeamUpdate(sample.agent, sample.message, sample.affects);
    updateCount += 1;
  }

  return { tasks: taskCount, worklog: worklogCount, teamUpdates: updateCount };
}

/**
 * Removes the task board, work log, and team-update stores entirely. This clears ALL data in them,
 * not only rows that came from loadSampleData — there's no marker distinguishing seeded rows from
 * real ones, and inventing one would leak demo concerns into the real schema. Callers must confirm.
 */
export function clearSampleData(): void {
  for (const file of ["tasks.json", "worklog.json", "team.jsonl"]) {
    const path = join(rememberDir, file);
    if (existsSync(path)) rmSync(path);
  }
}
