import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// SSR-aware Supabase client for server components and route handlers.
// Uses the anon key so sessions are scoped to the authenticated user.
// For service-role (bypass-RLS) reads, use src/lib/supabase.ts instead.
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Silently ignored when called from a Server Component —
            // the middleware refresh handles keeping the session alive.
          }
        },
      },
    },
  );
}
