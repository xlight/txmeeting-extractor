/**
 * SummaryView 组件 - 会议摘要视图
 * 展示主题摘要、分章节摘要、发言人观点和待办事项
 */

import React, { useCallback, useMemo } from 'react';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import {
  TopicSummaryCard,
  ChapterSummaryCard,
  SpeakerSummaryCard,
  TodoCard,
} from '../cards';
import { Toast } from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import { generateCompleteMinutesMarkdown } from '../../utils/markdown';
import styles from './SummaryView.module.css';

export function SummaryView() {
  const { meetingData, isLoading } = useMeetingData();
  const { toast, showToast } = useToast();

  // 提取摘要数据
  const {
    topic_summary_data,
    chapter_summary_data,
    speaker_summary_data,
    todo_items,
  } = meetingData || {};

  // 检查数据可用性
  const hasTopicSummary =
    topic_summary_data && topic_summary_data.summary_status === 2;
  const hasChapterSummary =
    chapter_summary_data && chapter_summary_data.summary_status === 2;
  const hasSpeakerSummary =
    speaker_summary_data && speaker_summary_data.summary_status === 2;
  const hasTodos = todo_items && todo_items.length > 0;

  const hasAnyData =
    hasTopicSummary || hasChapterSummary || hasSpeakerSummary || hasTodos;

  // 生成完整的 Markdown 摘要
  const completeMarkdown = useMemo(() => {
    if (!meetingData) return '';
    return generateCompleteMinutesMarkdown(
      hasTopicSummary ? topic_summary_data : undefined,
      hasChapterSummary ? chapter_summary_data : undefined,
      hasSpeakerSummary ? speaker_summary_data : undefined,
      hasTodos ? todo_items : undefined
    );
  }, [
    meetingData,
    hasTopicSummary,
    hasChapterSummary,
    hasSpeakerSummary,
    hasTodos,
    topic_summary_data,
    chapter_summary_data,
    speaker_summary_data,
    todo_items,
  ]);

  // 复制全部摘要
  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(completeMarkdown);
      showToast('已复制完整摘要到剪贴板');
    } catch (error) {
      console.error('[SummaryView] 复制失败:', error);
      showToast('复制失败，请重试');
    }
  }, [completeMarkdown, showToast]);

  // 单个卡片复制成功回调
  const handleCardCopy = useCallback(
    (cardName: string) => {
      showToast(`已复制${cardName}到剪贴板`);
    },
    [showToast]
  );

  // 加载状态
  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    );
  }

  // 无数据状态
  if (!meetingData) {
    return (
      <div className={styles.emptyState}>
        <p>暂无会议数据</p>
        <p className={styles.emptyHint}>请访问腾讯会议录制页面以加载数据</p>
      </div>
    );
  }

  // 摘要数据全部不可用
  if (!hasAnyData) {
    return (
      <div className={styles.emptyState}>
        <p>暂无会议摘要数据</p>
        <p className={styles.emptyHint}>
          会议摘要可能正在生成中，请稍后刷新页面重试
        </p>
      </div>
    );
  }

  return (
    <div className={styles.summaryView}>
      {/* 头部 */}
      <div className={styles.header}>
        <h2 className={styles.title}>会议摘要</h2>
        <button
          className={styles.copyAllButton}
          onClick={handleCopyAll}
          aria-label="复制完整摘要"
        >
          📋 复制全部摘要
        </button>
      </div>

      {/* 摘要卡片列表 */}
      <div className={styles.cardsContainer}>
        {/* 主题摘要卡片 */}
        {hasTopicSummary && (
          <TopicSummaryCard
            data={topic_summary_data}
            onCopy={() => handleCardCopy('主题摘要')}
          />
        )}

        {/* 分章节摘要卡片 */}
        {hasChapterSummary && (
          <ChapterSummaryCard
            data={chapter_summary_data}
            onCopy={() => handleCardCopy('分章节摘要')}
          />
        )}

        {/* 发言人观点卡片 */}
        {hasSpeakerSummary && (
          <SpeakerSummaryCard
            data={speaker_summary_data}
            onCopy={() => handleCardCopy('发言人观点')}
          />
        )}

        {/* 待办事项卡片 */}
        {hasTodos && (
          <TodoCard
            todos={todo_items}
            onCopy={() => handleCardCopy('待办事项')}
          />
        )}
      </div>

      {/* Toast 通知 */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
