#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate grade-4 math question banks for levels L001-L010."""

import json
import random
import os
from typing import List, Dict, Any

random.seed(20250701)

OUT_DIR = "D:/coder/boys-game/src/data/v3/bank/math"
os.makedirs(OUT_DIR, exist_ok=True)


def num_to_chinese(n: int) -> str:
    """Convert an integer (<= 999999999) to Chinese reading."""
    digits = "零一二三四五六七八九"
    units = ["", "十", "百", "千"]
    big = ["", "万", "亿"]
    if n == 0:
        return "零"
    s = str(n)
    groups = []
    length = len(s)
    # pad to multiple of 4
    s = s.zfill((length + 3) // 4 * 4)
    parts = [s[i:i+4] for i in range(0, len(s), 4)]
    result = ""
    zero_flag = False
    for idx, part in enumerate(parts):
        part_str = ""
        part_val = int(part)
        if part_val == 0:
            zero_flag = True
            continue
        p = part
        for i, ch in enumerate(p):
            d = int(ch)
            if d == 0:
                if not zero_flag and i < 3 and any(int(c) != 0 for c in p[i+1:]):
                    part_str += "零"
                    zero_flag = True
            else:
                part_str += digits[d] + units[3 - i]
                zero_flag = False
        # add big unit based on position from right
        big_unit = big[len(parts) - idx - 1]
        result += part_str + big_unit
    # Clean up common patterns
    result = result.replace("零零", "零").replace("零万", "万").replace("零亿", "亿")
    result = result.rstrip("零")
    if result.startswith("一十") and len(result) == 2:
        result = result[1:]
    return result


def write_level(level: int, subject: str, topic: str, difficulty: int, questions: List[Dict[str, Any]]):
    path = os.path.join(OUT_DIR, f"L{level:03d}.json")
    data = {
        "level": level,
        "subject": subject,
        "topic": topic,
        "difficulty": difficulty,
        "questions": questions
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {path} with {len(questions)} questions")


def choice(qid: str, question: str, options: List[str], answer: int, explanation: str) -> Dict[str, Any]:
    return {
        "id": qid,
        "type": "choice",
        "question": question,
        "options": options,
        "answer": answer,
        "explanation": explanation
    }


def fillblank(qid: str, question: str, answer: str, explanation: str) -> Dict[str, Any]:
    return {
        "id": qid,
        "type": "fillblank",
        "question": question,
        "answer": answer,
        "explanation": explanation
    }


def distractors(correct: Any, n: int = 3, generator=None, avoid: List[Any] = None) -> List[Any]:
    """Generate numeric distractors close to the correct answer."""
    avoid = set(avoid or [])
    avoid.add(correct)
    outs = []
    attempts = 0
    while len(outs) < n and attempts < 100:
        attempts += 1
        if generator is None:
            # default +/- small deltas
            delta = random.choice([-1, 1]) * random.randint(1, max(1, abs(correct) // 10 or 1))
            val = correct + delta
        else:
            val = generator()
        if val not in avoid and val != correct:
            outs.append(val)
            avoid.add(val)
    # fallback
    while len(outs) < n:
        val = correct + len(outs) + 1
        if val not in avoid:
            outs.append(val)
    return outs


# ============================================================
# Level 1: 大数的认识（一） 万以内数
# ============================================================
def gen_level1() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 读写四位数
    for _ in range(5):
        n = random.randint(1000, 9999)
        read = num_to_chinese(n)
        opts = [read] + [num_to_chinese(x) for x in distractors(n, 3, lambda: random.randint(1000, 9999))]
        random.shuffle(opts)
        ans = opts.index(read)
        qs.append(choice(f"m-L001-Q{qn:02d}", f"{n} 读作（ ）", opts, ans, f"{n} 从高位读起，读作：{read}。"))
        qn += 1

    # 数的组成
    for _ in range(4):
        n = random.randint(1000, 9999)
        thousands = n // 1000
        hundreds = (n % 1000) // 100
        tens = (n % 100) // 10
        ones = n % 10
        comp = f"{thousands}个千、{hundreds}个百、{tens}个十和{ones}个一"
        qs.append(fillblank(f"m-L001-Q{qn:02d}", f"{n} 是由（ ）组成的。", comp, f"{n} = {thousands}×1000 + {hundreds}×100 + {tens}×10 + {ones}。"))
        qn += 1

    # 计数单位
    units_text = [
        ("一（个）", "十", 10), ("十", "百", 10), ("百", "千", 10), ("千", "万", 10)
    ]
    for a, b, r in units_text:
        opts = [str(r), "100", "1000", "10000"]
        random.shuffle(opts)
        ans = opts.index(str(r))
        qs.append(choice(f"m-L001-Q{qn:02d}", f"10 个 {a} 是（ ）；相邻两个计数单位 {a} 和 {b} 之间的进率是（ ）。", opts, ans, f"每相邻两个计数单位之间的进率都是 10。"))
        qn += 1

    # 写出数字
    for _ in range(4):
        n = random.randint(1000, 9999)
        read = num_to_chinese(n)
        qs.append(fillblank(f"m-L001-Q{qn:02d}", f"{read} 写作（ ）。", str(n), f"从高位写起，{read} 写作 {n}。"))
        qn += 1

    # 数位顺序
    digits_pos = ["个位", "十位", "百位", "千位", "万位"]
    for pos in ["十位", "百位", "千位"]:
        idx = digits_pos.index(pos)
        opts = [str(10**idx), str(10**(idx+1)), str(10**(idx-1)), str(10**idx * 2)]
        correct = str(10**idx)
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L001-Q{qn:02d}", f"{pos} 上的计数单位是（ ）。", opts, ans, f"{pos} 的计数单位是 {correct}。"))
        qn += 1

    # 比较大小
    for _ in range(4):
        a = random.randint(1000, 9999)
        b = random.randint(1000, 9999)
        while b == a:
            b = random.randint(1000, 9999)
        correct = ">" if a > b else "<"
        opts = [">", "<", "=", "无法比较"]
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L001-Q{qn:02d}", f"比较大小：{a} （ ） {b}", opts, ans, f"{a} {'大于' if a > b else '小于'} {b}，所以填 {correct}。"))
        qn += 1

    # 填近似/简单应用
    for _ in range(2):
        n = random.randint(1000, 9999)
        round_to = round(n, -2)  # nearest hundred
        opts = [str(round_to), str(round(n, -3)), str(round_to + 10), str(round_to - 10)]
        random.shuffle(opts)
        ans = opts.index(str(round_to))
        qs.append(choice(f"m-L001-Q{qn:02d}", f"{n} 最接近的整百数是（ ）。", opts, ans, f"看十位，{n} 四舍五入到百位约是 {round_to}。"))
        qn += 1

    # 额外选择题凑数
    while qn <= 30:
        n = random.randint(1000, 9999)
        read = num_to_chinese(n)
        opts = [read] + [num_to_chinese(x) for x in distractors(n, 3, lambda: random.randint(1000, 9999))]
        random.shuffle(opts)
        ans = opts.index(read)
        qs.append(choice(f"m-L001-Q{qn:02d}", f"下面的数中，读作“{read}”的是（ ）。", [str(x) for x in [n] + distractors(n, 3, lambda: random.randint(1000, 9999))], 0, f"{n} 读作 {read}。"))
        # rebuild options properly
        qs[-1]["options"] = [str(x) for x in [n] + distractors(n, 3, lambda: random.randint(1000, 9999))]
        random.shuffle(qs[-1]["options"])
        qs[-1]["answer"] = qs[-1]["options"].index(str(n))
        qn += 1

    return qs[:30]


# ============================================================
# Level 2: 大数的认识（二） 亿以内数
# ============================================================
def gen_level2() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    for _ in range(8):
        n = random.randint(10000, 99999999)
        read = num_to_chinese(n)
        opts = [read] + [num_to_chinese(x) for x in distractors(n, 3, lambda: random.randint(10000, 99999999))]
        random.shuffle(opts)
        ans = opts.index(read)
        qs.append(choice(f"m-L002-Q{qn:02d}", f"{n} 读作（ ）", opts, ans, f"{n} 分级读：万级和个级，读作 {read}。"))
        qn += 1

    for _ in range(4):
        n = random.randint(10000, 99999999)
        read = num_to_chinese(n)
        qs.append(fillblank(f"m-L002-Q{qn:02d}", f"{read} 写作（ ）。", str(n), f"{read} 写作 {n}。"))
        qn += 1

    # 数位/计数单位
    for pos, unit in [("万位", "10000"), ("十万位", "100000"), ("百万位", "1000000"), ("千万位", "10000000")]:
        opts = [unit, str(int(unit) * 10), str(int(unit) // 10), str(int(unit) * 100)]
        random.shuffle(opts)
        ans = opts.index(unit)
        qs.append(choice(f"m-L002-Q{qn:02d}", f"{pos} 的计数单位是（ ）。", opts, ans, f"{pos} 的计数单位是 {unit}。"))
        qn += 1

    # 相邻计数单位进率
    for _ in range(3):
        opts = ["10", "100", "1000", "10000"]
        random.shuffle(opts)
        ans = opts.index("10")
        qs.append(choice(f"m-L002-Q{qn:02d}", f"在整数数位顺序表中，每相邻两个计数单位之间的进率都是（ ）。", opts, ans, "十进制计数法中相邻计数单位进率是 10。"))
        qn += 1

    # 组成
    for _ in range(4):
        n = random.randint(100000, 99999999)
        wan = n // 10000
        ge = n % 10000
        comp = f"{wan}个万和{ge}个一"
        qs.append(fillblank(f"m-L002-Q{qn:02d}", f"{n} 是由（ ）组成的。", comp, f"{n} = {wan}×10000 + {ge}。"))
        qn += 1

    # 大小比较
    for _ in range(4):
        a = random.randint(100000, 99999999)
        b = random.randint(100000, 99999999)
        while b == a:
            b = random.randint(100000, 99999999)
        correct = ">" if a > b else "<"
        opts = [">", "<", "=", "无法确定"]
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L002-Q{qn:02d}", f"比较大小：{a} （ ） {b}", opts, ans, f"{a} {'大于' if a > b else '小于'} {b}，填 {correct}。"))
        qn += 1

    # 补到 30
    while qn <= 30:
        n = random.randint(100000, 99999999)
        opts = [str(n)] + [str(x) for x in distractors(n, 3, lambda: random.randint(100000, 99999999))]
        random.shuffle(opts)
        ans = opts.index(str(n))
        read = num_to_chinese(n)
        qs.append(choice(f"m-L002-Q{qn:02d}", f"读作“{read}”的数是（ ）。", opts, ans, f"{read} 写作 {n}。"))
        qn += 1

    return qs[:30]


# ============================================================
# Level 3: 大数的认识（三） 比较、排序、近似数
# ============================================================
def gen_level3() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 四舍五入到万位
    for _ in range(8):
        n = random.randint(10000, 99999999)
        # ensure千位不为0/5 以增加变化
        k = (n // 1000) % 10
        if k == 0 or k == 5:
            n += 1000
        approx = (n // 10000 + (1 if (n // 1000) % 10 >= 5 else 0)) * 10000
        opts = [f"{approx // 10000}万", f"{(approx // 10000) + 1}万", f"{(approx // 10000) - 1}万", f"{approx}万"]
        random.shuffle(opts)
        ans = opts.index(f"{approx // 10000}万")
        qs.append(choice(f"m-L003-Q{qn:02d}", f"把 {n} 四舍五入到万位约是（ ）。", opts, ans, f"看千位，{(n // 1000) % 10} {'≥5' if (n // 1000) % 10 >= 5 else '<5'}，所以约是 {approx // 10000} 万。"))
        qn += 1

    # 近似数填空
    for _ in range(4):
        n = random.randint(10000, 99999999)
        if (n // 1000) % 10 in (0, 5):
            n += 1000
        approx = (n // 10000 + (1 if (n // 1000) % 10 >= 5 else 0)) * 10000
        qs.append(fillblank(f"m-L003-Q{qn:02d}", f"{n} ≈ （ ）万（四舍五入到万位）。", f"{approx // 10000}万", f"千位是 {(n // 1000) % 10}，四舍五入后约为 {approx // 10000} 万。"))
        qn += 1

    # 排序
    for _ in range(4):
        nums = sorted([random.randint(100000, 99999999) for _ in range(4)], reverse=True)
        random.shuffle(nums)
        correct = ">".join(str(x) for x in sorted(nums, reverse=True))
        opts = [correct]
        for _ in range(3):
            shuffled = nums[:]
            random.shuffle(shuffled)
            opt = ">".join(str(x) for x in shuffled)
            if opt not in opts:
                opts.append(opt)
        while len(opts) < 4:
            shuffled = nums[:]
            random.shuffle(shuffled)
            opt = ">".join(str(x) for x in shuffled)
            if opt not in opts:
                opts.append(opt)
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L003-Q{qn:02d}", f"把 {nums} 按从大到小的顺序排列是（ ）。", opts, ans, f"比较最高位，从大到小排列为：{correct}。"))
        qn += 1

    # 大小比较
    for _ in range(4):
        a = random.randint(100000, 99999999)
        b = random.randint(100000, 99999999)
        while b == a:
            b = random.randint(100000, 99999999)
        correct = ">" if a > b else "<"
        opts = [">", "<", "=", "无法比较"]
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L003-Q{qn:02d}", f"比较大小：{a} （ ） {b}", opts, ans, f"{a} {'大于' if a > b else '小于'} {b}。"))
        qn += 1

    # 近似数概念
    for _ in range(4):
        n = random.randint(10000, 99999999)
        if (n // 1000) % 10 in (0, 5):
            n += 1000
        approx = (n // 10000 + (1 if (n // 1000) % 10 >= 5 else 0)) * 10000
        qs.append(fillblank(f"m-L003-Q{qn:02d}", f"一个数四舍五入到万位后约是 {approx // 10000} 万，这个数最大可能是（ ）。", f"{approx - 1}", f"四舍五入到万位约 {approx // 10000} 万的最大数是 {approx - 1}（千位为 4，其余各位为 9）。"))
        qn += 1

    # 补到30
    while qn <= 30:
        n = random.randint(10000, 99999999)
        if (n // 1000) % 10 in (0, 5):
            n += 1000
        approx = (n // 10000 + (1 if (n // 1000) % 10 >= 5 else 0)) * 10000
        opts = [f"{approx // 10000}万", f"{(approx // 10000) + 1}万", f"{(approx // 10000) - 1}万", f"{approx}万"]
        random.shuffle(opts)
        ans = opts.index(f"{approx // 10000}万")
        qs.append(choice(f"m-L003-Q{qn:02d}", f"{n} 四舍五入到万位约是（ ）。", opts, ans, f"千位是 {(n // 1000) % 10}，约为 {approx // 10000} 万。"))
        qn += 1

    return qs[:30]


# ============================================================
# Level 4: 大数的认识（四） 改写、单位
# ============================================================
def gen_level4() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 改写成用“万”作单位
    for _ in range(8):
        n = random.randint(10000, 99990000)
        n = (n // 10000) * 10000  # whole wan
        opts = [f"{n // 10000}万", f"{n}万", f"{n // 10000}个万", f"{n // 1000}万"]
        random.shuffle(opts)
        ans = opts.index(f"{n // 10000}万")
        qs.append(choice(f"m-L004-Q{qn:02d}", f"把 {n} 改写成用“万”作单位的数是（ ）。", opts, ans, f"去掉末尾 4 个 0，{n} = {n // 10000} 万。"))
        qn += 1

    for _ in range(4):
        n = random.randint(10000, 99990000)
        n = (n // 10000) * 10000
        qs.append(fillblank(f"m-L004-Q{qn:02d}", f"{n} = （ ）万", str(n // 10000), f"{n} 末尾有 4 个 0，等于 {n // 10000} 万。"))
        qn += 1

    # 改写成用“亿”作单位
    for _ in range(4):
        n = random.randint(100000000, 999900000000)
        n = (n // 100000000) * 100000000
        opts = [f"{n // 100000000}亿", f"{n}亿", f"{n // 100000000}个亿", f"{n // 10000000}亿"]
        random.shuffle(opts)
        ans = opts.index(f"{n // 100000000}亿")
        qs.append(choice(f"m-L004-Q{qn:02d}", f"把 {n} 改写成用“亿”作单位的数是（ ）。", opts, ans, f"去掉末尾 8 个 0，{n} = {n // 100000000} 亿。"))
        qn += 1

    # 单位换算填空
    for _ in range(4):
        n = random.randint(100000000, 999900000000)
        n = (n // 100000000) * 100000000
        qs.append(fillblank(f"m-L004-Q{qn:02d}", f"{n} = （ ）亿", str(n // 100000000), f"{n} 末尾有 8 个 0，等于 {n // 100000000} 亿。"))
        qn += 1

    # 生活中的大数
    for _ in range(4):
        n = random.randint(10000, 99999999)
        qs.append(choice(f"m-L004-Q{qn:02d}", f"某城市人口约 {n} 人，也可写作约（ ）万人。", [f"{round(n, -4) // 10000}万", f"{n // 10000}万", f"{round(n, -3) // 10000}万", f"{n // 1000}万"], 1, f"改写成用万作单位：{n} 人 = {n // 10000} 万人。"))
        qn += 1

    # 比较改写后的数
    for _ in range(3):
        a = random.randint(1, 9999)
        b = random.randint(1, 9999)
        correct = ">" if a > b else "<"
        opts = [">", "<", "=", "无法比较"]
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L004-Q{qn:02d}", f"比较：{a}万 （ ） {b}万", opts, ans, f"{a} {'大于' if a > b else '小于'} {b}，所以 {a}万 {correct} {b}万。"))
        qn += 1

    # 补到30
    while qn <= 30:
        n = random.randint(10000, 99990000)
        n = (n // 10000) * 10000
        opts = [f"{n // 10000}万", f"{n}万", f"{n // 1000}万", f"{n // 100000}万"]
        random.shuffle(opts)
        ans = opts.index(f"{n // 10000}万")
        qs.append(choice(f"m-L004-Q{qn:02d}", f"{n} = （ ）", opts, ans, f"{n} = {n // 10000} 万。"))
        qn += 1

    return qs[:30]


# ============================================================
# Level 5: 大数的认识（五） 综合
# ============================================================
def gen_level5() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 读写综合
    for _ in range(5):
        n = random.randint(10000, 99999999)
        read = num_to_chinese(n)
        opts = [read] + [num_to_chinese(x) for x in distractors(n, 3, lambda: random.randint(10000, 99999999))]
        random.shuffle(opts)
        ans = opts.index(read)
        qs.append(choice(f"m-L005-Q{qn:02d}", f"{n} 读作（ ）", opts, ans, f"{n} 读作 {read}。"))
        qn += 1

    # 组成
    for _ in range(3):
        n = random.randint(100000, 99999999)
        wan = n // 10000
        ge = n % 10000
        qs.append(fillblank(f"m-L005-Q{qn:02d}", f"{n} 是由（ ）个万和（ ）个一组成的。", f"{wan}、{ge}", f"{n} = {wan}×10000 + {ge}。"))
        qn += 1

    # 四舍五入
    for _ in range(5):
        n = random.randint(10000, 99999999)
        if (n // 1000) % 10 in (0, 5):
            n += 1000
        approx = (n // 10000 + (1 if (n // 1000) % 10 >= 5 else 0)) * 10000
        opts = [f"{approx // 10000}万", f"{(approx // 10000) + 1}万", f"{(approx // 10000) - 1}万", f"{approx}万"]
        random.shuffle(opts)
        ans = opts.index(f"{approx // 10000}万")
        qs.append(choice(f"m-L005-Q{qn:02d}", f"{n} 四舍五入到万位约是（ ）。", opts, ans, f"千位是 {(n // 1000) % 10}，约为 {approx // 10000} 万。"))
        qn += 1

    # 改写
    for _ in range(4):
        n = random.randint(10000, 99990000)
        n = (n // 10000) * 10000
        qs.append(fillblank(f"m-L005-Q{qn:02d}", f"把 {n} 改写成用“万”作单位的数是（ ）。", f"{n // 10000}万", f"{n} = {n // 10000} 万。"))
        qn += 1

    # 大小比较
    for _ in range(3):
        a = random.randint(100000, 99999999)
        b = random.randint(100000, 99999999)
        while b == a:
            b = random.randint(100000, 99999999)
        correct = ">" if a > b else "<"
        opts = [">", "<", "=", "无法比较"]
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L005-Q{qn:02d}", f"比较大小：{a} （ ） {b}", opts, ans, f"{a} {'大于' if a > b else '小于'} {b}。"))
        qn += 1

    # 排序
    for _ in range(3):
        nums = [random.randint(100000, 99999999) for _ in range(4)]
        correct = ">".join(str(x) for x in sorted(nums, reverse=True))
        opts = [correct]
        while len(opts) < 4:
            shuffled = nums[:]
            random.shuffle(shuffled)
            opt = ">".join(str(x) for x in shuffled)
            if opt not in opts:
                opts.append(opt)
        random.shuffle(opts)
        ans = opts.index(correct)
        qs.append(choice(f"m-L005-Q{qn:02d}", f"把 {nums} 从大到小排列是（ ）。", opts, ans, f"从大到小排列为 {correct}。"))
        qn += 1

    # 近似最值
    for _ in range(2):
        approx_wan = random.randint(100, 9999)
        qs.append(fillblank(f"m-L005-Q{qn:02d}", f"一个数四舍五入到万位约是 {approx_wan} 万，这个数最小是（ ）。", f"{(approx_wan - 1) * 10000 + 5000}", f"最小是 {(approx_wan - 1) * 10000 + 5000}（千位为 5，其余为 0）。"))
        qn += 1

    # 补到30
    while qn <= 30:
        n = random.randint(10000, 99999999)
        read = num_to_chinese(n)
        opts = [read] + [num_to_chinese(x) for x in distractors(n, 3, lambda: random.randint(10000, 99999999))]
        random.shuffle(opts)
        ans = opts.index(read)
        qs.append(choice(f"m-L005-Q{qn:02d}", f"{n} 读作（ ）", opts, ans, f"{n} 读作 {read}。"))
        qn += 1

    return qs[:30]


# ============================================================
# Helper for arithmetic
# ============================================================
def safe_eval(expr: str) -> int:
    allowed = set("0123456789+-*/()[] ")
    if not all(c in allowed for c in expr):
        raise ValueError(f"Unsafe expression: {expr}")
    expr = expr.replace("[", "(").replace("]", ")")
    return eval(expr, {"__builtins__": {}}, {})


# ============================================================
# Level 6: 四则运算（一） 不含括号混合运算
# ============================================================
def gen_level6() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 各部分关系
    for _ in range(4):
        a = random.randint(10, 999)
        b = random.randint(10, 999)
        c = a + b
        opts = [f"{c} - {b}", f"{c} + {b}", f"{c} - {a}", f"{b} - {a}"]
        random.shuffle(opts)
        ans = opts.index(f"{c} - {b}")
        qs.append(choice(f"m-L006-Q{qn:02d}", f"如果 {a} + {b} = {c}，那么 {a} = （ ）。", opts, ans, f"加数 = 和 - 另一个加数，所以 {a} = {c} - {b}。"))
        qn += 1

    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(2, 9)
        c = a * b
        opts = [f"{c} ÷ {b}", f"{c} × {b}", f"{c} ÷ {a}", f"{b} × {a}"]
        random.shuffle(opts)
        ans = opts.index(f"{c} ÷ {b}")
        qs.append(choice(f"m-L006-Q{qn:02d}", f"如果 {a} × {b} = {c}，那么 {a} = （ ）。", opts, ans, f"因数 = 积 ÷ 另一个因数，所以 {a} = {c} ÷ {b}。"))
        qn += 1

    # 同级运算
    templates = [
        ("{a} + {b} - {c}", "只有加减，从左往右算。"),
        ("{a} - {b} + {c}", "只有加减，从左往右算。"),
        ("{a} × {b} ÷ {c}", "只有乘除，从左往右算。"),
        ("{a} ÷ {b} × {c}", "只有乘除，从左往右算。"),
    ]
    for _ in range(6):
        templ, hint = random.choice(templates)
        a = random.randint(10, 999)
        b = random.randint(1, 99)
        c = random.randint(1, 99)
        expr = templ.format(a=a, b=b, c=c)
        val = safe_eval(expr.replace("÷", "/"))
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: val + random.randint(-5, 5))]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L006-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, hint))
        qn += 1

    # 两级混合
    for _ in range(6):
        a = random.randint(1, 99)
        b = random.randint(2, 9)
        c = random.randint(10, 99)
        d = random.randint(1, 9)
        expr = f"{a} + {b} × {c} - {d}"
        val = a + b * c - d
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a + b * (c - d))]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L006-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, "先算乘法，再算加减。"))
        qn += 1

    # 填空
    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(2, 9)
        c = random.randint(10, 99)
        expr = f"{a} + {b} × {c}"
        val = a + b * c
        qs.append(fillblank(f"m-L006-Q{qn:02d}", f"计算：{expr} = （ ）。", str(val), f"先算乘法 {b}×{c}={b*c}，再算加法 {a}+{b*c}={val}。"))
        qn += 1

    # 应用题
    for _ in range(4):
        price = random.randint(5, 50)
        qty = random.randint(3, 20)
        extra = random.randint(5, 50)
        total = price * qty + extra
        qs.append(choice(f"m-L006-Q{qn:02d}", f"每支钢笔 {price} 元，小明买了 {qty} 支，又买了一本 {extra} 元的笔记本，一共花了（ ）元。", [str(total)] + [str(x) for x in distractors(total, 3, lambda: (price + qty) * extra)], 0, f"先算钢笔总价 {price}×{qty}={price*qty}，再加笔记本 {extra} 元，共 {total} 元。"))
        # rebuild and shuffle
        opts = [str(total)] + [str(x) for x in distractors(total, 3, lambda: total + random.randint(-10, 10))]
        random.shuffle(opts)
        qs[-1]["options"] = opts
        qs[-1]["answer"] = opts.index(str(total))
        qn += 1

    # 补到30
    while qn <= 30:
        a = random.randint(10, 999)
        b = random.randint(10, 999)
        c = random.randint(10, 999)
        expr = f"{a} + {b} - {c}"
        val = a + b - c
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: val + random.randint(-10, 10))]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L006-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, "只有加减，从左往右算。"))
        qn += 1

    return qs[:30]


# ============================================================
# Level 7: 四则运算（二） 含小括号
# ============================================================
def gen_level7() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 小括号优先
    for _ in range(10):
        a = random.randint(10, 99)
        b = random.randint(1, 99)
        c = random.randint(2, 9)
        d = random.randint(1, 9)
        expr = f"({a} + {b}) × {c} - {d}"
        val = (a + b) * c - d
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a + b * c - d)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L007-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, "有括号先算括号里面的，再算括号外面的。"))
        qn += 1

    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(10, 99)
        c = random.randint(2, 9)
        expr = f"({a} + {b}) ÷ {c}"
        val = (a + b) // c
        qs.append(fillblank(f"m-L007-Q{qn:02d}", f"计算：{expr} = （ ）。", str(val), f"先算括号里 {a}+{b}={a+b}，再算除法 {a+b}÷{c}={val}。"))
        qn += 1

    # 去括号/添括号
    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(10, 99)
        c = random.randint(1, 9)
        left = a - b - c
        right = a - (b + c)
        opts = ["相等", "不相等", "无法比较", "左边大"]
        random.shuffle(opts)
        ans = opts.index("相等")
        qs.append(choice(f"m-L007-Q{qn:02d}", f"比较：{a} - {b} - {c} 与 {a} - ({b} + {c})（ ）。", opts, ans, "一个数连续减去两个数，等于减去这两个数的和。"))
        qn += 1

    # 添加括号改变顺序
    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(2, 9)
        c = random.randint(2, 9)
        expr = f"{a} + {b} × {c}"
        # with parentheses
        paren_expr = f"({a} + {b}) × {c}"
        val = (a + b) * c
        opts = [paren_expr, expr, f"{a} + ({b} × {c})", f"({a} + {b} × {c})"]
        random.shuffle(opts)
        ans = opts.index(paren_expr)
        qs.append(choice(f"m-L007-Q{qn:02d}", f"要使算式先算加法，再算乘法，应给 {expr} 加上括号变成（ ）。", opts, ans, f"给 {a}+{b} 加上括号即可：({a}+{b})×{c}。"))
        qn += 1

    # 应用题
    for _ in range(4):
        total = random.randint(100, 500)
        used1 = random.randint(20, 80)
        used2 = random.randint(20, 80)
        remain = total - used1 - used2
        opts = [str(remain)] + [str(x) for x in distractors(remain, 3, lambda: total - (used1 + used2) // 2)]
        random.shuffle(opts)
        ans = opts.index(str(remain))
        qs.append(choice(f"m-L007-Q{qn:02d}", f"学校买来 {total} 本故事书，一年级领走 {used1} 本，二年级领走 {used2} 本，还剩（ ）本。", opts, ans, f"列式：{total} - {used1} - {used2} = {remain}（本）。"))
        qn += 1

    # 补到30
    while qn <= 30:
        a = random.randint(10, 99)
        b = random.randint(10, 99)
        c = random.randint(2, 9)
        expr = f"({a} - {b}) × {c}"
        val = (a - b) * c
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a - b * c)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L007-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, "先算小括号里的减法，再算乘法。"))
        qn += 1

    return qs[:30]


# ============================================================
# Level 8: 四则运算（三） 含中括号
# ============================================================
def gen_level8() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    for _ in range(10):
        a = random.randint(1, 50)
        b = random.randint(1, 50)
        c = random.randint(2, 9)
        d = random.randint(1, 9)
        expr = f"[({a} + {b}) × {c}] ÷ {d}"
        val = ((a + b) * c) // d
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: (a + b) * (c // d))]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L008-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, "有中括号和小括号时，先算小括号里的，再算中括号里的，最后算括号外面的。"))
        qn += 1

    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(1, 9)
        c = random.randint(1, 9)
        d = random.randint(1, 9)
        expr = f"[{a} + {b} × ({c} + {d})]"
        val = a + b * (c + d)
        qs.append(fillblank(f"m-L008-Q{qn:02d}", f"计算：{expr} = （ ）。", str(val), f"先算小括号 {c}+{d}={c+d}，再算乘法 {b}×{c+d}={b*(c+d)}，最后算加法 {a}+{b*(c+d)}={val}。"))
        qn += 1

    # 运算顺序判断
    for _ in range(4):
        a, b, c, d = random.randint(1, 9), random.randint(1, 9), random.randint(1, 9), random.randint(1, 9)
        expr = f"{a} + {b} × [{c} - ({d} + 1)]"
        opts = ["小括号→中括号→乘法→加法", "加法→小括号→中括号→乘法", "乘法→小括号→中括号→加法", "小括号→加法→中括号→乘法"]
        random.shuffle(opts)
        ans = opts.index("小括号→中括号→乘法→加法")
        qs.append(choice(f"m-L008-Q{qn:02d}", f"算式 {expr} 的运算顺序是（ ）。", opts, ans, "有中括号和小括号时，先小括号，再中括号，然后乘除，最后加减。"))
        qn += 1

    # 改错类
    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(1, 9)
        c = random.randint(1, 9)
        expr = f"{a} + {b} × ({c} + 2)"
        correct = a + b * (c + 2)
        wrong = (a + b) * (c + 2)
        opts = [f"先算 {c}+2，再算 {b}×({c+2})，最后加 {a}", f"先算 {a}+{b}", f"先算 {b}×{c}", f"从左往右依次算"]
        random.shuffle(opts)
        ans = opts.index(f"先算 {c}+2，再算 {b}×({c+2})，最后加 {a}")
        qs.append(choice(f"m-L008-Q{qn:02d}", f"下面哪个是正确的运算顺序？{expr}", opts, ans, f"有小括号先算小括号里的 {c}+2，再算乘法，最后算加法，结果是 {correct}。"))
        qn += 1

    # 应用题
    for _ in range(4):
        pages_per_day = random.randint(15, 35)
        days1 = random.randint(3, 7)
        days2 = random.randint(3, 7)
        total = pages_per_day * (days1 + days2)
        opts = [str(total)] + [str(x) for x in distractors(total, 3, lambda: pages_per_day * days1 + days2)]
        random.shuffle(opts)
        ans = opts.index(str(total))
        qs.append(choice(f"m-L008-Q{qn:02d}", f"小红每天看 {pages_per_day} 页书，前 {days1} 天和后 {days2} 天一共看了（ ）页。", opts, ans, f"列式：{pages_per_day}×({days1}+{days2}) = {total}（页）。"))
        qn += 1

    # 补到30
    while qn <= 30:
        a = random.randint(1, 50)
        b = random.randint(1, 50)
        c = random.randint(2, 9)
        d = random.randint(1, 9)
        expr = f"[{a} × ({b} + {c})] ÷ {d}"
        val = (a * (b + c)) // d
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a * b + c // d)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L008-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, "先算小括号，再算中括号，最后算括号外的除法。"))
        qn += 1

    return qs[:30]


# ============================================================
# Level 9: 四则运算（四） 运算定律
# ============================================================
def gen_level9() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 加法交换律
    for _ in range(3):
        a = random.randint(10, 999)
        b = random.randint(10, 999)
        opts = [f"{a} + {b} = {b} + {a}", f"{a} + {b} = {a} - {b}", f"{a} + {b} = {b} - {a}", f"{a} + {b} = {a} × {b}"]
        random.shuffle(opts)
        ans = opts.index(f"{a} + {b} = {b} + {a}")
        qs.append(choice(f"m-L009-Q{qn:02d}", f"下面哪个式子运用了加法交换律？", opts, ans, "加法交换律：两个加数交换位置，和不变。"))
        qn += 1

    # 加法结合律
    for _ in range(3):
        a = random.randint(10, 999)
        b = random.randint(10, 999)
        c = random.randint(10, 999)
        opts = [f"{a} + {b} + {c} = {a} + ({b} + {c})", f"{a} + {b} + {c} = {a} × ({b} + {c})", f"{a} + {b} + {c} = {b} + ({a} - {c})", f"{a} + {b} + {c} = {c} + {a} + {b}"]
        random.shuffle(opts)
        ans = opts.index(f"{a} + {b} + {c} = {a} + ({b} + {c})")
        qs.append(choice(f"m-L009-Q{qn:02d}", f"下面哪个式子运用了加法结合律？", opts, ans, "加法结合律：先把前两个数相加，或先把后两个数相加，和不变。"))
        qn += 1

    # 乘法交换律
    for _ in range(3):
        a = random.randint(2, 99)
        b = random.randint(2, 99)
        opts = [f"{a} × {b} = {b} × {a}", f"{a} × {b} = {a} + {b}", f"{a} × {b} = {a} ÷ {b}", f"{a} × {b} = {b} ÷ {a}"]
        random.shuffle(opts)
        ans = opts.index(f"{a} × {b} = {b} × {a}")
        qs.append(choice(f"m-L009-Q{qn:02d}", f"下面哪个式子运用了乘法交换律？", opts, ans, "乘法交换律：两个因数交换位置，积不变。"))
        qn += 1

    # 乘法结合律
    for _ in range(3):
        a = random.randint(2, 99)
        b = random.randint(2, 9)
        c = random.randint(2, 9)
        opts = [f"{a} × {b} × {c} = {a} × ({b} × {c})", f"{a} × {b} × {c} = ({a} + {b}) × {c}", f"{a} × {b} × {c} = {a} + {b} × {c}", f"{a} × {b} × {c} = {b} × ({a} + {c})"]
        random.shuffle(opts)
        ans = opts.index(f"{a} × {b} × {c} = {a} × ({b} × {c})")
        qs.append(choice(f"m-L009-Q{qn:02d}", f"下面哪个式子运用了乘法结合律？", opts, ans, "乘法结合律：先把前两个数相乘，或先把后两个数相乘，积不变。"))
        qn += 1

    # 简便计算
    for _ in range(4):
        a = random.randint(100, 999)
        b = random.randint(1, 99)
        val = a + b + (1000 - a) if random.random() < 0.5 else a + b + (100 - a % 100)
        # simpler: make complement to 100
        a = random.randint(1, 99)
        comp = 100 - a
        b = random.randint(100, 999)
        expr = f"{a} + {b} + {comp}"
        val = a + b + comp
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: (a + b) + comp + 1)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L009-Q{qn:02d}", f"简便计算：{expr} = （ ）。", opts, ans, f"利用加法结合律：{a}+{comp}=100，再加 {b} 得 {val}。"))
        qn += 1

    # 乘法简便
    for _ in range(4):
        a = random.randint(2, 9)
        b = random.randint(2, 9)
        c = random.randint(10, 99)
        expr = f"{a} × {b} × {c}"
        val = a * b * c
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a * (b + c))]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L009-Q{qn:02d}", f"简便计算：{expr} = （ ）。", opts, ans, f"先算 {a}×{b}={a*b}，再算 {a*b}×{c}={val}。"))
        qn += 1

    # 填空
    for _ in range(4):
        a = random.randint(10, 999)
        b = random.randint(10, 999)
        c = a + b
        qs.append(fillblank(f"m-L009-Q{qn:02d}", f"根据加法交换律，{a} + {b} = （ ） + {a}。", str(b), f"加法交换律：{a}+{b}={b}+{a}。"))
        qn += 1

    # 补到30
    while qn <= 30:
        a = random.randint(10, 999)
        b = random.randint(10, 999)
        c = random.randint(10, 999)
        expr = f"{a} + {b} + {c}"
        val = a + b + c
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a + (b + c) + 1)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L009-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, "按从左往右顺序计算，也可利用加法结合律凑整。"))
        qn += 1

    return qs[:30]


# ============================================================
# Level 10: 四则运算（五） 乘法分配律与综合应用
# ============================================================
def gen_level10() -> List[Dict[str, Any]]:
    qs = []
    qn = 1

    # 乘法分配律识别
    for _ in range(4):
        a = random.randint(2, 99)
        b = random.randint(2, 99)
        c = random.randint(2, 9)
        opts = [f"{a} × ({b} + {c}) = {a} × {b} + {a} × {c}",
                f"{a} × ({b} + {c}) = {a} + {b} × {c}",
                f"{a} × ({b} + {c}) = {a} × {b} + {c}",
                f"{a} × ({b} + {c}) = {a} + {b} + {c}"]
        random.shuffle(opts)
        ans = opts.index(f"{a} × ({b} + {c}) = {a} × {b} + {a} × {c}")
        qs.append(choice(f"m-L010-Q{qn:02d}", f"下面哪个式子运用了乘法分配律？", opts, ans, "乘法分配律：a×(b+c)=a×b+a×c。"))
        qn += 1

    # 乘法分配律计算
    for _ in range(6):
        a = random.randint(2, 99)
        b = random.randint(10, 99)
        c = random.randint(1, 9)
        expr = f"{a} × ({b} + {c})"
        val = a * (b + c)
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a * b + c)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L010-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, f"利用乘法分配律：{a}×{b}+{a}×{c}={a*b}+{a*c}={val}。"))
        qn += 1

    # 逆用分配律
    for _ in range(4):
        a = random.randint(2, 99)
        b = random.randint(2, 99)
        c = random.randint(2, 9)
        expr = f"{a} × {c} + {b} × {c}"
        val = (a + b) * c
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: (a + b) + c)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L010-Q{qn:02d}", f"简便计算：{expr} = （ ）。", opts, ans, f"逆用乘法分配律：({a}+{b})×{c}={a+b}×{c}={val}。"))
        qn += 1

    # 填空
    for _ in range(4):
        a = random.randint(2, 99)
        b = random.randint(10, 99)
        c = random.randint(1, 9)
        val = a * (b + c)
        qs.append(fillblank(f"m-L010-Q{qn:02d}", f"{a} × ({b} + {c}) = {a} × {b} + {a} × （ ）。", str(c), f"乘法分配律：{a}×({b}+{c})={a}×{b}+{a}×{c}。"))
        qn += 1

    # 综合应用题
    for _ in range(4):
        price1 = random.randint(20, 80)
        price2 = random.randint(10, 60)
        qty = random.randint(3, 12)
        total = (price1 + price2) * qty
        opts = [str(total)] + [str(x) for x in distractors(total, 3, lambda: price1 * qty + price2)]
        random.shuffle(opts)
        ans = opts.index(str(total))
        qs.append(choice(f"m-L010-Q{qn:02d}", f"一个书包 {price1} 元，一个文具盒 {price2} 元，买 {qty} 套这样的书包和文具盒一共要（ ）元。", opts, ans, f"可先算一套价格 {price1}+{price2}={price1+price2} 元，再乘 {qty} 套，共 {total} 元。"))
        qn += 1

    # 综合运算
    for _ in range(4):
        a = random.randint(10, 99)
        b = random.randint(2, 9)
        c = random.randint(10, 99)
        expr = f"{a} × {b} + {c} × {b}"
        val = (a + c) * b
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a * b + c)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L010-Q{qn:02d}", f"简便计算：{expr} = （ ）。", opts, ans, f"逆用乘法分配律：({a}+{c})×{b}={a+c}×{b}={val}。"))
        qn += 1

    # 补到30
    while qn <= 30:
        a = random.randint(2, 99)
        b = random.randint(10, 99)
        c = random.randint(1, 9)
        expr = f"{a} × ({b} - {c})"
        val = a * (b - c)
        opts = [str(val)] + [str(x) for x in distractors(val, 3, lambda: a * b - c)]
        random.shuffle(opts)
        ans = opts.index(str(val))
        qs.append(choice(f"m-L010-Q{qn:02d}", f"计算：{expr} = （ ）。", opts, ans, f"利用乘法分配律：{a}×{b}-{a}×{c}={a*b}-{a*c}={val}。"))
        qn += 1

    return qs[:30]


def main():
    levels_config = [
        (1, "大数的认识（一）", gen_level1),
        (2, "大数的认识（二）", gen_level2),
        (3, "大数的认识（三）", gen_level3),
        (4, "大数的认识（四）", gen_level4),
        (5, "大数的认识（五）", gen_level5),
        (6, "四则运算（一）", gen_level6),
        (7, "四则运算（二）", gen_level7),
        (8, "四则运算（三）", gen_level8),
        (9, "四则运算（四）", gen_level9),
        (10, "四则运算（五）", gen_level10),
    ]

    for level, topic, gen_fn in levels_config:
        questions = gen_fn()
        # ensure counts
        choice_count = sum(1 for q in questions if q["type"] == "choice")
        fill_count = sum(1 for q in questions if q["type"] == "fillblank")
        assert len(questions) == 30, f"Level {level} has {len(questions)} questions"
        assert choice_count >= 18, f"Level {level} only {choice_count} choices"
        assert fill_count <= 12, f"Level {level} has {fill_count} fillblanks"
        write_level(level, "math", topic, 1, questions)

    print("All levels generated successfully.")


if __name__ == "__main__":
    main()
