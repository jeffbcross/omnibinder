describe('$throttler', function () {
  var $throttler, scope, $binder, $q, $timeout;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$throttler_, $rootScope, _$binder_, _$q_, _$timeout_) {
    $throttler = _$throttler_;
    $q = _$q_;
    $timeout = _$timeout_;
    $binder = _$binder_;
    scope = $rootScope;
  }));

  it('should exist', function () {
    expect(!!$throttler).toBe(true);
    expect(typeof $throttler).toEqual('function');
  });

  it('should throw an error if delay is not a number', function () {
    var msg;
    try {
      throttler = $throttler('j');
    }
    catch (e) {
      msg = e.message;
    }
    
    expect(msg).toEqual('delay must be a number');
  });

  it('should let me delay execution of write for 250 milliseconds', function () {
    var time, binder, done;
    runs(function () {
      binder = $binder({
        scope: scope,
        model: 'model',
        onModelChange: function  (binder, delta) {
          var deferred = $q.defer();
          $timeout(function () {
            $throttler(250)(binder, delta, function () {
              deferred.resolve(delta);
              scope.$apply();
            });
          }, 0);

          return deferred.promise;
        }
          
      });
      
      time = new Date().getTime();
      binder.onModelChange({}, {}).then(function (delta) {
        done = true;
      });

      scope.$apply();
      $timeout.flush();
    });

    waitsFor(function () {
      return done;
    }, 'timer to finish', 300);
    
    runs(function () {
      expect(new Date().getTime() - time).toBeGreaterThan(249);
      expect(new Date().getTime() - time).toBeLessThan(300);
    });
  });

  it('should cancel a previously throttled update if I have a new update', function () {
    var finishedFirst, finishedSecond;
    runs(function () {
      binder = $binder({
        scope: scope,
        model: 'model',
        onModelChange: function (binder, delta) {
          var deferred = $q.defer();
          $timeout(function () {
            $throttler(250)(binder, delta, function () {
              deferred.resolve(delta);
              scope.$apply();
            });
          }, 0)
          return deferred.promise;
        }
      });

      var delta = {data: 'foo'};

      binder.onModelChange(binder, delta).then(function (delta) {
        var finishedFirst = delta.data;
      });
      scope.$apply();
      $timeout.flush();

      delta.data = 'bar';

      binder.onModelChange(binder, delta).then(function (delta) {
        finishedSecond = delta.data;
      });
      
      scope.$apply();
      $timeout.flush();
    });

    waitsFor(function () {
      return finishedSecond;
    }, "finishedSecond to be defined", 300);

    runs(function () {
      expect(finishedFirst).toBeUndefined();
      expect(finishedSecond).toEqual('bar');
    });
  });

  it('should function as a single onModelChange handler', function () {
    var binder, throttled;
    runs(function () {
      binder = $binder({
        scope: scope,
        model: 'model',
        onModelChange: $throttler(250)
      });
      binder.onModelChange(binder, {data: 'foo'}, function (binder, delta) {
        throttled = true;
      });
      expect(!throttled).toBe(true);
    });

    waitsFor(function () {
      return throttled;
    }, 'throttled to be true', 250);

    runs(function () {
      expect(throttled).toBe(true);
    });

  });
})