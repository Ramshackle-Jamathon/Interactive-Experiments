uniform float iGlobalTime;
uniform vec2 iResolution;
uniform vec3 iCamPosition;
uniform vec3 iCamDir;
uniform vec3 iCamUp;

varying vec2 vUv;

float f(float x, float z)
{
	return sin(x) * sin(z);
}


vec3 getNormal( vec3 p )
{
	const float eps = 0.0005;
    vec3 n = vec3( f(p.x-eps,p.z) - f(p.x+eps,p.z),
                         2.0*eps,
                         f(p.x,p.z-eps) - f(p.x,p.z+eps) );
    return normalize( n );
}

vec3 getShading( vec3 p, vec3 n )
{
    return mix( vec3(0.2, 0.2, 0.2), vec3(0.25, 0.2, 0.15), vec3(0.9,0.9,0.9) );
}

vec3 getMaterial( vec3 p, vec3 n )
{
    return mix( vec3(0.2, 0.2, 0.2), vec3(0.25, 0.2, 0.15), vec3(0.9,0.9,0.9) );
}

vec3 applyFog( vec3 p, float t )
{
    return mix( vec3(0.2, 0.2, 0.2), vec3(0.25, 0.2, 0.15), vec3(0.9,0.9,0.9) );
}

vec3 terrainColor( vec3 ro, vec3 rd , float t )
{
    vec3 p = ro + rd * t;
    vec3 n = getNormal( p );
    vec3 s = mix( vec3(0.2, 0.2, 0.2), vec3(0.25, 0.2, 0.15), vec3(0.9,0.9,0.9) );
    vec3 m = mix( vec3(0.2, 0.2, 0.2), vec3(0.25, 0.2, 0.15), vec3(0.9,0.9,0.9) );
    return applyFog( m * s, t );
}
  
float castRay(  vec3 ro, vec3 rd )
{
    const float delt = 0.01;
    const float mint = 0.001;
    const float maxt = 10.0;
    float lh = 0.0;
    float ly = 0.0;
    float resT
    for( float t = mint; t < maxt; t += delt )
    {
        vec3  p = ro + rd*t;
        float h = f( p.x, p.z );
        if( p.y < h )
        {
            // interpolate the intersection distance
            resT = t - dt + dt*(lh-ly)/(p.y-ly-h+lh);
            break;
        }
        // allow the error to be proportinal to the distance
        delt = 0.01 * t;
        lh = h;
        ly = p.y;
    }
    return resT;
}
	
vec3 render( vec3 ro, vec3 rd ) {
	float m = castRay( ro, rd )
    if( m )
    {
        return terrainColor( ro, rd, m );
    }
    else
    {
        return skyColor();
    }
}

void main() {

    vec2 pos =(-1.0 + 2.0 *vUv);
	pos.x *= iResolution.x / iResolution.y; // correct for aspect ratio

	// camera
	vec3 cPos = vec3(iCamPosition.x,iCamPosition.y,iCamPosition.z);
	cPos.y = max(cPos.y, terrain(cPos.xz, 1) + 0.5);
	vec3 cUp  = vec3(iCamUp.x,iCamUp.y,iCamUp.z);
    vec3 cLook = cPos+vec3(iCamDir.x,iCamDir.y,iCamDir.z);
	
	// camera matrix
	vec3 ww = normalize( cLook-cPos );
	vec3 uu = normalize( cross(ww, cUp) );
	vec3 vv = normalize( cross(uu, ww) );
	
	vec3 rd = normalize( pos.x*uu + pos.y*vv + 2.0*ww );
	
	// render
	vec3 color = render(cPos, rd);
	
	gl_FragColor = vec4( color, 1.0 );
}