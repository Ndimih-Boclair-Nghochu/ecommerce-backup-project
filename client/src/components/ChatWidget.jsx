import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import axios from '../lib/api'
import { resolveAssetUrl } from '../utils/format'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [userName, setUserName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformName, setPlatformName] = useState('MyShop')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let id = localStorage.getItem('chatDeviceId')
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('chatDeviceId', id)
    }
    setDeviceId(id)
    setUserName(localStorage.getItem('chatUserName') || '')
    loadMessages(id)

    axios.get('/api/platform-name')
      .then((res) => setPlatformName(res.data.platformName || 'MyShop'))
      .catch(() => setPlatformName('MyShop'))
  }, [])

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      return
    }
    setUnreadCount(messages.filter((message) => message.sender === 'admin' && !message.read).length)
  }, [isOpen, messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const loadMessages = async (id) => {
    if (!id) return
    try {
      const response = await axios.get(`/api/chat/${id}`)
      setMessages(response.data || [])
    } catch {
      toast.error('Chat messages could not be loaded')
    }
  }

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return messages
    return messages.filter((message) =>
      `${message.message || ''} ${message.userName || ''}`.toLowerCase().includes(query)
    )
  }, [messages, searchQuery])

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB')
      return
    }
    if (!VALID_FILE_TYPES.includes(file.type)) {
      toast.error('Upload an image or PDF file')
      return
    }
    setSelectedFile(file)

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setFilePreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setFilePreview('pdf')
    }
  }

  const uploadSelectedFile = async () => {
    if (!selectedFile) return null
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const response = await axios.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data.imageUrl
    } finally {
      setUploading(false)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if ((!messageText.trim() && !selectedFile) || !deviceId || sending || uploading) return

    const trimmedName = userName.trim()
    if (trimmedName) localStorage.setItem('chatUserName', trimmedName)

    setSending(true)
    try {
      const imageUrl = await uploadSelectedFile()
      const payload = {
        deviceId,
        userName: trimmedName || 'Guest',
        sender: 'customer',
        message: messageText.trim() || '[Attachment]',
        imageUrl
      }
      const response = await axios.post('/api/chat', payload)
      setMessages((current) => [...current, { ...response.data, read: true }])
      setMessageText('')
      clearSelectedFile()
    } catch {
      toast.error('Message could not be sent')
    } finally {
      setSending(false)
    }
  }

  const systemIntro = {
    id: 'system-intro',
    sender: 'admin',
    message: `Welcome to ${platformName} support. Send your question here and our team will reply as soon as possible. You can also attach a product photo, receipt, or PDF if it helps.`,
    timestamp: null
  }

  const visibleMessages = [systemIntro, ...filteredMessages]

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white shadow-2xl transition hover:scale-105 sm:h-16 sm:w-16 ${
          isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? 'x' : 'Chat'}
      </button>

      {!isOpen && unreadCount > 0 && (
        <div className="fixed bottom-20 right-5 z-50 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 text-xs font-bold text-white shadow-lg sm:bottom-24">
          {unreadCount}
        </div>
      )}

      {isOpen && (
        <section
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[430px]"
          aria-label="Customer support chat"
        >
          <header className="bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <h2 className="text-base font-bold">Customer Support</h2>
                </div>
                <p className="mt-1 text-xs text-blue-100">We usually respond during business hours.</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowSearch((value) => !value)}
                  className="rounded-lg px-3 py-2 text-xs font-bold hover:bg-white/10"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-white/10"
                  aria-label="Close chat"
                >
                  x
                </button>
              </div>
            </div>
          </header>

          {showSearch && (
            <div className="border-b border-blue-100 bg-blue-50 p-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search this conversation"
                className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white via-gray-50 to-blue-50 p-3 sm:p-4">
            {visibleMessages.map((message) => {
              const fromCustomer = message.sender === 'customer'
              return (
                <div key={message.id || message.timestamp || message.message} className={`flex ${fromCustomer ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      fromCustomer
                        ? 'rounded-br-md bg-blue-700 text-white'
                        : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                    }`}
                  >
                    {!fromCustomer && <p className="mb-1 text-xs font-bold text-blue-700">Support</p>}
                    {message.imageUrl && (
                      <div className="mb-2">
                        {message.imageUrl.toLowerCase().endsWith('.pdf') ? (
                          <a href={resolveAssetUrl(message.imageUrl)} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline">
                            Open attached PDF
                          </a>
                        ) : (
                          <img src={resolveAssetUrl(message.imageUrl)} alt="Attachment" className="max-h-44 w-full rounded-lg object-cover" />
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
                    {message.timestamp && (
                      <p className={`mt-1 text-[11px] ${fromCustomer ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white p-3">
            <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                onBlur={() => userName.trim() && localStorage.setItem('chatUserName', userName.trim())}
                placeholder="Your name (optional)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                className="rounded-lg border border-orange-500 px-3 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 disabled:opacity-50"
              >
                Attach
              </button>
            </div>

            {filePreview && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-2">
                <div className="flex min-w-0 items-center gap-2">
                  {filePreview === 'pdf' ? (
                    <span className="rounded bg-white px-2 py-1 text-xs font-bold text-red-700">PDF</span>
                  ) : (
                    <img src={filePreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                  )}
                  <span className="truncate text-xs font-semibold text-gray-700">{selectedFile?.name}</span>
                </div>
                <button type="button" onClick={clearSelectedFile} className="text-xs font-bold text-red-700">
                  Remove
                </button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />

            <div className="flex items-end gap-2">
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSendMessage(event)
                  }
                }}
                rows="2"
                placeholder="Type your message..."
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={(!messageText.trim() && !selectedFile) || sending || uploading}
                className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {sending || uploading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
