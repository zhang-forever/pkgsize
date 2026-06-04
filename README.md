# PkgSize

Type an npm package name. See a TreeMap of every dependency and how much disk space it takes. Find what to cut.

## Why
`node_modules` is famously bloated. PkgSize shows you exactly which 3 packages eat 80% of your bundle.

## Tech
- Next.js API route: `npm pack` + analysis
- D3 treemap visualization
- BundlePhobia-style stats (gzip, minified, tree-shaken)
- Compare packages side-by-side

## Features (MVP)
- Search any npm package
- Treemap visualization of all dependencies
- Hover to see exact size in KB/MB
- Highlight the heaviest 3 dependencies
- Bundle size estimate for tree-shaking

## Dev
```bash
npm install
npm run dev
```
