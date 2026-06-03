"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Sparkles } from "lucide-react"
import { useState } from "react"
import { ApiError, authApi } from "@/lib/api"

type Mode = "login" | "register"

export function AuthForm() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const mutation = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      mode === "login" ? authApi.login(body) : authApi.register(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  })

  const errorMessage = (() => {
    const err = mutation.error
    if (!(err instanceof ApiError)) return err ? "Something went wrong" : null
    if (err.status === 401) return "Invalid email or password"
    if (err.status === 409) return "That email is already registered"
    if (err.status === 400) return "Please enter a valid email and a password (8+ chars)"
    return "Something went wrong"
  })()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ email, password })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <header className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/5 ring-1 ring-white/10">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Log in to your tasks"
                : "Sign up to start organizing"}
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />

            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-all"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login")
                mutation.reset()
              }}
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
