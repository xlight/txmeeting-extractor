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
  RecordingFile,
  // UI 展示类型
  TopicInfo,
  ParticipantSpeakingTime,
  ChapterInfo,
  MeetingStatistics,
  // 新增响应类型
  GetFullSummaryResponse,
  GetChapterResponse,
  GetTimeLineResponse,
  GetMulSummaryAndTodoResponse,
  GetSmartTopicResponse,
  GetMultiRecordFileResponse,
  // 新增类型守卫
  isGetFullSummaryResponse,
  isGetChapterResponse,
  isGetTimeLineResponse,
  isGetMulSummaryAndTodoResponse,
  isGetSmartTopicResponse,
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

  console.log('[DEBUG] extractFromMinutesDetail - 原始 keywords:', {
    rawKeywords: minutes.keywords,
    type: typeof minutes.keywords,
    isArray: Array.isArray(minutes.keywords),
    length: minutes.keywords?.length,
  });

  return {
    // 转写内容：将 3 层嵌套结构（paragraphs → sentences → words）转换为扁平化的段落列表
    transcript: convertParagraphsToSegments(minutes.paragraphs || []),

    // 关键词
    // API 返回的是字符串数组：["关键词1", "关键词2"]
    keywords: minutes.keywords,

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
  mulSummaryAndTodo?: {
    topicSummary?: GetMulSummaryAndTodoResponse;
    chapterSummary?: GetMulSummaryAndTodoResponse;
    speakerSummary?: GetMulSummaryAndTodoResponse;
  };
  smartTopic?: GetSmartTopicResponse;
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
      hasTopicSummary: !!apiResponses.mulSummaryAndTodo?.topicSummary,
      hasChapterSummary: !!apiResponses.mulSummaryAndTodo?.chapterSummary,
      hasSpeakerSummary: !!apiResponses.mulSummaryAndTodo?.speakerSummary,
      hasSmartTopic: !!apiResponses.smartTopic,
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
      keywords: minutesData.keywords,
      fullMinutesData: minutesData,
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

    const fileData = apiResponses.multiRecordFile
      ? extractFromMultiRecordFile(apiResponses.multiRecordFile)
      : {};

    console.log('[Extractor] 增强数据提取结果:', {
      hasFullSummary: !!fullSummaryData.full_summary,
      chapterCount: chapterData.chapter_details?.length || 0,
      timelineCount: timelineData.timeline?.length || 0,
      todoListCount: todoData.todo_list?.length || 0,
      todoItemsCount: todoData.todo_items?.length || 0,
      hasTopicSummary: !!todoData.topic_summary_data,
      hasChapterSummary: !!todoData.chapter_summary_data,
      hasSpeakerSummary: !!todoData.speaker_summary_data,
      topicCount: topicData.smart_topics?.length || 0,
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

    console.log('[Extractor] 🔍 准备合并数据，keywords 详情:', {
      minutesDataKeywords: minutesData.keywords,
      minutesDataKeywordsType: typeof minutesData.keywords,
      minutesDataKeywordsIsArray: Array.isArray(minutesData.keywords),
      minutesDataKeywordsLength: minutesData.keywords?.length,
    });

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
      recording_files: fileData.recording_files,

      // 新增：三种纪要类型和待办事项
      topic_summary_data: todoData.topic_summary_data,
      chapter_summary_data: todoData.chapter_summary_data,
      speaker_summary_data: todoData.speaker_summary_data,
      todo_items: todoData.todo_items,

      // AI 模型纪要
      deepseek_summary_data: todoData.deepseek_summary_data,

      captured_at: Date.now(),
    };

    console.log('[Extractor] 合并后的 metadata:', mergedData.metadata);
    console.log('[Extractor] 🔍 最终 mergedData.keywords:', {
      keywords: mergedData.keywords,
      type: typeof mergedData.keywords,
      isArray: Array.isArray(mergedData.keywords),
      length: mergedData.keywords?.length,
    });

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
    console.log(
      '[Extractor] 🔍 最终数据包含 DeepSeek 纪要?',
      !!mergedData.deepseek_summary_data
    );
    if (mergedData.deepseek_summary_data) {
      console.log('[Extractor] 🔍 DeepSeek 纪要状态:', {
        status: mergedData.deepseek_summary_data.summary_status,
        pointsCount: mergedData.deepseek_summary_data.sub_points?.length || 0,
      });
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

// ==================== 新增 API 提取函数 ====================

/**
 * 从 get-full-summary API 响应中提取完整纪要
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
 * 从 get-mul-summary-and-todo API 的多个响应中提取数据
 * @param responses - 包含三种纪要类型响应的对象
 */
export function extractFromMulSummaryAndTodo(responses: {
  topicSummary?: GetMulSummaryAndTodoResponse;
  chapterSummary?: GetMulSummaryAndTodoResponse;
  speakerSummary?: GetMulSummaryAndTodoResponse;
}): Partial<MeetingData> {
  console.log('[Extractor] 🔍 开始提取 mulSummaryAndTodo 数据');
  console.log('[Extractor] 输入响应:', {
    hasTopicSummary: !!responses.topicSummary,
    hasChapterSummary: !!responses.chapterSummary,
    hasSpeakerSummary: !!responses.speakerSummary,
  });

  // 输出 topicSummary 的详细结构
  if (responses.topicSummary?.data) {
    console.log(
      '[Extractor] 🔍 topicSummary.data 包含的字段:',
      Object.keys(responses.topicSummary.data)
    );
  }

  const result: Partial<MeetingData> = {};

  // 提取主题纪要数据 (summary_type=8)
  if (responses.topicSummary?.data?.topic_summary) {
    const topicData = responses.topicSummary.data.topic_summary;
    console.log('[Extractor] 🔍 原始主题纪要数据:', {
      hasBeginSummary: !!topicData.begin_summary,
      beginSummaryLength: topicData.begin_summary?.length || 0,
      subPointsIsArray: Array.isArray(topicData.sub_points),
      subPointsCount: topicData.sub_points?.length || 0,
      subPointsRaw: topicData.sub_points,
      hasEndSummary: !!topicData.end_summary,
      endSummaryLength: topicData.end_summary?.length || 0,
      summaryStatus: topicData.summary_status,
    });

    result.topic_summary_data = {
      begin_summary: topicData.begin_summary || '',
      sub_points: topicData.sub_points || [],
      end_summary: topicData.end_summary || '',
      custom_summary: topicData.custom_summary || '',
      orig_custom_summary: topicData.orig_custom_summary || '',
      summary_status: topicData.summary_status || 0,
      lang: topicData.lang || '',
      model_status: topicData.model_status || 0,
    };
    console.log('[Extractor] ✅ 提取主题纪要数据:', {
      beginLength: result.topic_summary_data.begin_summary.length,
      pointsCount: result.topic_summary_data.sub_points.length,
      endLength: result.topic_summary_data.end_summary.length,
      status: result.topic_summary_data.summary_status,
    });
  } else {
    console.log('[Extractor] ⚠️ 未找到主题纪要数据', {
      hasResponse: !!responses.topicSummary,
      hasData: !!responses.topicSummary?.data,
      hasTopicSummary: !!responses.topicSummary?.data?.topic_summary,
    });
  }

  // 提取分章节纪要数据 (summary_type=1)
  if (responses.chapterSummary?.data?.chapter_summary) {
    const chapterData = responses.chapterSummary.data.chapter_summary;
    console.log('[Extractor] 🔍 原始分章节纪要数据:', {
      summaryListIsArray: Array.isArray(chapterData.summary_list),
      summaryListCount: chapterData.summary_list?.length || 0,
      summaryStatus: chapterData.summary_status,
    });

    result.chapter_summary_data = {
      summary_list:
        chapterData.summary_list?.map((item) => ({
          summary_id: item.summary_id,
          title: item.title || '',
          summary: item.summary,
        })) || [],
      custom_summary: chapterData.custom_summary || '',
      orig_custom_summary: chapterData.orig_custom_summary || '',
      summary_status: chapterData.summary_status || 0,
      lang: chapterData.lang || '',
      model_status: chapterData.model_status || 0,
    };
    console.log('[Extractor] ✅ 提取分章节纪要数据:', {
      chaptersCount: result.chapter_summary_data.summary_list.length,
      status: result.chapter_summary_data.summary_status,
    });
  } else {
    console.log('[Extractor] ⚠️ 未找到分章节纪要数据');
  }

  // 提取发言人观点数据 (summary_type=4)
  if (responses.speakerSummary?.data?.speaker_summary) {
    const speakerData = responses.speakerSummary.data.speaker_summary;
    console.log('[Extractor] 🔍 原始发言人观点数据:', {
      speakersOpinionsIsArray: Array.isArray(speakerData.speakers_opinions),
      speakersCount: speakerData.speakers_opinions?.length || 0,
      customSummaryLength: speakerData.custom_summary?.length || 0,
      summaryStatus: speakerData.summary_status,
    });

    result.speaker_summary_data = {
      speakers_opinions: speakerData.speakers_opinions || [],
      custom_summary: speakerData.custom_summary || '',
      orig_custom_summary: speakerData.orig_custom_summary || '',
      summary_status: speakerData.summary_status || 0,
      lang: speakerData.lang || '',
      model_status: speakerData.model_status || 0,
    };
    console.log('[Extractor] ✅ 提取发言人观点数据:', {
      speakersCount: result.speaker_summary_data.speakers_opinions.length,
      customSummaryLength: result.speaker_summary_data.custom_summary.length,
      status: result.speaker_summary_data.summary_status,
    });
  } else {
    console.log('[Extractor] ⚠️ 未找到发言人观点数据', {
      hasResponse: !!responses.speakerSummary,
      hasData: !!responses.speakerSummary?.data,
      hasSpeakerSummary: !!responses.speakerSummary?.data?.speaker_summary,
    });
  }

  // 提取待办事项数据 (仅 summary_type=4)
  if (responses.speakerSummary?.data?.todo) {
    const todoData = responses.speakerSummary.data.todo;
    console.log('[Extractor] 🔍 原始待办事项数据:', {
      hasTodoList: !!todoData.todo_list,
      todoListIsArray: Array.isArray(todoData.todo_list),
      todoListCount: todoData.todo_list?.length || 0,
      todoStatus: todoData.todo_status,
      todoListRaw: todoData.todo_list,
    });

    if (todoData.todo_status === 2) {
      result.todo_items =
        todoData.todo_list
          ?.filter(
            (item) => item.todo_id && item.todo_name // 确保必需字段存在
          )
          .map((item) => ({
            todo_id: item.todo_id!,
            todo_name: item.todo_name!,
            todo_time: item.todo_time || '',
            background: item.background || '',
            persons: item.persons || [],
            engine_type: item.engine_type || 0,
            sort_by: item.sort_by || 0,
          })) || [];
      console.log('[Extractor] ✅ 提取待办事项数据:', {
        todoCount: result.todo_items.length,
        todoStatus: todoData.todo_status,
      });
    } else {
      console.log('[Extractor] ⚠️ 待办事项状态不是成功状态:', {
        todoStatus: todoData.todo_status,
        expected: 2,
      });
    }
  } else {
    console.log('[Extractor] ⚠️ 未找到待办事项数据', {
      hasResponse: !!responses.speakerSummary,
      hasData: !!responses.speakerSummary?.data,
      hasTodo: !!responses.speakerSummary?.data?.todo,
    });
  }

  // 为了向后兼容，将旧的 todo_list 也提取出来
  if (responses.speakerSummary?.data?.todo_list) {
    result.todo_list = responses.speakerSummary.data.todo_list
      .map(convertTodoItem)
      .filter(Boolean) as TodoItem[];
    console.log('[Extractor] ✅ 提取待办事项数据 (旧格式):', {
      todoCount: result.todo_list.length,
    });
  }

  // 提取 DeepSeek 纪要数据
  console.log('[Extractor] 🔍 检查 DeepSeek 纪要数据:', {
    hasTopicSummary: !!responses.topicSummary,
    hasTopicSummaryData: !!responses.topicSummary?.data,
    hasDeepSeekSummary: !!responses.topicSummary?.data?.deepseek_summary,
    hasDeepSeekR1Summary: !!responses.topicSummary?.data?.ds_r1_summary,
  });

  // DeepSeek 数据结构：
  // {
  //   deepseek_summary: {
  //     data_type: 1,
  //     summary_status: 2,  ← 状态在外层
  //     topic_summary: { ... },  ← 内容在这里
  //     lang: "default",
  //     ...
  //   }
  // }
  let deepseekWrapper = null;
  let sourceFieldName = '';

  if (responses.topicSummary?.data?.ds_r1_summary) {
    deepseekWrapper = responses.topicSummary.data.ds_r1_summary as any;
    sourceFieldName = 'ds_r1_summary';
  } else if (responses.topicSummary?.data?.deepseek_summary) {
    deepseekWrapper = responses.topicSummary.data.deepseek_summary as any;
    sourceFieldName = 'deepseek_summary';
  }

  if (deepseekWrapper) {
    // 内容在 topic_summary 下，状态在外层
    const deepseekContent = deepseekWrapper.topic_summary || deepseekWrapper;

    console.log(
      `[Extractor] 🔍 原始 DeepSeek 纪要数据（来源：${sourceFieldName}）:`,
      {
        subPointsCount: deepseekContent.sub_points?.length || 0,
        summaryStatusOuter: deepseekWrapper.summary_status, // 外层状态
        summaryStatusInner: deepseekContent.summary_status, // 内层状态（可能不存在）
        hasBeginSummary: !!deepseekContent.begin_summary,
        hasEndSummary: !!deepseekContent.end_summary,
        hasCustomSummary: !!deepseekWrapper.custom_summary,
        hasOrigCustomSummary: !!deepseekWrapper.orig_custom_summary,
      }
    );

    result.deepseek_summary_data = {
      begin_summary: deepseekContent.begin_summary || '',
      sub_points: (deepseekContent.sub_points || []).map((point: any) => ({
        sub_point_title: point.sub_point_title,
        sub_point_vec_items: point.sub_point_vec_items || [],
      })),
      end_summary: deepseekContent.end_summary || '',
      custom_summary: deepseekWrapper.custom_summary || '', // 从外层获取
      orig_custom_summary: deepseekWrapper.orig_custom_summary || '', // 从外层获取
      summary_status: deepseekWrapper.summary_status || 0, // 从外层获取
      lang: deepseekWrapper.lang || '',
      model_status: deepseekWrapper.model_status || 0,
    };

    console.log('[Extractor] ✅ DeepSeek 纪要提取完成:', {
      pointsCount: result.deepseek_summary_data.sub_points.length,
      status: result.deepseek_summary_data.summary_status,
      hasCustomSummary: !!result.deepseek_summary_data.custom_summary,
    });
  } else {
    console.log('[Extractor] ⚠️ 未找到 DeepSeek 纪要数据');
  }

  // 提取模板纪要数据
  if (responses.topicSummary?.data?.template_summary) {
    const templateData = responses.topicSummary.data.template_summary;
    console.log('[Extractor] 🔍 提取模板纪要数据');

    result.template_summary_data = {
      begin_summary: templateData.begin_summary || '',
      sub_points: templateData.sub_points || [],
      end_summary: templateData.end_summary || '',
      custom_summary: templateData.custom_summary || '',
      orig_custom_summary: templateData.orig_custom_summary || '',
      summary_status: templateData.summary_status || 0,
      lang: templateData.lang || '',
      model_status: templateData.model_status || 0,
    };

    console.log('[Extractor] ✅ 模板纪要提取完成:', {
      pointsCount: result.template_summary_data.sub_points.length,
      status: result.template_summary_data.summary_status,
    });
  }

  // 提取混元纪要偏好数据（字段名是 summary_preferences，不是 hunyuan）
  if (responses.topicSummary?.data?.summary_preferences) {
    const preferencesData = responses.topicSummary.data.summary_preferences;
    console.log('[Extractor] 🔍 提取纪要偏好数据（混元模型）');

    result.summary_preferences = {
      begin_summary: preferencesData.begin_summary || '',
      sub_points: (preferencesData.sub_points || []).map((point) => ({
        sub_point_title: point.sub_point_title,
        sub_point_vec_items: point.sub_point_vec_items || [],
      })),
      end_summary: preferencesData.end_summary || '',
      custom_summary: preferencesData.custom_summary || '',
      orig_custom_summary: preferencesData.orig_custom_summary || '',
      summary_status: preferencesData.summary_status || 0,
      lang: preferencesData.lang || '',
      model_status: preferencesData.model_status || 0,
    };

    console.log('[Extractor] ✅ 纪要偏好提取完成:', {
      pointsCount: result.summary_preferences?.sub_points.length || 0,
      status: result.summary_preferences?.summary_status || 0,
    });
  }

  // 提取 DSV3 纪要数据
  if (responses.topicSummary?.data?.dsv3_summary) {
    const dsv3Data = responses.topicSummary.data.dsv3_summary;
    console.log('[Extractor] 🔍 提取 DSV3 纪要数据');

    result.dsv3_summary_data = {
      begin_summary: dsv3Data.begin_summary || '',
      sub_points: dsv3Data.sub_points || [],
      end_summary: dsv3Data.end_summary || '',
      custom_summary: dsv3Data.custom_summary || '',
      orig_custom_summary: dsv3Data.orig_custom_summary || '',
      summary_status: dsv3Data.summary_status || 0,
      lang: dsv3Data.lang || '',
      model_status: dsv3Data.model_status || 0,
    };

    console.log('[Extractor] ✅ DSV3 纪要提取完成:', {
      pointsCount: result.dsv3_summary_data.sub_points.length,
      status: result.dsv3_summary_data.summary_status,
    });
  }

  // 提取 QW 纪要数据
  if (responses.topicSummary?.data?.qw_summary) {
    const qwData = responses.topicSummary.data.qw_summary;
    console.log('[Extractor] 🔍 提取 QW 纪要数据');

    result.qw_summary_data = {
      begin_summary: qwData.begin_summary || '',
      sub_points: qwData.sub_points || [],
      end_summary: qwData.end_summary || '',
      custom_summary: qwData.custom_summary || '',
      orig_custom_summary: qwData.orig_custom_summary || '',
      summary_status: qwData.summary_status || 0,
      lang: qwData.lang || '',
      model_status: qwData.model_status || 0,
    };

    console.log('[Extractor] ✅ QW 纪要提取完成:', {
      pointsCount: result.qw_summary_data.sub_points.length,
      status: result.qw_summary_data.summary_status,
    });
  }

  // 提取元宝纪要数据
  if (responses.topicSummary?.data?.yuanbao_summary) {
    const yuanbaoData = responses.topicSummary.data.yuanbao_summary;
    console.log('[Extractor] 🔍 提取元宝纪要数据');

    result.yuanbao_summary_data = {
      begin_summary: yuanbaoData.begin_summary || '',
      sub_points: yuanbaoData.sub_points || [],
      end_summary: yuanbaoData.end_summary || '',
      custom_summary: yuanbaoData.custom_summary || '',
      orig_custom_summary: yuanbaoData.orig_custom_summary || '',
      summary_status: yuanbaoData.summary_status || 0,
      lang: yuanbaoData.lang || '',
      model_status: yuanbaoData.model_status || 0,
    };

    console.log('[Extractor] ✅ 元宝纪要提取完成:', {
      pointsCount: result.yuanbao_summary_data.sub_points.length,
      status: result.yuanbao_summary_data.summary_status,
    });
  }

  return result;
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

// ==================== UI 展示数据提取函数 ====================

/**
 * 从 get-smart-topic API 响应中提取智能话题（用于 UI 展示）
 * @param response - get-smart-topic API 响应
 * @returns 智能话题列表，按占比从高到低排序
 */
export function extractTopicInfos(
  response: GetSmartTopicResponse
): TopicInfo[] {
  if (!isGetSmartTopicResponse(response) || !response.data?.topic_infos) {
    console.warn('[Extractor] 无效的 get-smart-topic 响应或缺少 topic_infos');
    return [];
  }

  const topics = response.data.topic_infos
    .map((topic) => {
      const startTime = parseNumber(topic.start_time);
      const endTime = parseNumber(topic.end_time);

      // 验证必需字段
      if (!topic.topic_id || !topic.topic_name || !startTime || !endTime) {
        console.warn('[Extractor] 话题数据缺少必需字段，已跳过:', topic);
        return null;
      }

      // 计算时长
      const duration = endTime - startTime;
      if (duration < 0) {
        console.warn('[Extractor] 话题时长为负数，已跳过:', {
          topic_id: topic.topic_id,
          startTime,
          endTime,
          duration,
        });
        return null;
      }

      return {
        id: topic.topic_id,
        name: topic.topic_name,
        duration,
        percentage: topic.percentage || 0,
        startTime,
        endTime,
      };
    })
    .filter((topic): topic is TopicInfo => topic !== null);

  // 按占比从高到低排序
  topics.sort((a, b) => b.percentage - a.percentage);

  console.log('[Extractor] 提取智能话题数据:', {
    count: topics.length,
    topics: topics.map((t) => ({ name: t.name, percentage: t.percentage })),
  });

  return topics;
}

/**
 * 从 get-time-line API 响应中提取参会人员发言时长（用于 UI 展示）
 * @param response - get-time-line API 响应
 * @returns 参会人员发言统计列表，按发言时长从高到低排序
 */
export function extractParticipantSpeakingTimes(
  response: GetTimeLineResponse
): ParticipantSpeakingTime[] {
  if (!isGetTimeLineResponse(response) || !response.data?.timelines) {
    console.warn('[Extractor] 无效的 get-time-line 响应或缺少 timelines');
    return [];
  }

  // 第一步：提取基本数据并计算总时长
  const rawData: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    totalTime: number;
  }> = [];
  let totalTime = 0;

  for (const p of response.data.timelines) {
    const time = parseNumber(p.total_time);

    // 验证必需字段
    if (!p.user_id || !p.user_name || time === undefined || time < 0) {
      console.warn('[Extractor] 参会人员数据缺少必需字段，已跳过:', p);
      continue;
    }

    rawData.push({
      id: p.user_id,
      name: p.user_name,
      avatarUrl: p.avatar_url,
      totalTime: time,
    });
    totalTime += time;
  }

  // 第二步：计算占比
  const result: ParticipantSpeakingTime[] = rawData.map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    totalTime: p.totalTime,
    percentage: totalTime > 0 ? (p.totalTime / totalTime) * 100 : 0,
  }));

  // 第三步：按发言时长从高到低排序
  result.sort((a, b) => b.totalTime - a.totalTime);

  console.log('[Extractor] 提取参会人员发言时长:', {
    count: result.length,
    totalTime,
  });

  return result;
}

