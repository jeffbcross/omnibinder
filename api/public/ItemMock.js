// Simple mock for Item service
var MockItem = function(data) {
  angular.extend(this, data);

  this.$remove = jasmine.createSpy('$remove');
  this.$save = jasmine.createSpy('$save');
};

MockItem.query = jasmine.createSpy('query').andReturn([]);

// create module, that register this MockItem item
angular.module('mocks.Item', []).value('Item', MockItem);
