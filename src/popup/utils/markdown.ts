/**
 * Markdown 生成工具函数
 * 将摘要数据转换为 Markdown 格式用于复制
 */

import {
  TopicSummaryData,
  ChapterSummaryData,
  SpeakerSummaryData,
  TodoItemData,
} from '../../types/meeting';
import { formatTime } from './format';

/**
 * 将主题摘要转换为 Markdown 格式
 */
export function topicSummaryToMarkdown(data: TopicSummaryData): string {
  const lines: string[] = ['# 💡 主题摘要\n'];

  // 开场总结
  if (data.begin_summary) {
    lines.push('## 开场总结\n');
    lines.push(data.begin_summary + '\n');
  }

  // 核心要点
  if (data.sub_points && data.sub_points.length > 0) {
    lines.push('## 核心要点\n');
    data.sub_points.forEach((point, index) => {
      lines.push(`### ${index + 1}. ${point.title}\n`);
      lines.push(point.content + '\n');
    });
  }

  // 结束总结
  if (data.end_summary) {
    lines.push('## 结束总结\n');
    lines.push(data.end_summary + '\n');
  }

  return lines.join('\n');
}

/**
 * 将分章节摘要转换为 Markdown 格式
 */
export function chapterSummaryToMarkdown(data: ChapterSummaryData): string {
  const lines: string[] = ['# 📑 分章节摘要\n'];

  if (data.summary_list && data.summary_list.length > 0) {
    data.summary_list.forEach((chapter, index) => {
      lines.push(`## 第 ${index + 1} 章: ${chapter.chapter_title}\n`);

      // 时间范围
      if (chapter.start_time !== undefined && chapter.end_time !== undefined) {
        const startTime = formatTime(chapter.start_time);
        const endTime = formatTime(chapter.end_time);
        lines.push(`**时间**: ${startTime} - ${endTime}\n`);
      }

      // 章节摘要
      lines.push(chapter.summary + '\n');
    });
  } else {
    lines.push('暂无章节摘要\n');
  }

  return lines.join('\n');
}

/**
 * 将发言人观点转换为 Markdown 格式
 */
export function speakerSummaryToMarkdown(data: SpeakerSummaryData): string {
  const lines: string[] = ['# 💬 发言人观点\n'];

  if (data.speakers_opinions && data.speakers_opinions.length > 0) {
    data.speakers_opinions.forEach((speaker) => {
      lines.push(`## 👤 ${speaker.speaker_id}\n`);

      if (speaker.sub_points && speaker.sub_points.length > 0) {
        speaker.sub_points.forEach((subPoint) => {
          lines.push(`### ${subPoint.sub_point_title}\n`);

          if (
            subPoint.sub_point_vec_items &&
            subPoint.sub_point_vec_items.length > 0
          ) {
            subPoint.sub_point_vec_items.forEach((item) => {
              lines.push(`- ${item.point}`);
            });
            lines.push(''); // 空行
          }
        });
      } else {
        lines.push('该发言人暂无记录观点\n');
      }
    });
  } else {
    lines.push('暂无发言人观点\n');
  }

  return lines.join('\n');
}

/**
 * 将待办事项列表转换为 Markdown 格式
 */
export function todosToMarkdown(todos: TodoItemData[]): string {
  const lines: string[] = ['# ✅ 待办事项\n'];

  if (todos && todos.length > 0) {
    todos.forEach((todo, index) => {
      lines.push(`## ${index + 1}. ${todo.todo_name}\n`);

      if (todo.todo_time) {
        lines.push(`**时间**: ${todo.todo_time}`);
      }

      if (todo.persons && todo.persons.length > 0) {
        lines.push(`**相关人员**: ${todo.persons.join(', ')}`);
      }

      if (todo.background) {
        lines.push(`**背景**: ${todo.background}`);
      }

      lines.push(''); // 空行
    });
  } else {
    lines.push('暂无待办事项\n');
  }

  return lines.join('\n');
}

/**
 * 生成完整会议纪要的 Markdown 文本
 */
export function generateCompleteMinutesMarkdown(
  topicData?: TopicSummaryData,
  chapterData?: ChapterSummaryData,
  speakerData?: SpeakerSummaryData,
  todos?: TodoItemData[]
): string {
  const sections: string[] = [];

  // 主题摘要
  if (topicData && topicData.summary_status === 2) {
    sections.push(topicSummaryToMarkdown(topicData));
  }

  // 分章节摘要
  if (chapterData && chapterData.summary_status === 2) {
    sections.push(chapterSummaryToMarkdown(chapterData));
  }

  // 发言人观点
  if (speakerData && speakerData.summary_status === 2) {
    sections.push(speakerSummaryToMarkdown(speakerData));
  }

  // 待办事项
  if (todos && todos.length > 0) {
    sections.push(todosToMarkdown(todos));
  }

  // 如果没有任何内容
  if (sections.length === 0) {
    return '# 会议纪要\n\n暂无会议纪要数据';
  }

  return sections.join('\n\n---\n\n');
}
