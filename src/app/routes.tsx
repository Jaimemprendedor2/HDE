export const routes = {
  directorio: '/directorio',
  meeting: '/meeting',
} as const

export type RouteKey = keyof typeof routes
