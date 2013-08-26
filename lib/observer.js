angular.module('OmniBinder')
  .service('obObserver', RTObserver);

function RTObserver () {}
RTObserver.prototype.observeCollection = function (type, scope, model, callback) {
  var observer = new ArrayObserver(scope[model], callback);

  if (typeof Object.observe === 'function') {
    Object.observe(scope[model], function () {
      observer.deliver();
    })
  }
  else {
    scope.$watch(model, function () {
      observer.deliver();
    });
  }
};
