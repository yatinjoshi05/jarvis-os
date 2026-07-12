## Purpose
Virtual plugins specifications and interfaces details.

## Responsibilities
- Binds plugin manifest properties
- Manages plugin engine active states

## Dependencies
- [shared/errors](file://d:\jarvis\apps\web\src/shared\errors)

## Future Features
- Full business logic implementation
- Automated integration tests

## Public API
Provides core types, contracts, configuration parameters, and custom errors for plugin.

## Folder Description
- `index.ts` - Barrel file exporting public API.
- `types.ts` - Module-specific TypeScript type declarations.
- `interfaces.ts` - Module-specific TypeScript interfaces.
- `constants.ts` - Shared constant values.
- `events.ts` - Event names and payload bindings.
- `errors.ts` - Custom module exceptions.
