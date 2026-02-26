/**
 * app/(protected)/dashboard/page.tsx
 * Dashboard — placeholder page for future features.
 * Protected by middleware (must be authenticated).
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export const metadata = {
  title: "Dashboard — Virtue Box",
};

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-primary/10 p-3">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Dashboard will be implemented in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
