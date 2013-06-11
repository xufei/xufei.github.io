//事件派发机制的实现
var EventDispatcher = {
	addEventListener: function(eventType, handler) {
		//事件的存储
		if (!this.eventMap) {
			this.eventMap = {};
		}

		//对每个事件，允许添加多个监听
		if (!this.eventMap[eventType]) {
			this.eventMap[eventType] = [];
		}
		
		//把回调函数放入事件的执行数组
		this.eventMap[eventType].push(handler);
	},
	
	removeEventListener: function(eventType, handler) {
		for (var i=0; i<this.eventMap[eventType].length; i++) {
			if (this.eventMap[eventType][i] === handler) {
				this.eventMap[eventType].splice(i, 1);
				break;
			}
		}
	},
	
	dispatchEvent: function(event) {
		var eventType = event.type;
		if (this.eventMap && this.eventMap[eventType]) {
			for (var i=0; i<this.eventMap[eventType].length; i++) {
				//把对当前事件添加的处理函数拿出来挨个执行
				this.eventMap[eventType][i](event);
			}
		}
	}
};

//简单的对象属性复制，把源对象上的属性复制到自己身上，只复制一层
Object.prototype.extend = function(base) {
	for (var key in base) {
		if (base.hasOwnProperty(key)) {
			this[key] = base[key];
		}
	}
	return this;
};

/**
 * 一个模仿.net中delegate的东西，主要是替换了事件主体
 * @param {Object} context 事件上下文，通常用以取代默认的发生事件的元素
 * @param {Function} fun 事件处理函数
 */
function Delegate(context, fun)
{
	var args = [].slice.call(arguments).slice(2);
	return function()
	{
		return fun.apply(context, [].slice.call(arguments).concat(args));
	};
}

function getOffset(elem) {
	var offset = null;
	if ( elem ) {
		offset = {left: 0, top: 0};
		do {
			offset.top += elem.offsetTop;
			offset.left += elem.offsetLeft;
			elem = elem.offsetParent;
		} while ( elem );
	}
	return offset;
}