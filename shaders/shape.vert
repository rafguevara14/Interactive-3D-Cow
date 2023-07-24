#version 300 es

layout(location=0) in vec3 pos;
layout(location=1) in vec4 color;

out mediump vec4 fColor;
uniform mat4 transformation_m;
uniform mat4 model_view_m;
void main(){
	gl_Position = model_view_m * transformation_m * vec4(pos, 1.0);

	fColor = color;
}