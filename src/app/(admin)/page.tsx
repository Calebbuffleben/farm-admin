"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMe } from "@/shared/api-client";
import type { SessionSnapshot } from "@/types/auth";
import { useAuth } from "@/shared/auth-context";

const QUICK_LINKS = [
  {
    href: "/tenants",
    title: "Tenants",
    description: "Gestão global de tenants e status.",
  },
  {
    href: "/users",
    title: "Usuários",
    description: "Diretório global de usuários e memberships.",
  },
  {
    href: "/invites",
    title: "Convites",
    description: "Convites pendentes, aceitos, expirados e revogados.",
  },
  {
    href: "/members",
    title: "Membros",
    description: "Membros e papéis por tenant.",
  },
  {
    href: "/billing",
    title: "Billing",
    description: "Planos, assinaturas Stripe e limites de assento.",
  },
] as const;

export default function AdminHomePage() {
  const { session } = useAuth();
  const [me, setMe] = useState<SessionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMe()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const user = me?.user ?? session.user;
  const role = user?.role ?? "—";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Painel de operadores da plataforma Farm (auth próprio, Prisma).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Carregando perfil…</p>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Operador
          </h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Nome</dt>
              <dd className="font-medium text-zinc-100">
                {user?.name ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">E-mail</dt>
              <dd className="text-zinc-100">{user?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Papel</dt>
              <dd className="font-mono text-cyan-300/90">{role}</dd>
            </div>
          </dl>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Áreas
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-cyan-500/30 hover:bg-zinc-900/70"
              >
                <span className="font-medium text-zinc-100">{item.title}</span>
                <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
