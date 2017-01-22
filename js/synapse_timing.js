// Synapse Timing

var TARGET_BODY = [view.size.width/2, 200];
var TARGET_RADIUS = 50;
var SOURCE_RADIUS = 30;
var SOURCE_PULSE_RADIUS = 50;
var SEGMENT_WIDTH = 30;
var TARGET_COLOR = 'black';
var LOOP_MS = 200;
var middle_x = view.size.width / 2;
var SPIKE_RADIUS = 10;
var PX_PER_STEP = 5;
var SPIKE_INCREASE = 0.4;
var FADE_RATE = 0.008;
var LEARN_RADIUS = 120;
var LEARN_COLOR = new Color(0.5, 0.5, 0.5, 0.3);
var LEARN_ARROW_WIDTH = 5;
var RADIUS_SHOW_STEPS = 10;
var LEARN_SPEED = 10;
var TEXT_X = 60;
var TEXT_SIZE = 20;
var SOURCE_COLOR = 'red';

var LearnRadius = Base.extend({
	initialize: function(center, source_cell) {
		this.circle = new Shape.Circle(center, LEARN_RADIUS);
		this.circle.opacity = 0;
		this.circle.fillColor = LEARN_COLOR;
		this.source_cell = source_cell;
		this.arrow = null;
	},

	find_nearest_spike: function() {
		// TOOD: Find *nearest*
		for (var i = 0; i < sources.length; i++) {
			var src = sources[i];
			if (src == this.source_cell || src.spike.position.x != middle_x) continue;
			if (src.spike != null && this.circle.contains(src.spike.position)) {
				var dir = src.spike.position - this.circle.position;
				var width_offset = new Point(LEARN_ARROW_WIDTH, 0);
				this.arrow = new Path([
					this.circle.position - width_offset,
					this.circle.position + width_offset,
					src.spike.position
				]);
				this.items = new Group([this.arrow, this.circle]);
				this.arrow.fillColor = 'green';
				return dir;
			}
		}
		return null;
	},

	_show: function() {
		console.log('show');
		this.circle.opacity = 1;
	},

	update: function(step) {
		if (step >= this.start_step + RADIUS_SHOW_STEPS) {
			this.circle.remove();
		}
	},

	remove: function() {
		this.circle.opacity = 0;
		if (this.arrow) this.arrow.remove();
	}
})

var TargetCell = Base.extend({
	initialize: function() {
		this.segment = new Path.Line(TARGET_BODY, new Point(middle_x, view.size.height - 60));
		this.segment.strokeColor = TARGET_COLOR;
		this.segment.strokeWidth = 20;
		this.body = new Path.Circle(TARGET_BODY, TARGET_RADIUS);
		this.body.fillColor = TARGET_COLOR;
		this.body.strokeColor = TARGET_COLOR;
		this.activation = 0;
		this.max_activation = 0;
		this.txt_activation = new PointText({
			point: new Point(TARGET_BODY) + new Point(TEXT_X, -15),
			content: this.activation,
			justification: 'left',
			fillColor: 'black',
			fontSize: TEXT_SIZE
		})
		this.txt_max_activation = new PointText({
			point: new Point(TARGET_BODY) + new Point(TEXT_X, 15),
			content: this.max_activation,
			justification: 'left',
			fillColor: 'red',
			fontWeight: 'bold',
			fontSize: TEXT_SIZE
		})
	},

	receive_spike: function() {
		this.activation += SPIKE_INCREASE;
		this.update();
	},

	fade: function() {
		this.activation -= FADE_RATE;
		if (this.activation < 0) this.activation = 0;
		this.update();
	},

	reset: function() {
		this.activation = 0;
		this.update();
	},

	update: function() {
		var brightness = this.activation;
		this.body.fillColor = new Color(brightness, brightness, brightness);
		this.txt_activation.content = this.activation.toFixed(2);
		if (this.activation > this.max_activation) {
			this.max_activation = this.activation;
			this.txt_max_activation.content = this.max_activation.toFixed(2) + " (max)";
		}
	}
})

