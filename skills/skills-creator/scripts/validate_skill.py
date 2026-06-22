#!/usr/bin/env python3
"""
Validate pi-osiris skills against the standard defined in skills-creator.

Usage:
    python scripts/validate_skill.py                    # validate all skills
    python scripts/validate_skill.py path/to/skill      # validate one skill directory
    python scripts/validate_skill.py -v                 # verbose with all checks per skill
    python scripts/validate_skill.py -v --summary-only  # compact summary only

Checks:
  - Frontmatter exists with name and description
  - description uses > block scalar
  - description starts with "You must use this skill when"
  - description is ~40-90 tokens
  - name matches directory name
  - No tables (| lines) in body
  - No **bold** in body (outside code fences)
  - SKILL.md <= 500 lines
  - Gotchas section exists with >= 1 bullet
  - No inline code in description (backticks cause triggering issues)

Returns exit code 0 if all pass, 1 if any fail.
"""

import os
import sys
import re
import argparse
from pathlib import Path


def estimate_tokens(text: str) -> int:
    """Estimate token count by whitespace splitting."""
    return len(text.split())


def parse_frontmatter(content: str):
    """
    Parse YAML frontmatter from markdown content.
    Returns dict with parsed fields. Handles > folded block scalars.
    """
    lines = content.split('\n')

    if not lines or lines[0].strip() != '---':
        return None

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            end_idx = i
            break

    if end_idx is None:
        return None

    fm_lines = lines[1:end_idx]

    result = {}
    current_key = None
    in_block_scalar = False
    block_lines = []
    block_indent = 0

    for line in fm_lines:
        key_match = re.match(r'^(\w[\w-]*):\s*(.*)', line)
        if key_match and not (in_block_scalar and line[:block_indent + 1].strip() == ''):
            if current_key and in_block_scalar and block_lines:
                result[current_key] = '\n\n'.join(
                    ' '.join(para.split()) for para in
                    '\n'.join(block_lines).split('\n\n')
                ).strip()
                in_block_scalar = False
                block_lines = []

            key = key_match.group(1)
            value = key_match.group(2)

            if value.strip() == '>':
                current_key = key
                in_block_scalar = True
                block_lines = []
                block_indent = None
            elif value.strip() == '':
                current_key = key
                in_block_scalar = True
                block_lines = []
                block_indent = None
            else:
                result[key] = value.strip()
                current_key = None
                in_block_scalar = False
            continue

        if in_block_scalar:
            if block_indent is None and line.strip():
                block_indent = len(line) - len(line.lstrip())

            stripped = line.rstrip()
            if stripped == '' or (block_indent is not None and
                                  (len(line) - len(line.lstrip()) >= block_indent or stripped == '')):
                block_lines.append(stripped)
                continue
            else:
                if block_lines:
                    result[current_key] = '\n\n'.join(
                        ' '.join(para.split()) for para in
                        '\n'.join(block_lines).split('\n\n')
                    ).strip()
                in_block_scalar = False
                block_lines = []
                block_indent = None
                current_key = None
                continue

    if current_key and in_block_scalar and block_lines:
        result[current_key] = '\n\n'.join(
            ' '.join(para.split()) for para in
            '\n'.join(block_lines).split('\n\n')
        ).strip()

    return result


def get_body(content: str):
    """Extract body content after frontmatter."""
    lines = content.split('\n')
    if not lines or lines[0].strip() != '---':
        return content

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            end_idx = i
            break

    if end_idx is None:
        return content

    return '\n'.join(lines[end_idx + 1:])


def is_inside_code_fence(lines: list, idx: int) -> bool:
    """Check if line at idx is inside a code fence."""
    fence_count = 0
    for i in range(idx):
        if lines[i].strip().startswith('```'):
            fence_count += 1
    return fence_count % 2 == 1


def find_section_containing(lines: list, section_title: str) -> int:
    """Find a section heading containing section_title. Returns index or -1."""
    for i, line in enumerate(lines):
        if re.match(r'^#+\s+' + re.escape(section_title), line, re.IGNORECASE):
            return i
    return -1


def count_bullets_after(lines: list, section_idx: int) -> int:
    """Count bullet items after a section heading until next section."""
    count = 0
    for i in range(section_idx + 1, len(lines)):
        line = lines[i].strip()
        if re.match(r'^#', line):
            break
        if line.startswith('- ') or line.startswith('* '):
            count += 1
    return count


