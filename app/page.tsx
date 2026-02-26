/**
 * app/page.tsx
 * Root route — redirect to /dashboard.
 * The middleware will redirect to /login if not authenticated.
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
