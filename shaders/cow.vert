#version 300 es

layout(location=0) in vec3 pos;
layout(location=1) in vec3 normal;

uniform vec4 color;
uniform mat4 transformation_m;
uniform mat4 model_view_m;

out mediump vec4 fColor;
out mediump vec3 surface_to_pointl;
out mediump vec3 surface_to_spotl;
out mediump vec3 fNormal;
out mediump vec3 surface_to_eye;

uniform vec4 pointl_position_world;
uniform vec4 spotl_position_world;
uniform mat4 world_m;

uniform vec3 eye_position;

void main(){

	vec4 final_pos = transformation_m * vec4(pos, 1.0);

	surface_to_pointl = pointl_position_world.xyz - final_pos.xyz;
	
	surface_to_spotl = spotl_position_world.xyz - final_pos.xyz;

	surface_to_eye = eye_position - final_pos.xyz;

	fNormal = mat3(transformation_m) * normal;
	
	gl_Position = model_view_m * final_pos;

	fColor = color;
}