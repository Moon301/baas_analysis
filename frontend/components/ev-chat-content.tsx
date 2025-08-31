"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Message } from "@/types/chat"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "@/components/code-block"
import { MessageSquare } from "lucide-react"

export function EvChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useOpenAI, setUseOpenAI] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-oss:20b")

  // 모델 목록
  const openaiModels = useMemo(
    () => ["gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini"],
    []
  )
  const ollamaModels = useMemo(
    () => [
      "gpt-oss:20b",
      "gpt-oss:120b",
      "gemma3:12b",
      "phi4:14b",
      "qwen3:14b",
      "qwen2.5:14b",
      "llama3.3:latest",
    ],
    []
  )

  // Provider 전환 시 기본 모델 동기화
  const handleProviderChange = (isOpenAI: boolean) => {
    setUseOpenAI(isOpenAI)
    setSelectedModel(isOpenAI ? "gpt-3.5-turbo" : "gpt-oss:20b")
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    const content = inputValue.trim()
    if (!content || isLoading) return
    
    setIsLoading(true)
    setInputValue("")
    
    try {
      // 사용자 메시지를 즉시 표시
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        content: content,
        timestamp: new Date(),
        chatId: "ev-chat",
      }
      
      setMessages(prev => [...prev, userMessage])
      
      // 백엔드로 메시지와 선택된 모델 전송
      const formData = new FormData()
      formData.append('message', content)
      formData.append('model', selectedModel)
      formData.append('provider', useOpenAI ? 'openai' : 'ollama')
      
      const response = await fetch('/api/v1/baas/chat', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`메시지 전송 실패: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("BaaS 응답:", data)
      
      // AI 응답을 메시지 목록에 추가
      const aiMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.response || "응답을 받지 못했습니다.",
        timestamp: new Date(),
        chatId: "ev-chat",
        modelInfo: {
          provider: useOpenAI ? "OpenAI" : "Ollama",
          model: selectedModel
        }
      }
      
      setMessages(prev => [...prev, aiMessage])
      
    } catch (error) {
      console.error("BaaS 메시지 전송 실패:", error)
      
      // 에러 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '메시지 전송에 실패했습니다.'
      showToast(`❌ 오류: ${errorMessage}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Enter 전송 (Shift+Enter 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if ((e.nativeEvent as any).isComposing) return
      handleSendMessage()
    }
  }

  // textarea autosize
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0px"
    const next = Math.min(el.scrollHeight, 160) // 최대 높이 제한
    el.style.height = next + "px"
  }
  useEffect(() => {
    autoResize()
  }, [inputValue])

  // 스크롤 하단 고정
  const bottomRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // 토스트 메시지 표시
  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-white ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, type === 'success' ? 3000 : 5000)
  }

  // Markdown 렌더링 컴포넌트
  const markdownComponents = {
    p: ({ children }: any) => <p className="mb-4 last:mb-0">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="text-gray-800">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4">{children}</blockquote>
    ),
    a: ({ href, children }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        {children}
      </a>
    ),
    code: ({ children, className }: any) => {
      if (className && className.includes("language-")) {
        return <CodeBlock code={String(children)} language={className.replace("language-", "")} />
      }
      return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
    },
  }

  return (
    // 3행 grid: 헤더 / 스크롤영역 / 입력영역 — 여백 없이 정확히 맞물리게
    <div className="min-h-screen grid grid-rows-[auto,1fr,auto]">
      {/* 상단 설정 바 */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/90 backdrop-blur px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">🤖 Provider</span>
                <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => handleProviderChange(false)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-md transition-colors font-medium",
                      !useOpenAI ? "bg-blue-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    Ollama
                  </button>
                  <button
                    onClick={() => handleProviderChange(true)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-md transition-colors font-medium",
                      useOpenAI ? "bg-blue-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    OpenAI
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">🎯 Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                >
                  {(useOpenAI ? openaiModels : ollamaModels).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
              현재: {useOpenAI ? "OpenAI" : "Ollama"} • {selectedModel}
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">EV Chat</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                전기차 데이터 분석을 위한 AI 채팅입니다. 다양한 AI 모델을 선택하여 전기차 관련 질문에 대한 지능적인 응답을 받을 수 있습니다.
              </p>
              <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 사용 팁</h3>
                <div className="text-sm text-blue-800 space-y-2 text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>전기차 성능, 효율성, 주행 특성에 대해 질문해보세요</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>배터리 수명, 충전 패턴, 차량 비교 등 구체적으로 물어보세요</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>AI 모델을 선택하여 다양한 응답을 경험해보세요</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "user" ? (
                <div className="order-3 w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  Me
                </div>
              ) : (
                <div className="order-1 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  AI
                </div>
              )}

              <div className={cn(message.role === "user" ? "max-w-[70%] order-2" : "max-w-[85%] order-1")}> 
                <div className="bg-gray-50 rounded-lg p-5 text-gray-900 break-words">
                  {message.role === "assistant" && message.modelInfo && message.modelInfo.provider && message.modelInfo.model && (
                    <div className="text-xs text-gray-500 mb-3 pb-2 border-b border-gray-200">
                      🤖 {message.modelInfo.provider}: {message.modelInfo.model}
                    </div>
                  )}
                  <div className="text-gray-900 break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className={cn("text-xs text-gray-500 mt-3", message.role === "user" ? "text-right" : "text-left")}> 
                  {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString() : String(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                AI
              </div>
              <div className="max-w-[85%]">
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 bg-white p-3 pb-[max(0px,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-end gap-3"
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={autoResize}
              placeholder="전기차 관련 질문을 입력하세요..."
              className="flex-1 min-h-[44px] max-h-40 px-4 py-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-y-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              disabled={isLoading}
              rows={1}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="h-11 px-4 bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
