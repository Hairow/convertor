/**
 * Cloudflare Pages Function — 文件转换 API
 *
 * 路由映射：
 *   functions/api/convert.js  →  /api/convert
 *
 * 目录结构与路由对应关系：
 *   functions/hello.js        →  /hello
 *   functions/api/convert.js  →  /api/convert
 *   functions/users/[id].js   →  /users/:id  （动态路由）
 *   functions/_middleware.js  →  全局中间件
 *
 * 请求示例（POST）：
 *   const formData = new FormData();
 *   formData.append('file', videoFile);
 *   formData.append('targetFormat', 'mp3');
 *   fetch('/api/convert', { method: 'POST', body: formData });
 */
export async function onRequest(context) {
  // context 对象包含以下关键属性：
  //   context.request  — 原始 Request 对象（含 method、headers、body）
  //   context.env      — 环境变量 & 绑定（wrangler.jsonc 中配置的 vars、KV、R2、D1）
  //   context.params   — 动态路由参数（如 [id].js 中捕获的值）
  //   context.waitUntil — 延长执行时间（用于后台任务）
  //   context.next     — 调用下一个中间件（仅在 _middleware.js 中可用）

  // 仅允许 POST 请求
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 解析前端发送的 FormData（multipart/form-data）
    const formData = await context.request.formData();
    const file = formData.get('file');              // File 对象
    const targetFormat = formData.get('targetFormat'); // 目标格式，如 'mp3'

    // 参数校验
    if (!file || !targetFormat) {
      return new Response(JSON.stringify({ error: 'Missing file or targetFormat' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: 在此实现实际的格式转换逻辑
    // 方案一：使用 Cloudflare Workers 集成 ffmpeg.wasm（注意 Workers 有 128MiB 内存限制）
    // 方案二：调用外部转换 API（如 CloudConvert、Zamzar 等）
    // 方案三：通过 R2 暂存文件，由外部服务异步处理

    return new Response(JSON.stringify({
      success: true,
      message: 'Conversion completed',
      filename: file.name,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // 异常兜底
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
