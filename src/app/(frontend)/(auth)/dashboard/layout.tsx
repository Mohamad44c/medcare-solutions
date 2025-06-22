import { AppSidebar } from '@/components/app-sidebar'
import SidebarHeader from '@/components/sidebar-header'
import { SidebarInset } from '@/components/ui/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar className="fixed inset-y-0 z-50 hidden md:flex" />
      <SidebarInset>
        <div className="flex-1 container py-6 w-full overflow-y-auto">
          <SidebarHeader />
          <div className="w-full p-4 flex flex-col">{children}</div>
        </div>
      </SidebarInset>
    </div>
  )
}
