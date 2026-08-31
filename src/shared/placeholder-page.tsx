import Link from "next/link";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        {title}
      </h1>
      <p className="text-sm text-zinc-400">{description}</p>
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-5 py-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          Em breve
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Esta seção será implementada na próxima fase (paridade com o desktop
          app).
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-cyan-400/90 hover:text-cyan-300"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
