/**
 * 格式化工具函数
 * 用于将时长和百分比转换为易读格式
 */

import React from 'react';

/**
 * 格式化时长（毫秒）为易读格式
 * @param milliseconds - 时长（毫秒）
 * @returns 格式化后的时长字符串，如 "1h 23m"、"23m 45s"、"45s"
 *
 * @example
 * formatDuration(4980000) // "1h 23m"
 * formatDuration(1425000) // "23m 45s"
 * formatDuration(45000) // "45s"
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * 格式化百分比，保留两位小数
 * @param percentage - 百分比数值（0-100）
 * @returns 格式化后的百分比字符串，如 "32.45%"
 *
 * @example
 * formatPercentage(32.456) // "32.46%"
 * formatPercentage(100) // "100.00%"
 * formatPercentage(0.5) // "0.50%"
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * 格式化时长（毫秒）为中文格式
 * @param milliseconds - 时长（毫秒）
 * @returns 格式化后的时长字符串，如 "1小时23分钟"、"23分钟45秒"、"45秒"
 *
 * @example
 * formatDurationChinese(4980000) // "1小时23分钟"
 * formatDurationChinese(1425000) // "23分钟45秒"
 * formatDurationChinese(45000) // "45秒"
 */
export function formatDurationChinese(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`;
  } else {
    return `${seconds}秒`;
  }
}

/**
 * 格式化日期时间
 * @param isoString - ISO 格式的日期时间字符串
 * @returns 格式化后的日期时间字符串，如 "2024-01-15 14:30"
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
 * 格式化数字，添加千位分隔符
 * @param num - 数字
 * @returns 格式化后的数字字符串，如 "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化时间（毫秒）为 MM:SS 格式
 * @param milliseconds - 时间（毫秒）
 * @returns 格式化后的时间字符串，如 "05:23"
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 高亮文本中的搜索关键词
 * @param text - 原始文本
 * @param query - 搜索关键词
 * @returns React 元素，高亮匹配的文本
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  try {
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        regex.lastIndex = 0; // Reset regex state
        return React.createElement(
          'mark',
          {
            key: index,
            style: { backgroundColor: '#ffeb3b', padding: '0 2px' },
          },
          part
        );
      }
      return part;
    });
  } catch (error) {
    return text;
  }
}
