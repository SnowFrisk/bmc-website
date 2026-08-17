import { flushSync } from 'react-dom'

// ── 全站「面板切換」View Transition helper ──
// SpeedMath mode 切換、SpeedBattle 內部 phase 切換、Admin tab 切換共用。
// 動畫本身由 components/ui/panel-transition.module.css 提供（.panel /
// .entrance，view-transition-name: page-panel）——呢度只負責「點樣觸發」：
//  1. flushSync：令 state 交換喺 snapshot 之前完成。唔 flush 嘅話 View
//     Transition 影到嘅係舊 DOM，動畫會 rollback（之前就係咁先改 flush）。
//  2. document.startViewTransition：有先至用（Firefox 冇 → 直接套用，
//     mount 時由 .entrance fallback 動畫頂住）。
export function startPanelTransition(apply) {
  const run = () => flushSync(apply)
  if (document.startViewTransition) document.startViewTransition(run)
  else run()
}
