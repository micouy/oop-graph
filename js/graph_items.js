class GraphItem {
	constructor(graph, parent, width, height, order) {
		this.graph = graph;
		this.relativePosition = new Point();

		if (parent) {
			this.parent = parent;
			this.x = this.parent.x;
			this.y = this.parent.y;
		} else {
			this.x = this.relativePosition.x;
			this.y = this.relativePosition.y;
		}

		if (!undef(order)) {
			this.order = order;
		}

		this.width = width;
		this.height = height;
		this.totalWidth = width;
		this.totalHeight = height;
		this.fixedWidth = 0;
		this.fixedHeight = 0;
		this.margin = new Compass();
	}


	setFixedWidth(width) { this.fixedWidth = width; return this; }
	setFixedHeight(height) { this.fixedHeight = height; return this; }
	getMarginX() { return this.margin.getX(); }
	getMarginY() { return this.margin.getY(); }
	getTotalWidth() { return this.totalWidth; }
	getTotalHeight() { return this.totalHeight; }
	getX() { return this.x; }
	getY() { return this.y; }
	getZ() { return this.z; }
	getWidth() { return this.width; }
	getHeight() { return this.height; }
	getParent() { return this.parent; }
	setOrder(order) { this.order = order; }
	getOrder() { return this.order; }

	setMargin(top, right, bottom, left) {
		this.margin.setValues(top, right, bottom, left);

		return this;
	}

	updatePosition() {
		if (this.parent) {
			this.x = this.parent.x + this.relativePosition.getX() + this.margin.getLeft();
			this.y = this.parent.y + this.relativePosition.getY() + this.margin.getTop();
		}

		if (this instanceof Container) {
			for (let child of this.children) {
				child.updatePosition();
			}
		}
	}

	updateRelativePosition(x, y) {
		this.relativePosition.x = x;
		this.relativePosition.y = y;
		this.updatePosition();
	}

	updateTotalSize() {
		this.totalWidth = this.width + this.margin.getX();
		this.totalHeight = this.height + this.margin.getY();
	}

	hasDescendant(object) {
		if (this instanceof Container) {
			for (let child of this.children) {
				if (child == object) { return true; }
				else if (child.hasDescendant(object)) { return true; }
			}
		}

		return false;
	}

	hasInFamily(object) {
		let parent = this.parent;
		if (!parent) { return false; }

		while (!!parent.getParent()) {
			parent = parent.getParent();
		}

		return parent.hasDescendant(object);
	}

	getObjectItem() {
		let parent = this.parent;
		if (!parent) { return this instanceof ObjectItem ? this : null; }

		while (!!parent.getParent()) {
			parent = parent.getParent();
		}

		return parent instanceof ObjectItem ? parent : null;
	}

	draw() { }

	drawBounds() {
		noFill();
		stroke(RED);
		strokeWeight(MEDIUM);
		rect(this.x, this.y, this.totalWidth, this.totalHeight);
	}
}


class Container extends GraphItem {
	constructor(graph, parent, width, height) {
		super(graph, parent, width, height);
		this.childrenOrder = 0;
		this.padding = new Compass(5);
		this.children = [];
		this.contentDirection = COLUMN;
		this.contentAlignment = START;
		if (this.parent) {
			this.z = this.parent.getZ() + 1;
		}
	}

	setPadding(top, right, bottom, left) {
		this.padding.setValues(top, right, bottom, left);

		this.rearrange();

		if (this.parent) {
			this.parent.rearrange();
		}

		return this;
	}

	setContentDirection(direction) {
		this.contentDirection = direction;
		this.rearrange();
		this.updateDividers();
	}

	setContentAlignment(alignment) { this.contentAlignment = alignment; }
	getPaddingX() { return this.padding.getX(); }
	getPaddingY() { return this.padding.getY(); }
	getZ() { if (this.z) return this.z; }

	addChild(newChild) {
		if (!newChild.getOrder()) {
			newChild.setOrder(this.childrenOrder);
			this.childrenOrder += 1;
		}

		newChild.updateTotalSize();
		this.children.push(newChild);
		this.rearrange();
	}

	addChildren(newChildren) {
		let children = [];
		for (let child of newChildren) {
			if (!child.getOrder()) {
				child.setOrder(this.childrenOrder);
				this.childrenOrder += 1;
			}

			child.updateTotalSize();
			children.push(child);
		}
		this.children.push.apply(this.children, children);
		this.rearrange();
	}

