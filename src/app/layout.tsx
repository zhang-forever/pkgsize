import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PkgSize — npm Package Size Visualizer",
  description: "Visualize npm package sizes, compare dependencies, and find what's bloating your bundle.",
};

/** Root layout with metadata for PkgSize. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#ffffff", color: "#1e293b", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
