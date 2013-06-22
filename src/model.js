'use strict';
(function(window) {

	// http://jsperf.com/test-for-number
//	var isNumber = /^\d*(\.\d+)?$/;

	function explore(path, object) {

		if (path.indexOf('.') === -1) {
			if (object[path] !== undefined) {
				return object[path];
			}
		} else {
			var pathJson = path.split('.');
			var key = pathJson.shift();
			if ( key === '*' ) {
				for ( var collection = [], i = 0, j = object.length; i < j; i++ ) {
					collection.push(explore(pathJson, object[i]));
				}
				return collection;
			} else if (object[key] !== undefined) {
				return explore(pathJson.join('.'), object[key]);
			}
		}

	}

	/**
	 * Creates array from object. All whihte space from the begining
	 * and the end of each parameter will be removed. If some parameter is
	 * a string containing comas, it will be converted to an array and merged
	 * with other parameters.
	 *
	 * @param {Array|String} args Arguments as an array or string.
	 * @returns {Array} Parsed list of arguments.
	 */
	function params(args) {
		var serialized = ( typeof args === 'string') ? args : Array.prototype.slice.call(args).toString();
		return serialized.length ? serialized.split(/\s*,\s*/g) : [];
	}

//	function sort(a, b) {
//		var diff = a - b;
//		if (diff !== 0) {
//			return (diff > 0) ? 1 : -1;
//		} else {
//			return 0;
//		}
//	}



//	function toArray(data) {
//		if (typeof data === 'string') {
//			return data.split();
//		}
//		return data;
//	}


	function Model() {
		var memory = {};
		this._data = {};
		this.index = {},

		/*
		 * Index mappings (index name to used JSON path).
		 * Required for index rebuilding.
		 * @type Object
		 */
		this._mappings = {};

		/**
		 * Primary index with keys.
		 * Only this index is modified while sorting.
		 * @type Array
		 */
		this._index = [];

		/**
		 * Primary index mappings (key to numeric index in _index).
		 * Used to get key position in _index.
		 * @type Array
		 */
		this._keys = {};
		this._filters = [];



		this.memorize = function(key, value) {
			memory[key] = value;
		};
		this.memory = function(key) {
			return memory[key] || false;
		};
		this.resetMemory = function() {
			memory = {};
		};
//		this.add(data);
	}
	Model.filters = {
		min: function(value, min) {
			return value > min;
		},
		max: function(value, max) {
			return value < max;
		},
		equals: function(value, token) {
			return value === token;
		},
		/**
		 * Checks if string or element of an array contains some string.
		 * @param {type} value
		 * @param {type} token
		 * @returns {Boolean}
		 */
		contains: function(value, token) {
			var list = params(value);
			var length = list.length;
			while ( length ) {
				if ( list[--length].indexOf(token) !== -1 ) {
					return true;
				}
			}
			return false;
		},
		/**
		 * Checks if string value or any element of an array matches at least one of provided tokens.
		 * @param {type} value
		 * @param {type} token
		 * @returns {Boolean}
		 */
		any: function(value, tokens) {
			var test = params(value);
			var list = params(tokens);
			for(var k = 0, l = test.length; k < l; k++) {
				for(var i = 0, j = list.length; i < j; i++) {
					if ( test[k] === list[i] ) {
						return true;
					}
				}
			}
			return false;
		},
		/**
		 * Checks if elements of an array match all of provided tokens. This is not deep equal, so
		 * not every element of the array has to have matching token. Examples:
		 *
		 * [A,B,C].all(C) => true
		 * [A,B,C].all(A,C) => true
		 * [A,B,C].all(D) => false
		 * [A,B,C].all(A,D) => false
		 *
		 * @param {type} value
		 * @param {type} tokens
		 * @returns {Boolean}
		 */
		all: function(value, tokens) {
			var test = params(value);
			var list = params(tokens);
			var matches = 0;
			for(var k = 0, l = test.length; k < l; k++) {
				for(var i = 0, j = list.length; i < j; i++) {
					if ( test[k] === list[i] ) {
						matches++;
					}
				}
			}
			return matches === list.length;
		}
	};
	Model.sorters = {
		number: function(a, b) {
			var diff = a - b;
			return ( diff !== 0 ) ? ( ( diff > 0 ) ? 1 : -1 ) : 0;
		},
		string: function(a, b) {
			return (''+a).localeCompare(''+b);
		},
		array: function(a, b) {
			return (''+a).localeCompare(''+b);
		}
	};

	Model.prototype = {
		indexCreate: function(indexName, jsonPath, dataType) {
			this.index[indexName] = [];
			this._mappings[indexName] = {
				path: jsonPath,
				type: dataType
			};
			for (var key in this._data) {
				this.index[indexName].push(explore(jsonPath, this._data[key]));
			}
		},
		indexRebuild: function() {
			this._keys = {};
			this._index = [];

			for (var key in this._data) {
				key = ''+key;
				this._keys[key] = this._index.length;
				this._index.push(key);
			}

		},
		sort: function() {
			var indexes = params(arguments);
			var index = this.memory(indexes);

			if (index) {
				this._index = index.slice();
			} else {
				var self = this;
				this._index.sort(function(a, b) {
					var aIndex = self._keys[a];
					var bIndex = self._keys[b];
					for (var d = 0, i = 0, j; undefined !== (j = indexes[i]); i++) {
						var value = self.index[j];
						var sorter = Model.sorters[(self._mappings[j] || {}).type || 'string'];
						d = sorter(value[aIndex], value[bIndex]);
						if (d !== 0) {
							return d;
						}
					}
					return d;
				});
				this.memorize(indexes, this._index.slice());
			}
			return this;
		},
		filter: function(options) {
			for (var k = 0, f; undefined !== (f = this._filters[k]); k++) {
				this._filters[k] = true;
			}
			for (var index in options) {
				var filters = options[index];
				for (var filter in filters) {
					for (var i = 0, j; undefined !== (j = this.index[index][i]); i++) {
						this._filters[i] = (this._filters[i] && Model.filters[filter](j, filters[filter]));
					}
				}
			}
			return this;
		},
		get: function() {
			var buffer = [];
			var properties = params(arguments);
			for (var i = 0, j; undefined !== (j = this._index[i]); i++) {
				if (this._filters[this._keys[j]]) {
					if ( properties.length > 1 ) {
						var props = [];
						for(var k = 0, l; undefined !== (l = properties[k]); k++) {

							props.push(explore(l, this._data[j]));
						}
						buffer.push(props);
					} else if ( properties.length === 1 ) {
						buffer.push(explore(properties[0], this._data[j]));
					} else {
						buffer.push(this._data[j]);
					}
				}
			}
			return buffer;
		},
		add: function(data, key) {
			var i, l;
			if ( key !== undefined ) {

				key = ''+ key;

				this.resetMemory();
				this._data[key] = data;
				this._keys[key] = this._index.length;
				this._index.push(key);
				this._filters.push(true);

				for (i in this.index) {
					if(this._mappings[i]) {
						this.index[i].push(explore(this._mappings[i].path, data));
					}
				}
			} else {
				if(data instanceof Array) {
					for (i = 0, l = data.length; i < l; i++) {
						this.add(data[i], this._index.length);
					}
				} else {
					for (i in data) {
						this.add(data[i], i);
					}
				}
			}
		},
		remove: function() {
			var index, keys = params(arguments);
			for ( var i = 0, id; undefined !== ( id = keys[i] ); i++ ) {
				if ( undefined !== ( index = this._keys[id] ) ) {
					delete this._data[id];
					delete this._keys[id];

					this._filters.splice(index, 1);
					for ( var name in this.index ) {
						this.index[name].splice(index, 1);
					}
				}
			}
			this.resetMemory();
			this.indexRebuild();
		}
	};


	if ( typeof module === 'object' && module && typeof module.exports === 'object' ) {
		module.exports = Model;
	} else {
		if ( define && typeof define === 'function' && define.amd ) {
			define('model', [], function() {
				return Model;
			});
		}
	}
	if ( typeof window === 'object' && typeof window.document === 'object' ) {
		window.Model = Model;
	}


}(window));