	updateDividers() {
		for (let child of this.children) {
			if (child instanceof Divider) {
				child.setDirection(this.contentDirection);
				child.updateSize();
			}
		}
	}

	rearrange() {
		if (!this.children.length) {
			this.updateTotalSize();
			if (this.parent) {
				this.parent.rearrange();
			}
			return;
		}

		this.children.sort(byChildrenOrder);
		let x = this.padding.getLeft();
		let y = this.padding.getTop();
		let height = 0;
		let width = 0;

		if (this.contentDirection == COLUMN) {
			width = this.children.max(function(item) { return !(item instanceof Divider) ? item.getTotalWidth() : 0; });
			height = this.children.sum(function(item) { return item.getTotalHeight(); });

			for (let child of this.children) {
				if (this.contentAlignment == START) {
					child.updateRelativePosition(x, y);
				} else {
					let childX;

					if (this.contentAlignment == CENTER) {
						childX = x + (width - child.getTotalWidth()) / 2;
					} else if (this.contentAlignment == END) {
						childX = width - this.padding.getRight() - child.getTotalWidth();
					}

					child.updateRelativePosition(childX, y);
				}

				y += child.getTotalHeight();
			}
		} else if (this.contentDirection == ROW) {
			width = this.children.sum(function(item) { return item.getTotalWidth(); });
			height = this.children.max(function(item) { return !(item instanceof Divider) ? item.getTotalHeight() : 0; });

			for (let child of this.children) {
				if (this.contentAlignment == START) {
					child.updateRelativePosition(x, y);
				} else {
					let childY;

					if (this.contentAlignment == CENTER) {
						childY = y + (height - child.getTotalHeight()) / 2;
					} else if (this.contentAlignment == END) {
						childY = y + height - child.getTotalHeight();
					}

					child.updateRelativePosition(x, childY);
				}
				x += child.getTotalWidth();
			}
		}

		this.width = width + this.padding.getX();
		this.height = height + this.padding.getY();
		this.updateDividers();
		this.updateTotalSize();

		if (this.parent) {
			this.parent.rearrange();
		}
	}

	drawChildren() {
		for (let child of this.children) {
			child.draw();
		}
	}

	draw() {
		this.drawChildren();
	}
}


class ClickableItem extends GraphItem {
	constructor(graph, parent, width, height, order) {
		super(graph, parent, width, height, order);
		this.graph.addClickableItem(this);
		this.mouseRelativePosition = null;
		this.z = this.parent.getZ() + 1;
	}

	getZ() { return this.z; }

	overlaps(x, y) {
		return !(x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height);
	}

	click(x, y) {
		this.mouseRelativePosition = new Point(this.x - x, this.y - y);
	}

	drop() {
		this.mouseRelativePosition = null;
	}

	mouseOver() { }
	mouseOut() { }
	doubleClick() { }
	drag() { }
	activate() { }
	deactivate() { }
}


class ObjectItem extends Container {
	constructor(graph, x, y, z) {
		super(graph, null, 200, 60);
		delete this.margin;
		delete this.relativePosition;
		this.graph.addClickableItem(this);
		this.mouseRelativePosition = new Point();
		this.x = x;
		this.y = y;
		this.z = z;
		this.name = "";

		this.titleContainer = new TitleContainer(graph, this);
		this.mainContainer = new Container(graph, this, this.width, 100);
		this.addChildren([
			this.titleContainer,
			new Divider(graph, this),
			this.mainContainer,
		]);
		this.mainContainer.addChild(new AttributeItem(graph, this.mainContainer));
		this.mainContainer.addChild(new AttributeItem(graph, this.mainContainer));
		this.mainContainer.addChild(new Button(graph, this.mainContainer, function(button) {
			button.parent.addChild(new AttributeItem(button.graph, button.parent));
		}, "last"));
	}

	setValue(value) {
		this.titleContainer.setValue(value);
	}

	getZ() { return this.z; }

	overlaps(x, y) {
		return !(x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height);
	}

	click(x, y) {
		this.mouseRelativePosition = new Point(this.x - x, this.y - y);
	}

	doubleClick(x, y) {
		this.click(x, y);
	}

	drag(x, y) {
		this.x = x + this.mouseRelativePosition.x;
		this.y = y + this.mouseRelativePosition.y;

		for (let child of this.children) {
			child.updatePosition();
		}
	}

	updateTotalSize() {
		this.totalWidth = this.width;
		this.totalHeight = this.height;
	}

	drop() {
		this.mouseRelativePosition = null;
		this.updatePosition();
	}

