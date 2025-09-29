
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer Component', () => {
  beforeEach(() => {
    render(<Footer />);
  });

  it('should render the main heading', () => {
    expect(screen.getByText('AI Job Spot')).toBeInTheDocument();
  });

  it('should render the section headings', () => {
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Legal & Contact')).toBeInTheDocument();
  });

  it('should render quick links correctly', () => {
    expect(screen.getByRole('link', { name: 'AI Jobs' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Articles & Insights' })).toHaveAttribute('href', '/articles');
  });

  it('should render legal links correctly', () => {
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
  });

  it('should render the copyright notice', () => {
    const currentYear = new Date().getFullYear();
    // Use a regex to match the copyright notice, allowing for flexibility
    const copyrightRegex = new RegExp(`© ${currentYear} AI Job Spot. All rights reserved.`, 'i');
    expect(screen.getByText(copyrightRegex)).toBeInTheDocument();
  });
});
