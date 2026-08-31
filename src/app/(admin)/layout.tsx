"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminGate } from "@/shared/admin-gate";
import { useAuth } from "@/shared/auth-context";
import { SessionGate } from "@/shared/session-gate";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/tenants", label: "Tenants" },
  { href: "/users", label: "Usuários" },
  { href: "/invites", label: "Convites" },
  { href: "/members", label: "Membros" },
  { href: "/billing", label: "Billing" },
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <AdminGate>
        <AdminShell>{children}</AdminShell>
      </AdminGate>
    </SessionGate>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const role = session.user?.role ?? "—";
  const displayName = session.user?.name ?? session.user?.email ?? "—";
  const email = session.user?.email ?? "—";

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900/40">
        <div className="border-b border-zinc-800/80 px-4 py-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-400/95">
            Meet Admin
          </p>
          <p className="mt-1 truncate text-sm font-medium text-zinc-200">
            {displayName}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-cyan-500/15 text-cyan-100"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-900/30 px-6 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-zinc-300">{email}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {role}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Sair
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
