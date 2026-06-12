"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DepNode {
  name: string;
  size: number;
  children: DepNode[];
}

interface PkgResult {
  name: string;
  version: string;
  gzip: number;
  minified: number;
  deps: number;
  tree: DepNode;
  repo?: string;
}

interface HistoryEntry {
  name: string;
  version: string;
  gzip: number;
  timestamp: number;
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
  "#84cc16", "#e11d48", "#0ea5e9", "#a855f7", "#22c55e",
];

function colorForDep(name: string, depth: number): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash + depth) % COLORS.length];
}

function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, r + amount);
  const ng = Math.min(255, g + amount);
  const nb = Math.min(255, b + amount);
  return `rgb(${nr},${ng},${nb})`;
}

function formatBytes(b: number) {
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  if (b >= 1_000) return `${(b / 1_000).toFixed(1)} KB`;
  return `${b} B`;
}

// Squarified treemap layout
interface Rect { x: number; y: number; w: number; h: number; node: DepNode; }

function squarify(items: DepNode[], rect: { x: number; y: number; w: number; h: number }): Rect[] {
  if (items.length === 0) return [];
  const total = items.reduce((s, d) => s + d.size, 0);
  if (total === 0) return items.map(d => ({ ...rect, node: d }));

  const sorted = [...items].sort((a, b) => b.size - a.size);
  const results: Rect[] = [];

  let remaining = { ...rect };
  for (const item of sorted) {
    const frac = item.size / total;
    const isWide = remaining.w >= remaining.h;
    if (isWide) {
      const w = remaining.w * frac;
      results.push({ x: remaining.x, y: remaining.y, w, h: remaining.h, node: item });
      remaining = { x: remaining.x + w, y: remaining.y, w: remaining.w - w, h: remaining.h };
    } else {
      const h = remaining.h * frac;
      results.push({ x: remaining.x, y: remaining.y, w: remaining.w, h, node: item });
      remaining = { x: remaining.x, y: remaining.y + h, w: remaining.w, h: remaining.h - h };
    }
  }
  return results;
}

