"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
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
  ChevronLeft,
  ChevronRight,
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
  const [isCollapsed, setIsCollapsed] = useState(true)
  
  const { data: session, status } = useSession()
  const user = session?.user

  useEffect(() => {
    if (status === "authenticated" && user?.role === "submission-admin") {
      if (!pathname.startsWith("/admin/bookorder")) {
        router.replace("/admin/bookorder")
      }
    }
  }, [user, pathname, router, status])

  useEffect(() => {
  console.log("Session status:", status)
  console.log("User role:", session?.user?.role)
  console.log("Current path:", pathname)
}, [status, session, pathname])

  const allItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="h-4 w-4" />,
      match: (p: string) => p.startsWith("/admin/dashboard"),
      roles: ["formbuilder-admin", "super admin"],
    },
    {
      href: "/admin/forms",
      label: "Forms",
      icon: <ListChecks className="h-4 w-4" />,
      match: (p: string) =>
        p.startsWith("/admin/forms") || p.startsWith("/admin/create-form"),
      roles: ["formbuilder-admin", "super admin"],
    },
    {
      href: "/admin/bookorder",
      label: "Submissions",
      icon: <ListOrdered className="h-4 w-4" />,
      match: (p: string) => p.startsWith("/admin/bookorder"),
      roles: ["submission-admin", "super admin"],
    },
  ]

  const visibleItems = user?.role
    ? allItems.filter((item) => item.roles.includes(user.role))
    : []

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      localStorage.removeItem("admin-ui-forms")
      await signOut({ redirect: false })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const currentTheme = (theme as "light" | "dark" | "system") || "system"

  if (status === "loading") {
    return (
      <aside className="md:sticky md:top-0 h-dvh md:h-[100dvh] w-64 flex flex-col border-r bg-background overflow-y-auto transition-all duration-300">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside 
      className={cn(
        "md:sticky md:top-0 font-poppins h-dvh md:h-[100dvh] flex flex-col border-r bg-background overflow-y-auto transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
      style={{overflow:"visible"}}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[50%] z-50 h-6 w-6 rounded-full border bg-foreground shadow-md  transition-colors flex items-center justify-center"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 text-background w-4" />
        ) : (
          <ChevronLeft className="h-4 text-background w-4" />
        )}
      </button>

      <div className={cn("px-4 py-4", isCollapsed && "px-2")}>
        {!isCollapsed ? (
          <>
            <div className="text-xl font-semibold">AP Form</div>
            {/* <p className="text-sm text-muted-foreground">Manage forms & data</p> */}
          </>
        ) : (
          <div className="flex justify-center">
            <img src="/logo.png" className="h-10" alt="" />
          </div>
        )}
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
                      : "hover:bg-muted",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}

          {user && visibleItems.length === 0 && !isCollapsed && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              You don't have access to any admin sections.
            </div>
          )}
        </ul>
      </nav>

      <div className="border-t p-3 grid gap-3">
        {/* Theme picker */}
        {!isCollapsed ? (
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
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const themes = ["light", "dark", "system"]
                const currentIndex = themes.indexOf(currentTheme)
                const nextTheme = themes[(currentIndex + 1) % themes.length]
                setTheme(nextTheme)
              }}
              title="Toggle theme"
            >
              {currentTheme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : currentTheme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Laptop className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* User info */}
        {user && (
          <div className={cn(
            "flex items-center bg-secondary rounded-md",
            isCollapsed ? "justify-center p-2" : "px-4"
          )}>
            <div className="bg-muted rounded-full">
              <CircleUser color="gray" size={isCollapsed ? 28 : 34} />
            </div>
            {!isCollapsed && (
              <div className="p-3 text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full flex items-center gap-2 bg-transparent",
                isCollapsed && "px-2"
              )}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && "Logout"}
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