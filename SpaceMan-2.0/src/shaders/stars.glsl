precision highp float;
precision highp int;

uniform float time;

uniform float starRadius;
uniform vec3 starColor;
uniform float starDensity;
uniform float speed;
uniform vec2 resolution;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
varying vec4 forFragColor;

uniform vec3 pointLightColor[MAX_POINT_LIGHTS];
uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];
uniform float pointLightDistance[MAX_POINT_LIGHTS];


float starrand(float seedx, float seedy, int seedp) {
    return 0.05 + 0.9 * fract(
        sin(float(seedp) * 437.234) * 374.2542 -
        cos(seedx * 432.252) * 23.643 +
        sin(seedy * 73.2454) * 372.23455
    );
}

void main(void) {
    
    vec2 position = vUv.xy * vPos.xy;


    // Pretty basic lambertian lighting...
    gl_FragColor = vec4(0.0,0.0,0.0,1.0);
    //gl_FragColor = forFragColor;

    
    for ( int p = 0; p < 20; p++ ) {
        float scale = ( 1.0 / starRadius ) + float( p );
        vec2 vpos = position * scale;
        vpos.x += ( time * speed ) / scale;
        vpos.y += speed * time / scale;
        vec2 spos = vec2(
            starrand(floor(vpos.x), floor(vpos.y), p),
            starrand(10.5 + floor(vpos.x), 10.5 + floor(vpos.y), p)
        );
        float px = scale / 80.0 / 3.0;
        float size = 1.0 / (scale * ( 500.0 / starDensity ) );
        float brite = 1.0;
        
        if( size < px ) {
            brite = size / px;
            size = px;
        }
        
        gl_FragColor.rgb += starColor * min(
            1.0, max(0.0, starDensity - length(spos - fract(vpos)) / size)
        ) * brite;
    }
    
}
