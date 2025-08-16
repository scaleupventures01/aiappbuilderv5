import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import { MessageInput } from '../MessageInput';

// Mock file operations
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('MessageInput', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnTyping = vi.fn();
  const mockOnUploadFile = vi.fn();

  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    placeholder: 'Type your message...',
    maxLength: 1000,
    allowAttachments: true,
    allowMentions: true,
    suggestions: ['trading', 'strategy', 'analysis', 'risk management'],
    onTyping: mockOnTyping,
    onUploadFile: mockOnUploadFile
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUploadFile.mockResolvedValue({ url: 'uploaded-file-url', metadata: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders input field with correct placeholder', () => {
      render(<MessageInput {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    test('renders send button', () => {
      render(<MessageInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    test('renders attachment button when allowed', () => {
      render(<MessageInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Attach file')).toBeInTheDocument();
    });

    test('does not render attachment button when disabled', () => {
      render(<MessageInput {...defaultProps} allowAttachments={false} />);
      
      expect(screen.queryByLabelText('Attach file')).not.toBeInTheDocument();
    });

    test('shows keyboard shortcuts hint', () => {
      render(<MessageInput {...defaultProps} />);
      
      expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
    });
  });

  describe('Message Input Functionality', () => {
    test('updates input value on change', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello world');
      
      expect(input).toHaveValue('Hello world');
    });

    test('sends message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', expect.objectContaining({
        timestamp: expect.any(Number),
        deviceInfo: expect.objectContaining({
          userAgent: expect.any(String),
          platform: expect.any(String),
          language: expect.any(String)
        })
      }));
    });

    test('adds new line on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(input, 'Line 2');
      
      expect(input).toHaveValue('Line 1\nLine 2');
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    test('clears input after sending message', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    test('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '   '); // Only whitespace
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    test('restores message content on send error', async () => {
      const user = userEvent.setup();
      mockOnSendMessage.mockRejectedValue(new Error('Send failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Failed message');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(input).toHaveValue('Failed message');
      });
      
      consoleError.mockRestore();
    });
  });

  describe('Character Limits', () => {
    test('shows character count when approaching limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} maxLength={100} />);
      
      const input = screen.getByRole('textbox');
      const longMessage = 'a'.repeat(85); // 85% of limit
      await user.type(input, longMessage);
      
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    test('shows warning when near limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} maxLength={100} />);
      
      const input = screen.getByRole('textbox');
      const nearLimitMessage = 'a'.repeat(98); // 98% of limit
      await user.type(input, nearLimitMessage);
      
      const counter = screen.getByText('98/100');
      expect(counter).toHaveClass('text-red-500');
    });

    test('prevents input beyond character limit', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} maxLength={10} />);
      
      const input = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(input, 'This is way too long for the limit');
      
      expect(input.value.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Typing Indicators', () => {
    test('calls onTyping when user starts typing', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
    });

    test('stops typing indicator after timeout', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      expect(mockOnTyping).toHaveBeenCalledWith(true);
      
      act(() => {
        vi.advanceTimersByTime(3100); // Just over 3 second timeout
      });
      
      expect(mockOnTyping).toHaveBeenCalledWith(false);
      
      vi.useRealTimers();
    });

    test('shows AI thinking indicator when isTyping is true', () => {
      render(<MessageInput {...defaultProps} isTyping={true} />);
      
      expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
    });
  });

  describe('Suggestions', () => {
    test('shows suggestions when typing matching text', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'tra');
      
      act(() => {
        vi.advanceTimersByTime(350); // Wait for debounce
      });
      
      expect(screen.getByText('trading')).toBeInTheDocument();
      
      vi.useRealTimers();
    });

    test('applies suggestion when clicked', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'tra');
      
      act(() => {
        vi.advanceTimersByTime(350);
      });
      
      const suggestion = screen.getByText('trading');
      await user.click(suggestion);
      
      expect(input).toHaveValue('trading ');
      
      vi.useRealTimers();
    });

    test('navigates suggestions with arrow keys', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      act(() => {
        vi.advanceTimersByTime(350);
      });
      
      // Should show suggestions containing 'a'
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      // Should apply the selected suggestion
      expect(input.value).toContain('analysis ');
      
      vi.useRealTimers();
    });
  });

  describe('File Attachments', () => {
    test('handles file selection', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Attach file').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(fileInput, file);
      
      expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
    });

    test('shows preview for image files', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Attach file').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(fileInput, file);
      
      const preview = screen.getByAltText('test.jpg');
      expect(preview).toHaveAttribute('src', 'mock-url');
    });

    test('shows file type for non-image files', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText('Attach file').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(fileInput, file);
      
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    test('removes attachment when clicking remove button', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Attach file').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(fileInput, file);
      
      const removeButton = screen.getByLabelText('Remove attachment');
      await user.click(removeButton);
      
      expect(screen.queryByAltText('test.jpg')).not.toBeInTheDocument();
    });

    test('uploads files when sending message', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Attach file').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(fileInput, file);
      await user.type(screen.getByRole('textbox'), 'Message with attachment');
      await user.keyboard('{Enter}');
      
      expect(mockOnUploadFile).toHaveBeenCalledWith(file);
      expect(mockOnSendMessage).toHaveBeenCalledWith('Message with attachment', expect.objectContaining({
        attachments: [expect.objectContaining({
          name: 'test.jpg',
          type: 'image/jpeg',
          url: 'uploaded-file-url'
        })]
      }));
    });

    test('handles drag and drop', async () => {
      render(<MessageInput {...defaultProps} />);
      
      const file = new File(['test content'], 'dropped.jpg', { type: 'image/jpeg' });
      const dropZone = screen.getByRole('textbox').closest('div');
      
      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [file] }
      });
      
      expect(screen.getByText('Drop files here to attach')).toBeInTheDocument();
      
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [file] }
      });
      
      expect(screen.getByAltText('dropped.jpg')).toBeInTheDocument();
    });
  });

  describe('Disabled States', () => {
    test('disables input when disabled prop is true', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    test('disables send button when no content', () => {
      render(<MessageInput {...defaultProps} />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    test('enables send button when there is content', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByLabelText('Send message');
      
      await user.type(input, 'Some content');
      
      expect(sendButton).not.toBeDisabled();
    });

    test('shows loading state when sending', async () => {
      const user = userEvent.setup();
      let resolveSend: (value: any) => void;
      const sendPromise = new Promise(resolve => {
        resolveSend = resolve;
      });
      mockOnSendMessage.mockReturnValue(sendPromise);
      
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      // Should show loading spinner
      expect(screen.getByLabelText('Send message')).toBeDisabled();
      
      // Resolve the send promise
      resolveSend!(undefined);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Send message')).not.toBeDisabled();
      });
    });
  });

  describe('Auto-resize', () => {
    test('adjusts textarea height based on content', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox') as HTMLTextAreaElement;
      const initialHeight = input.style.height;
      
      await user.type(input, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
      
      // Height should have increased
      expect(input.style.height).not.toBe(initialHeight);
    });

    test('limits maximum height', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Add many lines
      const manyLines = Array(20).fill('Line').join('\n');
      await user.type(input, manyLines);
      
      // Should not exceed maxHeight
      const height = parseInt(input.style.height);
      expect(height).toBeLessThanOrEqual(150); // maxHeight from component
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<MessageInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
      expect(screen.getByLabelText('Attach file')).toBeInTheDocument();
    });

    test('has proper keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} />);
      
      // Tab through elements
      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Attach file')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Send message')).toHaveFocus();
    });
  });
});