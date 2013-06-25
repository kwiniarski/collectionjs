'use strict';
(function(window) {

	var

	MATCH_ANY = 1,
	MATCH_SOME = 2,
	MATCH_ALL = 3,

	slice = Array.prototype.slice,
	split = /\s*,\s*/g,

	explore = function(path, object, collection) {

		if (path.indexOf('.') === -1) {
			if (object[path] !== undefined) {
				return object[path];
			}
		} else {
			var pathJson = path.split('.');
			var key = pathJson.shift();
			if ( key === '*' ) {
				collection = collection || [];
				for ( var i = 0, j = object.length; i < j; i++ ) {
					var value = explore(pathJson.join('.'), object[i], collection);
					if ( typeof value === 'string' ) {
						collection.push(value);
					}
				}
				return collection;


			} else if (object[key] !== undefined) {
				return explore(pathJson.join('.'), object[key], collection);
			}

		}

	},

	/**
	 * Creates array from object. All whihte space from the begining
	 * and the end of each parameter will be removed. If some parameter is
	 * a string containing comas, it will be converted to an array and merged
	 * with other parameters.
	 *
	 * @param {Array|String} args Arguments as an array or string.
	 * @returns {Array} Parsed list of arguments.
	 */
	params = function(args) {
		var serialized = ( typeof args === 'string') ? args : (slice.call(args)).toString();
		return serialized.length ? serialized.split(split) : [];
	},

	equals = function(value, token) {
		return value === token;
	},

	compare = function(value, token) {
		if ( token instanceof RegExp ) {
			return token.test(value);
		} else {
			return value.indexOf(token) !== -1;
		}
	},

	matcher = function(values, tokens, mode, fn) {

		var

		matches = 0,
		test = params(values),
		list = params(tokens);

		fn = fn || equals;

		for ( var k = 0, l = test.length; k < l; k++ ) {
			for ( var i = 0, j = list.length; i < j; i++ ) {
				if ( fn(test[k], list[i]) ) {
					if ( mode === MATCH_ANY ) {
						return true;
					} else {
						matches++;
						if ( mode === MATCH_SOME && matches === list.length ) {
							return true;
						} else if ( mode === MATCH_ALL && ( matches === list.length && matches === test.length ) ) {
							return true;
						}
					}
				}
			}
		}
		return false;
	};

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

		contains: function(values, tokens) {
			return matcher(values, tokens, MATCH_ANY, compare);
		},

		has: {
			all: function(values, tokens) {
				return matcher(values, tokens, MATCH_ALL);
			},

			any: function(values, tokens) {
				return matcher(values, tokens, MATCH_ANY);
			},

			some: function(values, tokens) {
				return matcher(values, tokens, MATCH_SOME);
			}
		},

		not: {
			all: function(values, tokens) {
				return !matcher(values, tokens, MATCH_ALL);
			},

			any: function(values, tokens) {
				return !matcher(values, tokens, MATCH_ANY);
			},

			some: function(values, tokens) {
				return !matcher(values, tokens, MATCH_SOME);
			}
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
		filter: function(indexes) {
			// Reset filters
			for ( var k = 0, f; undefined !== (f = this._filters[k]); k++ ) {
				this._filters[k] = true;
			}
			// Do filtering
			for ( var index in indexes ) {

				var filters = indexes[index];
				var filtersRepository = Model.filters;

				if ( filters.has ) {
					filtersRepository = Model.filters.has;
					filters = filters.has;
				} else if ( filters.not ) {
					filtersRepository = Model.filters.not;
					filters = filters.not;
				}

				for ( var filter in filters ) {
					for ( var i = 0, j; undefined !== (j = this.index[index][i]); i++ ) {
						this._filters[i] = (this._filters[i] && filtersRepository[filter](j, filters[filter]));
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
