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

var graph;
var breakLoop = false;
var fontSize = 20;

function setup() {
	createCanvas(window.innerWidth, window.innerHeight);
	graph = new Graph();
	graph.addObject(100, 100);
	strokeCap(ROUND);
	strokeJoin(ROUND);
	ellipseMode(CORNER);
	textFont('arial', fontSize);
	textAlign(LEFT, TOP);
}

function draw() {
	graph.update();
	graph.draw();
	if (breakLoop) { noLoop(); }
}

function keyPressed() {
	if (key == ' ') {
		breakLoop = true;
	}
}
