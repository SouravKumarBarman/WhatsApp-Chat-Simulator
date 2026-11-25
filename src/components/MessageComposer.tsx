import React, { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Copy,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Phone,
  Plus,
  Reply,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { ChatConfig, ChatMessage, MessageKind, MessageStatus } from '../types'
import { makeMemeCardImage } from '../avatars'

interface MessageComposerProps {
  config: ChatConfig
  messages: ChatMessage[]
  selectedMessageId: string | null
  onSelectMessage: (id: string | null) => void
  onAddMessage: (msg: ChatMessage) => void
  onUpdateMessage: (id: string, patch: Partial<ChatMessage>) => void
  onDeleteMessage: (id: string) => void
  onMoveMessage: (id: string, dir: 'up' | 'down') => void
  onDuplicateMessage: (id: string) => void
  onClearMessages: () => void
}

const QUICK_REACTIONS = ['😂', '💀', '😭', '❤️', '👍', '🙏', '🔥', '👀']

const MEME_PRESETS = [
  {
    label: 'Clown Check',
    url: makeMemeCardImage('ME AFTER SAYING', '🤡', '"IM ON MY WAY"', '#881337', '#be123c'),
  },
  {
    label: 'This Is Fine',
    url: makeMemeCardImage('EVERYTHING IS', '🔥', 'TOTALLY FINE', '#7c2d12', '#c2410c'),
  },
  {
    label: 'Side Eye',
    url: makeMemeCardImage('WHAT DID YOU', '🤨', 'JUST SEND ME', '#1e293b', '#334155'),
  },
]

function nextTimeString(lastTime?: string): string {
  if (!lastTime) return '11:42 PM'
  const m = lastTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) return lastTime
  let hours = parseInt(m[1], 10)
  let mins = parseInt(m[2], 10) + 1
  let period = m[3] ? m[3].toUpperCase() : ''
  if (mins >= 60) {
    mins = 0
    hours += 1
    if (period) {
      if (hours === 12) period = period === 'AM' ? 'PM' : 'AM'
      if (hours > 12) hours = 1
    } else if (hours >= 24) {
      hours = 0
    }
  }
  const mm = String(mins).padStart(2, '0')
  return period ? `${hours}:${mm} ${period}` : `${hours}:${mm}`
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  config,
  messages,
  selectedMessageId,
  onSelectMessage,
  onAddMessage,
  onUpdateMessage,
  onDeleteMessage,
  onMoveMessage,
  onDuplicateMessage,
  onClearMessages,
}) => {
  const [senderId, setSenderId] = useState<string>('me')
  const [kind, setKind] = useState<MessageKind>('text')
  const [text, setText] = useState('')
  const [time, setTime] = useState(() => {
    const lastDated = [...messages].reverse().find((m) => m.time)
    return nextTimeString(lastDated?.time)
  })
  const [status, setStatus] = useState<MessageStatus>('read')
  const [replyToId, setReplyToId] = useState<string>('')
  const [voiceDuration, setVoiceDuration] = useState('0:08')
  const [imageUrl, setImageUrl] = useState(MEME_PRESETS[0].url)
  const [callMissed, setCallMissed] = useState(true)
  const [callType, setCallType] = useState<'voice' | 'video'>('voice')

  const senderOptions = React.useMemo(() => {
    if (!config.isGroup) {
      return [
        { id: 'me', label: 'Me (Right)', color: '#10b981' },
        { id: 'them', label: config.contactName || 'Them', color: '#3b82f6' },
      ]
    }
    return config.participants.map((p) => ({
      id: p.id,
      label: p.isMe ? `${p.name} (Me)` : p.name,
      color: p.color,
    }))
  }, [config.isGroup, config.contactName, config.participants])

  const selectedMsg = messages.find((m) => m.id === selectedMessageId) || null

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetMsgId?: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      if (targetMsgId) {
        onUpdateMessage(targetMsgId, { imageUrl: result })
      } else {
        setImageUrl(result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCreate = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (kind === 'text' && !text.trim()) return
    if (kind === 'system' && !text.trim()) return

    const effectiveSender = kind === 'system' ? 'system' : senderId
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: effectiveSender,
      kind,
      text:
        kind === 'deleted'
          ? effectiveSender === 'me'
            ? 'You deleted this message'
            : 'This message was deleted'
          : kind === 'call'
            ? text.trim() || (callMissed ? `Missed ${callType} call` : `${callType === 'video' ? 'Video' : 'Voice'} call`)
            : text,
      time: kind === 'system' ? '' : time,
      status: effectiveSender === 'me' ? status : undefined,
      replyToId: replyToId || undefined,
      voiceDuration: kind === 'voice' ? voiceDuration : undefined,
      voicePlayed: kind === 'voice' ? false : undefined,
      imageUrl: kind === 'image' ? imageUrl : undefined,
      callMissed: kind === 'call' ? callMissed : undefined,
      callType: kind === 'call' ? callType : undefined,
    }

    onAddMessage(newMsg)
    setText('')
    setReplyToId('')
    if (kind !== 'system') {
      setTime((prev) => nextTimeString(prev))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add New Message Card */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Add Message
          </span>
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'text', icon: MessageSquare, label: 'Text' },
                { id: 'image', icon: ImageIcon, label: 'Image' },
                { id: 'voice', icon: Mic, label: 'Voice' },
                { id: 'deleted', icon: Ban, label: 'Deleted' },
                { id: 'call', icon: Phone, label: 'Call' },
                { id: 'system', icon: Sparkles, label: 'Pill' },
              ] as const
            ).map((item) => {
              const Icon = item.icon
              const active = kind === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKind(item.id)}
                  title={item.label}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sender Picker */}
        {kind !== 'system' && (
          <div className="flex flex-wrap gap-1.5">
            {senderOptions.map((opt) => {
              const active = senderId === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSenderId(opt.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    active
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="truncate max-w-[130px]">{opt.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Kind-specific inputs */}
        {kind === 'image' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {MEME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`px-2 py-1 rounded-md text-[11px] border transition ${
                    imageUrl === preset.url
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <label className="px-2.5 py-1 rounded-md text-[11px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 cursor-pointer">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e)}
                />
              </label>
            </div>
          </div>
        )}

        {kind === 'voice' && (
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-400">Duration</label>
            <input
              type="text"
              value={voiceDuration}
              onChange={(e) => setVoiceDuration(e.target.value)}
              placeholder="0:08"
              className="w-24 rounded-lg bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-1">
              {['0:02', '0:14', '4:27', '12:03'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setVoiceDuration(d)}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {kind === 'call' && (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value as 'voice' | 'video')}
              className="rounded-lg bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-100"
            >
              <option value="voice">Voice call</option>
              <option value="video">Video call</option>
            </select>
            <button
              type="button"
              onClick={() => setCallMissed((v) => !v)}
              className={`px-2.5 py-1 rounded-lg text-xs border ${
                callMissed
                  ? 'border-red-500/40 bg-red-500/15 text-red-300'
                  : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {callMissed ? 'Missed' : 'Answered'}
            </button>
          </div>
        )}

        {kind !== 'voice' && kind !== 'deleted' && (
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder={
              kind === 'system'
                ? 'e.g. TODAY, or "You blocked this contact"'
                : kind === 'image'
                  ? 'Optional image caption...'
                  : kind === 'call'
                    ? 'Label (optional, e.g. Missed voice call)'
                    : 'Type message... (Enter to add, Shift+Enter for newline)'
            }
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        )}

        {/* Meta Row: Time, Reply Quote, Status, Submit */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {kind !== 'system' && (
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="11:42 PM"
                className="w-[82px] rounded-lg bg-zinc-950 border border-zinc-700/80 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            )}

            {kind !== 'system' && senderId === 'me' && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MessageStatus)}
                className="rounded-lg bg-zinc-950 border border-zinc-700/80 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="read">Read (Blue ✓✓)</option>
                <option value="delivered">Delivered (✓✓)</option>
                <option value="sent">Sent (✓)</option>
                <option value="sending">Sending (🕒)</option>
              </select>
            )}

            {kind !== 'system' && messages.some((m) => m.kind !== 'system') && (
              <select
                value={replyToId}
                onChange={(e) => setReplyToId(e.target.value)}
                className="max-w-[140px] rounded-lg bg-zinc-950 border border-zinc-700/80 px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="">No quote reply</option>
                {messages
                  .filter((m) => m.kind !== 'system')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      Reply: {m.text ? m.text.slice(0, 24) : m.kind}
                    </option>
                  ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs px-3.5 py-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </form>

      {/* Selected Message Quick Inspector */}
      {selectedMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">
              Editing Selected Message
            </span>
            <button
              type="button"
              onClick={() => onSelectMessage(null)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200"
            >
              Done
            </button>
          </div>

          {selectedMsg.kind !== 'voice' && (
            <textarea
              rows={2}
              value={selectedMsg.text}
              onChange={(e) => onUpdateMessage(selectedMsg.id, { text: e.target.value })}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          )}

          {selectedMsg.kind === 'image' && (
            <div className="flex items-center gap-2">
              <label className="px-2.5 py-1 rounded-md text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer border border-zinc-700">
                Replace Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, selectedMsg.id)}
                />
              </label>
            </div>
          )}

          {selectedMsg.kind === 'voice' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={selectedMsg.voiceDuration || '0:05'}
                onChange={(e) => onUpdateMessage(selectedMsg.id, { voiceDuration: e.target.value })}
                className="w-24 rounded-lg bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-zinc-100"
              />
              <button
                type="button"
                onClick={() =>
                  onUpdateMessage(selectedMsg.id, { voicePlayed: !selectedMsg.voicePlayed })
                }
                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-200 border border-zinc-700"
              >
                {selectedMsg.voicePlayed ? 'Played (Grey dot)' : 'Unplayed (Blue dot)'}
              </button>
            </div>
          )}

          {selectedMsg.kind !== 'system' && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedMsg.senderId}
                  onChange={(e) => onUpdateMessage(selectedMsg.id, { senderId: e.target.value })}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
                >
                  {senderOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={selectedMsg.time}
                  onChange={(e) => onUpdateMessage(selectedMsg.id, { time: e.target.value })}
                  className="w-20 rounded-lg bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
                />

                {(selectedMsg.senderId === 'me' ||
                  config.participants.find((p) => p.id === selectedMsg.senderId)?.isMe) && (
                  <select
                    value={selectedMsg.status || 'read'}
                    onChange={(e) =>
                      onUpdateMessage(selectedMsg.id, { status: e.target.value as MessageStatus })
                    }
                    className="rounded-lg bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
                  >
                    <option value="read">Read</option>
                    <option value="delivered">Delivered</option>
                    <option value="sent">Sent</option>
                    <option value="sending">Sending</option>
                  </select>
                )}

                <label className="inline-flex items-center gap-1 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedMsg.forwarded)}
                    onChange={(e) =>
                      onUpdateMessage(selectedMsg.id, { forwarded: e.target.checked })
                    }
                  />
                  Forwarded
                </label>

                <label className="inline-flex items-center gap-1 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedMsg.edited)}
                    onChange={(e) => onUpdateMessage(selectedMsg.id, { edited: e.target.checked })}
                  />
                  Edited
                </label>
              </div>

              {/* Reaction Quick Bar */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] text-zinc-400 mr-1">Reaction:</span>
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      onUpdateMessage(selectedMsg.id, {
                        reaction: selectedMsg.reaction === emoji ? undefined : emoji,
                      })
                    }
                    className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition ${
                      selectedMsg.reaction === emoji
                        ? 'bg-emerald-500/30 ring-1 ring-emerald-400'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
                {selectedMsg.reaction && (
                  <button
                    type="button"
                    onClick={() => onUpdateMessage(selectedMsg.id, { reaction: undefined })}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Timeline List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Timeline ({messages.length})
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearMessages}
              className="text-[11px] text-zinc-500 hover:text-red-400 transition"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {messages.map((msg, idx) => {
            const isSelected = selectedMessageId === msg.id
            const senderLabel =
              msg.kind === 'system'
                ? 'System'
                : msg.senderId === 'me'
                  ? 'Me'
                  : msg.senderId === 'them'
                    ? config.contactName
                    : config.participants.find((p) => p.id === msg.senderId)?.name || 'Member'

            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage(isSelected ? null : msg.id)}
                className={`group flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs cursor-pointer transition ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-zinc-800/90 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold truncate max-w-[110px] ${
                        msg.kind === 'system'
                          ? 'text-zinc-400'
                          : msg.senderId === 'me'
                            ? 'text-emerald-400'
                            : 'text-sky-400'
                      }`}
                    >
                      {senderLabel}
                    </span>
                    {msg.time && <span className="text-[10px] text-zinc-500">{msg.time}</span>}
                    {msg.reaction && <span>{msg.reaction}</span>}
                    {msg.replyToId && <Reply className="w-3 h-3 text-zinc-500" />}
                  </div>
                  <p className="text-zinc-300 truncate mt-0.5">
                    {msg.kind === 'voice'
                      ? `🎤 Voice note (${msg.voiceDuration || '0:05'})`
                      : msg.kind === 'image'
                        ? `🖼️ Photo ${msg.text ? `— ${msg.text}` : ''}`
                        : msg.kind === 'deleted'
                          ? `🚫 ${msg.text}`
                          : msg.kind === 'call'
                            ? `📞 ${msg.text}`
                            : msg.text}
                  </p>
                </div>

                <div
                  className="flex items-center gap-0.5 shrink-0 opacity-75 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveMessage(msg.id, 'up')}
                    title="Move up"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-25"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === messages.length - 1}
                    onClick={() => onMoveMessage(msg.id, 'down')}
                    title="Move down"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-25"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateMessage(msg.id)}
                    title="Duplicate"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMessage(msg.id)}
                    title="Delete"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
