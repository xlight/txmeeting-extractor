/**
 * Background Service Worker
 * 拦截腾讯会议API响应并缓存数据
 */

import {
  MeetingData,
  MessageType,
  GetMeetingDataMessage,
  MeetingDataResponse,
  STORAGE_KEYS,
  MinutesDetailResponse,
  CommonRecordInfoResponse,
  // 新增 API 响应类型
  GetFullSummaryResponse,
  GetChapterResponse,
  GetTimeLineResponse,
  GetMulSummaryAndTodoResponse,
  GetSmartTopicResponse,
  GetCriticalNodeResponse,
  GetMultiRecordFileResponse,
} from '../types/meeting';
import { extractMeetingData } from '../utils/extractor';

// 腾讯会议API端点
const TENCENT_MEETING_API_PATTERNS = [
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/minutes/detail*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/common-record-info*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/summary*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/participants*',
];

// 全局会议上下文：跟踪当前正在查看的会议
let currentMeetingContext: {
  meetingId?: string;
  recordingId?: string;
  cacheKey?: string;
  lastActivityTime: number;
} = {
  lastActivityTime: Date.now(),
};

// 临时缓存：存储同一会议的多个API响应
const apiResponseCache: Map<
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
    criticalNode?: GetCriticalNodeResponse;
    multiRecordFile?: GetMultiRecordFileResponse;
    timestamp: number;
  }
> = new Map();

// 监听网络请求（使用 fetch 事件）
chrome.webRequest?.onCompleted.addListener(
  (details) => {
    if (details.statusCode === 200) {
      console.log('[TXMeeting] 检测到腾讯会议API请求:', details.url);
      // 由于webRequest在MV3中受限，我们改用更可靠的方法
    }
  },
  { urls: TENCENT_MEETING_API_PATTERNS }
);

