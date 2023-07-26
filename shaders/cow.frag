#version 300 es

precision mediump float;

in mediump vec4 fColor;
in mediump vec3 fNormal;
in mediump vec3 surface_to_pointl;
in mediump vec3 surface_to_spotl;
in mediump vec3 surface_to_eye;

out mediump vec4 fragColor;

uniform vec3 spot_direction;
uniform float spot_limit;

uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float alpha;

uniform float spotLa;
uniform float pointLa;
uniform float spotLd;
uniform float pointLd;
uniform float spotLs;
uniform float pointLs;

float get_inverse_square(float dist)
{
	// https://www.desmos.com/calculator/uvkkt95vzp
	float a = 0.126;
	float b = -10.0;
	float c = 120.0;
	float k = 133.0;
	
	float quadratic = (a * pow(dist, 2.0)) - (b * dist) + c;
	// return k * pow(quadratic, -1.0);
	return 1.0;
}

void main(){

	vec3 normal = normalize(fNormal);
	vec3 surface_to_pointl_direction = normalize(surface_to_pointl);
	vec3 surface_to_spotl_direction = normalize(surface_to_spotl);
	
	float point_intensity = dot(normal, surface_to_pointl_direction);

	float spot_dot_direction = dot(surface_to_spotl_direction, spot_direction);

	float spot_intensity = 0.0;
	float spotAmbient = 0.0;
	if (spot_dot_direction >= spot_limit)
	{
		spot_intensity = dot(normal, surface_to_spotl_direction);

		spotAmbient = Ka * spotLa;
	}
	
	float spot_distance = abs(length(surface_to_spotl));
	float point_distance = abs(length(surface_to_pointl));


	float pointFatt = min(get_inverse_square(point_distance), 1.0);
	float spotFatt = min((get_inverse_square(spot_distance)), 1.0);
 
	fragColor = fColor;

	vec3 spot_reflection = normalize(reflect(surface_to_spotl_direction, normal));
	float spot_angle = dot(spot_reflection, surface_to_eye);

	vec3 point_reflection = normalize(reflect(surface_to_pointl_direction, normal));
	float point_angle = dot(point_reflection, surface_to_eye);

	float pointAmbient = Ka * pointLa;
	float pointDiffuse = pointFatt * Kd * pointLd * point_intensity;
	float pointSpecular = Ks * pointLs * pow(cos(point_angle), alpha) * point_intensity;

	float spotDiffuse = spotFatt * Kd * spotLd * spot_intensity;
	float spotSpecular = Ks * spotLs * pow(cos(spot_angle), alpha) * spot_intensity;

	float spotLight = spotAmbient+spotDiffuse+spotSpecular;
	float pointLight = pointAmbient+pointDiffuse+pointSpecular;
	fragColor.rgb +=  pointLight;
}