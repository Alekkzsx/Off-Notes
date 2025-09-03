import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { sql } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

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
  const passwordHash = await hashPassword(password)
  
  const result = await sql`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name}, ${passwordHash})
    RETURNING id, email, name, email_verified
  `
  return result.rows[0]
}

export async function authenticateUser(email: string, password: string) {
  const result = await sql<User>`
    SELECT id, email, name, email_verified, password_hash FROM users WHERE email = ${email}
  `
  const user = result.rows[0]

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
    
    const result = await sql<User>`
      SELECT id, email, name, email_verified FROM users WHERE id = ${payload.userId}
    `
    const user = result.rows[0]

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified,
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
