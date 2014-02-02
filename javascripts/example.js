var TodoItem = Kettle.View.extend({
    el: '#item',
    "model.destroy" : function() {
    this.remove();
    },
    elements : {
    "completed" : 'model.completed',

    "title" : {
        bind : 'model.title',
        "model.change:completed" : function(model, value) {
        this.$el.toggleClass('done', value);
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
    "newTodo": {
        bind : 'state.newTodo',
        "view.add" : function() {
            this.$el.focus();
        }
    },

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
        this.view.trigger('add');
        },
        "state.change:newTodo" : function(model, value) {
        this.$el.prop('disabled', value === '');
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

var todos;
$(function() {

var tasks = [
    {title: "Make js library", completed: true}, 
    {title : "Go Outside.", completed: false}
];

todos = new Todos({collection: new Backbone.Collection(tasks), state: {newTodo: "What's next?"}});

});

//hack hack hack
$(function() {
    $switchcs = $('#switch_cs');
    $switchjs = $('#switch_js');

    $switchcs.click(function() {
        if (window.localStorage) delete localStorage.js;
        $switchjs.removeClass('selected');
        $switchcs.addClass('selected');
        $('.lang-js, .language-javascript').hide();
        $('.lang-cs, .language-coffeescript').show();
    });

    $switchjs.click(function() {
        if (window.localStorage) localStorage.js = true;
        $switchcs.removeClass('selected');
        $switchjs.addClass('selected');
        $('.lang-js, .language-javascript').show();
        $('.lang-cs, .language-coffeescript').hide();
    });

    if (window.localStorage && localStorage.js) {
        setTimeout(function() {$switchjs.click();},0);
    }
});
