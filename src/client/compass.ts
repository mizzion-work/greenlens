import { cameraHeading } from '../lib/sun'

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number }
type PermissionAPI = { requestPermission?: () => Promise<'granted' | 'denied'> }

export function hasCompass(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && navigator.maxTouchPoints > 0
}

/**
 * Read which way the back camera points, in degrees clockwise from north.
 * The user stands inside the space and points the camera out toward the open side.
 * Must be called from a tap (iOS asks for motion permission).
 */
export async function readCameraHeading(timeoutMs = 5000): Promise<number> {
  const api = window.DeviceOrientationEvent as unknown as PermissionAPI
  if (typeof api.requestPermission === 'function') {
    if ((await api.requestPermission()) !== 'granted') throw new Error('permission-denied')
  }

  return new Promise((resolve, reject) => {
    const done = (fn: () => void) => {
      clearTimeout(timer)
      window.removeEventListener('deviceorientationabsolute', onEvent as EventListener)
      window.removeEventListener('deviceorientation', onEvent as EventListener)
      fn()
    }
    const onEvent = (e: OrientationEvent) => {
      // iOS reports a true compass heading directly.
      if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
        done(() => resolve(e.webkitCompassHeading!))
        return
      }
      // Elsewhere, alpha is only north-referenced on absolute events.
      if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null && e.beta != null && e.gamma != null) {
        done(() => resolve(cameraHeading(e.alpha!, e.beta!, e.gamma!)))
      }
    }
    const timer = setTimeout(() => done(() => reject(new Error('no-compass'))), timeoutMs)
    window.addEventListener('deviceorientationabsolute', onEvent as EventListener)
    window.addEventListener('deviceorientation', onEvent as EventListener)
  })
}
