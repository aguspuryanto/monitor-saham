import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { User, UserStock } from '@/types/user.types';
import path from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

async function readUsersFile(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

async function writeUsersFile(users: User[]): Promise<void> {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function POST(req: Request) {
  try {
    const { action, ...data } = await req.json();
    
    switch (action) {
      case 'register':
        return await handleRegister(data);
      case 'login':
        return await handleLogin(data);
      case 'getUserStocks':
        return await handleGetUserStocks(data);
      case 'addUserStock':
        return await handleAddUserStock(data);
      case 'removeUserStock':
        return await handleRemoveUserStock(data);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleRegister({ username, password }: { username: string; password: string }) {
  const users = await readUsersFile();
  
  if (users.some(u => u.username === username)) {
    return NextResponse.json(
      { error: 'Username already exists' },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsersFile(users);

  // Don't send back the password hash
  const { password: _, ...userWithoutPassword } = newUser;
  return NextResponse.json(userWithoutPassword);
}

async function handleLogin({ username, password }: { username: string; password: string }) {
  const users = await readUsersFile();
  const user = users.find(u => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  }

  // Don't send back the password hash
  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword);
}

async function handleGetUserStocks({ userId }: { userId: string }) {
  const stocksFile = path.join(process.cwd(), 'data', `${userId}_stocks.json`);
  
  try {
    const data = await fs.readFile(stocksFile, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    // If file doesn't exist, return empty array
    return NextResponse.json([]);
  }
}

async function handleAddUserStock({ userId, stock }: { userId: string; stock: UserStock }) {
  const stocksFile = path.join(process.cwd(), 'data', `${userId}_stocks.json`);
  let stocks: UserStock[] = [];
  
  try {
    const data = await fs.readFile(stocksFile, 'utf-8');
    stocks = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, will be created
  }

  // Check if stock already exists
  if (stocks.some(s => s.code === stock.code)) {
    return NextResponse.json(
      { error: 'Stock already in watchlist' },
      { status: 400 }
    );
  }

  stocks.push(stock);
  await fs.mkdir(path.dirname(stocksFile), { recursive: true });
  await fs.writeFile(stocksFile, JSON.stringify(stocks, null, 2));
  
  return NextResponse.json(stocks);
}

async function handleRemoveUserStock({ userId, stockCode }: { userId: string; stockCode: string }) {
  const stocksFile = path.join(process.cwd(), 'data', `${userId}_stocks.json`);
  
  try {
    const data = await fs.readFile(stocksFile, 'utf-8');
    let stocks = JSON.parse(data);
    
    const initialLength = stocks.length;
    stocks = stocks.filter((s: UserStock) => s.code !== stockCode);
    
    if (stocks.length < initialLength) {
      await fs.writeFile(stocksFile, JSON.stringify(stocks, null, 2));
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Stock not found in watchlist' },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove stock' },
      { status: 500 }
    );
  }
}
