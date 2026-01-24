import { OperationObject } from 'openapi3-ts/oas31'
import type { ResourceActionNames } from '@adonisjs/core/types/http'
import { Route, RouteResource, RouteGroup, BriskRoute } from '@adonisjs/core/http'

import type { MetaStore } from '../meta_store.js'

export type RouteResourceOpenApiOptions<ActionNames extends ResourceActionNames> = {
  global?: OperationObject
  actions?: { [K in ActionNames]?: OperationObject }
}

export function registerRouteMacros(metaStore: MetaStore) {
  Route.macro('openapi', function (this: Route, detail: OperationObject) {
    metaStore.set(this, detail)
    return this
  })

  RouteResource.macro(
    'openapi',
    function (this: RouteResource, options: RouteResourceOpenApiOptions<any>) {
      this.routes.forEach((route) => {
        metaStore.set(route, {
          ...(options.global || {}),
          // @ts-expect-error tkt
          ...(options.actions?.[route.name] || {}),
        })
      })

      return this
    },
  )

  RouteGroup.macro('openapi', function (this: RouteGroup, detail: OperationObject) {
    function handleAnyRouteType(route: Route | RouteGroup | RouteResource | BriskRoute) {
      if (route instanceof Route) {
        metaStore.set(route, { ...detail, ...metaStore.get(route) })
      } else if (route instanceof RouteResource) {
        route.routes.forEach((route) =>
          metaStore.set(route, { ...detail, ...metaStore.get(route) }),
        )
      } else if (route instanceof BriskRoute) {
        metaStore.set(route.route!, { ...detail, ...metaStore.get(route.route!) })
      } else if (route instanceof RouteGroup) {
        route.routes.forEach((route) => {
          handleAnyRouteType(route)
        })
      }
    }

    this.routes.forEach((route) => {
      handleAnyRouteType(route)
    })
    return this
  })
}
