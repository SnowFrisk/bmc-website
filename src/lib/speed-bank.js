import { supabase } from './supabase'

// ── Question bank CRUD ──
// A bank is { id, name, questions, simplest, created_at } where
// questions is an array of { text, answer, timeLimit } — the same shape
// as room.deck, so a bank can be used directly as a battle deck.
// `answer` is a string or array (multi-answer) judged with answer-match.js.
// `simplest` is a BANK-level flag: when true, every question demands the
// simplest form (√4 → 2, 5^4 → 625, 2/4 → 1/2).

export async function fetchQuestionBanks() {
  const { data, error } = await supabase
    .from('question_banks')
    .select('id, name, questions, simplest, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createQuestionBank(name, questions, simplest = false) {
  const { data, error } = await supabase
    .from('question_banks')
    .insert({ name, questions, simplest })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateQuestionBank(id, name, questions, simplest = false) {
  const { data, error } = await supabase
    .from('question_banks')
    .update({ name, questions, simplest })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteQuestionBank(id) {
  const { error } = await supabase
    .from('question_banks')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
