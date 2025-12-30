import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [userName, setUserName] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [platformName, setPlatformName] = useState('MyShop')
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Generate or retrieve device ID
  useEffect(() => {
    let id = localStorage.getItem('chatDeviceId')
    if (!id) {
      id = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('chatDeviceId', id)
    }
    setDeviceId(id)
    
    const name = localStorage.getItem('chatUserName')
    if (name) setUserName(name)

    // Fetch platform name
    axios.get('/api/platform-name')
      .then(res => {
        setPlatformName(res.data.platformName || 'MyShop')
      })
      .catch(err => {
        console.error('Failed to fetch platform name:', err)
        setPlatformName('MyShop')
      })
    
    // Load chat history
    loadMessages(id)
    
    // Update unread count
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [])

  // Update unread count when messages change
  useEffect(() => {
    if (!isOpen) {
      const unread = messages.filter(m => m.sender === 'admin' && !m.read).length
      setUnreadCount(unread)
    }
  }, [messages, isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async (devId) => {
    try {
      const response = await axios.get(`/api/chat/${devId}`)
      setMessages(response.data || [])
    } catch (err) {
      console.error('Failed to load messages')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedImage) return

    // Ask for name on first message
    if (!userName) {
      const name = prompt('Please enter your name to continue:')
      if (!name) return
      setUserName(name)
      localStorage.setItem('chatUserName', name)
    }

    let imageUrl = null
    if (selectedImage) {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedImage)
      try {
        const uploadRes = await axios.post('/api/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        imageUrl = uploadRes.data.imageUrl
      } catch (err) {
        console.error('Upload error:', err.response?.data || err.message)
        alert('Failed to upload image. Please try again.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const message = {
      deviceId,
      userName,
      sender: 'customer',
      message: newMessage.trim() || (selectedImage ? '[File Attachment]' : ''),
      imageUrl
    }

    try {
      const response = await axios.post('/api/chat', message)
      const newMsg = { ...response.data, read: true }
      setMessages([...messages, newMsg])
      setNewMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      
      // Simulate typing indicator
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 1500)
    } catch (err) {
      console.error('Send message error:', err.response?.data || err.message)
      alert('Failed to send message. Please try again.')
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB limit for files)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB')
        return
      }
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('Please upload an image (JPG, PNG, GIF, WebP) or PDF file')
        return
      }
      setSelectedImage(file)
      // Create preview for images only
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        // For PDFs, show a PDF icon preview
        setImagePreview('pdf')
      }
    }
  }

  // Clear chat
  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
      setMessages([])
      setShowMenu(false)
      alert('✅ Your chat has been cleared successfully')
    }
  }

  // Filter messages based on search query
  const filteredMessages = messages.filter(msg => {
    if (!searchQuery.trim()) return true
    const lowerQuery = searchQuery.toLowerCase()
    return (
      msg.message?.toLowerCase().includes(lowerQuery) ||
      msg.userName?.toLowerCase().includes(lowerQuery)
    )
  })

  return (
    <>
      {/* Floating Chat Button with Enhanced Design */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setUnreadCount(0)
        }}
        className={`fixed bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl sm:text-3xl z-50 transition-all duration-300 ${
          isOpen 
            ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 rotate-45 shadow-red-500/50' 
            : 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 animate-pulse shadow-lg shadow-blue-500/30 hover:scale-110'
        }`}
        title={isOpen ? 'Close chat' : 'Chat with us'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Unread Messages Badge */}
      {!isOpen && unreadCount > 0 && (
        <div className="fixed bottom-20 sm:bottom-24 right-6 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-xs font-bold z-50 animate-bounce shadow-lg border-2 border-white shadow-red-500/50">
          {unreadCount}
        </div>
      )}

      {/* Chat Window - World Class Design */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 sm:w-[450px] md:w-[520px] h-[600px] sm:h-[680px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 ${animationsEnabled ? 'animate-in slide-in-from-bottom-5' : ''}`}>
          
          {/* Professional Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white p-4 sm:p-5 flex items-center justify-between sticky top-0 shadow-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <h3 className="font-bold text-lg sm:text-xl">💬 Customer Support</h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">🎯 Always here to help</p>
            </div>
            <div className="flex items-center gap-3 relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-blue-500 rounded-lg transition-all duration-200 hover:scale-110"
                title="Search messages"
              >
                🔍
              </button>
              <button
                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                className={`p-2 rounded-lg transition-all duration-200 ${animationsEnabled ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Toggle animations"
              >
                {animationsEnabled ? '✨' : '⏸'}
              </button>
              <button
                onClick={() => setShowTimestamps(!showTimestamps)}
                className={`p-2 rounded-lg transition-all duration-200 ${showTimestamps ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-600 hover:bg-gray-500'}`}
                title="Toggle timestamps"
              >
                🕐
              </button>
              
              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-blue-500 rounded-lg transition-all duration-200 hover:scale-110"
                  title="More options"
                >
                  ⋮
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white text-gray-900 rounded-lg shadow-xl border-2 border-blue-200 z-50 min-w-max">
                    <button
                      onClick={clearChat}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 transition flex items-center gap-2 font-semibold text-sm text-red-600 rounded-t-lg"
                    >
                      🗑️ Clear Chat
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem('chatUserName')
                        setUserName('')
                        setShowMenu(false)
                        alert('✅ Your name has been cleared')
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center gap-2 font-semibold text-sm rounded-b-lg border-t border-gray-200"
                    >
                      👤 Clear Name
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar (Collapsible) - Enhanced Design */}
          {showSearch && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200 px-4 py-3 flex gap-2 backdrop-blur-sm">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSearch(false)
                }}
                className="px-3 py-2 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 rounded-lg hover:from-gray-400 hover:to-gray-500 text-sm font-medium transition-all"
              >
                ✕
              </button>
            </div>
          )}

          {/* Info Banner - Professional Style */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200 px-4 py-2.5 flex items-center gap-2 text-xs sm:text-sm text-blue-800">
            <span className="text-base">ℹ️</span>
            <p className="font-medium">📎 Share images or PDFs for verification • 🔐 Secure & encrypted</p>
          </div>

          {/* Messages Area - Enhanced Styling */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gradient-to-b from-white via-gray-50 to-blue-50 space-y-3 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
            
            {/* Pinned Welcome Message */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-4 sm:p-5 shadow-lg mb-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl sm:text-3xl flex-shrink-0">👋</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base sm:text-lg text-blue-900 mb-2">Welcome to {platformName} Support</h4>
                  <p className="text-sm text-blue-800 mb-3 leading-relaxed">We're here to help with any questions or concerns!</p>
                  
                  <div className="bg-white rounded-lg p-3 mb-3 border-l-4 border-blue-500">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">✨ What we can help with:</p>
                    <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <span>📦</span> <span>Product inquiries & details</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>🚚</span> <span>Order tracking & status</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>↩️</span> <span>Returns & refunds</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>⚙️</span> <span>Technical support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>💳</span> <span>Payment & billing issues</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400 mb-3">
                    <p className="text-xs sm:text-sm font-semibold text-yellow-900 mb-1">⏱️ Response Time</p>
                    <p className="text-xs sm:text-sm text-yellow-800">Our team typically responds within 24 hours during business days.</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                    <p className="text-xs sm:text-sm font-semibold text-green-900 mb-1">📎 Attachments</p>
                    <p className="text-xs sm:text-sm text-green-800">Share images or PDFs for proof of purchase, order confirmations, or issue documentation.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            {filteredMessages.length === 0 && messages.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-5xl mb-3 animate-bounce">🔎</div>
                <p className="font-bold text-gray-700 text-lg">No messages found</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">Try different search keywords</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-5xl mb-3 animate-bounce" style={{ animationDuration: '2s' }}>💬</div>
                <p className="font-bold text-gray-700 text-lg">Start Your Conversation</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xs">
                  👇 Ask any questions about our products or services using the message box below
                </p>
              </div>
            ) : (
              filteredMessages.map((msg, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                  className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'} ${animationsEnabled ? 'animate-in fade-in slide-in-from-bottom-2' : ''} transition-all cursor-pointer`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-200 ${
                      msg.sender === 'customer'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800'
                        : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-none shadow-sm hover:shadow-md hover:border-blue-300'
                    } ${selectedMessageId === msg.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                  >
                    {msg.sender === 'admin' && (
                      <p className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                        <span>👨‍💼</span> Support Team
                      </p>
                    )}
                    {msg.imageUrl && (
                      <div className="mb-2">
                        {msg.imageUrl.toLowerCase().endsWith('.pdf') ? (
                          <a 
                            href={msg.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg border-2 border-red-500 transition cursor-pointer shadow-md"
                            title="Click to open PDF"
                          >
                            <span className="text-2xl">📄</span>
                            <span className="text-sm font-semibold text-red-700">PDF Receipt</span>
                          </a>
                        ) : (
                          <img 
                            src={msg.imageUrl} 
                            alt="Message attachment" 
                            className="w-40 h-40 object-cover rounded-lg border-2 border-gray-300 hover:opacity-90 transition cursor-pointer shadow-md" 
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(msg.imageUrl, '_blank')
                            }}
                            title="Click to view full size"
                          />
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed font-medium">{msg.message}</p>
                    {showTimestamps && (
                      <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.sender === 'customer' && ' ✓✓'}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator - Enhanced */}
            {isTyping && (
              <div className={`flex justify-start ${animationsEnabled ? 'animate-in fade-in' : ''}`}>
                <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Enhanced Design */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t-2 border-gray-200 sticky bottom-0 shadow-lg">
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                {imagePreview === 'pdf' ? (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-500 flex items-center justify-center text-4xl shadow-md">
                    📄
                  </div>
                ) : (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border-2 border-blue-500 shadow-md" />
                )}
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:from-red-600 hover:to-red-700 shadow-lg transition"
                  title="Remove file"
                >
                  ✕
                </button>
                <p className="text-xs text-gray-500 mt-1 font-medium">{selectedImage?.name}</p>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition shadow-sm"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach image or PDF for proof of payment"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-2.5 sm:p-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  📎
                </button>
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() && !selectedImage || uploading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
              >
                {uploading ? '⏳' : '➤'}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-600">
              <p>
                {userName ? (
                  <span className="font-bold text-blue-700">👤 {userName}</span>
                ) : (
                  <span className="italic text-gray-500">Guest User</span>
                )}
              </p>
              <p className="text-gray-400">⏎ Send • Shift+⏎ New line</p>
            </div>
          </form>

          {/* Close Button Indicator */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg z-10 hover:from-red-600 hover:to-red-700 transition cursor-pointer" onClick={() => setIsOpen(false)} title="Close chat">
            ✕
          </div>
        </div>
      )}
    </>
  )
}
