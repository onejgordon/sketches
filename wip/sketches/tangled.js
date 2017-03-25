// Tangled

var N_POINTS = 2;
var MIN_RADIUS = 30;
var MAX_RADIUS = 100;
var MAX_LINE_STEPS = 30;
var MIN_LINE_STEPS = 3;
var STEP_SIZE = 7;
var STROKE_WIDTH = 10;
var STROKE_CAP = 'round';
var SHADOW_BLUR = 0;
var SHADOW_COLOR = 'black';
var SHADOW_OFFSET = 0;
var MAX_PATHS = 50;
var BORDER_SIZE = 100;
var MIN_ANGLE = 5;

var Tangled = Base.extend({
	initialize: function(center) {
		this.paths = [];
		this.current_type = 'line'; // 'curve'
		// Line
		this.direction = null;
		this.steps = 0;
		// Arc
		this.center = null;
		this.rotation = 0;
		this.step_target = 20;
		this.radius = 0;
		this.right_handed = true;
		var blueness = Math.random() * .5 + .5;
		this.color = new Color(blueness, blueness, 1);
		var start = center;
		var starting_path = new Path.Line(start, start + Point.random());
		starting_path.strokeColor = this.color;
		starting_path.strokeWidth = STROKE_WIDTH;
		this.paths.push(starting_path);
	},

	cull_stack: function() {
		var overflow = this.paths.length - MAX_PATHS;
		if (overflow > 0) {
			var removed = this.paths.splice(0, overflow);
			for (var i = 0; i < removed.length; i++) {
				removed[i].remove();
			}
		}
	},

	current_path: function() {
		return this.paths[this.paths.length-1];
	},

	head: function() {
		return this.current_path().lastSegment.point;
	},

	near_borders: function() {
		var head = this.head();
		var near_borders = head.x < BORDER_SIZE || head.x > view.size.width - BORDER_SIZE ||
			head.y < BORDER_SIZE || head.y > view.size.height - BORDER_SIZE;
		return near_borders;
	},

	update: function(count) {
		var new_seg = false;
		if (this.current_type == 'curve') {
			new_seg = this.rotation > this.step_target;
			if (new_seg) console.log('hit target ' + this.step_target + ' new segment');
		} else {
			new_seg = this.steps > this.step_target;
		}
		if (new_seg) {
			this.new_segment();
		} else {
			// Progress
			this.grow(count);
		}
		if (count % 10 == 0) this.cull_stack();
	},

	grow: function(count) {
		var direction = this.current_path().getTangentAt(this.current_path().length);
		if (this.current_type == 'line') {
			var growth = direction * STEP_SIZE;
			this.current_path().lastSegment.point += growth;
			this.steps += 1;
		} else if (this.current_type == 'curve') {
			var cp = this.current_path();
			var first_point = cp.firstSegment.point;
			var last_point = cp.lastSegment.point;
			var rotate_speed = 50 * STEP_SIZE / (this.center - first_point).length;
			this.rotation += rotate_speed;
			var to = first_point.rotate(this.handed_mult() * this.rotation, this.center);
			this.paths[this.paths.length - 1].remove();
			this.paths[this.paths.length - 1] = new Path.Arc({
			    from: first_point,
			    through: last_point,
			    to: to,
			    strokeColor: this.color,
			    strokeWidth: STROKE_WIDTH,
			    // shadowColor: SHADOW_COLOR,
			    shadowBlur: SHADOW_BLUR,
			    shadowOffset: SHADOW_OFFSET
			});
		}
	},

	add_cursor: function(point) {
		var cursor = new Path.Circle(point, 5);
		cursor.fillColor = 'red';
	},

	handed_mult: function() {
		return this.right_handed ? 1 : -1;
	},

	new_segment: function() {
		var cp = this.current_path();
		var last_point = cp.lastSegment.point;
		this.rotation = 0;
		this.steps = 0;
		var near_borders = this.near_borders();
		this.current_type = this.current_type == 'curve' ? 'line' : 'curve';
		// if (near_borders) this.current_type = 'curve';
		var type = this.current_type;
		var tangent = this.current_path().getTangentAt(this.current_path().length);
		if (type == 'line') {
			var path = new Path.Line(last_point, last_point + tangent);
			this.step_target = Math.random() * (MAX_LINE_STEPS-MIN_LINE_STEPS) + MIN_LINE_STEPS;
		} else if (type == 'curve') {
			var first_point = cp.firstSegment.point;
			var normal = this.current_path().getNormalAt(this.current_path().length);
			this.right_handed = !this.right_handed;
			if (near_borders) {
				var recenter_angle = (view.center - this.head()).angle - tangent.angle;
				if (Math.abs(recenter_angle) < MIN_ANGLE) recenter_angle *= 3;
				if (recenter_angle < 0) {
					recenter_angle *= -1;
					this.right_handed = false;
				} else this.right_handed = true;
				this.step_target = recenter_angle;
			} else {
				this.step_target = Math.random() * 270 + 60;
			}
			if (this.right_handed) normal = normal.rotate(180);
			this.radius = Math.random() * (MAX_RADIUS-MIN_RADIUS) + MIN_RADIUS;
			this.center = last_point + normal * this.radius;
			var from = last_point;
			var to = last_point.rotate(this.handed_mult() * 2, this.center);
			this.rotation = 2;
			var path = new Path.Arc({
			    from: from,
			    through: from,
			    to: to
			});
		}
		path.strokeColor = this.color;
		path.strokeWidth = STROKE_WIDTH;
		// path.strokeCap = STROKE_CAP;
		path.shadowBlur = SHADOW_BLUR;
		// path.shadowColor = SHADOW_COLOR;
		path.shadowOffset = SHADOW_OFFSET;
		this.paths.push(path);
	}

})

document.getElementById("myCanvas").style = "background-color: #000000";

var points = [];

for (var i = 0; i < N_POINTS; i++) {
	points.push(new Tangled(Point.random() * new Point(view.size.width, view.size.height)));
}


function onFrame(event) {
	for (var i = 0, l = points.length; i < l; i++) {
		points[i].update(event.count);
	}

}


