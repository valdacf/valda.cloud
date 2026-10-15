# Neural OCR laboratory

Open `/games/neural-ocr.html` through an HTTP server. ES modules require HTTP instead of a local `file:` URL.

## Controls

1. Select **Nauč se** to start training. Select **Pozastavit** to stop it.
2. Select **Jeden krok** to train on one example. Slow mode shows individual examples every 600 milliseconds.
3. Select a sample to inspect its current prediction. Sample selection pauses training.
4. Draw with a mouse or finger to test another shape. Drawing pauses training and preserves learned weights.
5. Select **Vymazat** to clear the drawing. Select **Začít od nuly** to reset the network and statistics.
6. Select a sphere in the hidden layer to inspect all its input weights. You can also select its row in the full weight map.
7. On narrow screens, scroll the network horizontally. Keyboard users can focus each neuron button and press Enter.

Training stops automatically after 100 passes (5,000 examples). Drawing and sample inspection remain available.
Select **Začít od nuly** to train again.

The graph shows the currently selected training sample or the normalized drawing. Labels above the graph and prediction identify which source is active.
The drawing stays on its canvas when training resumes, but the graph switches to training examples.

## Model and display

The model has 256 grayscale inputs, 24 sigmoid hidden units, and ten softmax outputs.
Gradient descent updates both layers and their biases after each example. The learning rate is 0.12.
The deterministic dataset contains five stroke variants for each digit. Both samples and drawings use the same aspect-preserving normalization.
The input fits into a centered 12 × 12 region inside a 16 × 16 raster.

The fixed isometric view separates the input, hidden, and output layers into angled plates.
The selected sphere connects to its 256 input weights. The scene also shows its activation and bias.
Spatial positions illustrate the layers; they do not add dimensions to the model.
Connection color shows weight sign. Thickness shows magnitude. Neuron brightness shows activation.
The graph draws selected connections from the 6,384 weights. The selected neuron's map shows all 256 input weights.
Displayed predictions and sample loss use the selected inference precision after any update.
The sample loss label identifies its precision. Training metrics always use the original FP64 model.
Dataset accuracy and average cross-entropy loss update after each complete pass through fifty samples.

The output compares only digits. Letters and unfamiliar shapes can receive high scores.
Training accuracy measures the known fifty samples. It does not measure general handwriting recognition.
A blank drawing produces no prediction. An untrained network explicitly labels its predictions as random.

## Precision and full parameter map

The selector switches between original FP64 parameters and an E4M3 FP8 inference snapshot.
The snapshot rounds all 6,384 weights and 34 biases. Training always updates the original FP64 model.
The snapshot refreshes after training steps and reset. Switching precision never changes the original parameters or training counters.
The original model supplies training accuracy, average loss, and history. The active snapshot supplies predictions and visualizations.
The prediction panel reports the largest absolute score difference from FP64, in percentage points.

E4M3 uses one sign bit, four exponent bits, three fraction bits, and exponent bias seven.
The simulator supports subnormal values, signed zero, and NaN. It rounds ties to even and saturates overflow at ±448.
It uses no scaling. Tiny magnitudes can round to zero. This is parameter quantization, not hardware FP8 arithmetic.
The browser retains FP64 arrays for the original model and decoded snapshot; this mode does not claim an eightfold RAM saving.
See the [NVIDIA E4M3 reference](https://docs.nvidia.com/cuda/archive/13.0.2/cuda-math-api/cuda_math_api/struct____nv__fp8__e4m3.html).

The strip contains a 256 × 24 input matrix, a 24 × 10 output matrix, and a 34 × 1 bias strip.
Each source pixel represents one parameter. Input rows correspond to hidden neurons; output rows correspond to digit classes.
The bias strip lists 24 hidden biases followed by ten output biases.
Hover or tap a pixel to inspect its original value and active value. FP8 mode also shows its eight-bit encoding.
Clicking an input row or an output connection selects its hidden neuron in the scene.
Focus a map and use arrow keys to inspect nearby parameters. The selected input row has an outline.

The scene and strip share one continuous signed color scale in both precision modes.
Color strength is `abs(weight) / (0.2 + abs(weight))`. Negative values are pink; positive values are green; zero is dark.
FP8 values produce discrete shades. RGB display precision can map nearby FP64 or FP8 values to the same color.
The color scale does not rescale when switching precision or during training.

## Development

Run `python3 -m http.server 8765 --directory web` from the repository root.
Run `node --test tests/*.test.mjs` with Node.js 22.18 or newer.
Run `node tests/neural-ocr.browser.cjs` with Playwright and Chrome installed while the server runs.
Run `node tests/neural-ocr-view.browser.cjs` to check direct selection, map selection synchronization, keyboard input, and mobile layout.
Run `node tests/neural-ocr-precision.browser.cjs` to check precision switching, maps, parameter selection, and preserved training state.
Run `node tests/neural-ocr-pause.browser.cjs` to check mouse, keyboard, and touch pause behavior in Chromium and WebKit.
Install the Playwright WebKit browser for that check. Use `OCR_BASE_URL` to test a deployed site.
Set `PLAYWRIGHT_PATH` to the Playwright package directory if Node cannot resolve it locally.
Browser checks save desktop and mobile screenshots under `/tmp/`.

All state stays in browser memory. Refreshing the page starts a new network.
The page requires no build, backend, remote dataset, or third-party runtime package.
