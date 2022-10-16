const REGION_SEP_Y = 100
const NEURON_SEP_X = 150
const PADDING = 200

var cy, w, h, regions = [], t = -1, caption

const ANIMATION = [
	{
		caption: "Induction of competing causes via feed-forward activation",
		state: {
			'Ears': 'active',
			'Ears->Cat': 'active',
			'Ears->Dog': 'active',
			'Ears->Fur': 'active'
		}
	},
	{ 
		caption: "Each explanatory solution produces predictions",
		state: {
			'Ears': 'active',
			'Ears->Cat': 'active',
			'Ears->Dog': 'active',			
			'Ears->Fur': 'active',
			'Cat': 'active',
			'Dog': 'active',
			'Cat->Fur': 'predictive',
			'Dog->Fur': 'predictive',
			'Fur': 'predictive',
			'Cat->Whiskers': 'predictive',
			'Dog->Wagging Tail': 'predictive',
			'Wagging Tail': 'predictive',
			'Whiskers':'predictive',
			'Pet': 'active'			
		}
	},
	{ 
		caption: "Oscillations between multiple induced causes (dog)",
		state: {
			'Ears': 'active',
			'Ears->Cat': 'active',
			'Ears->Dog': 'active',
			'Ears->Fur': 'active',
			'Cat': 'active weak',
			'Dog': 'active',
			'Cat->Fur': 'predictive',
			'Dog->Fur': 'predictive',
			'Fur': 'predictive',
			'Dog->Wagging Tail': 'predictive',
			'Wagging Tail': 'predictive',
			'Pet': 'active'			
		}
	},		
	{ 
		caption: "Oscillations between multiple induced causes (cat)",
		state: {
			'Ears': 'active',
			'Ears->Cat': 'active',
			'Ears->Dog': 'active',	
			'Ears->Fur': 'active',		
			'Cat': 'active',
			'Dog': 'active weak',
			'Cat->Fur': 'predictive',
			'Dog->Fur': 'predictive',
			'Fur': 'predictive',
			'Cat->Whiskers': 'predictive',
			'Whiskers': 'predictive',
			'Pet': 'active'			
		}
	}		
]

const NETWORK = {
	neurons: [
		['Whiskers', 'Ears', 'Fur', 'Wagging Tail'],
		['Saccade to Nose', 'Cat', 'Dog', 'Saccade to Tail'],
		['Pet']
	],
	dendrites: [
		'Whiskers->Cat', 
		'Wagging Tail->Dog', 
		'Ears->Cat', 
		'Ears->Dog',
		'Cat->Whiskers',
		'Dog->Wagging Tail',
		'Cat->Fur',
		'Dog->Fur',
		'Ears->Fur',
		'Fur->Ears',
		'Cat->Pet',
		'Dog->Pet'
	]
}

function IncrementTime(incr) {
	t += incr
	if (t<0) t = 0
	if (t>ANIMATION.length-1) t = ANIMATION.length-1
	console.log(`Time: ${t}`)
	if (t >= 0 && t <= ANIMATION.length - 1) {
		let step = ANIMATION[t]
		let state = step.state
		let caption_text = step.caption || ""
		caption.innerHTML = `t=${t}: ${caption_text}`
		cy.elements().forEach((el) => {
			let id = el.data('id')
			let cls = state[id]
			el.classes() // Remove all classes
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
	caption = document.getElementById('caption')
	cy = cytoscape({
		container: document.getElementById('cy'), // container to render in
	    style: [
			{
				selector: "node",
				style: {
					'background-color': '#B9C2C0',
					'background-opacity': 0.4,
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
					'background-color': '#00B0FF',
					'background-opacity': 1.0,
				}
	        },
			{
				selector: "node.active.weak",
				style: {
					'background-color': '#00B0FF',
					'background-opacity': 0.6,
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
				selector: "node.oscillating",
				style: {
					'transition-property': 'background-color',
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
	NETWORK.neurons.forEach((arr) => {
		var r = new Region()
		arr.forEach((n) => {
			new Neuron(n, r)	
		})
	})
	NETWORK.dendrites.forEach((id) => {
		let source_target = id.split('->')
		new Dendrite(source_target[0], source_target[1])
	})
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