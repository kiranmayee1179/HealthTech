# React + Vite

## AI backend

The chat uses the local Express backend on port `3001`. For professional answers to arbitrary health questions, configure a Gemini API key:

1. Copy `.env.example` to `.env`.
2. Set `GEMINI_API_KEY` in `.env`.
3. Restart `node server.js`.

Without a provider key, the app uses a limited offline symptom fallback. It can give basic guidance for common symptoms, but no keyword-based fallback can reliably answer every disease or medical question.

## Deploying

- **Render backend:** Deploy this repository using `render.yaml`. Add `GEMINI_API_KEY` and, optionally, `GEMINI_MODEL` as Render environment variables. The service listens on Render's `PORT`.
- **Vercel frontend:** Import the same repository, use the Vite defaults from `vercel.json`, and set `VITE_API_BASE_URL` to the deployed Render service URL, for example `https://vitalcheck-api.onrender.com`.
- Do not commit `.env`, API keys, passwords, or the local `data` directory.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
