'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { StockSummary } from '@/types/stock.types';

type Stock = {
  code: string;
  buyPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  change?: number;
};

type SortField = 'code' | 'buyPrice' | 'currentPrice' | '';
type SortDirection = 'asc' | 'desc';

export default function StockMonitor() {
  const [stocks, setStocks] = useState<Stock[]>([]);
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

  // Sort stocks based on sortConfig
  const sortedStocks = useMemo(() => {
    const sortableStocks = [...stocks];
    if (!sortConfig.field) return sortableStocks;

    return sortableStocks.sort((a: Stock, b: Stock) => {
      // For string comparison (code)
      if (sortConfig.field === 'code') {
        const aValue = a.code || '';
        const bValue = b.code || '';
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // For number comparison (buyPrice, currentPrice)
      const aValue = Number(a[sortConfig.field as keyof Stock]) || 0;
      const bValue = Number(b[sortConfig.field as keyof Stock]) || 0;
      
      return sortConfig.direction === 'asc' 
        ? aValue - bValue 
        : bValue - aValue;
    });
  }, [stocks, sortConfig]);

  // Load and update stock data
  const updateStocks = useCallback(async () => {
    try {
      console.log('Fetching stock data...');
      // Get the latest stock data from our API
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
      console.log(summaryData.data[0].Date);
      
      // Update last update time if data is available
      if (summaryData && summaryData.data && summaryData.data[0] && summaryData.data[0].Date) {
        const date = new Date(summaryData.data[0].Date);
        if (!isNaN(date.getTime())) { // Check if date is valid
          // Format date as d-m-Y
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          setLastUpdate(`${day}-${month}-${year}`);
        }
      }
      
      // Map the summary data to our stocks
      const updatedStocks = Array.isArray(stocksData) ? stocksData.map((stock: Stock) => {
        const stockSummary = summaryData.data.find((s: StockSummary) => s.StockCode === stock.code);
        if (stockSummary) {
          return {
            ...stock,
            currentPrice: stockSummary.Close,
            change: stockSummary.Change
          };
        }
        return stock;
      }) : [];
      // console.log(updatedStocks);
      
      setStocks(updatedStocks);
    } catch (error) {
      console.error('Error updating stocks:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    updateStocks();
  }, [updateStocks]);

  // Set up auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(updateStocks, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [updateStocks]);

  // Handle perubahan input form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Create a new stock object with the updated value
    const updatedStock = {
      ...newStock,
      [name]: value
    };

    // If buyPrice is being updated, calculate default stopLoss and takeProfit
    if (name === 'buyPrice' && value) {
      const buyPrice = parseFloat(value);
      if (!isNaN(buyPrice)) {
        updatedStock.stopLoss = (buyPrice * 0.9).toFixed(2); // -10%
        updatedStock.takeProfit = (buyPrice * 1.3).toFixed(2); // +30%
      }
    }

    setNewStock(updatedStock);
  };

  // Tambah saham baru
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert string values to numbers
      const stockToAdd = {
        ...newStock,
        buyPrice: parseFloat(newStock.buyPrice) || 0,
        stopLoss: parseFloat(newStock.stopLoss) || 0,
        takeProfit: parseFloat(newStock.takeProfit) || 0,
        change: 0
      };

      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockToAdd),
      });
      
      if (response.ok) {
        // Reset form
        setNewStock({ code: '', buyPrice: '', currentPrice: '', stopLoss: '', takeProfit: '' });
        // Refresh the stock list to get the latest data
        await updateStocks();
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  // Hapus saham dari favorit
  const handleDeleteStock = async (code: string) => {
    try {
      const response = await fetch(`/api/stocks?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const updatedStocks = await response.json();
        console.log(updatedStocks);
        setStocks(updatedStocks);
      } else {
        const errorData = await response.json();
        console.error('Error deleting stock:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  // Cek notifikasi
  useEffect(() => {
    stocks.forEach(stock => {
      // console.log(stock);
      if (stock.currentPrice <= stock.stopLoss) {
        showNotification(`Stop Loss Terpicu: ${stock.code} turun ke ${stock.currentPrice}`);
      } else if (stock.currentPrice >= stock.takeProfit) {
        showNotification(`Take Profit Terpicu: ${stock.code} naik ke ${stock.currentPrice}`);
      }
    });
  }, [stocks]);

  // Tampilkan notifikasi desktop
  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Notifikasi Saham', { body: message });
    }
  };

  // Minta izin notifikasi
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Stock Monitor | Pantau Saham Indonesia</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">Stock Monitor</h1>
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              🔔 Izinkan Notifikasi
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {lastUpdate && (
              <div className="text-sm text-gray-500 mb-4 px-2">
                Data terakhir diperbarui: {lastUpdate}
              </div>
            )}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
              <button
                className={`px-6 py-4 font-medium text-sm ${activeTab === 'watchlist' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('watchlist')}
              >
                Watchlist
              </button>
              <button
                className={`px-6 py-4 font-medium text-sm ${activeTab === 'alerts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('alerts')}
              >
                Alert
              </button>
            </nav>
          </div>
          
          <div className="overflow-x-auto">
            {sortedStocks.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada saham</h3>
                <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan saham ke watchlist Anda.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('code')}
                    >
                      Kode{getSortIndicator('code')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('buyPrice')}
                    >
                      Harga{getSortIndicator('buyPrice')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('currentPrice')}
                    >
                      Harga Pasar{getSortIndicator('currentPrice')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stop Loss
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Take Profit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStocks.map((stock, index) => {
                    const isLoss = stock.currentPrice <= stock.stopLoss;
                    const isProfit = stock.currentPrice >= stock.takeProfit;
                    const status = isLoss ? 'Stop Loss' : isProfit ? 'Take Profit' : 'Normal';
                    const statusColor = isLoss ? 'bg-red-100 text-red-800' : 
                                       isProfit ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
                    
                    return (
                      <tr key={index} className={isLoss ? 'bg-red-50' : isProfit ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-lg">
                              <span className="text-blue-600 font-semibold">{stock.code[0]}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{stock.code}</div>
                              <div className="text-sm text-gray-500">IDX</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Intl.NumberFormat('id-ID', { 
                              style: 'currency', 
                              currency: 'IDR', 
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2 
                            }).format(stock.buyPrice)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {stock.change !== undefined ? (
                              <>
                                {new Intl.NumberFormat('id-ID', { 
                                  style: 'currency', 
                                  currency: 'IDR',
                                  minimumFractionDigits: 0
                                }).format(stock.currentPrice)}
                                <span className={`ml-2 text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({stock.change >= 0 ? '↑' : '↓'} {stock.change})
                                </span>
                                <span className={`ml-2 text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({Math.abs((stock.currentPrice-stock.buyPrice)/stock.buyPrice*100).toFixed(2)}%)
                                </span>
                              </>
                            ) : 'Loading...'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stock.stopLoss)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stock.takeProfit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteStock(stock.code)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-96">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tambah Saham Baru</h2>
                <form onSubmit={handleAddStock} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kode Saham</label>
                      <input
                        type="text"
                        name="code"
                        value={newStock.code}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        placeholder="Contoh: BBCA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
                      <div className="relative">
                        {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">Rp</span>
                        </div> */}
                        <input
                          type="number"
                          step="0.01"
                          name="buyPrice"
                          value={newStock.buyPrice}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss</label>
                      <div className="relative">
                        {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">Rp</span>
                        </div> */}
                        <input
                          type="number"
                          step="0.01"
                          name="stopLoss"
                          value={newStock.stopLoss}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Take Profit</label>
                      <div className="relative">
                        {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">Rp</span>
                        </div> */}
                        <input
                          type="number"
                          step="0.01"
                          name="takeProfit"
                          value={newStock.takeProfit}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      + Tambah Ke Watchlist
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        .stock-form {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input {
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
        }
        button {
          padding: 8px 15px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .triggered {
          color: red;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}