/*global Backbone */
var app = app || {};

(function () {
    'use strict';

    // Todo Router
    // ----------
    var Workspace = Backbone.Router.extend({
        routes: {
            '*filter': 'setFilter'
        },

        setFilter: function (param) {
            app.AppModel.set('filter', param || '');
        }
    });

    app.TodoRouter = new Workspace();
})();
