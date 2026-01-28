/**
 * 数据提取和转换工具
 * 从腾讯会议 API 响应中提取结构化数据
 * 基于真实 API 响应结构重构
 */

import {
  MeetingData,
  MeetingMetadata,
  TranscriptSegment,
  Participant,
  ActionItem,
  Chapter,
  MinutesDetailResponse,
  CommonRecordInfoResponse,
  TranscriptParagraph,
  isMinutesDetailResponse,
  isCommonRecordInfoResponse,
  parseNumber,
  parseTimestamp,
  decodeBase64,
  isValidArray,
  RecordingInfo,
} from '../types/meeting';

/**
 * 从 minutes/detail API 响应中提取数据
 */
export function extractFromMinutesDetail(
  response: MinutesDetailResponse
): Partial<MeetingData> {
  if (!isMinutesDetailResponse(response) || !response.minutes) {
    console.warn('[Extractor] 无效的 minutes/detail API 响应');
    return {};
  }

  const { minutes } = response;

  return {
    // 转写内容：将 3 层嵌套结构（paragraphs → sentences → words）转换为扁平化的段落列表
    transcript: convertParagraphsToSegments(minutes.paragraphs || []),

    // 关键词
    keywords: minutes.keywords?.map((k) => k.keyword).filter(Boolean),

    // 章节
    chapters: minutes.chapters
      ?.map(convertChapter)
      .filter(Boolean) as Chapter[],

    // AI 智能总结
    summary: minutes.summary,

    // 行动项
    action_items: minutes.action_items
      ?.map(convertActionItem)
      .filter(Boolean) as ActionItem[],
  };
}

/**
 * 从 common-record-info API 响应中提取数据
 */
export function extractFromCommonRecordInfo(
  response: CommonRecordInfoResponse
): Partial<MeetingData> {
  if (!isCommonRecordInfoResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 common-record-info API 响应');
    return {};
  }

  const { data } = response;
  const meetingInfo = data.meeting_info;
  const recording = data.recordings?.[0]; // 取第一个录制记录

  // 构建元数据
  const metadata: MeetingMetadata | undefined = meetingInfo
    ? {
        meeting_id: meetingInfo.meeting_id || '',
        recording_id: recording?.id || '',
        title: decodeBase64(meetingInfo.subject || ''), // 解码 Base64
        start_time: parseTimestamp(meetingInfo.start_time),
        end_time: parseTimestamp(meetingInfo.end_time),
        duration: parseNumber(recording?.duration), // 毫秒
        share_id: data.share_id,
        meeting_code: meetingInfo.meeting_code,
        pk_meeting_info_id: data.pk_meeting_info_id,
      }
    : undefined;

  return {
    metadata,
    participants: data.meeting_members
      ?.map(convertMeetingMember)
      .filter(Boolean) as Participant[],
    recording_info: recording,
  };
}

/**
 * 主提取函数：合并多个 API 响应的数据
 */
export function extractMeetingData(apiResponses: {
  minutesDetail?: MinutesDetailResponse;
  commonRecordInfo?: CommonRecordInfoResponse;
}): MeetingData | null {
  try {
    const minutesData = apiResponses.minutesDetail
      ? extractFromMinutesDetail(apiResponses.minutesDetail)
      : {};

    const recordData = apiResponses.commonRecordInfo
      ? extractFromCommonRecordInfo(apiResponses.commonRecordInfo)
      : {};

    // 合并数据，recordData 的 metadata 优先
    const mergedData: MeetingData = {
      metadata:
        recordData.metadata || minutesData.metadata || createEmptyMetadata(),
      summary: minutesData.summary,
      transcript: minutesData.transcript || [],
      participants: recordData.participants,
      action_items: minutesData.action_items,
      keywords: minutesData.keywords,
      chapters: minutesData.chapters,
      recording_info: recordData.recording_info,
      captured_at: Date.now(),
    };

    // 验证必要字段
    if (!mergedData.metadata.meeting_id && !mergedData.metadata.recording_id) {
      console.warn('[Extractor] 无法提取有效的会议标识');
      return null;
    }

    return mergedData;
  } catch (error) {
    console.error('[Extractor] 提取会议数据失败:', error);
    return null;
  }
}

/**
 * 将段落结构转换为扁平化的转写片段
 * 段落 → 句子 → 词语 => 转写片段（以段落为单位）
 */
function convertParagraphsToSegments(
  paragraphs: TranscriptParagraph[]
): TranscriptSegment[] {
  if (!isValidArray(paragraphs)) {
    return [];
  }

  const segments: TranscriptSegment[] = [];

  for (const para of paragraphs) {
    try {
      // 将所有句子的所有词语拼接成段落文本
      const text =
        para.sentences
          ?.flatMap(
            (sentence) => sentence.words?.map((word) => word.text) || []
          )
          .join('') || '';

      if (!text.trim()) {
        continue;
      }

      segments.push({
        pid: para.pid,
        start_time: para.start_time,
        end_time: para.end_time,
        text: sanitizeText(text),
        speaker: para.speaker?.user_name,
        speaker_id: para.speaker?.user_id,
        avatar_url: para.speaker?.avatar_url,
      });
    } catch (error) {
      console.error('[Extractor] 转换段落失败:', error, para);
    }
  }

  return segments;
}

/**
 * 转换章节数据
 */
function convertChapter(chapter: {
  chapter_id: string;
  title: string;
  start_time: number;
  end_time: number;
  summary?: string;
}): Chapter | null {
  try {
    if (!chapter.chapter_id || !chapter.title) {
      return null;
    }

    return {
      id: chapter.chapter_id,
      title: sanitizeText(chapter.title),
      start_time: chapter.start_time,
      end_time: chapter.end_time,
      summary: chapter.summary ? sanitizeText(chapter.summary) : undefined,
    };
  } catch (error) {
    console.error('[Extractor] 转换章节失败:', error, chapter);
    return null;
  }
}

/**
 * 转换行动项数据
 */
function convertActionItem(item: {
  id: string;
  content: string;
  assignee?: string;
}): ActionItem | null {
  try {
    if (!item.content) {
      return null;
    }

    return {
      id: item.id,
      description: sanitizeText(item.content),
      assignee: item.assignee ? sanitizeText(item.assignee) : undefined,
    };
  } catch (error) {
    console.error('[Extractor] 转换行动项失败:', error, item);
    return null;
  }
}

/**
 * 转换会议成员数据
 */
function convertMeetingMember(member: {
  app_uid?: string;
  avatar_url?: string;
  user_name: string;
}): Participant | null {
  try {
    if (!member.user_name) {
      return null;
    }

    return {
      user_id: member.app_uid,
      user_name: sanitizeText(member.user_name),
      avatar_url: member.avatar_url,
    };
  } catch (error) {
    console.error('[Extractor] 转换会议成员失败:', error, member);
    return null;
  }
}

/**
 * 创建空的元数据对象
 */
function createEmptyMetadata(): MeetingMetadata {
  return {
    meeting_id: '',
    recording_id: '',
    title: '未命名会议',
  };
}

/**
 * 辅助函数：清理和转义文本（XSS 防护）
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
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
 * 格式化时长（毫秒）为可读格式
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
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

/**
 * 验证会议数据的完整性
 */
export function validateMeetingData(data: MeetingData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.metadata?.meeting_id && !data.metadata?.recording_id) {
    errors.push('缺少会议 ID 或录制 ID');
  }

  if (!data.transcript || data.transcript.length === 0) {
    errors.push('没有转写数据');
  }

  if (!data.metadata?.title || data.metadata.title === '未命名会议') {
    errors.push('缺少会议标题');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
