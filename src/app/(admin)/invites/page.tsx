import { AdminDataPage } from "@/shared/admin-data-page";

export default function InvitesPage() {
  return (
    <AdminDataPage
      title="Convites"
      description="Convites globais filtráveis por tenant, e-mail e status."
      endpoint="/api/admin/invites"
    />
  );
}
