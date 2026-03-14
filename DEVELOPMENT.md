# 开发者文档

## 项目结构

```
txmeeting-extractor/
├── src/
│   ├── background/          # Service Worker后台脚本
│   │   └── index.ts         # API拦截和缓存逻辑
│   ├── content/             # Content Script
│   │   └── index.ts         # 注入页面拦截fetch/XHR
│   ├── popup/               # 弹出界面
│   │   ├── App.tsx          # 主应用组件
│   │   ├── popup.html       # HTML入口
│   │   ├── popup.tsx        # React入口
│   │   ├── styles.css       # 样式
│   │   └── components/      # React组件
│   │       └── MeetingView.tsx
│   ├── utils/               # 工具函数
│   │   ├── extractor.ts     # 数据提取和验证
│   │   └── exporter.ts      # Markdown导出
│   ├── types/               # TypeScript类型定义
│   │   └── meeting.ts       # 会议数据类型
│   └── manifest.json        # Chrome扩展清单
├── public/
│   └── icons/               # 扩展图标
├── scripts/
│   └── post-build.mjs       # 构建后处理脚本
├── dist/                    # 构建输出目录
└── openspec/                # OpenSpec设计文档
```

## 技术架构

### 1. API拦截机制

由于Chrome Manifest V3限制，我们采用了**Content Script + Service Worker**的组合方案：

**Content Script** (`src/content/index.ts`):
- 注入到腾讯会议页面
- 拦截`window.fetch`和`XMLHttpRequest`
- 检测腾讯会议API端点（`/wemeet-cloudrecording-webapi/`）
- 将API响应发送到Background Script

**Background Service Worker** (`src/background/index.ts`):
- 接收Content Script发送的API响应
- 调用数据提取器解析数据
- 存储到`chrome.storage.local`
- 处理来自Popup的数据请求

### 2. 数据流

```
腾讯会议页面发起API请求
  ↓
Content Script拦截fetch/XHR响应
  ↓
发送消息到Background Script
  ↓
Background调用Extractor提取数据
  ↓
存储到chrome.storage.local
  ↓
Popup请求数据时从storage读取
  ↓
显示在UI并支持导出
```

### 3. 数据提取 (`src/utils/extractor.ts`)

**提取策略**:
- 容错性：API字段可能使用不同命名（如`meeting_id`或`meetingId`）
- XSS防护：所有用户生成内容经过`sanitizeText`清理
- 类型安全：使用TypeScript严格类型检查

**提取的数据类型**:
1. 会议元数据（ID、标题、时长等）
2. 智能总结和纪要
3. 转写内容（含时间戳和发言人）
4. 参会人员
5. 聊天消息
6. 行动项
7. 重点时刻
8. 屏幕分享内容

### 4. Markdown导出 (`src/utils/exporter.ts`)

**导出格式**:
```markdown
# 会议标题

## 会议信息
- **会议 ID**: xxx
- **时长**: xx分钟

## 💡 智能总结
...

## 🎙️ 转写内容
### [HH:MM:SS] 发言人
转写文本...
```

**特殊处理**:
- Markdown特殊字符转义
- 文件名清理（移除非法字符）
- UTF-8编码确保中文正确显示

## 构建系统

### Vite配置 (`vite.config.ts`)

```typescript
rollupOptions: {
  input: {
    popup: 'src/popup/popup.html',     // 弹出界面
    background: 'src/background/index.ts',  // 后台脚本
    content: 'src/content/index.ts',    // Content Script
  },
  output: {
    // 分别输出到不同目录
    entryFileNames: (chunkInfo) => {
      if (chunkInfo.name === 'background') return 'background/[name].js';
      if (chunkInfo.name === 'content') return 'content/[name].js';
      return 'popup/[name].js';
    },
  },
}
```

### 构建后处理 (`scripts/post-build.mjs`)

1. 复制`manifest.json`到`dist/`
2. 移动`popup.html`到正确位置
3. 清理临时文件

## 调试

### 加载扩展

1. 运行 `npm run build`
2. 打开Chrome，访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择`dist`文件夹

### 查看日志

- **Background Script**: `chrome://extensions/` → 扩展详情 → "Service Worker" → 查看
- **Content Script**: 页面 → 右键检查 → Console（过滤`[TXMeeting Content]`）
- **Popup**: 右键点击弹出窗口 → 检查

### 常见问题

**问题**: Content Script没有注入
- 检查manifest中的`matches`是否匹配当前页面URL
- 确保页面刷新后content script重新注入

**问题**: API响应未被拦截
- 检查Console是否有`[TXMeeting Content] 拦截到API请求`日志
- 确认API endpoint包含`/wemeet-cloudrecording-webapi/`

**问题**: Popup显示"未找到会议数据"
- 确保先访问腾讯会议页面触发API请求
- 检查Background Script是否成功存储数据（查看storage）

## 扩展开发

### 添加新的数据字段

1. 更新`src/types/meeting.ts`中的类型定义
2. 在`src/utils/extractor.ts`中添加提取逻辑
3. 在`src/popup/components/MeetingView.tsx`中添加显示组件
4. 在`src/utils/exporter.ts`中添加Markdown格式化

### 支持新的API端点

在`src/content/index.ts`中的URL检查逻辑中添加新的endpoint模式。

## 性能优化

### Service Worker生命周期

MV3的Service Worker是非持久的，可能随时关闭。我们的策略：
- 立即存储所有数据到storage
- Popup每次打开都从storage读取
- 不依赖内存中的状态

### 存储优化

- 自动清理30天前的旧数据（可在Background中实现定时任务）
- 使用`chrome.storage.local`（~10MB限制）而非sync
- 压缩大型转写数据（可选）

## 安全考虑

### XSS防护

所有用户内容经过`sanitizeText()`处理：
```typescript
text
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  // ... 更多转义
```

### 权限最小化

仅请求必要权限：
- `storage`: 缓存数据
- `https://meeting.tencent.com/*`: 仅限腾讯会议域名

### 数据隐私

- 所有数据仅存储在本地
- 不上传到任何外部服务器
- 用户可随时清除缓存

## 发布清单

- [ ] 更新版本号（`manifest.json`和`package.json`）
- [ ] 运行 `npm run build`
- [ ] 测试所有功能
- [ ] 创建ZIP包：`cd dist && zip -r ../extension.zip *`
- [ ] 准备Chrome Web Store资产（截图、描述等）
- [ ] 提交审核

## License

MIT
