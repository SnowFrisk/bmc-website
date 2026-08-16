import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import styles from './Layout.module.css'

export default function Layout() {
  const location = useLocation()
  return (
    <>
      <Navbar />
      {/* key={pathname} remounts the content on route change so the
          entrance animation replays — new page fades in, old page is
          dropped instantly (no overlap/flash, same principle as the
          speed arena mode switch). Navbar/Footer stay put. */}
      <main key={location.pathname} className={styles.layout__main}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
