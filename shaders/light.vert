#version 300 es

layout(location=0) in vec3 pos;

uniform vec4 color;
uniform mat4 u_matrix;

out mediump vec4 fColor;

void main(){
	gl_Position =  u_matrix * vec4(pos, 1.0);

	fColor = color;
}