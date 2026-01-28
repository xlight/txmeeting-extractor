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
  // 新增类型
  FullSummary,
  ChapterDetail,
  TimelineEvent,
  TodoItem,
  SmartTopic,
  CriticalNode,
  RecordingFile,
  // 新增响应类型
  GetFullSummaryResponse,
  GetChapterResponse,
  GetTimeLineResponse,
  GetMulSummaryAndTodoResponse,
  GetSmartTopicResponse,
  GetCriticalNodeResponse,
  GetMultiRecordFileResponse,
  // 新增类型守卫
  isGetFullSummaryResponse,
  isGetChapterResponse,
  isGetTimeLineResponse,
  isGetMulSummaryAndTodoResponse,
  isGetSmartTopicResponse,
  isGetCriticalNodeResponse,
  isGetMultiRecordFileResponse,
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
  fullSummary?: GetFullSummaryResponse;
  chapter?: GetChapterResponse;
  timeLine?: GetTimeLineResponse;
  mulSummaryAndTodo?: GetMulSummaryAndTodoResponse;
  smartTopic?: GetSmartTopicResponse;
  criticalNode?: GetCriticalNodeResponse;
  multiRecordFile?: GetMultiRecordFileResponse;
}): MeetingData | null {
  try {
    console.log('[Extractor] 开始提取会议数据...');
    console.log('[Extractor] 输入:', {
      hasMinutesDetail: !!apiResponses.minutesDetail,
      hasCommonRecordInfo: !!apiResponses.commonRecordInfo,
      hasFullSummary: !!apiResponses.fullSummary,
      hasChapter: !!apiResponses.chapter,
      hasTimeLine: !!apiResponses.timeLine,
      hasTodoList: !!apiResponses.mulSummaryAndTodo,
      hasSmartTopic: !!apiResponses.smartTopic,
      hasCriticalNode: !!apiResponses.criticalNode,
      hasRecordingFiles: !!apiResponses.multiRecordFile,
    });

    // 提取核心数据
    const minutesData = apiResponses.minutesDetail
      ? extractFromMinutesDetail(apiResponses.minutesDetail)
      : {};

    console.log('[Extractor] minutesData 提取结果:', {
      hasMetadata: !!minutesData.metadata,
      hasSummary: !!minutesData.summary,
      transcriptCount: minutesData.transcript?.length || 0,
      keywordsCount: minutesData.keywords?.length || 0,
    });

    const recordData = apiResponses.commonRecordInfo
      ? extractFromCommonRecordInfo(apiResponses.commonRecordInfo)
      : {};

    console.log('[Extractor] recordData 提取结果:', {
      hasMetadata: !!recordData.metadata,
      participantsCount: recordData.participants?.length || 0,
    });

    // 提取增强数据
    const fullSummaryData = apiResponses.fullSummary
      ? extractFromFullSummary(apiResponses.fullSummary)
      : {};

    const chapterData = apiResponses.chapter
      ? extractFromChapter(apiResponses.chapter)
      : {};

    const timelineData = apiResponses.timeLine
      ? extractFromTimeLine(apiResponses.timeLine)
      : {};

    const todoData = apiResponses.mulSummaryAndTodo
      ? extractFromMulSummaryAndTodo(apiResponses.mulSummaryAndTodo)
      : {};

    const topicData = apiResponses.smartTopic
      ? extractFromSmartTopic(apiResponses.smartTopic)
      : {};

    const nodeData = apiResponses.criticalNode
      ? extractFromCriticalNode(apiResponses.criticalNode)
      : {};

    const fileData = apiResponses.multiRecordFile
      ? extractFromMultiRecordFile(apiResponses.multiRecordFile)
      : {};

    console.log('[Extractor] 增强数据提取结果:', {
      hasFullSummary: !!fullSummaryData.full_summary,
      chapterCount: chapterData.chapter_details?.length || 0,
      timelineCount: timelineData.timeline?.length || 0,
      todoCount: todoData.todo_list?.length || 0,
      topicCount: topicData.smart_topics?.length || 0,
      nodeCount: nodeData.critical_nodes?.length || 0,
      fileCount: fileData.recording_files?.length || 0,
    });

    // 合并数据，recordData 的 metadata 优先
    // 如果有 chapter_details，将其转换为 chapters 格式（优先使用详细数据）
    const chapters =
      chapterData.chapter_details && chapterData.chapter_details.length > 0
        ? chapterData.chapter_details.map((detail) => ({
            id: detail.chapter_id,
            title: detail.title,
            start_time: detail.start_time,
            end_time: detail.end_time,
            summary: detail.summary,
          }))
        : minutesData.chapters;

    const mergedData: MeetingData = {
      // 核心数据
      metadata:
        recordData.metadata || minutesData.metadata || createEmptyMetadata(),
      summary: minutesData.summary,
      transcript: minutesData.transcript || [],
      participants: recordData.participants,
      action_items: minutesData.action_items,
      keywords: minutesData.keywords,
      chapters, // 使用转换后的章节数据
      recording_info: recordData.recording_info,

      // 增强数据
      full_summary: fullSummaryData.full_summary,
      chapter_details: chapterData.chapter_details,
      timeline: timelineData.timeline,
      todo_list: todoData.todo_list,
      smart_topics: topicData.smart_topics,
      critical_nodes: nodeData.critical_nodes,
      recording_files: fileData.recording_files,

      captured_at: Date.now(),
    };

    console.log('[Extractor] 合并后的 metadata:', mergedData.metadata);

    // 验证必要字段（如果两个都没有，说明数据可能有问题）
    // 但我们允许在 background script 中稍后补充这些 ID
    const hasAnyId =
      mergedData.metadata.meeting_id || mergedData.metadata.recording_id;
    const hasAnyData =
      mergedData.transcript.length > 0 ||
      !!mergedData.summary ||
      (mergedData.keywords && mergedData.keywords.length > 0);

    if (!hasAnyId && !hasAnyData) {
      console.warn('[Extractor] 无法提取有效的会议标识或内容');
      console.warn('[Extractor] metadata 详情:', mergedData.metadata);
      return null;
    }

    console.log('[Extractor] ✅ 数据提取成功');
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

// ==================== 新增 API 提取函数 ====================

/**
 * 从 get-full-summary API 响应中提取完整摘要
 */
export function extractFromFullSummary(
  response: GetFullSummaryResponse
): Partial<MeetingData> {
  if (!isGetFullSummaryResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 get-full-summary API 响应');
    return {};
  }

  return {
    full_summary: response.data,
  };
}

/**
 * 从 get-chapter API 响应中提取章节详情
 */
export function extractFromChapter(
  response: GetChapterResponse
): Partial<MeetingData> {
  if (!isGetChapterResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 get-chapter API 响应');
    return {};
  }

  const { data } = response;

  return {
    chapter_details: data.chapter_list
      ?.map(convertChapterDetail)
      .filter(Boolean) as ChapterDetail[],
  };
}

/**
 * 从 get-time-line API 响应中提取时间轴事件
 */
export function extractFromTimeLine(
  response: GetTimeLineResponse
): Partial<MeetingData> {
  if (!isGetTimeLineResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 get-time-line API 响应');
    return {};
  }

  const { data } = response;

  return {
    timeline: data.timeline_list
      ?.map(convertTimelineEvent)
      .filter(Boolean) as TimelineEvent[],
  };
}

/**
 * 从 get-mul-summary-and-todo API 响应中提取待办事项
 */
export function extractFromMulSummaryAndTodo(
  response: GetMulSummaryAndTodoResponse
): Partial<MeetingData> {
  if (!isGetMulSummaryAndTodoResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 get-mul-summary-and-todo API 响应');
    return {};
  }

  const { data } = response;

  return {
    todo_list: data.todo_list
      ?.map(convertTodoItem)
      .filter(Boolean) as TodoItem[],
  };
}

/**
 * 从 get-smart-topic API 响应中提取智能话题
 */
export function extractFromSmartTopic(
  response: GetSmartTopicResponse
): Partial<MeetingData> {
  console.log('[Extractor] 🔖 处理 get-smart-topic 响应:', response);

  if (!isGetSmartTopicResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 get-smart-topic API 响应');
    console.warn('[Extractor] 响应验证:', {
      isValid: isGetSmartTopicResponse(response),
      hasData: !!response.data,
      response,
    });
    return {};
  }

  const { data } = response;

  console.log('[Extractor] topic_infos 数量:', data.topic_infos?.length || 0);
  console.log('[Extractor] topic_status:', data.topic_status);

  const topics = data.topic_infos
    ?.map(convertSmartTopic)
    .filter(Boolean) as SmartTopic[];

  console.log('[Extractor] 转换后的话题数量:', topics?.length || 0);

  return {
    smart_topics: topics,
  };
}

/**
 * 从 get-critical-node API 响应中提取关键节点
 */
export function extractFromCriticalNode(
  response: GetCriticalNodeResponse
): Partial<MeetingData> {
  if (!isGetCriticalNodeResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 get-critical-node API 响应');
    return {};
  }

  const { data } = response;

  return {
    critical_nodes: data.node_list
      ?.map(convertCriticalNode)
      .filter(Boolean) as CriticalNode[],
  };
}

/**
 * 从 get-multi-record-file API 响应中提取录制文件
 */
export function extractFromMultiRecordFile(
  response: GetMultiRecordFileResponse
): Partial<MeetingData> {
  if (!isGetMultiRecordFileResponse(response) || !response.data) {
    console.warn('[Extractor] 无效的 get-multi-record-file API 响应');
    return {};
  }

  const { data } = response;

  return {
    recording_files: data.file_list
      ?.map(convertRecordingFile)
      .filter(Boolean) as RecordingFile[],
  };
}

// ==================== 转换函数 ====================

/**
 * 转换章节详情数据
 */
function convertChapterDetail(chapter: {
  chapter_id: string;
  title: string;
  start_time: number;
  end_time: number;
  summary: string;
  chapter_type: number;
  origin_title?: string;
  lang?: string;
}): ChapterDetail | null {
  try {
    if (!chapter.chapter_id || !chapter.title) {
      return null;
    }

    return {
      chapter_id: chapter.chapter_id,
      title: sanitizeText(chapter.title),
      start_time: chapter.start_time,
      end_time: chapter.end_time,
      summary: sanitizeText(chapter.summary),
      chapter_type: chapter.chapter_type,
      origin_title: chapter.origin_title
        ? sanitizeText(chapter.origin_title)
        : undefined,
      lang: chapter.lang,
    };
  } catch (error) {
    console.error('[Extractor] 转换章节详情失败:', error, chapter);
    return null;
  }
}

/**
 * 转换时间轴事件数据
 */
function convertTimelineEvent(event: {
  event_id: string;
  event_time: number;
  event_type: number;
  event_title: string;
  event_content?: string;
  participants?: string[];
}): TimelineEvent | null {
  try {
    if (!event.event_id || !event.event_title) {
      return null;
    }

    return {
      event_id: event.event_id,
      event_time: event.event_time,
      event_type: event.event_type,
      event_title: sanitizeText(event.event_title),
      event_content: event.event_content
        ? sanitizeText(event.event_content)
        : undefined,
      participants: event.participants,
    };
  } catch (error) {
    console.error('[Extractor] 转换时间轴事件失败:', error, event);
    return null;
  }
}

/**
 * 转换待办事项数据
 */
function convertTodoItem(item: {
  todo_id?: string;
  content: string;
  assignee?: string;
  assignee_id?: string;
  due_date?: string;
  status?: number;
  priority?: number;
  create_time?: number;
}): TodoItem | null {
  try {
    if (!item.content) {
      return null;
    }

    return {
      todo_id: item.todo_id || `todo-${Date.now()}-${Math.random()}`,
      content: sanitizeText(item.content),
      assignee: item.assignee ? sanitizeText(item.assignee) : undefined,
      assignee_id: item.assignee_id,
      due_date: item.due_date,
      status: item.status,
      priority: item.priority,
      create_time: item.create_time,
    };
  } catch (error) {
    console.error('[Extractor] 转换待办事项失败:', error, item);
    return null;
  }
}

/**
 * 转换智能话题数据
 */
function convertSmartTopic(topic: {
  topic_id: string;
  topic_name: string;
  start_time: string;
  end_time: string;
  percentage: number;
  scope: Array<{
    pid: string;
    start_time: string;
    end_time: string;
  }>;
  orig_name?: string;
}): SmartTopic | null {
  try {
    if (!topic.topic_id || !topic.topic_name) {
      return null;
    }

    return {
      topic_id: topic.topic_id,
      topic_name: sanitizeText(topic.topic_name),
      start_time: topic.start_time,
      end_time: topic.end_time,
      percentage: topic.percentage,
      scope: topic.scope || [],
      orig_name: topic.orig_name,
    };
  } catch (error) {
    console.error('[Extractor] 转换智能话题失败:', error, topic);
    return null;
  }
}

/**
 * 转换关键节点数据
 */
function convertCriticalNode(node: {
  node_id: string;
  node_time: number;
  node_type: number;
  title: string;
  description: string;
  participants?: string[];
  importance?: number;
}): CriticalNode | null {
  try {
    if (!node.node_id || !node.title) {
      return null;
    }

    return {
      node_id: node.node_id,
      node_time: node.node_time,
      node_type: node.node_type,
      title: sanitizeText(node.title),
      description: sanitizeText(node.description),
      participants: node.participants,
      importance: node.importance,
    };
  } catch (error) {
    console.error('[Extractor] 转换关键节点失败:', error, node);
    return null;
  }
}

/**
 * 转换录制文件数据
 */
function convertRecordingFile(file: {
  file_id: string;
  file_type: string;
  file_name: string;
  file_size?: number;
  download_url?: string;
  duration?: number;
  format?: string;
  quality?: string;
}): RecordingFile | null {
  try {
    if (!file.file_id || !file.file_name) {
      return null;
    }

    return {
      file_id: file.file_id,
      file_type: file.file_type,
      file_name: sanitizeText(file.file_name),
      file_size: file.file_size,
      download_url: file.download_url,
      duration: file.duration,
      format: file.format,
      quality: file.quality,
    };
  } catch (error) {
    console.error('[Extractor] 转换录制文件失败:', error, file);
    return null;
  }
}
