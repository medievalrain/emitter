import type { CallbackOptions, EventMap, InternalCallbackData } from "./types";

export const createEmitter = <Events extends EventMap>() => {
	type EventName = keyof Events;
	const callbackMap = new Map<EventName, Map<Events[EventName], InternalCallbackData>>();

	const off = <EM extends EventName>(event: EM, callback: Events[EM]) => {
		const callbacks = callbackMap.get(event);
		if (!callbacks) {
			return;
		}
		const controller = callbacks.get(callback)?.controller;
		if (controller) {
			controller.abort();
		}
		callbacks.delete(callback);
	};

	const emit = <EM extends EventName>(event: EM, ...args: Parameters<Events[EM]>) => {
		const callbacks = callbackMap.get(event);
		if (!callbacks?.size) {
			return;
		}
		Array.from(callbacks?.entries()).forEach(([callback, { once }]) => {
			if (!callbacks.has(callback)) {
				return;
			}
			try {
				callback(...args);
			} finally {
				if (once) {
					off(event, callback);
				}
			}
		});
	};

	const on = <EM extends EventName>(event: EM, callback: Events[EM], options?: CallbackOptions) => {
		if (options?.signal && options.signal.aborted) {
			return;
		}
		let callbacks = callbackMap.get(event);
		let unsubController: AbortController | undefined = undefined;
		if (!callbacks) {
			callbacks = new Map<Events[EM], InternalCallbackData>();
			callbackMap.set(event, callbacks);
		} else {
			const existingCallback = callbacks.get(callback);
			if (existingCallback) {
				return;
			}
		}

		if (options?.signal) {
			unsubController = new AbortController();
			options.signal.addEventListener(
				"abort",
				() => {
					off(event, callback);
				},
				{ once: true, signal: unsubController.signal }
			);
		}
		callbacks.set(callback, { once: options?.once, controller: unsubController });
	};

	return { emit, on, off };
};
