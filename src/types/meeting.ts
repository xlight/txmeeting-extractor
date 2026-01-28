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

// ==================== 新增 API 数据类型 ====================

/**
 * 完整摘要（来自 get-full-summary API）
 */
export interface FullSummary {
  full_summary: string; // 完整摘要文本
  summary_deal_status: number; // 摘要处理状态
  lang: string; // 语言
  origin_full_summary?: string; // 原始摘要
  is_audio_detect_complete?: boolean; // 音频检测是否完成
  model_status?: number; // 模型状态
}

/**
 * 章节信息（增强版，来自 get-chapter API）
 */
export interface ChapterDetail {
  chapter_id: string; // 章节 ID
  title: string; // 章节标题
  start_time: number; // 开始时间（毫秒）
  end_time: number; // 结束时间（毫秒）
  summary: string; // 章节摘要
  chapter_type: number; // 章节类型
  origin_title?: string; // 原始标题
  lang?: string; // 语言
}

/**
 * 时间轴事件（来自 get-time-line API）
 */
export interface TimelineEvent {
  event_id: string; // 事件 ID
  event_time: number; // 事件时间（毫秒）
  event_type: number; // 事件类型
  event_title: string; // 事件标题
  event_content?: string; // 事件内容
  participants?: string[]; // 相关参与者
}

/**
 * 待办事项（来自 get-mul-summary-and-todo API）
 */
export interface TodoItem {
  todo_id: string; // 待办 ID
  content: string; // 待办内容
  assignee?: string; // 负责人
  assignee_id?: string; // 负责人 ID
  due_date?: string; // 截止日期
  status?: number; // 状态：0=未完成，1=已完成
  priority?: number; // 优先级
  create_time?: number; // 创建时间
}

/**
 * 智能话题（来自 get-smart-topic API）
 */
export interface SmartTopic {
  topic_id: string; // 话题 ID
  topic_name: string; // 话题名称
  start_time: string; // 开始时间（毫秒字符串）
  end_time: string; // 结束时间（毫秒字符串）
  percentage: number; // 话题占会议总时长的百分比
  scope: Array<{
    // 话题包含的时间段片段
    pid: string; // 段落 ID
    start_time: string; // 开始时间（毫秒字符串）
    end_time: string; // 结束时间（毫秒字符串）
  }>;
  orig_name?: string; // 原始名称
}

/**
 * 关键节点/决策点（来自 get-critical-node API）
 */
export interface CriticalNode {
  node_id: string; // 节点 ID
  node_time: number; // 节点时间（毫秒）
  node_type: number; // 节点类型：1=决策，2=结论，3=问题
  title: string; // 节点标题
  description: string; // 节点描述
  participants?: string[]; // 相关参与者
  importance?: number; // 重要性评分
}

/**
 * 录制文件（来自 get-multi-record-file API）
 */
export interface RecordingFile {
  file_id: string; // 文件 ID
  file_type: string; // 文件类型：video/audio/transcript
  file_name: string; // 文件名
  file_size?: number; // 文件大小（字节）
  download_url?: string; // 下载链接
  duration?: number; // 时长（毫秒）
  format?: string; // 格式：mp4/m4a/txt
  quality?: string; // 质量：hd/sd
}

// 完整会议数据（扩展版）
export interface MeetingData {
  metadata: MeetingMetadata;

  // 原有字段
  summary?: string; // AI智能总结（简要）
  minutes?: string; // 会议纪要
  transcript: TranscriptSegment[];
  participants?: Participant[];
  chat_messages?: ChatMessage[];
  action_items?: ActionItem[];
  highlights?: Highlight[];
  keywords?: string[]; // 关键词
  chapters?: Chapter[]; // 章节（简化版）
  recording_info?: RecordingInfo; // 录制详细信息

  // 新增字段（来自新 API）
  full_summary?: FullSummary; // 完整摘要（详细、超详细版本）
  chapter_details?: ChapterDetail[]; // 章节详情（增强版）
  timeline?: TimelineEvent[]; // 时间轴事件
  todo_list?: TodoItem[]; // 待办事项列表
  smart_topics?: SmartTopic[]; // 智能话题
  critical_nodes?: CriticalNode[]; // 关键节点/决策点
  recording_files?: RecordingFile[]; // 录制文件列表

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

// ==================== 新增 API 响应类型 ====================

/**
 * get-full-summary API 响应
 */
export interface GetFullSummaryResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: FullSummary;
  nonce?: string;
  timestamp?: number;
}

/**
 * get-chapter API 响应
 */
