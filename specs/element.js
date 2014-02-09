describe("Element: ", function() {
  var element;
  var amodel;
  var anothermodel;
  var acollection;
  var fn = function() {};

  beforeEach(function() {
    $template = $('<div></div>');
    amodel = new Backbone.Model({field: 'value'});

    anothermodel = new Backbone.Model({field: 'another_value'});

    acollection = new Backbone.Collection();

    element = new Kettle.Element({ el : $template[0]});
    _.each({a_model : amodel, a_collection : acollection, another_model : anothermodel}, function(obj, name) {
      element.set(name, obj);
    });
  });

  describe("when created", function() {

    it("have an element", function() {
      expect(element.el).toBe($template[0]);
    });
  });

  describe("when subscribing to new  events", function() {
    beforeEach(function() {
      element.unsubscribe();
    });

    it("subscribe to the events", function() {
      var result = false;
      element.subscribe('a_model','custom' , function() {
        result = true;
      });
      amodel.trigger('custom');
      expect(result).toBe(true);
    });

    it("have the correct context", function() {
     element.subscribe('a_model','custom', function() {
        expect(this).toBe(element);
      });
      amodel.trigger('custom');

    });
  });

  describe("when subscriptions are rebuild", function() {
    it("get the new subscriptions for each active subscription from the view", function() {
      var result = false;

      element.subscribe('a_model','change:field',function(model, v) {
        expect(v).toBe('val');
        result = true;
      });

      var new_model = new Backbone.Model();

      element.set('a_model', new_model, {render: false});

      new_model.set('field','val');
      expect(result).toBe(true);
    })
  });

  describe("when an event object is set", function() {
    it("add the eventObject to the elements 'eventObjects' properties", function() {
        element.set('model', amodel);
        expect(element.eventObjects.model).toBe(amodel);
    });

    it("removes events from the previous event Object", function() {
        var ran = 0, fn = function(model, val, options){if (!options.bootstrap) ran++};
        element.set('model', amodel);
        element.subscribe('model', 'change:foo', fn);
        amodel.set('foo', 'bar');
        expect(ran).toBe(1);
        element.set('model', anothermodel);
        amodel.set('foo', 'buzz');
        expect(ran).toBe(1);
        anothermodel.set('foo', 'buzz');
        expect(ran).toBe(2);
    });

    it("can be unset by passing in 'null' and then reset with all events intact", function() {
        var ran = 0, fn = function(model, val, options){if (!options.bootstrap) ran++};
        element.set('model', amodel);
        element.subscribe('model', 'change:foo', fn);
        amodel.set('foo', 'bar');
        expect(ran).toBe(1);
        element.unset('model');
        amodel.set('foo', 'buzz');
        expect(ran).toBe(1);
        element.set('model', amodel);
        amodel.set('foo', 'bar');
        expect(ran).toBe(2);
    });

    it("renders the eventObject", function() {
        var ran = 0, fn = function(model, val, options){if (options.bootstrap) ran++};
        element.subscribe('model', 'change:foo', fn);
        element.set('model', amodel);
        expect(ran).toBe(1);
    });

    it("resubscribes all subscriptions to the new eventObject", function(){
        var ran = 0;
        var fn = function() {
            ran++;
        };

        element.subscribe('model', 'change',fn, 'foo');
        element.subscribe('model', 'change', fn);

        element.set('model', amodel, {render: false});
        amodel.set('foo', 'bar');
        expect(ran).toBe(2);
    });

    it("disalows setting of the el eventObject", function() {
        expect(function() {this.set('el', amodel)}).toThrow();
    });
  });


  describe("when unsubscribing from an event", function() {
    var result;

    beforeEach(function() {
      result = true;
      element.subscribe('a_model', 'test', function() {
        result = false;
      });
    });

    it("remove itself from the event specified", function() {
      element.eventObjects.a_model.trigger('test');
      expect(result).toBe(false);
      result = true;
      element.unsubscribe('a_model');
      element.eventObjects.a_model.trigger('test');
      expect(result).toBe(true);
    });

    it("do nothing if the event is not in the subscription", function() {
      expect(function() {element.unsubscribe('doesnt.exists')}).not.toThrow();
    });
  });

  describe("when unsubscribing from all event objects", function() {
    it("should remove itself from all subscribed event objects", function() {

      var result = 0;
      element.subscribe('a_model','custom', function() {
        result++;
      });

      element.subscribe('another_model', 'custom', function() {
          result++;
      });

      amodel.trigger('custom');
      anothermodel.trigger('custom');
      expect(result).toBe(2);

      element.unsubscribe();

      amodel.trigger('custom');
      anothermodel.trigger('custom');

      expect(result).toBe(2);

    });
  });

  describe("when removed", function() {
    it("remove element form the dom", function() {
      document.body.appendChild(element.el);
      element.remove();
      expect(element.el.parentNode).not.toBe(document.body);
    });

    it("unsubscribe from all model events", function() {
      spyOn(element,'unsubscribe').andCallThrough();
      element.remove();
      expect(element.unsubscribe).toHaveBeenCalled();
    });

  });

  describe("when bootstraping subscriptions", function() {
    var results;
    beforeEach(function() {
      results = [];
      element.subscribe('a_model', 'change', function() {results.push(1)});
      element.subscribe('another_model', 'change', function() {results.push(2)});
      element.subscribe('a_collection', 'reset', function() {results.push(3)});
    });

    it("bootstraps all the subscriptions", function() {
      element.bootstrap();
      expect(results.length).toEqual(3);
      expect(_.foldl(results, function(a,b){return a+b;})).toBe(6);
    });

    it("bootstraps provided subscriptions in order", function() {
      element.bootstrap('a_collection', 'a_model');
      expect(results).toEqual([3,1]);
    });
  });

  describe("when rendering the element", function() {
    it("bootstraps all the subscriptions", function() {
        spyOn(element, 'bootstrap');
        element.render();
        expect(element.bootstrap).toHaveBeenCalled();
    });

  });

 describe("when element is rendered", function() {
   it("triggers a render event", function() {
        var ran = false;
        var e = new Kettle.Element({el : $()});
        e.on('render', function(){ran = true});
        e.render();
        expect(ran).toBe(true);
    });
});

describe("when an element is removed", function() {
    it("triggers a remove event", function() {
        var ran = false;
        var e = new Kettle.Element({el : $('<div></div>')})
        e.on('remove', function() {ran = true});
        e.remove();
        expect(ran).toBe(true);
    });

    it("stops listening to events", function() {
        var ran = true;
        var e = new Kettle.Element({el : $('<div></div>')});
        e.on('test', function() {ran = true});
        e.remove();
        e.trigger('test');
    });
});

describe("when an event object is set on an element", function() {
    it("triggers an change event", function() {
        var ran = false;
        var ran2 = false;
        var e = new Kettle.Element({el : $()});
        var m1 = new Backbone.Model();
        var m2 = new Backbone.Model();
        e.set('test', m1);
        e.on('change', function(view, name, newevent, oldevent) {
            expect(view).toBe(e);
            expect(name).toBe('test');
            expect(newevent).toBe(m2);
            expect(oldevent).toBe(m1);
            ran = true;
        });

        e.on('change:test', function(view, newevent, oldevent) {
            expect(view).toBe(e);
            expect(newevent).toBe(m2);
            expect(oldevent).toBe(m1);
            ran2 = true;
        });
        e.set('test',m2);
        expect(ran).toBe(true);
        expect(ran2).toBe(true);
    });

    it("does not trigger an change event if silent option is true", function() {
        var ran = true;
        var e = new Kettle.Element({el: $()});
        e.on('change', function() {
            ran = false;
        });
        e.set('test', new Backbone.Model());
        expect(ran).toBe(false);
    });
});
});
