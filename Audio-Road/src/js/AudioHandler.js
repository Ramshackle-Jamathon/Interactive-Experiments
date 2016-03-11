export default class AudioHandler {
    constructor() {
		this.waveData = []; //waveform - from 0 - 1 . no sound is 0.5. Array [binCount]
		this.levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]
		this.level = 0; // averaged normalized level from 0 - 1
		this.bpmTime = 0; // bpmTime ranges from 0 to 1. 0 = on beat. Based on tap bpm
		this.ratedBPMTime = 550;//time between beats (msec) multiplied by BPMRate
		this.levelHistory = []; //last 256 ave norm levels
		this.bpmStart = 0; 

		this.sampleAudioURL = "sounds/LouisTheChild.mp3";
		//var sampleAudioURL = "textures/recit24.flac";
		this.BEAT_HOLD_TIME = 40; //num of frames to hold a beat
		this.BEAT_DECAY_RATE = 0.98;
		this.BEAT_MIN = 0.30; //a volume less than this is no beat

		//variables
		this.audioGain = 1.0
		this.beatHold = 40
		this.beatDecay = 0.97
		//BPM STUFF
		this.count = 0;
		this.msecsFirst = 0;
		this.msecsPrevious = 0;
		this.msecsAvg = 633; //time between beats (msec)
		
		this.timer;
		this.gotBeat = false;
		this.beatCutOff = 0;
		this.beatTime = 0;

		this.freqByteData; //bars - bar data is from 0 - 256 in 512 bins. no sound is 0;
		this.timeByteData; //waveform - waveform data is from 0-256 for 512 bins. no sound is 128.
		this.levelsCount = 512; //should be factor of 512
		
		this.binCount; //512
		this.levelBins;

		this.isPlayingAudio = false;
		this.usingSample = true;
		this.usingMic = false;

		this.source;
		this.buffer;
		this.audioBuffer;
		this.dropArea;
		this.audioContext;
		this.analyser;
    }

    init(){
		this.audioContext = new window.AudioContext || new window.webkitAudioContext;
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.smoothingTimeConstant = 0.8; //0<->1. 0 is no time smoothing
		this.analyser.fftSize = 1024;
		this.analyser.connect(this.audioContext.destination);
		this.binCount = this.analyser.frequencyBinCount; // = 512

		this.levelBins = Math.floor(this.binCount / this.levelsCount); //number of bins in each level

		this.freqByteData = new Uint8Array(this.binCount); 
		this.timeByteData = new Uint8Array(this.binCount);

		var length = 256;
		for(var i = 0; i < length; i++) {
		    this.levelHistory.push(0);
		}
    }
    initSound(){
		this.source = this.audioContext.createBufferSource();
		this.source.connect(this.analyser);
    }
	loadSampleAudio() {

		this.stopSound();
		this.initSound();
		// Load asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", this.sampleAudioURL, true);
		request.responseType = "arraybuffer";
		var self = this;
		request.onload = function() {
			self.audioContext.decodeAudioData(request.response, function(buffer) {
				self.audioBuffer = buffer;
				self.startSound();
			}, function(e) {
				console.log(e);
			});


		};
		request.send();
	}
	onTogglePlay(){
		if (this.isPlayingAudio){
			this.stopSound()
		} else {
			this.startSound()
		}	
	}
	startSound(){
		this.source.buffer = this.audioBuffer;
		this.source.loop = true;
		this.source.start(0.0);
		this.isPlayingAudio = true;
	}
	stopSound(){
		this.isPlayingAudio = false;
		if (this.source) {
			this.source.stop(0);
			this.source.disconnect();
		}
	}
	onUseMic(){
		if (this.usingMic){
			this.usingSample = false;
			this.getMicInput();
		}else{
			this.stopSound();
		}
	}
	onUseSample(){
		if (this.usingSample){
			this.loadSampleAudio();          
			this.usingMic = false;
		}else{
			this.stopSound();
		}
	}
	onMP3Drop(evt) {

		//TODO - uncheck mic and sample in CP

		this.usingSample = false;
		this.usingMic = false;

		this.stopSound();

		this.initSound();

		var droppedFiles = evt.dataTransfer.files;
		var reader = new FileReader();
		var self = this.
		reader.onload = function(fileEvent) {
			var data = fileEvent.target.result;
			self.onDroppedMP3Loaded(data);
		};
		reader.readAsArrayBuffer(droppedFiles[0]);
	}
	onDroppedMP3Loaded(data) {

		if(this.audioContext.decodeAudioData) {
			this.audioContext.decodeAudioData(data, function(buffer) {
				this.audioBuffer = buffer;
				this.startSound();
			}, function(e) {
				console.log(e);
			}).bind(this);
		} else {
			this.audioBuffer = this.audioContext.createBuffer(data, false );
			this.startSound();
		}
	}
	getMicInput() {

		this.stopSound();

		//x-browser
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

		if (navigator.getUserMedia ) {

			navigator.getUserMedia(

				{audio: true}, 

				function(stream) {

					//reinit here or get an echo on the mic
					this.source = this.audioContext.createBufferSource();
					this.analyser = this.audioContext.createAnalyser();
					this.analyser.fftSize = 1024;
					this.analyser.smoothingTimeConstant = 0.3; 

					this.microphone = this.audioContext.createMediaStreamSource(stream);
					this.microphone.connect(this.analyser);
					this.isPlayingAudio = true;
					// console.log("here");
				},

				// errorCallback
				function(err) {
					alert("The following error occured: " + err);
				}
			).bind(this);
			
		}else{
			alert("Could not getUserMedia");
		}
	}
	onBeat(){
		this.gotBeat = true;
	}
	update(){

		if (!this.isPlayingAudio) return;

		//GET DATA
		this.analyser.getByteFrequencyData(this.freqByteData); //<-- bar chart
		this.analyser.getByteTimeDomainData(this.timeByteData); // <-- waveform

		//console.log(freqByteData);

		//normalize waveform data
		for(var i = 0; i < this.binCount; i++) {
			this.waveData[i] = ((this.timeByteData[i] - 128) /128 )* this.audioGain;
		}
		//TODO - cap levels at 1 and -1 ?

		//normalize levelsData from freqByteData
		for(var i = 0; i < this.levelsCount; i++) {
			var sum = 0;
			for(var j = 0; j < this.levelBins; j++) {
				sum += this.freqByteData[(i * this.levelBins) + j];
			}
			this.levelsData[i] = sum / this.levelBins/256 * this.audioGain; //freqData maxs at 256

			//adjust for the fact that lower levels are percieved more quietly
			//make lower levels smaller
			this.levelsData[i] *=  1 + (i/this.levelsCount)/2;
		}
		//TODO - cap levels at 1?

		//GET AVG LEVEL
		var sum = 0;
		for(var j = 0; j < this.levelsCount; j++) {
			sum += this.levelsData[j];
		}
		
		this.level = sum / this.levelsCount;

		this.levelHistory.push(this.level);
		this.levelHistory.shift(1);

		//BEAT DETECTION
		if (this.level  > this.beatCutOff && this.level > this.BEAT_MIN){
			this.onBeat();
			this.beatCutOff = this.level *1.1;
			this.beatTime = 0;
		}else{
			if (this.beatTime <= this.beatHold){
				this.beatTime ++;
			}else{
				this.beatCutOff *= this.BEAT_DECAY_RATE;
				this.beatCutOff = Math.max(this.beatCutOff,this.BEAT_MIN);
			}
		}


		this.bpmTime = (new Date().getTime() - this.bpmStart)/this.msecsAvg;
/*
		console.log("waves: " + waveData)
		console.log("levels: " + levelsData)
		console.log("bpmTime: " + bpmTime)
*/
		return {
			levelsData:this.levelsData,
			bpmTime:this.bpmTime,
			waveData:this.waveData,
			gotBeat:this.gotBeat,
			beatCutOff:this.beatCutOff,
			beatTime:this.beatTime
		};
	}
};