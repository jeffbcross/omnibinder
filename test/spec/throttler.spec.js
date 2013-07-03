describe('$throttler', function () {
  var $throttler, scope, $binder;

  beforeEach(module('SyncResource'));
  beforeEach(inject(function (_$throttler_, $rootScope, _$binder_) {
    $throttler = _$throttler_;
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
        onModelChange: [$throttler(250)]
      });
      
      time = new Date().getTime();
      binder.onModelChange({}, {}, function(){
        done = true;
      });
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
        onModelChange: [$throttler(250)]
      });

      var delta = {data: 'foo'};

      binder.onModelChange(binder, delta, function (binder, delta) {
        var finishedFirst = delta.data;
      });

      delta.data = 'bar';

      binder.onModelChange(binder, delta, function (binder, delta) {
        finishedSecond = delta.data;
      });
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