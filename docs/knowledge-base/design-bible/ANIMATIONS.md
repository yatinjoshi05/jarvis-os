# Animation Specs (ANIMATIONS.md)

This document describes all planned interaction and visual state animations within Jarvis OS, documenting their behavior, trigger states, and visual cues.

---

## 1. AI Core Globe Animations

### Idle

- **Trigger**: System is waiting; no active user query or background operation.
- **Visual Cues**: Concentric rings rotate at low speeds. The inner core pulses slowly with low-intensity Voltage Yellow glows.

### Listening

- **Trigger**: Microphone input is active; user is speaking.
- **Visual Cues**: Concentric rings change to reactive sizing. An ambient audio waveform expands outward from the core to match the user's speech amplitude.

### Thinking

- **Trigger**: Query received; AI model is processing.
- **Visual Cues**: Dotted and solid tech rings spin in alternating directions. The inner core shifts into a rapid radar-sweep animation.

### Speaking

- **Trigger**: Jarvis is outputting speech/response.
- **Visual Cues**: The core glows steadily and projects concentric rings that pulsate dynamically in sync with the audio track.

### Executing

- **Trigger**: Jarvis is running background shell scripts, searches, or trading directives.
- **Visual Cues**: Particle stream acceleration is high; rings spin rapidly; visual diagnostic overlays fade in around the globe boundaries.

---

## 2. System State Triggers

### Wake

- **Trigger**: Initial system boot or unlocking the terminal.
- **Visual Cues**: Central globe expands outward from a single dot. Layout panels slide in from borders.

### Success

- **Trigger**: Operation completes without error.
- **Visual Cues**: Temporary Voltage Yellow flash around the target card border, fading out over 500ms.

### Error

- **Trigger**: Operation failure.
- **Visual Cues**: Pulsing red borders around the offending card, accompanied by a vibrating shake animation (left-to-right displacement of 4px).

---

## 3. Layout and Structural Transitions

### Panel Expand / Collapse

- **Trigger**: Toggling the Left Sidebar or opening detail logs cards.
- **Visual Cues**: Width changes smoothly using standard easing. Secondary dashboard cards adjust positions fluidly.

### Notification Slide

- **Trigger**: Receiving an alert or system status update.
- **Visual Cues**: Slides in from the top-right border, hovers in place, then fades out and translates upwards upon dismissal.

