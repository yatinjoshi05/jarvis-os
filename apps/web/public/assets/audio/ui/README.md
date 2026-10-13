# UI Sound Effect Assets

Place custom UI `.mp3` sound effect files here for JARVIS OS.

Supported files:
- `click.mp3` — Played on button/dock clicks
- `typing.mp3` — Played during console typing feedback
- `notification.mp3` — Played when a new system alert arrives
- `success.mp3` — Played when a workflow or operation completes successfully
- `error.mp3` — Played when an operation encounters an error

The Premium Audio Engine automatically detects these files if present. If any file is missing, the engine gracefully handles state transitions without throwing errors.
