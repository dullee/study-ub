export type GeocodeHit = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  // Нэр нь хайлттай (эсвэл түүний кирилл хэлбэртэй) таарсан эсэх. Enter дархад зөвхөн ганц exact-ийг сонгоно.
  exact: boolean;
};

// Шинэ үйлчилгээ нэмэхэд энэ интерфэйсийг хэрэгжүүлээд lib/geocode/index.ts-д бүртгэнэ.
export interface Geocoder {
  readonly id: string;
  search(query: string, signal: AbortSignal): Promise<GeocodeHit[]>;
}
