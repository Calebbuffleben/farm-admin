"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/shared/api-client";

type Membership = {
  id: string;
  role: string;
  tenant: { id: string; slug: string; name: string };
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  lastLoginAt: string | null;
  memberships: Membership[];
};

type UserList = { total: number; items: UserRow[] };

export default function MembersPage() {
  const [data, setData] = useState<UserList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<UserList>("/api/admin/users?limit=200");
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = (data?.items ?? []).flatMap((user) =>
    user.memberships.length
      ? user.memberships.map((m) => ({ user, membership: m }))
      : [{ user, membership: null as Membership | null }],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Membros
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Papéis por tenant. Convite de RTV é na web da revenda
          (Configurações → Time).
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-zinc-400">Carregando membros…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Último login</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ user, membership }, i) => (
                <tr
                  key={`${user.id}-${membership?.id ?? i}`}
                  className="border-t border-zinc-800/80"
                >
                  <td className="px-4 py-3">
                    <p className="text-zinc-100">{user.name || user.email}</p>
                    <p className="font-mono text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {membership ? (
                      <>
                        {membership.tenant.name}{" "}
                        <span className="font-mono text-xs text-zinc-500">
                          {membership.tenant.slug}
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-200">
                    {membership?.role ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
