/**
 * 存储操作
 * 会议数据的读取与缓存清除
 */

import {
  MeetingData,
  STORAGE_KEYS,
  GetMeetingDataMessage,
  MeetingDataResponse,
} from '../types/meeting';

/**
 * 获取会议数据
 */
export async function getMeetingData(
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
    console.log('[TXMeeting Background] 🔍 从 storage 读取的 keywords:', {
      keywords: cachedData.data.keywords,
      type: typeof cachedData.data.keywords,
      isArray: Array.isArray(cachedData.data.keywords),
      length: cachedData.data.keywords?.length,
    });
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
export async function clearCache(): Promise<void> {
  await chrome.storage.local.clear();
  console.log('[TXMeeting Background] 缓存已清除');
}
