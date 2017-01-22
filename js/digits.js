
var BARWIDTH = 5;
var BAR_LEN = 40;
var ON_SQUARED_RADIUS = 8000;
var W = view.size.width;
var H = view.size.height;
var PADDING = 10;
var GAP = 1;
var ON_COLOR = 'red';
var OFF_COLOR = '#333333';
var DOT_SIZE = 5;

function getColor(center, count) {
	var fn_y = view.size.height/4 * Math.cos(center.x/200 + count/15) + view.size.height/2;
	var hl = Math.abs(center.y - fn_y) < 1;
	var on = center.y < fn_y;
	var brightness = center.y / view.size.height;
	var color = new Color(on ? brightness : 0, 0, 0);
	return color;
}

var Bar = Base.extend({
	initialize: function(center, length, vertical) {
		var start_x = center[0];
		var start_y = center[1] - length/2 + GAP;
		var stop_x = center[0];
		var stop_y = center[1] + length/2 - GAP;
		var end_offset = BARWIDTH/2;
		var segments = [
			[start_x, start_y],
			[start_x + end_offset, start_y + end_offset],
			[start_x + end_offset, stop_y - end_offset],
			[stop_x, stop_y],
			[start_x - end_offset, stop_y - end_offset],
			[start_x - end_offset, start_y + end_offset]
		];
		var path = new Path({
			segments: segments,
			closed: true,
			fillColor: OFF_COLOR
		});
		this.center = new Point(center);
		if (!vertical) path.rotate(90);
		this.path = path;

	},

	update: function(count) {
		var color = getColor(this.center, count);
		this.path.fillColor = color;
	}

})

var Dot = Base.extend({
	initialize: function(x, y) {
		this.center = new Point(x, y);
		this.path = new Path.Circle(x, y, DOT_SIZE);
		this.path.fillColor = OFF_COLOR;
	},

	update: function(count) {
		this.path.fillColor = getColor(this.center, count);
	}

})

var Digit = Base.extend({
	initialize: function(x, y) {
		var x_left = x - BAR_LEN / 2;
		var x_right = x + BAR_LEN / 2;
		var y_bottom = y - BAR_LEN;
		var y_top = y + BAR_LEN;
		var quarter_y = BAR_LEN / 2;
		var b = new Bar([x,y_bottom], BAR_LEN, false);
		var t = new Bar([x,y_top], BAR_LEN, false);
		var ul = new Bar([x_left,y+quarter_y], BAR_LEN, true);
		var ll = new Bar([x_left,y-quarter_y], BAR_LEN, true);
		var ur = new Bar([x_right,y+quarter_y], BAR_LEN, true);
		var lr = new Bar([x_right,y-quarter_y], BAR_LEN, true);
		var mid = new Bar([x,y], BAR_LEN, false);
		var dot_top = new Dot(x, y + quarter_y);
		var dot_bot = new Dot(x, y - quarter_y);
		this.elements = [b, ll, ul, t, ur, lr, mid, dot_top, dot_bot];
	},

	run: function(count) {
		for (var i = 0, l = this.elements.length; i < l; i++) {
			var el = this.elements[i];
			el.update(count);
		}
	}

});

var mouse_x = 0, mouse_y = 0;
var digits = [];
document.getElementById("myCanvas").style = "background-color: #333333";

for (var x = 0; x <= W + PADDING; x += BAR_LEN + PADDING) {
	for (var y = 0; y <= H + 2*PADDING; y += 2*BAR_LEN + PADDING) {
		digits.push(new Digit(x, y));
	}
}

function onMouseMove(event) {
	// mouse_x = event.point.x;
	// mouse_y = event.point.y;
}

function onFrame(event) {
	for (var i = 0, l = digits.length; i < l; i++) {
		digits[i].run(event.count);
	}
}

function onResize(event) {

}

