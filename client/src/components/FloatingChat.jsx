import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const messagesEndRef = useRef(null)

  // Generate or retrieve device ID
  useEffect(() => {
    let id = localStorage.getItem('deviceId')
    if (!id) {
      id = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
      localStorage.setItem('deviceId', id)
    }
    setDeviceId(id)

    // Load chat messages for this device
    if (id) {
      loadMessages(id)
    }
  }, [])

  // Update unread count when messages change
  useEffect(() => {
    if (!isOpen) {
      const unread = messages.filter(m => m.sender === 'admin').length
      setUnreadCount(unread)
    }
  }, [messages, isOpen])

  const loadMessages = async (id) => {
    try {
      const res = await axios.get(`/api/chat/${id}`)
      setMessages(res.data || [])
    } catch (err) {
      console.error('Failed to load chat messages')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !deviceId) return

    const newMessage = {
      deviceId,
      userName: 'Guest',
      sender: 'customer',
      message: inputValue
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/chat', newMessage)
      setMessages([...messages, res.data])
      setInputValue('')

      // Simulate typing indicator delay
      setTimeout(() => loadMessages(deviceId), 1200)
    } catch (err) {
      console.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Enhanced Floating Chat Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setUnreadCount(0)
        }}
        className={`fixed bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 text-white rounded-full shadow-2xl hover:shadow-3xl flex items-center justify-center text-2xl sm:text-3xl z-40 transition-all duration-300 transform ${
          isOpen
            ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 rotate-45 shadow-red-500/50'
            : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 hover:from-stone-950 hover:via-stone-900 hover:to-stone-800 animate-pulse shadow-lg shadow-stone-500/30 hover:scale-110'
        }`}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Unread Badge */}
      {!isOpen && unreadCount > 0 && (
        <div className="fixed bottom-20 sm:bottom-24 right-6 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-xs font-bold z-40 animate-bounce shadow-lg border-2 border-white shadow-red-500/50">
          {unreadCount}
        </div>
      )}

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 sm:bottom-24 sm:right-6 w-96 sm:w-[420px] h-screen sm:h-auto sm:max-h-96 bg-white rounded-3xl shadow-2xl flex flex-col z-40 overflow-hidden border border-gray-200 ${animationsEnabled ? 'animate-in slide-in-from-bottom-5' : ''}`}>
          {/* Professional Chat Header */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-700 text-white p-5 flex justify-between items-center shadow-lg">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                Chat Support
              </h3>
              <p className="text-sm text-stone-300 mt-1">🎉 Quick responses</p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                className={`p-2 rounded-lg transition-all ${animationsEnabled ? 'bg-stone-700 hover:bg-stone-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Toggle animations"
              >
                {animationsEnabled ? '✨' : '⏸'}
              </button>
              <button
                onClick={() => setShowTimestamps(!showTimestamps)}
                className={`p-2 rounded-lg transition-all ${showTimestamps ? 'bg-stone-700 hover:bg-stone-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Toggle timestamps"
              >
                🕐
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xl hover:text-yellow-200 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container - Enhanced */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white via-gray-50 to-stone-100 scrollbar-thin scrollbar-thumb-stone-500 scrollbar-track-stone-200">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8 flex flex-col items-center justify-center h-full">
                <p className="text-5xl mb-3 animate-bounce" style={{ animationDuration: '2s' }}>👋</p>
                <p className="font-bold text-lg text-gray-700">Welcome!</p>
                <p className="text-sm mt-2 text-gray-600">How can we help you today?</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'} ${animationsEnabled ? 'animate-in fade-in slide-in-from-bottom-2' : ''} cursor-pointer transition-all`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl transition-all duration-200 ${
                        msg.sender === 'customer'
                          ? 'bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-br-none shadow-md hover:shadow-lg hover:from-stone-950 hover:to-stone-900'
                          : 'bg-white border-2 border-gray-300 text-gray-900 rounded-bl-none shadow-sm hover:shadow-md hover:border-yellow-200'
                      } ${selectedMessageId === msg.id ? 'ring-2 ring-amber-700 ring-offset-2' : ''}`}
                    >
                      <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                      {showTimestamps && (
                        <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${
                          msg.sender === 'customer'
                            ? 'text-stone-300'
                            : 'text-gray-600'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {msg.sender === 'customer' && ' ✓✓'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Enhanced Message Input */}
          <div className="border-t-2 border-gray-200 p-4 bg-white shadow-lg">
            <div className="flex gap-2 items-end">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type message... (Shift+Enter)"
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent text-sm transition shadow-sm"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-950 hover:to-stone-900 text-white px-4 py-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-lg"
              >
                {loading ? '⏳' : '📤'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">⏎ Send • Shift+⏎ New line</p>
          </div>
        </div>
      )}
    </>
  )
}