	draw() {
		fill(255, 255, 255, 230);
		stroke(DARK_GRAY);
		strokeWeight(MEDIUM);
		rect(this.x, this.y, this.width, this.height, 10);
		this.drawChildren();
	}

	mouseOver() { }
	mouseOut() { }
}


class Divider {
	constructor(graph, parent, order) {
		this.graph = graph;
		this.parent = parent;
		this.direction = parent.contentDirection;
		this.margin = 5;
		this.relativePosition = new Point();
		this.lineLength = 10;
		this.lineHeight = 2;
		this.totalWidth = parent.width;
		this.totalHeight = parent.height;
		this.updateSize();
	}

	getOrder() { return this.order; }
	setOrder(order) { this.order = order; }
	getTotalWidth() { return this.totalWidth; }
	getTotalHeight() { return this.totalHeight; }
	hasInFamily() { return false; }
	hasDescendant() { return false; }
	updateTotalSize() {	}

	updatePosition() {
		this.x = this.parent.x + this.relativePosition.getX() + this.margin;
		this.y = this.parent.y + this.relativePosition.getY() + this.margin;
	}

	updateRelativePosition(x, y) {
		this.direction = this.parent.contentDirection;

		if (this.direction == COLUMN) {
			this.relativePosition.setValues(0, y);
		} else if (this.direction == ROW) {
			this.relativePosition.setValues(x, 0);
		}

		this.updatePosition();
	}

	setDirection(direction) {
		this.direction = direction;
	}

	updateSize() {
		if (this.direction == COLUMN) {
			this.width = this.parent.width - this.margin * 2;
			this.height = this.lineHeight;
			this.totalWidth = this.parent.width - this.parent.getPaddingX();
			this.totalHeight = this.height + this.margin * 2;
		} else if (this.direction == ROW) {
			this.width = this.lineHeight;
			this.height = this.parent.height - this.margin * 2;
			this.totalWidth = this.width + this.margin * 2;
			this.totalHeight = this.parent.height - this.parent.getPaddingY();
		}
	}

	draw() {
		noFill();
		stroke(GRAY);
		if (this.direction == COLUMN) {
			dashedLine(this.x, this.y, this.x + this.width, this.y, this.lineLength);
		} else if (this.direction == ROW) {
			dashedLine(this.x, this.y, this.x, this.y + this.height, this.lineLength);
		}
	}
}


class Node extends ClickableItem {
	constructor(graph, parent, order) {
		let diameter = NODE_DIAMETER;
		super(graph, parent, diameter, diameter, order);
		this.diameter = diameter;
		this.setMargin(5, 10, 5, 10);
		this.temporaryNode = null;
		this.temporaryCurve = [];
	}

	getZ() { return 1000; }

	drop() {
		this.temporaryNode = null;
	}

	drag(x, y) {
		this.temporaryNode.x = x - this.diameter / 2;
		this.temporaryNode.y = y - this.diameter / 2;
		let a = {
			x: this.x + this.diameter / 2,
			y: this.y + this.diameter / 2
		};
		let b = {
			x: this.temporaryNode.x + this.diameter / 2,
			y: this.temporaryNode.y + this.diameter / 2,
		};
		this.temporaryCurve = getBezierCurve(a, b);
	}

	getCurveToNode(node) {
		if (node) {
			let a = {
				x: this.x + this.diameter / 2,
				y: this.y + this.diameter / 2
			};
			let b = {
				x: node.x + this.diameter / 2,
				y: node.y + this.diameter / 2
			};
			return getBezierCurve(a, b);
		}
	}

	draw() {
		fill(LIGHT_GRAY);
		let c = color(DARK_GRAY);
		stroke(c);
		strokeWeight(THICK);
		ellipse(this.x, this.y, this.diameter);

		if (this.temporaryNode) {
			noFill();
			c = color(DARK_GRAY, 100);
			stroke(c);
			bezier(...this.temporaryCurve);
			fill(c);
			noStroke();
			ellipse(this.temporaryNode.x, this.temporaryNode.y, this.diameter);
		}
	}
}


class ParentNode extends Node {
	constructor(graph, parent, order) {
		super(graph, parent, order);
		this.childNode = null;
		this.curve = [];
	}

	updateAttributeType(value) {
		this.parent.typeField.setValue(value);
	}

	click(x, y) {
		super.click(x, y);

		if (this.childNode) { return; }

		this.temporaryNode = new Point(this.x, this.y);
		this.drag(x, y);
	}

	updateCurve() {
		if (!this.childNode) { return; }

		this.curve = this.getCurveToNode(this.childNode);
	}

