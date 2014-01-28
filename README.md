# Kettle

Kettle is a library for writing UI elements in javascript using Backbone's Model/Collection/Routers.

##Overview

The Kettle library attempts to facilitate a different approach to writing views, where each view is seen as a set of independent elements that share a common model(s)
and are mapped 1:1 to a DOM Element.

Each element is thought of as a separate unit that performs a very specific role within a view, it does so by responding to events. These events would typically come from the
user (click, mouseover,etc) or from a model/collection/router.

This approach allows for views to be declarative , decoupled and efficient at rendering and re-rending themselves upon change.

Have a look at 'examples/todoMVC' for an example and a general idea of how this achieved with Kettle.

## Size/Version

Uncompressed size: 73761 bytes.  
Compressed size: 4885 bytes gzipped (24117 bytes minified).  
Version: 0.1  
Production Ready: false  

## Dependencies

* underscore/lodash
* jQuery/Zepto
* Backbone

## Example

Plain HTML templates:
```html
<div id="todos">
    <h3>My Todos:</h3>
    <input type="text" data-kettle="newTodo"/>
    <button data-kettle="addTodo">Add Todo</button>
    <div data-kettle="todoList"></div>
    <button data-kettle="removeCompleted">Remove Completed</button>
</div>

<script id="item" type="text/template">
    <div>
        <input type="checkbox" data-kettle="completed"/>
        <input type="text" data-kettle="title"/>
        <button data-kettle="remove">X</button>
    </div>
</script>
```

The javascript:
```javascript
$(function(){
var TodoItem = Kettle.View.extend({
    el: '#item',
    "model.destroy" : function() {
        this.remove();
    },
    elements : {
        "completed" : 'model.completed',

        "title" : {
            bind : 'model.title',
            "model.change:completed" : function(model, completed) {
                this.$el.prop('disabled', completed);
            }
        },

        "remove" : {
            "el.click" : function() {
                this.model.destroy();
            }
        }
    }
});

var Todos = Kettle.View.extend({
    el: '#todos',
    state : { "newTodo": ''},
    elements : {
        "newTodo": 'state.newTodo',

        "todoList" : {
            subviews : TodoItem
        },

        "addTodo" : {
            "el.click" : function() {
                this.collection.add({
                    title : this.state.get('newTodo'),
                    completed: false
                });

                this.state.set('newTodo', '');
            }
        },

        "removeCompleted" : {
            "el.click" : function() {
                _.invoke(this.collection.where({completed: true}), 'destroy');
            },
            "collection[add remove reset change:completed]" : function() {
                this.$el.toggle(this.collection.where({completed : true}).length > 0);
            }
        }

    }
});

var tasks = [
    {title: "Make js library", completed: true}, 
    {title : "Make it production ready", completed: false}
];

var todos = new Todos({collection: new Backbone.Collection(tasks), state: {newTodo: "What's next?"}});

var newTasks = [
    {title: "Go outside.", completed: false}
];

//swap the old collection with the new one, re-rending the view with the new task.
todos.set('collection', new Backbone.Collection(newTasks));

});

```
## View

A *view* consists of any number of child *elements*. Each *element* of the *view*
is its own separate object responsible for only itself and should not be able to access any other *element*
of the *view*. (Although this is not strictly enforced).

A *view* is represented by a single DOM element, each of the *view* child *elements* are also represented by a single DOM element that
are contained within the *view* DOM element

A *view* requires a plain html template in order to be rendered, a template can either be provided on the *view*
definition, the instantiation, or both, with the template provided on instantiation taking precedence.

Example:

```html
<div id="view">
    <span data-kettle="foo"></span>
</div>
```

```javascript
var View = Kettle.View.extend({
    //Specify the attribute used to identify child elements (default : data-kettle)
    attr : 'data-kettle'
    //The default template to use for this view
    el: '#view', 
    //A click event bound to the parent DOM element (top most <div>);
    "el.click" : function() { 
        //context here resolves to the view itself
        console.log(this);
        //the jquery object reprensting the view topmost DOM element
        console.log(this.$el);
         //object that holds the refrences to all the individual element objects
        console.log(this.elements);
    },
    elements : { 
        //List of all the child dom elements that will map to the ones found in the template
        "foo" : {
            //a click event bound to views child 'span' element
            "el.click" : function(e) {
                //context here resolves to child element object, not the parent view
                console.log(this);
                //this jquery object representing the child's DOM element, not the parent view element
                console.log(this.$el);
                //the parent view
                console.log(this.view); 
            },
            //a function to run when a change event fires on the 'model' eventObject
            "model.change" : function() {} 
        }
    }
});
```
## Event Objects

