// Controls

var w = view.size.width;
var h = view.size.height;

var FPS = 1;

var CIRCLE_COLOR = "#000000";
var O_RAD = 15;
var NODES = 20;

var Node = Base.extend({
	initialize: function(center) {
		this.path = new Path.Circle(center, O_RAD);
		this.path.fillColor = CIRCLE_COLOR;
		this.direction = new Point.random();
	},

	move: function() {
		this.path.position += this.direction;
		this.direction.rotate(Math.random());
	}
})

var nodes = []

function setup() {
	while (nodes.length < NODES) {
		var node = new Node(new Point(Math.random() * w, Math.random() * h));
		nodes.push(node)
	}
}


function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate) {
		nodes.forEach(function(node) {
			node.move();
		})
		move_target();
	}
}

setup()
