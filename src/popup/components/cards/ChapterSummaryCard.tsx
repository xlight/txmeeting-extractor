/**
 * ChapterSummaryCard 组件 - 分章节纪要卡片
 */

import React, { useCallback, useMemo } from 'react';
import { ChapterSummaryData } from '../../../types/meeting';
import { chapterSummaryToMarkdown } from '../../utils/markdown';
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
          <h2 className={styles.cardTitle}>📑 分章节纪要</h2>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="复制分章节纪要"
          >
            📋 复制
          </button>
        </div>

        <div className={styles.cardContent}>
          {/* 自定义章节纪要 */}
          {data.custom_summary && data.custom_summary.trim() ? (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>自定义章节纪要</h3>
              <div
                className={styles.htmlContent}
                dangerouslySetInnerHTML={{ __html: data.custom_summary }}
              />
            </div>
          ) : null}

          {data.summary_list && data.summary_list.length > 0 ? (
            <div className={styles.chaptersList}>
              {data.summary_list.map((chapter, index) => (
                <div key={chapter.summary_id} className={styles.chapterItem}>
                  <div className={styles.chapterHeader}>
                    <span className={styles.chapterNumber}>{index + 1}</span>
                    <h3 className={styles.chapterTitle}>
                      {chapter.title || `章节 ${index + 1}`}
                    </h3>
                  </div>

                  {/* 章节纪要 */}
                  <p className={styles.chapterSummary}>{chapter.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              暂无章节纪要
            </div>
          )}
        </div>
      </div>
    );
  }
);

ChapterSummaryCard.displayName = 'ChapterSummaryCard';
