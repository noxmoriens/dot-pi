#!/usr/bin/env python3
"""
Validate pi-osiris skills against the standard defined in skills-creator.

Usage:
    python scripts/validate_skill.py                    # validate all skills
    python scripts/validate_skill.py path/to/skill      # validate one skill directory

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

    # Find frontmatter boundaries
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

    # Simple YAML parser for flat keys with > block scalars
    result = {}
    current_key = None
    in_block_scalar = False
    block_lines = []
    block_indent = 0

    for line in fm_lines:
        # Check if this is a new key-value pair
        key_match = re.match(r'^(\w[\w-]*):\s*(.*)', line)
        if key_match and not (in_block_scalar and line[:block_indent + 1].strip() == ''):
            # Save previous block scalar if any
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
                # Start of folded block scalar
                current_key = key
                in_block_scalar = True
                block_lines = []
                # Determine indent level from next line
                block_indent = None
            elif value.strip() == '':
                # Empty value, might be followed by block scalar
                current_key = key
                in_block_scalar = True
                block_lines = []
                block_indent = None
            else:
                # Inline value
                result[key] = value.strip()
                current_key = None
                in_block_scalar = False
            continue

        if in_block_scalar:
            # Determine indent from first content line
            if block_indent is None and line.strip():
                block_indent = len(line) - len(line.lstrip())

            # Check if this line is part of the block scalar
            stripped = line.rstrip()
            if stripped == '' or (block_indent is not None and
                                  (len(line) - len(line.lstrip()) >= block_indent or stripped == '')):
                block_lines.append(stripped)
                continue
            else:
                # End of block scalar
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

    # Save last block scalar
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


def validate_skill(skill_dir: str, verbose: bool = False) -> bool:
    """Validate a single skill directory. Returns True if valid."""
    skill_path = Path(skill_dir)
    skill_md = skill_path / 'SKILL.md'

    if not skill_md.exists():
        print(f"FAIL  {skill_dir}")
        print(f"      SKILL.md not found at {skill_md}")
        return False

    content = skill_md.read_text(encoding='utf-8')
    lines = content.split('\n')
    body = get_body(content)
    body_lines = body.split('\n')

    dir_name = skill_path.name
    all_pass = True
    errors = []

    # Parse frontmatter
    fm = parse_frontmatter(content)

    if fm is None:
        errors.append("No YAML frontmatter found (must start and end with '---')")
        all_pass = False
    else:
        # Check name exists
        name = fm.get('name')
        if not name:
            errors.append("Frontmatter missing 'name' field")
            all_pass = False
        elif name != dir_name:
            errors.append(f"Frontmatter name '{name}' does not match directory name '{dir_name}'")
            all_pass = False

        # Check description exists
        desc = fm.get('description')
        if not desc:
            errors.append("Frontmatter missing 'description' field")
            all_pass = False
        else:
            # Check description uses > block scalar
            # Find the raw frontmatter to check for >
            fm_raw_start = content.find('---') + 3
            fm_raw_end = content.find('---', fm_raw_start)
            fm_raw = content[fm_raw_start:fm_raw_end]

            # Find description line
            desc_line_match = re.search(r'^description:\s*(.+)$', fm_raw, re.MULTILINE)
            if desc_line_match:
                desc_value = desc_line_match.group(1).strip()
                if desc_value != '>':
                    errors.append(f"description must use '>' block scalar, got '{desc_value}'")
                    all_pass = False
            elif 'description:' not in fm_raw:
                errors.append("description field missing in frontmatter")
                all_pass = False

            # Check description starts with required prefix
            if not desc.startswith("You must use this skill when"):
                errors.append("description must start with 'You must use this skill when'")
                all_pass = False

            # Token count
            tokens = estimate_tokens(desc)
            if tokens < 25 or tokens > 95:
                errors.append(f"description token count is {tokens} (expected ~40-90)")
                all_pass = False
            elif verbose:
                print(f"      description tokens: {tokens}")

            # Check for backticks in description
            if '`' in desc:
                errors.append("description contains backticks (`) — avoid inline code in triggering descriptions")
                all_pass = False

    # Body checks
    # Check for tables (| separator lines)
    table_pattern = re.compile(r'^\|.+\|$')
    for i, line in enumerate(body_lines):
        stripped = line.strip()
        if table_pattern.match(stripped) and not is_inside_code_fence(body_lines, i):
            # Check if it's a real table (has --- separator or multiple |)
            if '---' in stripped or stripped.count('|') >= 3:
                errors.append(f"Table detected at line {i + 1 + (content[:i].count(chr(10)))}: '{stripped[:60]}' — use bullet lists instead")
                all_pass = False
                break

    # Check for **bold** outside code fences
    bold_pattern = re.compile(r'\*\*[^*]+\*\*')
    for i, line in enumerate(body_lines):
        if bold_pattern.search(line) and not is_inside_code_fence(body_lines, i):
            errors.append(f"Bold (**) detected at line ~{i + 1 + len(content.split(chr(10))) - len(body_lines)}: remove **, use headers instead")
            all_pass = False
            break

    # Check line count
    if len(lines) > 500:
        errors.append(f"SKILL.md has {len(lines)} lines (max 500)")
        all_pass = False

    # Check Gotchas section
    gotcha_idx = find_section_containing(lines, 'Gotchas')
    if gotcha_idx == -1:
        errors.append("No 'Gotchas' section found — required for capturing agent failure points")
        all_pass = False
    else:
        bullet_count = count_bullets_after(lines, gotcha_idx)
        if bullet_count < 1:
            errors.append("Gotchas section must have at least 1 bullet item")
            all_pass = False

    # Report
    if all_pass:
        print(f"PASS  {dir_name}")
        if verbose:
            for e in errors:
                print(f"      {e}")
        return True
    else:
        print(f"FAIL  {dir_name}")
        for e in errors:
            print(f"      {e}")
        return False


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
        help="Show detailed output including token counts"
    )
    parser.add_argument(
        '--summary-only', action='store_true',
        help="Only print pass/fail summary, no individual errors"
    )

    args = parser.parse_args()

    # Determine target
    target = args.target
    if not target:
        # Default: script's grandparent (skills/) or parent (skills-creator/)
        script_dir = Path(__file__).resolve().parent
        parent = script_dir.parent  # skills-creator/
        grandparent = parent.parent  # skills/

        # Check if we're in skills-creator, look at skills/
        if grandparent.name == 'skills' and grandparent.is_dir():
            target = str(grandparent)
        else:
            target = str(parent)

    target_path = Path(target)

    # Collect skills to validate
    if target_path.is_dir() and (target_path / 'SKILL.md').exists():
        # Single skill directory
        skills = [str(target_path)]
    elif target_path.is_dir():
        # Base directory containing skill dirs
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

    # Validate each skill
    results = []
    for skill_dir in skills:
        result = validate_skill(skill_dir, verbose=args.verbose)
        results.append(result)

    # Summary
    passed = sum(results)
    failed = len(results) - passed
    print()
    print(f"Summary: {passed} passed, {failed} failed out of {len(results)}")

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
