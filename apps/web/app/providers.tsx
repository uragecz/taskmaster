"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { Toaster } from "sonner"

export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per browser session (kept stable across re-renders).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="bottom-center" />
    </QueryClientProvider>
  )
}
