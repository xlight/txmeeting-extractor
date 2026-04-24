/**
 * 格式化工具函数
 * 用于将时长、百分比、日期等转换为易读格式
 */

import React from 'react';
import { formatDuration as _formatDuration, formatDurationEn } from '../../utils/format';

// Re-export from shared module
export { formatDurationEn };

/**
 * 格式化时长（毫秒）为中文格式（从共享模块导入）
 */
export const formatDuration = _formatDuration;

/**
 * 格式化百分比，保留两位小数
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    return isoString;
  }
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * 格式化数字，添加千位分隔符
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化时间（毫秒）为 MM:SS 或 HH:MM:SS 格式
 */
export function formatTime(milliseconds: number | undefined | null): string {
  if (
    milliseconds === undefined ||
    milliseconds === null ||
    isNaN(milliseconds) ||
    milliseconds < 0
  ) {
    return '';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 高亮文本中的搜索关键词
 * @returns 数组，匹配部分用 <mark> 包裹
 */
export function highlightText(
  text: string,
  query: string
): (string | React.ReactElement)[] {
  if (!query || !text) return [text];

  try {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (regex.test(part)) {
        return <mark key={i}>{part}</mark>;
      }
      return part;
    });
  } catch {
    return [text];
  }
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
