import { useState, useEffect } from 'react';
import { MeetingData, MessageType, MeetingDataResponse } from '../types/meeting';
import { exportToMarkdown } from '../utils/exporter';
import MeetingView from './components/MeetingView';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 加载会议数据
  useEffect(() => {
    loadMeetingData();
  }, []);

  const loadMeetingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: MessageType.GET_MEETING_DATA,
      })) as MeetingDataResponse;

      if (response.success && response.data) {
        setMeetingData(response.data);
      } else {
        setError(response.error || '获取会议数据失败');
      }
    } catch (err) {
      console.error('加载会议数据失败:', err);
      setError('加载会议数据失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!meetingData) return;

    try {
      exportToMarkdown(meetingData);
      showToast('导出成功！');
    } catch (err) {
      console.error('导出失败:', err);
      showToast('导出失败，请重试');
    }
  };

  const handleRefresh = () => {
    loadMeetingData();
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div>⏳ 加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={handleRefresh}>
            刷新
          </button>
        </div>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="app">
        <div className="empty">
          <div>📭 未找到会议数据</div>
          <p style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            请访问腾讯会议云录屏页面
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>{meetingData.metadata.title}</h1>
        <div className="subtitle">
          会议 ID: {meetingData.metadata.meeting_id}
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            📥 导出 Markdown
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            🔄 刷新
          </button>
        </div>
      </div>

      <MeetingView data={meetingData} onCopy={showToast} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
