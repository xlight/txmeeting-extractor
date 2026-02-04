import React from 'react';
import { TopicSummaryData } from '../../../types/meeting';
import { TopicSummaryCard } from './TopicSummaryCard';

interface YuanbaoSummaryCardProps {
  data: TopicSummaryData;
  onCopy?: () => void;
}

export const YuanbaoSummaryCard = React.memo<YuanbaoSummaryCardProps>(
  (props) => <TopicSummaryCard {...props} />
);

YuanbaoSummaryCard.displayName = 'YuanbaoSummaryCard';
