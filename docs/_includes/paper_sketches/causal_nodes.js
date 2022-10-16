// TODO
// Click nodes to force active (empirical cause induction)
// Spatial pooling patterns (non-temporal correlations?)

var w = view.size.width;
var h = view.size.height;

var FPS = 4;

// State
var t = 0;
var showing_causes = false;

var INACTIVE_COLOR = "#CCCCCC";
var ACTIVE_COLOR = "#00CCFF";
var INACTIVE_COLOR_S = "#D3A5B3";
var ACTIVE_COLOR_S = "#FF1C81";
var O_RAD = 20;
var TIME_HORIZON = 5;
var REFRACTORY_PERIOD = 3;
var MAX_PROBABILITY = 0.7;
var ACTIVE_DURATION = 3;
var NON_CAUSAL_CHANCE = 0.01;
var MARGIN = 70;
var ROWS = 4;
var COLS = 4;
var MAX_DIST = 100;
var TARGET_VEL = new Point(3,3);
var NODE_CAUSE_PCT = 0.5;

var PATTERN_SCHEME = "index+1" // "random", "below", "closest corner"

function handleClick(e) {
	this.activate();
	e.stopPropagation();
	return false;
}

var Node = Base.extend({
	initialize: function(idx, center) {
		this.idx = idx;
		this.circle = new Path.Circle(center, O_RAD);
		this.circle.fillColor = INACTIVE_COLOR;
		this.circle.onMouseDown = handleClick.bind(this);
		this.active = false;
		this.last_active = 0;
		this.cause_idx = -1;
		this.is_cause = false;
	},

	should_activate: function() {
		if (this.active) return false;
		var since_last_active = t - this.last_active;
		var refractory = since_last_active < REFRACTORY_PERIOD;
		if (refractory) return false;
		if (this.cause_idx > -1) {
			var cause_active_ago = t - nodes[this.cause_idx].last_active;
			if (cause_active_ago <= TIME_HORIZON) {
				var cutoff = MAX_PROBABILITY * (TIME_HORIZON - cause_active_ago) / TIME_HORIZON
				if (Math.random() < cutoff) return true;
			}
		} else {
			// Non-causal node
			if (Math.random() < NON_CAUSAL_CHANCE) {
				return true;
			}
		}
		return false;
	},

	should_deactivate: function() {
		return (this.active && (t - this.last_active) >= ACTIVE_DURATION)
	},

	activate: function() {
		this.active = true
		this.last_active = t
		this.circle.fillColor = (showing_causes && this.is_cause) ? ACTIVE_COLOR_S : ACTIVE_COLOR;
	},

	deactivate: function() {
		this.active = false
		this.circle.fillColor = (showing_causes && this.is_cause) ? INACTIVE_COLOR_S : INACTIVE_COLOR;
	},

	update: function() {
		if (this.should_activate()) {
			this.activate()
		} else if (this.should_deactivate()) {
			this.deactivate()
		}
	}
})

var nodes = []

function setup() {
	var x=MARGIN, y=MARGIN;
	var dx = w/COLS;
	var dy = h/ROWS;
	var idx = 0;
	for (var i=0; i<ROWS; i++) {
		for (var j=0; j<COLS; j++) {
			var node = new Node(idx, new Point(x, y));
			nodes.push(node)
			x += dx;
			idx += 1
		}
		x = MARGIN;
		y += dy;
	}
	// Initialize cause relations (as per scheme)
	var n = nodes.length
	_.sampleSize(nodes, parseInt(NODE_CAUSE_PCT * n)).forEach(function(node) {
		var cause_idx = -1;
		if (PATTERN_SCHEME == "random") cause_idx = parseInt(Math.random() * n);
		else if (PATTERN_SCHEME == "index+1") cause_idx = node.idx - 1;
		else if (PATTERN_SCHEME == "below") {
			cause_idx = node.idx + COLS;
		}
		if (cause_idx >= n) cause_idx -= n;
		if (node.idx != cause_idx) {
			var cause = nodes[cause_idx];
			if (!cause.is_cause) {
				// Not already a cause, we can make it one
				node.cause_idx = cause_idx;
				nodes[cause_idx].is_cause = true;				
			}
		}
	})

}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate) {
		t += 1
		nodes.forEach(function(node) {
			node.update();
		})
	}
}

function onMouseDown(event) {
	showing_causes = !showing_causes;
}

setup()
