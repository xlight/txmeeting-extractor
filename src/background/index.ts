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
} from '../types/meeting';
import { extractMeetingData } from '../utils/extractor';

// 腾讯会议API端点
const TENCENT_MEETING_API_PATTERNS = [
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/minutes/detail*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/common-record-info*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/summary*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/participants*',
];

// 临时缓存：存储同一会议的多个API响应
const apiResponseCache: Map<
  string,
  {
    minutesDetail?: MinutesDetailResponse;
    commonRecordInfo?: CommonRecordInfoResponse;
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
}): Promise<void> {
  console.log('[TXMeeting Background] 🔍 处理API响应:', payload.url);
  console.log('[TXMeeting Background] 📦 响应数据:', payload.data);

  try {
    // 识别API类型
    const apiType = identifyAPIType(payload.url);
    if (!apiType) {
      console.warn('[TXMeeting Background] ⚠️ 未知的API类型:', payload.url);
      return;
    }

    console.log('[TXMeeting Background] 📋 识别到 API 类型:', apiType);

    // 提取会议标识（从URL参数中）
    const meetingKey = extractMeetingKeyFromURL(payload.url);
    if (!meetingKey) {
      console.warn('[TXMeeting Background] ⚠️ 无法从URL提取会议标识');
      return;
    }

    console.log('[TXMeeting Background] 🔑 会议标识:', meetingKey);

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
    }

    cache.timestamp = Date.now();

    // 显示当前缓存状态
    console.log('[TXMeeting Background] 📊 缓存状态:', {
      hasMinutesDetail: !!cache.minutesDetail,
      hasCommonRecordInfo: !!cache.commonRecordInfo,
      minutesDetailHasMore: cache.minutesDetail?.more,
    });

    // 检查是否所有数据都已加载完成
    const isMinutesDetailComplete =
      cache.minutesDetail && !cache.minutesDetail.more;
    const shouldExtractData = isMinutesDetailComplete || cache.commonRecordInfo;

    if (!shouldExtractData) {
      console.log('[TXMeeting Background] ⏳ 等待更多分页数据...');
      return;
    }

    // 尝试提取数据
    if (cache.minutesDetail || cache.commonRecordInfo) {
      console.log('[TXMeeting Background] 🔄 开始提取完整会议数据...');

      const meetingData = extractMeetingData({
        minutesDetail: cache.minutesDetail,
        commonRecordInfo: cache.commonRecordInfo,
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

      // 从 URL 中提取会议 ID 信息（补充 metadata）
      const ids = extractMeetingIdsFromURL(payload.url);
      if (ids.meetingId && !meetingData.metadata.meeting_id) {
        meetingData.metadata.meeting_id = ids.meetingId;
      }
      if (ids.recordingId && !meetingData.metadata.recording_id) {
        meetingData.metadata.recording_id = ids.recordingId;
      }

      console.log(
        '[TXMeeting Background] ✅ 会议数据提取成功:',
        meetingData.metadata
      );

      // 生成缓存键
      const cacheKey = `${meetingData.metadata.meeting_id}_${meetingData.metadata.recording_id}`;

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

      console.log('[TXMeeting Background] 数据已缓存:', cacheKey);

      // 通知popup更新（如果打开）
      chrome.runtime
        .sendMessage({
          type: MessageType.MEETING_DATA_UPDATED,
          payload: meetingData,
        })
        .catch(() => {
          // Popup未打开时会失败，忽略错误
        });

      // 清理已使用的临时缓存
      apiResponseCache.delete(meetingKey);
    }
  } catch (error) {
    console.error('[TXMeeting Background] 处理API响应失败:', error);
  }
}

/**
 * 识别API类型
 */
function identifyAPIType(
  url: string
): 'minutes/detail' | 'common-record-info' | null {
  if (url.includes('/minutes/detail')) {
    return 'minutes/detail';
  } else if (url.includes('/common-record-info')) {
    return 'common-record-info';
  }
  return null;
}

/**
 * 从URL中提取会议标识
 */
function extractMeetingKeyFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const recordingId =
      urlObj.searchParams.get('recording_id') ||
      urlObj.searchParams.get('recordingId');
    const meetingId =
      urlObj.searchParams.get('meeting_id') ||
      urlObj.searchParams.get('meetingId');

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
        undefined,
    };
  } catch {
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
