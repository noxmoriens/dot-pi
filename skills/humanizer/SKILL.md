---
name: humanizer
description: >
  You must use this skill when the user says "humanize this", "make it sound human",
  "rewrite naturally", "pass AI detection", "fix AI tone", or "too robotic".
  Rewrites AI-generated text into natural human prose by targeting the statistical
  signals detectors measure: perplexity, burstiness, and structural patterns.
  Also use when user says "hilangkan AI tone", "terlalu kaku", "bikin natural".
---

# When to use

- User says "humanize this", "make this sound human", "rewrite naturally"
- User says "pass AI detection", "fix AI tone", "too robotic", "too smooth"
- User says "hilangkan AI tone", "terlalu kaku", "bikin natural", " kurang manusiawi"
- Text reads flat, uniform, or like ChatGPT output
- User wants to improve writing quality by adding voice and variation
- Post-draft cleanup after AI-assisted writing

Do NOT use when:
- User wants a summary, outline, or brainstorm (use other skills)
- Text is already natural and only needs proofreading
- User wants translation (use translation workflow instead)
- User asks to generate new content from scratch

---

# How AI Detectors Work (Background)

Detectors measure two core signals:

- **Perplexity** — how predictable each word is. AI picks the most probable next word, so its text has low perplexity. Human writing uses unexpected words, odd metaphors, colloquialisms, jarring phrasing.
- **Burstiness** — how much sentence length and complexity vary. AI produces uniform 15-25 word sentences. Humans write in bursts: fragments, run-ons, winding constructions.

Third-gen detectors (Turnitin AIR-1, GPTZero, Copyleaks, Originality.ai) also flag:
- Overuse of discourse markers ("Furthermore", "Additionally", "In conclusion")
- Suspiciously equal paragraph lengths
- Absence of hedging/uncertainty
- Absence of first-person grounding or specific references
- Template structure (intro-thesis-body-conclusion)

---

# Steps

## 1. Identify the Source Text

Read the text to humanize. Note:
- Language (English, Indonesian, mixed)
- Register (academic, casual, professional, creative)
- Existing voice markers (any personality already present)
- Length and section structure

If text is very long (>2000 words), ask user which sections to prioritize or process in chunks of 300-500 words.

## 2. Cut the AI Tells (Find & Replace)

Scan for and eliminate these high-probability AI markers:

**Phrases to delete or rewrite entirely:**
- "It is important to note that"
- "It is worth noting"
- "In today's fast-paced world"
- "Delve into", "delving into"
- "Tapestry", "landscape", "realm"
- "Underscore", "underscores"
- "Furthermore", "Additionally", "Moreover"
- "In conclusion", "In summary", "To summarize"
- "Notably"
- "It goes without saying"
- "At the end of the day"
- "A comprehensive understanding"
- "Multifaceted"
- "Synergy", "leverage", "optimize"
- "Navigate the landscape of"
- "Robust", "comprehensive", "holistic"

**Patterns to break:**
- Em dashes used identically throughout (max 2 per chapter, vary punctuation)
- Sentences starting with "The" or "This" three times in a row
- Every paragraph opening with a topic sentence in the same position
- Consistent use of Oxford commas in every list

Replace with: direct phrasing, casual connectors, or nothing at all. If a sentence only exists as filler, delete it.

## 3. Raise Burstiness (Sentence Variation)

This is the single highest-impact technique. AI sentences cluster at 15-25 words. Create variance:

**The 3-1-5 Pattern:**
After 3-4 regular sentences, insert one very short sentence (3-8 words), then follow with one long sentence (35+ words).

**Concrete edits:**
- Split a long compound sentence at a clause boundary into two sentences
- Merge two short choppy sentences into one with a subordinate clause
- Leave a single sentence standing alone for emphasis
- Use a fragment where it serves the rhythm
- Start one sentence with "And" or "But" (humans do this; models rarely do)

**Check:** Read the text aloud. If it sounds like a metronome, the burstiness is too low. Human speech has pauses, rushes, and stalls.

## 4. Add Contractions and Register Shifts

AI defaults to formal register. Loosen it:

- "it is" → "it's"
- "cannot" → "can't"
- "do not" → "don't"
- "will not" → "won't"
- "they are" → "they're"
- "we are" → "we're"
- "I would" → "I'd"
- "let us" → "let's"

