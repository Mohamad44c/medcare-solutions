'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset } from '@/components/ui/sidebar'
import SidebarHeader from '@/components/sidebar-header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar className="w-64 border-r" />
      <SidebarInset>
        <SidebarHeader />
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </div>
  )
}
