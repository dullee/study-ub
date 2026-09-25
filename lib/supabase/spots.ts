import { PLACEHOLDER_IMAGE, Review, StudySpot } from "@/types";
import { supabase, supabaseAuthed } from "@/lib/supabase/client";
import { ReviewScores } from "@/lib/scores";

type SpotRow = {
  id: number;
  name: string;
  location: string;
  hours: string | null;
  lat: number;
  lng: number;
  tags: string[] | null;
  image: string | null;
  wifi_mbps: number | null;
  quiet_rating: number | null;
  outlet_rating: number | null;
  is_24h: boolean | null;
  status: StudySpot["status"] | null;
  maps_url: string | null;
  amenities: string[] | null;
  category: StudySpot["category"] | null;
  description: string | null;
  accessibility: string[] | null;
  user_id: string | null;
  created_at: string | null;
};

function mapSpot(row: SpotRow): StudySpot {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    hours: row.hours ?? "Тодорхойгүй",
    lat: row.lat,
    lng: row.lng,
    tags: row.tags ?? [],
    image: row.image ?? PLACEHOLDER_IMAGE,
    wifi_mbps: row.wifi_mbps ?? undefined,
    quiet_rating: row.quiet_rating ?? undefined,
    outlet_rating: row.outlet_rating ?? undefined,
    is_24h: row.is_24h ?? undefined,
    status: row.status ?? "approved",
    maps_url: row.maps_url ?? undefined,
    amenities: row.amenities ?? [],
    category: row.category ?? undefined,
    description: row.description ?? undefined,
    accessibility: row.accessibility ?? [],
    user_id: row.user_id ?? null,
    created_at: row.created_at ?? undefined,
  };
}

function spotPayload(spot: Omit<StudySpot, "id">) {
  return {
    name: spot.name,
    location: spot.location,
    hours: spot.hours,
    lat: spot.lat,
    lng: spot.lng,
    tags: spot.tags,
    image: spot.image,
    wifi_mbps: spot.wifi_mbps ?? null,
    quiet_rating: spot.quiet_rating ?? null,
    outlet_rating: spot.outlet_rating ?? null,
    is_24h: spot.is_24h ?? false,
    status: spot.status ?? "pending",
    maps_url: spot.maps_url?.trim() || null,
    amenities: spot.amenities ?? [],
    category: spot.category ?? null,
    description: spot.description?.trim() || null,
    accessibility: spot.accessibility ?? [],
  };
}

export async function fetchSpots(): Promise<StudySpot[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("status", "approved")
    .order("id", { ascending: false });
  if (error) {
    console.error("Supabase spots:", error.message);
    return null;
  }
  return (data as SpotRow[]).map(mapSpot);
}

// Хүлээгдэж буй газрыг зөвхөн админ уншина, тиймээс нэмсэн мөрийг буцааж уншихгүй.
// Нэвтэрсэн бол Clerk token-оор илгээнэ — user_id автоматаар бөглөгдөж, хэрэглэгч өөрийн хүлээгдэж буйг харна.
export async function insertSpot(spot: Omit<StudySpot, "id">): Promise<boolean> {
  const client = supabaseAuthed ?? supabase;
  if (!client) return false;
  const { error } = await client.from("spots").insert(spotPayload(spot));
  if (error) {
    console.error("Supabase insert spot:", error.message);
    return false;
  }
  return true;
}

export async function fetchReviews(spotId: number): Promise<Review[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase reviews:", error.message);
    return null;
  }
  return data as Review[];
}

// Картын оноонд: бүх сэтгэгдлийн зөвхөн тоон утгууд.
export async function fetchReviewScores(): Promise<ReviewScores[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("reviews")
    .select("spot_id, rating, wifi_mbps, quiet_rating, outlet_rating");
  if (error) {
    console.error("Supabase review scores:", error.message);
    return null;
  }
  return data as ReviewScores[];
}

export async function insertReview(
  review: Omit<Review, "id" | "created_at">
): Promise<Review | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("reviews")
    .insert(review)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase insert review:", error.message);
    return null;
  }
  return data as Review;
}

// Доорх функцууд админд: RLS нь Clerk session token-ы metadata.role = "admin"-ийг шалгана.
export async function fetchAllSpots(): Promise<StudySpot[] | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed.from("spots").select("*").order("id", { ascending: false });
  if (error) {
    console.error("Supabase all spots:", error.message);
    return null;
  }
  return (data as SpotRow[]).map(mapSpot);
}

export async function updateSpot(spot: StudySpot): Promise<StudySpot | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("spots")
    .update(spotPayload(spot))
    .eq("id", spot.id)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase update spot:", error.message);
    return null;
  }
  return mapSpot(data as SpotRow);
}

export async function deleteSpot(id: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  // RLS хаасан устгал алдаагүй 0 мөр буцаадаг — устсан мөрийг буцааж авч шалгана.
  const { data, error } = await supabaseAuthed.from("spots").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("Supabase delete spot:", error?.message ?? "no rows deleted");
    return false;
  }
  return true;
}

export async function fetchAllReviews(): Promise<Review[] | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase all reviews:", error.message);
    return null;
  }
  return data as Review[];
}

export async function updateReview(review: Review): Promise<Review | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("reviews")
    .update({
      comment: review.comment,
      rating: review.rating,
      wifi_mbps: review.wifi_mbps ?? null,
      quiet_rating: review.quiet_rating ?? null,
      outlet_rating: review.outlet_rating ?? null,
    })
    .eq("id", review.id)
    .select("*")
    .single();
  if (error) {
    console.error("Supabase update review:", error.message);
    return null;
  }
  return data as Review;
}

export async function deleteReview(id: number): Promise<boolean> {
  if (!supabaseAuthed) return false;
  // RLS хаасан устгал алдаагүй 0 мөр буцаадаг — устсан мөрийг буцааж авч шалгана.
  const { data, error } = await supabaseAuthed.from("reviews").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    console.error("Supabase delete review:", error?.message ?? "no rows deleted");
    return false;
  }
  return true;
}

// Хэрэглэгчийн илгээсэн, хараахан нийтлэгдээгүй газрууд (хүлээгдэж буй ба татгалзсан). RLS: зөвхөн өөрийнх.
export async function fetchMySubmissions(userId: string): Promise<StudySpot[] | null> {
  if (!supabaseAuthed) return null;
  const { data, error } = await supabaseAuthed
    .from("spots")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "rejected"])
    .order("id", { ascending: false });
  if (error) {
    console.error("Supabase my submissions:", error.message);
    return null;
  }
  return (data as SpotRow[]).map(mapSpot);
}
