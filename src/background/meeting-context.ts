/**
 * 会议上下文管理
 * 跟踪当前正在查看的会议
 */

// 全局会议上下文
export let currentMeetingContext: {
  meetingId?: string;
  recordingId?: string;
  shareId?: string;
  cacheKey?: string;
  lastActivityTime: number;
} = {
  lastActivityTime: Date.now(),
};

/**
 * 更新会议上下文
 * 从 handleAPIResponse 中提取的上下文更新逻辑
 */
export function updateMeetingContext(extractedIds: {
  meetingId?: string;
  recordingId?: string;
  shareId?: string;
}): void {
  if (
    extractedIds.meetingId ||
    extractedIds.recordingId ||
    extractedIds.shareId
  ) {
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
        shareId: extractedIds.shareId,
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
      if (extractedIds.shareId && !currentMeetingContext.shareId) {
        currentMeetingContext.shareId = extractedIds.shareId;
        console.log(
          '[TXMeeting Background] 📝 补充 share_id:',
          extractedIds.shareId
        );
      }
      currentMeetingContext.lastActivityTime = now;
    }
  }
}
