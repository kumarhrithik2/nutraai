# Repository Guidelines

## Project Structure & Module Organization

The repository contains a Django REST backend and a React/Vite frontend. The backend lives in `backend/`; domain apps under `backend/apps/` separate accounts, profiles, assessments, catalog, orders, and payments. `backend/config/api_urls.py` collects their routes under `/api/v1/`. A recommendations app is present, but is not included in that API URL list. Backend tests are kept in each app's `tests/` directory.

The frontend lives in `frontend/`. Route definitions are in `src/routes/`, screens in `src/pages/`, reusable UI in `src/components/`, shared auth state in `src/context/`, and API-related code in `src/services/`. Browser tests are in `tests/e2e/`; a separate auth-protection test and Playwright configuration are also present. The frontend README notes that application API endpoints are not currently connected.

## Build, Test, and Development Commands

Run frontend commands from `frontend/`:

- `npm run dev` starts the Vite development server.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm run test:qa` runs the Playwright suite; `npm run test:qa:auth-protection` runs the dedicated auth-protection config.
- Run one browser test with `npm test -- tests/e2e/auth.spec.js`.

Run backend commands from `backend/` after installing `requirements/dev.txt`:

- `pytest` runs the configured Django test suite; run one test module with `pytest apps/accounts/tests/test_auth.py`.
- `ruff check .` runs Ruff checks.

## Coding Style & Naming Conventions

Backend Ruff configuration targets Python 3.12, uses a 120-character line limit, and enables `E`, `F`, `I`, `B`, and `UP` rules; migrations are excluded. Frontend ESLint covers JavaScript and JSX with the recommended JavaScript, React Hooks, and React Refresh configurations. No formatter configuration was found.

## Testing Guidelines

Backend tests use pytest with `pytest-django`, configured by `backend/pytest.ini` to use `config.settings.test`. Frontend browser tests use Playwright; shared test scripts and browser configuration are defined in `frontend/package.json` and `frontend/playwright.config.js`.
