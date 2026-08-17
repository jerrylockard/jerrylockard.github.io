import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export const PREVIEW_URL = "http://localhost:4321/";

export async function checkPreviewStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(PREVIEW_URL, { signal: controller.signal });
    clearTimeout(timeout);
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function startPreviewServer(): Promise<{ ok: boolean; message: string }> {
  try {
    await execFileAsync("pnpm", ["exec", "astro", "dev", "--background"], { cwd: repoRoot, shell: true });
    return { ok: true, message: "started" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
