import { useState } from 'react';
import { MeetingData } from '../../types/meeting';
import { formatTimestamp } from '../../utils/extractor';
import { formatDuration } from '../../utils/format';

interface MeetingViewProps {
  data: MeetingData;
  onCopy: (message: string) => void;
}

export default function MeetingView({ data, onCopy }: MeetingViewProps) {
  return (
    <div className="content">
      <MetadataSection data={data} onCopy={onCopy} />
      {data.summary && <SummarySection summary={data.summary} onCopy={onCopy} />}
      {data.minutes && <MinutesSection minutes={data.minutes} onCopy={onCopy} />}
      {data.transcript.length > 0 && (
        <TranscriptSection transcript={data.transcript} onCopy={onCopy} />
      )}
      {data.participants && data.participants.length > 0 && (
        <ParticipantsSection participants={data.participants} onCopy={onCopy} />
      )}
      {data.chat_messages && data.chat_messages.length > 0 && (
        <ChatSection messages={data.chat_messages} onCopy={onCopy} />
      )}
      {data.action_items && data.action_items.length > 0 && (
        <ActionItemsSection items={data.action_items} onCopy={onCopy} />
      )}
      {data.highlights && data.highlights.length > 0 && (
        <HighlightsSection highlights={data.highlights} onCopy={onCopy} />
      )}
    </div>
  );
}

// 元数据section
function MetadataSection({ data, onCopy }: MeetingViewProps) {
  const [collapsed, setCollapsed] = useState(false);

  const copySection = () => {
    const text = `
会议 ID: ${data.metadata.meeting_id}
录制 ID: ${data.metadata.recording_id}
${data.metadata.duration ? `时长: ${formatDuration(data.metadata.duration)}` : ''}
${data.metadata.start_time ? `开始时间: ${formatTimestamp(data.metadata.start_time)}` : ''}
    `.trim();
    navigator.clipboard.writeText(text);
    onCopy('已复制元数据');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">
          📊 会议信息
        </div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="metadata-grid">
          <div className="metadata-label">会议 ID:</div>
          <div className="metadata-value">{data.metadata.meeting_id}</div>
          <div className="metadata-label">录制 ID:</div>
          <div className="metadata-value">{data.metadata.recording_id}</div>
          {data.metadata.duration && (
            <>
              <div className="metadata-label">时长:</div>
              <div className="metadata-value">
                {formatDuration(data.metadata.duration)}
              </div>
            </>
          )}
          {data.metadata.start_time && (
            <>
              <div className="metadata-label">开始时间:</div>
              <div className="metadata-value">
                {formatTimestamp(data.metadata.start_time)}
              </div>
            </>
          )}
          {data.metadata.end_time && (
            <>
              <div className="metadata-label">结束时间:</div>
              <div className="metadata-value">
                {formatTimestamp(data.metadata.end_time)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 智能总结section
function SummarySection({ summary, onCopy }: { summary: string; onCopy: (msg: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const copySection = () => {
    navigator.clipboard.writeText(summary);
    onCopy('已复制总结');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">💡 智能总结</div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="summary-text">{summary}</div>
      </div>
    </div>
  );
}

// 会议纪要section
function MinutesSection({ minutes, onCopy }: { minutes: string; onCopy: (msg: string) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const copySection = () => {
    navigator.clipboard.writeText(minutes);
    onCopy('已复制纪要');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">📝 会议纪要</div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="minutes-text">{minutes}</div>
      </div>
    </div>
  );
}

// 转写section
function TranscriptSection({
  transcript,
  onCopy,
}: {
  transcript: MeetingData['transcript'];
  onCopy: (msg: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const copySection = () => {
    const text = transcript
      .map((seg) => {
        const time = new Date(seg.start_time).toISOString().substr(11, 8);
        return `[${time}] ${seg.speaker || '未知'}:\n${seg.text}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(text);
    onCopy('已复制转写');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">
          🎙️ 转写内容 ({transcript.length} 段)
        </div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        {transcript.map((seg) => (
          <div key={seg.pid} className="transcript-item">
            <div className="transcript-header">
              {seg.speaker && (
                <span className="transcript-speaker">{seg.speaker}</span>
              )}
              <span className="transcript-time">
                {new Date(seg.start_time).toISOString().substr(11, 8)}
              </span>
            </div>
            <div className="transcript-text">{seg.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 参会人员section
function ParticipantsSection({
  participants,
  onCopy,
}: {
  participants: NonNullable<MeetingData['participants']>;
  onCopy: (msg: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const copySection = () => {
    const text = participants.map((p) => p.user_name).join('\n');
    navigator.clipboard.writeText(text);
    onCopy('已复制参会人员');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">
          👥 参会人员 ({participants.length})
        </div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        {participants.map((p) => (
          <div key={p.user_id} className="participant-item">
            <div className="participant-name">{p.user_name}</div>
            {p.join_time && (
              <div className="participant-time">
                加入: {formatTimestamp(p.join_time)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 聊天消息section
function ChatSection({
  messages,
  onCopy,
}: {
  messages: NonNullable<MeetingData['chat_messages']>;
  onCopy: (msg: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const copySection = () => {
    const text = messages
      .map((msg) => `${msg.sender_name}: ${msg.content}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    onCopy('已复制聊天记录');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">💬 聊天记录 ({messages.length})</div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        {messages.map((msg) => (
          <div key={msg.message_id} className="chat-item">
            <div className="chat-sender">{msg.sender_name}</div>
            <div className="chat-time">{formatTimestamp(msg.timestamp)}</div>
            <div className="chat-content">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 行动项section
function ActionItemsSection({
  items,
  onCopy,
}: {
  items: NonNullable<MeetingData['action_items']>;
  onCopy: (msg: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const copySection = () => {
    const text = items
      .map((item) => `- [ ] ${item.description}${item.assignee ? ` (@${item.assignee})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    onCopy('已复制行动项');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">✅ 行动项 ({items.length})</div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        {items.map((item) => (
          <div key={item.id} className="action-item">
            <input
              type="checkbox"
              className="action-checkbox"
              checked={item.status === 'completed'}
              readOnly
            />
            <span className="action-description">{item.description}</span>
            {item.assignee && (
              <span className="action-assignee">@{item.assignee}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 重点时刻section
function HighlightsSection({
  highlights,
  onCopy,
}: {
  highlights: NonNullable<MeetingData['highlights']>;
  onCopy: (msg: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const copySection = () => {
    const text = highlights
      .map((h) => `[${formatTimestamp(h.timestamp)}] ${h.description}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    onCopy('已复制重点时刻');
  };

  return (
    <div className="section">
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-title">⭐ 重点时刻 ({highlights.length})</div>
        <div className="section-toggle" style={{ display: 'flex', gap: 8 }}>
          <button
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              copySection();
            }}
          >
            复制
          </button>
          <span className={collapsed ? 'collapsed' : ''}>▼</span>
        </div>
      </div>
      <div className={`section-content ${collapsed ? 'collapsed' : ''}`}>
        {highlights.map((h) => (
          <div key={h.id} className="highlight-item">
            <div className="highlight-time">{formatTimestamp(h.timestamp)}</div>
            <div className="highlight-description">{h.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
