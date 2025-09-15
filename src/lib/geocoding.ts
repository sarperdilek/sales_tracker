export type ReverseGeocode = { address: string; cityDistrict: string };

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocode> {
  const key = process.env.GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) return { address: "", cityDistrict: "" };
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
  const r = await fetch(url);
  const data = await r.json();
  const address = data.results?.[0]?.formatted_address || "";
  let cityDistrict = "";
  const comps: Array<{ long_name: string; types: string[] }> = data.results?.[0]?.address_components || [];
  const admin1 = comps.find((c) => c.types.includes("administrative_area_level_1"))?.long_name;
  const admin2 = comps.find((c) => c.types.includes("administrative_area_level_2"))?.long_name;
  if (admin1 || admin2) cityDistrict = [admin1, admin2].filter(Boolean).join(" / ");
  return { address, cityDistrict };
}


