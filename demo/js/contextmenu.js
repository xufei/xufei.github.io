function ContextMenu() {
	this.items = [];

	var dom = document.createElement("div");
	dom.className = "dropdown clearfix";
	dom.style.position = "absolute";

	var container = document.createElement("ul");
	container.className = "dropdown-menu";

	dom.appendChild(container);

	this.dom = dom;

	document.body.appendChild(dom);

	var that = this;

	if (window.attachEvent) {
		document.documentElement.attachEvent("onclick", function() {
			that.hide();
		});
	}
	else {
		document.documentElement.addEventListener("click", function() {
			that.hide();
		});
	}
}

ContextMenu.prototype = {
	create: function(data) {
		for (var i=0; i<data.length; i++) {
			var item = new ContextMenuItem(this, data[i]);
			this.dom.firstChild.appendChild(item.dom);
			this.items.push(item);

			var that = this;
			item.addEventListener("clicked", function(event) {
				that.hide();

				event.type = "itemClicked";
				event.target = that;
				that.dispatchEvent(event);
			});
		}
	},

	show: function(position) {
		this.dom.firstChild.style.display = "block";
		this.dom.style.pixelLeft = position.left;
		this.dom.style.pixelTop = position.top;
	},

	hide: function() {
		this.dom.firstChild.style.display = "none";
	}
}.extend(EventDispatcher);

function ContextMenuItem(menu, data) {
	this.menu = menu;
	this.data = data;

	this.create();
}

ContextMenuItem.prototype = {
	create: function() {
		var dom = document.createElement("li");
		this.dom = dom;

		if (this.data === "divider") {
			dom.className = "divider";
		}
		else {
			var link = document.createElement("a");
			link.tabIndex = -1;
			link.innerHTML = this.data;

			dom.appendChild(link);

			var that = this;
			dom.onclick = function(event) {
				var newEvent = {
					type: "clicked",
					target: that,
					item: that
				};
				that.dispatchEvent(newEvent);
			}
		}
	},

	destroy: function() {
		this.dom = null;
		this.data = null;
		this.menu = null;
	}
}.extend(EventDispatcher);