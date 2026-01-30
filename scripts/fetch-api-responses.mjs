#!/usr/bin/env node

/**
 * 腾讯会议 API 响应自动捕获脚本
 *
 * 功能：
 * 1. 解析 api-requests-list.md 中的 fetch 请求
 * 2. 执行真实的 API 调用
 * 3. 自动生成 Markdown 格式的 API 文档
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  requestsFile: path.join(
    __dirname,
    '../openspec/changes/add-meeting-info-extractor/specs/api-responses/api-requests-list.md'
  ),
  outputDir: path.join(
    __dirname,
    '../openspec/changes/add-meeting-info-extractor/specs/api-responses'
  ),
  templateFile: path.join(
    __dirname,
    '../openspec/changes/add-meeting-info-extractor/specs/api-responses/TEMPLATE.md'
  ),
};

// API 优先级配置 - 按数据价值排序
const API_PRIORITY = {
  // 🔴 Critical - 核心会议数据 (必须实现)
  '/wemeet-cloudrecording-webapi/v1/minutes/detail': {
    priority: '🔴 Critical',
    dataValue: 5,
    order: 1,
    filename: 'minutes-detail.md',
    purpose: '获取会议纪要详情（转写、纪要、行动项）',
  },
  '/wemeet-tapi/v2/meetlog/public/detail/common-record-info': {
    priority: '🔴 Critical',
    dataValue: 5,
    order: 2,
    filename: 'common-record-info.md',
    purpose: '获取会议录制基本信息（标题、时长、参与者）',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-full-summary': {
    priority: '🔴 Critical',
    dataValue: 4,
    order: 3,
    filename: 'get-full-summary.md',
    purpose: '获取完整 AI 纪要（简要、详细、超详细版本）',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-chapter': {
    priority: '🔴 Critical',
    dataValue: 4,
    order: 4,
    filename: 'get-chapter.md',
    purpose: '获取会议章节/段落结构',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-time-line': {
    priority: '🔴 Critical',
    dataValue: 4,
    order: 5,
    filename: 'get-time-line.md',
    purpose: '获取会议时间轴事件',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-smart-topic': {
    priority: '🔴 Critical',
    dataValue: 3,
    order: 6,
    filename: 'get-smart-topic.md',
    purpose: '获取智能话题提取结果',
  },

  // 🟡 Important - 增强功能 (应该实现)
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-mul-summary-and-todo': {
    priority: '🟡 Important',
    dataValue: 4,
    order: 7,
    filename: 'get-mul-summary-and-todo.md',
    purpose: '获取多语言纪要和待办事项列表',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-critical-node': {
    priority: '🟡 Important',
    dataValue: 3,
    order: 8,
    filename: 'get-critical-node.md',
    purpose: '获取关键时刻/决策点',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-info': {
    priority: '🟡 Important',
    dataValue: 3,
    order: 9,
    filename: 'get-multi-record-info.md',
    purpose: '获取多段录制信息',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-timeline': {
    priority: '🟡 Important',
    dataValue: 3,
    order: 10,
    filename: 'get-multi-record-timeline.md',
    purpose: '获取录制时间轴信息',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-file': {
    priority: '🟡 Important',
    dataValue: 3,
    order: 11,
    filename: 'get-multi-record-file.md',
    purpose: '获取录制文件下载链接',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/uni-record-id': {
    priority: '🟡 Important',
    dataValue: 2,
    order: 12,
    filename: 'uni-record-id.md',
    purpose: '通过分享 ID 获取统一录制 ID',
  },

  // 🟢 Optional - 配置和权限 (可选实现)
  '/wemeet-cloudrecording-webapi/v1/minutes/config': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 13,
    filename: 'minutes-config.md',
    purpose: '获取会议纪要配置信息',
  },
  '/wemeet-cloudrecording-webapi/v1/sign': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 14,
    filename: 'sign.md',
    purpose: '获取访问签名',
  },
  '/wemeet-tapi/v2/meetlog/permission/get-cfg': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 15,
    filename: 'permission-get-cfg.md',
    purpose: '获取权限配置',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-cfg': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 16,
    filename: 'record-detail-get-cfg.md',
    purpose: '获取录制详情配置',
  },
  '/v2/api/record/get-token': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 17,
    filename: 'get-token.md',
    purpose: '获取录制访问令牌',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-member-cfg': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 18,
    filename: 'get-member-cfg.md',
    purpose: '获取成员配置',
  },
  '/wemeet-tapi/v1/aihelper/record/aihelper_entry_status': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 19,
    filename: 'aihelper-entry-status.md',
    purpose: '获取 AI 助手入口状态',
  },
  '/wemeet-tapi/v2/meetlog/subtitle-feedback/get-cfg': {
    priority: '🟢 Optional',
    dataValue: 1,
    order: 20,
    filename: 'subtitle-feedback-get-cfg.md',
    purpose: '获取字幕反馈配置',
  },

  // ⚫ Skip - 非核心/辅助 API (跳过)
  '/wemeet-webapi/v2/account/login/refresh-token': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'refresh-token.md',
    purpose: '刷新认证令牌（认证专用，无会议数据）',
  },
  '/wemeet-webapi/v2/corp/corp/corp-pay-tag': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'corp-pay-tag.md',
    purpose: '企业付费标签（无关会议内容）',
  },
  '/wemeet-tapi/v2/wemeet_cowork_config/get-h5-common-config': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'get-h5-common-config.md',
    purpose: '通用 H5 配置（非会议特定）',
  },
  '/wemeet-tapi/v2/meetlog/public/detail/user-visited': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'user-visited.md',
    purpose: '用户访问统计埋点（无会议数据）',
  },
  '/wemeet-tapi/v2/meetlog/public/report/behavior-log': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'behavior-log.md',
    purpose: '行为日志统计埋点（无会议数据）',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/query_smart_reddot_task': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'query-smart-reddot-task.md',
    purpose: '查询智能红点任务（通知提示）',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/query-multi-record-gray': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'query-multi-record-gray.md',
    purpose: '多段录制灰度功能开关（功能开关）',
  },
  '/wemeet-tapi//v2/meetlog/public/record-detail/corp-sdk-record-info': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'corp-sdk-record-info.md',
    purpose: '企业 SDK 录制信息（SDK 专用）',
  },
  '/wemeet-tapi//v1/ainotes-public/get_config_public': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'get-config-public.md',
    purpose: 'AI 笔记公共配置（通用配置）',
  },
  '/wemeet-cloudrecording-webapi/v1/records/events-heartbeat': {
    priority: '⚫ Skip',
    dataValue: 0,
    order: 99,
    filename: 'events-heartbeat.md',
    purpose: '事件心跳保活（心跳请求）',
  },
};

/**
 * 检查文档是否已存在
 */
