/* globals Model */
/* globals params */
/* jshint strict: false */
var

count = function(object) {
	if ( object instanceof Array ) {
		return object.length;
	} else {
		return Object.keys(object).length;
	}
},

async = function Async(object, iterator, callback, ctx) {
	if ( false === this instanceof Async ) {
		return new Async(object, iterator, callback, ctx);
	}

	var queue = count(object),
		self = this;


	this.parent = false;

	this.complete = false;

	this.done = function(){
		if ( --queue === 0 ) {
			this.complete = true;
			if ( typeof callback === 'function' ) {
				callback.call( this.parent, ctx );
			}
		}
	};

	function step(item, i, ctx) {
		setTimeout(function(){
			if ( item instanceof Async ) {
				item.parent = self;
				if ( item.complete ) {
					self.done();
				}
			}
			if ( iterator ) {
				iterator.call(self, item, i, ctx);
			}
		}, 0);

	}

	ctx = ctx || object;

	for ( var i in object ) {
		step(object[i], i, ctx);
	}
};

Model.prototype.filter3 = function(indexes) {

	this.af = async(indexes, function(value, indexName, ctx){
		var search = params(value);
		for ( var i = 0, j = search.length; i < j; i++ ) {
			var keys = ctx.self.filters[indexName][search[i]];
			if ( !keys ) {
				continue;
			}
			for ( var k = 0, l = keys.length; k < l; k++ ) {
				ctx.match[keys[k]] = true;
			}
		}
		this.done();
	}, function(ctx){
		// Setup filters by using keys from _index array
		for ( var a = 0, key; undefined !== (key = ctx.self._index[a]); a++ ) {
			ctx.self._filters[ctx.self._keys[key]] = ctx.match[key] || false;
		}
//				this.done();
	}, {
		self: this,
		match: {}
	});

	return this;
};

Model.prototype.data = function(callback, params) {
	var self = this;
	async([this.af], false, function(){
		callback(self.get(params));
	});
};