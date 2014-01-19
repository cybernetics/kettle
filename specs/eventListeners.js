describe("EventListeners: ", function() {

    var eventListeners, context, fn, ran1, ran2, ran3, ev1, ev2, ev3;

    beforeEach(function() {
        ran1 = false;
        ran2 = false;
        ran3 = false;
        fn1 = function() { ran1 = true; };
        fn2 = function() { ran2 = true; };
        fn3 = function() { ran3 = true; };
        context = {};
        eventListeners = new Kettle.EventListeners(context);
        ev1 = _.extend({}, Backbone.Events);
        ev2 = _.extend({}, Backbone.Events);
        ev3 = _.extend({}, Backbone.Events);
    });


    describe("when adding a new eventObject", function() {
        it("binds subscriptions to the eventObject", function() {
            eventListeners.subscribe('event1', 'test', fn1);
            eventListeners.subscribe('event2', 'test', fn2);
            eventListeners.add('event1', ev1);
            eventListeners.add('event2', ev2);

            ev1.trigger('test');
            ev2.trigger('test');

            expect(ran1).toBe(true);
            expect(ran2).toBe(true);
        });


        it("binds a subscription with an attribute", function() {
            eventListeners.add('event', ev1);
            eventListeners.subscribe('event', 'test:foo', fn1);
            ev1.trigger('test');
            expect(ran1).toBe(false);
            ev1.trigger('test:foo');
            expect(ran1).toBe(true);
        });

    });

    describe("when an event is triggered", function() {
        it("has proper context for a backbone event", function() {
            eventListeners.add('event', ev1);
            eventListeners.subscribe('event', 'test', function() {
                expect(this).toBe(context);
            });
            ev1.trigger('test');
        });

        it("has proper context for a jquery event", function() {
            var $jq = $();
            eventListeners.add('event', $jq);
            eventListeners.subscribe('event','test', function() {
                expect(this).toBe(context);
            });
            $jq.trigger('test');
        });
    });

    describe("when removing an eventObject", function() {
        it("unbinds all subscribed events on the removed eventObject", function() {
            eventListeners.subscribe('event', 'test', fn1);
            eventListeners.subscribe('event', 'test', fn2);
            eventListeners.add('event', ev1);
            eventListeners.add('event', ev2);
            eventListeners.remove('event',ev1);
            ev1.trigger('test');
            expect(ran1).toBe(false);
            ev2.trigger('test');
            expect(ran2).toBe(true);
        });
    });

    describe("when subscribing to a new event" , function() {
        it("binds subscriptions to the eventObjects ", function() {
            eventListeners.add('event1', ev1);
            eventListeners.add('event2', ev2);

            eventListeners.subscribe('event1', 'test', fn1);
            eventListeners.subscribe('event2', 'test', fn2);

            ev1.trigger('test');
            ev2.trigger('test');

            expect(ran1).toBe(true);
            expect(ran2).toBe(true);
        });
    });

    describe("when unsubscribing from events", function() {
        it("unbinds all events", function() {
            eventListeners.subscribe('event1', 'test', fn1);
            eventListeners.subscribe('event2', 'test2', fn2);
            eventListeners.add('event1', ev1);
            eventListeners.add('event2', ev2);
            eventListeners.unsubscribe();
            ev1.trigger('test');
            ev2.trigger('test2');
            expect(ran1).toBe(false);
            expect(ran2).toBe(false);
            eventListeners.add('event1', ev3);
            ev3.trigger("test");
            expect(ran1).toBe(false);


        });

        it("unbinds all events within a group", function() {
            eventListeners.subscribe('event1', 'test', fn1);
            eventListeners.subscribe('event2', 'test2', fn2);
            eventListeners.add('event1', ev1);
            eventListeners.add('event2', ev2);
            eventListeners.unsubscribe('event2');
            ev1.trigger('test');
            ev2.trigger('test2');
            expect(ran1).toBe(true);
            expect(ran2).toBe(false);

        });

        it("unbinds all events with a specific group and event", function() {
            eventListeners.subscribe('event1', 'test', fn1);
            eventListeners.subscribe('event2', 'test', fn2);
            eventListeners.subscribe('event1', 'test1', fn3);
            eventListeners.add('event1', ev1);
            eventListeners.add('event2', ev2);
            eventListeners.add('event3', ev3);
            eventListeners.unsubscribe('event1', 'test1');
            ev1.trigger('test');
            ev2.trigger('test');
            ev3.trigger('test1');
            expect(ran1).toBe(true);
            expect(ran2).toBe(true);
            expect(ran3).toBe(false);
            ran1 = false;
            ran2 = false;
            eventListeners.unsubscribe(null, 'test');
            ev1.trigger('test');
            ev2.trigger('test');
            expect(ran1).toBe(false);
            expect(ran2).toBe(false);
        });


        it("unbinds all events with a specific attribute", function() {
            eventListeners.subscribe('event', 'test:foo', fn1, 'foo');
            eventListeners.subscribe('event', 'test', fn2);
            eventListeners.subscribe('event', 'test:bar', fn3, 'bar');
            eventListeners.add('event', ev1);
            eventListeners.unsubscribe(null, 'test:foo', null);
            ev1.trigger('test:foo');
            ev1.trigger('test');
            expect(ran1).toBe(false);
            expect(ran2).toBe(true);
            eventListeners.unsubscribe(null, 'test');
            ev1.trigger("test:bar");
            expect(ran3).toBe(true);
        });

        it("unbinds all added events from the removed subscription that match a specific function", function() {

            eventListeners.subscribe('event1', 'test', fn1);
            eventListeners.subscribe('event2', 'test', fn2);
            eventListeners.subscribe('event1','test',fn2);
            eventListeners.add('event1', ev1);
            eventListeners.unsubscribe('event1', 'test', fn1);
            ev1.trigger('test');
            expect(ran2).toBe(true);
            expect(ran1).toBe(false);
        });
    });

});
