/**
 * KeyMomentsPanel 组件 - 关键时刻面板
 * 显示在右侧边栏，展示会议中的关键决策点和重要节点
 */

import React from 'react';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { useUIState } from '../../contexts/UIStateContext';
import { formatTime } from '../../utils/format';
import styles from './KeyMomentsPanel.module.css';

export function KeyMomentsPanel() {
  const { meetingData } = useMeetingData();
  const { setCurrentTime, setCurrentView } = useUIState();

  if (!meetingData?.critical_nodes || meetingData.critical_nodes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>暂无关键时刻</p>
      </div>
    );
  }

  // 按时间排序
  const sortedNodes = [...meetingData.critical_nodes].sort(
    (a, b) => a.node_time - b.node_time
  );

  const handleNodeClick = (nodeTime: number) => {
    setCurrentTime(nodeTime);
    setCurrentView('transcript');
    // TODO: 滚动到对应的转写位置
  };

  // 根据节点类型返回图标和颜色类
  const getNodeIcon = (nodeType: number): string => {
    switch (nodeType) {
      case 1:
        return '🎯'; // 决策
      case 2:
        return '✅'; // 结论
      case 3:
        return '❓'; // 问题
      default:
        return '⭐'; // 默认
    }
  };

  const getNodeTypeClass = (nodeType: number): string => {
    switch (nodeType) {
      case 1:
        return styles.typeDecision;
      case 2:
        return styles.typeConclusion;
      case 3:
        return styles.typeQuestion;
      default:
        return styles.typeDefault;
    }
  };

  const getNodeTypeLabel = (nodeType: number): string => {
    switch (nodeType) {
      case 1:
        return '决策';
      case 2:
        return '结论';
      case 3:
        return '问题';
      default:
        return '其他';
    }
  };

  return (
    <div className={styles.keyMomentsPanel}>
      <div className={styles.header}>
        <h3 className={styles.title}>关键时刻</h3>
        <span className={styles.count}>
          {meetingData.critical_nodes.length}
        </span>
      </div>

      <div className={styles.momentsList}>
        {sortedNodes.map((node) => (
          <div
            key={node.node_id}
            className={`${styles.momentItem} ${getNodeTypeClass(node.node_type)}`}
            onClick={() => handleNodeClick(node.node_time)}
          >
            <div className={styles.momentHeader}>
              <span className={styles.icon}>{getNodeIcon(node.node_type)}</span>
              <div className={styles.headerContent}>
                <div className={styles.titleRow}>
                  <span className={styles.momentTitle}>{node.title}</span>
                  <span className={styles.typeLabel}>
                    {getNodeTypeLabel(node.node_type)}
                  </span>
                </div>
                <div className={styles.timeRow}>
                  <span className={styles.time}>
                    ⏱ {formatTime(node.node_time)}
                  </span>
                  {node.importance && (
                    <span className={styles.importance}>
                      {'⭐'.repeat(Math.min(node.importance, 5))}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {node.description && (
              <div className={styles.description}>{node.description}</div>
            )}

            {node.participants && node.participants.length > 0 && (
              <div className={styles.participants}>
                <span className={styles.participantsLabel}>参与者: </span>
                {node.participants.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
