export type EventMap = Record<string, (...args: any[]) => void>;

export type CallbackOptions = {
	once?: boolean;
	signal?: AbortSignal;
};

export type InternalCallbackData = { once?: boolean; controller?: AbortController };
