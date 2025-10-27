import type { CallbackOptions, Emitter, EventMap, InternalCallbackData, OnAnyCallback } from "./types.ts";

export const createEmitter = <Events extends EventMap>(): Emitter<Events> => {
	const callbackMap = new Map<keyof Events, Map<Events[keyof Events], InternalCallbackData>>();
	const onAnyCallbacks = new Map<OnAnyCallback<Events>, InternalCallbackData | undefined>();

	const off = <EM extends keyof Events>(eventName: EM, callback: Events[EM]): void => {
		const callbacks = callbackMap.get(eventName);
		if (!callbacks) {
			return;
		}
		callbacks.get(callback)?.controller?.abort();
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

		Array.from(onAnyCallbacks.entries()).forEach(([callback, options]) => {
			if (!onAnyCallbacks.has(callback)) {
				return;
			}
			try {
				callback(args as unknown as Events[keyof Events]);
			} finally {
				if (options?.once) {
					offAny(callback);
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

	const offAny = (callback: OnAnyCallback<Events>): void => {
		onAnyCallbacks.get(callback)?.controller?.abort();
		onAnyCallbacks.delete(callback);
	};

	const onAny = (callback: OnAnyCallback<Events>, options?: CallbackOptions): void => {
		if (options?.signal && options.signal.aborted) {
			return;
		}
		const existingCallback = onAnyCallbacks.get(callback);
		if (existingCallback) {
			return;
		}

		let unsubController: AbortController | undefined;

		if (options?.signal) {
			unsubController = new AbortController();
			options.signal.addEventListener("abort", () => offAny(callback), { once: true, signal: unsubController.signal });
		}

		onAnyCallbacks.set(callback, { once: options?.once, controller: unsubController });
	};

	return { emit, on, off, onAny, offAny };
};
