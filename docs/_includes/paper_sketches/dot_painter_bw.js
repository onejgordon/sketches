// Animated photo filter add dots by sampling from grayscale raster (darker, more likely)


var w = view.size.width;
var h = view.size.height;

var FPS = 1;

var IMAGE_W = null
var N_PIXELS = null
var MAX_DOTS = 10000;
var SHOW_PHOTO = false;
var DOT_RAD = 5

var n_dots = 0;
var loaded = false;
var value_sum = 0;
var raster;
var probs = []

function showAndProcessImage(fn) {
	raster = new Raster(fn, new Point(w/2, h/2));
	raster.onLoad = function() {
		IMAGE_W = raster.width
		for (var x=0; x<IMAGE_W; x++) {
			for (var y=0; y<IMAGE_W; y++) {
				var c = raster.getPixel(x, y);
				probs.push(1 - c.lightness)
			}
		}
		value_sum = _.sum(probs)
		N_PIXELS = probs.length
		console.log(N_PIXELS)
		raster.visible = SHOW_PHOTO;
		loaded = true;
	}
}

var Dot = Base.extend({
	initialize: function() {
		this.center = this.sample()
		this.path = new Path.Circle({
			center: this.center,
			radius: DOT_RAD,
			fillColor: 'black',
			opacity: 0.5
		})
	},

	sample: function() {
		var rand = Math.random() * value_sum
		var total = 0
		var i = 0
		for (var x=0; x<IMAGE_W; x++) {
			for (var y=0; y<IMAGE_W; y++) {
				total += probs[i]
				if (total >= rand) return new Point(x, y)
				i += 1
			}
		}
		return null
	}
})

function addNewDot() {
	var d = new Dot();
	n_dots++;
}

function setup() {
	showAndProcessImage("assets/plant.jpg");
}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate && n_dots < MAX_DOTS && loaded) {
		addNewDot();
	}
}

setup();
