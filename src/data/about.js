// ── About page content ──
// Tournaments BMC participates in (chronological by academic year)
// and internal programs BMC organizes.
// `when` / link `label` 係 i18n key（UI 文案集中喺字典）；
// name / desc 本身係英文，照原樣。

export const TOURNAMENTS = [
  {
    name: 'Berkeley Math Tournament',
    short: 'BMT',
    when: 'about.when.bmt',
    since: null,
    desc: 'The largest high school math tournament in the world!',
    links: [{ label: 'about.link.official', url: 'https://berkeley.mt/' }],
  },
  {
    name: 'Caltech Math Meet',
    short: 'CMM',
    when: 'about.when.cmm',
    since: null,
    desc: 'A smaller tournament with notoriously difficult problems.',
    links: [{ label: 'about.link.official', url: 'https://www.caltechmathmeet.org/' }],
  },
  {
    name: 'Canyon Crest Academy Math Bonanza',
    short: 'CCAMB',
    when: 'about.when.ccamb',
    since: null,
    desc: 'A local event organized by our friends at CCA.',
    links: [{ label: 'about.link.official', url: 'https://ccamb.org/' }],
  },
  {
    name: 'Stanford Math Tournament',
    short: 'SMT',
    when: 'about.when.smt',
    since: null,
    desc: 'The last tournament BMC attends every school year — and the most prestigious, too!',
    links: [{ label: 'about.link.official', url: 'https://www.stanfordmathtournament.org/' }],
  },
]

export const PROGRAMS = [
  {
    name: 'Charity Summer Program',
    when: 'about.when.charity',
    desc: 'A math-themed summer camp for primary school kids. Jointly organized by Aaron and Kathleen since 2025.',
  },
  {
    name: 'Calculus CD',
    when: 'about.when.calculus',
    desc: 'A special training series in preparation for the Calculus events of BMT and SMT. Led by Aaron and Michael.',
  },
  {
    name: 'Kumquats Spring Classic',
    when: 'about.when.kumquats',
    desc: 'A mini-competition that determines selection for the Kumquats (A Team) of the Stanford Math Tournament. Arranged by BMC leadership.',
  },
  {
    name: 'Middle School Math Tournament',
    when: 'about.when.msmt',
    desc: "A prospective springtime event for middle school students at Bishop's. To be arranged by Adam.",
  },
  {
    name: "Bishop's Integration Bee",
    when: 'about.when.bee',
    desc: 'A knockout-style competition dedicated to integral calculus. Initiated by Daniel Xu and others in 2023, brought back by Aaron and others in 2025.',
  },
  {
    name: 'Problem of the Cycle',
    when: 'about.when.poc',
    desc: 'A weekly-ish problem that accompanies math club reminder emails. Run by Aaron.',
  },
  {
    name: 'Per-cycle Meeting / Training',
    when: 'about.when.meeting',
    desc: 'Meetings are lighthearted and everyone is welcome! Weekly training is for members aiming to participate in tournaments; Kumquats are required to attend.',
  },
]
