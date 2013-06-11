var Tree = function(element) {
	this.allNodes = [];
	this.nodes = [];

	this.keyField = null;
	this.nodeDict = {};
	this.data = null;

	this.selectedNode = null;

	this.tree = this;
	this.labelField = null;

	this.dom = document.createElement("ul");
	element.appendChild(this.dom);
};

Tree.prototype = {
	loadTreeData : function(data, keyField) {
		this.clear();

		this.keyField = keyField;

		for (var i=0; i<data.length; i++) {
			this.addNode(data[i]);
		}
		this.data = data;
	},

	loadListData : function(data, selfField, parentField, topFlag) {
		var tree = [];
		var dict = {};

		var length = data.length;
		for (var i = 0; i < length; i++) {
			var item = data[i];
			dict[item[selfField]] = item;
			if (item[parentField] === topFlag) {
				//add root nodes
				tree.push(item);
			}
		}

		//contribute the tree data
		for (i = 0; i < length; i++) {
			var child = data[i];
			if (child[parentField] === topFlag) {
				continue;
			}
			var parent = dict[child[parentField]];
			if (parent) {
				child.parent = parent;
				if (!parent.children) {
					parent.children = [];
				}
				parent.children.push(child);

			}
		}
		
		this.loadTreeData(tree, selfField);
	},

	expandAll : function() {
		for (var i=0; i<this.allNodes.length; i++) {
			this.allNodes[i].expand();
		}
	},

	collapseAll : function() {
		for (var i=0; i<this.allNodes.length; i++) {
			this.allNodes[i].collapse();
		}
	},

	findNode : function(key, value) {
		var result;
		for (var i = 0; i < this.allNodes.length; i++) {
			var node = this.allNodes[i];
			if (node[key] === value) {
				result = node;
				break;
			}
		}

		return result;
	},

	addNode : function(data) {
		var node = new TreeNode(data, this);
		this.nodes.push(node);
		this.allNodes.push(node);
		
		this.dom.appendChild(node.dom);

		var that = this;
		node.addEventListener("select", function (event) {
			that.select(event.node);
		});

		node.addEventListener("rightClicked", function (event) {
			//只做转发，把主体改变一下
			event.target = that;
			that.dispatchEvent(event);
		});

		//已经成功添加了新节点
		var event = {
			type: "rowInserted",
			newNode: node,
			target: this
		};
		this.dispatchEvent(event);
	},

	removeNode : function(node) {

	},

	swapNodes : function(node1, node2) {

	},
	
	selectNode: function(node) {	
		var event = {
			type: "changed",
			oldNode: this.selectedNode,
			newNode: node
		};

		if (this.selectedNode) {
			this.selectedNode.unselect();
		}

		node.select();
		this.selectedNode = node;
		
		this.dispatchEvent(event);
	},

	clear : function() {

	}
}.extend(EventDispatcher);

var TreeNode = function(data, parent) {
	this.data = data;
	this.parent = parent;
	this.tree = parent.tree;
	this.childNodes = [];

	this.create();
};

TreeNode.prototype = {
	create: function() {
		this.dom = document.createElement("li");
		this.labelContainer = document.createElement("span");
		this.labelContainer.innerHTML = this.data[this.tree.labelField || "label"];
		this.dom.appendChild(this.labelContainer);

		this.childrenContainer = document.createElement("ul");
		this.dom.appendChild(this.childrenContainer);

		if (this.data.children) {
			for (var i=0; i<this.data.children.length; i++) {
				this.addNode(this.data.children[i]);
			}
		}

		var that = this;
		this.labelContainer.onclick = function() {
			var event = {
				type: "selected",
				node: that,
				target: that
			};

			that.dispatchEvent(event);
		}

		this.dom.oncontextmenu = function(e) {
			var event = {
				type: "rightClicked",
				node: that,
				target: that
			};

			that.dispatchEvent(event);

			if ( e && e.stopPropagation )
			//因此它支持W3C的stopPropagation()方法
				e.stopPropagation();
			else
			//否则，我们需要使用IE的方式来取消事件冒泡
				window.event.cancelBubble = true;

			//阻止默认浏览器动作(W3C)
			if ( e && e.preventDefault )
				e.preventDefault();
			//IE中阻止函数器默认动作的方式
			else
				window.event.returnValue = false;
			return false;
		}
	},

	destroy: function() {

	},

	addNode: function(data) {
		var node = new TreeNode(data, this);
		this.childNodes.push(node);
		this.tree.allNodes.push(node);
		
		this.childrenContainer.appendChild(node.dom);

		var that = this;
		node.addEventListener("select", function (event) {
			that.select(event.node);
		});

		node.addEventListener("rightClicked", function (event) {
			//只做转发，把主体改变一下
			event.target = that;
			that.dispatchEvent(event);
		});

		//已经成功添加了新节点
		var event = {
			type: "rowInserted",
			newNode: node,
			target: this
		};
		this.dispatchEvent(event);
	},

	removeNode: function(node) {
		this.childrenContainer.removeChild(node.dom);

		for (var i=0; i<this.childNodes.length; i++) {
			if (this.childNodes[i] == node) {
				this.childNodes.splice(i, 1);
			}
		}

		for (var i=0; i<this.tree.allNodes.length; i++) {
			if (this.tree.allNodes[i] == node) {
				this.tree.allNodes.splice(i, 1);
			}
		}
	},

	expand: function() {
		this.childrenContainer.style.display = "";
	},
	
	collapse: function() {
		this.childrenContainer.style.display = "hidden";
	},
	
	select: function() {
		this.labelContainer.className = "info";
	},
	
	unselect: function() {
		this.labelContainer.className = "";
	}
}.extend(EventDispatcher);