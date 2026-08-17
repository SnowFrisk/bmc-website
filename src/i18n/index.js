import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import zh from './zh.json'

const STORAGE_KEY = 'bmc-lang'

// 語言偵測次序：URL ?lang= → localStorage bmc-lang → 預設 'en'
// （?lang= 用嚟俾 Blackbaud embed 釘死語言；localStorage 記住學生自己揀嘅）
function detectLanguage() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl === 'en' || fromUrl === 'zh') return fromUrl
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'zh') return stored
  } catch { /* SSR/私隱模式——照預設 */ }
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React 自己 escape
})

// Navbar toggle 用：切語言 + 持久化（URL ?lang= 唔郁——只係啟動偵測）
export function setAppLanguage(lang) {
  i18n.changeLanguage(lang)
  try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
}

export function currentLanguage() {
  return i18n.language?.startsWith('zh') ? 'zh' : 'en'
}

export default i18n
