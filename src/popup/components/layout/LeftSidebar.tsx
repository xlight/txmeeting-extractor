/**
 * LeftSidebar 组件 - 左侧边栏（章节导航）
 */

import React from 'react';
import { useUIState } from '../../contexts/UIStateContext';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { formatTime } from '../../utils/format';
import styles from './LeftSidebar.module.css';

export function LeftSidebar() {
  const {
    leftSidebarCollapsed,
    toggleLeftSidebar,
    currentChapterId,
    setCurrentChapter,
    setCurrentTime,
    setCurrentView,
  } = useUIState();
  const { meetingData } = useMeetingData();

  if (leftSidebarCollapsed) {
    return (
      <div className={styles.sidebarCollapsed}>
        <button
          className={styles.expandButton}
          onClick={toggleLeftSidebar}
          aria-label="展开章节导航"
        >
          ▶
        </button>
      </div>
    );
  }

  const chapters = meetingData?.chapters || [];

  const handleChapterClick = (chapter: any) => {
    setCurrentChapter(chapter.id);
    setCurrentTime(chapter.start_time);
    setCurrentView('chapters');
    // TODO: 在 ChaptersView 中滚动到对应章节
  };

  return (
    <div className={styles.leftSidebar}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>章节导航</h3>
        <button
          className={styles.collapseButton}
          onClick={toggleLeftSidebar}
          aria-label="折叠章节导航"
        >
          ◀
        </button>
      </div>

      <div className={styles.chapterList}>
        {chapters.length === 0 ? (
          <div className={styles.emptyState}>暂无章节数据</div>
        ) : (
          chapters.map((chapter: any, index: number) => (
            <div
              key={chapter.id || index}
              className={`${styles.chapterItem} ${
                currentChapterId === chapter.id ? styles.active : ''
              }`}
              onClick={() => handleChapterClick(chapter)}
            >
              <div className={styles.chapterTitle}>{chapter.title}</div>
              <div className={styles.chapterTime}>
                {formatTime(chapter.start_time)} -{' '}
                {formatTime(chapter.end_time)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
