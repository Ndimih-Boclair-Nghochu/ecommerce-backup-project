import React, { useState, useEffect, useRef } from 'react'import toast from 'react-hot-toast'

import axios from 'axios'
import { resolveAssetUrl } from '../utils/format'

export default function AdminMessaging({ token }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const [filterBy, setFilterBy] = useState('all') // all, admin, customer
  const [sortBy, setSortBy] = useState('recent') // recent, oldest
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [mutedChats, setMutedChats] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/admin/chats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(res.data || [])
    } catch (err) {
      console.error('Failed to fetch conversations')
    }
  }

  const loadConversation = async (deviceId) => {
    try {
      const res = await axios.get(`/api/chat/${deviceId}`)
      setMessages(res.data || [])
      setSelectedConversation(deviceId)
    } catch (err) {
      console.error('Failed to load conversation')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage || !selectedConversation) return

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
        console.error('Failed to upload image')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    setLoading(true)
    try {
      await axios.post('/api/admin/chats/' + selectedConversation + '/reply', 
        { message: inputValue, imageUrl }, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      await loadConversation(selectedConversation)
      setInputValue('')
      setSelectedImage(null)
      setImagePreview(null)
    } catch (err) {
      console.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast('File size should be less than 10MB')
        return
      }
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        toast('Please upload an image (JPG, PNG, GIF, WebP) or PDF file')
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

  const getLastMessage = (deviceId) => {
    const conv = conversations.find(c => c.deviceId === deviceId)
    if (conv && conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1]
      return lastMsg.message.substring(0, 30) + '...'
    }
    return 'No messages yet'
  }

  // Filter messages based on filterBy
  const filteredMessages = messages.filter(msg => {
    if (filterBy === 'admin') return msg.sender === 'admin'
    if (filterBy === 'customer') return msg.sender === 'customer'
    return true
  }).sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp)
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  // Search in conversations
  const filteredConversations = conversations.filter(conv => {
    const query = searchQuery.toLowerCase()
    return (
      conv.userName?.toLowerCase().includes(query) ||
      conv.deviceId?.toLowerCase().includes(query) ||
      getLastMessage(conv.deviceId).toLowerCase().includes(query)
    )
  })

  // Chat actions
  const clearChat = async () => {
    if (!selectedConversation) return
    if (window.confirm('Are you sure you want to clear all messages in this chat? This cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/chats/${selectedConversation}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessages([])
        fetchConversations()
        setShowActionMenu(false)
        toast('Chat cleared successfully')
      } catch (err) {
        console.error('Failed to clear chat:', err)
        toast('Failed to clear chat')
      }
    }
  }

  const deleteChat = async () => {
    if (!selectedConversation) return
    if (window.confirm('Are you sure you want to delete this entire conversation? This cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/chats/${selectedConversation}/delete`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSelectedConversation(null)
        fetchConversations()
        setShowActionMenu(false)
        toast('Conversation deleted successfully')
      } catch (err) {
        console.error('Failed to delete chat:', err)
        toast('Failed to delete chat')
      }
    }
  }

  const blockUser = () => {
    if (!selectedConversation) return
    const userName = conversations.find(c => c.deviceId === selectedConversation)?.userName
    if (!blockedUsers.includes(selectedConversation)) {
      setBlockedUsers([...blockedUsers, selectedConversation])
      toast(`User "${userName}" has been blocked. You won't receive messages from them.`)
    } else {
      setBlockedUsers(blockedUsers.filter(id => id !== selectedConversation))
      toast(`User "${userName}" has been unblocked.`)
    }
    setShowActionMenu(false)
  }

  const muteChat = () => {
    if (!selectedConversation) return
    if (!mutedChats.includes(selectedConversation)) {
      setMutedChats([...mutedChats, selectedConversation])
      toast('Chat notifications muted')
    } else {
      setMutedChats(mutedChats.filter(id => id !== selectedConversation))
      toast('Chat notifications unmuted')
    }
    setShowActionMenu(false)
  }

  const exportChat = async () => {
    if (!selectedConversation) return
    try {
      const conv = conversations.find(c => c.deviceId === selectedConversation)
      const chatData = {
        userName: conv?.userName || 'Unknown',
        deviceId: selectedConversation,
        exportDate: new Date().toISOString(),
        messages: filteredMessages.map(msg => ({
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp,
          imageUrl: msg.imageUrl
        }))
      }
      
      const dataStr = JSON.stringify(chatData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chat_${conv?.userName || selectedConversation}_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      setShowActionMenu(false)
    } catch (err) {
      console.error('Failed to export chat:', err)
      toast('Failed to export chat')
    }
  }

  return (
    <div className="grid min-h-[70dvh] grid-cols-1 gap-4 bg-gradient-to-br from-gray-50 via-white to-blue-50 lg:h-[calc(100dvh-190px)] lg:grid-cols-3 lg:gap-6 lg:overflow-hidden">
      {/* Conversations List - Enhanced Design */}
      <div className="max-h-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg flex flex-col lg:col-span-1 lg:max-h-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white p-4 shadow-md sm:p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>💬</span> Conversations
          </h2>
          <p className="text-purple-100 text-sm mt-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {conversations.length} active chat(s)
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-200">
          <input
            type="text"
            placeholder="🔍 Search by name, ID, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition"
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-purple-100">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="text-5xl mb-2 animate-bounce">💭</p>
              <p className="font-semibold">No conversations</p>
              <p className="text-xs mt-1">Waiting for customers...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.deviceId}
                  onClick={() => loadConversation(conv.deviceId)}
                  className={`w-full p-4 text-left transition-all duration-200 ${
                    selectedConversation === conv.deviceId
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-l-4 border-purple-600 shadow-md'
                      : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {conv.userName?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{conv.userName || '👤 Guest'}</p>
                      <p className="text-sm text-gray-600 truncate">{getLastMessage(conv.deviceId)}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        🕐 {conv.lastMessage ? new Date(conv.lastMessage.timestamp).toLocaleString() : 'No messages'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - Enhanced Design */}
      <div className="min-h-[70dvh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg flex flex-col lg:col-span-2 lg:min-h-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white p-4 shadow-md sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-lg">
                      {conversations.find(c => c.deviceId === selectedConversation)?.userName?.[0]?.toUpperCase() || 'G'}
                    </div>
                    Chat with {conversations.find(c => c.deviceId === selectedConversation)?.userName || 'Customer'}
                  </h3>
                  <p className="text-purple-100 text-sm mt-1 font-mono">📱 {selectedConversation.substring(0, 20)}...</p>
                </div>
                <div className="flex gap-2 relative">
                  <button
                    onClick={() => setAnimationsEnabled(!animationsEnabled)}
                    className={`p-3 rounded-lg transition-all ${animationsEnabled ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-600 hover:bg-gray-500'}`}
                    title="Toggle animations"
                  >
                    {animationsEnabled ? '✨' : '⏸'}
                  </button>
                  
                  {/* Action Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowActionMenu(!showActionMenu)}
                      className="p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                      title="Chat actions"
                    >
                      ⋮
                    </button>
                    
                    {showActionMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-white text-gray-900 rounded-lg shadow-2xl border-2 border-purple-200 z-50 min-w-max">
                        <button
                          onClick={muteChat}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition border-b border-gray-200 flex items-center gap-2 font-semibold text-sm"
                        >
                          {mutedChats.includes(selectedConversation) ? '🔔' : '🔕'} {mutedChats.includes(selectedConversation) ? 'Unmute' : 'Mute'} Chat
                        </button>
                        <button
                          onClick={blockUser}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition border-b border-gray-200 flex items-center gap-2 font-semibold text-sm"
                        >
                          {blockedUsers.includes(selectedConversation) ? '✅' : '🚫'} {blockedUsers.includes(selectedConversation) ? 'Unblock' : 'Block'} User
                        </button>
                        <button
                          onClick={clearChat}
                          className="w-full text-left px-4 py-3 hover:bg-yellow-50 transition border-b border-gray-200 flex items-center gap-2 font-semibold text-sm text-orange-600"
                        >
                          🗑️ Clear Chat
                        </button>
                        <button
                          onClick={exportChat}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-200 flex items-center gap-2 font-semibold text-sm text-blue-600"
                        >
                          📥 Export Chat
                        </button>
                        <button
                          onClick={deleteChat}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 transition flex items-center gap-2 font-semibold text-sm text-red-600"
                        >
                          ❌ Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-200 p-3 flex gap-2 items-center flex-wrap sm:p-4 sm:gap-3">
              <div className="flex gap-2 items-center">
                <span className="text-sm font-semibold text-gray-700">📊 Filter:</span>
                {['all', 'admin', 'customer'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFilterBy(opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterBy === opt
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white border-2 border-purple-300 text-gray-700 hover:border-purple-500'
                    }`}
                  >
                    {opt === 'all' ? '📝 All' : opt === 'admin' ? '👨‍💼 Admin' : '👤 Customer'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm font-semibold text-gray-700">⏳ Sort:</span>
                {['recent', 'oldest'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === opt
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white border-2 border-blue-300 text-gray-700 hover:border-blue-500'
                    }`}
                  >
                    {opt === 'recent' ? '🔄 Recent' : '🔙 Oldest'}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-white via-gray-50 to-blue-50 space-y-4 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100 sm:p-6">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-5xl mb-3 animate-bounce">👋</p>
                  <p className="text-lg font-semibold">No messages in this conversation</p>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} ${animationsEnabled ? 'animate-in fade-in slide-in-from-bottom-2' : ''} cursor-pointer transition-all`}
                  >
                    <div
                      className={`max-w-[85vw] px-4 py-3 rounded-2xl transition-all duration-200 sm:max-w-sm sm:px-5 ${
                        msg.sender === 'admin'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none shadow-md hover:shadow-lg hover:from-purple-700 hover:to-blue-700'
                          : 'bg-white border-2 border-gray-300 text-gray-900 rounded-bl-none shadow-sm hover:shadow-md hover:border-purple-300'
                      } ${selectedMessageId === msg.id ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                    >
                      {msg.imageUrl && (
                        <>
                          {msg.imageUrl.toLowerCase().endsWith('.pdf') ? (
                            <a 
                              href={resolveAssetUrl(msg.imageUrl)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 px-3 py-2 rounded-lg border-2 border-red-500 transition cursor-pointer mb-2 shadow-md"
                              title="Click to open PDF"
                            >
                              <span className="text-2xl">📄</span>
                              <span className="text-sm font-semibold text-red-700">PDF Receipt</span>
                            </a>
                          ) : (
                            <img 
                              src={resolveAssetUrl(msg.imageUrl)}
                              alt="Message attachment" 
                              className="w-48 h-48 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90 transition shadow-md border-2 border-gray-300" 
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(resolveAssetUrl(msg.imageUrl), '_blank')
                              }} 
                            />
                          )}
                        </>
                      )}
                      <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                      <p className={`text-xs mt-2.5 font-semibold flex items-center gap-1 ${
                        msg.sender === 'admin'
                          ? 'text-purple-100'
                          : 'text-gray-600'
                      }`}>
                        🕐 {new Date(msg.timestamp).toLocaleTimeString()} {msg.sender === 'admin' && '✓✓'}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Enhanced */}
            <div className="border-t-2 border-gray-200 p-3 bg-white shadow-lg sm:p-6">
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  {imagePreview === 'pdf' ? (
                    <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-500 flex items-center justify-center text-3xl shadow-md">
                      📄
                    </div>
                  ) : (
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-purple-500 shadow-md" />
                  )}
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:from-red-600 hover:to-red-700 shadow-lg transition"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your response... (Shift+Enter for new line)"
                  className="min-w-0 flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition shadow-sm"
                  disabled={loading || uploading}
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
                  disabled={uploading || loading}
                  title="Attach image or PDF"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-lg transition disabled:opacity-50 shadow-md"
                >
                  📎
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || uploading || (!inputValue.trim() && !selectedImage)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-lg"
                >
                  {loading || uploading ? '⏳' : '📤 Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">💡 Shift+Enter for new line</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-7xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>💬</p>
              <p className="text-xl font-bold">Select a conversation</p>
              <p className="text-sm mt-2">Choose a chat from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
