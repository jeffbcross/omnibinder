describe('Deployd Protocol', function () {
  var syncDeployd, protocol;

  beforeEach(module('SyncDeployd', 'SyncResource'));
  beforeEach(inject(function (_syncDeployd_, $rootScope) {
    syncDeployd = _syncDeployd_;
    
    protocol = new syncDeployd();
  }));

  it('should exist', function () {
    expect(!!syncDeployd).toBe(true);
  });

  it('should assign return a promise when calling get', function () {
    var p = protocol.get({path: 'documents'}, 'myModel');
    expect(typeof p.then).toEqual('function');
  });
});