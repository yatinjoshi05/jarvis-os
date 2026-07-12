## Purpose
Core HTTP/API client capabilities and configuration.

## Responsibilities
- Defines HTTP request wrappers
- Manages request timeouts and headers
- Executes remote calls

## Dependencies
- [shared/errors](file://d:\jarvis\apps\web\src/shared\errors)

## Future Features
- Full business logic implementation
- Automated integration tests

## Public API
Provides core types, contracts, configuration parameters, and custom errors for api.

## Folder Description
- `index.ts` - Barrel file exporting public API.
- `types.ts` - Module-specific TypeScript type declarations.
- `interfaces.ts` - Module-specific TypeScript interfaces.
- `constants.ts` - Shared constant values.
- `events.ts` - Event names and payload bindings.
- `errors.ts` - Custom module exceptions.
