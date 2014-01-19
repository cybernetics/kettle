module.exports = function(grunt) {

  var license = '// kettle-js v0.1.0 \n// (c) 2013 Sergey Melnikov \n\n// kettle-js may be freely distributed under the MIT license\n\n\n';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
     jshint: {
      files: [
          'kettle.js'
      ],
      options: {
          boss: true,
          eqnull: true,
          expr: true,
          bitwise: true,
          eqeqeq: true,
          immed: true,
          newcap: true,
          noarg: true,
        globals: {
          document: true,
          _ : true,
          Backbone : true,
          exports : true,
          setTimeout: true
        }
      }
    },
    jasmine: {
      kettle : {
       src: ['kettle.js' ,'<%= jshint.files %>'],
        options: {
          vendor: ['lib/jquery-1.9.1/jquery.min.js', 'lib/backbone-1.0/underscore.js', 'lib/backbone-1.0/backbone.js'],
          specs: [
            'specs/eventInterface.js',
            'specs/eventListeners.js',
            'specs/viewSubs.js',
            'specs/loader.js',
            'specs/element.js',
            'specs/view.js',
            'specs/domValue.js',
            'specs/collectionView.js',
            'specs/containerView.js',
            'specs/builders.js',
            'specs/parsers.js',
            'specs/kettle.js'
          ]
        }
      }
    },
    uglify: {
      options: {
        banner: license
      },
      dist: {
        files: {
          '<%= pkg.name %>.min.js': ['<%= pkg.name %>.js']
        }
      }
    },
    watch: {
      src : {
        files: ['<%= jshint.files %>','Gruntfile.js'],
        tasks: ['concat','uglify','jshint', 'jasmine']
      },
      test: {
        files: ['<%= jasmine.kettle.options.specs %>'],
        tasks: ['jasmine']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint','jasmine','uglify']);

};
