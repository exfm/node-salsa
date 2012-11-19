"use strict";

var when = require("when"),
    sequence = require("sequence"),
    dynamo = require("dynamo");

var client,
    db,
    tableNames = {
        'row': "Row"
    },
    tables = {};

var Row = {};

// Global connection
Row.connect = function(){
    // Hard coded to use Magneto for now
    client = dynamo.createClient();
    client.useSession = false;
    db = client.get("us-east-1");

    // Settings for Magneto
    db.host = "localhost";
    db.port = process.env.MAGNETO_PORT || 8080;

    Object.keys(tableNames).forEach(function(name){
        tables[name] = db.get(tableNames[name]);
    });
    Row.tables = tables;
    Row.db = db;
};

// Create a Row object.
Row.create = function(hash){
    var d = when.defer(),
        row = {
            'hash': hash,
            'created': Date.now()
        };
    tables.row.put(row).save(function(err, data){
        if(!d.rejectIfError(err)){
            d.resolve(row);
        }
    });
    return d.promise;
};

// Get a Row object by hash
Row.get = function(hash){
    var d = when.defer();
    tables.row.get({'hash': hash}).fetch(function(err, data){
        if(!d.rejectIfError(err)){
            if(data === undefined){
                data = null;
            }
            d.resolve(data);
        }
    });
    return d.promise;
};

// Destroy a Row object.
Row.destroy = function(hash){
    var d = when.defer();
    tables.row.get({'hash': hash})
        .destroy(function(err){
        if(!d.rejectIfError(err)){
            return d.resolve(true);
        }
        return d.resolve(false);
    });
    return d.promise;
};

Row.tables = tables;
module.exports = Row;
