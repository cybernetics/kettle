/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	app.TodosView = Kettle.View.extend({
		el : '#todoapp',
		collection : app.Todos,
		elements: {
			"list": { subviews: app.TodoView },

			"footer" : {
				 subview : app.FooterView,
				 "collection[add remove reset]" : function(model) {
					this.$el.toggle(this.collection.models.length > 0);
				}
			},

			"new_todo" : {
				"el.keyup" : function(e) {
					if ((e.keyCode || e.which) == 13 && this.val().trim() !== '') {
						this.collection.add({
							title: this.val()
						});
						this.val('');
					}
				}
			},

			"check_all" : {
				"collection[add remove reset]" : function(model) {
					this.$el.toggle(this.collection.models.length > 0);
				},
				"collection[add remove change:completed reset]" : function(model) {
					this.val(this.collection.completed().length === this.collection.length);
				},
				"el.change" : function() {
					var done = this.val();
					this.collection.each(function(model) {
						model.set('completed', done);
					});
				}
			}
		 }
	});
})(jQuery);