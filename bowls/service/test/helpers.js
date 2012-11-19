"use strict";

var covRequire = function(s){
    if(process.env.COVERAGE){
        s = s.replace("lib", "lib-cov");
    }
    return require(s);
};

var Row = covRequire("../lib/models"),
    when = require("when"),
    sequence = require("sequence"),
    assert = require("assert");

var db;


Row.connect();
db = Row.db;


var RowSchema = {
    'hash': String
};

var schemasByName = {
    'Row': RowSchema
};

module.exports.schemasByName = schemasByName;

module.exports.ensureTable = function(tableName){
    var d = when.defer();
    if(!schemasByName[tableName]){
        assert.fail("No schema defined for " + tableName);
    }
    sequence().then(function(next){
        // List tables
        db.listTables({}, function(err, data){
            assert.ifError(err);
            next(data);
        });
    }).then(function(next, data){
        // If table name not present, create with schema.
        if(data.TableNames.indexOf(tableName) === -1){
            db.add({
                'name': tableName,
                'schema': schemasByName[tableName],
                'throughput': {
                    'read': 10,
                    'write': 10
                }
            }).save(function(err, table){
                assert.ifError(err);
                d.resolve();
            });
        }
        else{
            d.resolve();
        }
    });
    return d.promise;
};

module.exports.createRow = function(hash){
    var d = when.defer();
    Row.create(hash).then(function(row){
        d.resolve(row);
    }, function(err){
        d.reject(err);
    });
    return d.promise;
};

var getAllRows = function(){
    var d = when.defer();
    Row.tables.row.scan().fetch(function(err, data){
        if(err){
            return d.reject(err);
        }
        d.resolve(data);
    });
    return d.promise;
};
module.exports.getAllRows = getAllRows;

module.exports.destroyAllRows = function(){
    var d = when.defer();

    sequence(this).then(function(next){
        getAllRows().then(next);
    }).then(function(next, rows){
        if(rows.length === 0){
            return d.resolve();
        }
        var promises,
            hashes = rows.map(function(c){
                return c.hash;
            });

        promises = hashes.map(function(hash){
            return Row.destroy(hash);
        });

        when.all(promises, function(){
            d.resolve();
        });
    });
    return d.promise;
};

// Async test helper
// If our test throws an exception, in the module code or a failed assertion,
// `done` will never be called and will get a test timeout instead of seeing
// the actual error or assertion failure.
// This just wraps our assertion logic (`func`) in a try catch and manages
// `done` for us.
module.exports.test = function(func, done){
    try{
        func.apply(this);
        done();
    }
    catch(e){
        done(e);
    }
};
