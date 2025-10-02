'use client';

import { UserStock } from '@/types/user.types';

interface SidebarProps {
    newStockData: {
        code: string;
        buyPrice: string;
        stopLoss: string;
        takeProfit: string;
    };
    handleFormInputChange: (field: string, value: string) => void;
    handleAddStock: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
    stocks: UserStock[];
}

export default function Sidebar({ 
    newStockData, 
    handleFormInputChange, 
    handleAddStock, 
    isSubmitting, 
    stocks 
}: SidebarProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-8">
            <div className="h-full flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                    <h2 className="text-xl font-bold text-white">Add New Stock</h2>
                    <p className="text-blue-100 text-sm mt-1">Add stocks to your watchlist</p>
                </div>

                {/* Sidebar Content */}
                <div className="p-6">
                    <form onSubmit={handleAddStock} className="space-y-6">
                        {/* Stock Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kode Saham
                            </label>
                            <input
                                type="text"
                                value={newStockData.code}
                                onChange={(e) => handleFormInputChange('code', e.target.value)}
                                placeholder="Contoh: BBCA"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Masukkan kode saham 4 huruf</p>
                        </div>

                        {/* Buy Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Harga Beli
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={newStockData.buyPrice}
                                onChange={(e) => handleFormInputChange('buyPrice', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Harga beli saham per lembar</p>
                        </div>

                        {/* Stop Loss */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stop Loss (-10%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={newStockData.stopLoss}
                                onChange={(e) => handleFormInputChange('stopLoss', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 border border-red-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-red-50"
                                required
                            />
                            <p className="text-xs text-red-600 mt-1">Otomatis dihitung -10% dari harga beli</p>
                        </div>

                        {/* Take Profit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Take Profit (+30%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={newStockData.takeProfit}
                                onChange={(e) => handleFormInputChange('takeProfit', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 border border-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-green-50"
                                required
                            />
                            <p className="text-xs text-green-600 mt-1">Otomatis dihitung +30% dari harga beli</p>
                        </div>


                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl ${
                                isSubmitting 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                            }`}
                        >
                            <span className="flex items-center justify-center">
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Tambah Ke Watchlist
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}