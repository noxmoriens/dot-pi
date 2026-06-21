import type { HashLineIndex } from "./hashline.ts";

export interface CacheEntry {
	content: string;
	index: HashLineIndex | null;
	mtime: number;
}

const cache = new Map<string, CacheEntry>();

export function getCache(path: string): CacheEntry | undefined {
	return cache.get(path);
}

export function setCache(path: string, entry: CacheEntry): void {
	cache.set(path, entry);
}

export function clearCache(): void {
	cache.clear();
}
