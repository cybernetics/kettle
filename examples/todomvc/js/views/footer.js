/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
    'use strict';

    app.FooterView = Kettle.View.extend({
        el: '#footer-template',
        collection : app.Todos,
        elements : {
            "items_left" : {
                template: true,
                serialize : function() {
                    return {remaining : this.collection.remaining().length};
                },
                "collection{add remove change:completed reset}" : function() {
                    this.render();
                }
            },

            "completed" : {
                "collection{add remove change:completed reset}" : function() {
                    this.val(this.collection.completed().length);
                }
            },

            "filters" : {
                "app.change:filter" : function(model, v) {
                    this.$el.find('a').each(function() {
                        $(this).toggleClass('selected', $(this).is('[href="#/' + (v || '') + '"]'));
                    });
                }
            },

            "clear_completed" : {
                "collection{add remove change:completed reset}" : function() {
                    this.$el.toggle(!!this.collection.completed().length);
                },
                 "el.click" : function(e) {
                     _.invoke(this.collection.completed(), 'destroy');
                 }
            }
        }
    });
})(jQuery);
