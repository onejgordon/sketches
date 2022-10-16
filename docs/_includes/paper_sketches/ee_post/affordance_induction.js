// Illustrations for post on Empirical Enactivism
// https://medium.com/p/613aefe38391/edit

var h = view.size.height;
var middle_x = view.size.width / 2;
var middle_y = h / 2;

var NODES = 15;
var NODE_R = 60;
var CELL_HEIGHT = 40;
var MARGIN = 10;
var NODE_Y = h * 0.3 + 100;
var NODE_Y_R2 = h * 0.6 + 100;
var NODE_GRAPH_W = 100;
var LABEL_SIZE = 20;
var NODE_INACTIVE = new Color(.7, .7, .7);
var NODE_ACTIVE = new Color(0, .5, 1);
var LABEL_COLOR = "#000000";
var CAPTURE = true;
var CAPTURING = false;
var canvas = document.getElementById("myCanvas");

var MODES = [
	{ title: "Learning", color: "#00902F" },
	{ title: "Simulation", color: "#0074DF" }	
];

var FPS = 50; // Frames per step

var STEPS = [
	{ state: [0, 0, 0], label: "", mode: 0, arrows: [0, 0] },
	{ state: [0, 1, 0], label: "State 1 Perceived", mode: 0, arrows: [0, 0] },
	{ state: [1, 1, 0], label: "Affordance Active", mode: 0, arrows: [0, 0] },
	{ state: [1, 1, 1], label: "Learning Transition", mode: 0, arrows: [1, 1] },
	{ state: [1, 0, 1], label: "Learning Transition", mode: 0, arrows: [0, 0] },
	{ state: [0, 0, 0], label: "", mode: 1, arrows: [0, 0] },
	{ state: [0, 1, 0], label: "State 1 Perceived", mode: 1, arrows: [1, 0] },
	{ state: [1, 1, 0], label: "Affordance Active", mode: 1, arrows: [1, 0] },
	{ state: [1, 1, 1], label: "Generate Transition", mode: 1, arrows: [1, -1] },
	{ state: [0, 0, 1], label: "Resultant Percept (State 2)", mode: 1, arrows: [0, 0] },	
]

var STEP_IDX = -1;

var graphs = [];
var frame_label, frame_mode;

function choose(list) {
	var idx = parseInt(Math.random() * list.length);
	return list[idx];
}

