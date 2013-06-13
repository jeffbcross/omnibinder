describe('Setup', function () {
  var syncResource, scope;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, $rootScope, $httpBackend, _$syncResource_) {
    $syncResource = _$syncResource_;
    
    scope = $rootScope;
  }));

  it('should exist', function () {
    expect(!!angular).toBe(true);
    expect(!!$syncResource).toBe(true);
  });

  it('should accept a configured transport when generating a syncer', function () {
    var protocol = Object.create(VolatileProtocol.prototype);
    VolatileProtocol.call(protocol, {host: 'localhost'});

    var syncer = $syncResource({
      protocol: protocol,
      scope: scope
    });
    expect(typeof syncer.protocol).toEqual('object');
    expect(syncer.protocol.host).toEqual('localhost');
  });
});