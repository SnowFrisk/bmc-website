-- ============================================================
-- BMC Website — Cycle 0 測試題目 + 解答
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

INSERT INTO problems
  (cycle_number, difficulty_level_id, title, latex, solution, start_date, end_date, is_active)
VALUES
  (
    0, 1, '雙重根號化簡',
    '化簡 $\sqrt{3+2\sqrt{2}}$。',
    '設 $\sqrt{3+2\sqrt{2}} = \sqrt{a} + \sqrt{b}$，其中 $a, b$ 為正整數。

兩邊平方：
$$
(\sqrt{a}+\sqrt{b})^2 = a + b + 2\sqrt{ab} = 3 + 2\sqrt{2}
$$

比較有理部分和無理部分：
$$
\begin{cases}
a + b = 3 \\
2\sqrt{ab} = 2\sqrt{2} \implies ab = 2
\end{cases}
$$

解方程組：$a(3-a) = 2$ → $a^2 - 3a + 2 = 0$ → $(a-1)(a-2)=0$。

得 $a=1$, $b=2$（或反之）。由於根號取正值：

$$
\sqrt{3+2\sqrt{2}} = \sqrt{2} + 1
$$

驗算：$(\sqrt{2}+1)^2 = 2 + 2\sqrt{2} + 1 = 3+2\sqrt{2}$ ✓',
    '2026-04-01', '2026-04-15',
    false
  ),
  (
    0, 2, 'Nesbitt 不等式',
    '證明對於任意正實數 $a,b,c$，
    $\frac{a}{b+c} + \frac{b}{c+a} + \frac{c}{a+b} \ge \frac{3}{2}$。',
    '**證法一：對稱化**

令 $S = \frac{a}{b+c} + \frac{b}{c+a} + \frac{c}{a+b}$。

首先注意到：
$$
\frac{a}{b+c} + \frac{1}{2} = \frac{2a + b + c}{2(b+c)} = \frac{(a+b)+(a+c)}{2(b+c)}
$$

將三項相加：
$$
S + \frac{3}{2} = \frac{(a+b)+(a+c)}{2(b+c)} + \frac{(b+c)+(b+a)}{2(c+a)} + \frac{(c+a)+(c+b)}{2(a+b)}
$$

將右式按 $(a+b)$、$(b+c)$、$(c+a)$ 分組：

$$
\begin{align}
&= \frac{a+b}{2}\left(\frac{1}{b+c} + \frac{1}{c+a}\right) \\
&\quad + \frac{b+c}{2}\left(\frac{1}{c+a} + \frac{1}{a+b}\right) \\
&\quad + \frac{c+a}{2}\left(\frac{1}{a+b} + \frac{1}{b+c}\right)
\end{align}
$$

由 AM-HM 不等式：$(x+y)(\frac{1}{x}+\frac{1}{y}) \ge 4$。

應用於每組：
$$
\frac{a+b}{2}\left(\frac{1}{b+c} + \frac{1}{c+a}\right) \ge 2
$$

同理第二、三組各 $\ge 2$。所以三組和 $\ge 6$，即 $S + \frac{3}{2} \ge 6$。

因此 $S \ge \frac{3}{2}$。等號成立當且僅當 $a=b=c$。',
    '2026-04-01', '2026-04-15',
    false
  ),
  (
    0, 3, '$x^y = y^x$ 的正整數解',
    '求所有正整數對 $(x, y)$ 滿足 $x^y = y^x$，其中 $x \ne y$。',
    '由 $x^y = y^x$ 兩邊取自然對數：
$$
y \ln x = x \ln y
$$

整理得：
$$
\frac{\ln x}{x} = \frac{\ln y}{y}
$$

定義函數 $f(t) = \frac{\ln t}{t}$（$t > 0$）。求導：
$$
f''(t) = \frac{1 - \ln t}{t^2}
$$

$f''(t) > 0$ 當 $t < e$，$f''(t) < 0$ 當 $t > e$。

所以 $f(t)$ 在 $(0, e)$ 嚴格遞增，在 $(e, \infty)$ 嚴格遞減，在 $t = e$ 處取最大值。

$f(x) = f(y)$ 且 $x \ne y$ 意味著其中一個 $< e$，另一個 $> e$。

正整數中 $< e$ 的只有 $1$ 和 $2$：

- 若 $x = 1$：$f(1) = 0$，需要 $f(y) = 0$ → $y$ 無正整數解（$\ln y > 0$ 當 $y > 1$）
- 若 $x = 2$：$f(2) = \frac{\ln 2}{2}$

  需要 $y > e$ 且 $f(y) = \frac{\ln 2}{2}$。試 $y = 4$：
  $$
  f(4) = \frac{\ln 4}{4} = \frac{2\ln 2}{4} = \frac{\ln 2}{2} = f(2) \; \checkmark
  $$
  所以 $(2, 4)$ 是一組解。

由於 $f(t)$ 在 $(e, \infty)$ 嚴格單調遞減，不存在其他 $y$ 滿足 $f(y) = f(2)$。

---

**答案**：$(x, y) = (2, 4)$ 和 $(4, 2)$（總共兩組，互為對稱）。

驗算：$2^4 = 16 = 4^2$ ✓',
    '2026-04-01', '2026-04-15',
    false
  );
