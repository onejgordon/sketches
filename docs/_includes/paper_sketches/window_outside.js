// Controls

var w = view.size.width;
var h = view.size.height;


var FPS = 1;

var CIRCLE_COLOR = "#000000";
var CIRCLE_LIGHT_COLOR = "#FFFFFF";
var RAD = [7, 20];
var WINDOW_X = 480;
var WINDOW_Y = 130;
var WINDOW_W = 250;
var WINDOW_H = 160;
var topLeft = new Point(WINDOW_X, WINDOW_Y);
var bottomRight = new Point(WINDOW_X + WINDOW_W, WINDOW_Y + WINDOW_H);

var bg;

var EFFECT_ID = "stars";

var EFFECTS = {
	"circles": {
		n: 700
	},
	"stars": {
		n: 400,
		windowFill: {
	        gradient: {
	            stops: ['#1F057B', '#1F057B', '#58058D']
	        },
	        origin: new Point(WINDOW_X, WINDOW_Y),
	        destination: new Point(WINDOW_X + 50, WINDOW_Y + WINDOW_H)
	    }
	},	
	"voronoi": {
		n: 10
	}
}[EFFECT_ID];

var items = [];

var Orb = Base.extend({
	initialize: function(center, options) {
		var rad = options.radius || Math.random() * (RAD[1]-RAD[0]) + RAD[0];
		this.path = new Path.Circle(center, rad);
		var main_jitter = (Math.random() / 2) - .25;
		var sub_jitter = ((Math.random() / 2) - .25) / 2;
		this.path.fillColor = options.fillColor || new Color(.4 + main_jitter, .6 + sub_jitter, .9 + main_jitter);
		this.path.strokeColor = options.strokeColor || 'black';
		this.path.strokeWidth = options.strokeWidth == null ? rad / 5 : options.strokeWidth;
		this.path.opacity = options.opacity || 1.0;
		this.velocity = options.velocity || new Point(Math.random() - 0.5, Math.random() - 0.5) / 3 + new Point(3, -1);
		if (options.in_window) {
			this.xmin = WINDOW_X;
			this.xmax = WINDOW_X + WINDOW_W;
			this.ymin = WINDOW_Y;
			this.ymax = WINDOW_Y + WINDOW_H;
		} else {
			this.xmin = 0;
			this.xmax = w;
			this.ymin = 0;
			this.ymax = h;
		}
	},

	update: function() {
		this.path.translate(this.velocity);
		var pos = this.path.position;
		if (pos.x < this.xmin) pos.x = this.xmax;
		if (pos.x > this.xmax) pos.x = this.xmin;
		if (pos.y < this.ymin) pos.y = this.ymax;
		if (pos.y > this.ymax) pos.y = this.ymin;
	}
})

function setup() {
	if (EFFECT_ID == "circles") {
		var i=0;
		while (i < EFFECTS.n) {
			var item = new Orb(new Point(WINDOW_X + Math.random() * WINDOW_W, WINDOW_Y + Math.random() * WINDOW_H));
			items.push(item)
			i++;
		}		
	} else if (EFFECT_ID == "voronoi") {
		while (i < EFFECTS.n) {
			var pt = new Point(new Point(WINDOW_X + Math.random() * WINDOW_W, WINDOW_Y + Math.random() * WINDOW_H));
			items.push(pt)
		}
	} else if (EFFECT_ID == "stars") {
		var path = new Path.Rectangle({
		    topLeft: topLeft,
		    bottomRight: bottomRight,
		    // Fill the path with a gradient of three color stops
		    // that runs between the two points we defined earlier:
		    fillColor: EFFECTS.windowFill
		});
		var i=0;
		while (i < EFFECTS.n) {
			var item = new Orb(
				new Point(WINDOW_X + Math.random() * WINDOW_W, WINDOW_Y + Math.random() * WINDOW_H),
				{
					fillColor: 'white',
					velocity: new Point(Math.random() - 0.5, Math.random() - 0.5) / 3,
					radius: Math.random(),
					strokeWidth: 0,
					in_window: true
				}	
			);
			items.push(item)
			i++;
		}
	}

	bg = new Raster("assets/window_outside/window_2.png", new Point(w/2, h/2));
	i = 0;
	while (i < 300) {
		var item = new Orb(
			new Point(Math.random() * w, Math.random() * h),
			{
				fillColor: 'white',
				velocity: new Point(Math.random() - 0.5, Math.random() - 0.5) / 3,
				radius: Math.random() * 10,
				strokeWidth: 0,
				opacity: Math.random()
			}	
		);
		items.push(item)
		i++;
	}	
}

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate) {
		items.forEach(function(i) {
			i.update();
		})
	}
}

function onMouseDown(event) {
	console.log(event.event.clientX + ', ' + event.event.clientY);
}


setup()

