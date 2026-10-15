const ALLOW = ["qd.je", "cc.cd", "rr.kg", "indevs.in", "cloudfront.net", "miguvideo.com"];
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const u = url.searchParams.get("u");
  if (!u) return new Response("missing u", { status: 400 });
  let target;
  try { target = new URL(u); } catch (e) { return new Response("bad u", { status: 400 }); }
  const host = target.hostname;
  const ok = ALLOW.some(function(s) { return host === s || host.endsWith("." + s); });
  if (!ok) return new Response("host not allowed", { status: 403 });
  const resp = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" } });
  const ct = resp.headers.get("content-type") || "";
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  const isM3u = ct.includes("mpegurl") || target.pathname.endsWith(".m3u8");
  if (isM3u) {
    let text = await resp.text();
    const finalUrl = resp.url ? new URL(resp.url) : target;
    const wrap = function(abs) { return url.origin + "/p?u=" + encodeURIComponent(abs); };
    text = text.split("\n").map(function(line) {
      const t = line.trim();
      if (!t) return line;
      if (t.charAt(0) === "#") {
        return line.replace(/URI="([^"]+)"/g, function(m, x) {
          try { return "URI=\"" + wrap(new URL(x, finalUrl).toString()) + "\""; } catch (e) { return m; }
        });
      }
      try { return wrap(new URL(t, finalUrl).toString()); } catch (e) { return line; }
    }).join("\n");
    return new Response(text, { status: resp.status, headers: headers });
  }
  return new Response(resp.body, { status: resp.status, headers: headers });
}