A *view* can have any number of subscriptions to any number of *event objects*.
*event objects* are javascript objects that can trigger events. They are the core of a Kettle *view*.
Currently that includes anything that mixes in with `Backbone.Events` or that is a `jQuery`/`Zepto` object.

A *view* subscribes to events by referencing an *event object* by name. The view holds a record of each event that it subscribes to.
This allows for swapping an *event object* under the same name, which will unbind all subscribed events on the old *event object* and binding them
to the new one. Individual *elements* of a *view* will have their own subscriptions but will share the *event objects* with their parent *view*.
With the exception of the `'el'` *event object*, which is unique to each *element* and is its own `jQuery`/`Zepto` object.

Aside from the `'el'` *event object* a *view* (and all of its *elements*) also has the `'view'` *event object* which is the *view* itself.

*event objects* can be accessed from the `'eventObjects'` property on both the *view* and its *elements*.
`'model'`, `'collection'` and `'state'`are also available as a direct property of the *view*/*element* for convenience, as they are most common.

*event objects* can be set upon instantiation of a view :

```javascript
new View({eventObjects: { someModel: aModel, someCollection: a Collection}});
```

The `'model'`, `'collection'` and `'state'` event Objects can also be passed at the root of the options object.

```javascript
new View({model: aModel}); //same as bellow
new View({eventObjects : {model: aModel}});
```
*event objects* can also be set via the `set` method after instantiation:

```javascript
view.set('model', newModel);
```

Where the first parameter is the name and the second is the *event object*. Upon setting a new *event object* the view will re-render itself accordingly.


## General Structure

Kettle uses its own structure to define a *view* and its *elements*. The structure attempts to give focus to each individual element and the 
events that they respond to.

### Events Structure

When defining a *view*, events can be written in either dot or bracket notation.

#### Dot Notation

`eventObject.eventName`

Events can be bound to a *view* or its *elements* using the dot notation. Where the name before the dot is the name of the
*event object*. The word after the dot is the name of the event, For example: `model.change` or `model.change:attribute`

#### Square Bracket Notation

`eventObject[eventName1 eventName2]`

Events can also be bound using the bracket notation. This allows for easily binding multiple events on the same *event object*.
The word before the brackets is the name of the *event object* while the words in the brackets, which are separate by a space
are the event names. For example: 'collection[add remove reset]'

#### Curly Bracket Notation

`eventObject{eventName1 eventName2}`

Curly brackets work much the same way as square brackets with one important distinction; all events bound with the curly bracket 
notation will be called only one time once the call stack has cleared. (debounced). It can be useful for example, when you need
to calculate some aggregated data that needs to be recalculated when a new model is added/removed to/from a collection.

### Properties

Below is a list of valid properties that can be defined on a *view*/*elements*

#### On both the *view* and *element*  

dot-notation events: events bound to the view/element in the dot-notation.  
bracket-notation events: events bound to the view/element in the bracket-notation  
curly bracket-notation events: events bound to the view/element in the curly bracket notation (debounced)  
`group`: a group or array of groups that the view/element inherits its behavior from  
`setup`: a method (or array of methods) that will be called after this element/view has been instantiated, typically to modify `el`  

#### Only on the *view*:  

`state` : an object literal of all the default values that get initially set for the view's state model.  
`model` : the primary model Constructor of the view (if applicable, used for type-checking)  
`collection` : the primary collection Constructor of the view (if applicable, used for type checking)  
`eventobjects` : an object literal of all other *event objects* Constructors  
`elements` : the list of elements belonging to the view  
`groups` : a list of groups belonging to the view  
`attr` : the attribute used to load the *elements* from the template (default 'data-kettle')  
`el` : the default element/template to use for this view  
`initialize(args)` : the initialization function to be called for the view, with the parameters passed in from `new`  

#### Only on the *element*:  

