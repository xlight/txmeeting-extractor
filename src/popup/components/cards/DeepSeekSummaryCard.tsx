/**
 * DeepSeekSummaryCard 组件 - DeepSeek 智能纪要卡片
 */

import React, { useCallback, useMemo } from 'react';
import { DeepSeekSummaryData } from '../../../types/meeting';
import styles from './Card.module.css';

interface DeepSeekSummaryCardProps {
  data: DeepSeekSummaryData;
  onCopy?: () => void;
}

export const DeepSeekSummaryCard = React.memo<DeepSeekSummaryCardProps>(
  ({ data, onCopy }) => {
    // 生成 Markdown
    const markdown = useMemo(() => {
      const lines: string[] = ['# 🤖 DeepSeek 智能纪要\n'];

      if (data.custom_summary) {
        lines.push('## 自定义纪要\n');
        lines.push(stripHtml(data.custom_summary) + '\n');
      }

      if (data.begin_summary) {
        lines.push('## 开场总结\n');
        lines.push(data.begin_summary + '\n');
      }

      if (data.sub_points && data.sub_points.length > 0) {
        lines.push('## 核心要点\n');
        data.sub_points.forEach((point, index) => {
          lines.push(
            `### ${index + 1}. ${point.sub_point_title || '无标题'}\n`
          );
          if (point.sub_point_vec_items?.length > 0) {
            point.sub_point_vec_items.forEach((item) => {
              lines.push(`- ${item.point}`);
            });
            lines.push('');
          }
        });
      }

      if (data.end_summary) {
        lines.push('## 结束总结\n');
        lines.push(data.end_summary + '\n');
      }

      return lines.join('\n');
    }, [data]);

    // 复制处理函数
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(markdown);
        onCopy?.();
      } catch (error) {
        console.error('[DeepSeekSummaryCard] 复制失败:', error);
      }
    }, [markdown, onCopy]);

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>🤖 DeepSeek 智能纪要</h2>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="复制 DeepSeek 纪要"
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

DeepSeekSummaryCard.displayName = 'DeepSeekSummaryCard';

// HTML 清理辅助函数
function stripHtml(html: string): string {
  if (!html || !html.trim()) return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