def get_sections(lines: list) -> list:
    """Extract all markdown headings with level and text."""
    sections = []
    for i, line in enumerate(lines):
        m = re.match(r'^(#+)\s+(.+)$', line)
        if m:
            level = len(m.group(1))
            text = m.group(2).strip()
            sections.append({"level": level, "text": text, "line": i + 1})
    return sections


def count_words_in_body(body: str) -> int:
    """Count words in markdown body, excluding code fences."""
    lines = body.split('\n')
    in_fence = False
    words = 0
    for line in lines:
        if line.strip().startswith('```'):
            in_fence = not in_fence
            continue
        if not in_fence and line.strip():
            words += len(line.split())
    return words


def count_code_blocks(body: str) -> int:
    """Count number of code fences in body."""
    return body.count('```') // 2


def count_bullet_items(body: str) -> int:
    """Count bullet list items (lines starting with - or *)."""
    count = 0
    for line in body.split('\n'):
        stripped = line.strip()
        if stripped.startswith('- ') or stripped.startswith('* '):
            count += 1
    return count


def validate_skill(skill_dir: str, verbose: bool = False) -> bool:
    """Validate a single skill directory. Returns True if valid."""
    skill_path = Path(skill_dir)
    skill_md = skill_path / 'SKILL.md'
    dir_name = skill_path.name
    checks = []

    if not skill_md.exists():
        print(f"FAIL  {dir_name}")
        print(f"      SKILL.md not found at {skill_md}")
        return False

    content = skill_md.read_text(encoding='utf-8')
    lines = content.split('\n')
    body = get_body(content)
    body_lines = body.split('\n')

    all_pass = True

    # --- Frontmatter checks ---
    fm = parse_frontmatter(content)

    if fm is None:
        checks.append((False, "Frontmatter", "No YAML frontmatter found"))
        all_pass = False
        fm = {}
    else:
        checks.append((True, "Frontmatter", "YAML frontmatter present"))

        name_fm = fm.get('name', '')
        if not name_fm:
            checks.append((False, "FM: name", "Missing 'name' field"))
            all_pass = False
        elif name_fm != dir_name:
            checks.append((False, "FM: name", f"'{name_fm}' != directory '{dir_name}'"))
            all_pass = False
        else:
            checks.append((True, "FM: name", f"'{name_fm}' matches directory"))

        desc = fm.get('description', '')
        if not desc:
            checks.append((False, "FM: description", "Missing 'description' field"))
            all_pass = False
        else:
            fm_raw_start = content.find('---') + 3
            fm_raw_end = content.find('---', fm_raw_start)
            fm_raw = content[fm_raw_start:fm_raw_end]

            desc_line_match = re.search(r'^description:\s*(.+)$', fm_raw, re.MULTILINE)
            if desc_line_match:
                desc_value = desc_line_match.group(1).strip()
                if desc_value != '>':
                    checks.append((False, "FM: desc scalar", f"'{desc_value}' — should use '>' block scalar"))
                    all_pass = False
                else:
                    checks.append((True, "FM: desc scalar", "uses '>' block scalar"))

            if desc.startswith("You must use this skill when"):
                checks.append((True, "FM: desc prefix", "starts with 'You must use this skill when'"))
            else:
                triggers = desc[:70]
                checks.append((False, "FM: desc prefix", f"'{triggers}...' — should start with 'You must use this skill when'"))
                all_pass = False

            tokens = estimate_tokens(desc)
            if 25 <= tokens <= 95:
                checks.append((True, "FM: desc tokens", f"{tokens} tokens (range 25-95)"))
            else:
                checks.append((False, "FM: desc tokens", f"{tokens} tokens (expected 25-95)"))
                all_pass = False

            if '`' in desc:
                checks.append((False, "FM: desc backticks", "contains backtick — avoid inline code in triggering instructions"))
                all_pass = False
            else:
                checks.append((True, "FM: desc backticks", "no backticks"))

    # --- Body checks ---
    # Tables
    table_pattern = re.compile(r'^\|.+\|$')
    found_table = False
    for i, line in enumerate(body_lines):
        stripped = line.strip()
        if table_pattern.match(stripped) and not is_inside_code_fence(body_lines, i):
            if '---' in stripped or stripped.count('|') >= 3:
                checks.append((False, "Body: tables", f"table near line {i + 1} '{stripped[:50]}' — use bullet lists"))
                all_pass = False
                found_table = True
                break
    if not found_table:
        checks.append((True, "Body: tables", "no markdown tables"))

    # Bold outside code fences
    bold_pattern = re.compile(r'\*\*[^*]+\*\*')
    found_bold = False
    for i, line in enumerate(body_lines):
        if bold_pattern.search(line) and not is_inside_code_fence(body_lines, i):
            checks.append((False, "Body: bold (**)", f"near line {i + 1}: '{line.strip()[:60]}' — use headers instead"))
            all_pass = False
            found_bold = True
            break
    if not found_bold:
        checks.append((True, "Body: bold (**)", "no bold outside code fences"))

    # Line count
    line_count = len(lines)
    if line_count <= 500:
        checks.append((True, "Body: line count", f"{line_count} lines (max 500)"))
    else:
        checks.append((False, "Body: line count", f"{line_count} lines (max 500)"))
        all_pass = False

    # Gotchas section
    gotcha_idx = find_section_containing(lines, 'Gotchas')
    if gotcha_idx == -1:
        checks.append((False, "Body: Gotchas", "section not found — required for capturing agent failure points"))
        all_pass = False
    else:
        bullet_count = count_bullets_after(lines, gotcha_idx)
        if bullet_count >= 1:
            checks.append((True, "Body: Gotchas", f"present with {bullet_count} bullet(s)"))
        else:
            checks.append((False, "Body: Gotchas", "section has no bullet items (need >= 1)"))
            all_pass = False

    # --- Structural analysis (informational, not pass/fail) ---
    sections = get_sections(lines)
    heading_count = len(sections)
    depth_counts = {}
    for s in sections:
        lvl = s['level']
        depth_counts[lvl] = depth_counts.get(lvl, 0) + 1
    section_summary = ', '.join(f"h{lvl}={n}" for lvl, n in sorted(depth_counts.items()))

    word_count = count_words_in_body(body)
    code_blocks = count_code_blocks(body)
    bullet_items = count_bullet_items(body)
    fm_fields = ', '.join(sorted(fm.keys())) if fm else '(none)'

    # --- Report ---
    prefix = "PASS" if all_pass else "FAIL"
    out_lines = []
    out_lines.append(f"{prefix}  {dir_name}")
    if verbose:
        h = heading_count
        out_lines.append(f"  Structure: {h} headings ({section_summary}) | {line_count} lines | {word_count} body words | {code_blocks} code blocks | {bullet_items} bullet items")
        out_lines.append(f"  FM fields: {fm_fields}")
        if fm and fm.get('description'):
            d = fm['description']
            t = estimate_tokens(d)
            truncated = d[:120]
            if len(d) > 120:
                truncated += '...'
            out_lines.append(f"  Description: {truncated} [{t} tokens]")
        for status, label, detail in checks:
            mark = "PASS" if status else "FAIL"
            out_lines.append(f"  [{mark}] {label}")
            if detail:
                out_lines.append(f"        {detail}")
    print('\n'.join(out_lines))
    return all_pass


