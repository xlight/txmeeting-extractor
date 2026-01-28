/**
 * 数据提取和转换工具
 * 从腾讯会议API响应中提取结构化数据
 */

import {
  MeetingData,
  MeetingMetadata,
  TranscriptSegment,
  Participant,
  ChatMessage,
  ActionItem,
  Highlight,
} from '../types/meeting';

/**
 * 从API响应中提取会议数据
 */
export function extractMeetingData(apiResponse: unknown): MeetingData | null {
  try {
    // 验证响应格式
    if (!apiResponse || typeof apiResponse !== 'object') {
      console.warn('[Extractor] 无效的API响应格式');
      return null;
    }

    const response = apiResponse as Record<string, unknown>;

    // 检查响应码
    if (response.code !== 0 && response.code !== undefined) {
      console.warn('[Extractor] API返回错误码:', response.code);
    }

    const data = response.data as Record<string, unknown>;
    if (!data) {
      console.warn('[Extractor] API响应中没有data字段');
      return null;
    }

    // 提取元数据
    const metadata = extractMetadata(data);
    if (!metadata) {
      console.warn('[Extractor] 无法提取会议元数据');
      return null;
    }

    // 提取各类数据
    const meetingData: MeetingData = {
      metadata,
      summary: extractSummary(data),
      minutes: extractMinutes(data),
      transcript: extractTranscript(data),
      paragraphs: extractParagraphs(data),
      participants: extractParticipants(data),
      chat_messages: extractChatMessages(data),
      action_items: extractActionItems(data),
      highlights: extractHighlights(data),
      screen_sharing: extractScreenSharing(data),
      captured_at: Date.now(),
    };

    return meetingData;
  } catch (error) {
    console.error('[Extractor] 提取会议数据失败:', error);
    return null;
  }
}

/**
 * 提取会议元数据
 */
function extractMetadata(data: Record<string, unknown>): MeetingMetadata | null {
  try {
    const meetingId = String(data.meeting_id || data.meetingId || '');
    const recordingId = String(data.recording_id || data.recordingId || data.id || '');
    const title = String(data.title || data.name || '未命名会议');

    if (!meetingId || !recordingId) {
      return null;
    }

    return {
      meeting_id: meetingId,
      recording_id: recordingId,
      title: sanitizeText(title),
      start_time: extractNumber(data.start_time || data.startTime),
      end_time: extractNumber(data.end_time || data.endTime),
      duration: extractNumber(data.duration),
      share_id: data.share_id as string,
      short_url_code: data.short_url_code as string,
    };
  } catch (error) {
    console.error('[Extractor] 提取元数据失败:', error);
    return null;
  }
}

/**
 * 提取智能总结
 */
function extractSummary(data: Record<string, unknown>): string | undefined {
  const summary = data.summary || data.ai_summary || data.smart_summary;
  return summary ? sanitizeText(String(summary)) : undefined;
}

/**
 * 提取会议纪要
 */
function extractMinutes(data: Record<string, unknown>): string | undefined {
  const minutes = data.minutes || data.meeting_minutes;
  return minutes ? sanitizeText(String(minutes)) : undefined;
}

/**
 * 提取转写内容
 */
function extractTranscript(data: Record<string, unknown>): TranscriptSegment[] {
  try {
    const transcriptList =
      (data.transcript_list as unknown[]) ||
      (data.transcripts as unknown[]) ||
      (data.transcript as unknown[]) ||
      [];

    const segments: TranscriptSegment[] = [];

    for (const item of transcriptList) {
      if (!item || typeof item !== 'object') continue;
      const seg = item as Record<string, unknown>;

      segments.push({
        pid: String(seg.pid || seg.id || Math.random().toString(36)),
        start_time: extractNumber(seg.start_time || seg.startTime) || 0,
        end_time: extractNumber(seg.end_time || seg.endTime) || 0,
        text: sanitizeText(String(seg.text || seg.content || '')),
        speaker: seg.speaker ? sanitizeText(String(seg.speaker)) : undefined,
        speaker_id: seg.speaker_id as string | undefined,
      });
    }

    return segments;
  } catch (error) {
    console.error('[Extractor] 提取转写失败:', error);
    return [];
  }
}

/**
 * 提取段落
 */
