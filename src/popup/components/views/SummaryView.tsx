/**
 * SummaryView 组件 - 会议纪要视图
 * 展示主题纪要、分章节纪要、发言人观点和待办事项
 */

import React, { useCallback, useMemo } from 'react';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import {
  TopicSummaryCard,
  ChapterSummaryCard,
  SpeakerSummaryCard,
  TodoCard,
  DeepSeekSummaryCard,
  TemplateSummaryCard,
  SummaryPreferencesCard,
  DSV3SummaryCard,
  QWSummaryCard,
  YuanbaoSummaryCard,
  OfficialTemplateSummaryCard,
} from '../cards';
import { Toast } from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import { generateCompleteMinutesMarkdown } from '../../utils/markdown';
import styles from './SummaryView.module.css';

export function SummaryView() {
  console.log('[SummaryView] 组件开始渲染');

  const { meetingData, isLoading } = useMeetingData();
  const { toast, showToast } = useToast();

  console.log('[SummaryView] meetingData:', meetingData);
  console.log('[SummaryView] isLoading:', isLoading);

  // 提取纪要数据
  const {
    topic_summary_data,
    chapter_summary_data,
    speaker_summary_data,
    todo_items,
    deepseek_summary_data,
    template_summary_data,
    summary_preferences,
    dsv3_summary_data,
    qw_summary_data,
    yuanbao_summary_data,
    official_template_summary_data,
  } = meetingData || {};

  // 检查数据可用性
  const hasTopicSummary =
    topic_summary_data && topic_summary_data.summary_status === 2;
  const hasChapterSummary =
    chapter_summary_data && chapter_summary_data.summary_status === 2;
  const hasSpeakerSummary =
    speaker_summary_data && speaker_summary_data.summary_status === 2;
  const hasTodos = todo_items && todo_items.length > 0;
  const hasDeepSeekSummary =
    deepseek_summary_data && deepseek_summary_data.summary_status === 2;
  const hasTemplateSummary =
    template_summary_data && template_summary_data.summary_status === 2;
  const hasSummaryPreferences =
    summary_preferences && summary_preferences.summary_status === 2;
  const hasDSV3Summary =
    dsv3_summary_data && dsv3_summary_data.summary_status === 2;
  const hasQWSummary = qw_summary_data && qw_summary_data.summary_status === 2;
  const hasYuanbaoSummary =
    yuanbao_summary_data && yuanbao_summary_data.summary_status === 2;
  const hasOfficialTemplateSummary =
    official_template_summary_data &&
    official_template_summary_data.status === 2;

  const hasAnyData =
    hasTopicSummary ||
    hasChapterSummary ||
    hasSpeakerSummary ||
    hasTodos ||
    hasDeepSeekSummary ||
    hasTemplateSummary ||
    hasSummaryPreferences ||
    hasDSV3Summary ||
    hasQWSummary ||
    hasYuanbaoSummary ||
    hasOfficialTemplateSummary;

  // 生成完整的 Markdown 纪要
  const completeMarkdown = useMemo(() => {
    if (!meetingData) return '';
    return generateCompleteMinutesMarkdown(
      hasTopicSummary ? topic_summary_data : undefined,
      hasChapterSummary ? chapter_summary_data : undefined,
      hasSpeakerSummary ? speaker_summary_data : undefined,
      hasTodos ? todo_items : undefined,
      hasOfficialTemplateSummary ? official_template_summary_data : undefined
    );
  }, [
    meetingData,
    hasTopicSummary,
    hasChapterSummary,
    hasSpeakerSummary,
    hasTodos,
    hasOfficialTemplateSummary,
    topic_summary_data,
    chapter_summary_data,
    speaker_summary_data,
    todo_items,
    official_template_summary_data,
  ]);

  // 复制全部纪要
  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(completeMarkdown);
      showToast('已复制完整纪要到剪贴板');
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

  // 生成导航项（必须在 early return 之前）
  const navItems = useMemo(() => {
    const items = [];
    if (hasOfficialTemplateSummary)
      items.push({ id: 'official-template', label: '智能总结', icon: '📝' });
    if (hasDeepSeekSummary)
      items.push({ id: 'deepseek', label: 'DeepSeek纪要', icon: '🤖' });
    if (hasTopicSummary)
      items.push({ id: 'topic', label: '主题纪要', icon: '💡' });
    if (hasTemplateSummary)
      items.push({ id: 'template', label: '模板纪要', icon: '📝' });
    if (hasSummaryPreferences)
      items.push({ id: 'preferences', label: '纪要偏好', icon: '⚙️' });
    if (hasDSV3Summary)
      items.push({ id: 'dsv3', label: 'DSV3纪要', icon: '🔷' });
    if (hasQWSummary) items.push({ id: 'qw', label: 'QW纪要', icon: '🔶' });
    if (hasYuanbaoSummary)
      items.push({ id: 'yuanbao', label: '元宝纪要', icon: '💰' });
    if (hasChapterSummary)
      items.push({ id: 'chapter', label: '分章节纪要', icon: '📑' });
    if (hasSpeakerSummary)
      items.push({ id: 'speaker', label: '发言人观点', icon: '👥' });
    if (hasTodos) items.push({ id: 'todo', label: '待办事项', icon: '✅' });
    return items;
  }, [
    hasOfficialTemplateSummary,
    hasDeepSeekSummary,
    hasTopicSummary,
    hasTemplateSummary,
    hasSummaryPreferences,
    hasDSV3Summary,
    hasQWSummary,
    hasYuanbaoSummary,
    hasChapterSummary,
    hasSpeakerSummary,
    hasTodos,
  ]);

  // 滚动到指定锚点（必须在 early return 之前）
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  // 纪要数据全部不可用
  if (!hasAnyData) {
    return (
      <div className={styles.emptyState}>
        <p>暂无会议纪要数据</p>
        <p className={styles.emptyHint}>
          会议纪要可能正在生成中，请稍后刷新页面重试
        </p>
      </div>
    );
  }

  return (
    <div className={styles.summaryView}>
      {/* 头部 */}
      <div className={styles.header}>
        <h2 className={styles.title}>会议纪要</h2>
        <button
          className={styles.copyAllButton}
          onClick={handleCopyAll}
          aria-label="复制完整纪要"
        >
          📋 复制全部纪要
        </button>
      </div>

      {/* 快速导航 */}
      {navItems.length > 1 && (
        <div className={styles.navigation}>
          <div className={styles.navLabel}>快速跳转:</div>
          <div className={styles.navButtons}>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={styles.navButton}
                onClick={() => scrollToSection(item.id)}
                aria-label={`跳转到${item.label}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navText}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 纪要卡片列表 */}
      <div className={styles.cardsContainer}>
        {/* 优先级0: 官方模板纪要（新版 API，最高优先级） */}
        {hasOfficialTemplateSummary && official_template_summary_data && (
          <div id="official-template" className={styles.cardSection}>
            <OfficialTemplateSummaryCard
              data={official_template_summary_data}
              onCopy={() => handleCardCopy('智能总结')}
            />
          </div>
        )}

        {/* 优先级1: DeepSeek纪要 */}
        {hasDeepSeekSummary && (
          <div id="deepseek" className={styles.cardSection}>
            <DeepSeekSummaryCard
              data={deepseek_summary_data}
              onCopy={() => handleCardCopy('DeepSeek纪要')}
            />
          </div>
        )}

        {/* 优先级2: 主题纪要 */}
        {hasTopicSummary && (
          <div id="topic" className={styles.cardSection}>
            <TopicSummaryCard
              data={topic_summary_data}
              onCopy={() => handleCardCopy('主题纪要')}
            />
          </div>
        )}

        {/* 优先级3: 模板纪要 */}
        {hasTemplateSummary && (
          <div id="template" className={styles.cardSection}>
            <TemplateSummaryCard
              data={template_summary_data}
              onCopy={() => handleCardCopy('模板纪要')}
            />
          </div>
        )}

        {/* 优先级4: 纪要偏好设置 */}
        {hasSummaryPreferences && (
          <div id="preferences" className={styles.cardSection}>
            <SummaryPreferencesCard
              data={summary_preferences}
              onCopy={() => handleCardCopy('纪要偏好')}
            />
          </div>
        )}

        {/* 其他AI模型纪要 */}
        {hasDSV3Summary && (
          <div id="dsv3" className={styles.cardSection}>
            <DSV3SummaryCard
              data={dsv3_summary_data}
              onCopy={() => handleCardCopy('DSV3纪要')}
            />
          </div>
        )}

        {hasQWSummary && (
          <div id="qw" className={styles.cardSection}>
            <QWSummaryCard
              data={qw_summary_data}
              onCopy={() => handleCardCopy('QW纪要')}
            />
          </div>
        )}

        {hasYuanbaoSummary && (
          <div id="yuanbao" className={styles.cardSection}>
            <YuanbaoSummaryCard
              data={yuanbao_summary_data}
              onCopy={() => handleCardCopy('元宝纪要')}
            />
          </div>
        )}

        {/* 分章节纪要卡片 */}
        {hasChapterSummary && (
          <div id="chapter" className={styles.cardSection}>
            <ChapterSummaryCard
              data={chapter_summary_data}
              onCopy={() => handleCardCopy('分章节纪要')}
            />
          </div>
        )}

        {/* 发言人观点卡片 */}
        {hasSpeakerSummary && (
          <div id="speaker" className={styles.cardSection}>
            <SpeakerSummaryCard
              data={speaker_summary_data}
              onCopy={() => handleCardCopy('发言人观点')}
            />
          </div>
        )}

        {/* 待办事项卡片 */}
        {hasTodos && (
          <div id="todo" className={styles.cardSection}>
            <TodoCard
              todos={todo_items}
              onCopy={() => handleCardCopy('待办事项')}
            />
          </div>
        )}
      </div>

      {/* Toast 通知 */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
