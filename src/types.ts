export type Platform = 'ios' | 'android'
export type ThemeMode = 'light' | 'dark'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'
export type MessageKind = 'text' | 'image' | 'voice' | 'deleted' | 'system' | 'call'
export type WallpaperId =
  | 'doodle-classic'
  | 'doodle-mint'
  | 'doodle-lavender'
  | 'solid-clean'
  | 'gradient-sunset'
  | 'custom'

export interface Participant {
  id: string
  name: string
  color: string
  isMe?: boolean
}

export interface ChatMessage {
  id: string
  senderId: string // 'me' | 'them' | participant id
  kind: MessageKind
  text: string
  time: string
  status?: MessageStatus
  reaction?: string
  replyToId?: string
  imageUrl?: string
  voiceDuration?: string
  voicePlayed?: boolean
  callMissed?: boolean
  callType?: 'voice' | 'video'
  callDuration?: string
  forwarded?: boolean
  edited?: boolean
}

export interface ChatConfig {
  platform: Platform
  theme: ThemeMode
  isGroup: boolean
  contactName: string
  contactStatus: string
  contactAvatar: string
  verified: boolean
  participants: Participant[]
  wallpaper: WallpaperId
  customWallpaper?: string
  showStatusBar: boolean
  statusTime: string
  batteryPercent: number
  isCharging: boolean
  signalBars: 1 | 2 | 3 | 4
  wifiEnabled: boolean
  showDynamicIsland: boolean
  showDeviceFrame: boolean
  showInputBar: boolean
  draftText: string
  unreadCount: number
  heightMode: 'auto' | 'phone'
  exportScale: 1 | 2 | 3
}

export interface ChatTemplate {
  id: string
  title: string
  tag: string
  description: string
  config: Partial<ChatConfig>
  messages: ChatMessage[]
}
