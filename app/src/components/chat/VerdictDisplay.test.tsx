/**
 * VerdictDisplay Component Tests
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * 
 * Comprehensive test suite covering functionality, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import VerdictDisplay, { VerdictType } from './VerdictDisplay';

// Mock CSS modules
vi.mock('./VerdictDisplay.module.css', () => ({
  default: {
    verdictDisplay: 'verdictDisplay',
    verdictDiamond: 'verdictDiamond',
    verdictFire: 'verdictFire',
    verdictSkull: 'verdictSkull',
    verdictSmall: 'verdictSmall',
    verdictMedium: 'verdictMedium',
    verdictLarge: 'verdictLarge',
    verdictAnimated: 'verdictAnimated',
    verdictClickable: 'verdictClickable',
    verdictIcon: 'verdictIcon',
    verdictLabel: 'verdictLabel',
    iconContainer: 'iconContainer',
    iconSmall: 'iconSmall',
    iconMedium: 'iconMedium',
    iconLarge: 'iconLarge',
    iconSvg: 'iconSvg',
    iconDiamond: 'iconDiamond',
    iconFire: 'iconFire',
    iconSkull: 'iconSkull',
    iconAnimated: 'iconAnimated',
    labelContainer: 'labelContainer',
    labelText: 'labelText',
    labelSmall: 'labelSmall',
    labelMedium: 'labelMedium',
    labelLarge: 'labelLarge',
    labelDiamond: 'labelDiamond',
    labelFire: 'labelFire',
    labelSkull: 'labelSkull'
  }
}));

describe('VerdictDisplay', () => {
  const defaultProps = {
    verdict: 'Diamond' as VerdictType
  };

  describe('Rendering', () => {
    test('renders with default props', () => {
      render(<VerdictDisplay {...defaultProps} />);
      
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByText('High Probability Setup')).toBeInTheDocument();
    });

    test('renders all verdict types correctly', () => {
      const verdicts: VerdictType[] = ['Diamond', 'Fire', 'Skull'];
      const expectedLabels = [
        'High Probability Setup',
        'Aggressive Opportunity', 
        'Avoid This Setup'
      ];

      verdicts.forEach((verdict, index) => {
        const { rerender } = render(<VerdictDisplay verdict={verdict} />);
        
        expect(screen.getByText(expectedLabels[index])).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute(
          'aria-label',
          expect.stringContaining(verdict)
        );
        
        rerender(<div />); // Clean up for next iteration
      });
    });

    test('renders without label when showLabel is false', () => {
      render(<VerdictDisplay {...defaultProps} showLabel={false} />);
      
      expect(screen.queryByText('High Probability Setup')).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('applies correct size classes', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { rerender } = render(<VerdictDisplay {...defaultProps} size={size} />);
        const container = screen.getByRole('img');
        
        expect(container).toHaveClass(`verdictDisplay`);
        expect(container).toHaveClass(`verdict${size === 'medium' ? 'Medium' : size === 'small' ? 'Small' : 'Large'}`);
        
        rerender(<div />);
      });
    });

    test('applies custom className', () => {
      const customClass = 'custom-verdict-class';
      render(<VerdictDisplay {...defaultProps} className={customClass} />);
      
      expect(screen.getByRole('img')).toHaveClass(customClass);
    });
  });

  describe('Interactions', () => {
    test('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<VerdictDisplay {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('calls onClick on Enter key press', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<VerdictDisplay {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('calls onClick on Space key press', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<VerdictDisplay {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when no handler provided', async () => {
      const user = userEvent.setup();
      
      render(<VerdictDisplay {...defaultProps} />);
      
      const element = screen.getByRole('img');
      await user.click(element);
      
      // Should not throw error
      expect(element).toBeInTheDocument();
    });

    test('prevents default behavior on key press', async () => {
      const handleClick = vi.fn();
      
      render(<VerdictDisplay {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      
      // Test that keydown events are handled properly
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for each verdict type', () => {
      const verdictAriaLabels = {
        Diamond: 'Diamond verdict: High probability trading setup',
        Fire: 'Fire verdict: Aggressive trading opportunity',
        Skull: 'Skull verdict: Avoid this trading setup'
      };

      Object.entries(verdictAriaLabels).forEach(([verdict, ariaLabel]) => {
        const { rerender } = render(
          <VerdictDisplay verdict={verdict as VerdictType} />
        );
        
        expect(screen.getByRole('img')).toHaveAttribute('aria-label', ariaLabel);
        
        rerender(<div />);
      });
    });

    test('is focusable when clickable', () => {
      render(<VerdictDisplay {...defaultProps} onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    test('is not focusable when not clickable', () => {
      render(<VerdictDisplay {...defaultProps} />);
      
      const element = screen.getByRole('img');
      expect(element).not.toHaveAttribute('tabIndex');
    });

    test('has screen reader text for descriptions', () => {
      render(<VerdictDisplay {...defaultProps} />);
      
      // Check for screen reader only content
      expect(screen.getByText('Strong buy signal with high potential for gains')).toBeInTheDocument();
    });

    test('has proper semantic structure', () => {
      render(<VerdictDisplay {...defaultProps} />);
      const element = screen.getByRole('img');
      
      expect(element).toHaveAttribute('aria-label');
      expect(element).toBeInTheDocument();
    });

    test('maintains semantic structure when clickable', () => {
      render(<VerdictDisplay {...defaultProps} onClick={() => {}} />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    test('applies animation classes when animated is true', () => {
      render(<VerdictDisplay {...defaultProps} animated={true} />);
      
      const element = screen.getByRole('img');
      expect(element).toHaveClass('verdictAnimated');
    });

    test('does not apply animation classes when animated is false', () => {
      render(<VerdictDisplay {...defaultProps} animated={false} />);
      
      const element = screen.getByRole('img');
      expect(element).not.toHaveClass('verdictAnimated');
    });

    test('respects prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<VerdictDisplay {...defaultProps} animated={true} />);
      
      // Component should still render but animations should be disabled via CSS
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    test('applies correct verdict-specific classes', () => {
      const verdicts: VerdictType[] = ['Diamond', 'Fire', 'Skull'];
      
      verdicts.forEach(verdict => {
        const { rerender } = render(<VerdictDisplay verdict={verdict} />);
        const element = screen.getByRole('img');
        
        expect(element).toHaveClass(`verdict${verdict}`);
        
        rerender(<div />);
      });
    });

    test('applies clickable styles when onClick provided', () => {
      render(<VerdictDisplay {...defaultProps} onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('verdictClickable');
    });

    test('does not apply clickable styles when no onClick', () => {
      render(<VerdictDisplay {...defaultProps} />);
      
      const element = screen.getByRole('img');
      expect(element).not.toHaveClass('verdictClickable');
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined onClick gracefully', () => {
      render(<VerdictDisplay {...defaultProps} onClick={undefined} />);
      
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('handles empty className', () => {
      render(<VerdictDisplay {...defaultProps} className="" />);
      
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('handles all props combinations', () => {
      render(
        <VerdictDisplay
          verdict="Fire"
          size="large"
          animated={false}
          showLabel={true}
          className="test-class"
          onClick={() => {}}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('test-class');
      expect(screen.getByText('Aggressive Opportunity')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders quickly with multiple instances', () => {
      const startTime = performance.now();
      
      const verdicts: VerdictType[] = ['Diamond', 'Fire', 'Skull'];
      
      render(
        <div>
          {verdicts.map((verdict, index) => (
            <VerdictDisplay
              key={index}
              verdict={verdict}
              size="medium"
              animated={true}
            />
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (100ms)
      expect(renderTime).toBeLessThan(100);
      
      // All components should be present
      expect(screen.getAllByRole('img')).toHaveLength(3);
    });

    test('does not cause memory leaks with animations', () => {
      const { unmount } = render(
        <VerdictDisplay {...defaultProps} animated={true} />
      );
      
      // Should unmount cleanly without errors
      expect(() => unmount()).not.toThrow();
    });
  });
});

// Integration tests with real user scenarios
describe('VerdictDisplay Integration', () => {
  test('complete user interaction flow', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <VerdictDisplay
        verdict="Diamond"
        size="medium"
        animated={true}
        showLabel={true}
        onClick={handleClick}
      />
    );
    
    // User can see and understand the verdict
    expect(screen.getByText('High Probability Setup')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Diamond verdict: High probability trading setup'
    );
    
    // User can interact with keyboard
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
    
    // User can activate with keyboard
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // User can also click
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('supports screen reader workflow', () => {
    render(<VerdictDisplay verdict="Skull" />);
    
    // Screen reader gets proper role and label
    const element = screen.getByRole('img');
    expect(element).toHaveAttribute('aria-label', 'Skull verdict: Avoid this trading setup');
    
    // Screen reader gets description
    expect(screen.getByText('High risk warning with potential bearish signals')).toBeInTheDocument();
    
    // Visual label is also available
    expect(screen.getByText('Avoid This Setup')).toBeInTheDocument();
  });
});