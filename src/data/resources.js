// ── Math resources data ──
// Permanent shelf: 4 purpose-driven categories.
// Featured pool: fun videos + hands-on, rotated weekly on the page.
// note / tags / source（'網站'）係 i18n key——UI 文案集中喺字典；
// title / url 原樣（title 本身係英文）。

export const RESOURCES = [
  // ── 📚 Learn & Compete ──
  {
    title: 'Art of Problem Solving',
    url: 'https://artofproblemsolving.com/wiki',
    category: 'learn',
    level: 'intermediate',
    note: 'resources.note.aoPS',
    tags: ['resources.tag.competition'],
  },
  {
    title: 'MAA AMC',
    url: 'https://maa.org/student-programs/amc/',
    category: 'learn',
    level: 'intermediate',
    note: 'resources.note.maa',
    tags: ['resources.tag.competition', 'resources.tag.official'],
  },
  {
    title: 'blackpenredpen',
    url: 'https://www.youtube.com/@blackpenredpen',
    category: 'learn',
    level: 'beginner',
    note: 'resources.note.bprp',
    tags: ['resources.tag.teaching'],
  },
  {
    title: 'Overleaf Learn',
    url: 'https://www.overleaf.com/learn',
    category: 'learn',
    level: 'beginner',
    note: 'resources.note.overleaf',
    tags: ['LaTeX'],
  },
  {
    title: '3Blue1Brown',
    url: 'https://www.3blue1brown.com',
    category: 'learn',
    source: 'YouTube',
    note: 'resources.note.b3b1b',
    tags: ['resources.tag.animation', 'resources.tag.teaching'],
  },
  {
    title: 'Numberphile',
    url: 'https://www.numberphile.com',
    category: 'learn',
    source: 'YouTube',
    note: 'resources.note.numberphile',
    tags: ['resources.tag.stories'],
  },
  {
    title: 'twoswap',
    url: 'https://www.youtube.com/@twoswap',
    category: 'learn',
    source: 'YouTube',
    note: 'resources.note.twoswap',
    tags: ['resources.tag.animation'],
  },

  // ── 📖 Reference ──
  {
    title: 'Wolfram MathWorld',
    url: 'https://mathworld.wolfram.com',
    category: 'reference',
    level: 'intermediate',
    note: 'resources.note.mathworld',
    tags: ['resources.tag.encyclopedia'],
  },
  {
    title: 'OEIS',
    url: 'https://oeis.org',
    category: 'reference',
    level: 'intermediate',
    note: 'resources.note.oeis',
    tags: ['resources.tag.numberTheory'],
  },
  {
    title: 'Famous Curves',
    url: 'https://www.mathcurve.com/courbes2d.gb/courbes2d.shtml',
    category: 'reference',
    level: 'intermediate',
    note: 'resources.note.curves',
    tags: ['resources.tag.geometry', 'resources.tag.algebra'],
  },
  {
    title: 'Prime Glossary',
    url: 'https://t5k.org/glossary/',
    category: 'reference',
    level: 'intermediate',
    note: 'resources.note.primes',
    tags: ['resources.tag.numberTheory'],
  },
  {
    title: 'Erdős Problems',
    url: 'https://www.erdosproblems.com',
    category: 'reference',
    level: 'observe',
    note: 'resources.note.erdos',
    tags: ['resources.tag.numberTheory', 'resources.tag.observe'],
  },
  {
    title: 'arXiv',
    url: 'https://arxiv.org',
    category: 'reference',
    level: 'advanced',
    note: 'resources.note.arxiv',
    tags: ['resources.tag.research'],
  },

  // ── 💻 Make & Play ──
  {
    title: 'Project Euler',
    url: 'https://projecteuler.net',
    category: 'make',
    level: 'intermediate',
    note: 'resources.note.euler',
    tags: ['resources.tag.programming'],
  },
  {
    title: 'Desmos',
    url: 'https://www.desmos.com/calculator',
    category: 'make',
    level: 'beginner',
    note: 'resources.note.desmos',
    tags: ['resources.tag.tools'],
  },
  {
    title: 'GeoGebra',
    url: 'https://www.geogebra.org',
    category: 'make',
    level: 'beginner',
    note: 'resources.note.geogebra',
    tags: ['resources.tag.geometry', 'resources.tag.tools'],
  },

  // ── 🎧 Culture & Community ──
  {
    title: "Today's Mathematician: MacTutor History of Mathematics",
    url: 'https://mathshistory.st-andrews.ac.uk/OfTheDay/today/',
    category: 'culture',
    level: 'beginner',
    note: 'resources.note.mactutor',
    tags: ['resources.tag.history'],
  },
  {
    title: 'Quanta Magazine',
    url: 'https://www.quantamagazine.org',
    category: 'culture',
    level: 'intermediate',
    note: 'resources.note.quanta',
    tags: ['resources.tag.news', 'resources.tag.deep'],
  },
  {
    title: 'Math StackExchange',
    url: 'https://math.stackexchange.com',
    category: 'culture',
    level: 'intermediate',
    note: 'resources.note.stackexchange',
    tags: ['resources.tag.qa'],
  },
]

// ── 🔥 Featured pool (weekly rotation on the page) ──
export const FEATURED_POOL = [

  {
    title: 'Imaginary bases create fractals!',
    url: 'https://youtu.be/d6agN416onM',
    source: 'YouTube',
    note: 'resources.note.fractal',
  },
  {
    title: 'How to Extend the Sum of Any* Function',
    url: 'https://youtu.be/hkn9zeRuzHs',
    source: 'YouTube',
    note: 'resources.note.extendSum',
  },
  {
    title: 'The Best Way to Count',
    url: 'https://youtu.be/rDDaEVcwIJM',
    source: 'YouTube',
    note: 'resources.note.count',
  },
  {
    title: 'Rock Paper Scissors 2',
    url: 'https://youtu.be/r2whuz6tkb0',
    source: 'YouTube',
    note: 'resources.note.rps',
  },
  {
    title: 'Rhythm Circle',
    url: 'https://rhythm-circle.com',
    source: 'resources.source.website',
    note: 'resources.note.rhythm',
  },
  {
    title: 'The Gray Cuber',
    url: 'https://thegraycuber.com',
    source: 'resources.source.website',
    note: 'resources.note.grayCuber',
  },
]

// Pick `count` items for this week: rotate the window by ISO week number
// so the pool advances every Monday with zero maintenance. `now` is
// injectable for tests.
export function featuredOfTheWeek(count = 3, now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.floor((now - start) / (7 * 86400000))
  return Array.from({ length: count }, (_, i) => FEATURED_POOL[(week + i) % FEATURED_POOL.length])
}
