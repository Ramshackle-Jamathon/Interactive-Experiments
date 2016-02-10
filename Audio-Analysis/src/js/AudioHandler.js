
var AudioHandler = function() {

	var waveData = []; //waveform - from 0 - 1 . no sound is 0.5. Array [binCount]
	var levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]
	var level = 0; // averaged normalized level from 0 - 1
	var bpmTime = 0; // bpmTime ranges from 0 to 1. 0 = on beat. Based on tap bpm
	var ratedBPMTime = 550;//time between beats (msec) multiplied by BPMRate
	var levelHistory = []; //last 256 ave norm levels
	var bpmStart; 

	var sampleAudioURL = "textures/hair-by-debbie.mp3";
	var BEAT_HOLD_TIME = 40; //num of frames to hold a beat
	var BEAT_DECAY_RATE = 0.98;
	var BEAT_MIN = 0.15; //a volume less than this is no beat

	//variables
	var audioGain = 0.7
	var beatHold = 40
	var beatDecay = 0.97
	//BPM STUFF
	var count = 0;
	var msecsFirst = 0;
	var msecsPrevious = 0;
	var msecsAvg = 633; //time between beats (msec)
	
	var timer;
	var gotBeat = false;
	var beatCutOff = 0;
	var beatTime = 0;

	var freqByteData; //bars - bar data is from 0 - 256 in 512 bins. no sound is 0;
	var timeByteData; //waveform - waveform data is from 0-256 for 512 bins. no sound is 128.
	var levelsCount = 16; //should be factor of 512
	
	var binCount; //512
	var levelBins;

	var isPlayingAudio = false;
	var usingSample = true;
	var usingMic = false;

	var source;
	var buffer;
	var audioBuffer;
	var dropArea;
	var audioContext;
	var analyser;

	function init() {
		//EVENT HANDLERS

		audioContext = new window.AudioContext || new window.webkitAudioContext;
		analyser = audioContext.createAnalyser();
		analyser.smoothingTimeConstant = 0.8; //0<->1. 0 is no time smoothing
		analyser.fftSize = 1024;
		//analyser.connect(audioContext.destination);
		binCount = analyser.frequencyBinCount; // = 512

		levelBins = Math.floor(binCount / levelsCount); //number of bins in each level

		freqByteData = new Uint8Array(binCount); 
		timeByteData = new Uint8Array(binCount);

		var length = 256;
		for(var i = 0; i < length; i++) {
		    levelHistory.push(0);
		}
	}

	function initSound(){
		source = audioContext.createBufferSource();
		source.connect(analyser);
	}

	//load sample MP3
	function loadSampleAudio() {
		stopSound();

		initSound();
		// Load asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", sampleAudioURL, true);
		request.responseType = "arraybuffer";

		request.onload = function() {
			audioContext.decodeAudioData(request.response, function(buffer) {
				audioBuffer = buffer;
				startSound();
			}, function(e) {
				console.log(e);
			});


		};
		request.send();
	}

	function onTogglePlay(){

		if (isPlayingAudio){
			stopSound()
		} else {
			startSound()
		}
	}

	function startSound() {
		source.buffer = audioBuffer;
		source.loop = true;
		source.start(0.0);
		isPlayingAudio = true;
		//startViz();
	}

	function stopSound(){
		isPlayingAudio = false;
		if (source) {
			source.stop(0);
			source.disconnect();
		}
	}

	function onUseMic(){

		if (usingMic){
			usingSample = false;
			getMicInput();
		}else{
			stopSound();
		}
	}
	
	function onUseSample(){
		if (usingSample){
			loadSampleAudio();          
			usingMic = false;
		}else{
			stopSound();
		}
	}
	//load dropped MP3
	function onMP3Drop(evt) {

		//TODO - uncheck mic and sample in CP

		usingSample = false;
		usingMic = false;

		stopSound();

		initSound();

		var droppedFiles = evt.dataTransfer.files;
		var reader = new FileReader();
		reader.onload = function(fileEvent) {
			var data = fileEvent.target.result;
			onDroppedMP3Loaded(data);
		};
		reader.readAsArrayBuffer(droppedFiles[0]);
	}

	//called from dropped MP3
	function onDroppedMP3Loaded(data) {

		if(audioContext.decodeAudioData) {
			audioContext.decodeAudioData(data, function(buffer) {
				audioBuffer = buffer;
				startSound();
			}, function(e) {
				console.log(e);
			});
		} else {
			audioBuffer = audioContext.createBuffer(data, false );
			startSound();
		}
	}

	function getMicInput() {

		stopSound();

		//x-browser
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

		if (navigator.getUserMedia ) {

			navigator.getUserMedia(

				{audio: true}, 

				function(stream) {

					//reinit here or get an echo on the mic
					source = audioContext.createBufferSource();
					analyser = audioContext.createAnalyser();
					analyser.fftSize = 1024;
					analyser.smoothingTimeConstant = 0.3; 

					microphone = audioContext.createMediaStreamSource(stream);
					microphone.connect(analyser);
					isPlayingAudio = true;
					// console.log("here");
				},

				// errorCallback
				function(err) {
					alert("The following error occured: " + err);
				}
			);
			
		}else{
			alert("Could not getUserMedia");
		}
	}

	function onBeat(){
		gotBeat = true;
	}

	//called every frame
	//update published viz data
	function update(){

		if (!isPlayingAudio) return;

		//GET DATA
		analyser.getByteFrequencyData(freqByteData); //<-- bar chart
		analyser.getByteTimeDomainData(timeByteData); // <-- waveform

		//console.log(freqByteData);

		//normalize waveform data
		for(var i = 0; i < binCount; i++) {
			waveData[i] = ((timeByteData[i] - 128) /128 )* audioGain;
		}
		//TODO - cap levels at 1 and -1 ?

		//normalize levelsData from freqByteData
		for(var i = 0; i < levelsCount; i++) {
			var sum = 0;
			for(var j = 0; j < levelBins; j++) {
				sum += freqByteData[(i * levelBins) + j];
			}
			levelsData[i] = sum / levelBins/256 * audioGain; //freqData maxs at 256

			//adjust for the fact that lower levels are percieved more quietly
			//make lower levels smaller
			//levelsData[i] *=  1 + (i/levelsCount)/2;
		}
		//TODO - cap levels at 1?

		//GET AVG LEVEL
		var sum = 0;
		for(var j = 0; j < levelsCount; j++) {
			sum += levelsData[j];
		}
		
		level = sum / levelsCount;

		levelHistory.push(level);
		levelHistory.shift(1);

		//BEAT DETECTION
		if (level  > beatCutOff && level > BEAT_MIN){
			onBeat();
			beatCutOff = level *1.1;
			beatTime = 0;
		}else{
			if (beatTime <= beatHold){
				beatTime ++;
			}else{
				beatCutOff *= BEAT_DECAY_RATE;
				beatCutOff = Math.max(beatCutOff,BEAT_MIN);
			}
		}


		bpmTime = (new Date().getTime() - bpmStart)/msecsAvg;

		console.log("waves: " + waveData)
		console.log("levels: " + levelsData)
		console.log("bpmTime: " + bpmTime)
	}

	return {
		onMP3Drop:onMP3Drop,
		onUseMic:onUseMic,
		onUseSample:onUseSample,
		update:update,
		init:init,
		level:level,
		levelsData:levelsData,
		onTogglePlay:onTogglePlay
	};

};

if ( typeof module === 'object' ) {

	module.exports = AudioHandler;

}