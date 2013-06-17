describe('Deployd Protocol', function () {
  var protocol, $rootScope, $timeout;

  beforeEach(module('SyncDeployd', 'SyncResource'));
  beforeEach(inject(function (syncDeployd, _$rootScope_, $injector, _$timeout_) {
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    protocol = new syncDeployd();
  }));

  it('should exist', function () {
    expect(!!protocol).toBe(true);
  });

  it('should return a promise when calling get', function () {
    var p = protocol.get({path: 'documents'}, 'myModel');
    expect(typeof p.then).toEqual('function');
  });

  it('should persist data when calling update', function () {
    protocol.update({path: 'documents', id: 1}).then(function (u) {
      expect(u).toEqual('updated');  
    });
    $rootScope.$digest();
  });
});