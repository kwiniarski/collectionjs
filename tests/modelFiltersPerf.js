var Model = require('../src/model.js');
var data = require('./data/ipsum.js');

var test = new Model();
test.add(data.result);
test.indexCreate('friends', 'friends.*.name', 'array', true);
test.indexCreate('tags', 'tags', 'array', true);
test.indexCreate('company', 'company', 'string', true);

//			test.filter3({
//				friends: ['Autumn Ogden', 'Maya Haig'],
//				company: ['Textiqua','Steganoconiche','Titanirola'],
//				tags: ['dolorem','amet','ut','et']
//			});


// A test suite
module.exports = {
	name: 'Filter optimizations',
	tests: {
		'Filter': function() {
			test.filter({
				friends: {
					all: ['Autumn Ogden', 'Maya Haig']
				},
				company: {
					all: ['Textiqua','Steganoconiche','Titanirola']
				}
//				tags: {
//					all: ['dolore','amet','ut','et']
//				}
			});
		},

		'Filter 2': function() {
			test.all({
				friends: ['Autumn Ogden', 'Maya Haig'],
				company: ['Textiqua','Steganoconiche','Titanirola']
//				tags: ['dolore','amet','ut','et']
			});
		}

//		'Filter 3': function() {
//			test.filter3({
//				friends: ['Autumn Ogden', 'Maya Haig'],
//				company: ['Textiqua','Steganoconiche','Titanirola'],
//				tags: ['dolore','amet','ut','et']
//			});
//		}
	}
};

