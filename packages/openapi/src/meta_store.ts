import type { Route } from '@adonisjs/core/http'
import { SchemaObject } from 'openapi3-ts/oas31'

export class MetaStore {
  #store = new Map<Route, SchemaObject>()
  #computedStore = new Map<string, SchemaObject>()

  set(key: Route, value: SchemaObject) {
    this.#store.set(key, value)
  }

  get(key: Route) {
    return this.#store.get(key)
  }

  getComputed(options: { method: string; path: string }) {
    return this.#computedStore.get(`${options.method.toUpperCase()}:${options.path}`)
  }

  compute() {
    for (const [route, value] of this.#store) {
      const serialized = route.toJSON()
      for (const method of serialized.methods) {
        this.#computedStore.set(`${method}:${serialized.pattern}`, value)
      }
    }
  }
}

const metaStore = new MetaStore()
export { metaStore }
