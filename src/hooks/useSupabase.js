import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetch all problem tiers for the currently active cycle.
 * Returns { problems, cycleNumber, loading, error }.
 *
 * "Active" means is_active = true. If multiple cycles are active the hook
 * picks the one with the highest cycle_number.
 *
 * Each problem row includes a nested `difficulty_levels` object
 * { id, label, points } via FK join.
 */
export function useCurrentProblems() {
  const [problems, setProblems] = useState([])
  const [cycleNumber, setCycleNumber] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProblems() {
      setLoading(true)
      setError(null)

      const { data, error: sbError } = await supabase
        .from('problems')
        .select('*, difficulty_levels(*)')
        .eq('is_active', true)
        .order('cycle_number', { ascending: false })
        .order('difficulty_level_id', { ascending: true }) // 1=Easy, 2=Medium, 3=Hard

      if (cancelled) return

      if (sbError) {
        setError(sbError.message)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setProblems([])
        setCycleNumber(null)
        setLoading(false)
        return
      }

      // Keep only the highest cycle_number group
      const latestCycle = data[0].cycle_number
      const filtered = data.filter(p => p.cycle_number === latestCycle)

      setProblems(filtered)
      setCycleNumber(latestCycle)
      setLoading(false)
    }

    fetchProblems()
    return () => { cancelled = true }
  }, [])

  return { problems, cycleNumber, loading, error }
}

/**
 * Fetch all past (non-active) problems, one row per cycle,
 * picking the hardest tier (difficulty_level_id = 3) as the representative.
 * Returns { archive, loading, error }.
 */
export function usePastProblems() {
  const [archive, setArchive] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchArchive() {
      setLoading(true)
      setError(null)

      const { data, error: sbError } = await supabase
        .from('problems')
        .select('*, difficulty_levels(*)')
        .eq('is_active', false)
        .order('cycle_number', { ascending: false })
        .order('difficulty_level_id', { ascending: false }) // 3=Hard, 2=Medium, 1=Easy

      if (cancelled) return

      if (sbError) {
        setError(sbError.message)
        setLoading(false)
        return
      }

      setArchive(data)
      setLoading(false)
    }

    fetchArchive()
    return () => { cancelled = true }
  }, [])

  return { archive, loading, error }
}

/**
 * Fetch a single past problem by its ID,
 * including difficulty level metadata and solution.
 * Returns { problem, loading, error }.
 */
export function usePastProblemById(problemId) {
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (problemId == null) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchProblem() {
      setLoading(true)
      setError(null)

      const { data, error: sbError } = await supabase
        .from('problems')
        .select('*, difficulty_levels(*)')
        .eq('id', problemId)
        .single()

      if (cancelled) return

      if (sbError) {
        setError(sbError.message)
        setLoading(false)
        return
      }

      setProblem(data)
      setLoading(false)
    }

    fetchProblem()
    return () => { cancelled = true }
  }, [problemId])

  return { problem, loading, error }
}
