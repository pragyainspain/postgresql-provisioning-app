import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { authService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  authService: {
    getGitHubAuthUrl: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Helper to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock onLogin function
const mockOnLogin = jest.fn();

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders login page with GitHub button', () => {
    renderWithRouter(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByText('PostgreSQL Cloud')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
  });

  it('displays features list correctly', () => {
    renderWithRouter(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByText(/instant provisioning/i)).toBeInTheDocument();
    expect(screen.getByText(/secure github authentication/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 3 free postgresql instances/i)).toBeInTheDocument();
  });

  it('handles GitHub login button click', async () => {
    const mockAuthUrl = 'https://github.com/login/oauth/authorize?client_id=test';
    mockAuthService.getGitHubAuthUrl.mockResolvedValue({ authUrl: mockAuthUrl });

    renderWithRouter(<Login onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: /continue with github/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockAuthService.getGitHubAuthUrl).toHaveBeenCalledTimes(1);
    });

    expect(window.location.href).toBe(mockAuthUrl);
  });

  it('shows loading state during authentication', async () => {
    mockAuthService.getGitHubAuthUrl.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ authUrl: 'test' }), 100))
    );

    renderWithRouter(<Login onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: /continue with github/i });
    fireEvent.click(loginButton);

    // Should show loading spinner
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveClass('disabled:bg-gray-400');
  });

  it('handles authentication error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthService.getGitHubAuthUrl.mockRejectedValue(new Error('Auth failed'));

    renderWithRouter(<Login onLogin={mockOnLogin} />);
    
    const loginButton = screen.getByRole('button', { name: /continue with github/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
    });

    // Button should be enabled again after error
    expect(loginButton).not.toBeDisabled();
    
    consoleSpy.mockRestore();
  });
});
