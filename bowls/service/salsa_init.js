"use strict";

var fs = require("fs"),
    when = require("when"),
    hbs = require("hbs"),
    sequence = require("sequence");

var directories = ["logs", "lib", "test"];

module.exports.listOfFiles = [];

module.exports.create = function(path, details){
    var d = when.defer();
    details.formalName = details.name.charAt(0).toUpperCase() + details.name.slice(1);
    sequence(this).then(function(next){
        // Create the main directory
        createDir(path).then(next);
    }).then(function(next){
        // Create all the subdirectories
        when.all(directories.map(function(dir){
            createDir(path, dir);
        }), next);
    }).then(function(next){
        // Compile the top level files
        var topLevels = {
            '.npmignore': ".npmignore",
            '.jshintrc': ".jshintrc",
            '.gitignore': ".gitignore",
            'package.json': "package.json.hbs",
            'README.md': "README.md.hbs",
            'index.js': "index.js",
            'server.js': "server.js.hbs",
            'grunt.js': "grunt.js"
        };
        renderFiles(path, topLevels, details, next);
    }).then(function(next){
        // Compile the test files
        var testFiles = {
                'test/helpers.js': "test/helpers.js.hbs",
                'test/mocha.opts': "test/mocha.opts",
                'test/models.test.js': "test/models.test.js.hbs",
                'test/app.test.js': "test/app.test.js.hbs"
            };
        renderFiles(path, testFiles, details, next);
    }).then(function(next){
    // Compile the libraries
        var libFiles = {
            'lib/app.js': "lib/app.js.hbs",
            'lib/model.js': "lib/model.js.hbs",
            'lib/log.js': "lib/log.js",
            'lib/common.js': "lib/common.js"
        };
        renderFiles(path, libFiles, details, next);
    }).then(function(next){
        d.resolve(true);
    });
    return d.promise;

};

function createDir(path, dirName){
    var d = when.defer();

    if(dirName){
        path = path + "/" + dirName;
    }

    sequence().then(function(next){
        fs.exists(path, next);
    }).then(function(next, exists){
        if(!exists){
            fs.mkdir(path, next);
        }
        next();
    }).then(function(next){
        d.resolve();
    });

    return d.promise;
}

function renderFiles(path, files, details, next){
    var filesList = Object.keys(files);
    module.exports.listOfFiles = module.exports.listOfFiles.concat(
        Object.keys(files));

    when.all(filesList.map(function(name){
        var p = when.defer();
        fs.readFile(__dirname + "/" + files[name], "utf-8",
            function(err, data){
            var template,
                rendered;
            if(files[name].indexOf(".hbs") !== -1){
                template = hbs.handlebars.compile(data);
                rendered = template(details);
            }
            else {
                rendered = data;
            }
            fs.writeFile(path + "/" + name, rendered, function(){
                p.resolve(true);
            });
        });
        return p.promise;
    }), next);
}

module.exports.description = "A simple bootstrap for getting server side packages setup with mocha.";
