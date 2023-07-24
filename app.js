/** @type {WebGLRenderingContext} */
var gl
var canvas;


var aspect;
console.log("Hello World");

const point_light_positions = [
	// Front face
	vec3(-1.0, -1.0, 1.0),
	vec3(1.0, -1.0, 1.0),
	vec3(1.0, 1.0, 1.0),
	vec3(-1.0, 1.0, 1.0),

	// Back face
	vec3(-1.0, -1.0, -1.0),
	vec3( -1.0, 1.0, -1.0),
	vec3( 1.0, 1.0, -1.0),
	vec3( 1.0, -1.0, -1.0),

	// Top face
	vec3(-1.0, 1.0, -1.0),
	vec3( -1.0, 1.0, 1.0),
	vec3( 1.0, 1.0, 1.0),
	vec3( 1.0, 1.0, -1.0),

	// Bottom face
	vec3(-1.0, -1.0, -1.0),
	vec3( 1.0, -1.0, -1.0),
	vec3( 1.0, -1.0, 1.0),
	vec3( -1.0, -1.0, 1.0),

	// Right face
	vec3(1.0, -1.0, -1.0),
	vec3( 1.0, 1.0, -1.0),
	vec3( 1.0, 1.0, 1.0),
	vec3( 1.0, -1.0, 1.0),

	// Left face
	vec3(-1.0, -1.0, -1.0),
	vec3( -1.0, -1.0, 1.0),
	vec3( -1.0, 1.0, 1.0),
	vec3( -1.0, 1.0, -1.0),
]

const point_light_colors = Array(point_light_positions.length).fill(vec4(1,1,1,0))

function initializeContext(){
	canvas = document.getElementById("myCanvas");
	gl = canvas.getContext("webgl2");

	const pixelRatio = window.devicePixelRatio || 1;

    // using clientWidth and clientHeight
    canvas.width = pixelRatio * canvas.clientWidth;
    canvas.height = pixelRatio * canvas.clientHeight;

	   
	aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.lineWidth(1.0);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

    console.log("WebGL initialized.");

}


var vao;



function get_shape_prototype(){
	return {
		program : null,
		position_buffer : null,
		color_buffer : null,
		vao: null,
		indexBuffer : null,
		location : {
			position : null,
			color : null,
			mv : null,
			transformation : null
		},
		translation : {
			x: 0, y: 0, z: 0
		},
		rotation : {
			x: 0, y: 0, z: 0
		}
	}
}

var cow = get_shape_prototype()
var point_l = get_shape_prototype()



var right_mouse = {
	down: false,
	init_x: 0,
	init_y: 0
}

var left_mouse = {
	down: false,
	init_x: 0,
	init_y: 0
}


function createCow() {

	// initialize shaders
	var program = initShaders(gl, "shaders/shape.vert", "shaders/shape.frag");
	gl.useProgram(program)

	// position buffer
	var position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(get_vertices())), gl.STATIC_DRAW);

	// index buffer
	var faces = get_faces();
	faces = flatten(faces).map(function (element) { return element - 1; });

	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);

	// create vertex array object
	var posAttribLoc = gl.getAttribLocation(program, "pos")
	gl.enableVertexAttribArray(posAttribLoc)
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, false, 0, 0)

	var transformLocation = gl.getUniformLocation(program, "transformation_m")
	var mvLocation = gl.getUniformLocation(program, "model_view_m")

	cow.program = program
	cow.position_buffer = position_buffer
	cow.indexBuffer = indexBuffer
	cow.location.position = posAttribLoc
	cow.location.mv = mvLocation
	cow.location.transformation = transformLocation
}


function createPointLight() {

	// initialize shaders
	point_l.program = initShaders(gl, "shaders/shape.vert", "shaders/shape.frag");
	gl.useProgram(point_l.program)

	// position buffer
	point_l.position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(point_light_positions)), gl.STATIC_DRAW);

	// color buffer
	point_l.color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(point_light_colors)), gl.STATIC_DRAW);

	point_l.vao = gl.createVertexArray()
	gl.bindVertexArray(point_l.vao)
	point_l.location.position = gl.getAttribLocation(point_l.program, "pos")
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.position_buffer)
	gl.enableVertexAttribArray(point_l.location.position)
	gl.vertexAttribPointer(point_l.location.position, 3, gl.FLOAT, false, 0, 0)

	point_l.location.color = gl.getAttribLocation(point_l.program, "color")
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.color_buffer)
	gl.enableVertexAttribArray(point_l.location.color)
	gl.vertexAttribPointer(point_l.location.color, 4, gl.FLOAT, false, 0, 0)

	point_l.location.transformation = gl.getUniformLocation(point_l.program, "transformation_m")
	point_l.location.mv = gl.getUniformLocation(point_l.program, "model_view_m")
}

