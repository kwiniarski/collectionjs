

MATCH_ANY = 1,
MATCH_SOME = 2,
MATCH_ALL = 3,

test_values = [1,2,4,8,16,32,64,128,256,512,1024,2048,4096],
test_tokens = [4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64],

params = function(args) {
	var serialized = ( typeof args === 'string') ? args : Array.prototype.slice.call(args).toString();
	return serialized.length ? serialized.split(/\s*,\s*/g) : [];
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

count = function(object) {
	if ( object instanceof Array ) {
		return object.length;
	} else {
		return Object.keys(object).length;
	}
},

async = function async(object, iterator, callback) {
	if ( false === this instanceof async ) {
		return new async(array, iterator, callback);
	}

	var queue = count(object);

	this.parent = false;

	this.complete = false;

	this.done = function(){
		if ( --queue === 0 ) {
			this.complete = true;
			callback.call( this.parent );
		}
	};

	for ( var i in object ) {
		if ( object[i] instanceof async ) {
			object[i].parent = this;
			if ( object[i].complete ) {
				this.done();
			}
		}
		if ( iterator ) {
			iterator.call(this, object[i]);
		}
	}
},

matcher1 = function(values, tokens, mode, fn) {
	var test = params(values);
	var list = params(tokens);
	var matches = 0;
	fn = fn || equals;
	for(var k = 0, l = test.length; k < l; k++) {
		for(var i = 0, j = list.length; i < j; i++) {
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
},

matcher2 = function(values, tokens, mode, fn) {
	var

	matches = 0,
	test = params(values),
	list = params(tokens);

	fn = fn || equals;

	for(var k = 0, l = test.length; k < l; k++) {
		for(var i = 0, j = list.length; i < j; i++) {
			if ( fn(test[k], list[i]) ) {
				matches++;
				if ( mode === MATCH_ANY || ( matches === list.length && ( mode === MATCH_SOME || matches === test.length ) ) ) {
					return true;
				}
//				// MATCH_ANY
//				if ( mode === MATCH_ANY ) {
//					return true;
//				} else {
//					if ( ++matches === list.length ) {
//						// MATCH_SOME
//						if ( mode === MATCH_SOME ) {
//							return true;
//						// consider MATCH_ALL
//						} else if ( matches === test.length ) {
//							return true;
//						}
//					}
//				}
			}
		}
	}
	return false;
};

// A test suite
module.exports = {
	name: 'Matcher optimizations',
	tests: {
		'Matcher1': function() {
			matcher1(test_values, test_tokens, MATCH_ALL, equals);
			matcher1(test_values, test_tokens, MATCH_ANY, equals);
			matcher1(test_values, test_tokens, MATCH_SOME, equals);
		},

		'Matcher2': function() {
			matcher2(test_values, test_tokens, MATCH_ALL, equals);
			matcher2(test_values, test_tokens, MATCH_ANY, equals);
			matcher2(test_values, test_tokens, MATCH_SOME, equals);
		}
	}
};

