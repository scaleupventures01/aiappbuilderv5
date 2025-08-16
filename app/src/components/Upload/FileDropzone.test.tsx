// eslint-disable-next-line no-unused-vars
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FileDropzone from './FileDropzone';
import { UploadServiceTestHelper, createTestFile } from '../../test/uploadIntegrationTest';

// Mock the upload service
vi.mock('../../services/uploadService', () => ({
  getUploadService: vi.fn(),
  getUploadServiceStatus: vi.fn(),
  checkUploadServer: vi.fn(),
  getAuthStatus: vi.fn()
}));

describe('FileDropzone Integration Tests', () => {
  let testHelper: UploadServiceTestHelper;
  let mockOnFilesAdded: ReturnType<typeof vi.fn>;
  let mockOnFileRemoved: ReturnType<typeof vi.fn>;
  let mockOnUploadStart: ReturnType<typeof vi.fn>;
  let mockOnUploadProgress: ReturnType<typeof vi.fn>;
  let mockOnUploadComplete: ReturnType<typeof vi.fn>;
  let mockOnUploadError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    testHelper = new UploadServiceTestHelper();
    testHelper.startMocking();

    // Set up mocks
    mockOnFilesAdded = vi.fn();
    mockOnFileRemoved = vi.fn();
    mockOnUploadStart = vi.fn();
    mockOnUploadProgress = vi.fn();
    mockOnUploadComplete = vi.fn();
    mockOnUploadError = vi.fn();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    testHelper.stopMocking();
    vi.clearAllMocks();
  });

  const renderFileDropzone = (props = {}) => {
    return render(
      <FileDropzone
        onFilesAdded={mockOnFilesAdded}
        onFileRemoved={mockOnFileRemoved}
        onUploadStart={mockOnUploadStart}
        onUploadProgress={mockOnUploadProgress}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
        {...props}
      />
    );
  };

  describe('File Upload Integration', () => {
    it('should successfully upload a file and display progress', async () => {
      testHelper.configureMock({ uploadSuccess: true, delay: 100 });
      
      renderFileDropzone();

      // Create and add a test file
      const testFile = createTestFile('test-image.jpg', 'image/jpeg', 1024 * 1024);
      const fileInput = screen.getByLabelText(/browse files/i);
      
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Wait for file to be processed
      await waitFor(() => {
        expect(mockOnFilesAdded).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              file: testFile,
              uploadStatus: 'pending'
            })
          ])
        );
      });

      // Verify upload started
      await waitFor(() => {
        expect(mockOnUploadStart).toHaveBeenCalled();
      });

      // Wait for upload completion
      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Verify progress was tracked
      expect(mockOnUploadProgress).toHaveBeenCalled();
    });

    it('should handle upload errors gracefully', async () => {
      testHelper.configureMock({ serverError: true });
      
      renderFileDropzone();

      const testFile = createTestFile();
      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Wait for error to be handled
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalled();
      });

      // Should display error message
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    it('should retry failed uploads when retry button is clicked', async () => {
      testHelper.configureMock({ serverError: true });
      
      renderFileDropzone();

      const testFile = createTestFile();
      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Configure success for retry
      testHelper.configureMock({ uploadSuccess: true });

      // Click retry button
      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      // Verify retry attempt
      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });

    it('should handle authentication errors and display appropriate message', async () => {
      testHelper.configureMock({ authError: true });
      
      renderFileDropzone();

      const testFile = createTestFile();
      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Wait for auth error handling
      await waitFor(() => {
        expect(screen.getByText(/authentication/i)).toBeInTheDocument();
      });
    });

    it('should display server status correctly', async () => {
      testHelper.setServerOnline(false);
      
      renderFileDropzone();

      // Wait for status check
      await waitFor(() => {
        expect(screen.getByText(/server offline/i)).toBeInTheDocument();
      });

      // Bring server online
      testHelper.setServerOnline(true);
      
      // Trigger status recheck
      const retryButton = screen.getByLabelText(/check server status/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/server online/i)).toBeInTheDocument();
      });
    });

    it('should validate file types and sizes', async () => {
      renderFileDropzone({
        maxFileSizeImages: 1024 * 1024, // 1MB limit
      });

      // Test oversized file
      const oversizedFile = createTestFile('large.jpg', 'image/jpeg', 2 * 1024 * 1024);
      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [oversizedFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/file size must be less than/i)).toBeInTheDocument();
      });

      // Test invalid file type
      const invalidFile = createTestFile('document.exe', 'application/exe', 1024);
      
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/only images.*are allowed/i)).toBeInTheDocument();
      });
    });

    it('should handle multiple file uploads', async () => {
      testHelper.configureMock({ uploadSuccess: true });
      
      renderFileDropzone({ maxFiles: 3 });

      const files = [
        createTestFile('file1.jpg'),
        createTestFile('file2.png'),
        createTestFile('file3.gif')
      ];

      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: files,
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Should process all files
      await waitFor(() => {
        expect(mockOnFilesAdded).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ file: files[0] }),
            expect.objectContaining({ file: files[1] }),
            expect.objectContaining({ file: files[2] })
          ])
        );
      });

      // Should display file count
      expect(screen.getByText(/3\/3 files selected/i)).toBeInTheDocument();
    });

    it('should queue uploads when server is offline', async () => {
      testHelper.setServerOnline(false);
      testHelper.configureMock({ networkFailure: true });
      
      renderFileDropzone();

      const testFile = createTestFile();
      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Should show queued status
      await waitFor(() => {
        expect(screen.getByText(/connection error.*will retry when server is available/i)).toBeInTheDocument();
      });

      // Bring server back online
      testHelper.setServerOnline(true);
      testHelper.configureMock({ uploadSuccess: true });

      // Should eventually process queued upload
      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderFileDropzone();

      // Check dropzone accessibility
      const dropzone = screen.getByRole('button');
      expect(dropzone).toHaveAttribute('aria-label');
      expect(dropzone).toHaveAttribute('aria-describedby');

      // Check file input accessibility
      const fileInput = screen.getByLabelText(/browse files/i);
      expect(fileInput).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderFileDropzone();

      const dropzone = screen.getByRole('button');
      
      // Should be focusable
      dropzone.focus();
      expect(dropzone).toHaveFocus();

      // Should respond to Enter key
      fireEvent.keyDown(dropzone, { key: 'Enter' });
      // Verify file input is triggered (would need to mock click)
    });

    it('should announce progress updates to screen readers', async () => {
      testHelper.configureMock({ uploadSuccess: true, delay: 100 });
      
      renderFileDropzone();

      const testFile = createTestFile();
      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Should have progress bar with proper attributes
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });
  });

  describe('Error Recovery', () => {
    it('should clear errors when new files are added', async () => {
      renderFileDropzone();

      // Create validation error first
      const invalidFile = createTestFile('test.exe', 'application/exe');
      const fileInput = screen.getByLabelText(/browse files/i);
      
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/only images.*are allowed/i)).toBeInTheDocument();
      });

      // Add valid file
      const validFile = createTestFile('valid.jpg', 'image/jpeg');
      
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/only images.*are allowed/i)).not.toBeInTheDocument();
      });
    });

    it('should handle network recovery gracefully', async () => {
      testHelper.configureMock({ networkFailure: true });
      
      renderFileDropzone();

      // Should show connection error initially
      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      });

      // Restore network
      testHelper.configureMock({ uploadSuccess: true });

      // Click retry connection
      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      // Should clear connection errors
      await waitFor(() => {
        expect(screen.queryByText(/connection error/i)).not.toBeInTheDocument();
      });
    });
  });
});