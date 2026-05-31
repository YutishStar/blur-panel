/* /api/analytics — Vercel serverless function
 *
 * Queries PostHog (HogQL) server-side and returns clean JSON for the
 * self-hosted /analytics dashboard. The SECRET personal API key lives only
 * here, in a Vercel env var — it never reaches the browser.
 *
 * Required env vars (set in Vercel → Project → Settings → Environment Variables):
 *   POSTHOG_PERSONAL_API_KEY   phx_...   (secret — read access to the project)
 *   POSTHOG_PROJECT_ID         447944    (the "Cracked" project)
 * Optional:
 *   POSTHOG_HOST               https://us.posthog.com   (default)
 *   ANALYTICS_PASSWORD         a shared password to gate the dashboard
 */

const HOST = process.env.POSTHOG_HOST || "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "447944";
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PASSWORD = process.env.ANALYTICS_PASSWORD || "";

// Whitelist of allowed look-back windows (days). Keeps the value safe to
// interpolate into HogQL and prevents arbitrary ranges.
const RANGES = { "7d": 7, "30d": 30, "90d": 90 };

async function hog(query) {
  const r = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`PostHog ${r.status}: ${text.slice(0, 300)}`);
  }
  const data = await r.json();
  return data.results || [];
}

export default async function handler(req, res) {
  if (!KEY) {
    res.status(500).json({ error: "POSTHOG_PERSONAL_API_KEY is not set on the server." });
    return;
  }

  // Optional password gate
  if (PASSWORD) {
    const given = req.headers["x-analytics-key"] || (req.query && req.query.key) || "";
    if (given !== PASSWORD) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
  }

  const rangeKey = RANGES[req.query && req.query.range] ? req.query.range : "30d";
  const n = RANGES[rangeKey];

  try {
    const [summary, daily, pages, clicks, sources, custom, live] = await Promise.all([
      hog(
        `SELECT count() AS pageviews,
                count(DISTINCT person_id) AS visitors,
                count(DISTINCT properties.$session_id) AS sessions
         FROM events
         WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${n} DAY`
      ),
      hog(
        `SELECT toStartOfDay(timestamp) AS day,
                count() AS views,
                count(DISTINCT person_id) AS visitors
         FROM events
         WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${n} DAY
         GROUP BY day ORDER BY day ASC`
      ),
      hog(
        `SELECT coalesce(nullIf(properties.$pathname, ''), '/') AS path,
                count() AS views,
                count(DISTINCT person_id) AS visitors
         FROM events
         WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${n} DAY
         GROUP BY path ORDER BY views DESC LIMIT 20`
      ),
      hog(
        `SELECT properties.$el_text AS label, count() AS clicks
         FROM events
         WHERE event = '$autocapture'
           AND properties.$event_type = 'click'
           AND properties.$el_text != ''
           AND timestamp > now() - INTERVAL ${n} DAY
         GROUP BY label ORDER BY clicks DESC LIMIT 15`
      ),
      hog(
        `SELECT coalesce(nullIf(properties.$referring_domain, ''), 'direct') AS source,
                count() AS views
         FROM events
         WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${n} DAY
         GROUP BY source ORDER BY views DESC LIMIT 10`
      ),
      hog(
        `SELECT event, count() AS count
         FROM events
         WHERE event NOT LIKE '$%' AND timestamp > now() - INTERVAL ${n} DAY
         GROUP BY event ORDER BY count DESC LIMIT 15`
      ),
      hog(
        `SELECT count(DISTINCT person_id) AS online
         FROM events WHERE timestamp > now() - INTERVAL 5 MINUTE`
      ),
    ]);

    const s = summary[0] || [0, 0, 0];

    // Cache at the edge: cheap to serve, fresh enough for a dashboard.
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({
      range: rangeKey,
      generatedAt: new Date().toISOString(),
      summary: { pageviews: s[0], visitors: s[1], sessions: s[2] },
      live: (live[0] && live[0][0]) || 0,
      daily: daily.map(([day, views, visitors]) => ({ day, views, visitors })),
      pages: pages.map(([path, views, visitors]) => ({ path, views, visitors })),
      clicks: clicks.map(([label, count]) => ({ label, count })),
      sources: sources.map(([source, views]) => ({ source, views })),
      events: custom.map(([event, count]) => ({ event, count })),
    });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
}
