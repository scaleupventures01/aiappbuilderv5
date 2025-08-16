/**
 * VerdictDisplay Component Tests
 * PRD Reference: PRD-1.2.7-verdict-display-system.md
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerdictDisplay, VerdictData, VerdictType } from '../VerdictDisplay';

// Mock matchMedia for animation tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('VerdictDisplay', () => {
  const mockVerdictData: VerdictData = {
    verdict: 'Diamond',
    confidence: 85,
    reasoning: 'Strong bullish indicators detected with high volume.',
    processingTime: 1250,
    timestamp: '2024-01-15T10:30:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Verdict Types', () => {
    test('renders Diamond verdict correctly', () => {
      render(<VerdictDisplay data={{ ...mockVerdictData, verdict: 'Diamond' }} />);
      
      expect(screen.getByText('💎 Strong Buy Signal')).toBeInTheDocument();
      expect(screen.getByText('High potential for significant gains')).toBeInTheDocument();
      expect(screen.getByLabelText('Diamond verdict: Strong buy signal')).toBeInTheDocument();
    });

    test('renders Fire verdict correctly', () => {
      render(<VerdictDisplay data={{ ...mockVerdictData, verdict: 'Fire' }} />);
      
      expect(screen.getByText('🔥 Hot Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Moderate bullish momentum detected')).toBeInTheDocument();
      expect(screen.getByLabelText('Fire verdict: Hot opportunity')).toBeInTheDocument();
    });

    test('renders Skull verdict correctly', () => {
      render(<VerdictDisplay data={{ ...mockVerdictData, verdict: 'Skull' }} />);
      
      expect(screen.getByText('💀 High Risk Warning')).toBeInTheDocument();
      expect(screen.getByText('Potential bearish signals detected')).toBeInTheDocument();
      expect(screen.getByLabelText('Skull verdict: High risk warning')).toBeInTheDocument();
    });
  });

  describe('Confidence Display', () => {
    test('displays confidence percentage correctly', () => {
      render(<VerdictDisplay data={mockVerdictData} />);
      
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Confidence')).toBeInTheDocument();
    });

    test('confidence bar has correct ARIA attributes', () => {
      render(<VerdictDisplay data={mockVerdictData} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Confidence level: 85 percent');
    });
  });

  describe('Size Variants', () => {
    test('renders small size correctly', () => {
      render(<VerdictDisplay data={mockVerdictData} size="small" />);
      
      const container = screen.getByLabelText('Diamond verdict: Strong buy signal');
      expect(container).toHaveClass('p-2');
    });

    test('renders medium size correctly', () => {
      render(<VerdictDisplay data={mockVerdictData} size="medium" />);
      
      const container = screen.getByLabelText('Diamond verdict: Strong buy signal');
      expect(container).toHaveClass('p-3');
    });

    test('renders large size correctly', () => {
      render(<VerdictDisplay data={mockVerdictData} size="large" />);
      
      const container = screen.getByLabelText('Diamond verdict: Strong buy signal');
      expect(container).toHaveClass('p-4');
    });
  });

  describe('Compact Mode', () => {
    test('renders compact layout correctly', () => {
      render(<VerdictDisplay data={mockVerdictData} compact={true} />);
      
      expect(screen.getByText('💎 Strong Buy Signal')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      
      // Should not show full description in compact mode
      expect(screen.queryByText('High potential for significant gains')).not.toBeInTheDocument();
    });
  });

  describe('Details Display', () => {
    test('shows details when showDetails is true', () => {
      render(<VerdictDisplay data={mockVerdictData} showDetails={true} />);
      
      expect(screen.getByText('Strong bullish indicators detected with high volume.')).toBeInTheDocument();
      expect(screen.getByText('Processed in 1250ms')).toBeInTheDocument();
    });

    test('hides details when showDetails is false', () => {
      render(<VerdictDisplay data={mockVerdictData} showDetails={false} />);
      
      expect(screen.queryByText('Strong bullish indicators detected with high volume.')).not.toBeInTheDocument();
      expect(screen.queryByText('Processed in 1250ms')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('calls onVerdictClick when clicked', () => {
      const onVerdictClick = jest.fn();
      render(<VerdictDisplay data={mockVerdictData} onVerdictClick={onVerdictClick} />);
      
      const container = screen.getByRole('button');
      fireEvent.click(container);
      
      expect(onVerdictClick).toHaveBeenCalledWith(mockVerdictData);
    });

    test('calls onVerdictClick when Enter key is pressed', () => {
      const onVerdictClick = jest.fn();
      render(<VerdictDisplay data={mockVerdictData} onVerdictClick={onVerdictClick} />);
      
      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: 'Enter' });
      
      expect(onVerdictClick).toHaveBeenCalledWith(mockVerdictData);
    });

    test('calls onVerdictClick when Space key is pressed', () => {
      const onVerdictClick = jest.fn();
      render(<VerdictDisplay data={mockVerdictData} onVerdictClick={onVerdictClick} />);
      
      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: ' ' });
      
      expect(onVerdictClick).toHaveBeenCalledWith(mockVerdictData);
    });

    test('does not respond to other key presses', () => {
      const onVerdictClick = jest.fn();
      render(<VerdictDisplay data={mockVerdictData} onVerdictClick={onVerdictClick} />);
      
      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: 'Escape' });
      
      expect(onVerdictClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<VerdictDisplay data={mockVerdictData} />);
      
      const container = screen.getByLabelText('Diamond verdict: Strong buy signal');
      expect(container).toHaveAttribute('role', 'region');
    });

    test('has proper ARIA attributes when clickable', () => {
      const onVerdictClick = jest.fn();
      render(<VerdictDisplay data={mockVerdictData} onVerdictClick={onVerdictClick} />);
      
      const container = screen.getByRole('button');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    test('includes screen reader only content', () => {
      render(<VerdictDisplay data={mockVerdictData} />);
      
      const srContent = screen.getByText((content, element) => {
        return element?.className === 'sr-only' && 
               content.includes('Verdict: Diamond, Confidence: 85 percent');
      });
      expect(srContent).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    test('respects prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion: reduce
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<VerdictDisplay data={mockVerdictData} animated={true} />);
      
      // Component should still render but without animations
      expect(screen.getByText('💎 Strong Buy Signal')).toBeInTheDocument();
    });

    test('disables animations when animated prop is false', () => {
      render(<VerdictDisplay data={mockVerdictData} animated={false} />);
      
      expect(screen.getByText('💎 Strong Buy Signal')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing optional data gracefully', () => {
      const minimalData: VerdictData = {
        verdict: 'Fire',
        confidence: 75
      };
      
      render(<VerdictDisplay data={minimalData} />);
      
      expect(screen.getByText('🔥 Hot Opportunity')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    test('handles zero confidence', () => {
      const zeroConfidenceData: VerdictData = {
        verdict: 'Skull',
        confidence: 0
      };
      
      render(<VerdictDisplay data={zeroConfidenceData} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('handles 100% confidence', () => {
      const perfectConfidenceData: VerdictData = {
        verdict: 'Diamond',
        confidence: 100
      };
      
      render(<VerdictDisplay data={perfectConfidenceData} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    test('applies custom className', () => {
      render(<VerdictDisplay data={mockVerdictData} className="custom-verdict" />);
      
      const container = screen.getByLabelText('Diamond verdict: Strong buy signal');
      expect(container).toHaveClass('custom-verdict');
    });

    test('applies verdict-specific color classes', () => {
      const { rerender } = render(<VerdictDisplay data={{ ...mockVerdictData, verdict: 'Diamond' }} />);
      let container = screen.getByLabelText('Diamond verdict: Strong buy signal');
      expect(container).toHaveClass('bg-emerald-50');

      rerender(<VerdictDisplay data={{ ...mockVerdictData, verdict: 'Fire' }} />);
      container = screen.getByLabelText('Fire verdict: Hot opportunity');
      expect(container).toHaveClass('bg-orange-50');

      rerender(<VerdictDisplay data={{ ...mockVerdictData, verdict: 'Skull' }} />);
      container = screen.getByLabelText('Skull verdict: High risk warning');
      expect(container).toHaveClass('bg-red-50');
    });
  });
});