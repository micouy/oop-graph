// CONSTANTS
const DARK_GRAY = 120;
const GRAY = 180;
const LIGHT_GRAY = 230;
const ALMOST_WHITE = 245;
const ALMOST_BLACK = 90;
const RED = [255, 0, 0];

const THIN = 1
const MEDIUM = 2
const THICK = 2.75

const COLUMN = 0;
const ROW = 1;

const START = 0;
const CENTER = 1;
const END = 3;

const NODE_DIAMETER = 15;

const BUTTON_STYLE = {
	ADD: function(x, y) {
		let f = color(40, 230, 0);
		let s = color(20, 150, 0);
		fill(f);
		stroke(s);
		ellipse(x, y, 15);
	},
}

// FUNCTIONS
function getTime() {
	return new Date().getTime();
}

function cutToRange(x, min, max) {
	var x = (x > min) ? x : min;
	x = (x < max) ? x : max;
	return x;
}

function calcDistance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function getBezierCurve(a, b) {
	var min = (Math.min(a.x, b.x)==a.x) ? a : b;
	var max = (min===a) ? b : a;
	var distance = cutToRange(
		300, 0, Math.min(max.x-min.x, Math.abs(max.y-min.y))*1.2);
	return [min.x, min.y,
		min.x + distance, min.y,
		max.x - distance, max.y,
		max.x, max.y];
}

function dashedLine(x1, y1, x2, y2, dashLength) {
	let distance = calcDistance(x1, y1, x2, y2);
	let distanceX = Math.abs(x2 - x1);
	let distanceY = Math.abs(y2 - y1);
	let dashCount = Math.floor(distance / dashLength);
	let offsetX = distanceX / dashCount;
	let offsetY = distanceY / dashCount;

	for (let dash = 0; dash < dashCount; dash += 2) {
		line(
			x1 + offsetX * dash,
			y1 + offsetY * dash,
			x1 + offsetX * (dash + 1),
			y1 + offsetY * (dash + 1));
	}
}

function byZ(a, b) {
	return a.getZ() < b.getZ();
}

function byChildrenOrder(a, b) {
	let aOrder = a.getOrder();
	let bOrder = b.getOrder();
	if (aOrder == 'last') {
		return 1;
	} else if (bOrder == 'last') {
		return 0;
	} else {
		return aOrder > bOrder ? 1 : 0;
	}
}

function undef(x) {
	return typeof x == "undefined";
}

function isFunction(f) {
	return typeof f == 'function';
}

function measureText(text) {
	return canvas.measureText(text).width;
}

function connectNodes(parentNode, childNode) {
	parentNode.connect(childNode);
	childNode.connect(parentNode);
	parentNode.updateCurve();
}

function connectAttrWithTitleContainer(attributeItem, titleContainer) {
	connectNodes(titleContainer.getNode(), attributeItem.getNode());
	attributeItem.setAttrType(titleContainer.getValue());
}

function hasChildren(item) {
	return item.hasOwnProperty("children");
}

Array.prototype.sum = function(itemFunction) {
	let sum = 0;
	let f;

	if (!itemFunction) {
		f = function(item) { return item; }
	} else {
		f = itemFunction;
	}

	for (let item of this) {
		sum += f(item);
	}

	return sum;
}

Array.prototype.max = function(itemFunction) {
	let max = 0;
	let f;

	if (!itemFunction) {
		f = function(item) { return item; }
	} else {
		f = itemFunction;
	}

	for (let item of this) {
		let value = f(item);
		max = value > max ? value : max;
	}

	return max;
}

Array.prototype.min = function(itemFunction) {
	let min = 0;
	let f;

	if (!itemFunction) {
		f = function(item) { return item; }
	} else {
		f = itemFunction;
	}

	for (let item of this) {
		let value = f(item);
		min = value < min ? value : min;
	}

	return min;
}

Array.prototype.remove = function(item) {
	let index = this.indexOf(item);

	if (index > -1) {
		this.splice(index, 1);
	}
}


class Compass {
	constructor(top, right, bottom, left) {
		if (undef(right) && undef(bottom) && undef(left)) {
			if (undef(top)) {
				this.top = 0;
				this.right = 0;
				this.bottom = 0;
				this.left = 0;
			} else {
				this.top = top;
				this.right = top;
				this.bottom = top;
				this.left = top;
			}
		} else {
			this.top = top;
			this.right = right;
			this.bottom = bottom;
			this.left = left;
		}
	}

	setValues(top, right, bottom, left) {
		if (!undef(top) && undef(right) && undef(bottom) && undef(left)) {
			this.top = top;
			this.right = top;
			this.bottom = top;
			this.left = top;
		} else {
			this.top = top;
			this.right = right;
			this.bottom = bottom;
			this.left = left;
		}
	}

	getTop() { return this.top; }
	getRight() { return this.right; }
	getBottom() { return this.bottom; }
	getLeft() { return this.left; }
	getX() { return this.right + this.left; }
	getY() { return this.top + this.bottom; }
}


class Point {
	constructor(x, y) {
		if (undef(x) && undef(y)) {
			this.x = 0;
			this.y = 0;
		} else {
			this.x = x;
			this.y = y;
		}
	}

	setValues(x, y) {
		this.x = x;
		this.y = y;
	}

	getX() { return this.x; }
	getY() { return this.y; }
}

console.logAndStop = function(text) {
	this.log(text);
	noLoop();
}
