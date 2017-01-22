
var w = view.size.width;
var h = view.size.height;

var FPS = 3;
var PER_SIDE = 20;
var BUFFER = 110;
var SIDE_LEN = (w - BUFFER*2) / PER_SIDE;
var CENTER_X = w / 2;
var CENTER_Y = h / 2;
var PERSPECTIVE = 0; //0.005;
var RATE_CHANGE_STEP = 0.2;
var MAX_RATE = 1;
var MIN_RATE = -1;
var MAX_HEIGHT = 100;
var MIN_HEIGHT = 0;
var MAX_STARTING_HEIGHT = 20;

var WALL_COLOR = new Color(0.7, 0.7, 0.7);
var ROOF_COLOR = new Color(.9, .9, .9);
var ACCEL_COLOR = new Color(0.7, 1, 0.7);
var DECEL_COLOR = new Color(1, 0.8, 0.8);
var HL_COLOR = new Color(.5, .5, .9);

// LEVERS

// neighborhood: Radius of neighborhood for passing to rate fn
// rate_fn:
// -- Function to return new rate (on each time step)
// -- Pass each building and its neighbors
// -- Return amount to change rate

var TRIALS = [
	{
		rule: "Smaller neighbors are food, appetite grows with height",
		result: "Short-lived rises before eventual shortage",
		neighborhood: 5,
		rate_change_fn: function(bldg, nbrs) {
			var n_competitors = 0;
			var food = nbrs.map(function(b) {
				var is_food = b.height * 1.3 < bldg.height;
				var is_competitor = !is_food;
				if (is_competitor) n_competitors += 1;
				return is_food ? b.height : 0;
			});
			var food_available = _.sum(food) / (n_competitors + 1);
			var excess_food = food_available - bldg.height / 2;
			if ((Math.abs(excess_food)) < 1) return 0;
			return excess_food > 0 ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
		}
	},
	{
		rule: "Speed proportional to distance to highest neighbor",
		result: "Growth cohorts develop around leaders",
		neighborhood: 3,
		rate_change_fn: function(bldg, nbrs) {
			var heights = nbrs.map(function(b) { return b.height });
			var max = _.max(heights);
			var diff = max - bldg.height;
			var highest = bldg.height >= max;
			if (highest) return 0;
			var ratio = bldg.height / max;
			return RATE_CHANGE_STEP * (0.5 - ratio);
		}
	},
	{
		rule: "Match average rate of neighbors with similar height",
		result: "Some cohorts break free, others stagnate or zero",
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			nbrs = nbrs.concat(bldg);
			var cohort_rates = [];
			nbrs.forEach(function(n) {
				var pd = pct_diff(n.height, bldg.height);
				if (pd < .3) {
					// In cohort
					cohort_rates.push(n.rate);
				}
			});
			var cohort_ave = _.mean(cohort_rates);
			var cohort_faster = cohort_ave > bldg.rate;
			var sig = pct_diff(bldg.rate, cohort_ave) > .7;
			if (!sig) return 0;
			return cohort_faster ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
		}
	},
	{
		rule: "Match direction to majority of neighbors' directions",
		result: "Initially shrinking areas quickly zero and infringe on growth",
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var rate_signs = nbrs.map(function(b) { return b.rate > 0 ? 1 : -1; });
			var most_up = _.mean(rate_signs) > 0;
			return most_up ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
		}
	},
	{
		rule: "Accelerate only if all neighbors similar in height",
		result: "Stable oscillating at low height -- leaders held back",
		neighborhood: 1,
		rate_change_fn: function(bldg, nbrs) {
			nbrs = nbrs.concat(bldg);
			var heights = nbrs.map(function(b) { return b.height });
			var std = stddev(heights);
			var ave = _.mean(heights);
			var delta = Math.abs(ave - bldg.height);
			// console.log('std ' + std + ' mean ' + ave + ' delta ' + delta);
			if (std < 3) return RATE_CHANGE_STEP;
			else if (std < 6) return 0;
			else return -RATE_CHANGE_STEP;
		}
	},
	{
		rule: "Highest in neighborhood accelerates",
		result: "Highest at start win",
		neighborhood: 2,
		rate_change_fn: function(bldg, nbrs) {
			var max_height = _.max(nbrs.map(function(b) { return b.height }));
			return max_height < bldg.height ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
		}
	},
	{
		rule: "Highest in neighborhood accelerates (bigger hoods)",
		result: "Highest at start win (fewer winners)",
		neighborhood: 5,
		rate_change_fn: function(bldg, nbrs) {
			var max_height = _.max(nbrs.map(function(b) { return b.height }));
			return max_height < bldg.height ? RATE_CHANGE_STEP : -RATE_CHANGE_STEP;
		}
	}

]

