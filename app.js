/** @type {WebGLRenderingContext} */
var gl
var canvas;

const degree_limit = 30

var aspect;
console.log("Hello World");

var pointCounter = 0;
const onPointTimer = ()=>pointCounter++
var pointTimer = setInterval(onPointTimer, 1);

var spotCounter = 0;
const onSpotTimer = ()=>spotCounter++
var spotTimer = setInterval(onSpotTimer, 1);

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
const vertices = get_vertices()

function get_cow_triangle(i) {
	var ret = vec3(vertices[faces[i]], vertices[faces[i+1]], vertices[faces[i+2]]) 
	return ret
}

function computeCowNormals() {



	cowNormals = []

	var cowNormalsList = Array(vertex_array.length).fill([])

	for (var i = 0; i < faces.length-2; i++) {

		var p0 = vertices[faces[i]]
		var p1 = vertices[faces[i+1]]
		var p2 = vertices[faces[i+2]]

		var u = subtract(p1, p0)
		var v = subtract(p2, p0)
		var n = cross(u, v)

		cowNormalsList[faces[i]].push(n)
		cowNormalsList[faces[i+1]].push(n) 
		cowNormalsList[faces[i+2]].push(n)
	}

	for (var i = 0; i < faces.length-2; i++) {

		var index = faces[i]

		var normals_list = cowNormalsList[index]

		cowNormals[index] = vec3() 

		for (var j = 0; j < normals_list.length; j++ )
		{
			cowNormals[index] = add(cowNormals[index], normals_list[j])
		}

		cowNormals[index] = scale(1/normals_list.length, cowNormals[index])
	}


	// const vertices = get_vertices()

	// cowNormals = Array(vertices.length).fill(vec3())

	// for (var i = 0; i < vertices.length-2; i++) {

	// 	var i0 = i;
	// 	var i1 = i+1;
	// 	var i2 = i+2;

	// 	var p0 = vertices[i0]
	// 	var p1 = vertices[i1]
	// 	var p2 = vertices[i2]

	// 	var u = subtract(p1, p0)
	// 	var v = subtract(p2, p0)
	// 	var n = cross(u, v)

	// 	// console.log(cowNormals[i0])
	// 	console.log(n)
	// 	add(cowNormals[i0], n)
	// 	add(cowNormals[i1], n)
	// 	add(cowNormals[i2], n)

	// 	console.log(cowNormals[i0], n)
	// 	console.log(cowNormals[i1], n)
	// 	console.log(cowNormals[i2], n)
	// }
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
	gl.enable(gl.CULL_FACE);
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

	console.log(get_vertices().length + " == " + cowNormals.length)

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

	cow.location.pointl = gl.getUniformLocation(program, "pointl_position_world")
	cow.location.spotl = gl.getUniformLocation(program, "spotl_position_world")
	cow.location.world_m = gl.getUniformLocation(program, "world_m")

	cow.location.spot_direction = gl.getUniformLocation(program,  "spot_direction")
	cow.location.spot_limit = gl.getUniformLocation(program,  "spot_limit")

	cow.location.eye = gl.getUniformLocation(program,  "eye_position")

	cow.location.Ka = gl.getUniformLocation(program, "Ka");
	cow.location.Kd = gl.getUniformLocation(program, "Kd");
	cow.location.Ks = gl.getUniformLocation(program, "Ks");

	cow.location.alpha = gl.getUniformLocation(program, "alpha");
	cow.location.spotLa = gl.getUniformLocation(program, "spotLa");
	cow.location.pointLa = gl.getUniformLocation(program, "pointLa");
	cow.location.spotLd = gl.getUniformLocation(program, "spotLd");
	cow.location.pointLd = gl.getUniformLocation(program, "pointLd");
	cow.location.spotLs = gl.getUniformLocation(program, "spotLs");
	cow.location.pointLs = gl.getUniformLocation(program, "pointLs");


	// set constant parameters
	gl.uniform1f(cow.location.Ka, 0.1);
	gl.uniform1f(cow.location.Kd, 0.45);
	gl.uniform1f(cow.location.Ks, 0.2);
	gl.uniform1f(cow.location.alpha, 6.0);

	gl.uniform1f(cow.location.pointLa, 0.1);
	gl.uniform1f(cow.location.pointLd, 0.5);
	gl.uniform1f(cow.location.pointLs, 0.5);

	gl.uniform1f(cow.location.spotLa, 10.0);
	gl.uniform1f(cow.location.spotLd, 10.0);
	gl.uniform1f(cow.location.spotLs, 10.0);

	gl.uniform4fv(cow.location.color, new Float32Array([0.4,0.2,0.1,1]))
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

	gl.clearColor(0, 0, 0, 0.6);
	gl.clear(gl.COLOR_BUFFER_BIT);

	/* Compute common modelview matrix */ 
	var eye = vec3(0, 0, 30)
	var at = vec3(0, 0, 0)
	var up = vec3(0, 1, 0)
	
	var modelview_m = mult(
		perspective(45, aspect, 0, 80),
		lookAt(eye, at, up)
	)

	var worldview_m = inverse(modelview_m)

	/* point light position */
	var point_light_r = vec3(0.15*pointCounter, 0, 0)
	// var point_light_r = vec3(0,0,0)
	var translate_point_light = mult(
		get_euler_angle_m(point_light_r),
		translate(8, 5, 5), 
	)

	const point_light_position = matrix_vector_mult(get_euler_angle_m(point_light_r), vec4(8,5,5,1))

	/* spot light position */
	var spot_light_r = vec3(90*Math.cos(spotCounter*0.01), 0, 0)

	var translate_spot_light = mult(
		translate(0, 6, 6), 
		get_euler_angle_m(spot_light_r),
	)

	const spot_light_position = matrix_vector_mult(get_euler_angle_m(spot_light_r), vec4(0, 6, 6, 1))

	// cube faces
	var c0 = matrix_vector_mult(translate_spot_light, vec4(light_positions[0], 1))
	var c1 = matrix_vector_mult(translate_spot_light, vec4(light_positions[1], 1))

	var spot_direction = normalize(cross(c1, c0))
	// spot_direction[1] *= -1
	spot_direction = spot_direction.splice(0,3)
	// spot_direction = matrix_vector_mult(translate_spot_light, vec4(spot_direction, 1)).splice(0, 3)
	// console.log(spot_direction)


	/* Render cow */
	gl.useProgram(cow.program);
	gl.bindVertexArray(cow.vao);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cow.indexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, cow.position_buffer);
	gl.vertexAttribPointer(cow.location.position, 3, gl.FLOAT, false, 0, 0)

	var transform_m = mult(
		translate(cow.translation), 
		get_euler_angle_m(cow.rotation),
	)


	// set uniforms

	gl.uniformMatrix4fv(cow.location.mv, false, new Float32Array(flatten(modelview_m)))
	gl.uniformMatrix4fv(cow.location.transformation, false, new Float32Array(flatten(transform_m)))

	gl.uniformMatrix4fv(cow.location.world_m, false, new Float32Array(flatten(worldview_m)))

	gl.uniform4fv(cow.location.pointl, new Float32Array(flatten(point_light_position)))
	gl.uniform4fv(cow.location.spot_l, new Float32Array(flatten(spot_light_position)))

	// spotlight parameters
	gl.uniform3fv(cow.location.spot_direction, new Float32Array(flatten(spot_direction)))
	gl.uniform1f(cow.location.spot_limit, Math.cos(degree_limit*(Math.PI/180)))

	gl.uniform3fv(cow.location.eye, new Float32Array (flatten(eye)))

	// gl.drawArrays(gl.TRIANGLES, 0, get_vertices().length);
	gl.drawElements(gl.TRIANGLES, faces.length, gl.UNSIGNED_SHORT, 0);


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

		left_mouse.init_x = event.clientX 
		left_mouse.init_y = event.clientY

		left_mouse.down = true
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
		cow.prev_translation[0] = cow.translation[0]
		cow.prev_translation[1] = cow.translation[1]

		left_mouse.down = false
	}
	else if (event.button == 2)
	{
		cow.prev_rotation[0] = cow.rotation[0]
		cow.prev_rotation[1] = cow.rotation[1]

		right_mouse.down = false
	}
}

