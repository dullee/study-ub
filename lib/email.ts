import "server-only";
import nodemailer from "nodemailer";
import { googleMapsUrl, StudyEvent } from "@/types";
import { formatEventTime } from "@/lib/format";
import { Locale } from "@/lib/i18n/dictionaries";
import { chatPlatform, normalizeChatUrl } from "@/lib/chatLinks";
import { telHref } from "@/lib/phone";

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

// Имэйлийн бичвэр хэлээр. Хэрэглэгчийн хэлийг бүртгүүлэх үед event_attendees.locale-д хадгална.
const EMAIL_TEXT = {
  mn: {
    when: "Хэзээ",
    where: "Хаана",
    host: "Зохион байгуулагч",
    phone: "Утас",
    groupChat: "Групп чат",
    chatLabel: (app: string | null) => (app ? `${app} групп` : "Групп чат руу нэгдэх"),
    viewEvent: "Эвентийг харах",
    greeting: (name: string) => `Сайн байна уу, ${name}!`,
    registered: "Та энэ эвентэд ирнэ гэж бүртгүүллээ.",
    willRemind: "Эхлэхээс 1 цагийн өмнө сануулга илгээнэ.",
    confirmSubject: (title: string) => `Бүртгэгдлээ: ${title}`,
    reminderSubject: (title: string) => `1 цагийн дараа: ${title}`,
    reminderHeading: (title: string) => `${title} удахгүй эхэлнэ`,
    reminderIntro: "Таны бүртгүүлсэн эвент 1 цагийн дараа эхэлнэ.",
  },
  en: {
    when: "When",
    where: "Where",
    host: "Host",
    phone: "Phone",
    groupChat: "Group chat",
    chatLabel: (app: string | null) => (app ? `${app} group` : "Join the group chat"),
    viewEvent: "View event",
    greeting: (name: string) => `Hi ${name}!`,
    registered: "You're signed up for this event.",
    willRemind: "We'll send a reminder 1 hour before it starts.",
    confirmSubject: (title: string) => `You're signed up: ${title}`,
    reminderSubject: (title: string) => `Starting in 1 hour: ${title}`,
    reminderHeading: (title: string) => `${title} starts soon`,
    reminderIntro: "An event you signed up for starts in 1 hour.",
  },
} satisfies Record<Locale, unknown>;

// Зөвхөн ирэх хүмүүст харагддаг мэдээлэл (event_chat_links, event_contacts) — зохион байгуулагч өгсөн бол имэйлд орно.
export type EventContacts = { chatUrl?: string | null; phone?: string | null };

function eventDetails(event: StudyEvent, eventsUrl: string, contacts: EventContacts, locale: Locale) {
  const e = EMAIL_TEXT[locale];
  // /events?event=12 — эвентийн хуудас нээгдэхэд тухайн эвентийн цонх шууд нээгдэнэ.
  const eventUrl = `${eventsUrl}?event=${event.id}`;
  const time = formatEventTime(event.starts_at, TIME_ZONE, locale);
  const mapsUrl =
    event.lat !== null && event.lng !== null
      ? googleMapsUrl({ lat: event.lat, lng: event.lng })
      : null;
  // Өгөгдлийн сан https-ийг шалгадаг ч имэйлийн href-д орохоос өмнө дахин шалгана.
  const chatUrl = contacts.chatUrl ? normalizeChatUrl(contacts.chatUrl) : null;
  const chatName = chatUrl ? chatPlatform(chatUrl).name : null;
  const chatLabel = e.chatLabel(chatName);
  const phone = contacts.phone?.trim() || null;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#64748b;white-space:nowrap">${label}</td><td style="padding:4px 0;color:#0f172a">${value}</td></tr>`;

  const html = `
    <table style="border-collapse:collapse;font-size:14px">
      ${row(e.when, escapeHtml(time))}
      ${row(
        e.where,
        escapeHtml(event.place_name) +
          (mapsUrl ? ` · <a href="${mapsUrl}" style="color:#4f46e5">Google Maps</a>` : "")
      )}
      ${row(e.host, escapeHtml(event.host_name))}
      ${
        phone
          ? row(e.phone, `<a href="${escapeHtml(telHref(phone))}" style="color:#4f46e5">${escapeHtml(phone)}</a>`)
          : ""
      }
      ${
        chatUrl
          ? row(e.groupChat, `<a href="${escapeHtml(chatUrl)}" style="color:#4f46e5;font-weight:600">${escapeHtml(chatLabel)}</a>`)
          : ""
      }
    </table>
    ${
      event.description
        ? `<p style="margin:16px 0 0;color:#334155;white-space:pre-line">${escapeHtml(event.description)}</p>`
        : ""
    }
    <p style="margin:24px 0 0"><a href="${eventUrl}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600">${e.viewEvent}</a></p>`;

  const text = [
    `${e.when}: ${time}`,
    `${e.where}: ${event.place_name}${mapsUrl ? ` (${mapsUrl})` : ""}`,
    `${e.host}: ${event.host_name}`,
    ...(phone ? [`${e.phone}: ${phone}`] : []),
    ...(chatUrl ? [`${e.groupChat}${chatName ? ` (${chatName})` : ""}: ${chatUrl}`] : []),
    event.description ? `\n${event.description}` : "",
    `\n${e.viewEvent}: ${eventUrl}`,
  ].join("\n");

  return { html, text };
}

function layout(locale: Locale, heading: string, intro: string, body: string) {
  return `<div lang="${locale}" style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
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
  willRemind: boolean,
  contacts: EventContacts = {},
  locale: Locale = "mn"
) {
  const e = EMAIL_TEXT[locale];
  const details = eventDetails(event, eventsUrl, contacts, locale);
  const intro = willRemind ? `${e.registered} ${e.willRemind}` : e.registered;
  return {
    subject: e.confirmSubject(event.title),
    html: layout(locale, escapeHtml(event.title), `${e.greeting(escapeHtml(name))} ${intro}`, details.html),
    text: `${event.title}\n\n${e.greeting(name)} ${intro}\n\n${details.text}`,
  };
}

export function reminderEmail(
  event: StudyEvent,
  name: string,
  eventsUrl: string,
  contacts: EventContacts = {},
  locale: Locale = "mn"
) {
  const e = EMAIL_TEXT[locale];
  const details = eventDetails(event, eventsUrl, contacts, locale);
  return {
    subject: e.reminderSubject(event.title),
    html: layout(
      locale,
      e.reminderHeading(escapeHtml(event.title)),
      `${e.greeting(escapeHtml(name))} ${e.reminderIntro}`,
      details.html
    ),
    text: `${e.reminderHeading(event.title)}\n\n${e.greeting(name)} ${e.reminderIntro}\n\n${details.text}`,
  };
}
