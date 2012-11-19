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
    assert = require("assert");

var db;

chai.Assertion.includeStack = true;

// Connect to Magneto
Row.connect();


describe("Row Model", function(){
    beforeEach(function(done){
        when.all(Object.keys(helpers.schemasByName).map(
            function(t){
                return helpers.ensureTable(t);
            }),
            function(){
                done();
            }
        );
    });
    afterEach(function(done){
        // Remove any row documents created
        helpers.destroyAllRows().then(function(){
            done();
        });
    });

    describe("create", function(){
        it("should create and destroy a new row", function(done){
            var hash = "potato";
            sequence(this).then(function(next){
                helpers.createRow(hash).then(function(row){
                    assert.equal(hash, row.hash);
                    assert.notEqual(null, row);
                    assert.notEqual(null, row.created);
                    next();
                });
            }).then(function(next){
                Row.get(hash).then(function(row){
                    assert.equal(hash, row.hash);
                    next();
                });
            }).then(function(next){
                Row.destroy(hash).then(function(success){
                    assert.equal(true, success);
                    next();
                });
            }).then(function(next){
                Row.get(hash).then(function(row){
                    assert.equal(null, row);
                    done();
                });
            });
        });
    });
});
