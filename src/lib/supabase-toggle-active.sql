-- ============================================================
-- BMC Website — Active / Past toggles
-- ============================================================

-- 將立方和公式設回 active（Cycle 1）
UPDATE problems SET is_active = true  WHERE title = '立方和公式';

-- 將等差數列求和同證明√2為無理數都保持 active
-- （Cycle 1 三道題目全部 active）
