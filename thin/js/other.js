
/**
 * helper functions
 */
thin.module("Helper", [], function() {
	function isUndefined(value) {
		return typeof value == 'undefined';
	}

	function isDefined(value) {
		return typeof value != 'undefined';
	}

	function isBoolean(value) {
		return typeof value == 'boolean';
	}

	function isObject(value) {
		return value != null && typeof value == 'object';
	}

	function isString(value) {
		return typeof value == 'string';
	}

	function isNumber(value) {
		return typeof value == 'number';
	}

	function isDate(value) {
		return "".toString.apply(value) == '[object Date]';
	}

	function isArray(value) {
		return "".apply(value) == '[object Array]';
	}

	function isFunction(value) {
		return typeof value == 'function';
	}

	function isArrayLike(obj) {
		if (!obj || (typeof obj.length !== 'number')) return false;

		// We have on object which has length property. Should we treat it as array?
		if (typeof obj.hasOwnProperty != 'function' &&
			typeof obj.constructor != 'function') {
			// This is here for IE8: it is a bogus object treat it as array;
			return true;
		} else {
			return obj instanceof JQLite ||                      // JQLite
				(jQuery && obj instanceof jQuery) ||          // jQuery
				toString.call(obj) !== '[object Object]' ||   // some browser native object
				typeof obj.callee === 'function';              // arguments (on IE8 looks like regular obj)
		}
	}

	function trim(value) {
		return isString(value) ? value.replace(/^\s*/, '').replace(/\s*$/, '') : value;
	}

	function forEach(obj, iterator, context) {
		var key;
		if (obj) {
			if (isFunction(obj)) {
				for (key in obj) {
					if (key != 'prototype' && key != 'length' && key != 'name' && obj.hasOwnProperty(key)) {
						iterator.call(context, obj[key], key);
					}
				}
			} else if (obj.forEach && obj.forEach !== forEach) {
				obj.forEach(iterator, context);
			} else if (isArrayLike(obj)) {
				for (key = 0; key < obj.length; key++)
					iterator.call(context, obj[key], key);
			} else {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						iterator.call(context, obj[key], key);
					}
				}
			}
		}
		return obj;
	}

	function copy(source, destination) {
		if (isWindow(source) || isScope(source)) {
			throw ngError(43, "Can't copy! Making copies of Window or Scope instances is not supported.");
		}

		if (!destination) {
			destination = source;
			if (source) {
				if (isArray(source)) {
					destination = copy(source, []);
				} else if (isDate(source)) {
					destination = new Date(source.getTime());
				} else if (isObject(source)) {
					destination = copy(source, {});
				}
			}
		} else {
			if (source === destination) throw ngError(44, "Can't copy! Source and destination are identical.");
			if (isArray(source)) {
				destination.length = 0;
				for (var i = 0; i < source.length; i++) {
					destination.push(copy(source[i]));
				}
			} else {
				var h = destination.$$hashKey;
				forEach(destination, function (value, key) {
					delete destination[key];
				});
				for (var key in source) {
					destination[key] = copy(source[key]);
				}
				setHashKey(destination, h);
			}
		}
		return destination;
	}

	function equals(o1, o2) {
		if (o1 === o2) return true;
		if (o1 === null || o2 === null) return false;
		if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
		var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
		if (t1 == t2) {
			if (t1 == 'object') {
				if (isArray(o1)) {
					if ((length = o1.length) == o2.length) {
						for (key = 0; key < length; key++) {
							if (!equals(o1[key], o2[key])) return false;
						}
						return true;
					}
				} else if (isDate(o1)) {
					return isDate(o2) && o1.getTime() == o2.getTime();
				} else {
					if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2)) return false;
					keySet = {};
					for (key in o1) {
						if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
						if (!equals(o1[key], o2[key])) return false;
						keySet[key] = true;
					}
					for (key in o2) {
						if (!keySet[key] &&
							key.charAt(0) !== '$' &&
							o2[key] !== undefined && !isFunction(o2[key])) return false;
					}
					return true;
				}
			}
		}
		return false;
	}

	function shallowCopy(src, dst) {
		dst = dst || {};

		for (var key in src) {
			if (src.hasOwnProperty(key) && key.substr(0, 2) !== '$$') {
				dst[key] = src[key];
			}
		}

		return dst;
	}




	/**
	 * 一个模仿.net中delegate的东西，主要是替换了事件主体
	 * @param {Object} context 事件上下文，通常用以取代默认的发生事件的元素
	 * @param {Function} fun 事件处理函数
	 */
	function Delegate(context, fun) {
		var args = [].slice.call(arguments).slice(2);
		return function () {
			return fun.apply(context, [].slice.call(arguments).concat(args));
		};
	}
});


