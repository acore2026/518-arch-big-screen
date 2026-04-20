# GEMINI Project Instructions: 6G Agentic Core Dashboard

This project is a high-fidelity prototype dashboard for a "6G Agentic Core" based on the Huawei SA2 proposal. It is a React application designed for high-resolution screens ("big screen").

## Project Overview
- **Purpose:** Visualize 6G network orchestration, multi-agent ReAct logs, UE diagnostics, and SBI (Service Based Interface) signaling traces.
- **Tech Stack:**
  - **Frontend:** React 19 (TypeScript)
  - **Build Tool:** Vite
  - **Styling:** Tailwind CSS v4 (using `@tailwindcss/vite`)
  - **Icons:** Lucide React
  - **LLM Integration:** DashScope (Aliyun) Anthropic-compatible API, proxied via Vite.

## Architecture Highlights
- **CORS Bypass:** The application uses a Vite proxy (`/dashscope`) to communicate with `coding.dashscope.aliyuncs.com`.
- **API Configuration:** Managed via `.env`.
- **Single Component Logic:** Most dashboard logic and styling are currently consolidated in `src/App.tsx` for rapid prototyping.

## Building and Running

### Prerequisites
- Node.js installed.

### Commands
- **Install Dependencies:**
  ```bash
  npm install
  ```
- **Run Development Server:**
  ```bash
  npm run start
  ```
  *(Server listens on `0.0.0.0:8084`)*
- **Build for Production:**
  ```bash
  npm run build
  ```
- **Preview Production Build:**
  ```bash
  npm run preview
  ```

## Development Conventions
- **Environment Variables:** Always update `.env` for API key or model changes.
- **Proxying:** Use the `/dashscope` prefix for LLM API calls to avoid CORS issues in the browser.
- **Port Management:** The project is hardcoded to port `8084` in `vite.config.ts`.
- **Styling:** Adhere to the "big screen" layout established in `src/App.tsx`, matching the visual style of `page-i-want.png`.

## Project Structure
- `src/App.tsx`: Main entry point containing the dashboard UI and state logic.
- `src/index.css`: Tailwind v4 entry point.
- `vite.config.ts`: Configured with React, Tailwind, and the DashScope proxy.
- `.env`: Contains `VITE_API_KEY`, `VITE_API_BASE_URL` (set to `/dashscope/...`), and `VITE_MODEL_NAME`.
