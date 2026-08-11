import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const queryKeys = {
  submissions: ['submissions'],
  leaderboard: (cycleNumber) => ['leaderboard', cycleNumber],
  allSubmissions: ['allSubmissions'],
}

function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL
  return url && !url.includes('placeholder')
}

// ── Fetch submissions for a set of problem ids ──
async function fetchSubmissions(problemIds) {
  if (problemIds.length === 0) return []
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .in('problem_id', problemIds)
    .order('submitted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export function useSubmissions(problemIds) {
  return useQuery({
    queryKey: [...queryKeys.submissions, problemIds],
    queryFn: () => fetchSubmissions(problemIds),
    enabled: isSupabaseConfigured() && problemIds.length > 0,
  })
}

// ── Insert a new submission ──
async function insertSubmission(payload) {
  const { data, error } = await supabase
    .from('submissions')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: insertSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.allSubmissions })
    },
  })
}

// ── Leaderboard aggregation ──
// Correct submissions only, grouped by student (anonymous submissions
// are grouped under a single "匿名" label).
async function fetchLeaderboard(cycleNumber, problems) {
  const problemIds = problems.map((p) => p.id)
  if (problemIds.length === 0) return []

  const { data, error } = await supabase
    .from('submissions')
    .select('student_name, is_anonymous, is_correct, score')
    .in('problem_id', problemIds)
  if (error) throw new Error(error.message)

  const totals = new Map()
  for (const s of data ?? []) {
    if (s.is_correct !== true) continue
    const key = s.is_anonymous ? '__anon__' : s.student_name
    const entry = totals.get(key) ?? { name: s.is_anonymous ? '匿名' : s.student_name, score: 0, solved: 0 }
    entry.score += s.score
    entry.solved += 1
    totals.set(key, entry)
  }

  return [...totals.values()].sort((a, b) => b.score - a.score)
}

export function useLeaderboard(cycleNumber, problems) {
  return useQuery({
    queryKey: queryKeys.leaderboard(cycleNumber),
    queryFn: () => fetchLeaderboard(cycleNumber, problems),
    enabled: isSupabaseConfigured() && cycleNumber != null && problems.length > 0,
  })
}

// ── Admin: all submissions (with problem + difficulty info) ──
async function fetchAllSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, problems(title, cycle_number, step_number, difficulty_level_id, points, difficulty_levels(label, points))')
    .order('submitted_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return data ?? []
}

export function useAllSubmissions() {
  return useQuery({
    queryKey: queryKeys.allSubmissions,
    queryFn: fetchAllSubmissions,
    enabled: isSupabaseConfigured(),
  })
}

// ── Admin: mark a submission correct / incorrect ──
async function updateSubmissionStatus({ id, isCorrect, score }) {
  const { data, error } = await supabase
    .from('submissions')
    .update({ is_correct: isCorrect, score: isCorrect ? score : 0 })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSubmissionStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.allSubmissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
    },
  })
}

// ── Admin: insert a new problem group (1 main + N steps) ──
async function insertProblemGroup({ main, steps }) {
  const { data: mainRow, error: e1 } = await supabase
    .from('problems')
    .insert(main)
    .select()
    .single()
  if (e1) throw new Error(e1.message)

  if (steps.length > 0) {
    const stepRows = steps.map((s, i) => ({
      ...s,
      parent_id: mainRow.id,
      step_number: i + 1,
    }))
    const { error: e2 } = await supabase.from('problems').insert(stepRows)
    if (e2) throw new Error(e2.message)
  }
  return mainRow
}

export function useInsertProblem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: insertProblemGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentProblems'] })
      queryClient.invalidateQueries({ queryKey: ['pastProblems'] })
    },
  })
}

// ── Admin: toggle problem group active state (main + its steps) ──
async function updateProblemActive({ id, isActive }) {
  const { error: e1 } = await supabase
    .from('problems')
    .update({ is_active: isActive })
    .eq('id', id)
  if (e1) throw new Error(e1.message)

  const { error: e2 } = await supabase
    .from('problems')
    .update({ is_active: isActive })
    .eq('parent_id', id)
  if (e2) throw new Error(e2.message)

  return true
}

export function useUpdateProblemActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProblemActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentProblems'] })
      queryClient.invalidateQueries({ queryKey: ['pastProblems'] })
      queryClient.invalidateQueries({ queryKey: ['allMainProblems'] })
    },
  })
}
