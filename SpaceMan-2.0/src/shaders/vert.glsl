// Set the precision for data types used in this shader
precision highp float;
precision highp int;


// Examples of variables passed from vertex to fragment shader
varying vec2 vUv;

void main() {    
    vUv = uv;
    // Since the light is on world coordinates,
    // I'll need the vertex position in world coords too
    // (or I could transform the light position to view
    // coordinates, but that would be more expensive)
    vec3 vPos = (modelMatrix * vec4(position, 1.0 )).xyz;
    // That's NOT exacly how you should transform your
    // normals but this will work fine, since my model
    // matrix is pretty basic
    gl_Position = projectionMatrix * viewMatrix *
                  vec4(vPos, 1.0);
} 