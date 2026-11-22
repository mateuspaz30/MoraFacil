import { useRef } from 'react'

export default function useSwipeNavigation(onSwipe, threshold = 45) {
  const touchStartRef = useRef(null)

  const onTouchStart = (event) => {
    const touch = event.touches[0]
    touchStartRef.current = touch
      ? { x: touch.clientX, y: touch.clientY }
      : null
  }

  const onTouchEnd = (event) => {
    const start = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null
    if (!start || !touch) return false

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) return false

    onSwipe(deltaX < 0 ? 1 : -1)
    return true
  }

  const onTouchCancel = () => {
    touchStartRef.current = null
  }

  return { onTouchStart, onTouchEnd, onTouchCancel }
}