async function checkExistingDoc(filename) {
  const filepath = path.join(CONFIG.outputDir, filename);
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 解析 fetch 请求字符串（使用 JSON.parse 而非 eval）
 */
function parseFetchRequest(fetchCode) {
  try {
    // 提取 URL
    const urlMatch = fetchCode.match(/fetch\("([^"]+)"/);
    if (!urlMatch) return null;
    const url = urlMatch[1];

    // 提取方法
    const methodMatch = fetchCode.match(/"method"\s*:\s*"([^"]+)"/);
    const method = methodMatch ? methodMatch[1] : 'GET';

    // 提取 body（手动解析，支持嵌套引号）
    let body = null;

    if (fetchCode.includes('"body": null')) {
      body = null;
    } else {
      // 查找 "body": " 的位置
      const bodyStartIndex = fetchCode.indexOf('"body":');
      if (bodyStartIndex !== -1) {
        const afterBody = fetchCode.substring(bodyStartIndex + 7).trim();
        if (afterBody.startsWith('"')) {
          // 找到开始引号后的内容
          let endIndex = 1;
          let escapeNext = false;

          while (endIndex < afterBody.length) {
            const char = afterBody[endIndex];

            if (escapeNext) {
              escapeNext = false;
              endIndex++;
              continue;
            }

            if (char === '\\') {
              escapeNext = true;
              endIndex++;
              continue;
            }

            if (char === '"') {
              // 找到结束引号
              const bodyStr = afterBody.substring(1, endIndex);
              if (bodyStr && bodyStr.trim() !== '') {
                // 解码转义字符
                body = bodyStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              }
              break;
            }

            endIndex++;
          }
        }
      }
    }

    // 提取 headers（简化版 - 提取 cookie）
    const cookieMatch = fetchCode.match(/"cookie"\s*:\s*"([^"]+)"/);
    const cookie = cookieMatch ? cookieMatch[1] : '';

    const headers = {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/json',
      cookie: cookie,
      Referer: 'https://meeting.tencent.com/',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    };

    return {
      url,
      method,
      headers,
      body,
    };
  } catch (error) {
    console.error('解析 fetch 请求失败:', error.message);
    return null;
  }
}

