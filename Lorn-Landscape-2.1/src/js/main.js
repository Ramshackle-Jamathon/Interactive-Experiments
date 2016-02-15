var THREE = require('./lib/three');
require('./lib/FlyControls');
var Detector = require('./lib/Detector');
var NProgress = require('./lib/nprogress');
var Stats = require('./lib/Stats');
var dat = require('./lib/datGUI.js');

export default class App {
    /*
     *  @constructs App
     */
    constructor() {
        this.container = document.getElementById( 'container' )
        this.camera = new THREE.Camera()
        this.movementCamera = new THREE.Camera()
        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer( { antialias: true } )
        this.quality = 0.2
        this.contrast = 1.1
        this.saturation = 1.12
        this.brightness = 1.3
        this.clock = new THREE.Clock()
        this.showControls = function(){
            alert('Lorn Landscape \n\nControls:\n WASD: Movement\n QE: Roll \n ZX: Speed\n G: (Un)Freeze Camera')
        }
    }
    /*
     * @function start
     * @description runs the app
     *
     */
    start(){
        if ( ! Detector.webgl ){ 
            Detector.addGetWebGLMessage();
        } else {
            NProgress.start();
            this.initSound();
            this.initScene();
        }
    }

    /*
     *  @function initSound
     *  @description loads and plays sample mp3
     *
     */
    initSound() {
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.audioSource

        var self = this
        fetch('sounds/hair-by-debbie.mp3').then(function(response) {
            return response.arrayBuffer();
        }).then(function(data) {
            self.audioContext.decodeAudioData(data, function(buffer) {
                self.audioSource = self.audioContext.createBufferSource();  
                self.audioSource.connect(self.audioAnalyser); 
                //connect to the final output node (the speakers) 
                //self.audioAnalyser.connect(self.audioContext.destination);
                self.audioAnalyser.fftSize = 256;
                self.audioSource.buffer = buffer; 
                self.dataArray = new Uint8Array(self.audioAnalyser.frequencyBinCount);
                //play immediately 
                self.audioSource.start(0);
            }); 
        }).catch(function() {
            Error('Network Error');
        });
    }

    /*
     *  @function initScene
     *  @description adds objects to our scene and places the renderer into the dom
     */
    initScene() {
        //movement camera, not added to scene but used for calculator vectors which are passed to the shader
        this.movementCamera.lookAt(new THREE.Vector3(0.60,0.2,0.75));
        this.movementCamera.position.set(1.0, 0.0, 0.0);
        this.movementCamera.up.set(0.0, 1.0, 0.0);
        this.controls = this.createFlightControls()

        //static camera placed infront of shaderplane
        this.scene.add(this.camera);

        //shaderplane
        this.shaderPlane = this.createShaderPlane()
        this.scene.add(this.shaderPlane);

        //configuring canvas dom element
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );

        //TODO: touch controls
        window.addEventListener( 'keypress', this.keyPress.bind(this)) ;
        window.addEventListener( 'resize', this.onWindowResize.bind(this), false ); 
        
        NProgress.done();

