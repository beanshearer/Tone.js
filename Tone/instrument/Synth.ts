import { AmplitudeEnvelope } from "../component/envelope/AmplitudeEnvelope";
import { Envelope, EnvelopeOptions } from "../component/envelope/Envelope";
import { Time } from "../core/type/Units";
import { omitFromObject, optionsFromArguments } from "../core/util/Defaults";
import { readOnly } from "../core/util/Interface";
import { RecursivePartial } from "../core/util/Interface";
import { OmniOscillator } from "../source/oscillator/OmniOscillator";
import { OmniOscillatorConstructorOptions } from "../source/oscillator/OscillatorInterface";
import { Source } from "../source/Source";
import { Monophonic, MonophonicOptions } from "./Monophonic";

export interface SynthOptions extends MonophonicOptions {
	oscillator: OmniOscillatorConstructorOptions;
	envelope: EnvelopeOptions;
}

/**
 * Synth is composed simply of a {@link OmniOscillator} routed through an {@link AmplitudeEnvelope}.
 * ```
 * +----------------+   +-------------------+
 * | OmniOscillator +>--> AmplitudeEnvelope +>--> Output
 * +----------------+   +-------------------+
 * ```
 * @param options the options available for the synth.
 * @example
 * var synth = new Synth().toDestination();
 * synth.triggerAttackRelease("C4", "8n");
 */
export class Synth extends Monophonic<SynthOptions> {

	name = "Synth";

	/**
	 *  The oscillator.
	 */
	readonly oscillator = new OmniOscillator({ context: this.context });

	/**
	 * The frequency signal
	 */
	readonly frequency = this.oscillator.frequency;

	/**
	 * The detune signal
	 */
	readonly detune = this.oscillator.detune;

	/**
	 * The envelope
	 */
	readonly envelope: AmplitudeEnvelope = new AmplitudeEnvelope({ context: this.context });

	protected _internalChannels = [this.oscillator, this.envelope, this.output];

	constructor(options?: RecursivePartial<SynthOptions>);
	constructor() {
		super(optionsFromArguments(Synth.getDefaults(), arguments));
		const options = optionsFromArguments(Synth.getDefaults(), arguments);

		this.oscillator.set(options.oscillator);
		this.envelope.set(options.envelope);

		// connect the oscillators to the output
		this.oscillator.chain(this.envelope, this.output);
		readOnly(this, ["oscillator", "frequency", "detune", "envelope"]);
	}

	static getDefaults(): SynthOptions {
		return Object.assign(Monophonic.getDefaults(), {
			envelope: Object.assign(
				omitFromObject(Envelope.getDefaults(), Object.keys(Source.getDefaults())),
				{
					attack : 0.005,
					decay : 0.1,
					release : 1,
					sustain : 0.3,
				},
			),
			oscillator: Object.assign(
				omitFromObject(OmniOscillator.getDefaults(), Object.keys(Source.getDefaults())),
				{
					type: "triangle",
				},
			),
		});
	}

	/**
	 *  start the attack portion of the envelope
	 *  @param time the time the attack should start
	 *  @param velocity the velocity of the note (0-1)
	 */
	protected _triggerEnvelopeAttack(time?: Time, velocity: number = 1): void {
		const computedTime = this.toSeconds(time);
		// the envelopes
		this.envelope.triggerAttack(computedTime, velocity);
		this.oscillator.start(computedTime);
		// if there is no release portion, stop the oscillator
		if (this.envelope.sustain === 0) {
			const computedAttack = this.toSeconds(this.envelope.attack);
			const computedDecay = this.toSeconds(this.envelope.decay);
			this.oscillator.stop(computedTime + computedAttack + computedDecay);
		}
	}

	/**
	 *  start the release portion of the envelope
	 *  @param time the time the release should start
	 */
	protected _triggerEnvelopeRelease(time: Time): void {
		time = this.toSeconds(time);
		this.envelope.triggerRelease(time);
		this.oscillator.stop(time + this.toSeconds(this.envelope.release));
	}

	/**
	 *  clean up
	 */
	dispose(): this {
		super.dispose();
		this.oscillator.dispose();
		this.envelope.dispose();
		return this;
	}
}
