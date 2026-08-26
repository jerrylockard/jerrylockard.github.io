#!/usr/bin/env node
// `pnpm mcp:seed` — fills the local stores with sample data so the Dashboard has something to show.
// Works against the files directly, so the Dashboard server does not need to be running; if it is,
// its file watchers pick the change up and push it to any open tab over SSE.
import { loadSampleData, clearSampleData } from "./sample-data.js";

const mode = process.argv[2] ?? "load";

if (mode === "clear") {
  clearSampleData();
  console.log("Cleared the task board, work log, and team updates.");
} else if (mode === "reset") {
  clearSampleData();
  const result = loadSampleData();
  console.log(`Reset: ${result.tasks} tasks, ${result.worklog} work-log entries, ${result.teamUpdates} team updates.`);
} else if (mode === "load") {
  const result = loadSampleData();
  console.log(`Added ${result.tasks} tasks, ${result.worklog} work-log entries, ${result.teamUpdates} team updates.`);
} else {
  console.error("Usage: pnpm mcp:seed [load|clear|reset]");
  process.exit(1);
}
