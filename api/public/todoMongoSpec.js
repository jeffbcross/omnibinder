beforeEach(module('todo'));

var API_URL = 'https://api.mongolab.com/api/1/databases/ng-todo/collections/items?apiKey=4fc27c99e4b0401bdbfd1741';

var RESPONSE = [
  { "_id" : { "$oid" : "4fc31f64e4b0769539c32f7e"} , "text" : "Try AngularJS"},
  { "_id" : { "$oid" : "4fc32855e4b0769539c32ff4"} , "text" : "Visit Boston"},
  { "_id" : { "$oid" : "4fc32862e4b0769539c32ffb"} , "text" : "Drink some beers"}
];

var apiUrlForId = function(id) {
  return API_URL.replace('?', '/' + id + '?');
};

describe('App with Mongo', function() {
  var scope, httpBackend;

  beforeEach(inject(function($controller, $rootScope, $httpBackend) {
    // expect the request to mongo lab
    $httpBackend.expectGET(API_URL).respond(RESPONSE);

    // instantiate the controller
    $controller('App', {$scope: $rootScope});

    // flush pending requests
    $rootScope.$digest();
    $httpBackend.flush();

    // store references to access them in specs
    scope = $rootScope;
    httpBackend = $httpBackend;
  }));

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
  });

  it('should load items from mongolab', function() {
    expect(scope.items.length).toBe(3);
    expect(scope.items[0].text).toBe('Try AngularJS');
  });


  describe('add', function() {
    it('should store item in mongolab', function() {
      httpBackend.expectPOST(API_URL, {text: 'FAKE TASK'}).respond();

      scope.newText = 'FAKE TASK';
      scope.add();

      scope.$digest();
    });
  });


  describe('archive', function() {

    it('should remove tasks that are done', function() {
      expect(scope.items.length).toBe(3);

      // mark first item as done
      scope.items[0].done = true;

      // expect delete request for first item
      httpBackend.expectDELETE(apiUrlForId('4fc31f64e4b0769539c32f7e')).respond();

      scope.archive();
      expect(scope.items.length).toBe(2);

      scope.$digest();
    });
  });
});
