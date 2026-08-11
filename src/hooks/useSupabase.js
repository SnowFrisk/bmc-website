import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ── Query Keys ──
export const queryKeys = {
  currentProblems: ['currentProblems'],
  pastProblems: ['pastProblems'],
  allMainProblems: ['allMainProblems'],
  pastProblem: (id) => ['pastProblem', id],
}

// ── Fetch Functions ──

async function fetchMainProblems(active) {
  const { data, error } = await supabase
    .from('problems')
    .select('*, difficulty_levels(*)')
    .eq('is_active', active)
    .is('parent_id', null)
    .order('cycle_number', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchStepsFor(mainIds) {
  if (mainIds.length === 0) return []
  const { data, error } = await supabase
    .from('problems')
    .select('*, difficulty_levels(*)')
    .in('parent_id', mainIds)
    .order('step_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

// Attach steps to main problems. Legacy rows (created before the group
// format) have no steps — attach a synthetic single step so the UI
// can treat every cycle uniformly.
function attachSteps(mains, steps) {
  const byId = new Map(mains.map((p) => [p.id, p]))
  for (const s of steps) {
    const main = byId.get(s.parent_id)
    if (main) (main.steps ??= []).push(s)
  }
  return mains.map((main) => {
    if (!main.steps || main.steps.length === 0) {
      // Legacy single-tier row: treat it as its own step
      main.steps = [{ ...main, step_number: main.difficulty_level_id ?? 1 }]
    }
    return main
  })
}

async function fetchCurrentProblems() {
  const data = await fetchMainProblems(true)
  if (data.length === 0) return { problems: [], cycleNumber: null }
  const latestCycle = data[0].cycle_number
  const filtered = data.filter((p) => p.cycle_number === latestCycle)
  const steps = await fetchStepsFor(filtered.map((p) => p.id))
  return { problems: attachSteps(filtered, steps), cycleNumber: latestCycle }
}

async function fetchPastProblems() {
  const mains = await fetchMainProblems(false)
  const steps = await fetchStepsFor(mains.map((p) => p.id))
  return attachSteps(mains, steps)
}

async function fetchPastProblemById(problemId) {
  const { data: main, error } = await supabase
    .from('problems')
    .select('*, difficulty_levels(*)')
    .eq('id', problemId)
    .single()
  if (error) throw new Error(error.message)
  if (!main) return null
  const steps = await fetchStepsFor([main.id])
  return attachSteps([main], steps)[0]
}

// All main problems regardless of active state — used by the admin
// archive view so cycles that are neither "current" nor archived
// (e.g. legacy rows) still appear.
async function fetchAllMainProblems() {
  const { data, error } = await supabase
    .from('problems')
    .select('*, difficulty_levels(*)')
    .is('parent_id', null)
    .order('cycle_number', { ascending: false })
    .order('id', { ascending: true })
  if (error) throw new Error(error.message)
  const mains = data ?? []
  const steps = await fetchStepsFor(mains.map((p) => p.id))
  return attachSteps(mains, steps)
}

// ── Hooks ──
export function useCurrentProblems() {
  return useQuery({
    queryKey: queryKeys.currentProblems,
    queryFn: fetchCurrentProblems,
    enabled: isSupabaseConfigured(),
  })
}

export function useAllMainProblems() {
  return useQuery({
    queryKey: queryKeys.allMainProblems,
    queryFn: fetchAllMainProblems,
    enabled: isSupabaseConfigured(),
  })
}

export function usePastProblems() {
  return useQuery({
    queryKey: queryKeys.pastProblems,
    queryFn: fetchPastProblems,
    enabled: isSupabaseConfigured(),
  })
}

export function usePastProblemById(problemId) {
  return useQuery({
    queryKey: queryKeys.pastProblem(problemId),
    queryFn: () => fetchPastProblemById(problemId),
    enabled: isSupabaseConfigured() && problemId != null,
  })
}

// ── Helper ──
function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL
  return url && !url.includes('placeholder')
}
