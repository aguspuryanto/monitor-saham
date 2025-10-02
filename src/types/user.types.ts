export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface UserStock {
  code: string;
  name: string;
  buyPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  change: number;
  changePercent: number;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
}

export interface StockResponse {
  success: boolean;
  stocks?: UserStock[];
  error?: string;
}
