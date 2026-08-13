// ── Math resources data ──
// Permanent shelf: 4 purpose-driven categories.
// Featured pool: fun videos + hands-on, rotated weekly on the page.

export const RESOURCES = [
  // ── 📚 Learn & Compete ──
  {
    title: 'Art of Problem Solving',
    url: 'https://artofproblemsolving.com',
    category: 'learn',
    level: 'intermediate',
    note: 'AMC/AIME 備賽聖地——歷屆題庫 + 論壇 + 課程，競賽生必去',
    tags: ['競賽'],
  },
  {
    title: 'MAA AMC',
    url: 'https://maa.org/student-programs/amc/',
    category: 'learn',
    level: 'intermediate',
    note: '美國數學競賽官方——AMC 8/10/12 報名、日期、歷屆試題',
    tags: ['競賽', '官方'],
  },
  {
    title: 'blackpenredpen',
    url: 'https://www.youtube.com/@blackpenredpen',
    category: 'learn',
    level: 'beginner',
    note: '逐題拆解高中到大學嘅數學——睇住學解題思維',
    tags: ['教學'],
  },
  {
    title: 'Overleaf Learn',
    url: 'https://www.overleaf.com/learn',
    category: 'learn',
    level: 'beginner',
    note: 'LaTeX 官方教學——寫數學作業/筆記嘅排版基礎',
    tags: ['LaTeX'],
  },
  {
    title: '3Blue1Brown',
    url: 'https://www.3blue1brown.com',
    category: 'learn',
    source: 'YouTube',
    note: '可視化數學嘅黃金標準——每個動畫都係一堂課',
    tags: ['動畫', '教學'],
  },
  {
    title: 'Numberphile',
    url: 'https://www.numberphile.com',
    category: 'learn',
    source: 'YouTube',
    note: '同數學家傾偈——一個概念、一段故事',
    tags: ['故事'],
  },
  {
    title: 'twoswap',
    url: 'https://www.youtube.com/@twoswap',
    category: 'learn',
    source: 'YouTube',
    note: '短小精悍嘅數學動畫頻道',
    tags: ['動畫'],
  },

  // ── 📖 Reference ──
  {
    title: 'Wolfram MathWorld',
    url: 'https://mathworld.wolfram.com',
    category: 'reference',
    level: 'intermediate',
    note: '數學百科全書——查定義、公式、性質嘅權威來源',
    tags: ['百科'],
  },
  {
    title: 'OEIS',
    url: 'https://oeis.org',
    category: 'reference',
    level: 'intermediate',
    note: '整數數列資料庫——一查即明，仲有數列圖形化',
    tags: ['數論'],
  },
  {
    title: 'Famous Curves',
    url: 'https://www.mathcurve.com/courbes2d.gb/courbes2d.shtml',
    category: 'reference',
    level: 'intermediate',
    note: '著名曲線圖鑑——從圓到蝴蝶曲線，數學之美一覽無遺',
    tags: ['幾何', '代数'],
  },
  {
    title: 'Prime Glossary',
    url: 'https://t5k.org/glossary/',
    category: 'reference',
    level: 'intermediate',
    note: '質數詞彙表——Sophie Germain 質數、孿生質數等數論概念一查即明',
    tags: ['數論'],
  },
  {
    title: 'Erdős Problems',
    url: 'https://www.erdosproblems.com',
    category: 'reference',
    level: 'observe',
    note: 'Erdős 開放問題庫——全世界未解嘅題，觀摩數學家點樣諗問題',
    tags: ['數論', '觀摩'],
  },
  {
    title: 'arXiv',
    url: 'https://arxiv.org',
    category: 'reference',
    level: 'advanced',
    note: '論文預印本庫——最新數學研究出爐第一站',
    tags: ['研究'],
  },

  // ── 💻 Make & Play ──
  {
    title: 'Project Euler',
    url: 'https://projecteuler.net',
    category: 'make',
    level: 'intermediate',
    note: '用程式解數學題——一題一演算法，學數學同時學 coding',
    tags: ['程式'],
  },
  {
    title: 'Desmos',
    url: 'https://www.desmos.com/calculator',
    category: 'make',
    level: 'beginner',
    note: '圖形計算器——畫函數、滑桿探索參數變化，免費且強',
    tags: ['工具'],
  },
  {
    title: 'GeoGebra',
    url: 'https://www.geogebra.org',
    category: 'make',
    level: 'beginner',
    note: '互動幾何——拖動點線面即時睇幾何性質',
    tags: ['幾何', '工具'],
  },

  // ── 🎧 Culture & Community ──
  {
    title: "Today's Mathematician: MacTutor History of Mathematics",
    url: 'https://mathshistory.st-andrews.ac.uk/OfTheDay/today/',
    category: 'culture',
    level: 'beginner',
    note: '3200+ 數學家傳記同數學史文章——數學背後嘅人同故事',
    tags: ['歷史'],
  },
  {
    title: 'Quanta Magazine',
    url: 'https://www.quantamagazine.org',
    category: 'culture',
    level: 'intermediate',
    note: '頂級數學/科學新聞同深度文章——跟住數學研究前線',
    tags: ['新聞', '深度'],
  },
  {
    title: 'Math StackExchange',
    url: 'https://math.stackexchange.com',
    category: 'culture',
    level: 'intermediate',
    note: '數學問答社區——問唔明嘅嘢，答案通常已經有人問過',
    tags: ['問答'],
  },
]

// ── 🔥 Featured pool (weekly rotation on the page) ──
export const FEATURED_POOL = [
  
  {
    title: 'Imaginary bases create fractals!',
    url: 'https://youtu.be/d6agN416onM',
    source: 'YouTube',
    note: '虛數基底 × 高斯整數——畫出成個碎形世界',
  },
  {
    title: 'How to Extend the Sum of Any* Function',
    url: 'https://youtu.be/hkn9zeRuzHs',
    source: 'YouTube',
    note: 'Lines That Connect——將求和函數延伸到所有數',
  },
  {
    title: 'The Best Way to Count',
    url: 'https://youtu.be/rDDaEVcwIJM',
    source: 'YouTube',
    note: '計數有幾多種方法？一個問題帶出成片數學',
  },
  {
    title: 'Rock Paper Scissors 2',
    url: 'https://youtu.be/r2whuz6tkb0',
    source: 'YouTube',
    note: '猜拳都可以有數學——博弈同機率嘅延伸',
  },
  {
    title: 'Rhythm Circle',
    url: 'https://rhythm-circle.com',
    source: '網站',
    note: '節奏 × 圓——用音樂感受數學週期',
  },
  {
    title: 'The Gray Cuber',
    url: 'https://thegraycuber.com',
    source: '網站',
    note: '魔方下面嘅群論——扭出數學',
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
