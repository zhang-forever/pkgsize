# PkgSize

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-purple)](./LICENSE)

📦 **Visualize npm package dependencies and their disk space usage.** Type a package name. See a TreeMap of every dependency. Find what to cut.

## 🎯 Why

`node_modules` is famously bloated. PkgSize shows you exactly which packages eat the most space, helping you make informed decisions about your dependencies.

## ✨ Features

- **Treemap visualization** — Interactive TreeMap showing all dependencies and their sizes
- **Size breakdown** — See exact size in KB/MB for each package
- **Heavy dependency highlight** — Automatically highlights the top 3 largest dependencies
- **Tree-shaking analysis** — Estimate actual bundle size after tree-shaking
- **Side-by-side comparison** — Compare multiple packages to find the smallest
- **Search any package** — Full npm registry search
- **No server required** — All analysis happens client-side

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

## 📊 How It Works

1. Enter an npm package name
2. Fetch package metadata from npm registry
3. Analyze all dependencies recursively
4. Calculate sizes (download, unpacked, gzip)
5. Render interactive TreeMap visualization
6. Highlight heaviest dependencies

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 6
- **Visualization:** D3.js Treemap
- **Data:** npm registry API
- **Styling:** Tailwind CSS

## 📦 Build

```bash
npm run build
# Output in .next/
```

## 🎨 Features in Detail

### Treemap Visualization
- **Area = Size** — Larger boxes = larger packages
- **Color coding** — By dependency depth or size category
- **Hover details** — Exact size, version, and dependency count
- **Click to expand** — Drill into sub-dependencies

### Size Metrics
- **Download size** — What users download from npm
- **Unpacked size** — Actual disk space in node_modules
- **Gzip size** — Compressed size for web delivery
- **Tree-shaken size** — Estimated size after bundler optimization

### Comparison Mode
- Compare 2-3 packages side-by-side
- See which has smaller total footprint
- Identify which dependencies are unique to each

## 📄 License

MIT
