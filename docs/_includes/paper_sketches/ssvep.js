var w = view.size.width;
var h = view.size.height;

var FPS = 2;
var t = 0;

var HZ = [2, 4, 6, 8, 10];
var hz_i = 0;

var rect = new Path.Rectangle({
    point: [0, 0],
    size: [w, h]
});
rect.sendToBack();

function onFrame(event) {
	step = parseInt(event.count / FPS);
	var animate = event.count % FPS == 0;
	if (animate) {
		t += 1
		var hz = HZ[hz_i];
		var seconds = new Date().getTime() / 1000;
		var lume = (Math.sin(2 * Math.PI * seconds * hz) + 1)/2;
		rect.fillColor = new Color(lume, lume, lume);
	}
}

function onMouseDown(event) {
	hz_i += 1;
	if (hz_i > HZ.length - 1) {
		hz_i = 0;
	}	
	console.log(HZ[hz_i])
}


