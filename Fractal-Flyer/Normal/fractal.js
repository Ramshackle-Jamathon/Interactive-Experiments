/*
 * Fractal Flyer
 *
    The MIT License (MIT)

    Copyright (c) March 2015 Joseph Van Drunen

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
 */
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var fractal = {
    container: document.getElementById( 'container' ),
    stats: new Stats(),
    clock: new THREE.Clock(),
    camera: new THREE.Camera(),
    movementCamera: new THREE.Camera(),
    scene: new THREE.Scene(),
    renderer: new THREE.WebGLRenderer( { antialias: true } ),
    time: 0.1,
    quality: 0.3,
    fractalPaused: false,
    minimumDistance: 0.005,
    normalDistance: 0.05,
    anaglyph: false,
    forms: 3,
    spaceFolding: 1,
    showControls: function(){
        alert("Fractal Flyer \n\nControls:\n WASD: Movement\n QE: Roll \n ZX: Speed\n G: (Un)Freeze Camera")
    
    }
    
}
document.addEventListener("DOMContentLoaded", function(event) { 
    NProgress.start();
    fractal.loadResources();
    fractal.showControls();  
});


fractal.loadResources = function() {
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        fractal.audioContext = new AudioContext();
        fractal.audioBuffer = undefined;
        fractal.audioAnalyser = fractal.audioContext.createAnalyser();
        var req = new XMLHttpRequest(); 
        req.open("GET","textures/kentonSlashDemon.mp3",true); 
        req.responseType = "arraybuffer"; 
        req.onload = function() { 
            NProgress.set(0.5);
            //decode the loaded data 
            fractal.audioContext.decodeAudioData(req.response, function(buffer) { 
                fractal.audioBuffer = buffer; 
                fractal.audioSource = fractal.audioContext.createBufferSource();  
                fractal.audioSource.buffer = fractal.audioBuffer; 
                fractal.audioSource.connect(fractal.audioAnalyser); 
                //connect to the final output node (the speakers) 
                fractal.audioAnalyser.connect(fractal.audioContext.destination);
                //play immediately 
                fractal.audioSource.start(0); 
                NProgress.set(0.8); 
                fractal.init();
            }); 
        }; 
        req.send(); 
    }catch(e) {
        NProgress.set(0.8); 
        alert('Web Audio API is not supported in this browser'); 
        fractal.init();
    }
    
}


