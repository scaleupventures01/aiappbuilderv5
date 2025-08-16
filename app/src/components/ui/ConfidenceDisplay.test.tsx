/**
 * ConfidenceDisplay Component Tests
 * PRD Reference: PRD-1.2.8-confidence-percentage-display.md
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfidenceDisplay, getConfidenceLevel } from './ConfidenceDisplay';

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ConfidenceDisplay', () => {
  describe('getConfidenceLevel', () => {
    it('should return correct confidence levels', () => {
      expect(getConfidenceLevel(85)).toBe('high');
      expect(getConfidenceLevel(75)).toBe('high');
      expect(getConfidenceLevel(65)).toBe('medium');
      expect(getConfidenceLevel(50)).toBe('medium');
      expect(getConfidenceLevel(35)).toBe('low');
      expect(getConfidenceLevel(0)).toBe('low');
    });
  });

  describe('Component Rendering', () => {
    it('should render with default props', () => {
      render(<ConfidenceDisplay confidence={75} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should render all variants correctly', () => {
      const { rerender } = render(<ConfidenceDisplay confidence={65} variant="bar" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(<ConfidenceDisplay confidence={65} variant="circular" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(<ConfidenceDisplay confidence={65} variant="text" />);
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should handle different sizes', () => {
      const { rerender } = render(<ConfidenceDisplay confidence={80} size="small" />);
      expect(screen.getByText('80%')).toBeInTheDocument();

      rerender(<ConfidenceDisplay confidence={80} size="medium" />);
      expect(screen.getByText('80%')).toBeInTheDocument();

      rerender(<ConfidenceDisplay confidence={80} size="large" />);
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should clamp confidence values to 0-100 range', () => {
      const { rerender } = render(<ConfidenceDisplay confidence={-10} />);
      expect(screen.getByText('0%')).toBeInTheDocument();

      rerender(<ConfidenceDisplay confidence={150} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ConfidenceDisplay confidence={75} />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-label');
    });

    it('should provide screen reader content', () => {
      render(<ConfidenceDisplay confidence={60} />);
      
      expect(screen.getByText(/AI confidence: 60% - Medium Confidence/)).toBeInTheDocument();
      expect(screen.getByText(/Moderate signal quality/)).toBeInTheDocument();
    });

    it('should accept custom aria label', () => {
      const customLabel = 'Custom confidence indicator';
      render(<ConfidenceDisplay confidence={90} ariaLabel={customLabel} />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', customLabel);
    });
  });

  describe('Color Schemes', () => {
    it('should use verdict color scheme by default', () => {
      render(<ConfidenceDisplay confidence={85} colorScheme="verdict" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should use confidence color scheme when specified', () => {
      render(<ConfidenceDisplay confidence={85} colorScheme="confidence" />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<ConfidenceDisplay confidence={70} compact={true} showLabel={false} />);
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.queryByText('Medium Confidence')).not.toBeInTheDocument();
    });
  });
});