/**
 * MinutesView 组件 - 会议纪要视图
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { generateMarkdownMinutes } from '../../utils/minutes';
import styles from './MinutesView.module.css';

export function MinutesView() {
  const { meetingData, isLoading } = useMeetingData();

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

  const minutesContent = generateMarkdownMinutes(meetingData);

  return (
    <div className={styles.minutesView}>
      <div className={styles.header}>
        <h2 className={styles.title}>会议纪要</h2>
        <button
          className={styles.copyButton}
          onClick={() => {
            navigator.clipboard.writeText(minutesContent);
          }}
        >
          📋 复制纪要
        </button>
      </div>

      <div className={styles.content}>
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className={styles.h1} {...props} />,
            h2: ({ node, ...props }) => <h2 className={styles.h2} {...props} />,
            h3: ({ node, ...props }) => <h3 className={styles.h3} {...props} />,
            ul: ({ node, ...props }) => <ul className={styles.ul} {...props} />,
            ol: ({ node, ...props }) => <ol className={styles.ol} {...props} />,
            li: ({ node, ...props }) => <li className={styles.li} {...props} />,
            p: ({ node, ...props }) => <p className={styles.p} {...props} />,
            strong: ({ node, ...props }) => (
              <strong className={styles.strong} {...props} />
            ),
            em: ({ node, ...props }) => <em className={styles.em} {...props} />,
          }}
        >
          {minutesContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
