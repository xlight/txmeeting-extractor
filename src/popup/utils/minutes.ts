/**
 * 会议纪要生成工具
 */

import type { MeetingData } from '../../types/meeting';

/**
 * 格式化时间（毫秒 -> HH:MM:SS 或 MM:SS）
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}分钟`);
  }
  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds}秒`);
  }

  return parts.join('') || '0秒';
}

/**
 * 生成 Markdown 格式的会议纪要
 */
export function generateMarkdownMinutes(meetingData: MeetingData): string {
  let minutes = `# ${meetingData.metadata.title}\n\n`;

  // 会议信息
  minutes += `## 会议信息\n\n`;
  minutes += `- **会议 ID**: ${meetingData.metadata.meeting_id}\n`;
  if (meetingData.metadata.start_time) {
    minutes += `- **开始时间**: ${formatDateTime(new Date(meetingData.metadata.start_time).toISOString())}\n`;
  }
  if (meetingData.metadata.duration) {
    minutes += `- **会议时长**: ${formatDuration(meetingData.metadata.duration)}\n`;
  }
  if (meetingData.participants && meetingData.participants.length > 0) {
    minutes += `- **参与人数**: ${meetingData.participants.length} 人\n`;
  }
  minutes += `\n`;

  // AI 摘要
  if (meetingData.summary) {
    minutes += `## 会议摘要\n\n${meetingData.summary}\n\n`;
  }

  // 完整摘要（如果有）
  if (meetingData.full_summary) {
    minutes += `## 详细摘要\n\n${meetingData.full_summary.full_summary}\n\n`;
  }

  // 待办事项
  if (meetingData.todo_list && meetingData.todo_list.length > 0) {
    minutes += `## 待办事项\n\n`;
    meetingData.todo_list.forEach((todo, index) => {
      const status = todo.status === 1 ? '[x]' : '[ ]';
      minutes += `${index + 1}. ${status} ${todo.content}`;
      if (todo.assignee) {
        minutes += ` (负责人: ${todo.assignee})`;
      }
      if (todo.due_date) {
        minutes += ` (截止: ${todo.due_date})`;
      }
      minutes += `\n`;
    });
    minutes += `\n`;
  }

  // 关键时刻
  if (meetingData.critical_nodes && meetingData.critical_nodes.length > 0) {
    minutes += `## 关键时刻\n\n`;
    meetingData.critical_nodes.forEach((node) => {
      minutes += `### ${node.title}\n\n`;
      if (node.description) {
        minutes += `${node.description}\n\n`;
      }
      if (node.node_time !== undefined) {
        minutes += `*时间点: ${formatTime(node.node_time)}*\n\n`;
      }
    });
  }

  // 章节内容
  if (meetingData.chapters && meetingData.chapters.length > 0) {
    minutes += `## 会议章节\n\n`;
    meetingData.chapters.forEach((chapter, index) => {
      minutes += `### ${index + 1}. ${chapter.title}\n\n`;
      if (chapter.summary) {
        minutes += `${chapter.summary}\n\n`;
      }
      minutes += `*${formatTime(chapter.start_time)} - ${formatTime(chapter.end_time)}*\n\n`;
    });
  }

  // 参与者
  if (meetingData.participants && meetingData.participants.length > 0) {
    minutes += `## 参与者\n\n`;
    meetingData.participants.forEach((participant) => {
      minutes += `- ${participant.user_name}\n`;
    });
    minutes += `\n`;
  }

  return minutes;
}
