import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { EventAttendee, StudyEvent } from "@/types";
import { confirmationEmail, mailer, REMINDER_BEFORE_MS, sendEmail } from "@/lib/email";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// "Би ирнэ" дарсны дараа баталгаажуулах имэйл илгээнэ. Сануулгыг /api/cron/reminders илгээнэ.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/events/[id]/rsvp">) {
  if (!mailer) return NextResponse.json({ sent: false, reason: "email-not-configured" });
  const { userId, getToken } = await auth();
  if (!userId || !url || !anonKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const token = await getToken();
  const supabase = createClient(url, anonKey, { accessToken: async () => token });
  const eventId = Number((await ctx.params).id);

  const [{ data: event }, { data: attendee }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase
      .from("event_attendees")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (!event || !attendee) return NextResponse.json({ error: "not-attending" }, { status: 404 });

  const user = await currentUser();
  const to = user?.primaryEmailAddress?.emailAddress;
  if (!to) return NextResponse.json({ sent: false, reason: "no-email" });

  const startsAt = new Date((event as StudyEvent).starts_at).getTime();
  // Эхлэхэд 1 цаг хүрэхгүй үлдсэн үед бүртгүүлсэн бол сануулга илгээхгүй.
  const willRemind = startsAt - REMINDER_BEFORE_MS > Date.now();
  try {
    await sendEmail(
      to,
      confirmationEmail(
        event as StudyEvent,
        (attendee as EventAttendee).name,
        `${request.nextUrl.origin}/events`,
        willRemind
      )
    );
  } catch (error) {
    console.error("SMTP confirmation:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "send-failed" }, { status: 502 });
  }
  return NextResponse.json({ sent: true, reminder: willRemind });
}
