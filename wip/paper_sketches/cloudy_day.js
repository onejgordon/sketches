
var N_CLOUDS = 15;
var N_POINTS = 16;
var HANDLE_W = 50;
var SIZE_DIFF = 25;
var SPEED_MULT = 0.5;
var SHAKE_MULT = 0.01;
var PLANET_SIZE = 200;

var Cloud = Base.extend({
	initialize: function(center, size) {
		var segments = [];
		var phi = 360 / N_POINTS;
		var toggle = true;
		for (var i=0; i < N_POINTS; i++) {
			var p = new Segment({
				point: new Point({
					length: toggle ? size : size * 1.2,
					angle: (i+1)*phi
				}),
				// handleIn: new Point({angle: i*phi - HANDLE_W, length: 1}),
				// handleOut: new Point({angle: i*phi + HANDLE_W, length: 1}),
			});
			segments.push(p);
			toggle = !toggle;
		}
		this.path = new Path({
			segments: segments,
			position: center
		});
		this.path.closed = true;
		this.path.fillColor = this.get_color();
		this.speed = Math.random() * SPEED_MULT;
		this.path.smooth();
	},

	get_color: function() {
		var c1 = new Color(.3 + Math.random() / 3, .5, .5 + (Math.random() /2));
		var c2 = new Color(.3 + Math.random() / 3, .5, .5 + (Math.random() /2));
		return {
			gradient: {
				stops: [c1, c2],
				radial: true
			},
			origin: this.path.position,
			destination: this.path.bounds.rightCenter
		};
	},

	update: function(count) {
		this.path.rotate(this.speed + Math.sin((count * SHAKE_MULT)));
	}

})

var clouds = [];

var MAX_SIZE = PLANET_SIZE + N_CLOUDS * SIZE_DIFF;
for (var i = 0; i < N_CLOUDS; i++) {
	clouds.push(new Cloud(view.center, MAX_SIZE - i*SIZE_DIFF));
}

var atmosphere = new Path.Circle(view.center, PLANET_SIZE * 1.05);
atmosphere.fillColor = '#ccc';

var planet = new Path.Circle(view.center, PLANET_SIZE);
planet.fillColor = 'white';


function onMouseMove(event) {

}

function onFrame(event) {
	for (var i = 0, l = clouds.length; i < l; i++) {
		clouds[i].update(event.count);
	}

}

function onResize(event) {

}

