angular.module('Binder')
  .factory('throttler', ['$timeout', function ($timeout) {
    return function (delay) {
      if (typeof delay !== 'number') throw new Error("delay must be a number");
      delay = parseInt(delay, 10);

      return function (binder, delta, next) {
        if (binder.throttleTimer) $timeout.cancel(binder.throttleTimer);
          binder.throttleTimer = $timeout(function () {
            next.call(this, binder, delta);
          }, delay);
      };
    };
  }]);
