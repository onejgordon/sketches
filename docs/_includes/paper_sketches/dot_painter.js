// Animated photo filter add dots as we attend to random locations in photo.
// Test samples at radius around sample. Dot is added to canvas with r proportional
// to # of samples with color within constant range of center. Result, larger areas
// larger dots? More contrast, smaller dots, more detail?

var w = view.size.width;
var h = view.size.height;

var FPS = 1;

var IMAGE_W = 900;
var SAMPLES_SIDE_N = 10;
var SAMPLES_SIDE_W = 100;
var SAMPLE_R = 5;
var SIZE_MULT = 0.4;
var MAX_DOT_SIZE = IMAGE_W / 4;
var MAX_DOTS = 10000;
var SHOW_PHOTO = false;
var SHOW_SAMPLES = false;

var n_dots = 0;
var loaded = false;
var raster;

function std(values){
	var avg = average(values);
	var squareDiffs = values.map(function(value){
		var diff = value - avg;
		var sqrDiff = diff * diff;
		return sqrDiff;
	});
	var avgSquareDiff = average(squareDiffs);
	var stdDev = Math.sqrt(avgSquareDiff);
	return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);
  var avg = sum / data.length;
  return avg;
}

function showImage(fn) {
	raster = new Raster(fn, new Point(w/2, h/2));
	raster.onLoad = function() {
		raster.visible = SHOW_PHOTO;
		loaded = true;
	}
}

var Dot = Base.extend({
	initialize: function() {
		this.center = Point.random() * raster.width;
		var res = this.sample();
		this.path = new Path.Circle(this.center, res.size);
		this.path.fillColor = res.color;
	},

	sample: function() {
		var start_x = x = this.center.x - SAMPLES_SIDE_W/2;
		var y = this.center.y - SAMPLES_SIDE_W/2;
		var gap = SAMPLES_SIDE_W/SAMPLES_SIDE_N;
		var reds = [];
		var blues = [];
		var greens = [];
		for (var i=0; i<=SAMPLES_SIDE_N; i++) {
			for (var j=0; j<=SAMPLES_SIDE_N; j++) {
				var avg_color = raster.getAverageColor(new Rectangle(x, y, SAMPLE_R, SAMPLE_R));
				if (SHOW_SAMPLES) {
					var s = new Path.Circle(new Point(x, y), SAMPLE_R);
					s.fillColor = avg_color;
				}
				if (avg_color != null) {
					reds.push(avg_color.red)
					blues.push(avg_color.blue)
					greens.push(avg_color.green)
				}
				x += gap;
			}
			x = start_x;
			y += gap;
		}
		var color = raster.getAverageColor(new Rectangle(this.center.x, this.center.y, SAMPLE_R, SAMPLE_R));
		var size = 1 / average([std(reds), std(blues), std(greens)]) * SIZE_MULT;
		if (size > MAX_DOT_SIZE) size = MAX_DOT_SIZE
		return {
			color: color,
			size: size
		}
	}
})

function addNewDot() {
	var d = new Dot();
	n_dots++;
}

function setup() {
	showImage("assets/plant.jpg");
}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate && n_dots < MAX_DOTS && loaded) {
		addNewDot();
	}
}

setup();
