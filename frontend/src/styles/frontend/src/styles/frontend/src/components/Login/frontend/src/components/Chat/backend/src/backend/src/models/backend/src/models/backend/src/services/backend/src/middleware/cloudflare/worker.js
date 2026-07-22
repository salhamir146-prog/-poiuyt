export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // مسیرهای API که نیاز به پروکسی دارند
    if (path.startsWith('/api/ai')) {
      return handleAIRequest(request, env);
    }

    // پروکسی به بک‌اند اصلی
    return proxyToBackend(request, env);
  }
};

async function handleAIRequest(request, env) {
  try {
    const body = await request.json();
    const apiKey = env.AI_API_KEY || env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: body.messages || [],
        temperature: 0.7,
        max_tokens: 2000,
        ...body
      })
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function proxyToBackend(request, env) {
  const backendUrl = env.BACKEND_URL || 'http://localhost:5000';
  const url = new URL(request.url);
  
  const response = await fetch(`${backendUrl}${url.pathname}${url.search}`, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  return response;
}
