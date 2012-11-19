"use strict";

var express = require("express"),
    winston = require("winston"),
    Row = require("../models");

var app = module.exports = express();


// Configuration

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.configure("development", function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function(){
    app.use(express.errorHandler());
});

module.exports = app;


// Setup logger

winston.loggers.add("app", {
    console: {
        'level': "error",
        'timestamp': true,
        'colorize': true
    }
});

var log = winston.loggers.get("app");


// Routes

app.post("/", function(req, res){
    Row.create(req.body.hash).then(function(row){
        res.json(row);
    });
});

app.get("/:hash", function(req, res){
    Row.get(req.params.hash).then(function(row){
        res.json(row);
    });
});

app.del("/:hash", function(req, res){
    Row.destroy(req.params.hash).then(function(success){
        res.json({
            'success': success
        });
    });
});

app.get("/health-check", function(req, res){
    res.json({'ok': "yeah"});
});
