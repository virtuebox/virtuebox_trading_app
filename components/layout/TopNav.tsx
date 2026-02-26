"use client";

/**
 * components/layout/TopNav.tsx
 * Top navigation bar with profile dropdown.
 * Fetches the current user from /api/auth/me and conditionally shows admin links.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ChevronDown, LogOut, Users, LayoutDashboard } from "lucide-react";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.user && setUser(data.user))
      .catch(() => null);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">
            Virtue Box
          </span>
          <Badge variant="secondary" className="text-xs font-medium">
            Gold Trading
          </Badge>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.name ?? "Account"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{user?.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground font-normal truncate">
                  {user?.email ?? "—"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push("/dashboard")}
              className="cursor-pointer gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </DropdownMenuItem>

            {/* Partner Management — visible only to ADMIN */}
            {user?.role === "ADMIN" && (
              <DropdownMenuItem
                onClick={() => router.push("/partners")}
                className="cursor-pointer gap-2"
              >
                <Users className="h-4 w-4" />
                Partner Management
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
