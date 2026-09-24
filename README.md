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

## Clerk (нэвтрэх, бүртгүүлэх)

Эвент үүсгэх, эвентэд "Би ирнэ" дарах, сэтгэгдэл бичихэд нэвтэрсэн байх шаардлагатай. Мөр бүр хэрэглэгчийн Clerk id-тай (`user_id`) хадгалагдана. Газар нэмэх, унших нь нэвтрэлтгүй хэвээр.

1. [dashboard.clerk.com](https://dashboard.clerk.com) дээр application үүсгээд API Keys-ээс хоёр түлхүүрийг `.env.local`-д хуулна:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

2. **Clerk-ийг Supabase-тэй холбох** (үүнгүйгээр нэвтэрсэн хэрэглэгчийн бичих үйлдэл RLS-д татгалзагдана):
   - Clerk Dashboard → [Integrations → Supabase](https://dashboard.clerk.com/setup/supabase) → **Activate Supabase integration**. Гарч ирсэн **Clerk domain**-ийг хуулна.
   - Supabase Dashboard → Authentication → Sign In / Providers → **Third-Party Auth** → **Add provider → Clerk** → domain-оо оруулна.
3. `supabase/migrations/20260924000002_clerk_auth.sql`-ийг ажиллуулна (GitHub integration эсвэл SQL Editor).

## Имэйл (Nodemailer)

"Би ирнэ" дарахад хэрэглэгчийн Clerk имэйл рүү эвентийн мэдээлэл илгээнэ. Эвент эхлэхээс 1 цагийн өмнө сануулга илгээнэ: Supabase `pg_cron` 5 минут тутамд `/api/cron/reminders`-ийг дуудаж, 1 цагийн дотор эхлэх эвентийн бүртгэлтэй хүмүүст илгээнэ (`reminder_sent_at`-аар нэг л удаа). Бүртгэлээ цуцалсан хүнд сануулга очихгүй.

1. **SMTP** — Gmail ашиглах бол: Google Account → Security → 2-Step Verification асаах → **App passwords** → шинэ нууц үг үүсгэнэ (энгийн нууц үг ажиллахгүй). Gmail өдөрт ~500 имэйл хүртэл илгээнэ.
2. **Supabase secret key** — Project Settings → API Keys → Secret keys. RLS-ийг алгасдаг тул `NEXT_PUBLIC_` угтваргүй, зөвхөн сервер дээр.
3. **CRON_SECRET** — урт санамсаргүй тэмдэгт мөр (жишээ нь `openssl rand -hex 32`).
4. `.env.local` (болон Vercel):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=StudySpots UB <you@gmail.com>
SUPABASE_SECRET_KEY=sb_secret_...
CRON_SECRET=long_random_string
```

5. `supabase/migrations/20260924000003_rsvp_emails.sql`-ийг ажиллуулна.
6. Vercel-д deploy хийсний дараа `supabase/cron-reminders.sql` дахь `SITE_URL`, `YOUR_CRON_SECRET`-ийг солиод SQL Editor дээр ажиллуулна. Local дээр шалгах: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/reminders`.

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

GitHub repo холбоод Environment Variables дээр `.env.local`-ийн бүх түлхүүрийг (Supabase, Clerk, SMTP, Cloudinary) нэмнэ. `main` руу push хийхэд автоматаар deploy хийнэ.

## Багийн файл

| Хүн | Хариуцах |
| --- | --- |
| Хөгжүүлэгч 1 | `components/Header.tsx`, `SpotCard.tsx`, `FilterSection.tsx`, `AddSpotModal.tsx` |
| Хөгжүүлэгч 2 | `components/Map.tsx`, `ReviewSection.tsx`, `lib/supabase/`, `app/page.tsx` |
| Гишүүн 3 | `data/initialSpots.ts` (15–20 бодит газар), Supabase руу дата, Vercel deploy, сошиал |
