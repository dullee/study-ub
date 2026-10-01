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
      <main className="min-h-screen bg-sheet text-ink flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-panel border border-line rounded-md p-6 space-y-3 text-center">
          <h1 className="text-lg font-bold">{t.accessDenied}</h1>
          <p className="text-sm text-ink-muted">{t.adminOnly}</p>
          <Link href="/admin/demo" className="block text-sm font-semibold text-sun-deep hover:text-sun-deep">
            {t.tryAdminDemo}
          </Link>
          <Link href="/" className="inline-block text-xs text-link hover:text-ink">
            {t.home}
          </Link>
        </div>
      </main>
    );
  }

  return <AdminPanel />;
}
