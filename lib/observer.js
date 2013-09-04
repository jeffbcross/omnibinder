angular.module('OmniBinder')
  .service('obObserver', function () {
    this.observeCollection = function (type, scope, model, callback) {
      var observer = new ArrayObserver(scope[model], callback);
      return observer;
    };
  });
