import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import i18n from '../i18n'
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

// ── Submission tracking: look up a submission by its access code ──
// code 就係身份憑證（零登入方案）——夠隨機（8 位 base32）撞唔到。
// end_date 用嚟判斷「訂正窗口」：截止前即使已批改都可以訂正。
async function fetchSubmissionByCode(code) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, problems(title, cycle_number, step_number, latex, difficulty_level_id, difficulty_levels(label, points), end_date)')
    .eq('access_code', code)
    .maybeSingle() // 冇 row 時返回 null（唔係 error）——「搵唔到」同「查詢失敗」分開處理
  if (error) throw new Error(error.message)
  return data ?? null
}

export function useTrackSubmission(code) {
  return useQuery({
    queryKey: ['trackSubmission', code],
    queryFn: () => fetchSubmissionByCode(code),
    enabled: isSupabaseConfigured() && !!code,
  })
}

// ── Submission tracking: edit answer via access code ──
// 訂正規則（2026-08-16 更正）：未批改 → 修改；已批改 + 答錯 + 截止前 → 訂正；
// 已批改答啱 → 永遠鎖定。同前端 canEdit 一致（雙重檢查）。
async function updateAnswerByCode({ code, answer }) {
  const { data: sub, error: e1 } = await supabase
    .from('submissions')
    .select('id, is_correct, problems(end_date)')
    .eq('access_code', code)
    .maybeSingle()
  if (e1) throw new Error(e1.message)
  if (!sub) throw new Error(i18n.t('track.notFound'))

  const endDate = sub.problems?.end_date
  const canEdit = sub.is_correct === null ||
    (sub.is_correct === false && endDate && new Date(endDate).getTime() > Date.now())
  if (!canEdit) {
    throw new Error(
      sub.is_correct === true
        ? i18n.t('track.lockedCorrect')
        : i18n.t('track.lockedDeadline'),
    )
  }

  // 訂正後 reset 做待批改（score 歸零）——批改方要重新審核
  const { data, error } = await supabase
    .from('submissions')
    .update({ answer: answer.trim(), is_correct: null, score: 0, submitted_at: new Date().toISOString() })
    .eq('id', sub.id)
    .select()
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error(i18n.t('common.updateFailed'))
  return data
}

export function useUpdateTrackedAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAnswerByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allSubmissions })
    },
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

// ── Admin: 改判——已批改嘅提交 reset 返做待審核（保留註批）──
async function resetSubmissionStatus(id) {
  const { data, error } = await supabase
    .from('submissions')
    .update({ is_correct: null, score: 0 })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export function useResetSubmissionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetSubmissionStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.allSubmissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
    },
  })
}

// ── Admin: 加 / 改批改註批（review_note，學生喺 /track 睇到）──
async function updateReviewNote({ id, note }) {
  const { data, error } = await supabase
    .from('submissions')
    .update({ review_note: note.trim() || null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export function useUpdateReviewNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateReviewNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allSubmissions })
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

// ── Admin: update a problem group (main + its steps) in place ──
// Steps sync: rows with an id are updated, new rows are inserted with
// parent_id, and any existing steps beyond the new count are deleted
// (the form shrunk). Legacy synthetic steps have no real id (stripped
// when the draft loads), so they always insert as real steps.
async function updateProblemGroup({ id, main, steps }) {
  const { error: e1 } = await supabase
    .from('problems')
    .update(main)
    .eq('id', id)
  if (e1) throw new Error(e1.message)

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]
    const { id: stepId, ...fields } = s
    if (stepId) {
      const { error } = await supabase.from('problems').update(fields).eq('id', stepId)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('problems')
        .insert({ ...fields, parent_id: id, step_number: i + 1 })
      if (error) throw new Error(error.message)
    }
  }

  // Remove steps the setter deleted by shrinking the count
  const { error: e2 } = await supabase
    .from('problems')
    .delete()
    .eq('parent_id', id)
    .gt('step_number', steps.length)
  if (e2) throw new Error(e2.message)
  return id
}

export function useUpdateProblem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProblemGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentProblems'] })
      queryClient.invalidateQueries({ queryKey: ['pastProblems'] })
      queryClient.invalidateQueries({ queryKey: ['allMainProblems'] })
    },
  })
}
