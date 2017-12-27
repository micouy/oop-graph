// this.inputBox = createInput();
// this.inputBox.objectItem = this;
// this.inputBox.position(
// 		this.x + this.padding.x,
// 		this.y + this.padding.y
// 	).size(this.width-this.padding.x*2
// 	).style('border', 'none'
// 	).style('outline', 'none'
// 	).style('font-size', '16'
// 	).attribute('tabindex', '-1'
// 	).attribute('maxlength', '20'
// 	).changed(function() { this.objectItem.updateName(); });

var graph = new Graph();
var canvas;
var breakLoop = false;
var fontSize = 20;

window.addEventListener("keydown", function (e) {
		graph.getKeyboard().keyPressed(e);

		if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1 && canvas.elt === document.activeElement) {
			e.preventDefault();
		}
}, false);

window.addEventListener("keyup", function (e) {
	graph.getKeyboard().keyReleased(e);
});


function setup() {
	let renderer = createCanvas(window.innerWidth, window.innerHeight);
	canvas = renderer.elt.getContext("2d");
	textFont('monospace', fontSize);
	textAlign(LEFT, TOP);
	graph.addClassItem(100, 100);
	strokeCap(ROUND);
	strokeJoin(ROUND);
	ellipseMode(CORNER);
}


function draw() {
	graph.update();
	graph.draw();
	if (breakLoop) { noLoop(); }
}
