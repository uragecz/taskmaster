import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { io } from "socket.io-client"

/**
 * Subscribes to live todo changes for the given user (over the same-origin
 * Socket.io connection) and refreshes the cached list when they happen.
 */
export function useRealtimeTodos(userId: number | undefined): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const socket = io({ path: "/api/socket.io", withCredentials: true })
    socket.on("todos:changed", () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    })

    return () => {
      socket.disconnect()
    }
  }, [userId, queryClient])
}
