export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
  
    if (request.method === "POST" && path === "/admin/update") {
  return await handleManualUpdate(request, env);
}

    if (request.method === "GET" && path === "/dns-dashboard") {
      return await handleDashboard(env);
    }

    if (request.method === "GET" && path === "/dashboard") {
      const html = await env.DNS_KV.get("dashboard.html");
      return new Response(html, {
        headers: { "Content-Type": "text/html" }
      });
    }

    if (request.method === "POST" && path === "/") {
      return await handleUpdate(request, env);
    }

    if (request.method === "POST" && path === "/admin/session") {
      return await handleAdminLogin(request, env);
    }

    if (request.method === "GET" && path === "/admin/session") {
      return handleSessionCheck(request);
    }

    if (request.method === "POST" && path === "/admin/delete") {
      return await handleDelete(request, env);
    }

    return new Response("Not found", { status: 404 });
  }
};

async function handleDashboard(env) {
  const list = await env.DNS_KV.list({ prefix: "dns:" });
  const results = await Promise.all(
    list.keys.map(async (key) => {
      const data = await env.DNS_KV.get(key.name, { type: "json" });
      return data;
    })
  );

  return new Response(JSON.stringify(results), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60"
    },
  });
}

async function handleUpdate(request, env) {
  try {
    const body = await request.json();
    const ip = body.ip;
    const name = body.name;

    if (!ip || !name) {
      return new Response("Missing IP or name", { status: 400 });
    }

    const zone = env.CF_ZONE_ID;
    const token = env.CF_API_TOKEN;

    const listURL = `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?name=${name}`;
    const listRes = await fetch(listURL, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const listJson = await listRes.json();
    const record = (listJson.result || [])[0];

    const result = await handleDNSUpdate(env, name, ip, record);
    return new Response(result, { status: 200 });

  } catch (err) {
    console.error("Worker error:", err);
    return new Response("Worker crashed: " + err.toString(), { status: 500 });
  }
}

async function handleAdminLogin(request, env) {
  const body = await request.json();
  if (body.password === "yourStrongPassword") {
    const headers = new Headers({
      "Set-Cookie": `auth=1; HttpOnly; Path=/; Max-Age=86400`,
      "Content-Type": "application/json"
    });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }
  return new Response("Unauthorized", { status: 401 });
}

function handleSessionCheck(request) {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("auth=1")) {
    return new Response("OK", { status: 200 });
  }
  return new Response("Unauthorized", { status: 401 });
}

async function handleDelete(request, env) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  const cookie = request.headers.get("Cookie") || "";

  if (!cookie.includes("auth=1")) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!name) {
    return new Response("Missing name", { status: 400 });
  }

  const key = `dns:${name}`;
  await env.DNS_KV.delete(key);
  return new Response("Deleted", { status: 200 });
}

async function saveDNSRecord(env, name, ip) {
  const key = `dns:${name}`;
  const value = JSON.stringify({
    name,
    content: ip,
    updated: new Date().toISOString(),
  });
  await env.DNS_KV.put(key, value);
}

async function handleDNSUpdate(env, name, ip, currentRecord) {
  if (currentRecord && currentRecord.content === ip) {
    console.log("IP unchanged; skipping update.");
    return "No update needed";
  }

  const zone = env.CF_ZONE_ID;
  const token = env.CF_API_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  if (!currentRecord) {
    console.log("Creating DNS record...");
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "A", name, content: ip, ttl: 120, proxied: false })
    });
  } else {
    console.log("Updating DNS record...");
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${currentRecord.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ type: "A", name, content: ip, ttl: 120, proxied: false })
    });
  }

  await saveDNSRecord(env, name, ip);
  return "Updated";
}