/**
 * 从文件中提取所有 fetch 请求
 */
async function extractFetchRequests(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  // 使用更精确的分割 - 查找 ); ; 模式
  const fetchStatements = content
    .split(/\); ;/)
    .filter((s) => s.trim().startsWith('fetch'));

  const requests = [];
  for (const stmt of fetchStatements) {
    const fullStmt = stmt.trim() + ');';
    const parsed = parseFetchRequest(fullStmt);
    if (parsed) {
      requests.push(parsed);
    }
  }

  return requests;
}

/**
 * 执行 API 请求
 */
async function executeRequest(request) {
  const { url, method, headers, body } = request;

  const options = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = body;
  }

  console.log(`  请求: ${method} ${url.split('?')[0]}`);

  try {
    const response = await fetch(url, options);
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    };
  } catch (error) {
    console.error(`  ❌ 请求失败: ${error.message}`);
    return {
      error: error.message,
      status: 0,
    };
  }
}

/**
 * 获取 API 路径（用于匹配优先级）
 */
function getApiPath(url) {
  const urlObj = new URL(url);
  return urlObj.pathname;
}

/**
 * 获取 API 简称
 */
function getApiShortName(url) {
  const path = getApiPath(url);
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'unknown';
}

/**
 * 生成 Markdown 文档
 */
function generateMarkdown(request, response) {
  const url = new URL(request.url);
  const apiPath = url.pathname;
  const apiShortName = getApiShortName(request.url);
  const priorityConfig = API_PRIORITY[apiPath];
  const priority = priorityConfig?.priority || '🟢 Optional';
  const dataValue = priorityConfig?.dataValue || 1;
  const purpose = priorityConfig?.purpose || '未知用途';

  // 解析查询参数
  const queryParams = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  // 解析请求体
  let requestBody = null;
  if (request.body) {
    try {
      requestBody = JSON.parse(request.body);
    } catch {
      requestBody = request.body;
    }
  }

  // 生成文档
  let md = `# API 响应文档：${apiShortName}\n\n`;
  md += `**优先级**: ${priority}  \n`;
  md += `**数据价值**: ${'⭐'.repeat(dataValue)}  \n`;
  md += `**用途**: ${purpose}  \n`;
  md += `**生成时间**: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  // 基本信息
  md += `## 1. 端点信息\n\n`;
  md += `- **URL**: \`${apiPath}\`\n`;
  md += `- **完整 URL**: \`${request.url}\`\n`;
  md += `- **方法**: \`${request.method}\`\n`;
  md += `- **用途**: ${purpose}\n`;
  md += `- **数据价值**: ${'⭐'.repeat(dataValue)} (${dataValue}/5)\n\n`;

  // 请求参数
  md += `## 2. 请求参数\n\n`;

  if (Object.keys(queryParams).length > 0) {
    md += `### 查询参数 (Query Parameters)\n\n`;
    md += `| 参数名 | 值 | 说明 |\n`;
    md += `|--------|-----|------|\n`;
    for (const [key, value] of Object.entries(queryParams)) {
      md += `| \`${key}\` | \`${value}\` | ${getParamDescription(key)} |\n`;
    }
    md += `\n`;
  }

  if (requestBody) {
    md += `### 请求体 (Request Body)\n\n`;
    md += `\`\`\`json\n${JSON.stringify(requestBody, null, 2)}\n\`\`\`\n\n`;
  }

  // 响应示例
  md += `## 3. 响应示例\n\n`;

  if (response.error) {
    md += `**错误**: ${response.error}\n\n`;
  } else {
    md += `**状态码**: ${response.status} ${response.statusText}\n\n`;
    md += `### 响应头\n\n`;
    md += `\`\`\`json\n${JSON.stringify(response.headers, null, 2)}\n\`\`\`\n\n`;

    md += `### 响应体\n\n`;
    if (typeof response.data === 'object') {
      md += `\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\`\n\n`;
    } else {
      md += `\`\`\`\n${response.data}\n\`\`\`\n\n`;
    }
  }

  // 数据结构
  if (response.data && typeof response.data === 'object') {
    md += `## 4. 数据结构说明\n\n`;
    md += generateDataStructureTable(response.data);
  }

  // 提取逻辑映射
  md += `## 5. 数据提取逻辑映射\n\n`;
  md += `此 API 返回的数据在扩展中的使用位置：\n\n`;
  md += `| 源字段 | 目标字段 (MeetingData) | 提取逻辑位置 |\n`;
  md += `|--------|------------------------|---------------|\n`;
  md += `| *待补充* | *待补充* | \`src/utils/extractor.ts\` |\n\n`;

  // 注意事项
  md += `## 6. 注意事项\n\n`;
  md += `- 此 API 需要认证 Cookie: \`am_token\`\n`;
  md += `- 请求需要包含 \`share_id\` 或 \`meeting_id\` 等标识符\n`;
  md += `- 响应数据可能根据会议状态有所不同\n\n`;

  return md;
}

