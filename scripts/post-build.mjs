import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// 读取原始manifest.json
const manifestSrcPath = path.join(rootDir, 'src/manifest.json');
const manifestData = JSON.parse(fs.readFileSync(manifestSrcPath, 'utf8'));

// 生成构建时间戳
const now = new Date();
const buildTimestamp = now.toISOString()
  .replace(/[-:T]/g, '')     // 移除日期分隔符
  .replace(/\..+/, '')       // 移除毫秒和时区
  .slice(0, 12);            // 取前12位：YYYYMMDDHHMM

// 从时间戳生成构建编号（取后6位作为第四个版本数字）
const buildNumber = parseInt(buildTimestamp.slice(-6), 10);

// Chrome扩展版本号必须是1-4个点分隔的整数，每个0-65536
// 格式：主版本.次版本.修订版本.构建编号
const originalVersion = manifestData.version;
const versionParts = originalVersion.split('.').map(Number);
const chromeVersion = `${versionParts[0] || 1}.${versionParts[1] || 0}.${versionParts[2] || 0}.${buildNumber}`;

// 详细的版本名称（用于显示）
const detailedVersion = `${originalVersion}-build.${buildTimestamp}`;

// 修改manifest.json
manifestData.version = chromeVersion;
manifestData.version_name = detailedVersion;

// 确保dist目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 写入更新后的manifest.json
const manifestDestPath = path.join(distDir, 'manifest.json');
fs.writeFileSync(manifestDestPath, JSON.stringify(manifestData, null, 2));

// 生成版本信息文件，供前端使用
const versionInfo = {
  version: detailedVersion,
  chromeVersion: chromeVersion,
  originalVersion: originalVersion,
  buildTimestamp: buildTimestamp,
  buildDate: now.toISOString(),
  buildDateLocal: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
  buildNumber: buildTimestamp
};

// 写入版本信息文件到dist目录
const versionInfoPath = path.join(distDir, 'version.json');
fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));

// 将版本信息文件复制到public目录，这样在构建时可以被包含
const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const publicVersionPath = path.join(publicDir, 'version.json');
fs.writeFileSync(publicVersionPath, JSON.stringify(versionInfo, null, 2));

// 移动popup.html到正确位置
const htmlSrc = path.join(distDir, 'src/popup/popup.html');
const htmlDest = path.join(distDir, 'popup/popup.html');
if (fs.existsSync(htmlSrc)) {
  // 确保目标目录存在
  const htmlDestDir = path.dirname(htmlDest);
  if (!fs.existsSync(htmlDestDir)) {
    fs.mkdirSync(htmlDestDir, { recursive: true });
  }
  fs.renameSync(htmlSrc, htmlDest);
}

// 删除src目录
const srcDir = path.join(distDir, 'src');
if (fs.existsSync(srcDir)) {
  fs.rmSync(srcDir, { recursive: true });
}

// 在background脚本中注入版本信息
const backgroundJsPath = path.join(distDir, 'background/background.js');
if (fs.existsSync(backgroundJsPath)) {
  let backgroundJs = fs.readFileSync(backgroundJsPath, 'utf8');
  
  // 在脚本开头添加版本信息
  const versionInjection = `
// 版本信息注入
window.__TXMEETING_VERSION__ = ${JSON.stringify(detailedVersion)};
window.__TXMEETING_BUILD_INFO__ = ${JSON.stringify(versionInfo)};
console.log('[TXMeeting] 版本: ${detailedVersion}');
console.log('[TXMeeting] 构建时间: ${versionInfo.buildDateLocal}');
`;
  
  backgroundJs = versionInjection + backgroundJs;
  fs.writeFileSync(backgroundJsPath, backgroundJs);
}

// 在content脚本中注入版本信息
const contentJsPath = path.join(distDir, 'content/content.js');
if (fs.existsSync(contentJsPath)) {
  let contentJs = fs.readFileSync(contentJsPath, 'utf8');
  
  // 在脚本开头添加版本信息
  const versionInjection = `
// 版本信息注入
window.__TXMEETING_VERSION__ = ${JSON.stringify(detailedVersion)};
window.__TXMEETING_BUILD_INFO__ = ${JSON.stringify(versionInfo)};
console.log('[TXMeeting] Content Script 版本: ${detailedVersion}');
`;
  
  contentJs = versionInjection + contentJs;
  fs.writeFileSync(contentJsPath, contentJs);
}

// 在injected脚本中注入版本信息
const injectedJsPath = path.join(distDir, 'content/injected.js');
if (fs.existsSync(injectedJsPath)) {
  let injectedJs = fs.readFileSync(injectedJsPath, 'utf8');
  
  // 在脚本开头添加版本信息
  const versionInjection = `
// 版本信息注入
window.__TXMEETING_VERSION__ = ${JSON.stringify(detailedVersion)};
window.__TXMEETING_BUILD_INFO__ = ${JSON.stringify(versionInfo)};
console.log('[TXMeeting] Injected Script 版本: ${detailedVersion}');
`;
  
  injectedJs = versionInjection + injectedJs;
  fs.writeFileSync(injectedJsPath, injectedJs);
}

// 输出构建信息
console.log('✅ 构建后处理完成');
console.log(`📦 版本信息: ${originalVersion} → ${detailedVersion}`);
console.log(`🔧 Chrome版本号: ${chromeVersion}`);
console.log(`⏰ 构建时间: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
console.log(`📁 输出目录: ${distDir}`);
console.log(`📄 版本信息文件: ${versionInfoPath}`);
console.log('');
console.log('🔍 调试提示:');
console.log('  - 在浏览器控制台中输入: window.__TXMEETING_VERSION__');
console.log('  - 在浏览器控制台中输入: window.__TXMEETING_BUILD_INFO__');
console.log('  - 查看Popup页面底部的版本信息');
console.log('  - 在 chrome://extensions 中查看扩展详情的版本号');