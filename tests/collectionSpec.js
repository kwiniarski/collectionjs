'use strict';
define(['collection','fixtures/ipsum'], function(Collection, ipsum) {

    describe('Model working on array', function() {

		var items;

		beforeEach(function(){
			items = new Collection();
			items.add(ipsum.result);
		});

		afterEach(function(){
			items = null;
		});

        it('can add and remove items', function() {
			var total = ipsum.total;

			expect(items.get().length).toEqual(total);
			expect(items._index).toEqual(['0','1','2','3','4']);

			items.add(ipsum.result);
			total = total * 2;

			expect(items.get().length).toEqual(total);
			expect(items._index).toEqual(['0','1','2','3','4','5','6','7','8','9']);

			items.remove('5');
			total = total - 1;

			expect(items.get().length).toEqual(total);
			expect(items._index).toEqual(['0','1','2','3','4','6','7','8','9']);

			// Remove 4 items, where only 2 realy exist
			items.remove(['4','5','6','11']);
			total = total - 2;

			expect(items.get().length).toEqual(total);
			expect(items._index).toEqual(['0','1','2','3','7','8','9']);

			// Remove using separate argument for each element
			items.remove('0', '2', '8');
			total = total - 3;

			expect(items.get().length).toEqual(total);
			expect(items._index).toEqual(['1','3','7','9']);

			// Remove using single string argument with coma separated IDs
			items.remove('1, 7, 9');
			total = total - 3;

			expect(items.get().length).toEqual(total);
			expect(items._index).toEqual(['3']);

        });


        it('can create indexes', function() {
			var total = ipsum.total;

			items.indexCreate('age','age','number');
			items.indexCreate('friend','friends.0.name','string');
			items.indexCreate('friends','friends.*.name','array');

			expect(items.index.friends.length).toEqual(total);
			expect(items.index.friend.length).toEqual(total);
			expect(items.index.age.length).toEqual(total);
			expect(items.index.friends).toEqual([
				['Bailey Galbraith','Maya Haig','Madelyn Walkman'],
				['Sophie Oldridge','Madison Nash','Brooke Ogden'],
				['Sophia Hodges','Chloe Goodman','Sophia Gustman'],
				['Autumn Ogden','Katherine Watson','Ella Goldman'],
				['Mariah Sheldon','Autumn Ogden','Kaitlyn Warren']
			]);
			expect(items.index.friend).toEqual([
				'Bailey Galbraith',
				'Sophie Oldridge',
				'Sophia Hodges',
				'Autumn Ogden',
				'Mariah Sheldon'
			]);
			expect(items.index.age).toEqual([
				30, 25, 35, 35, 39
			]);

			items.add(ipsum.result);
			total = total * 2;

			expect(items.index.friends.length).toEqual(total);
			expect(items.index.friend.length).toEqual(total);
			expect(items.index.age.length).toEqual(total);
			expect(items.index.friends).toEqual([
				['Bailey Galbraith','Maya Haig','Madelyn Walkman'],
				['Sophie Oldridge','Madison Nash','Brooke Ogden'],
				['Sophia Hodges','Chloe Goodman','Sophia Gustman'],
				['Autumn Ogden','Katherine Watson','Ella Goldman'],
				['Mariah Sheldon','Autumn Ogden','Kaitlyn Warren'],
				['Bailey Galbraith','Maya Haig','Madelyn Walkman'],
				['Sophie Oldridge','Madison Nash','Brooke Ogden'],
				['Sophia Hodges','Chloe Goodman','Sophia Gustman'],
				['Autumn Ogden','Katherine Watson','Ella Goldman'],
				['Mariah Sheldon','Autumn Ogden','Kaitlyn Warren']
			]);
			expect(items.index.friend).toEqual([
				'Bailey Galbraith',
				'Sophie Oldridge',
				'Sophia Hodges',
				'Autumn Ogden',
				'Mariah Sheldon',
				'Bailey Galbraith',
				'Sophie Oldridge',
				'Sophia Hodges',
				'Autumn Ogden',
				'Mariah Sheldon'
			]);
			expect(items.index.age).toEqual([
				30, 25, 35, 35, 39,
				30, 25, 35, 35, 39
			]);

			items.remove('5');
			total = total - 1;

			expect(items.index.friends.length).toEqual(total);
			expect(items.index.friend.length).toEqual(total);
			expect(items.index.age.length).toEqual(total);
			expect(items.index.friends).toEqual([
				['Bailey Galbraith','Maya Haig','Madelyn Walkman'],
				['Sophie Oldridge','Madison Nash','Brooke Ogden'],
				['Sophia Hodges','Chloe Goodman','Sophia Gustman'],
				['Autumn Ogden','Katherine Watson','Ella Goldman'],
				['Mariah Sheldon','Autumn Ogden','Kaitlyn Warren'],
				['Sophie Oldridge','Madison Nash','Brooke Ogden'],
				['Sophia Hodges','Chloe Goodman','Sophia Gustman'],
				['Autumn Ogden','Katherine Watson','Ella Goldman'],
				['Mariah Sheldon','Autumn Ogden','Kaitlyn Warren']
			]);
			expect(items.index.friend).toEqual([
				'Bailey Galbraith',
				'Sophie Oldridge',
				'Sophia Hodges',
				'Autumn Ogden',
				'Mariah Sheldon',
				'Sophie Oldridge',
				'Sophia Hodges',
				'Autumn Ogden',
				'Mariah Sheldon'
			]);
			expect(items.index.age).toEqual([
				30, 25, 35, 35, 39,
				25, 35, 35, 39
			]);
        });

		it('can sort records', function() {

			// Create index on age & sort using it
			items.indexCreate('age','age','number');
			items.sort('age');

			expect(items.get('age')).toEqual([
				25, 30, 35, 35, 39
			]);

			// Add some more items to the model ...
			items.add(ipsum.result);

			expect(items.get('age')).toEqual([
				25, 30, 35, 35, 39,
				30, 25, 35, 35, 39
			]);

			// ... and sort them
			items.sort(['age']);

			expect(items.get('age')).toEqual([
				25, 25, 30, 30, 35,
				35, 35, 35, 39, 39
			]);

			// Create second index and sort using two indexes at once
			items.indexCreate('gender','gender','string');
			items.sort(['gender', 'age']);

			expect(items.get(['gender', 'age'])).toEqual([
				[ 'female', 35 ],
				[ 'female', 35 ],
				[ 'female', 35 ],
				[ 'female', 35 ],
				[ 'male', 25 ],
				[ 'male', 25 ],
				[ 'male', 30 ],
				[ 'male', 30 ],
				[ 'male', 39 ],
				[ 'male', 39 ]
			]);

			items.sort('age', 'gender');
			items.sort('age', 'gender'); // Sort 2x (second should be from cache)

			expect(items.get(['age', 'gender'])).toEqual([
				[ 25, 'male' ],
				[ 25, 'male' ],
				[ 30, 'male' ],
				[ 30, 'male' ],
				[ 35, 'female' ],
				[ 35, 'female' ],
				[ 35, 'female' ],
				[ 35, 'female' ],
				[ 39, 'male' ],
				[ 39, 'male' ]
			]);
		});

		it('can filter records using max and min', function() {

			var res;

			function filter(filters) {
				return items.filter(filters).sort(['age']).get('age');
			}

			// Create index on age
			items.indexCreate('age','age','number');

			res = filter({ age: { max: 31 } });
			expect(res.length).toEqual(2);
			expect(res).toEqual([25, 30]);

			res = filter({ age: { max: 30 } });
			expect(res.length).toEqual(1);
			expect(res).toEqual([25]);

			res = filter({ age: { min: 34 } });
			expect(res.length).toEqual(3);
			expect(res).toEqual([35,35,39]);

			res = filter({ age: { min: 35 } });
			expect(res.length).toEqual(1);
			expect(res).toEqual([39]);

			res = filter({ age: { min: 29, max: 36 } });
			expect(res.length).toEqual(3);
			expect(res).toEqual([30,35,35]);

		});

		it('can filter records using all', function() {

			// Quick tests
			expect(Collection.filters.all([1,2,3],[1,2,3])).toBeTruthy();
			expect(Collection.filters.all([1,2,3],[1,2,3,4])).toBeFalsy();
			expect(Collection.filters.all([1,2,3],[1,2])).toBeFalsy();

			var res;

			// Create index on age
			items.indexCreate('name','name','string', true);
			items.indexCreate('friends','friends.*.name','array', true);

			res = items
				.filterWithIndex({ friends: { newAll: ['Sophie Oldridge', 'Madison Nash', 'Brooke Ogden'] } })
				.sort('name')
				.get('name');

			expect(res.length).toEqual(1);
			expect(res).toEqual(['Gabriella Day']);


		});

		it('can filter records using any', function() {

			// Quick tests
			expect(Collection.filters.any([1,2,3],[1,2,3])).toBeTruthy();
			expect(Collection.filters.any([1,2,3],[1,2,3,4])).toBeTruthy();
			expect(Collection.filters.any([1,2,3],[1,2])).toBeTruthy();
			expect(Collection.filters.any([1,2,3],[4,5,6])).toBeFalsy();
			expect(Collection.filters.any([1,2,3],[3,4,5,6])).toBeTruthy();

			var res;
			/**
			 * Alexa Young, Chloe Daniels, Julia Hoggarth are names and
			 * Autumn Ogden, Madison Nash are name of the friends. Autumn Ogden is a frient of 2 persons.
			 */
			var names  = ['Chloe Daniels', 'Autumn Ogden', 'Madison Nash', 'Julia Hoggarth', 'Alexa Young'];

			// Create index on age
			items.indexCreate('name','name','string');
			items.indexCreate('friends','friends.*.name','array');

			res = items
				.filter({ name: { any: names } })
				.sort('name')
				.get('name');

			expect(res.length).toEqual(3);
			expect(res).toEqual(['Alexa Young', 'Chloe Daniels', 'Julia Hoggarth']);


			res = items
				.filter({ friends: { any: names } })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(3);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Alexa Young', ['Mariah Sheldon', 'Autumn Ogden', 'Kaitlyn Warren']],
				['Gabriella Day', ['Sophie Oldridge', 'Madison Nash', 'Brooke Ogden']]
			]);

			// Find all people who who has Autumn Ogden as a friend
			res = items
				.filter({ friends: { any: 'Autumn Ogden' } })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(2);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Alexa Young', ['Mariah Sheldon', 'Autumn Ogden', 'Kaitlyn Warren']]
			]);


			// Find all people who who has Autumn Ogden OR Ella Goldman as a friend
			res = items
				.filter({ friends: { any: ['Autumn Ogden', 'Ella Goldman'] } })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(2);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Alexa Young', ['Mariah Sheldon', 'Autumn Ogden', 'Kaitlyn Warren']]
			]);


			// Find all people who who has Autumn Ogden OR Ella Goldman OR Kaitlyn Warren as a friend
			res = items
				.filter({ friends: { any: ['Autumn Ogden', 'Ella Goldman', 'Kaitlyn Warren'] } })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(2);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Alexa Young', ['Mariah Sheldon', 'Autumn Ogden', 'Kaitlyn Warren']]
			]);


		});

		it('can filter records using filter2 (any)', function() {

			items.indexCreate('friends','friends.*.name','array', true);
			// Find all people who who has Autumn Ogden OR Ella Goldman OR Kaitlyn Warren as a friend
			var res = items
				.any({ friends: ['Autumn Ogden', 'Ella Goldman', 'Kaitlyn Warren'] })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(2);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Alexa Young', ['Mariah Sheldon', 'Autumn Ogden', 'Kaitlyn Warren']]
			]);
		});

		it('can filter records using filter2 (all)', function() {

			var res;

			items.indexCreate('friends','friends.*.name','array', true);
			items.indexCreate('company','company','string', true);
			// Find all people who who has Autumn Ogden OR Ella Goldman OR Kaitlyn Warren as a friend
			res = items
				.all({
					friends: ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman'],
					company: 'Steganoconiche'
				})
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(1);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']]
			]);

			res = items
				.all({
					friends: ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman'],
					company: 'Titanirola'
				})
				.get();

			expect(res.length).toEqual(0);
		});

		it('can filter records using some', function() {

			var res;

			// Quick tests
			expect(Collection.filters.some([1,2,3],[1,2,3])).toBeTruthy();
			expect(Collection.filters.some([1,2,3],[1,2,3,4])).toBeFalsy();
			expect(Collection.filters.some([1,2,3],[1,2])).toBeTruthy();
			expect(Collection.filters.some([1,2,3],[4,5,6])).toBeFalsy();
			expect(Collection.filters.some([1,2,3],[3,4,5,6])).toBeFalsy();

			// Test on object
			items.indexCreate('friends','friends.*.name','array');

			// Find all people who who has Autumn Ogden as a friend
			// NOTE: for single element it would be better to use equals
			res = items
				.filter({ friends: { some: 'Autumn Ogden' } })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(2);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Alexa Young', ['Mariah Sheldon', 'Autumn Ogden', 'Kaitlyn Warren']]
			]);

			// Find all people who who has Autumn Ogden AND Ella Goldman as a friend
			res = items
				.filter({ friends: { some: ['Autumn Ogden', 'Ella Goldman'] } })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(1);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']]
			]);

			// Find all people who who has Autumn Ogden AND Ella Goldman AND Kaitlyn Warren as a friend
			res = items
				.filter({ friends: { some: ['Autumn Ogden', 'Ella Goldman', 'Kaitlyn Warren'] } })
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(0);
			expect(res).toEqual([]);

		});

		it('can filter records using contains', function() {

			var res;

			items.indexCreate('friends','friends.*.name','array');
			items.indexCreate('address','address','string');
			items.indexCreate('name','name','string');

			res = items.filter({
				friends: { contains: 'Ogden' }
			})
			.sort('friends')
			.get('name', 'friends.*.name');

			expect(res.length).toEqual(3);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Alexa Young', ['Mariah Sheldon', 'Autumn Ogden', 'Kaitlyn Warren']],
				['Gabriella Day', ['Sophie Oldridge', 'Madison Nash', 'Brooke Ogden']]
			]);


			res = items.filter({
				address: { contains: 'Streets' }
			})
			.sort('name')
			.get('name', 'address');

			expect(res.length).toEqual(3);
			expect(res).toEqual([
				['Alexa Young', '31053, Gilbert, Horatio Streets'],
				['Gabriella Day', '29024, Boise, Kenmare Streets'],
				['Isabella Vance', '14727, Aurora, Kenmare Streets']
			]);

		});

		it('can filter records using has & not together', function() {

			var res;

			items.indexCreate('friends','friends.*.name','array');

			// Find all people who who has Autumn Ogden as a friend
			res = items
				.filter({
					friends: {
						any: ['Autumn Ogden', 'Brooke Ogden'],
						not: {
							any: 'Kaitlyn Warren'
						}
					}
				})
				.sort('friends')
				.get('name', 'friends.*.name');

			expect(res.length).toEqual(2);
			expect(res).toEqual([
				['Julia Hoggarth', ['Autumn Ogden', 'Katherine Watson', 'Ella Goldman']],
				['Gabriella Day', ['Sophie Oldridge', 'Madison Nash', 'Brooke Ogden']]
			]);


		});

		it('can create special filter index', function() {

			items.indexCreate('company', 'company', 'string', true);

			items.add(ipsum.result);
			items.indexCreate('friends', 'friends.*.name', 'array', true);

			expect(items.filters.friends).toEqual({
				'Bailey Galbraith': ['0','5'],
				'Maya Haig': ['0','5'],
				'Madelyn Walkman': ['0','5'],
				'Sophie Oldridge': ['1','6'],
				'Madison Nash': ['1','6'],
				'Brooke Ogden': ['1','6'],
				'Sophia Hodges': ['2','7'],
				'Chloe Goodman': ['2','7'],
				'Sophia Gustman': ['2','7'],
				'Autumn Ogden': ['3', '4', '8', '9'],
				'Katherine Watson': ['3', '8'],
				'Ella Goldman': ['3', '8'],
				'Mariah Sheldon': ['4', '9'],
				'Kaitlyn Warren': ['4', '9']
			});

			items.remove('8'); // Julia Hogart

			expect(items.filters.company).toEqual({
				'Aprama': ['0', '5'],
				'Textiqua': ['1', '2', '6', '7'],
				'Steganoconiche': ['3'],
				'Titanirola': ['4', '9']
			});


		});

    });
});