/**
 * 拦截并缓存API响应
 * 注意：MV3中declarativeNetRequest无法直接读取响应体
 * 我们需要使用content script注入的方式来拦截fetch/XHR
 */

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(
    '[TXMeeting Background] 📨 收到消息:',
    message.type,
    'from:',
    sender.tab?.url
  );
  console.log('[TXMeeting Background] 消息详情:', message);

  switch (message.type) {
    case 'API_RESPONSE_INTERCEPTED':
      console.log('[TXMeeting Background] 🔄 开始处理 API 响应拦截');
      handleAPIResponse(message.payload)
        .then(() => {
          console.log('[TXMeeting Background] ✅ API 响应处理完成');
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('[TXMeeting Background] ❌ API 响应处理失败:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 保持消息通道开放

    case MessageType.GET_MEETING_DATA:
      getMeetingData(message as GetMeetingDataMessage)
        .then((response) => {
          sendResponse(response);
        })
        .catch((error) => {
          sendResponse({
            success: false,
            error: error.message,
          });
        });
      return true;

    case MessageType.CLEAR_CACHE:
      clearCache().then(() => {
        sendResponse({ success: true });
      });
      return true;

    default:
      console.warn('[TXMeeting Background] 未知消息类型:', message.type);
  }
});

/**
 * 处理拦截的API响应
 */
async function handleAPIResponse(payload: {
  url: string;
  data: unknown;
  method?: string;
  requestBody?: any;
}): Promise<void> {
  console.log('[TXMeeting Background] 🔍 处理API响应:', payload.url);
  console.log('[TXMeeting Background] 📦 响应数据:', payload.data);
  console.log('[TXMeeting Background] 📝 请求方法:', payload.method);
  console.log('[TXMeeting Background] 📝 请求体:', payload.requestBody);

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

    // 尝试从响应体中提取会议标识（某些API的ID在响应体中）
    const bodyMeetingIds = extractMeetingIdsFromResponseBody(
      apiType,
      payload.data
    );

    // 合并URL和响应体中的会议标识
    const extractedIds = {
      meetingId: urlMeetingIds.meetingId || bodyMeetingIds.meetingId,
      recordingId: urlMeetingIds.recordingId || bodyMeetingIds.recordingId,
    };

    // 更新全局会议上下文（如果有新信息）
    if (extractedIds.meetingId || extractedIds.recordingId) {
      const now = Date.now();
      // 如果超过5分钟没有活动，或者检测到新的会议ID，重置上下文
      const isNewSession =
        now - currentMeetingContext.lastActivityTime > 5 * 60 * 1000 ||
        (extractedIds.meetingId &&
          currentMeetingContext.meetingId &&
          extractedIds.meetingId !== currentMeetingContext.meetingId);

      if (isNewSession) {
        console.log('[TXMeeting Background] 🔄 检测到新会议会话');
        currentMeetingContext = {
          meetingId: extractedIds.meetingId,
          recordingId: extractedIds.recordingId,
          lastActivityTime: now,
        };
      } else {
        // 补充上下文中缺失的信息
        if (extractedIds.meetingId && !currentMeetingContext.meetingId) {
          currentMeetingContext.meetingId = extractedIds.meetingId;
          console.log(
            '[TXMeeting Background] 📝 从响应体补充 meeting_id:',
            extractedIds.meetingId
          );
        }
        if (extractedIds.recordingId && !currentMeetingContext.recordingId) {
          currentMeetingContext.recordingId = extractedIds.recordingId;
          console.log(
            '[TXMeeting Background] 📝 从响应体补充 recording_id:',
            extractedIds.recordingId
          );
        }
        currentMeetingContext.lastActivityTime = now;
      }
    }

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
      console.warn('[TXMeeting Background] 响应体参数:', bodyMeetingIds);
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

      console.log(
        '[TXMeeting Background] 🔍 收到 get-mul-summary-and-todo 响应:',
        {
          summaryType,
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
        }
      );

      // 初始化 mulSummaryAndTodo 对象（如果不存在）
      if (!cache.mulSummaryAndTodo) {
        cache.mulSummaryAndTodo = {};
      }

      // 根据 summary_type 存储到对应的字段
      if (summaryType === 8) {
        cache.mulSummaryAndTodo.topicSummary = response;
        console.log(
          '[TXMeeting Background] ✅ 已存储 get-mul-summary-and-todo 响应 (主题纪要, summary_type=8)'
        );
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
        // 作为备用,存储到 topicSummary
        cache.mulSummaryAndTodo.topicSummary = response;
      }
    } else if (apiType === 'get-smart-topic') {
      cache.smartTopic = payload.data as GetSmartTopicResponse;
      console.log('[TXMeeting Background] ✅ 已存储 get-smart-topic 响应');
    } else if (apiType === 'get-critical-node') {
      cache.criticalNode = payload.data as GetCriticalNodeResponse;
      console.log('[TXMeeting Background] ✅ 已存储 get-critical-node 响应');
    } else if (apiType === 'get-multi-record-file') {
      cache.multiRecordFile = payload.data as GetMultiRecordFileResponse;
      console.log(
        '[TXMeeting Background] ✅ 已存储 get-multi-record-file 响应'
      );
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
      hasCriticalNode: !!cache.criticalNode,
      hasMultiRecordFile: !!cache.multiRecordFile,
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
      criticalNode: cache.criticalNode,
      multiRecordFile: cache.multiRecordFile,
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
      >) || {};

    // 更新缓存
    cachedMeetings[cacheKey] = {
      data: meetingData,
      timestamp: Date.now(),
    };

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

/**
 * 识别API类型
 */
function identifyAPIType(
  url: string
):
  | 'minutes/detail'
  | 'common-record-info'
  | 'get-full-summary'
  | 'get-chapter'
  | 'get-time-line'
  | 'get-mul-summary-and-todo'
  | 'get-smart-topic'
  | 'get-critical-node'
  | 'get-multi-record-file'
  | null {
  if (url.includes('/minutes/detail')) {
    return 'minutes/detail';
  } else if (url.includes('/common-record-info')) {
    return 'common-record-info';
  } else if (url.includes('/get-full-summary')) {
    return 'get-full-summary';
  } else if (url.includes('/get-chapter')) {
    return 'get-chapter';
  } else if (url.includes('/get-time-line')) {
    return 'get-time-line';
  } else if (url.includes('/get-mul-summary-and-todo')) {
    return 'get-mul-summary-and-todo';
  } else if (url.includes('/get-smart-topic')) {
    return 'get-smart-topic';
  } else if (url.includes('/get-critical-node')) {
    return 'get-critical-node';
  } else if (url.includes('/get-multi-record-file')) {
    return 'get-multi-record-file';
  }
  return null;
}

/**
 * 从URL中提取会议标识
 */
function extractMeetingKeyFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // 尝试多种参数名称
    const recordingId =
      urlObj.searchParams.get('recording_id') ||
      urlObj.searchParams.get('recordingId') ||
      urlObj.searchParams.get('record_id'); // 新增 record_id
    const meetingId =
      urlObj.searchParams.get('meeting_id') ||
      urlObj.searchParams.get('meetingId');

    // 优先使用 recording_id，其次使用 meeting_id
    if (recordingId) {
      return recordingId;
    } else if (meetingId) {
      return meetingId;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 从URL中提取会议ID和录制ID
 */
function extractMeetingIdsFromURL(url: string): {
  meetingId?: string;
  recordingId?: string;
} {
  try {
    const urlObj = new URL(url);
    return {
      meetingId:
        urlObj.searchParams.get('meeting_id') ||
        urlObj.searchParams.get('meetingId') ||
        undefined,
      recordingId:
        urlObj.searchParams.get('recording_id') ||
        urlObj.searchParams.get('recordingId') ||
        urlObj.searchParams.get('record_id') || // 支持 record_id
        undefined,
    };
  } catch {
    return {};
  }
}

/**
 * 从API响应体中提取会议标识
 * 某些API（如 common-record-info）的会议ID在响应体中而不在URL参数中
 */
function extractMeetingIdsFromResponseBody(
  apiType: string,
  data: unknown
): {
  meetingId?: string;
  recordingId?: string;
} {
  try {
    // common-record-info: meeting_id 在响应体的 meeting_info 中
    if (apiType === 'common-record-info') {
      const response = data as CommonRecordInfoResponse;
      const meetingId = response.data?.meeting_info?.meeting_id;
      const recordingId = response.data?.recordings?.[0]?.id;

      if (meetingId || recordingId) {
        console.log(
          '[TXMeeting Background] 📝 从 common-record-info 响应体提取:',
          {
            meetingId,
            recordingId,
          }
        );
      }

      return {
        meetingId,
        recordingId,
      };
    }

    // minutes/detail: 通常ID在URL中，但响应体可能也包含（作为备用）
    if (apiType === 'minutes/detail') {
      const response = data as MinutesDetailResponse;
      // 如果响应体中有会议信息，可以提取
      // 根据实际API响应结构调整
      return {};
    }

    // 其他API类型可以在这里扩展
    // get-chapter, get-full-summary 等通常依赖URL参数

    return {};
  } catch (error) {
    console.error('[TXMeeting Background] 从响应体提取ID失败:', error);
    return {};
  }
}

/**
 * 获取会议数据
 */
async function getMeetingData(
  message: GetMeetingDataMessage
): Promise<MeetingDataResponse> {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.MEETINGS,
      STORAGE_KEYS.CURRENT_MEETING_ID,
    ]);

    const cachedMeetings =
      (result[STORAGE_KEYS.MEETINGS] as Record<
        string,
        {
          data: MeetingData;
          timestamp: number;
        }
      >) || {};
    const currentMeetingId = result[STORAGE_KEYS.CURRENT_MEETING_ID] as
      | string
      | undefined;

    // 如果指定了meetingId，使用指定的
    let meetingKey = currentMeetingId;
    if (message.payload?.meetingId && message.payload?.recordingId) {
      meetingKey = `${message.payload.meetingId}_${message.payload.recordingId}`;
    }

    if (!meetingKey || !cachedMeetings[meetingKey]) {
      return {
        success: false,
        error: '未找到会议数据，请访问腾讯会议页面加载数据',
      };
    }

    const cachedData = cachedMeetings[meetingKey];
    return {
      success: true,
      data: cachedData.data,
    };
  } catch (error) {
    console.error('[TXMeeting Background] 获取会议数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    };
  }
}

/**
 * 清除缓存
 */
async function clearCache(): Promise<void> {
  await chrome.storage.local.clear();
  console.log('[TXMeeting Background] 缓存已清除');
}

// Service Worker激活时的日志
console.log('[TXMeeting Background] 🚀 Service Worker 已启动');
console.log('[TXMeeting Background] 当前时间:', new Date().toISOString());

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[TXMeeting Background] 📦 扩展已安装/更新:', details.reason);
});

// 监听启动事件
chrome.runtime.onStartup.addListener(() => {
  console.log('[TXMeeting Background] 🔄 浏览器启动');
});
