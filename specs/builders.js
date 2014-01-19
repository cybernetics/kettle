describe("View Builder: ", function() {
    var models, view, $template, builder, fn, fn2;

    beforeEach(function() {
        models = {
            model_a : new Backbone.Model(),
            model_b : new Backbone.Model()
        };

        $template = $('<div><span data-kettle="member"></span><div data-kettle="collection"></div></div>');

        view = new Kettle.View({ el : $template});

        builder = function(params) {
            Kettle.builders.view(view, params || {}, models);
        }

        fn = function() {};
        fn2 = function() {};
    });

    it("loads up all collections matching an attribute if they are found in the collection build data", function() {
        spyOn(view , 'addElement').andCallThrough();
        builder({attr : 'data-kettle', elements : {collection : {Constructor : Kettle.CollectionView, loader : Kettle.collectionViewLoader, data : {}} } } );
        expect(view.addElement).toHaveBeenCalled();
        expect(view.addElement.mostRecentCall.args[1].el).toEqual($template.children('div[data-kettle="collection"]')[0]);
    });

    it("calls the element builder", function() {
        var data = {root: {}};
        spyOn(Kettle.elementLoader,'build');
        builder(data);
        expect(Kettle.elementLoader.build).toHaveBeenCalledWith(view,data);
    });


});

describe("Element Builder: ", function() {
    var element;
    var builder = function(params) {
        Kettle.builders.element(element, params);
    }

    var $elem;

    var fn = function() {};
    var fn2 = function() {};

    beforeEach(function() {
        $elem = $('<span></span>');
        element = new Kettle.Element({ el : $elem});
    });

    it("extends the view element object", function() {
        builder({unknown: { a : 'x' }});
        expect(element.a).toBe('x');
    });

    it("apply the model subscriptions to the element", function() {
        spyOn(element,'subscribe');
        builder({ bindings : [{name: 'a.x', event: 'event', fn: fn },{name: 'b.y', event: 'event2', fn: fn2 }] });
        expect(element.subscribe).toHaveBeenCalledWith('a.x','event',fn);
        expect(element.subscribe).toHaveBeenCalledWith('b.y','event2',fn2);
    });

    it("replaces the placeholder of an attribute with the elements name", function() {
        element.name = 'foo';
        spyOn(element,'subscribe');
        builder({ bindings : [{name: 'bar', event: 'event', fn: fn, attribute: '{name}' }] });
        expect(element.subscribe).toHaveBeenCalledWith('bar','event:foo',fn);

    });

    it("calls the setup methods", function() {
        var ran = [];
        var setup1 = function() {
            ran.push(1);
            expect(this).toBe(element);
        }

        var setup2 = function() {
            ran.push(2);
            expect(this).toBe(element);
        }

        builder({setup: [setup1,setup2]});
        expect(ran).toEqual([1,2]);
    });

});

describe("DomValue Builder: ", function() {
    var domValue;
    var builder = function(params) {
        Kettle.builders.domValue(domValue, params);
    }

    var $elem;

    var fn = function() {};
    var fn2 = function() {};

    beforeEach(function() {
        $elem = $('<input></input>');
        domValue = new Kettle.DomValue({ el : $elem});
        jasmine.Clock.useMock();
    });

    it("applies the 2-way bindings", function() {
        var model = new Backbone.Model();
        domValue.set('model', model);

        builder({bind : {
            eventObject: 'model',
            attribute: 'foo',
            domEvent: 'change'
        }});

        model.set('foo', 'bar');

        expect(domValue.$el.val()).toBe('bar');

        model.set('foo', undefined);
        expect(domValue.$el.val()).toBe('');

        model.set('foo', null);
        expect(domValue.$el.val()).toBe('');
        jasmine.Clock.tick(5);
        domValue.$el.val('foo').trigger('change');
        expect(model.get('foo')).toBe('foo');
    });

    it("replace the placeholder with domValues name", function() {
        var model = new Backbone.Model();
        domValue.set('model', model);

        domValue.name = 'foo';
        builder({bind : {
            eventObject: 'model',
            attribute: '{name}',
            domEvent: 'change'
        }});

        model.set('foo', 'bar');

        expect(domValue.$el.val()).toBe('bar');
        jasmine.Clock.tick(5);
        domValue.$el.val('foo').trigger('change');
        expect(model.get('foo')).toBe('foo');
    });

    it("2-way binds on the event passed in", function() {
        var model = new Backbone.Model();
        domValue.set('model', model);

        builder({bind : {
            eventObject: 'model',
            attribute: 'foo',
            domEvent: 'keyup'
        }});

        model.set('foo', 'bar');

        expect(domValue.$el.val()).toBe('bar');
        jasmine.Clock.tick(5);
        domValue.$el.val('foo').trigger('keyup');
        expect(model.get('foo')).toBe('foo');
    });

});

describe("CollectionView Builder: ", function() {
    var collectionView;
    var builder = function(params) {
        Kettle.builders.collectionView(collectionView,params);
    };

    var $elem;
    var fn = function() {};

    beforeEach(function() {
        $elem = $('<div></div>');
        collectionView = new Kettle.CollectionView({ el : $elem});
    });

    it("attaches the view events", function () {
        spyOn(collectionView, 'subscribeViews');
        builder({eventsviews: [
            {name: 'view', event: 'a', fn: fn, attribute: 'b'}
        ]});

        expect(collectionView.subscribeViews).toHaveBeenCalledWith('view','a:b', fn);

    });

    it("creates a view given a constructor", function() {
        var View = Kettle.View.extend({el : "<div></div>"});
        var model = new Backbone.Model();
        var collection = new Backbone.Collection();

        collectionView.set('collection', collection);
        builder({subviews: {View: View, model: 'foo', collection: 'collection'}});
        collection.add(model);
        var view = collectionView.last();
        expect(view instanceof View).toBe(true);
        expect(view.eventObjects.foo).toBe(model);

    });

    it("sets the empty view", function() {
        spyOn(collectionView, 'setEmptyView');
        var view = new Kettle.View($("<div></div>")[0]);
        builder({ subviews : {empty: view}});
        expect(collectionView.setEmptyView).toHaveBeenCalledWith(view);
    });
});

describe("ContainerView Builder: ", function() {
    var containerView;
    var builder = function(params) {
        Kettle.builders.containerView(containerView,params);
    };

    var $elem;
    var fn = function() {};

    beforeEach(function() {
        $elem = $('<div></div>');
        containerView = new Kettle.ContainerView({ el : $elem});
    });

    it("attaches the view events", function () {
        spyOn(containerView, 'subscribeViews');
        builder({eventsviews: [
            {name: 'view', event: 'a', fn: fn, attribute: 'b'}
        ]});

        expect(containerView.subscribeViews).toHaveBeenCalledWith('view','a:b', fn);
    });
});
