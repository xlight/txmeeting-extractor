/**
 * API 响应处理
 * 拦截并缓存API响应，提取会议数据
 */

import {
  MeetingData,
  MessageType,
  STORAGE_KEYS,
  MinutesDetailResponse,
  CommonRecordInfoResponse,
  GetFullSummaryResponse,
  GetChapterResponse,
  GetTimeLineResponse,
  GetMulSummaryAndTodoResponse,
  GetSmartTopicResponse,
  GetMultiRecordFileResponse,
  QuerySummaryAndNoteResponse,
  QueryTimelineResponse,
} from '../types/meeting';
import {
  extractMeetingData,
  extractTopicInfos,
  extractParticipantSpeakingTimes,
  extractChapterInfos,
} from '../utils/extractor';
import { identifyAPIType } from './api-types';
import {
  currentMeetingContext,
  updateMeetingContext,
} from './meeting-context';
import {
  extractMeetingIdsFromURL,
  extractMeetingIdsFromRequestBody,
  extractMeetingIdsFromResponseBody,
} from './id-extraction';

// 临时缓存：存储同一会议的多个API响应
export const apiResponseCache: Map<
  string,
  {
    minutesDetail?: MinutesDetailResponse;
    commonRecordInfo?: CommonRecordInfoResponse;
    fullSummary?: GetFullSummaryResponse;
    chapter?: GetChapterResponse;
    timeLine?: GetTimeLineResponse;
    // 支持多个 summary_type 的 get-mul-summary-and-todo 响应
    mulSummaryAndTodo?: {
      topicSummary?: GetMulSummaryAndTodoResponse; // summary_type=8
      chapterSummary?: GetMulSummaryAndTodoResponse; // summary_type=1
      speakerSummary?: GetMulSummaryAndTodoResponse; // summary_type=4
    };
    smartTopic?: GetSmartTopicResponse;
    multiRecordFile?: GetMultiRecordFileResponse;
    // 新版页面 API
    querySummaryAndNote?: QuerySummaryAndNoteResponse; // query-summary-and-note API
    queryTimeline?: QueryTimelineResponse; // query-timeline API
    timestamp: number;
  }
> = new Map();

/**
 * 处理拦截的API响应
 */
