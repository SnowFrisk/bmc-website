import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <>
      <Navbar />
      <main style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        flex: 1,
      }}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}