/**
 * 生成数据结构表格
 */
function generateDataStructureTable(data, prefix = '', depth = 0) {
  if (depth === 0) {
    let table = `| 字段路径 | 类型 | 示例值 | 说明 |\n`;
    table += `|----------|------|--------|------|\n`;
    table += generateDataStructureRows(data, prefix, depth);
    return table + '\n';
  }
  return generateDataStructureRows(data, prefix, depth);
}

function generateDataStructureRows(data, prefix = '', depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return '';

  let rows = '';

  if (Array.isArray(data)) {
    if (data.length > 0) {
      const item = data[0];
      rows += generateDataStructureRows(
        item,
        `${prefix}[0]`,
        depth + 1,
        maxDepth
      );
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const type = Array.isArray(value) ? 'Array' : typeof value;
      const example =
        typeof value === 'object' ? `{...}` : String(value).substring(0, 50);

      rows += `| \`${path}\` | ${type} | \`${example}\` | - |\n`;

      if (typeof value === 'object' && value !== null && depth < maxDepth) {
        rows += generateDataStructureRows(value, path, depth + 1, maxDepth);
      }
    }
  }

  return rows;
}

/**
 * 获取 API 用途说明
 */
function getApiPurpose(apiPath) {
  const config = API_PRIORITY[apiPath];
  if (config && config.purpose) {
    return config.purpose;
  }
  return '未知用途（未配置）';
}

/**
 * 获取参数说明
 */
function getParamDescription(param) {
  const descriptions = {
    c_os: '操作系统类型',
    c_os_version: '操作系统版本',
    c_os_model: '设备型号',
    c_timestamp: '客户端时间戳',
    c_instance_id: '实例 ID',
    c_nonce: '随机数（防重放）',
    c_app_id: '应用 ID',
    c_account_corp_id: '企业 ID',
    c_app_version: '应用版本',
    c_lang: '语言',
    c_district: '地区代码',
    'trace-id': '追踪 ID',
    rnds: '随机字符串',
    platform: '平台类型',
    c_app_uid: '应用用户 ID',
    share_id: '分享 ID',
    id: '会议/录制 ID',
    meeting_id: '会议 ID',
    recording_id: '录制 ID',
    pwd: '密码',
    activity_uid: '活动 UID',
    page_source: '页面来源',
    lang: '语言',
    mock: '是否模拟数据',
    auth_share_id: '认证分享 ID',
    uni_record_share_id: '统一录制分享 ID',
  };
  return descriptions[param] || '-';
}

/**
 * 保存 Markdown 文档
 */
