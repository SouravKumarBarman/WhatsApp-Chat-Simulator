import React from 'react'
import type { ChatConfig, ChatMessage, MessageStatus, Participant } from '../types'
import { makeDoodlePatternDataUrl, makeInitialsAvatar } from '../avatars'
import { generateTintedWallpaper, getCachedTintedWallpaper, waDefaultWallpaper } from '../wallpaper'

interface WhatsAppPreviewProps {
  config: ChatConfig
  messages: ChatMessage[]
  selectedMessageId: string | null
  isExporting?: boolean
  onSelectMessage?: (id: string) => void
  onHeaderClick?: () => void
  captureRef?: React.RefObject<HTMLDivElement | null>
}

function TickIcon({ status, dark }: { status?: MessageStatus; dark: boolean }) {
  if (!status) return null
  if (status === 'sending') {
    return (
      <svg className="w-[14px] h-[11px] inline-block ml-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={dark ? '#8696A0' : '#667781'} strokeWidth="1.4" />
        <path d="M8 4.8V8.2L10.3 9.6" stroke={dark ? '#8696A0' : '#667781'} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
  const color = status === 'read' ? '#53BDEB' : dark ? '#8696A0' : '#667781'
  if (status === 'sent') {
    return (
      <svg className="w-[14px] h-[11px] inline-block ml-0.5 shrink-0" viewBox="0 0 16 11" fill="none">
        <path d="M1.5 5.8L5.2 9.5L13.5 1.2" stroke={color} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg className="w-[17px] h-[11px] inline-block ml-0.5 shrink-0" viewBox="0 0 19 11" fill="none">
      <path d="M1.2 5.8L4.8 9.4L12.5 1.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 5.8L9.8 9.4L17.5 1.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VerifiedBadge() {
  return (
    <svg className="w-[15px] h-[15px] inline-block ml-1 shrink-0" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L14.8 4.2L18.4 4.1L19.6 7.5L22.5 9.7L21.5 13.2L22.5 16.7L19.6 18.9L18.4 22.3L14.8 22.2L12 24.4L9.2 22.2L5.6 22.3L4.4 18.9L1.5 16.7L2.5 13.2L1.5 9.7L4.4 7.5L5.6 4.1L9.2 4.2L12 2Z"
        fill="#00A884"
      />
      <path d="M8.5 13.2L10.9 15.6L16 10.2" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function deterministicBars(seed: string, count: number): number[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    const norm = Math.abs(h % 100) / 100
    bars.push(Math.round(4 + norm * 16))
  }
  return bars
}

function getWallpaperStyle(
  config: ChatConfig,
  tintedDoodleUrl: string | null
): React.CSSProperties {
  const isDark = config.theme === 'dark'
  if (config.wallpaper === 'custom' && config.customWallpaper) {
    return {
      backgroundImage: `url("${config.customWallpaper}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  if (config.wallpaper === 'gradient-sunset') {
    return {
      background: isDark
        ? 'linear-gradient(155deg, #1b1429 0%, #24172b 45%, #111b21 100%)'
        : 'linear-gradient(155deg, #fde2e4 0%, #fad2e1 45%, #e2ece9 100%)',
    }
  }
  if (config.wallpaper === 'solid-clean') {
    return {
      backgroundColor: isDark ? '#0B141A' : '#EFEAE2',
    }
  }

  let bgColor = isDark ? '#0B141A' : '#EFEAE2'
  let stroke = isDark ? '#2A3942' : '#B5ACA0'
  const opacity = isDark ? 0.55 : 0.34

  if (config.wallpaper === 'doodle-mint') {
    bgColor = isDark ? '#091815' : '#DFF2EA'
    stroke = isDark ? '#1D4239' : '#7BA899'
  } else if (config.wallpaper === 'doodle-lavender') {
    bgColor = isDark ? '#141122' : '#ECE7F6'
    stroke = isDark ? '#32294F' : '#9B8EB8'
  }

  if (tintedDoodleUrl) {
    return {
      backgroundColor: bgColor,
      backgroundImage: `url("${tintedDoodleUrl}")`,
      backgroundRepeat: 'repeat-y',
      backgroundSize: '402px auto',
      backgroundPosition: 'top center',
    }
  }

  if (config.wallpaper === 'doodle-classic' && !isDark) {
    return {
      backgroundColor: '#EFEAE2',
      backgroundImage: `url("${waDefaultWallpaper}")`,
      backgroundRepeat: 'repeat-y',
      backgroundSize: '402px auto',
      backgroundPosition: 'top center',
    }
  }

  const patternUrl = makeDoodlePatternDataUrl(stroke, opacity)
  return {
    backgroundColor: bgColor,
    backgroundImage: `url("${patternUrl}")`,
    backgroundRepeat: 'repeat',
    backgroundSize: '210px 210px',
  }
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
  config,
  messages,
  selectedMessageId,
  isExporting = false,
  onSelectMessage,
  onHeaderClick,
  captureRef,
}) => {
  const isDark = config.theme === 'dark'
  const isIos = config.platform === 'ios'

  const wallpaperKey = `${config.wallpaper}:${config.theme}`
  const cachedWallpaper = getCachedTintedWallpaper(config.wallpaper, config.theme)
  const [generatedWallpaper, setGeneratedWallpaper] = React.useState<{
    key: string
    url: string
  } | null>(null)

  React.useEffect(() => {
    if (cachedWallpaper) return
    let active = true
    generateTintedWallpaper(config.wallpaper, config.theme).then((url) => {
      if (active && url) {
        setGeneratedWallpaper({ key: wallpaperKey, url })
      }
    })
    return () => {
      active = false
    }
  }, [cachedWallpaper, config.wallpaper, config.theme, wallpaperKey])

  const tintedDoodleUrl =
    cachedWallpaper ?? (generatedWallpaper?.key === wallpaperKey ? generatedWallpaper.url : null)

  const wallpaperStyle = React.useMemo(
    () => getWallpaperStyle(config, tintedDoodleUrl),
    [config, tintedDoodleUrl]
  )

  const myVoiceAvatar = React.useMemo(() => makeInitialsAvatar('YOU', '#00A884'), [])

  const participantMap = React.useMemo(() => {
    const map = new Map<string, Participant>()
    for (const p of config.participants) {
      map.set(p.id, p)
    }
    return map
  }, [config.participants])

  const messageMap = React.useMemo(() => {
    const map = new Map<string, ChatMessage>()
    for (const m of messages) {
      map.set(m.id, m)
    }
    return map
  }, [messages])

  const getSenderMeta = (senderId: string) => {
    if (senderId === 'me') return { name: 'You', color: '#00A884', isMe: true }
    if (senderId === 'them') return { name: config.contactName, color: '#2563EB', isMe: false }
    const p = participantMap.get(senderId)
    if (p) return { name: p.name, color: p.color, isMe: Boolean(p.isMe) }
    return { name: config.contactName, color: '#2563EB', isMe: false }
  }

  // Authentic WhatsApp colors
  const headerBg = isDark ? (isIos ? '#1F2C34' : '#1F2C34') : isIos ? '#F6F6F6' : '#FFFFFF'
  const headerBorder = isDark ? '#2A3942' : '#E2E2E2'
  const primaryText = isDark ? '#E9EDEF' : '#111B21'
  const secondaryText = isDark ? '#8696A0' : '#667781'
  const outBubbleBg = isDark ? '#005C4B' : '#D9FDD3'
  const inBubbleBg = isDark ? '#202C33' : '#FFFFFF'
  const sysPillBg = isDark ? 'rgba(24, 34, 41, 0.92)' : 'rgba(255, 255, 255, 0.92)'
  const sysPillText = isDark ? '#8696A0' : '#54656F'
  const inputAreaBg = isDark ? (isIos ? '#1F2C34' : 'transparent') : isIos ? '#F6F6F6' : 'transparent'
  const inputPillBg = isDark ? '#2A3942' : '#FFFFFF'

  const isTypingStatus =
    config.contactStatus.toLowerCase().includes('typing') ||
    config.contactStatus.toLowerCase().includes('recording')

  const batteryColor = config.isCharging
    ? '#34C759'
    : config.batteryPercent <= 20
      ? '#FF3B30'
      : isDark
        ? '#FFFFFF'
        : '#111B21'

  const screenContent = (
    <div
      ref={captureRef}
      className={`relative flex flex-col overflow-hidden select-none ${
        isIos ? 'wa-ios-font' : 'wa-android-font'
      } ${config.showDeviceFrame ? 'rounded-[38px]' : 'rounded-none'}`}
      style={{
        width: '402px',
        height: config.heightMode === 'phone' ? '874px' : 'auto',
        minHeight: '874px',
        backgroundColor: isDark ? '#0B141A' : '#EFEAE2',
        color: primaryText,
      }}
    >
      {/* Top Phone Status Bar */}
      {config.showStatusBar && (
        <div
          className="relative flex items-center justify-between px-6 pt-3 pb-1.5 text-[13px] font-semibold tracking-tight shrink-0"
          style={{
            backgroundColor: headerBg,
            color: primaryText,
          }}
        >
          {/* Time */}
          <div className="flex items-center gap-1.5 z-10 min-w-[60px]">
            <span>{config.statusTime || '9:41'}</span>
            {!isIos && (
              <span className="text-[11px] opacity-70 font-normal">💬</span>
            )}
          </div>

          {/* iOS Dynamic Island */}
          {isIos && config.showDynamicIsland && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[108px] h-[28px] rounded-full bg-black flex items-center justify-end pr-2.5"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#121629] ring-1 ring-white/10" />
            </div>
          )}

          {/* Right Status Icons: Signal, Wi-Fi, Battery */}
          <div className="flex items-center gap-1.5 z-10">
            {/* Signal Bars */}
            <svg className="w-[16px] h-[11px]" viewBox="0 0 17 12" fill="none">
              {[0, 1, 2, 3].map((bar) => {
                const active = bar < config.signalBars
                const heights = [4, 6, 8.5, 11]
                const h = heights[bar]
                return (
                  <rect
                    key={bar}
                    x={bar * 4.2}
                    y={11.5 - h}
                    width="2.8"
                    height={h}
                    rx="0.8"
                    fill={primaryText}
                    opacity={active ? 1 : 0.28}
                  />
                )
              })}
            </svg>

            {/* Wi-Fi */}
            {config.wifiEnabled ? (
              <svg className="w-[15px] h-[11px]" viewBox="0 0 16 12" fill="none">
                <path d="M8 9.6C8.6 9.6 9.1 10.1 9.1 10.7C9.1 11.3 8.6 11.8 8 11.8C7.4 11.8 6.9 11.3 6.9 10.7C6.9 10.1 7.4 9.6 8 9.6Z" fill={primaryText} />
                <path d="M5.2 8C6 7.2 7 6.8 8 6.8C9 6.8 10 7.2 10.8 8" stroke={primaryText} strokeWidth="1.45" strokeLinecap="round" />
                <path d="M2.9 5.6C4.3 4.2 6.1 3.5 8 3.5C9.9 3.5 11.7 4.2 13.1 5.6" stroke={primaryText} strokeWidth="1.45" strokeLinecap="round" />
                <path d="M0.8 3.2C2.8 1.2 5.3 0.2 8 0.2C10.7 0.2 13.2 1.2 15.2 3.2" stroke={primaryText} strokeWidth="1.45" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="text-[11px] font-bold opacity-85">5G</span>
            )}

            {/* Battery */}
            {!isIos && (
              <span className="text-[11px] font-medium ml-0.5">{config.batteryPercent}%</span>
            )}
            <div className="flex items-center">
              <div
                className="relative w-[24px] h-[12px] rounded-[3.5px] p-[1.5px] flex items-center"
                style={{
                  border: `1.2px solid ${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,27,33,0.4)'}`,
                }}
              >
                <div
                  className="h-full rounded-[1.8px] transition-all"
                  style={{
                    width: `${Math.max(8, Math.min(100, config.batteryPercent))}%`,
                    backgroundColor: batteryColor,
                  }}
                />
                {isIos && config.batteryPercent <= 15 && !config.isCharging && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none"
                    style={{ color: isDark ? '#fff' : '#111' }}
                  >
                    {config.batteryPercent}
                  </span>
                )}
              </div>
              <div
                className="w-[1.5px] h-[4.5px] rounded-r-sm ml-[1px]"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,27,33,0.4)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Chat Header */}
      <div
        onClick={onHeaderClick}
        title="Click to edit contact profile"
        className="flex items-center justify-between px-2.5 py-2 shrink-0 cursor-pointer"
        style={{
          backgroundColor: headerBg,
          borderBottom: `1px solid ${headerBorder}`,
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Back Button */}
          {isIos ? (
            <div className="flex items-center text-[#007AFF] pr-0.5 shrink-0">
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
                <path d="M15.5 19L8.5 12L15.5 5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {config.unreadCount > 0 && (
                <span className="text-[15px] font-normal -ml-1">
                  {config.unreadCount > 99 ? '99+' : config.unreadCount}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center pr-1 shrink-0" style={{ color: primaryText }}>
              <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L11 18M5 12L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Avatar */}
          <img
            src={config.contactAvatar}
            alt={config.contactName}
            className="w-[36px] h-[36px] rounded-full object-cover shrink-0 bg-zinc-700"
          />

          {/* Contact Name & Status */}
          <div className="min-w-0 flex-1 ml-1">
            <div className="flex items-center min-w-0">
              <span
                className="font-semibold text-[15.5px] leading-tight truncate"
                style={{ color: primaryText }}
              >
                {config.contactName || 'Contact'}
              </span>
              {config.verified && <VerifiedBadge />}
            </div>
            {config.contactStatus && (
              <div
                className="text-[12px] leading-tight truncate mt-[1px]"
                style={{
                  color: isTypingStatus ? '#00A884' : secondaryText,
                  fontWeight: isTypingStatus ? 500 : 400,
                }}
              >
                {config.contactStatus}
              </div>
            )}
          </div>
        </div>

        {/* Right Header Action Icons (Video, Call, Menu on Android) */}
        <div
          className="flex items-center gap-4 pl-2 pr-1 shrink-0"
          style={{ color: isIos ? (isDark ? '#E9EDEF' : '#111B21') : primaryText }}
        >
          {/* Video Call Icon */}
          <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none">
            <rect x="2.5" y="6" width="13.5" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 10.2L21.2 7.2V16.8L16 13.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Phone Call Icon */}
          <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none">
            <path
              d="M5.4 4.2C6 3.6 7 3.6 7.6 4.2L10 6.6C10.5 7.1 10.6 7.9 10.1 8.5L8.7 10.1C9.7 12.1 11.4 13.8 13.4 14.8L15 13.4C15.6 12.9 16.4 13 16.9 13.5L19.3 15.9C19.9 16.5 19.9 17.5 19.3 18.1L17.9 19.5C16.7 20.7 14.9 21.1 13.3 20.4C8.9 18.5 5.3 14.9 3.4 10.5C2.7 8.9 3.1 7.1 4.3 5.9L5.4 4.2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!isIos && (
            <svg className="w-[18px] h-[18px] -ml-1" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          )}
        </div>
      </div>

      {/* Chat Wallpaper Container (Messages + Seamless Android Input Bar) */}
      <div className="flex-1 flex flex-col min-h-0" style={wallpaperStyle}>
        {/* Chat Messages Area */}
        <div
          className={`flex-1 px-3 py-2.5 flex flex-col ${
            config.heightMode === 'phone' ? 'overflow-y-auto' : ''
          }`}
        >
        {messages.length === 0 && (
          <div className="m-auto text-center px-6 py-4 rounded-xl" style={{ backgroundColor: sysPillBg, color: sysPillText }}>
            <p className="text-xs font-medium">No messages yet. Add messages from the left panel!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isSelected = !isExporting && selectedMessageId === msg.id
          const prevMsg = idx > 0 ? messages[idx - 1] : null
          const isSystemOrCall = msg.kind === 'system'

          // Determine if this starts a new sender burst (for tail + top margin)
          const sameSenderBurst =
            !isSystemOrCall &&
            prevMsg !== null &&
            prevMsg.kind !== 'system' &&
            prevMsg.senderId === msg.senderId

          const senderMeta = getSenderMeta(msg.senderId)
          const isMe = senderMeta.isMe

          if (msg.kind === 'system') {
            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage?.(msg.id)}
                className={`flex justify-center my-2 cursor-pointer transition-transform ${
                  isSelected ? 'ring-2 ring-emerald-400 rounded-lg' : ''
                }`}
              >
                <div
                  className="px-3 py-1 rounded-lg text-[11.5px] font-medium text-center max-w-[88%] shadow-[0_1px_1px_rgba(0,0,0,0.06)] leading-snug"
                  style={{ backgroundColor: sysPillBg, color: sysPillText }}
                >
                  {msg.text}
                </div>
              </div>
            )
          }

          const replyTarget = msg.replyToId ? messageMap.get(msg.replyToId) : undefined
          const replySenderMeta = replyTarget ? getSenderMeta(replyTarget.senderId) : undefined
          const bubbleBg = isMe ? outBubbleBg : inBubbleBg
          const showSenderNameInGroup = config.isGroup && !isMe && !sameSenderBurst
          const hasReaction = Boolean(msg.reaction)

          return (
            <div
              key={msg.id}
              onClick={() => onSelectMessage?.(msg.id)}
              className={`group relative flex w-full cursor-pointer ${
                isMe ? 'justify-end' : 'justify-start'
              } ${sameSenderBurst ? 'mt-[2px]' : 'mt-[7px]'} ${
                hasReaction ? 'mb-[13px]' : ''
              }`}
            >
              <div
                className={`relative max-w-[80%] min-w-[78px] shadow-[0_1px_0.8px_rgba(11,20,26,0.13)] transition-all ${
                  isSelected ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-transparent' : ''
                }`}
                style={{
                  backgroundColor: bubbleBg,
                  borderRadius: isIos ? '11px' : '10px',
                  borderTopRightRadius: isMe && !sameSenderBurst ? '2px' : isIos ? '11px' : '10px',
                  borderTopLeftRadius: !isMe && !sameSenderBurst ? '2px' : isIos ? '11px' : '10px',
                  padding: msg.kind === 'image' && !msg.text && !replyTarget ? '3px' : '6px 8px 6px 9px',
                }}
              >
                {/* Classic WhatsApp Top Corner Tail on first bubble of burst */}
                {!sameSenderBurst && (
                  <svg
                    className={`absolute top-0 w-[8px] h-[13px] ${
                      isMe ? '-right-[6px]' : '-left-[6px] -scale-x-100'
                    }`}
                    viewBox="0 0 8 13"
                    fill="none"
                  >
                    <path d="M1.5 0H0V13C1 9.5 4.2 5.2 7.5 1.8C8.2 1 7.7 0 6.7 0H1.5Z" fill={bubbleBg} />
                  </svg>
                )}

                {/* Group Sender Name */}
                {showSenderNameInGroup && (
                  <div
                    className="text-[12.5px] font-semibold leading-tight mb-0.5 truncate"
                    style={{ color: senderMeta.color }}
                  >
                    {senderMeta.name}
                  </div>
                )}

                {/* Forwarded Tag */}
                {msg.forwarded && (
                  <div
                    className="flex items-center gap-1 text-[11.5px] italic mb-0.5"
                    style={{ color: secondaryText }}
                  >
                    <span>↪</span>
                    <span>Forwarded</span>
                  </div>
                )}

                {/* Reply / Quote Box */}
                {replyTarget && replySenderMeta && (
                  <div
                    className="rounded-md px-2 py-1 mb-1.5 text-[12px] overflow-hidden"
                    style={{
                      backgroundColor: isDark ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.055)',
                      borderLeft: `3.5px solid ${replySenderMeta.isMe ? '#00A884' : replySenderMeta.color}`,
                    }}
                  >
                    <div
                      className="font-semibold text-[11.5px] leading-tight truncate"
                      style={{ color: replySenderMeta.isMe ? '#00A884' : replySenderMeta.color }}
                    >
                      {replySenderMeta.name}
                    </div>
                    <div
                      className="text-[11.5px] leading-snug line-clamp-2 opacity-85"
                      style={{ color: primaryText }}
                    >
                      {replyTarget.kind === 'image'
                        ? `📷 ${replyTarget.text || 'Photo'}`
                        : replyTarget.kind === 'voice'
                          ? `🎤 Voice message (${replyTarget.voiceDuration || '0:05'})`
                          : replyTarget.kind === 'deleted'
                            ? '🚫 This message was deleted'
                            : replyTarget.text}
                    </div>
                  </div>
                )}

                {/* Message Body by Kind */}
                {msg.kind === 'deleted' ? (
                  <div className="flex items-end justify-between gap-2">
                    <div
                      className="flex items-center gap-1.5 italic text-[14px] leading-[19px]"
                      style={{ color: secondaryText }}
                    >
                      <svg className="w-[15px] h-[15px] shrink-0 opacity-80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
                        <path d="M5.6 5.6L18.4 18.4" stroke="currentColor" strokeWidth="1.9" />
                      </svg>
                      <span>{msg.text || (isMe ? 'You deleted this message' : 'This message was deleted')}</span>
                    </div>
                    <span className="text-[10.5px] shrink-0 leading-none mb-[1px]" style={{ color: secondaryText }}>
                      {msg.time}
                    </span>
                  </div>
                ) : msg.kind === 'call' ? (
                  <div className="flex items-center gap-2.5 pr-1 py-0.5 min-w-[195px]">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: msg.callMissed
                          ? 'rgba(239, 68, 68, 0.14)'
                          : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)',
                        color: msg.callMissed ? '#EF4444' : '#00A884',
                      }}
                    >
                      {msg.callType === 'video' ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <rect x="2.5" y="6" width="13.5" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                          <path d="M16 10.2L21.2 7.2V16.8L16 13.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5.4 4.2C6 3.6 7 3.6 7.6 4.2L10 6.6C10.5 7.1 10.6 7.9 10.1 8.5L8.7 10.1C9.7 12.1 11.4 13.8 13.4 14.8L15 13.4C15.6 12.9 16.4 13 16.9 13.5L19.3 15.9C19.9 16.5 19.9 17.5 19.3 18.1L17.9 19.5C16.7 20.7 14.9 21.1 13.3 20.4C8.9 18.5 5.3 14.9 3.4 10.5C2.7 8.9 3.1 7.1 4.3 5.9L5.4 4.2Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium leading-tight" style={{ color: primaryText }}>
                        {msg.text || (msg.callMissed ? 'Missed voice call' : 'Voice call')}
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-0.5 text-[11px]" style={{ color: secondaryText }}>
                        <span>{msg.callMissed ? 'Tap to call back' : msg.callDuration || 'Answered'}</span>
                        <span>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                ) : msg.kind === 'voice' ? (
                  <div className="flex items-center gap-2.5 min-w-[215px] py-0.5">
                    {/* Play icon */}
                    <button
                      type="button"
                      tabIndex={-1}
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ color: secondaryText }}
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5.5v13l11-6.5-11-6.5z" />
                      </svg>
                    </button>

                    {/* Waveform + Duration */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-[2px] h-[22px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 mr-0.5"
                          style={{
                            backgroundColor: msg.voicePlayed ? secondaryText : '#53BDEB',
                          }}
                        />
                        {deterministicBars(msg.id, 24).map((height, bIdx) => (
                          <div
                            key={bIdx}
                            className="w-[2.5px] rounded-full"
                            style={{
                              height: `${height}px`,
                              backgroundColor:
                                bIdx < 5 && msg.voicePlayed
                                  ? '#53BDEB'
                                  : isDark
                                    ? 'rgba(233, 237, 239, 0.35)'
                                    : 'rgba(17, 27, 33, 0.28)',
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] mt-1 leading-none" style={{ color: secondaryText }}>
                        <span>{msg.voiceDuration || '0:07'}</span>
                        <span className="flex items-center">
                          {msg.time}
                          {isMe && <TickIcon status={msg.status || 'read'} dark={isDark} />}
                        </span>
                      </div>
                    </div>

                    {/* Mic / Avatar badge */}
                    <div className="relative w-9 h-9 shrink-0">
                      <img
                        src={isMe ? myVoiceAvatar : config.contactAvatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover opacity-90"
                      />
                      <span
                        className="absolute -bottom-0.5 -left-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: bubbleBg,
                          color: msg.voicePlayed ? secondaryText : '#53BDEB',
                        }}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a1 1 0 1 0-2 0 3 3 0 0 1-6 0 1 1 0 1 0-2 0 5 5 0 0 0 4 4.9V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.1A5 5 0 0 0 17 11z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                ) : msg.kind === 'image' ? (
                  <div>
                    <div className="relative overflow-hidden rounded-[8px]">
                      {msg.imageUrl ? (
                        <img
                          src={msg.imageUrl}
                          alt="attachment"
                          className="w-full max-w-[270px] max-h-[260px] object-cover block"
                        />
                      ) : (
                        <div className="w-[240px] h-[160px] bg-zinc-700/40 flex items-center justify-center text-xs">
                          No image selected
                        </div>
                      )}
                      {!msg.text && (
                        <div
                          className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded-full text-[10.5px] flex items-center text-white"
                          style={{ backgroundColor: 'rgba(11, 20, 26, 0.55)' }}
                        >
                          <span>{msg.time}</span>
                          {isMe && <TickIcon status={msg.status || 'read'} dark={true} />}
                        </div>
                      )}
                    </div>
                    {msg.text && (
                      <div className="px-1.5 pt-1.5 pb-0.5 text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
                        <span>{msg.text}</span>
                        <span
                          className="float-right ml-2.5 mt-[5px] text-[10.5px] leading-none inline-flex items-center"
                          style={{ color: secondaryText }}
                        >
                          {msg.edited && <span className="mr-1">Edited</span>}
                          {msg.time}
                          {isMe && <TickIcon status={msg.status || 'read'} dark={isDark} />}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Text Bubble */
                  <div className="text-[14.5px] leading-[19.5px] whitespace-pre-wrap break-words">
                    <span>{msg.text}</span>
                    <span
                      className="float-right ml-2.5 mt-[6px] text-[10.5px] leading-none inline-flex items-center select-none"
                      style={{ color: secondaryText }}
                    >
                      {msg.edited && <span className="mr-1">Edited</span>}
                      <span>{msg.time}</span>
                      {isMe && <TickIcon status={msg.status || 'read'} dark={isDark} />}
                    </span>
                  </div>
                )}

                {/* Emoji Reaction Badge */}
                {msg.reaction && (
                  <div
                    className={`absolute -bottom-[14px] ${
                      isMe ? 'right-2' : 'left-2'
                    } px-1.5 py-[1px] rounded-full text-[13px] leading-[18px] shadow-sm border`}
                    style={{
                      backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                      borderColor: isDark ? '#0B141A' : '#E9EDEF',
                    }}
                  >
                    {msg.reaction}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Input Bar */}
      {config.showInputBar && (
        <div
          className={`shrink-0 ${isIos ? 'px-2.5 pt-1.5 pb-2' : 'px-2 py-1.5'}`}
          style={
            isIos
              ? {
                  backgroundColor: inputAreaBg,
                  borderTop: `1px solid ${headerBorder}`,
                }
              : { backgroundColor: 'transparent' }
          }
        >
          {isIos ? (
            <>
              <div className="flex items-end gap-2">
                {/* Plus button */}
                <div className="w-8 h-8 flex items-center justify-center shrink-0 mb-0.5" style={{ color: '#007AFF' }}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Pill input */}
                <div
                  className="flex-1 min-h-[34px] rounded-[18px] px-3 py-1.5 flex items-center justify-between gap-2 border"
                  style={{
                    backgroundColor: inputPillBg,
                    borderColor: isDark ? '#374751' : '#E0E0E0',
                  }}
                >
                  <span
                    className="text-[14.5px] leading-tight break-all"
                    style={{
                      color: config.draftText ? primaryText : secondaryText,
                      opacity: config.draftText ? 1 : 0.7,
                    }}
                  >
                    {config.draftText || ''}
                    {config.draftText && (
                      <span className="inline-block w-[1.5px] h-[15px] bg-[#007AFF] align-middle ml-[1px]" />
                    )}
                  </span>
                  {/* Sticker icon */}
                  <svg className="w-5 h-5 shrink-0" style={{ color: secondaryText }} viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="4.5" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                    <circle cx="15" cy="10" r="1.2" fill="currentColor" />
                    <path d="M8.5 14.5C9.5 16 14.5 16 15.5 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Camera & Mic OR Send Button */}
                {config.draftText ? (
                  <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 mb-0.5">
                    <svg className="w-4 h-4 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.5 21L22 12L2.5 3V10L16 12L2.5 14V21Z" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 mb-1 px-0.5 shrink-0" style={{ color: isDark ? '#E9EDEF' : '#111B21' }}>
                    <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8.5 6L9.8 4H14.2L15.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                    <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* iOS Home Indicator */}
              {config.showStatusBar && (
                <div className="flex justify-center pt-3 pb-0.5">
                  <div
                    className="w-[130px] h-[4.5px] rounded-full"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(17,27,33,0.85)' }}
                  />
                </div>
              )}
            </>
          ) : (
            /* Android Material Input Bar */
            <div className="flex items-end gap-1.5">
              <div
                className="flex-1 min-h-[42px] rounded-full px-3 py-2 flex items-center gap-2.5 shadow-sm"
                style={{ backgroundColor: inputPillBg }}
              >
                <svg className="w-5 h-5 shrink-0" style={{ color: secondaryText }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                  <circle cx="15" cy="10" r="1.2" fill="currentColor" />
                  <path d="M8.5 14.5C9.7 16.2 14.3 16.2 15.5 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span
                  className="flex-1 text-[15px] leading-tight break-all"
                  style={{ color: config.draftText ? primaryText : secondaryText }}
                >
                  {config.draftText || 'Message'}
                </span>
                <svg className="w-5 h-5 shrink-0 -rotate-45" style={{ color: secondaryText }} viewBox="0 0 24 24" fill="none">
                  <path d="M21.4 11.1L12.2 20.3a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2L9.6 17.7a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                {!config.draftText && (
                  <svg className="w-5 h-5 shrink-0" style={{ color: secondaryText }} viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </div>

              {/* Green Mic / Send FAB */}
              <div className="w-[42px] h-[42px] rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-sm">
                {config.draftText ? (
                  <svg className="w-5 h-5 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.5 21L22 12L2.5 3V10L16 12L2.5 14V21Z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a1 1 0 1 0-2 0 3 3 0 0 1-6 0 1 1 0 1 0-2 0 5 5 0 0 0 4 4.9V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.1A5 5 0 0 0 17 11z" />
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )

  if (!config.showDeviceFrame) {
    return (
      <div className="shadow-[0_24px_70px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden">
        {screenContent}
      </div>
    )
  }

  return (
    <div
      className="p-[10px] rounded-[48px] bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,0.75)] ring-1 ring-white/15"
    >
      <div className="p-[2px] rounded-[40px] bg-black">
        {screenContent}
      </div>
    </div>
  )
}