var SourceCell = Base.extend({
	initialize: function(spike_ms, d_s, d_a, side) {
		this.side = side;
		this.spike_ms = spike_ms;
		this.d_s = d_s;
		this.d_a = d_a;
		this.spike = null;
		this.spike_crossed = false;
		var y = TARGET_BODY[1] + this.d_s * PX_PER_STEP;
		var x = side == 'left' ? middle_x - d_a*PX_PER_STEP : middle_x + d_a*PX_PER_STEP;
		var center = new Point(x, y);
		this.body = new Path.Circle(center, SOURCE_RADIUS);
		this.body.fillColor = SOURCE_COLOR;
		this.label = new PointText({
			point: center + new Point(0, 5),
			justification: 'center',
			fillColor: 'white',
			fontSize: 15,
			content: spike_ms
		})
		var meets_target = new Point(middle_x, y);
		this.axon = Path.Line(center, meets_target);
		this.axon.strokeColor = SOURCE_COLOR;
		this.axon.strokeWidth = 10;
		this.learn_radius = new LearnRadius(meets_target, this);
		this.items = new Group([this.body, this.axon, this.label]);
	},

	start_spike: function() {
		this.spike = new Shape.Circle(this.body.position, SPIKE_RADIUS);
		this.spike.fillColor = SOURCE_COLOR;
		this.body.opacity = 0.4;
	},

	move_spike: function(step) {
		var dx = 0, dy = 0;
		var x = this.spike.position.x;
		var after_elbow = (this.side == 'right') ? x <= middle_x : x >= middle_x;
		var move;
		if (after_elbow) {
			// After elbow
			move = new Point(0, -1);
			if (!this.spike_crossed) {
				// Spike crosses to segment
				var dir = this.learn_radius.find_nearest_spike();
				if (dir != null && dir.length >= LEARN_SPEED) {
					this.learn_radius._show();
					dir = dir.normalize();
					var translate = dir * LEARN_SPEED;
					console.log("Moving synapse by " + translate);
					this.d_s += translate;
					this.items.position += translate;
					this.learn_radius.items.position += translate;
				}
				this.spike_crossed = true;
			}
		} else {
			// Before elbow
			move = (this.axon.lastSegment.point - this.axon.firstSegment.point).normalize();
		}
		this.spike.position += move * PX_PER_STEP;
		if (this.spike.position.y <= TARGET_BODY[1]) {
			// Arrived at target cell body
			this.spike.remove();
			this.spike = null;
			this.spike_crossed = false;
			target.receive_spike();
		}
		if (this.body.opacity < 1) {
			this.body.opacity += 0.03;
		}
	},

	reset: function() {
		if (this.spike) this.spike.remove();
	},

	update: function(step) {
		if (step == 0) this.reset();
		else if (step == this.spike_ms) {
			this.start_spike();
		} else if (step > this.spike_ms && this.spike != null) {
			// Animate spike
			this.move_spike(step);
		}
	}

})

var h = view.size.height;

var target = new TargetCell();

// Sources (spike_ms, d_s, d_a)

var SCENARIOS = [
	{
		sources: [
			[10, 40, 60, 'left'],
			[20, 50, 60, 'right']
		],
		title: "Reverse order"
	},
	{
		sources: [
			[20, 40, 60, 'left'],
			[20, 50, 70, 'right']
		],
		title: "Simultaneous but misaligned (axon length differs)"
	},
	{
		sources: [
			[30, 40, 60, 'left'],
			[10, 50, 60, 'right']
		],
		title: "Ordered but mistimed (left moves closer to body)"
	},
	{
		sources: [
			[20, 30, 60, 'left'],
			[10, 50, 60, 'right']
		],
		title: "Ordered but mistimed (left input moves farther from body)"
	},
	{
		sources: [
			[20, 30, 60, 'left'],
			[20, 50, 60, 'right']
		],
		title: "Simultaneous but inputs misaligned"
	},
	{
		sources: [
			[20, 40, 60, 'left'],
			[30, 50, 60, 'right'],
			[40, 50, 60, 'left'],
		],
		title: "3 staggered inputs"
	},
	{
		sources: [
			[20, 40, 60, 'left'],
			[30, 50, 60, 'right'],
			[40, 60, 60, 'left'],
			[50, 70, 60, 'right'],
		],
		title: "Test!"
	}
];


var scenario_index = 6;
var scenario = SCENARIOS[scenario_index];
var sources = scenario.sources.map(function(sc) {
	return new SourceCell(sc[0], sc[1], sc[2], sc[3]);
});

this.title = new PointText({
	point: new Point(30, 30),
	content: scenario.title,
	fontSize: 30,
	fillColor: 'black'
});

function onFrame(event) {
	var step = event.count % LOOP_MS;
	for (var i = 0, l = sources.length; i < l; i++) {
		sources[i].update(step);
	}
	target.fade();
	if (step == 0) {
		target.reset();
		for (var i = 0, l = sources.length; i < l; i++) {
			var lr = sources[i].learn_radius;
			if (lr) lr.remove();
		}
	}
}


