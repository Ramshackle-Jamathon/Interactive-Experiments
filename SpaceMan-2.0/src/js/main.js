
require("../css/style.scss");
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

        var camera, scene, renderer, mixer;

        var mesh, eyes;

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
                starRadius: { type:"f", value: 3.3 },
                starDensity: { type:"f", value: 0.0 },
                starColor: { type:"v4", value:new THREE.Vector4(0.796078431372549,0.9254901960784314,0.9411764705882353,1.0) },
                speed: { type:"f", value: 0.0001 },
            }
            ]
        )
        var eyeUniforms = {
            time: { type:"f", value:time },
            twinkleSpeed: { type:"f", value: 0.04 },
            distfading: { type:"f", value: 0.75 },
            brightness: { type:"f", value: 0.0018 },
            color: { type:"v3", value:new THREE.Vector3(0.1796875, 0.90296875, 0.33984375) },
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
                morphTargets: true,
                transparent: true
            });                  
            mat.needsUpdate = true;
            eyeMaterial = new THREE.ShaderMaterial( {
                uniforms: eyeUniforms,
                vertexShader: vertShader,
                fragmentShader: eyeShader
            });

            loader = new THREE.JSONLoader();
            loader.load(  "textures/head.js", function( geometry ) { createScene( geometry, 40, mat ) } );
            loader.load(  "textures/eyes.js", function( geometry ) { createEyes( geometry, 40, eyeMaterial ) } );


            // RENDERER
            renderer = new THREE.WebGLRenderer( { antialias: false } );
            renderer.setClearColor( 0x111111 );
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( window.innerWidth, window.innerHeight );
            renderer.autoClear = true;

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


            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            // define morphtargets, we'll use the vertices from these geometries
            // define morphtargets and compute the morphnormal
            var vertices = [];

            console.log(geometry.vertices.length)
            for ( var v = 0; v < geometry.vertices.length; v ++ ) {
                vertices.push( new THREE.Vector3( geometry.vertices[v].x * 3.0, geometry.vertices[v].y / 2.0, geometry.vertices[v].z ) )
            }
            geometry.morphTargets[0] = {name: 't1', vertices: geometry.vertices};
            geometry.morphTargets[1] = { name: 't2' , vertices: vertices };

            geometry.computeMorphNormals();

            mesh = new THREE.MorphBlendMesh( geometry, material );
            mesh.position.z = - 550;
            mesh.scale.set( scale, scale, scale );


            var controls = new function () {
                this.influence1 = 0.01;
                this.influence2 = 0.01;
                this.update = function () {
                    mesh.morphTargetInfluences[0] = controls.influence1;
                    mesh.morphTargetInfluences[1] = controls.influence2;
                };
            };
            var gui = new dat.GUI();
            gui.add(controls, 'influence1', 0, 1).onChange(controls.update);
            gui.add(controls, 'influence2', 0, 1).onChange(controls.update);

            if(eyes){
                scene.add( mesh );
                scene.add( eyes );
            }
        }


        function createEyes( geometry, scale, material ) {

            eyes = new THREE.Mesh( geometry, material );
            eyes.position.z = - 550;
            eyes.scale.set( scale, scale, scale );

            if(mesh){
                scene.add( mesh );
                scene.add( eyes );
            }
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
            if(eyes){
                eyes.material.uniforms.time.value += delta;

                eyes.rotation.y += 0.05 * ( targetX - eyes.rotation.y );
                eyes.rotation.x += 0.05 * ( targetY - eyes.rotation.x );
            }

            renderer.clear();

            renderer.render( scene, camera );

        }




})();
