import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, CardSkeleton, TableSkeleton, DashboardCardSkeleton } from '../src/components/common/Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Common/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    width: '100%',
    height: 20,
  },
};

export const WithCustomStyles: Story = {
  args: {
    width: '60%',
    height: 16,
    borderRadius: 4,
  },
};

export const CardSkeletonStory: Story = {
  render: () => <CardSkeleton showImage lines={3} />,
};

export const TableSkeletonStory: Story = {
  render: () => <TableSkeleton rows={5} cols={4} />,
};

export const DashboardCardStory: Story = {
  render: () => <DashboardCardSkeleton />,
};