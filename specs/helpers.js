var helpers = {
    triggerDomEvent :function(elem, event) {
        var useJquery = !document.addEventListener || !document.querySelectorAll;

        if (useJquery) {
            $(elem).trigger(event);
        } else {
            var ev = document.createEvent('Event');
            ev.initEvent(event, true, true);
            elem.dispatchEvent(ev);
        }
    }
}
