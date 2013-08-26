describe('unHash', function () {
  var unHash, captureFunctionArgs;

  beforeEach(module('OmniBinder'));
  beforeEach(inject(function (_unHash_, $captureFuncArgs) {
    unHash = _unHash_;
    captureFunctionArgs = $captureFuncArgs;
  }));

  it('should exist', function () {
    expect(!!unHash).toBe(true);
    expect(typeof unHash).toBe('function');
  });

  it('should have the correct signature', function () {
    var args = captureFunctionArgs(unHash.toString());
    expect(args[0]).toEqual('array');
    expect(args[1]).toBeUndefined();
  });

  it('should remove $$hashKey from objects in an array', function () {
    var unHashed = unHash([{$$hashKey: '1', id: '2'}]);
    expect(unHashed[0].$$hashKey).toBeUndefined();
    expect(unHashed[0].id).toEqual('2');
  });

  it('should remove $$hashKey from a single object', function () {
    var unHashed = unHash({$$hashKey: '3', id:'4'});
    expect(unHashed.id).toEqual('4');
    expect(unHashed.$$hashKey).toBeUndefined();
  });

  it('should not change an object at all if the object has no $$hashKey', function () {
    var unHashed = unHash({foo: 'bar', baz: 'foo'});
    expect(unHashed.foo).toEqual('bar');
    expect(unHashed.baz).toEqual('foo');
    expect(Object.keys(unHashed).length).toEqual(2);
  });
});