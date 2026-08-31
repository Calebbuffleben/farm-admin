"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/shared/auth-context";

export function SessionGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return <FullPageMessage title="Carregando sessão…" />;
  }
  if (status === "unauthenticated") {
    return <FullPageMessage title="Redirecionando para login…" />;
  }
  return <>{children}</>;
}

export function LoginGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <FullPageMessage title="Carregando sessão…" />;
  }
  if (status === "authenticated") {
    return <FullPageMessage title="Já autenticado, redirecionando…" />;
  }
  return <>{children}</>;
}

function FullPageMessage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-950 text-zinc-100">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/90">
        Farm Admin
      </p>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="max-w-md text-center text-sm text-zinc-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}
