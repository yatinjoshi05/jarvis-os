import type { MissionEvent, MissionEventType } from './types'

export type EventHandler<T = any> = (event: MissionEvent<T>) => void

class MissionEventBus {
  private handlers = new Map<string, Set<EventHandler>>()

  /**
   * Publish an event to all subscribers.
   */
  public publish<T = unknown>(type: MissionEventType, missionId: string, payload: T): void {
    const event: MissionEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      missionId,
      timestamp: new Date().toISOString(),
      type,
      payload,
    }

    const typeHandlers = this.handlers.get(type)
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        try {
          handler(event)
        } catch (err) {
          console.error(`[EventBus] Error in event handler for ${type}:`, err)
        }
      })
    }
  }

  /**
   * Alias for publish.
   */
  public emit<T = unknown>(type: MissionEventType, missionId: string, payload: T): void {
    this.publish(type, missionId, payload)
  }

  /**
   * Subscribe to a specific event type. Returns an unsubscribe function.
   */
  public subscribe<T = unknown>(type: MissionEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }

    const typeHandlers = this.handlers.get(type)!
    typeHandlers.add(handler as EventHandler)

    return () => this.unsubscribe(type, handler)
  }

  /**
   * Unsubscribe a handler from an event type.
   */
  public unsubscribe<T = unknown>(type: MissionEventType, handler: EventHandler<T>): void {
    const typeHandlers = this.handlers.get(type)
    if (typeHandlers) {
      typeHandlers.delete(handler as EventHandler)
      if (typeHandlers.size === 0) {
        this.handlers.delete(type)
      }
    }
  }

  /**
   * Subscribe to an event type once. Automatically unsubscribes after trigger.
   */
  public once<T = unknown>(type: MissionEventType, handler: EventHandler<T>): void {
    const wrapper: EventHandler<T> = (event) => {
      this.unsubscribe(type, wrapper)
      handler(event)
    }
    this.subscribe(type, wrapper)
  }

  /**
   * Clear all event subscriptions.
   */
  public clear(): void {
    this.handlers.clear()
  }
}

// Global EventBus Singleton
export const eventBus = new MissionEventBus()
