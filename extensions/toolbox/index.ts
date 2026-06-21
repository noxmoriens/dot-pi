import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createReadTool } from "./src/read.ts";
import { createEditTool } from "./src/edit.ts";
import { clearCache } from "./src/cache.ts";

export default function (pi: ExtensionAPI) {
	const cwd = process.cwd();

	pi.on("turn_start", () => {
		clearCache();
	});

	pi.on("turn_end", () => {
		clearCache();
	});

	pi.registerTool(createReadTool(cwd));
	pi.registerTool(createEditTool(cwd));
}
