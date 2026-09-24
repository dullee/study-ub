# StudySpots UB

Улаанбаатарын сурах газаруудын гид. Next.js (App Router) + TypeScript + Tailwind CSS. Газрын зураг Leaflet, өгөгдөл Supabase (тохируулаагүй үед `data/initialSpots.ts` + localStorage).

## Ажиллуулах

```bash
npm install
npm run dev
```

http://localhost:3000

## Supabase холболт

1. [supabase.com](https://supabase.com) дээр шинэ төсөл үүсгэнэ.
2. Project Settings → API Keys-ээс URL болон publishable key (хуучин төсөлд anon key) хуулна.
3. `.env.local` үүсгэнэ (`.env.example`-аас):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
# Хуучин нэр NEXT_PUBLIC_SUPABASE_ANON_KEY ч ажиллана.
```

4. Хүснэгтүүд `supabase/migrations/`-д байна. Supabase-ийн GitHub integration-ийг (Project Settings → Integrations → GitHub) энэ repo-той холбосон бол `main` руу push хийхэд автоматаар ажиллана. Холбоогүй бол файлуудыг дарааллаар нь SQL Editor дээр ажиллуулна. Шинэ хүснэгт нэмэхдээ шинэ migration файл үүсгэнэ, хуучныг нь засахгүй.
5. Dev server-ээ дахин асаана. Шинэ газар `pending` статусаар орж, `/admin` дээр зөвшөөрсний дараа нүүрэнд гарна. Нууц үг: `NEXT_PUBLIC_ADMIN_PASSWORD` (анхдагч `admin`).

## Cloudinary (зураг)

Шинэ газар нэмэхэд сонгосон зураг Cloudinary руу хуулагдаж, `image` баганад түүний URL хадгалагдана. Тохируулаагүй үед зургийн URL гараар оруулна.

1. [cloudinary.com](https://cloudinary.com) дээр бүртгүүлж, Dashboard-оос **Cloud name**-ээ хуулна.
2. Settings → Upload → Upload presets → **Add upload preset**: Signing mode = **Unsigned**, Folder = `studyspots`. Allowed formats-д `jpg, png, webp, heic`, Max file size-д 5MB тавихыг зөвлөе.
3. `.env.local`-д нэмнэ:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

## Vercel

GitHub repo холбоод Environment Variables дээр `.env.local`-ийн бүх түлхүүрийг (Supabase, Cloudinary) нэмнэ. `main` руу push хийхэд автоматаар deploy хийнэ.

## Багийн файл

| Хүн | Хариуцах |
| --- | --- |
| Хөгжүүлэгч 1 | `components/Header.tsx`, `SpotCard.tsx`, `FilterSection.tsx`, `AddSpotModal.tsx` |
| Хөгжүүлэгч 2 | `components/Map.tsx`, `ReviewSection.tsx`, `lib/supabase/`, `app/page.tsx` |
| Гишүүн 3 | `data/initialSpots.ts` (15–20 бодит газар), Supabase руу дата, Vercel deploy, сошиал |
