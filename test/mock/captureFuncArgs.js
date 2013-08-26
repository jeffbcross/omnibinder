angular.module('OmniBinder')
  .factory('$captureFuncArgs', function () {
    return function captureFunctionArgs (funcString) {
      //Takes in a stringified function, returns array of arguments.
      var captureArgs = /function[ ]*[a-zA-Z0-9]*[ ]*\(([a-zA-Z0-9, ]*)\)[ ]*{/;
      return captureArgs.exec(funcString)[1].replace(/ /g, '').split(',');
    }
  });
