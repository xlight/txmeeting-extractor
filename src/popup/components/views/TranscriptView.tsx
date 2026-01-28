/**
 * TranscriptView 组件 - 转写视图
 */

import React, { useMemo } from 'react';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { useUIState } from '../../contexts/UIStateContext';
import { formatTime, highlightText } from '../../utils/format';
import styles from './TranscriptView.module.css';

export function TranscriptView() {
  const { meetingData, isLoading } = useMeetingData();
  const { searchQuery, highlightedTranscriptIndex } = useUIState();

  // 搜索过滤
  const filteredTranscript = useMemo(() => {
    if (!meetingData?.transcript) return [];
    if (!searchQuery) return meetingData.transcript;

    return meetingData.transcript.filter((item) =>
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [meetingData?.transcript, searchQuery]);

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!meetingData?.transcript || meetingData.transcript.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>暂无转写数据</p>
      </div>
    );
  }

  if (filteredTranscript.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>没有找到匹配的内容</p>
        <p className={styles.emptyHint}>尝试使用其他关键词</p>
      </div>
    );
  }

  return (
    <div className={styles.transcriptView}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          转写记录
          {searchQuery && (
            <span className={styles.searchInfo}>
              （搜索结果：{filteredTranscript.length} /{' '}
              {meetingData.transcript.length}）
            </span>
          )}
        </h2>
        <div className={styles.stats}>
          共 {filteredTranscript.length} 条记录
        </div>
      </div>

      <div className={styles.list}>
        {filteredTranscript.map((item, index) => {
          const isHighlighted = highlightedTranscriptIndex === index;

          return (
            <div
              key={item.pid || index}
              className={`${styles.transcriptItem} ${isHighlighted ? styles.highlighted : ''}`}
            >
              <div className={styles.itemHeader}>
                <span className={styles.time}>
                  {formatTime(item.start_time)}
                </span>
                <span className={styles.speaker}>
                  {item.speaker || '未知发言人'}
                </span>
              </div>
              <div className={styles.itemContent}>
                {searchQuery
                  ? highlightText(item.text, searchQuery)
                  : item.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
