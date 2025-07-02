import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateInstance from '../CreateInstance';
import { instanceService } from '../../services/api';
import { CreateInstanceResponse } from '../../types';

// Mock the API service
jest.mock('../../services/api', () => ({
  instanceService: {
    createInstance: jest.fn(),
  },
}));

const mockInstanceService = instanceService as jest.Mocked<typeof instanceService>;

const mockCreateResponse: CreateInstanceResponse = {
  instance: {
    id: 'test-id',
    instanceName: 'pg-test-001',
    host: 'pg-test-001.postgres.database.azure.com',
    adminUser: 'testadmin',
    password: 'testpass123',
    region: 'eastus',
    createdAt: '2024-01-01T12:00:00Z',
  },
  message: 'Instance created successfully',
  connectionString: 'postgresql://testadmin:testpass123@pg-test-001.postgres.database.azure.com:5432/postgres',
};

describe('CreateInstance Component', () => {
  const mockOnClose = jest.fn();
  const mockOnInstanceCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders create instance modal correctly', () => {
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    expect(screen.getByText('Create New PostgreSQL Instance')).toBeInTheDocument();
    expect(screen.getByText('Free Tier PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText(/what you'll get/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create instance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows features list', () => {
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    expect(screen.getByText(/pre-configured postgresql/i)).toBeInTheDocument();
    expect(screen.getByText(/fully managed with automatic backups/i)).toBeInTheDocument();
    expect(screen.getByText(/ssl-enabled secure connections/i)).toBeInTheDocument();
    expect(screen.getByText(/admin access with full privileges/i)).toBeInTheDocument();
  });

  it('handles cancel button click', async () => {
    const user = userEvent.setup();
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnInstanceCreated).not.toHaveBeenCalled();
  });

  it('handles successful instance creation', async () => {
    const user = userEvent.setup();
    mockInstanceService.createInstance.mockResolvedValue(mockCreateResponse);
    
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    const createButton = screen.getByRole('button', { name: /create instance/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockInstanceService.createInstance).toHaveBeenCalledTimes(1);
    });

    // Should show success state
    expect(screen.getByText('Instance Created!')).toBeInTheDocument();
    expect(screen.getByText('Instance Created Successfully!')).toBeInTheDocument();
    expect(screen.getByText('pg-test-001')).toBeInTheDocument();
    expect(screen.getByText(mockCreateResponse.connectionString)).toBeInTheDocument();
  });

  it('shows loading state during creation', async () => {
    const user = userEvent.setup();
    mockInstanceService.createInstance.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCreateResponse), 100))
    );
    
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    const createButton = screen.getByRole('button', { name: /create instance/i });
    await user.click(createButton);
    
    // Should show loading state
    expect(screen.getByText('Creating your PostgreSQL instance...')).toBeInTheDocument();
    expect(screen.getByText(/this should take just a few seconds/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
  });

  it('handles creation error', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockInstanceService.createInstance.mockRejectedValue({
      response: { data: { error: 'No available instances' } }
    });
    
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    const createButton = screen.getByRole('button', { name: /create instance/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('No available instances')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error creating instance:', expect.any(Object));
    expect(mockOnInstanceCreated).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('handles generic error without response data', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockInstanceService.createInstance.mockRejectedValue(new Error('Network error'));
    
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    const createButton = screen.getByRole('button', { name: /create instance/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create instance. Please try again.')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it('auto-closes after successful creation', async () => {
    const user = userEvent.setup();
    mockInstanceService.createInstance.mockResolvedValue(mockCreateResponse);
    
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    const createButton = screen.getByRole('button', { name: /create instance/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Instance Created Successfully!')).toBeInTheDocument();
    });

    // Fast-forward timer to trigger auto-close
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(mockOnInstanceCreated).toHaveBeenCalledTimes(1);
    });
  });

  it('closes modal with onInstanceCreated when success state is closed', async () => {
    const user = userEvent.setup();
    mockInstanceService.createInstance.mockResolvedValue(mockCreateResponse);
    
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    // Create instance first
    const createButton = screen.getByRole('button', { name: /create instance/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Instance Created Successfully!')).toBeInTheDocument();
    });

    // Close the modal
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    
    expect(mockOnInstanceCreated).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('copies connection string to clipboard', async () => {
    const user = userEvent.setup();
    mockInstanceService.createInstance.mockResolvedValue(mockCreateResponse);
    
    render(<CreateInstance onClose={mockOnClose} onInstanceCreated={mockOnInstanceCreated} />);
    
    // Create instance first
    const createButton = screen.getByRole('button', { name: /create instance/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Instance Created Successfully!')).toBeInTheDocument();
    });

    // Click copy connection string
    const copyButton = screen.getByText('Copy connection string');
    await user.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockCreateResponse.connectionString);
  });
}); 
