/**
 * ChaptersView 组件 - 章节视图
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { useUIState } from '../../contexts/UIStateContext';
import { formatTime } from '../../utils/format';
import styles from './ChaptersView.module.css';

export function ChaptersView() {
  const { meetingData, isLoading } = useMeetingData();
  const { currentChapterId } = useUIState();
  const [expandedChapterIds, setExpandedChapterIds] = useState<
    Set<string | number>
  >(new Set());
  const chapterRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());

  // 当 currentChapterId 变化时，滚动到对应章节
  useEffect(() => {
    if (currentChapterId) {
      const chapterElement = chapterRefs.current.get(currentChapterId);
      if (chapterElement) {
        chapterElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        // 自动展开被选中的章节
        setExpandedChapterIds((prev) => {
          const next = new Set(prev);
          next.add(currentChapterId);
          return next;
        });
      }
    }
  }, [currentChapterId]);

  // 获取章节对应的转写内容
  const getChapterTranscript = useMemo(() => {
    if (!meetingData?.transcript) return () => [];

    return (startTime: number, endTime: number) => {
      return meetingData.transcript!.filter(
        (item) => item.start_time >= startTime && item.start_time < endTime
      );
    };
  }, [meetingData?.transcript]);

  const toggleChapter = (chapterId: string | number) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!meetingData?.chapters || meetingData.chapters.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>暂无章节数据</p>
      </div>
    );
  }

  return (
    <div className={styles.chaptersView}>
      <div className={styles.header}>
        <h2 className={styles.title}>会议章节</h2>
        <div className={styles.stats}>
          共 {meetingData.chapters.length} 个章节
        </div>
      </div>

      <div className={styles.chapterList}>
        {meetingData.chapters.map((chapter, index) => {
          const isExpanded = expandedChapterIds.has(chapter.id || index);
          const isActive = currentChapterId === chapter.id;
          const chapterTranscript = getChapterTranscript(
            chapter.start_time,
            chapter.end_time
          );

          return (
            <div
              key={chapter.id || index}
              ref={(el) => {
                if (el) {
                  chapterRefs.current.set(chapter.id || index, el);
                } else {
                  chapterRefs.current.delete(chapter.id || index);
                }
              }}
              className={`${styles.chapterCard} ${isActive ? styles.active : ''}`}
            >
              <div
                className={styles.chapterHeader}
                onClick={() => toggleChapter(chapter.id || index)}
              >
                <div className={styles.chapterTitleRow}>
                  <span className={styles.chapterNumber}>
                    第 {index + 1} 章
                  </span>
                  <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                </div>
                <div className={styles.chapterMeta}>
                  <span className={styles.timeRange}>
                    {formatTime(chapter.start_time)}
                    {chapter.end_time &&
                      !isNaN(chapter.end_time) &&
                      chapter.end_time > 0 && (
                        <>
                          {' - '}
                          {formatTime(chapter.end_time)}
                        </>
                      )}
                  </span>
                  <button
                    className={styles.expandButton}
                    aria-label={isExpanded ? '折叠' : '展开'}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {chapter.summary && (
                <div className={styles.chapterSummary}>
                  <div className={styles.summaryLabel}>📝 章节摘要:</div>
                  <p>{chapter.summary}</p>
                </div>
              )}

              {isExpanded && chapterTranscript.length > 0 && (
                <div className={styles.chapterTranscript}>
                  <div className={styles.transcriptLabel}>
                    💬 转写内容 ({chapterTranscript.length} 条记录)
                  </div>
                  <div className={styles.transcriptList}>
                    {chapterTranscript.map((item, idx) => (
                      <div
                        key={item.pid || idx}
                        className={styles.transcriptItem}
                      >
                        <div className={styles.transcriptHeader}>
                          <span className={styles.transcriptTime}>
                            {formatTime(item.start_time)}
                          </span>
                          <span className={styles.transcriptSpeaker}>
                            {item.speaker || '未知'}
                          </span>
                        </div>
                        <div className={styles.transcriptText}>{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
