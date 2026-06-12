# PkgSize

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-purple)](./LICENSE)

📦 **Visualize npm package sizes and compare dependencies side-by-side.** Find what's bloating your bundle.

## ✨ Features

- **Squarified treemap** — Proper D3-style treemap with squarified layout for optimal aspect ratios
- **Package comparison** — Compare any two packages side-by-side with size bars
- **Search history** — Tracks your recent searches (persisted in localStorage)
- **README preview** — View the npm README without leaving the app
- **Dependency breakdown** — Top dependencies ranked by size with visual bars
- **Color-coded packages** — Consistent colors per package name for easy identification
- **Responsive layout** — SVG treemap resizes with the viewport

## 🚀 Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 6
- **Visualization:** Custom squarified treemap (SVG)
- **Data:** Bundlephobia API + npm Registry API
- **Styling:** Inline styles (no CSS framework needed)

## 📄 License

MIT
