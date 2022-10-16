---
title: Affordance Induction (Three)
layout: blank
three_sketches:
     - three_sketches/libs/OutlineEffect.js
     - three_sketches/libs/THREE.MeshLine.js
     - three_sketches/affordance_induction_three.js
js_libs:
     - jslib/lodash.min.js
     - jslib/CCapture.all.min.js
---

<style>

#myCanvas {
	border: 1px solid black;
	width: 600px;
	height: 400px;
}

#button {
	position: absolute;
	z-index: 100;
	top: 10px;
	left: 10px;
}
</style>

<p>Any key to advance frame...</p>

<canvas id="myCanvas" width="600" height="400"></canvas>

<button id="button" onClick="buttonClick()" type="button">Toggle Capture</button>