precision highp float;
precision highp int;

varying vec4 forFragColor;
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

const vec3 lightPos = vec3(1.0, 1.0, 1.0);
const vec3 diffuseColor = vec3(0.4, 0.4, 0.4);
const vec3 specColor = vec3(1.0, 1.0, 1.0);

void main(){

    vUv = uv;
    // Since the light is on world coordinates,
    // I'll need the vertex position in world coords too
    // (or I could transform the light position to view
    // coordinates, but that would be more expensive)
    vPos = (modelMatrix * vec4(position, 1.0 )).xyz;
    // That's NOT exacly how you should transform your
    // normals but this will work fine, since my model
    // matrix is pretty basic
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix *
                  vec4(vPos, 1.0);


  // all following gemetric computations are performed in the
  // camera coordinate system (aka eye coordinates)


  vec3 lightDir = normalize(lightPos - vPos);
  vec3 reflectDir = reflect(-lightDir, vNormal);
  vec3 viewDir = normalize(-vPos);

  float lambertian = max(dot(lightDir,vNormal), 0.0);
  float specular = 0.0;
  
  if(lambertian > 0.0) {
    float specAngle = max(dot(reflectDir, viewDir), 0.0);
    specular = pow(specAngle, 4.0);

    specular *= 0.0;
  }
  
  forFragColor = vec4(lambertian*diffuseColor + specular*specColor, 1.0);
}
