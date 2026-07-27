/**
 * Cloudflare Pages Function — 文件转换 API
 * POST /api/convert
 */
export async function onRequest(context) {
  // 仅允许 POST 请求
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file');
    const targetFormat = formData.get('targetFormat');

    if (!file || !targetFormat) {
      return new Response(JSON.stringify({ error: 'Missing file or targetFormat' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: 在此实现实际的格式转换逻辑
    // 可以集成第三方转换库或调用外部 API

    return new Response(JSON.stringify({
      success: true,
      message: 'Conversion completed',
      filename: file.name,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
