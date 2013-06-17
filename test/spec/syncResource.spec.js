describe('Setup', function () {
  var syncResource, scope, protocol, syncer;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, $rootScope, $httpBackend, _$syncResource_) {
    $syncResource = _$syncResource_;
    
    scope = $rootScope;

    protocol = new VolatileProtocol({host: 'localhost'});
    syncer = $syncResource({
      protocol: protocol,
      scope: scope
    });
  }));

  it('should exist', function () {
    expect(!!angular).toBe(true);
    expect(!!$syncResource).toBe(true);
  });

  it('should accept a configured transport when generating a syncer', function () {
    expect(typeof syncer.config.protocol).toEqual('object');
    expect(syncer.config.protocol.host).toEqual('localhost');
  });

  it('should call "subscribe" on the protocol when calling bind() on the syncer', function () {
    syncer.bind('documents');
    expect(protocol.bound[0].query).toEqual('documents');
  });

  it("should assign the result of the protocol's get method to the appropriate model on the scope", function () {
    syncer.bind('documents', 'myModel');
    expect(typeof scope.myModel.then).toEqual('function');
  });

  it('should return a promise when calling bind, which should resolve to the initial data state', function () {
    expect(false).toBe(true);
  });
});