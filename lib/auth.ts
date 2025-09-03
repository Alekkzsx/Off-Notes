import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import fs from "fs/promises"
import path from "path"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// Ensure the data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR)
    return
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf8')
      return []
    } else {
      throw err
    }
  }
}

async function saveUsers(users: User[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

export interface User {
  id: string
  email: string
  name?: string
  email_verified: boolean
  password_hash?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createUser(email: string, password: string, name?: string) {
  await ensureDataDirectory()
  const passwordHash = await hashPassword(password)
  const users = await getUsers()
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    throw new Error('Email already registered')
  }
  const newUser: User = {
    id: Date.now().toString(),
    email,
    name,
    email_verified: false,
    password_hash: passwordHash,
  }
  users.push(newUser)
  await saveUsers(users)
  return newUser
}

export async function authenticateUser(email: string, password: string) {
  await ensureDataDirectory()
  const users = await getUsers()
  const user = users.find(u => u.email === email)
  if (!user) {
    return null
  }
  const isValid = await verifyPassword(password, user.password_hash!)
  if (!isValid) {
    return null
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    email_verified: user.email_verified,
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      return null
    }
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }
    await ensureDataDirectory()
    const users = await getUsers()
    const foundUser = users.find(u => u.id === payload.userId)
    if (foundUser) {
      return {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        email_verified: foundUser.email_verified,
      }
    } else {
      return null
    }
  } catch {
    return null
  }
}

export async function setAuthCookie(userId: string) {
  const token = generateToken(userId)
  const cookieStore = await cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}