fractal.init = function() {   
    fractal.gui = new dat.GUI({
        load : {
            preset: "Default",
            remembered: {
                "Default":{0:{
                    "quality": 0.3,
                    "minimumDistance": 0.005,
                    "normalDistance": 0.05,
                    "time": 0.1,
                    "fractalPaused": false,
                    "anaglyph": false,
                    "forms": "3",
                    "spaceFolding": "1"
                    }},
                "Tiny Tubes":{0:{
                    "quality": 0.7,
                    "minimumDistance": 0.0001,
                    "normalDistance": 0.01,
                    "time": 0.0,
                    "fractalPaused": true,
                    "anaglyph": false,
                    "forms": "3",
                    "spaceFolding": "1"
                    }},
                "Cubic Corpuscles":{0:{
                    "quality": 0.7,
                    "minimumDistance": 0.0001,
                    "normalDistance": 0.0001,
                    "time": 32.514817950889075,
                    "fractalPaused": true,
                    "anaglyph": false,
                    "forms": "1",
                    "spaceFolding": "1"
                }},
                "Surfer":{0:{
                    "quality": 0.7,
                    "minimumDistance": 0.01,
                    "normalDistance": 0.236,
                    "time": 105.35,
                    "fractalPaused": true,
                    "anaglyph": false,
                    "forms": "4",
                    "spaceFolding": "0"
                }}
            },
            "closed": false,
            "folders": {}
        }
    });
    
    //menu
    //note: .listen() will listen for changes to the variable but cause frame stuters DO NOT USE
    fractal.gui.remember(fractal)
    fractal.qualityControl = fractal.gui.add(fractal, 'quality', 0.1, 2.0).step(0.1);
    fractal.minDistanceControl = fractal.gui.add(fractal, 'minimumDistance', 0, 0.1);
    fractal.normalControl = fractal.gui.add(fractal, 'normalDistance', -1.0, 1.0);   
    fractal.timeControl = fractal.gui.add(fractal, 'time', 0.0, 120.0);   
    fractal.pausedControl = fractal.gui.add(fractal, 'fractalPaused'); 
    fractal.anaglyphControl = fractal.gui.add(fractal, 'anaglyph');    
    fractal.formsControl = fractal.gui.add(fractal, 'forms', { Cubes: 1, Planes: 2, Tubes: 3, Dots: 4 });    
    fractal.spaceFoldControl = fractal.gui.add(fractal, 'spaceFolding', {"1D": -1, "2D": 0, "3D": 1});  
    fractal.infoControl = fractal.gui.add(fractal, 'showControls');
    



    fractal.audioAnalyser.fftSize = 256;
    var bufferLength = fractal.audioAnalyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    //make independent camera since we are doing pure shader graphics
    fractal.controls = new THREE.FlyControls( fractal.movementCamera );
    fractal.controls.movementSpeed = 1.0;
	fractal.controls.domElement = fractal.container;
	fractal.controls.rollSpeed = Math.PI / 3;
	fractal.controls.autoForward = false;
	fractal.controls.dragToLook = false;
    
    var urls = [
      'textures/pos-x.png',
      'textures/neg-x.png',
      'textures/pos-y.png',
      'textures/neg-y.png',
      'textures/pos-z.png',
      'textures/neg-z.png'
    ]
    // wrap it up into the object that we need
    THREE.ImageUtils.crossOrigin = "";
    var textureImage = THREE.ImageUtils.loadTextureCube(urls);
  
    fractal.tuniform = {
        iGlobalTime:    { type: 'f', value: fractal.time },
        iMinimumDistance:    { type: 'f', value: fractal.minimumDistance },
        iNormalDistance:    { type: 'f', value: fractal.normalDistance },
        iChannel0:  { type: 't', value: textureImage },
        iAnaglyph:  { type: 'i', value: 0 },
        iForms:  { type: 'i', value: fractal.forms},
        iSpaceFolding:  { type: 'i', value: fractal.spaceFolding},
        iResolution: { type:"v2", value:new THREE.Vector2(window.innerWidth,window.innerHeight) },
        iCamPosition: { type:"v3", value:new THREE.Vector3(1.0,0.0,0.0) },
        iCamDir: { type:"v3", value:new THREE.Vector3(1.0,0.0,0.0) },
        iCamUp: { type:"v3", value:new THREE.Vector3(0.0,1.0,0.0) }
    };
    var mat = new THREE.ShaderMaterial( {
            uniforms: fractal.tuniform,
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });
    
    mat.lights = false;
    mat.shading = THREE.FlatShading;
    var fractalMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(2, 2, 0), mat);
    
    // The bg plane shouldn't care about the z-buffer.
    fractalMesh.material.depthTest = false;
    fractalMesh.material.depthWrite = false;


    
	//fractal.scene.fog = new THREE.FogExp2( 0xcccccc, 0.001 );
    fractal.scene.add(fractal.camera);
    fractal.scene.add(fractalMesh);
	
	// renderer
	//fractal.renderer.setClearColor( fractal.scene.fog.color );
	fractal.renderer.setPixelRatio( window.devicePixelRatio );
	fractal.renderer.setSize( window.innerWidth, window.innerHeight );

	
	
	fractal.container.appendChild( fractal.renderer.domElement );

	fractal.stats.domElement.style.position = 'absolute';
	fractal.stats.domElement.style.top = '0px';
	fractal.stats.domElement.style.zIndex = 100;
	fractal.container.appendChild( fractal.stats.domElement );
	
	
	//hardware acceleration for webkit
	fractal.resizePerformance();
	
    window.addEventListener( 'keypress', fractal.keyPress);
    
    
    
    fractal.qualityControl.onChange(function(value) {
        fractal.resizePerformance()
    });
    fractal.minDistanceControl.onChange(function(value) {
        fractal.tuniform.iMinimumDistance.value = value;
    });
    fractal.normalControl.onChange(function(value) {
        fractal.tuniform.iNormalDistance.value = value;
    });
    fractal.timeControl.onChange(function(value) {
        fractal.tuniform.iGlobalTime.value = value;
    });
    fractal.anaglyphControl.onFinishChange(function(value) {
        fractal.tuniform.iAnaglyph.value = value;
    });
    fractal.formsControl.onFinishChange(function(value) {
        fractal.tuniform.iForms.value = value;
    });
    fractal.spaceFoldControl.onFinishChange(function(value) {
        fractal.tuniform.iSpaceFolding.value = value;
    });
    
 /*   [fractal.timeControl, fractal.qualityControl, fractal.minDistanceControl, fractal.normalControl, fractal.pausedControl].forEach(function(control){
        control.onFinishChange(function(value) {
            $(fractal.container).click();
            return false;
        });
    });*/
   
	window.addEventListener( 'resize', fractal.onWindowResize, false ); 
    NProgress.done();
	fractal.render();
}

fractal.onWindowResize = function() {

    //hardware acceleration for webkit
	fractal.renderer.setSize( window.innerWidth, window.innerHeight );
	fractal.resizePerformance();
    fractal.tuniform.iResolution.value.set(window.innerWidth,  window.innerHeight);

	fractal.render();

}
fractal.keyPress = function(e){
    switch(e.charCode){
        //Movement speed
        case "z".charCodeAt(0):
            fractal.controls.movementSpeed += 0.05
            break;
        case "x".charCodeAt(0):
            if(fractal.controls.movementSpeed > 0){
                fractal.controls.movementSpeed -= 0.05  
            }
            break;
        // paused
        case "g".charCodeAt(0):
            fractal.controls.paused = !fractal.controls.paused 
            break;
    }    
}

fractal.resizePerformance = function() {
	fractal.renderer.setSize( window.innerWidth *fractal.quality, window.innerHeight*fractal.quality );
	fractal.renderer.domElement.style.width =  window.innerWidth + 'px';
    fractal.renderer.domElement.style.height = window.innerHeight + 'px';

}

fractal.updateCameraPosition = function() {
    var vectorDir = new THREE.Vector3( 0, 0, -1 );
    vectorDir.applyQuaternion( fractal.movementCamera.quaternion ).normalize();
    var vectorUp = new THREE.Vector3( 0, 1, 0 );
    vectorUp.applyQuaternion( fractal.movementCamera.quaternion ).normalize();

    fractal.tuniform.iCamDir.value.set(vectorDir.x, vectorDir.y, vectorDir.z);
    fractal.tuniform.iCamUp.value.set(vectorUp.x, vectorUp.y, vectorUp.z);
    fractal.tuniform.iCamPosition.value.set(fractal.movementCamera.position.x, fractal.movementCamera.position.y, fractal.movementCamera.position.z);
}

fractal.render = function() {
    requestAnimationFrame( fractal.render );
    fractal.renderer.render(fractal.scene, fractal.camera);
    fractal.stats.update();
    delta=fractal.clock.getDelta();
    fractal.controls.update(delta);
    fractal.updateCameraPosition();
    if( ! fractal.fractalPaused){
        fractal.tuniform.iGlobalTime.value += delta;
        //fractal.time += delta;
    }
    //fractal.tuniform.iRenderTime.value = fractal.stats;
}



