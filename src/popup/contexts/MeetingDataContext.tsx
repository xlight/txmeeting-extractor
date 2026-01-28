/**
 * MeetingDataContext - 会议数据状态管理
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type {
  MeetingData,
  MessageType,
  GetMeetingDataMessage,
} from '../../types/meeting';

interface MeetingDataContextValue {
  meetingData: MeetingData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const MeetingDataContext = createContext<MeetingDataContextValue | undefined>(
  undefined
);

export function MeetingDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    console.log('[MeetingDataContext] 开始刷新数据...');
    setIsLoading(true);

    try {
      console.log('[MeetingDataContext] 发送消息到 background...');
      const response = await chrome.runtime.sendMessage({
        type: 'GET_MEETING_DATA' as MessageType,
        payload: {},
      } as GetMeetingDataMessage);

      console.log('[MeetingDataContext] 收到响应:', response);

      if (response.success && response.data) {
        console.log('[MeetingDataContext] 会议数据:', response.data);
        console.log('[MeetingDataContext] - chapters:', response.data.chapters);
        console.log('[MeetingDataContext] - summary:', response.data.summary);
        console.log(
          '[MeetingDataContext] - todo_list:',
          response.data.todo_list
        );
        console.log(
          '[MeetingDataContext] - critical_nodes:',
          response.data.critical_nodes
        );
        setMeetingData(response.data);
        setError(null);
      } else {
        console.error('[MeetingDataContext] 获取数据失败:', response.error);
        setError(response.error || '获取数据失败');
        setMeetingData(null);
      }
    } catch (err) {
      console.error('[MeetingDataContext] 获取会议数据异常:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setMeetingData(null);
    } finally {
      console.log('[MeetingDataContext] 数据加载完成');
      setIsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    console.log('[MeetingDataContext] Provider 已挂载，开始初始加载');
    refreshData();
  }, [refreshData]);

  // 监听数据更新
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'MEETING_DATA_UPDATED') {
        setMeetingData(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const value: MeetingDataContextValue = {
    meetingData,
    isLoading,
    error,
    refreshData,
  };

  return (
    <MeetingDataContext.Provider value={value}>
      {children}
    </MeetingDataContext.Provider>
  );
}

export function useMeetingData(): MeetingDataContextValue {
  const context = useContext(MeetingDataContext);
  if (!context) {
    throw new Error('useMeetingData must be used within MeetingDataProvider');
  }
  return context;
}