`bind`: a string in the notation of `eventObject.attribute` or an object literal containing options for two way binding.  
`subviews`: 'either a flag, an object literal with options or a view constructor, which indicate that this element is a view collection  
`subview`: either a flag, an object literal with options or a view constructor, which indicate that this element is a view container  
`template`: a flag or a selector indicating that this element is a template  

Note: only one of `bind`, `subview`, `subviews`, `template` can exists on an individual element.  

### Other Properties

Properties that are not expected by the Kettle parsers (any property not listed in the above), will added to the instance instead.

```javascript
var View = Kettle.View.extend({
    'foo' : 'bar',
});

var view = new View();
console.log(view); //bar
```
## View State

At times your *view* will require its own state, one which is specific to the *view* and thus does not belong on a model. For example,
a folder view may have a display state, where the values can either be 'minimal' or 'detailed'. If you specify a `state` property
within the *view* than Kettle will automatically create a `Backbone.Model` for you which will represent the view state.
You can then use the state like you would any other model.

Example: 

```javascript
var FolderView = Kettle.View.extend({
    state : {
        display: 'detailed'
    },
    elements : {
        icon : {/*...*/},
        name : {/*...*/},
        filesize : {
            "state.change:display" : function(state, display) {
                this.$el.toggle(display === 'detailed');
            }
        }
    }
});

var folder = new FolderView({state : {display : 'minimal'}});
```

Since a state is just a Backbone.Model it can be passed around from one view to another, in order to share state or to load your view
in a particular starting state. Or to have a mediator/controller listen in to the state of a view and perform an action when there's a change.

## View Events

A view extends from Backbone.Events and triggers some built in events:

`change (view, name, newEventObject, oldEventObject)` - When an *event object* has been changed  
`change:name (view, newEventObject, oldEventObject)` - When a specific *event object* has been changed, e.g.: `change:model`  
`render (view)` - When the view has been rendered  
`remove (view)` - When a view has been removed  

## Groups

At times you will have multiple *elements* that perform the same action for a particular event, these *elements* can be
logically grouped together so that they can share behaviors:

```javascript
Kettle.View.extend({
    elements : {
        "saveButton" : {
            "model.change:editing" : function(model, editing) {
                this.$el.toggle(editing === true);
            },
            "el.click" : function(e) {//save logic}
        },
        "deleteButton" : {
            "model.change:editing" : function(model, editing) {
                this.$el.toggle(editing === true);
            },
            "el.click" : function(e) {//delete logic}
        }
    }
});
```

In the above example both the save and delete buttons get their visibility toggled when the editing attribute on the model
changes, resulting in duplicated code. Since both of these *elements* appear to share behaviour we can group them together.


```javascript
Kettle.View.extend({
    groups : {
        "editableItem" : {
            "model.change:editing" : function(model, editing) { 
                this.$el.toggle(editing === true);
            }
        }
    },
    elements : {
        "saveButton": {
            group: 'editableItem',
            "el.click" : function(e) {//save logic}
        },
        "deleteButton" : {
            group: 'editableItem',
            "el.click" : function(e) {//delete logic}
        }
    }
});
```

In the above example we group the save and delete buttons together and have them share common functionality.
An *element* can also belong to a list of groups by specifying the groups within an Array.

### Global Groups

Groups can also be defined on a global level to be available to every View. This can be done with the `setGroup(groupName, data)`
on the `Kettle` object. e.g. `Kettle.setGroup('global-group', {})`, There are also `getGroup(groupName)` and `removeGroup(groupName)`
if you need to modify existing groups.

### Anonymous Groups

An *element* can also share functionality without formally defining a group, by using space separated property names:

```javascript
Kettle.View.extend({
    elements : {
        "saveButton deleteButton" : {
           "model.change:editing" : function(model, editing) {
                this.$el.toggle(editing === true);
            }
        },
        "saveButton": {
            "el.click" : function(e) {//save logic}
        },
        "deleteButton" : {
            "el.click" : function(e) {//delete logic}
        }
    }
});
```

## Multi-Property declarations

Multiple properties of an *element* can also share the same value by separating the properties with a space.

Example demonstrating making an event alias.