var tindex = 0;
var trial = TRIALS[tindex];
var NEIGHBORHOOD = trial.neighborhood;
var RATE_FN = trial.rate_change_fn;


// bg
document.getElementById("myCanvas").style = "background-color: #FFFFFF";

var Building = Base.extend({
	initialize: function(i, j) {
		this.i = i;
		this.j = j;
		this.rate = Math.random() * (MAX_RATE - MIN_RATE) + MIN_RATE;
		this.height = Math.random() * MAX_STARTING_HEIGHT;
		var ul = new Point(BUFFER + this.j*SIDE_LEN, BUFFER+ this.i*SIDE_LEN);
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
		this.roof.onClick = this.log.bind(this);
	},

	log: function(e) {
		console.log(this.i + ', ' + this.j);
		console.log('height: ' + this.height);
		console.log('rate: ' + this.rate);
		this.neighbors().forEach(function(n) {
			console.log(n.i + ', ' + n.j);
		})
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
		this.set_color(HL_COLOR);
	},

	neighbors: function() {
		// Returns neighbors based on neighborhood size
		var nbrs = [];
		for (var i = this.i - NEIGHBORHOOD; i <= this.i + NEIGHBORHOOD; i++) {
			for (var j = this.j - NEIGHBORHOOD; j <= this.j + NEIGHBORHOOD; j++) {
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
		if (this.height < MIN_HEIGHT) this.height = MIN_HEIGHT;
		else {
			var roof_bounds = this.grow_roof(this.rate);
			this.sides.segments[1].point.x = roof_bounds.left;
			this.sides.segments[1].point.y = roof_bounds.top;
			this.sides.segments[2].point.x = roof_bounds.right;
			this.sides.segments[2].point.y = roof_bounds.bottom;
		}
		return this.height > MAX_HEIGHT;
	}
})


// Rows and cols (i,j)
var buildings = [];
var running = true;
var step = 0;

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
		var row = [];
		// Populate
		while (row.length < PER_SIDE) {
			row.push(null);
		}
		buildings.push(row);
		for (var j = PER_SIDE-1; j >= 0; j--) {
			buildings[i][j] = new Building(i, j);
		}
	}

	// Show rule & result text
	var rule = trial.rule;
	var result = trial.result;
	if (rule) new PointText({
		point: new Point(30, h - 50),
		content: "Rule: " + rule,
		fillColor: 'black',
		fontSize: 20
	});
	if (result) new PointText({
		point: new Point(30, h - 30),
		content: "Result: " + result,
		fillColor: new Color(.5, .5, .5),
		fontSize: 17
	});
}


function onFrame(event) {
	step = parseInt(event.count / FPS);
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
					bld.highlight();
					running = false;
				}
			});
		});
	}
}

setup();

// Utils

function stddev(array) {
    var avg = _.sum(array) / array.length;
    return Math.sqrt(
    	_.sum(_.map(array, function(i) {
	    	return Math.pow((i - avg), 2)
    	})) / array.length);
};

function pct_diff(one, two) {
	return Math.abs(Math.abs(one - two) / two);
}