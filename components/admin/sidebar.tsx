"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type React from "react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  ListChecks,
  Sun,
  Moon,
  Laptop,
  LayoutDashboardIcon,
  CircleUser,
  ListOrdered,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

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
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
  if (user?.role === "submission-admin") {
    if (!pathname.startsWith("/bookorder")) {
      router.replace("/bookorder")
    }
  }
}, [user, pathname, router])

  const allItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="h-4 w-4" />,
      match: (p: string) => p.startsWith("/admin/dashboard"),
      roles: ["formbuilder-admin", "super admin"], // ✅ allowed roles
    },
    {
      href: "/admin/forms",
      label: "Forms",
      icon: <ListChecks className="h-4 w-4" />,
      match: (p: string) =>
        p.startsWith("/admin/forms") || p.startsWith("/admin/create-form"),
      roles: ["formbuilder-admin", "super admin"], // ✅ allowed roles
    },
    {
      href: "/bookorder",
      label: "Submissions",
      icon: <ListOrdered className="h-4 w-4" />,
      match: (p: string) => p.startsWith("/bookorder"),
      roles: ["submission-admin", "super admin"], // ✅ allowed roles
    },
  ]

  // Filter visible items by role
  const visibleItems = user
    ? allItems.filter((item) => item.roles.includes(user.role))
    : []

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      localStorage.removeItem("admin-ui-forms")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const currentTheme = (theme as "light" | "dark" | "system") || "system"

  return (
    <aside className="md:sticky md:top-0 h-dvh md:h-[100dvh] w-64 flex flex-col border-r bg-background overflow-y-auto">
      <div className="px-4 py-4">
        <div className="text-xl font-semibold">AP Form</div>
        <p className="text-sm text-muted-foreground">Manage forms & data</p>
      </div>

      <nav className="flex-1 px-2">
        <ul className="grid gap-1">
          {visibleItems.map((item) => {
            const active = item.match(pathname || "")
            return (
              <li key={item.href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}

          {/* Show message if user has no access */}
          {user && visibleItems.length === 0 && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              You don’t have access to any admin sections.
            </div>
          )}
        </ul>
      </nav>

      <div className="border-t p-3 grid gap-3">
        {/* Theme picker */}
        <div className="grid gap-1">
          <div className="text-xs text-muted-foreground">Theme</div>
          <Select value={currentTheme} onValueChange={(v) => setTheme(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" /> Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" /> Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" /> System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User info */}
        {user && (
          <div className="flex px-4 items-center bg-secondary">
            <div className="bg-muted rounded-full">
              <CircleUser color="gray" size={34} />
            </div>
            <div className="p-3 rounded-md text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be logged out of your account and redirected to the home page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  )
}