export interface GetChapterResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: {
    chapter_list?: ChapterDetail[];
    chapter_status?: number; // 章节生成状态
    lang?: string;
    model_status?: number;
  };
  nonce?: string;
  timestamp?: number;
}

/**
 * get-time-line API 响应
 */
export interface GetTimeLineResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: {
    timeline_list?: TimelineEvent[];
    timeline_status?: number;
  };
  nonce?: string;
  timestamp?: number;
}

/**
 * get-mul-summary-and-todo API 响应
 */
export interface GetMulSummaryAndTodoResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: {
    is_audio_detect_complete?: boolean;
    chapter_summary?: {
      summary_list?: Array<{
        chapter_id: string;
        summary: string;
      }>;
      summary_status?: number;
      lang?: string;
      model_status?: number;
    };
    topic_summary?: {
      begin_summary?: string;
      sub_points?: Array<{
        title: string;
        content: string;
      }>;
      end_summary?: string;
      summary_status?: number;
      lang?: string;
      model_status?: number;
    };
    todo_list?: Array<{
      todo_id?: string;
      content: string;
      assignee?: string;
      assignee_id?: string;
      due_date?: string;
      status?: number;
      priority?: number;
      create_time?: number;
    }>;
    todo_status?: number;
  };
  nonce?: string;
  timestamp?: number;
}

/**
 * get-smart-topic API 响应
 */
export interface GetSmartTopicResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: {
    record_id?: string;
    meeting_id?: string;
    topic_status?: number; // 话题生成状态：0=生成中，1=失败，2=成功
    topic_infos?: Array<{
      topic_id: string;
      topic_name: string;
      start_time: string; // 毫秒字符串
      end_time: string; // 毫秒字符串
      percentage: number; // 百分比
      scope: Array<{
        pid: string;
        start_time: string;
        end_time: string;
      }>;
      orig_name?: string;
    }>;
  };
  nonce?: string;
  timestamp?: number;
}

/**
 * get-critical-node API 响应
 */
export interface GetCriticalNodeResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: {
    node_list?: Array<{
      node_id: string;
      node_time: number;
      node_type: number;
      title: string;
      description: string;
      participants?: string[];
      importance?: number;
    }>;
    node_status?: number;
  };
  nonce?: string;
  timestamp?: number;
}

/**
 * get-multi-record-file API 响应
 */
export interface GetMultiRecordFileResponse {
  code: number;
  err_detail?: string;
  msg?: string;
  data?: {
    file_list?: Array<{
      file_id: string;
      file_type: string;
      file_name: string;
      file_size?: number;
      download_url?: string;
      duration?: number;
      format?: string;
      quality?: string;
    }>;
  };
  nonce?: string;
  timestamp?: number;
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

// ==================== 新增 API 类型守卫 ====================

/**
 * 类型守卫：检查是否为有效的 GetFullSummaryResponse
 */
export function isGetFullSummaryResponse(
  value: unknown
): value is GetFullSummaryResponse {
  const response = value as GetFullSummaryResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}

/**
 * 类型守卫：检查是否为有效的 GetChapterResponse
 */
export function isGetChapterResponse(
  value: unknown
): value is GetChapterResponse {
  const response = value as GetChapterResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}

/**
 * 类型守卫：检查是否为有效的 GetTimeLineResponse
 */
export function isGetTimeLineResponse(
  value: unknown
): value is GetTimeLineResponse {
  const response = value as GetTimeLineResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}

/**
 * 类型守卫：检查是否为有效的 GetMulSummaryAndTodoResponse
 */
export function isGetMulSummaryAndTodoResponse(
  value: unknown
): value is GetMulSummaryAndTodoResponse {
  const response = value as GetMulSummaryAndTodoResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}

/**
 * 类型守卫：检查是否为有效的 GetSmartTopicResponse
 */
export function isGetSmartTopicResponse(
  value: unknown
): value is GetSmartTopicResponse {
  const response = value as GetSmartTopicResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}

/**
 * 类型守卫：检查是否为有效的 GetCriticalNodeResponse
 */
export function isGetCriticalNodeResponse(
  value: unknown
): value is GetCriticalNodeResponse {
  const response = value as GetCriticalNodeResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}

/**
 * 类型守卫：检查是否为有效的 GetMultiRecordFileResponse
 */
export function isGetMultiRecordFileResponse(
  value: unknown
): value is GetMultiRecordFileResponse {
  const response = value as GetMultiRecordFileResponse;
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.code === 'number' &&
    response.code === 0 &&
    response.data !== undefined
  );
}
