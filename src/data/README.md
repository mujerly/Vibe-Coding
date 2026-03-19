# 配置文件说明

本目录下的所有文件都是**纯数据配置**，不包含任何代码逻辑。
团队成员只需修改 JSON / TXT 文件即可调整游戏内容，无需接触代码。

## 目录结构

```
src/data/
├── girls/                  ← 妹子负责人改这里
│   ├── xiaotian.json
│   ├── jessica.json
│   └── linyouyou.json
├── economy/                ← 经济负责人改这里
│   ├── gifts.json
│   └── jobs.json
├── prompts/                ← 开发者维护，一般不改
│   └── meta.txt
├── balance.json            ← 数值负责人改这里
├── ui-strings.json         ← 界面文案
└── README.md               ← 你正在看的这个文件
```

## 添加新角色

在 `girls/` 下新建一个 `.json` 文件即可，**不需要改任何代码**。
文件名随意，系统会自动扫描该目录下的所有 JSON 文件。

---

## girls/*.json — 角色卡

每个文件定义一个女生角色。以下是完整字段说明。

### 基础信息

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识符，英文小写，如 `"xiaotian"` |
| `name` | string | 显示名称，如 `"小甜"` |
| `avatar` | string | 头像。支持 emoji（`"🥺"`）、图片路径（`"/avatars/xiaotian.png"`）或 URL |
| `age` | number | 年龄 |
| `personality` | string | 性格一句话描述，如 `"恋爱脑、容易感动、缺乏安全感"` |
| `bio` | string | 简介，如 `"大三学生，很在意被及时回应。"` |
| `tags` | string[] | 标签，如 `["恋爱脑", "秒回敏感", "低成本攻略"]` |

### 聊天配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `speakingStyle` | string | 说话风格描述，如 `"喜欢发表情和叠字，语气软软的"` |
| `interests` | string[] | 感兴趣的话题，如 `["奶茶", "花", "陪伴感"]` |
| `intro` | string | 游戏开始时她发的第一条消息 |
| `quickPrompts` | string[] | 聊天界面底部的快捷回复建议（3条左右） |
| `checkInTemplates` | string[] | 玩家打工回来后她的抱怨消息模板（随机选一条） |

### 礼物偏好

| 字段 | 类型 | 说明 |
|------|------|------|
| `likedGiftIds` | string[] | 喜欢的礼物 ID，如 `["milk-tea", "rose"]` |
| `dislikedGiftIds` | string[] | 讨厌的礼物 ID，如 `["rose"]`。可为空数组 |
| `giftReactions` | object | 收到特定礼物时的描述文案（传给 AI 的上下文）。key 是礼物 ID |

示例：
```json
"giftReactions": {
  "milk-tea": "她会立刻感受到\"被惦记\"的感觉，心情明显变好。",
  "rose": "她会被浪漫氛围击中，整个人都开始飘起来。"
}
```

### 回复延迟惩罚

| 字段 | 类型 | 说明 |
|------|------|------|
| `anxiousWaitMultiplier` | number | 等待焦虑倍率。越高 = 玩家打工时她掉好感越快。小甜 1.5，Jessica 0.8 |

### prompt — AI 提示词配置

这是**最重要的部分**，直接决定 AI 回复的质量。

#### prompt.persona（人设描述）

用自然语言写一段完整的人设，告诉 AI "你是谁"。
这段文字会原封不动地发给 AI，所以写得越具体越好。

```json
"persona": "你叫小甜，21岁大三学生，是一个典型的恋爱脑女生。你对感情非常敏感，别人对你稍微好一点你就会很开心。你说话喜欢用叠字，比如\"好哦好哦\"\"嘿嘿嘿\"。"
```

#### prompt.redLines（雷区）

她绝对不会做的事，或会让她反感的行为：

```json
"redLines": ["不会说脏话", "被冷落太久会焦虑追问", "被直接拒绝会很受伤"]
```

