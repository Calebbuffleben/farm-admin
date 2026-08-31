"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "@/shared/api-client";

export function AdminDataPage({
  title,
  description,
  endpoint,
  renderSummary,
}: {
  title: string;
  description: string;
  endpoint: string;
  renderSummary?: (data: unknown) => ReactNode;
}) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch<unknown>(endpoint)
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>

      {loading ? (
        <Panel>Carregando...</Panel>
      ) : error ? (
        <Panel tone="error">{error}</Panel>
      ) : (
        <>
          {renderSummary ? renderSummary(data) : null}
          <pre className="max-h-[70vh] overflow-auto rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-xs text-zinc-300">
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}

export function StatGrid({ stats }: { stats: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function Panel({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-400"
      }`}
    >
      {children}
    </div>
  );
}
