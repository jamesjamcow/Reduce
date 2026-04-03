export interface Env {
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method !== 'POST') {
      return new Response('Reduce worker is healthy.', { status: 200 });
    }

    if (!env.GEMINI_API_KEY) {
      return Response.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const body = await request.json();
    return Response.json({
      mode: 'proxy-stub',
      received: body,
    });
  },
};
