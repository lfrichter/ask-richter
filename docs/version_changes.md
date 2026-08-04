# Version Changes

## 2026-08-04 - Apps/Frontend React & Next.js Alignment

### Changes
- Updated `apps/frontend/package.json`:
  - `next`: `^14.2.32` -> `^15.4.2`
  - `react`: `^18.3.1` -> `^19.1.0`
  - `react-dom`: `^18.3.1` -> `^19.1.0`
  - `@types/react`: `^18.2.57` -> `^19.1.0`
  - `@types/react-dom`: `^18.2.19` -> `^19.1.1`
  - `eslint-config-next`: `^14.2.3` -> `^15.4.2`

### Rationale
- The monorepo root `package.json` specifies overrides forcing React 19 across all packages.
- `apps/frontend` previously declared Next 14 + React 18, leading to dual React instances and rendering errors (`TypeError: Cannot read properties of null (reading 'useContext')`) during static page generation in Next.js builds (both locally and on Vercel CI/CD).
- Aligning `apps/frontend` with React 19 and Next 15 resolves the version mismatch with `apps/web` and `apps/docs`, ensuring clean production builds.
