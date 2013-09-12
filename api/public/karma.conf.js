// Configuration file for Karma
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'angular.js',
      'angular-resource.js',
      'angular-mocks.js',
      'todo.js',
      'todoSpec.js',
      'todoMongoSpec.js',
      'ItemMock.js'
    ],

    autoWatch: true,
    browsers: ['Chrome']
  });
};
