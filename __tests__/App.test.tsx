/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-webview', () => {
  const {View} = require('react-native');
  return {WebView: View};
});

import App from '../App';

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    renderer.unmount();
  });
});
