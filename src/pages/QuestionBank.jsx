import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchQuestionBanks, createQuestionBank, updateQuestionBank, deleteQuestionBank,
} from '../lib/speed-bank'
import { isValidAnswer } from '../lib/answer-match'
import BackButton from '../components/ui/BackButton'
import LatexInput from '../components/ui/LatexInput'
import btnStyles from '../components/ui/buttons.module.css'
import styles from './QuestionBank.module.css'

const EMPTY_QUESTION = { text: '', answer: '', timeLimit: 20 }

// ── Question bank manager ──
// List banks → create/edit a bank with one question per row.
// Question shape matches room.deck: { text, answer, timeLimit };
// answer is a string (number or LaTeX) judged by answer-match.js.

export default function QuestionBank() {
  const { t } = useTranslation()
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
        setNotice({ kind: 'error', text: t('bank.invalidAnswer', { n: i + 1, bad }) })
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
      setNotice({ kind: 'error', text: t('bank.needComplete') })
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
    if (!window.confirm(t('bank.deleteConfirm', { name }))) return
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
        <BackButton onClick={() => setDraft(null)}>{t('common.backMenu')}</BackButton>
        <h1 className={styles.title}>{draft.id ? t('bank.edit') : t('bank.create')}</h1>

        <input
          className={styles.input}
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          placeholder={t('bank.namePlaceholder')}
        />

        <label className={styles.simplestToggle} title={t('bank.simplestTitle')}>
          <input
            type="checkbox"
            checked={draft.simplest === true}
            onChange={e => setDraft(d => ({ ...d, simplest: e.target.checked }))}
          />
          {t('bank.simplestLabel')}
        </label>

        <div className={styles.qList}>
          {draft.questions.map((q, i) => (
            <div key={i} className={styles.qRow}>
              {/* 題目：LaTeX + 即時預覽（共用組件 compact） */}
              <LatexInput
                variant="compact"
                value={q.text}
                onChange={v => updateQuestion(i, { text: v })}
                placeholder={t('bank.qPlaceholder', { n: i + 1 })}
              />
              <div className={styles.qRow__meta}>
                <div className={styles.qRow__answerWrap}>
                  {/* 答案：即時驗證失敗時紅邊框（invalid prop）；
                      多解分行預覽（splitAnswers）方便確認分號分割完整 */}
                  <LatexInput
                    variant="compact"
                    value={q.answer}
                    onChange={v => updateAnswer(i, v)}
                    placeholder={t('bank.answerPlaceholder')}
                    invalid={invalid[i]}
                    splitAnswers
                  />
                </div>
                <input
                  className={`${styles.input} ${styles.timeInput}`}
                  type="number"
                  min="5"
                  max="120"
                  value={q.timeLimit}
                  onChange={e => updateQuestion(i, { timeLimit: e.target.value })}
                  placeholder={t('bank.seconds')}
                />
                <button
                  className={styles.qRow__remove}
                  onClick={() => removeQuestion(i)}
                  title={t('bank.deleteQuestion')}
                  disabled={draft.questions.length <= 1}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className={`${btnStyles.btnSecondary} ${styles.addBtn}`} onClick={addQuestion}>
          ＋ {t('bank.addQuestion')}
        </button>

        <div className={styles.actions}>
          <button
            className={`${btnStyles.btnPrimary} ${styles.saveBtn}`}
            onClick={handleSave}
            style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
          >
            {t('bank.save')}
          </button>
          <button className={btnStyles.btnSecondary} onClick={() => setDraft(null)}>
            {t('common.cancel')}
          </button>
        </div>

        {notice && <p className={styles.error}>{notice.text}</p>}
      </div>
    )
  }

  // ── List view ──
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('bank.manage')}</h1>
      <p className={styles.hint}>{t('bank.manageHint')}</p>

      <button
        className={`${btnStyles.btnPrimary} ${styles.newBtn}`}
        onClick={startNew}
        style={{ '--btn-accent': 'var(--speedmath-theme-color)' }}
      >
        ＋ {t('bank.createNew')}
      </button>

      {loading ? (
        <p className={styles.hint}>{t('common.loading')}</p>
      ) : banks.length === 0 ? (
        <p className={styles.hint}>{t('bank.noBanksHint')}</p>
      ) : (
        <div className={styles.bankList}>
          {banks.map(bank => (
            <div key={bank.id} className={styles.bankCard}>
              <div className={styles.bankCard__info}>
                <h3 className={styles.bankCard__name}>{bank.name}</h3>
                <p className={styles.bankCard__meta}>{t('speed.bank.questions', { count: (bank.questions ?? []).length })}</p>
              </div>
              <div className={styles.bankCard__actions}>
                <button
                  className={btnStyles.btnSecondary}
                  onClick={() => startEdit(bank)}
                >
                  {t('bank.edit')}
                </button>
                <button
                  className={`${btnStyles.btnSecondary} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(bank.id, bank.name)}
                >
                  {t('bank.delete')}
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
