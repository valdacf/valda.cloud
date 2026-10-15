# Neural OCR laboratory

## Overview
Build an educational digit classifier in the existing static game collection.
The user approved a 16 × 16 input, 24 hidden units, ten outputs, and fifty training examples.
The page must show real training and support mouse and touch drawing.

## Current state
`web/index.html:26` lists independent games. `README.md:7` documents them.
`web/games/sedma.html:1` demonstrates the standalone HTML convention.
The site has no build system, database, or application service.

## Proposed solution
Add `/games/neural-ocr.html` with local CSS and JavaScript modules under `/games/neural-ocr/`.
Separate numerical operations from rendering so Node can test the same model used by the browser.
Use a deterministic 256 → 24 → 10 network with sigmoid hidden units, softmax outputs, and cross-entropy gradient descent.
Generate five fixed stroke variants per digit. Use the same bounding-box normalization for examples and drawings.
Run training in bounded animation batches. Show the current example, target, prediction, loss, and training accuracy.
Provide start/pause, single-example step, speed selection, and reset controls.
Show all input pixels, all hidden units, and ten outputs. Draw only a disclosed subset of weighted connections.
Weight colors indicate sign, thickness indicates magnitude, and neuron brightness indicates activation.
Selecting a hidden neuron reveals its full 16 × 16 input weight map.
Drawing updates the input and output scores. Empty drawings have no prediction.
The interface must explain that letters and unfamiliar shapes still receive digit scores.
Training accuracy is explicitly measured on the fifty training examples, not unseen handwriting.
Reset clears learned weights and counters. Clearing the drawing preserves learned weights.
Use Czech interface text, responsive layout, reduced-motion support, and native keyboard-accessible controls.
No persistence, downloads, third-party scripts, or network requests are required.

## Affected files
New: `web/games/neural-ocr.html`, `web/games/neural-ocr/{model.js,app.js,style.css}`, `tests/neural-ocr.test.mjs`.
Modify `web/index.html:29` with a card and `README.md:7` with an entry and test instructions.
Existing games, shared CSS, server configuration, and deployment remain unchanged.
Database, service, and configuration migrations: N/A; all state stays in browser memory.

## Implementation phase
- [x] Deliver the complete laboratory, navigation, documentation, and tests as one vertical slice.

## Risks and mitigations
| Risk | Mitigation |
| --- | --- |
| Small training set overfits | Label training accuracy; explain limited handwriting coverage. |
| Dense graph obscures learning | Show sampled edges and a selected neuron's full weight map. |
| Animation blocks controls | Bound each batch and yield between frames. |
| Empty input yields misleading output | Show a drawing prompt instead of a classification. |
| Letters receive confident scores | Explain that scores only compare the ten known classes. |

## Testing
Node tests verify deterministic data, finite normalized outputs, loss reduction, training accuracy, gradient direction, and empty-input normalization.
Browser checks cover step, training, pause, reset, drawing, clearing, sample selection, and mobile layout.
Open a local HTTP server and inspect desktop and mobile screenshots.
Use `node --test tests/*.test.mjs` and `git diff --check`.

## References
The approved design appears in the conversation on 2026-10-15.

## Review decisions
BA, developer, and security reviews identified small implementation clarifications.
After 100 epochs, each digit must classify at least four of its five examples correctly and average loss must drop by 80%.
Selecting an example or drawing pauses training and switches the graph to that input.
Training stops after 100 epochs (5,000 steps), as requested in the implementation follow-up.
Pause remains available before the limit. Reset enables another training run.
The initial state explicitly says the network is untrained.
The graph and displayed example loss use the current post-update network state.
Use `.js` modules for compatibility with existing nginx JavaScript MIME mapping.
Drawing uses a fixed raster, clamps coordinates, and coalesces work through animation frames.
Each training frame processes at most 50 examples or eight milliseconds.
Compute whole-dataset metrics once per epoch.

Performance review found no blocker. Pointer raster reads and rendering are coalesced into animation frames.
