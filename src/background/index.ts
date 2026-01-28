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
} from '../types/meeting';
import { extractMeetingData } from '../utils/extractor';

// 腾讯会议API端点
const TENCENT_MEETING_API_PATTERNS = [
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/minutes/detail*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/summary*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/participants*',
];

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
  console.log('[TXMeeting Background] 📨 收到消息:', message.type, 'from:', sender.tab?.url);
  console.log('[TXMeeting Background] 消息详情:', message);

  switch (message.type) {
    case 'API_RESPONSE_INTERCEPTED':
      console.log('[TXMeeting Background] 🔄 开始处理 API 响应拦截');
      handleAPIResponse(message.payload).then(() => {
        console.log('[TXMeeting Background] ✅ API 响应处理完成');
        sendResponse({ success: true });
      }).catch((error) => {
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
    // 提取会议数据
    const meetingData = extractMeetingData(payload.data);

    if (!meetingData) {
      console.warn('[TXMeeting Background] ⚠️ 无法提取会议数据，data 结构可能不匹配');
      console.warn('[TXMeeting Background] 原始数据:', JSON.stringify(payload.data).substring(0, 500));
      return;
    }

    console.log('[TXMeeting Background] ✅ 会议数据提取成功:', meetingData.metadata);

    // 生成缓存键
    const cacheKey = `${meetingData.metadata.meeting_id}_${meetingData.metadata.recording_id}`;

    // 读取现有缓存
    const result = await chrome.storage.local.get(STORAGE_KEYS.MEETINGS);
    const cachedMeetings = (result[STORAGE_KEYS.MEETINGS] as Record<
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
    chrome.runtime.sendMessage({
      type: MessageType.MEETING_DATA_UPDATED,
      payload: meetingData,
    }).catch(() => {
      // Popup未打开时会失败，忽略错误
    });
  } catch (error) {
    console.error('[TXMeeting Background] 处理API响应失败:', error);
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

    const cachedMeetings = (result[STORAGE_KEYS.MEETINGS] as Record<
      string,
      {
        data: MeetingData;
        timestamp: number;
      }
    >) || {};
    const currentMeetingId = result[STORAGE_KEYS.CURRENT_MEETING_ID] as string | undefined;

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
