import { describe, expect, vi, test, beforeEach } from "vitest";
import { createEmitter } from "@/emitter";

const SYMBOL_EVENT: unique symbol = Symbol("symbolEvent");

type Events = {
	a: (x: number) => void;
	empty: () => void;
	mutlipleArgs: (a: string, b: number) => void;
	322: () => void;
	[SYMBOL_EVENT]: () => void;
};

let emitter = createEmitter<Events>();

beforeEach(() => {
	emitter = createEmitter<Events>();
});

describe("Emitter tests", () => {
	test("Calls a listener with the correct args", () => {
		const fn = vi.fn();
		emitter.on("a", fn);
		emitter.emit("a", 1408);
		expect(fn).toHaveBeenCalledExactlyOnceWith(1408);
	});

	test("“Calls the listener the correct number of times", () => {
		const fn = vi.fn();
		emitter.on("empty", fn);
		emitter.emit("empty");
		emitter.emit("empty");
		emitter.emit("empty");
		expect(fn).toHaveBeenCalledTimes(3);
	});

	test("Does not call listeners on unrelated events", () => {
		const fn = vi.fn();
		emitter.on("empty", fn);
		emitter.emit("a", 1408);

		expect(fn).toHaveBeenCalledTimes(0);
	});

	test("Calls listeners in registered order", () => {
		const firstFn = vi.fn();
		const secondFn = vi.fn();
		emitter.on("empty", firstFn);
		emitter.on("empty", secondFn);
		emitter.emit("empty");

		expect(secondFn).toHaveBeenCalledAfter(firstFn);
	});

	test("Does not call a listener after unsubscribing via off()", () => {
		const fn = vi.fn();
		emitter.on("empty", fn);
		emitter.off("empty", fn);
		emitter.emit("empty");
		expect(fn).toHaveBeenCalledTimes(0);
	});

	test("Calls a listener only once if 'once' flag is set to true", () => {
		const fn = vi.fn();
		emitter.on("empty", fn, { once: true });
		emitter.emit("empty");
		emitter.emit("empty");
		expect(fn).toHaveBeenCalledOnce();
	});

	test("Calls a listener correct times if 'once' flag is set to false", () => {
		const fn = vi.fn();
		emitter.on("empty", fn, { once: false });
		emitter.emit("empty");
		emitter.emit("empty");
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test("Stops calling a listener after aborting a signal", () => {
		const controller = new AbortController();
		const fn = vi.fn();
		emitter.on("empty", fn, { signal: controller.signal });
		emitter.emit("empty");
		controller.abort();
		emitter.emit("empty");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test("Does not register a listener if the signal is already aborted", () => {
		const controller = new AbortController();
		controller.abort();
		const fn = vi.fn();
		emitter.on("empty", fn, { signal: controller.signal });
		emitter.emit("empty");

		expect(fn).toHaveBeenCalledTimes(0);
	});

	test("Registering the same listener twice on the same event keeps only the first registration", () => {
		const fn = vi.fn();
		emitter.on("empty", fn);
		emitter.on("empty", fn, { once: true });
		emitter.emit("empty");
		emitter.emit("empty");
		emitter.emit("empty");

		expect(fn).toHaveBeenCalledTimes(3);
	});

	test("Forwards multiple arguments", () => {
		const fn = vi.fn();
		emitter.on("mutlipleArgs", fn);
		emitter.emit("mutlipleArgs", "a string", 322);
		expect(fn).toHaveBeenCalledExactlyOnceWith("a string", 322);
	});

	test("off() on unknown listener does nothing", () => {
		const fn = vi.fn();
		expect(() => emitter.off("empty", fn)).not.toThrow();
	});

	test("Listener can off() itself during emit", () => {
		const fn = vi.fn(() => emitter.off("empty", fn));
		emitter.on("empty", fn);
		emitter.emit("empty");
		emitter.emit("empty");
		expect(fn).toHaveBeenCalledOnce();
	});

	test("Listener added during emit does not fire in the same emit", () => {
		const later = vi.fn();
		const first = vi.fn(() => emitter.on("empty", later));
		emitter.on("empty", first);
		emitter.emit("empty");
		expect(first).toHaveBeenCalledOnce();
		expect(later).not.toHaveBeenCalled();
	});

	test("Allows numbers as event names", () => {
		const fn = vi.fn();
		emitter.on(322, fn);
		emitter.emit(322);
		expect(fn).toHaveBeenCalledOnce();
	});

	test("Allows symbols as event names", () => {
		const fn = vi.fn();
		emitter.on(SYMBOL_EVENT, fn);
		emitter.emit(SYMBOL_EVENT);
		expect(fn).toHaveBeenCalledOnce();
	});

	test("On any catches all events", () => {
		const fn = vi.fn();
		emitter.on(SYMBOL_EVENT, () => {});
		emitter.on("empty", () => {});
		emitter.onAny(fn);
		emitter.emit(SYMBOL_EVENT);
		emitter.emit("empty");
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test("Does not call onAny listener after unsubscribing via offAny()", () => {
		const fn = vi.fn();
		emitter.onAny(fn);
		emitter.on(SYMBOL_EVENT, () => {});
		emitter.on("empty", () => {});
		emitter.offAny(fn);
		emitter.emit(SYMBOL_EVENT);
		expect(fn).toHaveBeenCalledTimes(0);
	});
});
