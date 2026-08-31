import { AdminDataPage } from "@/shared/admin-data-page";

export default function UsersPage() {
  return (
    <AdminDataPage
      title="Usuários"
      description="Diretório global de usuários e memberships por tenant."
      endpoint="/api/admin/users"
    />
  );
}
