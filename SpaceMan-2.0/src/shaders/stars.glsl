precision highp float;
precision highp int;



uniform float time;

uniform float starRadius;
uniform vec4 starColor;
uniform float starDensity;
uniform float speed;
uniform vec2 resolution;

uniform vec3 myLightPos;
 
const float uShininess = 2.0;        //shininess
const vec3 uLightDirection = vec3(1.0, -1.0, -1.0);  //light direction
 
const vec4 uLightAmbient = vec4(0.01,0.01,0.01,0.0);      //light ambient property
const vec4 uLightDiffuse = vec4(1.0,1.0,1.0,0.0);          //light diffuse property 
const vec4 uLightSpecular = vec4(1.0,1.0,1.0,1.0);         //light specular property
 
const vec4 uMaterialAmbient = vec4(1.0,1.0,1.0,0.0);      //object ambient property
const vec4 uMaterialDiffuse = vec4(0.2,0.2,0.2,1.0);       //object diffuse property
const vec4 uMaterialSpecular = vec4(1.0,1.0,1.0,0.0);     //object specular property


varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEyeVec;

//uniform vec3 pointLightColor[MAX_POINT_LIGHTS];
//uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];
//uniform float pointLightDistance[MAX_POINT_LIGHTS];


// NEBULA - CoffeeBreakStudios.com (CBS)
// Work in progress...
//
// 3148.26: Switched from classic to simplex noise
// 3148.27: Reduced number of stars
// 3249.0:  Switched to fast computed 3D noise. Less quality but ~ 2x faster
// 3249.5:  Removed use of random number generator to gain performance
// 3265.0:  Added rotation: glsl.heroku.com/e#3005.1


//GLSL and HLSL compatability functions
vec4 lerp(vec4 a, vec4 b, float s)
{
    return vec4(a + (b - a) * s);       
}
float lerp(float a, float b, float s)
{
    return a + (b - a) * s;       
}

//Utility functions

vec3 fade(vec3 t) {
  return vec3(1.0,1.0,1.0);//t*t*t*(t*(t*6.0-15.0)+10.0);
}

vec2 rotate(vec2 point, float rads) {
	float cs = cos(rads);
	float sn = sin(rads);
	return vec2(point.x * cs + point.x * sn, point.y * -sn + point.y * cs);
}	

vec4 randomizer4(const vec4 x)
{
    vec4 z = abs(mod(x, vec4(5612.0)));
    z = abs(mod(z, vec4(3.1415927 * 2.0)));
    return abs((cos(z) * vec4(56812.5453)) - floor(cos(z) * vec4(56812.5453)));
}

// Fast computed noise
// http://www.gamedev.net/topic/502913-fast-computed-noise/

const float A = 1.0;
const float B = 57.0;
const float C = 113.0;
const vec3 ABC = vec3(A, B, C);
const vec4 A3 = vec4(0, B, C, C+B);
const vec4 A4 = vec4(A, A+B, C+A, C+A+B);

float cnoise4(const in vec3 xx)
{
    vec3 x = abs(mod(xx + 32768.0, 65536.0));
    vec3 ix = abs(floor(x));
    vec3 fx = x - abs(floor(x));
    vec3 wx = fx*fx*(3.0-2.0*fx);
    float nn = dot(ix, ABC);

    vec4 N1 = nn + A3;
    vec4 N2 = nn + A4;
    vec4 R1 = randomizer4(N1);
    vec4 R2 = randomizer4(N2);
    vec4 R = lerp(R1, R2, wx.x);
    float re = lerp(lerp(R.x, R.y, wx.y),  lerp(R.z, R.w, wx.y), wx.z);

    return 1.0 - 2.0 * re;
}
float surface3 ( vec3 coord, float frequency ) {
	
	float n = 0.0;	
		
	n += 1.0	* abs( cnoise4( coord * frequency ) );
	n += 0.5	* abs( cnoise4( coord * frequency * 2.0 ) );
	n += 0.25	* abs( cnoise4( coord * frequency * 4.0 ) );
	n += 0.125	* abs( cnoise4( coord * frequency * 8.0 ) );
	n += 0.0625	* abs( cnoise4( coord * frequency * 16.0 ) );
	
	return n;
}
	







void main(void) {
    
    vec2 position = vUv.xy * resolution;


    gl_FragColor = vec4(0.0,0.0,0.0,0.0);

 	vec3 L = normalize(myLightPos);
	vec3 N = normalize(vNormal);

	//Lambert's cosine law
	float lambertTerm = dot(N,-L);

	//Ambient Term
	vec4 Ia = uLightAmbient * uMaterialAmbient;

	//Diffuse Term
	vec4 Id = vec4(0.0,0.0,0.0,0.3);

	//Specular Term
	vec4 Is = vec4(0.0,0.0,0.0,0.3);
	if(lambertTerm > 0.0) //only if lambertTerm is positive
	{
		Id = uLightDiffuse * uMaterialDiffuse * lambertTerm; //add diffuse term

		vec3 E = normalize(vEyeVec);
		vec3 R = reflect(L, N);
		float specular = pow( max(dot(R, E), 0.0), uShininess);

		float nebulaTime = (time) / 40.0;
		float rads = radians(nebulaTime*3.15);
		position += rotate(position, rads);


		vec3 temp = vec3(position*sin(nebulaTime*0.1), nebulaTime * 0.05);
		vec3 tempMult = vec3(temp.x * 1.0 + temp.x * .0 + temp.x * .0, temp.y * .0 + temp.y * .8 + temp.y * -.6, temp.z * .0 + temp.z * .6 + temp.z * .8);
		vec3 temp2 = vec3(position*cos(nebulaTime*0.1), nebulaTime * 0.04);
		vec3 temp2Mult = vec3(temp2.x * 1.0 + temp2.x * 0.0 + temp2.x * 0.0, temp2.y * 0.0 + temp2.y * 0.8 + temp2.y * -0.6, temp2.z * 0.0 + temp2.z * 0.6 + temp2.z * 0.8);


		float n = surface3(tempMult,0.9);
		float n2 = surface3(temp2Mult,0.8);
		float lum = length(n);
		float lum2 = length(n2);

		vec3 tc = pow(vec3(1.0-lum),vec3(sin(position.x)+cos(nebulaTime)+4.0,8.0+sin(nebulaTime)+4.0,8.0));
		vec3 tc2 = pow(vec3(1.1-lum2),vec3(5.0,position.y+cos(nebulaTime)+7.0,sin(position.x)+sin(nebulaTime)+2.0));
		vec3 curr_color = (tc*0.8) + (tc2*0.5);



		Is = vec4(curr_color, 1.0) * specular; //add specular term 
    }


	//Final color
	vec4 finalColor = Ia + Id + Is;
	//finalColor.a = 1.0;
    gl_FragColor = finalColor;


    if ( gl_FragColor.a < 0.5 ) discard;
    
}
