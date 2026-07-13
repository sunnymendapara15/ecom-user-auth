import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app headline', () => {
  render(<App />);
  const headline = screen.getByText(/e-commerce user console/i);
  expect(headline).toBeInTheDocument();
});
