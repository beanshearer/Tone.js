///////////////////////////////////////////////////////////////////////////////
//
//  LFO
//
///////////////////////////////////////////////////////////////////////////////

Tone.LFO = function(rate, outputMin, outputMax, param){
	//extends Unit
	Tone.call(this);
	//pass audio through
	this.input.connect(this.output);

	this.param = this.defaultArg(param, this.input.gain);
	this.rate = this.defaultArg(rate, 1);
	this.min = this.defaultArg(outputMin, 0);
	this.max = this.defaultArg(outputMax, 1);

	//the components
	this.oscillator = this.context.createOscillator();
	this.offset = this.context.createWaveShaper();

	//connect it up
	this.chain(this.oscillator, this.offset, this.param);

	//setup the values
	this.oscillator.frequency.value = rate;
	this._createCurve();
	this.oscillator.start(0);
	this.setType("sine");
}

Tone.extend(Tone.LFO, Tone);

//generates the values for the waveshaper
Tone.LFO.prototype._createCurve = function(){
	var len = 512;
	var curve = new Float32Array(len);
	for (var i = 0; i < len; i++){
		//values between -1 to 1
		var baseline = (i / (len - 1));
		curve[i] = baseline * (this.max - this.min) + this.min;
	}
	//console.log(curve);
	this.offset.curve = curve;
}


//set the params
Tone.LFO.prototype.setRate = function(rate){
	this.rate = rate;
	this.rampToValue(this.oscillator.frequency, rate, .1);
}

//set the params
Tone.LFO.prototype.setMin = function(min){
	this.min = min;
	this._createCurve();
}

//set the params
Tone.LFO.prototype.setMax = function(max){
	this.max = max;
}

//set the waveform of the LFO
//@param {string | number} type ('sine', 'square', 'sawtooth', 'triangle', 'custom');
Tone.LFO.prototype.setType = function(type){
	this.oscillator.type = type;
}