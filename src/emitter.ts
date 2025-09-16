import type { CallbackOptions, EventMap } from "./types";

export const createEmitter = <Events extends EventMap>() => {
	type EventName = keyof Events;
	const callbackMap = new Map<EventName, Map<Events[EventName], boolean | undefined>>();

	const off = <EM extends EventName>(event: EM, callback: Events[EM]) => {
		const callbacks = callbackMap.get(event);
		if (!callbacks) {
			return;
		}
		callbacks.delete(callback);
	};

	const emit = <EM extends EventName>(event: EM, ...args: Parameters<Events[EM]>) => {
		const callbacks = callbackMap.get(event);
		if (!callbacks?.size) {
			return;
		}
		Array.from(callbacks?.entries()).forEach(([callback, once]) => {
			callback(...args);
			if (once) {
				off(event, callback);
			}
		});
	};

	const on = <EM extends EventName>(event: EM, callback: Events[EM], options?: CallbackOptions) => {
		let callbacks = callbackMap.get(event);
		if (!callbacks) {
			callbacks = new Map<Events[EM], boolean | undefined>();
			callbackMap.set(event, callbacks);
		}
		if (options?.signal && !options.signal.aborted) {
			options.signal.addEventListener(
				"abort",
				() => {
					off(event, callback);
				},
				{ once: true }
			);
		}
		callbacks.set(callback, options?.once);
	};

	return { emit, on, off };
};
