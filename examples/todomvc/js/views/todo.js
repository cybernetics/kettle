/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
    'use strict';

    app.TodoView = Kettle.View.extend({
        el: '#todoitem-template',
        model : app.Todo ,
        state : { "editing" : false },
        "model.change:completed" : function(model, completed) {
            this.$el.toggleClass('completed', completed);
        },
        "model.destroy" : function() {
            this.remove();
        },
        "state.change:editing" : function(model, v) {
            this.$el.toggleClass('editing',v);
        },
        elements: {
            "label" : {
                bind: {attribute: 'title'},
                "el.dblclick" : function() {
                    this.state.set('editing', true);
                }
            },

            "delete" : {
                "el.click" : function() {
                    this.model.destroy();
                }
            },

            "completed" : {
                bind: { attribute: 'completed'}
            },

            "input" : {
                bind: {attribute: 'title'},
                submit : function() {
                    this.state.set('editing', false);
                    if (this.val().trim() === '') this.model.destroy();
                },
                "el.blur" : function() {
                    this.submit();
                },
                "el.keypress" : function(e) {
                    if ((e.keyCode || e.which) == ENTER_KEY) {
                        this.submit();
                    }
                },
                "state.change:editing": function(state, editing) {
                    if (editing) {
                        this.$el.focus();
                        this.$el.val(this.$el.val());
                    }
                }
            }
        }
    });
})(jQuery);
