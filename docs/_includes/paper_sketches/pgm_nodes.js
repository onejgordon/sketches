// Controls

var w = view.size.width;
var h = view.size.height;
var canvas;

var FPS = 10;

var NODE_COLOR = "#FF3333";
var STROKE_COLOR = "#777";
var BORDER = 30;
var X_NODES = 55;
var Y_NODES = 30;
var NODE_R = 7;

var PCT_NOISE = 0.2;

var TGT_EDGES = [3, 6];
var TGT_SIZE = [100, 200];
var TGT_SPEED = [3, 8]
var ROTATE_MULT = 0.5;

var nodes = [];
var target;

var Target = Base.extend({
	initialize: function() {
		this.center = new Point(w/2, h/2)
		this.edges = parseInt(Math.random() * TGT_EDGES[0] + TGT_EDGES[1] - TGT_EDGES[0]);
		this.size = parseInt(Math.random() * TGT_SIZE[0] + TGT_SIZE[1] - TGT_SIZE[0]);
		this.speed = parseInt(Math.random() * TGT_SPEED[0] + TGT_SPEED[1] - TGT_SPEED[0]);
		this.path = new Path.RegularPolygon(this.center, this.edges, this.size);
	},

	update: function() {
		this.path.position.x += this.speed;
		this.path.position.y += this.speed;
		this.path.rotate(this.speed * ROTATE_MULT)
		if (this.path.position.x > w) this.path.position.x = 0;
		if (this.path.position.x < 0) this.path.position.x = w;
		if (this.path.position.y > h) this.path.position.y = 0;
		if (this.path.position.y < 0) this.path.position.y = h;
	}
})

var Node = Base.extend({
	initialize: function(center) {
		this.circle = new Path.Circle(center, NODE_R);
		this.circle.fillColor = NODE_COLOR;
		this.circle.strokeColor = STROKE_COLOR;
		this.active = 0.0;
		this.noise = Math.random() < PCT_NOISE;
	},

	update: function() {
		if (this.noise) {
			this.active = Math.random() + 0.2;
		} else {
			// Compare to target
			var intersects = target.path.contains(this.circle.position);
			this.active = intersects ? 1.0 : 0.0;
		}
		this.circle.fillColor.alpha = this.active;
	}
})

function setup() {
	var x=0, y=0;
	canvas = document.getElementById('myCanvas');
	window.addEventListener('resize', resizeCanvas, false);
	var x_gap = (w-2*BORDER) / X_NODES;
	var y_gap = (h-2*BORDER) / Y_NODES;
	for (var i=0; i<X_NODES; i++) {
		for (var j=0; j<Y_NODES; j++) {
			var n = new Node(new Point(i * x_gap + BORDER, j * y_gap + BORDER))
			nodes.push(n);
		}
	}
	target = new Target();
}

function move_target() {
	target.update();
}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate) {
		nodes.forEach(function(n) {
			n.update();
		})
		move_target();
	}
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

setup();	
