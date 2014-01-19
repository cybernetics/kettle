describe("When extending an Element" , function() {
    it ("accepts a selector as the el", function() {
        var E = Kettle.Element.extend({el : 'body'});
        expect((new E).el).toBe(document.body);
    });

    it("accepts a function as a el", function() {
        var E = Kettle.Element.extend({el : function() { return document.body} });
        expect((new E).el).toBe(document.body);
    });

    it("accepts html as the el", function() {
        var html = "<div><span></span></div>"
        var E = Kettle.Element.extend({el : html });
        expect((new E).el.innerHTML).toBe("<span></span>");
    });

    it("clones the el if its a script tag", function() {
        var el = function() {return $("<script><div><span></span></div></script>")};
        var E = Kettle.Element.extend({el : el});
        var e = new E;
        expect(e.el.innerHTML).toBe(el().html());
        expect(e.el).not.toBe(el[0]);
    });

    it("extends the prototype with parameters not used by the parser", function() {
        var E = Kettle.Element.extend({foo : 'bar'});
        expect(E.prototype.foo).toBe('bar');

    });
});

describe("When constructing an element", function() {
    it("uses the passed in element instead of the element on the constructor, if one is passed in", function() {
        var el = 'body';
        var el2 = "<div></div>";

        var E = Kettle.Element.extend({el: el});
        var e = new E({el : el2});
        expect(e.el.tagName).toBe("DIV");
    });

    it("creates a new event type if an event is passed in as plain object", function() {
        var E = Kettle.Element.extend({eventTypes: {collection: Backbone.Collection}});
        var e = new E({collection: [{foo : 'bar'},{bar: 'foo'}]});
        var c = e.eventObjects.collection;
        expect(c instanceof Backbone.Collection).toBe(true);
        expect(c.models[0].get('foo')).toBe('bar');
        expect(c.models[1].get('bar')).toBe('foo');
    });

    it("provides a default el if none is given", function() {
        var E = Kettle.Element.extend();
        var e = new E();
        expect(e.el.innerHTML).toBe('');
        expect(e.el.tagName).toBe('DIV');
    });

    it("loads the state model", function() {
        var E = Kettle.Element.extend({state : {foo: 'bar'}});
        var e = new E();
        expect(e.eventObjects.state instanceof Backbone.Model).toBe(true);
        expect(e.eventObjects.state.get('foo')).toBe('bar');
    });

    it("extends the state model with the original one if passed in a plain object", function() {
        var E = Kettle.Element.extend({state : {foo : 'bar'}});
        var e = new E({state: {bar : 'foo'}});
        expect(e.eventObjects.state.get('foo')).toBe('bar');
        expect(e.eventObjects.state.get('bar')).toBe('foo');
    });

    it("calls the initialization method with the passed in arguments", function() {
        var ran = false;
        var E = Kettle.Element.extend({initialize: function(obj) {
            ran = true;
            expect(obj.foo).toBe('bar');
        }});

        var e = new E({foo: 'bar'});
        expect(ran).toBe(true);

    });

    it("sets addtional event Objects via the eventObjects option", function() {
        var E = Kettle.Element.extend();
        var model = new Backbone.Model();
        var e = new E({eventObjects: {foo : model}});
        expect(e.eventObjects.foo).toBe(model);
    });

    it("renders the element", function() {
        var old = Kettle.Element.prototype.render;
        spyOn(Kettle.Element.prototype, 'render');
        var E = Kettle.Element.extend();
        var e = new E();
        expect(Kettle.Element.prototype.render).toHaveBeenCalled();
        Kettle.Element.prototype.render = old;
    });

    it("does not render the element if render option is set to false", function() {
        var old = Kettle.Element.prototype.render;
        spyOn(Kettle.Element.prototype, 'render');
        var E = Kettle.Element.extend();
        var e = new E({render : false});
        expect(Kettle.Element.prototype.render).not.toHaveBeenCalled();
        Kettle.Element.prototype.render = old;
    });
});


