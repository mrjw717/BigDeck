# BigDeck Test Assets

Scratch material for hand-testing BigDeck features. Not shipped; safe to
edit freely. Ask the agent to add more folders as new test needs appear.

## Layout

| Folder      | For |
|-------------|-----|
| `scripts/`  | **Run script** action tests — `hello.sh`, `hello.py`, `hello.js`. Each appends a timestamped line to `scripts/ran.log`: after pressing the key, check the log grew (BigDeck discards script stdout, so the log is the proof). Point the key at a file via Key Editor → Action → Advanced Scripting → **Script file**, or paste the code inline. |
| `images/`   | Appearance/layer tests — PNGs, GIFs (static + animated), fit-mode tests, chroma-key art (e.g. a logo on a solid background to knock out). |
| `sounds/`   | Soundboard tests (audio playback actions). |
| `plugins/`  | `.streamDeckPlugin` install tests for the SD plugin host. |

## Notes

- `ran.log` is gitignored (it's runtime output, not an asset).
- Scripts are interpreter-invoked (`bash x.sh`, `python3 x.py`, `node x.js`),
  so the execute bit is not required — but `hello.sh` is chmod +x anyway.
