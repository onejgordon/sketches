
var w = view.size.width;
var h = view.size.height;

var FPS = 10;
var PER_SIDE = 20;
var SIDE_LEN = w / 20;
var CENTER_X = w / 2;
var CENTER_Y = h / 2;

var MAX_HEIGHT = 10;

// bg
document.getElementById("myCanvas").style = "background-color: #000000";

var Building = Base.extend({
	initialize: function(i, j) {
		this.i = i;
		this.j = j;
		this.rate = Math.random();
		this.height = 0;
		var ul = new Point(this.i*SIDE_LEN, this.j*SIDE_LEN);
		var br = ul + new Point(SIDE_LEN, SIDE_LEN);
		this.sides = new Path()
		this.floor = new Path.Rectangle(ul, br); // Same as base to start
		this.floor.fillColor = 'white';
		this.floor.strokeColor = 'gray';
		this.roof = new Path.Rectangle(ul, br); // Same as base to start
		this.roof.fillColor = 'white';
		this.roof.strokeColor = 'gray';
	},

	grow: function() {
		this.height += this.rate;
		this.roof.translate(new Point(this.rate, this.rate));
		return this.height > MAX_HEIGHT;
	}
})


// Rows and cols (i,j)
var buildings = [];
var running = true;

function setup() {
	console.log('setup1')
	for (var i = 0; i < PER_SIDE; i++) {
		buildings.push([]);
		for (var j = 0; j < PER_SIDE; j++) {
			buildings[i].push(new Building(i, j));
		}
	}
}


function onFrame(event) {
	var step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate && running) {
		buildings.forEach(function(row) {
			row.forEach(function(bld) {
				var _end = bld.grow();
				if (_end) running = false;
			});
		});
	}
}

setup();