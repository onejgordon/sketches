
var STEP_CHANCE = 0.001;
var HIGH_STEP_CHANCE = 0.03;
var N_WORMS = 400;
var STEP_FRAMES = 50;
var DRIFT_SPEED = 1;
var STEPPING_COLOR = 'red';
var NORMAL_COLOR = 'black';
var STEP_SIZE = 150;

var Worm = Base.extend({
	initialize: function(position, maxSpeed, maxForce) {
		this.position = position.clone();
		this.radius = Math.random() * 0.5;
		this.step_vector = null;
		this.step_progress = 0; // 0-100
		this.path = null;
		this.createPath();
		// Step animation
		this.leaving_len = 20;
		this.arriving_len = 20;
		this.drift_vector = this.random_direction(DRIFT_SPEED);
	},

	stepping: function() {
		return this.step_progress > 0;
	},

	run: function(worms) {
		this.update();
	},

	createPath: function() {
		this.path = new Path.Line({
			from: this.position,
			to: this.position,
			strokeColor: 'black',
			strokeWidth: 10,
			strokeCap: 'round'
		});
	},

	step_phase: function() {
		var sp = this.step_progress;
		if (sp < this.leaving_len) return 'leaving';
		else if (sp >= STEP_FRAMES) return 'complete';
		else if (sp > STEP_FRAMES - this.arriving_len) return 'arriving';
		return 'static';
	},

	random_direction: function(max) {
		var maxpoint = new Point(max,max);
		return maxpoint * Point.random() - new Point(max/2, max/2);
	},

	step_chance: function() {
		var x = this.path.segments[0].point.x;
		var w = view.size.width;
		var third = w / 3;
		if (x > third && x < (w - third)) {
			return HIGH_STEP_CHANCE;
		} else return STEP_CHANCE;
	},

	update: function() {
		var new_step = false;
		var stepping = this.stepping();
		if (!stepping) new_step = Math.random() < this.step_chance();
		if (new_step) {
			// Choose step direction
			this.step_vector = this.random_direction(STEP_SIZE);
			this.path.strokeColor = STEPPING_COLOR;
			// this.path.strokeWidth = 15;
		}
		if (new_step || stepping) {
			this.step_progress += 1;
			var phase = this.step_phase();
			if (phase == 'leaving') this.path.segments[1].point += this.step_vector / this.leaving_len;
			else if (phase == 'arriving') this.path.segments[0].point += this.step_vector / this.arriving_len;
			else if (phase == 'complete') this.finish_step();
		} else {
			// Drift
			this.path.segments[0].point += this.drift_vector;
			this.path.segments[1].point += this.drift_vector;
			var x = this.path.segments[0].point.x;
			var y = this.path.segments[0].point.y;
			if (x > view.size.width) {
				this.path.segments[0].point.x = 0;
				this.path.segments[1].point.x = 0;
			}
			if (y > view.size.height) {
				this.path.segments[0].point.y = 0;
				this.path.segments[1].point.y = 0;
			}
			if (x < 0) {
				this.path.segments[0].point.x = view.size.width;
				this.path.segments[1].point.x = view.size.width;
			}
			if (y < 0) {
				this.path.segments[0].point.y = view.size.height;
				this.path.segments[1].point.y = view.size.height;
			}
		}
	},

	finish_step: function() {
		this.step_vector = null;
		this.step_progress = 0;
		this.drift_vector = this.random_direction(DRIFT_SPEED);
		this.path.strokeColor = NORMAL_COLOR;
		// this.path.strokeWidth = 10;
	}

});

var worms = [];

for (var i = 0; i < N_WORMS; i++) {
	var position = Point.random() * view.size;
	worms.push(new Worm(position, 10, 0.05));
}

function onFrame(event) {
	for (var i = 0, l = worms.length; i < l; i++) {
		worms[i].run(worms);
	}
}

function onResize(event) {

}

