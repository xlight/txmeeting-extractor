/**
 * 腾讯会议数据类型定义
 */

// 转写片段
export interface TranscriptSegment {
  pid: string; // 段落ID
  start_time: number; // 开始时间（毫秒）
  end_time: number; // 结束时间（毫秒）
  text: string; // 转写文本
  speaker?: string; // 发言人
  speaker_id?: string; // 发言人ID
}

// 参会人员
export interface Participant {
  user_id: string;
  user_name: string;
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
  duration?: number; // 秒
  share_id?: string;
  short_url_code?: string;
}

// 完整会议数据
export interface MeetingData {
  metadata: MeetingMetadata;
  summary?: string; // AI智能总结
  minutes?: string; // 会议纪要
  transcript: TranscriptSegment[];
  paragraphs?: string[]; // 段落结构
  participants?: Participant[];
  chat_messages?: ChatMessage[];
  action_items?: ActionItem[];
  highlights?: Highlight[];
  screen_sharing?: string[]; // 屏幕分享内容引用
  captured_at: number; // 数据捕获时间戳
}

// 缓存的会议数据（包含时间戳）
export interface CachedMeetingData {
  data: MeetingData;
  timestamp: number;
}

// API响应类型（根据实际API响应调整）
export interface TencentMeetingAPIResponse {
  code: number;
  message: string;
  data: {
    id: string;
    meeting_id: string;
    recording_id: string;
    title?: string;
    transcript_list?: TranscriptSegment[];
    summary?: string;
    minutes?: string;
    participants?: Participant[];
    // ... 其他字段根据实际API响应添加
  };
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
