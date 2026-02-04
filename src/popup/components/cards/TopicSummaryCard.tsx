/**
 * TopicSummaryCard 组件 - 主题纪要卡片
 */

import React, { useCallback, useMemo } from 'react';
import { TopicSummaryData } from '../../../types/meeting';
import { topicSummaryToMarkdown } from '../../utils/markdown';
import styles from './Card.module.css';

interface TopicSummaryCardProps {
  data: TopicSummaryData;
  onCopy?: () => void;
}

export const TopicSummaryCard = React.memo<TopicSummaryCardProps>(
  ({ data, onCopy }) => {
    // 缓存 Markdown 转换结果
    const markdown = useMemo(() => topicSummaryToMarkdown(data), [data]);

    // 复制处理函数
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(markdown);
        onCopy?.();
      } catch (error) {
        console.error('[TopicSummaryCard] 复制失败:', error);
      }
    }, [markdown, onCopy]);

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>💡 主题纪要</h2>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="复制主题纪要"
          >
            📋 复制
          </button>
        </div>

        <div className={styles.cardContent}>
          {/* 自定义纪要 */}
          {data.custom_summary && data.custom_summary.trim() ? (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>自定义纪要</h3>
              <div
                className={styles.htmlContent}
                dangerouslySetInnerHTML={{ __html: data.custom_summary }}
              />
            </div>
          ) : null}

          {/* 开场总结 */}
          {data.begin_summary && data.begin_summary.trim() ? (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>开场总结</h3>
              <p className={styles.sectionText}>{data.begin_summary}</p>
            </div>
          ) : null}

          {/* 核心要点 */}
          {data.sub_points && data.sub_points.length > 0 ? (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>核心要点</h3>
              <div className={styles.pointsList}>
                {data.sub_points
                  .filter(
                    (point) =>
                      point.sub_point_title || point.sub_point_vec_items?.length
                  )
                  .map((point, index) => (
                    <div key={index} className={styles.pointItem}>
                      <div className={styles.pointHeader}>
                        <span className={styles.pointNumber}>{index + 1}</span>
                        <h4 className={styles.pointTitle}>
                          {point.sub_point_title || '无标题'}
                        </h4>
                      </div>
                      {point.sub_point_vec_items &&
                      point.sub_point_vec_items.length > 0 ? (
                        <ul className={styles.pointContent}>
                          {point.sub_point_vec_items.map((item, itemIndex) => (
                            <li key={itemIndex}>{item.point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.pointContent}>无内容</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              暂无核心要点
            </div>
          )}

          {/* 结束总结 */}
          {data.end_summary && data.end_summary.trim() ? (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>结束总结</h3>
              <p className={styles.sectionText}>{data.end_summary}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

TopicSummaryCard.displayName = 'TopicSummaryCard';
