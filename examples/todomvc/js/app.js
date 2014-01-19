/*global $ */
/*jshint unused:false */
var app = app || {};
var ENTER_KEY = 13;

app.AppModel = new Backbone.Model({filter: null});
Kettle.setGlobal({app : app.AppModel});	
Backbone.history.start();

$(function () {
	'use strict';
	
	app.view = new app.TodosView({collection: app.todos});
	app.todos.fetch({reset : true});

});
