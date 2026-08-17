import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './LobbyTips.module.css'


export function LobbyTips({ tips = [] }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (tips.length === 0) return
    const timer = setInterval(() => setIndex(i => (i + 1) % tips.length), 5000)
    return () => clearInterval(timer)
  }, [tips.length])
  // key forces a re-mount per tip so the fade-in animation replays
  return <p key={index} className={styles.battle__tip}>💡 {t(tips[index])}</p>
}
