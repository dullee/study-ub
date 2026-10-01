import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = { title: "Admin demo · StudySpots UB", robots: { index: false } };

// Нэвтрэлтгүй админы самбар — танилцуулгад. Жишээ өгөгдөлтэй, юу ч хадгалахгүй (components/AdminPanel.tsx-ийн demo горим).
// Жинхэнэ /admin нь Clerk-ийн админ эрхийг шалгадаг хэвээр.
export default function AdminDemoPage() {
  return <AdminPanel demo />;
}
