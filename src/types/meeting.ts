/**
 * 腾讯会议数据类型定义
 * 基于真实 API 响应结构
 */

// ==================== API 原始响应类型 ====================

/**
 * 发言人信息（来自 minutes/detail API）
 */
export interface Speaker {
  user_id: string;
  user_name: string;
  user_key?: string;
  avatar_url?: string;
  is_edit?: boolean;
}

/**
 * 转写词语（words）
 */
export interface TranscriptWord {
  wid: string;
  start_time: number; // 毫秒
  end_time: number; // 毫秒
  text: string;
  ori_text?: string; // 原始文本（翻译前）
}

/**
 * 转写句子（sentences）
 */
export interface TranscriptSentence {
  sid: string;
  start_time: number; // 毫秒
  end_time: number; // 毫秒
  words: TranscriptWord[];
}

/**
 * 转写段落（paragraphs）- 来自 minutes/detail API
 */
export interface TranscriptParagraph {
  pid: string;
  lang: string;
  start_time: number; // 毫秒
  end_time: number; // 毫秒
  sentences: TranscriptSentence[];
  speaker: Speaker;
}

/**
 * 会议成员（来自 common-record-info API）
 */
export interface MeetingMember {
  app_uid?: string;
  avatar_url?: string;
  user_name: string;
}

/**
 * 会议基本信息（来自 common-record-info API）
 */
export interface MeetingInfo {
  subject: string; // 会议主题（可能是 base64 编码）
  origin_subject?: string;
  meeting_code: string;
  meeting_id: string;
  start_time: string; // 时间戳字符串（毫秒）
  end_time: string; // 时间戳字符串（毫秒）
  meeting_type?: number;
  is_rooms?: boolean;
  is_oversea?: boolean;
  hybrid_meeting_type?: number;
  sub_meeting_id?: string;
}

/**
 * 录制信息（来自 common-record-info API）
 */
export interface RecordingInfo {
  id: string; // 录制 ID
  sharing_id: string;
  name: string; // 录制名称（如 "录制1"）
  start_time: string; // 时间戳字符串（毫秒）
  end_time: string; // 时间戳字符串（毫秒）
  duration: string; // 时长（毫秒字符串）
  size: string; // 文件大小（字节字符串）
  state: number; // 状态码
  view_count?: number;
  download_count?: number;
  cover_url?: string;
  minutes_status?: number; // 会议纪要状态
  minutes_exportable?: number; // 是否可导出纪要
  record_type?: string; // "cloud_record"
  [key: string]: unknown; // 其他可选字段
}

// ==================== 简化的展示类型 ====================

/**
 * 转写片段（简化后用于展示）
 */
export interface TranscriptSegment {
  pid: string; // 段落ID
  start_time: number; // 开始时间（毫秒）
  end_time: number; // 结束时间（毫秒）
  text: string; // 转写文本
  speaker?: string; // 发言人
  speaker_id?: string; // 发言人ID
  avatar_url?: string; // 发言人头像
}

/**
 * 参会人员（简化后）
 */
export interface Participant {
  user_id?: string;
  user_name: string;
  avatar_url?: string;
  join_time?: number;
  leave_time?: number;
}

// 聊天消息
export interface ChatMessage {
  message_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: number;
}

// 行动项
export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  due_date?: string;
  status?: 'pending' | 'completed';
}

// 重点时刻
export interface Highlight {
  id: string;
  timestamp: number;
  description: string;
  content?: string;
}

// 会议元数据
export interface MeetingMetadata {
  meeting_id: string;
  recording_id: string;
  title: string;
  start_time?: number;
  end_time?: number;
  duration?: number; // 毫秒
  share_id?: string;
  short_url_code?: string;
  meeting_code?: string; // 会议号
  pk_meeting_info_id?: string; // 主键会议信息 ID
}

// 完整会议数据
export interface MeetingData {
  metadata: MeetingMetadata;
  summary?: string; // AI智能总结
  minutes?: string; // 会议纪要
  transcript: TranscriptSegment[];
  participants?: Participant[];
  chat_messages?: ChatMessage[];
  action_items?: ActionItem[];
  highlights?: Highlight[];
  keywords?: string[]; // 关键词
  chapters?: Chapter[]; // 章节
  recording_info?: RecordingInfo; // 录制详细信息
  captured_at: number; // 数据捕获时间戳
}

/**
 * 章节信息
 */
export interface Chapter {
  id: string;
  title: string;
  start_time: number; // 毫秒
  end_time: number; // 毫秒
  summary?: string;
}

