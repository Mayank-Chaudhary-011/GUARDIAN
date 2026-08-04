const BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function runEval(inputText, outputText) {
  const res = await fetch(`${BASE}/eval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input_text: inputText, output_text: outputText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json();
}

export async function improveOutput(inputText, outputText, issues) {
  const res = await fetch(`${BASE}/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input_text: inputText, output_text: outputText, issues }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Ask the LLM to rewrite a bad/unclear user prompt into a better one */
export async function improvePrompt(inputText, issues) {
  const systemPrompt = `You are a prompt engineering expert. A user submitted a question to an AI system that got a poor evaluation. 
Rewrite the user's question to be clearer, more specific, and more answerable.
Return ONLY the improved question — no explanation, no prefix.`;

  const userMsg = `Original question: "${inputText}"\n\nIssues found: ${issues.join(', ')}\n\nRewrite this question to be better.`;

  const res = await fetch(`${BASE}/proxy/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMsg },
      ],
      model: 'gpt-4o-mini',
      evaluate: false,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function fetchStats() {
  const [sRes, rRes] = await Promise.all([
    fetch(`${BASE}/stats`),
    fetch(`${BASE}/regression`),
  ]);
  const stats = sRes.ok ? await sRes.json() : {};
  const reg   = rRes.ok ? await rRes.json() : null;
  return { ...stats, regression: reg };
}

export async function fetchProxyLogs(limit = 50) {
  const res = await fetch(`${BASE}/proxy/logs?limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

export async function proxyChat(messages, model = 'gpt-4o-mini', evaluate = true) {
  const res = await fetch(`${BASE}/proxy/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, evaluate }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err;
  }
  return res.json();
}

export function createProxyLogSocket(onMessage, onOpen, onClose) {
  const base = import.meta.env.VITE_API_BASE_URL;
  let wsUrl;
  if (base) {
    const host = base.replace(/^https?:\/\//, '');
    const proto = base.startsWith('https') ? 'wss' : 'ws';
    wsUrl = `${proto}://${host}/ws/proxy-logs`;
  } else {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    wsUrl = `${proto}://${window.location.host}/ws/proxy-logs`;
  }
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
  if (onOpen)  ws.onopen  = onOpen;
  if (onClose) ws.onclose = onClose;
  ws.onerror = () => {};
  return ws;
}
