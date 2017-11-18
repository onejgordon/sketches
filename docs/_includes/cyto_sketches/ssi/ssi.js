const REGION_SEP_Y = 100
const NEURON_SEP_X = 150
const PADDING = 200

var cy, w, h, regions = [], t = -1

const ANIMATION = [
	{ 
		state: {
			'Whiskers': 'active',
			'Whiskers->Cat': 'active'
		}
	},
	{ 
		state: {
			'Wagging Tail': 'active',
			'Ears->Cat': 'predictive'
		}
	}	
]

function IncrementTime(incr) {
	t += incr
	console.log(`Time: ${t}`)
	if (t >= 0 && t <= ANIMATION.length - 1) {
		let step = ANIMATION[t]
		let state = step.state
		cy.elements().forEach((el) => {
			let id = el.data('id')
			let cls = state[id]
			el.removeClass('active predictive')
			if (cls != null) {
				el.addClass(cls)				
			}
		})
	}
}

class Region {
	constructor() {
		this.index = regions.length + 1
		this.neurons = []
		regions.push(this)
	}

	get n_neurons() {
		return this.neurons.length
	}
}

class Neuron {
  constructor(label, region) {
  	this.region = region
  	let y = h - PADDING - region.index * REGION_SEP_Y
  	let x = PADDING + region.n_neurons * NEURON_SEP_X
  	let id = label
    this.el = cy.add({
    	group: 'nodes',
    	data: { id: id, label: label },
    	position: {x: x, y: y}
    })
    this.region.neurons.push(this)
  }
}

class Dendrite {
  constructor(source, target) {
    this.source = source;
    this.target = target;
    let id = `${source}->${target}`
    this.el = cy.add({
    	group: 'edges',
    	data: { id: id, source: source, target: target }
    })

  }	
}

function setup() {
	w = document.body.clientWidth
	h = document.body.clientHeight
	cy = cytoscape({
		container: document.getElementById('cy'), // container to render in
	    style: [
			{
				selector: "node",
				style: {
					'background-color': '#009EC6',
					'background-opacity': 0.5,
					'color': '#000',
					'label': 'data(label)',
				}
	        },
			{
				selector: 'edge',
				style: {
				  'curve-style': 'bezier',
				  'width': 3,
				  'line-color': '#aaa',
				  'target-arrow-color': '#aaa',
				  'target-arrow-shape': 'tee'
				}
			},	        
			{
				selector: "node.active",
				style: {
					'background-color': '#00CDFF',
					'background-opacity': 1.0,
				}
	        },
			{
				selector: "node.predictive",
				style: {
					'background-color': '#FF8700',
					'background-opacity': 1.0,
				}
	        },
			{
				selector: "edge.active",
				style: {
					'line-color': '#00CDFF',
					'target-arrow-color': '#00CDFF',
				}
	        },
			{
				selector: "edge.predictive",
				style: {
					'line-color': '#FF8700',
					'target-arrow-color': '#FF8700',
				}
	        },
        ]
	})
	var r = new Region()
	var r2 = new Region()
	var n = new Neuron('Whiskers', r)
	new Neuron('Ears', r)	
	new Neuron('Wagging Tail', r)	
	new Neuron('Cat', r2)
	new Neuron('Dog', r2)	
	new Dendrite('Ears', 'Cat')
	new Dendrite('Ears', 'Dog')
	new Dendrite('Whiskers', 'Cat')
	new Dendrite('Wagging Tail', 'Dog')	
}

window.onload = function () {
    // your code
	setup()
}

document.addEventListener("keydown", handleKeyDown, false);

function handleKeyDown(e) {
	var keyCode = e.keyCode;
	if (e.key == "ArrowLeft") {
		IncrementTime(-1)
	} else if (e.key == "ArrowRight") {
		IncrementTime(1)
	}
}