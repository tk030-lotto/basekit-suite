type BusListener = (data: any) => Promise<void> | void;

export class PluginBus {
  private static instance: PluginBus;
  private listeners: Map<string, Set<BusListener>> = new Map();

  private constructor() {}

  public static getInstance(): PluginBus {
    if (!PluginBus.instance) {
      PluginBus.instance = new PluginBus();
    }
    return PluginBus.instance;
  }

  public subscribe(event: string, listener: BusListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(listener);
      }
    };
  }

  public async emit(event: string, data: any): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) return;

    const promises = Array.from(eventListeners).map(async (listener) => {
      try {
        await listener(data);
      } catch (err) {
        console.error(`[PluginBus] Error executing listener for event "${event}":`, err);
      }
    });

    await Promise.allSettled(promises);
  }
}

export const pluginBus = PluginBus.getInstance();
export default pluginBus;