        this.resizePerformance();
        this.addHud();
        //enter render loop
        this.render(this);
    } 

    /*
     *  @function createFlightControls
     *  @description Adds flight controls to movementcamera. uses quaternions to prevent gimbal lock
     *
     */
    createFlightControls () {
        let controls = new THREE.FlyControls( this.movementCamera );
        controls.movementSpeed = 10.0;
        controls.domElement = this.container;
        controls.rollSpeed = Math.PI / 3;
        controls.autoForward = false;
        controls.dragToLook = false;
        controls.paused = true;
        return controls
    }
    /*
     *  @function createShaderPlane
     *  @description creates our shader plane using our shader material
     *
     */
    createShaderPlane () {
        this.uniforms = {
            uResolution: { type:"v2", value: new THREE.Vector2(window.innerWidth,window.innerHeight) },
            uCamPosition: { type:"v3", value: this.movementCamera.position.clone() },
            uCamDir: { type:"v3", value: new THREE.Vector3( 0, 0, -1 ).applyQuaternion( this.movementCamera.quaternion ).normalize() },
            uCamUp: { type:"v3", value: this.movementCamera.up.clone() },
            uContrast:  { type: "f", value: this.contrast },
            uSaturation:  { type: "f", value: this.saturation },
            uBrightness:  { type: "f", value: this.brightness },
            amplitude:  { type: "fv1", value: [] } 
        };
        var mat = new THREE.ShaderMaterial( {
                uniforms: this.uniforms,
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

    /*
     *  @function onWindowResize
     *  @description runs on resize event
     *
     */
    addHud () {

        this.stats = new Stats()
        this.container.appendChild( this.stats.domElement );

        this.gui = new dat.gui.GUI()
        //this.gui.close()
        var self = this
        this.qualityControl = this.gui.add(this, 'quality', 0.1, 2.0).step(0.1).name("Quality");
        this.qualityControl.onChange(function(value) {
            self.resizePerformance()
        });
        this.contrastControl = this.gui.add(this, 'contrast', 0.1, 2.0).step(0.1).name("Contrast");
        this.contrastControl.onChange(function(value) {
            self.uniforms.uContrast.value = value
        });
        this.saturationControl = this.gui.add(this, 'saturation', 0.1, 2.0).step(0.1).name("Saturation");
        this.saturationControl.onChange(function(value) {
            self.uniforms.uSaturation.value = value
        });
        this.brightnessControl = this.gui.add(this, 'brightness', 0.1, 2.0).step(0.1).name("Brightness");
        this.brightnessControl.onChange(function(value) {
            self.uniforms.uBrightness.value = value
        });
        this.infoControl = this.gui.add(this, 'showControls').name("Camera Controls");
    }

    /*
     *  @function onWindowResize
     *  @description runs on resize event
     *
     */
    onWindowResize () {
        //hardware acceleration for webkit
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.resizePerformance();
        this.uniforms.uResolution.value.set(window.innerWidth,  window.innerHeight);
    }


    /*
     *  @function keyPress
     *  @description keyboard input
     *
     */
    keyPress (e) {
        switch(e.charCode){
            //Movement speed
            case "z".charCodeAt(0):
                this.controls.movementSpeed += 2.0
                break;
            case "x".charCodeAt(0):
                if(this.controls.movementSpeed > 0){
                    this.controls.movementSpeed -= 2.0 
                }
                break;
            // paused
            case "g".charCodeAt(0):
                this.controls.paused = !this.controls.paused 
                break;
        }  
    }

    /*
     *  @function resizePerformance
     *  @description hack for resolution scalling of the canvas, Very important, The key to running on less powerful hardware
     *
     */
    resizePerformance () {
        this.renderer.setSize( window.innerWidth * this.quality, window.innerHeight * this.quality );
        this.renderer.domElement.style.width =  window.innerWidth + 'px';
        this.renderer.domElement.style.height = window.innerHeight + 'px';
    }

    /*
     *  @function updateCameraPosition
     *  @description for each render calculate the current camera vectors (position, look direction and up direction)
     *
     */
    updateCameraPosition () {
        let vectorDir = new THREE.Vector3( 0, 0, -1 );
        vectorDir.applyQuaternion( this.movementCamera.quaternion ).normalize();
        let vectorUp = new THREE.Vector3( 0, 1, 0 );
        vectorUp.applyQuaternion( this.movementCamera.quaternion ).normalize();

        if(this.movementCamera.position.y < -2.0){
            this.movementCamera.position.y = -2.0
        }
        this.uniforms.uCamDir.value.set(vectorDir.x, vectorDir.y, vectorDir.z);
        this.uniforms.uCamUp.value.set(vectorUp.x, vectorUp.y, vectorUp.z);
        this.uniforms.uCamPosition.value.set(this.movementCamera.position.x, this.movementCamera.position.y, this.movementCamera.position.z);

    }
    /*
     *  @function render
     *  @description where it all comes together
     *
     */
    render () {

        //Stats Update
        if(this.stats !== undefined){
            this.stats.update();
        }

        //Audio Data Update
        this.audioAnalyser.getByteFrequencyData(this.dataArray);
        if(this.dataArray !== undefined){
            for(var i = 0; i < 50; i++) {
                this.uniforms.amplitude.value[i] = -(this.dataArray[(i + 10) * 2] / 255) + 1;
            };
        } else {
            for(var i = 0; i < 50; i++) {
                this.uniforms.amplitude.value[i] = 1;
            };  
        }

        this.renderer.render(this.scene, this.camera);
        this.controls.update(this.clock.getDelta());
        this.updateCameraPosition();
        requestAnimationFrame( this.render.bind(this) );
    }
};
