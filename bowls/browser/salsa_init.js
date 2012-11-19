"use strict";

var fs = require('fs'),
    when = require('when'),
    hbs = require('hbs'),
    sequence = require('sequence');

module.exports.listOfFiles = [];

module.exports.create = function(path, details){
    var d = when.defer();
    sequence(this).then(function(next){
        fs.exists(path, next);
    }).then(function(next, exists){
        if(!exists){
            return fs.mkdir(path, next);
        }
        next();
    }).then(function(next){
        fs.exists(path+"/test", next);
    }).then(function(next, exists){
        if(!exists){
            return fs.mkdir(path+"/test", next);
        }
        next();
    }).then(function(next){
        var topLevels = {
            '.jshintrc': '.jshintrc.hbs',
            '.gitignore': '.gitignore.hbs',
            'package.json': 'package.json.hbs',
            'README.md': 'README.md.hbs',
            'index.js': 'index.js.hbs'
        };
        renderFiles(path, topLevels, details, next);
    }).then(function(next){
        var testName = details.name + '.test.js',
            testFiles = {
                'index.html': 'harness.html.hbs'
            };
        testFiles[testName] = 'test.hbs';
        renderFiles(path, testFiles, details, next);
    }).then(function(next){
        d.resolve(true);
    });
    return d.promise;

};

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

module.exports.description = "A simple bootstrap for getting client side packages setup with mocha.";