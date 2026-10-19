import { onScopeDispose, shallowRef } from 'vue'

export function useReducedMotion() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reducedMotion = shallowRef(media.matches)
  const update = (event: MediaQueryListEvent) => { reducedMotion.value = event.matches }
  media.addEventListener('change', update)
  onScopeDispose(() => media.removeEventListener('change', update))
  return reducedMotion
}
