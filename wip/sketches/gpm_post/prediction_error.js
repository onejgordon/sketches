// Illustrations for post on Generative Predictive Models
// Prediction error
// https://medium.com/p/f39eb8f10584/edit

var h = view.size.height;
var w = view.size.width;
var middle_x = view.size.width / 2;
var middle_y = h / 2;
var WALL_INSET = 70;

var OBJECT_RAD = 20;
var LEARN_RATE = 0.1;
var INIT_SPEED = 5;
var FPS = 3;

var object = null;
var prediction = null;

var ErrorBar = new Path.Line(new Point(0, h), new Point(10, h));
ErrorBar.strokeWidth = 10;
ErrorBar.strokeColor = 'red';
Label = new PointText({
	point: new Point(2, h-10),
	content: 'Prediction Error',
	fillColor: 'red',
	fontSize: 15
});
Label.justification = 'left';

var VisualObject = Base.extend({
	initialize: function(center, type) {
		this.type = type;
		this.velocity = new Point(INIT_SPEED, INIT_SPEED) * Point.random();
		this.path = new Path.Circle({
			center: center,
			radius: OBJECT_RAD
		});
		if (this.type == 'prediction') {
			this.path.fillColor = 'white';
			this.prediction_error = null;
		} else if (this.type == 'object') {
			this.path.strokeColor = '#EEEEEE';
		}
		console.log("Initialized object of type - " + type + " - velocity: " + this.velocity);
	},

	update: function() {
		this.path.position += this.velocity;
		if (this.type == 'prediction') {
			// Learn slightly, move center/velocity towards object
			var dist = object.path.position - this.path.position;
			this.path.position += new Point(LEARN_RATE, LEARN_RATE) * dist;
			var vdist = object.velocity - this.velocity;
			this.velocity += new Point(LEARN_RATE, LEARN_RATE) * vdist;
			if (this.prediction_error) this.prediction_error.remove();
			this.prediction_error = this.path.subtract(object.path);
			var error = this.prediction_error.area;
			var max = object.path.area;
			ErrorBar.lastSegment.point.x = error / max * w;
			this.prediction_error.fillColor = 'red';
		} else if (this.type == 'object') {
			// Bounce off walls
			var x = this.path.position.x;
			var y = this.path.position.y;
			if (x >= w-WALL_INSET || x <= WALL_INSET) this.velocity.x *= -1;
			if (y >= h-WALL_INSET || y <= WALL_INSET) this.velocity.y *= -1;
		}
	}

})

object = new VisualObject(new Point(middle_x, middle_y), 'object');
prediction = new VisualObject(new Point(middle_x, middle_y), 'prediction');

function onFrame(event) {
	var step = parseInt(event.count / FPS);
	// counter.content = step;
	if (event.count % FPS == 0) {
		[object, prediction].forEach(function(vo) {
			vo.update();
		})
	}
}


