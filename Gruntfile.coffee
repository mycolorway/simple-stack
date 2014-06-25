module.exports = (grunt) ->

  grunt.initConfig

    pkg: grunt.file.readJSON 'package.json'

    sass:
      pjax:
        options:
          style: 'expanded'
          bundleExec: true
        files:
          'styles/stack.css': 'styles/stack.scss'
      demo:
        options:
          style: 'expanded'
          bundleExec: true
        files:
          'demo/styles/demo.css': 'demo/styles/demo.scss'

    coffee:
      pjax:
        files:
          'lib/stack.js': 'src/stack.coffee'
      demo:
        files:
          'demo/server.js': 'demo/server.coffee'
          'demo/scripts/demo.js': 'demo/scripts/demo.coffee'

    watch:
      scripts:
        files: ['src/*.coffee', 'demo/**/*.coffee']
        tasks: ['coffee']
      style:
        files: ['styles/*.scss', 'demo/**/*.scss']
        tasks: ['sass']


    express:
      server:
        options:
          server: 'demo/server.js'
          bases: 'demo'


  grunt.loadNpmTasks 'grunt-contrib-sass'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-express'

  grunt.registerTask 'default', ['sass', 'coffee', 'express', 'watch']

