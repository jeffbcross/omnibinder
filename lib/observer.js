angular.module('OmniBinder')
  .service('obObserver', function () {
    this.observeCollection = function (type, scope, model, callback) {
      return new ArrayObserver(scope[model], callback);
    };
  });
