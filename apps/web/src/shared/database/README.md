## Purpose
Infrastructure database connection abstraction interfaces.

## Responsibilities
- Defines database drivers
- Abstracts connection configs
- Orchestrates connection status

## Dependencies
- [shared/errors](file://d:\jarvis\apps\web\src/shared\errors)

## Future Features
- Full business logic implementation
- Automated integration tests

## Public API
Provides core types, contracts, configuration parameters, and custom errors for database.

## Folder Description
- `index.ts` - Barrel file exporting public API.
- `types.ts` - Module-specific TypeScript type declarations.
- `interfaces.ts` - Module-specific TypeScript interfaces.
- `constants.ts` - Shared constant values.
- `events.ts` - Event names and payload bindings.
- `errors.ts` - Custom module exceptions.
