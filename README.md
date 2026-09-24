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
2. SQL Editor дээр `supabase/schema.sql` файлыг ажиллуулна (`spots`, `reviews`, public унших/нэмэх policy).
3. Project Settings → API-аас URL болон anon key хуулна.
4. `.env.local` үүсгэнэ (`.env.example`-аас):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. Dev server-ээ дахин асаана. Хүснэгт хоосон бол анхны 6 газар харагдана. Мөр орсон бол Supabase-аас уншина.
6. Аль хэдийн schema ажиллуулсан бол `supabase/admin.sql`-ийг бас ажиллуулна. Шинэ газар `pending` статусаар орж, `/admin` дээр зөвшөөрсний дараа нүүрэнд гарна. Нууц үг: `NEXT_PUBLIC_ADMIN_PASSWORD` (анхдагч `admin`).

## Vercel

GitHub repo холбоод Environment Variables дээр дээрх хоёр түлхүүрийг нэмнэ. `main` руу push хийхэд автоматаар deploy хийнэ.

## Багийн файл

| Хүн | Хариуцах |
| --- | --- |
| Хөгжүүлэгч 1 | `components/Header.tsx`, `SpotCard.tsx`, `FilterSection.tsx`, `AddSpotModal.tsx` |
| Хөгжүүлэгч 2 | `components/Map.tsx`, `ReviewSection.tsx`, `lib/supabase/`, `app/page.tsx` |
| Гишүүн 3 | `data/initialSpots.ts` (15–20 бодит газар), Supabase руу дата, Vercel deploy, сошиал |
