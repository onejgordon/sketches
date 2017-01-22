
var w = view.size.width;
var h = view.size.height;

var FPS = 3;
var PER_SIDE = 40;
var BUFFER = 110;
var SIDE_LEN = (w - BUFFER*2) / PER_SIDE;
var CENTER_X = w / 2;
var CENTER_Y = h / 2;
var PERSPECTIVE = 0; //0.005;
var RATE_CHANGE_STEP = 0.1;
var MAX_RATE = 1;
var MIN_RATE = 0.1;
var MAX_HEIGHT = 100;
var MAX_STARTING_HEIGHT = 20;

var WALL_COLOR = new Color(0.7, 0.7, 0.7);
var ROOF_COLOR = 'white';
var ACCEL_COLOR = 'green';
var DECEL_COLOR = 'orange';

// LEVERS

// neighborhood: Radius of neighborhood for passing to rate fn
// rate_fn:
// -- Function to return new rate (on each time step)
// -- Pass each building and its neighbors
// -- Return amount to change rate

var TRIALS = [
	{
		label: "Lucky at start win",
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var ave_height = _.mean(nbrs.map(function(b) { return b.height }));
			var diff = bldg.height - ave_height;
			if (Math.abs(diff) > 15) {
				// Large difference,
				return diff > 0 ? -RATE_CHANGE_STEP : RATE_CHANGE_STEP;
			} else return 0;
		}
	},
	{
		label: "Lucky at start win",
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var max_height = _.max(nbrs.map(function(b) { return b.height }));
			return max_height < bldg.height ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
		}
	},
	{
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var ave_height = _.mean(nbrs.map(function(b) { return b.height }));
			return ave_height < bldg.height ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
		}
	},
	{
		neighborhood: 3,
		rate_change_fn: function(bldg, nbrs) {
			var cohort = nbrs.filter(function(n) {
				var diff = Math.abs(n.height - bldg.height);
				return diff < 20;
			})
			if (cohort.length > 0) {
				var cohort_ave = _.mean(cohort.map(function(b) { return b.height }));
				return cohort_ave > bldg.height ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
			}
			else return 0;
		}
	},
	{
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var ave_height = _.mean(nbrs.map(function(b) { return b.height }));
			var diff_from_ave = Math.abs(bldg.height - ave_height);
			if (diff_from_ave > 3) {
				return -1 * RATE_CHANGE_STEP;
			} else return RATE_CHANGE_STEP;
		}
	},
	{
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var ave_height = _.mean(nbrs.map(function(b) { return b.height }));
			if (ave_height > 1.2 * bldg.height) {
				return RATE_CHANGE_STEP;
			} else return 0;
		}
	},
	{
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var cohort = nbrs.filter(function(n) {
				var diff = Math.abs(n.height - bldg.height);
				return diff < 40;
			})
			if (cohort.length > 0) return _.mean(cohort.map(function(b) { return b.rate })) - bldg.rate;
			else return 0;
		}
	}
]

var tindex = 0;
var t = TRIALS[tindex];
var NEIGHBORHOOD = t.neighborhood;
var RATE_FN = t.rate_change_fn;


// bg
document.getElementById("myCanvas").style = "background-color: #000000";

var Building = Base.extend({
	initialize: function(i, j) {
		this.i = i;
		this.j = j;
		this.rate = Math.random() * MAX_RATE / 5;
		this.height = Math.random() * MAX_STARTING_HEIGHT;
		var ul = new Point(BUFFER + this.i*SIDE_LEN, BUFFER+ this.j*SIDE_LEN);
		var ur = ul + new Point(SIDE_LEN, 0);
		var br = ul + new Point(SIDE_LEN, SIDE_LEN);
		var ll = ul + new Point(0, SIDE_LEN);
		this.floor = new Path.Rectangle(ul, br); // Same as base to start
		this.floor.fillColor = 'white';
		this.floor.strokeColor = 'gray';
		this.sides = new Path([ul, ul, br, br, ll]);
		this.sides.fillColor = WALL_COLOR;
		this.sides.closed = true;
		this.sides.strokeColor = 'gray';
		this.roof = new Path.Rectangle(ul, br); // Same as base to start
		this.roof.fillColor = ROOF_COLOR;
		this.roof.strokeColor = 'gray';
		this.grow_roof(this.height);
	},

	grow_roof: function(amount) {
		this.roof.translate(new Point(amount, -amount));
		var roof_bounds = this.roof.bounds;
		this.roof.scale(1+(PERSPECTIVE*amount), new Point(roof_bounds.left, roof_bounds.bottom));
		return roof_bounds;
	},

	set_color: function(color) {
		this.roof.fillColor = color;
		this.sides.fillColor = color;
	},

	reset_color: function() {
		this.roof.fillColor = ROOF_COLOR;
		this.sides.fillColor = WALL_COLOR;
	},

	highlight: function() {
		this.set_color('blue');
	},

	neighbors: function() {
		// Returns neighbors based on neighborhood size
		var nbrs = [];
		for (var i = this.i - NEIGHBORHOOD; i < this.i + NEIGHBORHOOD; i++) {
			for (var j = this.j - NEIGHBORHOOD; j < this.j + NEIGHBORHOOD; j++) {
				if (i >= 0 & i < PER_SIDE && j >= 0 && j < PER_SIDE && !(i==this.i && j==this.j)) {
					// Valid neighbor
					nbrs.push(buildings[i][j]);
				}
			}
		}
		return nbrs;
	},

	grow: function() {
		var rate_change = RATE_FN(this, this.neighbors());
		if (rate_change != 0) {
			this.rate += rate_change;
			var increase = rate_change > 0;
			if (increase) this.set_color(ACCEL_COLOR);
			else this.set_color(DECEL_COLOR)
			if (this.rate > MAX_RATE) this.rate = MAX_RATE;
			else if (this.rate < MIN_RATE) this.rate = MIN_RATE;
		} else this.reset_color();
		this.height += this.rate;
		var roof_bounds = this.grow_roof(this.rate);
		this.sides.segments[1].point.x = roof_bounds.left;
		this.sides.segments[1].point.y = roof_bounds.top;
		this.sides.segments[2].point.x = roof_bounds.right;
		this.sides.segments[2].point.y = roof_bounds.bottom;
		return this.height > MAX_HEIGHT;
	}
})


// Rows and cols (i,j)
var buildings = [];
var running = true;

function all_buildings() {
	var bldgs = [];
	buildings.forEach(function(row) {
		row.forEach(function(bld) {
			bldgs.push(bld);
		})
	})
	return bldgs;
}

function setup() {
	for (var i = 0; i < PER_SIDE; i++) {
		buildings.push([]);
		for (var j = 0; j < PER_SIDE; j++) {
			buildings[i].push(new Building(PER_SIDE-i-1, j));
		}
	}
}


function onFrame(event) {
	var step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate && running) {
		var log_rates = event.count % 50 == 0;
		if (log_rates) {
			var ave_rate = _.mean(all_buildings().map(function(b) { return b.rate; }));
			var ave_height = _.mean(all_buildings().map(function(b) { return b.height; }));
			console.log("Average rate: " + ave_rate + " height: " + ave_height);
		}
		buildings.forEach(function(row) {
			row.forEach(function(bld) {
				var _end = bld.grow();
				if (_end) {
					// bld.highlight();
					running = false;
				}
			});
		});
	}
}

setup();