'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StockData } from '@/types/stock.types';
import { StockSummaryPasardana } from '@/types/pasardana.types';

interface Stock extends Omit<StockData, 'price'> {
  currentPrice: number;
  buyPrice: number;
  stopLoss: number;
  takeProfit: number;
}

type SortField = 'code' | 'buyPrice' | 'currentPrice' | '';
type SortDirection = 'asc' | 'desc';

export default function StockMonitor() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockSummary, setStockSummary] = useState<any[]>([]); // Using any[] as a temporary fix
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStock, setNewStock] = useState({
    code: '',
    buyPrice: '',
    currentPrice: '',
    stopLoss: '',
    takeProfit: ''
  });
  const [activeTab, setActiveTab] = useState('watchlist');
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({ field: 'code', direction: 'asc' });
  
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

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

  // Load saved stocks from localStorage
  useEffect(() => {
    const savedStocks = localStorage.getItem('stocks');
    if (savedStocks) {
      setStocks(JSON.parse(savedStocks));
    }
  }, []);

  // Save stocks to localStorage when they change
  useEffect(() => {
    if (stocks.length > 0) {
      localStorage.setItem('stocks', JSON.stringify(stocks));
    }
  }, [stocks]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStock(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding a new stock
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.code.trim()) return;

    const stockCode = newStock.code.trim().toUpperCase();
    const buyPrice = parseFloat(newStock.buyPrice) || 0;
    const currentPrice = parseFloat(newStock.currentPrice) || 0;
    const stopLoss = parseFloat(newStock.stopLoss) || 0;
    const takeProfit = parseFloat(newStock.takeProfit) || 0;

    // Check if stock already exists
    if (stocks.some(stock => stock.code === stockCode)) {
      alert('Stock already exists in your watchlist');
      return;
    }

    const newStockData: Stock = {
      code: stockCode,
      name: stockCode, // Using code as name for now
      currentPrice: currentPrice,
      buyPrice: buyPrice,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      change: 0,
      changePercent: 0
    };

    setStocks(prev => [...prev, newStockData]);
    setNewStock({
      code: '',
      buyPrice: '',
      currentPrice: '',
      stopLoss: '',
      takeProfit: ''
    });
  };

  const handleRemoveStock = (stockCode: string) => {
    setStocks(prev => prev.filter(stock => stock.code !== stockCode));
  };

  // Sort stocks based on current configuration
  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      let aValue: any = a[sortConfig.field];
      let bValue: any = b[sortConfig.field];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [stocks, sortConfig]);

  return (
    <>
      <Head>
        <title>Stock Monitor Demo</title>
        <meta name="description" content="Demo version of stock monitor" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Stock Monitor Demo</h1>
            <p className="text-gray-600 mt-2">Demo version - Monitor your investments and track performance</p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'watchlist'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Watchlist
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Add Stock
              </button>
            </nav>
          </div>

          {/* Add Stock Form */}
          {activeTab === 'add' && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Add New Stock</h2>
              <form onSubmit={handleAddStock} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={newStock.code}
                      onChange={handleInputChange}
                      placeholder="e.g., BBCA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buy Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="buyPrice"
                      value={newStock.buyPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="currentPrice"
                      value={newStock.currentPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stop Loss
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="stopLoss"
                      value={newStock.stopLoss}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Take Profit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="takeProfit"
                      value={newStock.takeProfit}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Stock
                </button>
              </form>
            </div>
          )}

          {/* Stock List */}
          {activeTab === 'watchlist' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {stocks.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No stocks in your watchlist. Add some stocks to get started.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  <li className="px-4 py-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleSort('code')}
                          className="text-left font-medium text-gray-900 hover:text-blue-600"
                        >
                          Code{getSortIndicator('code')}
                        </button>
                        <button
                          onClick={() => handleSort('buyPrice')}
                          className="text-left font-medium text-gray-900 hover:text-blue-600"
                        >
                          Buy Price{getSortIndicator('buyPrice')}
                        </button>
                        <button
                          onClick={() => handleSort('currentPrice')}
                          className="text-left font-medium text-gray-900 hover:text-blue-600"
                        >
                          Current Price{getSortIndicator('currentPrice')}
                        </button>
                      </div>
                      <div className="text-sm font-medium text-gray-500">Actions</div>
                    </div>
                  </li>
                  {sortedStocks.map((stock) => (
                    <li key={stock.code} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-medium text-blue-600">
                            {stock.code}
                          </div>
                          <div className="text-sm text-gray-500">
                            Buy: {stock.buyPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            Current: {stock.currentPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            SL: {stock.stopLoss.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            TP: {stock.takeProfit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStock(stock.code)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
