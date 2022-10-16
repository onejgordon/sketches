// Controls

var w = view.size.width;
var h = view.size.height;

var FPS = 1;

var CIRCLE_COLOR = "#000000";
var CIRCLE_LIGHT_COLOR = "#FFFFFF";
var IMAGE_W = 500;
var GRID_S = 70;
var MAX_ROT = 15;
var GAP = 1;
var MAX_DIST = 100;

var cell_w = IMAGE_W / GRID_S;

var nodes = [];
var raster;

function processImage(fn) {
	raster = new Raster(fn, new Point(w/2, h/2));
	raster.onLoad = function() {
		raster.visible = false;
		for (var i=0; i<IMAGE_W; i+=cell_w) {
			for (var j=0; j<IMAGE_W; j+=cell_w) {
				var avg_color = raster.getAverageColor(new Rectangle(i, j, cell_w, cell_w));
				console.log(avg_color)
				var brightness = avg_color.brightness;
				var center = new Point(i+cell_w/2, j+cell_w/2);
				nodes.push(new Node(brightness, center));
			}
		}		
	}
}

var Node = Base.extend({
	initialize: function(brightness, center) {
		this.path = new Path.Rectangle(center, cell_w - GAP);
		this.path.fillColor = "#000";
		this.brightness = brightness;
		this.path.rotate(brightness * 360);
	},

	update: function() {
		// this.path.rotate(MAX_ROT * brightness);
		this.path.rotate(MAX_ROT/2);
	}
})

function setup() {
	processImage('assets/jrg.jpg');
}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate) {
		nodes.forEach(function(n) {
			n.update();
		})
	}
}

setup()
