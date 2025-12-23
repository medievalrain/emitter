export type EventMap = Record<PropertyKey, (...args: any[]) => void>;

export type CallbackOptions = {
  once?: boolean;
  signal?: AbortSignal;
};

export type InternalCallbackData = { once?: boolean; controller?: AbortController };

export type OnAnyCallback<Events extends EventMap> = (data: Events[keyof Events]) => void;

export type Emitter<Events extends EventMap> = {
  emit: <EM extends keyof Events>(eventName: EM, ...args: Parameters<Events[EM]>) => void;
  on: <EM extends keyof Events>(
    eventName: EM,
    callback: Events[EM],
    options?: CallbackOptions,
  ) => void;
  off: <EM extends keyof Events>(eventName: EM, callback: Events[EM]) => void;
  onAny: (callback: OnAnyCallback<Events>, options?: CallbackOptions) => void;
  offAny: (callback: OnAnyCallback<Events>) => void;
};
