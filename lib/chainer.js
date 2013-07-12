angular.module('SyncResource')
  .factory('$chainer', function ($q) {
    // function Chainer (middlewares) {
    //   var self = this;
    //   this.middlewares = middlewares;
    // }

    // Chainer.prototype.execute = function (binder, delta, next) {
    //   var self = this;
    //   self.binder = binder;
    //   self.delta = delta;

    //   if (typeof next === 'function') {
    //     console.log('assigning next', next.toString())
    //     self.done = next;
    //   }

    //   self.middlewares.forEach(function (fn, i) {
    //     self.middlewares[i].next = function () {
    //       if (typeof self.middlewares[i + 1] === 'function') {
    //         self.caller(i+1);
    //       }
    //       else if (typeof self.middlewares[i + 1] !== 'undefined') {
    //         throw new Error("Middleware must be a function");
    //       }
    //     }
    //   });

    //   self.caller(0);
    // }

    // Chainer.prototype.caller = function (i) {
    //   var next, self = this;
    //   if (typeof self.middlewares[i].next === 'function') {
    //     next = self.middlewares[i].next;
    //   }
    //   else if (typeof self.done === 'function') {
    //     console.log('there is a done')
    //     next = function () {
    //       self.done(self.binder, self.delta);
    //     };
    //   }
    //   else {
    //     next = angular.noop;
    //   }

    //   if (typeof this.middlewares[i] === 'function') {
    //     console.log('calling ', i)
    //     this.middlewares[i].call(this, this.binder, this.delta, next);
    //   }
      
    // }

    // return function (middlewares) {
    //   return new Chainer(middlewares);
    // };

    return function (middlewares) {
      return function (binder, delta) {
        var deferred = $q.defer();

        return deferred.promise;  
      }
      
    };
  });