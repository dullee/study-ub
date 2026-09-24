import "server-only";
import nodemailer from "nodemailer";
import { googleMapsUrl, StudyEvent } from "@/types";
import { formatEventTime } from "@/lib/format";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
const port = Number(SMTP_PORT || 465);

// Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_PASS нь App Password.
export const mailer =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

export const EMAIL_FROM = process.env.EMAIL_FROM || `StudySpots UB <${SMTP_USER}>`;

// Эвент эхлэхээс өмнө сануулах хугацаа.
export const REMINDER_BEFORE_MS = 60 * 60 * 1000;

export async function sendEmail(to: string, email: { subject: string; html: string; text: string }) {
  if (!mailer) throw new Error("SMTP тохируулаагүй байна.");
  await mailer.sendMail({ from: EMAIL_FROM, to, ...email });
}

const TIME_ZONE = "Asia/Ulaanbaatar";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function eventDetails(event: StudyEvent, eventsUrl: string) {
  const time = formatEventTime(event.starts_at, TIME_ZONE);
  const mapsUrl =
    event.lat !== null && event.lng !== null
      ? googleMapsUrl({ lat: event.lat, lng: event.lng })
      : null;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#64748b;white-space:nowrap">${label}</td><td style="padding:4px 0;color:#0f172a">${value}</td></tr>`;

  const html = `
    <table style="border-collapse:collapse;font-size:14px">
      ${row("Хэзээ", escapeHtml(time))}
      ${row(
        "Хаана",
        escapeHtml(event.place_name) +
          (mapsUrl ? ` · <a href="${mapsUrl}" style="color:#4f46e5">Google Maps</a>` : "")
      )}
      ${row("Зохион байгуулагч", escapeHtml(event.host_name))}
    </table>
    ${
      event.description
        ? `<p style="margin:16px 0 0;color:#334155;white-space:pre-line">${escapeHtml(event.description)}</p>`
        : ""
    }
    <p style="margin:24px 0 0"><a href="${eventsUrl}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600">Эвентийг харах</a></p>`;

  const text = [
    `Хэзээ: ${time}`,
    `Хаана: ${event.place_name}${mapsUrl ? ` (${mapsUrl})` : ""}`,
    `Зохион байгуулагч: ${event.host_name}`,
    event.description ? `\n${event.description}` : "",
    `\nЭвентийг харах: ${eventsUrl}`,
  ].join("\n");

  return { html, text };
}

function layout(heading: string, intro: string, body: string) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <p style="margin:0 0 4px;color:#4f46e5;font-weight:700">StudySpots UB</p>
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a">${heading}</h1>
    <p style="margin:0 0 16px;color:#334155">${intro}</p>
    ${body}
  </div>`;
}

export function confirmationEmail(
  event: StudyEvent,
  name: string,
  eventsUrl: string,
  willRemind: boolean
) {
  const details = eventDetails(event, eventsUrl);
  const title = escapeHtml(event.title);
  const intro = `Та энэ эвентэд ирнэ гэж бүртгүүллээ.${
    willRemind ? " Эхлэхээс 1 цагийн өмнө сануулга илгээнэ." : ""
  }`;
  return {
    subject: `Бүртгэгдлээ: ${event.title}`,
    html: layout(title, `Сайн байна уу, ${escapeHtml(name)}! ${intro}`, details.html),
    text: `${event.title}\n\nСайн байна уу, ${name}! ${intro}\n\n${details.text}`,
  };
}

export function reminderEmail(event: StudyEvent, name: string, eventsUrl: string) {
  const details = eventDetails(event, eventsUrl);
  const title = escapeHtml(event.title);
  return {
    subject: `1 цагийн дараа: ${event.title}`,
    html: layout(
      `${title} удахгүй эхэлнэ`,
      `Сайн байна уу, ${escapeHtml(name)}! Таны бүртгүүлсэн эвент 1 цагийн дараа эхэлнэ.`,
      details.html
    ),
    text: `${event.title} удахгүй эхэлнэ\n\nСайн байна уу, ${name}! Таны бүртгүүлсэн эвент 1 цагийн дараа эхэлнэ.\n\n${details.text}`,
  };
}
