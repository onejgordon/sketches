var renderer, scene, camera, composer, circle, skelet, particle;

window.onload = function() {
  init();
  animate();
}

function init() {
    document.getElementsByTagName('body')[0].style.background = "-webkit-linear-gradient(top,  #11e8bb 0%,#8200c9 100%)"
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio((window.devicePixelRatio) ? window.devicePixelRatio : 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);
    document.getElementById('canvas').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 600;
    scene.add(camera);

    circle = new THREE.Object3D();
    particle = new THREE.Object3D();
    network = new THREE.Object3D();

    scene.add(circle);
    scene.add(particle);
    scene.add(network);

    var geometry = new THREE.SphereGeometry(3, 10, 10);
    var geom = new THREE.IcosahedronGeometry(7, 1);
    var geom2 = new THREE.IcosahedronGeometry(15, 1);

    var line_mat = new THREE.LineBasicMaterial( {
        color: 0x555555,
        linewidth: 10,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin:  'round' //ignored by WebGLRenderer
    } );
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shading: THREE.FlatShading
    });

    var N = 1200;
    var CONN = 1;
    for (var i = 0; i < N; i++) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        mesh.position.multiplyScalar(90 + (Math.random() * 700));
        mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        particle.add(mesh);
    }

    for (var i = 0; i < N; i++) {
        for (var j = 0; j < CONN; j++) {
            var idx = parseInt(Math.random() * N);
            var linegeo = new THREE.Geometry();
            linegeo.vertices.push(particle.children[i].position);
            linegeo.vertices.push(particle.children[idx].position);
            var ln = new THREE.Line(linegeo, line_mat);
            network.add(ln);
        }
    }


    var mat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shading: THREE.FlatShading
    });

    var mat2 = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        wireframe: true,
        side: THREE.DoubleSide

    });
    var ambientLight = new THREE.AmbientLight(0x999999 );
    scene.add(ambientLight);
    scene.fog = new THREE.Fog(0x000000, 100, 700);
    var lights = [];
    lights[0] = new THREE.DirectionalLight( 0xffffff, 1 );
    lights[0].position.set( 1, 0, 0 );
    lights[1] = new THREE.DirectionalLight( 0x11E8BB, 1 );
    lights[1].position.set( 0.75, 1, 0.5 );
    lights[2] = new THREE.DirectionalLight( 0x8200C9, 1 );
    lights[2].position.set( -0.75, -1, 0.5 );
    scene.add( lights[0] );
    scene.add( lights[1] );
    scene.add( lights[2] );


    window.addEventListener('resize', onWindowResize, false);

};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  // requestAnimationFrame(animate);

  particle.rotation.x += 0.0000;
  particle.rotation.y -= 0.0040;
  circle.rotation.x -= 0.0020;
  circle.rotation.y -= 0.0030;
  renderer.clear();

  renderer.render( scene, camera )
};
