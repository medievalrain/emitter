export type EventMap = Record<string, (...args: any[]) => void>;

export type CallbackOptions = {
	once?: boolean;
	signal?: AbortSignal;
};
