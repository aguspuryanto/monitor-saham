import { User, UserStock, AuthResponse } from '@/types/user.types';

const API_BASE_URL = '/api/auth';

// Helper function to handle API requests
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Something went wrong');
  }

  return response.json();
}

// User authentication functions
export const authService = {
  // Register a new user
  register: async (username: string, password: string): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('', {
      method: 'POST',
      body: JSON.stringify({
        action: 'register',
        username,
        password,
      }),
    });
  },

  // Login user
  login: async (username: string, password: string): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('', {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        username,
        password,
      }),
    });
  },

  // Get user by ID (not needed in client-side, handled by session)
  getUserById: async (userId: string): Promise<User | undefined> => {
    // In a real app, you might want to fetch the current user's data
    // For now, we'll just return undefined as the user should be in context
    return undefined;
  },

  // Get user stocks
  getUserStocks: async (userId: string): Promise<UserStock[]> => {
    return fetchApi<UserStock[]>('', {
      method: 'POST',
      body: JSON.stringify({
        action: 'getUserStocks',
        userId,
      }),
    });
  },

  // Add stock to user's watchlist
  addUserStock: async (userId: string, stock: UserStock): Promise<boolean> => {
    try {
      const requestData = {
        code: stock.code,
        buyPrice: stock.buyPrice || 0,
        currentPrice: stock.currentPrice || 0,
        stopLoss: stock.stopLoss || 0,
        takeProfit: stock.takeProfit || 0,
        change: stock.change || 0,
      };
      
      console.log('Sending stock data:', requestData);
      
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to add stock');
      }
      
      const result = await response.json();
      console.log('API Success:', result);
      return true;
    } catch (error) {
      console.error('Failed to add stock:', error);
      return false;
    }
  },

  // Remove stock from user's watchlist
  removeUserStock: async (userId: string, stockCode: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/stocks?code=${encodeURIComponent(stockCode)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove stock');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to remove stock:', error);
      return false;
    }
  },
};
