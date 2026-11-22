import { COUNTRIES } from "@/lib/locations";

/**
 * GET /api/locations: the countries served, with their states, provinces
 * and territories. The site's forms import the same list directly; this is
 * for other clients such as the admin panel.
 */
export function GET() {
  return Response.json({ data: { countries: COUNTRIES } });
}
