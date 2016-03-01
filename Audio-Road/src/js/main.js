var THREE = require('./lib/three');
var Detector = require('./lib/Detector');
var NProgress = require('./lib/nprogress');
var Stats = require('./lib/Stats');
var dat = require('./lib/datGUI.js');

import AudioHandler from './AudioHandler.js';

export default class App {
    /*
     *  @constructs App
     */
    constructor() {
        this.container = document.getElementById( 'container' )
        this.camera = new THREE.Camera()
        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer( { antialias: true } )
        this.quality = 1.0
        this.audioHandler = new AudioHandler()
        this.messageBox = document.getElementById('js_messages')
        this.showControls = function(){
            (this.messageBox.classList.contains('active') ? this.messageBox.classList.remove('active') : this.messageBox.classList.add('active'))
        }
        this.messageBox.classList.add('active')
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
        this.audioHandler.init();
        this.audioHandler.onUseSample();
    }

    /*
     *  @function initScene
     *  @description adds objects to our scene and places the renderer into the dom
     */
    initScene() {


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
        window.addEventListener( 'resize', this.onWindowResize.bind(this), false ); 
        document.getElementById( 'js_close').addEventListener( 'click', this.showControls.bind(this));
        
        NProgress.done();

        this.resizePerformance();
        this.addHud();
        //enter render loop
        this.render(this);
    } 

    /*
     *  @function createShaderPlane
     *  @description creates our shader plane using our shader material
     *
     */
    createShaderPlane () {

        this.texureData = new Float32Array(1024)
        for(var i = 0; i < this.texureData.length; i++) {
            this.texureData[i] = 0.0;
        };  
        this.audioTexture = new THREE.DataTexture(this.texureData, 512, 2, THREE.LuminanceFormat, THREE.FloatType);
        this.audioTexture.needsUpdate = true;

        this.uniforms = {
            uResolution: { type:"v2", value: new THREE.Vector2(window.innerWidth,window.innerHeight) },
            iChannel0: { type:"t", value: this.audioTexture }
        };
        var mat = new THREE.ShaderMaterial( {
                uniforms: this.uniforms,
                vertexShader: require("../shaders/vert.glsl"),
                fragmentShader: require("../shaders/frag.glsl")
            });
        mat.lights = false;
        mat.needsUpdate = true;
        //mat.shading = THREE.FlatShading;
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
        this.gui.close()
        var self = this
        this.qualityControl = this.gui.add(this, 'quality', 0.1, 2.0).step(0.1).name("Quality");
        this.qualityControl.onChange(function(value) {
            self.resizePerformance()
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
     *  @function render
     *  @description where it all comes together
     *
     */
    render () {

        //Stats Update
        if(this.stats !== undefined){
            this.stats.update();
        }

        this.audioData = this.audioHandler.update()

        if(this.audioData !== undefined){
            for(var i = 0; i < 512; i++) {
                this.texureData[i] = this.audioData.levelsData[i]
                this.texureData[i + 512] = this.audioData.waveData[i]
            };
        } else {
            for(var i = 0; i < 1024; i++) {
                this.texureData[i] = 0.0;
            };  
        }
        this.audioTexture = new THREE.DataTexture(this.texureData, 512, 2, THREE.LuminanceFormat, THREE.FloatType)
        //this.audioTexture.wrapS = THREE.MirroredRepeatWrapping;
        //this.audioTexture.wrapT = THREE.MirroredRepeatWrapping;
        //this.audioTexture.magFilter = THREE.NearestFilter;
        //this.audioTexture.minFilter = THREE.NearestFilter;
        this.audioTexture.repeat.set( 1, 1 );
        this.audioTexture.needsUpdate = true;

        this.uniforms.iChannel0.value = this.audioTexture
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(this.render.bind(this));
    }
};
