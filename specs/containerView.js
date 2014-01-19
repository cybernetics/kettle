describe("ContainerView: ", function () {
    var containerView, child, $template, $templatechild;

    beforeEach(function() {
        $template = $("<div></div>");
        $templatechild = $("<div></div>");
        containerView = new Kettle.ContainerView({el: $template});
        child = new Kettle.View({el : $templatechild});
        containerView.setSubView(child);
    });

    describe("when setting a new view to the  containerView", function() {
        it("removes and destroys the current view if one is set", function() {
            var newchild = new Kettle.View({el : $templatechild});

            spyOn(child, 'remove');
            containerView.setSubView(newchild);
            expect(child.remove).toHaveBeenCalled();
            expect(containerView.subview).toBe(newchild);
        });

        it("inserts the new view into the body of the main element", function() {
            expect(child.$el[0]).toEqual(containerView.$el.children()[0]);
        });

        it("adds the view to the subscribed events", function() {
            var ran = false;
            var newchild = new Kettle.View({el : $templatechild});
            var model = new Backbone.Model();
            newchild.set('model', model);

            containerView.subscribeViews('model', 'test', function(m) {
                ran = true;
                expect(m).toBe(model);
            });
            containerView.setSubView(newchild);
            model.trigger('test', model);
            expect(ran).toBe(true);
        });

        it("bootstraps the view subscriptions ", function() {
            var result = false;
            containerView.subscribeViews('model', 'change', function(model, options) {
                if (options.bootstrap) result = true;
            });
            var model = new Backbone.Model();
            child.set('model', model);
            containerView.setSubView(child);
            expect(result).toBe(true);
        });

        it("unsubscribes from the old view and moves those subscriptions to the new view", function() {
            var newchild = new Kettle.View({el : $templatechild});
            var ran = false;
            containerView.subscribeViews('view', 'test', function() {
                ran = true;
            });
            child.trigger('test');
            expect(ran).toBe(true);
            ran = false;
            containerView.setSubView(newchild);
            child.trigger('test');
            expect(ran).toBe(false);
            newchild.trigger('test');
            expect(ran).toBe(true);
        });
    });

    describe("when setting a new synced view to the containerView", function() {
        var o1, o2, newchild;

        beforeEach(function() {
            o1 = _.extend({}, Backbone.Events);
            o2 = _.extend({}, Backbone.Events);
            newchild = new Kettle.View({el : $templatechild});

            containerView.set('o1', o1);
            containerView.set('o2', o2);


        });

        it("copies over the event objects from the parentview", function() {
            containerView.setSubView(newchild, true);
            expect(containerView.eventObjects.o1).toBe(newchild.eventObjects.o1);
            expect(containerView.eventObjects.o2).toBe(newchild.eventObjects.o2);
            expect(containerView.eventObjects.el).not.toBe(newchild.eventObjects.el);
        });

        it("sets an eventobject on the child view when one is set on the parentview", function() {
            containerView.setSubView(newchild, true);
            var o3 = _.extend({}, Backbone.Events);
            containerView.set('02', o3);
            expect(containerView.eventObjects.o3).toBe(newchild.eventObjects.o3);
        });

    });

    describe("when emptying the containerView", function() {
        it("destroys any added view", function() {
            spyOn(child, 'remove');
            containerView.empty();
            expect(child.remove).toHaveBeenCalled();
        });


        it("unsubscribes from all view subscriptions", function() {
            var result = true;
            containerView.subscribeViews('view', 'test', function() {
                result = false;
            });
            containerView.empty();
            child.trigger('test');
            expect(result).toBe(true);
        });

    });

});
