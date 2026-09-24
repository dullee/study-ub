import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import AdminPanel from "@/components/AdminPanel";
import { getDictionary } from "@/lib/i18n/server";

// Админ эрх: Clerk Dashboard → Users → хэрэглэгч → Public metadata: { "role": "admin" }.
export default async function AdminPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  if (sessionClaims?.metadata?.role !== "admin") {
    const t = await getDictionary();
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-3 text-center">
          <h1 className="text-lg font-bold">{t.accessDenied}</h1>
          <p className="text-sm text-slate-400">{t.adminOnly}</p>
          <Link href="/" className="inline-block text-xs text-indigo-300 hover:text-white">
            {t.home}
          </Link>
        </div>
      </main>
    );
  }

  return <AdminPanel />;
}
