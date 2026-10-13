# JARVIS OS — Vision Memory (`/vision`)

## Project Purpose
The Vision module handles multi-modal image analysis, screen capture analysis, optical character recognition (OCR), visual DOM parsing, visual inspection, and multi-modal AI provider image input pipelines.

## UI Architecture
- Vision Workspace & Preview overlays for image uploads, live camera feeds, and desktop screenshot analysis.
- Bounding box annotation views for object detection and web element identification.

## Services
- Vision Provider Engine: Formats image payloads for multi-modal LLM endpoints (Gemini 1.5/2.0 Flash/Pro, OpenAI GPT-4o, Claude 3.5 Sonnet).
- Screen Capture Service: Captures window or full-screen frames via Tauri IPC or Browser MediaDevices API.

## Stores
- Vision Context Store: Manages active screenshots, image attachments, bounding box coordinates, and visual analysis history.

## Routes
- `/vision` -> Renders Vision Workspace & image analysis tools.

## Data Flow
1. Screenshot or image upload captured by user action or autonomous subagent step.
2. Image base64 / binary array formatted by Vision Provider Engine.
3. Multi-modal prompt sent to active provider (e.g. Gemini / GPT-4o).
4. Extracted text, element coordinates, or visual diagnostics returned to requesting module or UI chat window.

## Dependencies
- Canvas API, MediaDevices API, Multi-modal LLM APIs (Gemini, OpenAI, Claude).

## Frozen Components
- Visual overlays must adhere strictly to design system contrast and border standards.

## Important Files
- [AIRouter.ts](file:///d:/jarvis/apps/web/src/shared/ai/AIRouter.ts)
- [GeminiProvider.ts](file:///d:/jarvis/apps/web/src/shared/ai/GeminiProvider.ts)

## Warnings
- Large high-resolution images must be resized/compressed before API transmission to avoid payload limits and high latency.

## Future Plans
- Local real-time YOLO / MobileNet object detection engine for low-latency visual tracking.

## Known Issues
- Screen capture in pure browser mode requires user permission prompt per session.
