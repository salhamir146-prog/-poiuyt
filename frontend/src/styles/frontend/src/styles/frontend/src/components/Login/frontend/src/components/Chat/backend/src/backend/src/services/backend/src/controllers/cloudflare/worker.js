export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // مسیرهای API که نیاز به پروکسی دارند
    if (path.startsWith('/api/ai')) {
      return handleAIRequest(request, env, corsHeaders);
    }

    // پروکسی به بک‌اند اصلی
    return proxyToBackend(request, env, corsHeaders);
  }
};

async function handleAIRequest(request, env, corsHeaders) {
  try {
    // دریافت کلید API از محیط Cloudflare
    const apiKey = env.AI_API_KEY || env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ AI_API_KEY not configured in Cloudflare');
      return new Response(JSON.stringify({ 
        error: 'API Key not configured in Cloudflare',
        details: 'Please set AI_API_KEY in Cloudflare environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const body = await request.json();
    
    console.log('📤 Sending request to OpenAI via Cloudflare...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: body.messages || [],
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 2000,
        ...body
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ OpenAI API Error:', data);
      return new Response(JSON.stringify({
        error: 'OpenAI API Error',
        details: data.error?.message || 'Unknown error'
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('✅ OpenAI response received successfully');
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('❌ Cloudflare Worker Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function proxyToBackend(request, env, corsHeaders) {
  try {
    const backendUrl = env.BACKEND_URL || 'http://localhost:5000';
    const url = new URL(request.url);
    
    console.log(`🔄 Proxying to backend: ${backendUrl}${url.pathname}`);
    
    const response = await fetch(`${backendUrl}${url.pathname}${url.search}`, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' ? request.body : undefined
    });

    // اضافه کردن CORS headers به پاسخ
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Backend connection failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
