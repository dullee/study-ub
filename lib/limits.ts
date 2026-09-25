// Текстийн уртын хязгаар — supabase/migrations/20260924000012_limits.sql-тэй тохирно.
// Формын maxLength-д хэрэглэж, өгөгдлийн сан татгалзахаас өмнө хэрэглэгч мэднэ.
export const LIMITS = {
  reviewComment: 2000,
  eventTitle: 120,
  eventDescription: 2000,
  placeName: 200,
  maxPeople: 1000,
  spotName: 120,
  spotLocation: 200,
  spotHours: 100,
  spotDescription: 500,
  url: 1000,
} as const;
