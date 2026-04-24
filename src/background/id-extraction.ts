/**
 * ID 提取逻辑
 * 从URL、请求体、响应体中提取会议标识
 */

import {
  MinutesDetailResponse,
  CommonRecordInfoResponse,
} from '../types/meeting';

/**
 * 从URL中提取会议ID和录制ID
 */
export function extractMeetingIdsFromURL(url: string): {
  meetingId?: string;
  recordingId?: string;
  shareId?: string;
} {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // 从查询参数中提取
    const queryMeetingId =
      urlObj.searchParams.get('meeting_id') ||
      urlObj.searchParams.get('meetingId') ||
      undefined;
    const queryRecordingId =
      urlObj.searchParams.get('recording_id') ||
      urlObj.searchParams.get('recordingId') ||
      urlObj.searchParams.get('record_id') ||
      undefined;
    const queryShareId = urlObj.searchParams.get('id') || undefined;

    // 从路径中提取标识符（腾讯会议的cw/ct/crm格式）
    // 例如: /cw/NgP87vAg4b, /ct/23L8XO7Oe1, /crm/KwD9nW505d
    let pathShareId: string | undefined;
    const pathSegments = pathname.split('/').filter(Boolean);
    if (
      pathSegments.length >= 2 &&
      ['cw', 'ct', 'crm'].includes(pathSegments[0])
    ) {
      pathShareId = pathSegments[1];
      console.log(
        '[TXMeeting Background] 📝 从路径提取 share_id:',
        pathShareId
      );
    }

    return {
      meetingId: queryMeetingId,
      recordingId: queryRecordingId,
      shareId: queryShareId || pathShareId,
    };
  } catch {
    return {};
  }
}

/**
 * 从API响应体中提取会议标识
 * 某些API（如 common-record-info）的会议ID在响应体中而不在URL参数中
 */
export function extractMeetingIdsFromResponseBody(
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
 * 从API请求体中提取会议标识
 * 用于处理统计类API（get-smart-topic, get-time-line, get-chapter）
 * 以及共享链接场景的 get-mul-summary-and-todo API
 */
export function extractMeetingIdsFromRequestBody(
  apiType: string,
  requestBody: any
): {
  meetingId?: string;
  recordingId?: string;
  shareId?: string;
} {
  try {
    // 统计类API（get-smart-topic, get-time-line, get-chapter）
    // 以及新的query-summary-and-note, query-timeline API
    // 请求体格式: { meeting_id: '...', record_id: '...', ... }
    if (
      apiType === 'get-smart-topic' ||
      apiType === 'get-time-line' ||
      apiType === 'get-chapter' ||
      apiType === 'query-summary-and-note' ||
      apiType === 'query-timeline'
    ) {
      const meetingId = requestBody?.meeting_id;
      const recordingId = requestBody?.record_id;

      if (meetingId || recordingId) {
        console.log(`[TXMeeting Background] 📝 从 ${apiType} 请求体提取:`, {
          meetingId,
          recordingId,
        });
      }

      return {
        meetingId,
        recordingId,
      };
    }

    // get-mul-summary-and-todo API（共享链接场景）
    // 以及新的query-summary-and-note, query-timeline API
    // 请求体格式: { meeting_id: '...', record_id: '...', share_id: '...', summary_type: 0 }
    if (
      apiType === 'get-mul-summary-and-todo' ||
      apiType === 'query-summary-and-note' ||
      apiType === 'query-timeline'
    ) {
      const meetingId = requestBody?.meeting_id;
      const recordingId = requestBody?.record_id;
      const shareId = requestBody?.share_id;

      if (meetingId || recordingId || shareId) {
        console.log(`[TXMeeting Background] 📝 从 ${apiType} 请求体提取:`, {
          meetingId,
          recordingId,
          shareId,
        });
      }

      return {
        meetingId,
        recordingId,
        shareId,
      };
    }

    // 其他需要从请求体提取ID的API可以在这里扩展
    return {};
  } catch (error) {
    console.error('[TXMeeting Background] 从请求体提取ID失败:', error);
    return {};
  }
}
