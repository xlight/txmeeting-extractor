# Tencent Meeting Info Extractor | 腾讯会议信息提取器

Chrome 浏览器扩展插件，用于从腾讯会议云录屏界面自动提取会议信息并导出为 Markdown 格式。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)

## 功能特性

### 🎯 自动提取

- **零手动操作**: 自动拦截腾讯会议 API 响应，无需额外请求
- **实时缓存**: 本地存储，快速访问，支持离线查看
- **智能识别**: 自动识别并提取所有可用的会议数据

### 📊 丰富的数据支持

提取完整会议信息，包括：

- ✅ **基础信息**: 会议标题、ID、录制 ID、时长、开始/结束时间
- 💡 **AI 智能总结**: 会议核心内容自动生成
- 📝 **会议纪要**: 结构化的会议记录
- 🎙️ **完整转写**: 带时间戳和发言人的完整对话记录
- 📄 **段落结构**: 有序的内容段落
- 👥 **参会人员**: 完整的与会者列表及加入时间
- 💬 **聊天记录**: 会议期间的所有聊天消息
- ✅ **行动项**: 提取的待办事项和任务
- ⭐ **重点时刻**: 标记的关键时间点
- 🖥️ **屏幕分享**: 分享内容引用

### 🎨 友好的用户界面

- **清晰分类**: 按功能模块展示信息
- **可折叠 Section**: 灵活控制显示内容
- **一键复制**: 每个 section 独立复制功能
- **响应式设计**: 适配不同屏幕尺寸

### 📤 便捷导出

- **Markdown 格式**: 结构化、易读、易分享
- **自动命名**: 智能生成文件名（会议标题-日期.md）
- **UTF-8 编码**: 完美支持中文内容
- **一键下载**: 点击即可导出完整会议记录

## 安装使用

### 📥 安装方法

#### 方式一：从源码构建（开发者）

```bash
# 1. 克隆仓库
git clone <repository-url>
cd txmeeting-getinfo

# 2. 安装依赖
npm install

# 3. 构建扩展
npm run build

# 4. 加载到Chrome
# - 打开 chrome://extensions/
# - 开启"开发者模式"
# - 点击"加载已解压的扩展程序"
# - 选择 dist 文件夹
```

#### 方式二：Chrome Web Store（即将上线）

访问 Chrome Web Store 搜索 "Tencent Meeting Info Extractor" 并安装。

### 📖 使用指南

1. **访问腾讯会议云录屏页面**
   - URL 格式: `https://meeting.tencent.com/cw/xxxxx`
   - 等待页面完全加载

2. **查看会议信息**
   - 点击浏览器工具栏的扩展图标（蓝色 TM）
   - 弹出窗口将显示所有提取的会议信息
   - 各个 section 可以独立折叠/展开和复制

3. **导出 Markdown**
   - 点击 "📥 导出 Markdown" 按钮
   - 文件自动下载到默认下载位置
   - 使用任意 Markdown 编辑器打开查看

### 🎥 示例截图

*（这里可以添加扩展界面截图）*

## 技术栈

| 技术 | 说明 |
|------|------|
| **核心** | Chrome Extension Manifest V3 |
| **语言** | TypeScript (严格模式) |
| **UI 框架** | React 19 |
| **构建工具** | Vite 7 |
| **代码规范** | ESLint + Prettier |
| **API 拦截** | Content Script + Service Worker |
| **数据缓存** | Chrome Storage API |

## 项目结构

```
src/
├── background/       # Service Worker 后台脚本
│   └── index.ts      # API 拦截和数据缓存
├── content/          # Content Script
│   └── index.ts      # 页面注入，拦截 fetch/XHR
├── popup/            # 弹出窗口界面
│   ├── App.tsx       # 主应用组件
│   ├── popup.html    # HTML 入口
│   └── components/   # React 组件
├── utils/            # 工具函数
│   ├── extractor.ts  # 数据提取和验证
│   └── exporter.ts   # Markdown 生成和导出
├── types/            # TypeScript 类型定义
│   └── meeting.ts    # 会议数据类型
└── manifest.json     # 扩展清单
```

## 开发指南

### 🛠️ 开发模式

```bash
# 开发模式（自动重新构建）
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 打包为ZIP（用于发布）
npm run package
```

### 📚 文档

- **用户指南**: [`USER_GUIDE.md`](./USER_GUIDE.md) - 详细使用说明
- **开发文档**: [`DEVELOPMENT.md`](./DEVELOPMENT.md) - 技术架构和开发指南
- **OpenSpec 设计**: [`openspec/`](./openspec/) - 完整的设计规格文档

### 🐛 调试

**查看日志**:
- Background Script: `chrome://extensions/` → 扩展详情 → Service Worker
- Content Script: 页面右键检查 → Console（过滤 `[TXMeeting]`）
- Popup: 右键弹出窗口 → 检查

**常见问题**:
- 数据未提取？检查是否访问了正确的腾讯会议页面
- Popup 空白？查看 Console 是否有错误
- 导出失败？检查浏览器下载权限设置

## 隐私与安全

### 🔒 隐私承诺

- ✅ **本地存储**: 所有数据仅存储在您的浏览器本地
- ✅ **零上传**: 不上传任何数据到外部服务器
- ✅ **最小权限**: 仅请求必要的 storage 和 host 权限
- ✅ **开源透明**: 代码完全开源，欢迎审查

### 🛡️ 安全措施

- **XSS 防护**: 所有用户内容经过清理和转义
- **CSP 策略**: 严格的内容安全策略
- **权限范围**: 仅限 `https://meeting.tencent.com/*` 域名

## 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 🙏 贡献指南

- 遵循现有代码风格（ESLint + Prettier）
- 添加适当的注释和文档
- 确保类型安全（TypeScript strict mode）
- 测试您的更改

## 更新日志

### v1.0.0 (2026-01-27)

🎉 **首个版本发布**

- ✅ 实现基础会议信息提取
- ✅ 支持 9 种数据类型提取（转写、总结、纪要等）
- ✅ React 弹出界面，支持折叠和复制
- ✅ Markdown 导出功能
- ✅ 完整的 TypeScript 类型支持
- ✅ Chrome Manifest V3 兼容

## License

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- 腾讯会议团队提供的云录屏服务
- React 和 Vite 社区
- 所有贡献者和用户

---

**⭐ 如果这个项目对您有帮助，请给个 Star！**

有问题或建议？[提交 Issue](../../issues) 或 [开启讨论](../../discussions)
