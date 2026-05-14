# Contributing to Signl

Thank you for your interest in contributing to Signl! This document provides guidelines and information to help you get started.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Signl.git
   cd Signl
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables** — copy `.env.local.example` to `.env.local` and fill in your API keys.
5. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### Running the App

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

### Testing

```bash
node tests/ratelimit.test.mjs
```

---

## Project Conventions

### File Naming
- **Pages & Components**: PascalCase for components (e.g., `Sidebar.js`), lowercase for pages (`page.js`).
- **Utilities**: camelCase (e.g., `json-utils.js`, `ratelimit.js`).

### Styling
- Use the design tokens defined in `app/globals.css` (e.g., `var(--accent)`, `var(--bg-card)`).
- Prefer the existing CSS utility classes (`.card`, `.btn`, `.badge`, etc.) over inline styles in new components.
- Tailwind CSS is available for rapid prototyping.

### AI Integration
- All Gemini API calls should go through `src/lib/gemini.js` using the `generateWithFallback()` or `generateChatWithFallback()` functions.
- Always enforce structured JSON output in prompts and parse responses using `robustParseJSON()` from `src/lib/json-utils.js`.

### State Management
- Use the `src/lib/store.js` helpers for reading/writing to `localStorage`.
- All keys are namespaced by Clerk user ID to ensure data isolation.

---

## Pull Request Process

1. Ensure your code passes linting (`npm run lint`).
2. Write a clear PR description explaining *what* changed and *why*.
3. Reference any related issues (e.g., `Closes #42`).
4. Keep PRs focused — one feature or fix per PR.
5. Update documentation (README, architecture.md) if your changes affect the public API or project structure.

---

## Adding a New Feature Page

1. Create a new directory under `app/` (e.g., `app/my-feature/page.js`).
2. If it requires an API endpoint, create a route handler under `app/api/my-feature/route.js`.
3. Add the navigation entry in `src/components/Sidebar.js` under the appropriate group.
4. Use the existing design system and layout patterns — wrap content in `.app-layout` > `.main-content` > `.page-container`.

---

## Adding a New API Route

1. Create the route handler at `app/api/<endpoint>/route.js`.
2. Use `generateWithFallback()` for single-turn AI requests.
3. Use `generateChatWithFallback()` for multi-turn conversational AI.
4. Parse LLM JSON responses with `robustParseJSON()`.
5. The route is automatically protected by Clerk middleware and rate-limited.

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/RISHIE2006/Signl/issues) with:
- **Steps to reproduce** the bug.
- **Expected behavior** vs. **actual behavior**.
- **Screenshots** if applicable.
- **Browser and OS** information.

---

## Feature Requests

Open a [GitHub Issue](https://github.com/RISHIE2006/Signl/issues) with the `enhancement` label. Describe:
- The problem you're trying to solve.
- Your proposed solution.
- Any alternatives you've considered.

---

Thank you for helping make Signl better! 🚀
