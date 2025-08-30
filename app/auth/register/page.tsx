"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return "Email is required"
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return null
  }

  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required"
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters"
    }
    if (password.length > 72) {
      return "Password must be less than 72 characters"
    }
    return null
  }

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) {
      return "Please confirm your password"
    }
    if (confirmPassword !== password) {
      return "Passwords do not match"
    }
    return null
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setEmailError(validateEmail(value))
    setError(null)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordError(validatePassword(value))
    if (confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, value))
    }
    setError(null)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    setConfirmPasswordError(validateConfirmPassword(value, password))
    setError(null)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword, password)

    setEmailError(emailValidation)
    setPasswordError(passwordValidation)
    setConfirmPasswordError(confirmPasswordValidation)

    if (emailValidation || passwordValidation || confirmPasswordValidation) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: displayName || email.split("@")[0],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = !emailError && !passwordError && !confirmPasswordError && email && password && confirmPassword

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Create account</CardTitle>
            <CardDescription className="text-muted-foreground">Start your knowledge journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-border/50"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`border-border/50 ${emailError ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`border-border/50 ${passwordError ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`border-border/50 ${confirmPasswordError ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                {confirmPasswordError && <p className="text-sm text-destructive">{confirmPasswordError}</p>}
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={!isFormValid || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Already have an account? "}
              <Link href="/auth/login" className="text-foreground hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
