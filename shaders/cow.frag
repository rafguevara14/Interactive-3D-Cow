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

const float Ka = 0.1;
const float Kd = 0.3;
const float Ks = 0.1;
const float alpha = 2.0;

const float pointLa = 0.3;
const float pointLd = 0.8;
const float pointLs = 1.0;

const float spotLa = 2.0;
const float spotLd = 0.3;
const float spotLs = 0.0;

float get_inverse_square(float dist)
{
	// https://www.desmos.com/calculator/uvkkt95vzp
	float a = 0.126;
	float b = -10.0;
	float c = 120.0;
	float k = 133.0;
	
	float quadratic = (a * pow(dist, 2.0)) - (b * dist) + c;
	return k * pow(quadratic, -1.0);
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

		spot_intensity = 1.0 - ((1.0 - spot_dot_direction) / (1.0 - spot_limit));

		spotAmbient = Ka * spotLa*spot_intensity;
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
	float pointSpecular = pointFatt * Ks * pointLs * pow(point_angle, alpha) * point_intensity;

	float spotDiffuse = spotFatt * Kd * spotLd * spot_intensity;
	float spotSpecular = spotFatt * Ks * spotLs * pow(spot_angle, alpha) * spot_intensity;

	float spotLight = spotAmbient+spotDiffuse+spotSpecular;
	float pointLight = pointAmbient+pointDiffuse+pointSpecular;

	fragColor.rgb += pointLight+spotLight;
}