```javascript
Kettle.View.extend({
    elements : {
        "list" : {
            subviews: true,
            "collection.add addItem": function(model) {
                this.addView({model: model});
            },
            "collection.reset" : function() {
                this.collection.each(this.addItem,this);
            }
        }
    }
});
```

Example demonstrating binding multiple events to the same method

```javascript
{
    "model1.change model2.change" : function(model, val, options) {}
}
```

## View Collection

A *collection view* manages a variable number of *sub views*, a *collection view* can be defined by setting the `subviews` property on an element
declaration. It will typically manage *sub views* automatically for you given a `Backbone.Collection`. Events such as `add`, `remove`, `reset` 
and `sort` will be handled by the *collection view*. By default the *collection view* will assume to operate on a `Backbone.Collection`
called `"collection"` and a model called `"model"` on each of the *sub views*. Manual control of *sub views* may also be enabled.

A `ViewCollections` is also able to listen to events on any *event object* of the added *sub views*. To listen to a *sub views* *event object*
prepend an event in dot or bracket notation with a '\*' character.

```javascript
Kettle.View.extend({
    elements : {
        "list" : {
            subviews: AView //Where "AView" is a view constructor
            "*view.change" : function(view) {
                console.log("This event came from a subview");
            },
            "*model.change" : function(model,value){
                console.log("This event came from a subview's 'model' eventObject");
            },
            "*el.click" : function(e) {
                console.log("This event came from a subviews DOM element");
            }
        }
    }
});

```

If you need to specify how the *sub views* gets constructed than you can use the `create` property:

```javascript
Kettle.View.extend({
    elements : {
        "list" : {
            subviews : {
                create : function(model) {
                    return new AView({model : model});
                }
            }
        }
    }
});
```

The `create` property is a function that accepts a `Backbone.Model` and expects a new *view* to be returned, this way you can control exactly how
each *view* in the *collection view* gets instantiated.

Other options that can be part of the `subviews` are:

`View` : the *view* constructor to be used for automatic instantiation by the *collection view*  
`create`: the function used to instantiate new views in the *collection view* given a `Backbone.Model`  
`collection`: the name of the `Backbone.Collection` *event object* that will be used to manage *sub views*. default : `'collection'`  
`model` : the name of the model used by each *sub view*. default: `'model'`  
`empty`: A *view* that will be displayed if there are no *sub views* currently in the *collection view*  

Note: if you wish to manually manage *sub views* without having events automatically bound for you, you can do so by omitting either
the `create` or `view` properties, or by simply setting `subviews : true`

## View Container

A *container view* can hold exactly one *view*. That *view* can either be predetermined upon instantiation or after. It can be swapped for another *view* at
any time. Much like the *collection view*, a *container view* can listen to its child *view* for any events it emits or any events emitted by the
*event objects* it has. 

A *container view* can be defined on an element by including the `subview` property.

By default a *sub view* will receive all the *event objects* of the *container view*, and will get them updated if ever the *container view* changes its
*event objects* (but not vise-versa).

```javascript
Kettle.View.extend({
    elements : {
        "container": {
            subview : AView
        }
    }
});
```

If you need to specify how the *sub view* gets constructed than you can use the `'set'` property:

```javascript
Kettle.View.extend({
    elements : {
        "container" : {
            subview : {
                set : function() {
                    return new AView();
                }
            }
        }
    }
});
```

Other options that can be passed into the `subview` are :

`View`: the view constructor to be used for automatic instantiation by the container
`set`: the function used to instantiate a new *view* in the container
`sync`: whether the *sub view* will automatically possess the *event objects* of the *container view*

Note: to not set any *sub view* initially but to indicate that the *element* is indeed a *container view* you can set the `subview` property to `true`.

## Template View

A *template view* is a view that is able to render a template (by default underscore templates). *template view* is a good fit for when you have DOM elements
that are tied to model attributes but with little interaction. On a *template view* events can only be easily bound on the top level element. To enable an element
to be a *template view* set the `template` property on an element definition. A value of `true` will grab the template code from inside the DOM element.
Alternatively a selector can be used as well to grab the template from within another script tag.


```html
<div id="view">
    <div data-kettle="contact">Name : <%= name %> - Phone : <%= phone %><div>
</div>
```

