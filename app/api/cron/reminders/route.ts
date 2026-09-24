import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { EventAttendee, StudyEvent } from "@/types";
import { mailer, REMINDER_BEFORE_MS, reminderEmail, sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Supabase pg_cron (supabase/cron-reminders.sql) 5 минут тутамд дуудна:
// 1 цагийн дотор эхлэх эвентийн бүртгэлтэй хүмүүст сануулга илгээнэ.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!mailer || !supabaseAdmin) {
    return NextResponse.json({ error: "not-configured" }, { status: 500 });
  }

  const now = Date.now();
  const { data: events, error: eventsError } = await supabaseAdmin
    .from("events")
    .select("*")
    .gt("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + REMINDER_BEFORE_MS).toISOString());
  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 });
  if (!events?.length) return NextResponse.json({ sent: 0 });

  const eventsById = new Map((events as StudyEvent[]).map((event) => [event.id, event]));
  const { data: pending } = await supabaseAdmin
    .from("event_attendees")
    .select("*")
    .in("event_id", [...eventsById.keys()])
    .is("reminder_sent_at", null);

  // Эхлэхэд 1 цаг хүрэхгүй үлдсэн үед бүртгүүлсэн хүмүүс баталгаажуулах имэйлдээ сануулга амлагдаагүй.
  const due = ((pending ?? []) as EventAttendee[]).filter((attendee) => {
    const event = eventsById.get(attendee.event_id);
    return (
      event &&
      attendee.user_id &&
      new Date(attendee.created_at).getTime() <=
        new Date(event.starts_at).getTime() - REMINDER_BEFORE_MS
    );
  });
  if (due.length === 0) return NextResponse.json({ sent: 0 });

  // Эхлээд "илгээсэн" гэж тэмдэглэнэ — давхцсан дуудлага нэг хүнд хоёр удаа илгээхгүй.
  const { data: claimed } = await supabaseAdmin
    .from("event_attendees")
    .update({ reminder_sent_at: new Date(now).toISOString() })
    .in("id", due.map((attendee) => attendee.id))
    .is("reminder_sent_at", null)
    .select("*");
  const claimedRows = (claimed ?? []) as EventAttendee[];
  if (claimedRows.length === 0) return NextResponse.json({ sent: 0 });

  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({
    userId: [...new Set(claimedRows.map((attendee) => attendee.user_id as string))],
    limit: 500,
  });
  const emailByUser = new Map(
    users.map((user) => [user.id, user.primaryEmailAddress?.emailAddress])
  );

  const eventsUrl = `${request.nextUrl.origin}/events`;
  let sent = 0;
  const failed: number[] = [];
  for (const attendee of claimedRows) {
    const to = emailByUser.get(attendee.user_id as string);
    const event = eventsById.get(attendee.event_id) as StudyEvent;
    if (!to) continue;
    try {
      await sendEmail(to, reminderEmail(event, attendee.name, eventsUrl));
      sent++;
    } catch (error) {
      console.error("SMTP reminder:", error instanceof Error ? error.message : error);
      failed.push(attendee.id);
    }
  }
  // Амжилтгүй болсныг дараагийн удаа дахин оролдоно.
  if (failed.length > 0) {
    await supabaseAdmin.from("event_attendees").update({ reminder_sent_at: null }).in("id", failed);
  }
  return NextResponse.json({ sent, failed: failed.length });
}
