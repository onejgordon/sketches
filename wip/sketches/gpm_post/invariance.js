// Illustrations for post on Generative Predictive Models
// Feed-Forward Invariance
// https://medium.com/p/f39eb8f10584/edit

// TODO:
// Identify 'dog cells' in R2, highlight them, and show invariance
// Show connections when active

var h = view.size.height;
var middle_x = view.size.width / 2;
var middle_y = h / 2;

var CELL_WIDTH = 10;
var CELL_HEIGHT = 40;
var CELL_GAP = 5;
var CL_INACTIVE = new Color(.2, .2, .2);
var CL_ACTIVE = new Color(1, 0, 0);
var REGION_GAP = 200;
var REGION_SIZES = [40, 12, 2];
var FPS = 20; // Frames per step
var N_DENDRITES = 2;
var ACTIVATION_THRESHOLD = 1;
var FEATURE_CELL_ACTIVE_PROB = 0.07;
var input_cells = REGION_SIZES[0];
var LABEL_X = 30;
var LABEL_COL_WIDTH = 160;
var LABEL_SIZE = 28;
var INPUT_FLOOR = h * .75;
var SWITCH_STEPS = 8;
var DENDRITE_BUFFER = 30;

var visible_object = null;
var regions = [];
var objects = [];
var probabilities = [];

function shuffle(_probabilities) {
	var rnd = Math.random();
	var sum = 0;
	var idx = null;
	for (var i = 0; i < _probabilities.length; i++) {
		var p = _probabilities[i];
		sum += p;
		if (rnd < sum) {
			idx = i;
			break;
		}
	}
	return idx;
}

function choose(list) {
	var idx = parseInt(Math.random() * list.length);
	return list[idx];
}

var SceneObject = Base.extend({
	initialize: function(opts) {
		console.log("Adding " + opts.label);
		this.label = opts.label;
		this.color = opts.color;
		this.probability = opts.probability;
		// Initialize random object feature inputs
		this.features = [];
		this.label_group = new Group();
		this.affinity = opts.affinity;

		// State
		this.active_feature_index = null;

		this.label_text = new PointText({
			point: new Point(LABEL_X, 0),
			content: this.label,
			fontWeight: 'bold',
			fontSize: LABEL_SIZE,
			fillColor: this.color
		})
		this.label_group.children.push(this.label_text);
		var label_cursor_x = LABEL_COL_WIDTH;
		opts.feature_labels.forEach(function(fl) {
			var input = [];
			var n_active = 0;
			for (var j = 0; j < input_cells; j++) {
				var active = Math.random() < FEATURE_CELL_ACTIVE_PROB;
				input.push(active);
				if (active) n_active += 1;
			}
			// Need at least one input
			if (n_active == 0) input[parseInt(Math.random() * input_cells)] = true;
			var text = new PointText({
				point: new Point(label_cursor_x, 0),
				content: fl,
				fontSize: LABEL_SIZE,
				fillColor: CL_INACTIVE
			});
			this.features.push({
				label: fl,
				input: input,
				text: text
			});
			console.log(fl + " " + input);
			label_cursor_x += LABEL_COL_WIDTH;
			this.label_group.children.push(text);
		}, this);
		this.label_group.position.y = h - opts.index * 30 - 20;
	},

	choose_next_state: function(visible) {
		// Either visible or not, if visible, randomly choose 1 feature
		var inputs;
		if (visible) {
			var up = Math.random() < 0.5;
			var n = this.features.length;
			this.active_feature_index += up ? 1 : -1;
			if (this.active_feature_index >= n) this.active_feature_index = 0;
			else if (this.active_feature_index < 0) this.active_feature_index = n-1;
			var feature = this.features[this.active_feature_index];
			inputs = feature.input;
			console.log(this.label +" visible, new feature index: " + this.active_feature_index);
		} else this.active_feature_index = null;
		return inputs;
	},

	update: function() {
		// Highlight active features
		this.features.forEach(function(f, i) {
			var active = this.active_feature_index == i;
			f.text.fillColor = active ? CL_ACTIVE : CL_INACTIVE;
		}, this)
	}

})

var Cell = Base.extend({
	initialize: function(region, index, group, sources) {
		this.region = region;
		this.index = index;
		this.group = group;
		var ul = new Point(index * (CELL_WIDTH + CELL_GAP), 0);
		var br = ul + new Point(CELL_WIDTH, CELL_HEIGHT);
		this.anchor = br - new Point(CELL_WIDTH/2, 0);
		this.path = new Shape.Rectangle(ul, br);
		this.path.fillColor = CL_INACTIVE;
		this.group.children.push(this.path);
		this.sources = sources;
		this.active = false;
		this.dendrites = [];
		this.active_dendrites = [];
	},

	active_sources: function() {
		this.active_dendrites = [];
		if (!this.region.is_input_region()) {
			var input_region = regions[this.region.index - 1];
			this.sources.forEach(function(src) {
				var c = input_region.cells[src];
				if (c.active) this.active_dendrites.push(src);
			}, this);
		}
		return this.active_dendrites;
	},

	is_active: function() {
		return this.active_sources().length >= ACTIVATION_THRESHOLD;
	},

	update: function(step) {
		console.log(this.active_dendrites);
		var color = this.active ? CL_ACTIVE : CL_INACTIVE;
		this.path.fillColor = color;
		this.sources.forEach(function(src, idx) {
			var active = this.active_dendrites.indexOf(src) > -1;
			this.dendrites[idx].opacity = active ? 1 : 0;
		}, this);
	},

	set_affinity: function(object) {
		var ri = this.region.index;
		var affinity_in_inputs = ri == 1; // Above inputs
		if (affinity_in_inputs) {
			for (var i = 0; i < N_DENDRITES; i++) {
				// Random feature
				var f = choose(object.features);
				// Random active input from feature
				var active_indexes = [];
				f.input.forEach(function(_input, index) {
					if (_input) active_indexes.push(index);
				});
				this.sources[i] = choose(active_indexes);
			}
		} else {
			// Choose sources as per affinity in region below
			this.sources = object.affinity[ri-2];
		}
		console.log("Sources for cell " + this.index + " in region " + ri + ": " + this.sources);
		var x = this.path.bounds.x;
		var y = this.path.bounds.y + this.path.bounds.size.height;
		var ul = new Point(x, y + 2);
		var br = ul + new Point(CELL_WIDTH, 5);
		this.highlight = new Path.Rectangle(ul, br);
		this.highlight.fillColor = object.color;
	}

})

