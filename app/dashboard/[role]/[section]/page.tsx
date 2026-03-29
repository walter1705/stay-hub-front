import { RoleDashboardScreen } from "@/components/dashboard/role-dashboard-screen"

export default async function DashboardRoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>
}) {
  const { role, section } = await params
  return <RoleDashboardScreen roleSegment={role} section={section} />
}
