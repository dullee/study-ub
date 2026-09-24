// Групп чатын холбоосоос аппыг таньж, товчийг тохирох нэр, өнгөөр харуулна.

export type ChatPlatform = { name: string | null; icon: string; className: string };

const PLATFORMS: { hosts: RegExp; platform: ChatPlatform }[] = [
  { hosts: /(^|\.)(chat\.whatsapp\.com|wa\.me|whatsapp\.com)$/, platform: { name: "WhatsApp", icon: "🟢", className: "bg-emerald-600 hover:bg-emerald-500" } },
  { hosts: /(^|\.)(discord\.gg|discord\.com|discordapp\.com)$/, platform: { name: "Discord", icon: "🎮", className: "bg-[#5865F2] hover:bg-[#4752c4]" } },
  { hosts: /(^|\.)(t\.me|telegram\.me|telegram\.org)$/, platform: { name: "Telegram", icon: "✈️", className: "bg-sky-600 hover:bg-sky-500" } },
  { hosts: /(^|\.)(instagram\.com|ig\.me)$/, platform: { name: "Instagram", icon: "📸", className: "bg-gradient-to-r from-fuchsia-600 to-orange-500 hover:opacity-90" } },
  { hosts: /(^|\.)(m\.me|messenger\.com)$/, platform: { name: "Messenger", icon: "💬", className: "bg-blue-600 hover:bg-blue-500" } },
  { hosts: /(^|\.)(facebook\.com|fb\.com)$/, platform: { name: "Facebook", icon: "📘", className: "bg-blue-700 hover:bg-blue-600" } },
  { hosts: /(^|\.)(line\.me)$/, platform: { name: "LINE", icon: "🟩", className: "bg-green-600 hover:bg-green-500" } },
  { hosts: /(^|\.)(signal\.group|signal\.me)$/, platform: { name: "Signal", icon: "🔵", className: "bg-blue-500 hover:bg-blue-400" } },
];

const OTHER: ChatPlatform = { name: null, icon: "💬", className: "bg-indigo-600 hover:bg-indigo-500" };

// Зөвхөн https холбоос — javascript: гэх мэт аюултай холбоосыг зөвшөөрөхгүй (өгөгдлийн сан ч шалгана).
export function normalizeChatUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || trimmed.length > 500) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function chatPlatform(url: string): ChatPlatform {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PLATFORMS.find((entry) => entry.hosts.test(host))?.platform ?? OTHER;
  } catch {
    return OTHER;
  }
}
