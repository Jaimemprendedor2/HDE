export const routes = {
  home: '/',
  activitySelector: '/select-activity',
  activityManager: '/activity/:meetingId',
  timerPopup: '/timer-popup',
  directorio: '/directorio',
  meeting: '/meeting',
} as const

export type RouteKey = keyof typeof routes
