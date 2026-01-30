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

  // AI 纪要
  if (meetingData.summary) {
    minutes += `## 会议纪要\n\n${meetingData.summary}\n\n`;
  }

  // 完整纪要（如果有）
  if (meetingData.full_summary) {
    minutes += `## 详细纪要\n\n${meetingData.full_summary.full_summary}\n\n`;
  }

  // 主题纪要（新增）
  if (
    meetingData.topic_summary_data &&
    meetingData.topic_summary_data.summary_status === 2
  ) {
    minutes += `## 主题纪要\n\n`;
    if (meetingData.topic_summary_data.begin_summary) {
      minutes += `### 开场总结\n\n${meetingData.topic_summary_data.begin_summary}\n\n`;
    }
    if (
      meetingData.topic_summary_data.sub_points &&
      meetingData.topic_summary_data.sub_points.length > 0
    ) {
      minutes += `### 核心要点\n\n`;
      meetingData.topic_summary_data.sub_points.forEach((point, index) => {
        minutes += `#### ${index + 1}. ${point.title}\n\n${point.content}\n\n`;
      });
    }
    if (meetingData.topic_summary_data.end_summary) {
      minutes += `### 结束总结\n\n${meetingData.topic_summary_data.end_summary}\n\n`;
    }
  }

  // 分章节纪要（新增）
  if (
    meetingData.chapter_summary_data &&
    meetingData.chapter_summary_data.summary_status === 2 &&
    meetingData.chapter_summary_data.summary_list.length > 0
  ) {
    minutes += `## 分章节纪要\n\n`;
    meetingData.chapter_summary_data.summary_list.forEach((chapter, index) => {
      minutes += `### 第 ${index + 1} 章: ${chapter.chapter_title}\n\n`;
      if (chapter.start_time !== undefined && chapter.end_time !== undefined) {
        minutes += `**时间**: ${formatTime(chapter.start_time)} - ${formatTime(chapter.end_time)}\n\n`;
      }
      minutes += `${chapter.summary}\n\n`;
    });
  }

  // 发言人观点（新增）
  if (
    meetingData.speaker_summary_data &&
    meetingData.speaker_summary_data.summary_status === 2 &&
    meetingData.speaker_summary_data.speakers_opinions.length > 0
  ) {
    minutes += `## 发言人观点\n\n`;
    meetingData.speaker_summary_data.speakers_opinions.forEach((speaker) => {
      minutes += `### 👤 ${speaker.speaker_id}\n\n`;
      if (speaker.sub_points && speaker.sub_points.length > 0) {
        speaker.sub_points.forEach((subPoint) => {
          minutes += `#### ${subPoint.sub_point_title}\n\n`;
          if (
            subPoint.sub_point_vec_items &&
            subPoint.sub_point_vec_items.length > 0
          ) {
            subPoint.sub_point_vec_items.forEach((item) => {
              minutes += `- ${item.point}\n`;
            });
            minutes += `\n`;
          }
        });
      } else {
        minutes += `该发言人暂无记录观点\n\n`;
      }
    });
  }

  // 待办事项（旧格式，向后兼容）
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

  // 待办事项（新格式）
  if (meetingData.todo_items && meetingData.todo_items.length > 0) {
    minutes += `## 待办事项\n\n`;
    meetingData.todo_items.forEach((todo, index) => {
      minutes += `### ${index + 1}. ${todo.todo_name}\n\n`;
      if (todo.todo_time) {
        minutes += `**时间**: ${todo.todo_time}\n\n`;
      }
      if (todo.persons && todo.persons.length > 0) {
        minutes += `**相关人员**: ${todo.persons.join(', ')}\n\n`;
      }
      if (todo.background) {
        minutes += `**背景**: ${todo.background}\n\n`;
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

  // 转写内容（新增）
  if (meetingData.transcript && meetingData.transcript.length > 0) {
    minutes += `## 会议转写\n\n`;
    meetingData.transcript.forEach((segment) => {
      const timeStamp = formatTime(segment.start_time);
      const speaker = segment.speaker || '未知发言人';
      minutes += `**[${timeStamp}] ${speaker}**: ${segment.text}\n\n`;
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
