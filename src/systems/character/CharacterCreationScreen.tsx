import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

const AVATAR_OPTIONS = ['😎', '🧑', '👨', '🧔', '👩', '🧕', '🧑‍💻', '🕵️']

export function CharacterCreationScreen() {
  const setPlayerProfile = useGameStore((s) => s.setPlayerProfile)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [avatarIdx, setAvatarIdx] = useState(0)

  const canStart = name.trim().length >= 1

  const handleStart = () => {
    if (!canStart) return
    setPlayerProfile({ name: name.trim(), gender })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col items-center justify-center gap-6 px-6 pb-8 pt-6"
    >
      <div className="text-center">
        <div className="text-4xl">{AVATAR_OPTIONS[avatarIdx]}</div>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink">创建你的角色</h1>
        <p className="mt-1 text-sm text-wine/60">在开始之前，先告诉我们你是谁</p>
      </div>

      {/* Avatar picker */}
      <div className="flex flex-wrap justify-center gap-2">
        {AVATAR_OPTIONS.map((emoji, idx) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setAvatarIdx(idx)}
            className={`h-10 w-10 rounded-full text-xl transition-all ${
              avatarIdx === idx
                ? 'bg-wine/15 ring-2 ring-wine/50 scale-110'
                : 'bg-cream hover:bg-wine/10'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Name input */}
      <div className="w-full">
        <label className="text-xs font-semibold uppercase tracking-wider text-wine/50">
          你叫什么名字？
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          placeholder="输入名字…"
          className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm text-ink placeholder-wine/30 outline-none ring-1 ring-transparent focus:ring-wine/30"
        />
      </div>

      {/* Gender selector */}
      <div className="w-full">
        <label className="text-xs font-semibold uppercase tracking-wider text-wine/50">性别</label>
        <div className="mt-2 flex gap-3">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition-all ${
                gender === g
                  ? 'bg-wine text-white shadow-md'
                  : 'bg-cream text-wine/70 hover:bg-wine/10'
              }`}
            >
              {g === 'male' ? '男 ♂' : '女 ♀'}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        whileTap={{ scale: 0.97 }}
        className={`w-full rounded-2xl py-3.5 text-sm font-bold transition-all ${
          canStart
            ? 'bg-wine text-white shadow-md hover:bg-wine/90'
            : 'cursor-not-allowed bg-cream text-wine/30'
        }`}
      >
        开始游戏
      </motion.button>
    </motion.div>
  )
}