function get_euler_angle_m(rotation) {

	var rotation_m = mat4()
	
	// rotate about x
	rotation_m = mult(rotation_m, rotate(rotation.y, [1, 0, 0]))
	// rotate about y
	rotation_m = mult(rotation_m, rotate(rotation.x, [0, 1, 0]))
	// rotate about z
	rotation_m = mult(rotation_m, rotate(rotation.z, [0, 0, 1]))

	return rotation_m

}

async function setup() {

    initializeContext();

	// createCow()

	createPointLight()

	render();
};

async function render() {

	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	/* Compute common modelview matrix */ 
	var eye = vec3(0, 0, 77)
	var at = vec3(0, 0, 0)
	var up = vec3(0, 1, 0)
	
	var modelview_m = mult(
		perspective(10, aspect, -10, 50),
		lookAt(eye, at, up)
	)

	/* Render cow */
	// gl.useProgram(cow.program);
	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cow.indexBuffer);
	// gl.bindBuffer(gl.ARRAY_BUFFER, cow.position_buffer);
	// gl.vertexAttribPointer(cow.location.position, 3, gl.FLOAT, false, 0, 0)

	

	// var transform_m = mult(
	// 	translate(cow.translation.x, cow.translation.y, cow.translation.z), 
	// 	get_euler_angle_m(cow.rotation)
	// )

	// gl.uniformMatrix4fv(cow.location.mv, false, new Float32Array(flatten(modelview_m)))
	// gl.uniformMatrix4fv(cow.location.transformation, false, new Float32Array(flatten(transform_m)))

	// // gl.drawArrays(gl.TRIANGLES, 0, get_vertices().length);
	// gl.drawElements(gl.TRIANGLES, get_faces().length, gl.UNSIGNED_SHORT, 0);


	/* Render point light */
	gl.useProgram(point_l.program);
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.position_buffer);
	gl.enableVertexAttribArray(point_l.location.position)
	gl.bindVertexArray(point_l.vao)

	var translate_light = mult(
		translate(cow.translation.x, cow.translation.y, cow.translation.z), 
		get_euler_angle_m(cow.rotation)
	)
	gl.uniformMatrix4fv(point_l.location.mv, false, new Float32Array(flatten(modelview_m)))
	gl.uniformMatrix4fv(point_l.location.transformation, false, new Float32Array(flatten(translate_light)))

	gl.drawArrays(gl.TRIANGLES, 0, point_light_positions.length)

	requestAnimationFrame(render);
}
window.onload = setup

document.onmousedown = (event) => {
	if (event.button == 0)
	{
		left_mouse.down = true
		
		left_mouse.init_x = event.clientX 
		left_mouse.init_y = event.clientY
	}
	else if (event.button == 2)
	{
		right_mouse.down = true
		
		right_mouse.init_x = event.clientX 
		right_mouse.init_y = event.clientY
	}
}

document.onmouseup = (event) => {
	if (event.button == 0)
	{
		left_mouse.down = false
	}
	else if (event.button == 2)
	{
		right_mouse.down = false
	}
}

document.onmousemove = (event) => {

	if (left_mouse.down)
	{
		cow.translation.x = (event.clientX - left_mouse.init_x) / canvas.width
		cow.translation.y = -(event.clientY - left_mouse.init_y) / canvas.height

		cow.translation.x *= 20
		cow.translation.y *= 20

		console.log(cow.translation)
	}

	if (right_mouse.down)
	{
		// around x
		cow.rotation.x = (event.clientX - right_mouse.init_x) / canvas.width
		cow.rotation.y = (event.clientY - right_mouse.init_y) / canvas.height

		cow.rotation.x *= 90
		cow.rotation.y *= 90

		console.log("Rotation: " + JSON.stringify(cow.rotation))
	}
}

const zstep = 0.01
document.onkeydown = (event) => {
	if (event.key == "ArrowDown")
	{
		cow.translation.z -= zstep
		console.log(cow.translation)
	}
	else if (event.key == "ArrowUp")
	{
		cow.translation.z += zstep
		console.log(cow.translation)
	}
	else if (event.key == "r")
	{
		cow.translation.x = 0
		cow.translation.y = 0
		cow.translation.z = 0

		cow.rotation.x = 0
		cow.rotation.y = 0
		cow.rotation.z = 0
	}

}

// document.oncontextmenu = (event) => {
//     event.preventDefault();
// };