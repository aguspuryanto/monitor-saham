// Client-side stock service for fetching stock data
const API_BASE_URL = '/api/stock-data';

interface StockData {
  data: Array<{
    No: number;
    IDStockSummary: number;
    Date: string;
    StockCode: string;
    StockName: string;
    Previous: number;
    OpenPrice: number;
    FirstTrade: number;
    High: number;
    Low: number;
    Close: number;
    Change: number;
    Volume: number;
    Value: number;
    Frequency: number;
    IndexIndividual: number;
    Offer: number;
    OfferVolume: number;
    Bid: number;
    BidVolume: number;
    ListedShares: number;
    TradebleShares: number;
    WeightForIndex: number;
    ForeignSell: number;
    ForeignBuy: number;
  }>;
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
}

export async function fetchStockSummary() {
  try {
    console.log('Fetching stock summary from:', API_BASE_URL);
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        details: errorDetails
      });
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}\n${errorDetails}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched stock data');
    return data;
  } catch (error: any) {
    const errorInfo = {
      name: error?.name || 'UnknownError',
      message: error?.message || 'No error message',
      stack: error?.stack || 'No stack trace',
      ...(error?.response && { response: error.response })
    };
    
    console.error('Error in fetchStockSummary:', errorInfo);
    
    // Create a new error with the enhanced message
    const enhancedError = new Error(`Failed to fetch stock data: ${errorInfo.message}`);
    Object.assign(enhancedError, errorInfo);
    throw enhancedError;
  }
}

export async function getCachedStockSummary() {
  try {
    console.log('Fetching cached stock summary from:', `${API_BASE_URL}?cached=true`);
    const response = await fetch(`${API_BASE_URL}?cached=true`);
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e: any) {
        errorDetails = await response.text();
      }
      console.error('Cached API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        details: errorDetails
      });
      return null;
    }
    
    const data = await response.json();
    console.log('Successfully fetched cached stock data');
    return data;
  } catch (error: any) {
    console.error('Error in getCachedStockSummary:', {
      name: error?.name || 'UnknownError',
      message: error?.message || 'No error message',
      stack: error?.stack || 'No stack trace'
    });
    return null;
  }
}

// Export types for use in other files
export type { StockData };