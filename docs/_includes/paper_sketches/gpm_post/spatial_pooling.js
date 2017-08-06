// Illustrations for post on Generative Predictive Models
// Spatial Pooling
// https://medium.com/p/f39eb8f10584/edit

// TODO:
// Add middle row of inputs to spatial sensitivity to top/bottom only

var h = view.size.height;
var middle_x = view.size.width / 2;
var middle_y = h / 2;

var CELL_WIDTH = 20;
var CELL_HEIGHT = 40;
var CELL_GAP = 3;
var CL_INACTIVE = new Color(.2, .2, .2);
var CL_ACTIVE = new Color(0, .7, 0);
var CL_ACTIVE_INHIBIT = new Color(.5, 0, 0);
var REGION_GAP = 100;
var FPS = 30; // Frames per step
var N_DENDRITES = 2;
var ACTIVATION_THRESHOLD = 3;
var INPUT_FLOOR = h * .3;
var DENDRITE_BUFFER = 30;
var IMAGE_SIDE = 100;
var N_IMAGES = 7;
var INPUT_Y_JITTER = 40;
var IMAGE_W = 275;
var IMAGE_H = 183;
var REGION_SIZES = [12, 1];
var input_cells = REGION_SIZES[0];
var regions = [];
var markers = [];

var img;
var is_setup = false;
var raster_tl;
var label, result_label;

var ImageMarker = Base.extend({
	// Read average brightness at a location on an image
	initialize: function(center, cell) {
		this.center = center;
		this.cell = cell;
		this.on = false;
		var outer = new Path.Circle({
			center: center,
			radius: 8
		});
		var inner = new Path.Circle({
			center: center,
			radius: 5
		});
		var ring = outer.subtract(inner);
		var top = INPUT_FLOOR + CELL_HEIGHT/2;
		var line = new Path.Line(new Point(center.x, center.y-8), new Point(center.x, top));
		line.strokeWidth = 2;
		this.path = new Group([ring, line]);
		this.path.fillColor = 'white';
		this.path.strokeColor = 'white';
	},

	average_brightness: function() {
		var point = this.center - raster_tl;
		var brightnesses = [];
		var rad = 2;
		brightnesses.push(raster.getPixel(point + new Point(rad, 0)).brightness);
		brightnesses.push(raster.getPixel(point + new Point(0, rad)).brightness);
		brightnesses.push(raster.getPixel(point + new Point(-rad, 0)).brightness);
		brightnesses.push(raster.getPixel(point + new Point(0, -rad)).brightness);
		return _.mean(brightnesses);
	},

	is_on: function() {
		this.on = this.average_brightness() > 0.4;
		return this.on;
	},

	update: function() {
		var color = 'white';
		var excite = this.cell.excitatory;
		if (this.on) {
			color = excite ? CL_ACTIVE : CL_ACTIVE_INHIBIT;
		}
		this.path.fillColor = color;
		this.path.strokeColor = color;
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
		this.activation = 0;
		this.excitatory = [1,5,9].indexOf(index) == -1;
	},

	total_activation: function() {
		this.active_dendrites = [];
		this.activation = 0;
		if (!this.region.is_input_region()) {
			var input_region = regions[this.region.index - 1];
			this.sources.forEach(function(src) {
				var c = input_region.cells[src];
				if (c.active) {
					this.active_dendrites.push(src);
					var delta = c.excitatory ? 1 : -1;
					this.activation += delta;
				}
			}, this);
		}
		return this.activation;
	},

	is_active: function() {
		return this.total_activation() >= ACTIVATION_THRESHOLD;
	},

	update: function(step) {
		var color = CL_INACTIVE;
		if (this.active) {
			color = this.excitatory ? CL_ACTIVE : CL_ACTIVE_INHIBIT;
		}
		this.path.fillColor = color;
		this.sources.forEach(function(src, idx) {
			var active = this.active_dendrites.indexOf(src) > -1;
			this.dendrites[idx].opacity = active ? 1 : 0.2;
		}, this);
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
				for (var i = 0; i < this.input_layer_cells; i++) {
					var odd = i % 2 == 1;
					if (odd) sources.push(i);
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
					line.strokeColor = dest.excitatory ? CL_ACTIVE : CL_ACTIVE_INHIBIT;
					line.opacity = 0;
					c.dendrites.push(line);
				}, this);
			});
		}
	});

	// Add image
	var image_y = h - 300;
	raster = new Raster(image_file(1));
	raster.position = new Point(middle_x, image_y);
	raster_tl = new Point(raster.position.x - IMAGE_W/2, raster.position.y - IMAGE_H/2);

	// Preload
	for (var i = 0; i < N_IMAGES; i++) {
		raster.source = image_file(i+1);
	}

	// Add sample markers
	var n_inputs = regions[0].cells.length;
	for (var i = 0; i < n_inputs; i++) {
		var y = Math.sin(i * Math.PI/2) * INPUT_Y_JITTER + raster.position.y;
		console.log('x ' + x);
		console.log('y ' + y);
		var x = regions[0].cells[i].path.position.x;
		markers.push(new ImageMarker(new Point(x, y), regions[0].cells[i]));
	}

	// Add activation label
	label = new PointText({
		point: new Point(middle_x, 84),
		content: '',
		fillColor: 'white',
		fontSize: 15
	});
	label.justification = 'center';
	label.bringToFront();
	is_setup = true;

	// Add activation label
	result_label = new PointText({
		point: new Point(middle_x + 20, 84),
		content: '',
		fillColor: 'gray',
		fontSize: 15
	});
	result_label.justification = 'left';
	result_label.bringToFront();

	console.log('setup complete');
}

function calculate_inputs() {
	var inputs = [];
	markers.forEach(function(marker, i) {
		var on = marker.is_on()
		marker.update()
		inputs[i] = on;
	});
	return inputs;
}

function image_file(i) {
	var file = "i" + i + ".jpg";
	return "/assets/pgm_post/" + file;
}

function onFrame(event) {
	if (is_setup) {
		var step = parseInt(event.count / FPS);
		// counter.content = step;
		if (event.count % FPS == 0) {
			raster.source = image_file(step % N_IMAGES + 1)
			raster.onLoad = function() {
				var inputs = calculate_inputs();
				regions.forEach(function(r, i) {
					if (r.is_input_region()) {
						for (var j = 0; j < r.cells.length; j++) {
							var c = r.cells[j];
							c.active = inputs[j];
							c.update();
						}
					} else {
						regions[i].update();
					}
				});
				// Update label
				var top_activation = regions[1].cells[0].activation;
				var active = top_activation >= 3;
				label.content = top_activation;
				result_label.content = active ? "Top bright" : "Inactive";
				result_label.fillColor = active ? CL_ACTIVE : CL_INACTIVE;
			}
		}
	}
}

setup();

