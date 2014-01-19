describe("Event Interface: ", function() {
    var e = Kettle.EventInterface, model, context = {}, result, incResult = function() {result++};

    beforeEach(function() {
        model = new Backbone.Model();
        result = 0;
    })

    describe("when binding an event", function() {
        var fn = function() {
            incResult();
            expect(context).toBe(this);
        }

        it("binds a Backbone Event", function() {
            var ev = _.extend({}, Backbone.Events);
            e.bindEvent(ev, context, 'test', fn);
            ev.trigger('test');
            expect(result).toBe(1);

        });

        it("binds a Backbone Event with an attribute", function() {
            var ev = _.extend({}, Backbone.Events);
            e.bindEvent(ev, context, 'test', fn, 'attr');
            ev.trigger('test:attr');
            expect(result).toBe(1);

        });

        it("binds a $ event", function() {
            var ev = $(document.body);
            e.bindEvent(ev, context, 'test', fn);
            ev.trigger('test');
            expect(result).toBe(1);
            ev.off();
        });
    });

    describe("when unbinding an event", function() {

        it("unbinds a Backbone event", function() {
            spyOn(Backbone.Events,'off').andCallThrough();
            var ev = _.extend({}, Backbone.Events);
            e.bindEvent(ev, context, 'test', incResult); 
            e.unbindEvent(ev, context, 'test', incResult);
            ev.trigger('test');
            expect(result).toBe(0);
            expect(Backbone.Events.off).toHaveBeenCalledWith('test', incResult, context);
        });

        it("unbinds a Backbone event with an attribute", function() {
            var ev = _.extend({}, Backbone.Events);
            e.bindEvent(ev, context, 'test', incResult, 'attr'); 
            e.unbindEvent(ev, context, 'test', incResult, 'attr');
            ev.trigger('test:attr');
            expect(result).toBe(0);
        });

        it("unbinds a $ event", function() {
            var ev = $(document.body);
            e.bindEvent(ev, context, 'test', incResult);
            e.unbindEvent(ev, context, 'test', incResult);
            ev.trigger('test');
            expect(result).toBe(0);
        });

        it("uses a $ event with context", function() {
            var ev = $(document.body);
            var c1 = {}, c2 = {};
            e.bindEvent(ev,c1, 'test', incResult);
            e.bindEvent(ev,c2, 'test', incResult);

            ev.trigger('test');
            expect(result).toBe(2);

            e.unbindEvent(ev, c1, 'test', incResult);
            ev.trigger('test');
            expect(result).toBe(3);
        })
    });

    describe("when bootstrapping", function() {
        it("calls all model.change events ", function() {
            var fn = function(m, options) {
                result++;
                expect(m).toBe(model);
                expect(this).toBe(context);
                expect(options.bootstrap).toBe(true);
            };

            e.bootstrap(model, context, {change : [{fn: fn},{fn: incResult, attribute : "attr"}]} );
            expect(result).toBe(2);

        });

        it("calls all model.change:attribute events", function() {
            model.set("attr", "value");
            var fn = function(m, value, options) {
                result++;
                expect(m).toBe(model);
                expect(this).toBe(context);
                expect(options.bootstrap).toBe(true);
                expect(value).toBe("value");
            };

            e.bootstrap(model, context, {change : [{fn: fn, attribute : "attr"}]} );
            expect(result).toBe(1);

        });

        it("calls all model.add events", function() {
            var collection = new Backbone.Collection();
            collection.add(model);

            var fn = function(m, c, options) {
                result++;
                expect(m).toBe(model);
                expect(this).toBe(context);
                expect(c).toBe(collection);
                expect(options.bootstrap).toBe(true);
            }

            e.bootstrap(model, context, {add: [{fn: fn}]})
            expect(result).toBe(1);
        });

        it("calls all model.all events", function() {
            var fn = function(event, m, options) {
                result++;
                expect(m).toBe(model);
                expect(this).toBe(context);
                expect(event).toBe('change');
                expect(options.bootstrap).toBe(true);
            }

            e.bootstrap(model, context, {all: [{fn: fn}]})
            expect(result).toBe(1);

        });

        it("calls all collection.reset events", function() {
            var collection = new Backbone.Collection();
            collection.add(model);

            var fn = function(c, options) {
                result++;
                expect(c).toBe(collection);
                expect(this).toBe(context);
                expect(options.bootstrap).toBe(true);
            }

            e.bootstrap(collection, context, {reset : [{fn: fn}]});
            expect(result).toBe(1);

        });

        it("calls all collection.all events", function() {
           var collection = new Backbone.Collection();
            collection.add(model);

            var fn = function(ev, c, options) {
                result++;
                expect(ev).toBe('reset');
                expect(c).toBe(collection);
                expect(this).toBe(context);
                expect(options.bootstrap).toBe(true);
            }

            e.bootstrap(collection, context, {all : [{fn: fn}]});
            expect(result).toBe(1);


        });

        it("calls all route events of the active route", function() {
            var router = new (Backbone.Router.extend({
                routes : {
                    "test/:p1/:p2" : "testRoute"
                }
            }));
            Backbone.history.start();
            router.navigate('test/foo/bar', {trigger: true});

            var fn = function(r, route, params) {
                result++;
                expect(r).toBe(router);
                expect(route).toBe('testRoute');
                expect(params).toEqual(['foo','bar']);
                expect(this).toBe(context);
            }

            e.bootstrap(router, context, {route: [{fn: fn}]});
            expect(result).toBe(1);
            Backbone.history.stop();
        });

        it("calls route events of active route with attribute", function() {
             var router = new (Backbone.Router.extend({
                routes : {
                    "test/:p1/:p2" : "testRoute"
                }
            }));
            Backbone.history.start();
            router.navigate('test/foo/bar', {trigger: true});

            var fn = function(a, b) {
                result++;
                expect(a).toBe('foo');
                expect(b).toBe('bar');
                expect(this).toBe(context);
            }

            e.bootstrap(router, context, {route: [{fn: fn, attribute: "testRoute"}]});
            expect(result).toBe(1);
            Backbone.history.stop()

        });
    });
});
