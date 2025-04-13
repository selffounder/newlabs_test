"use client"
import { useState, useRef, useEffect } from "react"

export default function Home() {
  const [key, setKey] = useState("")
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string; logs?: string[] }[]>([])
  const [loading, setLoading] = useState(false)
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
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: "bot",
        text: "⚠️ Server failed to respond.",
      }])
    }

    setQuery("")
    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl px-4 py-6 flex flex-col space-y-6 h-screen">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#58a6ff]">NEW LABS</h1>
        </header>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Key Input */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Enter Fernet decryption key"
              className="w-full bg-[#161b22] border border-[#30363d] text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-[#161b22] rounded-xl border border-[#30363d] px-6 py-6 space-y-4 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className="flex flex-col space-y-1 text-sm">
                <div
                  className={`inline-block max-w-[85%] px-4 py-3 rounded-xl ${
                    msg.sender === "user" ? "bg-[#238636] text-white self-end ml-auto" : "bg-[#1f6feb] text-white"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.logs && (
                  <div className="bg-[#0d1117] text-green-400 mt-2 p-3 rounded-md text-xs whitespace-pre-wrap border border-[#30363d]">
                    <strong className="block text-green-300 mb-1">🔍 Debug Logs</strong>
                    {msg.logs.map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-gray-400 text-sm">🤔 Thinking...</div>}
            <div ref={bottomRef} />
          </div>

          {/* Query Input */}
          <div className="flex space-x-2">
            <input
              className="flex-1 bg-[#161b22] border border-[#30363d] text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              placeholder="Ask something..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-[#58a6ff] hover:bg-[#1f6feb] text-white text-sm px-6 py-3 rounded-lg font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
