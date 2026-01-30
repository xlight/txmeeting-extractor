/**
 * ChapterSummaryCard 组件 - 分章节摘要卡片
 */

import React, { useCallback, useMemo } from 'react';
import { ChapterSummaryData } from '../../../types/meeting';
import { chapterSummaryToMarkdown } from '../../utils/markdown';
import { formatTime } from '../../utils/format';
import styles from './Card.module.css';

interface ChapterSummaryCardProps {
  data: ChapterSummaryData;
  onCopy?: () => void;
}

export const ChapterSummaryCard = React.memo<ChapterSummaryCardProps>(
  ({ data, onCopy }) => {
    // 缓存 Markdown 转换结果
    const markdown = useMemo(() => chapterSummaryToMarkdown(data), [data]);

    // 复制处理函数
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(markdown);
        onCopy?.();
      } catch (error) {
        console.error('[ChapterSummaryCard] 复制失败:', error);
      }
    }, [markdown, onCopy]);

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>📑 分章节摘要</h2>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="复制分章节摘要"
          >
            📋 复制
          </button>
        </div>

        <div className={styles.cardContent}>
          {data.summary_list && data.summary_list.length > 0 ? (
            <div className={styles.chaptersList}>
              {data.summary_list.map((chapter, index) => (
                <div key={chapter.chapter_id} className={styles.chapterItem}>
                  <div className={styles.chapterHeader}>
                    <span className={styles.chapterNumber}>{index + 1}</span>
                    <h3 className={styles.chapterTitle}>
                      {chapter.chapter_title || `章节 ${index + 1}`}
                    </h3>
                  </div>

                  {/* 时间范围 */}
                  {chapter.start_time !== undefined &&
                    chapter.end_time !== undefined && (
                      <div className={styles.chapterTime}>
                        <span className={styles.timeIcon}>🕒</span>
                        <span className={styles.timeRange}>
                          {formatTime(chapter.start_time)} -{' '}
                          {formatTime(chapter.end_time)}
                        </span>
                      </div>
                    )}

                  {/* 章节摘要 */}
                  <p className={styles.chapterSummary}>{chapter.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              暂无章节摘要
            </div>
          )}
        </div>
      </div>
    );
  }
);

ChapterSummaryCard.displayName = 'ChapterSummaryCard';
