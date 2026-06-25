import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createReadTool } from "./src/read.ts";
import { createEditTool } from "./src/edit.ts";
import { clearCache } from "./src/cache.ts";

/**
 * Pi extension entry point. Wires the toolbox's read/edit tools into the
 * host agent and manages the shared file-content cache across assistant
 * turns.
 *
 * Currently DISABLED: every block below is commented out so the extension
 * loads as a no-op. Re-enable by removing the leading "// " on each call.
 */
export default function (pi: ExtensionAPI) {
  // Capture the host process working directory so each registered tool
  // resolves file paths relative to the project the user launched from,
  // not whatever cwd the extension bundle itself was loaded into.
  // DISABLED:
  // const cwd = process.cwd();

  // Drop any cached file snapshots at the start of each assistant turn so
  // stale reads from the previous turn cannot leak into the new one —
  // turn boundaries are the natural invalidation point.
  // DISABLED:
  // pi.on("turn_start", () => {
  //   clearCache();
  // });

  // Mirror the start-of-turn cleanup at the end of the turn so the cache
  // does not retain file contents across idle periods where the on-disk
  // files may have been modified by something other than this extension.
  // DISABLED:
  // pi.on("turn_end", () => {
  //   clearCache();
  // });

  // Register the cached, hash-validated read tool with the host agent;
  // it lets the model read files without re-reading bytes when the file
  // has not changed since the last read in this session.
  // DISABLED:
  // pi.registerTool(createReadTool(cwd));

  // Register the edit tool bound to the same cwd; edits are validated
  // against the cached snapshot so the tool refuses to clobber changes
  // the model has not seen.
  // DISABLED:
  // pi.registerTool(createEditTool(cwd));
}