/**
 * 从 get-chapter API 响应中提取会议章节（用于 UI 展示，增强版）
 * @param response - get-chapter API 响应
 * @param meetingDuration - 会议总时长（毫秒）
 * @returns 会议章节列表，按开始时间排序
 */
export function extractChapterInfos(
  response: GetChapterResponse,
  meetingDuration: number
): ChapterInfo[] {
  if (!isGetChapterResponse(response) || !response.data?.chapter_list) {
    console.warn('[Extractor] 无效的 get-chapter 响应或缺少 chapter_list');
    return [];
  }

  // 第一步：提取基本数据并验证
  const rawChapters: Array<{
    id: string;
    title: string;
    startTime: number;
    summary?: string;
  }> = [];

  for (const ch of response.data.chapter_list) {
    // 验证必需字段
    if (
      !ch.chapter_id ||
      !ch.title ||
      ch.start_time === undefined ||
      ch.start_time < 0
    ) {
      console.warn('[Extractor] 章节数据缺少必需字段或时间异常，已跳过:', ch);
      continue;
    }

    rawChapters.push({
      id: ch.chapter_id,
      title: ch.title,
      startTime: ch.start_time,
      summary: ch.summary,
    });
  }

  // 第二步：按开始时间排序
  rawChapters.sort((a, b) => a.startTime - b.startTime);

  // 第三步：计算时长、结束时间和占比
  const result: ChapterInfo[] = rawChapters.map((ch, index) => {
    const endTime =
      index < rawChapters.length - 1
        ? rawChapters[index + 1].startTime
        : meetingDuration;
    const duration = Math.max(0, endTime - ch.startTime); // 确保时长非负
    const percentage =
      meetingDuration > 0 ? (duration / meetingDuration) * 100 : 0;

    return {
      id: ch.id,
      title: ch.title,
      startTime: ch.startTime,
      endTime,
      duration,
      percentage,
      summary: ch.summary,
      coverUrl: undefined, // get-chapter API 不返回 cover_url
    };
  });

  console.log('[Extractor] 提取会议章节:', {
    count: result.length,
    meetingDuration,
  });

  return result;
}

