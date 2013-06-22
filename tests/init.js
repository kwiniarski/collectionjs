/* jshint -W106 */
/* Disable W106: Identifier '__karma__' is not in camel case. */

'use strict';

var tests = Object.keys(window.__karma__.files).filter(function(file){
	return (/Spec\.js$/).test(file);
});

//tests.push('/base/tests/ipsum.js');
//console.log(tests);

requirejs.config({
	// Karma serves files from '/base'
	baseUrl: '/base/src',

//	paths: {
//		'ipsum': '/base/tests/ipsum.js'
//	},

//    paths: {
//        'jquery': '../lib/jquery',
//        'underscore': '../lib/underscore',
//    },
//
//    shim: {
//        'underscore': {
//            exports: '_'
//        }
//    },

    // ask Require.js to load these files (all our tests)
	deps: tests,

    // start test run, once Require.js is done
	callback: window.__karma__.start
});

//
////console.clear();
///*var d = {
// a: {price:10,currency:'PLN',ratio:1.23,params:{group:2}},
// b: {price:11,currency:'USD',ratio:3.23,params:{group:2}},
// c: {price:8,currency:'USD',ratio:3.23,params:{group:1}},
// d: {price:26,currency:'PLN',ratio:1.23,params:{group:1}},
// e: {price:4,currency:'PLN',ratio:1.23,params:{group:1}},
// f: {price:125,currency:'RON',ratio:0.25,params:{group:0}},
// };*/
///*var d = [
// {price:10,currency:'PLN',ratio:1.23,params:{group:2}},
// {price:11,currency:'USD',ratio:3.23,params:{group:2}},
// {price:8,currency:'USD',ratio:3.23,params:{group:1}},
// {price:26,currency:'PLN',ratio:1.23,params:{group:1}},
// {price:4,currency:'PLN',ratio:1.23,params:{group:1}},
// {price:125,currency:'RON',ratio:0.25,params:{group:0}},
// ];*/
//var d = {
//	1: {
//		price: 10,
//		currency: 'PLN',
//		ratio:1.23,
//		params: {group:2}
//	},
//	2: {
//		price:11,
//		currency: 'USD',
//		ratio:3.23,
//		params: {group:2}
//	},
//	3: {price:8,
//		currency: 'USD',
//		ratio:3.23,
//		params: {group:1}
//	},
//	4: {
//		price:26,
//		currency: 'PLN',
//		ratio:1.23,
//		params: {group:1}
//	},
//	5: {
//		price:4,
//		currency: 'PLN',
//		ratio:1.23,
//		params: {group:1}
//	},
//	6: {
//		price:125,
//		currency: 'RON',
//		ratio:0.25,
//		params: {group:0}
//	}
//};
//var m = new Model(d);
//m.indexCreate('price', 'price');
//m.indexCreate('group', 'params.group');
////console.log(m.index.groupPrice);
//m.sort(['group', 'price']);
//console.log(m._index);
//m.sort(['price']);
//console.log(m._index);
//m.remove('2');
//m.sort(['group']);
//console.log(m._index);
//m.add({
//	price: 80,
//	currency: 'RON',
//	ratio: 0.25,
//	params: {group:4}
//}, 'g');
//m.sort(['group', 'price']);
//console.log(m._index);
//m.sort(['price']);
//console.log(m._index);
//m.filter({
//	price: {
//		min:10,
//		max:100
//	},
//	group: {
//		contains: 'aaa',
//		equals:['22', '23'], // 22 and 23
//		equalsOr:['22', '23'] // 22 or 23
//	}
//});
////console.log(m._filters);
//var data = m.get();
//for (var i in data) {
//	console.log(i, data[i].price);
//}
