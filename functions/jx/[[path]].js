export async function onRequest(context) {
  const url = new URL(context.request.url);
  const rest = url.pathname.replace(/^\/jx\//, "");
  const target = "https://iptv.chining.eu.org:8443/" + rest + url.search;
  const resp = await fetch(target);
  const ct = resp.headers.get("content-type") || "";
  const headers = new Headers(resp.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  if (ct.includes("mpegurl")) {
    let text = await resp.text();
    const dir = url.pathname.substring(0, url.pathname.lastIndexOf("/") + 1);
    const base = url.origin + dir;
    text = text.split("\n").map(function(line) {
      const t = line.trim();
      if (!t) return line;
      if (t.charAt(0) === "#") {
        return line.replace(/URI="([^"]+)"/g, function(m, x) { return x.startsWith("http") ? m : "URI=\"" + base + x + "\""; });
      }
      return t.startsWith("http") ? line : base + t;
    }).join("\n");
    return new Response(text, { status: resp.status, headers: headers });
  }
  return new Response(resp.body, { status: resp.status, headers: headers });
}
