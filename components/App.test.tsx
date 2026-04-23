import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const useAppLogicMock = vi.fn();

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hooks/useAppLogic', () => ({
  useAppLogic: (...args: unknown[]) => useAppLogicMock(...args),
}));

vi.mock('./Header', () => ({
  default: () => <div data-testid="header">header</div>,
}));

vi.mock('./MainContent', () => ({
  default: () => (
    <div data-testid="main-content">
      <div data-testid="nested-child">nested child</div>
    </div>
  ),
}));

vi.mock('./StatusBar', () => ({
  default: () => <div data-testid="status-bar">status bar</div>,
}));

vi.mock('./ConfirmationDialog', () => ({
  default: () => null,
}));

vi.mock('./Toast', () => ({
  default: () => null,
}));

function createLogic() {
  return {
    state: {
      isLoading: false,
      isExporting: false,
      progressMessage: '',
      processedData: null,
      stats: { fileCount: 0, totalLines: 0, totalChars: 0 },
      selectedFile: null,
      isDark: false,
      confirmation: { isOpen: false, title: '', message: '', onConfirm: vi.fn() },
      isSearchOpen: false,
      searchResults: [],
      activeResultIndex: null,
      isFileRankOpen: false,
      isSettingsOpen: false,
      isShortcutsOpen: false,
      isSecurityFindingsOpen: false,
      toastMessage: null,
      toastType: 'success' as const,
      activeView: 'structure' as const,
      isDragging: false,
    },
    handlers: {
      setIsDragging: vi.fn(),
      handleDrop: vi.fn((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
      }),
      handleFileSelect: vi.fn(),
      handleCopyAll: vi.fn(),
      handleSave: vi.fn(),
      handleReset: vi.fn(),
      handleCancel: vi.fn(),
      setIsSettingsOpen: vi.fn(),
      setIsSearchOpen: vi.fn(),
      setIsFileRankOpen: vi.fn(),
      setActiveView: vi.fn(),
      setConfirmation: vi.fn(),
      handleSearch: vi.fn(),
      handleNavigate: vi.fn(),
      handleFileTreeSelect: vi.fn(),
      handleCopyPath: vi.fn(),
      handleDeleteFile: vi.fn(),
      handleToggleExclude: vi.fn(),
      setIsShortcutsOpen: vi.fn(),
      setIsSecurityFindingsOpen: vi.fn(),
      setToastMessage: vi.fn(),
      handleSaveEdit: vi.fn(),
      setEditingPath: vi.fn(),
      handleToggleMarkdownPreview: vi.fn(),
    },
    settings: {
      setIsDark: vi.fn(),
      setExtractContent: vi.fn(),
      setFontSize: vi.fn(),
      handleClearCache: vi.fn(),
      setMaxCharsThreshold: vi.fn(),
      setWordWrap: vi.fn(),
      setIncludeFileSummary: vi.fn(),
      setIncludeDirectoryStructure: vi.fn(),
      setExportFormat: vi.fn(),
      setIncludePatterns: vi.fn(),
      setIgnorePatterns: vi.fn(),
      setUseDefaultPatterns: vi.fn(),
      setUseGitignore: vi.fn(),
      setIncludeEmptyDirectories: vi.fn(),
      setShowLineNumbers: vi.fn(),
      setRemoveEmptyLines: vi.fn(),
      setTruncateBase64: vi.fn(),
      setExportSplitMaxChars: vi.fn(),
      setExportHeaderText: vi.fn(),
      setExportInstructionText: vi.fn(),
    },
  };
}

describe('App drag overlay handling', () => {
  beforeEach(() => {
    useAppLogicMock.mockReturnValue(createLogic());
  });

  it('keeps the drag state active while moving between descendants during a file drag', () => {
    render(<App />);

    const root = screen.getByRole('application', { name: 'Structure Insight 代码分析工具' });
    const child = screen.getByTestId('nested-child');
    const setIsDragging = useAppLogicMock.mock.results[0].value.handlers.setIsDragging as ReturnType<typeof vi.fn>;
    const dragData = { dataTransfer: { types: ['Files'] } };

    fireEvent.dragEnter(root, dragData);
    fireEvent.dragEnter(child, dragData);
    fireEvent.dragLeave(child, dragData);

    expect(setIsDragging.mock.calls.map(call => call[0])).toEqual([true, true]);
  });
});
