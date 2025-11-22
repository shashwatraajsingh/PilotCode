import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Message {
  message: string
  timestamp: string
}

export function useWebSocket(taskId: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(WS_URL)

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setConnected(true)
      newSocket.emit('subscribe-task', taskId)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    })

    newSocket.on('progress', (data: Message) => {
      setMessages((prev) => [...prev, data])
    })

    newSocket.on('state-change', (data: any) => {
      console.log('State changed:', data)
    })

    setSocket(newSocket)

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe-task', taskId)
        newSocket.close()
      }
    }
  }, [taskId])

  return { socket, messages, connected }
}
