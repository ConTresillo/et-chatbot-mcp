"use client"

import { Input } from "@/components/ui/input"
import { Cpu, Bot, KeyRound, Globe } from "lucide-react"

interface ModelSettingsProps {
  settings: {
    modelProvider: string
    model: string
    baseUrl?: string
    apiKey?: string
  }
  onSettingsChange: (
    settings: Partial<{
      modelProvider: string
      model: string
      baseUrl: string
      apiKey: string
    }>,
  ) => void
}

export const ModelSettings = ({ settings, onSettingsChange }: ModelSettingsProps) => {
  return (
    <div className="group relative overflow-hidden w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Model Settings</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure the OpenAI-compatible model provider</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Provider</span>
          </div>
          <Input
            value="openai-compatible"
            readOnly
            className="w-[220px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Base URL</span>
          </div>
          <Input
            value={settings.baseUrl || ""}
            onChange={(e) => onSettingsChange({ baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="w-[220px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Model</span>
          </div>
          <Input
            value={settings.model}
            onChange={(e) => onSettingsChange({ model: e.target.value })}
            placeholder="gpt-4o"
            className="w-[220px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">API Key</span>
          </div>
          <Input
            type="password"
            value={settings.apiKey || ""}
            onChange={(e) => onSettingsChange({ apiKey: e.target.value })}
            placeholder="Leave blank to use env / keep existing"
            className="w-[220px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
          />
        </div>
      </div>
    </div>
  )
}
