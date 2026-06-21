const LEAF_THRESHOLD = 128;

interface Node {
	left: Node | null;
	right: Node | null;
	value: string | null;
	length: number;
}

function isLeaf(n: Node): n is Node & { value: string } {
	return n.value !== null;
}

function leaf(value: string): Node {
	return { left: null, right: null, value, length: value.length };
}

function concat(a: Node | null, b: Node | null): Node | null {
	if (!a) return b;
	if (!b) return a;
	return { left: a, right: b, value: null, length: a.length + b.length };
}

function buildTree(text: string, start: number, end: number): Node {
	const len = end - start;
	if (len <= LEAF_THRESHOLD) {
		return leaf(text.slice(start, end));
	}
	const mid = start + Math.floor(len / 2);
	return concat(buildTree(text, start, mid), buildTree(text, mid, end))!;
}

function collect(node: Node | null, parts: string[]): void {
	if (!node) return;
	if (isLeaf(node)) {
		parts.push(node.value);
	} else {
		collect(node.left, parts);
		collect(node.right, parts);
	}
}

function getCharAt(node: Node, index: number): string {
	if (isLeaf(node)) {
		return node.value[index]!;
	}
	const leftLen = node.left?.length ?? 0;
	if (index < leftLen) {
		return getCharAt(node.left!, index);
	}
	return getCharAt(node.right!, index - leftLen);
}

function split(node: Node | null, index: number): [Node | null, Node | null] {
	if (!node) return [null, null];
	if (index >= node.length) return [node, null];
	if (index <= 0) return [null, node];

	if (isLeaf(node)) {
		return [
			index > 0 ? leaf(node.value.slice(0, index)) : null,
			index < node.length ? leaf(node.value.slice(index)) : null,
		];
	}

	const leftLen = node.left?.length ?? 0;

	if (index < leftLen) {
		const [l, r] = split(node.left, index);
		return [l, concat(r, node.right)];
	}

	if (index > leftLen) {
		const [l, r] = split(node.right, index - leftLen);
		return [concat(node.left, l), r];
	}

	// index === leftLen: exact boundary between left and right children
	return [node.left, node.right];
}

export class Rope {
	private readonly root: Node | null;

	private constructor(root: Node | null) {
		this.root = root;
	}

	static empty(): Rope {
		return new Rope(null);
	}

	static from(text: string): Rope {
		if (text.length === 0) return Rope.empty();
		return new Rope(buildTree(text, 0, text.length));
	}

	get length(): number {
		return this.root?.length ?? 0;
	}

	toString(): string {
		const parts: string[] = [];
		collect(this.root, parts);
		return parts.join("");
	}

	charAt(index: number): string | undefined {
		if (!this.root || index < 0 || index >= this.root.length) return undefined;
		return getCharAt(this.root, index);
	}

	insert(index: number, text: string): Rope {
		if (text.length === 0) return this;
		const clamped = Math.max(0, Math.min(index, this.length));
		const [left, right] = split(this.root, clamped);
		const mid = buildTree(text, 0, text.length);
		return new Rope(concat(concat(left, mid), right));
	}

	delete(start: number, length: number): Rope {
		if (length <= 0 || this.length === 0) return this;
		const s = Math.max(0, Math.min(start, this.length));
		const l = Math.max(0, Math.min(length, this.length - s));
		if (l === 0) return this;
		const [left, rest] = split(this.root, s);
		const [, right] = split(rest, l);
		return new Rope(concat(left, right));
	}

	replace(start: number, end: number, text: string): Rope {
		const s = Math.max(0, Math.min(start, this.length));
		const e = Math.max(s, Math.min(end, this.length));
		const len = e - s;

		const [left, rest] = split(this.root, s);
		const [, right] = split(rest, len);

		if (text.length === 0) {
			return new Rope(concat(left, right));
		}

		const mid = buildTree(text, 0, text.length);
		return new Rope(concat(concat(left, mid), right));
	}

	rebalance(): Rope {
		return Rope.from(this.toString());
	}
}
