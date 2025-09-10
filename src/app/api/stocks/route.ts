import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Stock } from '@/module/stock/type';

// Path to the data file
const filePath = path.join(process.cwd(), 'data', 'stocks.json');

// Helper function to read and validate data
const readData = (): Stock[] => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Ensure we always return an array
    if (!Array.isArray(data)) {
      console.warn('Invalid data format: expected array, got', typeof data);
      return [];
    }
    
    // Validate and transform each stock item
    return data.map(item => ({
      code: String(item.code || ''),
      buyPrice: Number(item.buyPrice) || 0,
      currentPrice: Number(item.currentPrice) || 0,
      stopLoss: Number(item.stopLoss) || 0,
      takeProfit: Number(item.takeProfit) || 0,
      change: 0 // Default change value
    }));
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
};

// GET handler
export async function GET() {
  try {
    const stocks = readData();
    // Return the stocks array directly to match the frontend's expectation
    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error in GET /api/stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const stocks = readData();
    const newStock: Stock = await request.json();
    
    // Check if stock already exists
    const existingIndex = stocks.findIndex(stock => stock.code === newStock.code);
    
    if (existingIndex >= 0) {
      // Update existing stock
      stocks[existingIndex] = newStock;
    } else {
      // Add new stock
      stocks.push(newStock);
    }

    // Save to file
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(stocks, null, 2));

    return NextResponse.json({ success: true, stock: newStock });
  } catch (error) {
    console.error('Error in POST /api/stocks:', error);
    return NextResponse.json(
      { error: 'Failed to save stock data' },
      { status: 500 }
    );
  }
}

// DELETE handler
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Stock code is required' },
        { status: 400 }
      );
    }

    const stocks = readData();
    const filteredStocks = stocks.filter(stock => stock.code !== code);

    // Save to file
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(filteredStocks, null, 2));

    // Return the updated list of stocks
    return NextResponse.json(filteredStocks);
  } catch (error) {
    console.error('Error in DELETE /api/stocks:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock' },
      { status: 500 }
    );
  }
}
