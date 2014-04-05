var Collection = require('../src/collection.js');
var data = require('../tests/fixtures/ipsum.js');

var test = new Collection();
test.add(data.result);
test.indexCreate('friends', 'friends.*.name', 'array', true);
test.indexCreate('tags', 'tags', 'array', true);
test.indexCreate('company', 'company', 'string', true);

// A test suite
module.exports = {
	name: 'Filter optimizations',
	tests: {
		'#filter method with all': function() {
			test.filter({
				friends: {
					all: ['Autumn Ogden', 'Maya Haig']
				},
				company: {
					all: ['Textiqua','Steganoconiche','Titanirola']
				}
			});
		},

		'#all method': function() {
			test.all({
				friends: ['Autumn Ogden', 'Maya Haig'],
				company: ['Textiqua','Steganoconiche','Titanirola']
			});
		}
	}
};

