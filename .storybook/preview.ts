import type { Preview } from '@storybook/react';
import '../src/App.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#F9F9F9' },
        { name: 'dark', value: '#0A192F' },
        { name: 'white', value: '#FFFFFF' },
      ],
    },
    layout: 'padded',
  },
};

export default preview;