/**
 * 从会议数据中提取统计信息（汇总三类数据）
 * @param meetingData - 完整会议数据
 * @returns 会议统计数据
 */
export function extractMeetingStatistics(
  meetingData: MeetingData
): MeetingStatistics {
  const statistics: MeetingStatistics = {
    topics: [],
    participants: [],
    chapters: [],
  };

  // 从 smart_topics 提取（如果存在原始响应，应该使用 extractTopicInfos）
  // 这里假设 smart_topics 已经在 meetingData 中存在
  if (meetingData.smart_topics && meetingData.smart_topics.length > 0) {
    statistics.topics = meetingData.smart_topics
      .map((topic) => {
        const startTime = parseNumber(topic.start_time);
        const endTime = parseNumber(topic.end_time);

        if (!startTime || !endTime) return null;

        return {
          id: topic.topic_id,
          name: topic.topic_name,
          duration: endTime - startTime,
          percentage: topic.percentage || 0,
          startTime,
          endTime,
        };
      })
      .filter((t): t is TopicInfo => t !== null)
      .sort((a, b) => b.percentage - a.percentage);
  }

  // 从 chapter_details 提取章节信息
  if (meetingData.chapter_details && meetingData.chapter_details.length > 0) {
    const meetingDuration = meetingData.metadata?.duration || 0;
    statistics.chapters = meetingData.chapter_details
      .map((ch) => ({
        id: ch.chapter_id,
        title: ch.title,
        startTime: ch.start_time,
        coverUrl: undefined, // chapter_details 没有 cover_url
        summary: ch.summary,
        duration: 0,
        percentage: 0,
        endTime: 0,
      }))
      .sort((a, b) => a.startTime - b.startTime)
      .map((ch, index, arr) => {
        const endTime =
          index < arr.length - 1 ? arr[index + 1].startTime : meetingDuration;
        const duration = endTime - ch.startTime;
        const percentage =
          meetingDuration > 0 ? (duration / meetingDuration) * 100 : 0;

        return {
          ...ch,
          endTime,
          duration,
          percentage,
        };
      });
  }

  console.log('[Extractor] 提取会议统计数据:', {
    topicsCount: statistics.topics.length,
    participantsCount: statistics.participants.length,
    chaptersCount: statistics.chapters.length,
  });

  return statistics;
}
