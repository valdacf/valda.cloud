# Neural OCR laboratory — Implementation plan

> **For agentic workers:** Use cf-powers:executing-plans for inline implementation.

**Goal:** Deliver an interactive, genuinely trained digit network in the static games collection.
**Architecture:** A pure numerical module supplies generated stroke samples and network state to a browser controller.
**Tech Stack:** HTML, CSS, JavaScript ES modules, Canvas, Node test runner.
**Analysis:** [Design](./2026-10-15-neural-ocr.md)

## Global constraints
- Use 16 × 16 inputs, 24 hidden units, ten outputs, and five variants per digit.
- Keep the existing static deployment and avoid third-party dependencies.
- Display actual weights and activations; label sampled connections and training-set accuracy.

## Review focus
- A letter can receive high digit scores; explain this directly beside predictions.
- Pause and reset must not leave a queued training loop running.
- Drawing must preserve aspect ratio and share normalization with the training set.
- Mobile controls and graph must remain usable without horizontal page overflow.

### Task 1: Complete learning laboratory
- [x] **Delivers:** Training, inspection, drawing, and navigation as one usable page.
**Files:** Create the four laboratory files and `tests/neural-ocr.test.mjs`; update `web/index.html` and `README.md`.
**Interfaces:** `makeSamples()` returns `{label, pixels}` examples; `normalize(pixels, width, height)` returns 256 intensities.
`Network.forward(pixels)` returns `{hidden, probabilities}`; `Network.train(pixels, label)` updates weights and returns pre-update loss.
**Decisions:** Use deterministic initialization and stroke rasterization. Train on the same normalized inputs shown in the UI.
**Trap:** Five examples per digit cannot establish general handwriting accuracy.
**Verify:** `node --test tests/*.test.mjs`; `git diff --check`; browser interactions and desktop/mobile screenshot inspection.

## Execution ledger
- User approved the design and implementation on 2026-10-15.
- Execute inline; use judgment-tier reviewers for design and final code.
- Preserve the current workspace. The user authorized committing the completed feature after preview.
- Pre-flight: one vertical slice; no cross-task interfaces.

## Completion evidence
- Numerical suite: 5/5 tests passed. At 100 epochs, the network classifies 50/50 training samples with mean loss 0.00515.
- Browser checks passed in Chrome: training, pause, step, cap, sample selection, drawing, clearing, reset, touch, and responsive layout.
- The cap regression failed at 5,601 steps before the fix and passed at exactly 5,000 after the fix.
- Independent code review found ambiguous prediction context and small mobile sample controls. Both are fixed with browser regressions.
- A continued stroke now pauses training, including when keyboard input starts training during that stroke.
- The drawing frame matches the active canvas. Desktop, mobile, and home screenshots were inspected.
- Documentation updated: README, user guide, analysis, and this ledger. No changelog or plugin metadata exists for this feature.
- `git diff --check` passed. The local preview uses port 8765.
