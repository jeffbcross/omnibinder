beforeEach(module('todo'));

describe('App', function() {
	var scope;

  beforeEach(module('mocks.Item'));

	beforeEach(inject(function($controller, $rootScope) {
    // store reference to scope, so that we can access it from the specs
    scope = $rootScope.$new();

    // instantiate the controller
	  $controller('App', {$scope: scope});
	}));

	describe('add', function() {
		it('should add new task', function() {
			scope.items = [];
			scope.newText = 'FAKE TASK';
			scope.add();

			expect(scope.items.length).toBe(1);
			expect(scope.items[0].text).toBe('FAKE TASK');
		});


		it('should reset newText', function() {
			scope.newText = 'SOME TEXT';
			scope.add();

			expect(scope.newText).toBe('');
		});
	});


  describe('remaining', function() {

		it('should return number of tasks that are not done', function() {
			scope.items = [{done: false}, {done: false}, {done: false}, {done: false}];
			expect(scope.remaining()).toBe(4);

			scope.items[0].done = true;
			expect(scope.remaining()).toBe(3);
		});
	});


	describe('archive', function() {

		it('should remove tasks that are done', function() {
      scope.items = [new MockItem({done: false}), new MockItem({done: true}), new MockItem({done: false})];
//      scope.items = [{done: false}, {done: true}, {done: false}];
      expect(scope.items.length).toBe(3);

			scope.archive();
			expect(scope.items.length).toBe(2);
		});
	});
});
