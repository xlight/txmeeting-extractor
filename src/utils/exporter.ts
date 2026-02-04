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
export function generateMarkdown(data: MeetingData): string {
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

  // 完整纪要（如果有）
  if (data.full_summary) {
    sections.push('## 📋 详细纪要\n');
    sections.push(escapeMarkdown(data.full_summary.full_summary));
    sections.push('');
  }

  // 主题纪要（新增）
  if (data.topic_summary_data && data.topic_summary_data.summary_status === 2) {
    sections.push('## 🎯 主题纪要\n');

    if (data.topic_summary_data.begin_summary) {
      sections.push('### 开场总结\n');
      sections.push(escapeMarkdown(data.topic_summary_data.begin_summary));
      sections.push('');
    }

    if (
      data.topic_summary_data.sub_points &&
      data.topic_summary_data.sub_points.length > 0
    ) {
      sections.push('### 核心要点\n');
      data.topic_summary_data.sub_points
        .filter(
          (point) => point.sub_point_title || point.sub_point_vec_items?.length
        )
        .forEach((point, index) => {
          sections.push(
            `#### ${index + 1}. ${escapeMarkdown(point.sub_point_title || '无标题')}\n`
          );
          if (point.sub_point_vec_items?.length > 0) {
            point.sub_point_vec_items.forEach((item) => {
              sections.push(`- ${escapeMarkdown(item.point)}`);
            });
          }
          sections.push('');
        });
    }

    if (data.topic_summary_data.end_summary) {
      sections.push('### 结束总结\n');
      sections.push(escapeMarkdown(data.topic_summary_data.end_summary));
      sections.push('');
    }
  }

  // 分章节纪要（新增）
  if (
    data.chapter_summary_data &&
    data.chapter_summary_data.summary_status === 2 &&
    data.chapter_summary_data.summary_list.length > 0
  ) {
    sections.push('## 📑 分章节纪要\n');
    data.chapter_summary_data.summary_list.forEach((chapter, index) => {
      sections.push(
        `### 第 ${index + 1} 章: ${escapeMarkdown(chapter.title || '无标题')}\n`
      );
      sections.push(escapeMarkdown(chapter.summary || '无内容'));
      sections.push('');
    });
  }

  // 发言人观点（新增）
  if (
    data.speaker_summary_data &&
    data.speaker_summary_data.summary_status === 2 &&
    data.speaker_summary_data.speakers_opinions.length > 0
  ) {
    sections.push('## 💬 发言人观点\n');
    data.speaker_summary_data.speakers_opinions.forEach((speaker) => {
      sections.push(
        `### 👤 ${escapeMarkdown(speaker.speaker_id || '未知发言人')}\n`
      );

      if (speaker.sub_points && speaker.sub_points.length > 0) {
        speaker.sub_points.forEach((subPoint) => {
          sections.push(
            `#### ${escapeMarkdown(subPoint.sub_point_title || '无标题')}\n`
          );

          if (
            subPoint.sub_point_vec_items &&
            subPoint.sub_point_vec_items.length > 0
          ) {
            subPoint.sub_point_vec_items.forEach((item) => {
              sections.push(`- ${escapeMarkdown(item.point || '无内容')}`);
            });
            sections.push('');
          }
        });
      } else {
        sections.push('该发言人暂无记录观点\n');
      }
      sections.push('');
    });
  }

  // 智能话题（新增）
  if (data.smart_topics && data.smart_topics.length > 0) {
    sections.push('## 🧠 智能话题\n');
    data.smart_topics.forEach((topic, index) => {
      sections.push(`### ${index + 1}. ${escapeMarkdown(topic.topic_name)}\n`);
      sections.push(`**占比**: ${(topic.percentage * 100).toFixed(1)}%\n`);

      if (topic.scope && topic.scope.length > 0) {
        sections.push('**相关时间段**:\n');
        topic.scope.forEach((range) => {
          const startMs = parseInt(range.start_time);
          const endMs = parseInt(range.end_time);
          const startFormatted = new Date(startMs).toISOString().substr(11, 8);
          const endFormatted = new Date(endMs).toISOString().substr(11, 8);
          sections.push(`- ${startFormatted} - ${endFormatted}`);
        });
        sections.push('');
      }
      sections.push('');
    });
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

  // 待办事项（旧格式，向后兼容）
  if (data.todo_list && data.todo_list.length > 0) {
    sections.push('## 📋 待办事项\n');
    data.todo_list.forEach((todo, index) => {
      const status = todo.status === 1 ? '[x]' : '[ ]';
      sections.push(
        `${index + 1}. ${status} ${escapeMarkdown(todo.content || '无内容')}`
      );
      if (todo.assignee) {
        sections.push(` (负责人: ${escapeMarkdown(todo.assignee)})`);
      }
      if (todo.due_date) {
        sections.push(` (截止: ${todo.due_date})`);
      }
      sections.push('');
    });
    sections.push('');
  }

  // 待办事项（新格式）
  if (data.todo_items && data.todo_items.length > 0) {
    sections.push('## 📋 待办事项\n');
    data.todo_items.forEach((todo, index) => {
      sections.push(
        `### ${index + 1}. ${escapeMarkdown(todo.todo_name || '无标题')}\n`
      );

      if (todo.todo_time) {
        sections.push(`**时间**: ${todo.todo_time}\n`);
      }
      if (todo.persons && todo.persons.length > 0) {
        sections.push(`**相关人员**: ${todo.persons.join(', ')}\n`);
      }
      if (todo.background) {
        sections.push(`**背景**: ${escapeMarkdown(todo.background)}\n`);
      }
      sections.push('');
    });
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

  // 章节内容
  if (data.chapters && data.chapters.length > 0) {
    sections.push('## 会议章节\n');
    data.chapters.forEach((chapter, index) => {
      sections.push(`### ${index + 1}. ${escapeMarkdown(chapter.title)}\n`);
      if (chapter.summary) {
        sections.push(escapeMarkdown(chapter.summary));
      }
      const startTime = new Date(chapter.start_time)
        .toISOString()
        .substr(11, 8);
      const endTime = new Date(chapter.end_time).toISOString().substr(11, 8);
      sections.push(`*${startTime} - ${endTime}*\n`);
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
