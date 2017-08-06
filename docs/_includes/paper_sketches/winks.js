// Controls

var w = view.size.width;
var h = view.size.height;

var FPS = 1;

var CIRCLE_COLOR = "#000000";
var CIRCLE_LIGHT_COLOR = "#FFFFFF";
var O_RAD = 15;
var I_RAD = 5;
var GAP = 70;
var MAX_DIST = 100;
var TARGET_VEL = new Point(3,3);

var circles = [];
var target = new Point.random();
var t = new Path.Circle(target, 10);
t.fillColor = 'red';

var Wink = Base.extend({
	initialize: function(center) {
		this.outer = new Path.Circle(center, O_RAD);
		this.outer.fillColor = CIRCLE_COLOR;
		this.inner = new Path.Circle(center, I_RAD);
		this.inner.fillColor = CIRCLE_LIGHT_COLOR;
	},

	update: function() {
		var dist = this.inner.position.getDistance(target);
		var open = dist / MAX_DIST;
		if (open > 1) open = 1;
		console.log(open);
		this.inner.scale(1, open);
	}
})

var winks = []

function setup() {
	var x=0, y=0;
	while (x < w) {
		while (y < h) {
			var wink = new Wink(new Point(x, y));
			winks.push(wink)
			y += GAP;
		}
		y = 0;
		x += GAP;
	}
}

function move_target() {
	target += TARGET_VEL;
	if (target.x > w) target.x = 0;
	else if (target.x < 0) target.x = w;
	else if (target.y > h) target.y = 0;
	else if (target.y < 0) target.y = h;
	t.position = target;
}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate) {
		winks.forEach(function(wink) {
			wink.update();
		})
		move_target();
	}
}

setup()
