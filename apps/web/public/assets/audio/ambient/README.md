# Ambient Sound Assets

Place custom ambient `.mp3` sound files here for JARVIS OS.

Supported files:
- `idle.mp3` — Played on loop during normal idle state
- `listening.mp3` — Played when microphone is actively listening
- `thinking.mp3` — Played during AI prompt processing/reasoning
- `speaking.mp3` — Played in background underneath speech synthesis
- `startup.mp3` — Played during application startup sequence
- `shutdown.mp3` — Played during application shutdown sequence

The Premium Audio Engine automatically detects these files if present. If any file is missing, the engine gracefully handles state transitions without throwing errors or interrupting execution.
