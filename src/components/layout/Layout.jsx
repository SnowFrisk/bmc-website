import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className={styles.layout__main}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
