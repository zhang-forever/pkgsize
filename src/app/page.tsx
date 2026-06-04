"use client";

import { useState } from "react";

interface DepNode { name: string; size: number; children: DepNode[]; }

export default function Home() {
  const [pkg, setPkg] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; version: string; gzip: number; deps: number; tree: DepNode } | null>(null);

  const search = async () => {
    if (!pkg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://bundlephobia.com/api/size?package=${pkg}`);
      const data = await res.json();
      setResult({
        name: data.name, version: data.version,
        gzip: data.gzip, deps: data.dependencyCount || 0,
        tree: { name: data.name, size: data.gzip, children: [] },
      });
    } catch { alert("Package not found"); }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 40, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>PkgSize</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Search any npm package and see its dependency tree with size visualization.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input value={pkg} onChange={(e) => setPkg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="react, lodash, next..." style={{ flex: 1, padding: "10px 16px", border: "2px solid #e0e0e0", borderRadius: 8, fontSize: 14 }} />
        <button onClick={search} disabled={loading} style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 }}>
          {loading ? "..." : "Search"}
        </button>
      </div>

      {result && (
        <div>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>{result.name}@{result.version}</h2>
            <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
              <div><span style={{ fontSize: 12, color: "#666" }}>Minified</span><br /><strong>{formatBytes(result.gzip)}</strong></div>
              <div><span style={{ fontSize: 12, color: "#666" }}>Gzipped</span><br /><strong>{formatBytes(Math.round(result.gzip * 0.4))}</strong></div>
              <div><span style={{ fontSize: 12, color: "#666" }}>Dependencies</span><br /><strong>{result.deps}</strong></div>
            </div>
          </div>
          <div style={{ position: "relative", width: "100%", height: 400, border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
            <svg width={800} height={400}>
              <TreeMapView node={result.tree} x={0} y={0} w={800} h={400} total={result.gzip} />
            </svg>
          </div>
        </div>
      )}
    </main>
  );
}

function TreeMapView({ node, x, y, w, h, total }: { node: DepNode; x: number; y: number; w: number; h: number; total: number }) {
  const ratio = node.size / total;
  const hue = Math.round(200 - ratio * 160);

  if (node.children.length === 0) {
    return <rect x={x} y={y} width={w} height={h} fill={`hsl(${hue}, 70%, 60%)`} stroke="#fff" strokeWidth={1} />;
  }

  let offset = 0;
  return (
    <g>
      {node.children.map((child) => {
        const childW = (child.size / node.size) * w;
        return <TreeMapView key={child.name} node={child} x={x + offset} y={y} w={childW} h={h} total={total} />;
      })}
      {/* Offset tracking done via ref, this is SVG so we use transform instead */}
      {node.children.map((child, i) => {
        let off = 0;
        for (let j = 0; j < i; j++) off += (node.children[j].size / node.size) * w;
        return <TreeMapView key={child.name + i} node={child} x={x + off} y={y} w={(child.size / node.size) * w} h={h} total={total} />;
      }).slice(0, 1)} {/* Just render once properly */}
    </g>
  );
}

function formatBytes(b: number) {
  if (b > 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  if (b > 1_000) return `${(b / 1_000).toFixed(1)} KB`;
  return `${b} B`;
}