#### prompt.softSpots（软肋）

能打动她的事情：

```json
"softSpots": ["被夸可爱", "收到奶茶", "被偏爱的感觉"]
```

#### prompt.stages — 阶段剧本

按好感度阶段写不同的行为指南。共 5 个阶段，key 必须精确匹配：

`"冷淡"` / `"礼貌"` / `"有兴趣"` / `"暧昧"` / `"热恋"`

每个阶段包含：

| 字段 | 说明 |
|------|------|
| `mindset` | 她现在怎么看对方（一句话） |
| `replyStyle` | 这个阶段她回消息的特点 |
| `initiatives` | 她会不会主动找话题 |
| `exampleReplies` | 这个阶段的典型回复（2-4条） |
| `transitionHint` | 什么行为能让她进入下一阶段（给 AI 参考） |

示例：
```json
"暧昧": {
  "mindset": "已经上头了，每条消息都会反复看，等回复会焦虑。",
  "replyStyle": "大量叠字和表情，会撒娇，语气很软。",
  "initiatives": "会主动找话题、撒娇、问你在干嘛。",
  "exampleReplies": ["你怎么才来找我嘛🥺", "嘿嘿嘿嘿你说的是真的吗！！"],
  "transitionHint": "保持高频率互动和小惊喜即可稳固关系。"
}
```

#### prompt.examples — 示范对话

**这是让 AI 回复更像人的最关键部分。** 写得越多越好（建议 5-10 组）。

```json
"examples": [
  { "player": "宝贝你今天开心吗", "girl": "嘿嘿你怎么突然这样叫我啦😳" },
  { "player": "在吗", "girl": "在呀在呀！你找我有事吗嘿嘿" },
  { "player": "你好烦", "girl": "...你说什么？你是不是不喜欢我了" }
]
```

建议覆盖以下场景的示范：正常聊天、被夸、被冷落、收到礼物、对方说了油腻的话、对方消失很久回来。

### fallback — 本地保底回复配置

当 AI 不可用时使用的回复逻辑。

#### fallback.signalWeights（信号权重）

系统会检测玩家消息中的信号，每个信号的权重决定好感变化：

| key | 检测内容 | 示例 |
|-----|----------|------|
| `sweet` | 甜言蜜语 | 想你、喜欢、陪你、晚安 |
| `oily` | 油腻称呼 | 宝贝、亲爱的、老婆、baby |
| `practical` | 实际行动 | 安排、吃饭、餐厅、计划 |
| `deep` | 有深度的话题 | 书、电影、哲学、创作、灵感 |
| `long` | 消息长度 ≥ 18 字 | — |
| `gift` | 送了礼物 | — |

正数 = 加好感，负数 = 减好感，0 = 无影响。

示例：小甜吃甜话（sweet: 4），林悠悠讨厌油腻（oily: -5）。

#### fallback.goodThreshold

信号总分达到多少算"好回复"（通常设 4）。

#### fallback.goodReply / neutralReply / badReply

三种情况的回复模板：

```json
"goodReply":    { "text": "你这样讲我会忍不住开心诶🥺", "mood": "心动" },
"neutralReply": { "text": "我有看到啦，你会一直这样哄我吗。", "mood": "试探" },
"badReply":     { "text": "这种说法有点太熟练了吧。", "mood": "反感" }
```

`badReply` 可以设为 `null`（表示这个角色不会给负面回复，比如小甜）。

---

## economy/gifts.json — 礼物列表

数组格式，每个对象代表一个礼物：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识符，如 `"milk-tea"`。角色卡的 `likedGiftIds` 引用这个 |
| `name` | string | 显示名称 |
| `emoji` | string | 图标 |
| `price` | number | 价格（0 = 免费） |
| `description` | string | 商店里显示的描述 |
| `advice` | string | 商店里显示的推荐文案，如 `"推荐给：小甜 / 通用保底"` |

