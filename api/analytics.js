/* /api/analytics — Vercel serverless function
 *
 * Queries PostHog (HogQL) server-side and returns clean JSON for the
 * self-hosted analytics dashboard. The SECRET personal API key lives only
 * here, in a Vercel env var — it never reaches the browser.
 *
 * Required env vars (Vercel → Project → Settings → Environment Variables):
 *   POSTHOG_PERSONAL_API_KEY   phx_...   (secret — read access to the project)
 *   POSTHOG_PROJECT_ID         447944    (the "Cracked" project)
 * Optional:
 *   POSTHOG_HOST               https://us.posthog.com   (default)
 *
 * Every query is run independently and falls back to empty on failure, so one
 * misbehaving query can never blank out the whole dashboard.
 */

const HOST = process.env.POSTHOG_HOST || "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "447944";
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;

// Whitelisted look-back windows (days) — safe to interpolate into HogQL.
const RANGES = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };

async function hog(query) {
  const r = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!r.ok) throw new Error(`PostHog ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).results || [];
}

// Never let a single failing query take down the dashboard.
async function safe(query, fallback) {
  try {
    return await hog(query);
  } catch (e) {
    return fallback;
  }
}

export default async function handler(req, res) {
  if (!KEY) {
    res.status(500).json({ error: "POSTHOG_PERSONAL_API_KEY is not set on the server." });
    return;
  }

  const rangeKey = RANGES[req.query && req.query.range] ? req.query.range : "30d";
  const n = RANGES[rangeKey];
  const W = `timestamp > now() - INTERVAL ${n} DAY`;
  const PV = `event = '$pageview' AND ${W}`;

  const [
    summary, avgDur, bounce, newRet, daily, pages, clicks,
    sources, fellows, devices, countries, browsers, events, live,
  ] = await Promise.all([
    safe(
      `SELECT count() AS pageviews,
              count(DISTINCT person_id) AS visitors,
              count(DISTINCT properties.$session_id) AS sessions
       FROM events WHERE ${PV}`,
      [[0, 0, 0]]
    ),
    // Avg session length, computed from event timestamps (robust, no sessions table)
    safe(
      `SELECT round(avg(dur)) FROM (
         SELECT properties.$session_id AS sid,
                dateDiff('second', min(timestamp), max(timestamp)) AS dur
         FROM events WHERE ${W} AND properties.$session_id != ''
         GROUP BY sid HAVING dur > 0)`,
      [[0]]
    ),
    // Bounce rate = % of sessions with a single pageview
    safe(
      `SELECT round(100 * countIf(v = 1) / count()) FROM (
         SELECT properties.$session_id AS sid, count() AS v
         FROM events WHERE ${PV} AND properties.$session_id != ''
         GROUP BY sid)`,
      [[0]]
    ),
    safe(
      `SELECT countIf(first_seen >= now() - INTERVAL ${n} DAY) AS new_v,
              countIf(first_seen <  now() - INTERVAL ${n} DAY) AS returning_v
       FROM (SELECT person_id, min(timestamp) AS first_seen, max(timestamp) AS last_seen
             FROM events GROUP BY person_id
             HAVING last_seen > now() - INTERVAL ${n} DAY)`,
      [[0, 0]]
    ),
    safe(
      `SELECT toStartOfDay(timestamp) AS day, count() AS views,
              count(DISTINCT person_id) AS visitors
       FROM events WHERE ${PV} GROUP BY day ORDER BY day ASC`,
      []
    ),
    safe(
      `SELECT coalesce(nullIf(properties.$pathname, ''), '/') AS path,
              count() AS views, count(DISTINCT person_id) AS visitors
       FROM events WHERE ${PV} GROUP BY path ORDER BY views DESC LIMIT 12`,
      []
    ),
    safe(
      `SELECT properties.$el_text AS label, count() AS clicks
       FROM events WHERE event = '$autocapture' AND properties.$event_type = 'click'
         AND properties.$el_text != '' AND ${W}
       GROUP BY label ORDER BY clicks DESC LIMIT 12`,
      []
    ),
    safe(
      `SELECT coalesce(nullIf(properties.$referring_domain, ''), 'direct') AS source, count() AS views
       FROM events WHERE ${PV} GROUP BY source ORDER BY views DESC LIMIT 10`,
      []
    ),
    // Per-fellow passport opens (custom event from script.js)
    safe(
      `SELECT properties.fellow_name AS fellow, count() AS opens
       FROM events WHERE event = 'passport_open' AND properties.fellow_name != '' AND ${W}
       GROUP BY fellow ORDER BY opens DESC LIMIT 20`,
      []
    ),
    safe(
      `SELECT coalesce(nullIf(properties.$device_type, ''), 'unknown') AS device,
              count(DISTINCT person_id) AS visitors
       FROM events WHERE ${PV} GROUP BY device ORDER BY visitors DESC`,
      []
    ),
    safe(
      `SELECT coalesce(nullIf(properties.$geoip_country_name, ''), 'unknown') AS country,
              count(DISTINCT person_id) AS visitors
       FROM events WHERE ${PV} GROUP BY country ORDER BY visitors DESC LIMIT 10`,
      []
    ),
    safe(
      `SELECT coalesce(nullIf(properties.$browser, ''), 'unknown') AS browser,
              count(DISTINCT person_id) AS visitors
       FROM events WHERE ${PV} GROUP BY browser ORDER BY visitors DESC LIMIT 8`,
      []
    ),
    safe(
      `SELECT event, count() AS count
       FROM events WHERE event NOT LIKE '$%' AND ${W}
       GROUP BY event ORDER BY count DESC LIMIT 15`,
      []
    ),
    safe(
      `SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - INTERVAL 5 MINUTE`,
      [[0]]
    ),
  ]);

  const s = summary[0] || [0, 0, 0];
  const nr = newRet[0] || [0, 0];
  const num = (rows) => (rows[0] && Number(rows[0][0])) || 0;

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
  res.status(200).json({
    range: rangeKey,
    generatedAt: new Date().toISOString(),
    summary: {
      pageviews: s[0], visitors: s[1], sessions: s[2],
      avgDuration: num(avgDur), bounceRate: num(bounce),
    },
    live: num(live),
    newVsReturning: { new: nr[0], returning: nr[1] },
    daily: daily.map(([day, views, visitors]) => ({ day, views, visitors })),
    pages: pages.map(([path, views, visitors]) => ({ path, views, visitors })),
    clicks: clicks.map(([label, count]) => ({ label, count })),
    sources: sources.map(([source, views]) => ({ source, views })),
    fellows: fellows.map(([fellow, opens]) => ({ fellow, opens })),
    devices: devices.map(([device, visitors]) => ({ device, visitors })),
    countries: countries.map(([country, visitors]) => ({ country, visitors })),
    browsers: browsers.map(([browser, visitors]) => ({ browser, visitors })),
    events: events.map(([event, count]) => ({ event, count })),
  });
}
