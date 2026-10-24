# Fitness – web app (Angular)

The frontend for the Fitness API: Angular 21, standalone components, signals, lazy-loaded routes.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ (LTS), and the API running (Visual Studio → Start, `https://localhost:7213`).

```
cd fitness-web
npm install
npm start
```

Open http://localhost:4200. Calls to `/api/...` are forwarded to the API by `proxy.conf.json`
(change `target` there if your API runs on another port).

## Build

```
npm run build
```

Output: `dist/fitness-web/browser` – plain static files. On the server Nginx serves them and passes `/api` to ASP.NET Core
(see `deploy/nginx-myapp.conf`). The CI/CD pipeline builds and deploys this automatically on every push to `main`.

## Structure

```
src/app/
  core/       models, API services, signal stores (auth, favorites, lookups, toast, theme, confirm),
              JWT interceptor, route guards
  layout/     app shell: sidebar on desktop, bottom tabs + drawer on phones
  shared/     icon, modal, confirm dialog, toasts, barbell (macros visual), exercise card, add-to-plan dialog
  pages/      auth (login, register), dashboard, exercises, plans + plan detail, favorites, food log, profile,
              admin (users, manage exercises, categories), not-found
```

## Roles

| Page | User | Admin |
|---|---|---|
| Today, Exercises, Plans, Favorites, Food log, Profile | ✓ | ✓ |
| Admin → Users (change role, delete) | – | ✓ |
| Admin → Manage exercises (add, edit, delete) | – | ✓ |
| Admin → Categories (equipment, muscle groups) | – | ✓ |

`adminGuard` blocks the admin routes in the browser; the API checks the role again on every request.

## State management

Shared state lives in small services built on Angular **signals**:

- `AuthStore` – logged-in user + JWT (saved in localStorage), `isAdmin`, login/register/logout
- `FavoritesStore` – favorite exercises, shared by the catalog, favorites page and dashboard
- `LookupsStore` – muscle groups, equipment and roles (loaded once, cached)
- `ToastStore`, `ConfirmStore`, `ThemeStore` – notifications, "are you sure?" dialog, dark/light theme

Pages keep their own data in `signal()`s and derive totals with `computed()` (e.g. the day's calories and macros).

## Design

Dark and light theme (toggle in the sidebar / top bar). Colours come from competition bumper plates:
red = protein / danger, blue = primary actions, yellow = carbs, green = fat / success.
The font is Archivo (self-hosted from npm), whose width axis gives the condensed numbers.
Fully responsive: sidebar ≥ 769 px, bottom tab bar and slide-in menu on phones, tables turn into cards.