	updatePosition() {
		super.updatePosition();
		this.updateCurve();
	}

	hasChildNode() { return !!this.childNode; }

	setChildNode(childNode) {
		this.childNode = childNode;
		this.updateCurve();
	}

	removeChildNode() {
		this.childNode = null;
		this.curve = [];
	}

	drag(x, y) {
		if (this.childNode) { return; }

		super.drag(x, y);
	}

	doubleClick() {
		if (this.childNode) {
			this.childNode.removeParentNode(this);
			this.removeChildNode();
		}
	}

	drop() {
		if (this.childNode) { return; }

		super.drop();
		let items = this.graph.getClickableItems();
		let queue = [];

		for (let item of items) {
			if (item instanceof ChildNode) {
				if (item.overlaps(mouseX, mouseY)) {
					queue.push(item);
				}
			}
		}

		if (queue.length) {
			queue.sort(byZ);

			for (let node of queue) {
				if (!this.hasInFamily(node)) {
					this.setChildNode(node);
					node.addParentNode(this);
					break;
				}
			}
		}
	}

	draw() {
		super.draw();
		if (this.childNode) {
			noFill();
			let c = color(DARK_GRAY, 120);
			stroke(c);
			bezier(...this.curve);
		}
	}
}


class ChildNode extends Node {
	constructor(graph, parent, order) {
		super(graph, parent, order);
		this.parentNodes = [];
	}

	setValue(value) {
		let objectItem = this.getObjectItem();
		for (let parentNode of this.parentNodes) {
			parentNode.updateAttributeType(value);
		}
		objectItem.setValue(value);
	}

	click(x, y) {
		super.click(x, y);
		this.temporaryNode = new Point(this.x, this.y);
		this.drag(x, y);
	}

	updateCurve() {
		for (let parentNode of this.parentNodes) {
			parentNode.updateCurve();
		}
	}

	updatePosition() {
		super.updatePosition();
		this.updateCurve();
	}

	addParentNode(parentNode) {
		this.parentNodes.push(parentNode);
		parentNode.updateCurve();
	}

	removeParentNode(node) {
		this.parentNodes.remove(node);
	}

	drop() {
		super.drop();
		let items = this.graph.getClickableItems();
		let queue = [];

		for (let item of items) {
			if (item instanceof ParentNode) {
				if (item.overlaps(mouseX, mouseY)) {
					queue.push(item);
				}
			}
		}

		if (queue.length) {
			queue.sort(byZ);
			for (let node of queue) {
				if (!this.hasInFamily(node) && !node.hasChildNode()) {
					this.addParentNode(node);
					node.setChildNode(this);
					break;
				}
			}
		}
	}
}


class TitleContainer extends Container {
	constructor(graph, parent, order) {
		super(graph, parent, 150, 30, order);
		this.setContentDirection(ROW);
		this.setContentAlignment(CENTER);
		this.node = new ChildNode(graph, this);
		this.typeInput = new TextInput(graph, this).setMargin(0, 5, 0, 0);
		this.typeInput.afterChange = function() {
			this.parent.updateParentNodesValue(this.getValue());
		}
		this.addChildren([
			this.node,
			this.typeInput,
		]);
	}

	connectTo(attributeItem) {
		this.node.addParentNode(attributeItem.node);
		attributeItem.setType(this.typeInput.getValue());
	}

	setValue(value) {
		this.typeInput.setValue(value);
		return this;
	}

	updateParentNodesValue(value) {
		this.node.setValue(value);
	}
}


class AttributeItem extends Container {
	constructor(graph, parent, order) {
		super(graph, parent, 150, 30, order);
		this.setContentDirection(ROW);
		this.setContentAlignment(CENTER);
		this.nameInput = new TextInput(graph, this).setMargin(0, 5, 0, 0);
		this.typeField = new TextBoard(graph, this);
		// this.typeInput = new TextInput(graph, this);
		// this.typeInput.afterInput = function() {
		// 	this.parent.updateChildNodeValue(this.getValue());
		// }©
		this.node = new ParentNode(graph, this);
		this.addChildren([
			this.nameInput,
			new TextBoard(graph, this).setValue(" : "),
			this.typeField,
			// this.typeInput,
			this.node,
		]);
	}

	connectTo(titleContainer) {
		this.node.setChildNode(titleContainer.node);
		console.log(titleContainer.typeInput.getValue());
		this.textField.setValue(titleContainer.typeInput.getValue());
	}

	draw() {
		this.drawChildren();
	}
}


