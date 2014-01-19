describe("View: ", function() {
  var aview, $template, model, member, anotherMember;

  beforeEach(function() {
    $template = $('<div><span></span><span></span></div>');
    aview = new Kettle.View({el : $template[0]});
    member = new Kettle.DomValue({el : $template.children('span')[0]});
    anotherMember = new Kettle.DomValue({el : $template.children('span')[1]});
    aview.addElement('member', member);
    aview.addElement('anotherMember', anotherMember);
    model = new Backbone.Model();
  });

  describe("when a element is added", function() {
    it("sets the view of the added element", function() {
        expect(member.view).toBe(aview);
    });

    it("throws an exception if the element belongs to another view", function() {
        var anotherView = new Kettle.View({el : $template});
        var anotherMember = new Kettle.DomValue({el :$template.children()[0]});

        anotherView.addElement("test", anotherMember);

        expect(function() { aview.addElement(anotherMember); }).toThrow();

    });

    it("sets the elements models to be the view models", function() {
        expect(_.keys(aview.eventObjects))
            .toEqual(_.keys(member.eventObjects));

        expect(_.values(_.omit(aview.eventObjects, 'el')))
            .toEqual(_.values(_.omit(member.eventObjects, 'el')));

    });

    it("adds the view in the elements object", function() {
        expect(aview.elements.member).toBe(member);
    });

    it("throws an exception if element name is taken or invalid", function() {
        var member = new Kettle.DomValue({el :$template.children()[0]});
        expect( function() {aview.addElement('member', member);}).toThrow();
    });

    it("does not render the eventObjects on the added element", function() {
        var newMember = new Kettle.DomValue({el :$template.children()[0]});
        spyOn(newMember, 'render');

        aview.addElement('newMember', newMember);
        expect(newMember.render).not.toHaveBeenCalled();

    });
  });

  describe("when an element is removed", function() {
    it("throws an exception if the element does not belong to the view", function() {
        var anotherview = new Kettle.View({ el: $template});
        var anothermember = new Kettle.DomValue({ el : $template});

        anotherview.addElement('newmember', anothermember);
        expect(function() {
            aview.addElement(anothermember);
        }).toThrow();
    });

    it("removes the element from the elements object", function() {
        aview.removeElement(member);

        expect(aview.elements.member).not.toBeDefined();
    });

    it("nulls the elements view refrence", function () {
        aview.removeElement(member);
        expect(member.view).toBe(null);
    });
  });

  describe("when a eventObject is set", function() {
    var eventObject;

    beforeEach(function() {
      eventObject = new Backbone.Collection();
      aview.set('eventObject', eventObject);

    });

    it("set the event object on each element", function() {
        var options = {};

        _.each(aview.elements, function(element) {
            spyOn(element, 'set');
        });

        aview.set('model', model, options);

        _.each(aview.elements, function(element) {
            expect(element.set).toHaveBeenCalledWith('model', model, {silent: true});
        });
    });

    it("add the eventObject to the views 'models' properties", function() {
      expect(aview.eventObjects.eventObject).toBe(eventObject);
    });

    it("rebind all the view members with the new event Object", function() {
      var inc = 0, boot = 0;
      var fn = function(model, options) {
        options && options.bootstrap ? boot++ : inc++
      };
      var model = new Backbone.Model();
      aview.set('model', model);
      member.subscribe('model','change', fn );
      aview.subscribe('model', 'change', fn);
      expect(boot).toBe(0);
      model.set('foo', 'bar');
      expect(inc).toBe(2);

      var newmodel = new Backbone.Model();
      aview.set('model', newmodel);
      expect(boot).toBe(2);
      model.set('foo', 'foo');
      expect(inc).toBe(2);
      newmodel.set('foo', 'bar');
      expect(inc).toBe(4);
    });
  });

  describe("when its synced with the models", function() {
    it ("call the render method on all models", function() {
      aview.set('a_model',model);
      spyOn(member,'render');
      aview.render();
      expect(member.render).toHaveBeenCalled();
    });
  });

  describe("when view is removed", function() {
    beforeEach(function() {
      spyOn(member,'remove');
      spyOn(anotherMember,'remove');
      aview.remove();
    });
    it("call the remove method on all of the view members", function() {
      expect(member.remove).toHaveBeenCalled();
      expect(anotherMember.remove).toHaveBeenCalled();
    });

  });

});
