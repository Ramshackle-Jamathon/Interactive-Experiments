uniform float iGlobalTime;
uniform vec2 iResolution;
uniform vec3 iCamPosition;
uniform vec3 iCamDir;
uniform vec3 iCamUp;

varying vec2 vUv;
#ifdef GL_ES
	precision mediump float;
#endif

const float dMax = 28.0;

// Simple noise algorithm contributed by Trisomie21 (Thanks!)
float snoise( vec2 p ) {
	vec2 f = fract(p);
	p = floor(p);
	float v = p.x+p.y*1000.0;
	vec4 r = vec4(v, v+1.0, v+1000.0, v+1001.0);
	r = fract(100000.0*sin(r*.001));
	f = f*f*(3.0-2.0*f);
	return 2.0*(mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y))-1.0;
}

float terrain( vec2 p, int octaves ) {	
/*	float h = 0.0; // height
	float w = 0.5; // octave weight
	float m = 0.4; // octave multiplier
	for (int i=0; i<16; i++) {
		if (i<octaves) {
			h += w * snoise((p * m));
		}
		else break;
		w *= 0.5;
		m *= 2.0;
	}*/
	return sin(p.x) * sin(p.y);
}

vec2 map( vec3 p, int octaves ) {
	
	float dMin = dMax; // nearest intersection
	float d; // depth
	float mID = -1.0; // material ID
	
	// terrain
	float h = terrain(p.xz, octaves);
	h += smoothstep(-0.3, 1.5, h); // exaggerate the higher terrain
	h *= smoothstep(-1.5, -0.3, h); // smooth out the lower terrain
	d = p.y - h;	
	if (d<dMin) { 
		dMin = d;
		mID = 0.0;
	}
	
	// trees
	if (h<0.0) { // no need to check for trees at higher elevations
		float f = terrain(p.xz*15.0, octaves);
		f = (0.1*f) - 0.3; // limit the altitude of the trees
		d = p.y - f;
		if (d<dMin) { 
			dMin = d;
			mID = 1.0;
		}
	}	

	return vec2(dMin, mID);
}

vec2 castRay( vec3 ro, vec3 rd, int octaves) {
	const float p = 0.00001; // precision
	float t = 0.0; // distance
	float h = p * 2.0; // step
	float m = -1.0;
	for (int i=0; i<50; i++) {
		if (abs(h)>p || t<dMax ) {
			t += h; // next step
			vec2 res = map(ro + rd*t, octaves); // get intersection
			h = res.x; // get distance
			m = res.y; // get material
		} 
		else break;
	}
	if (t>dMax) m = -1.0; // if no intersection, material ID is -1.0;
	return vec2(t, m);
}

vec3 calcNormal(vec3 p) {
	const vec3 eps = vec3(0.0005, 0.0, 0.0);
	return normalize( vec3(p.x - (p-eps.xyy).x,
			       (p+eps.yxy).x - (p-eps.yxy).x,
			       (p+eps.yyx).x - (p-eps.yyx).x) );
}

float shadows( vec3 ro, vec3 rd, float tMax, float k, int octaves ) {
    float res = 1.0;
	float t = 0.001;
	for(int i=0; i<5; i++) {
        if (t<tMax) {
			float h = map(ro + rd*t, octaves).x;
        	res = min( res, k*h/t );
        	t += h;
		}
		else break;
    }
    return clamp(res, 0.0, 1.0);
}

vec3 render( vec3 ro, vec3 rd ) {
	const int geoLOD = 4;
	
	vec3 color = vec3(0.5,0.5,0.5); // base color is fog color
	vec2 res = castRay(ro, rd, geoLOD);
	
	vec3 lPos = normalize( vec3(0.5, 0.5, 0.5) ); // light position
	vec3 lCol = vec3(1.0, 0.9, 0.8); // yellowish light
	
	// mat -1 = background/sky
	if (res.y < -0.5) {
		float sun = clamp(dot(rd,lPos),0.0,1.0);
		color += 0.2 * lCol * sun*sun;
		return color;
	}
	
	int norLOD = int(max(2.0, 12.0-11.0*res.x/dMax));
	
	vec3 pos = ro + rd*res.x; // terrain pos
	vec3 nor = calcNormal(pos); // terrain normals
	
	// mat 0 = terrain
	if (res.y>-0.5&&res.y<0.5) {
		
		// base rock colors
		color = mix( vec3(0.2, 0.2, 0.2), vec3(0.2, 0.2, 0.2), vec3(0.2, 0.2, 0.2) );
		
		// add in lighting and shadows
		float lAmb = clamp( 0.5 + 0.5 * nor.y, 0.0, 1.0); // ambient
		float lDif = clamp( dot( nor, lPos ), 0.0, 2.0); // diffuse
		
		// shadow octaves should match geometry octaves used in initial ray cast
		if (lDif>0.05) lDif *= shadows(pos, lPos, 1.0, 1.0, geoLOD);
		
		color += (0.2*lAmb) * lCol;
		color *= (1.2*lDif) * lCol;	
	}
	//.mat 1 = trees
	if (res.y>0.5) {
		color = mix( vec3(0.1, 0.1, 0.1), vec3(0.1, 0.1, 0.1), vec3(0.1, 0.1, 0.1) );
		
		// add in lighting and shadows
		float lAmb = clamp( 0.5 + 0.5 * nor.y, 0.0, 1.0); // ambient
		float lDif = clamp( dot( nor, lPos ), 0.0, 2.0); // diffuse
		
		// shadow octaves should match geometry octaves used in initial ray cast
		if (lDif>0.05) lDif *= shadows(pos, lPos, 1.0, 1.0, geoLOD);
		
		color += (0.2*lAmb) * lCol;
		color *= (1.2*lDif) * lCol;
	}
	
	// fog
	float n = smoothstep(-1.2, -0.2, terrain(pos.xz, 3)); // valley fog
	float fog = exp(-0.01 * res.x*res.x); // exponentioal fog equation
	color = mix(vec3(0.5,0.5,0.5), color, n*fog); // add fog in valleys and distance
		
	return color;
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