// Region of "layer" composed of n_cells
var Region = Base.extend({
	initialize: function(index, n_cells) {
		console.log("Initializing region " + index + " with " + n_cells + " cells");
		this.index = index;
		this.group = new Group();
		this.input_layer_cells = 0;
		if (!this.is_input_region()) this.input_layer_cells = REGION_SIZES[index-1];
		this.cells = this.create_cells(n_cells, this.group);
		this.group.position.y = INPUT_FLOOR - index * REGION_GAP;
		this.group.position.x = middle_x; // - this.group.bounds.size.width;
	},

	is_input_region: function() {
		return this.index == 0;
	},

	create_cells: function(n_cells, group) {
		var cells = [];
		for (var i = 0; i < n_cells; i++) {
			var sources = [];
			if (!this.is_input_region()) {
				while (sources.length < N_DENDRITES) {
					var src = parseInt(this.input_layer_cells * Math.random());
					if (sources.indexOf(src) == -1) sources.push(src);
				}
			}
			cells.push(new Cell(this, i, group, sources));
		}
		return cells;
	},

	update: function() {
		for (var i = 0; i < this.cells.length; i++) {
			var c = this.cells[i];
			c.active = c.is_active();
			c.update();
		}
	}
})


function setup() {
	// Initialize regions
	for (var i = 0; i < REGION_SIZES.length; i++) {
		regions.push(new Region(i, REGION_SIZES[i]));
	}

	// Objects in sensory environment
	objects = [
		new SceneObject({
			label: "Dog",
			feature_labels: ["Nose", "Ears", "Wagging Tail"],
			probability: 0.7,
			color: 'brown',
			index: 0,
			affinity: [[2, 6, 7, 8], [1]]
		}),
		new SceneObject({
			label: "Tree",
			feature_labels: ["Leaves", "Shade", "Green"],
			probability: 0.3,
			color: 'green',
			index: 1,
			affinity: [[1, 3, 5, 9], [0]]
		})
	];

	visible_object = 0; // Start with first

	// Override cells in R2 and R3 to respond to each
	// each objects features as per affinity prop of objects
	objects.forEach(function(o, object_index) {
		o.affinity.forEach(function(cell_indexes, region_index) {
			cell_indexes.forEach(function(cell_index) {
				var c = regions[region_index+1].cells[cell_index];
				c.set_affinity(objects[object_index]);
			});
		});
	});

	probabilities = objects.map(function(o) { return o.probability; });

	// Draw dendrites for each cell
	regions.forEach(function(r) {
		if (!r.is_input_region()) {
			var input_region = regions[r.index - 1];
			r.cells.forEach(function(c) {
				c.sources.forEach(function(src) {
					var from = c.path.position + new Point(0, DENDRITE_BUFFER);
					var dest = input_region.cells[src];
					var to = dest.path.position + new Point(0, -1 * DENDRITE_BUFFER);
					var line = new Path.Line(from, to);
					line.strokeColor = CL_INACTIVE;
					line.opacity = 0;
					c.dendrites.push(line);
				}, this);
			});
		}
	});
}

function generate_inputs(count, n) {
	var inputs = [];
	// Initialize inputs to inactive
	for (var i = 0; i < n; i++) {
		inputs.push(false);
	}
	var rnd = Math.random();
	var switch_objects = count % SWITCH_STEPS == 0;
	if (switch_objects) {
		// Switch objects
		visible_object = shuffle(probabilities);
	}
	for (var i = 0; i < objects.length; i++) {
		var o = objects[i];
		var visible = visible_object == i;
		var _inputs = o.choose_next_state(visible);
		if (_inputs) inputs = _inputs;
		o.update();
	}
	console.log(count)
	return inputs;
}

// var counter = new PointText({
// 	point: new Point(10, 10),
// 	content: ''
// })

function onFrame(event) {
	var step = parseInt(event.count / FPS);
	// counter.content = step;
	if (event.count % FPS == 0) {
		for (var i = 0; i < regions.length; i++) {
			var r = regions[i];
			if (r.is_input_region()) {
				var inputs = generate_inputs(step, r.cells.length);
				for (var j = 0; j < r.cells.length; j++) {
					var c = r.cells[j];
					c.active = inputs[j];
					c.update();
				}
			} else {
				regions[i].update();
			}
		}
	}
}

setup();