function extractParagraphs(data: Record<string, unknown>): string[] | undefined {
  try {
    const paragraphs = data.paragraphs || data.paragraph_list;
    if (Array.isArray(paragraphs)) {
      return paragraphs
        .map((p) => (typeof p === 'string' ? sanitizeText(p) : String(p)))
        .filter((p) => p.length > 0);
    }
  } catch (error) {
    console.error('[Extractor] 提取段落失败:', error);
  }
  return undefined;
}

/**
 * 提取参会人员
 */
function extractParticipants(data: Record<string, unknown>): Participant[] | undefined {
  try {
    const participantList = data.participants || data.participant_list;
    if (Array.isArray(participantList)) {
      return participantList.map((p: unknown) => {
        const participant = p as Record<string, unknown>;
        return {
          user_id: String(participant.user_id || participant.userId || ''),
          user_name: sanitizeText(
            String(participant.user_name || participant.userName || participant.name || '')
          ),
          join_time: extractNumber(participant.join_time || participant.joinTime),
          leave_time: extractNumber(participant.leave_time || participant.leaveTime),
        };
      });
    }
  } catch (error) {
    console.error('[Extractor] 提取参会人员失败:', error);
  }
  return undefined;
}

/**
 * 提取聊天消息
 */
function extractChatMessages(data: Record<string, unknown>): ChatMessage[] | undefined {
  try {
    const chatList = data.chat_messages || data.chats || data.messages;
    if (Array.isArray(chatList)) {
      return chatList.map((msg: unknown, index: number) => {
        const message = msg as Record<string, unknown>;
        return {
          message_id: String(message.message_id || message.id || index),
          sender_id: String(message.sender_id || message.senderId || ''),
          sender_name: sanitizeText(
            String(message.sender_name || message.senderName || message.sender || '')
          ),
          content: sanitizeText(String(message.content || message.text || '')),
          timestamp: extractNumber(message.timestamp || message.time) || 0,
        };
      });
    }
  } catch (error) {
    console.error('[Extractor] 提取聊天消息失败:', error);
  }
  return undefined;
}

/**
 * 提取行动项
 */
function extractActionItems(data: Record<string, unknown>): ActionItem[] | undefined {
  try {
    const actionList = data.action_items || data.actions || data.todos;
    if (Array.isArray(actionList)) {
      return actionList.map((item: unknown, index: number) => {
        const action = item as Record<string, unknown>;
        return {
          id: String(action.id || index),
          description: sanitizeText(String(action.description || action.text || '')),
          assignee: action.assignee ? sanitizeText(String(action.assignee)) : undefined,
          due_date: action.due_date as string,
          status: (action.status as 'pending' | 'completed') || 'pending',
        };
      });
    }
  } catch (error) {
    console.error('[Extractor] 提取行动项失败:', error);
  }
  return undefined;
}

/**
 * 提取重点时刻
 */
function extractHighlights(data: Record<string, unknown>): Highlight[] | undefined {
  try {
    const highlightList = data.highlights || data.key_moments;
    if (Array.isArray(highlightList)) {
      return highlightList.map((item: unknown, index: number) => {
        const highlight = item as Record<string, unknown>;
        return {
          id: String(highlight.id || index),
          timestamp: extractNumber(highlight.timestamp || highlight.time) || 0,
          description: sanitizeText(String(highlight.description || highlight.text || '')),
          content: highlight.content ? sanitizeText(String(highlight.content)) : undefined,
        };
      });
    }
  } catch (error) {
    console.error('[Extractor] 提取重点时刻失败:', error);
  }
  return undefined;
}

/**
 * 提取屏幕分享内容
 */
function extractScreenSharing(data: Record<string, unknown>): string[] | undefined {
  try {
    const screenSharing = data.screen_sharing || data.shared_screens;
    if (Array.isArray(screenSharing)) {
      return screenSharing
        .map((item) => sanitizeText(String(item)))
        .filter((item) => item.length > 0);
    }
  } catch (error) {
    console.error('[Extractor] 提取屏幕分享失败:', error);
  }
  return undefined;
}

/**
 * 辅助函数：提取数字
 */
function extractNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

/**
 * 辅助函数：清理和转义文本（XSS防护）
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * 格式化时间戳为可读格式
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 格式化时长（秒）为可读格式
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
}
