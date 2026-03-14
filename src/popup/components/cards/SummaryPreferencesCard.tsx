/**
 * SummaryPreferencesCard 组件 - 纪要偏好设置卡片
 */

import React, { useCallback, useMemo } from 'react';
import { SummaryPreferences } from '../../../types/meeting';
import styles from './Card.module.css';

interface SummaryPreferencesCardProps {
  data: SummaryPreferences;
  onCopy?: () => void;
}

export const SummaryPreferencesCard = React.memo<SummaryPreferencesCardProps>(
  ({ data, onCopy }) => {
    const markdown = useMemo(() => {
      const lines: string[] = ['# ⚙️ 纪要偏好设置\n'];

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

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(markdown);
        onCopy?.();
      } catch (error) {
        console.error('[SummaryPreferencesCard] 复制失败:', error);
      }
    }, [markdown, onCopy]);

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>⚙️ 纪要偏好设置</h2>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="复制纪要偏好"
          >
            📋 复制
          </button>
        </div>

        <div className={styles.cardContent}>
          {data.custom_summary && data.custom_summary.trim() ? (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>自定义纪要</h3>
              <div
                className={styles.htmlContent}
                dangerouslySetInnerHTML={{ __html: data.custom_summary }}
              />
            </div>
          ) : null}

          {data.begin_summary && data.begin_summary.trim() ? (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>开场总结</h3>
              <p className={styles.sectionText}>{data.begin_summary}</p>
            </div>
          ) : null}

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

SummaryPreferencesCard.displayName = 'SummaryPreferencesCard';

function stripHtml(html: string): string {
  if (!html || !html.trim()) return '';
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '- ');
  let previous: string;
  do {
    previous = text;
    text = text.replace(/<[^>]*>/g, '');
  } while (text !== previous);
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}
