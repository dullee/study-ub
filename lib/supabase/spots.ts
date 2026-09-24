import { PLACEHOLDER_IMAGE, Review, StudySpot } from "@/types";
import { supabase, supabaseAuthed } from "@/lib/supabase/client";

type SpotRow = {
  id: number;
  name: string;
  location: string;
  hours: string | null;
  lat: number;
  lng: number;
  tags: string[] | null;
  image: string | null;
  wifi_speed: string | null;
  quiet_score: string | null;
  socket_score: string | null;
  is_24h: boolean | null;
  status: StudySpot["status"] | null;
  maps_url: string | null;
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
    wifi_speed: row.wifi_speed ?? undefined,
    quiet_score: row.quiet_score ?? undefined,
    socket_score: row.socket_score ?? undefined,
    is_24h: row.is_24h ?? undefined,
    status: row.status ?? "approved",
    maps_url: row.maps_url ?? undefined,
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
    wifi_speed: spot.wifi_speed ?? null,
    quiet_score: spot.quiet_score ?? null,
    socket_score: spot.socket_score ?? null,
    is_24h: spot.is_24h ?? false,
    status: spot.status ?? "pending",
    maps_url: spot.maps_url?.trim() || null,
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
export async function insertSpot(spot: Omit<StudySpot, "id">): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("spots").insert(spotPayload(spot));
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

// Картууд дээрх дундаж үнэлгээнд: бүх сэтгэгдлийн зөвхөн spot_id, rating.
export async function fetchReviewRatings(): Promise<Pick<Review, "spot_id" | "rating">[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("reviews").select("spot_id, rating");
  if (error) {
    console.error("Supabase review ratings:", error.message);
    return null;
  }
  return data as Pick<Review, "spot_id" | "rating">[];
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
  const { error } = await supabaseAuthed.from("spots").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete spot:", error.message);
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
      wifi_speed_test: review.wifi_speed_test,
      rating: review.rating,
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
  const { error } = await supabaseAuthed.from("reviews").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete review:", error.message);
    return false;
  }
  return true;
}
