(function(){
    var THREE = require('./lib/three');
    require('./lib/FlyControls');

    var vertShader = require("../shaders/vert.glsl");
    var fragShader = require("../shaders/frag.glsl");

    var Detector = require('./lib/Detector');
    var NProgress = require('./lib/nprogress');
    var Stats = require('./lib/Stats');

    var dat = require('./lib/datGUI.js');


    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    var shaderPlane = {
        container: document.getElementById( 'container' ),
        stats: new Stats(),
        clock: new THREE.Clock(),
        camera: new THREE.Camera(),
        movementCamera: new THREE.Camera(),
        scene: new THREE.Scene(),
        renderer: new THREE.WebGLRenderer( { antialias: true } ),
        time: 0.1,
        quality: 0.3,
        showControls: function(){
            alert("Fractal Flyer \n\nControls:\n WASD: Movement\n QE: Roll \n ZX: Speed\n G: (Un)Freeze Camera")
        }
            
    }

    document.addEventListener("DOMContentLoaded", function(event) { 
        NProgress.start();
        shaderPlane.loadResources();
    });

    shaderPlane.loadResources = function() {
        try {
            // Fix up for prefixing
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            shaderPlane.audioContext = new AudioContext();
            shaderPlane.audioBuffer = undefined;
            shaderPlane.audioAnalyser = shaderPlane.audioContext.createAnalyser();
            var req = new XMLHttpRequest(); 
            req.open("GET","textures/Lorn-Anvil.mp3",true); 
            req.responseType = "arraybuffer"; 
            req.onload = function() { 
                NProgress.set(0.5);
                //decode the loaded data 
                shaderPlane.audioContext.decodeAudioData(req.response, function(buffer) { 
                    shaderPlane.audioBuffer = buffer; 
                    shaderPlane.audioSource = shaderPlane.audioContext.createBufferSource();  
                    shaderPlane.audioSource.buffer = shaderPlane.audioBuffer; 
                    shaderPlane.audioSource.connect(shaderPlane.audioAnalyser); 
                    //connect to the final output node (the speakers) 
                    shaderPlane.audioAnalyser.connect(shaderPlane.audioContext.destination);
                    //play immediately 
                    //shaderPlane.audioSource.start(0);
                    NProgress.set(0.8); 
                    shaderPlane.init();
                }); 
            }; 
            req.send(); 
        }catch(e) {
            NProgress.set(0.8); 
            alert('Web Audio API is not supported in this browser');
            shaderPlane.init();
        }
        
    }


    shaderPlane.init = function() {   
       shaderPlane.gui = new dat.gui.GUI();
        
        //menu
        //note: .listen() will listen for changes to the variable but cause frame stuters DO NOT USE
        shaderPlane.gui.remember(shaderPlane)
        shaderPlane.qualityControl = shaderPlane.gui.add(shaderPlane, 'quality', 0.1, 2.0).step(0.1);
        shaderPlane.timeControl = shaderPlane.gui.add(shaderPlane, 'time', 0.0, 120.0);   
        shaderPlane.infoControl = shaderPlane.gui.add(shaderPlane, 'showControls');


        shaderPlane.audioAnalyser.fftSize = 256;
        var bufferLength = shaderPlane.audioAnalyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        //make independent camera since we are doing pure shader graphics
        shaderPlane.controls = new THREE.FlyControls( shaderPlane.movementCamera );
        shaderPlane.controls.movementSpeed = 1.0;
        shaderPlane.controls.domElement = shaderPlane.container;
        shaderPlane.controls.rollSpeed = Math.PI / 3;
        shaderPlane.controls.autoForward = false;
        shaderPlane.controls.dragToLook = false;
        


        shaderPlane.tuniform = {
            iGlobalTime: { type: 'f', value: shaderPlane.time },
            iResolution: { type:"v2", value:new THREE.Vector2(window.innerWidth,window.innerHeight) },
            iCamPosition: { type:"v3", value:new THREE.Vector3(1.0,0.0,0.0) },
            iCamDir: { type:"v3", value:new THREE.Vector3(1.0,0.0,0.0) },
            iCamUp: { type:"v3", value:new THREE.Vector3(0.0,1.0,0.0) }
        };
        var mat = new THREE.ShaderMaterial( {
                uniforms: shaderPlane.tuniform,
                vertexShader: vertShader,
                fragmentShader: fragShader
            });
        
        mat.lights = false;
        mat.shading = THREE.FlatShading;
        var fractalMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(2, 2, 0), mat);
        // The bg plane shouldn't care about the z-buffer.
        fractalMesh.material.depthTest = false;
        fractalMesh.material.depthWrite = false;
        console.log("after Shader")


        
        //shaderPlane.scene.fog = new THREE.FogExp2( 0xcccccc, 0.001 );
        shaderPlane.scene.add(shaderPlane.camera);
        shaderPlane.scene.add(fractalMesh);
        console.log("shader Added")
        
        // renderer
        //shaderPlane.renderer.setClearColor( shaderPlane.scene.fog.color );
        shaderPlane.renderer.setPixelRatio( window.devicePixelRatio );
        shaderPlane.renderer.setSize( window.innerWidth, window.innerHeight );

        
        
        shaderPlane.container.appendChild( shaderPlane.renderer.domElement );

        shaderPlane.stats.domElement.style.position = 'absolute';
        shaderPlane.stats.domElement.style.top = '0px';
        shaderPlane.stats.domElement.style.zIndex = 100;
        shaderPlane.container.appendChild( shaderPlane.stats.domElement );
        
        
        //hardware acceleration for webkit
        shaderPlane.resizePerformance();
        
        window.addEventListener( 'keypress', shaderPlane.keyPress);
        
        
        
        shaderPlane.qualityControl.onChange(function(value) {
            shaderPlane.resizePerformance()
        });
        shaderPlane.timeControl.onChange(function(value) {
            shaderPlane.tuniform.iGlobalTime.value = value;
        });
        
     /*   [shaderPlane.timeControl, shaderPlane.qualityControl, shaderPlane.minDistanceControl, shaderPlane.normalControl, shaderPlane.pausedControl].forEach(function(control){
            control.onFinishChange(function(value) {
                $(shaderPlane.container).click();
                return false;
            });
        });*/
       
        window.addEventListener( 'resize', shaderPlane.onWindowResize, false ); 
        console.log("init Complete")
        
        NProgress.done();
        shaderPlane.render();
    }

    shaderPlane.onWindowResize = function() {

        //hardware acceleration for webkit
        shaderPlane.renderer.setSize( window.innerWidth, window.innerHeight );
        shaderPlane.resizePerformance();
        shaderPlane.tuniform.iResolution.value.set(window.innerWidth,  window.innerHeight);

        shaderPlane.render();

    }
    shaderPlane.keyPress = function(e){
        switch(e.charCode){
            //Movement speed
            case "z".charCodeAt(0):
                shaderPlane.controls.movementSpeed += 0.05
                break;
            case "x".charCodeAt(0):
                if(shaderPlane.controls.movementSpeed > 0){
                    shaderPlane.controls.movementSpeed -= 0.05  
                }
                break;
            // paused
            case "g".charCodeAt(0):
                shaderPlane.controls.paused = !shaderPlane.controls.paused 
                break;
        }    
    }

    shaderPlane.resizePerformance = function() {
        shaderPlane.renderer.setSize( window.innerWidth * shaderPlane.quality, window.innerHeight * shaderPlane.quality );
        shaderPlane.renderer.domElement.style.width =  window.innerWidth + 'px';
        shaderPlane.renderer.domElement.style.height = window.innerHeight + 'px';

    }

    shaderPlane.updateCameraPosition = function() {
        var vectorDir = new THREE.Vector3( 0, 0, -1 );
        vectorDir.applyQuaternion( shaderPlane.movementCamera.quaternion ).normalize();
        var vectorUp = new THREE.Vector3( 0, 1, 0 );
        vectorUp.applyQuaternion( shaderPlane.movementCamera.quaternion ).normalize();

        shaderPlane.tuniform.iCamDir.value.set(vectorDir.x, vectorDir.y, vectorDir.z);
        shaderPlane.tuniform.iCamUp.value.set(vectorUp.x, vectorUp.y, vectorUp.z);
        shaderPlane.tuniform.iCamPosition.value.set(shaderPlane.movementCamera.position.x, shaderPlane.movementCamera.position.y, shaderPlane.movementCamera.position.z);
    }

    shaderPlane.render = function() {
        requestAnimationFrame( shaderPlane.render );
        shaderPlane.renderer.render(shaderPlane.scene, shaderPlane.camera);
        shaderPlane.stats.update();
        delta=shaderPlane.clock.getDelta();
        shaderPlane.controls.update(delta);
        shaderPlane.updateCameraPosition();
        if( ! shaderPlane.fractalPaused){
            shaderPlane.tuniform.iGlobalTime.value += delta;
            //shaderPlane.time += delta;
        }
        //shaderPlane.tuniform.iRenderTime.value = shaderPlane.stats;
    }

})();
