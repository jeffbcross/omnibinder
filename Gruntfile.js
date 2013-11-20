module.exports = function (grunt) {
  grunt.initConfig({
    uglify: {
      min: {
        options: {
          mangle: true
        },
        files: {
          'dist/omnibinder.min.js': ['lib/*.js']
        }
      },
      full: {
        options: {
          mangle: false,
          beautify: true
        },
        files: {
          'dist/omnibinder.js': ['lib/*.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
};
