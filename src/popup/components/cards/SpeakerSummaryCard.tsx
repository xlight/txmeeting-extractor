/**
 * SpeakerSummaryCard 组件 - 发言人观点卡片
 */

import React, { useCallback, useMemo } from 'react';
import { SpeakerSummaryData } from '../../../types/meeting';
import { speakerSummaryToMarkdown } from '../../utils/markdown';
import styles from './Card.module.css';

interface SpeakerSummaryCardProps {
  data: SpeakerSummaryData;
  onCopy?: () => void;
}

export const SpeakerSummaryCard = React.memo<SpeakerSummaryCardProps>(
  ({ data, onCopy }) => {
    // 缓存 Markdown 转换结果
    const markdown = useMemo(() => speakerSummaryToMarkdown(data), [data]);

    // 复制处理函数
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(markdown);
        onCopy?.();
      } catch (error) {
        console.error('[SpeakerSummaryCard] 复制失败:', error);
      }
    }, [markdown, onCopy]);

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>💬 发言人观点</h2>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="复制发言人观点"
          >
            📋 复制
          </button>
        </div>

        <div className={styles.cardContent}>
          {data.speakers_opinions && data.speakers_opinions.length > 0 ? (
            <div className={styles.speakersList}>
              {data.speakers_opinions.map((speaker, speakerIndex) => (
                <div key={speakerIndex} className={styles.speakerItem}>
                  <div className={styles.speakerHeader}>
                    <span className={styles.speakerIcon}>👤</span>
                    <h3 className={styles.speakerName}>{speaker.speaker_id}</h3>
                  </div>

                  {speaker.sub_points && speaker.sub_points.length > 0 ? (
                    <div className={styles.opinionsList}>
                      {speaker.sub_points.map((subPoint, pointIndex) => (
                        <div key={pointIndex} className={styles.opinionGroup}>
                          <h4 className={styles.opinionTitle}>
                            {subPoint.sub_point_title}
                          </h4>
                          {subPoint.sub_point_vec_items &&
                          subPoint.sub_point_vec_items.length > 0 ? (
                            <ul className={styles.opinionPoints}>
                              {subPoint.sub_point_vec_items.map(
                                (item, itemIndex) => (
                                  <li
                                    key={itemIndex}
                                    className={styles.opinionPoint}
                                  >
                                    {item.point}
                                  </li>
                                )
                              )}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noOpinions}>该发言人暂无记录观点</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              暂无发言人观点
            </div>
          )}
        </div>
      </div>
    );
  }
);

SpeakerSummaryCard.displayName = 'SpeakerSummaryCard';
