import { Gain } from "../core/context/Gain";
import { Param } from "../core/context/Param";
import { optionsFromArguments } from "../core/util/Defaults";
import { Signal, SignalOptions } from "./Signal";
import { InputNode, OutputNode } from "../core/context/ToneAudioNode";

/**
 * Multiply two incoming signals. Or, if a number is given in the constructor,
 * multiplies the incoming signal by that value.
 *
 * @example
 * import { Multiply, Signal } from "tone";
 * // multiply two signals
 * const mult = new Multiply();
 * const sigA = new Signal(3);
 * const sigB = new Signal(4);
 * sigA.connect(mult);
 * sigB.connect(mult.factor);
 * // output of mult is 12.
 * @example
 * import { Multiply, Signal } from "tone";
 * // multiply a signal and a number
 * const mult = new Multiply(10);
 * const sig = new Signal(2).connect(mult);
 * // the output of mult is 20.
 * @category Signal
 */
export class Multiply<TypeName extends "number" | "positive" = "number"> extends Signal<TypeName> {

	readonly name: string = "Multiply";

	/**
	 * Indicates if the value should be overridden on connection
	 */
	readonly override = false;

	/**
	 * the input gain node
	 */
	private _mult: Gain;

	/**
	 * The multiplicand input.
	 */
	input: InputNode;

	/**
	 * The product of the input and {@link factor}
	 */
	output: OutputNode;

	/**
	 * The multiplication factor. Can be set directly or a signal can be connected to it.
	 */
	factor: Param<TypeName>;

	/**
	 * @param value Constant value to multiple
	 */
	constructor(value?: number);
	constructor(options?: Partial<SignalOptions<TypeName>>);
	constructor() {
		super(Object.assign(optionsFromArguments(Multiply.getDefaults(), arguments, ["value"])));
		const options = optionsFromArguments(Multiply.getDefaults(), arguments, ["value"]);

		this._mult = this.input = this.output = new Gain({ 
			context: this.context,
			minValue: options.minValue,
			maxValue: options.maxValue,
		});

		this.factor = this._param = this._mult.gain as unknown as Param<TypeName>;
		this.factor.setValueAtTime(options.value, 0);
	}

	static getDefaults(): SignalOptions<any> {
		return Object.assign(Signal.getDefaults(), {
			value: 0,
		});
	}

	dispose(): this {
		super.dispose();
		this._mult.dispose();
		return this;
	}
}
