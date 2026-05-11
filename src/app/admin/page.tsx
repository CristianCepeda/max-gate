import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import type { Business } from "@/types/business";

function getRouterStatus(lastSeenAt: string | null): {
  label: string;
  color: string;
} {
  if (!lastSeenAt) return { label: "Never Connected", color: "zinc" };
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 5 * 60 * 1000) return { label: "Connected", color: "green" };
  return { label: "Disconnected", color: "zinc" };
}

function RouterCard({ business }: { business: Business }) {
  const status = getRouterStatus(business.last_seen_at);
  const isConnected = status.color === "green";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-white font-semibold text-base truncate">
            {business.name}
          </h2>
          {business.address && (
            <p className="text-zinc-400 text-sm mt-0.5 truncate">
              {business.address}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isConnected
              ? "bg-green-500/15 text-green-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-green-400" : "bg-zinc-500"
            }`}
          />
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-300">
          <svg
            className="w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <span className="text-sm">
            <span className="font-semibold text-white">
              {business.total_connections.toLocaleString()}
            </span>{" "}
            <span className="text-zinc-500">
              {business.total_connections === 1 ? "connection" : "connections"}
            </span>
          </span>
        </div>

        <span className="text-xs text-zinc-600 font-mono">{business.slug}</span>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // Use the service-role client to bypass RLS, then filter by owner_id in code.
  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: businesses } = await serviceRole
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("name");

  const routers: Business[] = (businesses ?? []) as Business[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Your Routers</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Monitor connection status and activity across all your locations.
        </p>
      </div>

      {routers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-zinc-400 text-sm">No routers found.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Contact support to link your routers to this account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routers.map((router) => (
            <RouterCard key={router.id} business={router} />
          ))}
        </div>
      )}
    </div>
  );
}