async function saveMarkdown(apiPath, markdown) {
  const priorityInfo = API_PRIORITY[apiPath];
  const filename =
    priorityInfo?.filename ||
    `${getApiShortName('https://example.com' + apiPath)}.md`;
  const outputPath = path.join(CONFIG.outputDir, filename);

  await fs.writeFile(outputPath, markdown, 'utf-8');
  console.log(`  ✅ 已保存: ${filename}`);

  return filename;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始捕获腾讯会议 API 响应\n');
  console.log('📝 功能增强:');
  console.log('  ✅ 智能跳过已存在的文档');
  console.log('  ✅ 按数据价值优先级排序（⭐⭐⭐⭐⭐ > ⭐）');
  console.log('  ✅ 自动推断 API 用途');
  console.log('  ✅ 分类展示（Critical/Important/Optional/Skip）\n');

  // 1. 读取并解析请求列表
  console.log('📖 解析请求列表...');
  const requests = await extractFetchRequests(CONFIG.requestsFile);
  console.log(`✅ 共找到 ${requests.length} 个 API 请求\n`);

  // 2. 按优先级过滤和排序
  const prioritizedRequests = requests
    .map((req) => ({
      request: req,
      apiPath: getApiPath(req.url),
      priority: API_PRIORITY[getApiPath(req.url)],
    }))
    .filter((item) => item.priority) // 只处理配置了优先级的 API
    .sort((a, b) => {
      // 先按数据价值排序，再按顺序
      if (a.priority.dataValue !== b.priority.dataValue) {
        return b.priority.dataValue - a.priority.dataValue;
      }
      return a.priority.order - b.priority.order;
    });

  console.log(`🎯 将处理 ${prioritizedRequests.length} 个已配置 API:\n`);

  // 分组显示
  const groups = {
    '🔴 Critical': [],
    '🟡 Important': [],
    '🟢 Optional': [],
    '⚫ Skip': [],
  };

  for (const item of prioritizedRequests) {
    groups[item.priority.priority].push(item);
  }

  for (const [groupName, items] of Object.entries(groups)) {
    if (items.length > 0) {
      console.log(
        `${groupName} (${items.length} APIs, 数据价值: ${items[0].priority.dataValue}⭐)`
      );
      for (const item of items) {
        const apiName = item.apiPath.split('/').pop();
        console.log(`  - ${apiName}`);
      }
      console.log();
    }
  }

  // 3. 检查已存在的文档
  console.log('📂 检查已存在的文档...');
  const existingDocs = [];
  const missingDocs = [];

  for (const item of prioritizedRequests) {
    const exists = await checkExistingDoc(item.priority.filename);
    if (exists) {
      existingDocs.push(item);
    } else {
      missingDocs.push(item);
    }
  }

  console.log(`  ✅ 已存在: ${existingDocs.length} 个文档`);
  console.log(`  📝 待生成: ${missingDocs.length} 个文档\n`);

  if (existingDocs.length > 0) {
    console.log('已跳过以下文档（已存在）:');
    for (const item of existingDocs) {
      console.log(`  ⏭️  ${item.priority.priority} ${item.priority.filename}`);
    }
    console.log();
  }

  if (missingDocs.length === 0) {
    console.log('✅ 所有文档均已生成！无需重复执行。\n');
    return;
  }

  console.log(`🚀 开始生成 ${missingDocs.length} 个缺失文档...\n`);

  // 4. 执行请求并生成文档
  const results = [];
  for (let i = 0; i < missingDocs.length; i++) {
    const item = missingDocs[i];
    console.log(
      `\n📡 [${i + 1}/${missingDocs.length}] ${item.priority.priority} ${getApiShortName(item.request.url)}`
    );
    console.log(`   📊 数据价值: ${'⭐'.repeat(item.priority.dataValue)}`);
    console.log(`   🎯 用途: ${item.priority.purpose}`);

    const response = await executeRequest(item.request);

    // 生成 Markdown
    const markdown = generateMarkdown(item.request, response);
    const filename = await saveMarkdown(item.apiPath, markdown);

    results.push({
      filename,
      apiPath: item.apiPath,
      priority: item.priority.priority,
      dataValue: item.priority.dataValue,
      status: response.status,
      success: !response.error,
    });

    // 避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 5. 生成总结
  console.log('\n\n✅ API 响应捕获完成！\n');
  console.log('📊 处理结果:\n');
  console.log('| 优先级 | 数据价值 | API | 状态 | 文件 |');
  console.log('|--------|----------|-----|------|------|');
  results.forEach((r) => {
    const statusIcon = r.success ? '✅' : '❌';
    const stars = '⭐'.repeat(r.dataValue);
    console.log(
      `| ${r.priority} | ${stars} | ${r.apiPath.split('/').pop()} | ${statusIcon} ${r.status} | ${r.filename} |`
    );
  });

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n新生成: ${successCount}/${results.length}`);
  console.log(
    `总文档数: ${existingDocs.length + successCount}/${prioritizedRequests.length}`
  );

  if (successCount < results.length) {
    console.log('\n⚠️  部分 API 请求失败，可能原因:');
    console.log('  - Cookie 已过期');
    console.log('  - share_id 或 meeting_id 无效');
    console.log('  - 网络问题');
    console.log('  - API 需要额外参数');
  }

  console.log(`\n📁 文档保存位置: ${CONFIG.outputDir}`);
  console.log('\n💡 提示: 下次运行会自动跳过已生成的文档');
}

// 运行
main().catch((error) => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
