export type EventMap = Record<PropertyKey, any>;

export type CallbackOptions = {
	once?: boolean;
	signal?: AbortSignal;
};

export type InternalCallbackData = { once?: boolean; controller?: AbortController };

export type Callback<E extends EventMap, K extends keyof E> = (...args: [E[K]] extends [void] ? [] : [E[K]]) => void;

export type OnAnyCallback<Events extends EventMap> = (data: Events[keyof Events]) => void;

export type Emitter<Events extends EventMap> = {
	emit: <EM extends keyof Events>(eventName: EM, ...args: Parameters<Callback<Events, EM>>) => void;
	on: <EM extends keyof Events>(eventName: EM, callback: Callback<Events, EM>, options?: CallbackOptions) => void;
	onAny: (callback: OnAnyCallback<Events>, options?: CallbackOptions) => void;
	offAny: (callback: OnAnyCallback<Events>) => void;
	off: <EM extends keyof Events>(eventName: EM, callback: Callback<Events, EM>) => void;
};

export type CallbackMap<E extends EventMap> = {
	[K in keyof E]: Map<Callback<E, K>, InternalCallbackData>;
};
