export type EventMap = Record<PropertyKey, any>;

export type CallbackOptions = {
	once?: boolean;
	signal?: AbortSignal;
};

export type InternalCallbackData = { once?: boolean; controller?: AbortController };

export type OnAnyCallback<Events extends EventMap> = (data: Events[keyof Events]) => void;

export type Callback<Events extends EventMap, K extends keyof Events> = undefined extends Events[K]
	? () => void
	: (data: Events[K]) => void;

export type Emit<Events extends EventMap> = <K extends keyof Events>(
	...args: undefined extends Events[K] ? [eventName: K] : [eventName: K, data: Events[K]]
) => void;

export type Emitter<Events extends EventMap> = {
	emit: Emit<Events>;
	on: <K extends keyof Events>(eventName: K, callback: Callback<Events, K>, options?: CallbackOptions) => void;
	off: <K extends keyof Events>(eventName: K, callback: Callback<Events, K>) => void;
	onAny: (callback: OnAnyCallback<Events>, options?: CallbackOptions) => void;
	offAny: (callback: OnAnyCallback<Events>) => void;
};

export type CallbackMap<Events extends EventMap> = {
	[EventName in keyof Events]?: Map<Callback<Events, EventName>, InternalCallbackData>;
};
