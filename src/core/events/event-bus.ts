export type EventMap = Record<string, unknown>;

export type EventHandler<TPayload> = (payload: TPayload) => void | Promise<void>;

export interface EventBus<TEvents extends EventMap> {
  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): () => void;
  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): Promise<void>;
}

export function createEventBus<TEvents extends EventMap>(): EventBus<TEvents> {
  const handlers = new Map<keyof TEvents, Set<EventHandler<TEvents[keyof TEvents]>>>();

  return {
    on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
      const set = handlers.get(event) ?? new Set<EventHandler<TEvents[keyof TEvents]>>();
      set.add(handler as EventHandler<TEvents[keyof TEvents]>);
      handlers.set(event, set);
      return () => {
        const current = handlers.get(event);
        if (!current) return;
        current.delete(handler as EventHandler<TEvents[keyof TEvents]>);
        if (current.size === 0) handlers.delete(event);
      };
    },
    async emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): Promise<void> {
      const set = handlers.get(event);
      if (!set || set.size === 0) return;
      for (const handler of Array.from(set)) {
        await Promise.resolve(handler(payload as TEvents[keyof TEvents]));
      }
    },
  };
}
