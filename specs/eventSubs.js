describe("Event subscriptions", function() {

    var subs, obj, context, result, $jq, incResult = function() {result++};

    beforeEach(function() {
        context = {};
        obj = _.extend({}, Backbone.Events);
        subs = new Kettle.EventSubs(context, obj);
        result = 0;
        $jq = $(document);
    });

    describe("when adding a new event", function() {
        it ("adds a new event on the owned object", function() {
            subs.add('test', incResult);
            obj.trigger('test');
            expect(result).toBe(1);
        });

        it("adds a new event with an attribute on the owned object", function() {
            subs.add('test', incResult, 'attribute');
            obj.trigger('test:attribute');
            expect(result).toBe(1);
        });

        it("registers an event even if no object is owned", function() {
            var new_obj = _.extend({}, Backbone.Events);

            subs.add('test', incResult);
            subs.set(null);
            obj.trigger('test');
            expect(result).toBe(0);

            subs.set(new_obj);
            new_obj.trigger('test');
            expect(result).toBe(1);
        });
    });

    describe("when an event is triggered", function() {
        it("has proper context for a backbone event", function() {
            subs.set(obj);
            subs.add('test', function() {
                expect(this).toBe(context);
            });
            obj.trigger('test');
        });

        it("has proper context for a jquery event", function() {
            subs.set($jq);
            subs.add('test', function() {
                expect(this).toBe(context);
            });
            $jq.trigger('test');
        });
    });

    describe("when binding all subscriptions", function() {
        beforeEach(function () {
            subs.add("test", incResult);
            subs.add("test2", incResult);
            subs.add("test3", incResult);
        });

        it("binds all events registered", function() {
            subs.unbindAll();
            obj.trigger("test test2 test3");
            expect(result).toBe(0);
            subs.bindAll();
            obj.trigger("test test2 test3");
            expect(result).toBe(3);
        });

        it("does not double bind events", function() {
            subs.bindAll().bindAll();
            obj.trigger("test test2 test3");
            expect(result).toBe(3);
        });
    });

    describe("when setting a new object", function() {
        var new_obj;
        beforeEach(function() {
            new_obj = _.extend({}, Backbone.Events);
        });

        it("transfers all events given a new event object", function() {
            subs.add("test", incResult);
            subs.add("test2", incResult);
            subs.set(new_obj);
            new_obj.trigger("test test2");
            expect(result).toBe(2);
        });

        it("keeps events unbound if the subscriptions are in an unbound state", function() {
            subs.add("test", incResult);
            subs.add("test2", incResult);
            subs.unbindAll();
            subs.set(new_obj);
            new_obj.trigger("test test2");
            expect(result).toBe(0);
        });
    });

    describe("when removing events", function() {
        it("removes all events from the subscriptions", function() {
            subs.add("test", incResult);
            subs.remove();
            subs.bindAll();
            obj.trigger("test");
            expect(result).toBe(0);
        });

        it("removes a specific event", function() {
            subs.add("test", incResult);
            subs.add("test2", incResult);
            subs.add("test3", incResult, "one");
            subs.remove("test");
            obj.trigger("test2");
            obj.trigger("test3:one");
            expect(result).toBe(2);
        });

        it("removes a specific event with attribute", function() {
            subs.add("test", incResult, "one");
            subs.add("test", incResult);
            subs.remove("test", null, "one");
            obj.trigger("test:one");
            obj.trigger("test");
            expect(result).toBe(1);
        });


        it("removes a specific function", function() {
            var fn = function() {incResult()};
            subs.add("test", fn);
            subs.add("test", incResult);
            subs.remove(null, incResult);
            obj.trigger("test");
            expect(result).toBe(1);
        });
    });


    describe("when unbinding events", function() {
        it("unbinds all bound events", function() {
            subs.add("test", incResult);
            subs.add("test2", incResult);
            subs.bindAll();
            obj.trigger("test test2");
            expect(result).toBe(2);
            subs.unbindAll();
            obj.trigger("test test2");
            expect(result).toBe(2);
        });
    });
});
