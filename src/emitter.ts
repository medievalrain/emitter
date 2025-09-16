export type EventMap = Record<string, (...args: any[]) => void>;

export const createEmitter = <Events extends EventMap>() => {
	type EventName = keyof Events;
	const callbackMap = new Map<EventName, Set<Events[EventName]>>();

	const emit = <EM extends EventName>(event: EM, ...args: Parameters<Events[EM]>) => {
		const callbacks = callbackMap.get(event);
		if (!callbacks?.size) {
			return;
		}
		Array.from(callbacks?.values()).forEach((callback) => callback(args));
	};

	const on = <EM extends EventName>(event: EM, callback: Events[EM]) => {
		let callbacks = callbackMap.get(event);
		if (!callbacks?.size) {
			callbacks = new Set<Events[EM]>();
			callbackMap.set(event, callbacks);
		}
		callbacks.add(callback);
	};

	return { emit, on };
};
