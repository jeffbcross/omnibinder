describe('Firebase Protocol', function () {
  var protocol, $rootScope, $timeout, dpd;

  beforeEach(module('SyncFirebase', 'SyncResource'));
  beforeEach(inject(function (syncFirebase, _$rootScope_, $injector, _$timeout_) {
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    protocol = new syncFirebase();
  }));

  it('should exist', function () {
    expect(!!protocol).toBe(true);
  });

  it('should return a promise when calling read', function () {
    var p = protocol.read({path: 'documents'}, 'myModel');
    expect(typeof p.then).toEqual('function');
  });

  it('should persist data when calling update', function () {
    protocol.update({path: 'documents', id: 1}).then(function (u) {
      expect(u).toEqual('updated');
    });
    $rootScope.$digest();
  });

  it('should unsubscribe from updates when calling unsubscribe', function () {
    protocol.subscribe({path: 'documents'});
    $rootScope.$digest();

    protocol.unsubscribe({path: 'documents'});
    
  });

  it('should create an object when calling create', function () {
    protocol.create({path: 'documents'}, {}).then(function (data) {
      expect(data.id).toEqual('A456');
    });
    $rootScope.$digest();
  });

  it('should delete an object when calling delete', function () {
    protocol.delete({path: 'documents', id: 'A456'}).then(function (data) {
      expect(data).toBe(null);
    });
    $rootScope.$digest();
  });

  it('should only fire update events if the data has actually changed', function () {
    protocol.subscribe()
    expect(false).toBe(true);
  });

  it('should respond appropriately to events depending on whether the binder.data is a list or single item', function () {
    expect(false).toBe(true);
  });
});