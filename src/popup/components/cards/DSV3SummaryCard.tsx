import React from 'react';
import { TopicSummaryData } from '../../../types/meeting';
import { TopicSummaryCard } from './TopicSummaryCard';

interface DSV3SummaryCardProps {
  data: TopicSummaryData;
  onCopy?: () => void;
}

export const DSV3SummaryCard = React.memo<DSV3SummaryCardProps>(
  (props) => <TopicSummaryCard {...props} />
);

DSV3SummaryCard.displayName = 'DSV3SummaryCard';
