// kettle-js v0.1.0
// (c) 2014 Sergey Melnikov

// kettle-js may be freely distributed under the MIT license

(function() {
 'use strict';

    var root = this,
        Kettle,
        prevKettle = root.Kettle,
        extendObject = Backbone.Model.extend,
        trim = (String.prototype.trim ? function (s) {
            return s.trim();
        } : function(s) {
            return s.replace(/^\s+|\s+$/g);
        });


    function isPlainObject(o) {
        return o && Object.prototype.hasOwnProperty.call(o.constructor.prototype, "hasOwnProperty");
    }

    function throwError(msg) {
        throw new Error("Kettle : " + msg);
    }

    //A deep extend method that also concatenates arrays when they are encountered
    function extendConcat() {
        var i, l, prop, clone,
            obj = arguments[0];

        for (i = 1, l = arguments.length; i < l; i++) {
            for (prop in arguments[i]) {
                clone = arguments[i][prop];
                if (isPlainObject(clone)) {
                    obj[prop] = extendConcat(_.isObject(obj[prop]) ? obj[prop] : {}, clone);
                } else if (_.isArray(clone)) {
                    if (!_.isArray(obj[prop])) obj[prop] = [];
                    obj[prop].push.apply(obj[prop], clone);
                } else {
                    obj[prop] = clone;
                }
            }
        }

        return obj;
    }

    function debounce(fn) {
        var args, context, ran = false;

        return function() {
            args = arguments;
            context = this;

            if (!ran) {
                ran = true;
                setTimeout(function(){
                    fn.apply(context, args);
                    context = args = null;
                    ran = false;
                },0);
            }
        };
    }


    if (typeof exports !== 'undefined') {
        Kettle = exports;
    } else {
        Kettle = root.Kettle = {};
    }

    //EventInterface is used to bind events on a given object without the calling method knowing
    //the type of object it is. Currently Backbone.Events and Backbone.$ are supported.
    //Also responsible for bootstrapping events, currently only Backbone Models, Collections and
    //Routers have bootsrap methods.
    var EventInterface = ({
        init: function() {
             //Collects information on the last route event executed by the Backbone.history
             //this is then used when rending a router event.
            Backbone.history.on('route', function(router, name ,args) {
                this._lastRoute = {
                    router: router,
                    name : name,
                    args : args
                };
            }, this);

            return this;
        },
        bindEvent : function(obj, context, event, fn, attribute) {
            if (obj instanceof Backbone.$) {
                obj.on(event, this._proxy(fn, context));
            } else {
                obj.on(attribute ? event + ":" + attribute : event, fn, context);
            }
        },

        unbindEvent : function(obj, context, event, fn , attribute) {
            if (obj instanceof Backbone.$) {
                fn ? obj.off(event, this._unproxy(fn, context)) : obj.off(event);
            } else {
                obj.off(attribute ? event + ":" + attribute : event, fn, context);
            }
        },
        //used to bootstrap certain events depending on what the object is.
        //the functions called as a result will behave as though they were
        //real events
        bootstrap : function(obj, context, events) {
            if (obj instanceof Backbone.Model) {
                this._bootstrapModel(obj, context, events);
            } else if (obj instanceof Backbone.Collection) {
                this._bootstrapCollection(obj, context, events);
            } else if (obj instanceof Backbone.Router) {
                this._bootstrapRouter(obj, context, events);
            }
        },

        _bootstrapModel: function(model, context, events) {
            var i, l, evData,
                collection = model.collection,
                options = {bootstrap : true};

            //loop through the change events and call the method subscribed, tries to simulate what Backbone would pass in
            //in this case what's passed into the change event callback depends on whether or not an attribute was provided
            if (events.change) {
               for (i=0, l=events.change.length; i<l; i++) {
                    evData = events.change[i];
                    if (evData.attribute) {
                        evData.fn.call(context, model, model.attributes[evData.attribute], options);
                    } else {
                        evData.fn.call(context, model, options);
                    }
                }
            }


            //if the model has a collection, simulate an 'add' event
            if (collection && events.add) {
                for (i=0, l=events.add.length; i<l; i++) {
                    events.add[i].fn.call(context, model, collection, options);
                }
            }

            //loop through the 'all' events and call those, passing the bootstrap event 'change' as the reason
            if (events.all) {
                 for (i=0, l=events.all.length; i<l; i++) {
                    events.all[i].fn.call(context, 'change', model, options);
                }
            }
        },

        _bootstrapCollection: function(collection, context, events) {
            var i, l,
                options = {bootstrap : true};

            //run the reset event, add events are avoided due to performance considerations
            //but as a consequence if a reset event is not defined on a Element than it
            //will not properly render from a blank state
            if (events.reset) {
                for (i=0, l=events.reset.length; i<l; i++) {
                    events.reset[i].fn.call(context, collection, options);
                }
            }

            //loop through the 'all' events and call those, passing the bootstrap event 'reset' as the reason
            if (events.all) {
                for (i=0, l=events.all.length; i<l; i++) {
                    events.all[i].fn.call(context, 'reset', collection, options);
                }
            }

        },

        _bootstrapRouter : function(router, context, events) {
            var options = {bootstrap : true},
                lastRoute = this._lastRoute;

            //call only events that are bound to the active route
            //currently the active route is the last one.
            if (router === lastRoute.router && events.route) {
                _.each(events.route, function(evData) {
                    if (evData.attribute === lastRoute.name) {
                        evData.fn.apply(context, lastRoute.args);
                    } else if (evData.attribute == null) {
                        evData.fn.call(context, lastRoute.router, lastRoute.name, lastRoute.args);
                    }
                });
            }
        },
        _lastRoute : {},
        _fid : 0,
        //proxies used as a type of adapter to allow jquery events to be removed by function and context
        //in the same way that backbone events allows for.
        _proxies: {},
        _proxy_key: '__kettle_fid__',
        _proxy : function(fn, context) {
            var proxied,
                key = this._proxy_key;

            if (fn[key] != null && context[key] != null){
                proxied = this._proxies[fn[key] + " " + context[key]];
            }

            if (!proxied) {
                proxied = _.bind(fn, context);
                fn[key] != null || (fn[key] = this._fid++);
                context[key] != null || (context[key] = this._fid++);
                this._proxies[fn[key] +' '+ context[key]] = proxied;
            }
            return proxied;

        },
        _unproxy : function(fn, context) {
            var pkey = this._proxy_key,
                key = fn[pkey] + " " + context[pkey],
                proxied =  this._proxies[key];

            delete this._proxies[key];

            return proxied;
        }
    }).init();


    //EventListners: used by view collections and containers to listen to events on their child views*/
    var EventListeners = function(context) {
        this.eventObjects = {};
        this.subscriptions = {};
        this.context = context;
    };

    _.extend(EventListeners.prototype, {

        //add an event object to listen to, all existing subscriptions will register with the added object
        add : function(name, eventObject) {
            var context = this.context, eventObjects;

            if (!this.eventObjects[name]) this.eventObjects[name] = [];

            eventObjects = this.eventObjects[name];

            eventObjects.push(eventObject);

            _.each(this.subscriptions[name], function (events, event){
                _.each(events, function (evData) {
                    EventInterface.bindEvent(eventObject, context, event, evData.fn, evData.attribute);
                });
            });

            return this;
        },

        //bootstraps all added eventObjects with the subscribed events, arguments can be provided to pick
        //specific eventObjects (by name)
        bootstrap: function () {

            var eventObjects = this.eventObjects,
                context = this.context,
                subscriptions = arguments.length === 0 ? this.subscriptions: _.pick(this.subscriptions, _.toArray(arguments));

            _.each(subscriptions, function(events, name) {
                _.each(eventObjects[name], function(eventObject) {
                    EventInterface.bootstrap(eventObject, context, events);
                });
            });


            return this;
        },
        //simple method to check if a subscription is being listened to
        hasSubscription: function (name, event) {
            return !!(this.subscriptions[name] && (event === undefined || this.subscriptions[name][event]));
        },

        //remove an event object from the list, also unbinds all subscriptions from it
        remove : function(name, eventObject) {
            var i, l, evData, context, index, eventObjects = this.eventObjects[name];

            if (eventObjects) {

                index = _.indexOf(eventObjects,eventObject);
                context = this.context;

                if ( index >= 0) {
                    eventObjects.splice(index,1);

                    _.each(this.subscriptions[name], function(evDatas, event) {
                        for (var i=0, l=evDatas.length; i<l; i++) {
                            evData = evDatas[i];
                            EventInterface.unbindEvent(eventObject, context, event, evData.fn, evData.attribute);
                        }
                    });
                }

                if (eventObjects.length === 0) delete this.eventObjects[name];
            }

            return this;
        },

        //subscribe to a new event , registering all added event objects to it*/
        subscribe: function (name, event, fn) {
            var attribute, events,
                context = this.context,
                parts = event.split(':');

            event = parts[0];
            attribute = parts[1];

            if (!this.subscriptions[name]) {
                this.subscriptions[name] = {};
            }

            events = this.subscriptions[name];

            if (!events[event]) {
                events[event] = [];
            }

            events[event].push({
                fn : fn,
                attribute : attribute
            });

            _.each(this.eventObjects[name], function(obj) {
                EventInterface.bindEvent(obj, context, event, fn, attribute);
            });

            return this;
        },

        //unsubscribe from events, the events that will get unsubscribed will depend on the amount of parameters passed into
        //the unsubscribe method. The more parameters passed the more specific the method. If no parameters are passed all
        //events are unsubcribed.
        unsubscribe: function (name, event, fn) {
            var i, l, j, ll, evData, attribute, parts,
                subscriptions= this.subscriptions,
                context = this.context,
                eventObjects = this.eventObjects;

            if (event) {
                parts = event.split(':');
                event = parts[0];
                attribute = parts[1];
            }

            _.each(subscriptions, function(events, grp) {

                if (!name || name === grp) {

                    _.each(events, function(evDatas, ev) {

                        if (!event || ev === event) {

                            for (i=0, l=evDatas.length; i<l; i++) {
                                evData = evDatas[i];

                                if ((!fn || fn === evData.fn) && (!event || !attribute || attribute === evData.attribute)) {
                                    for (j=0, ll=eventObjects[grp].length; j<ll; j++){
                                        EventInterface.unbindEvent(eventObjects[grp][j], context, ev, evData.fn, evData.attribute);
                                    }
                                }

                                evDatas.splice(i,1);
                                i--; l--;
                            }

                            if (evDatas.length === 0) delete events[ev];
                        }
                    });

                  if (_.isEmpty(events)) delete subscriptions[grp];
                }
            });

            return this;
        }
    });


    //used to mixin with the View Collections and Sub Views
    //uses EventListners to listen on events that happen on child views
    var ViewsSubscriptions = _.extend({
        //add a new view to listen to
        _addViewEventObject: function(view) {
            var subs;
            if (!this._viewsubs) {
                this._viewsubs = new EventListeners(this);
            }

            subs = this._viewsubs;

            this.stopListening(view, 'change', this._onViewChange);
            this.listenTo(view, 'change', this._onViewChange);

            _.each(subs.subscriptions, function(evData, name) {
                if (view.eventObjects[name]) {
                    subs.add(name, view.eventObjects[name]);
                }
            });

            return this;
        },

        //check to see if an event is being listened to by all added views
        hasSubscriptionViews: function (name, event) {
            return !!(this._viewsubs && this._viewsubs.hasSubscription(name, event));
        },

        //remove an added view*/
        _removeViewEventObject: function(view) {
            var subs = this._viewsubs;

            if (subs) {
                _.each(view.eventObjects, function(obj, name) {
                    if (subs.subscriptions[name] ) {
                        subs.remove(name, obj);
                    }
                });
            }

            return this.stopListening(view, 'change', this._onViewChange);
        },


        bootstrapViewSubscriptions: function (view) {
            var subscriptions, that = this;
            if (this._viewsubs) {
                subscriptions = this._viewsubs.subscriptions;

                _.each(subscriptions, function(events, name) {
                    if (view.eventObjects[name]) {
                        EventInterface.bootstrap(view.eventObjects[name], that, events);
                    }
                });
            }

            return this;
        },
        //subscribe to a particular event on the currently added views
        //or any views added in the future. The first parameter of the subscribed
        subscribeViews: function (name, event, fn) {
            var events, subs, views;

            if (!this._viewsubs) {
                this._viewsubs = new EventListeners(this);
            }

            subs = this._viewsubs;

            if (!subs.hasSubscription(name)) {
                views = this.subviews ? this.subviews : (this.subview ? [this.subview] : []);
                _.each(views, function(view) {
                    if (view.eventObjects[name]) subs.add(name, view.eventObjects[name]);
                });
            }

            this._viewsubs.subscribe(name, event, fn);

            return this;
        },

        //unsubscribe form a view event for all added views;
        unsubscribeViews: function (name, event, fn) {
            if (this._viewsubs) {
                this._viewsubs.unsubscribe(name, event, fn);
            }

            return this;
        },

        //unsubscribe from all view events for all added views in the collection
        _stopListeningToViewEvents: function () {
            var eventObjects, i, l, prop;
            if (this._viewsubs) {
                eventObjects = this._viewsubs.eventObjects;
                for (prop in eventObjects) {
                    for (i=0, l=eventObjects[prop].length; i<l; i++) {
                        EventInterface.unbindEvent(eventObjects[prop][i], this);
                    }
                }
            }


            this.stopListening(null, 'change', this._onViewChange);

            return this;
        },

        _onViewChange: function(view, name, eventObject, oldEventObject) {
            var subs = this._viewsubs;
            if (subs.subscriptions[name]) {
                if (oldEventObject != null) subs.remove(name, oldEventObject);

                if (eventObject != null) {
                    subs.add(name, eventObject);
                    EventInterface.bootstrap(eventObject, this, subs.subscriptions[name]);
                }
            }
        }
    });

    //Element is the base 'class' from which all other view classes drive of
    //it has a DOM element and subscriptions to Event Objects (typically Model/Collection/Jquery)
    //but can be anything that mixins the Backbone.Event object. It accepts a element
    //which can either be a DOM element or a jquery object, currently it's only allowed
    //to hold a single DOM element.
    var Element = function(params) {
            var el = params.el;

            if (el instanceof Backbone.$) {
                this.el = el[0];
                this.$el = el;
            } else {
                this.el = el;
                this.$el = Backbone.$(el);

            }

            this.eventObjects = {el: this.$el, view: this};

            this._subs = new EventListeners(this).add('el', this.$el).add('view', this);

    };

    _.extend(Element.prototype, Backbone.Events, {
        //used to bootstrap the subscriptions, if no arguments are provided bootstraps through
        //all subscriptions, otherwise bootstraps through the passed in subscriptions in order.
        //Typically used when overriding the render method to bootstrap in a pre-determined order.
        bootstrap: function() {
            this._subs.bootstrap.apply(this._subs, arguments);
            return this;
        },

        initialize: function() {},

        get : function(name) {
            return this.eventObjects[name];
        },

        //removes the element from the dom and unsubscribe to all added subscriptions
        remove: function (options) {
            var silent = options ? options.silent : false;

            this.$el.remove();
            this.unsubscribe();

            if (!silent) {
                this.trigger('remove', this);
            }

            return this.off().stopListening();
        },

        //the default render method runs through all the subscriptions bootstraping relevant
        //methods. The methods ran will depend on whether the event object is a model or
        //a collection, for models, methods bound to  the 'change', 'add', 'all'
        //events will be ran. For collections methods bound to the 'reset' and 'all'
        //events will be ran.
        render: function(options) {
            var silent = options ? options.silent : false;

            this.bootstrap();

            if (!silent) {
                this.trigger('render', this);
            }

            return this;
        },

        //set a new event object given a name and object. Resubscribes to the object with any
        //events that are already subscribed to.
        set: function(name, eventObject, options) {
            var render = options ? options.render : true,
                silent = options ? options.silent : false,
                oldEventObject = this.eventObjects[name] || null,
                subs = this._subs;

            if (name === 'el' && eventObject && eventObject !== this.$el) throwError("cannot change eventObject 'el'");
            if (eventObject && this.eventTypes[name] && !(eventObject instanceof this.eventTypes[name])) {
                throwError("Invalid event object set, does not pass object validaiton");
            }

            this.eventObjects[name] = eventObject;
            if (_.contains(this.mainEventObjects, name)) this[name] = eventObject;

            if (oldEventObject) subs.remove(name, oldEventObject);
            if (eventObject) subs.add(name, eventObject);

            if (render !== false && eventObject) subs.bootstrap(name);

            if (!silent) {
                this.trigger('change', this,  name, eventObject, oldEventObject);
                this.trigger('change:' + name, this, eventObject, oldEventObject);
            }

            return this;
        },

        //adds a subscription to a given eventObject (identified by name) for a given event. If the
        //eventObject exists the event will be bound on it immediately, otherwise the event will be bound
        //when the eventObject gets set.
        subscribe: function (name, event, fn) {
            this._subs.subscribe(name, event, fn);

            return this;

        },

        unset: function(name, options) {
            return this.set(name, null, options);
        },

        //usubscribes from an eventObject by name, also unbinds all events that were subscribed to.
        unsubscribe: function (name, event, fn) {
            this._subs.unsubscribe(name, event, fn);

            return this;
        },
        mainEventObjects: ['state', 'collection', 'model'],
        eventTypes : {},
        eventObjects: null,
        name: null,
        view: null,
        el: null,
        $el: null,
        _subs: null
    });

    //Use the backbone events method to extend from the element, but also uses _.extend to
    //easily mixin any objects (in reverse order for better visibility.)
    Element.extend = function() {
        return extendObject.call(this, _.extend.apply(this, [].slice.call(arguments,0).reverse()));
    };

    //A View is itself an element but also contains and manages n number of child elements
    //View gets mixed in with Backbone.Events and that is the method which elements within the
    //view can communicate with each other. Also provides some built-in events, they include
    // 'load', 'change', 'remove'
    var View = Element.extend({
        constructor : function(el) {
            View.__super__.constructor.call(this, el);
            this.elements = {};
        },

        //Adds a new elements to the view, requires a name for which the element can be identified as
        //will also add all the eventObjects that the view possess into the added element.
        addElement : function(name, element) {
            if (!_.isString(name) || this.elements[name]) throwError("name invalid or taken");
            if (element.view) throwError("Element already owned by a view");

            element.view = this;

            for (var prop in this.eventObjects) {
                if (prop !== 'el') element.set(prop, this.eventObjects[prop], {render: false, silent: true});
            }

            this.elements[name] = element;
            return this;
        },
        clear: function(name) {
            View.__super__.clear.call(this, name);

            _.each(this.elements, function(element) {
                element.clear(name);
            });

            return this;
        },
        //Destroys a view. the view will be removed from the DOM
        //along with all of its elements and all subscriptions of the view and it's elements
        //will be removed and unbound.
        remove: function (options) {
            View.__super__.remove.call(this, options);
            _.invoke(this.elements, 'remove', {silent: true});

            this.elements = null;

            return this;
        },

        render : function(options) {
             var silent = options ? options.silent : false;

            this.bootstrap();
            _.invoke(this.elements, 'render', {silent: true});

            if (!silent) {
                this.trigger('render', this);
            }

            return this;
        },

        //removes an element from the view
        removeElement: function(element) {
            var index, name;

            if (_.isString(element)) {
                name = element;
                element = this.elements[element];
            }

            if (element.view !== this) {
                throwError("can't remove, Element not owned by this view");
            }

            if (!name) {
                _.each(this.elements, function(e, prop) {
                    if (e === element) name = prop;
                });
            }

            if (name) delete this.elements[name];

            element.view = null;

            return this;

        },

        //sets an eventObject for this view and also for each element of the view.
        //if the view has already been loaded the model will be immediately rendered
        //on the view and for each element. A 'change' event will also be triggered.
        set: function (name, eventObject, options) {
            var elemOptions = _.extend({silent: true}, options);

            View.__super__.set.call(this, name, eventObject, options);

            _.each(this.elements, function(element) {
                element.set(name, eventObject, elemOptions);
            });

            return this;
        },
        elements: null
    });

    //A DomValue is an Element that represents a primitive value (typically within a model)
    //useful when doing 2-way binding.
    var DomValue = Element.extend({
        constructor : function (el) {
            DomValue.__super__.constructor.call(this,el);
            this._findFn();
        },

        // both a getter and a setter. The actions of the get and set methods will
        // depend on what type of dom element is set. For example for textboxes this
        // method will access the value attribute and for div's this method will
        // access the textContent/innerText.
        val : function(v) {
            if (!arguments.length) {
                return this._get();
            }

            this._set(v);

            return this;
        },

        _valGet : function() {
            return this.el.value;
        },

        _valSet : function(v) {
            this.el.value =  v;
        },

        _textGetIE : function() {
            return this.el.innerText;
        },

        _textSetIE: function(v) {
            this.el.innerText = v;
        },

        _textGet : function() {
            return this.el.textContent;
        },

        _textSet : function(v) {
            this.el.textContent = v;
        },

        _checkboxGet: function() {
            return !!this.el.checked;
        },

        _checkboxSet : function(v) {
            this.el.checked = !!v;
        },

        _imgGet : function() {
            return this.el.src;
        },

        _imgSet : function(v) {
            this.el.src =  v;
        },

        _selectGet : function() {
            return this.$el.val();
        },

        _selectSet : function(v) {
            this.$el.val(v);
        },

        _get : function() {},

        _set: function() {},

        _findFn: function() {
            var tag = this.el.tagName,
                type = this.el.getAttribute('type');

            if ((tag === 'INPUT') && (type === 'radio' || type === 'checkbox')) {
                this._get = this._checkboxGet;
                this._set = this._checkboxSet;
            } else if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                this._get = this._valGet;
                this._set = this._valSet;
            } else if (tag === 'IMG') {
                this._get = this._imgGet;
                this._set = this._imgSet;
            } else if (this.el.textContent !== undefined) {
                this._get = this._textGet;
                this._set = this._textSet;
            } else {
                this._get = this._textGetIE;
                this._set = this._textSetIE;
            }
        }
    });

    //An element that can hold n views, views that are added the collectionView
    //are automatically inserted in the DOM. All views that are part of the collectionView
    //are listened in on for events by the views parent.
    var CollectionView = Element.extend(ViewsSubscriptions, {
        constructor : function(el) {
            CollectionView.__super__.constructor.call(this, el);
            this.subviews = [];
        },

        //adds a view to the collection, index is an optional parameter
        //if omitted the view gets appended to the end.
        //will also insert the view into the collections DOM element
        //into the position specified by the index
        //If a view is already a part of the collection it will be removed
        //and re-added with its new position.
        addView: function (view, index) {
            var subviews = this.subviews;

            if (!_.contains(subviews,view)) {
                (index != null) || (index = subviews.length);
                subviews.splice(index, 0, view);

                //bind to the remove method, so that we can remove this view
                //from our collection if it ever gets removed.
                view.on('remove', this.removeView, this);

                this._addViewEventObject(view);

                this.insert(view, index);

                if (this.emptyView) {
                    this.emptyView.$el.detach();
                }

                this.bootstrapViewSubscriptions(view);

            } else {
                this.removeView(view).addView(view, index);
            }

            return this;
        },

        //empties the element removing all subviews within.
        empty: function() {
            this._stopListeningToViewEvents();
            _.invoke(_.toArray(this.subviews), 'remove');
            this.subviews = [];

            if (this.emptyView) {
                this.$el.append(this.emptyView.$el);
            }

            return this;
        },
        //finds a given view within a collection that has the passed in model.
        //returns the first view found
        findWithEventObject: function (eventObject, name) {
            name || (name = "model");

            for (var i = 0, l = this.subviews.length; i < l; i++) {
                if (this.subviews[i].eventObjects[name] === eventObject) {
                    return this.subviews[i];
                }
            }

            return null;
        },

        //finds a given view who's element matches the passed in DOM element.
        findWithElement : function(el) {

            if (el instanceof Backbone.$) {
                el = el[0];
            }

            for (var i = 0, l= this.subviews.length; i<l; i++) {
                if (this.subviews[i].el === el) {
                    return this.subviews[i];
                }
            }

            return null;
        },
        //The method called to insert the view, can be override for custom behaviour
        insert: function(view, index) {
            var children = this.el.childNodes;

            if (children && children.length && children.length !== index) {
                this.el.insertBefore(view.el, children[index]);
            } else {
                this.el.appendChild(view.el);
            }

            return this;

        },
        //remove this collection as well as all the subviews it contains.
        remove: function () {
            this.empty();
            CollectionView.__super__.remove.call(this);
            if (this.emptyView) {
                this.emptyview.remove();
            }

            return this;
        },
        //remove a view from the collection, removing it from the DOM element
        //as well as turning off all events that this collection have bound to it
        removeView: function (view) {
            var index = _.indexOf(this.subviews, view);

            if (index >= 0) {
                this.subviews.splice(index, 1);
                view.$el.detach();
                this._removeViewEventObject(view);
                if (this.subviews.length === 0 && this.emptyView) {
                    this.$el.append(this.emptyView.$el);
                }
            }
            return this;
        },

        //set the emptyview to be used when the collection has no subviews
        setEmptyView : function(emptyview) {
            this.emptyView = emptyview;
            if (this.subviews.length === 0) {
                this.$el.empty().append(this.emptyView.$el);
            }
            return this;
        },

        bindToCollection : function(collection, model, createView) {
            if (this.subviews.length !== 0) throwError("Cannot set target on a non-empty view collection");

            if (this._target) {
                var old = this._target.collection;

                this
                    .unsubscribe(old, 'add', this._onAdd)
                    .unsubscribe(old, 'reset', this._onReset)
                    .unsubscribe(old, 'remove', this._onRemove)
                    .unsubscribe(old, 'sort', this._onSort);
            }

            this._target = {collection : collection, model: model, createView: createView};

            this
                .subscribe(collection, 'add', this._onAdd)
                .subscribe(collection, 'reset', this._onReset)
                .subscribe(collection, 'remove', this._onRemove)
                .subscribe(collection, 'sort', this._onSort);
        },

        _onAdd : function(model, options) {
            var view = this._target.createView(model),
                collection = this.eventObjects[this._target.collection],
                index = collection.last() === model ? null : _.indexOf(collection, model);

            this.addView(view, index);
        },
        _onReset : function() {
            var i, l,
                collection = this.eventObjects[this._target.collection],
                models = collection.models,
                options = {};

            this.empty();

            for (i=0, l=models.length; i < l; i++) {
                options.at = i;
                this._onAdd(models[i], options);
            }
        },
        _onRemove : function(model) {
            var view = this.findWithEventObject(model, this._target.model);
            this.removeView(view);
        },
        _onSort: function() {
            if (!this.autoSort) return;

            var i, l, model, view,
                collection = this.eventObjects[this._target.collection],
                models = collection.models;

            for (i=0, l=models.length; i < l; i++) {
                model = models[i];
                if (model !== this.subviews[i].eventObjects[this._target.model]) {
                    view = this.findWithEventObject(model, this._target.model);
                    this.$el.children().eq(i).before(view.$el);
                }
            }

        },
        _target : null,
        emptyView: null,
        subviews: null,
        autoSort: true
    });

    //Add a bunch of underscore methods to the viewCollection, in much of the same way as backbone.js does it.
    _.each([
            'forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
            'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
            'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
            'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
            'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
            'isEmpty', 'chain'
        ], function(method) {
        CollectionView.prototype[method] = function() {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(this.subviews);
          return _[method].apply(_, args);
        };
    });

    //Much like the CollectionView but can only hold a single view. Good for including a child
    //view that is predetermined before run-time.

    var ContainerView = Element.extend(ViewsSubscriptions, {
        constructor : function(el) {
            ContainerView.__super__.constructor.call(this, el);
        },
        insert: function(view) {
            this.$el.append(view.$el);
            return this;
        },
        empty: function() {
            if (this.subview) {
                this._removeViewEventObject(this.subview);
                this.subview.remove();
            }

            return this;
        },
        remove: function () {
            this.empty();
            ContainerView.__super__.remove.call(this);
            return this;
        },
        set : function(name, eventObject, options) {
            if (this.subview && this._synced && name !== 'el' && name !== 'view') {
                this.subview.set(name, eventObject);
            }

            return ContainerView.__super__.set.call(this, name, eventObject, options);
        },
        //set the sole subview of this containerView
        //the insert method will be used to by default; append the subview into the cointaer.
        //an optional 'synced' flag can be passed in, if a subview is 'synced' than all eventObjects
        //that are set on the container are automatically applied to the subview (but not vise-versa).
        setSubView: function(view, synced) {
            if (this.subview) {
                this._removeViewEventObject(this.subview);
                this.subview.remove();
            }

            if (view.el !== this.el) {
                this.insert(view);
            }

            this._addViewEventObject(view);

            if (synced) {
                _.each(this.eventObjects, function(eventObject, name) {
                    if (name !== 'el' && name !== 'view' && eventObject !== view.eventObjects[name]) {
                        view.set(name, eventObject);
                    }
                });
            }

            this._synced = synced;
            this.subview = view;

            this.bootstrapViewSubscriptions(view);

            return this;

        },
        subview: null,
        _synced: false

    });

    //A view that renders a template
    //by default only underscore templates are supported
    var TemplateView = Element.extend({
        //set the template to be used for this view, if 'true' is passed in instead
        //than the template will be the innerHTML of this views' DOM element.
        setTemplate: function(template) {
            if (template === true) {
                this._template = this.template(_.unescape(this.el.innerHTML));
                this.el.innerHTML = '';
            } else if (_.isString(template)) {
                this._template = this.template(Backbone.$(template).html());
            } else {
                this._template = template;
            }
        },
        render : function() {
            this.el.innerHTML = this._template(this.serialize());
            return this;
        },
        serialize : function() {
            return this.model.toJSON();
        },
        template: function(templateString) {
            return _.template(templateString);
        },
        _template: null
    });

    //A standard backbone view thats been extended
    //so that it can be accepted as a child of a collectionView or a viewContainer.
    var BBView = Backbone.View.extend({
        constructor : function(params) {
            Backbone.View.prototype.constructor.apply(this, arguments);
            this.eventObjects = {};
            this.eventObjects.el = this.$el;
            this.eventObjects.view = this;
            if (this.model) this.eventObjects.model = this.model;
            if (this.collection) this.eventObjects.collection = this.collection;
        },
        get : function(name) {
            return this.eventObjects[name];
        },
        set: function(name, eventObject, options) {
            var old = this.eventObjects[name];
            this.eventObjects[name] = eventObject;

            if (name === 'model') this.model = eventObject;
            else if (name === 'collection') this.collection = eventObject;

            if (options == null || !options.silent) {
                this.trigger('change', this, name, eventObject, old);
                this.trigger('change:'+name, this, eventObject, old);
            }

        },
        remove: function() {
            Backbone.View.prototype.remove.call(this);
            this.trigger('remove', this);
        },
        eventObjects: null

    });


    //builders are functions that given some structured data will configure a view in some specific way
    //used for things like setting up 2-way binding, subscribe elements to events, etc.
    var builders = (function() {

        var PLACEHOLDER = '{name}';
        var deffered = null;

        //Dom events are deffered as to not block the initial render
        //binding a large amount of dom events (typically during 2-way binding)
        //seems to take a signifcant amount of time.
        function addDefferedEvent(obj, subFn, eventName, event, fn) {
            if (!deffered) {
                deffered = [];

                setTimeout(function() {
                    _.each(deffered, function(d) {
                        d.obj[d.subFn](d.eventName, d.event, d.fn);
                    });

                    deffered = null;
                },0);
            }

            deffered.push({obj: obj, subFn: subFn, fn: fn, eventName : eventName, event: event});
        }

        function getElsWithAttr($template, attr) {
            var els = {},
                selector = "["+attr+"]";

            _.each(document.querySelectorAll ? $template[0].querySelectorAll(selector) : $template.eq(0).find(selector), function(el) {
                els[el.getAttribute(attr)] = el;
            });

            return els;
        }

        function subscribeEvent(element, eventObjectName, event, attribute, fn, subFn) {
            if (attribute === PLACEHOLDER) attribute = element.name;
            if (eventObjectName === 'el') {
                addDefferedEvent(element, subFn, eventObjectName, event, fn);
            } else {
                element[subFn](eventObjectName, attribute ? event + ':' + attribute : event, fn);
            }
        }

        function subscribeEvents (element, bindings, subFn) {
            var i, l, binding, attribute, event;

           for (i = 0, l = bindings.length; i < l; i++) {
                binding = bindings[i];
                subscribeEvent(element, binding.name, binding.event, binding.attribute, binding.fn, subFn);
            }
        }

        function subscribeDebouncedEvents (element, bindings, subFn) {
            var i, l, j, ll, k, lll, debounced, binding, attribute, event, fns;

           for (i = 0, l = bindings.length; i < l; i++) {
                debounced = bindings[i];
                fns = _.map(debounced.fn, debounce);
                for (j=0, ll = debounced.bindings.length; j < ll; j++) {
                    binding = debounced.bindings[j];
                    for (k = 0, lll = fns.length; k < lll; k++) {
                        subscribeEvent(element, binding.name, binding.event, binding.attribute, fns[k], subFn);
                    }
                }

            }
        }

        //simple method that takes care of basic 2-way binding
        function bindDomValue(domValue, binding) {
            var time,
                name,
                attribute,
                bindingSplit,
                domEvent,
                fromDOM,
                fromModel,
                type = domValue.el.tagName;

            name = binding.eventObject;
            attribute = binding.attribute;
            domEvent = binding.domEvent;

            fromDOM = binding.fromDOM ? binding.fromDOM(binding) : function() {
                this.eventObjects[name].set(attribute, this.val(), {origin: this.el});
            };

            fromModel = binding.fromModel ? binding.fromModel(binding) : function(model, v, options) {
                if (!options || options.origin !== this.el) this.val(v == null ? '' : v);
            };

            if (attribute === PLACEHOLDER) attribute = domValue.name;

            domValue.subscribe(name, 'change:'+attribute, fromModel);

            if (type === 'INPUT' || type === 'TEXTAREA' || type === 'SELECT') {
                addDefferedEvent(domValue, 'subscribe', 'el', domEvent, fromDOM);
            }
        }

       return {
            view : function (view, buildParams) {
                var attr = buildParams.attr,
                    els = getElsWithAttr(view.$el, attr),
                    defaults = buildParams.defaults;

                _.each(buildParams.elements, function(buildData, name) {
                   var el, element;

                   el = els[name];

                   if (el) {
                        delete els[name];
                        element = new buildData.Constructor({ el : el });
                        element.name = name;
                        view.addElement(name, element);
                        if (buildData.loader) buildData.loader.build(element, buildData.data);
                   }

                });

                if (defaults) {
                    _.each(els, function(el, name){
                        var element = new defaults.Constructor({el: el});
                        element.name = name;
                        view.addElement(name, element);
                        defaults.loader.build(element, defaults.data);
                    });
                }

                Kettle.elementLoader.build(view, buildParams);

            },

            element : function(element, buildParams) {
                if (buildParams.unknown) _.extend(element, buildParams.unknown);
                if (buildParams.bindings) subscribeEvents(element, buildParams.bindings, 'subscribe');
                if (buildParams.bindingsDebounced) subscribeDebouncedEvents(element, buildParams.bindingsDebounced, 'subscribe');
                if (buildParams.setup) {
                    for (var setups = buildParams.setup, i=0, l=setups.length; i<l; i++) setups[i].call(element);
                }
            },

            domValue : function(domValue, buildParams) {
                if (buildParams.bind) bindDomValue(domValue, buildParams.bind);
                Kettle.elementLoader.build(domValue, buildParams);
            },

            containerView : function(containerView, buildParams) {
                var subview = buildParams.subview || {},
                    set = subview.set,
                    View = subview.View,
                    synced = subview.synced;

                if (buildParams.eventsviews) subscribeEvents(containerView, buildParams.eventsviews, 'subscribeViews');
                if (buildParams.eventsviewsDebounced) subscribeDebouncedEvents(containerView, buildParams.eventsviewsDebounced, 'subscribeViews');
                if (View) containerView.setSubView(new View({render : false}), synced);
                else if (set) containerView.setSubView( _.isFunction(set) ? set.call(containerView) : set, synced);
                Kettle.elementLoader.build(containerView, buildParams);
            },

            collectionView : function(collectionView, buildParams) {
                var createView,
                    subviews = buildParams.subviews || {},
                    empty = subviews.empty;


                if (subviews.create) createView = subviews.create;
                else if (subviews.View) createView = function(model) {
                    var params = {};
                    params[subviews.model] = model;
                    return new subviews.View({eventObjects: params});
                };

                if (subviews.collection && subviews.model && createView)  {
                    collectionView.bindToCollection(subviews.collection, subviews.model, createView);
                }

                if (buildParams.eventsviews) subscribeEvents(collectionView, buildParams.eventsviews, 'subscribeViews');
                if (buildParams.eventsviewsDebounced) subscribeDebouncedEvents(collectionView, buildParams.eventsviewsDebounced, 'subscribeViews');
                if (empty) collectionView.setEmptyView(_.isFunction(empty) ? empty.call(collectionView) : empty );
                Kettle.elementLoader.build(collectionView, buildParams);
            },

            template : function(template, buildParams) {
                if (buildParams.template) template.setTemplate(buildParams.template);
                Kettle.elementLoader.build(template, buildParams);
            }
        };

    }());

    //parsers are a collection of (pure) functions that take DSL data passed through the Kettle Api
    //and transforms it to something more manageable and performant for the builder program.
    //It can be thought of a as a compile step that happens once during the definition of an Element.
    var parsers = (function() {

        var RPROP_DIVIDER = /\s+(?![^\[]*\]|[^\{]*\})/,
            RBRACKET_NOTATION = /(.*?)\[(.*?)\]/,
            RCURLY_BRACKET_NOTATION = /(.*?)\{(.*?)\}/,
            DOT_NOTATION = '.',
            EVENTS_NOTATION = '*',
            PREFIXES = ['*'],
            KNOWN_PARAMETERS =  [
                                    'bind', 'subview', 'subviews', 'template', 'group', 'groups',
                                    'collection', 'model', 'eventObjects', 'state', 'attr', 'el',
                                    'defaults', 'elements', 'setup'
                                ];


        //some messy code to extract events from an object literal.
        //events are properties that match either the dot notation
        //or the bracket notation of event declaration.
        //an optional prefix parameter can be passed in that will match
        //only the events with a given prefix (everything before the first dot)
        //and strip it out in the return.
        function getEvents(obj, prefix) {
            var prop, props, sprop, i , l, events, prefixChars,
                rtn = {};

            events =  obj;

            for (prop in events) {
                props = prop.split(RPROP_DIVIDER);
                for (i = 0, l = props.length; i < l; i++) {
                    sprop = props[i];
                    if (sprop.indexOf(DOT_NOTATION) >= 0) {
                        prefixChars = sprop.substring(0, 1);

                        if ((!prefix && !_.contains(PREFIXES, prefixChars)) || prefixChars === prefix) {
                            prefix && (sprop = sprop.replace(prefix, ""));
                            rtn[sprop] = combineIntoArray(events[prop], rtn[sprop]);
                        }
                    }
                }
            }

            var bracket = bracketToDot(obj);
            if (!_.isEmpty(bracket)) extendConcat(rtn, getEvents(bracket, prefix));

            return rtn;
        }

        function getDebouncedEvents(obj, prefix) {
            var prop, props,eventNames, event, key, debounce, i, l, exec, j, ll,
                prefixChars, rtn = [];

            for (prop in obj) {
                props = prop.split(RPROP_DIVIDER);
                for (i = 0, l = props.length; i<l; i++) {
                    debounce = {};
                    exec = RCURLY_BRACKET_NOTATION.exec(props[i]);
                    if (exec && exec[2]) {
                        event = exec[1];
                        eventNames = exec[2].split(RPROP_DIVIDER);
                        for (j = 0, ll = eventNames.length; j<ll; j++) {
                            key = event + DOT_NOTATION + eventNames[j];
                            prefixChars = key.substring(0, 1);
                            if ((!prefix && !_.contains(PREFIXES, prefixChars)) || prefixChars === prefix) {
                                if (!debounce.bindings) debounce.bindings = [];
                                prefix && (key = key.replace(prefix, ""));
                                debounce.bindings.push(key);
                            }
                        }
                    }

                    if (!_.isEmpty(debounce)) {
                        debounce.fn = _.isArray(obj[prop]) ? obj[prop] : [obj[prop]];
                        rtn.push(debounce);
                    }
                }

            }

            return rtn;
        }

        //converts events defined in the bracket notation into the dot notation.
        function bracketToDot(obj) {
            var props, prop, exec, i, l, j, ll, event, eventNames, key,
                rtn = {};

            for (prop in obj) {
                props = prop.split(RPROP_DIVIDER);

                for (i = 0, l = props.length; i<l; i++) {

                    exec = RBRACKET_NOTATION.exec(props[i]);

                    if (exec && exec[2]) {
                        event = exec[1];
                        eventNames = exec[2].split(RPROP_DIVIDER);

                        for (j = 0, ll = eventNames.length; j<ll; j++) {
                            key = event + DOT_NOTATION + eventNames[j];
                            rtn[key] = combineIntoArray(obj[prop], rtn[key]);
                        }
                    }
                }
            }

            return rtn;
        }

        //combines two values into a flat array, used to combine events together.
        function combineIntoArray(value, orig) {
            var rtn = _.isArray(orig) ? orig : [];
            _.isArray(value) ? rtn.push.apply(rtn, value) : rtn.push(value);
            return rtn;
        }

        //"flattens" an object literal: loops through the properties and
        //if the property name has a space in it, splits it up into two different
        //properties with equal values. eg: {"foo bar" : 'buzz'} will be {"foo": 'buzz', "bar": buzz}
        //but also takes into account the situation where a split property name already
        //already exists in the object, in which case
        //it merges them together with the original property name taking precedence.
        //eg : {"foo bar" : {buzz: '1', bizz: '2'}, "foo" : {buzz: '2'}} will be
        // {"foo" : {buzz: '2', bizz: '2'}, bar : {{buzz: '1', bizz: '2'}}}
        function flatten(buildData) {
            var i, l, prop, props, target, primary = {}, secondary = {},
                checkAmbigious = function(d, p) {
                    var t = target[props[i]];
                    if (t[p] && p !== 'bindings' && p !== 'eventsviews' && t[p] !== d) {
                        throwError("ambigious merging of property: " + props[i]);
                    }
                };

            for (prop in buildData) {
                props = prop.split(RPROP_DIVIDER);
                target = props.length === 1 ? primary : secondary;
                for (i = 0, l = props.length; i < l; i++) {
                    if (target[props[i]]) {

                        //some dirty code to prevent the merging of two secondary parameters
                        //since there is no way for the code to know how the merge
                        //was intended to behave, unless they're both arrays
                        //than we can concat them safely.

                        _.each(buildData[prop], checkAmbigious);

                        target[props[i]] = extendConcat({},target[props[i]], buildData[prop]);
                    } else {
                        target[props[i]] = buildData[prop];
                    }
                }
            }

            return extendConcat({}, secondary, primary);
        }


        function exctractUnknownParams(params) {
            var extentions = {},
                extractUnknown = function(chunk) {
                    var f = chunk[0];

                    if ((chunk.indexOf(DOT_NOTATION) === -1) && !RBRACKET_NOTATION.test(chunk) &&
                        !RCURLY_BRACKET_NOTATION.test(chunk) && !_.contains(KNOWN_PARAMETERS, chunk)) {
                        extentions[chunk] = params[prop];
                    }
                };

            for (var prop in params) {
                _.each(prop.split(RPROP_DIVIDER), extractUnknown);
            }

            return extentions;
        }

        function parseFn(fn) {
            if (_.isFunction(fn)) {
                return fn;
            } else if (_.isString(fn)) {
                return function() {
                    this[fn].apply(this, arguments);
                };
            } else {
                throwError("Not an acceptable value for an event method (must be a function or string");
            }
        }

        function extractModelEvents(params, prefix) {
            var bindings = [];

            _.each(getEvents(params, prefix), function(eventFns, eventString){
                var binding = getBindingObject(eventString);

                eventFns = _.isArray(eventFns) ? eventFns : [eventFns];
                _.each(eventFns, function(fn) {
                    bindings.push(_.extend({fn: parseFn(fn)}, binding));
                });
            });

            return bindings;
        }

        function extractModelDebouncedEvents(params, prefix) {
            var bindings = [];

            _.each(getDebouncedEvents(params, prefix), function(data) {
                var debounce = {};
                debounce.bindings = _.map(data.bindings, getBindingObject);
                debounce.fn = _.map(data.fn, parseFn);
                bindings.push(debounce);
            });

            return bindings;
        }

        function getBindingObject(eventString) {
            var binding, dotIndex, parts, attIndex, event, eventName, attribute;
            dotIndex = eventString.indexOf(DOT_NOTATION);
            event = eventString.substring(0, dotIndex);
            parts = eventString.substring(dotIndex + 1);
            parts = parts.split(":");
            eventName = parts[0];
            attribute = parts[1];

            binding = {name: event, event: eventName, attribute : attribute};

            return binding;
        }

        return {
            view : function(apiParams, groups) {
                var params, elements = {}, buildElements = {}, constructors = {},
                LOADERS = {
                    bind : {
                        Constructor : Kettle.DomValue,
                        loader: Kettle.domValueLoader
                    },
                    subview: {
                        Constructor : Kettle.ContainerView,
                        loader : Kettle.containerViewLoader
                    },
                    subviews : {
                        Constructor : Kettle.CollectionView,
                        loader: Kettle.collectionViewLoader
                    },
                    template : {
                        Constructor : Kettle.TemplateView,
                        loader: Kettle.templateViewLoader
                    }
                },
                wrapElement = function(data) {
                    var elemData,
                        found = 0;

                    _.each(['subview', 'subviews', 'template', 'bind'], function(param) {
                        if (param in data) {
                            found++;
                            elemData = _.extend({}, LOADERS[param]);
                            elemData.data = data;
                        }
                    });

                    if (found > 1) {
                        throwError("Only one of 'subview', 'subviews', 'template', 'bind' can exsist on an element");
                    } else if (found === 0) {
                        elemData = _.extend({}, LOADERS.bind);
                        elemData.data = data;
                    }

                    return elemData;
                };

                if (!_.isObject(apiParams)) return;

                //ran the view parameters through the elementLoader parser as each view is also an element
                params = _.extend({}, Kettle.elementLoader.parse(apiParams), groups);

                //if an attr property was not provided use the default one.
                params.attr || (params.attr = Kettle.defaultAttr);

                //pass the default element the parser as well using either the one declared on the view or the 
                //default one.
                if (apiParams.defaults || Kettle.defaultElement) {
                    params.defaults = wrapElement(Kettle.elementLoader.parse(apiParams.defaults || Kettle.defaultElement), groups);
                }

                //loop through the elements to determine which are constructors and which will be passed
                //into the element parser.
                _.each(apiParams.elements, function(data, name) {
                    if (_.isFunction(data)) {
                        constructors[name] = { Constructor : data};
                    } else {
                        elements[name] =  Kettle.elementLoader.parse(data, groups);
                    }
                });

                //Flatten the potentially grouped list of elements, loop through them and attach the correct
                //constructor and loader depending on the the properties of a given element.
                _.each(flatten(elements), function(data, name) {
                    buildElements[name] = wrapElement(data);
                });

                //attach the constructors to the list of elements
                elements = _.extend(buildElements, constructors);
                if (!_.isEmpty(elements)) params.elements = elements;

                return params;
            },

            element :  function(apiParams, groups) {
                var params = {}, group = apiParams.group;

                if (_.isString(apiParams) || _.isBoolean(apiParams)) {
                    apiParams = {bind : apiParams};
                }

                _.each(['template', 'attr', 'defaults'], function(prop) {
                    if (apiParams[prop] !== undefined) {
                        params[prop] = apiParams[prop];
                    }
                });

                params.bindings = extractModelEvents(apiParams);
                if (params.bindings.length === 0) delete params.bindings;

                params.bindingsDebounced = extractModelDebouncedEvents(apiParams);
                if (params.bindingsDebounced.length === 0) delete params.bindingsDebounced;

                params.eventsviews = extractModelEvents(apiParams, EVENTS_NOTATION);
                if (params.eventsviews.length === 0) delete params.eventsviews;

                params.eventsviewsDebounced = extractModelDebouncedEvents(apiParams, EVENTS_NOTATION);
                if (params.eventsviewsDebounced.length === 0) delete params.eventsviewsDebounced;


                if (apiParams.setup) params.setup = _.isArray(apiParams.setup) ? apiParams.setup : [apiParams.setup];

                if (apiParams.subviews) {
                    var subviews = _.isFunction(apiParams.subviews) ? {View : apiParams.subviews} : apiParams.subviews;
                    params.subviews  = subviews === true ? {} : _.extend({model : 'model', collection: 'collection'}, subviews);
                }

                if (apiParams.bind) {
                    var parts,
                        defaultBinding = {eventObject: 'model', attribute: '{name}', domEvent: 'change'},
                        bind = apiParams.bind;

                    if (_.isString(bind)) {
                        parts = bind.split(DOT_NOTATION);
                        bind = parts.length > 1 ? {eventObject : parts[0], attribute: parts[1]} : {attribute : parts[0] };
                    }

                    params.bind = bind === true ? defaultBinding : _.extend(defaultBinding, bind);
                }

                if (apiParams.subview) {
                    var subview = _.isFunction(apiParams.subview) ? {View : apiParams.subview} : apiParams.subview;
                    params.subview = subview === true ? {} : _.extend({synced: true}, subview);
                }

                params.unknown = exctractUnknownParams(apiParams);
                if (_.isEmpty(params.unknown)) delete params.unknown;

                if (group && groups) {
                    var build = _.map(_.isArray(group) ? group : [group], function(g) {
                        return groups[g] ? Kettle.elementLoader.parse(groups[g], groups) : {};
                    });

                    build.push(params);

                    params = _.foldl(build, function(a,b) {
                        var unknown = b.unknown;
                        delete b.unknown;
                        extendConcat(a, b);
                        if (unknown) a.unknown = _.extend(a.unknown || {}, unknown);
                        return a;
                    }, {});

                }


                return params;
            }
        };

    }());

    //A Loader is a simple mechanism for parsing and building element data as well as handling
    //any user "addons" to expand upon Kettle's DSL for building views.
    var Loader = function(parse, builder) {
        this._parse = parse;
        this._builder = builder;
    };

    _.extend(Loader.prototype, {
        //adds a new parser and builder function to the list of addons
        add : function(parse,builder) {
            (this._addons || (this._addons = [])).push({parse: parse, builder: builder});
            return this;
        },
        parse: function(parseData, groups) {
            var i, l, addon, addons,
                parse = this._parse(parseData, groups);


            if (this._addons) {
                for (i=0, l=this._addons.length; i<l; i++) {
                    addon = this._addons[i].parse(parseData, groups);
                    if (addon !== undefined) {
                        (addons || (addons = [])).push(
                            {
                                buildData : addon,
                                builder: this._addons[i].builder
                            }
                        );
                    }
                }

                if (addons) parse.addons = addons;
            }

            return parse;

        },
        build: function(obj, buildData) {
            var i,l, addons;

            this._builder(obj, buildData);

            if (buildData.addons) {
                addons = buildData.addons;
                for (i=0,l=addons.length; i<l; i++) {
                    addons[i].builder(obj, addons[i].buildData);
                }
            }

        },
        clear : function() {
            this._loaders = [];
            return this;
        }
    });


    //Kettles extend method, uses the Backbone extend method to give back an extended constructor
    //but not before running the parameters through the passed in parser
    var extend = function(Constructor,loader) {

        return function(params) {
            params || (params = {});

            var parsed, toExtend, attr, stateParams,
                collection = params.collection,
                state = params.state,
                model = params.model,
                groups = params.groups,
                eventTypes = params.eventTypes ? _.extend({}, params.eventTypes) : {},
                el = params.el || this.prototype._el;

            //put the collection with the other events
            if (collection) {
                _.extend(eventTypes, {collection : collection});
            }

            //put the model with the other events
            if (model) {
                _.extend(eventTypes, {model : model});
            }

            if (isPlainObject(state)) {
                stateParams = state;
                eventTypes.state = Backbone.Model;
            } else if (state) {
                eventTypes.state = state;
            }

            if (this.prototype._groups) {
                groups = _.extend({}, this.prototype._groups, groups);
            }

            //parse the passed into parameters into the specified parser so we can get
            //a simpler data structure for our builder to work with.
            parsed = loader.parse(params, groups ? _.extend({}, Kettle._groups, groups) : Kettle._groups);

            //save the parameters the parser did not understand as these will be used
            //to extend our new prototype
            toExtend = parsed.unknown || {};
            delete parsed.unknown;

            //if we are extending a view that also ran through the parser, extend the new parsed data
            //with this ones.
            if (this.prototype._parsed) {
                parsed = extendConcat({}, this.prototype._parsed, parsed);
            }

            //Do the same for the event groups
            if (this.prototype.eventTypes) {
                eventTypes = extendConcat({}, this.prototype.eventTypes, eventTypes);
            }

            if (this.prototype._stateParams) {
                stateParams = _.extend({}, this.prototype._stateParams, stateParams);
            }

            //extendObject is backbone's extend function
            return extendObject.call(this, _.extend({
                constructor : function(params) {
                    params || (params = {});
                    var prop,
                        eventObjects = _.extend({}, Kettle._globalEventObjects, params.eventObjects),
                        selector = (params.el || this._el) || "<div></div>",
                        el = Kettle.getEl(selector),
                        render = params.render == null ? true : params.render,
                        eventTypes = this.eventTypes;

                    if (params.collection) eventObjects.collection = loadEvent(params.collection, eventTypes.collection);
                    if (params.model) eventObjects.model = loadEvent(params.model, eventTypes.model);

                    if (params.state) {
                        if (isPlainObject(params.state)) eventObjects.state = loadEvent(_.extend(this._stateParams, params.state),  eventTypes.state);
                        else eventObjects.state = loadEvent(params.state, eventTypes.state);
                    } else if (this._stateParams) {
                        eventObjects.state = loadEvent(this._stateParams, eventTypes.state);
                    }

                    Constructor.call(this, { el : el} );


                    loader.build(this, this._parsed);

                    for (prop in eventObjects) {
                        this.set(prop, eventObjects[prop], {render: false});
                    }

                    this.initialize.apply(this, arguments);

                    for (prop in this.elements) {
                        this.elements[prop].initialize.apply(this.elements[prop], arguments);
                    }

                    if (render) this.render();
                },
                eventTypes: eventTypes,
                _stateParams : stateParams,
                _parsed : parsed,
                _el: el,
                _groups : groups
            }, toExtend));
        };
    };

    function loadEvent(event, EventType) {
        if (isPlainObject(event) || _.isArray(event)) {
            if (_.isFunction(EventType)) {
                return new EventType(event);
            } else {
                throwError("No constructor set for event.");
            }
        } else {
            return event;
        }
    }

    _.extend(Kettle, {
        VERSION: "0.1.0",
        //the default attribute that the viewBuilder will use to automatically populate the view with view domValue objects.
        defaultAttr: 'data-kettle',
        defaultElement : null,
        parsers : parsers,
        builders: builders,
        elementLoader: new Loader(parsers.element, builders.element),
        viewLoader: new Loader(parsers.view, builders.view),
        domValueLoader: new Loader(parsers.element, builders.domValue),
        collectionViewLoader : new Loader(parsers.element, builders.collectionView),
        containerViewLoader: new Loader(parsers.element, builders.containerView),
        templateViewLoader: new Loader(parsers.element, builders.template),
        noConflict: function() {
            root.Kettle = prevKettle;
            return this;
        },
        BBView : BBView,
        View : View,
        CollectionView : CollectionView,
        Element : Element,
        ContainerView : ContainerView,
        DomValue : DomValue,
        Loader : Loader,
        EventListeners: EventListeners,
        EventInterface : EventInterface,
        TemplateView: TemplateView,
        setGroup: function(name, data) {
            Kettle._groups[name] = data;
        },
        getGroup : function(name) {
            return Kettle._groups[name];
        },
        deleteGroup : function(name) {
            delete Kettle._groups[name];
        },
        setGlobal : function(objs) {
            var mainEventObjects = Element.prototype.mainEventObjects;
            _.extend(Kettle._globalEventObjects, objs);
            _.each(objs, function(obj, name) {
                if (Element.prototype[name] || View.prototype[name] || ContainerView.prototype[name] || CollectionView.prototype[name] || DomValue.prototype[name]) {
                    throwError("can't set a global event object with name "+ name + ". it's reserved on an Object prototype");
                } else if (_.contains(mainEventObjects, name)) {
                    throwError("can't set a global event object with name "+ name + ". it's already contained in the main events. (perhaps it's already been set)");
                }
                mainEventObjects.push(name);
            });
        },
        getGlobal: function(name) {
            return Kettle._globalEventObjects[name];
        },
        getEl : function(selector) {
            var meta, cache = this._elCache;

            if (_.isFunction(selector)) return selector();
            if (_.isObject(selector)) return selector;
            if (!_.isString(selector)) throwError("Selector must be a string!");

            if (cache[selector]) {
                meta = this._elCache[selector];
            } else {
                meta = {clone : false};
                meta.el = Backbone.$(selector)[0];
                if (meta.el == null) throwError("Element not found with selector: "+selector);
                if (meta.el.tagName === 'SCRIPT') {
                    meta.el = Backbone.$(trim(meta.el.innerHTML))[0];
                    meta.clone = true;
                }

                cache[selector] = meta;
            }

            return meta.clone ? Backbone.$(meta.el).clone()[0] : meta.el;
        },
        _globalEventObjects: {},
        _elCache: {},
        _groups: {}
    });

    Element.extend = extend(Element,Kettle.elementLoader);
    View.extend = extend(View,Kettle.viewLoader);
    CollectionView.extend = extend(CollectionView,Kettle.collectionViewLoader);
    ContainerView.extend = extend(ContainerView, Kettle.containerViewLoader);
    DomValue.extend = extend(DomValue, Kettle.domValueLoader);
    TemplateView.extend = extend(TemplateView, Kettle.templateViewLoader);

}).call(this);
