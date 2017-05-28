// Controls
var MAX_INIT_RAD = 100;
var BUFFER = 10;
var ALLOW_INTERNAL = true;
var ANIMATE_GROWING = true;
var SCALE_SPEED = 1.2;

var w = view.size.width;
var h = view.size.height;

var FPS = 10;

var CIRCLE_COLOR = "#000000";
var CIRCLE_LIGHT_COLOR = "#FFFFFF";


var circles = [];

function getRadius(c) {
	var smallest_radius = null;
	var curveloc = null;
	var nearest_curveloc;
	var internal = false;
	var overlap_layers = 0;
	if (circles.length == 0) return {r: Math.random() * MAX_INIT_RAD, overlap_layers: 0};
	for (var i = 0; i < circles.length; i++) {
		var _c = circles[i];
		var contained = _c.contains(c);
		if (contained) overlap_layers += 1;
		if (contained && !ALLOW_INTERNAL) return {r: null}; // Skip
		var radius = Math.abs(c.getDistance(_c.position) - _c._target_radius) - BUFFER;
		if (radius < 0) return {r: null}; // Too close to border
		if (smallest_radius == null || radius < smallest_radius) {
			smallest_radius = radius;
			nearest_curveloc = curveloc;
		}
	}
	return {
		r: smallest_radius,
		overlap_layers: overlap_layers
	}
}

function add() {
	var r = null;
	var tries = 0;
	var candidate_center;
	var overlap_layers = 0;
	var first = circles.length == 0;
	while (r == null && tries < 100) {
		if (first) candidate_center = new Point(w/2,h/2) + Math.random() * 20;
		else candidate_center = new Point.random() * w;
		var res = getRadius(candidate_center);
		r = res.r;
		overlap_layers = res.overlap_layers;
		tries += 1;
	}
	if (tries == 100) {
		console.log("Tries exhausted")
		return;
	}
	var c = new Path.Circle(candidate_center, ANIMATE_GROWING ? 0.1 : r);
	c._target_radius = r;
	var dark = overlap_layers % 2 == 0;
	c.fillColor = dark ? CIRCLE_COLOR : CIRCLE_LIGHT_COLOR;
	if (!dark) {
		c.strokeColor = 'gray'
		c.strokeWeight = 1;
	}
	circles.push(c);
}

function grow() {
	circles.forEach(function(c) {
		var r = c.bounds.width/2;
		if (r < c._target_radius) {
			var max_scale = c._target_radius / r;
			c.scale(Math.min(SCALE_SPEED, max_scale));
		}
	})
}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var do_add = event.count % FPS == 0;
	if (do_add) {
		add();
	}
	if (ANIMATE_GROWING) grow()
}