添加新礼物：直接在数组末尾加一个对象即可。
记得同时在对应的角色卡 `likedGiftIds` 或 `dislikedGiftIds` 中引用新礼物的 `id`。

---

## economy/jobs.json — 工作列表

数组格式，每个对象代表一种工作：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识符 |
| `name` | string | 工作名称 |
| `emoji` | string | 图标 |
| `duration` | number | 工作时长，单位**秒** |
| `reward` | number | 基础收入 |
| `rewardRange` | [number, number] | 可选。设置后收入在 [min, max] 之间随机 |
| `description` | string | 描述 |

注意：打工期间玩家无法回消息，时间越长妹子掉好感越多。

---

## balance.json — 全局数值平衡

控制整个游戏的数值体系。

### 初始值

| 字段 | 说明 |
|------|------|
| `initialMoney` | 开局金钱（当前 120） |
| `initialAffection` | 每个妹子的初始好感度（当前 30） |
| `initialMood` | 初始情绪（当前 "观望"） |

### affectionTiers — 好感度阶段

定义好感度对应的关系阶段名称。`min`/`max` 是好感度范围，`label` 是阶段名。
阶段名必须和角色卡里 `prompt.stages` 的 key 一致。

### statusThresholds — 状态阈值

| 字段 | 说明 |
|------|------|
| `blocked` | 好感度 ≤ 此值 → 拉黑（当前 0） |
| `angry` | 好感度 < 此值 → 生气（当前 15） |
| `suspicious` | 好感度 < 此值 → 怀疑（当前 30） |
| `angryMoodPatterns` | 情绪包含这些词时也触发生气状态 |
| `suspiciousMoodPatterns` | 情绪包含这些词时也触发怀疑状态 |

### giftPreference — 礼物好感度变化

| 字段 | 说明 |
|------|------|
| `likedDelta` | 送了喜欢的礼物 → 好感 +6 |
| `likedFreeDelta` | 送了免费的喜欢礼物（如手写信） → 好感 +4 |
| `dislikedDelta` | 送了讨厌的礼物 → 好感 -4 |
| `defaultDelta` | 送了无感礼物 → 好感 +1 |

### delayPenalty — 打工期间掉好感

| 字段 | 说明 |
|------|------|
| `secondsPerTick` | 每多少秒算一个惩罚单位（当前 45） |
| `highAffectionThreshold` | 好感度超过此值时额外加罚（当前 60） |
| `highAffectionExtra` | 额外惩罚值（当前 1） |

实际掉的好感 = `ceil((时间惩罚 + 高好感额外惩罚) × 角色的焦虑倍率)`

### scoring — 计分公式

最终得分 = `攻略人数 × conqueredBonus + 总好感 × affectionMultiplier + 剩余钱/moneyDivisor - 花掉的钱/spentDivisor - 被拉黑人数 × blockedPenalty`

### gameOverMessage

所有妹子都拉黑时显示的结束语。

---

## prompts/meta.txt — AI 元指令

**一般不需要修改。** 这是发给 AI 的基础行为规则，包括：
- 禁止 AI 暴露身份
- 回复长度限制
- 输出 JSON 格式要求

只有开发者在调整 AI 行为时才需要改这个文件。

---

## ui-strings.json — 界面文案

| 字段 | 说明 |
|------|------|
| `demoChecklist` | 左侧面板"演示顺序"区域的文案列表 |
| `strategyHints` | 左侧面板"攻略提示"区域的文案列表 |

---

## 头像配置

角色卡的 `avatar` 字段支持三种格式：

```json
"avatar": "🥺"                              // emoji
"avatar": "/avatars/xiaotian.png"           // 图片文件（放在 public/avatars/ 下）
"avatar": "https://example.com/avatar.jpg"  // 外部URL
```

使用图片时，把文件放到项目根目录的 `public/avatars/` 文件夹中。
