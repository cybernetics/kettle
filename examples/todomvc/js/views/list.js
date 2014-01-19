/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
	'use strict';

	// The Application
	// ---------------
	app.TodosListView = Kettle.SubViews.extend({
		collection : app.Todos,
		/*"#change:filter" : function(model, v) {
			var factive = v === 'active', fcompleted = v === 'completed';

			if (factive || fcompleted) {
				_.each(this.views, function(view) { 
					var completed = view.models.model.get('completed');
					view.toggle(fcompleted && completed || factive && !completed);
				});
			} else {
				_.invoke(this.views, 'show');
			}
		},*/
		"@add addItem" : function(model) {
			var view = new app.TodoView({model: model});
			this.addView(view);
			if (Kettle.App.get('filter') === 'completed') view.hide();
		},
		"@reset" : function(models) {
			this.empty().collection.each(this.addItem, this);
		}
	});
})(jQuery);
