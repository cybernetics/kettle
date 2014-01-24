describe("View Parser:  ", function() {
    var parse = function(param) {
        var p = Kettle.parsers.view(param);
        delete p.defaults;
        return p;
    }

    var fn = function() {};

    it("assigns the attribute", function() {
        expect(parse({ 
            attr : "id"
        })).toEqual({
            attr : "id"
        });
    });

    it("assigns a default attribute if one is missing", function() {
        expect(parse({}))
            .toEqual({ attr: Kettle.defaultAttr})
    });


    it("flattens elements", function() {
        expect(parse({
            elements : {
                "a b c" : { ext : 1 },
                "b" : { ext : 2 }
            }
        })).toEqual({
            attr: Kettle.defaultAttr,
            elements: {
                a: { Constructor: Kettle.DomValue, loader: Kettle.domValueLoader, data : {unknown : { ext : 1 } }},
                b: { Constructor: Kettle.DomValue, loader: Kettle.domValueLoader, data : {unknown : { ext : 2 } }},
                c: { Constructor: Kettle.DomValue, loader: Kettle.domValueLoader, data : {unknown : { ext : 1 } }}
            }
        });
    });

    it("flattens elements with non-conflicting objects", function() {
        expect(parse({
            elements : {
                "a b c" : { 'a.b' : fn, 'foo' : 'bar'},
                "b c" : { 'a.b' : fn },
                "b" : {'a.b' : fn},
                "a" : {subviews : true, '*subview.a' : fn},
                "c a" : {'*subview.a' : fn},
                "d a" : {subviews : true, '*subview.a' : fn},
                "a d" : {'*subview.b' : fn}
            }
        })).toEqual({
            attr : 'data-kettle',
            elements : {
                a : {
                    Constructor: Kettle.CollectionView,
                    loader: Kettle.collectionViewLoader,
                    data : {
                        bindings : [ { name : 'a', event : 'b', fn : fn, attribute : undefined } ],
                        unknown : { foo : 'bar' },
                        eventsviews : [
                            { name : 'subview', event : 'a', fn : fn, attribute : undefined },
                            { name : 'subview', event : 'a', fn : fn, attribute : undefined },
                            { name : 'subview', event : 'b', fn : fn, attribute : undefined },
                            { name : 'subview', event : 'a', fn : fn, attribute : undefined }
                        ],
                        subviews : {}
                    }
                },
                b : {
                    Constructor: Kettle.DomValue,
                    loader: Kettle.domValueLoader,
                    data: {
                        bindings : [
                            { name : 'a', event : 'b', fn : fn, attribute : undefined },
                            { name : 'a', event : 'b', fn : fn, attribute : undefined },
                            { name : 'a', event : 'b', fn : fn, attribute : undefined }
                        ],
                        unknown : { foo : 'bar' }
                    }
                },
                c : {
                    Constructor: Kettle.DomValue,
                    loader: Kettle.domValueLoader,
                    data: {
                        bindings : [
                            { name : 'a', event : 'b', fn : fn, attribute : undefined },
                            { name : 'a', event : 'b', fn : fn, attribute : undefined }
                        ],
                        unknown : { foo : 'bar' },
                        eventsviews : [ { name : 'subview', event : 'a', fn : fn, attribute : undefined } ]
                    }
                },
                d : {
                    Constructor: Kettle.CollectionView,
                    loader: Kettle.collectionViewLoader,
                    data : {
                        eventsviews : [
                            { name : 'subview', event : 'a', fn : fn, attribute : undefined },
                            { name : 'subview', event : 'b', fn : fn, attribute : undefined }
                        ],
                        subviews : {}
                    }
                }
            } 
        });
    });

    it("throws an error when unable to flatten properties", function() {
        expect(function() {
            parse({ elements :{
                "a b c" : {
                    foo : 'foo'
                },
                "b c" : {
                    foo: 'bar'
                }
            }});
        }).toThrow();
    });

    it("provides the correct loaders and constructors based on element parameters", function() {
        expect(parse({elements: { el1: {}, el2: {subviews : {}}, el3: {subview : {}}, el4: {template: true}}}))
            .toEqual({ attr : 'data-kettle',
                elements : {
                    el1 : {
                        Constructor: Kettle.DomValue,
                        loader: Kettle.domValueLoader,
                        data : {}
                    },
                    el2 : {
                        Constructor: Kettle.CollectionView,
                        loader : Kettle.collectionViewLoader,
                        data : {subviews : {model : 'model', collection : 'collection' }}
                    },
                    el3 : {
                        Constructor: Kettle.ContainerView,
                        loader: Kettle.containerViewLoader,
                        data: {subview : {synced: true}}
                    },
                    el4 : {
                        Constructor : Kettle.TemplateView,
                        loader: Kettle.templateViewLoader,
                        data: {template: true}
                    }
                }
            });

    });

    it("seperates the unknown parameters", function() {
        expect(_.omit(parse({ foo : 'bar', bar : 'foo', "dot.notation" : 'foo', "bracket[notation]" : 'bar'}), 'bindings'))
            .toEqual({attr: Kettle.defaultAttr, unknown : { foo : 'bar', bar : 'foo'}})
    });

    it("calls the element parser", function() {
        var data = {};
        spyOn(Kettle.elementLoader,'parse').andCallThrough();
        parse(data);
        expect(Kettle.elementLoader.parse).toHaveBeenCalledWith(data);
    });

    it("accepts constructors as elements", function() {
        var Constructor = Kettle.View.extend();
        expect(parse({ elements: {cons : Constructor}}))
            .toEqual({ attr : 'data-kettle', elements : { cons : { Constructor : Constructor } } });
    });

});

