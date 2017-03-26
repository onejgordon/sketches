---
title: Synapse Timing
layout: default
js_sketches:
     - paper_sketches/synapse_timing.js
---


<div>
	<h1>Synapse Timing Sketches</h1>

	<h3>Key</h3>
	<ul>
		<li>Black cell: target cell, showing current activation and max activation (fades over time)</li>
		<li>Red cell: source cell, produce action potentials at shown time step (looping)</li>
		<li>Small red circles: action potentials move from source cell to dendrite segment of target (post-synaptic) cell</li>
		<li>Gray circle: learning radius (if active synapse within radius, synapse will translate)</li>
		<li>Green arrow: Direction synapse will move via learning</li>
	</ul>

	<h3>Notes</h3>

	<ul>
		<li>The learning rule visualized here is as follows: when an action potential reaches the target segment, the synapse location moves in the direction of the nearest synapse within its learning radius (if any is present)</li>
		<li>Result: in each scenario visualized, the adjusting synapses stabilize at the configuration that maximizes the resultant activity in the post-synaptic cell. In other words, the post-synaptic cell has 'learned' to respond maximally to a precisely timed sequence of its inputs</li>
	</ul>

	<canvas id="myCanvas" width="800" height="600"></canvas>
</div>