Only where tone permits. Academic/legal: keep formal. Blog/essay/casual: use contractions freely.

Also swap formal connectors for casual ones:
- "However" → "But here's the thing" or just "But"
- "Therefore" → "So"
- "Consequently" → "That means"
- "Nevertheless" → "Still" or "Even so"

## 5. Inject Hedging and Uncertainty

AI asserts. Humans hedge. Add 2-3 genuine uncertainty markers per 1000 words:

- "In my reading of the data"
- "I think this is right, but I could be wrong about the mechanism"
- "The evidence here is suggestive, not definitive"
- "I'd want to see this replicated before going further"
- "This might be wrong, but"
- "I'm less certain about this part"

Place only where uncertainty is authentic. Fake hedging where the author clearly knows the answer is itself a tell.

## 6. Add Specificity and Narrative Anchoring

Replace vague claims with concrete details:

- "Studies show" → name the specific study, author, year
- "Many people" → "a 2024 survey of 1,200 content marketers"
- "Significant improvements" → "a 23% increase in Q3"
- "This technique" → describe the actual technique with an example

Add first-person grounding where appropriate:
- "When I tested this"
- "A colleague who runs a 12-person team told me"
- "In my experience"

These are statistically rare in AI text because they require lived experience to generate plausibly.

## 7. Break Structural Symmetry

AI documents are suspiciously balanced. Disrupt this:

- Make one section much shorter than others
- End a section mid-thought, pick up in the next
- Insert a parenthetical aside or direct question to the reader
- Vary paragraph length dramatically: 2 sentences, then 8, then 3
- Open with your strongest point or a story, not a thesis statement
- Skip the formal conclusion; let the last content section serve as the ending

## 8. Final Read and Calm Check

Read the output once. Check:
- Does it still say what the original said? (meaning preservation)
- Does it sound like one person wrote it, not a machine patchwork?
- Are there any remaining AI tells?
- Is the rhythm varied? Read aloud to confirm.
- Are contractions and register shifts consistent?
- Did any factual details get distorted during rewriting?

If a sentence was changed but now says something different, revert it. Meaning preservation > statistical optimization.

---

# Output Format

Return the humanized text with a brief summary:

```
## Humanized Text

[rewritten text]

---

Changes made:
- Cut N AI-tell phrases
- Restructured N sentences for burstiness
- Added N contractions/register shifts
- Added N hedging markers
- Added N specificity/narrative anchors
- Broke N structural symmetry issues
```

---

# Language-Specific Notes

**English:**
- Full technique set applies
- Contractions are high-impact; use freely in casual/professional register

**Indonesian:**
- No contractions equivalent (formal ID already uses full forms)
- Focus on: sentence length variation, cutting AI tells translated to ID, adding colloquial Indonesian phrases
- ID AI tells: "penting untuk dipahami", "dalam konteks", "secara komprehensif", "multidimensi"
- Add informal ID markers: "pokoknya", "intinya", "realitanya", "yang jelas"
- Personify body/concepts per AGENTS.md style when appropriate

**Mixed ID-EN:**
- Apply technique to the dominant language section
- Code-switching itself is a humanizing signal; keep natural switches

---

# Gotchas

- Do NOT run the text through another AI model to "rewrite naturally." The output still comes from an AI and will have the same statistical patterns.
- Do NOT just swap synonyms. Perplexity and burstiness require structural changes, not vocabulary changes.
- Do NOT add hedging where the author clearly knows the answer. Fake uncertainty is detectable.
- Do NOT over-humanize. The goal is natural prose, not intentionally messy writing. Preserve clarity.
- Do NOT change meaning. Every rewrite must preserve the original's claims, data, and intent.
- Long texts (>2000 words) should be processed in 300-500 word chunks to avoid creating a new uniform "humanized" pattern.
- Em dash limit: max 2 per chapter. Use commas or separate sentences instead.
- The anti-slop checklist from AGENTS.md applies: check for "technically", "logically speaking", "it is worth noting", "it is crucial to understand", "let us explore".
- Detection scores are not guaranteed. Detectors retrain constantly. Focus on genuinely better writing, not score manipulation.
