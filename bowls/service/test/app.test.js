"use strict";

var covRequire = function(s){
    if(process.env.COVERAGE){
        s = s.replace("lib", "lib-cov");
    }
    return require(s);
};

var Row = covRequire("../lib/models"),
    chai = require("chai"),
    helpers = require("./helpers"),
    sequence = require("sequence"),
    when = require("when"),
    assert = require("assert"),
    app = require("../"),
    request = require("superagent");

var db,
    server,
    url = "0.0.0.0",
    port = 3000,
    baseUrl = "http://" + url + ":" + port;

chai.Assertion.includeStack = true;

describe("Row Service", function(){
    before(function(done){
        server = app.listen(port, url, function(){
            console.log("Express server listening on port %d in %s mode",
                port,
                app.settings.env
            );
            done();
        });
    });
    after(function(done){
        // Close server
        server.close();
        done();
    });

    beforeEach(function(done){
        when.all(Object.keys(helpers.schemasByName).map(function(t){
            return helpers.ensureTable(t);
        }),
        function(){
            done();
        });
    });
    afterEach(function(done){
        // Remove any config documents created
        helpers.destroyAllRows().then(done);
    });


    it("should create, get, and delete a row", function(done){
        // Create
        var row,
            rowData = {
                'hash': "potato"
            };

        sequence(this).then(function(next){
            // Create
            request
                .post(baseUrl + "/")
                .send(rowData)
                .end(function(res){
                    assert.equal(rowData.hash, res.body.hash);
                    next();
                });

        }).then(function(next){
            // Get
            request
                .get(baseUrl + "/" + rowData.hash)
                .end(function(res){
                    assert.equal(rowData.hash, res.body.hash);
                    next();
                });

        }).then(function(next){
            // Delete
            request
                .del(baseUrl + "/" + rowData.hash)
                .end(function(res){
                    assert.equal(true, res.body.success);
                    next();
                });

        }).then(function(next){
            // Verify the row no longer exists
            request
                .get(baseUrl + "/" + rowData.hash)
                .end(function(res){
                    assert.equal(undefined, res.body.hash);
                    next();
                });

            done();
        });
    });
});
