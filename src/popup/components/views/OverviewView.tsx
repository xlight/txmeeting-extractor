/**
 * OverviewView 组件 - 概览视图
 */

import React from 'react';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import {
  formatDateTime,
  formatDuration,
  formatNumber,
} from '../../utils/format';
import styles from './OverviewView.module.css';

export function OverviewView() {
  const { meetingData, isLoading, error } = useMeetingData();

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>❌ {error}</p>
        <p className={styles.errorHint}>请访问腾讯会议录制页面后重试</p>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className={styles.emptyState}>
        <p>暂无会议数据</p>
        <p className={styles.emptyHint}>请访问腾讯会议录制页面以加载数据</p>
      </div>
    );
  }

  const {
    metadata,
    summary,
    transcript,
    participants,
    chapters,
    todo_list,
    todo_items,
    critical_nodes,
    smart_topics,
    topic_summary_data,
    chapter_summary_data,
    speaker_summary_data,
  } = meetingData;

  // 计算统计数据
  const transcriptWordCount =
    transcript?.reduce((sum, item) => sum + item.text.length, 0) || 0;
  const participantsCount = participants?.length || 0;
  const chaptersCount = chapters?.length || 0;
  const todoCount = (todo_items?.length || 0) + (todo_list?.length || 0);
  const criticalNodesCount = critical_nodes?.length || 0;
  const topicsCount = smart_topics?.length || 0;

  // 检查新纪要数据是否可用
  const hasTopicSummary = topic_summary_data?.summary_status === 2;
  const hasChapterSummary = chapter_summary_data?.summary_status === 2;
  const hasSpeakerSummary = speaker_summary_data?.summary_status === 2;

  return (
    <div className={styles.overviewView}>
      {/* 会议基本信息 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>📋 会议信息</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>会议标题:</span>
            <span className={styles.infoValue}>
              {metadata.title || '未知会议'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>开始时间:</span>
            <span className={styles.infoValue}>
              {metadata.start_time
                ? formatDateTime(new Date(metadata.start_time).toISOString())
                : '-'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>会议时长:</span>
            <span className={styles.infoValue}>
              {metadata.duration ? formatDuration(metadata.duration) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* AI 纪要 */}
      {summary && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>✨ AI 纪要</h2>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}

      {/* 统计数据 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>📊 统计数据</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {formatNumber(transcriptWordCount)}
            </div>
            <div className={styles.statLabel}>转写字数</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{participantsCount}</div>
            <div className={styles.statLabel}>参与人数</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{chaptersCount}</div>
            <div className={styles.statLabel}>章节数量</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{topicsCount}</div>
            <div className={styles.statLabel}>智能话题</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{todoCount}</div>
            <div className={styles.statLabel}>待办事项</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{criticalNodesCount}</div>
            <div className={styles.statLabel}>关键时刻</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{transcript?.length || 0}</div>
            <div className={styles.statLabel}>转写段落</div>
          </div>
        </div>
      </div>

      {/* AI 纪要状态 */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>🤖 AI 纪要状态</h2>
        <div className={styles.summaryStatus}>
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>
              {hasTopicSummary ? '✅' : '⏳'}
            </span>
            <span className={styles.statusLabel}>主题纪要</span>
            <span className={styles.statusValue}>
              {hasTopicSummary ? '已生成' : '待生成'}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>
              {hasChapterSummary ? '✅' : '⏳'}
            </span>
            <span className={styles.statusLabel}>分章节纪要</span>
            <span className={styles.statusValue}>
              {hasChapterSummary
                ? `${chapter_summary_data?.summary_list?.length || 0} 章`
                : '待生成'}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>
              {hasSpeakerSummary ? '✅' : '⏳'}
            </span>
            <span className={styles.statusLabel}>发言人观点</span>
            <span className={styles.statusValue}>
              {hasSpeakerSummary
                ? `${speaker_summary_data?.speakers_opinions?.length || 0} 人`
                : '待生成'}
            </span>
          </div>
        </div>
      </div>

      {/* 智能话题预览 */}
      {smart_topics && smart_topics.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🔖 智能话题</h2>
          <div className={styles.topicsList}>
            {smart_topics.slice(0, 5).map((topic, index) => (
              <div key={topic.topic_id} className={styles.topicItem}>
                <div className={styles.topicHeader}>
                  <span className={styles.topicNumber}>#{index + 1}</span>
                  <span className={styles.topicName}>{topic.topic_name}</span>
                </div>
                <div className={styles.topicMeta}>
                  <span className={styles.topicPercentage}>
                    占比 {(topic.percentage * 100).toFixed(1)}%
                  </span>
                  <span className={styles.topicSegments}>
                    {topic.scope.length} 个片段
                  </span>
                </div>
              </div>
            ))}
            {smart_topics.length > 5 && (
              <div className={styles.moreTopics}>
                还有 {smart_topics.length - 5} 个话题...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
