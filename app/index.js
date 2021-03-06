'use strict';
var yeoman = require('yeoman-generator');
var path = require('path');
var yosay = require('yosay');
var chalk = require('chalk');
var fs = require('node-fs-extra');
require('sugar');

var PolymerPlus = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    this.option('skip-install', {
      desc:     'Whether dependencies should be installed',
      defaults: false,
    });

    this.option('skip-install-message', {
      desc:     'Whether commands run should be shown',
      defaults: false,
    });

    this.sourceRoot(path.join(path.dirname(this.resolved), 'templates/polymer-starter-kit-plus'));
  },

  askFor: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Out of the box I include Polymer Starter Kit'));

    var prompts = [
      {
        name: 'appName',
        message: 'What is the name of your app?'
      },
      {
        name: 'useFirebase',
        message: 'Add Firebase integration?',
        type: 'confirm',
        default: false
      },
      {
        name: 'frameworks',
        message: 'Framework integrations?',
        type: 'checkbox',
        choices: ['React', 'Angular', 'Backbone'],
        default: []
      },
      {
        name: 'useGWC',
        message: 'Use Google Web Components?',
        type: 'confirm',
        default: true
      },
      {
        name: 'useAnalytics',
        message: 'Add Google Analytics?',
        type: 'confirm',
        default: true
      },
      {
        name: 'includeWCT',
        message: 'Would you like to include web-component-tester?',
        type: 'confirm'
      },
      {
        name: 'includeRecipes',
        message: 'Would you like to include recipe docs?',
        type: 'confirm',
        default: false
      }
    ];

    this.prompt(prompts, function (answers) {
      this.includeWCT = answers.includeWCT;
      this.includeRecipes = answers.includeRecipes;
      this.appName = answers.appName.parameterize();

      this.frameworks = answers.frameworks;

      this.useReact = answers.frameworks.indexOf('React') >= 0;
      this.useAngular = answers.frameworks.indexOf('Angular') >= 0;
      this.useBackbone = answers.frameworks.indexOf('Backbone') >= 0;

      this.useFirebase = answers.useFirebase;
      this.useGWC = answers.useGWC;
      this.useAnalytics = answers.useAnalytics;
      this.context = {
        appName: this.appName,
        humanAppName: this.appName.humanize(),
        useReact: this.useReact,
        useAngular: this.useAngular,
        useBackbone: this.useBackbone,
        useGWC: this.useGWC,
        useAnalytics: this.useAnalytics,
        useFirebase: this.useFirebase,
        includeWCT: this.includeWCT
      };

      done();
    }.bind(this));
  },
  app: function () {
    this.copy('.editorconfig', '.editorconfig');
    this.copy('.gitattributes', '.gitattributes');

    // Handle bug where npm has renamed .gitignore to .npmignore
    // https://github.com/npm/npm/issues/3763
    if (this.src.isFile('.npmignore')) {
      this.copy('.npmignore', '.gitignore');
    } else {
      this.copy('.gitignore', '.gitignore');
    }

    this.directory('config', 'config');

    this.copy('app.yaml', 'app.yaml');

    this.copy('.jscsrc', '.jscsrc');
    this.copy('.jshintrc', '.jshintrc');
    this.copy('.stylelintrc.json', '.stylelintrc.json');

    var self = this;
    this.copy('_bower.json', 'bower.json', function(file) {
      var manifest =  JSON.parse(file);
      manifest.name = self.appName;
      if (!this.includeWCT) {
        delete manifest.devDependencies['web-component-tester'];
        delete manifest.devDependencies['test-fixture'];
      }
      return JSON.stringify(manifest, null, 2);
    }.bind(this));

    this.copy('gulpfile.js', 'gulpfile.js', function(file) {
      var clone = file;
      if (!this.includeWCT) {
        clone = file.replace(/require\('web-component-tester'\).+/g,
          function(match) {
            return '// ' + match;
          });
      }
      return clone;
    }.bind(this));

    this.copy('LICENSE.md', 'LICENSE.md');

    var me = this;
    // Remove WCT if the user opted out
    this.template('_package.json', 'package.json', this.context);
    this.template('_README.md', 'README.md', this.context);

    // console.log('copy tasks');
    this.directory('tasks', 'tasks');

    if (this.useFirebase) {
      this.copy('firebase.json', 'firebase.json');
    }

    if (this.includeWCT) {
      this.copy('wct.conf.json', 'wct.conf.json');
      this.directory('test', 'test');
    }

    this.mkdir('app');
    this.directory('app', 'app');
    this.template('app-xtra/_index.html', 'app/index.html', this.context);
    this.template('app-xtra/_manifest.json', 'app/manifest.json', this.context);

    if (this.includeRecipes) {
      this.directory('docs', 'docs');
    }
  },
  install: function () {
    if (!this.useFirebase) {
      var firebaseTaskPath = path.join(this.destinationRoot(), 'tasks/deploy-firebase.js');
      this.removeFile(firebaseTaskPath);
    }

    this.installDependencies({
      skipInstall: this.options['skip-install'],
      skipMessage: this.options['skip-install-message'],
    });
  }
});

PolymerPlus.prototype.removeFile = function(dir) {
    var cb = this.async(),
        self = this;
    if (dir) {
      console.log('removing', dir);
      fs.remove(dir, function (err) {
        if (err) {
          console.error(err);
        }
        cb();
      });
    } else {
      cb();
    }
};

module.exports = PolymerPlus;