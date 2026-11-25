import React, { useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import type { ChatConfig, Participant, WallpaperId } from '../types'
import { PRESET_AVATARS, makeEmojiAvatar } from '../avatars'

interface ProfileSettingsPanelProps {
  config: ChatConfig
  onUpdateConfig: (patch: Partial<ChatConfig>) => void
}

const GROUP_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444']

export const ProfileSettingsPanel: React.FC<ProfileSettingsPanelProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [customEmoji, setCustomEmoji] = useState('🫠')

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'contactAvatar' | 'customWallpaper'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      if (field === 'customWallpaper') {
        onUpdateConfig({ wallpaper: 'custom', customWallpaper: dataUrl })
      } else {
        onUpdateConfig({ contactAvatar: dataUrl })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const addParticipant = () => {
    const nextColor = GROUP_COLORS[config.participants.length % GROUP_COLORS.length]
    const next: Participant = {
      id: `p_${Date.now().toString(36)}`,
      name: `Friend ${config.participants.length}`,
      color: nextColor,
    }
    onUpdateConfig({ participants: [...config.participants, next] })
  }

  const updateParticipant = (id: string, patch: Partial<Participant>) => {
    onUpdateConfig({
      participants: config.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })
  }

  const removeParticipant = (id: string) => {
    onUpdateConfig({
      participants: config.participants.filter((p) => p.id !== id),
    })
  }

  return (
    <div className="space-y-5">
      {/* Platform & Theme */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Look & Platform
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateConfig({ platform: 'ios' })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              config.platform === 'ios'
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            iPhone (iOS)
          </button>
          <button
            type="button"
            onClick={() => onUpdateConfig({ platform: 'android' })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              config.platform === 'android'
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            Android
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateConfig({ theme: 'light' })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              config.theme === 'light'
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            ☀️ Light Mode
          </button>
          <button
            type="button"
            onClick={() => onUpdateConfig({ theme: 'dark' })}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              config.theme === 'dark'
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            🌙 Dark Mode
          </button>
        </div>

        {/* Wallpaper */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs text-zinc-400 block">Chat Wallpaper</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'doodle-classic', label: 'Classic Doodle' },
                { id: 'doodle-mint', label: 'Mint Doodle' },
                { id: 'doodle-lavender', label: 'Lavender' },
                { id: 'solid-clean', label: 'Clean Solid' },
                { id: 'gradient-sunset', label: 'Sunset' },
              ] as { id: WallpaperId; label: string }[]
            ).map((wp) => (
              <button
                key={wp.id}
                type="button"
                onClick={() => onUpdateConfig({ wallpaper: wp.id })}
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium border transition ${
                  config.wallpaper === wp.id
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {wp.label}
              </button>
            ))}
            <label className="px-2 py-1.5 rounded-md text-[11px] font-medium border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 cursor-pointer flex items-center justify-center gap-1">
              <Upload className="w-3 h-3" />
              Custom
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'customWallpaper')}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Contact / Group Profile */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Contact & Chat Header
          </h3>
          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isGroup}
              onChange={(e) => onUpdateConfig({ isGroup: e.target.checked })}
            />
            Group Chat
          </label>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">
              {config.isGroup ? 'Group Name' : 'Contact Name'}
            </label>
            <input
              type="text"
              value={config.contactName}
              onChange={(e) => onUpdateConfig({ contactName: e.target.value })}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">
              Status Subtitle
            </label>
            <input
              type="text"
              value={config.contactStatus}
              onChange={(e) => onUpdateConfig({ contactStatus: e.target.value })}
              placeholder="online / typing... / last seen..."
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['online', 'typing...', 'recording audio...', 'last seen today at 2:14 AM', ''].map(
                (st) => (
                  <button
                    key={st || 'none'}
                    type="button"
                    onClick={() => onUpdateConfig({ contactStatus: st })}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10.5px] text-zinc-300"
                  >
                    {st || 'Blank'}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.verified}
                onChange={(e) => onUpdateConfig({ verified: e.target.checked })}
              />
              Verified Green Checkmark
            </label>

            {config.platform === 'ios' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Unread:</span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={config.unreadCount}
                  onChange={(e) =>
                    onUpdateConfig({ unreadCount: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-14 rounded bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 text-xs text-zinc-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Avatar Picker */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-zinc-400">Profile Picture</label>
            <label className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1">
              <Upload className="w-3 h-3" />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'contactAvatar')}
              />
            </label>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_AVATARS.map((av) => (
              <button
                key={av.label}
                type="button"
                title={av.label}
                onClick={() => onUpdateConfig({ contactAvatar: av.url })}
                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition ${
                  config.contactAvatar === av.url
                    ? 'border-emerald-400 scale-110'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
              </button>
            ))}
            <div className="flex items-center gap-1 ml-1 bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-0.5">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="w-7 text-center bg-transparent text-sm focus:outline-none"
                maxLength={4}
              />
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({
                    contactAvatar: makeEmojiAvatar(customEmoji || '😎', '#6366f1', '#4338ca'),
                  })
                }
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium px-1"
              >
                Use
              </button>
            </div>
          </div>
        </div>

        {/* Group Participants */}
        {config.isGroup && (
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400">Group Members</span>
              <button
                type="button"
                onClick={addParticipant}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="w-3 h-3" /> Add Member
              </button>
            </div>
            <div className="space-y-1.5">
              {config.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={p.color}
                    onChange={(e) => updateParticipant(p.id, { color: e.target.value })}
                    className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                    className="flex-1 rounded bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-zinc-100"
                  />
                  {!p.isMe && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.id)}
                      className="p-1 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Phone Status Bar & Unsent Draft */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Status Bar & Input Box
          </h3>
          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showStatusBar}
              onChange={(e) => onUpdateConfig({ showStatusBar: e.target.checked })}
            />
            Show Status Bar
          </label>
        </div>

        {config.showStatusBar && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Phone Clock</label>
                <input
                  type="text"
                  value={config.statusTime}
                  onChange={(e) => onUpdateConfig({ statusTime: e.target.value })}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-2.5 py-1 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  Battery ({config.batteryPercent}%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={config.batteryPercent}
                    onChange={(e) => onUpdateConfig({ batteryPercent: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ batteryPercent: 3, isCharging: false })}
                    title="Meme 3% battery"
                    className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-semibold"
                  >
                    3%
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.wifiEnabled}
                  onChange={(e) => onUpdateConfig({ wifiEnabled: e.target.checked })}
                />
                Wi-Fi (off = 5G)
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isCharging}
                  onChange={(e) => onUpdateConfig({ isCharging: e.target.checked })}
                />
                Charging
              </label>
              {config.platform === 'ios' && (
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showDynamicIsland}
                    onChange={(e) => onUpdateConfig({ showDynamicIsland: e.target.checked })}
                  />
                  Dynamic Island
                </label>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showInputBar}
                onChange={(e) => onUpdateConfig({ showInputBar: e.target.checked })}
              />
              Show Bottom Input Bar
            </label>
          </div>

          {config.showInputBar && (
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">
                Unsent Draft Text (Comedic typing gag)
              </label>
              <input
                type="text"
                value={config.draftText}
                onChange={(e) => onUpdateConfig({ draftText: e.target.value })}
                placeholder="e.g. respectfully, no."
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700/80 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>
      </section>

      {/* Framing & Export */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Screenshot Framing & Export
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateConfig({ heightMode: 'auto' })}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border transition ${
              config.heightMode === 'auto'
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400'
            }`}
          >
            Auto-Fit Full Chat
          </button>
          <button
            type="button"
            onClick={() => onUpdateConfig({ heightMode: 'phone' })}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border transition ${
              config.heightMode === 'phone'
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400'
            }`}
          >
            iPhone 17 (402×874)
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showDeviceFrame}
              onChange={(e) => onUpdateConfig({ showDeviceFrame: e.target.checked })}
            />
            Phone Bezel Frame
          </label>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Scale:</span>
            {([1, 2, 3] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => onUpdateConfig({ exportScale: sc })}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  config.exportScale === sc
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {sc}x
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
