(function(){
    var THREE = require('./lib/three');


    require('./lib/ShaderSkin');
    require('./lib/BleachBypassShader');
    require('./lib/ConvolutionShader');
    require('./lib/CopyShader');

    require('./lib/EffectComposer');
    require('./lib/MaskPass');
    require('./lib/TexturePass');
    require('./lib/BloomPass');
    require('./lib/RenderPass');
    require('./lib/ShaderPass');

    var Detector = require('./lib/Detector');

    var dat = require('./lib/dat.gui');
    var Stats = require('./lib/Stats');

    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

        var statsEnabled = true;

        var container, stats, loader;

        var camera, scene, renderer;

        var mesh;

        var composer, composerUV1, composerUV2, composerUV3, composerBeckmann;

        var directionalLight, pointLight, ambientLight;

        var mouseX = 0, mouseY = 0;
        var targetX = 0, targetY = 0;

        var windowHalfX = window.innerWidth / 2;
        var windowHalfY = window.innerHeight / 2;

        var firstPass = true;

        init();
        animate();

        function init() {

            container = document.createElement( 'div' );
            document.body.appendChild( container );

            camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 10000 );
            camera.position.z = 900;

            scene = new THREE.Scene();

            // LIGHTS

            directionalLight = new THREE.DirectionalLight( 0xffeedd, 1.5 );
            directionalLight.position.set( 1, 0.5, 1 );
            scene.add( directionalLight );

            directionalLight = new THREE.DirectionalLight( 0xddddff, 0.5 );
            directionalLight.position.set( -1, 0.5, -1 );
            scene.add( directionalLight );

            // MATERIALS

            var diffuse = 0xbbbbbb, specular = 0x070707, shininess = 50;

            specular = 0x555555;

            var shader = THREE.ShaderSkin[ "skin" ];

            var uniformsUV = THREE.UniformsUtils.clone( shader.uniforms );

            uniformsUV[ "tNormal" ].value = THREE.ImageUtils.loadTexture( "textures/MAP-SPEC.jpg" );
            

            uniformsUV[ "uNormalScale" ].value = -1.5;

            //uniformsUV[ "tDiffuse" ].value = THREE.ImageUtils.loadTexture( "textures/Map-COL.jpg" );

            uniformsUV[ "passID" ].value = 0;

            uniformsUV[ "diffuse" ].value.setHex( diffuse );
            uniformsUV[ "specular" ].value.setHex( specular );

            uniformsUV[ "uRoughness" ].value = 0.185;
            uniformsUV[ "uSpecularBrightness" ].value = 0.7;


            var uniforms = THREE.UniformsUtils.clone( uniformsUV );
            uniforms[ "tDiffuse" ].value = uniformsUV[ "tDiffuse" ].value;
            uniforms[ "tNormal" ].value = uniformsUV[ "tNormal" ].value;
            uniforms[ "passID" ].value = 1;


            var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, derivatives: true };
            var parametersUV = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShaderUV, uniforms: uniformsUV, lights: true, derivatives: true };

            material = new THREE.ShaderMaterial( parameters );
            var materialUV = new THREE.ShaderMaterial( parametersUV );

            // LOADER

            loader = new THREE.JSONLoader();
            loader.load(  "textures/LeePerrySmith.js", function( geometry ) { createScene( geometry, 100, material ) } );

            // RENDERER

            renderer = new THREE.WebGLRenderer( { antialias: false } );
            renderer.setClearColor( 0x050505 );
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

            // POSTPROCESSING

            var renderModelUV = new THREE.RenderPass( scene, camera, materialUV, new THREE.Color( 0x575757 ) );

            var effectCopy = new THREE.ShaderPass( THREE.CopyShader );

            var effectBloom1 = new THREE.BloomPass( 1, 15, 2, 512 );
            var effectBloom2 = new THREE.BloomPass( 1, 25, 3, 512 );
            var effectBloom3 = new THREE.BloomPass( 1, 25, 4, 512 );

            effectBloom1.clear = true;
            effectBloom2.clear = true;
            effectBloom3.clear = true;

            effectCopy.renderToScreen = true;

            //

            var pars = {
                minFilter: THREE.LinearMipmapLinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat,
                stencilBuffer: false
            };

            var rtwidth = 512;
            var rtheight = 512;

            //

            composerScene = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );
            composerScene.addPass( renderModelUV );

            renderScene = new THREE.TexturePass( composerScene.renderTarget2 );

            //

            composerUV1 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );

            composerUV1.addPass( renderScene );
            composerUV1.addPass( effectBloom1 );

            composerUV2 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );

            composerUV2.addPass( renderScene );
            composerUV2.addPass( effectBloom2 );

            composerUV3 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );

            composerUV3.addPass( renderScene );
            composerUV3.addPass( effectBloom3 );

            //

            var effectBeckmann = new THREE.ShaderPass( THREE.ShaderSkin[ "beckmann" ] );
            composerBeckmann = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );
            composerBeckmann.addPass( effectBeckmann );

            //

            uniforms[ "tBlur1" ].value = composerScene.renderTarget2;
            uniforms[ "tBlur2" ].value = composerUV1.renderTarget2;
            uniforms[ "tBlur3" ].value = composerUV2.renderTarget2;
            uniforms[ "tBlur4" ].value = composerUV3.renderTarget2;

            uniforms[ "tBeckmann" ].value = composerBeckmann.renderTarget1;

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
            mesh.position.y = - 50;
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

            if ( mesh ) {

                mesh.rotation.y += 0.05 * ( targetX - mesh.rotation.y );
                mesh.rotation.x += 0.05 * ( targetY - mesh.rotation.x );

            }

            renderer.clear();

            if ( firstPass ) {

                composerBeckmann.render();
                firstPass = false;

            }

            composerScene.render();

            composerUV1.render();
            composerUV2.render();
            composerUV3.render();

            renderer.render( scene, camera );

        }




})();
