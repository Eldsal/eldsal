import React from 'react';
import { render } from '@testing-library/react';
import StartPage from './StartPage';

test('renders eldsal link', () => {
  const { getByText } = render(<StartPage />);
  const linkElement = getByText(/Welcome to/i);
  expect(linkElement).toBeInTheDocument();
});
