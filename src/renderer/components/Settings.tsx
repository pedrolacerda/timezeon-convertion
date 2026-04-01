import { useState, useEffect, useCallback } from 'react'
import { ComputerIcon, SunIcon, MoonIcon, BoltIcon } from './Icons'

interface SettingsProps {
  theme: {
    theme: 'light' | 'dark'
    setting: 'system' | 'light' | 'dark'
    updateThemeSetting: (s: 'system' | 'light' | 'dark') => void
  }
}

const themeOptions: { value: 'system' | 'light' | 'dark'; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'System', icon: <ComputerIcon /> },
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
]

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function formatAccelerator(accel: string): string {
  return accel
    .replace('CommandOrControl', '⌘')
    .replace('Command', '⌘')
    .replace('Control', '⌃')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace('Option', '⌥')
    .replace(/\+/g, '')
}

function keyEventToAccelerator(e: KeyboardEvent): string | null {
  const parts: string[] = []
  if (e.metaKey) parts.push('CommandOrControl')
  if (e.ctrlKey && !e.metaKey) parts.push('CommandOrControl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  const key = e.key
  if (['Meta', 'Control', 'Shift', 'Alt'].includes(key)) return null

  const keyMap: Record<string, string> = {
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    ' ': 'Space',
    Enter: 'Return',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Escape: 'Escape',
    Tab: 'Tab',
  }

  const mapped = keyMap[key] || key.toUpperCase()
  parts.push(mapped)

  if (parts.length < 2) return null
  return parts.join('+')
}

export default function Settings({ theme }: SettingsProps) {
  const [launchAtLogin, setLaunchAtLogin] = useState(false)
  const [shortcut, setShortcut] = useState('')
  const [capturing, setCapturing] = useState(false)
  const [capturedKey, setCapturedKey] = useState('')

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setLaunchAtLogin(s.launchAtLogin)
      setShortcut(s.globalShortcut)
    })
  }, [])

  const handleLaunchToggle = async (value: boolean) => {
    setLaunchAtLogin(value)
    const settings = await window.api.getSettings()
    await window.api.setSettings({ ...settings, launchAtLogin: value })
  }

  const handleKeyCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!capturing) return
      e.preventDefault()
      e.stopPropagation()
      const accel = keyEventToAccelerator(e)
      if (accel) setCapturedKey(accel)
    },
    [capturing],
  )

  useEffect(() => {
    if (capturing) {
      window.addEventListener('keydown', handleKeyCapture, true)
      return () => window.removeEventListener('keydown', handleKeyCapture, true)
    }
  }, [capturing, handleKeyCapture])

  const saveShortcut = async () => {
    if (!capturedKey) return
    setShortcut(capturedKey)
    setCapturing(false)
    setCapturedKey('')
    const settings = await window.api.getSettings()
    await window.api.setSettings({ ...settings, globalShortcut: capturedKey })
  }

  const cancelCapture = () => {
    setCapturing(false)
    setCapturedKey('')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      {/* Appearance */}
      <SectionCard title="Appearance">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => theme.updateThemeSetting(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                  theme.setting === opt.value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xs">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Currently using <span className="font-medium">{theme.theme}</span> mode
          {theme.setting === 'system' && ' (following system)'}
        </p>
      </SectionCard>

      {/* Behavior */}
      <SectionCard title="Behavior">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Launch at Login</span>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Start TimeZap automatically when you log in
            </p>
          </div>
          <ToggleSwitch checked={launchAtLogin} onChange={handleLaunchToggle} />
        </div>
      </SectionCard>

      {/* Keyboard Shortcut */}
      <SectionCard title="Keyboard Shortcut">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Global Shortcut</span>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Show/hide TimeZap from anywhere
            </p>
          </div>
          {!capturing ? (
            <div className="flex items-center gap-2">
              <kbd className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {formatAccelerator(shortcut)}
              </kbd>
              <button
                onClick={() => {
                  setCapturing(true)
                  setCapturedKey('')
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500/10"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <kbd className="min-w-[80px] rounded-md border-2 border-blue-500 bg-blue-50 px-2.5 py-1 text-center font-mono text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                {capturedKey ? formatAccelerator(capturedKey) : 'Press keys…'}
              </kbd>
              <button
                onClick={saveShortcut}
                disabled={!capturedKey}
                className="rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={cancelCapture}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard title="About">
        <div className="text-center">
          <BoltIcon className="h-8 w-8 mx-auto text-blue-500" />
          <h4 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">TimeZap</h4>
          <p className="text-xs text-gray-400 dark:text-gray-500">Version 1.0.0</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            A fast, beautiful timezone converter that lives in your menu bar.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
