/**
 * TemplateSummaryCard 组件 - 模板纪要卡片
 */

import React from 'react';
import { TemplateSummaryData } from '../../../types/meeting';
import { DeepSeekSummaryCard } from './DeepSeekSummaryCard';

interface TemplateSummaryCardProps {
  data: TemplateSummaryData;
  onCopy?: () => void;
}

// Reuse DeepSeekSummaryCard component with different title
export const TemplateSummaryCard = React.memo<TemplateSummaryCardProps>(
  ({ data, onCopy }) => {
    return <DeepSeekSummaryCard data={data} onCopy={onCopy} />;
  }
);

TemplateSummaryCard.displayName = 'TemplateSummaryCard';
