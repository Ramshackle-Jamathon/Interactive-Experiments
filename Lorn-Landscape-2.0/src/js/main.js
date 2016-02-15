'use strict';

import { THREE } from 'threejs-boilerplate';

//====================================================================//
//
// init scene
//
//====================================================================//

export function init (app) {
    app.audioAnalyser = startAudio(app)

    app.movementCamera = new THREE.Camera()
    //good first view
    app.movementCamera.lookAt(new THREE.Vector3(0.60,0.2,0.75));
    app.controls = createFlightControls(app)
    app.shaderPlane = createShaderPlane()
    app.scene.add(app.shaderPlane);



}

function startAudio(){
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    var audioContext = new AudioContext();
    var audioAnalyser = audioContext.createAnalyser();
    var audioSource, bufferLength

    fetch('sounds/hair-by-debbie.mp3').then(function(response) {
        return response.arrayBuffer();
    }).then(function(data) {
        audioContext.decodeAudioData(data, function(buffer) {
            audioSource = audioContext.createBufferSource();  
            audioSource.connect(audioAnalyser); 
            //connect to the final output node (the speakers) 
            //audioAnalyser.connect(audioContext.destination);
            audioAnalyser.fftSize = 2048;
            audioSource.buffer = buffer; 
            //play immediately 
            audioSource.start(0);
        }); 
    }).catch(function() {
        Error("Network Error");
    });
    return audioAnalyser
}


function createFlightControls (app) {
    let controls = new THREE.FlyControls( app.movementCamera );
    controls.movementSpeed = 10.0;
    controls.domElement = app.domElement.parentNode;
    controls.rollSpeed = Math.PI / 3;
    controls.autoForward = false;
    controls.dragToLook = false;
    controls.paused = true;
    return controls
}

function createShaderPlane () {
    var uniforms = {
        iResolution: { type:"v2", value:new THREE.Vector2(window.innerWidth,window.innerHeight) },
        iCamPosition: { type:"v3", value:new THREE.Vector3(1.0,0.0,0.0) },
        iCamDir: { type:"v3", value:new THREE.Vector3(1.0,0.0,0.0) },
        iCamUp: { type:"v3", value:new THREE.Vector3(0.0,1.0,0.0) },
        amplitude:  { type: "fv1", value: [] } 
    };
    var mat = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: require("../shaders/vert.glsl"),
            fragmentShader: require("../shaders/frag.glsl")
        });
    mat.lights = false;
    mat.shading = THREE.FlatShading;
    var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(2, 2, 0), mat);
    // The bg plane shouldn't care about the z-buffer.
    mesh.material.depthTest = false;
    mesh.material.depthWrite = false;
    return mesh
}

//====================================================================//
//
// animate scene
//
//====================================================================//

export function animate (time, app) {
    let dataArray = new Uint8Array( app.audioAnalyser.frequencyBinCount );
    app.audioAnalyser.getByteFrequencyData(dataArray);
    /*if(typeof app.shaderPlane.uniforms.amplitude !== undefined){
        for(var i = 0; i < 50; i++) {
            app.shaderPlane.uniforms.amplitude.value[i] = -(shaderPlane.dataArray[(i + 10) * 2] / 255) + 1;
        };
    }*/
    //console.log(dataArray)

}


//====================================================================//
//
// configuration (optional)
//
// TIP: remove if you don't like or need it
//
//====================================================================//

export function configure (app) {

    //app.preventDefaultTouchEvents();
    //app.enablePointerPositionTracking();

    /*Object.assign(app, {

        scaleX: 1.0,
        scaleY: 1.0,
        scaleZ: 1.0,
        shadowCameraVisible: false,

    });

    app.on('dat-gui', function (dat) {

        let gui = new dat.GUI({
            height: 4 * 32 - 1
        });

        gui.add(app, 'scaleX').min(0.1).max(5.0).name('Scale X');
        gui.add(app, 'scaleY').min(0.1).max(5.0).name('Scale Y');
        gui.add(app, 'scaleZ').min(0.1).max(5.0).name('Scale Z');
        gui.add(app, 'shadowCameraVisible').name('shadow camera');

    });

    app.pointer.on('tapStart', () => {
        app.renderer.setClearColor( 0xffffff, 0.25);
        app.domElement.style.cursor = 'move';
    });

    app.pointer.on('tapEnd', () => {
        app.renderer.setClearColor( 0xffffff, 0.0);
        app.domElement.style.cursor = 'default';
    });*/

}


