import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sql } from "./neon/client"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface User {
  id: string
  email: string
  name?: string
  email_verified: boolean
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
  const verificationToken = Math.random().toString(36).substring(2, 15)

  const result = await sql`
    INSERT INTO users (email, password_hash, name, verification_token)
    VALUES (${email}, ${passwordHash}, ${name || null}, ${verificationToken})
    RETURNING id, email, name, email_verified
  `

  return result[0]
}

export async function authenticateUser(email: string, password: string) {
  const users = await sql`
    SELECT id, email, name, password_hash, email_verified
    FROM users
    WHERE email = ${email}
  `

  if (users.length === 0) {
    return null
  }

  const user = users[0]
  const isValid = await verifyPassword(password, user.password_hash)

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

    const users = await sql`
      SELECT id, email, name, email_verified
      FROM users
      WHERE id = ${payload.userId}
    `

    return users[0] || null
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}
