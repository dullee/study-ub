import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import AdminPanel from "@/components/AdminPanel";

// Админ эрх: Clerk Dashboard → Users → хэрэглэгч → Public metadata: { "role": "admin" }.
export default async function AdminPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  if (sessionClaims?.metadata?.role !== "admin") {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-3 text-center">
          <h1 className="text-lg font-bold">Хандах эрхгүй</h1>
          <p className="text-sm text-slate-400">Энэ хуудас зөвхөн админд зориулагдсан.</p>
          <Link href="/" className="inline-block text-xs text-indigo-300 hover:text-white">
            Нүүр хуудас
          </Link>
        </div>
      </main>
    );
  }

  return <AdminPanel />;
}
