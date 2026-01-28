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

// API 优先级配置
const API_PRIORITY = {
  '/wemeet-cloudrecording-webapi/v1/minutes/detail': {
    priority: '🔴 Critical',
    order: 1,
    filename: 'minutes-detail.md',
  },
  '/wemeet-tapi/v2/meetlog/public/detail/common-record-info': {
    priority: '🔴 Critical',
    order: 2,
    filename: 'common-record-info.md',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/uni-record-id': {
    priority: '🟡 Important',
    order: 3,
    filename: 'uni-record-id.md',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-info': {
    priority: '🟡 Important',
    order: 4,
    filename: 'get-multi-record-info.md',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-timeline': {
    priority: '🟡 Important',
    order: 5,
    filename: 'get-multi-record-timeline.md',
  },
  '/wemeet-cloudrecording-webapi/v1/minutes/config': {
    priority: '🟢 Optional',
    order: 6,
    filename: 'minutes-config.md',
  },
  '/wemeet-cloudrecording-webapi/v1/sign': {
    priority: '🟢 Optional',
    order: 7,
    filename: 'sign.md',
  },
  '/wemeet-tapi/v2/meetlog/permission/get-cfg': {
    priority: '🟢 Optional',
    order: 8,
    filename: 'permission-get-cfg.md',
  },
  '/wemeet-tapi/v2/meetlog/public/record-detail/get-cfg': {
    priority: '🟢 Optional',
    order: 9,
    filename: 'record-detail-get-cfg.md',
  },
  '/v2/api/record/get-token': {
    priority: '🟢 Optional',
    order: 10,
    filename: 'get-token.md',
  },
};

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
  const priority = API_PRIORITY[apiPath]?.priority || '🟢 Optional';

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
  md += `**优先级**: ${priority}\n\n`;
  md += `**生成时间**: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  // 基本信息
  md += `## 1. 端点信息\n\n`;
  md += `- **URL**: \`${apiPath}\`\n`;
  md += `- **完整 URL**: \`${request.url}\`\n`;
  md += `- **方法**: \`${request.method}\`\n`;
  md += `- **用途**: ${getApiPurpose(apiPath)}\n\n`;

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
  const purposes = {
    '/wemeet-cloudrecording-webapi/v1/minutes/detail':
      '获取会议纪要详情（包含转写、摘要、行动项等）',
    '/wemeet-tapi/v2/meetlog/public/detail/common-record-info':
      '获取会议录制基本信息（标题、时长、参与者等）',
    '/wemeet-tapi/v2/meetlog/public/record-detail/uni-record-id':
      '通过分享 ID 获取统一录制 ID',
    '/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-info':
      '获取多段录制信息',
    '/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-timeline':
      '获取录制时间轴信息',
    '/wemeet-cloudrecording-webapi/v1/minutes/config': '获取会议纪要配置信息',
    '/wemeet-cloudrecording-webapi/v1/sign': '获取访问签名',
    '/wemeet-tapi/v2/meetlog/permission/get-cfg': '获取权限配置',
    '/wemeet-tapi/v2/meetlog/public/record-detail/get-cfg': '获取录制详情配置',
    '/v2/api/record/get-token': '获取录制访问令牌',
  };
  return purposes[apiPath] || '未知用途';
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
    .sort((a, b) => a.priority.order - b.priority.order);

  console.log(`🎯 将处理 ${prioritizedRequests.length} 个优先 API:\n`);
  prioritizedRequests.forEach((item, index) => {
    console.log(
      `  ${index + 1}. ${item.priority.priority} ${item.apiPath.split('/').pop()}`
    );
  });
  console.log();

  // 3. 执行请求并生成文档
  const results = [];
  for (const item of prioritizedRequests) {
    console.log(
      `\n📡 [${item.priority.order}/${prioritizedRequests.length}] ${item.priority.priority} ${getApiShortName(item.request.url)}`
    );

    const response = await executeRequest(item.request);

    // 生成 Markdown
    const markdown = generateMarkdown(item.request, response);
    const filename = await saveMarkdown(item.apiPath, markdown);

    results.push({
      filename,
      apiPath: item.apiPath,
      priority: item.priority.priority,
      status: response.status,
      success: !response.error,
    });

    // 避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 4. 生成总结
  console.log('\n\n✅ API 响应捕获完成！\n');
  console.log('📊 处理结果:\n');
  console.log('| 优先级 | API | 状态 | 文件 |');
  console.log('|--------|-----|------|------|');
  results.forEach((r) => {
    const statusIcon = r.success ? '✅' : '❌';
    console.log(
      `| ${r.priority} | ${r.apiPath.split('/').pop()} | ${statusIcon} ${r.status} | ${r.filename} |`
    );
  });

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n成功: ${successCount}/${results.length}`);

  if (successCount < results.length) {
    console.log('\n⚠️  部分 API 请求失败，可能原因:');
    console.log('  - Cookie 已过期');
    console.log('  - share_id 或 meeting_id 无效');
    console.log('  - 网络问题');
  }

  console.log(`\n📁 文档保存位置: ${CONFIG.outputDir}`);
}

// 运行
main().catch((error) => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
