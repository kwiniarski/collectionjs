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

	matcher = function(values, tokens, mode, callback) {

		var

		matches = 0,
		test = params(values),
		list = params(tokens),

		fn = callback || equals;

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

	function Collection() {
		var memory = {};

		/**
		 * Storage object for all added records (items).
		 * @type Object
		 */
		this._data = {};

		/*
		 * Index mappings (index name to used JSON path).
		 * Required for index rebuilding.
		 * @type Object
		 */
		this._mappings = {};

		/**
		 * Keys index. It is used to keep order of items.
		 * Only this index is modified while sorting.
		 * @type Array
		 */
		this._index = [];

		/**
		 * Key mappings index (key to numeric index in _index).
		 * Used to get key position in _index.
		 * @type Object
		 */
		this._keys = {};

		/**
		 * Filtering index. Keeps information about filtering state of an item.
		 * This index is modified while filtering.
		 * @type Array
		 */
		this._filters = [];

		/**
		 * Object for storing indexes created by createIndex method.
		 * This simple index stores extracts of an collection item under item's
		 * index in _index array for faster access.
		 * @example {"myIndex": ["blue", "red"], "otherIndex": [[12, 16], [1, 23]]}
		 * @type Object
		 */
		this.index = {};

		/**
		 * Object for storing indexes created by createIndex method with
		 * filterIndex flag set to true.
		 * This object is used mainly by #any and #all methods to speed
		 * up filtering. It is not used with older #filter method.
		 * Created filter index consists of records, where key is unique value
		 * from collection item (extracted with path expression) and its value
		 * is an array of collection item keys.
		 * @example {"myIndex": {"someValue": ["1", "5"], "otherValue": ["1", "6", "8"]}}
		 * @type Object
		 */
		this.filters = {};


		this.memorize = function(key, value) {
			memory[key] = value;
		};
		this.memory = function(key) {
			return memory[key] || false;
		};
		this.resetMemory = function() {
			memory = {};
		};
	}
	Collection.filters = {
		min: function(value, min) {
			return value > min;
		},
		max: function(value, max) {
			return value < max;
		},
		contains: function(values, tokens) {
			return matcher(values, tokens, MATCH_ANY, compare);
		},
		/**
		 * Returns true when all tokens are contained in values and both are
		 * equal in length. This is different then equal, because order of items
		 * in tokens and values is not maintained.
		 * @param {type} values
		 * @param {type} tokens
		 * @returns {Boolean}
		 */
		all: function(values, tokens) {
			return matcher(values, tokens, MATCH_ALL);
		},
		/**
		 * Returns true when at least one token can be found in values.
		 * @param {type} values
		 * @param {type} tokens
		 * @returns {Boolean}
		 */
		any: function(values, tokens) {
			return matcher(values, tokens, MATCH_ANY);
		},
		/**
		 * Returns true when some tokens are contained in values and tokens
		 * do not contain any records that can not be found in values.
		 * @param {type} values
		 * @param {type} tokens
		 * @returns {Boolean}
		 */
		some: function(values, tokens) {
			return matcher(values, tokens, MATCH_SOME);
		},
		newAll: function(indexName, itemKey, searchTokens) {
			this.count[indexName][itemKey] = (this.count[indexName][itemKey] || 0) + 1;
			if (this.count[indexName][itemKey] === searchTokens.length) {
				this.match[itemKey] = (this.match[itemKey] || 0) + 1;
			}
//			return this;
		}
	};

	Collection.sorters = {
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

	Collection.prototype = {
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

				for (var i = 0, j = indexes.length; i < j; i++) {
					var k = indexes[i];
					sorters[k] = {
						engine: Collection.sorters[this._mappings[k].type],
						values: this.index[k]
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

		any: function(indexes) {
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
			for ( var a = 0, b = this._index.length; a < b; a++ ) {
				var key = this._index[a];
				this._filters[this._keys[key]] = match[key] || false;
			}

			return this;
		},

		all: function (indexes) {
			var match = {}, count = {},
				/**
				 * Number of items.
				 * @type Number
				 */
				filtersIndexLength = this._filters.length,
				/**
				 * Number of all indexes which are used for filtering. In the end, function checks if the item matches all
				 * indexes by checking number of successful matches with total number of indexes passed to the function.
				 * Only when they are equal item can be marked as valid.
				 * @type Number
				 */
				checksum = 0,
				indexName, searchTokens, searchValues, i, j, token, k, l, key, keys;

			for (indexName in indexes) {
				checksum++;
				count[indexName] = {};
				searchValues = this.filters[indexName];
				searchTokens = params(indexes[indexName]);
				for (i = 0, j = searchTokens.length; i < j; i++) {
					// get keys of items associated with search value
					token = searchTokens[i];
					keys = searchValues[token];
					if (keys) {
						// loop through item keys
						for (k = 0, l = keys.length; k < l; k++) {
							key = keys[k];
							count[indexName][key] = (count[indexName][key] || 0) + 1;
							if (count[indexName][key] === searchTokens.length) {
								match[key] = (match[key] || 0) + 1;
							}
						}
					}
				}
			}
			while (filtersIndexLength--) {
				this._filters[filtersIndexLength] = (match[this._index[filtersIndexLength]] === checksum);
			}
			return this;
		},

		/**
		 * Do index based filtering
		 * @param {Object} indexes Object with indexes name as the keys and filters as a value.
		 * @returns {Model} Object instance
		 */
		filter: function(indexes) {

			var filterIndex = this._filters,
				filtersIndexLength = filterIndex.length,
				filtersRepository = Collection.filters,
				filters, filter, indexName, index, i, j;

			// Reset filters
			while(filtersIndexLength--) {
				filterIndex[filtersIndexLength] = true;
			}

			// Do filtering
			for ( indexName in indexes ) {

				filters = indexes[indexName];
				index = this.index[indexName];

				for ( filter in filters ) {
					if ( filter === 'not' ) {
						continue;
					}
					for ( i = 0, j = index.length; i < j ; i++ ) {
						if ( !filterIndex[i] ) {
							continue;
						}
						filterIndex[i] = filtersRepository[filter](index[i], filters[filter]);
					}
				}

				if ( filters.not ) {
					for ( filter in filters.not ) {
						for ( i = 0, j = index.length; i < j ; i++ ) {
							if ( !filterIndex[i] ) {
								continue;
							}
							filterIndex[i] = !filtersRepository[filter](index[i], filters.not[filter]);
						}
					}
				}

			}

			return this;
		},


		/**
		 * Method to replace #filter. It is based on #any method.
		 * The goal is to keep #filter schema with #all performance.
		 * @param {type} indexes
		 * @param {type} mode
		 * @returns {_L2.Collection.prototype}
		 */
		filterWithIndex: function (args) {
			var ctx = { match: {}, count: {}, checksum: 0 },
				/**
				 * Number of items.
				 * @type Number
				 */
				totalItems = this._filters.length,
				/**
				 * Number of all indexes which are used for filtering. In the end, function checks if the item matches all
				 * indexes by checking number of successful matches with total number of indexes passed to the function.
				 * Only when they are equal item can be marked as valid.
				 * @type Number
				 */
//				checksum = 0,
				indexName, searchTokens, searchValues, i, j, token, k, l, itemKey, keys,
				filterName, filterFn;

			for (indexName in args) {
				ctx.checksum++;
				ctx.count[indexName] = {};
				// get values from filter index
				searchValues = this.filters[indexName];
				for (filterName in args[indexName]) {
					// get search tokens from provided arguments
					searchTokens = params(args[indexName][filterName]);
					filterFn = Collection.filters[filterName];
					for (i = 0, j = searchTokens.length; i < j ; i++) {
						// get keys of items associated with search value
//						token = searchTokens[i];
						keys = searchValues[searchTokens[i]];
						if (keys) {
							// loop through item keys
							for (k = 0, l = keys.length; k < l; k++) {
								filterFn.call(ctx, indexName, keys[k], searchTokens);
							}
						}
					}
				}
			}
			while (totalItems--) {
				this._filters[totalItems] = (ctx.match[this._index[totalItems]] === ctx.checksum);
			}
			return this;
		},

		get: function() {
			var buffer = [];
			var properties = params(arguments);
			var totalItems = this._index.length;
			for (var i = 0; i < totalItems; i++) {
				var index = this._index[i];
				if (this._filters[this._keys[index]]) {
					if ( properties.length > 1 ) {
						var props = [];
						for(var k = 0, l = properties.length; k < l ; k++) {
							props.push(explore(properties[k], this._data[index]));
						}
						buffer.push(props);
					} else if ( properties.length === 1 ) {
						buffer.push(explore(properties[0], this._data[index]));
					} else {
						buffer.push(this._data[index]);
					}
				}
			}
			return buffer;
		},
		add: function(data, key) {
			var i, l, mapping, value;
			if ( typeof key !== 'undefined' ) {

				key += '';

				this.resetMemory();
				this._data[key] = data;
				this._keys[key] = this._index.length;
				this._index.push(key);
				this._filters.push(true);

				for (i in this.index) {
					mapping = this._mappings[i];
					if (typeof mapping !== 'undefined') {
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
			var key, index, keys = params(arguments);
			for ( var i = 0, j = keys.length; i < j; i++ ) {
				key = keys[i];
				index = this._keys[key];
				if (typeof index !== 'undefined') {
					delete this._data[key];
					delete this._keys[key];

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
		module.exports = Collection;
	} else {
		if ( define && typeof define === 'function' && define.amd ) {
			define('collection', [], function() {
				return Collection;
			});
		}
	}
	if ( typeof window === 'object' && typeof window.document === 'object' ) {
		window.Collection = Collection;
	}


}());
