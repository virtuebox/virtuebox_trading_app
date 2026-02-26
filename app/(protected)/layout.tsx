/**
 * app/(protected)/layout.tsx
 * Shared layout for all authenticated pages (/dashboard, /partners).
 * Renders the TopNav above page content.
 */

import TopNav from "@/components/layout/TopNav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
