/**
 * API 类型识别
 * 腾讯会议API端点模式与类型识别
 */

// 腾讯会议API端点
export const TENCENT_MEETING_API_PATTERNS = [
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/minutes/detail*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/common-record-info*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/summary*',
  'https://meeting.tencent.com/wemeet-cloudrecording-webapi/v1/participants*',
  // 新页面使用的API路径 (get-* 格式)
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/get-full-summary*',
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/get-chapter*',
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/get-time-line*',
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/get-mul-summary-and-todo*',
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/get-smart-topic*',
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/get-multi-record-file*',
  // 新页面使用的API路径 (query-* 格式 - 实际使用的新API)
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/query-summary-and-note*',
  'https://meeting.tencent.com/wemeet-tapi/v2/meetlog/public/record-detail/query-timeline*',
];

// API 类型联合类型
export type APIType =
  | 'minutes/detail'
  | 'common-record-info'
  | 'get-full-summary'
  | 'get-chapter'
  | 'get-time-line'
  | 'get-mul-summary-and-todo'
  | 'get-smart-topic'
  | 'get-multi-record-file'
  | 'query-summary-and-note'
  | 'query-timeline';

/**
 * 识别API类型
 */
export function identifyAPIType(url: string): APIType | null {
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
  } else if (url.includes('/get-multi-record-file')) {
    return 'get-multi-record-file';
  } else if (url.includes('/query-summary-and-note')) {
    return 'query-summary-and-note';
  } else if (url.includes('/query-timeline')) {
    return 'query-timeline';
  }
  return null;
}
