---
title: Affordance Induction
layout: blank
paper_sketches:
     - paper_sketches/ee_post/affordance_induction.js
js_libs:
     - jslib/CCapture.all.min.js
     - jslib/lodash.min.js

---

<style>

#myCanvas {
	border: 1px solid black;
	width: 900px;
	height: 500px;
	background: white;
}

#button {
	position: absolute;
	z-index: 100;
	top: 10px;
	left: 10px;
}
</style>

<p>Any key to advance frame...</p>

<canvas id="myCanvas" width="900" height="500"></canvas>

<button id="button" onClick="buttonClick()" type="button">Toggle Capture</button>

