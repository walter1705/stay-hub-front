import { RoleDashboardScreen } from "@/components/dashboard/role-dashboard-screen"

export default async function DashboardRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  return <RoleDashboardScreen roleSegment={role} />
}
