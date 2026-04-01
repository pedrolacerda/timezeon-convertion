import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [setting, setSetting] = useState<'system' | 'light' | 'dark'>('system')

  useEffect(() => {
    window.api.getTheme().then(setTheme)
    window.api.getSettings().then((s) => setSetting(s.theme))
    const unsub = window.api.onThemeChange((t) => setTheme(t as 'light' | 'dark'))
    return unsub
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const updateThemeSetting = async (newSetting: 'system' | 'light' | 'dark') => {
    setSetting(newSetting)
    const settings = await window.api.getSettings()
    await window.api.setSettings({ ...settings, theme: newSetting })
    if (newSetting !== 'system') {
      setTheme(newSetting)
    } else {
      const sysTheme = await window.api.getTheme()
      setTheme(sysTheme)
    }
  }

  return { theme, setting, updateThemeSetting }
}
