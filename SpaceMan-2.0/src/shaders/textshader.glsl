// http://casual-effects.blogspot.com/2013/08/starfield-shader.html
precision highp float;
precision highp int;
#extension GL_OES_standard_derivatives : enable

#define iterations 13
#define volsteps 14
#define sparsity 0.5
#define stepsize 0.3
#define frequencyVariation   1.5

uniform vec3 color;
uniform float time;
uniform float twinkleSpeed;
uniform float speed;
uniform float brightness;
uniform float distfading;
uniform vec2 resolution;

uniform vec3 myLightPos;

const float uShininess = 0.8;        //shininess
 
const vec4 uLightAmbient = vec4(0.1,0.1,0.1,1.0);      //light ambient property
const vec4 uLightDiffuse = vec4(1.0,1.0,1.0,1.0);          //light diffuse property 
const vec4 uLightSpecular = vec4(1.0,1.0,1.0,1.0);         //light specular property
 
const vec4 uMaterialAmbient = vec4(0.0,0.0,0.0,1.0);      //object ambient property
const vec4 uMaterialDiffuse = vec4(0.2,0.2,0.2,1.0);       //object diffuse property
const vec4 uMaterialSpecular = vec4(1.0,1.0,1.0,1.0);     //object specular property


varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEyeVec;


#define PI 3.141592653589793238462643383279
void main(void) {
    
    vec2 position = vUv.xy * resolution;

    vec2 uv = vUv.xy * resolution;
    uv.x += time * speed * 0.1;

    vec3 dir = vec3(uv * 2.0, 1.0);

    gl_FragColor = vec4(0.5,0.5,0.5,1.0);

    float s = 0.1, fade = 0.01;
    vec3 starColor = vec3(0.0);
     
    for (int r = 0; r < volsteps; ++r) {
        vec3 p =  (time * speed * twinkleSpeed) + dir * (s * 0.5);
        p = abs(vec3(frequencyVariation) - mod(p, vec3(frequencyVariation * 2.0)));
 
        float prevlen = 0.0, a = 0.0;
        for (int i = 0; i < iterations; ++i) {
            p = abs(p);
            p = p * (1.0 / dot(p, p)) + (-sparsity); // the magic formula            
            float len = length(p);
            a += abs(len - prevlen); // absolute sum of average change
            prevlen = len;
        }
         
        a *= a * a; // add contrast
         
        // coloring based on distance        
        starColor += (vec3(s, s*s, s*s*s) * a * brightness + 1.0) * fade;
        fade *= distfading; // distance fading
        s += stepsize;
    }
     
    starColor = min(starColor, vec3(1.2));
 
    // Detect and suppress flickering single pixels (ignoring the huge gradients that we encounter inside bright areas)
    float intensity = min(starColor.r + starColor.g + starColor.b, 0.7);
 
    vec2 sgn = (vec2(vUv.xy)) * 2.0 - 1.0;
    vec2 gradient = vec2(dFdx(intensity) * sgn.x, dFdy(intensity) * sgn.y);
    float cutoff = max(max(gradient.x, gradient.y) - 0.1, 0.0);
    starColor *= max(1.0 - cutoff * 6.0, 0.3);


    vec3 L = normalize(myLightPos);
    vec3 N = normalize(vNormal);

    //Lambert's cosine law
    float lambertTerm = max(0.0,dot(N,L));

    //Ambient Term
    vec4 Ia = uLightAmbient * uMaterialAmbient;

    //Diffuse Term
    vec4 Id = vec4(0.0,0.0,0.0,0.3);

    //Specular Term
    vec4 Is = vec4(0.0,0.0,0.0,0.3);
    if(lambertTerm > 0.0) //only if lambertTerm is positive
    {
        Id = vec4( starColor * color, 1.0 ) * uLightDiffuse * uMaterialDiffuse * lambertTerm; //add diffuse term

        vec3 E = normalize(vEyeVec);
        vec3 R = reflect(L, N);
        float specular = pow( max(dot(R, E), 0.0), uShininess);
     
        // Motion blur; increases temporal coherence of undersampled flickering stars
        // and provides temporal filtering under true motion.  
        Is = vec4( starColor * color, 1.0 ) * specular; //add specular term 
    }


    //Final color
    vec4 finalColor = Ia + Id + Is;
    finalColor.a = 1.0;
    gl_FragColor = finalColor;


    if ( gl_FragColor.a < 0.5 ) discard;
    
}
