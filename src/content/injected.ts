/**
 * Injected Script - 运行在页面的 MAIN world 中
 * 直接拦截页面的 XMLHttpRequest 和 fetch
 */

console.log('[TXMeeting Injected] 🚀 脚本开始执行在 MAIN world');

/**
 * 需要屏蔽的 URL 前缀列表（监控、埋点、上报等）
 */
const BLOCKED_URL_PREFIXES = [
  'https://otheve.beacon.qq.com/',
  'https://aegis.qq.com/',
  'https://oth.str.beacon.qq.com/',
  'https://report.meeting.tencent.com/',
  'https://h.trace.qq.com/',
];

/**
 * 检查 URL 是否应该被屏蔽
 */
function shouldBlockURL(url: string): boolean {
  return BLOCKED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// 保存原始的 XMLHttpRequest
const OriginalXHR = window.XMLHttpRequest;
const originalOpen = OriginalXHR.prototype.open;
const originalSend = OriginalXHR.prototype.send;

console.log('[TXMeeting Injected] 📦 已保存原始 XMLHttpRequest 方法');

// 拦截 XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function (
  this: XMLHttpRequest & {
    _txmeeting_url?: string;
    _txmeeting_method?: string;
  },
  method: string,
  url: string | URL,
  async?: boolean,
  username?: string | null,
  password?: string | null
) {
  this._txmeeting_url = typeof url === 'string' ? url : url.toString();
  this._txmeeting_method = method;

  console.log(
    `[TXMeeting Injected] 📡 XHR.open: ${method} ${this._txmeeting_url}`
  );

  // @ts-ignore - 参数类型兼容性
  return originalOpen.apply(this, arguments);
};

// 拦截 XMLHttpRequest.prototype.send
XMLHttpRequest.prototype.send = function (
  this: XMLHttpRequest & { _txmeeting_url?: string },
  body?: Document | XMLHttpRequestBodyInit | null
) {
  const url = this._txmeeting_url;

  // 屏蔽监控和埋点 URL
  if (url && shouldBlockURL(url)) {
    // console.log(`[TXMeeting Injected] 🚫 已屏蔽 URL: ${url}`);
    return originalSend.call(this, body);
  }

  if (url && url.includes('/wemeet-cloudrecording-webapi/')) {
    console.log(`[TXMeeting Injected] ✅ 匹配到腾讯会议 API: ${url}`);

    this.addEventListener('load', function (this: XMLHttpRequest) {
      try {
        console.log(`[TXMeeting Injected] 📥 响应状态: ${this.status}`);

        if (this.status === 200) {
          let data;

          // 处理不同的响应类型
          if (this.responseType === '' || this.responseType === 'text') {
            data = JSON.parse(this.responseText);
          } else if (this.responseType === 'json') {
            data = this.response;
          }

          if (data) {
            console.log('[TXMeeting Injected] 📦 响应数据:', data);

            // 通过 CustomEvent 传递给 Content Script
            window.dispatchEvent(
              new CustomEvent('TXMeetingAPIResponse', {
                detail: { url: url, data: data },
              })
            );

            console.log('[TXMeeting Injected] 📤 已发送 CustomEvent');
          }
        }
      } catch (error) {
        console.error('[TXMeeting Injected] ❌ 处理响应失败:', error);
      }
    });
  }

  return originalSend.call(this, body);
};

console.log('[TXMeeting Injected] ✅ XMLHttpRequest 拦截器已设置');

// 也拦截 fetch（以防万一）
const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const url =
    typeof args[0] === 'string'
      ? args[0]
      : args[0] instanceof Request
        ? args[0].url
        : String(args[0]);

  // 屏蔽监控和埋点 URL
  if (shouldBlockURL(url)) {
    // console.log(`[TXMeeting Injected] 🚫 已屏蔽 fetch URL: ${url}`);
    return originalFetch.apply(this, args);
  }

  console.log(`[TXMeeting Injected] 📡 fetch: ${url}`);

  const response = await originalFetch.apply(this, args);

  if (url.includes('/wemeet-cloudrecording-webapi/')) {
    console.log(`[TXMeeting Injected] ✅ 匹配到 fetch API: ${url}`);

    const clonedResponse = response.clone();

    try {
      const data = await clonedResponse.json();
      console.log('[TXMeeting Injected] 📦 fetch 响应数据:', data);

      window.dispatchEvent(
        new CustomEvent('TXMeetingAPIResponse', {
          detail: { url: url, data: data },
        })
      );

      console.log('[TXMeeting Injected] 📤 已发送 CustomEvent');
    } catch (error) {
      console.error('[TXMeeting Injected] ❌ 处理 fetch 响应失败:', error);
    }
  }

  return response;
};

console.log('[TXMeeting Injected] ✅ fetch 拦截器已设置');
console.log('[TXMeeting Injected] 🎉 所有拦截器注入完成！');
