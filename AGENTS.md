# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React 19 + TypeScript dashboard prototype for a 6G "big screen" UI. Application code lives in `src/`: `main.tsx` boots the app, `App.tsx` currently contains most UI and state logic, and `App.css` / `index.css` hold component and global styling. Static assets are split between `src/assets/` for imported images and `public/` for files served directly such as `favicon.svg` and `icons.svg`. Reference mockups kept at the repo root, such as `New_Topology_Canvas.jsx` and `New_Topology_Canvas.png`, should be treated as design inputs for the live dashboard rather than alternate apps. Tooling is configured in `vite.config.ts`, `eslint.config.js`, and the `tsconfig*.json` files. Use `NAMING_MODEL.md` as the canonical vocabulary for dashboard regions, tabs, and cards when discussing UI changes.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server on `0.0.0.0:8084`.
- `npm run start`: alias of `npm run dev`.
- `npm run build`: run TypeScript project checks with `tsc -b`, then create the production bundle.
- `npm run preview`: serve the built app locally for verification.
- `npm run lint`: run ESLint across the repository.

## Coding Style & Naming Conventions
Use TypeScript with React function components and hooks. Follow the existing style in `src/App.tsx`: 2-space indentation, single quotes, semicolons, and descriptive camelCase for variables and functions (`handleNgapRefresh`, `fetchWithRetry`). Name React components in PascalCase and keep asset filenames lowercase with hyphens when possible. When porting standalone mockups into `App.tsx`, preserve the reference geometry first, then adapt spacing to the surrounding dashboard shell. Run `npm run lint` before submitting changes; ESLint is the only enforced formatter/linter in this repo today.

## Testing Guidelines
No automated test framework is configured yet. Until one is added, treat `npm run build` and `npm run lint` as required validation for every change. For UI work, also verify flows manually in the dev server, especially the `/dashscope` proxy path and full-screen dashboard layout on large displays. When a reference image or JSX mockup exists, compare the live result against it with Playwright screenshots, not just DOM snapshots. When adding tests later, place them beside the feature as `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Git history is not available in this workspace snapshot, so follow a simple consistent convention: short imperative commit subjects such as `Add KPI refresh guard` or `Refine UE diagnostics panel`. Keep pull requests focused, describe the user-visible change, list validation commands, and attach screenshots or short recordings for dashboard/UI updates.

## Configuration Notes
Keep API secrets in `.env`, not in source files. The app expects Vite env vars such as `VITE_API_KEY`, `VITE_API_BASE_URL`, `VITE_MODEL_NAME`, and optional `VITE_API_VENDOR`. Use the `/dashscope` prefix for browser requests so Vite can proxy them correctly.
