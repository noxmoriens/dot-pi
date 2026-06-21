---
name: research
description: >
  You must use this skill when the user asks for research, investigation, OSINT,
  competitive analysis, intelligence assessment, strategic analysis, or any
  structured analytical report. Also use when user says "research this",
  "investigate", "deep dive", "analyze the competition", "write a report",
  "intelligence report", "source analysis", or "threat assessment".
  Covers OSINT methodology, Structured Analytic Techniques (SATs),
  VRIO Framework, and source confidence ratings.
---

# When to use

Use when:
- User says "research this", "investigate", "deep dive", "do some research"
- User says "analyze the competition", "competitive analysis", "market research"
- User says "write a report", "intelligence assessment", "OSINT", "threat assessment"
- User says "source analysis", "confidence check", "analyze sources"
- Any request for structured analytical output with evidence and citations

Do NOT use when:
- User just wants a quick search or look-up (use web_search directly)
- User needs codebase analysis (use analysis skill instead)
- User needs code review or security audit (use code-review skill)
- User needs task planning / decomposition (use planning skill)

---

# Output Format (MANDATORY)

Every research output must follow this exact structure:

```
# BLUF (Bottom Line Up Front)

# Key Findings

# Detailed Analysis

# Assessments & Outlook

# Sources & Confidence Ratings
```

---

# Steps

## 1. Define Requirements

Clarify scope before collecting anything:
- What is the central question or decision?
- Geographic, temporal, topical boundaries
- Priority Intelligence Requirements (PIRs) — what MUST be answered
- Legal limits and authorization constraints

If scope unclear: use ask to resolve before proceeding.

## 2. Collect Sources

Use web_search and read (for web URLs) to gather information.

Categorize sources:
- Primary: official documents, direct statements, raw data
- Secondary: analysis, journalism, reports
- Tertiary: summaries, encyclopedias, aggregated content

Source types to consider:
- Surface web search (web_search)
- Code repositories (gh_grep_searchGitHub)
- Documentation references (context7 tools)
- Domain / technical data (WHOIS, cert logs, Shodan — via bash)

Document every source with timestamp and URL.

## 3. Process & Validate

Corroborate every significant claim across minimum 3 independent sources.

Assign source reliability on A-F scale:

- A: Completely reliable — official, verified primary source
- B: Usually reliable — reputable secondary with track record
- C: Fairly reliable — unknown track record but plausible
- D: Not usually reliable — questionable methodology or bias
- E: Unreliable — known fabrication, propaganda
- F: Cannot be judged — unverifiable

Assign confidence levels (1-6):
- 6: Certain — multiple high-quality sources agree
- 5: High confidence — strong evidence, minor gaps
- 4: Moderate confidence — plausible, some corroboration
- 3: Low confidence — limited sources or contradictions
- 2: Very low — single questionable source
- 1: Speculative — no direct evidence

Check source bias, temporal relevance, and corroboration strength.
Flag contradictory evidence — do not suppress it.

## 4. Analyze

Apply one or more of the frameworks below based on the question type.

### Framework A: OSINT Analysis

Use for investigative questions, threat assessments, intelligence gathering.

Follow the Bellingcat 6-Step Method:
1. Define investigation scope precisely
2. Archive all sources immediately (save URLs, screenshots)
3. Triangulate — minimum 3 independent sources per claim
4. Build chronology of events
5. Document every evidence piece with metadata
6. Review findings before publication

### Framework B: Structured Analytic Techniques (SATs)

Use for complex, uncertain, or high-stakes decisions.

SATs grouped by purpose:

### Diagnostic Techniques
- Key Assumptions Check — list and challenge every assumption. For each: "why must this be true?" Retain only assumptions that must be true. Note conditions that would falsify them.
- Indicators / Signposts — create observable event lists that would validate or invalidate each hypothesis. Monitor changes over time.
- Analysis of Competing Hypotheses (ACH) — identify all reasonable hypotheses. Build matrix: hypotheses across top, evidence down side. Rate each evidence: Consistent (C), Inconsistent (I), or Neutral (N). Focus on DISPROVING, not confirming. Lowest inconsistency score = most likely.

### Contrarian Techniques
- Devil's Advocacy — challenge dominant consensus by building the best case for an alternative. Select most vulnerable assumptions. Highlight contradicting evidence.
- High-Impact / Low-Probability Analysis — focus on unlikely events with major consequences. Define plausible causation chains. Identify triggers and indicators.
- "What If?" Analysis — assume the event occurred. Work backwards from outcome to build plausible scenario chains.

### Imaginative Thinking
- Outside-In Thinking — start from external forces (Social, Technological, Economic, Environmental, Political — STEEP). Then assess factors you CAN influence.
- Alternative Futures (Scenarios) — identify two most critical and uncertain forces. Cross into 2x2 matrix. Develop narrative for each quadrant. Generate indicators for each future.

### Framework C: VRIO Analysis

Use for strategic/competitive analysis (source: Jay Barney, Resource-Based View).

Test each resource sequentially. Stop when it fails any criterion:

1. Valuable — does it exploit opportunities or neutralize threats?
   - If no: competitive disadvantage. Move to next resource.

2. Rare — do few competitors possess it?
   - If no: competitive necessity (must-have, not differentiator). Stop.

3. Inimitable — is it costly/difficult for competitors to obtain?
   - Sources of inimitability: Intellectual Property, Social Complexity (culture, reputation), Path Dependence (unique history), Causal Ambiguity (can't identify WHY advantage exists)
   - If no: temporary advantage (will erode). Stop.

4. Organized — is the firm structured to capture full value?
   - If no: advantage goes unrealized (temporary). Stop.
   - If yes: sustained competitive advantage. Protect and invest.

## 5. Report

Structure output in the mandatory format:

1. BLUF — Bottom Line Up Front. 1-3 sentences answering the central question first. Executive summary.
2. Key Findings — Bullet list of the most important findings, prioritized by impact.
3. Detailed Analysis — Full analysis with evidence, frameworks applied, reasoning chain.
4. Assessments & Outlook — Judgments about future developments, uncertainties, what would change the assessment.
5. Sources & Confidence Ratings — Every source cited with A-F reliability and confidence level.

---

# Framework Selection Guide

- Investigative, intelligence: OSINT cycle + Bellingcat
- Complex, uncertain decision: SATs (ACH + Key Assumptions)
- Challenging consensus: Devil's Advocacy, What-If Analysis
- Strategic / competitive: VRIO
- Long-term uncertainty: Alternative Futures (Scenarios)
- Adversary modeling: Red Team / Outside-In

(Use these as internal selection guide.)

---

# Gotchas

- Agent WILL skip source validation and report single-source claims as facts. Corroboration is mandatory — minimum 3 independent sources per significant claim.
- Agent WILL state conclusions without BLUF. BLUF must be the first content after headers — no exceptions.
- Agent WILL use vague source references ("sources indicate", "reports suggest"). Always name specific sources with confidence ratings.
- Agent WILL suppress contradictory evidence to make the report cleaner. Flag it explicitly — it's more valuable than clean narratives.
- Agent WILL guess when sources are thin. If evidence is insufficient, state: "Insufficient evidence to assess" — do not fabricate.
- Agent WILL apply frameworks superficially. Walk through each step of the framework explicitly — do not skip to conclusions.
- A-F ratings and confidence levels are mandatory for every source. No unrated claims.
