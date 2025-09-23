import type { CallbackOptions, Emitter, EventMap, InternalCallbackData } from "./types";

export const createEmitter = <Events extends EventMap>(): Emitter<Events> => {
	const callbackMap = new Map<keyof Events, Map<Events[keyof Events], InternalCallbackData>>();

	const off = <EM extends keyof Events>(eventName: EM, callback: Events[EM]): void => {
		const callbacks = callbackMap.get(eventName);
		if (!callbacks) {
			return;
		}
		const controller = callbacks.get(callback)?.controller;
		if (controller) {
			controller.abort();
		}
		callbacks.delete(callback);
		if (!callbacks.size) {
			callbackMap.delete(eventName);
		}
	};

	const emit = <EM extends keyof Events>(eventName: EM, ...args: Parameters<Events[EM]>): void => {
		const callbacks = callbackMap.get(eventName);
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

	const on = <EM extends keyof Events>(eventName: EM, callback: Events[EM], options?: CallbackOptions): void => {
		if (options?.signal && options.signal.aborted) {
			return;
		}
		let callbacks = callbackMap.get(eventName);
		let unsubController: AbortController | undefined;
		if (!callbacks) {
			callbacks = new Map<Events[EM], InternalCallbackData>();
			callbackMap.set(eventName, callbacks);
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
