describe("CollectionView: ", function() {

  var collectionView,containerView1,containerView2,model;

  beforeEach(function() {
    subView1 = new Kettle.View({ el : $('<div id="1"></div>')});
    subView1.set('view', subView1);
    subView2 = new Kettle.View({ el : $('<div id="2"></div>')});
    subView2.set('view', subView2);
    collectionView = new Kettle.CollectionView({ el : $('<div></div>')});
    model = new Backbone.Model();
  });

  describe("when adding a new view", function() {
    it("add the view at the end of the collection when no idex provided", function() {
      collectionView.addView(subView1);
      expect(collectionView.subviews[0]).toBe(subView1);
      collectionView.addView(subView2);
      expect(collectionView.subviews[1]).toBe(subView2);
    });

    it("add the view at the provided index", function() {
      collectionView.addView(subView1);
      collectionView.addView(subView2,0);
      expect(collectionView.subviews[0]).toBe(subView2);
      expect(collectionView.$el.children().first().attr('id')).toBe('2');
    });

    it("append the view element to the CollectionView element", function() {
      collectionView.addView(subView1);
      expect(collectionView.$el.children().last().attr('id')).toBe('1');
      collectionView.addView(subView2);
      expect(collectionView.$el.children().last().attr('id')).toBe('2');
    });


    it("added to the list of subscribed events (before)", function() {
      var result = false;

      collectionView.subscribeViews('view', 'test', function() {
        result = true;
      });

      collectionView.addView(subView1);

      subView1.trigger('test');
      expect(result).toBe(true);

    });

    it("added to the list of subscribed events (after)", function() {
      var result = false;


      collectionView.addView(subView1);

      collectionView.subscribeViews('view', 'test', function() {
        result = true;
      });

      subView1.trigger('test');
      expect(result).toBe(true);

    });

    it('added the views eventObjects to the list of subscribed events (before)', function() {
        var result = false;
        var model = new Backbone.Model();

        collectionView.subscribeViews('model', 'test', function() {
           result = true;
        });

        subView1.set('model', model);

        collectionView.addView(subView1);
        model.trigger('test');
        expect(result).toBe(true);
    });

    it('added the views eventObjects to the list of subscribed events (after)', function() {
        var result = false;
        var model = new Backbone.Model();

        subView1.set('model', model);

        collectionView.addView(subView1);
        collectionView.subscribeViews('model', 'test', function() {
           result = true;
        });

        model.trigger('test');
        expect(result).toBe(true);
    });


    it("remove the view from the collection when the view gets removed", function() {
      collectionView.addView(subView1);
      subView1.remove();

      expect($.inArray(subView1,collectionView)).toBe(-1);
    });

    it("removes the empty view if on exists", function(){
        var html = "<div>Empty View</div>";
        var $el = $(html);
        collectionView.setEmptyView(new Kettle.View({el :$el}));
        collectionView.addView(subView1);
        expect(collectionView.$el.find($el[0]).length).toBe(0);
    });

    it("bootstraps the view subscriptions ", function() {
        var result = false;
        collectionView.subscribeViews('model', 'change', function(model, options) {
            if (options.bootstrap) result = true;
        });
        var model = new Backbone.Model();
        subView1.set('model', model);
        collectionView.addView(subView1);
        expect(result).toBe(true);
    });

  });

  describe("when emptying the view collection", function() {
    beforeEach(function(){
        collectionView.addView(subView1).addView(subView2);
    });

    it("unsubscribes from all view subscriptions", function() {
        var result = true;
        collectionView.addView(subView1);
        collectionView.subscribeViews('view', 'test', function() {
            result = false;
        });
        collectionView.empty();
        subView1.trigger('test');
        expect(result).toBe(true);
    });

    it("removes all subviews from the collection", function() {
        collectionView.empty();
        expect(collectionView.subviews).toEqual([])
    });

    it("appends the empty view", function() {
        var html = "<div>Empty View</div>";
        var $el = $(html);
        collectionView.setEmptyView(new Kettle.View({ el : $el}));
        collectionView.empty();
        expect(collectionView.$el.html().toUpperCase()).toBe(html.toUpperCase());
    });
  });

  describe("when removing a view", function() {
    it("removed from the subviews collection", function() {
      collectionView.addView(subView1);
      collectionView.removeView(subView1);
      expect(collectionView.subviews[0]).toBeUndefined();
      expect(collectionView.$el.children().length).toBe(0);
    });

    it("removed from the list of subscribed events", function() {
      var result = true;

      collectionView.subscribeViews('view','test',function() {
        result = false;
      });

      collectionView.addView(subView1);
      collectionView.removeView(subView1);
      subView1.trigger('test');
      expect(result).toBe(true);
    });

    it("sets the empty view if all subviews are removed", function(){
        var html = "<div>Empty View</div>";
        var $el = $(html);
        collectionView.setEmptyView(new Kettle.View({ el : $el}));
        expect(collectionView.$el.html().toUpperCase()).toBe(html.toUpperCase());
        collectionView.addView(subView1).removeView(subView1);
        expect(collectionView.$el.html().toUpperCase()).toBe(html.toUpperCase());
    });
  });

  describe("when subscribing to a view event", function() {
    it("should add the subscription to all existsing events", function() {
      var result = false, result2 = false;;
      collectionView.addView(subView1);
      collectionView.subscribeViews('view', 'test', function() {
        result = true;
      }).subscribeViews('el', 'click', function() {result2 = true});
      subView1.trigger('test');
      helpers.triggerDomEvent(subView1.el, 'click');
      expect(result).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe("when unsubscribing from a view event", function() {
    it("remove all instances of a given view event from all subviews", function() {
      var result = true;
      collectionView.addView(subView1)
        .subscribeViews('view','test', function() {
          result = false;
        })
        .unsubscribeViews('view', 'test');

      subView1.trigger('test');
      expect(result).toBe(true);
    });
  });

  describe("when unsubscribing from all view events", function() {
    it("remove all view events that are being subscribed to", function() {
      var result1 = true, result2 = true, result3 = true;
      collectionView.subscribeViews('view','test1', function() {result1 = false})
        .subscribeViews('view', 'test2', function(){result2 = false})
        .subscribeViews('el', 'click', function(){result3 = false})
        .addView(subView1)
        .addView(subView2)
        .unsubscribeViews();

        subView1.trigger('test1');
        subView2.trigger('test2');
        subView1.$el.click();

        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(result3).toBe(true);
    });
  });

  describe("when locating a view given a model" , function() {
    it("find the view when one exists", function() {

      collectionView.addView(subView1).addView(subView2)
      subView1.set('model',model);
      expect(collectionView.findWithEventObject(model)).toBe(subView1);

    });

    it("returns null when one doesn't exist", function() {
       collectionView.addView(subView1).addView(subView2);
       expect(collectionView.findWithEventObject(model)).toBe(null);
    })
  });

  describe("when locating a view given element" , function() {
    it("find the view when one exists", function() {
        collectionView.addView(subView1).addView(subView2);
        expect(collectionView.findWithElement(subView1.el)).toEqual(subView1);
    });

    it("returns null when one doesn't exist", function() {
        collectionView.addView(subView1).addView(subView2);
        expect(collectionView.findWithElement(document.body)).toEqual(null);
    })
  });

  describe("when checking for an existance of a subscription", function() {
    it("shoud return true if a subscription exists", function() {
      collectionView.subscribeViews('view','test');
      expect(collectionView.hasSubscriptionViews('view','test')).toBe(true);
    });

    it("shoud return false if a subscription does not exists", function() {
      expect(collectionView.hasSubscriptionViews('view','test')).toBe(false);
    });
  });


  describe("when working with a BBView", function() {
      var bbv1, bbv2, model1, model2;

      beforeEach(function() {
        bbv1 = new Kettle.BBView();
        bbv2 = new Kettle.BBView();
        model1 = new Backbone.Model();
        model2 = new Backbone.Model();
        bbv1.set('model', model1);
        bbv2.set('model', model2);
      });

      it("can accepts a BBView as a subview", function() {
        collectionView.addView(bbv1).addView(bbv2);
        expect(collectionView.subviews.length).toBe(2);
        expect(collectionView.subviews[0]).toBe(bbv1);
        expect(collectionView.subviews[1]).toBe(bbv2);
      });

      it("can remove a BBView", function() {
        collectionView.addView(bbv1);
        collectionView.removeView(bbv1);
        expect(collectionView.subviews.length).toBe(0);
      });

      it("will remove a BBView if it has been destroyed", function() {
        collectionView.addView(bbv1);
        bbv1.remove();
        expect(collectionView.subviews.length).toBe(0);
      });

      it("can register to BBView events", function() {
        var testran = false,
            elran = false,
            modelran = false;

        collectionView.addView(bbv1).addView(bbv2);
        collectionView.subscribeViews('view', 'test', function(param) {
            testran = true;
            expect(param).toBe('foo');
        });
        bbv1.trigger('test', 'foo');
        expect(testran).toBe(true);
        collectionView.subscribeViews('model', 'change:foo', function(model,v) {
            modelran = true;
            expect(v).toBe('bar');
        });
        bbv2.model.set('foo', 'bar');
        expect(modelran).toBe(true);
        collectionView.subscribeViews('el', 'test', function() {
            elran = true;
        });
        helpers.triggerDomEvent(bbv1.el, 'test');
        expect(elran).toBe(true);
      });

      it("can find a BBView with el", function() {
          collectionView.addView(bbv1).addView(bbv2);
          expect(collectionView.findWithElement(bbv1.$el)).toEqual(bbv1);
      });

      it("can find a BBView with a eventObject", function() {
          collectionView.addView(bbv1).addView(bbv2);
          expect(collectionView.findWithEventObject(bbv1.model)).toEqual(bbv1);
      });
  });

});
