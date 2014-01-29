/*global $ */
/*jshint unused:false */
var app = app || {};
var ENTER_KEY = 13;

app.AppModel = new Backbone.Model({filter: ''});
Kettle.setGlobal({app : app.AppModel});    

$(function () {
    'use strict';

    var t = performance.now();
    app.view = new app.TodosView({collection: app.todos});
    app.todos.fetch({reset : true});
    $('#app').append(app.view.$el);
    Backbone.history.start();
    console.log(performance.now() -t);

});
