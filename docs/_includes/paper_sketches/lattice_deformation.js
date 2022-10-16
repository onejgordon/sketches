// Controls

var w = view.size.width;
var h = view.size.height;

var FPS = 1;

var CIRCLE_COLOR = "#000000";
var CIRCLE_LIGHT_COLOR = "#FFFFFF";
var IMAGE_W = 1280;
var IMAGE_H = 720;
var GRID_S = 150;
var DEFORMS = [2, 5, 10, 15, 25];
var IMAGES = [1, 2];
var R = 2;

var cell_w = IMAGE_W / GRID_S;

var nodes = [];
var raster;

function setDeform(d) {
	deform(d);
}

function deform(d) {
	console.log("Deform to " + d)
	for (var i=0; i<nodes.length; i+=1) {
		var n = nodes[i]
		n.update(d);
	}
}

function processImage(fn, cb) {
	nodes.forEach(function(n) {
		n.remove();
	})

	raster = new Raster(fn, new Point(w/2, h/2));
	raster.onLoad = function() {
		raster.visible = false;
		for (var i=0; i<IMAGE_W; i+=cell_w) {
			for (var j=0; j<IMAGE_H; j+=cell_w) {
				var avg_color = raster.getAverageColor(new Rectangle(i, j, cell_w, cell_w));
				var brightness = avg_color != null ? avg_color.brightness : 0;
				var center = new Point(i+cell_w/2, j+cell_w/2);
				nodes.push(new Node(brightness, center));
			}
		}
		cb()
	}
}

var Node = Base.extend({
	initialize: function(brightness, center) {
		this.path = new Path.Circle(center, R);
		this.origin = center;
		this.path.fillColor = "#000";
		this.brightness = brightness;
		this.delta = 0;
		// this.path.rotate(brightness * 360);
	},

	remove: function() {
		this.path.remove();
	},

	update: function(d) {
		var delta = this.brightness * d;
		this.path.translate(new Point(0, delta - this.delta));
		this.delta = delta;
	}
})

function setImage(i) {
	processImage('assets/faces/face'+i+'.jpg', function() {
		deform(DEFORMS[0]);
	});
}

function setup() {
	setImage(1);

	// Init buttons
	DEFORMS.forEach(function(size) {
		document.getElementById("b" + size).onclick = function(e) {
			deform(size);
		}
	});

	IMAGES.forEach(function(i) {
		document.getElementById("i" + i).onclick = function(e) {
			setImage(i);
		}
	});
}

function onFrame(event) {

}


setup();
