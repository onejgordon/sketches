// ConvNet animations
// See ConvNetJS: http://cs.stanford.edu/people/karpathy/convnetjs/started.html

// Load ConvNet
$.getScript("js/jslib/convnet-min.js", function(){

   setup();

});

var w = view.size.width;
var h = view.size.height;
var CENTER_X = w / 2;
var CENTER_Y = h / 2;
var LAYER_HEIGHT = 40;
var NODE_S = 20;
var NODE_GAP = 10;
var BUFFER = 90;
var MAX_CIRCLE_SIZE = 30;

var RENDER_LAYERS = [2,4]; // Both relus, internal

var net;
var trainer;
var viz;
var input_viz;
var target_viz;
var prediction_viz;
var ready = false;

// bg
document.getElementById("myCanvas").style = "background-color: #000000";

var NetViz = Base.extend({
	initialize: function(net) {
		this.net = net;
		this.render_layers = RENDER_LAYERS;

		// Setup nodes
		this.viz_layers = [];
		this.viz_layer_groups = [];
		this.render_layers.forEach(function(l, l_index) {
			var node_row = [];
			var layer = net.layers[l];
			this.viz_layer_groups.push(new Group());
			for (var i = 0; i < layer.out_depth; i++) {
				var x = i * (NODE_S+NODE_GAP);
				var node = new Path.Rectangle({
					point: new Point(x,0),
					size: [NODE_S, NODE_S],
					fillColor: 'white'
				});
				this.viz_layer_groups[l_index].children.push(node);
				node_row.push(node);
			}
			var y = CENTER_Y + l_index * LAYER_HEIGHT;
			var row_width = this.viz_layer_groups[l_index].bounds.size.width;
			this.viz_layer_groups[l_index].translate([w/2 - row_width/2, y]);
			this.viz_layers.push(node_row);
		}, this);
	},

	render: function() {
		this.render_layers.forEach(function(l, l_index) {
			var layer = net.layers[l];
			this.viz_layers[l_index].forEach(function(node, i) {
				var act = layer.out_act.w[i];
				node.fillColor = new Color(act, act, act);
			});
		}, this);
	}
})

function setup() {
	var layer_defs = [];
	layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
	layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});
	layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});
	layer_defs.push({type:'regression', num_neurons:1});

	net = new convnetjs.Net();
	net.makeLayers(layer_defs);

	trainer = new convnetjs.SGDTrainer(net,
              {learning_rate:0.01, momentum:0.0, batch_size:1, l2_decay:0.001});
	viz = new NetViz(net);

	// Setup visualization for input, prediction and target
	input_viz = new Path.Circle([w/2, BUFFER], 10);
	input_viz.fillColor = 'white';

	prediction_viz = new Path.Circle([w/2, h - BUFFER], 10);
	prediction_viz.fillColor = 'red';
	prediction_viz.opacity = 0.5;

	target_viz = new Path.Circle([w/2, h - BUFFER], 10);
	target_viz.fillColor = 'blue';
	target_viz.opacity = 0.5;

	ready = true;
}

function calculate_net_area() {
	var sum = 0;
	var n = 0;
	RENDER_LAYERS.forEach(function(l_index) {
		var layer = net.layers[l_index];
		layer.out_act.w.forEach(function(w) {
			sum += w;
			n += 1;
		})
	});
	return sum / n;
}

function predict_train_loop(count) {
	var input = Math.sin(count/100) + 1;
	var x = new convnetjs.Vol([input]);
	var predicted_values = net.forward(x);
	console.log(predicted_values.w[0]);
	var prediction = predicted_values.w[0];
	var target = calculate_net_area();
	trainer.train(x, [target]);
	viz.render();
	// console.log("input: " + input + " prediction: " + prediction + " target: " + target);

	// Update input, prediction and target
	var input_r = MAX_CIRCLE_SIZE * (input + 1);
	var prediction_r = MAX_CIRCLE_SIZE * (prediction);
	var target_r = MAX_CIRCLE_SIZE * (target);

	var radius = input_viz.bounds.width / 2;
	input_viz.scale(input_r / radius);

	radius = prediction_viz.bounds.width / 2;
	prediction_viz.scale(prediction_r / radius);

	radius = target_viz.bounds.width / 2;
	target_viz.scale(target_r / radius);

}

function onFrame(event) {
	if (ready) predict_train_loop(event.count);
}