export async function handleAPIResponse(payload: {
  url: string;
  data: unknown;
  method?: string;
  requestBody?: any;
}): Promise<void> {
  console.log('[TXMeeting Background] 🔍 处理API响应:', payload.url);
  console.log('[TXMeeting Background] 📦 响应数据:', payload.data);
  console.log('[TXMeeting Background] 📝 请求方法:', payload.method);
  console.log('[TXMeeting Background] 📝 请求体:', payload.requestBody);

  // 特别处理新的query API
  if (
    payload.url.includes('query-summary-and-note') ||
    payload.url.includes('query-timeline')
  ) {
    console.log('[TXMeeting Background] 🆕 检测到新API格式:', payload.url);
  }

  try {
    // 识别API类型
    const apiType = identifyAPIType(payload.url);
    if (!apiType) {
      console.warn('[TXMeeting Background] ⚠️ 未知的API类型:', payload.url);
      return;
    }

    console.log('[TXMeeting Background] 📋 识别到 API 类型:', apiType);

    // 尝试从URL提取会议标识
    const urlMeetingIds = extractMeetingIdsFromURL(payload.url);

    // 尝试从请求体中提取会议标识（统计类API的ID在请求体中）
    const requestBodyMeetingIds = extractMeetingIdsFromRequestBody(
      apiType,
      payload.requestBody
    );

    // 尝试从响应体中提取会议标识（某些API的ID在响应体中）
    const responseBodyMeetingIds = extractMeetingIdsFromResponseBody(
      apiType,
      payload.data
    );

    // 合并URL、请求体和响应体中的会议标识
    // 优先级：请求体 > 响应体 > URL参数（因为统计API的ID在请求体中最准确）
    const extractedIds = {
      meetingId:
        requestBodyMeetingIds.meetingId ||
        responseBodyMeetingIds.meetingId ||
        urlMeetingIds.meetingId,
      recordingId:
        requestBodyMeetingIds.recordingId ||
        responseBodyMeetingIds.recordingId ||
        urlMeetingIds.recordingId,
      shareId: requestBodyMeetingIds.shareId || urlMeetingIds.shareId,
    };

    // 更新全局会议上下文（如果有新信息）
    updateMeetingContext(extractedIds);

    // 构建缓存键（优先使用组合键）
    let meetingKey: string | undefined;
    if (currentMeetingContext.meetingId && currentMeetingContext.recordingId) {
      meetingKey = `${currentMeetingContext.meetingId}_${currentMeetingContext.recordingId}`;
    } else if (currentMeetingContext.recordingId) {
      meetingKey = currentMeetingContext.recordingId;
    } else if (currentMeetingContext.meetingId) {
      meetingKey = currentMeetingContext.meetingId;
    }

    if (!meetingKey) {
      console.warn(
        '[TXMeeting Background] ⚠️ 无法确定会议标识，暂存API响应等待后续匹配'
      );
      console.warn('[TXMeeting Background] 当前上下文:', currentMeetingContext);
      console.warn('[TXMeeting Background] URL参数:', urlMeetingIds);
      console.warn('[TXMeeting Background] 请求体参数:', requestBodyMeetingIds);
      console.warn(
        '[TXMeeting Background] 响应体参数:',
        responseBodyMeetingIds
      );
      // 暂存这个响应，等待其他API提供会议标识
      // TODO: 实现暂存机制
      return;
    }

    // 保存缓存键到上下文
    currentMeetingContext.cacheKey = meetingKey;

    console.log('[TXMeeting Background] 🔑 使用会议标识:', meetingKey);
    console.log('[TXMeeting Background] 📌 当前上下文:', {
      meetingId: currentMeetingContext.meetingId,
      recordingId: currentMeetingContext.recordingId,
      shareId: currentMeetingContext.shareId,
      cacheKey: currentMeetingContext.cacheKey,
    });

    // 获取或创建临时缓存
    let cache = apiResponseCache.get(meetingKey);
    if (!cache) {
      cache = { timestamp: Date.now() };
      apiResponseCache.set(meetingKey, cache);
      console.log('[TXMeeting Background] 🆕 创建新缓存');
    } else {
      console.log('[TXMeeting Background] 📦 使用现有缓存');
    }

    // 根据API类型存储响应
    if (apiType === 'minutes/detail') {
      const newResponse = payload.data as MinutesDetailResponse;

      // 🔍 强制输出 API 响应进行调试
      console.log(
        '[DEBUG] minutes/detail API 响应完整数据:',
        JSON.stringify(newResponse, null, 2)
      );

      // 如果关键词为空，提醒用户可能需要等待关键词生成
      if (
        !newResponse.minutes?.keywords ||
        newResponse.minutes.keywords.length === 0
      ) {
        console.log('[DEBUG] ⚠️ 关键词为空，可能需要等待 AI 生成关键词');
        console.log('[DEBUG] 建议等待几分钟后刷新页面，让系统有时间生成关键词');
      }

      // 检查是否已有数据（分页合并）
      if (
        cache.minutesDetail &&
        cache.minutesDetail.minutes &&
        newResponse.minutes
      ) {
        console.log('[TXMeeting Background] 🔄 合并分页数据...');

        // 合并段落数据
        const existingParagraphs = cache.minutesDetail.minutes.paragraphs || [];
        const newParagraphs = newResponse.minutes.paragraphs || [];

        cache.minutesDetail.minutes.paragraphs = [
          ...existingParagraphs,
          ...newParagraphs,
        ];

        // 更新其他字段（使用最新的值）
        cache.minutesDetail.minutes.keywords =
          newResponse.minutes.keywords || cache.minutesDetail.minutes.keywords;

        console.log('[DEBUG] 合并后的 keywords:', {
          keywords: cache.minutesDetail.minutes.keywords,
          length: cache.minutesDetail.minutes.keywords?.length,
        });

        cache.minutesDetail.minutes.chapters =
          newResponse.minutes.chapters || cache.minutesDetail.minutes.chapters;
        cache.minutesDetail.minutes.summary =
          newResponse.minutes.summary || cache.minutesDetail.minutes.summary;
        cache.minutesDetail.minutes.action_items =
          newResponse.minutes.action_items ||
          cache.minutesDetail.minutes.action_items;

        // 更新 more 标志
        cache.minutesDetail.more = newResponse.more;

        console.log(
          '[TXMeeting Background] 📊 合并后段落数:',
          cache.minutesDetail.minutes.paragraphs.length
        );
        console.log(
          '[TXMeeting Background] 📄 还有更多数据:',
          cache.minutesDetail.more
        );
      } else {
        // 第一次接收数据
        cache.minutesDetail = newResponse;
        console.log(
          '[TXMeeting Background] ✅ 已存储 minutes/detail 响应（首次）'
        );
        console.log(
          '[TXMeeting Background] 📄 还有更多数据:',
          newResponse.more
        );

        // 🔍 调试：检查原始 API 响应中的 keywords
        console.log('[DEBUG] API 响应中的 keywords:', {
          rawKeywords: newResponse.minutes?.keywords,
          type: typeof newResponse.minutes?.keywords,
          isArray: Array.isArray(newResponse.minutes?.keywords),
          length: newResponse.minutes?.keywords?.length,
        });
      }
    } else if (apiType === 'common-record-info') {
      cache.commonRecordInfo = payload.data as CommonRecordInfoResponse;
      console.log('[TXMeeting Background] ✅ 已存储 common-record-info 响应');
    } else if (apiType === 'get-full-summary') {
      cache.fullSummary = payload.data as GetFullSummaryResponse;
      console.log('[TXMeeting Background] ✅ 已存储 get-full-summary 响应');
    } else if (apiType === 'get-chapter') {
      cache.chapter = payload.data as GetChapterResponse;
      console.log('[TXMeeting Background] ✅ 已存储 get-chapter 响应');
    } else if (apiType === 'get-time-line') {
      cache.timeLine = payload.data as GetTimeLineResponse;
      console.log('[TXMeeting Background] ✅ 已存储 get-time-line 响应');
    } else if (apiType === 'get-mul-summary-and-todo') {
      // 从请求体中提取 summary_type
      const summaryType = payload.requestBody?.summary_type;
      const response = payload.data as GetMulSummaryAndTodoResponse;

      // 🔍 增强调试日志
      console.log(
        '[TXMeeting Background] 🔍 收到 get-mul-summary-and-todo 响应:'
      );
      console.log('  📝 请求方法:', payload.method);
      console.log('  📦 请求体原始数据:', payload.requestBody);
      console.log('  🏷️ summary_type 值:', summaryType);
      console.log('  📊 响应数据概览:', {
        hasData: !!response.data,
        hasTopicSummary: !!response.data?.topic_summary,
        hasChapterSummary: !!response.data?.chapter_summary,
        hasSpeakerSummary: !!response.data?.speaker_summary,
        hasTodo: !!response.data?.todo,
        topicSubPointsCount:
          response.data?.topic_summary?.sub_points?.length || 0,
        chapterSummaryCount:
          response.data?.chapter_summary?.summary_list?.length || 0,
        speakerOpinionsCount:
          response.data?.speaker_summary?.speakers_opinions?.length || 0,
        todoCount: response.data?.todo?.todo_list?.length || 0,
      });

      // 如果有 topic_summary 数据，详细打印
      if (response.data?.topic_summary) {
        console.log('  ✨ 主题纪要详情:');
        console.log('    - 状态:', response.data.topic_summary.summary_status);
        console.log(
          '    - 开场总结:',
          response.data.topic_summary.begin_summary?.substring(0, 50)
        );
        console.log(
          '    - 结束总结:',
          response.data.topic_summary.end_summary?.substring(0, 50)
        );
        console.log('    - 要点列表:', response.data.topic_summary.sub_points);
      }

      // 初始化 mulSummaryAndTodo 对象（如果不存在）
      if (!cache.mulSummaryAndTodo) {
        cache.mulSummaryAndTodo = {};
      }

      // 根据 summary_type 存储到对应的字段
      if (summaryType === 0) {
        // summary_type=0: 返回全部数据，需要分别存储到三个位置
        console.log(
          '[TXMeeting Background] 📦 summary_type=0 检测到，返回全部纪要数据'
        );
        console.log(
          '  📊 响应数据的所有键名:',
          Object.keys(response.data || {})
        );
        console.log('  📊 响应中包含的数据字段:');
        console.log('    - topic_summary:', !!response.data?.topic_summary);
        console.log('    - chapter_summary:', !!response.data?.chapter_summary);
        console.log('    - speaker_summary:', !!response.data?.speaker_summary);
        console.log('    - todo:', !!response.data?.todo);
        console.log(
          '    - deepseek_summary:',
          !!response.data?.deepseek_summary
        );
        console.log(
          '    - template_summary:',
          !!response.data?.template_summary
        );
        console.log(
          '    - summary_preferences:',
          !!response.data?.summary_preferences
        );
        console.log('    - dsv3_summary:', !!response.data?.dsv3_summary);
        console.log('    - qw_summary:', !!response.data?.qw_summary);
        console.log('    - yuanbao_summary:', !!response.data?.yuanbao_summary);

        // 存储主题纪要及所有AI模型纪要（如果存在）
        if (
          response.data?.topic_summary ||
          response.data?.deepseek_summary ||
          response.data?.template_summary ||
          response.data?.summary_preferences ||
          response.data?.dsv3_summary ||
          response.data?.qw_summary ||
          response.data?.yuanbao_summary
        ) {
          cache.mulSummaryAndTodo.topicSummary = response;
          console.log('  ✅ 已存储主题纪要及AI模型纪要 (topicSummary slot)');
        }

        // 存储分章节纪要（如果存在）
        if (response.data?.chapter_summary) {
          cache.mulSummaryAndTodo.chapterSummary = response;
          console.log('  ✅ 已存储分章节纪要 (chapterSummary slot)');
        }

        // 存储发言人观点和待办（如果存在）
        if (response.data?.speaker_summary || response.data?.todo) {
          cache.mulSummaryAndTodo.speakerSummary = response;
          console.log('  ✅ 已存储发言人观点+待办 (speakerSummary slot)');
        }

        console.log(
          '[TXMeeting Background] ✅ 已存储 get-mul-summary-and-todo 响应 (全部纪要, summary_type=0)'
        );
      } else if (summaryType === 8) {
        cache.mulSummaryAndTodo.topicSummary = response;
        console.log(
          '[TXMeeting Background] ✅ 已存储 get-mul-summary-and-todo 响应 (主题纪要+AI模型, summary_type=8)'
        );
        console.log(
          '  📊 响应数据的所有键名:',
          Object.keys(response.data || {})
        );
        console.log('  📊 AI模型纪要字段状态:');
        console.log('    - topic_summary:', !!response.data?.topic_summary);
        console.log(
          '    - deepseek_summary:',
          !!response.data?.deepseek_summary
        );
        console.log(
          '    - template_summary:',
          !!response.data?.template_summary
        );
        console.log(
          '    - summary_preferences:',
          !!response.data?.summary_preferences
        );
        console.log('    - dsv3_summary:', !!response.data?.dsv3_summary);
        console.log('    - qw_summary:', !!response.data?.qw_summary);
        console.log('    - yuanbao_summary:', !!response.data?.yuanbao_summary);
      } else if (summaryType === 1) {
        cache.mulSummaryAndTodo.chapterSummary = response;
        console.log(
          '[TXMeeting Background] ✅ 已存储 get-mul-summary-and-todo 响应 (分章节纪要, summary_type=1)'
        );
      } else if (summaryType === 4) {
        cache.mulSummaryAndTodo.speakerSummary = response;
        console.log(
          '[TXMeeting Background] ✅ 已存储 get-mul-summary-and-todo 响应 (发言人观点+待办, summary_type=4)'
        );
      } else {
        console.warn(
          '[TXMeeting Background] ⚠️ 未知的 summary_type:',
          summaryType
        );
        console.warn('  请求体:', payload.requestBody);
        console.warn('  响应数据中包含的字段:');
        console.warn('    - topic_summary:', !!response.data?.topic_summary);
        console.warn(
          '    - chapter_summary:',
          !!response.data?.chapter_summary
        );
        console.warn(
          '    - speaker_summary:',
          !!response.data?.speaker_summary
        );
        // 根据响应数据中实际包含的字段来决定存储位置
        if (response.data?.topic_summary) {
          console.warn('  → 检测到 topic_summary，存储为主题纪要');
          cache.mulSummaryAndTodo.topicSummary = response;
        }
        if (response.data?.chapter_summary) {
          console.warn('  → 检测到 chapter_summary，存储为分章节纪要');
          cache.mulSummaryAndTodo.chapterSummary = response;
        }
        if (response.data?.speaker_summary || response.data?.todo) {
          console.warn('  → 检测到 speaker_summary/todo，存储为发言人观点');
          cache.mulSummaryAndTodo.speakerSummary = response;
        }
      }
    } else if (apiType === 'get-smart-topic') {
      cache.smartTopic = payload.data as GetSmartTopicResponse;
      console.log('[TXMeeting Background] ✅ 已存储 get-smart-topic 响应');
    } else if (apiType === 'get-multi-record-file') {
      cache.multiRecordFile = payload.data as GetMultiRecordFileResponse;
      console.log(
        '[TXMeeting Background] ✅ 已存储 get-multi-record-file 响应'
      );
    } else if (apiType === 'query-summary-and-note') {
      // 新的总结和笔记API，存储到独立字段
      cache.querySummaryAndNote = payload.data as QuerySummaryAndNoteResponse;
      console.log(
        '[TXMeeting Background] ✅ 已存储 query-summary-and-note 响应'
      );
    } else if (apiType === 'query-timeline') {
      // 新的时间线API，存储到独立字段
      cache.queryTimeline = payload.data as QueryTimelineResponse;
      console.log('[TXMeeting Background] ✅ 已存储 query-timeline 响应');
    }

    cache.timestamp = Date.now();

    // 显示当前缓存状态
    console.log('[TXMeeting Background] 📊 缓存状态:', {
      hasMinutesDetail: !!cache.minutesDetail,
      hasCommonRecordInfo: !!cache.commonRecordInfo,
      hasFullSummary: !!cache.fullSummary,
      hasChapter: !!cache.chapter,
      hasTimeLine: !!cache.timeLine,
      hasTopicSummary: !!cache.mulSummaryAndTodo?.topicSummary,
      hasChapterSummary: !!cache.mulSummaryAndTodo?.chapterSummary,
      hasSpeakerSummary: !!cache.mulSummaryAndTodo?.speakerSummary,
      hasSmartTopic: !!cache.smartTopic,
      hasMultiRecordFile: !!cache.multiRecordFile,
      hasQuerySummaryAndNote: !!cache.querySummaryAndNote,
      hasQueryTimeline: !!cache.queryTimeline,
      minutesDetailHasMore: cache.minutesDetail?.more,
    });

    // 检查是否应该提取数据（有足够的基础数据）
    const isMinutesDetailComplete =
      cache.minutesDetail && !cache.minutesDetail.more;
    const hasBasicData = isMinutesDetailComplete || cache.commonRecordInfo;

    if (!hasBasicData) {
      console.log(
        '[TXMeeting Background] ⏳ 等待基础数据（转写或录制信息）...'
      );
      return;
    }

    // 提取并保存数据
    console.log('[TXMeeting Background] 🔄 开始提取完整会议数据...');

    const meetingData = extractMeetingData({
      minutesDetail: cache.minutesDetail,
      commonRecordInfo: cache.commonRecordInfo,
      fullSummary: cache.fullSummary,
      chapter: cache.chapter,
      timeLine: cache.timeLine,
      mulSummaryAndTodo: cache.mulSummaryAndTodo,
      smartTopic: cache.smartTopic,
      multiRecordFile: cache.multiRecordFile,
      querySummaryAndNote: cache.querySummaryAndNote,
      queryTimeline: cache.queryTimeline,
    });

    if (!meetingData) {
      console.warn('[TXMeeting Background] ⚠️ 无法提取会议数据');
      console.warn('[TXMeeting Background] 调试信息:', {
        minutesDetailCode: (cache.minutesDetail as any)?.code,
        commonRecordInfoCode: (cache.commonRecordInfo as any)?.code,
        minutesDetailHasMinutes: !!(cache.minutesDetail as any)?.minutes,
        commonRecordInfoHasData: !!(cache.commonRecordInfo as any)?.data,
      });
      return;
    }

    // 从全局上下文补充会议标识
    if (currentMeetingContext.meetingId && !meetingData.metadata.meeting_id) {
      meetingData.metadata.meeting_id = currentMeetingContext.meetingId;
    }
    if (
      currentMeetingContext.recordingId &&
      !meetingData.metadata.recording_id
    ) {
      meetingData.metadata.recording_id = currentMeetingContext.recordingId;
    }

    console.log(
      '[TXMeeting Background] ✅ 会议数据提取成功:',
      meetingData.metadata
    );
    console.log('[TXMeeting Background] 🔍 提取的 keywords:', {
      keywords: meetingData.keywords,
      type: typeof meetingData.keywords,
      isArray: Array.isArray(meetingData.keywords),
      length: meetingData.keywords?.length,
    });
    console.log(
      '[TXMeeting Background] 🔍 提取的数据包含 DeepSeek 纪要?',
      !!meetingData.deepseek_summary_data
    );
    if (meetingData.deepseek_summary_data) {
      console.log('[TXMeeting Background] 🔍 DeepSeek 纪要详情:', {
        status: meetingData.deepseek_summary_data.summary_status,
        pointsCount: meetingData.deepseek_summary_data.sub_points?.length || 0,
      });
    }

    // 提取统计数据（智能话题、参会人员、章节）
    console.log('[TXMeeting Background] 🔄 开始提取统计数据...');

    const statistics = {
      topics: [] as any[],
      participants: [] as any[],
      chapters: [] as any[],
    };

    // 提取智能话题
    if (cache.smartTopic) {
      try {
        statistics.topics = extractTopicInfos(cache.smartTopic);
        console.log(
          '[TXMeeting Background] ✅ 智能话题提取完成:',
          statistics.topics.length
        );
      } catch (error) {
        console.error('[TXMeeting Background] ❌ 智能话题提取失败:', error);
      }
    }

    // 提取参会人员发言时长（仅使用旧版 get-time-line API）
    // 注意：query-timeline 是叙事性事件，不包含参会者发言统计
    if (cache.timeLine) {
      try {
        statistics.participants = extractParticipantSpeakingTimes(
          cache.timeLine
        );
        console.log(
          '[TXMeeting Background] ✅ 参会人员发言时长提取完成:',
          statistics.participants.length
        );
      } catch (error) {
        console.error(
          '[TXMeeting Background] ❌ 参会人员发言时长提取失败:',
          error
        );
      }
    }

    // 提取会议章节（优先使用已提取的 chapters，回退到旧 API）
    if (meetingData.chapters && meetingData.chapters.length > 0) {
      // 已有章节数据（来自 chapter_details、minutes 或 timeline_chapters）
      const meetingDuration = meetingData.metadata?.duration || 0;
      // 先按 start_time 排序，确保章节顺序正确
      const sortedChapters = [...meetingData.chapters].sort(
        (a, b) => a.start_time - b.start_time
      );
      statistics.chapters = sortedChapters
        .map((ch, index) => {
          // 当 end_time 无效时，用下一个章节的 start_time 或会议总时长计算
          const hasValidEndTime =
            ch.end_time !== undefined &&
            ch.end_time !== null &&
            !isNaN(ch.end_time) &&
            ch.end_time > 0;
          const endTime = hasValidEndTime
            ? ch.end_time
            : index < sortedChapters.length - 1
              ? sortedChapters[index + 1].start_time
              : meetingDuration;
          const duration = Math.max(0, endTime - ch.start_time);
          const percentage =
            meetingDuration > 0
              ? (duration / meetingDuration) * 100
              : 0;
          return {
            id: ch.id,
            title: ch.title,
            startTime: ch.start_time,
            coverUrl: undefined,
            summary: ch.summary,
            duration,
            percentage,
            endTime,
          };
        })
        .filter((ch) => ch.startTime >= 0);
      console.log(
        '[TXMeeting Background] ✅ 会议章节提取完成（来自已提取数据）:',
        statistics.chapters.length
      );
    } else if (cache.chapter && meetingData.metadata.duration) {
      try {
        statistics.chapters = extractChapterInfos(
          cache.chapter,
          meetingData.metadata.duration
        );
        console.log(
          '[TXMeeting Background] ✅ 会议章节提取完成（来自旧API）:',
          statistics.chapters.length
        );
      } catch (error) {
        console.error('[TXMeeting Background] ❌ 会议章节提取失败:', error);
      }
    }

    // 将统计数据添加到会议数据中
    meetingData.statistics = statistics;
    console.log('[TXMeeting Background] 📊 统计数据汇总:', {
      topics: statistics.topics.length,
      participants: statistics.participants.length,
      chapters: statistics.chapters.length,
    });

    // 使用全局上下文的缓存键（更可靠）
    const cacheKey = meetingKey;

    // 读取现有缓存
    const result = await chrome.storage.local.get(STORAGE_KEYS.MEETINGS);
    const cachedMeetings =
      (result[STORAGE_KEYS.MEETINGS] as Record<
        string,
        {
          data: MeetingData;
          timestamp: number;
        }
      >) || ({} as Record<string, { data: MeetingData; timestamp: number; }>);

    // 更新缓存
    cachedMeetings[cacheKey] = {
      data: meetingData,
      timestamp: Date.now(),
    };

    console.log('[TXMeeting Background] 🔍 准备保存到 storage 的 keywords:', {
      keywords: meetingData.keywords,
      type: typeof meetingData.keywords,
      isArray: Array.isArray(meetingData.keywords),
      length: meetingData.keywords?.length,
    });

    // 保存到storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.MEETINGS]: cachedMeetings,
      [STORAGE_KEYS.CURRENT_MEETING_ID]: cacheKey,
    });

    console.log('[TXMeeting Background] 💾 数据已保存到storage:', cacheKey);

    // 通知popup更新（如果打开）
    chrome.runtime
      .sendMessage({
        type: MessageType.MEETING_DATA_UPDATED,
        payload: meetingData,
      })
      .catch(() => {
        // Popup未打开时会失败，忽略错误
      });

    // 🔥 重要：不要删除内存缓存！保留它以便后续API可以追加数据
    // apiResponseCache.delete(meetingKey);  // ← 注释掉这一行
    console.log('[TXMeeting Background] 📌 保留内存缓存，等待更多API数据...');
  } catch (error) {
    console.error('[TXMeeting Background] 处理API响应失败:', error);
  }
}
