import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-bg">
      <main className="flex-1 overflow-y-auto mobile-scroll pb-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
