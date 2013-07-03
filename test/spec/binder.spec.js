describe('$binder', function () {
  var $binder, scope;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$binder_, $rootScope) {
    $binder = _$binder_;
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
    it('should throw an error if I pass in something other than function or array', function () {
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

      expect(msg).toEqual('onModelChange must be a function or array');
    });

    it('should execute a series of functions for onModelChange', function () {
      var data;
      
      var binder = $binder({
        scope: scope,
        model: 'foo',
        onModelChange: [
          function (binder, delta, next) {
            delta.data += "bar";
            next();
          },
          function (binder, delta, next) {
            delta.data += "baz";
            next();
          }
        ]
      });

      binder.onModelChange({}, {data: 'foo'}, function (binder, delta) {
        data = delta.data;
      });
    
      expect(data).toEqual('foobarbaz');
    });
  });
});