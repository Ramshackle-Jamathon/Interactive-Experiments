
require("../css/style.scss");
(function(){
    var THREE = require('./lib/three');

    var skinShader = require("../shaders/stars.glsl");
    var textShader = require("../shaders/textshader.glsl");
    var phongVertShader = require("../shaders/phongvert.glsl");

    var TWEEN = require('./lib/Tween.js');

    var Detector = require('./lib/Detector');
    require('./lib/FontUtils');
    require('./lib/TextGeometry');
    require('./Maple-Black');


    var Stats = require('./lib/Stats');

    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

        var statsEnabled = false;

        var container, stats, loader;

        var camera, scene, renderer;

        var mesh, textRight, textLeft;

        var mouseX = 0, mouseY = 0;
        var targetX = 0, targetY = 0;

        var windowHalfX = document.body.clientWidth / 2;
        var windowHalfY = document.body.clientHeight / 2;

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        var clock = new THREE.Clock();
        var time = 0.1
        var updateLight = true;



        var uniforms = {
            myLightPos:{ type:"v3", value:new THREE.Vector3() },
            time: { type:"f", value:time },
            resolution: { type:"v2", value:new THREE.Vector2(300,300) },
            starRadius: { type:"f", value: 0.3 },
            starDensity: { type:"f", value: 1.0 },
            starColor: { type:"v4", value:new THREE.Vector4(0.796078431372549,0.9254901960784314,0.9411764705882353,1.0) },
            speed: { type:"f", value: 0.000001 },
        };
        var textLeftUniforms = {
            myLightPos:{ type:"v3", value:new THREE.Vector3() },
            resolution: { type:"v2", value:new THREE.Vector2(0.01,0.01) },
            time: { type:"f", value:time },
            twinkleSpeed: { type:"f", value: 0.04 },
            distfading: { type:"f", value: 0.75 },
            brightness: { type:"f", value: 0.0018 },
            color: { type:"v3", value:new THREE.Vector3(0.796078431372549,0.9254901960784314,0.9411764705882353) },
            speed: { type:"f", value: 0.01 },
        }
        var textRightUniforms = {
            myLightPos:{ type:"v3", value:new THREE.Vector3() },
            resolution: { type:"v2", value:new THREE.Vector2(0.01,0.01) },
            time: { type:"f", value:time },
            twinkleSpeed: { type:"f", value: 0.04 },
            distfading: { type:"f", value: 0.75 },
            brightness: { type:"f", value: 0.0018 },
            color: { type:"v3", value:new THREE.Vector3(0.796078431372549,0.9254901960784314,0.9411764705882353) },
            speed: { type:"f", value: 0.01 },
        }

        init();
        animate();

        function init() {


            container = document.createElement( 'div' );
            container.id = 'glCanvas'
            document.body.appendChild( container );


            camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 10000 );
            camera.position.z = 900;

            scene = new THREE.Scene();

            // LIGHTS
            // MATERIALS


            var mat = new THREE.ShaderMaterial( {
                uniforms: uniforms,
                vertexShader: phongVertShader,
                fragmentShader: skinShader,
                transparent: true
            });                  
            mat.needsUpdate = true;

            var textmaterialRight = new THREE.ShaderMaterial( {
                uniforms: textRightUniforms,
                vertexShader: phongVertShader,
                fragmentShader: textShader,
                transparent: true
            });
            textmaterialRight.needsUpdate = true;
            var textmaterialLeft = new THREE.ShaderMaterial( {
                uniforms: textLeftUniforms,
                vertexShader: phongVertShader,
                fragmentShader: textShader,
                transparent: true
            });
            textmaterialLeft.needsUpdate = true;
            var textGeomLeft = new THREE.TextGeometry( 'Journal', {
                font: 'maple-black', // Must be lowercase!
                weight: 'bold',
                size: 40,
                height: 1
            });
            var textGeomRight = new THREE.TextGeometry( 'Work', {
                font: 'maple-black', // Must be lowercase!
                weight: 'bold',
                size: 40,
                curveSegments: 100,
                height: 1
            });
            textLeft = new THREE.Mesh( textGeomLeft, textmaterialLeft );
            textRight = new THREE.Mesh( textGeomRight, textmaterialRight );
            textLeft.position.x = -450
            textRight.position.x = 200
            scene.add( textLeft );
            scene.add( textRight );

            var geometry = new THREE.PlaneGeometry( 300, 70, 32 );
            var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.0 } );
            var planeRight = new THREE.Mesh( geometry, material );
            planeRight.position.x = 290;
            planeRight.position.y = 15;
            planeRight.position.z = 40;
            planeRight.name = "textRight"
            scene.add( planeRight );

            var planeLeft = new THREE.Mesh( geometry, material );
            planeLeft.position.x = -320;
            planeLeft.position.y = 15;
            planeLeft.position.z = 40;
            planeLeft.name = "textLeft"
            scene.add( planeLeft );

            // RENDERER
            renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true} );
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( window.innerWidth, window.innerHeight );
            renderer.autoClear = true;

            loader = new THREE.JSONLoader();
            loader.load(  "textures/head.js", function( geometry ) { createScene( geometry, 40, mat ) } );

            container.appendChild( renderer.domElement );

            // STATS

            if ( statsEnabled ) {

                stats = new Stats();
                container.appendChild( stats.domElement );

            }


            mouseX = 0;
            mouseY = -340;
            textLeftUniforms.myLightPos.value = new THREE.Vector3(-mouseX,mouseY,400.0);
            textRightUniforms.myLightPos.value = new THREE.Vector3(-mouseX,mouseY,400.0);
            uniforms.myLightPos.value = new THREE.Vector3(mouseX,mouseY,-1);
            // EVENTS

            document.addEventListener( 'mousemove', onDocumentMouseMove, false );
            document.addEventListener( 'click', onDocumentClick, false );
            //
            window.addEventListener( 'resize', onWindowResize, false );
        }

        function onWindowResize() {

            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();


            textLeftUniforms.myLightPos.value = new THREE.Vector3(-mouseX,mouseY,400.0);
            textRightUniforms.myLightPos.value = new THREE.Vector3(-mouseX,mouseY,400.0);
            uniforms.myLightPos.value = new THREE.Vector3(mouseX,mouseY,-1);


            renderer.setSize( window.innerWidth, window.innerHeight );

        }

        function createScene( geometry, scale, material ) {

            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            mesh = new THREE.Mesh( geometry, material );
            mesh.position.z = - 550;
            mesh.scale.set( scale, scale, scale );
            scene.add( mesh );
        }

        function onDocumentMouseMove( event ) {

            mouseX = ( event.clientX - windowHalfX );
            mouseY = ( event.clientY - windowHalfY );

            if(updateLight){ 
                textLeftUniforms.myLightPos.value = new THREE.Vector3(-mouseX,mouseY,400.0);
                textRightUniforms.myLightPos.value = new THREE.Vector3(-mouseX,mouseY,400.0);
                uniforms.myLightPos.value = new THREE.Vector3(mouseX,mouseY,-1);
            }
        
        }


        function onDocumentClick( event ) {

            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1; 

            // update the picking ray with the camera and mouse position    
            raycaster.setFromCamera( mouse, camera, 100 );   

            // calculate objects intersecting the picking ray
            var intersects = raycaster.intersectObjects( scene.children );

            for ( var i = 0; i < intersects.length; i++ ) {
                console.log(intersects[ i ])
                if(intersects[ i ].object.name == "textLeft" ){
                    console.log("left")
                    textLeft.geometry.computeBoundingBox();
                    boundingBox = textLeft.geometry.boundingBox;
                    clickedMesh = textLeft
                    updateLight = false;
                }   
                if(intersects[ i ].object.name == "textRight" ){
                    console.log("right")
                    textRight.geometry.computeBoundingBox();
                    boundingBox = textRight.geometry.boundingBox;
                    clickedMesh = textRight
                    updateLight = false;
                }
            
            }
            var x0 = boundingBox.min.x;
            var x1 = boundingBox.max.x;
            var y0 = boundingBox.min.y;
            var y1 = boundingBox.max.y;
            var z0 = boundingBox.min.z;
            var z1 = boundingBox.max.z;


            var bWidth = ( x0 > x1 ) ? x0 - x1 : x1 - x0;
            var bHeight = ( y0 > y1 ) ? y0 - y1 : y1 - y0;
            var bDepth = ( z0 > z1 ) ? z0 - z1 : z1 - z0;

            var centroidX = x0 + ( bWidth / 2 ) + clickedMesh.position.x;
            var centroidY = y0 + ( bHeight / 2 )+ clickedMesh.position.y;
            var centroidZ = z0 + ( bDepth / 2 ) + clickedMesh.position.z;

            centroid = { x : centroidX, y : centroidY, z : centroidZ };

            var tweenFirst = new TWEEN.Tween(camera.position)
                    .to({x: centroid.x,y: centroid.y,z: 230}, 800)
                    .easing(TWEEN.Easing.Cubic.InOut)
            var tweenSecond;


            if( mouseX > 0){
                textRightUniforms.myLightPos.value = new THREE.Vector3(-centroid.x,centroid.y,400.0);
                tweenSecond = new TWEEN.Tween(camera.position).delay(100)
                    .to({x: centroid.x,y: centroid.y+200,z: -1000}, 1000)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onComplete(function(){
                        top.location.href = 'http://github.com/Ramshackle-Jamathon';
                    })
            } else{
                textLeftUniforms.myLightPos.value = new THREE.Vector3(-centroid.x,centroid.y,400.0);
                tweenSecond = new TWEEN.Tween(camera.position).delay(100)
                    .to({x: centroid.x,y: centroid.y+200,z: -1000}, 1000)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onComplete(function(){
                        top.location.href = 'http://neverwork.in/author/ramshackle-jamathon/';
                    })
            } 
            tweenFirst.chain(tweenSecond)
            tweenFirst.start()
        }


        //

        function animate() {

            requestAnimationFrame( animate );
            render();
            TWEEN.update();
            if ( statsEnabled ) stats.update();


        }

        function render() {
            targetX = mouseX * .001;
            targetY = mouseY * .001;
            delta=clock.getDelta();
            textLeft.material.uniforms.time.value += delta;
            textRight.material.uniforms.time.value += delta;
            if ( mesh ) {
                mesh.material.uniforms.time.value += delta;

                mesh.rotation.y += 0.05 * ( targetX - mesh.rotation.y );
                mesh.rotation.x += 0.05 * ( targetY - mesh.rotation.x );

            }

            renderer.clear();

            renderer.render( scene, camera );

        }

})();
