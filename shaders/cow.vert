#version 300 es

layout(location=0) in vec3 pos;
layout(location=1) in vec3 normal;

uniform vec4 color;
uniform mat4 transformation_m;
uniform mat4 model_view_m;

out mediump vec4 fColor;
out mediump vec3 surface_to_light;
out mediump vec3 fNormal;

uniform vec4 light_position_world;
uniform mat4 world_m;

void main(){

	vec3 world_position = (world_m * vec4(pos, 1.0)).xyz;
	surface_to_light = light_position_world.xyz - world_position;

	fNormal = mat3(world_m) * normal;
	
	gl_Position = model_view_m * transformation_m * vec4(pos, 1.0);

	fColor = color;
}