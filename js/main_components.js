class Graph {
	constructor() {
		this.objectItems = [];
		this.lastClick = getTime();
		this.mouse = new Mouse(this);
		this.z = 0;
	}

	addObject(x, y) {
		this.objectItems.push(new ObjectItem(graph, x, y, this.z));
		this.z += 10;
	}

	addClickableItem(item) {
		this.mouse.addClickableItem(item);
	}

	removeClickableItem(item) {
		this.mouse.removeClickableItem(item);
	}

	getClickableItems() {
		return this.mouse.getClickableItems();
	}

	update() {
		this.mouse.update();
	}

	draw() {
		noFill();
		noStroke();
		clear();

		for (let i = 0; i < this.objectItems.length; i++) {
			this.objectItems[i].draw();
		}
	}
}


class Mouse {
	constructor(graph) {
		this.graph = graph;
		this.x = mouseX; this.y = mouseY;
		this.previousPos = { x: mouseX, y: mouseY };
		this.pressed = {x: 0, y: 0};
		this.lastClick = getTime();
		this.isPressed = false;
		this.isDragging = false;
		this.clickable = [];
		this.clickedItem = null;
		this.activeItem = null;
		this.hoveredItem = null;
	}

	update() {
		this.x = mouseX; this.y = mouseY;
		if (mouseIsPressed) {
			if (!this.isPressed) {
				this.pressed.x = mouseX;
				this.pressed.y = mouseY;
				this.isPressed = true;

				let clickedItem = this.getItemAt(mouseX, mouseY);

				if (clickedItem) {
					if (this.clickedItem != clickedItem) {
						this.clickedItem = clickedItem;

						if (this.doubleClicked()) {
							if (isFunction(this.clickedItem.doubleClick)) {
								this.clickedItem.doubleClick(mouseX, mouseY);
							}
						} else {
							if (isFunction(this.clickedItem.click)) {
								this.clickedItem.click(mouseX, mouseY);
							}
						}
					}
				} else {
					this.clickedItem = null;
				}

				if (this.activeItem && this.clickedItem != this.activeItem) {
					if (isFunction(this.activeItem.deactivate)) {
						this.activeItem.deactivate();
					}

					this.activeItem = null;
				}

				if (this.clickedItem) {
					this.activeItem = this.clickedItem;

					if (isFunction(this.activeItem.activate)) {
						this.activeItem.activate();
					}
				}

				this.click();
			} else {
				if (!(this.x == this.pressed.x && this.y == this.pressed.y)) {
					this.isDragging = true;

					if (this.clickedItem && this.hasMoved()) {
						if (isFunction(this.clickedItem.drag)) {
							this.clickedItem.drag(mouseX, mouseY);
						}
					}
				}
			}
		} else {
			this.isPressed = false;
			this.isDragging = false;

			if (this.clickedItem) {
				if (isFunction(this.clickedItem.drop)) {
					this.clickedItem.drop();
				}
			}

			let hoveredItem = this.hoveredItem;
			this.hoveredItem = this.getItemAt(mouseX, mouseY);

			if (this.hoveredItem != hoveredItem) {
				if (!!hoveredItem) {
					hoveredItem.mouseOut();
				}

				if (!!this.hoveredItem) {
					this.hoveredItem.mouseOver();
				}
			}

			this.clickedItem = null;
		}
		this.previousPos.x = this.x;
		this.previousPos.y = this.y;
	}

	addClickableItem(item) {
		this.clickable.push(item);
	}

	removeClickableItem(item) {
		this.clickable.remove(item);
	}

	getClickableItems() {
		return this.clickable;
	}

	hasMoved() {
		return !(this.x == this.previousPos.x
		&& this.y == this.previousPos.y);
	}

	click() {
		if (this.doubleClicked() && !this.clickedItem) {
			this.graph.addObject(mouseX, mouseY);
		}

		this.lastClick = getTime();
	}

	doubleClicked() {
		return getTime() - this.lastClick < 200;
	}

	getItemAt(x, y) {
		let queue = [];

		for (let item of this.clickable) {
			if (item.overlaps(x, y)) {
				queue.push(item);
			}
		}

		if (queue.length) {
			queue.sort(byZ);
			return queue[0];
		}

		return null;
	}
}