// 缓存的会议数据（包含时间戳）
export interface CachedMeetingData {
  data: MeetingData;
  timestamp: number;
}

// ==================== API 响应类型 ====================

/**
 * minutes/detail API 响应
 */
export interface MinutesDetailResponse {
  code: number;
  minutes?: {
    lang: string;
    paragraphs: TranscriptParagraph[];
    keywords?: Array<{ keyword: string }>;
    ori_keywords?: Array<{ keyword: string }>;
    chapters?: Array<{
      chapter_id: string;
      title: string;
      start_time: number;
      end_time: number;
      summary?: string;
    }>;
    summary?: string; // AI 摘要
    action_items?: Array<{
      id: string;
      content: string;
      assignee?: string;
    }>;
    audio_detect?: number;
    show_promotion?: boolean;
    recording_transcription?: boolean;
    trial_duration?: number;
    minutes_version?: number;
    is_cve?: boolean;
  };
  more?: boolean;
  nonce?: string;
}

/**
 * common-record-info API 响应
 */
export interface CommonRecordInfoResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: {
    sharing_id?: string;
    pk_meeting_info_id: string;
    total_recording_duration?: string;
    total_recording_size?: string;
    total_view_counts?: string;
    total_download_counts?: string;
    meeting_members?: MeetingMember[];
    meeting_info?: MeetingInfo;
    recordings?: RecordingInfo[];
    record_creator?: {
      creator_uid?: string;
      creator_name?: string;
      creator_nick_name?: string;
      creator_corp_name?: string;
    };
    share_id?: string;
    [key: string]: unknown;
  };
}

/**
 * 通用 API 响应类型
 */
export interface TencentMeetingAPIResponse {
  code: number;
  message?: string;
  err_detail?: string;
  msg?: string;
  data?: unknown;
  minutes?: unknown;
}

// Chrome Storage 键名常量
export const STORAGE_KEYS = {
  MEETINGS: 'cached_meetings',
  CURRENT_MEETING_ID: 'current_meeting_id',
} as const;

// 消息类型（用于background和popup通信）
export enum MessageType {
  GET_MEETING_DATA = 'GET_MEETING_DATA',
  MEETING_DATA_UPDATED = 'MEETING_DATA_UPDATED',
  CLEAR_CACHE = 'CLEAR_CACHE',
}

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface GetMeetingDataMessage extends Message {
  type: MessageType.GET_MEETING_DATA;
  payload?: {
    meetingId?: string;
    recordingId?: string;
  };
}

export interface MeetingDataResponse {
  success: boolean;
  data?: MeetingData;
  error?: string;
}

// ==================== 数据验证辅助函数 ====================

/**
 * 检查值是否为有效字符串
 * @param value - 待检查的值
 * @returns 是否为非空字符串
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 检查值是否为有效数字
 * @param value - 待检查的值
 * @returns 是否为有效的有限数字
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * 检查值是否为有效数组
 * @param value - 待检查的值
 * @returns 是否为非空数组
 */
export function isValidArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * 安全解析数字（从字符串或数字）
 * @param value - 字符串或数字类型的值
 * @returns 解析后的数字，失败时返回 undefined
 */
export function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

/**
 * 安全解析时间戳（毫秒）
 * @param value - 时间戳字符串或数字
 * @returns 解析后的时间戳（毫秒），验证范围在 2000-2100 年之间
 */
export function parseTimestamp(value: unknown): number | undefined {
  const num = parseNumber(value);
  // 验证时间戳是否在合理范围内（2000-2100年）
  if (num && num > 946684800000 && num < 4102444800000) {
    return num;
  }
  return undefined;
}

/**
 * 解码 Base64 编码的字符串（用于会议主题）
 * @param encoded - Base64 编码的字符串
 * @returns 解码后的字符串，失败时返回原始值
 */
export function decodeBase64(encoded: string): string {
  try {
    // 检查是否为 Base64 格式（只包含合法字符）
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
      return encoded;
    }
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    // 如果解码失败，返回原始值
    return encoded;
  }
}

/**
 * 类型守卫：检查是否为有效的 MinutesDetailResponse
 */
export function isMinutesDetailResponse(
  value: unknown
): value is MinutesDetailResponse {
  const response = value as MinutesDetailResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.minutes !== undefined
  );
}

/**
 * 类型守卫：检查是否为有效的 CommonRecordInfoResponse
 */
export function isCommonRecordInfoResponse(
  value: unknown
): value is CommonRecordInfoResponse {
  const response = value as CommonRecordInfoResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}
