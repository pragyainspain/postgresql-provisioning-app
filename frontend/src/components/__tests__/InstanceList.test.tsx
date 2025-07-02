import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstanceList from '../InstanceList';
import { InstanceMetadata } from '../../types';
import { instanceService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  instanceService: {
    deleteInstance: jest.fn(),
  },
}));

const mockInstanceService = instanceService as jest.Mocked<typeof instanceService>;

// Mock window.confirm
const originalConfirm = window.confirm;
beforeAll(() => {
  window.confirm = jest.fn();
});

afterAll(() => {
  window.confirm = originalConfirm;
});

const mockInstances: InstanceMetadata[] = [
  {
    id: '1',
    instanceName: 'pg-test-001',
    host: 'pg-test-001.postgres.database.azure.com',
    adminUser: 'testadmin',
    password: 'testpass123',
    region: 'eastus',
    createdAt: '2024-01-01T12:00:00Z',
  },
  {
    id: '2',
    instanceName: 'pg-test-002',
    host: 'pg-test-002.postgres.database.azure.com',
    adminUser: 'testadmin2',
    password: 'testpass456',
    region: 'westus',
    createdAt: '2024-01-02T12:00:00Z',
  },
];

describe('InstanceList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  it('renders empty state when no instances', () => {
    const mockOnInstanceDeleted = jest.fn();
    render(<InstanceList instances={[]} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    expect(screen.getByText('No PostgreSQL instances')).toBeInTheDocument();
    expect(screen.getByText(/haven't created any postgresql instances yet/i)).toBeInTheDocument();
  });

  it('renders instances list correctly', () => {
    const mockOnInstanceDeleted = jest.fn();
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    expect(screen.getByText('pg-test-001')).toBeInTheDocument();
    expect(screen.getByText('pg-test-002')).toBeInTheDocument();
    expect(screen.getByText('eastus')).toBeInTheDocument();
    expect(screen.getByText('westus')).toBeInTheDocument();
  });

  it('shows masked passwords by default', () => {
    const mockOnInstanceDeleted = jest.fn();
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    // Passwords should be masked
    expect(screen.queryByText('testpass123')).not.toBeInTheDocument();
    expect(screen.getAllByText('••••••••••••')).toHaveLength(2);
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    const mockOnInstanceDeleted = jest.fn();
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    // Find first show password button
    const showPasswordButtons = screen.getAllByTitle('Show password');
    await user.click(showPasswordButtons[0]);
    
    // Password should now be visible
    expect(screen.getByText('testpass123')).toBeInTheDocument();
    
    // Button should change to hide password
    expect(screen.getByTitle('Hide password')).toBeInTheDocument();
  });

  it('copies to clipboard when copy button clicked', async () => {
    const user = userEvent.setup();
    const mockOnInstanceDeleted = jest.fn();
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    // Find first copy hostname button
    const copyButtons = screen.getAllByTitle('Copy hostname');
    await user.click(copyButtons[0]);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pg-test-001.postgres.database.azure.com');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('handles instance deletion', async () => {
    const user = userEvent.setup();
    const mockOnInstanceDeleted = jest.fn();
    mockInstanceService.deleteInstance.mockResolvedValue({ message: 'Instance deleted' });
    
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    // Find first delete button
    const deleteButtons = screen.getAllByTitle('Delete instance');
    await user.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this instance? This action cannot be undone.'
    );
    
    await waitFor(() => {
      expect(mockInstanceService.deleteInstance).toHaveBeenCalledWith('1');
      expect(mockOnInstanceDeleted).toHaveBeenCalledTimes(1);
    });
  });

  it('cancels deletion when user clicks cancel', async () => {
    const user = userEvent.setup();
    const mockOnInstanceDeleted = jest.fn();
    (window.confirm as jest.Mock).mockReturnValue(false);
    
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    const deleteButtons = screen.getAllByTitle('Delete instance');
    await user.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockInstanceService.deleteInstance).not.toHaveBeenCalled();
    expect(mockOnInstanceDeleted).not.toHaveBeenCalled();
  });

  it('shows loading state during deletion', async () => {
    const user = userEvent.setup();
    const mockOnInstanceDeleted = jest.fn();
    mockInstanceService.deleteInstance.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ message: 'Deleted' }), 100))
    );
    
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    const deleteButtons = screen.getAllByTitle('Delete instance');
    await user.click(deleteButtons[0]);
    
    // Should show loading spinner
    const deleteButton = deleteButtons[0];
    expect(deleteButton).toBeDisabled();
  });

  it('handles deletion error gracefully', async () => {
    const user = userEvent.setup();
    const mockOnInstanceDeleted = jest.fn();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockInstanceService.deleteInstance.mockRejectedValue(new Error('Delete failed'));
    
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    const deleteButtons = screen.getAllByTitle('Delete instance');
    await user.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting instance:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete instance. Please try again.');
    });
    
    expect(mockOnInstanceDeleted).not.toHaveBeenCalled();
    
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('formats dates correctly', () => {
    const mockOnInstanceDeleted = jest.fn();
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    // Should format the date nicely
    expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 2, 2024/)).toBeInTheDocument();
  });

  it('generates correct connection strings', () => {
    const mockOnInstanceDeleted = jest.fn();
    render(<InstanceList instances={mockInstances} onInstanceDeleted={mockOnInstanceDeleted} />);
    
    const expectedConnectionString = 'postgresql://testadmin:testpass123@pg-test-001.postgres.database.azure.com:5432/postgres';
    
    // Connection string should be in the document
    expect(screen.getByText(expectedConnectionString)).toBeInTheDocument();
  });
});
