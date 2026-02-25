import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function UptimePage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; password?: string }>;
}) {
  const params = await searchParams;
  console.log('[Root Page] searchParams:', params);
  
  // Check for URL-based auto-login credentials
  if (params.username && params.password) {
    console.log('[Root Page] Auto-login credentials detected, redirecting to login page');
    const loginUrl = `/login?autoUsername=${encodeURIComponent(params.username)}&autoPassword=${encodeURIComponent(params.password)}&redirect=/overview`;
    redirect(loginUrl);
  }
  
  const user = await getCurrentUser();

  if (!user) {
    console.log('[Root Page] No user found, redirecting to login');
    redirect("/login");
  }

  console.log('[Root Page] User authenticated:', user.username);
  
  // Redirect to overview page as the main dashboard
  redirect("/overview");
}
