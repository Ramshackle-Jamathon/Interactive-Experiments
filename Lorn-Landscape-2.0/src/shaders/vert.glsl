//Bare bones vertex shader

precision highp float;
precision highp int;

varying vec2 vUv;
void main()
{

	vUv = uv;

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;


}