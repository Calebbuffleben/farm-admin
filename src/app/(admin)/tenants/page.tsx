"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/shared/api-client";

type TenantStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
type Plan = "FREE" | "PRO" | "ENTERPRISE";
type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  createdAt: string;
  subscription: {
    plan: Plan;
    status: SubscriptionStatus;
    maxUsers: number;
    stripeSubscriptionId?: string | null;
  } | null;
  _count: {
    memberships: number;
    invitations: number;
  };
};

type TenantListResponse = {
  total: number;
  items: TenantRow[];
};

const PLANS: Plan[] = ["FREE", "PRO", "ENTERPRISE"];
const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "ACTIVE",
  "CANCELED",
  "PAST_DUE",
];

const PLAN_SEATS: Record<Plan, number> = {
  FREE: 3,
  PRO: 10,
  ENTERPRISE: 50,
};

export default function TenantsPage() {
  const [data, setData] = useState<TenantListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "">("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [billingTenant, setBillingTenant] = useState<TenantRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const payload = await apiFetch<TenantListResponse>(
        `/api/admin/tenants${suffix}`,
      );
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleSuspend(tenant: TenantRow) {
    const nextStatus: TenantStatus =
      tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const label = nextStatus === "SUSPENDED" ? "suspender" : "reativar";
    if (!window.confirm(`Confirma ${label} o tenant "${tenant.name}"?`)) return;

    setBusyId(tenant.id);
    try {
      await apiFetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Tenants
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Crie clientes, altere planos e suspenda tenants da plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
        >
          Novo tenant
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por nome ou slug..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[220px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as TenantStatus | "")
          }
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="SUSPENDED">Suspensos</option>
          <option value="DELETED">Excluídos</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600"
        >
          Atualizar
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <Panel>Carregando tenants...</Panel>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Membros</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/40">
              {(data?.items ?? []).map((tenant) => (
                <tr key={tenant.id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-100">{tenant.name}</p>
                    <p className="font-mono text-xs text-zinc-500">
                      {tenant.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {tenant.subscription ? (
                      <>
                        <span className="font-medium">
                          {tenant.subscription.plan}
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">
                          ({tenant.subscription.status.toLowerCase()})
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {tenant._count.memberships}
                    {tenant.subscription
                      ? ` / ${tenant.subscription.maxUsers}`
                      : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === tenant.id}
                        onClick={() => setBillingTenant(tenant)}
                        className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-600"
                      >
                        Plano
                      </button>
                      {tenant.status !== "DELETED" ? (
                        <button
                          type="button"
                          disabled={busyId === tenant.id}
                          onClick={() => void toggleSuspend(tenant)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            tenant.status === "ACTIVE"
                              ? "border border-amber-500/50 text-amber-200 hover:bg-amber-500/10"
                              : "border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/10"
                          }`}
                        >
                          {tenant.status === "ACTIVE"
                            ? "Suspender"
                            : "Reativar"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    Nenhum tenant encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {data ? (
            <p className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-500">
              {data.total} tenant(s) no total
            </p>
          ) : null}
        </div>
      )}

      {createOpen ? (
        <CreateTenantModal
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            await load();
          }}
        />
      ) : null}

      {billingTenant ? (
        <BillingModal
          tenant={billingTenant}
          onClose={() => setBillingTenant(null)}
          onSaved={async () => {
            setBillingTenant(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

type CreateTenantResponse = {
  ownerBootstrap: {
    mode: "membership" | "invitation";
    email: string;
    inviteToken?: string;
  };
};

function CreateTenantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [plan, setPlan] = useState<Plan>("FREE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CreateTenantResponse | null>(null);
  const [copied, setCopied] = useState(false);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<CreateTenantResponse>("/api/admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          ownerEmail: ownerEmail.trim(),
          slug: slug.trim() || undefined,
          plan,
        }),
      });
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function finish() {
    await onCreated();
    onClose();
  }

  if (success) {
    const bootstrap = success.ownerBootstrap;
    return (
      <Modal title="Tenant criado" onClose={() => void finish()}>
        <div className="space-y-4 text-sm text-zinc-300">
          {bootstrap.mode === "membership" ? (
            <p>
              <strong className="text-zinc-100">{bootstrap.email}</strong> já
              possui conta e foi vinculado como{" "}
              <strong className="text-zinc-100">OWNER</strong> do tenant.
            </p>
          ) : (
            <>
              <p>
                Convite <strong className="text-zinc-100">OWNER</strong> criado
                para <strong className="text-zinc-100">{bootstrap.email}</strong>
                . Envie o token abaixo para o owner aceitar no app (página{" "}
                <em>accept-invite</em>).
              </p>
              {bootstrap.inviteToken ? (
                <div className="space-y-2">
                  <code className="block max-h-24 overflow-auto rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs text-cyan-200">
                    {bootstrap.inviteToken}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        bootstrap.inviteToken ?? "",
                      );
                      setCopied(true);
                    }}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600"
                  >
                    {copied ? "Copiado!" : "Copiar token"}
                  </button>
                </div>
              ) : null}
            </>
          )}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => void finish()}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Novo tenant" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <Field label="Nome">
          <input
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={inputClass}
            placeholder="Acme Corp"
          />
        </Field>
        <Field label="Slug">
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputClass}
            placeholder="acme-corp"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Identificador único (minúsculas, hífens).
          </p>
        </Field>
        <Field label="E-mail do owner">
          <input
            required
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className={inputClass}
            placeholder="owner@empresa.com"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Se já tiver conta, vira OWNER imediatamente. Caso contrário, um
            convite OWNER é criado automaticamente.
          </p>
        </Field>
        <Field label="Plano inicial">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan)}
            className={inputClass}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p} — até {PLAN_SEATS[p]} usuários
              </option>
            ))}
          </select>
        </Field>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {submitting ? "Criando..." : "Criar tenant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BillingModal({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: TenantRow;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const sub = tenant.subscription;
  const [plan, setPlan] = useState<Plan>(sub?.plan ?? "FREE");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>(sub?.status ?? "ACTIVE");
  const [maxUsers, setMaxUsers] = useState(
    String(sub?.maxUsers ?? PLAN_SEATS.FREE),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [force, setForce] = useState(false);
  const stripeLinked = Boolean(tenant.subscription?.stripeSubscriptionId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/tenants/${tenant.id}/billing`, {
        method: "PATCH",
        body: JSON.stringify({
          plan,
          subscriptionStatus,
          maxUsers: Number(maxUsers),
          ...(stripeLinked ? { force } : {}),
        }),
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Plano — ${tenant.name}`} onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <Field label="Plano">
          <select
            value={plan}
            onChange={(e) => {
              const next = e.target.value as Plan;
              setPlan(next);
              setMaxUsers(String(PLAN_SEATS[next]));
            }}
            className={inputClass}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p} (padrão {PLAN_SEATS[p]} assentos)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status da assinatura">
          <select
            value={subscriptionStatus}
            onChange={(e) =>
              setSubscriptionStatus(e.target.value as SubscriptionStatus)
            }
            className={inputClass}
          >
            {SUBSCRIPTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Limite de usuários">
          <input
            type="number"
            min={PLAN_SEATS[plan]}
            max={500}
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Mínimo do plano: {PLAN_SEATS[plan]}. Membros atuais:{" "}
            {tenant._count.memberships}.
          </p>
        </Field>
        {stripeLinked ? (
          <label className="flex items-start gap-2 text-sm text-amber-200">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="mt-1"
            />
            <span>
              Forçar (sei que o Stripe pode sobrescrever). Tenant com
              assinatura Stripe.
            </span>
          </label>
        ) : null}
        <p className="text-xs text-zinc-500">
          Detalhe completo em{" "}
          <a href="/billing" className="text-cyan-300 hover:underline">
            /billing
          </a>
          .
        </p>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Salvar plano"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function StatusBadge({ status }: { status: TenantStatus }) {
  const styles: Record<TenantStatus, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-300",
    SUSPENDED: "bg-amber-500/15 text-amber-300",
    DELETED: "bg-zinc-700/50 text-zinc-400",
  };
  const labels: Record<TenantStatus, string> = {
    ACTIVE: "Ativo",
    SUSPENDED: "Suspenso",
    DELETED: "Excluído",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
