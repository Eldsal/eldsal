import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders eldsal link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Welcome to/i);
  expect(linkElement).toBeInTheDocument();
});
