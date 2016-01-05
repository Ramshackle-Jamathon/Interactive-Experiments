(function(){
    var THREE = require('./lib/three');

    var skinShader = require("../shaders/stars.glsl");
    var eyeShader = require("../shaders/eyeStars.glsl");
    var vertShader = require("../shaders/vert.glsl");
    var phongVertShader = require("../shaders/phongvert.glsl");

    var Detector = require('./lib/Detector');
    require('./lib/OBJLoader');

    var dat = require('./lib/dat.gui');
    var Stats = require('./lib/Stats');

    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

        var statsEnabled = true;

        var container, stats, loader;

        var camera, scene, renderer;

        var mesh, eyeball1, eyeball2;

        var composer, composerUV1, composerUV2, composerUV3, composerBeckmann;

        var directionalLight, pointLight, ambientLight;

        var mouseX = 0, mouseY = 0;
        var targetX = 0, targetY = 0;

        var windowHalfX = window.innerWidth / 2;
        var windowHalfY = window.innerHeight / 2;

        var firstPass = true;

        var clock = new THREE.Clock();
        var time = 0.1


        var uniforms = THREE.UniformsUtils.merge(
            [THREE.UniformsLib['lights'],
            {
                time: { type:"f", value:time },
                resolution: { type:"v2", value:new THREE.Vector2(100,100) },
                starRadius: { type:"f", value: 2.3 },
                starDensity: { type:"f", value: 3.0 },
                starColor: { type:"v3", value:new THREE.Vector3(0.796078431372549,0.9254901960784314,0.9411764705882353) },
                speed: { type:"f", value: 0.0005 },
            }
            ]
        )
        var eyeUniforms = {
            time: { type:"f", value:time },
            twinkleSpeed: { type:"f", value: 0.04 },
            distfading: { type:"f", value: 0.75 },
            brightness: { type:"f", value: 0.0018 },
            color: { type:"v3", value:new THREE.Vector3(0.796078431372549,0.9254901960784314,0.9411764705882353) },
            speed: { type:"f", value: 0.01 },
        };

        init();
        animate();

        function init() {

            container = document.createElement( 'div' );
            document.body.appendChild( container );

            camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 10000 );
            camera.position.z = 900;

            scene = new THREE.Scene();

            // LIGHTS

            directionalLight = new THREE.PointLight( 0xffeedd, 1.5 );
            directionalLight.position.set( 1, 0.5, 1 );
            scene.add( directionalLight );

            directionalLight = new THREE.PointLight( 0xddddff, 0.5 );
            directionalLight.position.set( -1, 0.5, -1 );
            scene.add( directionalLight );

            // MATERIALS


            var mat = new THREE.ShaderMaterial( {
                uniforms: uniforms,
                vertexShader: phongVertShader,
                fragmentShader: skinShader,
                lights:true,
                fog: true
            });                  
            mat.needsUpdate = true;

            loader = new THREE.JSONLoader();
            loader.load(  "textures/head.js", function( geometry ) { createScene( geometry, 40, mat ) } );

            eyeGeometry1 = new THREE.SphereGeometry(25.3,10,10);
            eyeGeometry1.applyMatrix( new THREE.Matrix4().makeTranslation( -75.75, 343, -58 ) );
            eyeGeometry2 = new THREE.SphereGeometry(20,10,10);
            eyeGeometry2.applyMatrix( new THREE.Matrix4().makeTranslation( -160, 340, -53 ) );
            eyeMaterial = new THREE.ShaderMaterial( {
                uniforms: eyeUniforms,
                vertexShader: vertShader,
                fragmentShader: eyeShader,
            });
            eyeball1 = new THREE.Mesh( eyeGeometry1, eyeMaterial );
            eyeball2 = new THREE.Mesh( eyeGeometry2, eyeMaterial );
            eyeball1.position.z = - 150;
            eyeball2.position.z = - 150;
            eyeball1.position.y = -250;
            eyeball2.position.y = -250;
            eyeball1.position.x = 120;
            eyeball2.position.x = 120;

            scene.add( eyeball1 );
            scene.add( eyeball2 );

            // RENDERER

            renderer = new THREE.WebGLRenderer( { antialias: false } );
            renderer.setClearColor( 0x555555 );
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( window.innerWidth, window.innerHeight );
            renderer.autoClear = false;

            container.appendChild( renderer.domElement );

            // STATS

            if ( statsEnabled ) {

                stats = new Stats();
                container.appendChild( stats.domElement );

            }

            // EVENTS

            document.addEventListener( 'mousemove', onDocumentMouseMove, false );
            //

            window.addEventListener( 'resize', onWindowResize, false );

        }

        function onWindowResize() {

            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();


            renderer.setSize( window.innerWidth, window.innerHeight );

        }

        function createScene( geometry, scale, material ) {

            mesh = new THREE.Mesh( geometry, material );
            mesh.position.z = - 550;
            mesh.scale.set( scale, scale, scale );

            scene.add( mesh );

        }

        function onDocumentMouseMove( event ) {

            mouseX = ( event.clientX - windowHalfX );
            mouseY = ( event.clientY - windowHalfY );

        }

        //

        function animate() {

            requestAnimationFrame( animate );

            render();
            if ( statsEnabled ) stats.update();


        }

        function render() {
            targetX = mouseX * .001;
            targetY = mouseY * .001;
            delta=clock.getDelta();

            if ( mesh ) {
                mesh.material.uniforms.time.value += delta;

                mesh.rotation.y += 0.05 * ( targetX - mesh.rotation.y );
                mesh.rotation.x += 0.05 * ( targetY - mesh.rotation.x );
            }
            if(eyeball1){
                eyeball1.material.uniforms.time.value += delta;

                eyeball1.rotation.y += 0.05 * ( targetX - eyeball1.rotation.y );
                eyeball1.rotation.x += 0.05 * ( targetY - eyeball1.rotation.x );
            }
            if(eyeball2){
                eyeball2.material.uniforms.time.value += delta;

                eyeball2.rotation.y += 0.05 * ( targetX - eyeball2.rotation.y );
                eyeball2.rotation.x += 0.05 * ( targetY - eyeball2.rotation.x );
            }

            renderer.clear();

            renderer.render( scene, camera );

        }




})();
