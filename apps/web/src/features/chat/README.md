## Purpose
Core chat dialog UI flows and stream listeners.

## Responsibilities
- Manages active chat session records
- Submits message payloads

## Dependencies
- [shared/errors](file://d:\jarvis\apps\web\src/shared\errors)
- [shared/events](file://d:\jarvis\apps\web\src/shared\events)

## Future Features
- Full business logic implementation
- Automated integration tests

## Public API
Provides core types, contracts, configuration parameters, and custom errors for chat.

## Folder Description
- `index.ts` - Barrel file exporting public API.
- `types.ts` - Module-specific TypeScript type declarations.
- `interfaces.ts` - Module-specific TypeScript interfaces.
- `constants.ts` - Shared constant values.
- `events.ts` - Event names and payload bindings.
- `errors.ts` - Custom module exceptions.
