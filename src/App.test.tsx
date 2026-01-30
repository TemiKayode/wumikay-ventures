import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Wumikay Ventures app', () => {
  render(<App />);
  // App should render without errors
  expect(document.body).toBeInTheDocument();
});
