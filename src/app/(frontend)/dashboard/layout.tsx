import { AppSidebar } from '@/components/app-sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar className="fixed inset-y-0 z-50 hidden md:flex" />
      <main className="flex-1 md:pl-64">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  )
}