```javascript
Kettle.View.extend({
   el: '#view',
   elements : {
        name : {
            template : true,
            "model.change" : function(model, name) {
                this.renderTemplate(model.toJSON());
            }
        }
   }
});

var view = new View({model: {name : "Jane Doe", phone : "555-5555"}});
```

## Two-way binding

Two-way binding in Kettle can be enabled by setting the bind property to an object within an element definition.

The properties that can be set on the bind object are:  
    'eventObject' - the name of the eventObject that that the binding will apply to. default : 'model'  
    'attribute' - the name of the attribute that will be two-way binded on the eventObject. default : same as element name.  
    'domEvent' - the dom event that needs to get trigged for the eventObject to get updated. default: 'change'  

Note: as a convenience if the bind value is set to `true` it is equivalent to `{}`, meaning all default values will be used.  

A string will also be accepted in the format `model.attribute`, where 'model' is the name of the *event object* and 'attribute' is
the attribute that you wish to bind to on it.


### Custom binding methods

You can also declare your own functions that describe how a model attribute binds to a DOM element and vice-versa. This can be
useful when dealing with a `jQuery` widget for example.

To override the default behaviour of 2-way binding you can use the following properties within a `bind`:  
    `fromDOM` - a function that given an object containing binding data will return a function that performs the binding from DOM->Model  
    `fromModel` - a function that given an object containing binding data will return a function that performs the binding from Model->DOM  

Example: you want to use the `jQuery` datepicker widget for a date field and store the values as epoch times in your model  

``` javascript
Kettle.setGroup("datepicker", {
    setup : function() {
        this.$el.datepicker();
    },
    bind : {
        fromDOM : function(binding) {
            return function(e) {
                var epoch = +this.$el.datepicker("getTime"),
                    model = this.eventObject[binding.eventObject];

                model.set(binding.attribute, epoch);
            }
        },
        fromModel : function(binding) {
            return function(model, epoch, options) {
                this.$el.datepicker("setTime", epoch);
            }
        }
    }
});

Kettle.View.extend({
    elements : {
        "date1" : {
            group: 'datepicker',
            bind: 'model.startDate'
        },
        "date2" : {
            group : 'datepicker',
            bind: 'model.endDate',

        },
        "date3" : {
            group : 'datepicker',
            bind: 'model.otherDate'
        }
    }
});

```

## View Rendering

The render method on a *view* is optional, meaning a *view* is able to render itself by default based
on the events it responds to. During the rending phase the *view* is bootstrapped by running certain
event delegated methods, these methods are ran as though they are originated from the *event object* itself.
Essentially they are "faked" for the purpose of bootstrapping the *view* in the proper initial state.

Note: When events are faked during the rendering phase the 'bootstrap' property
in the options object is present and set to 'true', in case the event delegated method ever
needs to distinguish between a real and "fake" event.

### Rendering Events

Upon initialization, any *view* or *element* that subscribe the following events will automatically be called.

#### Backbone.Model
* `change`
* `change:*`
* `add` (only if part of a collection)
* `all`

#### Backbone.Collection
* `reset`
* `all`

#### Backbone.Router
* `route` (only called if the last called route was triggered by the same router)
* `route:*` (same as above but also if the route matches the last called route)


## Event Execution Order

Events attached to a *view* or its *elements* are not guaranteed to execute in any particular order. Therefore your methods should not
rely on any kind of order of execution. The only order that is guaranteed is that events on the *view* will execute before any of
the child *elements*.

## Global Event Objects

If your application has a global *event object*, such as the `Backbone` event bus or a app model, you can can have it
automatically be accessible to every created *view* using `Kettle.setGlobal`.

```javascript
Kettle.setGlobal('Bus', Backbone);

var View = Kettle.View.extend({
    "Bus.log" : function(msg) {
        console.log(msg);
    }
});

var view = new View();
Backbone.trigger("log", "foo");
```
## Other Kettle Objects

The `Kettle.View` object may  have *elements* that are a *collection view*, *container view*,*template view*, etc, but you can also
declare each of those things as its own separate entity. For example if you just want to have a *collection view* with
out any other elements you can extend `Kettle.ViewCollection`, or if you wish to render a simple template you extend a
`Kettle.TemplateView`, etc. Upon extension, the constructors that get returned can even be used as a value to an *element* in a *view*.