export default function Home() {
  const [pkg, setPkg] = useState("");
  const [comparePkg, setComparePkg] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PkgResult | null>(null);
  const [compareResult, setCompareResult] = useState<PkgResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const [readme, setReadme] = useState("");
  const [error, setError] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);

  useEffect(() => {
    const saved = localStorage.getItem("pkgsize_history");
    if (saved) setHistory(JSON.parse(saved));
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setSvgWidth(Math.round(w));
    });
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement);
    return () => obs.disconnect();
  }, []);

  const saveToHistory = (r: PkgResult) => {
    const entry: HistoryEntry = { name: r.name, version: r.version, gzip: r.gzip, timestamp: Date.now() };
    setHistory(prev => {
      const next = [entry, ...prev.filter(h => h.name !== r.name || h.version !== r.version)].slice(0, 50);
      localStorage.setItem("pkgsize_history", JSON.stringify(next));
      return next;
    });
  };

  const fetchPkg = useCallback(async (name: string): Promise<PkgResult | null> => {
    const res = await fetch(`https://bundlephobia.com/api/size?package=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`Package "${name}" not found`);
    const data = await res.json();
    const tree: DepNode = {
      name: data.name,
      size: data.gzip,
      children: (data.dependencies || []).map((d: any) => ({
        name: d.name, size: d.gzip, children: []
      })),
    };
    return {
      name: data.name, version: data.version, gzip: data.gzip,
      minified: data.size || 0, deps: data.dependencyCount || 0,
      tree, repo: data.repository,
    };
  }, []);

  const fetchReadme = useCallback(async (name: string) => {
    try {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
      const data = await res.json();
      const readme = data.readme || "";
      setReadme(readme.slice(0, 5000));
      setShowReadme(true);
    } catch { setReadme("Could not load README."); setShowReadme(true); }
  }, []);

  const search = async () => {
    if (!pkg.trim()) return;
    setLoading(true); setError(""); setCompareResult(null); setShowReadme(false);
    try {
      const r = await fetchPkg(pkg);
      if (r) { setResult(r); saveToHistory(r); }
    } catch (e: any) { setError(e.message); setResult(null); }
    setLoading(false);
  };

  const searchCompare = async () => {
    if (!comparePkg.trim()) return;
    setLoading(true); setError("");
    try {
      const r = await fetchPkg(comparePkg);
      if (r) setCompareResult(r);
    } catch (e: any) { setError(e.message); setCompareResult(null); }
    setLoading(false);
  };

  const svgHeight = 400;
  const barHeight = 200;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>📦 PkgSize</h1>
      <p style={{ color: "#666", marginTop: 8, marginBottom: 28 }}>
        Visualize npm package sizes and compare dependencies. Find what&apos;s bloating your bundle.
      </p>

      {/* Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input value={pkg} onChange={e => setPkg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="e.g. react, lodash, next..."
          style={{ flex: 1, padding: "10px 16px", border: "2px solid #e0e0e0", borderRadius: 8, fontSize: 14 }} />
        <button onClick={search} disabled={loading}
          style={{ padding: "10px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
          {loading ? "⏳" : "Search"}
        </button>
      </div>

      {/* Compare */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={comparePkg} onChange={e => setComparePkg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && searchCompare()}
          placeholder="Compare with another package..."
          style={{ flex: 1, padding: "8px 14px", border: "1px solid #d0d0d0", borderRadius: 8, fontSize: 13 }} />
        <button onClick={searchCompare} disabled={loading}
          style={{ padding: "8px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: loading ? "wait" : "pointer" }}>
          Compare
        </button>
        <button onClick={() => setShowHistory(!showHistory)}
          style={{ padding: "8px 18px", background: showHistory ? "#1e293b" : "#f1f5f9", color: showHistory ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
          🕘 History
        </button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 20, color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>}

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 20, maxHeight: 200, overflowY: "auto" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Recent searches</h3>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" }}
              onClick={() => { setPkg(h.name); setShowHistory(false); }}>
              <span>{h.name}@{h.version}</span>
              <span style={{ color: "#666" }}>{formatBytes(h.gzip)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main result */}
      {result && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{result.name}@{result.version}</h2>
            <button onClick={() => fetchReadme(result.name)}
              style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
              📄 README
            </button>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
            <Stat label="Gzip" value={formatBytes(result.gzip)} color="#3b82f6" />
            <Stat label="Minified" value={formatBytes(result.minified)} color="#10b981" />
            <Stat label="Dependencies" value={`${result.deps}`} color="#f59e0b" />
            {compareResult && (
              <Stat label={`vs ${compareResult.name}`}
                value={result.gzip < compareResult.gzip ? `${formatBytes(compareResult.gzip - result.gzip)} smaller` : `${formatBytes(result.gzip - compareResult.gzip)} larger`}
                color={result.gzip < compareResult.gzip ? "#10b981" : "#ef4444"} />
            )}
          </div>

          {/* Treemap */}
          <div style={{ position: "relative", width: "100%", height: svgHeight, border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden", background: "#f8fafc" }}>
            <svg ref={svgRef} width={svgWidth} height={svgHeight}>
              {result.tree.children.length > 0
                ? squarify(result.tree.children, { x: 0, y: 0, w: svgWidth, h: svgHeight }).map((r, i) => (
                  <g key={i}>
                    <rect x={r.x} y={r.y} width={r.w} height={r.h}
                      fill={lightenColor(colorForDep(r.node.name, i), 30)}
                      stroke="#fff" strokeWidth={1} rx={2}
                      style={{ transition: "opacity 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")} />
                    {r.w > 40 && r.h > 20 && (
                      <text x={r.x + 6} y={r.y + 16} fontSize={11} fontWeight={600} fill="#1e293b"
                        style={{ pointerEvents: "none" }}>
                        {r.node.name}
                      </text>
                    )}
                    {r.w > 50 && r.h > 32 && (
                      <text x={r.x + 6} y={r.y + 30} fontSize={10} fill="#64748b"
                        style={{ pointerEvents: "none" }}>
                        {formatBytes(r.node.size)}
                      </text>
                    )}
                  </g>
                ))
                : <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="#94a3b8" fontSize={14}>No dependency data available</text>
              }
            </svg>
          </div>

          {/* Dependency list */}
          {result.tree.children.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>Top dependencies by size</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {result.tree.children.sort((a, b) => b.size - a.size).slice(0, 10).map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: colorForDep(d.name, i), flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{d.name}</span>
                    <span style={{ color: "#666", minWidth: 60, textAlign: "right" }}>{formatBytes(d.size)}</span>
                    <div style={{ width: 80, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${(d.size / result.tree.size) * 100}%`, height: "100%", background: colorForDep(d.name, i), borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison panel */}
          {compareResult && (
            <div style={{ marginTop: 24, background: "#f8fafc", borderRadius: 8, padding: 20, border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 12px" }}>📊 Comparison: {result.name} vs {compareResult.name}</h3>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: 6 }}></th>
                    <th style={{ textAlign: "right", padding: 6 }}>{result.name}</th>
                    <th style={{ textAlign: "right", padding: 6 }}>{compareResult.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: 6 }}>Version</td><td style={{ textAlign: "right", padding: 6 }}>{result.version}</td><td style={{ textAlign: "right", padding: 6 }}>{compareResult.version}</td></tr>
                  <tr><td style={{ padding: 6 }}>Gzip</td><td style={{ textAlign: "right", padding: 6 }}>{formatBytes(result.gzip)}</td><td style={{ textAlign: "right", padding: 6 }}>{formatBytes(compareResult.gzip)}</td></tr>
                  <tr><td style={{ padding: 6 }}>Minified</td><td style={{ textAlign: "right", padding: 6 }}>{formatBytes(result.minified)}</td><td style={{ textAlign: "right", padding: 6 }}>{formatBytes(compareResult.minified)}</td></tr>
                  <tr><td style={{ padding: 6 }}>Dependencies</td><td style={{ textAlign: "right", padding: 6 }}>{result.deps}</td><td style={{ textAlign: "right", padding: 6 }}>{compareResult.deps}</td></tr>
                </tbody>
              </table>
              {/* Size bar comparison */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ width: 120 }}>{result.name}</span>
                  <div style={{ flex: 1, height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (result.gzip / Math.max(result.gzip, compareResult.gzip)) * 100)}%`, height: "100%", background: "#3b82f6", borderRadius: 6 }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 120 }}>{compareResult.name}</span>
                  <div style={{ flex: 1, height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (compareResult.gzip / Math.max(result.gzip, compareResult.gzip)) * 100)}%`, height: "100%", background: "#6366f1", borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* README preview */}
          {showReadme && (
            <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, maxHeight: 400, overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>📄 README</h3>
                <button onClick={() => setShowReadme(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12, color: "#334155", lineHeight: 1.6, margin: 0 }}>{readme}</pre>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <p style={{ fontSize: 16 }}>Search an npm package to visualize its size</p>
          <p style={{ fontSize: 13 }}>Try: <strong>react</strong>, <strong>lodash</strong>, <strong>next</strong>, <strong>vue</strong></p>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px", minWidth: 100 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}
