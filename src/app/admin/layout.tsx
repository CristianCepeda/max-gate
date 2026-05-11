import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware handles unauthenticated redirects, but guard here too for safety.
  if (!user) redirect("/admin/login");

  async function logout() {
    "use server";
    const client = await createAuthClient();
    await client.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-white text-sm tracking-wide">
            MaxGate Admin
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
