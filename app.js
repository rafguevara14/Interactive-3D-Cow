/** @type {WebGLRenderingContext} */
var gl
var canvas;


var aspect;
console.log("Hello World");

var pointCounter = 0;
function onPointTimer(){

	pointCounter++
	console.log(pointCounter)
}

var pointTimer = setInterval(onPointTimer, 1);

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
const point_indices = [
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // back
    8, 9, 10, 8, 10, 11, // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23, // left
  ];

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

	// gl.enable(gl.DEPTH_TEST);
	// gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

    console.log("WebGL initialized.");

}


var vao;



function get_shape_prototype(){
	return {
		program : null,
		position_buffer : null,
		vao: null,
		indexBuffer : null,
		location : {
			position : null,
			color : null,
			mv : null,
			transformation : null
		},
		translation : vec3(),
		rotation : vec3(),
		prev_translation : vec3(),
		prev_rotation : vec3()
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
	var program = initShaders(gl, "shaders/cow.vert", "shaders/cow.frag");
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
	var vao = gl.createVertexArray()
	gl.bindVertexArray(vao)
	var posAttribLoc = gl.getAttribLocation(program, "pos")
	gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer)
	gl.enableVertexAttribArray(location.position)
	gl.vertexAttribPointer(location.position, 3, gl.FLOAT, false, 0, 0)

	var transformLocation = gl.getUniformLocation(program, "transformation_m")
	var mvLocation = gl.getUniformLocation(program, "model_view_m")
	var colorLocation = gl.getUniformLocation(program, "color")

	cow.program = program
	cow.position_buffer = position_buffer
	cow.indexBuffer = indexBuffer
	cow.location.position = posAttribLoc
	cow.location.mv = mvLocation
	cow.location.transformation = transformLocation
	cow.location.color = colorLocation
	cow.vao = vao

	gl.uniform4fv(cow.location.color, new Float32Array([0,0,0,1]))
}


function createPointLight() {

	// initialize shaders
	point_l.program = initShaders(gl, "shaders/shape.vert", "shaders/shape.frag");
	gl.useProgram(point_l.program)

	// index buffer
	point_l.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, point_l.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(point_indices), gl.STATIC_DRAW);

	// position buffer
	point_l.position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(point_light_positions)), gl.STATIC_DRAW);

	point_l.vao = gl.createVertexArray()
	gl.bindVertexArray(point_l.vao)
	point_l.location.position = gl.getAttribLocation(point_l.program, "pos")
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.position_buffer)
	gl.enableVertexAttribArray(point_l.location.position)
	gl.vertexAttribPointer(point_l.location.position, 3, gl.FLOAT, false, 0, 0)

	point_l.location.transformation = gl.getUniformLocation(point_l.program, "transformation_m")
	point_l.location.mv = gl.getUniformLocation(point_l.program, "model_view_m")
	point_l.location.color = gl.getUniformLocation(point_l.program, "color")

	gl.uniform4fv(point_l.location.color, new Float32Array([1,0,0,1]))

}

function get_euler_angle_m(rotation) {

	var rotation_m = mat4()
	
	// rotate about x
	rotation_m = mult(rotation_m, rotate(rotation[1], [1, 0, 0]))
	// rotate about y
	rotation_m = mult(rotation_m, rotate(rotation[0], [0, 1, 0]))
	// rotate about z
	rotation_m = mult(rotation_m, rotate(rotation[2], [0, 0, 1]))

	return rotation_m

}

async function setup() {

    initializeContext();

	createCow()

	createPointLight()

	render();
};

async function render() {

	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	/* Compute common modelview matrix */ 
	var eye = vec3(0, 0, 30)
	var at = vec3(0, 0, 0)
	var up = vec3(0, 1, 0)
	
	var modelview_m = mult(
		perspective(50, aspect, 0, 100),
		lookAt(eye, at, up)
	)

	/* Render cow */
	gl.useProgram(cow.program);
	gl.bindVertexArray(cow.vao);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cow.indexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, cow.position_buffer);
	gl.vertexAttribPointer(cow.location.position, 3, gl.FLOAT, false, 0, 0)

	var transform_m = mult(
		get_euler_angle_m(add(cow.prev_rotation, cow.rotation)),
		translate(add(cow.prev_translation, cow.translation)), 
	)

	gl.uniformMatrix4fv(cow.location.mv, false, new Float32Array(flatten(modelview_m)))
	gl.uniformMatrix4fv(cow.location.transformation, false, new Float32Array(flatten(transform_m)))

	// gl.drawArrays(gl.TRIANGLES, 0, get_vertices().length);
	gl.drawElements(gl.TRIANGLES, get_faces().length, gl.UNSIGNED_SHORT, 0);

	cow.prev_translation = cow.translation
	cow.prev_rotation = cow.rotation


	/* Render point light */
	gl.useProgram(point_l.program);
	gl.bindVertexArray(point_l.vao)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, point_l.indexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.position_buffer);

	var light_rotation = vec3(0.2*pointCounter, 0, 0)
	var translate_light = mult(
		get_euler_angle_m(light_rotation),
		translate(8, 5, 5), 
	)

	gl.uniformMatrix4fv(point_l.location.mv, false, new Float32Array(flatten(modelview_m)))
	gl.uniformMatrix4fv(point_l.location.transformation, false, new Float32Array(flatten(translate_light)))

	gl.drawElements(gl.LINE_STRIP, point_indices.length, gl.UNSIGNED_SHORT, 0)

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
		cow.translation[0] = (event.clientX - left_mouse.init_x) / canvas.width
		cow.translation[1] = -(event.clientY - left_mouse.init_y) / canvas.height

		cow.translation[0] *= 20
		cow.translation[1] *= 20

		console.log(cow.translation)
	}

	if (right_mouse.down)
	{
		// around x
		cow.rotation[0] = (event.clientX - right_mouse.init_x) / canvas.width
		cow.rotation[1] = (event.clientY - right_mouse.init_y) / canvas.height

		cow.rotation[0] *= 90
		cow.rotation[1] *= 90

		console.log("Rotation: " + JSON.stringify(cow.rotation))
	}
}

const zstep = 0.01
document.onkeydown = (event) => {
	if (event.key == "ArrowDown")
	{
		cow.translation[2] -= zstep
		console.log(cow.translation)
	}
	else if (event.key == "ArrowUp")
	{
		cow.translation[2] += zstep
		console.log(cow.translation)
	}
	else if (event.key == "r")
	{
		cow.translation[0] = 0
		cow.translation[1] = 0
		cow.translation[2] = 0

		cow.rotation[0] = 0
		cow.rotation[1] = 0
		cow.rotation[2] = 0
	}

}

document.oncontextmenu = (event) => {
    event.preventDefault();
};