// Vercel Serverless Function: Scans configured official YouTube channels (and optional live search)
// for currently active LIVE streams and returns normalized JSON with CORS enabled.

const CHANNELS = [
  { handle: "@b.leagueinternational", name: "B.LEAGUE" },
  { handle: "@BaloncestoSuperiorNacionalPR", name: "BSN PR" },
  { handle: "@BasketballCL", name: "BCL" },
  { handle: "@beINSPORTSTürkiye", name: "beIN SPORTS" },
  { handle: "@dpbcolombia", name: "DPB Colombia" },
  { handle: "fiba", name: "FIBA" },
  { handle: "@MPBLOfficial", name: "MPBL" },
  { handle: "@nbl", name: "NBL" },
  { handle: "@OneSportsPHL", name: "One Sports" },
  { handle: "@PLEAGUEofficial", name: "P.LEAGUE+" },
  { handle: "@TBF", name: "TBF" },
  { handle: "@NBLPilipinas", name: "NBL Pilipinas" },
  { handle: "@trtspor", name: "TRT Spor" },
  { handle: "@trt1", name: "TRT 1" },
  { handle: "@aspor", name: "A Spor" },
  { handle: "@htspor", name: "HT Spor" },
  { handle: "@EuroLeague", name: "EuroLeague" },
  { handle: "@FIBA3x3", name: "FIBA 3x3" }
];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
let cache = { ts: 0, streams: [] };
const CACHE_TTL_MS = 90 * 1000;

function extractYtInitialData(html) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (_) {
    return null;
  }
}

function isLiveRenderer(r) {
  if (!r || typeof r !== "object" || !r.videoId) return false;
  const overlays = Array.isArray(r.thumbnailOverlays) ? r.thumbnailOverlays : [];
  for (const ov of overlays) {
    const st = ov?.thumbnailOverlayTimeStatusRenderer?.style;
    if (st === "LIVE") return true;
  }
  const badges = Array.isArray(r.badges) ? r.badges : [];
  for (const b of badges) {
    const style = b?.metadataBadgeRenderer?.style || "";
    const label = String(b?.metadataBadgeRenderer?.label || "").toUpperCase();
    if (style.includes("LIVE") || label === "LIVE" || label === "CANLI") return true;
  }
  const vc = JSON.stringify(r.viewCountText || "").toLowerCase();
  if (vc.includes("watching") || vc.includes("izliyor")) return true;
  return false;
}

function getTitleText(r) {
  if (r?.title?.simpleText) return r.title.simpleText;
  if (Array.isArray(r?.title?.runs)) return r.title.runs.map((x) => x.text || "").join("");
  return "";
}

function collectLiveVideos(node, meta, out, seen) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectLiveVideos(item, meta, out, seen);
    return;
  }
  const vr = node.videoRenderer || node.gridVideoRenderer || node.videoWithContextRenderer;
  if (vr && isLiveRenderer(vr) && !seen.has(vr.videoId)) {
    seen.add(vr.videoId);
    const title = getTitleText(vr);
    const channelText = vr?.ownerText?.runs?.[0]?.text || vr?.longBylineText?.runs?.[0]?.text || meta.name;
    out.push({
      videoId: vr.videoId,
      title,
      channelHandle: meta.handle || "",
      channelName: channelText || meta.name,
      embedUrl: `https://www.youtube.com/embed/${vr.videoId}?autoplay=1`,
      watchUrl: `https://www.youtube.com/watch?v=${vr.videoId}`
    });
    return;
  }
  for (const k of Object.keys(node)) {
    collectLiveVideos(node[k], meta, out, seen);
  }
}

async function fetchHtml(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9,tr;q=0.8" }
    });
    if (!res.ok) return "";
    return await res.text();
  } catch (_) {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function scanChannel(ch) {
  const path = ch.handle.startsWith("@") ? ch.handle : ch.handle;
  const url = `https://www.youtube.com/${encodeURI(path)}/streams`;
  const html = await fetchHtml(url);
  if (!html) return [];
  const data = extractYtInitialData(html);
  if (!data) return [];
  const out = [];
  collectLiveVideos(data, ch, out, new Set());
  return out;
}

async function getAllChannelLives() {
  if (Date.now() - cache.ts < CACHE_TTL_MS && cache.streams.length) {
    return cache.streams;
  }
  const settled = await Promise.allSettled(CHANNELS.map(scanChannel));
  const merged = [];
  const seen = new Set();
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const v of r.value) {
      if (!seen.has(v.videoId)) {
        seen.add(v.videoId);
        merged.push(v);
      }
    }
  }
  cache = { ts: Date.now(), streams: merged };
  return merged;
}

async function searchLiveQuery(query) {
  const clean = String(query || "").trim();
  if (!clean) return [];
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(clean + " canlı")}&sp=EgJAAQ%253D%253D`;
  const html = await fetchHtml(url);
  if (!html) return [];
  const data = extractYtInitialData(html);
  if (!data) return [];
  const out = [];
  collectLiveVideos(data, { handle: "", name: "YouTube" }, out, new Set());
  return out.slice(0, 6);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  try {
    const q = (req.query && req.query.q) ? String(req.query.q) : "";
    if (q) {
      const results = await searchLiveQuery(q);
      res.status(200).json({ ok: true, query: q, streams: results });
      return;
    }
    const streams = await getAllChannelLives();
    res.status(200).json({ ok: true, count: streams.length, streams });
  } catch (err) {
    res.status(200).json({ ok: false, streams: [], error: String(err?.message || err) });
  }
};
