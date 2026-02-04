/**
 * ChaptersView 组件 - 会议统计视图
 * 使用图表展示三类统计数据：智能话题、参会人员发言时长、会议章节
 */

import React, { useCallback, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { formatDuration, formatPercentage } from '../../utils/format';
import type {
  TopicInfo,
  ParticipantSpeakingTime,
  ChapterInfo,
} from '../../../types/meeting';
import styles from './ChaptersView.module.css';

// 图表配色方案
const COLORS = [
  '#3b82f6', // 蓝色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#f59e0b', // 橙色
  '#10b981', // 绿色
  '#06b6d4', // 青色
  '#f43f5e', // 红色
  '#8b5cf6', // 紫色
  '#6366f1', // 靛蓝
  '#14b8a6', // 蓝绿
];

export function ChaptersView() {
  const { meetingData, isLoading } = useMeetingData();

  // 从会议数据中获取统计信息
  const statistics = meetingData?.statistics || {
    topics: [],
    participants: [],
    chapters: [],
  };

  // 检查数据可用性
  const hasTopics = statistics.topics.length > 0;
  const hasParticipants = statistics.participants.length > 0;
  const hasChapters = statistics.chapters.length > 0;
  const hasAnyData = hasTopics || hasParticipants || hasChapters;

  // 生成导航项
  const navItems = useMemo(() => {
    const items = [];
    if (hasTopics) items.push({ id: 'topics', label: '智能话题', icon: '🏷️' });
    if (hasParticipants)
      items.push({ id: 'participants', label: '参会人员发言', icon: '👥' });
    if (hasChapters)
      items.push({ id: 'chapters', label: '会议章节', icon: '📑' });
    return items;
  }, [hasTopics, hasParticipants, hasChapters]);

  // 滚动到指定锚点
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className={styles.emptyState}>
        <p>暂无会议数据</p>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className={styles.emptyState}>
        <p>暂无统计数据</p>
        <p className={styles.emptyHint}>请等待会议数据加载完成</p>
      </div>
    );
  }

  return (
    <div className={styles.chaptersView}>
      {/* 头部 */}
      <div className={styles.header}>
        <h2 className={styles.title}>📊 会议统计</h2>
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

      {/* 统计内容容器 */}
      <div className={styles.contentContainer}>
        {/* 智能话题统计 */}
        {hasTopics && (
          <div id="topics" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🏷️</span>
              <h3 className={styles.sectionTitle}>
                智能话题 ({statistics.topics.length})
              </h3>
            </div>
            <div className={styles.sectionContent}>
              <TopicsChart topics={statistics.topics} />
            </div>
          </div>
        )}

        {/* 参会人员发言统计 */}
        {hasParticipants && (
          <div id="participants" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>👥</span>
              <h3 className={styles.sectionTitle}>
                参会人员发言 ({statistics.participants.length})
              </h3>
            </div>
            <div className={styles.sectionContent}>
              <ParticipantsChart participants={statistics.participants} />
            </div>
          </div>
        )}

        {/* 会议章节统计 */}
        {hasChapters && (
          <div id="chapters" className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📑</span>
              <h3 className={styles.sectionTitle}>
                会议章节 ({statistics.chapters.length})
              </h3>
            </div>
            <div className={styles.sectionContent}>
              <ChaptersChart chapters={statistics.chapters} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 智能话题图表 ====================

interface TopicsChartProps {
  topics: TopicInfo[];
}

function TopicsChart({ topics }: TopicsChartProps) {
  // 只显示前10个话题，避免图表过于拥挤
  const displayTopics = topics.slice(0, 10);

  // 自定义工具提示
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.chartTooltip}>
          <p className={styles.tooltipTitle}>{data.name}</p>
          <p className={styles.tooltipValue}>
            时长: {formatDuration(data.duration)}
          </p>
          <p className={styles.tooltipPercentage}>
            占比: {formatPercentage(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  // 自定义标签
  const renderLabel = (entry: any) => {
    if (entry.percentage > 3) {
      return `${entry.percentage.toFixed(1)}%`;
    }
    return '';
  };

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={displayTopics}
            dataKey="percentage"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={renderLabel}
            labelLine={false}
          >
            {displayTopics.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: string) => {
              // 截断过长的话题名称
              return value.length > 12 ? value.substring(0, 12) + '...' : value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {topics.length > 10 && (
        <div className={styles.chartNote}>
          * 仅显示前 10 个话题，共 {topics.length} 个
        </div>
      )}
    </div>
  );
}

// ==================== 参会人员图表 ====================

interface ParticipantsChartProps {
  participants: ParticipantSpeakingTime[];
}

function ParticipantsChart({ participants }: ParticipantsChartProps) {
  // 准备图表数据（转换为分钟）
  const chartData = participants.map((p) => ({
    name: p.name,
    time: Math.round(p.totalTime / 60000), // 转换为分钟
    percentage: p.percentage,
    avatarUrl: p.avatarUrl,
  }));

  // 自定义工具提示
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.chartTooltip}>
          <div className={styles.tooltipHeader}>
            {data.avatarUrl && (
              <img
                src={data.avatarUrl}
                alt={data.name}
                className={styles.tooltipAvatar}
              />
            )}
            <p className={styles.tooltipTitle}>{data.name}</p>
          </div>
          <p className={styles.tooltipValue}>发言时长: {data.time} 分钟</p>
          <p className={styles.tooltipPercentage}>
            占比: {formatPercentage(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer
        width="100%"
        height={Math.max(400, participants.length * 40)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" />
          <YAxis
            type="category"
            dataKey="name"
            width={70}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="time" name="发言时长(分钟)" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==================== 会议章节图表 ====================

interface ChaptersChartProps {
  chapters: ChapterInfo[];
}

function ChaptersChart({ chapters }: ChaptersChartProps) {
  // 准备图表数据（累积时间轴）
  const chartData = chapters.map((chapter, index) => {
    const startMinute = Math.round(chapter.startTime / 60000);
    const endMinute = Math.round(chapter.endTime / 60000);

    return {
      index: index + 1,
      name: `第${index + 1}章`,
      title: chapter.title,
      start: startMinute,
      end: endMinute,
      duration: Math.round(chapter.duration / 60000),
      percentage: chapter.percentage,
    };
  });

  // 自定义工具提示
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.chartTooltip}>
          <p className={styles.tooltipTitle}>
            {data.name}: {data.title}
          </p>
          <p className={styles.tooltipValue}>时长: {data.duration} 分钟</p>
          <p className={styles.tooltipPercentage}>
            占比: {formatPercentage(data.percentage)}
          </p>
          <p className={styles.tooltipTime}>
            开始: {data.start} 分钟 → 结束: {data.end} 分钟
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="index"
            label={{ value: '章节', position: 'insideBottom', offset: -5 }}
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: '时长(分钟)', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="duration"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDuration)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* 章节详细列表 */}
      <div className={styles.chaptersList}>
        {chapters.map((chapter, index) => (
          <div key={chapter.id} className={styles.chapterItem}>
            <div className={styles.chapterHeader}>
              <span className={styles.chapterNumber}>第 {index + 1} 章</span>
              <span className={styles.chapterTitle}>{chapter.title}</span>
            </div>
            <div className={styles.chapterMeta}>
              <span className={styles.chapterDuration}>
                ⏱️ {formatDuration(chapter.duration)}
              </span>
              <span className={styles.chapterPercentage}>
                📊 {formatPercentage(chapter.percentage)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
