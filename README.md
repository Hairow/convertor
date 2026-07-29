# Convertor

基于 Cloudflare Pages 的在线视频转 MP3 工具，转换全程在浏览器本地完成，视频不会上传到服务器。

## 功能

- 支持 MP4 / WebM / AVI / MOV / MKV / FLV / WMV / M4V / 3GP 等视频格式
- 拖拽或点击上传，自动提取音频并转为 MP3
- 三种音质可选：高品质 (320kbps) / 标准 (192kbps) / 小文件 (128kbps)
- 最高支持 **1GB** 视频文件
- 转换完成后自动触发下载

## 技术实现

| 组件 | 技术 |
|------|------|
| 转换引擎 | [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) (v0.12.x) |
| 托管平台 | Cloudflare Pages |
| 服务端 API | Cloudflare Pages Functions (`/api/convert`) |
| 开发工具 | [Wrangler](https://developers.cloudflare.com/workers/wrangler/) |

## 项目结构

```
convertor/
├── public/
│   ├── index.html             # 入口页面
│   ├── scripts/
│   │   └── app.js             # 核心转换逻辑
│   ├── styles/
│   │   └── main.css           # 样式
│   └── lib/
│       └── ffmpeg/
│           └── ffmpeg.js       # ffmpeg.wasm 主库
├── functions/
│   └── api/
│       └── convert.js          # /api/convert (待实现)
├── wrangler.jsonc              # Cloudflare 配置
└── package.json
```

## 开发

```bash
# 安装依赖
npm install

# 本地启动
npm run dev

# 部署到 Cloudflare Pages
npm run deploy
```

本地开发后访问 `http://localhost:8788`。

## 注意事项

- ffmpeg.wasm Core 文件（>25MiB）从 CDN 加载，未托管在 Pages 静态资源中
- `functions/api/convert.js` 为服务端转换 API 骨架，当前转换逻辑在浏览器端完成
- 超过 1GB 文件受浏览器 ArrayBuffer 分配上限（~2GB）限制，建议分片处理