def find_skills_dirs(base_dir: str) -> list:
    """Find all skill directories (containing SKILL.md) under base_dir."""
    base = Path(base_dir)
    if not base.is_dir():
        return []

    skills = []
    for entry in base.iterdir():
        if entry.is_dir() and (entry / 'SKILL.md').exists():
            skills.append(str(entry))
    return sorted(skills)


def main():
    parser = argparse.ArgumentParser(
        description="Validate pi-osiris skills against the skills-creator standard"
    )
    parser.add_argument(
        'target', nargs='?',
        help="Skill directory to validate, or base directory containing skill dirs"
    )
    parser.add_argument(
        '-v', '--verbose', action='store_true',
        help="Show detailed output including all checks per skill"
    )
    parser.add_argument(
        '--summary-only', action='store_true',
        help="Only print pass/fail summary, no individual errors"
    )

    args = parser.parse_args()

    target = args.target
    if not target:
        script_dir = Path(__file__).resolve().parent
        parent = script_dir.parent
        grandparent = parent.parent

        if grandparent.name == 'skills' and grandparent.is_dir():
            target = str(grandparent)
        else:
            target = str(parent)

    target_path = Path(target)

    if target_path.is_dir() and (target_path / 'SKILL.md').exists():
        skills = [str(target_path)]
    elif target_path.is_dir():
        skills = find_skills_dirs(target)
    else:
        print(f"Error: {target} not found")
        sys.exit(1)

    if not skills:
        print(f"No skills found at {target}")
        sys.exit(1)

    if args.verbose:
        print(f"Validating {len(skills)} skill(s) in {target_path}")
        print()

    results = []
    for skill_dir in skills:
        result = validate_skill(skill_dir, verbose=args.verbose)
        results.append(result)

    passed = sum(results)
    failed = len(results) - passed
    print()
    print(f"Summary: {passed} passed, {failed} failed out of {len(results)}")

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
