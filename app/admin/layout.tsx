import type { ReactNode } from "react"
import { Sidebar } from "@/components/admin/sidebar"
import SessionProvider from "@/components/SessionProvider"
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {

  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <SessionProvider>
    <div className="flex over min-h-dvh">
      <Sidebar />
      <main className="flex-1">
        {/* <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <h1 className="text-base font-semibold">Admin</h1>
          </div>
        </header> */}
        <section className="mx-auto px-4">{children}</section>
      </main>
    </div>
    </SessionProvider>
  )
}
