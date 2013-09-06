// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'components/angular/angular.js',
      'components/angular-mocks/angular-mocks.js',
      'components/observe-js/src/observe.js',
      'lib/binder.js',
      'lib/*.js',
      'test/mock/*.js',
      'test/spec/*.js',
      'test/integration/*.js'
    ],

    autoWatch: true,
    //Recommend starting Chrome manually with experimental javascript flag enabled, and open localhost:9876.
    browsers: ['Chrome']
  });
};
