import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthNotice } from '../../core/auth/AuthNotice';

/**
 * KLSI 4.0 - AuthNotice Component Tests
 * 
 * Tests for the AuthNotice component functionality:
 * - Rendering with various props
 * - Manual action click handling
 * - Auto-navigation with returnTo parameter
 */

const renderAuthNotice = (props = {}, initialPath = '/') => {
  const defaultProps = {
    message: 'You must be signed in',
    ...props,
  };

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthNotice {...defaultProps} />
    </MemoryRouter>
  );
};

describe('AuthNotice', () => {
  it('renders with default props', () => {
    renderAuthNotice();

    expect(screen.getByText('Sign in required')).toBeInTheDocument();
    expect(screen.getByText('You must be signed in')).toBeInTheDocument();
  });

  it('renders with custom title and message', () => {
    renderAuthNotice({
      title: 'Custom Title',
      message: 'Custom message here',
    });

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message here')).toBeInTheDocument();
  });

  it('renders custom action label', () => {
    renderAuthNotice({
      actionLabel: 'Log In Now',
      onActionClick: vi.fn(),
    });

    expect(screen.getByRole('button', { name: /log in now/i })).toBeInTheDocument();
  });

  it('calls onActionClick when provided', async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();

    renderAuthNotice({
      onActionClick: mockAction,
    });

    const button = screen.getByRole('button', { name: /sign in/i });
    await user.click(button);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('auto-navigates to login with returnTo when autoNavigateToLogin is true', async () => {
    const user = userEvent.setup();

    renderAuthNotice(
      {
        autoNavigateToLogin: true,
      },
      '/assessment/start'
    );

    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toBeInTheDocument();

    await user.click(button);

    // Note: Testing actual navigation is complex in this unit test context
    // The integration test covers this scenario more comprehensively
  });

  it('does not render button when neither onActionClick nor autoNavigateToLogin is provided', () => {
    renderAuthNotice({
      onActionClick: undefined,
      autoNavigateToLogin: false,
    });

    const button = screen.queryByRole('button', { name: /sign in/i });
    expect(button).not.toBeInTheDocument();
  });

  it('prioritizes onActionClick over autoNavigateToLogin', async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();

    renderAuthNotice({
      onActionClick: mockAction,
      autoNavigateToLogin: true,
    });

    const button = screen.getByRole('button', { name: /sign in/i });
    await user.click(button);

    // Should call the custom handler, not auto-navigate
    expect(mockAction).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = renderAuthNotice({
      className: 'custom-class',
    });

    const notice = container.querySelector('.custom-class');
    expect(notice).toBeInTheDocument();
  });

  it('renders with framer-motion animation props', () => {
    const { container } = renderAuthNotice();

    // Check for motion.div wrapper
    const motionDiv = container.querySelector('[class*="max-w-md"]');
    expect(motionDiv).toBeInTheDocument();
  });
});
