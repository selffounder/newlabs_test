"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"

export default function Home() {
  const [key, setKey] = useState("")
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string; logs?: string[] }[]>([])
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const sendMessage = async () => {
    if (!key || !query) return
    setMessages(prev => [...prev, { sender: "user", text: query }])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, query }),
      })
      const data = await res.json()

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: data.answer || data.error || "No response",
          logs: data.logs || [],
        },
      ])
    } catch {
      setMessages(prev => [...prev, { sender: "bot", text: "⚠️ Server failed to respond." }])
    }

    setQuery("")
    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const theme = darkMode
    ? {
        bg: "bg-gradient-to-br from-[#0d1117] to-[#1a1f27]",
        text: "text-white",
        card: "bg-white/5 backdrop-blur-md",
        input: "bg-white/10 border-white/10 focus:ring-blue-400",
        accent: "text-blue-400",
        user: "bg-green-500/80 text-white",
        bot: "bg-blue-500/80 text-white",
        log: "bg-black/30 text-green-300 border border-green-500/20",
      }
    : {
        bg: "bg-gradient-to-br from-white to-slate-100",
        text: "text-gray-900",
        card: "bg-white/70 backdrop-blur-md shadow-md",
        input: "bg-white border-gray-300 focus:ring-blue-400",
        accent: "text-blue-600",
        user: "bg-green-100 text-green-900",
        bot: "bg-blue-100 text-blue-900",
        log: "bg-white text-green-800 border border-gray-200",
      }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-inter transition-colors duration-300`}>
      <div className="w-full max-w-[95%] sm:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col space-y-6 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme.accent}`}>NEW LABS</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full border border-white/10 hover:scale-105 transition duration-200"
          >
            {darkMode ? <Sun className="text-yellow-300 w-5 h-5" /> : <Moon className="text-blue-600 w-5 h-5" />}
          </button>
        </header>

        {/* Key Input */}
        <motion.input
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          type="text"
          placeholder="🔐 Enter Fernet decryption key"
          className={`w-full ${theme.input} border text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition`}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        {/* Chat Area */}
        <div className={`flex-1 rounded-xl p-4 sm:p-6 space-y-4 overflow-y-auto ${theme.card} min-h-[300px]`}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col space-y-1 text-sm"
              >
                <div
                  className={`inline-block max-w-[90%] sm:max-w-[80%] px-5 py-3 rounded-2xl ${
                    msg.sender === "user" ? `${theme.user} self-end ml-auto` : `${theme.bot}`
                  }`}
                >
                  {msg.text}
                </div>

                {msg.logs && (
                  <div className={`mt-2 p-3 rounded-lg text-xs whitespace-pre-wrap ${theme.log}`}>
                    <strong className="block mb-1">🔍 Debug Logs</strong>
                    {msg.logs.map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="text-gray-400 text-sm">🤔 Thinking...</div>}
          <div ref={bottomRef} />
        </div>

        {/* Query Input */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
          <input
            className={`flex-1 ${theme.input} border text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition`}
            placeholder="💬 Ask something..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-sm px-6 py-3 rounded-xl font-medium shadow transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
