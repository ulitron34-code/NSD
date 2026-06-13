import type { Meta, StoryObj } from '@storybook/react';
import Breadcrumbs from '../src/components/common/Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Common/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {},
};

export const WithCustomItems: Story = {
  args: {
    customItems: [
      { path: '/', label: 'Inicio', icon: '🏠', isLast: false },
      { path: '/dashboard', label: 'Dashboard', icon: '📊', isLast: false },
      { path: '/dashboard/orders', label: 'Órdenes', icon: '📋', isLast: true },
    ],
  },
};

export const SimplePath: Story = {
  args: {},
  parameters: {
    initialPath: '/dashboard/orders',
  },
};