var camera, scene, renderer;
var mesh;
var _width = window.innerWidth, _height = window.innerHeight, _depth = 300;
var N_CUBES = 40;
var cubes = [];

function rando() {
	return Math.random() - 0.5;
}

function add_cubes() {
	var material = new THREE.MeshStandardMaterial( {
		roughness: 0.7,
		color: 0xffffff,
		bumpScale: 0.002,
		metalness: 0.2
	});
	for (let i = 0; i < N_CUBES; i++) {
		let s = rando() * 200;
		var geometry = new THREE.BoxBufferGeometry( s, s, s );
		mesh = new THREE.Mesh( geometry, material );
		mesh.position.set(rando() * _width * 2, rando() * _height * 2, rando() * _depth)
		scene.add( mesh );
		cubes.push(mesh);
	}
}

function init() {
	camera = new THREE.PerspectiveCamera( 50, _width / _height, 1, 1000 );
	camera.position.z = 600;
	scene = new THREE.Scene()
	// scene.background = new THREE.Color( 0xffffff );
	var bulbLight = new THREE.PointLight( 0xffee88, 1, 300)
	bulbLight.position.set( 0, 0, 700 );
	bulbLight.power = 6000;
	var ambLight = new THREE.AmbientLight(0x404040);
	scene.add( bulbLight );
	scene.add(ambLight)
	add_cubes();
	renderer = new THREE.WebGLRenderer({alpha: true});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.physicallyCorrectLights = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ReinhardToneMapping;
	document.body.appendChild( renderer.domElement );
	//
	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function render() {
	cubes.forEach(function(c) {
		c.rotation.x += 0.005;
		c.rotation.y += 0.01;
	})
}

function animate() {
	requestAnimationFrame( animate );
	render()
	renderer.render( scene, camera );
}


function runThree() {
	init()
	animate()
}