# Tencent Meeting Info Extractor | 腾讯会议信息提取器

> 🚀 一键提取腾讯会议云录屏的完整会议信息，支持 AI 总结、转写、纪要、统计等多维度数据导出

Chrome 浏览器扩展插件，用于从腾讯会议云录屏界面自动提取会议信息并导出为 Markdown 格式。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)](https://vitejs.dev/)

## ✨ 核心亮点

- 🎯 **零手动操作** - 自动拦截 API，无需任何手动配置
- 📊 **全面数据提取** - 支持 9 种数据类型，25+ API 端点覆盖
- 🎨 **现代化 UI** - React 19 + TypeScript，流畅的用户体验
- 📤 **一键导出** - Markdown 格式，完美兼容各种笔记工具
- 🔒 **隐私安全** - 本地存储，零上传，代码开源
- ⚡ **高性能** - 虚拟滚动、增量加载，流畅处理长会议

## 功能特性

### 🎯 自动提取

- **零手动操作**: 自动拦截腾讯会议 API 响应，无需额外请求
- **实时缓存**: 本地存储，快速访问，支持离线查看
- **智能识别**: 自动识别并提取所有可用的会议数据

### 📊 丰富的数据支持

提取完整会议信息，包括：

- ✅ **基础信息**: 会议标题、ID、录制 ID、时长、开始/结束时间
- 💡 **AI 智能总结**:
  - 完整总结：会议核心内容完整总结
  - 多段总结：分段式会议内容总结
- 📝 **会议纪要**: 结构化的会议记录（支持富文本格式）
- 🎙️ **完整转写**: 带时间戳和发言人的完整对话记录
- 📊 **会议统计**:
  - 智能话题：自动识别的会议主题及时长占比
  - 参会人员发言统计：每位参会者的发言时长和占比（含头像）
  - 会议章节：自动划分的章节及时长占比（含封面图）
- 👥 **参会人员**: 完整的与会者列表及加入时间
- 💬 **聊天记录**: 会议期间的所有聊天消息
- ✅ **行动项**: 提取的待办事项和任务
- ⭐ **重点时刻**: 标记的关键时间点

### 🎨 友好的用户界面

- **清晰分类**: 按功能模块展示信息（基础信息、总结、纪要、转写、统计、人员等）
- **可折叠 Section**: 灵活控制显示内容，默认展开总结和元数据
- **一键复制**: 每个 section 独立复制功能
- **统计可视化**:
  - 时长进度条：直观显示话题、章节、发言占比
  - 时长格式化：自动格式化为 "X小时X分X秒" 或 "X分X秒"
  - 智能排序：话题按占比排序，人员按发言时长排序
- **响应式设计**: 适配不同屏幕尺寸，支持长内容滚动

### 📤 便捷导出

- **Markdown 格式**: 结构化、易读、易分享
- **完整内容**: 导出所有可用数据（总结、纪要、转写、统计等）
- **自动命名**: 智能生成文件名（会议标题-日期.md）
- **UTF-8 编码**: 完美支持中文内容
- **一键下载**: 点击即可导出完整会议记录

## 安装使用

### 📥 安装方法

#### 方式一：从源码构建（开发者）

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/txmeeting-getinfo.git
cd txmeeting-getinfo

# 2. 安装依赖
npm install

# 3. 构建扩展
npm run build

# 4. 加载到 Chrome
# - 打开 chrome://extensions/
# - 开启"开发者模式"
# - 点击"加载已解压的扩展程序"
# - 选择 dist 文件夹
```

**开发模式（自动重新构建）：**

```bash
npm run dev
```

#### 方式二：Chrome Web Store（即将上线）

访问 Chrome Web Store 搜索 "Tencent Meeting Info Extractor" 并安装。

### 📖 使用指南

#### 基本使用

1. **访问腾讯会议云录屏页面**
   - URL 格式: `https://meeting.tencent.com/cw/xxxxx`
   - 等待页面完全加载（会议信息自动提取）

2. **查看会议信息**
   - 点击浏览器工具栏的扩展图标（蓝色 TM）
   - 弹出窗口将显示所有提取的会议信息
   - 各个 section 可以独立折叠/展开和复制
   - 查看会议统计（智能话题、参会人员发言时长、会议章节）

3. **导出 Markdown**
   - 点击 "📥 导出 Markdown" 按钮
   - 文件自动下载到默认下载位置
   - 使用任意 Markdown 编辑器打开查看

#### 高级功能

- **一键复制**：点击每个 section 右上角的复制按钮，快速复制内容到剪贴板
- **折叠管理**：根据需要折叠不关心的 section，聚焦重要内容
- **进度条可视化**：在统计视图中直观查看话题、章节、发言占比
- **离线访问**：数据本地缓存，关闭页面后仍可查看（直到浏览器缓存清除）

### 🎥 示例截图

_（这里可以添加扩展界面截图）_

### 💡 使用技巧

1. **快速访问**：将扩展图标固定到工具栏，方便随时查看会议信息
2. **定期导出**：建议定期导出重要会议记录，避免浏览器缓存清理导致数据丢失
3. **配合笔记工具**：导出的 Markdown 文件可直接导入 Notion、Obsidian 等笔记工具
4. **分享会议要点**：使用一键复制功能，快速分享会议总结到团队协作工具

## 技术栈

| 技术         | 说明                            | 版本 |
| ------------ | ------------------------------- | ---- |
| **核心**     | Chrome Extension Manifest V3    | V3   |
| **语言**     | TypeScript (严格模式)           | 5.9+ |
| **UI 框架**  | React                           | 19.0 |
| **构建工具** | Vite                            | 7.3  |
| **代码规范** | ESLint + Prettier               | 9.x  |
| **API 拦截** | Content Script + Service Worker | -    |
| **数据缓存** | Chrome Storage API              | -    |
| **其他依赖** | react-markdown, react-window    | -    |

## 项目结构

```
src/
├── background/           # Service Worker 后台脚本
│   └── index.ts          # API 拦截和数据缓存
├── popup/                # 弹出窗口界面
│   ├── App.tsx           # 主应用组件
│   ├── popup.html        # HTML 入口
│   ├── contexts/         # React Context (数据和状态管理)
│   │   ├── MeetingDataContext.tsx  # 会议数据上下文
│   │   └── UIStateContext.tsx      # UI 状态上下文
│   ├── components/       # React 组件
│   │   ├── layout/       # 布局组件 (TopBar, MainLayout, ContentArea)
│   │   ├── views/        # 视图组件 (Overview, Transcript, Chapters, Minutes)
│   │   ├── cards/        # 卡片组件 (各类总结卡片、Todo、章节等)
│   │   └── common/       # 通用组件 (Toast, 按钮等)
│   ├── utils/            # 工具函数
│   │   ├── markdown.ts   # Markdown 生成和导出
│   │   ├── format.ts     # 数据格式化 (时长、日期等)
│   │   └── minutes.ts    # 会议纪要处理
│   └── types/            # TypeScript 类型定义
│       └── ui.ts         # UI 相关类型
└── manifest.json         # 扩展清单 (Manifest V3)
```

## 核心架构

### API 拦截机制

由于 Chrome Manifest V3 限制，项目采用了 **Service Worker** 方案：

**Background Service Worker** (`src/background/index.ts`):

- 监听并拦截腾讯会议 API 请求（25+ 端点）
- 自动解析和提取会议数据
- 存储到 `chrome.storage.local` 实现本地缓存
- 处理来自 Popup 的数据请求

### 数据流

```
腾讯会议页面发起 API 请求
  ↓
Background Service Worker 拦截响应
  ↓
自动提取会议数据（转写、总结、纪要、统计等）
  ↓
存储到 chrome.storage.local
  ↓
Popup 请求数据时从 storage 读取
  ↓
显示在 UI 并支持导出
```

### 拦截的 API 端点

项目拦截并提取以下腾讯会议 API 端点的数据：

**核心数据端点：**

- `/wemeet-cloudrecording-webapi/v1/minutes/detail` - 会议转写、总结、纪要
- `/wemeet-tapi/v2/meetlog/public/record-detail/get-full-summary` - 完整总结
- `/wemeet-tapi/v2/meetlog/public/record-detail/get-mul-summary-and-todo` - 多段总结和待办
- `/wemeet-tapi/v2/meetlog/public/record-detail/get-smart-topic` - 智能话题
- `/wemeet-tapi/v2/meetlog/public/record-detail/get-time-line` - 参会人员发言时长
- `/wemeet-tapi/v2/meetlog/public/record-detail/get-chapter` - 会议章节
- `/wemeet-tapi/v2/meetlog/public/record-detail/get-critical-node` - 重点时刻

**元数据端点：**

- `/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-info` - 会议基本信息
- `/wemeet-tapi/v2/meetlog/public/detail/common-record-info` - 录制信息

_完整 API 端点列表请参见 [`openspec/specs/api-responses/`](./openspec/specs/api-responses/)_

### 数据提取与验证

**提取策略**:

- **容错性**：兼容不同 API 响应格式和字段命名
- **XSS 防护**：所有用户生成内容经过清理和转义
- **类型安全**：使用 TypeScript 严格类型检查
- **增量更新**：支持数据分批加载和实时更新

**提取的数据类型**:

1. 会议元数据（ID、标题、时长、时间戳等）
2. AI 智能总结（完整总结、多段总结）
3. 会议纪要（结构化富文本格式）
4. 完整转写（带时间戳和发言人）
5. 会议统计（智能话题、参会人员发言时长、会议章节）
6. 参会人员列表
7. 聊天消息记录
8. 行动项（待办事项）
9. 重点时刻标记

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

- **Background Script**: `chrome://extensions/` → 扩展详情 → Service Worker
- **Popup**: 右键弹出窗口 → 检查
- **日志过滤**: 在 Console 中过滤 `[TXMeeting]` 查看扩展相关日志

**常见问题**:

- **数据未提取？**
  - 检查是否访问了正确的腾讯会议云录屏页面（`https://meeting.tencent.com/cw/*`）
  - 等待页面完全加载后再打开 Popup
  - 查看 Background Service Worker 日志确认 API 拦截是否成功
- **Popup 空白或显示错误？**
  - 右键 Popup 窗口 → 检查 → 查看 Console 错误信息
  - 确认扩展已正确加载（在 `chrome://extensions/` 中查看）
  - 尝试重新加载扩展
- **导出 Markdown 失败？**
  - 检查浏览器下载权限设置
  - 确认有足够的磁盘空间
  - 检查文件名是否包含非法字符

**性能优化**:

- 扩展使用本地缓存，无需重复请求 API
- 长转写内容使用虚拟滚动优化渲染性能
- 数据仅在需要时加载，避免内存占用

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
- **代码审计**: 欢迎安全研究者审查代码

## 常见问题 (FAQ)

### Q: 扩展支持哪些会议平台？

A: 目前仅支持**腾讯会议**的云录屏页面（`https://meeting.tencent.com/cw/*`）。不支持其他会议平台。

### Q: 数据会被上传到服务器吗？

A: **不会**。所有数据仅存储在您的浏览器本地（`chrome.storage.local`），不会上传到任何外部服务器。扩展完全离线工作。

### Q: 为什么有些会议没有总结或纪要？

A: 这取决于腾讯会议是否为该会议生成了 AI 总结和纪要。扩展只能提取腾讯会议 API 返回的数据，无法生成不存在的内容。

### Q: 扩展会影响会议播放性能吗？

A: **不会**。扩展仅拦截 API 响应进行数据提取，不会影响视频播放或页面性能。

### Q: 导出的 Markdown 文件可以在哪里打开？

A: 可以使用任何支持 Markdown 的编辑器或笔记工具打开，如：

- VS Code、Typora、MarkText 等编辑器
- Notion、Obsidian、语雀等笔记工具
- GitHub、GitLab 等平台（支持预览）

### Q: 数据会保存多久？

A: 数据存储在浏览器的 `chrome.storage.local` 中，直到：

- 用户手动卸载扩展
- 用户清除浏览器数据
- 浏览器缓存达到存储上限

建议定期导出重要会议记录。

### Q: 如何更新扩展？

A:

- **从源码安装**：拉取最新代码后重新构建并重新加载扩展
- **Chrome Web Store 安装**（上线后）：Chrome 会自动更新

### Q: 遇到问题如何反馈？

A: 请通过以下方式反馈问题：

1. [GitHub Issues](../../issues) - 报告 Bug 或功能请求
2. [GitHub Discussions](../../discussions) - 一般讨论和问题咨询

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
- 提交前运行 `npm run type-check` 确保类型检查通过

### 🧪 测试

虽然项目暂未包含自动化测试，但请确保以下手动测试通过：

1. **API 拦截测试**
   - 访问腾讯会议云录屏页面
   - 打开 Background Service Worker 日志
   - 确认成功拦截并提取数据

2. **UI 功能测试**
   - 测试所有折叠/展开功能
   - 测试复制功能是否正常
   - 测试 Markdown 导出功能

3. **兼容性测试**
   - 测试不同类型的会议（有/无总结、纪要等）
   - 测试长会议（>1小时）的性能
   - 测试中文内容的正确显示和导出

## 更新日志

### v1.2.0 (2026-02-04)

🎉 **会议统计视图重构**

- ✅ 新增智能话题展示（话题名称、时长、占比）
- ✅ 新增参会人员发言时长统计（含头像、姓名、时长、占比）
- ✅ 重构会议章节展示（章节标题、封面图、时长、占比）
- ✅ 统一的时长格式化和进度条可视化
- ✅ 三个统计区域独立折叠/展开

### v1.1.0 (2026-01-28)

🔧 **API 覆盖增强与 UI 重构**

- ✅ 新增多段总结支持（分段式 AI 总结）
- ✅ 纪要视图重构（支持富文本、段落缩进、列表）
- ✅ 扩展 API 拦截覆盖（25+ API 端点）
- ✅ 优化弹窗布局和样式

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

## 路线图

### 已完成 ✅

- [x] 基础会议信息提取
- [x] AI 智能总结和纪要提取
- [x] 完整转写提取
- [x] 会议统计（话题、章节、发言时长）
- [x] React 弹出界面
- [x] Markdown 导出功能
- [x] Chrome Manifest V3 兼容

### 计划中 📋

- [ ] 发布到 Chrome Web Store
- [ ] 支持更多导出格式（PDF、Word、JSON）
- [ ] 添加搜索和筛选功能
- [ ] 支持自定义导出模板
- [ ] 添加会议数据统计分析功能
- [ ] 支持云同步（可选）
- [ ] 国际化支持（英文界面）

### 考虑中 💭

- [ ] 支持其他会议平台（Zoom、Teams 等）
- [ ] 浏览器扩展版本（Firefox、Edge）
- [ ] 移动端支持
- [ ] AI 增强功能（自定义总结、提问等）

欢迎通过 [Issues](../../issues) 提出您的需求和建议！

## 致谢

- 腾讯会议团队提供的云录屏服务
- React 和 Vite 社区
- 所有贡献者和用户

---

**⭐ 如果这个项目对您有帮助，请给个 Star！**

有问题或建议？[提交 Issue](../../issues) 或 [开启讨论](../../discussions)
