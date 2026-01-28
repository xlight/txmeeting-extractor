import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// 复制manifest.json
fs.copyFileSync(
  path.join(rootDir, 'src/manifest.json'),
  path.join(distDir, 'manifest.json')
);

// 移动popup.html到正确位置
const htmlSrc = path.join(distDir, 'src/popup/popup.html');
const htmlDest = path.join(distDir, 'popup/popup.html');
if (fs.existsSync(htmlSrc)) {
  fs.renameSync(htmlSrc, htmlDest);
}

// 删除src目录
const srcDir = path.join(distDir, 'src');
if (fs.existsSync(srcDir)) {
  fs.rmSync(srcDir, { recursive: true });
}

console.log('✅ 构建后处理完成');
