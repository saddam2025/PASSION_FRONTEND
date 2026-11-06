# Passion Academy frontend

Arabic RTL React + Vite + TypeScript frontend. All business data is read from or written to the real API; local storage is reserved for UI preferences.

## Run frontend and backend together

Use Node.js 22 or newer. Configure `PASSION_BACKEND/.env` from its `.env.example` with the database and server settings. In the backend terminal:

```powershell
cd PASSION_BACKEND
npm install
npm run seed:admin
npm run dev
```

`seed:admin` reads the Admin email, password and name from the backend environment; never place these values in the frontend environment. The backend listens on port 4000 by default.

In another terminal:

```powershell
cd PASSION_FRONTEND
Copy-Item .env.example .env
npm install
npm run dev
```

Vite serves `http://localhost:5173` and proxies `/api` to port 4000, so browser cookies use the frontend origin. Set `VITE_API_PROXY_TARGET` if the backend listens elsewhere. For direct API access, configure backend `CORS_ORIGINS` for the frontend origin and set `VITE_API_BASE_URL` to the API root.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | API root path; normally leave this on the Vite proxy. |
| `VITE_API_PROXY_TARGET` | `http://localhost:4000` | Backend origin used by the Vite development proxy. |
| `VITE_SITE_URL` | `http://localhost:5173` | Canonical public site origin. |
| `VITE_MEDIA_BASE_URL` | empty | Public CDN base for relative public-media keys; never include storage credentials. |
| `VITE_META_PIXEL_ID` | empty | Optional public Meta Pixel ID (8–20 digits). Invalid or empty values disable tracking. |

## Deploy on Vercel

The project builds to `dist`. `vercel.json` rewrites client-side routes such as `/ar` and `/ar/admin/settings` to `index.html`, so refreshing a nested route stays inside the React app. The API is a separate backend service: set `VITE_API_BASE_URL` in the Vercel project's Production (and Preview, if used) environment variables to the backend API root, for example `https://<backend-domain>/api/v1`. Do not leave it as `/api/v1` in a deployment unless Vercel is also configured to proxy `/api` to the backend. Add the frontend's deployed origin to the backend's `CORS_ORIGINS` allowlist. `VITE_API_PROXY_TARGET` only affects the local Vite development server.

To enable Meta Pixel on published course landing pages only, set `VITE_META_PIXEL_ID` in Vercel Project Settings → Environment Variables for the desired deployment environments. It is a public ID, not a secret. Vite embeds it at build time, so redeploy after changing it. Leave it empty to disable tracking. Consent is not required by default (`META_PIXEL_REQUIRES_CONSENT=false` in `src/config/features.ts`); if the flag is enabled, the visitor's choice is stored in localStorage under `passion.meta-pixel-consent` as `accepted` or `rejected`. The choice can be changed by clearing that key. The privacy policy must disclose Meta Pixel before tracking is enabled for visitors.
## Build and preview

```powershell
npm run typecheck
npm run lint
npm run check:i18n
npm run check:routes
npx vitest run
npm run build
npm run preview
```

The preview server serves the generated `dist` build. The backend remains a separate service and must be reachable through the configured API origin or hosting proxy.
