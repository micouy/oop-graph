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

		if (def(order)) {
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

	// getters
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
	getOrder() { return this.order; }

	getClassItem() {
		let parent = this.getUltimateParent();

		return parent instanceof ClassItem ? parent : null;
	}

	getUltimateParent() {
		let parent = this;

		while (!!parent.getParent()) {
			parent = parent.getParent();
		}

		return parent;
	}

	getDescendants() {
		let found = [];

		if (!hasChildren(this)) { return []; }

		for (let child of this.children) {
			if (child instanceof Divider) { continue; }

			found.push(child);
			found.extend(child.getDescendants());
		}

		return found;
	}

	// setters
	setOrder(order) { this.order = order; }
	setFixedWidth(width) { this.fixedWidth = width; return this; }
	setFixedHeight(height) { this.fixedHeight = height; return this; }

	setMargin(top, right, bottom, left) {
		this.margin.setValues(top, right, bottom, left);

		return this;
	}

	// updaters
	updatePosition() {
		if (this.parent) {
			this.x = this.parent.x + this.relativePosition.getX() + this.margin.getLeft();
			this.y = this.parent.y + this.relativePosition.getY() + this.margin.getTop();
		}

		if (this instanceof ContainerItem) {
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

	// conditions
	overlaps(x, y) {
		return !(x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height);
	}

	hasDescendant(thing) {
		if (hasChildren(this)) {
			for (let child of this.children) {
				if (child instanceof Divider) { continue; }
				if (child.is(thing)) { return true; }
				else if (child.hasDescendant(thing)) { return true; }
			}
		}

		return false;
	}

	is(thing) {
		if (typeof thing == "object") {
			return this === thing;
		} else {
			return this instanceof thing;
		}
	}

	hasInFamily(thing) {
		return this.getUltimateParent().hasDescendant(thing);
	}

	// finding things
	findAmongChildren(thing) {
		let found = [];
		let findMany = typeof thing == "object" ? false : true;

		if (hasChildren(this)) {
			for (let child of this.children) {
				if (child instanceof Divider) { continue; }

				if (child.is(thing)) {
					if (!findMany) {
						return child;
					} else {
						found.push(child);
					}
				} else {
					found.extend(child.findAmongChildren(thing));
				}
			}
		}

		return found;
	}

	findClosestAncestor(cls) {
		let parent = this.getParent();

		if (!parent) { return null; }

		while (!!parent) {
			if (parent.is(cls)) { return parent; }
			else { parent = parent.getParent(); }
		}

		return null;
	}

	findInFamily(thing) {
		let found = [];
		let temporaryParent = this.getParent();

		while (!!temporaryParent) {
			for (let child of temporaryParent.getChildren()) {
				if (child.is(thing)) { found.push(child); }
			}

			if (temporaryParent.is(thing)) { found.push(temporaryParent); }

			temporaryParent = temporaryParent.getParent();
		}

		return found;
	}

	drawBounds() {
		noFill();
		stroke(RED);
		strokeWeight(MEDIUM);
		rect(this.x - this.margin.getLeft(), this.y - this.margin.getTop(), this.totalWidth, this.totalHeight);
	}

	// TODO
	// drawPadding() {
	// 	fill(0, 50, 255, 50);
	// 	noStroke();
	// 	rect(this.x, this.y, this.padding.getLeft(), this.totalHeight);
	// 	rect(this.x + this.totalWidth - this.padding.getRight(), this.y, this.padding.getRight(), this.totalHeight);
	// 	rect(this.x + this.padding.getLeft(), this.y, this.width, this.padding.getTop());
	// 	rect(this.x + this.padding.getLeft(), this.y + this.totalHeight - this.padding.getBottom(), this.width, this.padding.getBottom())
	// }
  //
	// drawMargin() {
	// 	fill(0, 255, 50, 50);
	// 	noStroke();
	// 	rect(this.x - this.padding.getLeft(), this.y, this.padding.getLeft(), this.totalHeight);
	// 	rect(this.x + this.totalWidth - this.padding.getRight(), this.y, this.padding.getRight(), this.totalHeight);
	// 	rect(this.x + this.padding.getLeft(), this.y, this.width, this.padding.getTop());
	// 	rect(this.x + this.padding.getLeft(), this.y + this.totalHeight - this.padding.getBottom(), this.width, this.padding.getBottom())
	// }

	// undefined
	draw() { }
}


class ContainerItem extends GraphItem {
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

	// getters
	getPaddingX() { return this.padding.getX(); }
	getPaddingY() { return this.padding.getY(); }
	getZ() { if (def(this.z)) return this.z; }
	getChildren() { return this.children; }

	// setters
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

	// children related
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
		this.children.extend(children);
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

	// drawing
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

	// getters
	getZ() { return this.z; }

	// interaction
	click(x, y) {
		this.mouseRelativePosition = new Point(this.x - x, this.y - y);
	}

	drop() {
		this.mouseRelativePosition = null;
	}

	// undefined
	mouseOver() { }
	mouseOut() { }
	doubleClick() { }
	drag() { }
	activate() { }
	deactivate() { }
}


class ClassItem extends ContainerItem {
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

		this.titleContainerItem = new TitleContainerItem(graph, this);
		this.mainContainerItem = new ContainerItem(graph, this, this.width, 100);
		this.addChildren([
			this.titleContainerItem,
			new Divider(graph, this),
			this.mainContainerItem,
		]);
		this.mainContainerItem.addChild(new AttributeItem(graph, this.mainContainerItem));
		this.mainContainerItem.addChild(new Button(graph,
			this.mainContainerItem,
			function(button) {
				button.parent.addChild(new AttributeItem(button.graph, button.parent));
			},
			"last"));
	}

	// getters
	getZ() { return this.z; }

	// setters
	setType(value) {
		this.titleContainerItem.setValue(value);
	}

	// updaters
	updateTotalSize() {
		this.totalWidth = this.width;
		this.totalHeight = this.height;
	}

	// interaction
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

	drop() {
		this.mouseRelativePosition = null;
		this.updatePosition();
	}

	// drawing
	draw() {
		fill(255, 255, 255, 230);
		stroke(DARK_GRAY);
		strokeWeight(MEDIUM);
		rect(this.x, this.y, this.width, this.height, 10);
		this.drawChildren();
	}

	// undefined
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

	// getters
	getOrder() { return this.order; }
	getTotalWidth() { return this.totalWidth; }
	getTotalHeight() { return this.totalHeight; }

	// setters
	setOrder(order) { this.order = order; }
	setDirection(direction) { this.direction = direction; }

	// updaters
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

	// conditions
	is(thing) {
		if (typeof thing == "object") {
			return this === thing;
		} else {
			return this instanceof thing;
		}
	}

	hasInFamily() { return false; }
	hasDescendant() { return false; }

	// drawing
	draw() {
		noFill();
		stroke(GRAY);
		if (this.direction == COLUMN) {
			dashedLine(this.x, this.y, this.x + this.width, this.y, this.lineLength);
		} else if (this.direction == ROW) {
			dashedLine(this.x, this.y, this.x, this.y + this.height, this.lineLength);
		}
	}

	// undefined
	updateTotalSize() {	}
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

	// getters
	getZ() { return 1000; }

	getCurveToNode(node) {
		if (node) {
			let a = {
				x: this.x + this.diameter / 2,
				y: this.y + this.diameter / 2,
			};
			let b = {
				x: node.x + this.diameter / 2,
				y: node.y + this.diameter / 2,
			};
			return getBezierCurve(a, b);
		}
	}

	// interaction
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

	// drawing
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


class ChildNode extends Node {
	constructor(graph, parent, order) {
		super(graph, parent, order);
		this.parentNode = null;
		this.curve = [];
	}

	// setters
	setValue(value) {
		this.findClosestAncestor(AttributeItem).setValue(value);
	}

	// updaters
	updateCurve() {
		if (!this.parentNode) { return; }

		this.curve = this.getCurveToNode(this.parentNode);
	}

	updatePosition() {
		super.updatePosition();
		this.updateCurve();
	}

	// conditions
	connectable() { return !this.parentNode; }

	// interaction
	click(x, y) {
		super.click(x, y);

		if (this.parentNode) { return; }

		this.temporaryNode = new Point(this.x, this.y);
		this.drag(x, y);
	}

	drag(x, y) {
		if (this.parentNode) { return; }

		super.drag(x, y);
	}

	doubleClick() {
		if (this.parentNode) {
			this.parentNode.disconnect(this);
			this.disconnect();
		}
	}

	drop() {
		if (this.parentNode) { return; }

		super.drop();

		let queue = this.graph.getItemsAt(mouseX, mouseY, function (item) {
			return item instanceof ParentNode;
		});

		if (queue.length) {
			queue.sort(byZ);

			for (let node of queue) {
				if (!this.hasInFamily(node)) {
					connectAttrWithTitleContainer(
						this.findInFamily(AttributeItem)[0],
						node.findInFamily(TitleContainerItem)[0]
					);

					break;
				}
			}
		}
	}

	connect(parentNode) {
		if (parentNode instanceof ParentNode && this.connectable()) {
			this.parentNode = parentNode;
		}
	}

	disconnect() {
		this.parentNode = null;
		this.findClosestAncestor(AttributeItem).setValue("");
		this.curve = [];
	}

	// drawing
	draw() {
		super.draw();

		if (this.parentNode) {
			noFill();
			stroke(DARK_GRAY, 120);
			bezier(...this.curve);
		}
	}
}


class ParentNode extends Node {
	constructor(graph, parent, order) {
		super(graph, parent, order);
		this.childNodes = [];
	}

	// updaters
	updateCurve() {
		for (let childNode of this.childNodes) {
			childNode.updateCurve();
		}
	}

	updatePosition() {
		super.updatePosition();
		this.updateCurve();
	}

	// interaction
	click(x, y) {
		super.click(x, y);
		this.temporaryNode = new Point(this.x, this.y);
		this.drag(x, y);
	}

	drop() {
		super.drop();
		let queue = this.graph.getItemsAt(mouseX, mouseY, function (item) {
			return item instanceof ChildNode && item.connectable();
		});

		if (queue.length) {
			queue.sort(byZ);

			for (let node of queue) {
				if (!this.hasInFamily(node)) {
					connectAttrWithTitleContainer(
						node.findInFamily(AttributeItem)[0],
						this.findInFamily(TitleContainerItem)[0]
					);

					break;
				}
			}
		}
	}

	connect(childNode) {
		if (childNode instanceof ChildNode && childNode.connectable()) {
			this.childNodes.push(childNode);
		}
	}

	disconnect(node) {
		this.childNodes.remove(node);
	}

	notifyParentsAboutNewValue(value) {
		for (let childNode of this.childNodes) {
			childNode.setValue(value);
		}
	}
}


class TitleContainerItem extends ContainerItem {
	constructor(graph, parent, order) {
		super(graph, parent, 150, 30, order);
		this.setContentDirection(ROW);
		this.setContentAlignment(CENTER);
		this.attributeItems = [];
		this.node = new ParentNode(graph, this);
		this.typeInput = new InputItem(graph, this);
		this.typeInput.afterInput = function() {
			this.parent.updateValue();
		}
		this.addChildren([
			this.node,
			this.typeInput,
		]);
		this.updateValue();
	}

	// getters
	getNode() { return this.node; }
	getValue() { return this.typeInput.getValue(); }

	// setters
	setValue(type) {
		this.typeInput.setValue(type);

		return this;
	}

	// updaters
	updateValue() {
		this.node.notifyParentsAboutNewValue(this.typeInput.getValue());
	}

	// interaction
	connect(attributeItem) {
		connectAttrWithTitleContainer(attributeItem, this);
	}

	disconnect(attributeItem) {
		this.attributeItems.remove(attributeItem);
		this.node.disconnect(attributeItem.getNode());
		attributeItem.disconnect();
	}
}


class AttributeItem extends ContainerItem {
	constructor(graph, parent, order) {
		super(graph, parent, 150, 30, order);
		this.setContentDirection(ROW);
		this.setContentAlignment(CENTER);
		this.titleContainerItem = null;
		this.nameInput = new InputItem(graph, this);
		this.typeField = new TextFieldItem(graph, this);
		this.node = new ChildNode(graph, this);
		this.addChildren([
			this.nameInput,
			new TextFieldItem(graph, this).setValue(":").setMargin(0, 5, 0, 5),
			this.typeField,
			this.node,
		]);
	}

	// getters
	getNode() { return this.node; }

	// setters
	setValue(type) { this.typeField.setValue(type); }

	// interaction
	connect(titleContainerItem) {
		connectAttrWithTitleContainer(this, titleContainerItem);
	}

	disconnect() {
		this.titleContainer = null;
		this.node.disconnect();
	}
}


class TextFieldItem extends GraphItem {
	constructor(graph, parent, order) {
		super(graph, parent, 20, 30, order);
		this.padding = new Compass(0, 10, 0, 10);
		this.initialWidth = this.width;
		this.value = "";
		this.textColor = ALMOST_BLACK;
		this.updateValue();
		this.updateSize();
	}

	// getters
	getValue() { return this.value; }

	// setters
	setValue(value) {
		this.value = value;
		this.updateValue();
		this.updateSize();

		return this;
	}

	// updaters
	updateSize() {
		let textWidth = Math.max(measureText(this.value), this.initialWidth);
		this.width = textWidth;
		this.totalWidth = textWidth + this.padding.getX() + this.margin.getX();
		this.parent.rearrange();
	}

	updateValue() {
		if (!!this.value.length) {
			this.textColor = ALMOST_BLACK;
		} else {
			this.textColor = RED;
		}

		this.value = !!this.value.length ? this.value : "-";
	}

	// drawing
	draw() {
		noStroke();
		fill(this.textColor);
		text(this.value,
			this.x + this.padding.getLeft(),
			this.y + this.padding.getTop());
	}

	// undefined
	updateTotalSize() { }
}


class OptionInputItem extends ClickableItem {
	constructor(graph, parent, order) {
		super(graph, parent, 50, 20, order);
		this.options = [];
	}

	// drawing
	draw() {
		let y = 0;
		for (let option of this.options) {

		}
	}
}


class Button extends ClickableItem {
	constructor(graph, parent, action, order) {
		super(graph, parent, 20, 20, order);
		this.setMargin(5);
		this.action = action;
		this.padding = new Compass(5);
		this.style = BUTTON_STYLE.ADD;
	}

	// interaction
	click() {
		this.action(this);
	}

	// drawing
	draw() {
		this.style(this.x + this.padding.getLeft(), this.y + this.padding.getTop());
	}
}


class InputItem extends ClickableItem {
	constructor(graph, parent, order) {
		super(graph, parent, 50, 20, order);
		this.padding = new Compass(4);
		this.totalHeight = this.height + this.padding.getY();
		this.totalWidth = this.width + this.padding.getX();
    this.value = "";
    this.minWidth = 50;
    this.active = false;
    this.cursor = null;
		this.lastCursorMove = 0;
		this.selection = { a: null, b: null }
    this.selecting = false;
  }

	// getters
	getValue() { return this.value; }
  getZ() { return this.z; }

	// updaters
	updateSize() {
    this.width = Math.max(this.minWidth, textWidth(this.value));
		this.totalWidth = this.width + this.padding.getX();
		this.parent.rearrange();
  }

	// interaction
  activate() {
    this.active = true;
    this.putCursor();
  }

  deactivate() {
    this.active = false;
		this.afterChange();
  }

	// typing related
  charPressed(char) {
    this.putChar(char);
  }

  keysPressed(keys) {
    if (keys.alt) {
      if (keys.leftArrow) {
        this.moveCursorToLeft(1);
      } else if (keys.rightArrow) {
        this.moveCursorToRight(1);
      } else if (keys.backspace) {
        this.removeChars(1);
      }
    } else if (keys.leftArrow) {
      this.moveCursorToLeft();
    } else if (keys.rightArrow) {
      this.moveCursorToRight();
    } else if (keys.backspace) {
      this.removeChars();
    }
  }

  removeChars(mode) {
    mode = mode || 0;
    let prevCursor = this.cursor;
    this.moveCursorToLeft(mode);
    this.value = this.value.slice(0, this.cursor)
	    .concat(this.value.slice(prevCursor, this.value.length));
    this.updateSize();
		this.afterInput();
  }

  putChar(char) {
    let firstPart = this.value.slice(0, this.cursor) || "";
    let secondPart = this.value.slice(this.cursor, this.value.length) || "";
    firstPart += char;
    this.value = firstPart.concat(secondPart);
    this.moveCursorToRight();
    this.updateSize();
		this.afterInput();
  }

	moveCursorTo(x) {
		this.lastCursorMove = millis();
		this.cursor = x;
	}

  putCursor() {
    let array = [];
    let sum = 0;
    let index = 0;

    for (let ch of this.value) {
      array.push(textWidth(ch));
    }

    for (let i = 0; i < array.length; i++) {
      index = i;

      if (this.x + sum + array[i] > mouseX) {
        if (mouseX - (this.x + sum) < (this.x + sum + array[i]) - mouseX) {
          break;
        } else {
          index = i + 1;

          break;
        }
      } else {
        sum += array[i];
      }
    }

    this.moveCursorTo(index);
  }

  moveCursorToRight(mode) {
    mode = mode || 0;

    if (mode == 0) {
      this.moveCursorTo(Math.min(this.value.length, this.cursor + 1));
    } else if (mode == 1) {
      let value = this.value
	      .replace(/([a-z])([A-Z])/g, "$1 $2")
	      .replace(/([a-z])([_])/g, "$1 $2")
	      .split(" ");
      let array = [];
      let sum = this.value.length;

      for (let word of value) {
        array.push(word.length);
      }

      for (let i = array.length - 1; i >= 0; i--) {
        if (sum - array[i] <= this.cursor) {
          break;
        } else {
          sum -= array[i];
        }
      }

			this.moveCursorTo(sum);
    }
  }

  moveCursorToLeft(mode) {
    mode = mode || 0;

    if (mode == 0) {
      this.moveCursorTo(Math.max(0, this.cursor - 1));
    } else if (mode == 1) {
      let value = this.value
	      .replace(/([a-z])([A-Z])/g, "$1 $2")
	      .replace(/([_])([a-z])/g, "$1 $2")
	      .split(" ");
      let array = [];
      let sum = 0;

      for (let word of value) {
        array.push(word.length);
      }

      for (let i = 0; i < array.length; i++) {
        if (sum + array[i] >= this.cursor) {
          break;
        } else {
          sum += array[i];
        }
      }

      this.moveCursorTo(sum);
    }
  }

	// drawing
  draw() {
    fill(this.value.length || this.active ? [0, 0, 0, 0] : [255, 0, 0, 30]);
    stroke(DARK_GRAY);
		strokeWeight(MEDIUM);
    rect(this.x, this.y, this.totalWidth, this.totalHeight, 3);

    fill(DARK_GRAY);
    noStroke();
    text(this.value, this.x + this.padding.getLeft(),
			this.y + this.padding.getTop());

    if (this.active) {
      noFill();
      stroke(DARK_GRAY,
				+(millis() % 1000 > 500 || millis() < this.lastCursorMove + 300) * 255);
			strokeWeight(MEDIUM);
      let x = textWidth(this.value.slice(0, this.cursor));
      line(this.x + this.padding.getLeft() + x,
				this.y + this.padding.getTop(),
				this.x + this.padding.getLeft() + x,
				this.y + this.padding.getTop() + this.height);
    }
  }

	// undefined
	updateTotalSize() { }
	afterInput() { }
	afterChange() { }
}
