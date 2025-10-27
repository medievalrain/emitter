import type { Callback, CallbackMap, CallbackOptions, Emitter, EventMap, InternalCallbackData } from "./types.ts";

export const createEmitter = <Events extends EventMap>(): Emitter<Events> => {
	const callbackMap = {} as CallbackMap<Events>;

	const off = <EM extends keyof Events>(eventName: EM, callback: Callback<Events, EM>): void => {
		const callbacks = callbackMap[eventName];
		if (!callbacks) {
			return;
		}
		callbacks.get(callback)?.controller?.abort();
		callbacks.delete(callback);

		if (!callbacks.size) {
			delete callbackMap[eventName];
		}
	};

	const emit = <EM extends keyof Events>(eventName: EM, ...args: Parameters<Callback<Events, EM>>): void => {
		const callbacks = callbackMap[eventName];
		if (!callbacks?.size) {
			return;
		}
		Array.from(callbacks.entries()).forEach(([callback, { once }]) => {
			if (!callbacks.has(callback)) {
				return;
			}
			try {
				callback(...args);
			} finally {
				if (once) {
					off(eventName, callback);
				}
			}
		});
	};

	const on = <EM extends keyof Events>(eventName: EM, callback: Callback<Events, EM>, options?: CallbackOptions): void => {
		if (options?.signal && options.signal.aborted) {
			return;
		}
		let callbacks = callbackMap[eventName];
		let unsubController: AbortController | undefined;
		if (!callbacks) {
			callbacks = new Map<Events[EM], InternalCallbackData>();
			callbackMap[eventName] = callbacks;
		} else {
			const existingCallback = callbacks.get(callback);
			if (existingCallback) {
				return;
			}
		}

		if (options?.signal) {
			unsubController = new AbortController();
			options.signal.addEventListener("abort", () => off(eventName, callback), { once: true, signal: unsubController.signal });
		}
		callbacks.set(callback, { once: options?.once, controller: unsubController });
	};

	return { emit, on, off };
};
