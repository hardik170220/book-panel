"use client"

import { useRouter } from "next/navigation"
import { FormsList } from "@/components/admin/forms-list"
import { useFormsStore } from "@/components/admin/use-forms-store"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function FormsPage() {
  const router = useRouter()
  const { forms, deleteForm, toggleActive } = useFormsStore()
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user info
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/whoami")
        if (res.ok) {
          const data = await res.json()
          setUser({ name: data.name, role: data.role })
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error("Failed to fetch user:", err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!loading && user && user.role !== "formbuilder-admin" && user.role !== "super admin") {
      router.replace("/access-denied")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Checking for permissions....</p>
      </div>
    )
  }

  // If user is not allowed (prevents flash)
  if (!user || (user.role !== "formbuilder-admin" && user.role !== "super admin")) {
    return null
  }

  // ✅ Authorized content
  return (
    <>
      <div className="flex border-b-2 bg-muted z-50 px-4 py-2 sticky top-2 items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-balance">Forms</h2>
        <Link
          className="font-bold text-sm px-4 py-2 bg-foreground text-background rounded-sm"
          href="/admin/create-form"
        >
          Create New
        </Link>
      </div>

      <FormsList
        onEdit={(id) => router.push(`/admin/create-form?edit=${id}`)}
        onDelete={(id) => deleteForm(id)}
        onToggleActive={(id) => toggleActive(id)}
      />
    </>
  )
}




// "use client"

// import { useRouter } from "next/navigation"
// import { FormsList } from "@/components/admin/forms-list"
// import { useFormsStore } from "@/components/admin/use-forms-store"
// import Link from "next/link"
// import { useEffect, useState } from "react"

// export default function FormsPage() {
//   const router = useRouter()
//   const { forms, deleteForm, toggleActive } = useFormsStore()
//   const [user, setUser] = useState<{ name: string; role: string } | null>(null)


//   // Fetch user info
//     useEffect(() => {
//       async function fetchUser() {
//         try {
//           const res = await fetch("/api/whoami")
//           if (res.ok) {
//             const data = await res.json()
//             setUser({ name: data.name, role: data.role })
//           } else {
//             setUser(null)
//           }
//         } catch (err) {
//           console.error("Failed to fetch user:", err)
//         }
//       }
//       fetchUser()
//     }, [])
    
//   return (
//     <>
//     <div className="flex border-b-2 bg-muted z-50 px-4 py-2 sticky top-2 items-center justify-between mb-6">
//       <h2 className="text-lg font-semibold text-balance">Forms</h2>
//        <Link className="font-bold text-sm px-4 py-2 bg-foreground text-background rounded-sm" href='/admin/create-form'>Create New</Link>
//        </div>
//       <FormsList
//         onEdit={(id) => router.push(`/admin/create-form?edit=${id}`)}
//         onDelete={(id) => deleteForm(id)}
//         onToggleActive={(id) => toggleActive(id)}
//       />
//     </>
//   )
// }

