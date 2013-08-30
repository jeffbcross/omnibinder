angular.module('OmniBinder')
  .service('obObserver', RTObserver);

function RTObserver () {}
RTObserver.prototype.observeCollection = function (type, scope, model, callback) {
  scope.$watch(model, function (newVal, oldVal) {
    callback(ArrayObserver.calculateSplices(newVal, oldVal));
  }, true);
};
