import confetti from 'canvas-confetti'

export const triggerElementParticles = (element: HTMLElement | null, type: 'money' | 'affection') => {
  if (!element) return

  const rect = element.getBoundingClientRect()
  // Calculate center of the element relative to viewport
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  if (type === 'money') {
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { x, y },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef3c7'],
      disableForReducedMotion: true,
      zIndex: 9999,
      scalar: 0.8,
      startVelocity: 20,
      gravity: 0.8,
      ticks: 150,
    })
  } else if (type === 'affection') {
    confetti({
      particleCount: 35,
      spread: 70,
      origin: { x, y },
      colors: ['#ff7aa2', '#ff5c8a', '#f43f5e', '#ffe4e6'],
      disableForReducedMotion: true,
      zIndex: 9999,
      scalar: 0.9,
      shapes: ['circle'],
      startVelocity: 25,
      gravity: 0.6,
      ticks: 200,
    })
  }
}
