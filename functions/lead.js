// functions/lead.js
export async function onRequestPost(context) {
  try {
    const token = context.env.TELEGRAM_BOT_TOKEN;
    const chatId = context.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return json(500, {
        ok: false,
        error: "Server misconfigured: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set",
      });
    }

    const contentType = context.request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return json(400, { ok: false, error: "Expected application/json" });
    }

    const body = await context.request.json();
    const text = (body?.text ?? "").toString().trim();

    // Telegram limit: 4096 символов
    if (text.length < 5 || text.length > 3800) {
      return json(400, { ok: false, error: "Invalid text length" });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    if (!tgRes.ok) {
      const details = await safeText(tgRes);
      return json(502, { ok: false, error: "Telegram API error", details });
    }

    return json(200, { ok: true });
  } catch (e) {
    return json(502, { ok: false, error: "Network or runtime error" });
  }
}

export async function onRequestGet() {
  // чтобы при проверке в браузере было понятно, что функция существует
  return json(405, { ok: false, error: "Method Not Allowed (use POST)" });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