var Graph = Base.extend({
	initialize: function(opts) {
		this.name = opts.name;
		this.motor = opts.motor;
		this.side = opts.side;
		this.image_states = opts.image_states;
		this.node_states = [0,0,0];

		// State
		this.active = false;

		var x = middle_x;
		if (this.side == 'left') x -= middle_x/2;
		else if (this.side == 'right') x += middle_x/2;
		var y = NODE_Y;
		var color;

		var lnode_xy = [x - NODE_GRAPH_W, NODE_Y_R2];
		var rnode_xy = [x + NODE_GRAPH_W, NODE_Y_R2];
		var lnode = new Path.Circle(new Point(lnode_xy[0], lnode_xy[1]), NODE_R);
		var rnode = new Path.Circle(new Point(rnode_xy[0], rnode_xy[1]), NODE_R);
		var lnode_center = new Point(lnode_xy[0], lnode_xy[1]);
		var rnode_center = new Point(rnode_xy[0], rnode_xy[1]);
		lnode.image = new Raster(this.image_states[0], lnode_center);
		rnode.image = new Raster(this.image_states[1], rnode_center);
		this.circles = [
			new Path.Circle(new Point(x, y), NODE_R),
			lnode,
			rnode
		]
		var nodes = [lnode, rnode];
		nodes.forEach(function(n, i) {
			var s_label = new PointText({
				point: new Point(n.position.x, n.position.y + 90),
				content: "S" + (i+1),
				fontWeight: 'bold',
				fontSize: 20,
				fillColor: "#CCC",
				justification: "center"
			})			
		})
		this.affordance_letter = new PointText({
			point: new Point(x, y + 25),
			content: this.name[0],
			fontWeight: 'bold',
			fontSize: 70,
			fillColor: "#FFF",
			justification: "center"
		})
		this.label = new PointText({
			point: new Point(x, y - 100),
			content: this.name,
			fontWeight: 'bold',
			fontSize: LABEL_SIZE,
			fillColor: LABEL_COLOR,
			justification: "center"
		})
		this.sub_label = new PointText({
			point: new Point(x, y - 80),
			content: this.motor ? "Motor Affordance" : "Hidden Affordance",
			fontSize: 12,
			fillColor: "#999999",
			justification: "center"
		})
		this.arrows = [
			new Raster("assets/ee_post/arrow.png", lnode_center + new Point(40, -80)),
			new Raster("assets/ee_post/arrow.png", rnode_center + new Point(-40, -80))
		];
		this.arrows[0].rotate(-55);
		this.arrows[0].orientation = 'up';
		this.arrows[1].rotate(-180+55);
		this.arrows[1].orientation = 'up';
		console.log("Created node at " + this.x)
	},

	get_color: function(node_idx) {
		var state = this.node_states[node_idx];
		return state == 1 ? frame_mode.fillColor : NODE_INACTIVE;
		// else return state == 1 ? NODE_ACTIVE : NODE_INACTIVE;
	},

	get_opacity: function(node_idx) {
		var state = this.node_states[node_idx];
		return state == 1 ? 1 : 0.4;
	},

	update: function(state, arrows) {
		this.node_states = state;
		for (var i=0; i<3; i++) {
			this.circles[i].fillColor = this.get_color(i);
			if (this.circles[i].image) this.circles[i].image.opacity = this.get_opacity(i);
			for (var j=0; j<2; j++) {
				this.arrows[j].visible = arrows[j] != 0;
				if (arrows[j] == -1 && this.arrows[j].orientation == 'up'
					|| arrows[j] == 1 && this.arrows[j].orientation == 'down') {
					this.arrows[j].rotate(180);
					this.arrows[j].orientation =  this.arrows[j].orientation == 'up' ? 'down' : 'up';
				}
			}
		}
	}
})

function setup() {
	graphs = [
		new Graph({name: "Push", motor: true, side: "left", image_states: ["assets/ee_post/button_up.png", "assets/ee_post/button_down.png"]}),
		new Graph({name: "Bark", motor: false, side: "right", image_states: ["assets/ee_post/bark_off.png", "assets/ee_post/bark_on.png"]})
	]

	frame_label = new PointText({
		point: new Point(middle_x, 50),
		content: "",
		fontSize: 25,
		justification: "center"
	})
	frame_mode = new PointText({
		point: new Point(middle_x, 20),
		content: "Mode: ",
		fontSize: 17,
		fillColor: MODES[0].color,
		justification: "center"
	})

	var line = new Path.Line(new Point(middle_x, 170), new Point(middle_x, 390));
	line.strokeColor = '#CCC';

	var bg = new Path.Rectangle({
	    point: [0, 0],
	    size: [view.size.width, view.size.height],
	    strokeColor: 'white'
	});
	bg.sendToBack();
	bg.fillColor = '#ffffff';

	capturer = new CCapture( { 
		format: 'gif', 
		framerate: 0.5,
		workersPath: 'assets/js/' } );
}

function onFrame(event) {
	var step = parseInt(event.count / FPS);
	// counter.content = step;
	if (event.count % FPS == 0) {
		STEP_IDX += 1;
		if (STEP_IDX >= STEPS.length) {
			STEP_IDX = 0;
		}
		if (STEP_IDX == 1 && CAPTURE) toggleCapture();
		var s = STEPS[STEP_IDX];
		for (var i = 0; i < graphs.length; i++) {
			var g = graphs[i];
			g.update(s.state, s.arrows);
		}
		frame_label.content = s.label;
		var mode = MODES[s.mode];
		frame_mode.content = "Mode: " + mode.title;
		frame_mode.fillColor = mode.color;
		if (CAPTURING) capturer.capture( canvas );
	}
}

function toggleCapture() {
	if (CAPTURING) {
		console.log("Stop capturing...")
		capturer.stop()
		capturer.save()
		CAPTURE = false;		
		CAPTURING = false;
	} else {
		console.log("Start capturing...")
		capturer.start()
		CAPTURING = true;
	}
}

setup();


