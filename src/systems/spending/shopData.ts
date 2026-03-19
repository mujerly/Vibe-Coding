import type { Gift } from '../../store/gameTypes'

export const shopItems: Gift[] = [
  {
    id: 'milk-tea',
    name: '奶茶',
    emoji: '🍵',
    price: 15,
    description: '便宜好用的通用礼物，小甜尤其吃这一套。',
  },
  {
    id: 'rose',
    name: '红玫瑰',
    emoji: '🌹',
    price: 50,
    description: '恋爱氛围直接拉满，但 Jessica 会觉得有点老套。',
  },
  {
    id: 'book',
    name: '精装书',
    emoji: '📚',
    price: 80,
    description: '林悠悠的高匹配礼物，送中主题会很加分。',
  },
  {
    id: 'lipstick',
    name: '口红',
    emoji: '💄',
    price: 200,
    description: 'Jessica 会认真看待这类有品质的投入。',
  },
  {
    id: 'luxury-bag',
    name: '名牌包',
    emoji: '👜',
    price: 2000,
    description: '大杀器，但钱包压力也最大。',
  },
  {
    id: 'letter',
    name: '手写信',
    emoji: '✉️',
    price: 0,
    description: '不花钱，完全靠内容和诚意取胜。',
  },
]
