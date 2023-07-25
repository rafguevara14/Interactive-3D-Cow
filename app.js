/** @type {WebGLRenderingContext} */
var gl
var canvas;


var aspect;
console.log("Hello World");

var pointCounter = 0;
function onPointTimer(){

	pointCounter++
}

var pointTimer = setInterval(onPointTimer, 1);

const faces = flatten(get_faces()).map(function (element) { return element - 1; });


var cowNormals = []

const light_positions = [
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
const light_indices = [
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // back
    8, 9, 10, 8, 10, 11, // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23, // left
];

const vertex_array = flatten(get_vertices())

function get_cow_triangle(i) {
	var ret = vec3(vertex_array[faces[i]], vertex_array[faces[i+1]], vertex_array[faces[i+2]]) 
	return ret
}

function computeCowNormals() {

	for (var i = 6; i < faces.length; i+=6)
	{
		// get p0
		var p0 = get_cow_triangle(i-6)
		var p1 = get_cow_triangle(i-3)
		var p2 = get_cow_triangle(i)
		
		var u = subtract(p1, p0)
		var v = subtract(p2, p0)
		var n = cross(u, v)
		console.log(normalize(n))


		cowNormals.push(normalize(n))
	}
	
}


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
var spot_l = get_shape_prototype()



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

	computeCowNormals()

	console.log(faces.length/3 + " == " + cowNormals.length)

	// initialize shaders
	var program = initShaders(gl, "shaders/cow.vert", "shaders/cow.frag");
	gl.useProgram(program)

	// position buffer
	var position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(get_vertices())), gl.STATIC_DRAW);

	// normals buffer
	var normal_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(cowNormals)), gl.STATIC_DRAW);

	// index buffer
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), gl.STATIC_DRAW);

	// create vertex array object
	var vao = gl.createVertexArray()
	gl.bindVertexArray(vao)
	var posAttribLoc = gl.getAttribLocation(program, "pos")
	gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer)
	gl.enableVertexAttribArray(posAttribLoc)
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, false, 0, 0)

	var normalLocation = gl.getAttribLocation(program, "normal")
	gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer)
	gl.enableVertexAttribArray(normalLocation)
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)

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
	cow.location.normal = normalLocation
	cow.vao = vao

	cow.location.light_pos = gl.getUniformLocation(program, "light_position_world")
	cow.location.world_m = gl.getUniformLocation(program, "world_m")

	gl.uniform4fv(cow.location.color, new Float32Array([0,0,0,1]))
}

function createLightSource(){

	var light = get_shape_prototype()

	// initialize shaders
	light.program = initShaders(gl, "shaders/light.vert", "shaders/light.frag");
	gl.useProgram(light.program)

	// index buffer
	light.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, light.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(light_indices), gl.STATIC_DRAW);

	// position buffer
	light.position_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, light.position_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(light_positions)), gl.STATIC_DRAW);

	light.vao = gl.createVertexArray()
	gl.bindVertexArray(light.vao)
	light.location.position = gl.getAttribLocation(light.program, "pos")
	gl.bindBuffer(gl.ARRAY_BUFFER, light.position_buffer)
	gl.enableVertexAttribArray(light.location.position)
	gl.vertexAttribPointer(light.location.position, 3, gl.FLOAT, false, 0, 0)

	light.location.u_matrix = gl.getUniformLocation(light.program, "u_matrix")
	light.location.color = gl.getUniformLocation(light.program, "color")

	gl.uniform4fv(light.location.color, new Float32Array([1,0,0,1]))

	return light
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

	spot_l = createLightSource()
	point_l = createLightSource()

	render();
};

function matrix_vector_mult(m, v) {

	var ret = vec4()
	
	for (var i = 0; i < m.length; i++) {

		var row = m[i];

		ret[i] = row[0] * v[0] + row[1] * v[1] + row[2] * v[2] + row[3] * v[3];
	}

	return ret

}

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

	var worldview_m = inverse(modelview_m)


	/* point light position */
	var point_light_r = vec3(0.2*pointCounter, 0, 0)
	// var point_light_r = vec3(0,0,0)
	var translate_point_light = mult(
		get_euler_angle_m(point_light_r),
		translate(8, 5, 5), 
	)

	const point_light_position = matrix_vector_mult(get_euler_angle_m(point_light_r), vec4(8,5,5,1))

	// console.log(point_light_position)

	/* spot light position */
	var spot_light_r = vec3(45*Math.cos(pointCounter*0.01)-5, 45, 0)
	var translate_spot_light = mult(
		translate(0, 6, 6), 
		get_euler_angle_m(spot_light_r),
	)

	// const spot_light_position = mult(translate_spot_light, vec4())

	/* Render cow */
	gl.useProgram(cow.program);
	gl.bindVertexArray(cow.vao);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cow.indexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, cow.position_buffer);
	gl.vertexAttribPointer(cow.location.position, 3, gl.FLOAT, false, 0, 0)

	var transform_m = mult(
		translate(add(cow.prev_translation, cow.translation)), 
		get_euler_angle_m(add(cow.prev_rotation, cow.rotation)),
	)

	// set uniforms

	gl.uniformMatrix4fv(cow.location.mv, false, new Float32Array(flatten(modelview_m)))
	gl.uniformMatrix4fv(cow.location.transformation, false, new Float32Array(flatten(transform_m)))

	gl.uniformMatrix4fv(cow.location.world_m, false, new Float32Array(flatten(worldview_m)))
	gl.uniform4fv(cow.location.light_pos, new Float32Array(flatten(point_light_position)))

	// gl.drawArrays(gl.TRIANGLES, 0, get_vertices().length);
	gl.drawElements(gl.TRIANGLES, get_faces().length, gl.UNSIGNED_SHORT, 0);

	cow.prev_translation = cow.translation
	cow.prev_rotation = cow.rotation

	/* Render point light */
	gl.useProgram(point_l.program);
	gl.bindVertexArray(point_l.vao)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, point_l.indexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, point_l.position_buffer);

	gl.uniformMatrix4fv(point_l.location.u_matrix, false, new Float32Array(flatten(mult(modelview_m, translate_point_light))))

	gl.drawElements(gl.LINE_STRIP, light_indices.length, gl.UNSIGNED_SHORT, 0)

	/* Render spot light */
	gl.useProgram(spot_l.program);
	gl.bindVertexArray(spot_l.vao)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, spot_l.indexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, spot_l.position_buffer);

	gl.uniformMatrix4fv(spot_l.location.u_matrix, false, new Float32Array(flatten(mult(modelview_m, translate_spot_light))))

	gl.drawElements(gl.LINE_STRIP, light_indices.length, gl.UNSIGNED_SHORT, 0)

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

const ztranslation_step = 1
const zangular_step = 10
var stop_light_rotation = false;
document.onkeydown = (event) => {
	if (event.key == "ArrowDown")
	{
		cow.translation[2] -= ztranslation_step
		console.log(cow.translation)
	}
	else if (event.key == "ArrowUp")
	{
		cow.translation[2] += ztranslation_step
		console.log(cow.translation)
	}
	else if (event.key == "ArrowLeft")
	{
		cow.rotation[2] += zangular_step
		console.log(cow.rotation)
	}
	else if (event.key == "ArrowRight")
	{
		cow.rotation[2] -= zangular_step
		console.log(cow.rotation)
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
	else if (event.key == "p")
	{
		stop_light_rotation = !stop_light_rotation

		if (stop_light_rotation) {
			clearInterval(pointTimer)
		}
		else {
			pointTimer = setInterval(onPointTimer, 1);
		}
	}

}

document.oncontextmenu = (event) => {
    event.preventDefault();
};