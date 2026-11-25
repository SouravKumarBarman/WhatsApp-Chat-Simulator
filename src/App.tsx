import React, { useEffect, useRef, useState } from 'react'
import { toBlob, toPng } from 'html-to-image'
import {
  Camera,
  Check,
  Copy,
  Download,
  Layers,
  Maximize2,
  MessageSquarePlus,
  Moon,
  SlidersHorizontal,
  Smartphone,
  Sun,
} from 'lucide-react'
import { CHAT_TEMPLATES, DEFAULT_CONFIG } from './presets'
import type { ChatConfig, ChatMessage, ChatTemplate } from './types'
import { WhatsAppPreview } from './components/WhatsAppPreview'
import { MessageComposer } from './components/MessageComposer'
import { ProfileSettingsPanel } from './components/ProfileSettingsPanel'
import { TemplatesPanel } from './components/TemplatesPanel'

type EditorTab = 'messages' | 'profile' | 'templates'

const STORAGE_KEY = 'wa_meme_studio_v1'

function loadInitialState(): { config: ChatConfig; messages: ChatMessage[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.config && Array.isArray(parsed?.messages)) {
        return {
          config: { ...DEFAULT_CONFIG, ...parsed.config },
          messages: parsed.messages,
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  const starter = CHAT_TEMPLATES[0]
  return {
    config: { ...DEFAULT_CONFIG, ...starter.config },
    messages: starter.messages,
  }
}

export function App() {
  const initial = React.useMemo(() => loadInitialState(), [])
  const [config, setConfig] = useState<ChatConfig>(initial.config)
  const [messages, setMessages] = useState<ChatMessage[]>(initial.messages)
  const [activeTab, setActiveTab] = useState<EditorTab>('messages')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit')
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 600, h: 700 })
  const [phoneSize, setPhoneSize] = useState<{ w: number; h: number }>({ w: 402, h: 874 })

  const captureRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const phoneOuterRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stageEl = stageRef.current
    const phoneEl = phoneOuterRef.current
    if (!stageEl || !phoneEl) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === stageEl) {
          setStageSize({
            w: entry.contentRect.width,
            h: entry.contentRect.height,
          })
        } else if (entry.target === phoneEl) {
          setPhoneSize({
            w: phoneEl.offsetWidth || 402,
            h: phoneEl.offsetHeight || 874,
          })
        }
      }
    })
    ro.observe(stageEl)
    ro.observe(phoneEl)
    return () => ro.disconnect()
  }, [])

  const fitScale = React.useMemo(() => {
    const availW = Math.max(200, stageSize.w - 32)
    const availH = Math.max(240, stageSize.h - 68)
    const s = Math.min(1, availW / phoneSize.w, availH / phoneSize.h)
    return Math.max(0.4, Math.min(1, Number(s.toFixed(3))))
  }, [stageSize, phoneSize])

  const activeScale = isExporting || zoomMode === 'actual' ? 1 : fitScale

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, messages }))
    } catch {
      // ignore quota errors for large custom images
    }
  }, [config, messages])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev))
    }, 2600)
  }

  const updateConfig = (patch: Partial<ChatConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
    setSelectedMessageId(msg.id)
  }

  const updateMessage = (id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    if (selectedMessageId === id) setSelectedMessageId(null)
  }

  const moveMessage = (id: string, dir: 'up' | 'down') => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id)
      if (idx === -1) return prev
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const duplicateMessage = (id: string) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id)
      if (idx === -1) return prev
      const orig = prev[idx]
      const copy: ChatMessage = {
        ...orig,
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }

  const loadTemplate = (tpl: ChatTemplate) => {
    setConfig((prev) => ({ ...prev, ...tpl.config }))
    setMessages(tpl.messages)
    setSelectedMessageId(null)
    setActiveTab('messages')
    showToast(`Loaded "${tpl.title}"`)
  }

  const importJson = (data: { config?: Partial<ChatConfig>; messages?: ChatMessage[] }) => {
    if (data.config) {
      setConfig((prev) => ({ ...prev, ...data.config }))
    }
    if (Array.isArray(data.messages)) {
      setMessages(data.messages)
    }
    setSelectedMessageId(null)
    showToast('Loaded skit from JSON!')
  }

  const waitTwoFrames = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

  const handleDownloadPng = async () => {
    if (!captureRef.current) return
    try {
      setIsExporting(true)
      await waitTwoFrames()
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: config.exportScale,
        cacheBust: true,
      })
      const slug = (config.contactName || 'whatsapp-chat')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const link = document.createElement('a')
      link.download = `${slug || 'whatsapp'}-${config.platform}-${config.theme}.png`
      link.href = dataUrl
      link.click()
      showToast(`Saved ${config.exportScale}x PNG screenshot!`)
    } catch (err) {
      console.error(err)
      showToast('Export failed — check console for details.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyImage = async () => {
    if (!captureRef.current) return
    try {
      setIsExporting(true)
      await waitTwoFrames()
      const blob = await toBlob(captureRef.current, {
        pixelRatio: config.exportScale,
        cacheBust: true,
      })
      if (!blob) throw new Error('Failed to generate image blob')
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        showToast('Copied screenshot to clipboard!')
      } else {
        throw new Error('Clipboard image API unavailable')
      }
    } catch (err) {
      console.error(err)
      showToast('Clipboard copy blocked by browser — use Download PNG instead.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top Studio Header */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur px-4 flex items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-zinc-950 shadow-sm shrink-0">
            <Camera className="w-4 h-4 stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-zinc-100 truncate">
              WhatsApp Chat Simulator
            </h1>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Funny Conversation Maker &amp; Screenshot Generator
            </p>
          </div>
        </div>

        {/* Quick Toggles & Export Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateConfig({ platform: config.platform === 'ios' ? 'android' : 'ios' })
            }
            title="Switch iOS / Android"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
            {config.platform === 'ios' ? 'iPhone' : 'Android'}
          </button>

          <button
            type="button"
            onClick={() =>
              updateConfig({ theme: config.theme === 'light' ? 'dark' : 'light' })
            }
            title="Toggle Light / Dark Mode"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition cursor-pointer"
          >
            {config.theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="hidden sm:inline">
              {config.theme === 'light' ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyImage}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-100 transition cursor-pointer disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Image</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>{isExporting ? 'Rendering...' : 'Download PNG'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Editor Panel */}
        <aside className="w-full lg:w-[440px] xl:w-[470px] border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-zinc-950 flex flex-col lg:h-[calc(100vh-3.5rem)]">
          {/* Tabs */}
          <div className="grid grid-cols-3 border-b border-zinc-800/80 bg-zinc-950 p-1.5 gap-1 shrink-0">
            {(
              [
                { id: 'messages', label: 'Messages', icon: MessageSquarePlus },
                { id: 'profile', label: 'Profile & Look', icon: SlidersHorizontal },
                { id: 'templates', label: 'Templates', icon: Layers },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'messages' && (
              <MessageComposer
                config={config}
                messages={messages}
                selectedMessageId={selectedMessageId}
                onSelectMessage={setSelectedMessageId}
                onAddMessage={addMessage}
                onUpdateMessage={updateMessage}
                onDeleteMessage={deleteMessage}
                onMoveMessage={moveMessage}
                onDuplicateMessage={duplicateMessage}
                onClearMessages={() => {
                  setMessages([])
                  setSelectedMessageId(null)
                }}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileSettingsPanel config={config} onUpdateConfig={updateConfig} />
            )}

            {activeTab === 'templates' && (
              <TemplatesPanel
                config={config}
                messages={messages}
                onLoadTemplate={loadTemplate}
                onImportJson={importJson}
              />
            )}
          </div>
        </aside>

        {/* Right Live Preview Stage */}
        <section
          ref={stageRef}
          className="flex-1 lg:h-[calc(100vh-3.5rem)] overflow-auto flex flex-col items-center justify-start py-3 px-4 relative"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="mb-2.5 flex items-center gap-2 flex-wrap justify-center shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-full px-3 py-1">
              <span>Click any bubble to edit or react</span>
            </div>
            <button
              type="button"
              onClick={() => setZoomMode((m) => (m === 'fit' ? 'actual' : 'fit'))}
              title="Toggle Fit-to-Screen vs 100% actual size"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-full px-3 py-1 transition cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-emerald-400" />
              {zoomMode === 'fit'
                ? `Fit Screen (${Math.round(fitScale * 100)}%)`
                : 'Actual Size (100%)'}
            </button>
          </div>

          <div
            className="flex items-start justify-center shrink-0"
            style={{
              width: `${Math.round(phoneSize.w * activeScale)}px`,
              height: `${Math.round(phoneSize.h * activeScale)}px`,
            }}
          >
            <div
              ref={phoneOuterRef}
              style={{
                transform: activeScale === 1 ? 'none' : `scale(${activeScale})`,
                transformOrigin: 'top center',
              }}
            >
              <WhatsAppPreview
                config={config}
                messages={messages}
                selectedMessageId={selectedMessageId}
                isExporting={isExporting}
                onSelectMessage={(id) => {
                  setSelectedMessageId(id)
                  setActiveTab('messages')
                }}
                onHeaderClick={() => setActiveTab('profile')}
                captureRef={captureRef}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 border border-emerald-500/40 px-4 py-2.5 text-xs font-medium text-zinc-100 shadow-xl">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default App
