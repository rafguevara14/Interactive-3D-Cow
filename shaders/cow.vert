#version 300 es

layout(location=0) in vec3 pos;

uniform vec4 color;
uniform mat4 transformation_m;
uniform mat4 model_view_m;

out mediump vec4 fColor;

uniform vec3 light_position;
uniform mat4 world_m;

void main(){
	gl_Position = model_view_m * transformation_m * vec4(pos, 1.0);

	

	fColor = color;
}