thin.module("Logger", [], function() {

});

thin.module("AJAX", [], function() {

});

/**
 * Promise
 */
thin.module("Promise", [], function() {

	var defer = function () {
		var pending = [];
		var value;

		var deferred = {
			resolve: function (val) {
				if (pending) {
					var callbacks = pending;
					pending = undefined;
					value = ref(val);

					if (callbacks.length) {
						callLater(function () {
							var callback;
							for (var i = 0, ii = callbacks.length; i < ii; i++) {
								callback = callbacks[i];
								value.then(callback[0], callback[1]);
							}
						});
					}
				}
			},

			reject: function (reason) {
				deferred.resolve(reject(reason));
			},

			promise: {
				then: function (callback, errback) {
					var result = defer();

					var wrappedCallback = function (value) {
						try {
							result.resolve((callback || defaultCallback)(value));
						} catch (e) {
							exceptionHandler(e);
							result.reject(e);
						}
					};

					var wrappedErrback = function (reason) {
						try {
							result.resolve((errback || defaultErrback)(reason));
						} catch (e) {
							exceptionHandler(e);
							result.reject(e);
						}
					};

					if (pending) {
						pending.push([wrappedCallback, wrappedErrback]);
					} else {
						value.then(wrappedCallback, wrappedErrback);
					}

					return result.promise;
				},

				always: function (callback) {
					function makePromise(value, resolved) {
						var result = defer();
						if (resolved) {
							result.resolve(value);
						} else {
							result.reject(value);
						}
						return result.promise;
					}

					function handleCallback(value, isResolved) {
						var callbackOutput = null;
						try {
							callbackOutput = (callback || defaultCallback)();
						} catch (e) {
							return makePromise(e, false);
						}
						if (callbackOutput && callbackOutput.then) {
							return callbackOutput.then(function () {
								return makePromise(value, isResolved);
							}, function (error) {
								return makePromise(error, false);
							});
						} else {
							return makePromise(value, isResolved);
						}
					}

					return this.then(function (value) {
						return handleCallback(value, true);
					}, function (error) {
						return handleCallback(error, false);
					});
				}
			}
		};

		return deferred;
	};

	var ref = function (value) {
		if (value && value.then) return value;
		return {
			then: function (callback) {
				var result = defer();
				nextTick(function () {
					result.resolve(callback(value));
				});
				return result.promise;
			}
		};
	};

	var reject = function (reason) {
		return {
			then: function (callback, errback) {
				var result = defer();
				nextTick(function () {
					result.resolve((errback || defaultErrback)(reason));
				});
				return result.promise;
			}
		};
	};

	var when = function (value, callback, errback) {
		var result = defer(),
			done;

		var wrappedCallback = function (value) {
			try {
				return (callback || defaultCallback)(value);
			} catch (e) {
				exceptionHandler(e);
				return reject(e);
			}
		};

		var wrappedErrback = function (reason) {
			try {
				return (errback || defaultErrback)(reason);
			} catch (e) {
				exceptionHandler(e);
				return reject(e);
			}
		};

		callLater(function () {
			ref(value).then(function (value) {
				if (done) return;
				done = true;
				result.resolve(ref(value).then(wrappedCallback, wrappedErrback));
			}, function (reason) {
				if (done) return;
				done = true;
				result.resolve(wrappedErrback(reason));
			});
		});

		return result.promise;
	};

	function defaultCallback(value) {
		return value;
	}

	function defaultErrback(reason) {
		return reject(reason);
	}

	function all(promises) {
		var deferred = defer(),
			counter = 0,
			results = isArray(promises) ? [] : {};

		forEach(promises, function (promise, key) {
			counter++;
			ref(promise).then(function (value) {
				if (results.hasOwnProperty(key)) return;
				results[key] = value;
				if (!(--counter)) deferred.resolve(results);
			}, function (reason) {
				if (results.hasOwnProperty(key)) return;
				deferred.reject(reason);
			});
		});

		if (counter === 0) {
			deferred.resolve(results);
		}

		return deferred.promise;
	}

});