describe("Element parsers: ", function() {

    var fn = function() {};
    var parse = function(param, groups) {
        return Kettle.parsers.element(param,groups);
    }

    it("bind model events", function() {
        expect(parse({"x.a" : [fn,fn], "x.a y.b y.c" : fn}))
            .toEqual({
                bindings : [ 
                    { name : 'x', event : 'a', fn : fn },
                    { name : 'x', event : 'a', fn : fn },
                    { name : 'x', event : 'a', fn : fn },
                    { name : 'y', event : 'b', fn : fn },
                    { name : 'y', event : 'c', fn : fn }
                ]
            });
    });

    it("bind model events with a string", function() {
        var binding = parse({"x.a" : 'method'}).bindings[0];
        expect(typeof binding.fn=== 'function').toBe(true);

        var ran = false;
        var o = {method : function() {
            expect(_.toArray(arguments)).toEqual([1,2,3]);
            expect(this).toBe(o);
            ran = true;
        }};

        binding.fn.apply(o, [1,2,3]);

        expect(ran).toBe(true);

    });

    it("throws an error if invalid value is provided for an event", function(){
        expect(function(){parse({"x.a" : 5})}).toThrow();
    });

    it("binds events with attributes", function() {
        expect(parse({ "x.a" : fn, "x.a:b y.a:b" : fn}))
            .toEqual({
                bindings : [
                    { name : 'x', event : 'a', fn : fn },
                    { name : 'x', event : 'a', fn : fn, attribute : 'b' },
                    { name : 'y', event : 'a', fn : fn, attribute : 'b' }
                    ]}
            );
    });

    it("merges duplicate events", function() {
        expect(parse({"x.a" : [fn, fn], "x.b" : fn, "x[a b c]": fn, "x[b c]" : fn}))
            .toEqual({
                bindings : [ 
                    { name : 'x', event : 'a', fn : fn },
                    { name : 'x', event : 'a', fn : fn }, 
                    { name : 'x', event : 'a', fn : fn },
                    { name : 'x', event : 'b', fn : fn },
                    { name : 'x', event : 'b', fn : fn },
                    { name : 'x', event : 'b', fn : fn },
                    { name : 'x', event : 'c', fn : fn }, 
                    { name : 'x', event : 'c', fn : fn } 
                ]
            })
    });

    it("merges group properties into the element properties", function() {
        expect(parse({"x.a" : fn, group: ["foo", "bar"]}, {foo : {"x.b" : fn, "foo": "foo", "over": ["over"]}, bar: {"x.a": fn, "x.b": fn,"bar": "bar", "over": ["under"]}}))
            .toEqual({
                bindings : [
                    { name : 'x', event : 'b', fn : fn, attribute : undefined },
                    { name : 'x', event : 'a', fn : fn, attribute : undefined },
                    { name : 'x', event : 'b', fn : fn, attribute : undefined },
                    { name : 'x', event : 'a', fn : fn, attribute : undefined }
                ],
                unknown : { bar : 'bar', over : [ 'under' ], foo : 'foo' } 
            });
    });

    it("merges group properties that themselves have a group", function() {
        expect(parse({"x.a" : fn, group: "bar"}, {foo : {"x.b" : fn, "foo": "foo", "over": ["over"]}, bar: {group: "foo", "x.a": fn, "x.b": fn,"bar": "bar", "over": ["under"]}}))
            .toEqual({
                bindings : [
                    { name : 'x', event : 'b', fn : fn, attribute : undefined },
                    { name : 'x', event : 'a', fn : fn, attribute : undefined },
                    { name : 'x', event : 'b', fn : fn, attribute : undefined },
                    { name : 'x', event : 'a', fn : fn, attribute : undefined }
                ],
                unknown : { bar : 'bar', over : [ 'under' ], foo : 'foo' } 
            });
    });

    it("sets the default 2-way binding values", function() {
        expect(parse({bind: true}))
            .toEqual({bind: {
                eventObject: 'model',
                attribute: '{name}',
                domEvent: 'change'
            }});
    });

    it("sets the 2-way binding using a string", function() {
        expect(parse({bind: "foo"}))
            .toEqual({ bind : { eventObject : 'model', attribute : 'foo', domEvent : 'change' } });
    });

    it("sets the 2-way binding using string with dot notation", function() {
        expect(parse({bind: "bar.foo"}))
            .toEqual({ bind : { eventObject : 'bar', attribute : 'foo', domEvent : 'change' } });
    });

    it("allows of overriding indivual 2-way binding values", function() {
        expect(parse({bind: {domEvent: 'keyup'}}))
            .toEqual({bind: {
                eventObject: 'model',
                attribute: '{name}',
                domEvent: 'keyup'
            }});


        expect(parse({bind: {eventObject: 'foo'}}))
            .toEqual({bind: {
                eventObject: 'foo',
                attribute: '{name}',
                domEvent: 'change'
            }});

        expect(parse({bind: {attribute: 'bar'}}))
            .toEqual({bind: {
                eventObject: 'model',
                attribute: 'bar',
                domEvent: 'change'
            }});
    });

    it("adds extentions to the view member", function() {
        expect(parse({ ext : "value" }))
            .toEqual({ unknown: { ext: "value" }});
    });

    it("binds the sub view events", function() {
        expect(parse({ "*subview.a" : fn, "*subview[a b c]" : [fn,fn] }))
            .toEqual({ eventsviews : [
                {name: 'subview', event: 'a', fn: fn, attribute: undefined},
                {name: 'subview', event: 'a', fn: fn, attribute: undefined},
                {name: 'subview', event: 'a', fn: fn, attribute: undefined},
                {name: 'subview', event: 'b', fn: fn, attribute: undefined},
                {name: 'subview', event: 'b', fn: fn, attribute: undefined},
                {name: 'subview', event: 'c', fn: fn, attribute: undefined},
                {name: 'subview', event: 'c', fn: fn, attribute: undefined}
                ]});
    });

    it("adds extentions to the viewCollection", function() {
        expect(parse({ ext : "value" }))
            .toEqual({ unknown: { ext: "value" }});
    });

    it("binds the subviews constructor", function(){
        expect(parse({subviews : fn}))
            .toEqual({subviews : {View: fn, collection : 'collection', model : 'model'}});
    });

    it("binds the emptyview", function(){
        expect(parse({subviews: {emptyview :{}}}))
            .toEqual({subviews : {collection: 'collection', model: 'model', emptyview: {}}});
    });

    it("binds the sub view events", function() {
        expect(parse({ "*subview.a" : fn, "*subview[a b c]" : [fn,fn] }))
            .toEqual({ eventsviews : [
                {name: 'subview', event: 'a', fn: fn, attribute: undefined},
                {name: 'subview', event: 'a', fn: fn, attribute: undefined},
                {name: 'subview', event: 'a', fn: fn, attribute: undefined},
                {name: 'subview', event: 'b', fn: fn, attribute: undefined},
                {name: 'subview', event: 'b', fn: fn, attribute: undefined},
                {name: 'subview', event: 'c', fn: fn, attribute: undefined},
                {name: 'subview', event: 'c', fn: fn, attribute: undefined}
                ]});
    });

    it("adds extentions to the subview", function() {
        expect(parse({ ext : "value" }))
            .toEqual({ unknown: { ext: "value" }});
    });

    it("adds the setup methods", function() {
        expect(parse({ setup : fn }))
            .toEqual({setup :[fn]});
    });
});
