import { ToneWithContext, ToneWithContextOptions } from "../context/ToneWithContext";
import { Seconds, Time } from "../type/Units";
import { Timeline, TimelineEvent } from "./Timeline";

interface DrawEvent extends TimelineEvent {
	callback: () => void;
}

/**
 * Draw is useful for synchronizing visuals and audio events.
 * Callbacks from Tone.Transport or any of the Tone.Event classes
 * always happen _before_ the scheduled time and are not synchronized
 * to the animation frame so they are not good for triggering tightly
 * synchronized visuals and sound. Draw makes it easy to schedule
 * callbacks using the AudioContext time and uses requestAnimationFrame.
 * @example
 * Tone.Transport.schedule(function(time){
 * 	//use the time argument to schedule a callback with Draw
 * 	Draw.schedule(function(){
 * 		//do drawing or DOM manipulation here
 * 	}, time)
 * }, "+0.5")
 */
export class Draw extends ToneWithContext<ToneWithContextOptions> {

	name = "Draw";

	/**
	 *  The duration after which events are not invoked.
	 */
	expiration: Seconds = 0.25;

	/**
	 *  The amount of time before the scheduled time
	 *  that the callback can be invoked. Default is
	 *  half the time of an animation frame (0.008 seconds).
	 */
	anticipation: Seconds = 0.008;

	/**
	 *  All of the events.
	 */
	private _events: Timeline<DrawEvent> = new Timeline();

	/**
	 *  The draw loop
	 */
	private _boundDrawLoop = this._drawLoop.bind(this);

	/**
	 * The animation frame id
	 */
	private _animationFrame: number = -1;

	/**
	 *  Schedule a function at the given time to be invoked
	 *  on the nearest animation frame.
	 *  @param  callback  Callback is invoked at the given time.
	 *  @param  time      The time relative to the AudioContext time to invoke the callback.
	 */
	schedule(callback: () => void, time: Time): this {
		this._events.add({
			callback,
			time : this.toSeconds(time),
		});
		// start the draw loop on the first event
		if (this._events.length === 1) {
			this._animationFrame = requestAnimationFrame(this._boundDrawLoop);
		}
		return this;
	}

	/**
	 *  Cancel events scheduled after the given time
	 *  @param  after  Time after which scheduled events will be removed from the scheduling timeline.
	 */
	cancel(after?: Time): this {
		this._events.cancel(this.toSeconds(after));
		return this;
	}

	/**
	 *  The draw loop
	 */
	private _drawLoop(): void {
		const now = this.context.currentTime;
		while (this._events.length && (this._events.peek() as DrawEvent).time - this.anticipation <= now) {
			const event = this._events.shift();
			if (event && now - event.time <= this.expiration) {
				event.callback();
			}
		}
		if (this._events.length > 0) {
			this._animationFrame = requestAnimationFrame(this._boundDrawLoop);
		}
	}

	dispose(): this {
		super.dispose();
		this._events.dispose();
		cancelAnimationFrame(this._animationFrame);
		return this;
	}
}
