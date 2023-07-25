#version 300 es

precision mediump float;

in mediump vec4 fColor;
in mediump vec3 fNormal;
in mediump vec3 surface_to_light;

out mediump vec4 fragColor;

void main(){

	vec3 normal = normalize(fNormal);
	vec3 surface_to_light_direction = normalize(surface_to_light);

	float light_intensity = dot(normal, surface_to_light_direction);

	fragColor = fColor;

	fragColor.rgb += light_intensity;
}