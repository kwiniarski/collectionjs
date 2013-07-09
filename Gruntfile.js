'use strict';
module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
			all: {
				files: [
					'Gruntfile.js',
					'karma.conf.js',
					'src/**/*.js',
					'tests/**/*.js'
				],
				tasks: [
					'jshint:all',
					'karma:server:run'
				],
				options: {
					nospawn: true
				}
			}
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'src/**/*.js',
                'tests/**/*.js',
                '!tests/**/*Perf.js'
            ]
        },

		karma: {
			options: {
				configFile: 'karma.conf.js'
			},
			all: {
				singleRun: true
			},
			server: {
				singleRun: false,
				background: true
			}
		},

		benchmark: {
			options: {
				displayResults: true
			},
			all: {
				src: ['tests/*Perf.js'],
				dest: '.tmp/performance.csv'
			},
			filters: {
				src: ['tests/*FiltersPerf.js']
			}
		},

        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: 'app/scripts',
                    optimize: 'none',
                    // TODO: Figure out how to make sourcemaps work with grunt-usemin
                    // https://github.com/yeoman/grunt-usemin/issues/30
                    //generateSourceMaps: true,
                    // required to support SourceMaps
                    // http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false,
                    useStrict: true,
                    wrap: true
                    //uglify2: {} // https://github.com/mishoo/UglifyJS2
                }
            }
        }

    });


    grunt.registerTask('server', [
		'karma:server',
		'watch'
    ]);

    grunt.registerTask('test', [
		'jshint',
		'karma:all'
    ]);

    grunt.registerTask('build', [

    ]);

    grunt.registerTask('default', [

    ]);
};
