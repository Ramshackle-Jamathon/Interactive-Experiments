precision highp float;
precision highp int;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEyeVec;
uniform float morphTargetInfluences[ 2 ];

void main(){

    vUv = uv;


    vec3 morphed = vec3( 0.0 , 0.0 , 0.0 );
    morphed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];
    morphed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];
    morphed += position;

    // Since the light is on world coordinates,
    // I'll need the vertex position in world coords too
    // (or I could transform the light position to view
    // coordinates, but that would be more expensive)
    vec3 vPos = (modelMatrix * vec4(morphed, 1.0 )).xyz;
    vEyeVec = -vec3(vPos);
    // That's NOT exacly how you should transform your
    // normals but this will work fine, since my model
    // matrix is pretty basic



    vNormal = normalMatrix * vec3(normal);
    gl_Position = projectionMatrix * viewMatrix *
                  vec4(vPos, 1.0);
} 
