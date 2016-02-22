(function(){
    var THREE = require('./lib/three');
    require('./lib/OrbitControls');

    var Detector = require('./lib/Detector');
    var NProgress = require('./lib/nprogress');
    var Stats = require('./lib/Stats');
    var dat = require('./lib/datGUI');
    var AudioHandler = require('./AudioHandler');
    var audioData;

    var audioHandler = new AudioHandler();

    var statsEnabled = false;
    var container, waveform, camera, scene, renderer, stats, gui, audioData, micHandle;
    var levels = [];

    var audioParams = {
        useMic: false,
        useSample:true,
        volSens:1,
        beatHoldTime:40,
        beatDecayRate:0.97,
        sampleURL: "textures/How_Can_You_Swallow_So_Much_Sleep-Bombay_Bicycle_ClubHQ.mp3"
    };

    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    function init() {

        document.onselectstart = function() {
            return false;
        };
        document.addEventListener('drop', onDocumentDrop, false);
        document.addEventListener('dragover', onDocumentDragOver, false);

        window.addEventListener( 'resize', onWindowResize, false );
        createScene();

        gui = new dat.gui.GUI();
        micHandle = gui.add(audioParams, 'useMic').listen().onChange(audioHandler.onUseMic).name("Use Mic");
       /* gui.add(audioParams, 'volSens', 0, 5).step(0.1).name("Gain");
        gui.add(audioParams, 'beatHoldTime', 0, 100).step(1).name("Beat Hold");
        gui.add(audioParams, 'beatDecayRate', 0.9, 1).step(0.01).name("Beat Decay");*/


        audioHandler.init();
        audioHandler.onUseSample();

        animate();
    }

    function createScene() {
        renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true} );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.autoClear = true;

        container = document.createElement( 'div' );
        container.id = 'glCanvas'
        document.body.appendChild( container );

        camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.set(1200,0,600);
        camera.up = new THREE.Vector3(0,0,1);
        camera.lookAt(new THREE.Vector3(0,0,0));

        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = false;

        scene = new THREE.Scene();
        var light = new THREE.PointLight( 0xf3f3f3, 1, 0 );
        light.position.set( 500, 500, 500 );
        scene.add( light );

        var light = new THREE.PointLight( 0xf3f3f3, 0.5, 0 );
        light.position.set( -500, -500, -500 );
        scene.add( light );



        for (var i = -8; i < 8; i++) {
            for (var a = -8; a < 8; a++) {
                cube = new THREE.Mesh( new THREE.CubeGeometry( 35, 35, 35 ), new THREE.MeshPhongMaterial({ color: 0x000000}) );
                cube.position.set(i * 40,a * 40, 0)
                scene.add(cube);
                levels.push(cube);
            }   
        }
        
        var material = new THREE.LineBasicMaterial({
            color: 0xffffff
        });
        var geometry = new THREE.Geometry();
        for (var i = -256; i < 256; i++) {
            geometry.vertices.push(
                new THREE.Vector3( -340, i * 1.25 - 20, 200 )
            )

        }
        waveform = new THREE.Line( geometry, material );
        scene.add(waveform);




        container.appendChild( renderer.domElement );


        if ( statsEnabled ) {

            stats = new Stats();
            container.appendChild( stats.domElement );

        }
    }

    function animate() {
/*
        for(var i = 0; i < binCount; i++) {
            debugCtx.lineTo(i/binCount*chartW, waveData[i]*chartH/2 + chartH/2);
        }
*/
        requestAnimationFrame( animate );
        controls.update();
        audioData = audioHandler.update()
        if(typeof audioData !== 'undefined'){
            for(var i = 0; i < audioData.waveData.length; i++) {
                waveform.geometry.vertices[i].z = 200 + 100 * audioData.waveData[i]
            }
            waveform.geometry.verticesNeedUpdate = true
            for (var i = 0; i < levels.length; i++) {
                levels[i].scale.z = 1.0 + 8.0 * audioData.levelsData[i]
                levels[i].material.color.r = 6 * 1 * audioData.beatCutOff
                levels[i].material.color.b = 6 * 0.298 * audioData.beatCutOff
                levels[i].material.color.g = 6 * 0.298 *audioData.beatCutOff
            }
        }
        if ( statsEnabled ) stats.update();

        render();


    }

    function render() {
        renderer.clear();
        renderer.render( scene, camera );

    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    function onDocumentDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        return false;
    }
    //load dropped MP3
    function onDocumentDrop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        audioHandler.onMP3Drop(evt);
    }


    document.addEventListener("DOMContentLoaded", function(event) { 
       init();
    });

})();
