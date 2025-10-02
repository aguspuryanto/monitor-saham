import { NextResponse } from 'next/server';
import { AuthResponse } from '@/types/user.types';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
};

// Read users from file
const readUsers = (): any[] => {
  ensureDataDirectory();
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
};

// Write users to file
const writeUsers = (users: any[]) => {
  ensureDataDirectory();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

export async function POST(request: Request) {
  try {
    const { action, username, password } = await request.json();

    if (action === 'register') {
      const users = readUsers();
      
      // Check if user already exists
      if (users.some((user: any) => user.username === username)) {
        return NextResponse.json<AuthResponse>({
          success: false,
          error: 'Username already exists',
        }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new user
      const newUser = {
        id: uuidv4(),
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      // Save user
      users.push(newUser);
      writeUsers(users);

      // Return success response without password
      const { password: _, ...userWithoutPassword } = newUser;
      return NextResponse.json<AuthResponse>({
        success: true,
        user: userWithoutPassword,
      });

    } else if (action === 'login') {
      const users = readUsers();
      const user = users.find((u: any) => u.username === username);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return NextResponse.json<AuthResponse>({
          success: false,
          error: 'Invalid username or password',
        }, { status: 401 });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json<AuthResponse>({
        success: true,
        user: userWithoutPassword,
      });
    }

    return NextResponse.json<AuthResponse>({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json<AuthResponse>({
      success: false,
      error: 'An error occurred during authentication',
    }, { status: 500 });
  }
}
