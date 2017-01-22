
var w = view.size.width;
var h = view.size.height;

var THETA_MAX = 180;
var PHI_MAX = 360;
var AVE_R = 280;
var AVE_SIZE = 10;
var MAX_VELOCITY = .2;
var FPS = 5;
var CENTER_X = w / 2;
var CENTER_Y = h / 2;
var ANG_DIST = 20; // Larger, less orbs

// bg
document.getElementById("myCanvas").style = "background-color: #000000";

var Stem = Base.extend({
	initialize: function(origin) {
		var center = new Point(CENTER_X, CENTER_Y);
		this.line = new Path.Line(origin, center);
		this.line.strokeWidth = 50;
		this.line.strokeColor = 'white';
		this.circle = new Path.Circle(center, 60);
		this.circle.fillColor = 'white'
	}
})

var Orb = Base.extend({
	initialize: function(theta, phi, r, size) {
		var center = new Point(CENTER_X, CENTER_Y);
		this.theta = theta; // 0 - 180
		this.phi = phi; // 0 - 360
		this.v_theta = MAX_VELOCITY * .2;
		this.v_phi = MAX_VELOCITY * .2;
		this.r = r;
		this.size = size;
		this.opacity = 1;
		this.coords = this.get_coords();
		this.path = new Path.Circle(new Point(this.coords.x, this.coords.y), size);
		var blueness = 0.8 + Math.random() * .2;
		this.path.fillColor = new Color(blueness, blueness, 1);
		this.stem = new Path.Line(center, new Point(this.coords.x, this.coords.y));
		this.stem.strokeColor = 'white';
		this.stem.strokeWidth = 2;
	},

	get_coords: function() {
		var x = this.r * Math.sin(this.theta) * Math.cos(this.phi) + CENTER_X;
		var y = this.r * Math.sin(this.theta) * Math.sin(this.phi) + CENTER_Y;
		var z = this.r * Math.cos(this.theta);
		return {x: x, y: y, z: z};
	},

	move: function() {
		if (mode == 'normal') {
			this.phi += this.v_phi;
			this.theta += this.v_theta;
			if (this.phi > PHI_MAX) this.phi -= PHI_MAX;
			if (this.theta > THETA_MAX) this.theta -= THETA_MAX;
			if (Math.random() < .05) {
				this.v_theta = Math.min(this.v_theta + (Math.random() * .05 - 0.025), MAX_VELOCITY);
				this.v_phi = Math.min(this.v_phi + (Math.random() * .05 - 0.025), MAX_VELOCITY);
			}
		} else if (mode == 'blowing') {
			if (this.coords.x < 0) {
				var dist = this.coords.x - (THETA_MAX - Math.random() * 30) - this.theta;
				this.x += Math.abs(this.coords.x / 350);
			}
		}
	},

	update: function() {
		this.coords = this.get_coords();
		this.opacity = (this.coords.z + AVE_R) / (2*AVE_R);
		this.path.position.x = this.coords.x;
		this.path.position.y = this.coords.y;
		this.path.opacity = this.opacity;
		this.stem.segments[1].point.x = this.coords.x;
		this.stem.segments[1].point.y = this.coords.y;
	}
})

var orbs = [];
var stem = new Stem(new Point(w, h));
var mode = 'normal';

function setup() {
	for (var theta = 0; theta < THETA_MAX; theta+=ANG_DIST) {
		for (var phi = 0; phi < PHI_MAX; phi+=ANG_DIST) {
			var r = (Math.random() * .1 + .95) * AVE_R;
			var size = (Math.random() * .1 + .95) * AVE_SIZE;
			orbs.push(new Orb(theta, phi, r, size));
		}
	}
}

function onFrame(event) {
	var step = parseInt(event.count / FPS);
	var do_move = event.count % FPS == 0;
	if (do_move) {
		if (step % 30 == 0) {
			mode = mode == 'normal' ? 'blowing' : 'normal';
			console.log('switching to ' + mode);
		}
		orbs.forEach(function(o) {
			o.move();
			o.update();
		});
	}
}

setup();