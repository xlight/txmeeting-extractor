import React from 'react';
import { TopicSummaryData } from '../../../types/meeting';
import { TopicSummaryCard } from './TopicSummaryCard';

interface QWSummaryCardProps {
  data: TopicSummaryData;
  onCopy?: () => void;
}

export const QWSummaryCard = React.memo<QWSummaryCardProps>(
  (props) => <TopicSummaryCard {...props} />
);

QWSummaryCard.displayName = 'QWSummaryCard';