class UIItem extends GraphItem {
	constructor(graph, parent, width, height, order) {
		super(graph, parent, width, height, order);
		delete this.children;
		delete this.contentDirection;
		this.graph = graph;
		this.parent = parent;
		this.x = this.parent.x;
		this.y = this.parent.y;
		this.relativePosition = new Point();
	}

	addChild() { }
	addChildren() { }
	rearrange() { }

	updatePosition() {
		this.x = this.parent.x + this.relativePosition.x + this.margin.left;
		this.y = this.parent.y + this.relativePosition.y + this.margin.top;
	}
}

class ClickableUIItem extends ClickableItem {
	constructor(graph, parent, width, height, order) {
		super(graph, parent, width, height, order);
		delete this.children;
		delete this.contentDirection;
		this.graph = graph;
		this.parent = parent;
		this.x = this.parent.x;
		this.y = this.parent.y;
		this.relativePosition = new Point();
	}

	addChild() { }
	addChildren() { }
	rearrange() { }

	updatePosition() {
		this.x = this.parent.x + this.relativePosition.x + this.margin.left;
		this.y = this.parent.y + this.relativePosition.y + this.margin.top;
	}
}


class TextInput extends ClickableUIItem {
	constructor(graph, parent, order) {
		super(graph, parent, 80, 30, order);
		this.text = "";
		this.inputActive = false;
		this.element = createInput(this.text);
		this.element.owner = this;
		this.element.initialWidth = this.width;
		this.element.initialHeight = this.height;
		this.element.actualWidth = this.width;
		this.element.actualHeight = this.height;
		this.element
			.size(this.width, this.height)
			.style("border", "none")
			.style("outline", "none")
			.style("font-size", fontSize + "px")
			.style("background", color(ALMOST_WHITE))
			.style("color", color(ALMOST_BLACK))
			.attribute("spellcheck", false);

		this.element.input(function() {
			this.owner.updateSize();
			this.owner.updateText();
			this.owner.afterInput();
		});

		this.element.changed(function() {
			this.owner.afterChange();
		});

		this.element.updateSize = function() {
			let width = Math.max(measureText(this.value()), this.initialWidth);
			this.size(width, this.initialHeight);
			this.actualWidth = width;
		}

		this.element.elt.addEventListener("blur", function() {
			this.style.display = "none";
		});

		this.element.hide();
		this.updateSize();
	}

	setValue(value) {
		this.element.value(value);
		this.updateSize();

		return this;
	}

	getValue() { return this.element.value(); }

	updateSize() {
		this.element.updateSize();
		this.rearrange();
	}

	updatePosition(x, y) {
		super.updatePosition(x, y);
		this.element.position(this.x, this.y);
	}

	updateText() {
		this.text = this.element.value();
	}

	rearrange() {
		this.width = this.element.actualWidth;
		this.totalWidth = this.width + this.margin.getX();
		this.parent.rearrange();
	}

	mouseOver() {
		this.element.show();
	}

	mouseOut() {
		if (this.element.elt != document.activeElement) {
			this.element.hide();
		}
	}

	draw() {
		noStroke();
		fill(ALMOST_WHITE);
		rect(this.x, this.y, this.width, this.height);
		fill(ALMOST_BLACK);
		text(this.element.value(), this.x, this.y + 4);
	}

	afterChange() { }
	afterInput() { }
}


class TextBoard extends UIItem {
	constructor(graph, parent, order) {
		super(graph, parent, 50, 30, order);
		this.padding = new Compass(0, 10, 0, 10);
		this.initialWidth = this.width;
		this.value = "";
	}

	setValue(value) {
		this.value = value;
		this.updateSize();

		return this;
	}

	getValue() { return this.value; }

	updateSize() {
		this.width = Math.max(measureText(this.value), this.initialWidth);
		this.totalWidth = this.width + this.padding.getX();
		this.parent.rearrange();
	}

	draw() {
		this.drawBounds();
		noStroke();
		fill(ALMOST_BLACK);
		text(this.value, this.x + this.padding.getLeft(), this.y + this.padding.getTop());
	}
}


class Button extends ClickableUIItem {
	constructor(graph, parent, action, order) {
		super(graph, parent, 20, 20, order);
		this.setMargin(5);
		this.graph = graph;
		this.parent = parent;
		this.action = action;
		this.padding = new Compass(5);
		this.style = BUTTON_STYLE.ADD;
	}

	click() {
		this.action(this);
	}

	draw() {
		this.style(this.x + this.padding.getLeft(), this.y + this.padding.getTop());
	}
}
