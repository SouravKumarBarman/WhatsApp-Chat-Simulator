import React from 'react'
import { Download, FileJson, Sparkles, Upload } from 'lucide-react'
import { CHAT_TEMPLATES } from '../presets'
import type { ChatConfig, ChatMessage, ChatTemplate } from '../types'

interface TemplatesPanelProps {
  config: ChatConfig
  messages: ChatMessage[]
  onLoadTemplate: (template: ChatTemplate) => void
  onImportJson: (data: { config?: Partial<ChatConfig>; messages?: ChatMessage[] }) => void
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  config,
  messages,
  onLoadTemplate,
  onImportJson,
}) => {
  const handleExportJson = () => {
    const payload = JSON.stringify({ config, messages }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-skit-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        onImportJson(parsed)
      } catch {
        alert('Invalid JSON skit file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Funny Starter Templates
        </div>
        <p className="text-xs text-zinc-500">
          Load a pre-built comedy scenario and customize the punchlines.
        </p>

        <div className="space-y-2 pt-1">
          {CHAT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onLoadTemplate(tpl)}
              className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-emerald-500/50 hover:bg-zinc-900 p-3 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-300 transition">
                  {tpl.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300">
                  {tpl.tag}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{tpl.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Save / Load JSON Skit */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <FileJson className="w-3.5 h-3.5 text-zinc-400" />
          Save / Load Skit File
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 py-2 px-3 text-xs font-medium text-zinc-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Save JSON
          </button>
          <label className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 py-2 px-3 text-xs font-medium text-zinc-200 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Load JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
