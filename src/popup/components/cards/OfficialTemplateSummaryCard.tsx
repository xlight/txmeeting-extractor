/**
 * OfficialTemplateSummaryCard 组件 - 官方模板纪要卡片
 * 使用 ReactMarkdown 渲染 LLM 生成的 Markdown 格式纪要
 */

import React, { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { OfficialTemplateSummaryData } from '../../../types/meeting';
import styles from './Card.module.css';

interface OfficialTemplateSummaryCardProps {
  data: OfficialTemplateSummaryData;
  onCopy?: () => void;
}

export const OfficialTemplateSummaryCard =
  React.memo<OfficialTemplateSummaryCardProps>(({ data, onCopy }) => {
    // 复制处理函数（复制原始 Markdown 文本）
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(data.full_markdown);
        onCopy?.();
      } catch (error) {
        console.error('[OfficialTemplateSummaryCard] 复制失败:', error);
      }
    }, [data.full_markdown, onCopy]);

    if (data.status !== 2) {
      return (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              📝 {data.summary_template_title || '智能总结'}
            </h2>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.emptyState} role="status">
              纪要生成中，请稍后刷新...
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            📝 {data.summary_template_title || '智能总结'}
            <span className={styles.versionBadge}>v{data.status}</span>
          </h2>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="复制纪要"
          >
            📋 复制
          </button>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.markdownContent}>
            <ReactMarkdown>{data.full_markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  });

OfficialTemplateSummaryCard.displayName = 'OfficialTemplateSummaryCard';
