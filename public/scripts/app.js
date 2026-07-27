/**
 * 视频转 MP3 — 基于 ffmpeg.wasm 的浏览器端音频提取工具
 */

// ===== DOM 元素 =====
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const convertSection = document.getElementById('convertSection');
const statusSection = document.getElementById('statusSection');
const resultSection = document.getElementById('resultSection');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const convertBtn = document.getElementById('convertBtn');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');
const resultCard = document.getElementById('resultCard');

// ===== 支持的视频格式 =====
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', '3gp'];

let selectedFile = null;
let ffmpeg = null;

// ===== 获取文件扩展名 =====
function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// ===== 格式化文件大小 =====
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

// ===== 加载 ffmpeg.wasm =====
async function loadFFmpeg() {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

  ffmpeg = new FFmpegWASM.FFmpeg();

  // 监听日志（调试用）
  ffmpeg.on('log', ({ message }) => {
    console.log('[ffmpeg]', message);
  });

  // 监听进度（extractAudio 场景下较少触发，主要靠 exec 本身）
  ffmpeg.on('progress', ({ progress }) => {
    const pct = Math.round(progress * 100);
    progressFill.style.width = pct + '%';
    statusText.textContent = `正在转换... ${pct}%`;
  });

  // 从 CDN 加载 ffmpeg core（wasm 超 25MiB，不适合 Pages 静态托管）
  await ffmpeg.load({
    coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
  });

  return ffmpeg;
}

// ===== 处理文件选择 =====
function handleFile(file) {
  const ext = getExtension(file.name);

  if (!VIDEO_EXTENSIONS.includes(ext)) {
    alert(`不支持的格式：.${ext}\n支持：${VIDEO_EXTENSIONS.map(e => '.' + e).join('、')}`);
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);

  convertSection.style.display = 'block';
  statusSection.style.display = 'none';
  resultSection.style.display = 'none';
}

// ===== 开始转换 =====
convertBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  const quality = document.querySelector('input[name="quality"]:checked').value;

  // 显示进度区域
  statusSection.style.display = 'block';
  resultSection.style.display = 'none';
  progressFill.style.width = '0%';
  statusText.textContent = '正在加载转换引擎...';
  convertBtn.disabled = true;

  try {
    // 1. 加载 ffmpeg
    const ffmpeg = await loadFFmpeg();
    statusText.textContent = '引擎就绪，开始转换...';

    // 2. 将视频文件写入虚拟文件系统
    const inputName = 'input.' + getExtension(selectedFile.name);
    const inputData = new Uint8Array(await selectedFile.arrayBuffer());
    await ffmpeg.writeFile(inputName, inputData);

    // 3. 一步完成：丢弃视频流 + 音频转码 MP3
    //    -vn            去掉视频流，只处理音频
    //    -c:a libmp3lame  音频编码为 MP3
    //    -q:a           音质控制（0=320kbps, 2=192kbps, 5=128kbps）
    //    -y             覆盖已有输出文件
    statusText.textContent = '正在提取音频并编码为 MP3...';
    await ffmpeg.exec([
      '-i', inputName,
      '-vn',
      '-c:a', 'libmp3lame',
      '-q:a', quality,
      '-y',
      'output.mp3',
    ]);

    // 4. 读取转换结果
    statusText.textContent = '转换完成，正在打包下载...';
    const outputData = await ffmpeg.readFile('output.mp3');

    // 5. 清理临时文件
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile('output.mp3');

    // 6. 生成下载
    const outputName = selectedFile.name.replace(/\.[^.]+$/, '') + '.mp3';
    const blob = new Blob([outputData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    progressFill.style.width = '100%';
    statusSection.style.display = 'none';

    resultCard.innerHTML = `
      <div class="success-icon">✅</div>
      <p style="font-weight:600; font-size:1.1rem;">转换成功！</p>
      <p style="color:#666; font-size:0.85rem; margin:4px 0;">
        ${selectedFile.name} → ${outputName}
      </p>
      <p style="color:#999; font-size:0.8rem; margin-bottom:12px;">
        文件大小：${formatFileSize(outputData.length)}
      </p>
      <a class="download-link" href="${url}" download="${outputName}">
        ⬇ 下载 MP3
      </a>
    `;
    resultSection.style.display = 'block';
  } catch (err) {
    console.error('转换失败:', err);
    statusSection.style.display = 'none';
    resultCard.innerHTML = `
      <div class="success-icon" style="filter:grayscale(1);">❌</div>
      <p style="color:#e53e3e;">转换失败</p>
      <p style="color:#666; font-size:0.85rem; margin-top:4px;">${err.message || '未知错误，请重试'}</p>
    `;
    resultSection.style.display = 'block';
  } finally {
    convertBtn.disabled = false;
  }
});

// ===== 拖拽上传 =====
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) handleFile(file);
});
