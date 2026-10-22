const ALLOW = ["qd.je", "cc.cd", "rr.kg", "indevs.in", "cloudfront.net", "miguvideo.com", "xyzfm.space", "rycjapi.com", "101.35.240.114", "fengshows.cn", "chining.eu.org", "hidns.vip", "sryze.cc", "sinajs.cn", "okx.com", "222.223.41.27", "61.138.99.166", "163189.xyz", "bestv.cn"];
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const u = url.searchParams.get("u");
  if (!u) return new Response("missing u", { status: 400 });
  let target;
  try { target = new URL(u); } catch (e) { return new Response("bad u", { status: 400 }); }
  const host = target.hostname;
  const ok = ALLOW.some(function(s) { return host === s || host.endsWith("." + s); });
  if (!ok) return new Response("host not allowed", { status: 403 });
  const UA = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" };
  if (host === "hq.sinajs.cn") UA["Referer"] = "https://finance.sina.com.cn/";
  if (host === "101.35.240.114") UA["User-Agent"] = "AptvPlayer-UA";
  if (url.searchParams.get("mode") === "url") {
    const r0 = await fetch(target.toString(), { headers: UA, redirect: "manual" });
    const loc = r0.headers.get("location") || "";
    return new Response(loc, { status: loc ? 200 : 502, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" } });
  }
  const resp = await fetch(target.toString(), { headers: UA });
  const ct = resp.headers.get("content-type") || "";
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  const maybePlaylist = ct.includes("mpegurl") || ct.includes("text") || target.pathname.endsWith(".m3u8");
  if (maybePlaylist) {
    const buf = await resp.arrayBuffer();
    const head = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, 64)).trimStart();
    if (head.startsWith("#EXTM3U")) {
      const text = new TextDecoder("utf-8").decode(buf);
      const finalUrl = resp.url ? new URL(resp.url) : target;
      const wrap = function(abs) { return url.origin + "/p?u=" + encodeURIComponent(abs); };
      const out = text.split("\n").map(function(line) {
        const t = line.trim();
        if (!t) return line;
        if (t.charAt(0) === "#") {
          return line.replace(/URI="([^"]+)"/g, function(m, x) {
            try { return "URI=\"" + wrap(new URL(x, finalUrl).toString()) + "\""; } catch (e) { return m; }
          });
        }
        try { return wrap(new URL(t, finalUrl).toString()); } catch (e) { return line; }
      }).join("\n");
      headers.set("Content-Type", "application/vnd.apple.mpegurl");
      return new Response(out, { status: resp.status, headers: headers });
    }
    return new Response(buf, { status: resp.status, headers: headers });
  }
  return new Response(resp.body, { status: resp.status, headers: headers });
}
