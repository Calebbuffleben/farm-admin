# Farm Admin Dashboard

Portal de operadores da plataforma Farm (Next.js full-stack). Tem **banco
PostgreSQL próprio** (Prisma) e auth próprio — separado dos usuários de tenant
do backend. Copiado do dashboard-admin do Meet; telas de reuniões (ops, logs,
métricas, playbooks, especialistas) foram removidas.

## Telas

- `/tenants` — gestão global de tenants (criar revenda, plano, owner bootstrap)
- `/users` — diretório global de usuários e memberships
- `/invites` — convites pendentes/aceitos/expirados/revogados
- `/members` — membros por tenant
- `/billing` — planos, assinaturas Stripe e limites de assento

## Setup

```bash
CREATE DATABASE farm_dashboard_admin;
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed   # cria operador inicial
pnpm dev              # porta 3220
```

## Env

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Postgres próprio (farm_dashboard_admin) |
| `SESSION_JWT_SECRET` | assinatura do cookie `farm_admin_session` |
| `FARM_BACKEND_HTTP_BASE_URL` | API NestJS do farm/backend (proxy /platform-admin) |
| `PLATFORM_ADMIN_API_TOKEN` | token de serviço aceito pelo backend |
