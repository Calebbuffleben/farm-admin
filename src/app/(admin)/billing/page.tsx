"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/shared/api-client";
import { useAuth } from "@/shared/auth-context";
import { StatGrid } from "@/shared/admin-data-page";

type Plan = "FREE" | "PRO" | "ENTERPRISE";
type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE";
type Source = "stripe" | "manual";

type BillingSummary = {
  mrr: number;
  pastDueCount: number;
  cancelAtPeriodEndCount: number;
  bySubscription: Array<{ plan: Plan; status: SubscriptionStatus; count: number }>;
  checkouts30d: { pending: number; completed: number; abandoned: number };
};

type SubRow = {
  tenant: { id: string; slug: string; name: string; status: string };
  plan: Plan;
  status: SubscriptionStatus;
  maxUsers: number;
  memberCount: number;
  source: Source;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
};

type CheckoutRow = {
  id: string;
  email: string;
  tenantSlug: string;
  plan: Plan;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export default function BillingPage() {
  const { session } = useAuth();
  const isSuper = session.user?.role === "SUPER_ADMIN";
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [subs, setSubs] = useState<{ total: number; items: SubRow[] } | null>(null);
  const [checkouts, setCheckouts] = useState<{ total: number; items: CheckoutRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<Plan | "">("");
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [source, setSource] = useState<Source | "">("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (plan) params.set("plan", plan);
      if (status) params.set("status", status);
      if (source) params.set("source", source);
      params.set("limit", "100");
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const [sum, list, cos] = await Promise.all([
        apiFetch<BillingSummary>("/api/admin/billing/summary"),
        apiFetch<{ total: number; items: SubRow[] }>(`/api/admin/billing/subscriptions${suffix}`),
        apiFetch<{ total: number; items: CheckoutRow[] }>("/api/admin/billing/checkouts?limit=50"),
      ]);
      setSummary(sum);
      setSubs(list);
      setCheckouts(cos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [q, plan, status, source]);

  useEffect(() => {
    void load();
  }, [load]);

  const paidActive =
    summary?.bySubscription
      .filter((r) => (r.plan === "PRO" || r.plan === "ENTERPRISE") && r.status === "ACTIVE")
      .reduce((n, r) => n + r.count, 0) ?? 0;
  const canceled =
    summary?.bySubscription
      .filter((r) => r.status === "CANCELED")
      .reduce((n, r) => n + r.count, 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Billing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Assinaturas Stripe e manuais. Mutações exigem SUPER_ADMIN.
        </p>
      </div>

      {summary ? (
        <StatGrid
          stats={[
            { label: "Ativas pagas", value: String(paidActive) },
            { label: "PAST_DUE", value: String(summary.pastDueCount) },
            { label: "Canceladas", value: String(canceled) },
            { label: "Cancelam no período", value: String(summary.cancelAtPeriodEndCount) },
            { label: "MRR estimado", value: `$${summary.mrr.toFixed(0)}` },
            { label: "Checkouts abandonados (30d)", value: String(summary.checkouts30d.abandoned) },
          ]}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar tenant"
          className={inputClass}
        />
        <select value={plan} onChange={(e) => setPlan(e.target.value as Plan | "")} className={inputClass}>
          <option value="">Todos os planos</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SubscriptionStatus | "")}
          className={inputClass}
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PAST_DUE">PAST_DUE</option>
          <option value="CANCELED">CANCELED</option>
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as Source | "")}
          className={inputClass}
        >
          <option value="">Todas origens</option>
          <option value="stripe">Stripe</option>
          <option value="manual">Manual</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
        >
          Atualizar
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assentos</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Renovação</th>
            </tr>
          </thead>
          <tbody>
            {(subs?.items ?? []).map((row) => (
              <tr
                key={row.tenant.id}
                className="cursor-pointer border-t border-zinc-800/80 hover:bg-zinc-900/40"
                onClick={() => setDetailId(row.tenant.id)}
              >
                <td className="px-4 py-3">
                  <div className="text-zinc-100">{row.tenant.name}</div>
                  <div className="font-mono text-[11px] text-zinc-500">{row.tenant.slug}</div>
                </td>
                <td className="px-4 py-3 text-zinc-200">{row.plan}</td>
                <td className="px-4 py-3">
                  <SubBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {row.memberCount}/{row.maxUsers}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${
                      row.source === "stripe"
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-zinc-700/50 text-zinc-400"
                    }`}
                  >
                    {row.source === "stripe" ? "Stripe" : "Manual"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                  {row.currentPeriodEnd
                    ? new Date(row.currentPeriodEnd).toLocaleDateString()
                    : "—"}
                  {row.cancelAtPeriodEnd ? " · cancela" : ""}
                </td>
              </tr>
            ))}
            {(subs?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Nenhuma assinatura.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium text-zinc-100">Checkouts</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criado</th>
              </tr>
            </thead>
            <tbody>
              {(checkouts?.items ?? []).map((row) => (
                <tr key={row.id} className="border-t border-zinc-800/80">
                  <td className="px-4 py-3 text-zinc-200">{row.email}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                    {row.tenantSlug}
                  </td>
                  <td className="px-4 py-3">{row.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        row.status === "ABANDONED"
                          ? "text-rose-300"
                          : row.status === "COMPLETED"
                            ? "text-emerald-300"
                            : "text-zinc-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailId ? (
        <SubscriptionDetailModal
          tenantId={detailId}
          isSuper={isSuper}
          onClose={() => setDetailId(null)}
          onChanged={() => void load()}
        />
      ) : null}
    </div>
  );
}

function SubscriptionDetailModal({
  tenantId,
  isSuper,
  onClose,
  onChanged,
}: {
  tenantId: string;
  isSuper: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      const payload = await apiFetch<Record<string, unknown>>(
        `/api/admin/billing/tenants/${tenantId}`,
      );
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sub = (data?.subscription ?? null) as {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    plan?: string;
    status?: string;
    maxUsers?: number;
    cancelAtPeriodEnd?: boolean;
  } | null;
  const tenant = data?.tenant as { name?: string; slug?: string } | undefined;
  const owner = data?.owner as { email?: string } | undefined;
  const linked = Boolean(sub?.stripeSubscriptionId);
  const timeline = (data?.timeline ?? []) as Array<{
    id: string;
    action: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;

  async function act(path: string) {
    if (!isSuper) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<Record<string, unknown>>(path, { method: "POST" });
      if (typeof result.url === "string") {
        setPortalUrl(result.url);
        await navigator.clipboard.writeText(result.url).catch(() => undefined);
      }
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-50">
          {tenant?.name ?? "Assinatura"}{" "}
          <span className="font-mono text-xs text-zinc-500">{tenant?.slug}</span>
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Owner: {owner?.email ?? "—"}</p>
        <p className="mt-1 text-sm text-zinc-300">
          {sub?.plan} · {sub?.status} · {String(data?.memberCount ?? "—")}/{sub?.maxUsers} assentos
        </p>
        <div className="mt-3 space-y-1 font-mono text-[11px] text-zinc-400">
          {sub?.stripeCustomerId ? (
            <a
              className="block text-cyan-300 hover:underline"
              href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`}
              target="_blank"
              rel="noreferrer"
            >
              customer {sub.stripeCustomerId}
            </a>
          ) : (
            <p>customer —</p>
          )}
          {sub?.stripeSubscriptionId ? (
            <a
              className="block text-cyan-300 hover:underline"
              href={`https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`}
              target="_blank"
              rel="noreferrer"
            >
              subscription {sub.stripeSubscriptionId}
            </a>
          ) : (
            <p>subscription —</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ActionBtn
            disabled={!isSuper || !linked || busy}
            label="Sincronizar com Stripe"
            onClick={() => void act(`/api/admin/billing/tenants/${tenantId}/sync`)}
          />
          {sub?.cancelAtPeriodEnd ? (
            <ActionBtn
              disabled={!isSuper || !linked || busy}
              label="Reativar"
              onClick={() => void act(`/api/admin/billing/tenants/${tenantId}/reactivate`)}
            />
          ) : (
            <ActionBtn
              disabled={!isSuper || !linked || busy}
              label="Cancelar no fim do período"
              onClick={() => {
                if (!confirmCancel) {
                  setConfirmCancel(true);
                  return;
                }
                void act(`/api/admin/billing/tenants/${tenantId}/cancel`);
              }}
            />
          )}
          <ActionBtn
            disabled={!isSuper || !linked || busy}
            label="Gerar link do portal"
            onClick={() => void act(`/api/admin/billing/tenants/${tenantId}/portal-link`)}
          />
          <Link
            href="/tenants"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300"
          >
            Editar em Tenants
          </Link>
        </div>
        {!isSuper ? (
          <p className="mt-2 text-xs text-zinc-500">Apenas SUPER_ADMIN pode alterar billing.</p>
        ) : null}
        {confirmCancel ? (
          <p className="mt-2 text-xs text-amber-200">Clique de novo para confirmar o cancelamento.</p>
        ) : null}
        {portalUrl ? (
          <p className="mt-2 break-all font-mono text-[11px] text-emerald-200">
            Portal copiado: {portalUrl}
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

        <h3 className="mt-5 text-sm font-medium text-zinc-200">Timeline</h3>
        <ul className="mt-2 max-h-48 space-y-1 overflow-auto font-mono text-[11px] text-zinc-400">
          {timeline.map((row) => (
            <li key={row.id}>
              {new Date(row.createdAt).toLocaleString()} · {row.action}
              {row.metadata?.forced ? " · forced" : ""}
            </li>
          ))}
          {timeline.length === 0 ? <li>Sem eventos.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function ActionBtn({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? "Requer SUPER_ADMIN e tenant Stripe" : undefined}
      onClick={onClick}
      className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function SubBadge({ status }: { status: SubscriptionStatus }) {
  const styles: Record<SubscriptionStatus, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-300",
    PAST_DUE: "bg-amber-500/15 text-amber-300",
    CANCELED: "bg-rose-500/15 text-rose-300",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

const inputClass =
  "rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";