```javascript
var List = Kettle.CollectionView.extend({
    el: "#list",
    subviews : Item,
    "collection.change" : function() {},
});

var View = Kettle.View.extend({
    el: "#view",
    elements :{
        "list" : List
    }
})
```

## Extending Kettle Structure

You can extend Kettle's structure to add your own options to all Kettle elements.
To do so you can call the `add` method on the following objects:

`Kettle.elementLoader` To add an option for all Kettle Objects  
`Kettle.domValueLoader`  
`Kettle.collectionViewLoader`  
`Kettle.containerViewLoader`  
`Kettles.templateViewLoader`  
`Kettles.viewLoader`  


```javascript
Kettles.elementLoader.add(function(options) {
    return options.className;
},
function(element, className) {
    element.$el.addClass(className);
});

var View = Kettle.View.extend({
    className: "foo",
    elements : {
        "foo" : {
            className : "foo"
        }
    }
});
```

The `add` method accepts two functions, the first function is the parser function, which will receive all the initial parameters
of the element and return some value. The parser function will execute only upon the initial definition of the element.
The second function is the builder function which will execute on every instantiation of the element and get the value 
returned by the parser function as its first parameter.

Note: Returning undefined from the parser function will cause the builder function not to execute.


## Extending Kettle Objects

When an *element* gets extended with the `extend` method, not only are you extending the prototype but also the
behaviour of the parent, any events that were subscribed to on the parent will also be subscribed to on the child.

```javascript

var ParentView = Kettle.View.extend({
    elements : {
        "foo" : {
            "model.change:foo" : function(m, v) {
                console.log("parent :" + v);
            }
        }
    }
});

var ChildView = ParentView.extend({
    el : '<div><div data-kettle="foo"></div></div>',
    elements : {
        "foo" : {
            "model.change:foo" : function(m, v) {
                console.log("child :" + v);
            }
        }
    }
});


child = new ChildView(model : new Backbone.Model({foo : 'bar'})); //logs -> 'parent: bar' , 'child: bar'

```
## BBView

For some views the structure that Kettle provides might not be a good fit, in those situations a `BBView` can be used. `BBView` is a plain
`Backbone.View` which has been extended and adapted slightly so that it can be included as part of a *collection view* or a *container view*.
Anyone familiar with `Backbone.View` should feel right at home with `Kettle.BBView` the only caveat is that if a model or collection need
to be changed on a `Kettle.BBView` it must be done via the `set` method. eg.: `bbView.set('model',newmodel)`;










## API

### Element

Element is the base object which all other objects inherit from.

#### Properties

`eventObjects` : A hash of all the event objects available to this view.  
`view` : the parent view element  
`el` : the DOM Node  
`$el` : the `jQuery` Object  
`model` : an alias for `eventObjects.model`  
`collection` : an alias for `eventObjects.collection`  
`state` :  an alias for `eventObjects.state`  

#### Methods

`bootstrapSubscriptions([\*arguments])` : runs the bootstrapping logic on provided subscriptions. If no arguments provided runs it on all.  
`hasSubscription` : returns a boolean if a subscription to a given *event object* exists.  
`get(name)` : retrieve a specific *event object* by name
`remove()` : remove the element from the DOM and unsubscribe from all events (default options: {silent: false})  
`render(options)` : render the element (default options: {silent : false});  
`set(name, eventObject, options)` : sets a new event object for a given name, unsbscribing from all events on the old event object,  
    and subsribing to the new one. Default options : {silent: false, render: true}  
`subscribe(name, event, fn)` : subscribes to a new event given the name of an event object, the event name and the function  
`unsbscribe(name, event, fn, attribute)` : Unsubscribe from an *event object* by name, you can also unsubscribe from specific events or functions  
    by providing further paremeters.  
`unset()` : unset an *event object* by name  


### View

####Properties

`elements`: all the children elements that are added to the view  

#### Methods

`addElement(name, element)` : Add a new element to the view, the added element will inherit all of the views *event objects* (except for 'el')  
`remove()` : removes the element from the DOM and unsubscribes to all events, does the same on all child elements  
`render(options)` : renders the view and all child elements, triggers a `render` event on the view.  
`removeElement(element)` : removes an element from the view, element parameter can be either the name of the element or the element itself.  
`set(name, eventObject, options)` : sets a new *event object* for a given name on the view as well as all the child elements.  

