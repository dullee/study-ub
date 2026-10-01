import { photonGeocoder } from "@/lib/geocode/photon";
import { Geocoder } from "@/lib/geocode/types";

const PROVIDERS: Record<string, Geocoder> = {
  photon: photonGeocoder,
};

// GEOCODER=photon. Өөр үйлчилгээ нэмбэл PROVIDERS-д бүртгээд env-ийг солино.
export function getGeocoder(): Geocoder {
  const id = (process.env.GEOCODER || "photon").trim().toLowerCase();
  const provider = PROVIDERS[id];
  if (!provider) throw new Error(`unknown-geocoder:${id}`);
  return provider;
}
