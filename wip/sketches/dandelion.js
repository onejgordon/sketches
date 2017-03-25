
var w = view.size.width;
var h = view.size.height;

var THETA_MAX = 180;
var PHI_MAX = 360;
var AVE_R = .4 * w;
var AVE_SIZE = 7;
var MAX_VELOCITY = 1.5;
var FPS = 1;
var CENTER_X = w / 2;
var CENTER_Y = h / 2;
var ANG_DIST = 15; // Larger, less orbs
var JITTER = 20;

var target_theta = 90;
var target_phi = 180 + 45;

var BLOW_SPEED = 1;


// bg
var bg = new Path.Rectangle([0,0], [w,h]);
bg.fillColor = {
	gradient: {
        stops: ['#7E8BAD', '#627AAD']
    },
    origin: [0,0],
    destination: [w,h]
}

var Stem = Base.extend({
	initialize: function(origin) {
		var center = new Point(CENTER_X, CENTER_Y);
		this.line = new Path.Line(origin, center);
		this.line.strokeWidth = 50;
		this.line.strokeColor = {
			gradient: {
	            stops: ['white', new Color(.5,.5,.5)]
	        },
	        origin: center,
    	    destination: origin
    	};
    	this.line.opacity = 0.6;
		this.circle = new Path.Circle(center, 40);
		this.circle.fillColor = 'white'
	}
})

var Orb = Base.extend({
	initialize: function(theta, phi, r, size) {
		var center = new Point(CENTER_X, CENTER_Y);
		this.theta = theta + Math.random() * JITTER; // 0 - 180
		this.phi = phi + Math.random() * JITTER; // 0 - 360
		this.v_theta = MAX_VELOCITY;
		this.v_phi = MAX_VELOCITY;
		this.r = r;
		this.size = size;
		this.opacity = 1;
		this.coords = this.get_coords();
		this.path = new Path.Circle(new Point(this.coords.x, this.coords.y), size);
		var blueness = 0.8 + Math.random() * .2;
		this.path.fillColor = new Color(blueness, blueness, 1);
		this.path.shadowColor = new Color(blueness+.2, blueness+.2, 1);
		this.path.shadowBlur = 10;
		this.stem = new Path.Line(center, new Point(this.coords.x, this.coords.y));
		this.stem.strokeColor = 'white';
		this.stem.strokeWidth = 2;
		// this.text = new PointText({
		// 	point: [0,0],
		// 	content: ""
		// })
		// this.text.fillColor = 'white';
	},

	get_coords: function() {
		var theta_r = this.theta / 360 * 2 * Math.PI;
		var phi_r = this.phi / 360 * 2 * Math.PI;
		var x = this.r * Math.sin(theta_r) * Math.cos(phi_r) + CENTER_X;
		var y = this.r * Math.sin(theta_r) * Math.sin(phi_r) + CENTER_Y;
		var z = this.r * Math.cos(theta_r);
		return {x: x, y: y, z: z};
	},

	theta_diff: function(target) {
		var diff = target - this.theta;
		// if (diff > THETA_MAX) diff -= THETA_MAX;
		// if (diff < -THETA_MAX) diff += THETA_MAX;
		return diff;
	},

	phi_diff: function(target) {
		var diff = target - this.phi;
		// if (diff > PHI_MAX) diff -= PHI_MAX;
		// if (diff < -PHI_MAX) diff += PHI_MAX;
		return diff;
	},

	move: function() {
		this.phi += this.v_phi;
		this.theta += this.v_theta;
		// if (Math.random() < .05) {
		// 	// Slight course shift
		// 	this.v_theta = Math.min(this.v_theta + (Math.random() - 0.5), MAX_VELOCITY);
		// 	this.v_phi = Math.min(this.v_phi + (Math.random() - 0.5), MAX_VELOCITY);
		// }
		if (this.phi > PHI_MAX) this.phi -= PHI_MAX;
		if (this.phi < 0) this.phi += PHI_MAX;
		if (this.theta > THETA_MAX) this.theta -= THETA_MAX;
		if (this.theta < 0) this.theta += THETA_MAX;
	},

	update: function() {
		this.coords = this.get_coords();
		this.opacity = (this.coords.z + AVE_R) / (2*AVE_R);
		this.path.position.x = this.coords.x;
		this.path.position.y = this.coords.y;
		this.path.opacity = this.opacity;
		this.stem.opacity = this.opacity;
		this.stem.segments[1].point.x = this.coords.x;
		this.stem.segments[1].point.y = this.coords.y;
		var HANDLE_SIZE = 25 * Math.sin(step / 10);
		this.stem.segments[1].handleOut.x = this.v_theta * HANDLE_SIZE;
		this.stem.segments[1].handleOut.y = this.v_phi * HANDLE_SIZE;
		this.stem.segments[1].handleIn.x = -this.v_theta * HANDLE_SIZE;
		this.stem.segments[1].handleIn.y = -this.v_phi * HANDLE_SIZE;
		// this.text.point.x = this.coords.x;
		// this.text.point.y = this.coords.y;
		// this.text.content = this.theta.toFixed(2) + ", " + this.phi.toFixed(2);
	}
})

var orbs = [];
var stem = new Stem(new Point(w, h));
var mode = 'normal';
var step = 0;

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
	step = parseInt(event.count / FPS);
	var do_move = event.count % FPS == 0;
	if (do_move) {
		orbs.forEach(function(o) {
			o.move();
			o.update();
		});
	}
}

setup();