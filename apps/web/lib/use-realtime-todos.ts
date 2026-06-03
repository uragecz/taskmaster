import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { io } from "socket.io-client"

// In dev the socket connects straight to the API (set to http://localhost:4000),
// bypassing the Next.js rewrite which would strip the trailing slash engine.io
// needs. In prod it's empty -> a relative connection through the Caddy proxy.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL

/**
 * Subscribes to live todo changes for the given user (over the same-origin
 * Socket.io connection) and refreshes the cached list when they happen.
 */
export function useRealtimeTodos(userId: number | undefined): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const socket = SOCKET_URL
      ? io(SOCKET_URL, { withCredentials: true })
      : io({ path: "/api/socket.io", withCredentials: true })

    socket.on("todos:changed", () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    })

    return () => {
      socket.disconnect()
    }
  }, [userId, queryClient])
}
