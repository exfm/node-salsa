"use strict";

var fs = require("fs"),
    path = require("path"),
    when = require("when"),
    sequence = require("sequence"),
    commander = require("commander"),
    request = require("superagent"),
    url = require("url"),
    shell = require("shelljs");

var rcPath = findRc();

module.exports.config = {
};

function findRc(){
    var home = path.resolve(path.relative("~/.salsarc"));
    if(fs.existsSync(home + "/.salsarc")){
        return home + "/.salsarc";
    }
    if(fs.existsSync(__dirname + "/.salsarc")){
        return __dirname + "/.salsarc";
    }
    if(fs.existsSync(__dirname + "/../.salsarc")){
        return __dirname + "/../.salsarc";
    }
    return null;
}

module.exports.loadConfig = function(){
    if(rcPath){
        try{
            module.exports.config = JSON.parse(
                fs.readFileSync(path.normalize(rcPath), "utf-8"));
        }
        catch(err){
            console.log("Unable to parse .salsarc: " + err);
        }
        if (module.exports.config.auth_token) {
            // this is the minimum defined config
            return true;
        }
        return false;
    }
    return false;
};

module.exports.getBowlList = function(){
    var d = when.defer(),
        templates = {};
    sequence().then(function(next){
        fs.readdir(__dirname + "/bowls/", next);
    }).then(function(next, err, dirs){
        dirs.forEach(function(dir){
            if(dir.indexOf(".DS_Store") === -1){
                templates[dir] = require(__dirname + "/bowls/" + dir + "/salsa_init");
            }
        });
        d.resolve(templates);
    });
    return d.promise;
};

module.exports.getBowl = function(name){
    return require(__dirname + "/bowls/" + name + "/salsa_init");
};

module.exports.copyWebhooks = function(sourceRepo, destRepo){
    var p = when.defer();

    var webHooks;
    sequence().then(function(next){
        sourceRepo = url.parse(sourceRepo).pathname.replace(/\/$/, "");
        destRepo = url.parse(destRepo).pathname.replace(/\/$/, "");
        next();
    }).then(function(next){
        console.log("Attempting to retrieve webhooks from " + sourceRepo);
        request
            .get("https://api.github.com/repos" + sourceRepo +
                "/hooks?access_token=" + module.exports.config.auth_token)
            .end(function(res){
                if (res.ok) {
                    console.log(
                        "Sucessfully retrieved existing webhooks from " +
                        sourceRepo + ".");
                    next(res.body);
                }
                else {
                    console.log("Failed to retrieve existing webhooks from " +
                        sourceRepo + ".");
                    process.exit(1);
                }
            });
    }).then(function(next, webHooks){
        console.log("Copying " + webHooks.length + " webhooks from " +
            sourceRepo + " to " + destRepo + "...");
        when.all(webHooks.map(function(item, index) {
            var d = when.defer();
            var hook = {
                    'name': item.name,
                    'active': item.active,
                    'config': item.config
                };
            var hookString = JSON.stringify(hook);
            request
                .post("https://api.github.com/repos" + destRepo +
                    "/hooks?access_token=" + module.exports.config.auth_token)
                .send(hookString)
                .set("Content-Type", "application/x-www-form-urlencoded")
                .set("Content-Length", hookString.length)
                .end(function (res){
                    if(res.ok){
                        console.log("Successfully added hook " + hook.name +
                            ".");
                        d.resolve(true);
                    }
                    else {
                        console.log("Failed to add hook " + hook.name + ".");
                        d.reject();
                        process.exit(1);
                    }
                });
            return d.promise;
        }), next);
    }).then(function(next){
        console.log("Copy complete.");
        p.resolve();
    });

    return p.promise;
};

module.exports.initializeRepo = function(localPath, name, makePrivate, repoUrl,
    listOfFiles){
    var d = when.defer();

    var userName;
    console.log("Initializing repository...");
    var postRequest = {
        'name': name,
        'private': makePrivate
    };
    if (module.exports.config.team_id) {
        postRequest.team_id = module.exports.config.team_id;
    }
    var postRequestString = JSON.stringify(postRequest);
    sequence().then(function(next){
        repoUrl = url.parse(repoUrl).pathname.replace(/^\/|\/$/g, "");
        userName = repoUrl.split("/")[0];
        next();
    }).then(function(next){
        shell.cd(localPath);
        next();
    }).then(function(next){
        shell.exec("npm install");
        next();
    }).then(function(next){
        shell.exec("git init");
        next();
    }).then(function(next){
        shell.exec("git add " + listOfFiles.join(" "));
        shell.exec("git status");
        next();
    }).then(function(next){
        shell.exec("git commit -m 'Intial commit'");
        next();
    }).then(function(next){
        request
            .post("https://api.github.com/orgs/" + userName +
                "/repos?access_token=" + module.exports.config.auth_token)
            .send(postRequestString)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .set("Content-Length", postRequestString.length)
            .end(function (res){
                if (res.ok){
                    console.log("Successfully created repo " + name + ".");
                    next();
                }
                else {
                    console.log("Failed to create repo " + name + ".");
                    console.log("Response:\n" + JSON.stringify(res.body));
                    process.exit(1);
                }
            });
    }).then(function(next){
        shell.exec("git remote add origin git@github.com:" + repoUrl + ".git");
        next();
    }).then(function(next){
        shell.exec("git push origin master");
        next();
    }).then(function(next){
        console.log("Done initializing repository.");
        d.resolve();
    });

    return d.promise;
};
