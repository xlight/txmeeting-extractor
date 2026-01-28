/**
 * Markdown导出工具
 * 将会议数据导出为Markdown格式
 */

import { MeetingData } from '../types/meeting';
import { formatTimestamp, formatDuration } from './extractor';

/**
 * 导出会议数据为Markdown文件
 */
export function exportToMarkdown(data: MeetingData): void {
  const markdown = generateMarkdown(data);
  const filename = generateFilename(data);

  downloadMarkdown(markdown, filename);
}

/**
 * 生成Markdown内容
 */
function generateMarkdown(data: MeetingData): string {
  const sections: string[] = [];

  // 标题
  sections.push(`# ${escapeMarkdown(data.metadata.title)}\n`);

  // 会议信息
  sections.push('## 会议信息\n');
  sections.push(`- **会议 ID**: ${data.metadata.meeting_id}`);
  sections.push(`- **录制 ID**: ${data.metadata.recording_id}`);

  if (data.metadata.duration) {
    sections.push(`- **时长**: ${formatDuration(data.metadata.duration)}`);
  }

  if (data.metadata.start_time) {
    sections.push(
      `- **开始时间**: ${formatTimestamp(data.metadata.start_time)}`
    );
  }

  if (data.metadata.end_time) {
    sections.push(`- **结束时间**: ${formatTimestamp(data.metadata.end_time)}`);
  }

  sections.push('');

  // 智能总结
  if (data.summary) {
    sections.push('## 💡 智能总结\n');
    sections.push(escapeMarkdown(data.summary));
    sections.push('');
  }

  // 会议纪要
  if (data.minutes) {
    sections.push('## 📝 会议纪要\n');
    sections.push(escapeMarkdown(data.minutes));
    sections.push('');
  }

  // 行动项
  if (data.action_items && data.action_items.length > 0) {
    sections.push('## ✅ 行动项\n');
    data.action_items.forEach((item) => {
      const checkbox = item.status === 'completed' ? '[x]' : '[ ]';
      const assignee = item.assignee ? ` (@${item.assignee})` : '';
      sections.push(
        `- ${checkbox} ${escapeMarkdown(item.description)}${assignee}`
      );
    });
    sections.push('');
  }

  // 参会人员
  if (data.participants && data.participants.length > 0) {
    sections.push('## 👥 参会人员\n');
    data.participants.forEach((p) => {
      sections.push(`- ${escapeMarkdown(p.user_name)}`);
      if (p.join_time) {
        sections.push(`  - 加入时间: ${formatTimestamp(p.join_time)}`);
      }
    });
    sections.push('');
  }

  // 转写内容
  if (data.transcript && data.transcript.length > 0) {
    sections.push('## 🎙️ 转写内容\n');
    data.transcript.forEach((seg) => {
      const time = new Date(seg.start_time).toISOString().substr(11, 8);
      const speaker = seg.speaker || '未知';
      sections.push(`### [${time}] ${escapeMarkdown(speaker)}\n`);
      sections.push(escapeMarkdown(seg.text));
      sections.push('');
    });
  }

  // 聊天记录
  if (data.chat_messages && data.chat_messages.length > 0) {
    sections.push('## 💬 聊天记录\n');
    data.chat_messages.forEach((msg) => {
      const time = formatTimestamp(msg.timestamp);
      sections.push(`**${escapeMarkdown(msg.sender_name)}** (${time}):`);
      sections.push(`> ${escapeMarkdown(msg.content)}\n`);
    });
    sections.push('');
  }

  // 重点时刻
  if (data.highlights && data.highlights.length > 0) {
    sections.push('## ⭐ 重点时刻\n');
    data.highlights.forEach((h) => {
      const time = formatTimestamp(h.timestamp);
      sections.push(`- **[${time}]** ${escapeMarkdown(h.description)}`);
      if (h.content) {
        sections.push(`  > ${escapeMarkdown(h.content)}`);
      }
    });
    sections.push('');
  }

  // 页脚
  sections.push('---');
  sections.push(`\n*导出时间: ${formatTimestamp(Date.now())}*`);
  sections.push(`*数据来源: 腾讯会议云录屏 - 腾讯会议信息提取器*`);

  return sections.join('\n');
}

/**
 * 转义Markdown特殊字符
 */
function escapeMarkdown(text: string): string {
  // 反转义HTML实体（因为extractor中已经转义过了）
  const unescaped = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // 转义Markdown特殊字符
  return unescaped
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!')
    .replace(/`/g, '\\`');
}

/**
 * 生成文件名
 */
function generateFilename(data: MeetingData): string {
  // 清理标题，移除非法文件名字符
  const cleanTitle = data.metadata.title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50); // 限制长度

  // 生成日期
  const date = data.metadata.start_time
    ? new Date(data.metadata.start_time)
    : new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  return `${cleanTitle}-${dateStr}.md`;
}

/**
 * 触发Markdown文件下载
 */
function downloadMarkdown(content: string, filename: string): void {
  // 创建Blob
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // 创建下载链接
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  // 触发下载
  document.body.appendChild(a);
  a.click();

  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 复制Markdown到剪贴板
 */
export function copyMarkdownToClipboard(data: MeetingData): Promise<void> {
  const markdown = generateMarkdown(data);
  return navigator.clipboard.writeText(markdown);
}
