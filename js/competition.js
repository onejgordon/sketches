
var w = view.size.width;
var h = view.size.height;

var PER_SIDE = 20;
var SIDE_LEN = w / 20;
var CENTER_X = w / 2;
var CENTER_Y = h / 2;

// bg
document.getElementById("myCanvas").style = "background-color: #000000";

var Building = Base.extend({
	initialize: function(i, j) {
		this.i = i;
		this.j = j;
		var ul = new Point(this.i*SIDE_LEN, this.j*SIDE_LEN);
		var br = ul + new Point(SIDE_LEN, SIDE_LEN);
		this.base = new Path.Rectangle(ul, br);
		this.base.fillColor = 'white';
		this.base.strokeColor = 'gray';
	},

	update: function() {

	}
})


// Rows and cols (i,j)
var buildings = [];

function setup() {
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
	if (animate) {
		buildings.forEach((row) => {
			row.forEach((bld) => {
				bld.update();
			});
		});
	}
}

setup();