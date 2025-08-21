# Copilot Instructions for PawnBroker Pro

## Big Picture Architecture
- **Mobile App (`mobile-app/`)**: React Native (TypeScript) client for Android/iOS. Handles UI, image capture, query limits, ads, and communicates with backend APIs.
- **Backend (`backend/`)**: Node.js/Express server. Provides REST APIs for item search, pricing, user management, and integrates with MongoDB, eBay API, Google Cloud Vision, and Firebase.
- **Integration Points**:
  - Mobile app calls backend endpoints for pricing, search, and history.
  - Backend connects to external APIs (eBay, Google Vision) and MongoDB.
  - AdMob and Firebase are used in mobile for monetization and authentication.

## Developer Workflows
- **Backend**: Run with `npm start` in `backend/`. Uses `src/index.js` as entry. MongoDB must be available. Debug with console logs; see health at `/health` endpoint.
- **Mobile App**: Run with `npm start` or `expo start` in `mobile-app/`. Android Studio required for emulation. Use React Native/Expo CLI for builds and debugging.
- **Testing**: JS test files in root and backend (e.g., `test-market-price.js`). Run with `node <testfile>`. No formal test runner configured.
- **Environment**: Backend uses `.env` files in `backend/config/`. Mobile app uses `app.json` and environment variables for config.

## Project-Specific Patterns
- **Pricing Logic**: 30% of market value is default for pawn offers. See backend services and mobile screens for calculation logic.
- **Brand/Model Extraction**: See `LearningService.ts` in mobile for custom brand/model parsing. Apple products have special handling.
- **Ad/Query Limits**: Mobile app enforces daily query limits and ad-based unlocks. See `QueryLimitBanner.tsx` and related screens.
- **API Integration**: Backend integrates with eBay, Google Vision, Firebase. Credentials managed via `API_KEYS_REFERENCE.md` and `.env`.

## Conventions & Patterns
- **TypeScript in mobile**, JavaScript in backend.
- **Service Layer**: Backend and mobile both use service classes (e.g., `AmazonAPIService.js`, `LearningService.ts`).
- **Routes**: Backend routes in `backend/routes/`. Mobile screens in `mobile-app/src/screens/`.
- **Logging**: Use `console.log` for debugging. Enhanced logging in brand/model extraction.
- **No monorepo tooling**: Each app manages its own dependencies/scripts.

## Key Files & Directories
- `mobile-app/src/services/LearningService.ts`: Brand/model extraction logic.
- `backend/services/`: API/data aggregation logic.
- `backend/routes/`: REST endpoints.
- `mobile-app/src/screens/`: UI screens and flows.
- `API_KEYS_REFERENCE.md`: Reference for API credentials.
- `backend/config/`: Environment config files.

## Example Patterns
- To add a new brand extraction rule, update `brandIndicators` in `LearningService.ts`.
- To add a backend API, create a new route in `backend/routes/` and service in `backend/services/`.
- To debug pricing, check logs in backend and mobile service files.

---
If any section is unclear or missing, please provide feedback to iterate and improve these instructions.
