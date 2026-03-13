/**
 * 版本信息获取 Hook
 * 用于从注入的全局变量或通过fetch获取版本信息
 */

import { useState, useEffect } from 'react';

export interface BuildInfo {
  version: string;
  originalVersion: string;
  buildTimestamp: string;
  buildDate: string;
  buildDateLocal: string;
  buildNumber: string;
}

export interface VersionInfo {
  version: string;
  buildInfo: BuildInfo | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 获取版本信息的 Hook
 * 
 * 优先从 window.__TXMEETING_BUILD_INFO__ 获取完整构建信息
 * 如果不存在，则尝试从 version.json 文件获取
 * 最后使用默认值
 * 
 * @returns 版本信息对象
 */
export function useVersionInfo(): VersionInfo {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    version: 'unknown',
    buildInfo: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        // 1. 首先尝试从注入的全局变量获取
        const globalWindow = window as any;
        
        if (globalWindow.__TXMEETING_BUILD_INFO__) {
          const buildInfo = globalWindow.__TXMEETING_BUILD_INFO__ as BuildInfo;
          setVersionInfo({
            version: buildInfo.version,
            buildInfo,
            isLoading: false,
            error: null,
          });
          return;
        }

        // 2. 如果全局变量不存在，尝试从 version.json 获取
        try {
          const response = await fetch(chrome.runtime.getURL('version.json'));
          if (response.ok) {
            const buildInfo = await response.json() as BuildInfo;
            setVersionInfo({
              version: buildInfo.version,
              buildInfo,
              isLoading: false,
              error: null,
            });
            return;
          }
        } catch (fetchError) {
          // version.json 可能不存在，继续使用默认值
          console.debug('[useVersionInfo] version.json 不存在或无法访问');
        }

        // 3. 如果都不存在，使用默认值
        const defaultVersion = globalWindow.__TXMEETING_VERSION__ || '1.0.0-dev';
        setVersionInfo({
          version: defaultVersion,
          buildInfo: null,
          isLoading: false,
          error: '未找到构建信息',
        });
      } catch (error) {
        console.error('[useVersionInfo] 获取版本信息失败:', error);
        setVersionInfo({
          version: 'unknown',
          buildInfo: null,
          isLoading: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    };

    fetchVersionInfo();
  }, []);

  return versionInfo;
}

/**
 * 格式化版本号显示
 * 将 "1.0.0-build.202603130623" 格式化为更友好的显示
 * 
 * @param version - 原始版本号
 * @returns 格式化后的版本号
 */
export function formatVersionDisplay(version: string): string {
  if (!version || version === 'unknown') {
    return '版本未知';
  }

  // 如果是开发版本
  if (version.includes('-dev')) {
    return `${version} (开发版)`;
  }

  // 如果包含构建时间戳
  const buildMatch = version.match(/^(.+)-build\.(\d{12})$/);
  if (buildMatch) {
    const [, baseVersion, timestamp] = buildMatch;
    // 将 YYYYMMDDHHMM 格式转换为可读格式
    const year = timestamp.slice(0, 4);
    const month = timestamp.slice(4, 6);
    const day = timestamp.slice(6, 8);
    const hour = timestamp.slice(8, 10);
    const minute = timestamp.slice(10, 12);
    return `v${baseVersion} (${year}-${month}-${day} ${hour}:${minute})`;
  }

  return `v${version}`;
}

/**
 * 比较两个版本号
 * 
 * @param v1 - 版本号1
 * @param v2 - 版本号2
 * @returns -1 (v1 < v2), 0 (v1 = v2), 1 (v1 > v2)
 */
export function compareVersions(v1: string, v2: string): number {
  // 移除构建后缀进行比较
  const cleanV1 = v1.split('-')[0];
  const cleanV2 = v2.split('-')[0];

  const parts1 = cleanV1.split('.').map(Number);
  const parts2 = cleanV2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}