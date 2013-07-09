'use strict';
(function() {

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
					matches++;
					if ( mode === MATCH_ANY || ( matches === list.length && ( mode === MATCH_SOME || matches === test.length ) ) ) {
						return true;
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
		this.filters = {},

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
		all: function(values, tokens) {
			return matcher(values, tokens, MATCH_ALL);
		},
		any: function(values, tokens) {
			return matcher(values, tokens, MATCH_ANY);
		},
		some: function(values, tokens) {
			return matcher(values, tokens, MATCH_SOME);
		}
	};
	Model.sorters = {
		number: function(a, b) {
			return a - b;
		},
		string: function(a, b) {
			return a.localeCompare(b);
		},
		array: function(a, b) {
			// Convert array to string before compare
			return (''+a).localeCompare(''+b);
		}
	};

	Model.prototype = {
		indexCreate: function(indexName, jsonPath, dataType, filterIndex) {
			this.index[indexName] = [];
			this._mappings[indexName] = {
				path: jsonPath,
				type: dataType,
				filterIndex: filterIndex || false
			};
			for (var key in this._data) {
				var value = explore(jsonPath, this._data[key]);
				// Cast type on indexed values
				switch ( dataType ) {
				case 'number':
					value = parseFloat( value );
					break;
				case 'string':
					value += '';
					break;
				}
				this.index[indexName].push(value);
			}
			if ( filterIndex ) {
				this.filterIndex(indexName, jsonPath);
			}
		},
		indexRebuild: function() {
			this._keys = {};
			this._index = [];

			for (var key in this._data) {
				key += '';
				this._keys[key] = this._index.length;
				this._index.push(key);
			}
			for ( var indexName in this.filters ) {
				this.filterIndex(indexName, this._mappings[indexName].path);
			}

		},
		sort: function() {
			var indexes = params(arguments);
			var sorters = {};
			var keys = this._keys;
			var cache = this.memory(indexes);


			if (cache) {
				this._index = cache;
			} else {

				for (var i = 0, j; undefined !== (j = indexes[i]); i++) {
					sorters[j] = {
						engine: Model.sorters[this._mappings[j].type],
						values: this.index[j]
					};
				}

				this._index.sort(function(a, b) {
					for ( var sorterName in sorters ) {
						var sorter = sorters[sorterName];
						var values = sorter.values;
						var diff = sorter.engine(values[keys[a]], values[keys[b]]);
						if (diff !== 0) {
							return diff;
						}
					}
					return 0;
				});
				this.memorize(indexes, this._index.slice());
			}
			return this;
		},


		filterIndex: function(name, jsonPath) {
			var index = this.filters[name] = {};
			for ( var key in this._data ) {
				var value = explore(jsonPath, this._data[key]);
				if ( value instanceof Array ) {
					for ( var i = 0, l = value.length; i < l; i++ ) {
						index[value[i]] = index[value[i]] || [];
						index[value[i]].push(key);
					}
				} else {
					index[value] = index[value] || [];
					index[value].push(key);
				}
			}
		},

		filter2: function(indexes) {
			var match = {};
			for ( var indexName in indexes ) {
				var search = params(indexes[indexName]);
				for ( var i = 0, j = search.length; i < j; i++ ) {
					var keys = this.filters[indexName][search[i]];
					if ( !keys ) {
						continue;
					}
					for ( var k = 0, l = keys.length; k < l; k++ ) {
						match[keys[k]] = true;
					}
				}
			}


			// Setup filters by using keys from _index array
			for ( var a = 0, key; undefined !== (key = this._index[a]); a++ ) {
				this._filters[this._keys[key]] = match[key] || false;
			}

			return this;
		},



		/**
		 * Do index based filtering
		 * @param {Object} indexes Object with indexes name as the keys and filters as a value.
		 * @returns {Model} Object instance
		 */
		filter: function(indexes) {

			var filtersIndexLength = this._filters.length,
				filtersRepository = Model.filters,
				filters, filter, index, i, j;

			// Reset filters
			while(filtersIndexLength--) {
				this._filters[filtersIndexLength] = true;
			}

			// Do filtering
			for ( index in indexes ) {

				filters = indexes[index];

				for ( filter in filters ) {
					if ( filter === 'not' ) {
						continue;
					}
					for ( i = 0, j; undefined !== (j = this.index[index][i]); i++ ) {
						if ( this._filters[i] ) {
							this._filters[i] = filtersRepository[filter](j, filters[filter]);
						}
					}
				}

				if ( filters.not ) {
					for ( filter in filters.not ) {
						for ( i = 0, j; undefined !== (j = this.index[index][i]); i++ ) {
							if ( this._filters[i] ) {
								this._filters[i] = !filtersRepository[filter](j, filters.not[filter]);
							}
						}
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
			var i, l, mapping, value;
			if ( key !== undefined ) {

				key += '';

				this.resetMemory();
				this._data[key] = data;
				this._keys[key] = this._index.length;
				this._index.push(key);
				this._filters.push(true);

				for (i in this.index) {
					if ( undefined !== ( mapping = this._mappings[i] ) ) {
						value = explore(mapping.path, data);
						this.index[i].push(value);
						if ( mapping.filterIndex ) {
							this.filters[i][value].push(key);
						}
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


}());
