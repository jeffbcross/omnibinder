angular.module('SyncResource')
  .factory('$throttler', function () {
    return function (delay) {
      if (typeof delay !== 'number') throw new Error("delay must be a number");
      delay = parseInt(delay, 10);

      return function (binder, delta, next) {
        if (binder.throttleTimer) clearTimeout(binder.throttleTimer);
          binder.throttleTimer = setTimeout(function () {
            next.call(this, binder, delta);
          }, delay);
      };  
    };
  });