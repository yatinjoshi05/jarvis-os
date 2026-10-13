# Component Catalog (COMPONENTS.md)

This file catalogs every planned visual component for Jarvis OS, categorized by structural purpose and interface layout.

---

## 1. Structural Shell Components

### TopBar

- **Description**: Spans the top of the interface. Displays core system status and authorization badges.
- **Sub-elements**: Brand logotype, system stats widgets (CPU/MEM/NET), location tracking, secure clock.
- **State Modes**: Secure (Green/Yellow), Warning (Orange), Alert (Red).

### Sidebar

- **Description**: Left-aligned navigation panel.
- **Sub-elements**: Navigation button items (Home, Chat, Missions, Memory, Files, Browser, Coding, Trading, Devices, Settings), user profile summary, Active line indicator.
- **State Modes**: Expanded, Collapsed (icons-only), Item selected.

---

## 2. Core Dashboard Cards

### MissionCard

- **Description**: Displays pending operations, sub-tasks, and priority status.
- **Sub-elements**: Mission title, progress bar, countdown tracker, target badge.

### MemoryCard

- **Description**: Interactive status representation of memory indexing.
- **Sub-elements**: Storage utilization graph, total index records count, memory state indicator.

### DeviceCard

- **Description**: Interactive list of external devices and client wrapping states.
- **Sub-elements**: Client identifier labels, signal dots, activity triggers.

---

## 3. Interactive Inputs & Controls

### BottomCommandBar

- **Description**: Central text directive area at the bottom.
- **Sub-elements**: Command input text box, send trigger, microphone button, voice status label.
- **State Modes**: Awaiting Input, Recording Voice, Processing, Disabled.

### QuickActions

- **Description**: Quick toggle controls.
- **Sub-elements**: Toggle buttons (Mute, Clear Screen, Reset UI, Lock Shell).

---

## 4. Overlay & Ambient Systems

### AIGlobe

- **Description**: Central cognitive visualization representing the active intelligence matrix.
- **Sub-elements**: Concentric tech rings, particles core, radar scanner sweep overlays.
- **State Modes**: Idle, Listening, Thinking, Speaking, Executing.

### VoicePopup

- **Description**: Center overlay bubble showing speech-to-text transcriptions and audio responses.
- **Sub-elements**: Text transcription container, ambient feedback waves.

---

## 5. Overlays, Dialogs & Modals

### Notifications

- **Description**: Muted sliding notifications.
- **Sub-elements**: Notification icon, title header, description paragraph.

### Dialogs / Modals

- **Description**: Overlaid system check requests requiring user consent.
- **Sub-elements**: Alert icon, description, confirmation buttons (Cancel / Proceed).

### SettingsPanels

- **Description**: Tabbed slide-out configurations layout.
- **Sub-elements**: Sidebar category tab list, settings input fields, toggle switches, action buttons.

