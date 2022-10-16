---
title: Window Outside
layout: blank
paper_sketches:
     - paper_sketches/window_outside.js
js_libs:
     - jslib/CCapture.all.min.js
     - jslib/lodash.min.js

---

<style>

#myCanvas {
	width: 1000px;
	height: 750px;
	background: white;
}

#button {
	position: absolute;
	z-index: 100;
	top: 10px;
	left: 10px;
}
</style>

<canvas id="myCanvas" width="1000" height="750"></canvas>

<button id="button" onClick="buttonClick()" type="button">Toggle Capture</button>