### DomValue

*dom value* is an element that holds a single value like a string. It is the Element used for two way binding.  
When Constructing a view it is the Element that gets instantiated when a `bind` parameter is used in an *element* declaration, or when   
either of `subview`, `subviews`, or `template` properties are omitted.  

#### Methods

`val()` returns the value of a DOM element  
`val(value)` : sets a value on the DOM element, the method for setting the value differs based on what type of element it is.
    For example if it is an input element the `value` attribute will be set, if it's a div or a span the `textContent` will be set,
    if it is a checkbox the `checked` property will be set ... etc.  

### CollectionView

*collection view* manages multiple *sub views*, either automatically by watching a specific `Backbone.Collection` or manually.  
When constructing a view it is the Element that gets instantiated when a `subviews ` parameter is used in an element declaration.

#### Properties

`subviews` : An array of views added to the *collection view*  

#### Methods

`addView(view, index)` : At a view at a given index (or at the end if omitted). Will also insert the view within the DOM element of the 
    *collection view*. If the view already exists in the collection, will remove it and re-add it to the correct index.  
`bootstrapViewSubscriptions([\*arguments])` : runs the bootstrapping logic on provided sub-view subscriptions. If no arguments provided runs it on all.  
`empty` : remove all views from the *collection view*, this will effectively destroy them and unbind all their events.  
`findWithEventObject(eventObject, name)` : find a view within a collection given a specific *event object*, if name is omitted it defaults to 'model'  
`findWithElement(el)` : find a view within a collection given a DOM element (can also pass a $ object, but only first element will be used);  
`hasViewSubscription` : returns a boolean if a subscription to a given *sub view* *event object* exists.  
`insert(view, index)` : inserts a particular view in a particular index of the DOM. Meant for over-ridding if you wish to include your own logic
    as to how the views should be inserted into the collection (eg. in reverse order);  
`remove`: empty the *collection view* and remove it from the DOM, also unbinds all events.  
`removeView(view)` : remove a specific view from the *collection view*, this will not unbind any events on the view.  
`setEmptyView(view)` : set the view to display when the collection has no views.  
`setTarget(collection, model, create)` : set the collection to keep track of (by name). In order to automatically bind add, remove, reset and sort events.  
    The model name will be the name of the eventObject that the subview will hold for each model of the collection and finally the create parameter is a
    function that given a model will return a new view.  
`subscribeViews(name, event, fn)` : subscribes to a new event on a *sub view* given the name of an event object, the event name and the function  
`unsbscribeViews(name, event, fn, attribute)` : Unsubscribe from a *sub views* *event object* by name, you can also unsubscribe from specific events or functions
    by providing further paremeters.  

### ContainerView

*container view* is an element that contains within it exactly one view (or *dom value*, *collection view* etc). The view it contains can be swapped  
for another at any time, with the option to have it share *event objects* with the parent *container view*. When constructing a view a *container view*
will get instantiated when a `subview` parameter is used in an element declaration.

#### Properties

`subview` : the *sub view* that exists within the *container view*.  

#### Methods

`bootstrapViewSubscriptions([\*arguments])` : runs the bootstrapping logic on provided sub-view subscriptions. If no arguments provided runs it on all.  
`insert(view)` : Inserts a view within the body of the `contaienrView`. Meant for overriding if you wish to include your own logic as to how  
`empty` : Empties out the container view, destroying the *sub view* if there is one  
`hasViewSubscription` : returns a boolean if a subscription to a given *sub view* *event object* exists.  
    the view should be inserted, by default its with `$el.append`.
`remove` : remove the *container view* as well as the *sub view* it holds  from the DOM and unbinding all subscriptions.  
`setSubView(view, synced)` : sets a new *sub view*, removing the old one if it exists and thus unbinding all its subscriptions. If the synced option is set to
    `true` than the subview will inherit all *event objects* of the *container view*  
`subscribeViews(name, event, fn)` : subscribes to a new event on a *sub view* given the name of an event object, the event name and the function  
`unsbscribeViews(name, event, fn, attribute)` : Unsubscribe from a *sub view* *event object* by name, you can also unsubscribe from specific events or functions  
    by providing further paremeters.
