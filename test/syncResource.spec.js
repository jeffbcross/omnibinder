describe('Setup', function () {
  var syncResource;
  beforeEach(module('SyncResource'));
  beforeEach(inject(function ($injector, $rootScope, $httpBackend, _$syncResource_) {
    $syncResource = _$syncResource_;
    
    scope = $rootScope;
  }));

  it('should exist', function () {
    expect(!!angular).toBe(true);
    expect(!!$syncResource).toBe(true);
  });
});