document.onmousemove = (event) => {

	if (left_mouse.down)
	{
		console.log(event.clientX)
	
		cow.translation[0] = (20*(event.clientX-left_mouse.init_x) / canvas.width) + cow.prev_translation[0]
		cow.translation[1] = (20*(left_mouse.init_y-event.clientY) / canvas.height) + cow.prev_translation[1]

		console.log(cow.translation)
	}

	if (right_mouse.down)
	{
		// around x
		cow.rotation[0] = (90*(event.clientX - right_mouse.init_x) / canvas.width) + cow.prev_rotation[0]
		cow.rotation[1] = (90*(event.clientY - right_mouse.init_y) / canvas.height) + cow.prev_rotation[1]

		console.log("Rotation: " + JSON.stringify(cow.rotation))
	}
}

const ztranslation_step = 1
const zangular_step = 10
var stop_point_rotation = false;
var stop_spot_rotation = false;
document.onkeydown = (event) => {
	if (event.key == "ArrowDown")
	{
		cow.translation[2] += ztranslation_step
		console.log(cow.translation)
	}
	else if (event.key == "ArrowUp")
	{
		cow.translation[2] -= ztranslation_step
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
		cow.translation = vec3()
		cow.prev_translation = vec3()

		cow.rotation = vec3()
		cow.prev_rotation = vec3()
	}
	else if (event.key == "p")
	{
		stop_point_rotation = !stop_point_rotation

		if (stop_point_rotation) {
			clearInterval(pointTimer)
		}
		else {
			pointTimer = setInterval(onPointTimer, 1);
		}
	}
	else if (event.key == "s"){
		stop_spot_rotation = !stop_spot_rotation

		if (stop_spot_rotation) {
			clearInterval(spotTimer)
		}
		else {
			spotTimer = setInterval(onSpotTimer, 1);
		}
	}

}

// document.oncontextmenu = (event) => {
//     event.preventDefault();
// };