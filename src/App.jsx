import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import ProblemOfCycle from './pages/ProblemOfCycle'
import PastList from './pages/PastList'
import PastProblem from './pages/PastProblem'
import SpeedMath from './pages/SpeedMath'
import QuestionBank from './pages/QuestionBank'
import Resources from './pages/Resources'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="problem" element={<ProblemOfCycle />} />
              <Route path="problem/past" element={<PastList />} />
              <Route path="problem/past/:problemId" element={<PastProblem />} />
              <Route path="speed" element={<SpeedMath />} />
              <Route path="bank" element={<QuestionBank />} />
              <Route path="resources" element={<Resources />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}