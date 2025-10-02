'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StockData } from '@/types/stock.types';
import { StockSummaryPasardana } from '@/types/pasardana.types';
import { UserStock } from '@/types/user.types';
import { authService } from '@/lib/authService';
import { Stock } from '@/module/stock/type';
import Sidebar from './partials/sidebar';

type SortField = 'code' | 'name' | 'price' | 'change' | 'changePercent' | 'buyPrice' | 'currentPrice' | '';
type SortDirection = 'asc' | 'desc';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stocks, setStocks] = useState<UserStock[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummaryPasardana[]>([]);
  const [newStockCode, setNewStockCode] = useState('');
  const [newStockData, setNewStockData] = useState({
    code: '',
    buyPrice: '',
    stopLoss: '',
    takeProfit: ''
  });
  const [activeTab, setActiveTab] = useState('watchlist');
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({ field: 'code', direction: 'asc' });
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Load stocks from API
  const loadStocks = useCallback(async () => {
    try {
      const [stocksResponse, summaryResponse] = await Promise.all([
        fetch('/api/stocks'),
        fetch('/api/stock-data')
      ]);
      
      if (!stocksResponse.ok) {
        throw new Error('Failed to fetch stocks data');
      }
      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch summary data');
      }
      
      const stocksData = await stocksResponse.json();
      const summaryData = await summaryResponse.json();
      if (stocksResponse.ok) {
        // Map the summary data to our stocks
        const updatedStocks = Array.isArray(stocksData) ? stocksData.map((stock: Stock) => {
          const stockSummary = summaryData.data.find((s: StockSummaryPasardana) => s.Code === stock.code);
          if (stockSummary) {
            return {
              ...stock,
              currentPrice: stockSummary.Last,
              change: stockSummary.Last - stockSummary.PrevClosingPrice
            };
          }
          return stock;
        }) : [];
        
        // Transform the data to match UserStock interface
        const transformedStocks: UserStock[] = updatedStocks.map((stock: any) => ({
          code: stock.code,
          name: stock.code, // Using code as name for now
          buyPrice: stock.buyPrice || 0,
          currentPrice: stock.currentPrice || 0,
          stopLoss: stock.stopLoss || 0,
          takeProfit: stock.takeProfit || 0,
          change: stock.change || 0,
          changePercent: 0, // Calculate this if needed
        }));
        setStocks(transformedStocks);
      }
    } catch (error) {
      console.error('Failed to load stocks:', error);
      setError('Failed to load stocks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  // Handle form input changes
  const handleFormInputChange = (field: string, value: string) => {
    setNewStockData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate Stop Loss and Take Profit when Buy Price changes
      if (field === 'buyPrice' && value) {
        const buyPrice = parseFloat(value);
        if (!isNaN(buyPrice) && buyPrice > 0) {
          updated.stopLoss = (buyPrice * 0.9).toFixed(2); // -10%
          updated.takeProfit = (buyPrice * 1.3).toFixed(2); // +30%
        }
      }
      
      return updated;
    });
  };

  // Reset form
  const resetForm = () => {
    setNewStockData({
      code: '',
      buyPrice: '',
      stopLoss: '',
      takeProfit: ''
    });
    setNewStockCode('');
  };

  // Handle adding a new stock
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('User:', user);
    console.log('New stock data:', newStockData);
    
    if (isSubmitting) return; // Prevent double submission
    
    if (!user) {
      setError('You must be logged in to add stocks');
      return;
    }
    
    const stockCode = newStockData.code.trim().toUpperCase();
    const buyPrice = parseFloat(newStockData.buyPrice);
    const stopLoss = parseFloat(newStockData.stopLoss);
    const takeProfit = parseFloat(newStockData.takeProfit);
    
    console.log('Parsed values:', { stockCode, buyPrice, stopLoss, takeProfit });
    
    if (!stockCode || isNaN(buyPrice) || buyPrice <= 0) {
      setError('Please enter a valid stock code and buy price');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const newStock: UserStock = {
        code: stockCode,
        name: stockCode, // Using code as name for now
        buyPrice: buyPrice,
        currentPrice: 0,
        stopLoss: stopLoss || 0,
        takeProfit: takeProfit || 0,
        change: 0,
        changePercent: 0,
      };
      
      console.log('Sending stock to API:', newStock);
      const success = await authService.addUserStock(user.id, newStock);
      console.log('API response:', success);
      
      if (success) {
        console.log('Stock added successfully');
        resetForm();
        // Reload stocks from API
        await loadStocks();
      } else {
        setError('Failed to add stock to watchlist');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Stock is already in your watchlist or an error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStock = async (stockCode: string) => {
    if (!user) return;
    
    try {
      const success = await authService.removeUserStock(user.id, stockCode);
      if (success) {
        // Reload stocks from API
        await loadStocks();
      }
    } catch (error) {
      console.error('Error removing stock:', error);
      setError('Failed to remove stock');
    }
  };

  // Removed logout handler as it's now in the layout

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header Section */}
            <div className="mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Stock Watchlist</h1>
                <p className="text-gray-600">Monitor your investments and track market performance</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Table */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks in your watchlist</h3>
            <p className="text-gray-500">Add some stocks to start monitoring your investments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('code')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Stock</span>
                      {getSortIndicator('code')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('buyPrice')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Buy Price</span>
                      {getSortIndicator('buyPrice')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('currentPrice')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Current Price</span>
                      {getSortIndicator('currentPrice')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stop Loss
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Take Profit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stock) => (
                  <tr key={stock.code} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                          {stock.code.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{stock.code}</div>
                          <div className="text-sm text-gray-500">IDX</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stock.buyPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {stock.currentPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${stock.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600">
                        {stock.stopLoss.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {stock.takeProfit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        stock.currentPrice <= stock.stopLoss ? 'bg-red-100 text-red-800' :
                        stock.currentPrice >= stock.takeProfit ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {stock.currentPrice <= stock.stopLoss ? 'Stop Loss' :
                         stock.currentPrice >= stock.takeProfit ? 'Take Profit' :
                         'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveStock(stock.code)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              newStockData={newStockData}
              handleFormInputChange={handleFormInputChange}
              handleAddStock={handleAddStock}
              isSubmitting={isSubmitting}
              stocks={stocks}
            />
          </div>
        </div>

        {/* Mobile Add Button - Only visible on small screens */}
        <div className="lg:hidden fixed bottom-6 right-6 z-20">
          <button
            onClick={async () => {
              const stockCode = prompt('Masukkan kode saham:');
              if (stockCode && stockCode.trim()) {
                const buyPrice = prompt('Masukkan harga beli:');
                if (buyPrice && !isNaN(parseFloat(buyPrice))) {
                  const price = parseFloat(buyPrice);
                  setNewStockData({
                    code: stockCode.trim().toUpperCase(),
                    buyPrice: buyPrice,
                    stopLoss: (price * 0.9).toFixed(2),
                    takeProfit: (price * 1.3).toFixed(2)
                  });
                  
                  // Create a synthetic form event
                  const syntheticEvent = {
                    preventDefault: () => {},
                    currentTarget: null,
                    target: null,
                  } as unknown as React.FormEvent;
                  await handleAddStock(syntheticEvent);
                }
              }
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
