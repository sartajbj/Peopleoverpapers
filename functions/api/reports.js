const CATEGORIES = new Set(["critical", "active", "observed", "support"]);
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});
export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: "Reports database is not configured." }, 503);
  try {
    const { results = [] } = await env.DB.prepare(
      "SELECT id, location_label, category, description, observed_at, lat, lng FROM reports WHERE status = 'approved' ORDER BY observed_at DESC LIMIT 500"
    ).all();
    return json({ reports: results });
  } catch { return json({ error: "Could not load reports." }, 500); }
}
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Reports database is not configured yet." }, 503);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 12000) return json({ error: "Submission is too large." }, 413);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON submission." }, 400); }
  if (String(body.website || "").trim()) return json({ ok: true }, 202);
  const location = String(body.location_label || "").trim();
  const description = String(body.description || "").trim();
  const category = String(body.category || "");
  const observed = String(body.observed_at || "");
  if (!body.consent) return json({ error: "Please confirm the privacy and good-faith statement." }, 400);
  if (location.length < 2 || location.length > 120) return json({ error: "Enter a general location (2–120 characters)." }, 400);
  if (!CATEGORIES.has(category)) return json({ error: "Choose a valid report type." }, 400);
  if (description.length < 30 || description.length > 1500) return json({ error: "Description must be 30–1,500 characters." }, 400);
  const observedMs = Date.parse(observed);
  if (!observed || !Number.isFinite(observedMs) || observedMs > Date.now() + 5 * 60 * 1000 || observedMs < Date.now() - 366 * 86400000)
    return json({ error: "Enter a valid observation date within the past 12 months." }, 400);
  let lat = null, lng = null;
  const hasLat = body.lat !== null && body.lat !== undefined && body.lat !== "";
  const hasLng = body.lng !== null && body.lng !== undefined && body.lng !== "";
  if (hasLat !== hasLng) return json({ error: "Provide both coordinates or leave both blank." }, 400);
  if (hasLat) {
    lat = Number(body.lat); lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 24 || lat > 50 || lng < -126 || lng > -66)
      return json({ error: "Map coordinates must be a valid approximate location in the contiguous United States." }, 400);
    lat = Math.round(lat * 100) / 100; lng = Math.round(lng * 100) / 100;
  }
  try {
    const result = await env.DB.prepare(
      "INSERT INTO reports (location_label, category, description, observed_at, lat, lng, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')"
    ).bind(location, category, description, new Date(observedMs).toISOString(), lat, lng).run();
    return json({ ok: true, id: result.meta?.last_row_id ?? null, status: "pending", message: "Received for moderation." }, 201);
  } catch { return json({ error: "The report could not be saved. Please try again later." }, 500); }
}