import { useState, useEffect } from 'react'
import {
  fetchQuestionBanks, createQuestionBank, updateQuestionBank, deleteQuestionBank,
} from '../lib/speed-bank'
import { isValidAnswer } from '../lib/answer-match'
import BackButton from '../components/ui/BackButton'
import btnStyles from '../components/ui/buttons.module.css'
import styles from './QuestionBank.module.css'

const EMPTY_QUESTION = { text: '', answer: '', timeLimit: 20 }

// ── Question bank manager ──
// List banks → create/edit a bank with one question per row.
// Question shape matches room.deck: { text, answer, timeLimit };
// answer is a string (number or LaTeX) judged by answer-match.js.

export default function QuestionBank() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(null) // { id|null, name, questions[] }
  const [notice, setNotice] = useState(null)
  // Row indexes whose answer is currently invalid (live red border)
  const [invalid, setInvalid] = useState({})

  useEffect(() => {
    fetchQuestionBanks()
      .then(setBanks)
      .catch(e => setNotice({ kind: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }, [])

  function startNew() {
    setDraft({ id: null, name: '', simplest: false, questions: [{ ...EMPTY_QUESTION }] })
    setNotice(null)
  }

  function startEdit(bank) {
    setDraft({
      id: bank.id,
      name: bank.name,
      simplest: bank.simplest === true,
      // Multi-answer arrays come back as a semicolon-separated string in
      // the editor (3; -3); handleSave splits it back into an array.
      questions: (bank.questions ?? []).map(q => ({
        ...q,
        answer: Array.isArray(q.answer) ? q.answer.join('; ') : q.answer,
      })),
    })
    setNotice(null)
  }

  function updateQuestion(i, patch) {
    setDraft(d => ({
      ...d,
      questions: d.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    }))
  }

  // Answer input: live-validate with the same parser judge uses, so an
  // invalid answer shows a red border immediately (not at save time).
  function updateAnswer(i, value) {
    updateQuestion(i, { answer: value })
    const text = value.trim()
    setInvalid(prev => {
      const next = { ...prev }
      if (text && !isValidAnswer(text)) next[i] = true
      else delete next[i]
      return next
    })
  }

  function addQuestion() {
    setDraft(d => ({ ...d, questions: [...d.questions, { ...EMPTY_QUESTION }] }))
  }

  function removeQuestion(i) {
    setDraft(d => ({
      ...d,
      questions: d.questions.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSave() {
    // Validate every complete question's answers BEFORE saving — the same
    // parser judge uses, so a stored answer is always judgeable. Report
    // the exact row number so the author can fix it directly.
    for (let i = 0; i < draft.questions.length; i++) {
      const q = draft.questions[i]
      const answers = q.answer.trim().split(';').map(s => s.trim()).filter(Boolean)
      if (!q.text.trim() || answers.length === 0) continue // incomplete rows are dropped, not saved
      const bad = answers.find(a => !isValidAnswer(a))
      if (bad) {
        setNotice({ kind: 'error', text: `第 ${i + 1} 題答案「${bad}」唔係合法數學表達式（數字、LaTeX 或代數都得，例如 3; -1/2）。` })
        return
      }
    }

    const questions = draft.questions
      .map(q => {
        const answerText = q.answer.trim()
        // "3; -3" → ["3", "-3"] (multi-answer); plain string stays as-is
        const answer = answerText.includes(';')
          ? answerText.split(';').map(s => s.trim()).filter(Boolean)
          : answerText
        return {
          text: q.text.trim(),
          answer,
          timeLimit: Number(q.timeLimit) || 20,
        }
      })
      .filter(q => q.text && (Array.isArray(q.answer) ? q.answer.length > 0 : q.answer))
    if (!draft.name.trim() || questions.length === 0) {
      setNotice({ kind: 'error', text: '題庫名稱同至少一題完整題目（題目 + 答案）先可以儲存。' })
      return
    }
    try {
      // simplest is a BANK-level setting (not per-question)
      if (draft.id) await updateQuestionBank(draft.id, draft.name.trim(), questions, draft.simplest === true)
      else await createQuestionBank(draft.name.trim(), questions, draft.simplest === true)
      setDraft(null)
      setNotice(null)
      setBanks(await fetchQuestionBanks())
    } catch (e) {
      setNotice({ kind: 'error', text: e.message })
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`刪除題庫「${name}」？呢個動作冇得復原。`)) return
    try {
      await deleteQuestionBank(id)
      setBanks(prev => prev.filter(b => b.id !== id))
    } catch (e) {
      setNotice({ kind: 'error', text: e.message })
    }
  }

  // ── Editor view ──
  if (draft) {
    return (
      <div className={styles.container}>
        <BackButton onClick={() => setDraft(null)}>← 返回題庫列表</BackButton>
        <h1 className={styles.title}>{draft.id ? '編輯題庫' : '新建題庫'}</h1>

        <input
          className={styles.input}
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          placeholder="題庫名稱（例如：二次方程大戰）"
        />

        <label className={styles.simplestToggle} title="開啟後：玩家答案必須係最簡形式——√4 判錯（要答 2）、5^4 判錯（要答 625，因為 <1000）、4^6 保留冪（≥1000）">
          <input
            type="checkbox"
            checked={draft.simplest === true}
            onChange={e => setDraft(d => ({ ...d, simplest: e.target.checked }))}
          />
          要求最簡形式（成個題庫統一）
        </label>

        <div className={styles.qList}>
          {draft.questions.map((q, i) => (
            <div key={i} className={styles.qRow}>
              <input
                className={styles.input}
                value={q.text}
                onChange={e => updateQuestion(i, { text: e.target.value })}
                placeholder={`第 ${i + 1} 題（支援 LaTeX，例如 \\frac{1}{2} + \\frac{1}{3} = ?）`}
              />
              <div className={styles.qRow__meta}>
                <input
                  className={`${styles.input} ${invalid[i] ? styles['input--invalid'] : ''}`}
                  value={q.answer}
                  onChange={e => updateAnswer(i, e.target.value)}
                  placeholder="答案（數學表達式，例如 \frac{5}{6}；多個答案用分號，例如 3; -3）"
                />
                <input
                  className={`${styles.input} ${styles.timeInput}`}
                  type="number"
                  min="5"
                  max="120"
                  value={q.timeLimit}
                  onChange={e => updateQuestion(i, { timeLimit: e.target.value })}
                  placeholder="秒"
                />
                <button
                  className={styles.qRow__remove}
                  onClick={() => removeQuestion(i)}
                  title="刪除呢題"
                  disabled={draft.questions.length <= 1}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className={`${btnStyles.btnSecondary} ${styles.addBtn}`} onClick={addQuestion}>
          ＋ 加題目
        </button>

        <div className={styles.actions}>
          <button
            className={`${btnStyles.btnPrimary} ${styles.saveBtn}`}
            onClick={handleSave}
            style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
          >
            儲存題庫
          </button>
          <button className={btnStyles.btnSecondary} onClick={() => setDraft(null)}>
            取消
          </button>
        </div>

        {notice && <p className={styles.error}>{notice.text}</p>}
      </div>
    )
  }

  // ── List view ──
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>題庫管理</h1>
      <p className={styles.hint}>預製題目庫：開房時可以揀選，唔使每次都隨機出題</p>

      <button
        className={`${btnStyles.btnPrimary} ${styles.newBtn}`}
        onClick={startNew}
        style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
      >
        ＋ 新建題庫
      </button>

      {loading ? (
        <p className={styles.hint}>載入中…</p>
      ) : banks.length === 0 ? (
        <p className={styles.hint}>未有題庫——撳「＋ 新建題庫」開始。</p>
      ) : (
        <div className={styles.bankList}>
          {banks.map(bank => (
            <div key={bank.id} className={styles.bankCard}>
              <div className={styles.bankCard__info}>
                <h3 className={styles.bankCard__name}>{bank.name}</h3>
                <p className={styles.bankCard__meta}>{(bank.questions ?? []).length} 題</p>
              </div>
              <div className={styles.bankCard__actions}>
                <button
                  className={btnStyles.btnSecondary}
                  onClick={() => startEdit(bank)}
                >
                  編輯
                </button>
                <button
                  className={`${btnStyles.btnSecondary} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(bank.id, bank.name)}
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notice && <p className={styles.error}>{notice.text}</p>}
    </div>
  )
}
