/**
 * Background Service Worker
 * 拦截腾讯会议API响应并缓存数据
 */

import { MessageType, GetMeetingDataMessage } from '../types/meeting';
import { handleAPIResponse } from './response-handler';
import { getMeetingData, clearCache } from './storage';

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
