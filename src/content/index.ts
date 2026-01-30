/**
 * Content Script (ISOLATED world)
 * 监听来自 MAIN world 注入脚本的消息
 */

console.log(
  '[TXMeeting Content] Content script 开始执行，时机:',
  document.readyState
);

// 监听来自注入脚本的消息（通过 CustomEvent）
window.addEventListener('TXMeetingAPIResponse', (event: Event) => {
  const customEvent = event as CustomEvent;
  const { url, data, method, requestBody } = customEvent.detail;

  console.log('[TXMeeting Content] 📨 收到来自注入脚本的 API 数据:', url);

  // 发送到 Background Script (包含请求体)
  chrome.runtime.sendMessage(
    {
      type: 'API_RESPONSE_INTERCEPTED',
      payload: { url, data, method, requestBody },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          '[TXMeeting Content] 发送失败:',
          chrome.runtime.lastError
        );
      } else {
        console.log(
          '[TXMeeting Content] ✅ 数据已发送到 Background:',
          response
        );
      }
    }
  );
});

console.log('[TXMeeting Content] ✅ 已设置 CustomEvent 监听器');

// 页面加载事件监听（用于调试）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[TXMeeting Content] 📄 DOMContentLoaded 事件触发');
  });
}

window.addEventListener('load', () => {
  console.log('[TXMeeting Content] 📄 window.load 事件触发');
});
