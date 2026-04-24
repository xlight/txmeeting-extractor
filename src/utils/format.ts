/**
 * 共享格式化工具函数
 * 提供时长格式化等通用功能，供 extractor、popup 等模块使用
 */

/**
 * 格式化时长（毫秒）为中文格式
 * @param milliseconds - 时长（毫秒）
 * @returns 格式化后的时长字符串，如 "1小时23分钟"、"23分钟45秒"、"45秒"
 */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`;
  }
  return `${seconds}秒`;
}

/**
 * 格式化时长（毫秒）为英文格式
 * @param milliseconds - 时长（毫秒）
 * @returns 格式化后的时长字符串，如 "1h 23m"、"23m 45s"、"45s"
 */
export function formatDurationEn(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
