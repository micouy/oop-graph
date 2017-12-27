class Graph {
	constructor() {
		this.classItems = [];
		this.lastClick = getTime();
		this.z = 0;
		this.eventHandler = new EventHandler(this);
	}

	getKeyboard() {
		return this.eventHandler.getKeyboard();
	}

	getClickableItems() {
		return this.eventHandler.getClickableItems();
	}

	getItemsAt(x, y, filter) {
		let queue = this.classItems.slice();
		let items = [];

		while (queue.length) {
			let item = queue[0];

			items.push(item);

			if (isFunction(item.getChildren)) {
				queue.extend(item.getChildren());
			}

			queue.remove(item);
		}

		if (isFunction(filter)) {
			return items.filter(function (item) {
				return !(item instanceof Divider) && item.overlaps(x, y) && filter(item);
			});
		} else {
			return items;
		}
	}

	addClassItem(x, y) {
		this.classItems.push(new ClassItem(graph, x, y, this.z));
		this.z += 10;
	}

	addClickableItem(item) {
		this.eventHandler.addClickableItem(item);
	}

	removeClickableItem(item) {
		this.eventHandler.removeClickableItem(item);
	}

	update() {
		this.eventHandler.update();
	}

	draw() {
		noFill();
		noStroke();
		clear();

		for (let i = 0; i < this.classItems.length; i++) {
			this.classItems[i].draw();
		}
	}
}


class EventHandler {
	constructor(graph) {
		this.graph = graph;
		this.mouse = new Mouse(graph, this);
		this.keyboard = new Keyboard(graph, this);
		this.activeItem = null;
	}

	getKeyboard() {
		return this.keyboard;
	}

	handleActiveItem() {
		let clickedItem = this.mouse.getClickedItem();

		if (this.activeItem && clickedItem != this.activeItem) {
			if (isFunction(this.activeItem.deactivate)) {
				this.activeItem.deactivate();
			}

			this.activeItem = null;
		}

		if (!!clickedItem) {
			this.activeItem = clickedItem;

			if (isFunction(this.activeItem.activate)) {
				this.activeItem.activate();
			}
		}

		if (this.activeItem instanceof InputItem) {
			this.keyboard.setActiveInput(this.activeItem);
		} else {
			this.keyboard.removeActiveInput();
		}
	}

	update() {
		this.mouse.update();
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
}


class Mouse {
	constructor(graph, parent) {
		this.graph = graph;
		this.parent = parent;
		this.x = 0;
		this.y = 0;
		this.previousPos = { x: 0, y: 0 };
		this.pressed = { x: 0, y: 0 };
		this.lastClick = getTime();
		this.isPressed = false;
		this.isDragging = false;
		this.clickable = [];
		this.clickedItem = null;
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

				this.handleActiveItem();

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

	handleActiveItem() {
		this.parent.handleActiveItem();
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

	getClickedItem() {
		return this.clickedItem;
	}

	hasMoved() {
		return !(this.x == this.previousPos.x
		&& this.y == this.previousPos.y);
	}

	click() {
		if (this.doubleClicked() && !this.clickedItem) {
			this.graph.addClassItem(mouseX, mouseY);
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


class Keyboard {
  constructor(graph, parent) {
    this.graph = graph;
		this.parent = parent;
    this.keysDown = {
      alt: false,
      backspace: false,
      leftArrow: false,
      rightArrow: false,
    };
    this.activeInput = null;
  }

  removeActiveInput() {
    if (!!this.activeInput) {
      this.activeInput.deactivate();
      this.activeInput = null;
    }
  }

  setActiveInput(input) {
    this.removeActiveInput();
    this.activeInput = input;
    this.activeInput.activate();
  }

  sendKeyEventToInput(key) {
    if (!!this.activeInput) {
      this.activeInput.keysPressed(this.keysDown);
    }
  }

  keyPressed(event) {
    if (event.key.length == 1) {
      if (!!this.activeInput) {
        this.activeInput.charPressed(event.key);
      }
    } else {
      switch (event.code) {
        case "AltLeft":
          this.keysDown.alt = true;
          this.sendKeyEventToInput(event.code);
          break;
        case "ArrowLeft":
          this.keysDown.leftArrow = true;
          this.sendKeyEventToInput(event.code);
          break;
        case "ArrowRight":
          this.keysDown.rightArrow = true;
          this.sendKeyEventToInput(event.code);
          break;
        case "Backspace":
          this.keysDown.backspace = true;
          this.sendKeyEventToInput(event.code);
          break;
        default:
          break;
      }
    }
  }

  keyReleased(event) {
    switch (event.code) {
      case "AltLeft":
        this.keysDown.alt = false;
        break;
      case "ArrowLeft":
        this.keysDown.leftArrow = false;
        break;
      case "ArrowRight":
        this.keysDown.rightArrow = false;
        break;
      case "Backspace":
        this.keysDown.backspace = false;
        break;
      default:
        break;
    }
  }
}
