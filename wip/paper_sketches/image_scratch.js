// Image Scratch

var mouse_x, mouse_y;
var raster, cursor;
// The size of our grid cells:
var gridSize = 12;
// Space the cells by 120%:
var spacing = 1.2;
var seconds = 0.2;
var n_oscillators = 4;
var dist = 15;

var Cursor = Base.extend({
	initialize: function(x, y) {
		var center = new Point(x, y);
		console.log("Initialized cursor");
		this.path = new Path.Circle(center, 5);
		this.path.fillColor = 'black';
		var radials = [
			center + new Point(0, dist),
			center + new Point(-dist, 0),
			center + new Point(dist, 0),
			center + new Point(0, -dist)
		];
		this.cursor_radials = [];
		for (var i = 0; i < radials.length; i++) {
			var p = radials[i];
			var c = new Path.Circle(p, 5);
			c.fillColor = 'white';
			this.cursor_radials.push(c);
		}
		this.group = new Group([this.path].concat(this.cursor_radials));
	},

	move: function(location) {
		this.group.position = location;
	},

	all_points: function() {
		var points = [];
		for (var i = 0; i < this.group.children.length; i++) {
			points.push(this.group.children[i].position);
		}
		return points;
	}
})


function play(event) {
	var process = event.type == 'click' || parseInt(1000*context.currentTime) % 10 == 0; // Downsample mouseMoves
	if (process) {
		cursor.move(event.point);
		var sample_points = cursor.all_points();
		for (var i = 0; i < sample_points.length; i++) {
			var sp = sample_points[i];
			var color = raster.getPixel(sp);
			// one context per document
			var osc = context.createOscillator(); // instantiate an oscillator
			osc.type = 'sawtooth'; // this is the default - also square, sawtooth, triangle
			osc.frequency.value = color.brightness * 440; // Hz
			osc.connect(distortion);
			osc.connect(context.destination); // connect it to the destination
			osc.start(); // start the oscillator
			osc.stop(context.currentTime + seconds);
		}
	}
}



function initialize() {
	var img = document.createElement('img');
	img.style.cssText = 'display:none;';
	img.id = 'image';
	img.src = "images/snowy.jpg";
	document.body.appendChild(img);
	raster = new Raster('image');
	raster.position = view.center;
	raster.on('load', function() {
		raster.onClick = play;
		raster.onMouseDrag = play;
	});
	cursor = new Cursor(0, 0);
}

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};

var context = new (window.AudioContext || window.webkitAudioContext)();
var distortion = context.createWaveShaper();
distortion.curve = makeDistortionCurve(400);
distortion.oversample = '4x';

initialize();

function onMouseMove(event) {
	// mouse_x = event.point.x;
	// mouse_y = event.point.y;
}

function onFrame(event) {

}

