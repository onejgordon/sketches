var camera, scene, renderer, canvas, clock, capturer, effect;
var a_active_mat, b_active_mat, mat, active_mat, affordance_active_mat;
var a_edge_mat, b_edge_mat;
var mesh;
var _width = 600, _height = 400, _depth = 300;
var NODE_S = [6, 2];
var NODE_R = 8;
var GAP = 30;
var nodes = [];
var group_a_edges = new THREE.Group();
var group_b_edges = new THREE.Group();

// Illustration Mode
var MODE = "UNLEARNED";
var KBD_RENDERING = true;

// Node indexes
var GROUP_A = [1, 3, 12, 15, 6, 8]; 
var GROUP_B = [25, 29, 32, 35, 19, 22]; 
var GROUP_AFFORDANCE = [2];

// States (no group active, a active, both active, b active)
var state = 0;
var N_STATES = 4;
var CAPTURING = false;

var STATE_DUR = 0.8;

var N_ACTIVATE = 0.05;
var N_DEACTIVATE = 0.5;

function flip(prob) {
	return Math.random() < prob;
}

function add_nodes() {
	NODE_S.forEach(function(node_s, r_idx) {
		let idx = 0;
		for (let i = 0; i < node_s; i++) {
			for (let j = 0; j < node_s; j++) {
				var geometry = new THREE.SphereGeometry( NODE_R, 32, 32 );
				mesh = new THREE.Mesh( geometry, mat );
				let x = i * GAP - (node_s * GAP)/2;
				let y = j * GAP - (node_s * GAP)/2;
				let z = r_idx * 80;
				let in_a = r_idx == 0 && _.includes(GROUP_A, idx)
				let in_b = r_idx == 0 && _.includes(GROUP_B, idx)
				mesh._a = in_a;
				mesh._b = in_b;
				mesh._affordance = r_idx == 1 && _.includes(GROUP_AFFORDANCE, idx)
				mesh.position.set(x, y, z);
				scene.add(mesh);
				nodes.push(mesh);
				idx += 1;
			}
		}		
	})

	camera.position.set(500, 500, 300);
	camera.up = new THREE.Vector3(0,0,1);
	let target = new THREE.Vector3(0, 0, 40)
	camera.lookAt(target);
	console.log(target)
	camera.updateProjectionMatrix();
}

function makeMat(color) {
	return new THREE.MeshToonMaterial( {
		color: color,
		specular: 1,
		reflectivity: 1,
		shininess: 1,
		bumpScale: 1
	});
}

function draw_edges() {
	let afford_idx = NODE_S[0]**2  + GROUP_AFFORDANCE[0];
	console.log(afford_idx)
	let afford_pos = nodes[afford_idx].position;
	nodes.forEach(function(node, idx) {
		if (node._a || node._b) {
			var geometry = new THREE.Geometry();
			geometry.vertices = [
				node.position,
				afford_pos
			];
			var line = new MeshLine();
			line.setGeometry( geometry );
			let emat = node._a ? a_edge_mat : b_edge_mat;
			var mesh = new THREE.Mesh(line.geometry, emat); 
			if (node._a) group_a_edges.add(mesh);
			if (node._b) group_b_edges.add(mesh);
		}
	})
	scene.add(group_a_edges);
	scene.add(group_b_edges);	
}

function init() {
	capturer = new CCapture( { 
		format: 'gif', 
		framerate: 2,
		workersPath: 'assets/js/' } );
	clock = new THREE.Clock(true);
	camera = new THREE.PerspectiveCamera( 25.0, _width / _height, 0.1, 1000 );
	camera.position.y = 500;	
	camera.zoom = 1.7;
	scene = new THREE.Scene()
	scene.background = new THREE.Color( 0xffffff );
	var bulbLight = new THREE.PointLight( 0xffee88, 1, 300)
	bulbLight.position.set(0, 0, 200);
	bulbLight.power = 20000;
	var ambLight = new THREE.AmbientLight(0x999999);
	scene.add(bulbLight);
	scene.add(ambLight)
	add_nodes();
	canvas = document.getElementById("myCanvas");
	renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
	renderer.setPixelRatio( window.devicePixelRatio );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.physicallyCorrectLights = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	// renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ReinhardToneMapping;
	// effect = new THREE.OutlineEffect( renderer );
	document.body.appendChild( renderer.domElement );

	// Materials
	a_active_mat = makeMat(0xff0000);
	b_active_mat = makeMat(0x0055ff);
	active_mat = makeMat(0xffffff);
	affordance_active_mat = makeMat(0x5d008f)
	mat = makeMat(0x444444);

	a_edge_mat = new MeshLineMaterial({
		color: new THREE.Color(0xff0000),
		lineWidth: 5,
		transparent: true,
		opacity: 0.5
	});
	b_edge_mat = new MeshLineMaterial({
		color: new THREE.Color(0x0055ff),
		lineWidth: 5,
		transparent: true,
		opacity: 0.5
	});

	draw_edges();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function render() {
	state += 1;
	if (state > N_STATES-1) state = 0;
	if (state == 1) {
		group_a_edges.visible = true;
		group_b_edges.visible = false;
	} else if (state == 2) {
		group_a_edges.visible = true;
		group_b_edges.visible = true;
	} else if (state == 3) {
		group_a_edges.visible = false;
		group_b_edges.visible = true;
	} else {
		group_a_edges.visible = false;
		group_b_edges.visible = false;		
	}
	nodes.forEach(function(n, idx) {
		if (state == 1) {
			if (n._a) n._active = true;
			if (n._b) n._active = false;
			if (n._affordance) n._active = true;
		} else if (state == 2) {
			if (n._a) n._active = true;
			if (n._b) n._active = true;
			if (n._affordance) n._active = true;
		} else if (state == 3) {
			if (n._a) n._active = false;
			if (n._b) n._active = true;
			if (n._affordance) n._active = true;
		} else {
			if (n._a || n._b || n._affordance) n._active = false;
		}
		if (!n._a && !n._b && !n._affordance) {
			if (n._active && flip(N_DEACTIVATE)) n._active = false;
			else if (!n._active && flip(N_ACTIVATE)) n._active = true;			
		}
		if (n._active) {
			if (n._a) n.material = a_active_mat;
			else if (n._b) n.material = b_active_mat;
			else if (n._affordance) n.material = affordance_active_mat;
			else n.material = active_mat;
		} else n.material = mat;
	})

	renderer.render( scene, camera ); // effect.render
	if (CAPTURING) capturer.capture( canvas );
}

function animate() {
    if (!KBD_RENDERING) requestAnimationFrame( animate );
	render()
}

function toggleCapture() {
	if (CAPTURING) {
		console.log("Stop capturing...")
		capturer.stop()
		capturer.save()		
		CAPTURING = false;
	} else {
		console.log("Start capturing...")
		capturer.start()
		CAPTURING = true;
	}
}

function buttonClick() {
	toggleCapture();
}

function runThree() {
	init()
	animate()
	document.addEventListener("keydown", function() {
		if (KBD_RENDERING) animate()
	}, false);
}