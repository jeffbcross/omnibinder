describe('$binder', function () {
  var $binder, $q, scope, $timeout;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$binder_, $rootScope, _$q_, _$timeout_) {
    $binder = _$binder_;
    $timeout = _$timeout_;
    $q = _$q_;
    scope = $rootScope;
  }));

  it('should exist', function () {
    expect(!!$binder).toBe(true);
  });

  it('should accept scope as the first argument', function () {
    scope.hello = 'world';
    var binder = $binder({
      scope: scope,
      model: 'hello'
    });

    expect(binder.scope.hello).toEqual('world');
  });

  it('should accept a model name as the second argument', function () {
    scope.super = 'heroic';
    var binder = $binder({
      scope: scope,
      model: 'super'
    });

    expect(binder.model).toEqual('super');
    expect(binder.val()).toEqual('heroic');
  });

  it('should throw an error when scope is not provided', function () {
    var msg;
    try {
      var binder = $binder({
        scope: null,
        model: 'super'
      });  
    }
    catch (e) {
      msg = e.message;
    }
    expect(msg).toEqual('scope is required');
  });

  it('should throw an error when modelName is not provided', function () {
    var msg;

    try {
      var binder = $binder({
        scope: scope
      });
    }
    catch (e) {
      msg = e.message;
    }

    expect(msg).toEqual('model is required');
  });

  describe('onModelChange', function () {
    it('should throw an error if I pass in something other than function', function () {
      var msg, binder;
      try {
        binder = $binder({
          scope: scope,
          model: 'foo',
          onModelChange: {change: this}
        })
      }
      catch (e) {
        msg = e.message;
      }

      expect(msg).toEqual('onModelChange must be a function');
    });

    it('should execute the function and return a promise for onModelChange', function () {
      var data
        , binder
        , delta = {data: 'foo'}
        , called;

      binder = $binder({
        scope: scope,
        model: 'foo',
        onModelChange: function (binder, delta) {
          var deferred = $q.defer();
          
          $timeout(function () {
            delta.data += "bar";
            deferred.resolve(delta);
          }, 0);

          return deferred.promise;
        }
      });
      
      var promise = binder.onModelChange({}, delta);
      promise.then(function (delta) {
        called = true;
      });

      $timeout.flush()
      scope.$apply();

      expect(delta.data).toEqual('foobar');
      expect(called).toBe(true);
    });

    it('should use a default no-op if no onModelChange function is provided', function () {
      var delta = {data: {foo: 'bar'}};
      var called;
      var binder = $binder({
        scope: scope,
        model: 'foo'
      });

      var promise = binder.onModelChange({}, delta);
      promise.then(function (delta) {
        called = true;
      });

      $timeout.flush();
      scope.$apply();
      
      expect(delta.data.foo).toEqual('bar');
      expect(called).toBe(true);
    });

    it('should use a default no-op if no onPrototolChange function is provided', function () {
      var delta = {data: {foo: 'bar'}};
      var called;
      var binder = $binder({
        scope: scope,
        model: 'foo'
      });

      var promise = binder.onProtocolChange({}, delta);
      promise.then(function (delta) {
        called = true;
      });

      $timeout.flush();
      scope.$apply();
      
      expect(delta.data.foo).toEqual('bar');
      expect(called).toBe(true);
    });
  });
  
  describe('key', function () {
    it('should allow setting of a `key` property, which should be used to uniquely identify elements', function () {
      var binder = $binder({
        scope: scope,
        model: 'foo',
        key: 'id'
      });

      expect(binder.key).toEqual('id');
    });

    it('should throw an error when anything other than a string is passed as key', function () {
      var message;
      try {
        var binder = $binder({
          scope: scope,
          model: 'foo',
          key: {"true" : 'that'}
        });  
      }
      catch (e) {
        message = e.message;
      }

      expect(message).toEqual('key must be a string');
    });
  });
});