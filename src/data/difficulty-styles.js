// Difficulty accent styles — shared by ProblemCard and Admin.
// Kept in its own file so it can be imported by non-component modules
// (react-refresh rule: component files export components only).

export const DIFFICULTY_STYLES = {
  1: { color: 'var(--green)', bg: 'color-mix(in srgb, var(--green) 10%, transparent)' },
  2: { color: 'var(--gold)',  bg: 'color-mix(in srgb, var(--gold) 10%, transparent)'  },
  3: { color: 'var(--red)',   bg: 'color-mix(in srgb, var(--red) 10%, transparent)'   },
}
