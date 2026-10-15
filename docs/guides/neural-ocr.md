# Neural OCR laboratory

Open `/games/neural-ocr.html` through an HTTP server. ES modules require HTTP instead of a local `file:` URL.

## Controls

1. Select **Nauč se** to start training. Select **Pozastavit** to stop it.
2. Select **Jeden krok** to train on one example. Slow mode shows individual examples every 600 milliseconds.
3. Select a sample to inspect its current prediction. Sample selection pauses training.
4. Draw with a mouse or finger to test another shape. Drawing pauses training and preserves learned weights.
5. Select **Vymazat** to clear the drawing. Select **Začít od nuly** to reset the network and statistics.
6. Select a hidden neuron to inspect all its input weights.

Training stops automatically after 100 passes (5,000 examples). Drawing and sample inspection remain available.
Select **Začít od nuly** to train again.

The graph shows the currently selected training sample or the normalized drawing. Labels above the graph and prediction identify which source is active.
The drawing stays on its canvas when training resumes, but the graph switches to training examples.

## Model and display

The model has 256 grayscale inputs, 24 sigmoid hidden units, and ten softmax outputs.
Gradient descent updates both layers and their biases after each example. The learning rate is 0.12.
The deterministic dataset contains five stroke variants for each digit. Both samples and drawings use the same aspect-preserving normalization.
The input fits into a centered 12 × 12 region inside a 16 × 16 raster.

Connection color shows weight sign. Thickness shows magnitude. Neuron brightness shows activation.
The graph draws selected connections from the 6,384 weights. The selected neuron's map shows all 256 input weights.
Displayed prediction and sample loss come from the current model after any update.
Dataset accuracy and average cross-entropy loss update after each complete pass through fifty samples.

The output compares only digits. Letters and unfamiliar shapes can receive high scores.
Training accuracy measures the known fifty samples. It does not measure general handwriting recognition.
A blank drawing produces no prediction. An untrained network explicitly labels its predictions as random.

## Development

Run `python3 -m http.server 8765 --directory web` from the repository root.
Run `node --test tests/*.test.mjs` with Node.js 22.18 or newer.
Run `node tests/neural-ocr.browser.cjs` with Playwright and Chrome installed while the server runs.
Run `node tests/neural-ocr-pause.browser.cjs` to check mouse, keyboard, and touch pause behavior in Chromium and WebKit.
Install the Playwright WebKit browser for that check. Use `OCR_BASE_URL` to test a deployed site.
Set `PLAYWRIGHT_PATH` to the Playwright package directory if Node cannot resolve it locally.
Browser checks save desktop and mobile screenshots under `/tmp/`.

All state stays in browser memory. Refreshing the page starts a new network.
The page requires no build, backend, remote dataset, or third-party runtime package.
