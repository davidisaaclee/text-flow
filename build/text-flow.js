(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.4.2 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.4.2",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners
    \*/
        eve = function (name, scope) {
			name = String(name);
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out.length ? out : null;
        };
		// Undocumented. Debug only.
		eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt()` function will be called before `eatIt()`.
	 *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
		name = String(name);
		if (typeof f != "function") {
			return function () {};
		}
        var names = name.split(separator),
            e = events;
        for (var i = 0, ii = names.length; i < ii; i++) {
            e = e.n;
            e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
        }
        e.f = e.f || [];
        for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
            return fun;
        }
        e.f.push(f);
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
	 * Arguments that will be passed to the result function will be also
	 * concated to the list of final arguments.
 	 | el.onclick = eve.f("click", 1, 2);
 	 | eve.on("click", function (a, b, c) {
 	 |     console.log(a, b, c); // 1, 2, [event object]
 	 | });
     > Arguments
	 - event (string) event name
	 - varargs (…) and any other arguments
	 = (function) possible event handler function
    \*/
	eve.f = function (event) {
		var attrs = [].slice.call(arguments, 1);
		return function () {
			eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
		};
	};
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
	 * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
		if (!name) {
		    eve._events = events = {n: {}};
			return;
		}
        var names = name.split(separator),
            e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define != "undefined" ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);

},{}],2:[function(require,module,exports){
// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël 2.1.3 - JavaScript Vector Library                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2008-2012 Dmitry Baranovskiy (http://raphaeljs.com)    │ \\
// │ Copyright © 2008-2012 Sencha Labs (http://sencha.com)              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license.│ \\
// └────────────────────────────────────────────────────────────────────┘ \\
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.4.2 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.4.2",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners
    \*/
        eve = function (name, scope) {
			name = String(name);
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out.length ? out : null;
        };
		// Undocumented. Debug only.
		eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt()` function will be called before `eatIt()`.
	 *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
		name = String(name);
		if (typeof f != "function") {
			return function () {};
		}
        var names = name.split(separator),
            e = events;
        for (var i = 0, ii = names.length; i < ii; i++) {
            e = e.n;
            e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
        }
        e.f = e.f || [];
        for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
            return fun;
        }
        e.f.push(f);
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
	 * Arguments that will be passed to the result function will be also
	 * concated to the list of final arguments.
 	 | el.onclick = eve.f("click", 1, 2);
 	 | eve.on("click", function (a, b, c) {
 	 |     console.log(a, b, c); // 1, 2, [event object]
 	 | });
     > Arguments
	 - event (string) event name
	 - varargs (…) and any other arguments
	 = (function) possible event handler function
    \*/
	eve.f = function (event) {
		var attrs = [].slice.call(arguments, 1);
		return function () {
			eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
		};
	};
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
	 * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
		if (!name) {
		    eve._events = events = {n: {}};
			return;
		}
        var names = name.split(separator),
            e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define != "undefined" ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(window || this);
// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ "Raphaël 2.1.2" - JavaScript Vector Library                         │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\

(function (glob, factory) {
    // AMD support
    if (typeof define === "function" && define.amd) {
        // Define as an anonymous module
        define(["eve"], function( eve ) {
            return factory(glob, eve);
        });
    } else {
        // Browser globals (glob is window)
        // Raphael adds itself to window
        factory(glob, glob.eve || (typeof require == "function" && require('eve')) );
    }
}(this, function (window, eve) {
    /*\
     * Raphael
     [ method ]
     **
     * Creates a canvas object on which to draw.
     * You must do this first, as all future calls to drawing methods
     * from this instance will be bound to this canvas.
     > Parameters
     **
     - container (HTMLElement|string) DOM element or its ID which is going to be a parent for drawing surface
     - width (number)
     - height (number)
     - callback (function) #optional callback function which is going to be executed in the context of newly created paper
     * or
     - x (number)
     - y (number)
     - width (number)
     - height (number)
     - callback (function) #optional callback function which is going to be executed in the context of newly created paper
     * or
     - all (array) (first 3 or 4 elements in the array are equal to [containerID, width, height] or [x, y, width, height]. The rest are element descriptions in format {type: type, <attributes>}). See @Paper.add.
     - callback (function) #optional callback function which is going to be executed in the context of newly created paper
     * or
     - onReadyCallback (function) function that is going to be called on DOM ready event. You can also subscribe to this event via Eve’s “DOMLoad” event. In this case method returns `undefined`.
     = (object) @Paper
     > Usage
     | // Each of the following examples create a canvas
     | // that is 320px wide by 200px high.
     | // Canvas is created at the viewport’s 10,50 coordinate.
     | var paper = Raphael(10, 50, 320, 200);
     | // Canvas is created at the top left corner of the #notepad element
     | // (or its top right corner in dir="rtl" elements)
     | var paper = Raphael(document.getElementById("notepad"), 320, 200);
     | // Same as above
     | var paper = Raphael("notepad", 320, 200);
     | // Image dump
     | var set = Raphael(["notepad", 320, 200, {
     |     type: "rect",
     |     x: 10,
     |     y: 10,
     |     width: 25,
     |     height: 25,
     |     stroke: "#f00"
     | }, {
     |     type: "text",
     |     x: 30,
     |     y: 40,
     |     text: "Dump"
     | }]);
    \*/
    function R(first) {
        if (R.is(first, "function")) {
            return loaded ? first() : eve.on("raphael.DOMload", first);
        } else if (R.is(first, array)) {
            return R._engine.create[apply](R, first.splice(0, 3 + R.is(first[0], nu))).add(first);
        } else {
            var args = Array.prototype.slice.call(arguments, 0);
            if (R.is(args[args.length - 1], "function")) {
                var f = args.pop();
                return loaded ? f.call(R._engine.create[apply](R, args)) : eve.on("raphael.DOMload", function () {
                    f.call(R._engine.create[apply](R, args));
                });
            } else {
                return R._engine.create[apply](R, arguments);
            }
        }
    }
    R.version = "2.1.2";
    R.eve = eve;
    var loaded,
        separator = /[, ]+/,
        elements = {circle: 1, rect: 1, path: 1, ellipse: 1, text: 1, image: 1},
        formatrg = /\{(\d+)\}/g,
        proto = "prototype",
        has = "hasOwnProperty",
        g = {
            doc: document,
            win: window
        },
        oldRaphael = {
            was: Object.prototype[has].call(g.win, "Raphael"),
            is: g.win.Raphael
        },
        Paper = function () {
            /*\
             * Paper.ca
             [ property (object) ]
             **
             * Shortcut for @Paper.customAttributes
            \*/
            /*\
             * Paper.customAttributes
             [ property (object) ]
             **
             * If you have a set of attributes that you would like to represent
             * as a function of some number you can do it easily with custom attributes:
             > Usage
             | paper.customAttributes.hue = function (num) {
             |     num = num % 1;
             |     return {fill: "hsb(" + num + ", 0.75, 1)"};
             | };
             | // Custom attribute “hue” will change fill
             | // to be given hue with fixed saturation and brightness.
             | // Now you can use it like this:
             | var c = paper.circle(10, 10, 10).attr({hue: .45});
             | // or even like this:
             | c.animate({hue: 1}, 1e3);
             |
             | // You could also create custom attribute
             | // with multiple parameters:
             | paper.customAttributes.hsb = function (h, s, b) {
             |     return {fill: "hsb(" + [h, s, b].join(",") + ")"};
             | };
             | c.attr({hsb: "0.5 .8 1"});
             | c.animate({hsb: [1, 0, 0.5]}, 1e3);
            \*/
            this.ca = this.customAttributes = {};
        },
        paperproto,
        appendChild = "appendChild",
        apply = "apply",
        concat = "concat",
        supportsTouch = ('ontouchstart' in g.win) || g.win.DocumentTouch && g.doc instanceof DocumentTouch, //taken from Modernizr touch test
        E = "",
        S = " ",
        Str = String,
        split = "split",
        events = "click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel"[split](S),
        touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        },
        lowerCase = Str.prototype.toLowerCase,
        math = Math,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        pow = math.pow,
        PI = math.PI,
        nu = "number",
        string = "string",
        array = "array",
        toString = "toString",
        fillString = "fill",
        objectToString = Object.prototype.toString,
        paper = {},
        push = "push",
        ISURL = R._ISURL = /^url\(['"]?(.+?)['"]?\)$/i,
        colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
        isnan = {"NaN": 1, "Infinity": 1, "-Infinity": 1},
        bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
        round = math.round,
        setAttribute = "setAttribute",
        toFloat = parseFloat,
        toInt = parseInt,
        upperCase = Str.prototype.toUpperCase,
        availableAttrs = R._availableAttrs = {
            "arrow-end": "none",
            "arrow-start": "none",
            blur: 0,
            "clip-rect": "0 0 1e9 1e9",
            cursor: "default",
            cx: 0,
            cy: 0,
            fill: "#fff",
            "fill-opacity": 1,
            font: '10px "Arial"',
            "font-family": '"Arial"',
            "font-size": "10",
            "font-style": "normal",
            "font-weight": 400,
            gradient: 0,
            height: 0,
            href: "http://raphaeljs.com/",
            "letter-spacing": 0,
            opacity: 1,
            path: "M0,0",
            r: 0,
            rx: 0,
            ry: 0,
            src: "",
            stroke: "#000",
            "stroke-dasharray": "",
            "stroke-linecap": "butt",
            "stroke-linejoin": "butt",
            "stroke-miterlimit": 0,
            "stroke-opacity": 1,
            "stroke-width": 1,
            target: "_blank",
            "text-anchor": "middle",
            title: "Raphael",
            transform: "",
            width: 0,
            x: 0,
            y: 0
        },
        availableAnimAttrs = R._availableAnimAttrs = {
            blur: nu,
            "clip-rect": "csv",
            cx: nu,
            cy: nu,
            fill: "colour",
            "fill-opacity": nu,
            "font-size": nu,
            height: nu,
            opacity: nu,
            path: "path",
            r: nu,
            rx: nu,
            ry: nu,
            stroke: "colour",
            "stroke-opacity": nu,
            "stroke-width": nu,
            transform: "transform",
            width: nu,
            x: nu,
            y: nu
        },
        whitespace = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]/g,
        commaSpaces = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,
        hsrg = {hs: 1, rg: 1},
        p2s = /,?([achlmqrstvxz]),?/gi,
        pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        tCommand = /([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig,
        radial_gradient = R._radial_gradient = /^r(?:\(([^,]+?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*([^\)]+?)\))?/,
        eldata = {},
        sortByKey = function (a, b) {
            return a.key - b.key;
        },
        sortByNumber = function (a, b) {
            return toFloat(a) - toFloat(b);
        },
        fun = function () {},
        pipe = function (x) {
            return x;
        },
        rectPath = R._rectPath = function (x, y, w, h, r) {
            if (r) {
                return [["M", x + r, y], ["l", w - r * 2, 0], ["a", r, r, 0, 0, 1, r, r], ["l", 0, h - r * 2], ["a", r, r, 0, 0, 1, -r, r], ["l", r * 2 - w, 0], ["a", r, r, 0, 0, 1, -r, -r], ["l", 0, r * 2 - h], ["a", r, r, 0, 0, 1, r, -r], ["z"]];
            }
            return [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
        },
        ellipsePath = function (x, y, rx, ry) {
            if (ry == null) {
                ry = rx;
            }
            return [["M", x, y], ["m", 0, -ry], ["a", rx, ry, 0, 1, 1, 0, 2 * ry], ["a", rx, ry, 0, 1, 1, 0, -2 * ry], ["z"]];
        },
        getPath = R._getPath = {
            path: function (el) {
                return el.attr("path");
            },
            circle: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.r);
            },
            ellipse: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.rx, a.ry);
            },
            rect: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height, a.r);
            },
            image: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height);
            },
            text: function (el) {
                var bbox = el._getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            },
            set : function(el) {
                var bbox = el._getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            }
        },
        /*\
         * Raphael.mapPath
         [ method ]
         **
         * Transform the path string with given matrix.
         > Parameters
         - path (string) path string
         - matrix (object) see @Matrix
         = (string) transformed path string
        \*/
        mapPath = R.mapPath = function (path, matrix) {
            if (!matrix) {
                return path;
            }
            var x, y, i, j, ii, jj, pathi;
            path = path2curve(path);
            for (i = 0, ii = path.length; i < ii; i++) {
                pathi = path[i];
                for (j = 1, jj = pathi.length; j < jj; j += 2) {
                    x = matrix.x(pathi[j], pathi[j + 1]);
                    y = matrix.y(pathi[j], pathi[j + 1]);
                    pathi[j] = x;
                    pathi[j + 1] = y;
                }
            }
            return path;
        };

    R._g = g;
    /*\
     * Raphael.type
     [ property (string) ]
     **
     * Can be “SVG”, “VML” or empty, depending on browser support.
    \*/
    R.type = (g.win.SVGAngle || g.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML");
    if (R.type == "VML") {
        var d = g.doc.createElement("div"),
            b;
        d.innerHTML = '<v:shape adj="1"/>';
        b = d.firstChild;
        b.style.behavior = "url(#default#VML)";
        if (!(b && typeof b.adj == "object")) {
            return (R.type = E);
        }
        d = null;
    }
    /*\
     * Raphael.svg
     [ property (boolean) ]
     **
     * `true` if browser supports SVG.
    \*/
    /*\
     * Raphael.vml
     [ property (boolean) ]
     **
     * `true` if browser supports VML.
    \*/
    R.svg = !(R.vml = R.type == "VML");
    R._Paper = Paper;
    /*\
     * Raphael.fn
     [ property (object) ]
     **
     * You can add your own method to the canvas. For example if you want to draw a pie chart,
     * you can create your own pie chart function and ship it as a Raphaël plugin. To do this
     * you need to extend the `Raphael.fn` object. You should modify the `fn` object before a
     * Raphaël instance is created, otherwise it will take no effect. Please note that the
     * ability for namespaced plugins was removed in Raphael 2.0. It is up to the plugin to
     * ensure any namespacing ensures proper context.
     > Usage
     | Raphael.fn.arrow = function (x1, y1, x2, y2, size) {
     |     return this.path( ... );
     | };
     | // or create namespace
     | Raphael.fn.mystuff = {
     |     arrow: function () {…},
     |     star: function () {…},
     |     // etc…
     | };
     | var paper = Raphael(10, 10, 630, 480);
     | // then use it
     | paper.arrow(10, 10, 30, 30, 5).attr({fill: "#f00"});
     | paper.mystuff.arrow();
     | paper.mystuff.star();
    \*/
    R.fn = paperproto = Paper.prototype = R.prototype;
    R._id = 0;
    R._oid = 0;
    /*\
     * Raphael.is
     [ method ]
     **
     * Handful of replacements for `typeof` operator.
     > Parameters
     - o (…) any object or primitive
     - type (string) name of the type, i.e. “string”, “function”, “number”, etc.
     = (boolean) is given value is of given type
    \*/
    R.is = function (o, type) {
        type = lowerCase.call(type);
        if (type == "finite") {
            return !isnan[has](+o);
        }
        if (type == "array") {
            return o instanceof Array;
        }
        return  (type == "null" && o === null) ||
                (type == typeof o && o !== null) ||
                (type == "object" && o === Object(o)) ||
                (type == "array" && Array.isArray && Array.isArray(o)) ||
                objectToString.call(o).slice(8, -1).toLowerCase() == type;
    };

    function clone(obj) {
        if (typeof obj == "function" || Object(obj) !== obj) {
            return obj;
        }
        var res = new obj.constructor;
        for (var key in obj) if (obj[has](key)) {
            res[key] = clone(obj[key]);
        }
        return res;
    }

    /*\
     * Raphael.angle
     [ method ]
     **
     * Returns angle between two or three points
     > Parameters
     - x1 (number) x coord of first point
     - y1 (number) y coord of first point
     - x2 (number) x coord of second point
     - y2 (number) y coord of second point
     - x3 (number) #optional x coord of third point
     - y3 (number) #optional y coord of third point
     = (number) angle in degrees.
    \*/
    R.angle = function (x1, y1, x2, y2, x3, y3) {
        if (x3 == null) {
            var x = x1 - x2,
                y = y1 - y2;
            if (!x && !y) {
                return 0;
            }
            return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
        } else {
            return R.angle(x1, y1, x3, y3) - R.angle(x2, y2, x3, y3);
        }
    };
    /*\
     * Raphael.rad
     [ method ]
     **
     * Transform angle to radians
     > Parameters
     - deg (number) angle in degrees
     = (number) angle in radians.
    \*/
    R.rad = function (deg) {
        return deg % 360 * PI / 180;
    };
    /*\
     * Raphael.deg
     [ method ]
     **
     * Transform angle to degrees
     > Parameters
     - rad (number) angle in radians
     = (number) angle in degrees.
    \*/
    R.deg = function (rad) {
        return Math.round ((rad * 180 / PI% 360)* 1000) / 1000;
    };
    /*\
     * Raphael.snapTo
     [ method ]
     **
     * Snaps given value to given grid.
     > Parameters
     - values (array|number) given array of values or step of the grid
     - value (number) value to adjust
     - tolerance (number) #optional tolerance for snapping. Default is `10`.
     = (number) adjusted value.
    \*/
    R.snapTo = function (values, value, tolerance) {
        tolerance = R.is(tolerance, "finite") ? tolerance : 10;
        if (R.is(values, array)) {
            var i = values.length;
            while (i--) if (abs(values[i] - value) <= tolerance) {
                return values[i];
            }
        } else {
            values = +values;
            var rem = value % values;
            if (rem < tolerance) {
                return value - rem;
            }
            if (rem > values - tolerance) {
                return value - rem + values;
            }
        }
        return value;
    };

    /*\
     * Raphael.createUUID
     [ method ]
     **
     * Returns RFC4122, version 4 ID
    \*/
    var createUUID = R.createUUID = (function (uuidRegEx, uuidReplacer) {
        return function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
        };
    })(/[xy]/g, function (c) {
        var r = math.random() * 16 | 0,
            v = c == "x" ? r : (r & 3 | 8);
        return v.toString(16);
    });

    /*\
     * Raphael.setWindow
     [ method ]
     **
     * Used when you need to draw in `&lt;iframe>`. Switched window to the iframe one.
     > Parameters
     - newwin (window) new window object
    \*/
    R.setWindow = function (newwin) {
        eve("raphael.setWindow", R, g.win, newwin);
        g.win = newwin;
        g.doc = g.win.document;
        if (R._engine.initWin) {
            R._engine.initWin(g.win);
        }
    };
    var toHex = function (color) {
        if (R.vml) {
            // http://dean.edwards.name/weblog/2009/10/convert-any-colour-value-to-hex-in-msie/
            var trim = /^\s+|\s+$/g;
            var bod;
            try {
                var docum = new ActiveXObject("htmlfile");
                docum.write("<body>");
                docum.close();
                bod = docum.body;
            } catch(e) {
                bod = createPopup().document.body;
            }
            var range = bod.createTextRange();
            toHex = cacher(function (color) {
                try {
                    bod.style.color = Str(color).replace(trim, E);
                    var value = range.queryCommandValue("ForeColor");
                    value = ((value & 255) << 16) | (value & 65280) | ((value & 16711680) >>> 16);
                    return "#" + ("000000" + value.toString(16)).slice(-6);
                } catch(e) {
                    return "none";
                }
            });
        } else {
            var i = g.doc.createElement("i");
            i.title = "Rapha\xebl Colour Picker";
            i.style.display = "none";
            g.doc.body.appendChild(i);
            toHex = cacher(function (color) {
                i.style.color = color;
                return g.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
            });
        }
        return toHex(color);
    },
    hsbtoString = function () {
        return "hsb(" + [this.h, this.s, this.b] + ")";
    },
    hsltoString = function () {
        return "hsl(" + [this.h, this.s, this.l] + ")";
    },
    rgbtoString = function () {
        return this.hex;
    },
    prepareRGB = function (r, g, b) {
        if (g == null && R.is(r, "object") && "r" in r && "g" in r && "b" in r) {
            b = r.b;
            g = r.g;
            r = r.r;
        }
        if (g == null && R.is(r, string)) {
            var clr = R.getRGB(r);
            r = clr.r;
            g = clr.g;
            b = clr.b;
        }
        if (r > 1 || g > 1 || b > 1) {
            r /= 255;
            g /= 255;
            b /= 255;
        }

        return [r, g, b];
    },
    packageRGB = function (r, g, b, o) {
        r *= 255;
        g *= 255;
        b *= 255;
        var rgb = {
            r: r,
            g: g,
            b: b,
            hex: R.rgb(r, g, b),
            toString: rgbtoString
        };
        R.is(o, "finite") && (rgb.opacity = o);
        return rgb;
    };

    /*\
     * Raphael.color
     [ method ]
     **
     * Parses the color string and returns object with all values for the given color.
     > Parameters
     - clr (string) color string in one of the supported formats (see @Raphael.getRGB)
     = (object) Combined RGB & HSB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••,
     o     error (boolean) `true` if string can’t be parsed,
     o     h (number) hue,
     o     s (number) saturation,
     o     v (number) value (brightness),
     o     l (number) lightness
     o }
    \*/
    R.color = function (clr) {
        var rgb;
        if (R.is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
            rgb = R.hsb2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else if (R.is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
            rgb = R.hsl2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else {
            if (R.is(clr, "string")) {
                clr = R.getRGB(clr);
            }
            if (R.is(clr, "object") && "r" in clr && "g" in clr && "b" in clr) {
                rgb = R.rgb2hsl(clr);
                clr.h = rgb.h;
                clr.s = rgb.s;
                clr.l = rgb.l;
                rgb = R.rgb2hsb(clr);
                clr.v = rgb.b;
            } else {
                clr = {hex: "none"};
                clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
            }
        }
        clr.toString = rgbtoString;
        return clr;
    };
    /*\
     * Raphael.hsb2rgb
     [ method ]
     **
     * Converts HSB values to RGB object.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - v (number) value or brightness
     = (object) RGB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••
     o }
    \*/
    R.hsb2rgb = function (h, s, v, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "b" in h) {
            v = h.b;
            s = h.s;
            o = h.o;
            h = h.h;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = v * s;
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = v - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    /*\
     * Raphael.hsl2rgb
     [ method ]
     **
     * Converts HSL values to RGB object.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - l (number) luminosity
     = (object) RGB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••
     o }
    \*/
    R.hsl2rgb = function (h, s, l, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "l" in h) {
            l = h.l;
            s = h.s;
            h = h.h;
        }
        if (h > 1 || s > 1 || l > 1) {
            h /= 360;
            s /= 100;
            l /= 100;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = 2 * s * (l < .5 ? l : 1 - l);
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = l - C / 2;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    /*\
     * Raphael.rgb2hsb
     [ method ]
     **
     * Converts RGB values to HSB object.
     > Parameters
     - r (number) red
     - g (number) green
     - b (number) blue
     = (object) HSB object in format:
     o {
     o     h (number) hue
     o     s (number) saturation
     o     b (number) brightness
     o }
    \*/
    R.rgb2hsb = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, V, C;
        V = mmax(r, g, b);
        C = V - mmin(r, g, b);
        H = (C == 0 ? null :
             V == r ? (g - b) / C :
             V == g ? (b - r) / C + 2 :
                      (r - g) / C + 4
            );
        H = ((H + 360) % 6) * 60 / 360;
        S = C == 0 ? 0 : C / V;
        return {h: H, s: S, b: V, toString: hsbtoString};
    };
    /*\
     * Raphael.rgb2hsl
     [ method ]
     **
     * Converts RGB values to HSL object.
     > Parameters
     - r (number) red
     - g (number) green
     - b (number) blue
     = (object) HSL object in format:
     o {
     o     h (number) hue
     o     s (number) saturation
     o     l (number) luminosity
     o }
    \*/
    R.rgb2hsl = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, L, M, m, C;
        M = mmax(r, g, b);
        m = mmin(r, g, b);
        C = M - m;
        H = (C == 0 ? null :
             M == r ? (g - b) / C :
             M == g ? (b - r) / C + 2 :
                      (r - g) / C + 4);
        H = ((H + 360) % 6) * 60 / 360;
        L = (M + m) / 2;
        S = (C == 0 ? 0 :
             L < .5 ? C / (2 * L) :
                      C / (2 - 2 * L));
        return {h: H, s: S, l: L, toString: hsltoString};
    };
    R._path2string = function () {
        return this.join(",").replace(p2s, "$1");
    };
    function repush(array, item) {
        for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
            return array.push(array.splice(i, 1)[0]);
        }
    }
    function cacher(f, scope, postprocessor) {
        function newf() {
            var arg = Array.prototype.slice.call(arguments, 0),
                args = arg.join("\u2400"),
                cache = newf.cache = newf.cache || {},
                count = newf.count = newf.count || [];
            if (cache[has](args)) {
                repush(count, args);
                return postprocessor ? postprocessor(cache[args]) : cache[args];
            }
            count.length >= 1e3 && delete cache[count.shift()];
            count.push(args);
            cache[args] = f[apply](scope, arg);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        return newf;
    }

    var preload = R._preload = function (src, f) {
        var img = g.doc.createElement("img");
        img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
        img.onload = function () {
            f.call(this);
            this.onload = null;
            g.doc.body.removeChild(this);
        };
        img.onerror = function () {
            g.doc.body.removeChild(this);
        };
        g.doc.body.appendChild(img);
        img.src = src;
    };

    function clrToString() {
        return this.hex;
    }

    /*\
     * Raphael.getRGB
     [ method ]
     **
     * Parses colour string as RGB object
     > Parameters
     - colour (string) colour string in one of formats:
     # <ul>
     #     <li>Colour name (“<code>red</code>”, “<code>green</code>”, “<code>cornflowerblue</code>”, etc)</li>
     #     <li>#••• — shortened HTML colour: (“<code>#000</code>”, “<code>#fc0</code>”, etc)</li>
     #     <li>#•••••• — full length HTML colour: (“<code>#000000</code>”, “<code>#bd2300</code>”)</li>
     #     <li>rgb(•••, •••, •••) — red, green and blue channels’ values: (“<code>rgb(200,&nbsp;100,&nbsp;0)</code>”)</li>
     #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (“<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>”)</li>
     #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (“<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>”)</li>
     #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsl(•••, •••, •••) — same as hsb</li>
     #     <li>hsl(•••%, •••%, •••%) — same as hsb</li>
     # </ul>
     = (object) RGB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue
     o     hex (string) color in HTML/CSS format: #••••••,
     o     error (boolean) true if string can’t be parsed
     o }
    \*/
    R.getRGB = cacher(function (colour) {
        if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
            return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
        }
        if (colour == "none") {
            return {r: -1, g: -1, b: -1, hex: "none", toString: clrToString};
        }
        !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
        var res,
            red,
            green,
            blue,
            opacity,
            t,
            values,
            rgb = colour.match(colourRegExp);
        if (rgb) {
            if (rgb[2]) {
                blue = toInt(rgb[2].substring(5), 16);
                green = toInt(rgb[2].substring(3, 5), 16);
                red = toInt(rgb[2].substring(1, 3), 16);
            }
            if (rgb[3]) {
                blue = toInt((t = rgb[3].charAt(3)) + t, 16);
                green = toInt((t = rgb[3].charAt(2)) + t, 16);
                red = toInt((t = rgb[3].charAt(1)) + t, 16);
            }
            if (rgb[4]) {
                values = rgb[4][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            }
            if (rgb[5]) {
                values = rgb[5][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsb2rgb(red, green, blue, opacity);
            }
            if (rgb[6]) {
                values = rgb[6][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsl2rgb(red, green, blue, opacity);
            }
            rgb = {r: red, g: green, b: blue, toString: clrToString};
            rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
            R.is(opacity, "finite") && (rgb.opacity = opacity);
            return rgb;
        }
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
    }, R);
    /*\
     * Raphael.hsb
     [ method ]
     **
     * Converts HSB values to hex representation of the colour.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - b (number) value or brightness
     = (string) hex representation of the colour.
    \*/
    R.hsb = cacher(function (h, s, b) {
        return R.hsb2rgb(h, s, b).hex;
    });
    /*\
     * Raphael.hsl
     [ method ]
     **
     * Converts HSL values to hex representation of the colour.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - l (number) luminosity
     = (string) hex representation of the colour.
    \*/
    R.hsl = cacher(function (h, s, l) {
        return R.hsl2rgb(h, s, l).hex;
    });
    /*\
     * Raphael.rgb
     [ method ]
     **
     * Converts RGB values to hex representation of the colour.
     > Parameters
     - r (number) red
     - g (number) green
     - b (number) blue
     = (string) hex representation of the colour.
    \*/
    R.rgb = cacher(function (r, g, b) {
        return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
    });
    /*\
     * Raphael.getColor
     [ method ]
     **
     * On each call returns next colour in the spectrum. To reset it back to red call @Raphael.getColor.reset
     > Parameters
     - value (number) #optional brightness, default is `0.75`
     = (string) hex representation of the colour.
    \*/
    R.getColor = function (value) {
        var start = this.getColor.start = this.getColor.start || {h: 0, s: 1, b: value || .75},
            rgb = this.hsb2rgb(start.h, start.s, start.b);
        start.h += .075;
        if (start.h > 1) {
            start.h = 0;
            start.s -= .2;
            start.s <= 0 && (this.getColor.start = {h: 0, s: 1, b: start.b});
        }
        return rgb.hex;
    };
    /*\
     * Raphael.getColor.reset
     [ method ]
     **
     * Resets spectrum position for @Raphael.getColor back to red.
    \*/
    R.getColor.reset = function () {
        delete this.start;
    };

    // http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        var d = [];
        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [
                        {x: +crp[i - 2], y: +crp[i - 1]},
                        {x: +crp[i],     y: +crp[i + 1]},
                        {x: +crp[i + 2], y: +crp[i + 3]},
                        {x: +crp[i + 4], y: +crp[i + 5]}
                    ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push(["C",
                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
                  (p[1].y + 6*p[2].y - p[3].y) / 6,
                  p[2].x,
                  p[2].y
            ]);
        }

        return d;
    }
    /*\
     * Raphael.parsePathString
     [ method ]
     **
     * Utility method
     **
     * Parses given path string into an array of arrays of path segments.
     > Parameters
     - pathString (string|array) path string or array of segments (in the last case it will be returned straight away)
     = (array) array of segments.
    \*/
    R.parsePathString = function (pathString) {
        if (!pathString) {
            return null;
        }
        var pth = paths(pathString);
        if (pth.arr) {
            return pathClone(pth.arr);
        }

        var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
            data = [];
        if (R.is(pathString, array) && R.is(pathString[0], array)) { // rough assumption
            data = pathClone(pathString);
        }
        if (!data.length) {
            Str(pathString).replace(pathCommand, function (a, b, c) {
                var params = [],
                    name = b.toLowerCase();
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                if (name == "m" && params.length > 2) {
                    data.push([b][concat](params.splice(0, 2)));
                    name = "l";
                    b = b == "m" ? "l" : "L";
                }
                if (name == "r") {
                    data.push([b][concat](params));
                } else while (params.length >= paramCounts[name]) {
                    data.push([b][concat](params.splice(0, paramCounts[name])));
                    if (!paramCounts[name]) {
                        break;
                    }
                }
            });
        }
        data.toString = R._path2string;
        pth.arr = pathClone(data);
        return data;
    };
    /*\
     * Raphael.parseTransformString
     [ method ]
     **
     * Utility method
     **
     * Parses given path string into an array of transformations.
     > Parameters
     - TString (string|array) transform string or array of transformations (in the last case it will be returned straight away)
     = (array) array of transformations.
    \*/
    R.parseTransformString = cacher(function (TString) {
        if (!TString) {
            return null;
        }
        var paramCounts = {r: 3, s: 4, t: 2, m: 6},
            data = [];
        if (R.is(TString, array) && R.is(TString[0], array)) { // rough assumption
            data = pathClone(TString);
        }
        if (!data.length) {
            Str(TString).replace(tCommand, function (a, b, c) {
                var params = [],
                    name = lowerCase.call(b);
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                data.push([b][concat](params));
            });
        }
        data.toString = R._path2string;
        return data;
    });
    // PATHS
    var paths = function (ps) {
        var p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    };
    /*\
     * Raphael.findDotsAtSegment
     [ method ]
     **
     * Utility method
     **
     * Find dot coordinates on the given cubic bezier curve at the given t.
     > Parameters
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) point information in format:
     o {
     o     x: (number) x coordinate of the point
     o     y: (number) y coordinate of the point
     o     m: {
     o         x: (number) x coordinate of the left anchor
     o         y: (number) y coordinate of the left anchor
     o     }
     o     n: {
     o         x: (number) x coordinate of the right anchor
     o         y: (number) y coordinate of the right anchor
     o     }
     o     start: {
     o         x: (number) x coordinate of the start of the curve
     o         y: (number) y coordinate of the start of the curve
     o     }
     o     end: {
     o         x: (number) x coordinate of the end of the curve
     o         y: (number) y coordinate of the end of the curve
     o     }
     o     alpha: (number) angle of the curve derivative at the point
     o }
    \*/
    R.findDotsAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = (90 - math.atan2(mx - nx, my - ny) * 180 / PI);
        (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha
        };
    };
    /*\
     * Raphael.bezierBBox
     [ method ]
     **
     * Utility method
     **
     * Return bounding box of a given cubic bezier curve
     > Parameters
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     * or
     - bez (array) array of six points for bezier curve
     = (object) point information in format:
     o {
     o     min: {
     o         x: (number) x coordinate of the left point
     o         y: (number) y coordinate of the top point
     o     }
     o     max: {
     o         x: (number) x coordinate of the right point
     o         y: (number) y coordinate of the bottom point
     o     }
     o }
    \*/
    R.bezierBBox = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!R.is(p1x, "array")) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        var bbox = curveDim.apply(null, p1x);
        return {
            x: bbox.min.x,
            y: bbox.min.y,
            x2: bbox.max.x,
            y2: bbox.max.y,
            width: bbox.max.x - bbox.min.x,
            height: bbox.max.y - bbox.min.y
        };
    };
    /*\
     * Raphael.isPointInsideBBox
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside bounding boxes.
     > Parameters
     - bbox (string) bounding box
     - x (string) x coordinate of the point
     - y (string) y coordinate of the point
     = (boolean) `true` if point inside
    \*/
    R.isPointInsideBBox = function (bbox, x, y) {
        return x >= bbox.x && x <= bbox.x2 && y >= bbox.y && y <= bbox.y2;
    };
    /*\
     * Raphael.isBBoxIntersect
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if two bounding boxes intersect
     > Parameters
     - bbox1 (string) first bounding box
     - bbox2 (string) second bounding box
     = (boolean) `true` if they intersect
    \*/
    R.isBBoxIntersect = function (bbox1, bbox2) {
        var i = R.isPointInsideBBox;
        return i(bbox2, bbox1.x, bbox1.y)
            || i(bbox2, bbox1.x2, bbox1.y)
            || i(bbox2, bbox1.x, bbox1.y2)
            || i(bbox2, bbox1.x2, bbox1.y2)
            || i(bbox1, bbox2.x, bbox2.y)
            || i(bbox1, bbox2.x2, bbox2.y)
            || i(bbox1, bbox2.x, bbox2.y2)
            || i(bbox1, bbox2.x2, bbox2.y2)
            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    };
    function base3(t, p1, p2, p3, p4) {
        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }
    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        var z2 = z / 2,
            n = 12,
            Tvalues = [-0.1252,0.1252,-0.3678,0.3678,-0.5873,0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],
            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
            sum = 0;
        for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * math.sqrt(comb);
        }
        return z2 * sum;
    }
    function getTatLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        var t = 1,
            step = t / 2,
            t2 = t - step,
            l,
            e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        var px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }
    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }
    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }
    function interHelper(bez1, bez2, justCount) {
        var bbox1 = R.bezierBBox(bez1),
            bbox2 = R.bezierBBox(bez2);
        if (!R.isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        var l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = mmax(~~(l1 / 5), 1),
            n2 = mmax(~~(l2 / 5), 1),
            dots1 = [],
            dots2 = [],
            xy = {},
            res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; i++) {
            var p = R.findDotsAtSegment.apply(R, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; i++) {
            p = R.findDotsAtSegment.apply(R, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; i++) {
            for (var j = 0; j < n2; j++) {
                var di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1.001 && t2 >= 0 && t2 <= 1.001) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: mmin(t1, 1),
                                t2: mmin(t2, 1)
                            });
                        }
                    }
                }
            }
        }
        return res;
    }
    /*\
     * Raphael.pathIntersection
     [ method ]
     **
     * Utility method
     **
     * Finds intersections of two paths
     > Parameters
     - path1 (string) path string
     - path2 (string) path string
     = (array) dots of intersection
     o [
     o     {
     o         x: (number) x coordinate of the point
     o         y: (number) y coordinate of the point
     o         t1: (number) t value for segment of path1
     o         t2: (number) t value for segment of path2
     o         segment1: (number) order number for segment of path1
     o         segment2: (number) order number for segment of path2
     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1
     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
     o     }
     o ]
    \*/
    R.pathIntersection = function (path1, path2) {
        return interPathHelper(path1, path2);
    };
    R.pathIntersectionNumber = function (path1, path2) {
        return interPathHelper(path1, path2, 1);
    };
    function interPathHelper(path1, path2, justCount) {
        path1 = R._path2curve(path1);
        path2 = R._path2curve(path2);
        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        for (var i = 0, ii = path1.length; i < ii; i++) {
            var pi = path1[i];
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                for (var j = 0, jj = path2.length; j < jj; j++) {
                    var pj = path2[j];
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        var intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            for (var k = 0, kk = intr.length; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }
    /*\
     * Raphael.isPointInsidePath
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside a given closed path.
     > Parameters
     - path (string) path string
     - x (number) x of the point
     - y (number) y of the point
     = (boolean) true, if point is inside the path
    \*/
    R.isPointInsidePath = function (path, x, y) {
        var bbox = R.pathBBox(path);
        return R.isPointInsideBBox(bbox, x, y) &&
               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
    };
    R._removedFactory = function (methodname) {
        return function () {
            eve("raphael.log", null, "Rapha\xebl: you are calling to method \u201c" + methodname + "\u201d of removed object", methodname);
        };
    };
    /*\
     * Raphael.pathBBox
     [ method ]
     **
     * Utility method
     **
     * Return bounding box of a given path
     > Parameters
     - path (string) path string
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box
     o     y: (number) y coordinate of the left top point of the box
     o     x2: (number) x coordinate of the right bottom point of the box
     o     y2: (number) y coordinate of the right bottom point of the box
     o     width: (number) width of the box
     o     height: (number) height of the box
     o     cx: (number) x coordinate of the center of the box
     o     cy: (number) y coordinate of the center of the box
     o }
    \*/
    var pathDimensions = R.pathBBox = function (path) {
        var pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox);
        }
        if (!path) {
            return {x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0};
        }
        path = path2curve(path);
        var x = 0,
            y = 0,
            X = [],
            Y = [],
            p;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X[concat](dim.min.x, dim.max.x);
                Y = Y[concat](dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        var xmin = mmin[apply](0, X),
            ymin = mmin[apply](0, Y),
            xmax = mmax[apply](0, X),
            ymax = mmax[apply](0, Y),
            width = xmax - xmin,
            height = ymax - ymin,
                bb = {
                x: xmin,
                y: ymin,
                x2: xmax,
                y2: ymax,
                width: width,
                height: height,
                cx: xmin + width / 2,
                cy: ymin + height / 2
            };
        pth.bbox = clone(bb);
        return bb;
    },
        pathClone = function (pathArray) {
            var res = clone(pathArray);
            res.toString = R._path2string;
            return res;
        },
        pathToRelative = R._pathToRelative = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.rel) {
                return pathClone(pth.rel);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = pathArray[0][1];
                y = pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res.push(["M", x, y]);
            }
            for (var i = start, ii = pathArray.length; i < ii; i++) {
                var r = res[i] = [],
                    pa = pathArray[i];
                if (pa[0] != lowerCase.call(pa[0])) {
                    r[0] = lowerCase.call(pa[0]);
                    switch (r[0]) {
                        case "a":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] - x).toFixed(3);
                            r[7] = +(pa[7] - y).toFixed(3);
                            break;
                        case "v":
                            r[1] = +(pa[1] - y).toFixed(3);
                            break;
                        case "m":
                            mx = pa[1];
                            my = pa[2];
                        default:
                            for (var j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
                            }
                    }
                } else {
                    r = res[i] = [];
                    if (pa[0] == "m") {
                        mx = pa[1] + x;
                        my = pa[2] + y;
                    }
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        res[i][k] = pa[k];
                    }
                }
                var len = res[i].length;
                switch (res[i][0]) {
                    case "z":
                        x = mx;
                        y = my;
                        break;
                    case "h":
                        x += +res[i][len - 1];
                        break;
                    case "v":
                        y += +res[i][len - 1];
                        break;
                    default:
                        x += +res[i][len - 2];
                        y += +res[i][len - 1];
                }
            }
            res.toString = R._path2string;
            pth.rel = pathClone(res);
            return res;
        },
        pathToAbsolute = R._pathToAbsolute = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.abs) {
                return pathClone(pth.abs);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            if (!pathArray || !pathArray.length) {
                return [["M", 0, 0]];
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = +pathArray[0][1];
                y = +pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res[0] = ["M", x, y];
            }
            var crz = pathArray.length == 3 && pathArray[0][0] == "M" && pathArray[1][0].toUpperCase() == "R" && pathArray[2][0].toUpperCase() == "Z";
            for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
                res.push(r = []);
                pa = pathArray[i];
                if (pa[0] != upperCase.call(pa[0])) {
                    r[0] = upperCase.call(pa[0]);
                    switch (r[0]) {
                        case "A":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] + x);
                            r[7] = +(pa[7] + y);
                            break;
                        case "V":
                            r[1] = +pa[1] + y;
                            break;
                        case "H":
                            r[1] = +pa[1] + x;
                            break;
                        case "R":
                            var dots = [x, y][concat](pa.slice(1));
                            for (var j = 2, jj = dots.length; j < jj; j++) {
                                dots[j] = +dots[j] + x;
                                dots[++j] = +dots[j] + y;
                            }
                            res.pop();
                            res = res[concat](catmullRom2bezier(dots, crz));
                            break;
                        case "M":
                            mx = +pa[1] + x;
                            my = +pa[2] + y;
                        default:
                            for (j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +pa[j] + ((j % 2) ? x : y);
                            }
                    }
                } else if (pa[0] == "R") {
                    dots = [x, y][concat](pa.slice(1));
                    res.pop();
                    res = res[concat](catmullRom2bezier(dots, crz));
                    r = ["R"][concat](pa.slice(-2));
                } else {
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        r[k] = pa[k];
                    }
                }
                switch (r[0]) {
                    case "Z":
                        x = mx;
                        y = my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
            res.toString = R._path2string;
            pth.abs = pathClone(res);
            return res;
        },
        l2c = function (x1, y1, x2, y2) {
            return [x1, y1, x2, y2, x2, y2];
        },
        q2c = function (x1, y1, ax, ay, x2, y2) {
            var _13 = 1 / 3,
                _23 = 2 / 3;
            return [
                    _13 * x1 + _23 * ax,
                    _13 * y1 + _23 * ay,
                    _13 * x2 + _23 * ax,
                    _13 * y2 + _23 * ay,
                    x2,
                    y2
                ];
        },
        a2c = function (x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
            // for more information of where this math came from visit:
            // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
            var _120 = PI * 120 / 180,
                rad = PI / 180 * (+angle || 0),
                res = [],
                xy,
                rotate = cacher(function (x, y, rad) {
                    var X = x * math.cos(rad) - y * math.sin(rad),
                        Y = x * math.sin(rad) + y * math.cos(rad);
                    return {x: X, y: Y};
                });
            if (!recursive) {
                xy = rotate(x1, y1, -rad);
                x1 = xy.x;
                y1 = xy.y;
                xy = rotate(x2, y2, -rad);
                x2 = xy.x;
                y2 = xy.y;
                var cos = math.cos(PI / 180 * angle),
                    sin = math.sin(PI / 180 * angle),
                    x = (x1 - x2) / 2,
                    y = (y1 - y2) / 2;
                var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
                if (h > 1) {
                    h = math.sqrt(h);
                    rx = h * rx;
                    ry = h * ry;
                }
                var rx2 = rx * rx,
                    ry2 = ry * ry,
                    k = (large_arc_flag == sweep_flag ? -1 : 1) *
                        math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                    cx = k * rx * y / ry + (x1 + x2) / 2,
                    cy = k * -ry * x / rx + (y1 + y2) / 2,
                    f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
                    f2 = math.asin(((y2 - cy) / ry).toFixed(9));

                f1 = x1 < cx ? PI - f1 : f1;
                f2 = x2 < cx ? PI - f2 : f2;
                f1 < 0 && (f1 = PI * 2 + f1);
                f2 < 0 && (f2 = PI * 2 + f2);
                if (sweep_flag && f1 > f2) {
                    f1 = f1 - PI * 2;
                }
                if (!sweep_flag && f2 > f1) {
                    f2 = f2 - PI * 2;
                }
            } else {
                f1 = recursive[0];
                f2 = recursive[1];
                cx = recursive[2];
                cy = recursive[3];
            }
            var df = f2 - f1;
            if (abs(df) > _120) {
                var f2old = f2,
                    x2old = x2,
                    y2old = y2;
                f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
                x2 = cx + rx * math.cos(f2);
                y2 = cy + ry * math.sin(f2);
                res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
            }
            df = f2 - f1;
            var c1 = math.cos(f1),
                s1 = math.sin(f1),
                c2 = math.cos(f2),
                s2 = math.sin(f2),
                t = math.tan(df / 4),
                hx = 4 / 3 * rx * t,
                hy = 4 / 3 * ry * t,
                m1 = [x1, y1],
                m2 = [x1 + hx * s1, y1 - hy * c1],
                m3 = [x2 + hx * s2, y2 - hy * c2],
                m4 = [x2, y2];
            m2[0] = 2 * m1[0] - m2[0];
            m2[1] = 2 * m1[1] - m2[1];
            if (recursive) {
                return [m2, m3, m4][concat](res);
            } else {
                res = [m2, m3, m4][concat](res).join()[split](",");
                var newres = [];
                for (var i = 0, ii = res.length; i < ii; i++) {
                    newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
                }
                return newres;
            }
        },
        findDotAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t;
            return {
                x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
                y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
            };
        },
        curveDim = cacher(function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
            var a = (c2x - 2 * c1x + p1x) - (p2x - 2 * c2x + c1x),
                b = 2 * (c1x - p1x) - 2 * (c2x - c1x),
                c = p1x - c1x,
                t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a,
                t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a,
                y = [p1y, p2y],
                x = [p1x, p2x],
                dot;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            a = (c2y - 2 * c1y + p1y) - (p2y - 2 * c2y + c1y);
            b = 2 * (c1y - p1y) - 2 * (c2y - c1y);
            c = p1y - c1y;
            t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a;
            t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            return {
                min: {x: mmin[apply](0, x), y: mmin[apply](0, y)},
                max: {x: mmax[apply](0, x), y: mmax[apply](0, y)}
            };
        }),
        path2curve = R._path2curve = cacher(function (path, path2) {
            var pth = !path2 && paths(path);
            if (!path2 && pth.curve) {
                return pathClone(pth.curve);
            }
            var p = pathToAbsolute(path),
                p2 = path2 && pathToAbsolute(path2),
                attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                processPath = function (path, d, pcom) {
                    var nx, ny, tq = {T:1, Q:1};
                    if (!path) {
                        return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                    }
                    !(path[0] in tq) && (d.qx = d.qy = null);
                    switch (path[0]) {
                        case "M":
                            d.X = path[1];
                            d.Y = path[2];
                            break;
                        case "A":
                            path = ["C"][concat](a2c[apply](0, [d.x, d.y][concat](path.slice(1))));
                            break;
                        case "S":
                            if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
                                nx = d.x * 2 - d.bx;          // And reflect the previous
                                ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                            }
                            else {                            // or some else or nothing
                                nx = d.x;
                                ny = d.y;
                            }
                            path = ["C", nx, ny][concat](path.slice(1));
                            break;
                        case "T":
                            if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
                                d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                                d.qy = d.y * 2 - d.qy;        // to case "S".
                            }
                            else {                            // or something else or nothing
                                d.qx = d.x;
                                d.qy = d.y;
                            }
                            path = ["C"][concat](q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                            break;
                        case "Q":
                            d.qx = path[1];
                            d.qy = path[2];
                            path = ["C"][concat](q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                            break;
                        case "L":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], path[2]));
                            break;
                        case "H":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], d.y));
                            break;
                        case "V":
                            path = ["C"][concat](l2c(d.x, d.y, d.x, path[1]));
                            break;
                        case "Z":
                            path = ["C"][concat](l2c(d.x, d.y, d.X, d.Y));
                            break;
                    }
                    return path;
                },
                fixArc = function (pp, i) {
                    if (pp[i].length > 7) {
                        pp[i].shift();
                        var pi = pp[i];
                        while (pi.length) {
                            pcoms1[i]="A"; // if created multiple C:s, their original seg is saved
                            p2 && (pcoms2[i]="A"); // the same as above
                            pp.splice(i++, 0, ["C"][concat](pi.splice(0, 6)));
                        }
                        pp.splice(i, 1);
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                },
                fixM = function (path1, path2, a1, a2, i) {
                    if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                        path2.splice(i, 0, ["M", a2.x, a2.y]);
                        a1.bx = 0;
                        a1.by = 0;
                        a1.x = path1[i][1];
                        a1.y = path1[i][2];
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                },
                pcoms1 = [], // path commands of original path p
                pcoms2 = [], // path commands of original path p2
                pfirst = "", // temporary holder for original path command
                pcom = ""; // holder for previous path command of original path
            for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
                p[i] && (pfirst = p[i][0]); // save current path command

                if (pfirst != "C") // C is not saved yet, because it may be result of conversion
                {
                    pcoms1[i] = pfirst; // Save current path command
                    i && ( pcom = pcoms1[i-1]); // Get previous path command pcom
                }
                p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

                if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
                // which may produce multiple C:s
                // so we have to make sure that C is also C in original path

                fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1

                if (p2) { // the same procedures is done to p2
                    p2[i] && (pfirst = p2[i][0]);
                    if (pfirst != "C")
                    {
                        pcoms2[i] = pfirst;
                        i && (pcom = pcoms2[i-1]);
                    }
                    p2[i] = processPath(p2[i], attrs2, pcom);

                    if (pcoms2[i]!="A" && pfirst=="C") pcoms2[i]="C";

                    fixArc(p2, i);
                }
                fixM(p, p2, attrs, attrs2, i);
                fixM(p2, p, attrs2, attrs, i);
                var seg = p[i],
                    seg2 = p2 && p2[i],
                    seglen = seg.length,
                    seg2len = p2 && seg2.length;
                attrs.x = seg[seglen - 2];
                attrs.y = seg[seglen - 1];
                attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
                attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
                attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
                attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
                attrs2.x = p2 && seg2[seg2len - 2];
                attrs2.y = p2 && seg2[seg2len - 1];
            }
            if (!p2) {
                pth.curve = pathClone(p);
            }
            return p2 ? [p, p2] : p;
        }, null, pathClone),
        parseDots = R._parseDots = cacher(function (gradient) {
            var dots = [];
            for (var i = 0, ii = gradient.length; i < ii; i++) {
                var dot = {},
                    par = gradient[i].match(/^([^:]*):?([\d\.]*)/);
                dot.color = R.getRGB(par[1]);
                if (dot.color.error) {
                    return null;
                }
                dot.color = dot.color.hex;
                par[2] && (dot.offset = par[2] + "%");
                dots.push(dot);
            }
            for (i = 1, ii = dots.length - 1; i < ii; i++) {
                if (!dots[i].offset) {
                    var start = toFloat(dots[i - 1].offset || 0),
                        end = 0;
                    for (var j = i + 1; j < ii; j++) {
                        if (dots[j].offset) {
                            end = dots[j].offset;
                            break;
                        }
                    }
                    if (!end) {
                        end = 100;
                        j = ii;
                    }
                    end = toFloat(end);
                    var d = (end - start) / (j - i + 1);
                    for (; i < j; i++) {
                        start += d;
                        dots[i].offset = start + "%";
                    }
                }
            }
            return dots;
        }),
        tear = R._tear = function (el, paper) {
            el == paper.top && (paper.top = el.prev);
            el == paper.bottom && (paper.bottom = el.next);
            el.next && (el.next.prev = el.prev);
            el.prev && (el.prev.next = el.next);
        },
        tofront = R._tofront = function (el, paper) {
            if (paper.top === el) {
                return;
            }
            tear(el, paper);
            el.next = null;
            el.prev = paper.top;
            paper.top.next = el;
            paper.top = el;
        },
        toback = R._toback = function (el, paper) {
            if (paper.bottom === el) {
                return;
            }
            tear(el, paper);
            el.next = paper.bottom;
            el.prev = null;
            paper.bottom.prev = el;
            paper.bottom = el;
        },
        insertafter = R._insertafter = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.top && (paper.top = el);
            el2.next && (el2.next.prev = el);
            el.next = el2.next;
            el.prev = el2;
            el2.next = el;
        },
        insertbefore = R._insertbefore = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.bottom && (paper.bottom = el);
            el2.prev && (el2.prev.next = el);
            el.prev = el2.prev;
            el2.prev = el;
            el.next = el2;
        },
        /*\
         * Raphael.toMatrix
         [ method ]
         **
         * Utility method
         **
         * Returns matrix of transformations applied to a given path
         > Parameters
         - path (string) path string
         - transform (string|array) transformation string
         = (object) @Matrix
        \*/
        toMatrix = R.toMatrix = function (path, transform) {
            var bb = pathDimensions(path),
                el = {
                    _: {
                        transform: E
                    },
                    getBBox: function () {
                        return bb;
                    }
                };
            extractTransform(el, transform);
            return el.matrix;
        },
        /*\
         * Raphael.transformPath
         [ method ]
         **
         * Utility method
         **
         * Returns path transformed by a given transformation
         > Parameters
         - path (string) path string
         - transform (string|array) transformation string
         = (string) path
        \*/
        transformPath = R.transformPath = function (path, transform) {
            return mapPath(path, toMatrix(path, transform));
        },
        extractTransform = R._extractTransform = function (el, tstr) {
            if (tstr == null) {
                return el._.transform;
            }
            tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
            var tdata = R.parseTransformString(tstr),
                deg = 0,
                dx = 0,
                dy = 0,
                sx = 1,
                sy = 1,
                _ = el._,
                m = new Matrix;
            _.transform = tdata || [];
            if (tdata) {
                for (var i = 0, ii = tdata.length; i < ii; i++) {
                    var t = tdata[i],
                        tlen = t.length,
                        command = Str(t[0]).toLowerCase(),
                        absolute = t[0] != command,
                        inver = absolute ? m.invert() : 0,
                        x1,
                        y1,
                        x2,
                        y2,
                        bb;
                    if (command == "t" && tlen == 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command == "r") {
                        if (tlen == 2) {
                            bb = bb || el.getBBox(1);
                            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            deg += t[1];
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.rotate(t[1], x2, y2);
                            } else {
                                m.rotate(t[1], t[2], t[3]);
                            }
                            deg += t[1];
                        }
                    } else if (command == "s") {
                        if (tlen == 2 || tlen == 3) {
                            bb = bb || el.getBBox(1);
                            m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            sx *= t[1];
                            sy *= t[tlen - 1];
                        } else if (tlen == 5) {
                            if (absolute) {
                                x2 = inver.x(t[3], t[4]);
                                y2 = inver.y(t[3], t[4]);
                                m.scale(t[1], t[2], x2, y2);
                            } else {
                                m.scale(t[1], t[2], t[3], t[4]);
                            }
                            sx *= t[1];
                            sy *= t[2];
                        }
                    } else if (command == "m" && tlen == 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                    _.dirtyT = 1;
                    el.matrix = m;
                }
            }

            /*\
             * Element.matrix
             [ property (object) ]
             **
             * Keeps @Matrix object, which represents element transformation
            \*/
            el.matrix = m;

            _.sx = sx;
            _.sy = sy;
            _.deg = deg;
            _.dx = dx = m.e;
            _.dy = dy = m.f;

            if (sx == 1 && sy == 1 && !deg && _.bbox) {
                _.bbox.x += +dx;
                _.bbox.y += +dy;
            } else {
                _.dirtyT = 1;
            }
        },
        getEmpty = function (item) {
            var l = item[0];
            switch (l.toLowerCase()) {
                case "t": return [l, 0, 0];
                case "m": return [l, 1, 0, 0, 1, 0, 0];
                case "r": if (item.length == 4) {
                    return [l, 0, item[2], item[3]];
                } else {
                    return [l, 0];
                }
                case "s": if (item.length == 5) {
                    return [l, 1, 1, item[3], item[4]];
                } else if (item.length == 3) {
                    return [l, 1, 1];
                } else {
                    return [l, 1];
                }
            }
        },
        equaliseTransform = R._equaliseTransform = function (t1, t2) {
            t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
            t1 = R.parseTransformString(t1) || [];
            t2 = R.parseTransformString(t2) || [];
            var maxlength = mmax(t1.length, t2.length),
                from = [],
                to = [],
                i = 0, j, jj,
                tt1, tt2;
            for (; i < maxlength; i++) {
                tt1 = t1[i] || getEmpty(t2[i]);
                tt2 = t2[i] || getEmpty(tt1);
                if ((tt1[0] != tt2[0]) ||
                    (tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                    (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
                    ) {
                    return;
                }
                from[i] = [];
                to[i] = [];
                for (j = 0, jj = mmax(tt1.length, tt2.length); j < jj; j++) {
                    j in tt1 && (from[i][j] = tt1[j]);
                    j in tt2 && (to[i][j] = tt2[j]);
                }
            }
            return {
                from: from,
                to: to
            };
        };
    R._getContainer = function (x, y, w, h) {
        var container;
        container = h == null && !R.is(x, "object") ? g.doc.getElementById(x) : x;
        if (container == null) {
            return;
        }
        if (container.tagName) {
            if (y == null) {
                return {
                    container: container,
                    width: container.style.pixelWidth || container.offsetWidth,
                    height: container.style.pixelHeight || container.offsetHeight
                };
            } else {
                return {
                    container: container,
                    width: y,
                    height: w
                };
            }
        }
        return {
            container: 1,
            x: x,
            y: y,
            width: w,
            height: h
        };
    };
    /*\
     * Raphael.pathToRelative
     [ method ]
     **
     * Utility method
     **
     * Converts path to relative form
     > Parameters
     - pathString (string|array) path string or array of segments
     = (array) array of segments.
    \*/
    R.pathToRelative = pathToRelative;
    R._engine = {};
    /*\
     * Raphael.path2curve
     [ method ]
     **
     * Utility method
     **
     * Converts path to a new path where all segments are cubic bezier curves.
     > Parameters
     - pathString (string|array) path string or array of segments
     = (array) array of segments.
    \*/
    R.path2curve = path2curve;
    /*\
     * Raphael.matrix
     [ method ]
     **
     * Utility method
     **
     * Returns matrix based on given parameters.
     > Parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     = (object) @Matrix
    \*/
    R.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
    function Matrix(a, b, c, d, e, f) {
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }
    (function (matrixproto) {
        /*\
         * Matrix.add
         [ method ]
         **
         * Adds given matrix to existing one.
         > Parameters
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         or
         - matrix (object) @Matrix
        \*/
        matrixproto.add = function (a, b, c, d, e, f) {
            var out = [[], [], []],
                m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
                matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
                x, y, z, res;

            if (a && a instanceof Matrix) {
                matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res = 0;
                    for (z = 0; z < 3; z++) {
                        res += m[x][z] * matrix[z][y];
                    }
                    out[x][y] = res;
                }
            }
            this.a = out[0][0];
            this.b = out[1][0];
            this.c = out[0][1];
            this.d = out[1][1];
            this.e = out[0][2];
            this.f = out[1][2];
        };
        /*\
         * Matrix.invert
         [ method ]
         **
         * Returns inverted version of the matrix
         = (object) @Matrix
        \*/
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /*\
         * Matrix.clone
         [ method ]
         **
         * Returns copy of the matrix
         = (object) @Matrix
        \*/
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /*\
         * Matrix.translate
         [ method ]
         **
         * Translate the matrix
         > Parameters
         - x (number)
         - y (number)
        \*/
        matrixproto.translate = function (x, y) {
            this.add(1, 0, 0, 1, x, y);
        };
        /*\
         * Matrix.scale
         [ method ]
         **
         * Scales the matrix
         > Parameters
         - x (number)
         - y (number) #optional
         - cx (number) #optional
         - cy (number) #optional
        \*/
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
            this.add(x, 0, 0, y, 0, 0);
            (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
        };
        /*\
         * Matrix.rotate
         [ method ]
         **
         * Rotates the matrix
         > Parameters
         - a (number)
         - x (number)
         - y (number)
        \*/
        matrixproto.rotate = function (a, x, y) {
            a = R.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            this.add(1, 0, 0, 1, -x, -y);
        };
        /*\
         * Matrix.x
         [ method ]
         **
         * Return x coordinate for given point after transformation described by the matrix. See also @Matrix.y
         > Parameters
         - x (number)
         - y (number)
         = (number) x
        \*/
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /*\
         * Matrix.y
         [ method ]
         **
         * Return y coordinate for given point after transformation described by the matrix. See also @Matrix.x
         > Parameters
         - x (number)
         - y (number)
         = (number) y
        \*/
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(4);
        };
        matrixproto.toString = function () {
            return R.svg ?
                "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")" :
                [this.get(0), this.get(2), this.get(1), this.get(3), 0, 0].join();
        };
        matrixproto.toFilter = function () {
            return "progid:DXImageTransform.Microsoft.Matrix(M11=" + this.get(0) +
                ", M12=" + this.get(2) + ", M21=" + this.get(1) + ", M22=" + this.get(3) +
                ", Dx=" + this.get(4) + ", Dy=" + this.get(5) + ", sizingmethod='auto expand')";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(4), this.f.toFixed(4)];
        };
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }
        /*\
         * Matrix.split
         [ method ]
         **
         * Splits matrix into primitive transformations
         = (object) in format:
         o dx (number) translation by x
         o dy (number) translation by y
         o scalex (number) scale by x
         o scaley (number) scale by y
         o shear (number) shear
         o rotate (number) rotation in deg
         o isSimple (boolean) could it be represented via simple transformations
        \*/
        matrixproto.split = function () {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            // scale and shear
            var row = [[this.a, this.c], [this.b, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            // rotation
            var sin = -row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = R.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = R.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };
        /*\
         * Matrix.toTransformString
         [ method ]
         **
         * Return transform string that represents given matrix
         = (string) transform string
        \*/
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this[split]();
            if (s.isSimple) {
                s.scalex = +s.scalex.toFixed(4);
                s.scaley = +s.scaley.toFixed(4);
                s.rotate = +s.rotate.toFixed(4);
                return  (s.dx || s.dy ? "t" + [s.dx, s.dy] : E) +
                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                        (s.rotate ? "r" + [s.rotate, 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };
    })(Matrix.prototype);

    // WebKit rendering bug workaround method
    var version = navigator.userAgent.match(/Version\/(.*?)\s/) || navigator.userAgent.match(/Chrome\/(\d+)/);
    if ((navigator.vendor == "Apple Computer, Inc.") && (version && version[1] < 4 || navigator.platform.slice(0, 2) == "iP") ||
        (navigator.vendor == "Google Inc." && version && version[1] < 8)) {
        /*\
         * Paper.safari
         [ method ]
         **
         * There is an inconvenient rendering bug in Safari (WebKit):
         * sometimes the rendering should be forced.
         * This method should help with dealing with this bug.
        \*/
        paperproto.safari = function () {
            var rect = this.rect(-99, -99, this.width + 99, this.height + 99).attr({stroke: "none"});
            setTimeout(function () {rect.remove();});
        };
    } else {
        paperproto.safari = fun;
    }

    var preventDefault = function () {
        this.returnValue = false;
    },
    preventTouch = function () {
        return this.originalEvent.preventDefault();
    },
    stopPropagation = function () {
        this.cancelBubble = true;
    },
    stopTouch = function () {
        return this.originalEvent.stopPropagation();
    },
    getEventPosition = function (e) {
        var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft;

        return {
            x: e.clientX + scrollX,
            y: e.clientY + scrollY
        };
    },
    addEvent = (function () {
        if (g.doc.addEventListener) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    var pos = getEventPosition(e);
                    return fn.call(element, e, pos.x, pos.y);
                };
                obj.addEventListener(type, f, false);

                if (supportsTouch && touchMap[type]) {
                    var _f = function (e) {
                        var pos = getEventPosition(e),
                            olde = e;

                        for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                            if (e.targetTouches[i].target == obj) {
                                e = e.targetTouches[i];
                                e.originalEvent = olde;
                                e.preventDefault = preventTouch;
                                e.stopPropagation = stopTouch;
                                break;
                            }
                        }

                        return fn.call(element, e, pos.x, pos.y);
                    };
                    obj.addEventListener(touchMap[type], _f, false);
                }

                return function () {
                    obj.removeEventListener(type, f, false);

                    if (supportsTouch && touchMap[type])
                        obj.removeEventListener(touchMap[type], _f, false);

                    return true;
                };
            };
        } else if (g.doc.attachEvent) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    e = e || g.win.event;
                    var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                        scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
                        x = e.clientX + scrollX,
                        y = e.clientY + scrollY;
                    e.preventDefault = e.preventDefault || preventDefault;
                    e.stopPropagation = e.stopPropagation || stopPropagation;
                    return fn.call(element, e, x, y);
                };
                obj.attachEvent("on" + type, f);
                var detacher = function () {
                    obj.detachEvent("on" + type, f);
                    return true;
                };
                return detacher;
            };
        }
    })(),
    drag = [],
    dragMove = function (e) {
        var x = e.clientX,
            y = e.clientY,
            scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
            dragi,
            j = drag.length;
        while (j--) {
            dragi = drag[j];
            if (supportsTouch && e.touches) {
                var i = e.touches.length,
                    touch;
                while (i--) {
                    touch = e.touches[i];
                    if (touch.identifier == dragi.el._drag.id) {
                        x = touch.clientX;
                        y = touch.clientY;
                        (e.originalEvent ? e.originalEvent : e).preventDefault();
                        break;
                    }
                }
            } else {
                e.preventDefault();
            }
            var node = dragi.el.node,
                o,
                next = node.nextSibling,
                parent = node.parentNode,
                display = node.style.display;
            g.win.opera && parent.removeChild(node);
            node.style.display = "none";
            o = dragi.el.paper.getElementByPoint(x, y);
            node.style.display = display;
            g.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
            o && eve("raphael.drag.over." + dragi.el.id, dragi.el, o);
            x += scrollX;
            y += scrollY;
            eve("raphael.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
        }
    },
    dragUp = function (e) {
        R.unmousemove(dragMove).unmouseup(dragUp);
        var i = drag.length,
            dragi;
        while (i--) {
            dragi = drag[i];
            dragi.el._drag = {};
            eve("raphael.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
        }
        drag = [];
    },
    /*\
     * Raphael.el
     [ property (object) ]
     **
     * You can add your own method to elements. This is usefull when you want to hack default functionality or
     * want to wrap some common transformation or attributes in one method. In difference to canvas methods,
     * you can redefine element method at any time. Expending element methods wouldn’t affect set.
     > Usage
     | Raphael.el.red = function () {
     |     this.attr({fill: "#f00"});
     | };
     | // then use it
     | paper.circle(100, 100, 20).red();
    \*/
    elproto = R.el = {};
    /*\
     * Element.click
     [ method ]
     **
     * Adds event handler for click for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unclick
     [ method ]
     **
     * Removes event handler for click for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.dblclick
     [ method ]
     **
     * Adds event handler for double click for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.undblclick
     [ method ]
     **
     * Removes event handler for double click for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousedown
     [ method ]
     **
     * Adds event handler for mousedown for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousedown
     [ method ]
     **
     * Removes event handler for mousedown for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousemove
     [ method ]
     **
     * Adds event handler for mousemove for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousemove
     [ method ]
     **
     * Removes event handler for mousemove for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseout
     [ method ]
     **
     * Adds event handler for mouseout for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseout
     [ method ]
     **
     * Removes event handler for mouseout for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseover
     [ method ]
     **
     * Adds event handler for mouseover for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseover
     [ method ]
     **
     * Removes event handler for mouseover for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseup
     [ method ]
     **
     * Adds event handler for mouseup for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseup
     [ method ]
     **
     * Removes event handler for mouseup for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchstart
     [ method ]
     **
     * Adds event handler for touchstart for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchstart
     [ method ]
     **
     * Removes event handler for touchstart for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchmove
     [ method ]
     **
     * Adds event handler for touchmove for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchmove
     [ method ]
     **
     * Removes event handler for touchmove for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchend
     [ method ]
     **
     * Adds event handler for touchend for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchend
     [ method ]
     **
     * Removes event handler for touchend for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchcancel
     [ method ]
     **
     * Adds event handler for touchcancel for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchcancel
     [ method ]
     **
     * Removes event handler for touchcancel for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/
    for (var i = events.length; i--;) {
        (function (eventName) {
            R[eventName] = elproto[eventName] = function (fn, scope) {
                if (R.is(fn, "function")) {
                    this.events = this.events || [];
                    this.events.push({name: eventName, f: fn, unbind: addEvent(this.shape || this.node || g.doc, eventName, fn, scope || this)});
                }
                return this;
            };
            R["un" + eventName] = elproto["un" + eventName] = function (fn) {
                var events = this.events || [],
                    l = events.length;
                while (l--){
                    if (events[l].name == eventName && (R.is(fn, "undefined") || events[l].f == fn)) {
                        events[l].unbind();
                        events.splice(l, 1);
                        !events.length && delete this.events;
                    }
                }
                return this;
            };
        })(events[i]);
    }

    /*\
     * Element.data
     [ method ]
     **
     * Adds or retrieves given value asociated with given key.
     **
     * See also @Element.removeData
     > Parameters
     - key (string) key to store data
     - value (any) #optional value to store
     = (object) @Element
     * or, if value is not specified:
     = (any) value
     * or, if key and value are not specified:
     = (object) Key/value pairs for all the data associated with the element.
     > Usage
     | for (var i = 0, i < 5, i++) {
     |     paper.circle(10 + 15 * i, 10, 10)
     |          .attr({fill: "#000"})
     |          .data("i", i)
     |          .click(function () {
     |             alert(this.data("i"));
     |          });
     | }
    \*/
    elproto.data = function (key, value) {
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 0) {
            return data;
        }
        if (arguments.length == 1) {
            if (R.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("raphael.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("raphael.data.set." + this.id, this, value, key);
        return this;
    };
    /*\
     * Element.removeData
     [ method ]
     **
     * Removes value associated with an element by given key.
     * If key is not provided, removes all the data of the element.
     > Parameters
     - key (string) #optional key
     = (object) @Element
    \*/
    elproto.removeData = function (key) {
        if (key == null) {
            eldata[this.id] = {};
        } else {
            eldata[this.id] && delete eldata[this.id][key];
        }
        return this;
    };
     /*\
     * Element.getData
     [ method ]
     **
     * Retrieves the element data
     = (object) data
    \*/
    elproto.getData = function () {
        return clone(eldata[this.id] || {});
    };
    /*\
     * Element.hover
     [ method ]
     **
     * Adds event handlers for hover for the element.
     > Parameters
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     - icontext (object) #optional context for hover in handler
     - ocontext (object) #optional context for hover out handler
     = (object) @Element
    \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /*\
     * Element.unhover
     [ method ]
     **
     * Removes event handlers for hover for the element.
     > Parameters
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     = (object) @Element
    \*/
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    var draggable = [];
    /*\
     * Element.drag
     [ method ]
     **
     * Adds event handlers for drag of the element.
     > Parameters
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events will be triggered: `drag.start.<id>` on start,
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element will be dragged over another element
     * `drag.over.<id>` will be fired as well.
     *
     * Start event and start handler will be called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler will be called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler will be called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
    \*/
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        function start(e) {
            (e.originalEvent || e).preventDefault();
            var x = e.clientX,
                y = e.clientY,
                scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft;
            this._drag.id = e.identifier;
            if (supportsTouch && e.touches) {
                var i = e.touches.length, touch;
                while (i--) {
                    touch = e.touches[i];
                    this._drag.id = touch.identifier;
                    if (touch.identifier == this._drag.id) {
                        x = touch.clientX;
                        y = touch.clientY;
                        break;
                    }
                }
            }
            this._drag.x = x + scrollX;
            this._drag.y = y + scrollY;
            !drag.length && R.mousemove(dragMove).mouseup(dragUp);
            drag.push({el: this, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("raphael.drag.start." + this.id, onstart);
            onmove && eve.on("raphael.drag.move." + this.id, onmove);
            onend && eve.on("raphael.drag.end." + this.id, onend);
            eve("raphael.drag.start." + this.id, start_scope || move_scope || this, e.clientX + scrollX, e.clientY + scrollY, e);
        }
        this._drag = {};
        draggable.push({el: this, start: start});
        this.mousedown(start);
        return this;
    };
    /*\
     * Element.onDragOver
     [ method ]
     **
     * Shortcut for assigning event handler for `drag.over.<id>` event, where id is id of the element (see @Element.id).
     > Parameters
     - f (function) handler for event, first argument would be the element you are dragging over
    \*/
    elproto.onDragOver = function (f) {
        f ? eve.on("raphael.drag.over." + this.id, f) : eve.unbind("raphael.drag.over." + this.id);
    };
    /*\
     * Element.undrag
     [ method ]
     **
     * Removes all drag event handlers from given element.
    \*/
    elproto.undrag = function () {
        var i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].start);
            draggable.splice(i, 1);
            eve.unbind("raphael.drag.*." + this.id);
        }
        !draggable.length && R.unmousemove(dragMove).unmouseup(dragUp);
        drag = [];
    };
    /*\
     * Paper.circle
     [ method ]
     **
     * Draws a circle.
     **
     > Parameters
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - r (number) radius
     = (object) Raphaël element object with type “circle”
     **
     > Usage
     | var c = paper.circle(50, 50, 40);
    \*/
    paperproto.circle = function (x, y, r) {
        var out = R._engine.circle(this, x || 0, y || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.rect
     [ method ]
     *
     * Draws a rectangle.
     **
     > Parameters
     **
     - x (number) x coordinate of the top left corner
     - y (number) y coordinate of the top left corner
     - width (number) width
     - height (number) height
     - r (number) #optional radius for rounded corners, default is 0
     = (object) Raphaël element object with type “rect”
     **
     > Usage
     | // regular rectangle
     | var c = paper.rect(10, 10, 50, 50);
     | // rectangle with rounded corners
     | var c = paper.rect(40, 40, 50, 50, 10);
    \*/
    paperproto.rect = function (x, y, w, h, r) {
        var out = R._engine.rect(this, x || 0, y || 0, w || 0, h || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.ellipse
     [ method ]
     **
     * Draws an ellipse.
     **
     > Parameters
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - rx (number) horizontal radius
     - ry (number) vertical radius
     = (object) Raphaël element object with type “ellipse”
     **
     > Usage
     | var c = paper.ellipse(50, 50, 40, 20);
    \*/
    paperproto.ellipse = function (x, y, rx, ry) {
        var out = R._engine.ellipse(this, x || 0, y || 0, rx || 0, ry || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.path
     [ method ]
     **
     * Creates a path element by given path data string.
     > Parameters
     - pathString (string) #optional path string in SVG format.
     * Path string consists of one-letter commands, followed by comma seprarated arguments in numercal form. Example:
     | "M10,20L30,40"
     * Here we can see two commands: “M”, with arguments `(10, 20)` and “L” with arguments `(30, 40)`. Upper case letter mean command is absolute, lower case—relative.
     *
     # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a>.</p>
     # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
     # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
     # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
     # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
     # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
     # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
     # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
     # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
     # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
     # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
     # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
     # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
     * * “Catmull-Rom curveto” is a not standard SVG command and added in 2.0 to make life easier.
     * Note: there is a special case when path consist of just three commands: “M10,10R…z”. In this case path will smoothly connects to its beginning.
     > Usage
     | var c = paper.path("M10 10L90 90");
     | // draw a diagonal line:
     | // move to 10,10, line to 90,90
     * For example of path strings, check out these icons: http://raphaeljs.com/icons/
    \*/
    paperproto.path = function (pathString) {
        pathString && !R.is(pathString, string) && !R.is(pathString[0], array) && (pathString += E);
        var out = R._engine.path(R.format[apply](R, arguments), this);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.image
     [ method ]
     **
     * Embeds an image into the surface.
     **
     > Parameters
     **
     - src (string) URI of the source image
     - x (number) x coordinate position
     - y (number) y coordinate position
     - width (number) width of the image
     - height (number) height of the image
     = (object) Raphaël element object with type “image”
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    paperproto.image = function (src, x, y, w, h) {
        var out = R._engine.image(this, src || "about:blank", x || 0, y || 0, w || 0, h || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.text
     [ method ]
     **
     * Draws a text string. If you need line breaks, put “\n” in the string.
     **
     > Parameters
     **
     - x (number) x coordinate position
     - y (number) y coordinate position
     - text (string) The text string to draw
     = (object) Raphaël element object with type “text”
     **
     > Usage
     | var t = paper.text(50, 50, "Raphaël\nkicks\nbutt!");
    \*/
    paperproto.text = function (x, y, text) {
        var out = R._engine.text(this, x || 0, y || 0, Str(text));
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.set
     [ method ]
     **
     * Creates array-like object to keep and operate several elements at once.
     * Warning: it doesn’t create any elements for itself in the page, it just groups existing elements.
     * Sets act as pseudo elements — all methods available to an element can be used on a set.
     = (object) array-like object that represents set of elements
     **
     > Usage
     | var st = paper.set();
     | st.push(
     |     paper.circle(10, 10, 5),
     |     paper.circle(30, 10, 5)
     | );
     | st.attr({fill: "red"}); // changes the fill of both circles
    \*/
    paperproto.set = function (itemsArray) {
        !R.is(itemsArray, "array") && (itemsArray = Array.prototype.splice.call(arguments, 0, arguments.length));
        var out = new Set(itemsArray);
        this.__set__ && this.__set__.push(out);
        out["paper"] = this;
        out["type"] = "set";
        return out;
    };
    /*\
     * Paper.setStart
     [ method ]
     **
     * Creates @Paper.set. All elements that will be created after calling this method and before calling
     * @Paper.setFinish will be added to the set.
     **
     > Usage
     | paper.setStart();
     | paper.circle(10, 10, 5),
     | paper.circle(30, 10, 5)
     | var st = paper.setFinish();
     | st.attr({fill: "red"}); // changes the fill of both circles
    \*/
    paperproto.setStart = function (set) {
        this.__set__ = set || this.set();
    };
    /*\
     * Paper.setFinish
     [ method ]
     **
     * See @Paper.setStart. This method finishes catching and returns resulting set.
     **
     = (object) set
    \*/
    paperproto.setFinish = function (set) {
        var out = this.__set__;
        delete this.__set__;
        return out;
    };
    /*\
     * Paper.getSize
     [ method ]
     **
     * Obtains current paper actual size.
     **
     = (object)
     \*/
    paperproto.getSize = function () {
        var container = this.canvas.parentNode;
        return {
            width: container.offsetWidth,
            height: container.offsetHeight
                };
        };
    /*\
     * Paper.setSize
     [ method ]
     **
     * If you need to change dimensions of the canvas call this method
     **
     > Parameters
     **
     - width (number) new width of the canvas
     - height (number) new height of the canvas
    \*/
    paperproto.setSize = function (width, height) {
        return R._engine.setSize.call(this, width, height);
    };
    /*\
     * Paper.setViewBox
     [ method ]
     **
     * Sets the view box of the paper. Practically it gives you ability to zoom and pan whole paper surface by
     * specifying new boundaries.
     **
     > Parameters
     **
     - x (number) new x position, default is `0`
     - y (number) new y position, default is `0`
     - w (number) new width of the canvas
     - h (number) new height of the canvas
     - fit (boolean) `true` if you want graphics to fit into new boundary box
    \*/
    paperproto.setViewBox = function (x, y, w, h, fit) {
        return R._engine.setViewBox.call(this, x, y, w, h, fit);
    };
    /*\
     * Paper.top
     [ property ]
     **
     * Points to the topmost element on the paper
    \*/
    /*\
     * Paper.bottom
     [ property ]
     **
     * Points to the bottom element on the paper
    \*/
    paperproto.top = paperproto.bottom = null;
    /*\
     * Paper.raphael
     [ property ]
     **
     * Points to the @Raphael object/function
    \*/
    paperproto.raphael = R;
    var getOffset = function (elem) {
        var box = elem.getBoundingClientRect(),
            doc = elem.ownerDocument,
            body = doc.body,
            docElem = doc.documentElement,
            clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
            top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
            left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
        return {
            y: top,
            x: left
        };
    };
    /*\
     * Paper.getElementByPoint
     [ method ]
     **
     * Returns you topmost element under given point.
     **
     = (object) Raphaël element object
     > Parameters
     **
     - x (number) x coordinate from the top left corner of the window
     - y (number) y coordinate from the top left corner of the window
     > Usage
     | paper.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
    \*/
    paperproto.getElementByPoint = function (x, y) {
        var paper = this,
            svg = paper.canvas,
            target = g.doc.elementFromPoint(x, y);
        if (g.win.opera && target.tagName == "svg") {
            var so = getOffset(svg),
                sr = svg.createSVGRect();
            sr.x = x - so.x;
            sr.y = y - so.y;
            sr.width = sr.height = 1;
            var hits = svg.getIntersectionList(sr, null);
            if (hits.length) {
                target = hits[hits.length - 1];
            }
        }
        if (!target) {
            return null;
        }
        while (target.parentNode && target != svg.parentNode && !target.raphael) {
            target = target.parentNode;
        }
        target == paper.canvas.parentNode && (target = svg);
        target = target && target.raphael ? paper.getById(target.raphaelid) : null;
        return target;
    };

    /*\
     * Paper.getElementsByBBox
     [ method ]
     **
     * Returns set of elements that have an intersecting bounding box
     **
     > Parameters
     **
     - bbox (object) bbox to check with
     = (object) @Set
     \*/
    paperproto.getElementsByBBox = function (bbox) {
        var set = this.set();
        this.forEach(function (el) {
            if (R.isBBoxIntersect(el.getBBox(), bbox)) {
                set.push(el);
            }
        });
        return set;
    };

    /*\
     * Paper.getById
     [ method ]
     **
     * Returns you element by its internal ID.
     **
     > Parameters
     **
     - id (number) id
     = (object) Raphaël element object
    \*/
    paperproto.getById = function (id) {
        var bot = this.bottom;
        while (bot) {
            if (bot.id == id) {
                return bot;
            }
            bot = bot.next;
        }
        return null;
    };
    /*\
     * Paper.forEach
     [ method ]
     **
     * Executes given function for each element on the paper
     *
     * If callback function returns `false` it will stop loop running.
     **
     > Parameters
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Paper object
     > Usage
     | paper.forEach(function (el) {
     |     el.attr({ stroke: "blue" });
     | });
    \*/
    paperproto.forEach = function (callback, thisArg) {
        var bot = this.bottom;
        while (bot) {
            if (callback.call(thisArg, bot) === false) {
                return this;
            }
            bot = bot.next;
        }
        return this;
    };
    /*\
     * Paper.getElementsByPoint
     [ method ]
     **
     * Returns set of elements that have common point inside
     **
     > Parameters
     **
     - x (number) x coordinate of the point
     - y (number) y coordinate of the point
     = (object) @Set
    \*/
    paperproto.getElementsByPoint = function (x, y) {
        var set = this.set();
        this.forEach(function (el) {
            if (el.isPointInside(x, y)) {
                set.push(el);
            }
        });
        return set;
    };
    function x_y() {
        return this.x + S + this.y;
    }
    function x_y_w_h() {
        return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
    }
    /*\
     * Element.isPointInside
     [ method ]
     **
     * Determine if given point is inside this element’s shape
     **
     > Parameters
     **
     - x (number) x coordinate of the point
     - y (number) y coordinate of the point
     = (boolean) `true` if point inside the shape
    \*/
    elproto.isPointInside = function (x, y) {
        var rp = this.realPath = getPath[this.type](this);
        if (this.attr('transform') && this.attr('transform').length) {
            rp = R.transformPath(rp, this.attr('transform'));
        }
        return R.isPointInsidePath(rp, x, y);
    };
    /*\
     * Element.getBBox
     [ method ]
     **
     * Return bounding box for a given element
     **
     > Parameters
     **
     - isWithoutTransform (boolean) flag, `true` if you want to have bounding box before transformations. Default is `false`.
     = (object) Bounding box object:
     o {
     o     x: (number) top left corner x
     o     y: (number) top left corner y
     o     x2: (number) bottom right corner x
     o     y2: (number) bottom right corner y
     o     width: (number) width
     o     height: (number) height
     o }
    \*/
    elproto.getBBox = function (isWithoutTransform) {
        if (this.removed) {
            return {};
        }
        var _ = this._;
        if (isWithoutTransform) {
            if (_.dirty || !_.bboxwt) {
                this.realPath = getPath[this.type](this);
                _.bboxwt = pathDimensions(this.realPath);
                _.bboxwt.toString = x_y_w_h;
                _.dirty = 0;
            }
            return _.bboxwt;
        }
        if (_.dirty || _.dirtyT || !_.bbox) {
            if (_.dirty || !this.realPath) {
                _.bboxwt = 0;
                this.realPath = getPath[this.type](this);
            }
            _.bbox = pathDimensions(mapPath(this.realPath, this.matrix));
            _.bbox.toString = x_y_w_h;
            _.dirty = _.dirtyT = 0;
        }
        return _.bbox;
    };
    /*\
     * Element.clone
     [ method ]
     **
     = (object) clone of a given element
     **
    \*/
    elproto.clone = function () {
        if (this.removed) {
            return null;
        }
        var out = this.paper[this.type]().attr(this.attr());
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Element.glow
     [ method ]
     **
     * Return set of elements that create glow-like effect around given element. See @Paper.set.
     *
     * Note: Glow is not connected to the element. If you change element attributes it won’t adjust itself.
     **
     > Parameters
     **
     - glow (object) #optional parameters object with all properties optional:
     o {
     o     width (number) size of the glow, default is `10`
     o     fill (boolean) will it be filled, default is `false`
     o     opacity (number) opacity, default is `0.5`
     o     offsetx (number) horizontal offset, default is `0`
     o     offsety (number) vertical offset, default is `0`
     o     color (string) glow colour, default is `black`
     o }
     = (object) @Paper.set of elements that represents glow
    \*/
    elproto.glow = function (glow) {
        if (this.type == "text") {
            return null;
        }
        glow = glow || {};
        var s = {
            width: (glow.width || 10) + (+this.attr("stroke-width") || 1),
            fill: glow.fill || false,
            opacity: glow.opacity || .5,
            offsetx: glow.offsetx || 0,
            offsety: glow.offsety || 0,
            color: glow.color || "#000"
        },
            c = s.width / 2,
            r = this.paper,
            out = r.set(),
            path = this.realPath || getPath[this.type](this);
        path = this.matrix ? mapPath(path, this.matrix) : path;
        for (var i = 1; i < c + 1; i++) {
            out.push(r.path(path).attr({
                stroke: s.color,
                fill: s.fill ? s.color : "none",
                "stroke-linejoin": "round",
                "stroke-linecap": "round",
                "stroke-width": +(s.width / c * i).toFixed(3),
                opacity: +(s.opacity / c).toFixed(3)
            }));
        }
        return out.insertBefore(this).translate(s.offsetx, s.offsety);
    };
    var curveslengths = {},
    getPointAtSegmentLength = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return R.findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTatLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    },
    getLengthFactory = function (istotal, subpath) {
        return function (path, length, onlystart) {
            path = path2curve(path);
            var x, y, p, l, sp = "", subpaths = {}, point,
                len = 0;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            sp += ["C" + point.start.x, point.start.y, point.m.x, point.m.y, point.x, point.y];
                            if (onlystart) {return sp;}
                            subpaths.start = sp;
                            sp = ["M" + point.x, point.y + "C" + point.n.x, point.n.y, point.end.x, point.end.y, p[5], p[6]].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            return {x: point.x, y: point.y, alpha: point.alpha};
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ? len : subpath ? subpaths : R.findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            point.alpha && (point = {x: point.x, y: point.y, alpha: point.alpha});
            return point;
        };
    };
    var getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);
    /*\
     * Raphael.getTotalLength
     [ method ]
     **
     * Returns length of the given path in pixels.
     **
     > Parameters
     **
     - path (string) SVG path string.
     **
     = (number) length.
    \*/
    R.getTotalLength = getTotalLength;
    /*\
     * Raphael.getPointAtLength
     [ method ]
     **
     * Return coordinates of the point located at the given length on the given path.
     **
     > Parameters
     **
     - path (string) SVG path string
     - length (number)
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate
     o     y: (number) y coordinate
     o     alpha: (number) angle of derivative
     o }
    \*/
    R.getPointAtLength = getPointAtLength;
    /*\
     * Raphael.getSubpath
     [ method ]
     **
     * Return subpath of a given path from given length to given length.
     **
     > Parameters
     **
     - path (string) SVG path string
     - from (number) position of the start of the segment
     - to (number) position of the end of the segment
     **
     = (string) pathstring for the segment
    \*/
    R.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        var a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };
    /*\
     * Element.getTotalLength
     [ method ]
     **
     * Returns length of the path in pixels. Only works for element of “path” type.
     = (number) length.
    \*/
    elproto.getTotalLength = function () {
        var path = this.getPath();
        if (!path) {
            return;
        }

        if (this.node.getTotalLength) {
            return this.node.getTotalLength();
        }

        return getTotalLength(path);
    };
    /*\
     * Element.getPointAtLength
     [ method ]
     **
     * Return coordinates of the point located at the given length on the given path. Only works for element of “path” type.
     **
     > Parameters
     **
     - length (number)
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate
     o     y: (number) y coordinate
     o     alpha: (number) angle of derivative
     o }
    \*/
    elproto.getPointAtLength = function (length) {
        var path = this.getPath();
        if (!path) {
            return;
        }

        return getPointAtLength(path, length);
    };
    /*\
     * Element.getPath
     [ method ]
     **
     * Returns path of the element. Only works for elements of “path” type and simple elements like circle.
     = (object) path
     **
    \*/
    elproto.getPath = function () {
        var path,
            getPath = R._getPath[this.type];

        if (this.type == "text" || this.type == "set") {
            return;
        }

        if (getPath) {
            path = getPath(this);
        }

        return path;
    };
    /*\
     * Element.getSubpath
     [ method ]
     **
     * Return subpath of a given element from given length to given length. Only works for element of “path” type.
     **
     > Parameters
     **
     - from (number) position of the start of the segment
     - to (number) position of the end of the segment
     **
     = (string) pathstring for the segment
    \*/
    elproto.getSubpath = function (from, to) {
        var path = this.getPath();
        if (!path) {
            return;
        }

        return R.getSubpath(path, from, to);
    };
    /*\
     * Raphael.easing_formulas
     [ property ]
     **
     * Object that contains easing formulas for animation. You could extend it with your own. By default it has following list of easing:
     # <ul>
     #     <li>“linear”</li>
     #     <li>“&lt;” or “easeIn” or “ease-in”</li>
     #     <li>“>” or “easeOut” or “ease-out”</li>
     #     <li>“&lt;>” or “easeInOut” or “ease-in-out”</li>
     #     <li>“backIn” or “back-in”</li>
     #     <li>“backOut” or “back-out”</li>
     #     <li>“elastic”</li>
     #     <li>“bounce”</li>
     # </ul>
     # <p>See also <a href="http://raphaeljs.com/easing.html">Easing demo</a>.</p>
    \*/
    var ef = R.easing_formulas = {
        linear: function (n) {
            return n;
        },
        "<": function (n) {
            return pow(n, 1.7);
        },
        ">": function (n) {
            return pow(n, .48);
        },
        "<>": function (n) {
            var q = .48 - n / 1.04,
                Q = math.sqrt(.1734 + q * q),
                x = Q - q,
                X = pow(abs(x), 1 / 3) * (x < 0 ? -1 : 1),
                y = -Q - q,
                Y = pow(abs(y), 1 / 3) * (y < 0 ? -1 : 1),
                t = X + Y + .5;
            return (1 - t) * 3 * t * t + t * t * t;
        },
        backIn: function (n) {
            var s = 1.70158;
            return n * n * ((s + 1) * n - s);
        },
        backOut: function (n) {
            n = n - 1;
            var s = 1.70158;
            return n * n * ((s + 1) * n + s) + 1;
        },
        elastic: function (n) {
            if (n == !!n) {
                return n;
            }
            return pow(2, -10 * n) * math.sin((n - .075) * (2 * PI) / .3) + 1;
        },
        bounce: function (n) {
            var s = 7.5625,
                p = 2.75,
                l;
            if (n < (1 / p)) {
                l = s * n * n;
            } else {
                if (n < (2 / p)) {
                    n -= (1.5 / p);
                    l = s * n * n + .75;
                } else {
                    if (n < (2.5 / p)) {
                        n -= (2.25 / p);
                        l = s * n * n + .9375;
                    } else {
                        n -= (2.625 / p);
                        l = s * n * n + .984375;
                    }
                }
            }
            return l;
        }
    };
    ef.easeIn = ef["ease-in"] = ef["<"];
    ef.easeOut = ef["ease-out"] = ef[">"];
    ef.easeInOut = ef["ease-in-out"] = ef["<>"];
    ef["back-in"] = ef.backIn;
    ef["back-out"] = ef.backOut;

    var animationElements = [],
        requestAnimFrame = window.requestAnimationFrame       ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame    ||
                           window.oRequestAnimationFrame      ||
                           window.msRequestAnimationFrame     ||
                           function (callback) {
                               setTimeout(callback, 16);
                           },
        animation = function () {
            var Now = +new Date,
                l = 0;
            for (; l < animationElements.length; l++) {
                var e = animationElements[l];
                if (e.el.removed || e.paused) {
                    continue;
                }
                var time = Now - e.start,
                    ms = e.ms,
                    easing = e.easing,
                    from = e.from,
                    diff = e.diff,
                    to = e.to,
                    t = e.t,
                    that = e.el,
                    set = {},
                    now,
                    init = {},
                    key;
                if (e.initstatus) {
                    time = (e.initstatus * e.anim.top - e.prev) / (e.percent - e.prev) * ms;
                    e.status = e.initstatus;
                    delete e.initstatus;
                    e.stop && animationElements.splice(l--, 1);
                } else {
                    e.status = (e.prev + (e.percent - e.prev) * (time / ms)) / e.anim.top;
                }
                if (time < 0) {
                    continue;
                }
                if (time < ms) {
                    var pos = easing(time / ms);
                    for (var attr in from) if (from[has](attr)) {
                        switch (availableAnimAttrs[attr]) {
                            case nu:
                                now = +from[attr] + pos * ms * diff[attr];
                                break;
                            case "colour":
                                now = "rgb(" + [
                                    upto255(round(from[attr].r + pos * ms * diff[attr].r)),
                                    upto255(round(from[attr].g + pos * ms * diff[attr].g)),
                                    upto255(round(from[attr].b + pos * ms * diff[attr].b))
                                ].join(",") + ")";
                                break;
                            case "path":
                                now = [];
                                for (var i = 0, ii = from[attr].length; i < ii; i++) {
                                    now[i] = [from[attr][i][0]];
                                    for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        now[i][j] = +from[attr][i][j] + pos * ms * diff[attr][i][j];
                                    }
                                    now[i] = now[i].join(S);
                                }
                                now = now.join(S);
                                break;
                            case "transform":
                                if (diff[attr].real) {
                                    now = [];
                                    for (i = 0, ii = from[attr].length; i < ii; i++) {
                                        now[i] = [from[attr][i][0]];
                                        for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                            now[i][j] = from[attr][i][j] + pos * ms * diff[attr][i][j];
                                        }
                                    }
                                } else {
                                    var get = function (i) {
                                        return +from[attr][i] + pos * ms * diff[attr][i];
                                    };
                                    // now = [["r", get(2), 0, 0], ["t", get(3), get(4)], ["s", get(0), get(1), 0, 0]];
                                    now = [["m", get(0), get(1), get(2), get(3), get(4), get(5)]];
                                }
                                break;
                            case "csv":
                                if (attr == "clip-rect") {
                                    now = [];
                                    i = 4;
                                    while (i--) {
                                        now[i] = +from[attr][i] + pos * ms * diff[attr][i];
                                    }
                                }
                                break;
                            default:
                                var from2 = [][concat](from[attr]);
                                now = [];
                                i = that.paper.customAttributes[attr].length;
                                while (i--) {
                                    now[i] = +from2[i] + pos * ms * diff[attr][i];
                                }
                                break;
                        }
                        set[attr] = now;
                    }
                    that.attr(set);
                    (function (id, that, anim) {
                        setTimeout(function () {
                            eve("raphael.anim.frame." + id, that, anim);
                        });
                    })(that.id, that, e.anim);
                } else {
                    (function(f, el, a) {
                        setTimeout(function() {
                            eve("raphael.anim.frame." + el.id, el, a);
                            eve("raphael.anim.finish." + el.id, el, a);
                            R.is(f, "function") && f.call(el);
                        });
                    })(e.callback, that, e.anim);
                    that.attr(to);
                    animationElements.splice(l--, 1);
                    if (e.repeat > 1 && !e.next) {
                        for (key in to) if (to[has](key)) {
                            init[key] = e.totalOrigin[key];
                        }
                        e.el.attr(init);
                        runAnimation(e.anim, e.el, e.anim.percents[0], null, e.totalOrigin, e.repeat - 1);
                    }
                    if (e.next && !e.stop) {
                        runAnimation(e.anim, e.el, e.next, null, e.totalOrigin, e.repeat);
                    }
                }
            }
            R.svg && that && that.paper && that.paper.safari();
            animationElements.length && requestAnimFrame(animation);
        },
        upto255 = function (color) {
            return color > 255 ? 255 : color < 0 ? 0 : color;
        };
    /*\
     * Element.animateWith
     [ method ]
     **
     * Acts similar to @Element.animate, but ensure that given animation runs in sync with another given element.
     **
     > Parameters
     **
     - el (object) element to sync with
     - anim (object) animation to sync with
     - params (object) #optional final attributes for the element, see also @Element.attr
     - ms (number) #optional number of milliseconds for animation to run
     - easing (string) #optional easing type. Accept on of @Raphael.easing_formulas or CSS format: `cubic&#x2010;bezier(XX,&#160;XX,&#160;XX,&#160;XX)`
     - callback (function) #optional callback function. Will be called at the end of animation.
     * or
     - element (object) element to sync with
     - anim (object) animation to sync with
     - animation (object) #optional animation object, see @Raphael.animation
     **
     = (object) original element
    \*/
    elproto.animateWith = function (el, anim, params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var a = params instanceof Animation ? params : R.animation(params, ms, easing, callback),
            x, y;
        runAnimation(a, element, a.percents[0], null, element.attr());
        for (var i = 0, ii = animationElements.length; i < ii; i++) {
            if (animationElements[i].anim == anim && animationElements[i].el == el) {
                animationElements[ii - 1].start = animationElements[i].start;
                break;
            }
        }
        return element;
        //
        //
        // var a = params ? R.animation(params, ms, easing, callback) : anim,
        //     status = element.status(anim);
        // return this.animate(a).status(a, status * anim.ms / a.ms);
    };
    function CubicBezierAtTime(t, p1x, p1y, p2x, p2y, duration) {
        var cx = 3 * p1x,
            bx = 3 * (p2x - p1x) - cx,
            ax = 1 - cx - bx,
            cy = 3 * p1y,
            by = 3 * (p2y - p1y) - cy,
            ay = 1 - cy - by;
        function sampleCurveX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }
        function solve(x, epsilon) {
            var t = solveCurveX(x, epsilon);
            return ((ay * t + by) * t + cy) * t;
        }
        function solveCurveX(x, epsilon) {
            var t0, t1, t2, x2, d2, i;
            for(t2 = x, i = 0; i < 8; i++) {
                x2 = sampleCurveX(t2) - x;
                if (abs(x2) < epsilon) {
                    return t2;
                }
                d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
                if (abs(d2) < 1e-6) {
                    break;
                }
                t2 = t2 - x2 / d2;
            }
            t0 = 0;
            t1 = 1;
            t2 = x;
            if (t2 < t0) {
                return t0;
            }
            if (t2 > t1) {
                return t1;
            }
            while (t0 < t1) {
                x2 = sampleCurveX(t2);
                if (abs(x2 - x) < epsilon) {
                    return t2;
                }
                if (x > x2) {
                    t0 = t2;
                } else {
                    t1 = t2;
                }
                t2 = (t1 - t0) / 2 + t0;
            }
            return t2;
        }
        return solve(t, 1 / (200 * duration));
    }
    elproto.onAnimation = function (f) {
        f ? eve.on("raphael.anim.frame." + this.id, f) : eve.unbind("raphael.anim.frame." + this.id);
        return this;
    };
    function Animation(anim, ms) {
        var percents = [],
            newAnim = {};
        this.ms = ms;
        this.times = 1;
        if (anim) {
            for (var attr in anim) if (anim[has](attr)) {
                newAnim[toFloat(attr)] = anim[attr];
                percents.push(toFloat(attr));
            }
            percents.sort(sortByNumber);
        }
        this.anim = newAnim;
        this.top = percents[percents.length - 1];
        this.percents = percents;
    }
    /*\
     * Animation.delay
     [ method ]
     **
     * Creates a copy of existing animation object with given delay.
     **
     > Parameters
     **
     - delay (number) number of ms to pass between animation start and actual animation
     **
     = (object) new altered Animation object
     | var anim = Raphael.animation({cx: 10, cy: 20}, 2e3);
     | circle1.animate(anim); // run the given animation immediately
     | circle2.animate(anim.delay(500)); // run the given animation after 500 ms
    \*/
    Animation.prototype.delay = function (delay) {
        var a = new Animation(this.anim, this.ms);
        a.times = this.times;
        a.del = +delay || 0;
        return a;
    };
    /*\
     * Animation.repeat
     [ method ]
     **
     * Creates a copy of existing animation object with given repetition.
     **
     > Parameters
     **
     - repeat (number) number iterations of animation. For infinite animation pass `Infinity`
     **
     = (object) new altered Animation object
    \*/
    Animation.prototype.repeat = function (times) {
        var a = new Animation(this.anim, this.ms);
        a.del = this.del;
        a.times = math.floor(mmax(times, 0)) || 1;
        return a;
    };
    function runAnimation(anim, element, percent, status, totalOrigin, times) {
        percent = toFloat(percent);
        var params,
            isInAnim,
            isInAnimSet,
            percents = [],
            next,
            prev,
            timestamp,
            ms = anim.ms,
            from = {},
            to = {},
            diff = {};
        if (status) {
            for (i = 0, ii = animationElements.length; i < ii; i++) {
                var e = animationElements[i];
                if (e.el.id == element.id && e.anim == anim) {
                    if (e.percent != percent) {
                        animationElements.splice(i, 1);
                        isInAnimSet = 1;
                    } else {
                        isInAnim = e;
                    }
                    element.attr(e.totalOrigin);
                    break;
                }
            }
        } else {
            status = +to; // NaN
        }
        for (var i = 0, ii = anim.percents.length; i < ii; i++) {
            if (anim.percents[i] == percent || anim.percents[i] > status * anim.top) {
                percent = anim.percents[i];
                prev = anim.percents[i - 1] || 0;
                ms = ms / anim.top * (percent - prev);
                next = anim.percents[i + 1];
                params = anim.anim[percent];
                break;
            } else if (status) {
                element.attr(anim.anim[anim.percents[i]]);
            }
        }
        if (!params) {
            return;
        }
        if (!isInAnim) {
            for (var attr in params) if (params[has](attr)) {
                if (availableAnimAttrs[has](attr) || element.paper.customAttributes[has](attr)) {
                    from[attr] = element.attr(attr);
                    (from[attr] == null) && (from[attr] = availableAttrs[attr]);
                    to[attr] = params[attr];
                    switch (availableAnimAttrs[attr]) {
                        case nu:
                            diff[attr] = (to[attr] - from[attr]) / ms;
                            break;
                        case "colour":
                            from[attr] = R.getRGB(from[attr]);
                            var toColour = R.getRGB(to[attr]);
                            diff[attr] = {
                                r: (toColour.r - from[attr].r) / ms,
                                g: (toColour.g - from[attr].g) / ms,
                                b: (toColour.b - from[attr].b) / ms
                            };
                            break;
                        case "path":
                            var pathes = path2curve(from[attr], to[attr]),
                                toPath = pathes[1];
                            from[attr] = pathes[0];
                            diff[attr] = [];
                            for (i = 0, ii = from[attr].length; i < ii; i++) {
                                diff[attr][i] = [0];
                                for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                    diff[attr][i][j] = (toPath[i][j] - from[attr][i][j]) / ms;
                                }
                            }
                            break;
                        case "transform":
                            var _ = element._,
                                eq = equaliseTransform(_[attr], to[attr]);
                            if (eq) {
                                from[attr] = eq.from;
                                to[attr] = eq.to;
                                diff[attr] = [];
                                diff[attr].real = true;
                                for (i = 0, ii = from[attr].length; i < ii; i++) {
                                    diff[attr][i] = [from[attr][i][0]];
                                    for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        diff[attr][i][j] = (to[attr][i][j] - from[attr][i][j]) / ms;
                                    }
                                }
                            } else {
                                var m = (element.matrix || new Matrix),
                                    to2 = {
                                        _: {transform: _.transform},
                                        getBBox: function () {
                                            return element.getBBox(1);
                                        }
                                    };
                                from[attr] = [
                                    m.a,
                                    m.b,
                                    m.c,
                                    m.d,
                                    m.e,
                                    m.f
                                ];
                                extractTransform(to2, to[attr]);
                                to[attr] = to2._.transform;
                                diff[attr] = [
                                    (to2.matrix.a - m.a) / ms,
                                    (to2.matrix.b - m.b) / ms,
                                    (to2.matrix.c - m.c) / ms,
                                    (to2.matrix.d - m.d) / ms,
                                    (to2.matrix.e - m.e) / ms,
                                    (to2.matrix.f - m.f) / ms
                                ];
                                // from[attr] = [_.sx, _.sy, _.deg, _.dx, _.dy];
                                // var to2 = {_:{}, getBBox: function () { return element.getBBox(); }};
                                // extractTransform(to2, to[attr]);
                                // diff[attr] = [
                                //     (to2._.sx - _.sx) / ms,
                                //     (to2._.sy - _.sy) / ms,
                                //     (to2._.deg - _.deg) / ms,
                                //     (to2._.dx - _.dx) / ms,
                                //     (to2._.dy - _.dy) / ms
                                // ];
                            }
                            break;
                        case "csv":
                            var values = Str(params[attr])[split](separator),
                                from2 = Str(from[attr])[split](separator);
                            if (attr == "clip-rect") {
                                from[attr] = from2;
                                diff[attr] = [];
                                i = from2.length;
                                while (i--) {
                                    diff[attr][i] = (values[i] - from[attr][i]) / ms;
                                }
                            }
                            to[attr] = values;
                            break;
                        default:
                            values = [][concat](params[attr]);
                            from2 = [][concat](from[attr]);
                            diff[attr] = [];
                            i = element.paper.customAttributes[attr].length;
                            while (i--) {
                                diff[attr][i] = ((values[i] || 0) - (from2[i] || 0)) / ms;
                            }
                            break;
                    }
                }
            }
            var easing = params.easing,
                easyeasy = R.easing_formulas[easing];
            if (!easyeasy) {
                easyeasy = Str(easing).match(bezierrg);
                if (easyeasy && easyeasy.length == 5) {
                    var curve = easyeasy;
                    easyeasy = function (t) {
                        return CubicBezierAtTime(t, +curve[1], +curve[2], +curve[3], +curve[4], ms);
                    };
                } else {
                    easyeasy = pipe;
                }
            }
            timestamp = params.start || anim.start || +new Date;
            e = {
                anim: anim,
                percent: percent,
                timestamp: timestamp,
                start: timestamp + (anim.del || 0),
                status: 0,
                initstatus: status || 0,
                stop: false,
                ms: ms,
                easing: easyeasy,
                from: from,
                diff: diff,
                to: to,
                el: element,
                callback: params.callback,
                prev: prev,
                next: next,
                repeat: times || anim.times,
                origin: element.attr(),
                totalOrigin: totalOrigin
            };
            animationElements.push(e);
            if (status && !isInAnim && !isInAnimSet) {
                e.stop = true;
                e.start = new Date - ms * status;
                if (animationElements.length == 1) {
                    return animation();
                }
            }
            if (isInAnimSet) {
                e.start = new Date - e.ms * status;
            }
            animationElements.length == 1 && requestAnimFrame(animation);
        } else {
            isInAnim.initstatus = status;
            isInAnim.start = new Date - isInAnim.ms * status;
        }
        eve("raphael.anim.start." + element.id, element, anim);
    }
    /*\
     * Raphael.animation
     [ method ]
     **
     * Creates an animation object that can be passed to the @Element.animate or @Element.animateWith methods.
     * See also @Animation.delay and @Animation.repeat methods.
     **
     > Parameters
     **
     - params (object) final attributes for the element, see also @Element.attr
     - ms (number) number of milliseconds for animation to run
     - easing (string) #optional easing type. Accept one of @Raphael.easing_formulas or CSS format: `cubic&#x2010;bezier(XX,&#160;XX,&#160;XX,&#160;XX)`
     - callback (function) #optional callback function. Will be called at the end of animation.
     **
     = (object) @Animation
    \*/
    R.animation = function (params, ms, easing, callback) {
        if (params instanceof Animation) {
            return params;
        }
        if (R.is(easing, "function") || !easing) {
            callback = callback || easing || null;
            easing = null;
        }
        params = Object(params);
        ms = +ms || 0;
        var p = {},
            json,
            attr;
        for (attr in params) if (params[has](attr) && toFloat(attr) != attr && toFloat(attr) + "%" != attr) {
            json = true;
            p[attr] = params[attr];
        }
        if (!json) {
            // if percent-like syntax is used and end-of-all animation callback used
            if(callback){
                // find the last one
                var lastKey = 0;
                for(var i in params){
                    var percent = toInt(i);
                    if(params[has](i) && percent > lastKey){
                        lastKey = percent;
                    }
                }
                lastKey += '%';
                // if already defined callback in the last keyframe, skip
                !params[lastKey].callback && (params[lastKey].callback = callback);
            }
          return new Animation(params, ms);
        } else {
            easing && (p.easing = easing);
            callback && (p.callback = callback);
            return new Animation({100: p}, ms);
        }
    };
    /*\
     * Element.animate
     [ method ]
     **
     * Creates and starts animation for given element.
     **
     > Parameters
     **
     - params (object) final attributes for the element, see also @Element.attr
     - ms (number) number of milliseconds for animation to run
     - easing (string) #optional easing type. Accept one of @Raphael.easing_formulas or CSS format: `cubic&#x2010;bezier(XX,&#160;XX,&#160;XX,&#160;XX)`
     - callback (function) #optional callback function. Will be called at the end of animation.
     * or
     - animation (object) animation object, see @Raphael.animation
     **
     = (object) original element
    \*/
    elproto.animate = function (params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var anim = params instanceof Animation ? params : R.animation(params, ms, easing, callback);
        runAnimation(anim, element, anim.percents[0], null, element.attr());
        return element;
    };
    /*\
     * Element.setTime
     [ method ]
     **
     * Sets the status of animation of the element in milliseconds. Similar to @Element.status method.
     **
     > Parameters
     **
     - anim (object) animation object
     - value (number) number of milliseconds from the beginning of the animation
     **
     = (object) original element if `value` is specified
     * Note, that during animation following events are triggered:
     *
     * On each animation frame event `anim.frame.<id>`, on start `anim.start.<id>` and on end `anim.finish.<id>`.
    \*/
    elproto.setTime = function (anim, value) {
        if (anim && value != null) {
            this.status(anim, mmin(value, anim.ms) / anim.ms);
        }
        return this;
    };
    /*\
     * Element.status
     [ method ]
     **
     * Gets or sets the status of animation of the element.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     - value (number) #optional 0 – 1. If specified, method works like a setter and sets the status of a given animation to the value. This will cause animation to jump to the given position.
     **
     = (number) status
     * or
     = (array) status if `anim` is not specified. Array of objects in format:
     o {
     o     anim: (object) animation object
     o     status: (number) status
     o }
     * or
     = (object) original element if `value` is specified
    \*/
    elproto.status = function (anim, value) {
        var out = [],
            i = 0,
            len,
            e;
        if (value != null) {
            runAnimation(anim, this, -1, mmin(value, 1));
            return this;
        } else {
            len = animationElements.length;
            for (; i < len; i++) {
                e = animationElements[i];
                if (e.el.id == this.id && (!anim || e.anim == anim)) {
                    if (anim) {
                        return e.status;
                    }
                    out.push({
                        anim: e.anim,
                        status: e.status
                    });
                }
            }
            if (anim) {
                return 0;
            }
            return out;
        }
    };
    /*\
     * Element.pause
     [ method ]
     **
     * Stops animation of the element with ability to resume it later on.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     **
     = (object) original element
    \*/
    elproto.pause = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.pause." + this.id, this, animationElements[i].anim) !== false) {
                animationElements[i].paused = true;
            }
        }
        return this;
    };
    /*\
     * Element.resume
     [ method ]
     **
     * Resumes animation if it was paused with @Element.pause method.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     **
     = (object) original element
    \*/
    elproto.resume = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            var e = animationElements[i];
            if (eve("raphael.anim.resume." + this.id, this, e.anim) !== false) {
                delete e.paused;
                this.status(e.anim, e.status);
            }
        }
        return this;
    };
    /*\
     * Element.stop
     [ method ]
     **
     * Stops animation of the element.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     **
     = (object) original element
    \*/
    elproto.stop = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.stop." + this.id, this, animationElements[i].anim) !== false) {
                animationElements.splice(i--, 1);
            }
        }
        return this;
    };
    function stopAnimation(paper) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.paper == paper) {
            animationElements.splice(i--, 1);
        }
    }
    eve.on("raphael.remove", stopAnimation);
    eve.on("raphael.clear", stopAnimation);
    elproto.toString = function () {
        return "Rapha\xebl\u2019s object";
    };

    // Set
    var Set = function (items) {
        this.items = [];
        this.length = 0;
        this.type = "set";
        if (items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                if (items[i] && (items[i].constructor == elproto.constructor || items[i].constructor == Set)) {
                    this[this.items.length] = this.items[this.items.length] = items[i];
                    this.length++;
                }
            }
        }
    },
    setproto = Set.prototype;
    /*\
     * Set.push
     [ method ]
     **
     * Adds each argument to the current set.
     = (object) original element
    \*/
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            item = arguments[i];
            if (item && (item.constructor == elproto.constructor || item.constructor == Set)) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    /*\
     * Set.pop
     [ method ]
     **
     * Removes last element and returns it.
     = (object) element
    \*/
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    /*\
     * Set.forEach
     [ method ]
     **
     * Executes given function for each element in the set.
     *
     * If function returns `false` it will stop loop running.
     **
     > Parameters
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Set object
    \*/
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    for (var method in elproto) if (elproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname][apply](el, arg);
                });
            };
        })(method);
    }
    setproto.attr = function (name, value) {
        if (name && R.is(name, array) && R.is(name[0], "object")) {
            for (var j = 0, jj = name.length; j < jj; j++) {
                this.items[j].attr(name[j]);
            }
        } else {
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                this.items[i].attr(name, value);
            }
        }
        return this;
    };
    /*\
     * Set.clear
     [ method ]
     **
     * Removes all elements from the set
    \*/
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    /*\
     * Set.splice
     [ method ]
     **
     * Removes given element from the set
     **
     > Parameters
     **
     - index (number) position of the deletion
     - count (number) number of element to remove
     - insertion… (object) #optional elements to insert
     = (object) set elements that were deleted
    \*/
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; i++) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; i++) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    /*\
     * Set.exclude
     [ method ]
     **
     * Removes given element from the set
     **
     > Parameters
     **
     - element (object) element to remove
     = (boolean) `true` if object was found & removed from the set
    \*/
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
    };
    setproto.animate = function (params, ms, easing, callback) {
        (R.is(easing, "function") || !easing) && (callback = easing || null);
        var len = this.items.length,
            i = len,
            item,
            set = this,
            collector;
        if (!len) {
            return this;
        }
        callback && (collector = function () {
            !--len && callback.call(set);
        });
        easing = R.is(easing, string) ? easing : collector;
        var anim = R.animation(params, ms, easing, collector);
        item = this.items[--i].animate(anim);
        while (i--) {
            this.items[i] && !this.items[i].removed && this.items[i].animateWith(item, anim, anim);
            (this.items[i] && !this.items[i].removed) || len--;
        }
        return this;
    };
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    setproto.getBBox = function () {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            var box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
        }
        x = mmin[apply](0, x);
        y = mmin[apply](0, y);
        x2 = mmax[apply](0, x2);
        y2 = mmax[apply](0, y2);
        return {
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y
        };
    };
    setproto.clone = function (s) {
        s = this.paper.set();
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Rapha\xebl\u2018s set";
    };

    setproto.glow = function(glowConfig) {
        var ret = this.paper.set();
        this.forEach(function(shape, index){
            var g = shape.glow(glowConfig);
            if(g != null){
                g.forEach(function(shape2, index2){
                    ret.push(shape2);
                });
            }
        });
        return ret;
    };


    /*\
     * Set.isPointInside
     [ method ]
     **
     * Determine if given point is inside this set’s elements
     **
     > Parameters
     **
     - x (number) x coordinate of the point
     - y (number) y coordinate of the point
     = (boolean) `true` if point is inside any of the set's elements
     \*/
    setproto.isPointInside = function (x, y) {
        var isPointInside = false;
        this.forEach(function (el) {
            if (el.isPointInside(x, y)) {
                isPointInside = true;
                return false; // stop loop
            }
        });
        return isPointInside;
    };

    /*\
     * Raphael.registerFont
     [ method ]
     **
     * Adds given font to the registered set of fonts for Raphaël. Should be used as an internal call from within Cufón’s font file.
     * Returns original parameter, so it could be used with chaining.
     # <a href="http://wiki.github.com/sorccu/cufon/about">More about Cufón and how to convert your font form TTF, OTF, etc to JavaScript file.</a>
     **
     > Parameters
     **
     - font (object) the font to register
     = (object) the font you passed in
     > Usage
     | Cufon.registerFont(Raphael.registerFont({…}));
    \*/
    R.registerFont = function (font) {
        if (!font.face) {
            return font;
        }
        this.fonts = this.fonts || {};
        var fontcopy = {
                w: font.w,
                face: {},
                glyphs: {}
            },
            family = font.face["font-family"];
        for (var prop in font.face) if (font.face[has](prop)) {
            fontcopy.face[prop] = font.face[prop];
        }
        if (this.fonts[family]) {
            this.fonts[family].push(fontcopy);
        } else {
            this.fonts[family] = [fontcopy];
        }
        if (!font.svg) {
            fontcopy.face["units-per-em"] = toInt(font.face["units-per-em"], 10);
            for (var glyph in font.glyphs) if (font.glyphs[has](glyph)) {
                var path = font.glyphs[glyph];
                fontcopy.glyphs[glyph] = {
                    w: path.w,
                    k: {},
                    d: path.d && "M" + path.d.replace(/[mlcxtrv]/g, function (command) {
                            return {l: "L", c: "C", x: "z", t: "m", r: "l", v: "c"}[command] || "M";
                        }) + "z"
                };
                if (path.k) {
                    for (var k in path.k) if (path[has](k)) {
                        fontcopy.glyphs[glyph].k[k] = path.k[k];
                    }
                }
            }
        }
        return font;
    };
    /*\
     * Paper.getFont
     [ method ]
     **
     * Finds font object in the registered fonts by given parameters. You could specify only one word from the font name, like “Myriad” for “Myriad Pro”.
     **
     > Parameters
     **
     - family (string) font family name or any word from it
     - weight (string) #optional font weight
     - style (string) #optional font style
     - stretch (string) #optional font stretch
     = (object) the font object
     > Usage
     | paper.print(100, 100, "Test string", paper.getFont("Times", 800), 30);
    \*/
    paperproto.getFont = function (family, weight, style, stretch) {
        stretch = stretch || "normal";
        style = style || "normal";
        weight = +weight || {normal: 400, bold: 700, lighter: 300, bolder: 800}[weight] || 400;
        if (!R.fonts) {
            return;
        }
        var font = R.fonts[family];
        if (!font) {
            var name = new RegExp("(^|\\s)" + family.replace(/[^\w\d\s+!~.:_-]/g, E) + "(\\s|$)", "i");
            for (var fontName in R.fonts) if (R.fonts[has](fontName)) {
                if (name.test(fontName)) {
                    font = R.fonts[fontName];
                    break;
                }
            }
        }
        var thefont;
        if (font) {
            for (var i = 0, ii = font.length; i < ii; i++) {
                thefont = font[i];
                if (thefont.face["font-weight"] == weight && (thefont.face["font-style"] == style || !thefont.face["font-style"]) && thefont.face["font-stretch"] == stretch) {
                    break;
                }
            }
        }
        return thefont;
    };
    /*\
     * Paper.print
     [ method ]
     **
     * Creates path that represent given text written using given font at given position with given size.
     * Result of the method is path element that contains whole text as a separate path.
     **
     > Parameters
     **
     - x (number) x position of the text
     - y (number) y position of the text
     - string (string) text to print
     - font (object) font object, see @Paper.getFont
     - size (number) #optional size of the font, default is `16`
     - origin (string) #optional could be `"baseline"` or `"middle"`, default is `"middle"`
     - letter_spacing (number) #optional number in range `-1..1`, default is `0`
     - line_spacing (number) #optional number in range `1..3`, default is `1`
     = (object) resulting path element, which consist of all letters
     > Usage
     | var txt = r.print(10, 50, "print", r.getFont("Museo"), 30).attr({fill: "#fff"});
    \*/
    paperproto.print = function (x, y, string, font, size, origin, letter_spacing, line_spacing) {
        origin = origin || "middle"; // baseline|middle
        letter_spacing = mmax(mmin(letter_spacing || 0, 1), -1);
        line_spacing = mmax(mmin(line_spacing || 1, 3), 1);
        var letters = Str(string)[split](E),
            shift = 0,
            notfirst = 0,
            path = E,
            scale;
        R.is(font, "string") && (font = this.getFont(font));
        if (font) {
            scale = (size || 16) / font.face["units-per-em"];
            var bb = font.face.bbox[split](separator),
                top = +bb[0],
                lineHeight = bb[3] - bb[1],
                shifty = 0,
                height = +bb[1] + (origin == "baseline" ? lineHeight + (+font.face.descent) : lineHeight / 2);
            for (var i = 0, ii = letters.length; i < ii; i++) {
                if (letters[i] == "\n") {
                    shift = 0;
                    curr = 0;
                    notfirst = 0;
                    shifty += lineHeight * line_spacing;
                } else {
                    var prev = notfirst && font.glyphs[letters[i - 1]] || {},
                        curr = font.glyphs[letters[i]];
                    shift += notfirst ? (prev.w || font.w) + (prev.k && prev.k[letters[i]] || 0) + (font.w * letter_spacing) : 0;
                    notfirst = 1;
                }
                if (curr && curr.d) {
                    path += R.transformPath(curr.d, ["t", shift * scale, shifty * scale, "s", scale, scale, top, height, "t", (x - top) / scale, (y - height) / scale]);
                }
            }
        }
        return this.path(path).attr({
            fill: "#000",
            stroke: "none"
        });
    };

    /*\
     * Paper.add
     [ method ]
     **
     * Imports elements in JSON array in format `{type: type, <attributes>}`
     **
     > Parameters
     **
     - json (array)
     = (object) resulting set of imported elements
     > Usage
     | paper.add([
     |     {
     |         type: "circle",
     |         cx: 10,
     |         cy: 10,
     |         r: 5
     |     },
     |     {
     |         type: "rect",
     |         x: 10,
     |         y: 10,
     |         width: 10,
     |         height: 10,
     |         fill: "#fc0"
     |     }
     | ]);
    \*/
    paperproto.add = function (json) {
        if (R.is(json, "array")) {
            var res = this.set(),
                i = 0,
                ii = json.length,
                j;
            for (; i < ii; i++) {
                j = json[i] || {};
                elements[has](j.type) && res.push(this[j.type]().attr(j));
            }
        }
        return res;
    };

    /*\
     * Raphael.format
     [ method ]
     **
     * Simple format function. Replaces construction of type “`{<number>}`” to the corresponding argument.
     **
     > Parameters
     **
     - token (string) string to format
     - … (string) rest of arguments will be treated as parameters for replacement
     = (string) formated string
     > Usage
     | var x = 10,
     |     y = 20,
     |     width = 40,
     |     height = 50;
     | // this will draw a rectangular shape equivalent to "M10,20h40v50h-40z"
     | paper.path(Raphael.format("M{0},{1}h{2}v{3}h{4}z", x, y, width, height, -width));
    \*/
    R.format = function (token, params) {
        var args = R.is(params, array) ? [0][concat](params) : arguments;
        token && R.is(token, string) && args.length - 1 && (token = token.replace(formatrg, function (str, i) {
            return args[++i] == null ? E : args[i];
        }));
        return token || E;
    };
    /*\
     * Raphael.fullfill
     [ method ]
     **
     * A little bit more advanced format function than @Raphael.format. Replaces construction of type “`{<name>}`” to the corresponding argument.
     **
     > Parameters
     **
     - token (string) string to format
     - json (object) object which properties will be used as a replacement
     = (string) formated string
     > Usage
     | // this will draw a rectangular shape equivalent to "M10,20h40v50h-40z"
     | paper.path(Raphael.fullfill("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
     |     x: 10,
     |     y: 20,
     |     dim: {
     |         width: 40,
     |         height: 50,
     |         "negative width": -40
     |     }
     | }));
    \*/
    R.fullfill = (function () {
        var tokenRegex = /\{([^\}]+)\}/g,
            objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
            replacer = function (all, key, obj) {
                var res = obj;
                key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                    name = name || quotedName;
                    if (res) {
                        if (name in res) {
                            res = res[name];
                        }
                        typeof res == "function" && isFunc && (res = res());
                    }
                });
                res = (res == null || res == obj ? all : res) + "";
                return res;
            };
        return function (str, obj) {
            return String(str).replace(tokenRegex, function (all, key) {
                return replacer(all, key, obj);
            });
        };
    })();
    /*\
     * Raphael.ninja
     [ method ]
     **
     * If you want to leave no trace of Raphaël (Well, Raphaël creates only one global variable `Raphael`, but anyway.) You can use `ninja` method.
     * Beware, that in this case plugins could stop working, because they are depending on global variable existance.
     **
     = (object) Raphael object
     > Usage
     | (function (local_raphael) {
     |     var paper = local_raphael(10, 10, 320, 200);
     |     …
     | })(Raphael.ninja());
    \*/
    R.ninja = function () {
        oldRaphael.was ? (g.win.Raphael = oldRaphael.is) : delete Raphael;
        return R;
    };
    /*\
     * Raphael.st
     [ property (object) ]
     **
     * You can add your own method to elements and sets. It is wise to add a set method for each element method
     * you added, so you will be able to call the same method on sets too.
     **
     * See also @Raphael.el.
     > Usage
     | Raphael.el.red = function () {
     |     this.attr({fill: "#f00"});
     | };
     | Raphael.st.red = function () {
     |     this.forEach(function (el) {
     |         el.red();
     |     });
     | };
     | // then use it
     | paper.set(paper.circle(100, 100, 20), paper.circle(110, 100, 20)).red();
    \*/
    R.st = setproto;

    eve.on("raphael.DOMload", function () {
        loaded = true;
    });

    // Firefox <3.6 fix: http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
    (function (doc, loaded, f) {
        if (doc.readyState == null && doc.addEventListener){
            doc.addEventListener(loaded, f = function () {
                doc.removeEventListener(loaded, f, false);
                doc.readyState = "complete";
            }, false);
            doc.readyState = "loading";
        }
        function isLoaded() {
            (/in/).test(doc.readyState) ? setTimeout(isLoaded, 9) : R.eve("raphael.DOMload");
        }
        isLoaded();
    })(document, "DOMContentLoaded");

// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ SVG Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\

(function(){
    if (!R.svg) {
        return;
    }
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        toInt = parseInt,
        math = Math,
        mmax = math.max,
        abs = math.abs,
        pow = math.pow,
        separator = /[, ]+/,
        eve = R.eve,
        E = "",
        S = " ";
    var xlink = "http://www.w3.org/1999/xlink",
        markers = {
            block: "M5,0 0,2.5 5,5z",
            classic: "M5,0 0,2.5 5,5 3.5,3 3.5,2z",
            diamond: "M2.5,0 5,2.5 2.5,5 0,2.5z",
            open: "M6,1 1,3.5 6,6",
            oval: "M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"
        },
        markerCounter = {};
    R.toString = function () {
        return  "Your browser supports SVG.\nYou are running Rapha\xebl " + this.version;
    };
    var $ = function (el, attr) {
        if (attr) {
            if (typeof el == "string") {
                el = $(el);
            }
            for (var key in attr) if (attr[has](key)) {
                if (key.substring(0, 6) == "xlink:") {
                    el.setAttributeNS(xlink, key.substring(6), Str(attr[key]));
                } else {
                    el.setAttribute(key, Str(attr[key]));
                }
            }
        } else {
            el = R._g.doc.createElementNS("http://www.w3.org/2000/svg", el);
            el.style && (el.style.webkitTapHighlightColor = "rgba(0,0,0,0)");
        }
        return el;
    },
    addGradientFill = function (element, gradient) {
        var type = "linear",
            id = element.id + gradient,
            fx = .5, fy = .5,
            o = element.node,
            SVG = element.paper,
            s = o.style,
            el = R._g.doc.getElementById(id);
        if (!el) {
            gradient = Str(gradient).replace(R._radial_gradient, function (all, _fx, _fy) {
                type = "radial";
                if (_fx && _fy) {
                    fx = toFloat(_fx);
                    fy = toFloat(_fy);
                    var dir = ((fy > .5) * 2 - 1);
                    pow(fx - .5, 2) + pow(fy - .5, 2) > .25 &&
                        (fy = math.sqrt(.25 - pow(fx - .5, 2)) * dir + .5) &&
                        fy != .5 &&
                        (fy = fy.toFixed(5) - 1e-5 * dir);
                }
                return E;
            });
            gradient = gradient.split(/\s*\-\s*/);
            if (type == "linear") {
                var angle = gradient.shift();
                angle = -toFloat(angle);
                if (isNaN(angle)) {
                    return null;
                }
                var vector = [0, 0, math.cos(R.rad(angle)), math.sin(R.rad(angle))],
                    max = 1 / (mmax(abs(vector[2]), abs(vector[3])) || 1);
                vector[2] *= max;
                vector[3] *= max;
                if (vector[2] < 0) {
                    vector[0] = -vector[2];
                    vector[2] = 0;
                }
                if (vector[3] < 0) {
                    vector[1] = -vector[3];
                    vector[3] = 0;
                }
            }
            var dots = R._parseDots(gradient);
            if (!dots) {
                return null;
            }
            id = id.replace(/[\(\)\s,\xb0#]/g, "_");

            if (element.gradient && id != element.gradient.id) {
                SVG.defs.removeChild(element.gradient);
                delete element.gradient;
            }

            if (!element.gradient) {
                el = $(type + "Gradient", {id: id});
                element.gradient = el;
                $(el, type == "radial" ? {
                    fx: fx,
                    fy: fy
                } : {
                    x1: vector[0],
                    y1: vector[1],
                    x2: vector[2],
                    y2: vector[3],
                    gradientTransform: element.matrix.invert()
                });
                SVG.defs.appendChild(el);
                for (var i = 0, ii = dots.length; i < ii; i++) {
                    el.appendChild($("stop", {
                        offset: dots[i].offset ? dots[i].offset : i ? "100%" : "0%",
                        "stop-color": dots[i].color || "#fff"
                    }));
                }
            }
        }
        $(o, {
            fill: "url('" + document.location + "#" + id + "')",
            opacity: 1,
            "fill-opacity": 1
        });
        s.fill = E;
        s.opacity = 1;
        s.fillOpacity = 1;
        return 1;
    },
    updatePosition = function (o) {
        var bbox = o.getBBox(1);
        $(o.pattern, {patternTransform: o.matrix.invert() + " translate(" + bbox.x + "," + bbox.y + ")"});
    },
    addArrow = function (o, value, isEnd) {
        if (o.type == "path") {
            var values = Str(value).toLowerCase().split("-"),
                p = o.paper,
                se = isEnd ? "end" : "start",
                node = o.node,
                attrs = o.attrs,
                stroke = attrs["stroke-width"],
                i = values.length,
                type = "classic",
                from,
                to,
                dx,
                refX,
                attr,
                w = 3,
                h = 3,
                t = 5;
            while (i--) {
                switch (values[i]) {
                    case "block":
                    case "classic":
                    case "oval":
                    case "diamond":
                    case "open":
                    case "none":
                        type = values[i];
                        break;
                    case "wide": h = 5; break;
                    case "narrow": h = 2; break;
                    case "long": w = 5; break;
                    case "short": w = 2; break;
                }
            }
            if (type == "open") {
                w += 2;
                h += 2;
                t += 2;
                dx = 1;
                refX = isEnd ? 4 : 1;
                attr = {
                    fill: "none",
                    stroke: attrs.stroke
                };
            } else {
                refX = dx = w / 2;
                attr = {
                    fill: attrs.stroke,
                    stroke: "none"
                };
            }
            if (o._.arrows) {
                if (isEnd) {
                    o._.arrows.endPath && markerCounter[o._.arrows.endPath]--;
                    o._.arrows.endMarker && markerCounter[o._.arrows.endMarker]--;
                } else {
                    o._.arrows.startPath && markerCounter[o._.arrows.startPath]--;
                    o._.arrows.startMarker && markerCounter[o._.arrows.startMarker]--;
                }
            } else {
                o._.arrows = {};
            }
            if (type != "none") {
                var pathId = "raphael-marker-" + type,
                    markerId = "raphael-marker-" + se + type + w + h + "-obj" + o.id;
                if (!R._g.doc.getElementById(pathId)) {
                    p.defs.appendChild($($("path"), {
                        "stroke-linecap": "round",
                        d: markers[type],
                        id: pathId
                    }));
                    markerCounter[pathId] = 1;
                } else {
                    markerCounter[pathId]++;
                }
                var marker = R._g.doc.getElementById(markerId),
                    use;
                if (!marker) {
                    marker = $($("marker"), {
                        id: markerId,
                        markerHeight: h,
                        markerWidth: w,
                        orient: "auto",
                        refX: refX,
                        refY: h / 2
                    });
                    use = $($("use"), {
                        "xlink:href": "#" + pathId,
                        transform: (isEnd ? "rotate(180 " + w / 2 + " " + h / 2 + ") " : E) + "scale(" + w / t + "," + h / t + ")",
                        "stroke-width": (1 / ((w / t + h / t) / 2)).toFixed(4)
                    });
                    marker.appendChild(use);
                    p.defs.appendChild(marker);
                    markerCounter[markerId] = 1;
                } else {
                    markerCounter[markerId]++;
                    use = marker.getElementsByTagName("use")[0];
                }
                $(use, attr);
                var delta = dx * (type != "diamond" && type != "oval");
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - delta * stroke;
                } else {
                    from = delta * stroke;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                attr = {};
                attr["marker-" + se] = "url(#" + markerId + ")";
                if (to || from) {
                    attr.d = R.getSubpath(attrs.path, from, to);
                }
                $(node, attr);
                o._.arrows[se + "Path"] = pathId;
                o._.arrows[se + "Marker"] = markerId;
                o._.arrows[se + "dx"] = delta;
                o._.arrows[se + "Type"] = type;
                o._.arrows[se + "String"] = value;
            } else {
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - from;
                } else {
                    from = 0;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                o._.arrows[se + "Path"] && $(node, {d: R.getSubpath(attrs.path, from, to)});
                delete o._.arrows[se + "Path"];
                delete o._.arrows[se + "Marker"];
                delete o._.arrows[se + "dx"];
                delete o._.arrows[se + "Type"];
                delete o._.arrows[se + "String"];
            }
            for (attr in markerCounter) if (markerCounter[has](attr) && !markerCounter[attr]) {
                var item = R._g.doc.getElementById(attr);
                item && item.parentNode.removeChild(item);
            }
        }
    },
    dasharray = {
        "": [0],
        "none": [0],
        "-": [3, 1],
        ".": [1, 1],
        "-.": [3, 1, 1, 1],
        "-..": [3, 1, 1, 1, 1, 1],
        ". ": [1, 3],
        "- ": [4, 3],
        "--": [8, 3],
        "- .": [4, 3, 1, 3],
        "--.": [8, 3, 1, 3],
        "--..": [8, 3, 1, 3, 1, 3]
    },
    addDashes = function (o, value, params) {
        value = dasharray[Str(value).toLowerCase()];
        if (value) {
            var width = o.attrs["stroke-width"] || "1",
                butt = {round: width, square: width, butt: 0}[o.attrs["stroke-linecap"] || params["stroke-linecap"]] || 0,
                dashes = [],
                i = value.length;
            while (i--) {
                dashes[i] = value[i] * width + ((i % 2) ? 1 : -1) * butt;
            }
            $(o.node, {"stroke-dasharray": dashes.join(",")});
        }
    },
    setFillAndStroke = function (o, params) {
        var node = o.node,
            attrs = o.attrs,
            vis = node.style.visibility;
        node.style.visibility = "hidden";
        for (var att in params) {
            if (params[has](att)) {
                if (!R._availableAttrs[has](att)) {
                    continue;
                }
                var value = params[att];
                attrs[att] = value;
                switch (att) {
                    case "blur":
                        o.blur(value);
                        break;
                    case "title":
                        var title = node.getElementsByTagName("title");

                        // Use the existing <title>.
                        if (title.length && (title = title[0])) {
                          title.firstChild.nodeValue = value;
                        } else {
                          title = $("title");
                          var val = R._g.doc.createTextNode(value);
                          title.appendChild(val);
                          node.appendChild(title);
                        }
                        break;
                    case "href":
                    case "target":
                        var pn = node.parentNode;
                        if (pn.tagName.toLowerCase() != "a") {
                            var hl = $("a");
                            pn.insertBefore(hl, node);
                            hl.appendChild(node);
                            pn = hl;
                        }
                        if (att == "target") {
                            pn.setAttributeNS(xlink, "show", value == "blank" ? "new" : value);
                        } else {
                            pn.setAttributeNS(xlink, att, value);
                        }
                        break;
                    case "cursor":
                        node.style.cursor = value;
                        break;
                    case "transform":
                        o.transform(value);
                        break;
                    case "arrow-start":
                        addArrow(o, value);
                        break;
                    case "arrow-end":
                        addArrow(o, value, 1);
                        break;
                    case "clip-rect":
                        var rect = Str(value).split(separator);
                        if (rect.length == 4) {
                            o.clip && o.clip.parentNode.parentNode.removeChild(o.clip.parentNode);
                            var el = $("clipPath"),
                                rc = $("rect");
                            el.id = R.createUUID();
                            $(rc, {
                                x: rect[0],
                                y: rect[1],
                                width: rect[2],
                                height: rect[3]
                            });
                            el.appendChild(rc);
                            o.paper.defs.appendChild(el);
                            $(node, {"clip-path": "url(#" + el.id + ")"});
                            o.clip = rc;
                        }
                        if (!value) {
                            var path = node.getAttribute("clip-path");
                            if (path) {
                                var clip = R._g.doc.getElementById(path.replace(/(^url\(#|\)$)/g, E));
                                clip && clip.parentNode.removeChild(clip);
                                $(node, {"clip-path": E});
                                delete o.clip;
                            }
                        }
                    break;
                    case "path":
                        if (o.type == "path") {
                            $(node, {d: value ? attrs.path = R._pathToAbsolute(value) : "M0,0"});
                            o._.dirty = 1;
                            if (o._.arrows) {
                                "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                            }
                        }
                        break;
                    case "width":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fx) {
                            att = "x";
                            value = attrs.x;
                        } else {
                            break;
                        }
                    case "x":
                        if (attrs.fx) {
                            value = -attrs.x - (attrs.width || 0);
                        }
                    case "rx":
                        if (att == "rx" && o.type == "rect") {
                            break;
                        }
                    case "cx":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "height":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fy) {
                            att = "y";
                            value = attrs.y;
                        } else {
                            break;
                        }
                    case "y":
                        if (attrs.fy) {
                            value = -attrs.y - (attrs.height || 0);
                        }
                    case "ry":
                        if (att == "ry" && o.type == "rect") {
                            break;
                        }
                    case "cy":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "r":
                        if (o.type == "rect") {
                            $(node, {rx: value, ry: value});
                        } else {
                            node.setAttribute(att, value);
                        }
                        o._.dirty = 1;
                        break;
                    case "src":
                        if (o.type == "image") {
                            node.setAttributeNS(xlink, "href", value);
                        }
                        break;
                    case "stroke-width":
                        if (o._.sx != 1 || o._.sy != 1) {
                            value /= mmax(abs(o._.sx), abs(o._.sy)) || 1;
                        }
                        node.setAttribute(att, value);
                        if (attrs["stroke-dasharray"]) {
                            addDashes(o, attrs["stroke-dasharray"], params);
                        }
                        if (o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "stroke-dasharray":
                        addDashes(o, value, params);
                        break;
                    case "fill":
                        var isURL = Str(value).match(R._ISURL);
                        if (isURL) {
                            el = $("pattern");
                            var ig = $("image");
                            el.id = R.createUUID();
                            $(el, {x: 0, y: 0, patternUnits: "userSpaceOnUse", height: 1, width: 1});
                            $(ig, {x: 0, y: 0, "xlink:href": isURL[1]});
                            el.appendChild(ig);

                            (function (el) {
                                R._preload(isURL[1], function () {
                                    var w = this.offsetWidth,
                                        h = this.offsetHeight;
                                    $(el, {width: w, height: h});
                                    $(ig, {width: w, height: h});
                                    o.paper.safari();
                                });
                            })(el);
                            o.paper.defs.appendChild(el);
                            $(node, {fill: "url(#" + el.id + ")"});
                            o.pattern = el;
                            o.pattern && updatePosition(o);
                            break;
                        }
                        var clr = R.getRGB(value);
                        if (!clr.error) {
                            delete params.gradient;
                            delete attrs.gradient;
                            !R.is(attrs.opacity, "undefined") &&
                                R.is(params.opacity, "undefined") &&
                                $(node, {opacity: attrs.opacity});
                            !R.is(attrs["fill-opacity"], "undefined") &&
                                R.is(params["fill-opacity"], "undefined") &&
                                $(node, {"fill-opacity": attrs["fill-opacity"]});
                        } else if ((o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value)) {
                            if ("opacity" in attrs || "fill-opacity" in attrs) {
                                var gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                                if (gradient) {
                                    var stops = gradient.getElementsByTagName("stop");
                                    $(stops[stops.length - 1], {"stop-opacity": ("opacity" in attrs ? attrs.opacity : 1) * ("fill-opacity" in attrs ? attrs["fill-opacity"] : 1)});
                                }
                            }
                            attrs.gradient = value;
                            attrs.fill = "none";
                            break;
                        }
                        clr[has]("opacity") && $(node, {"fill-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                    case "stroke":
                        clr = R.getRGB(value);
                        node.setAttribute(att, clr.hex);
                        att == "stroke" && clr[has]("opacity") && $(node, {"stroke-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                        if (att == "stroke" && o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "gradient":
                        (o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value);
                        break;
                    case "opacity":
                        if (attrs.gradient && !attrs[has]("stroke-opacity")) {
                            $(node, {"stroke-opacity": value > 1 ? value / 100 : value});
                        }
                        // fall
                    case "fill-opacity":
                        if (attrs.gradient) {
                            gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                            if (gradient) {
                                stops = gradient.getElementsByTagName("stop");
                                $(stops[stops.length - 1], {"stop-opacity": value});
                            }
                            break;
                        }
                    default:
                        att == "font-size" && (value = toInt(value, 10) + "px");
                        var cssrule = att.replace(/(\-.)/g, function (w) {
                            return w.substring(1).toUpperCase();
                        });
                        node.style[cssrule] = value;
                        o._.dirty = 1;
                        node.setAttribute(att, value);
                        break;
                }
            }
        }

        tuneText(o, params);
        node.style.visibility = vis;
    },
    leading = 1.2,
    tuneText = function (el, params) {
        if (el.type != "text" || !(params[has]("text") || params[has]("font") || params[has]("font-size") || params[has]("x") || params[has]("y"))) {
            return;
        }
        var a = el.attrs,
            node = el.node,
            fontSize = node.firstChild ? toInt(R._g.doc.defaultView.getComputedStyle(node.firstChild, E).getPropertyValue("font-size"), 10) : 10;

        if (params[has]("text")) {
            a.text = params.text;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var texts = Str(params.text).split("\n"),
                tspans = [],
                tspan;
            for (var i = 0, ii = texts.length; i < ii; i++) {
                tspan = $("tspan");
                i && $(tspan, {dy: fontSize * leading, x: a.x});
                tspan.appendChild(R._g.doc.createTextNode(texts[i]));
                node.appendChild(tspan);
                tspans[i] = tspan;
            }
        } else {
            tspans = node.getElementsByTagName("tspan");
            for (i = 0, ii = tspans.length; i < ii; i++) if (i) {
                $(tspans[i], {dy: fontSize * leading, x: a.x});
            } else {
                $(tspans[0], {dy: 0});
            }
        }
        $(node, {x: a.x, y: a.y});
        el._.dirty = 1;
        var bb = el._getBBox(),
            dif = a.y - (bb.y + bb.height / 2);
        dif && R.is(dif, "finite") && $(tspans[0], {dy: dif});
    },
    getRealNode = function (node) {
        if (node.parentNode && node.parentNode.tagName.toLowerCase() === "a") {
            return node.parentNode;
        } else {
            return node;
        }
    },
    Element = function (node, svg) {
        var X = 0,
            Y = 0;
        /*\
         * Element.node
         [ property (object) ]
         **
         * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
         **
         * Note: Don’t mess with it.
         > Usage
         | // draw a circle at coordinate 10,10 with radius of 10
         | var c = paper.circle(10, 10, 10);
         | c.node.onclick = function () {
         |     c.attr("fill", "red");
         | };
        \*/
        this[0] = this.node = node;
        /*\
         * Element.raphael
         [ property (object) ]
         **
         * Internal reference to @Raphael object. In case it is not available.
         > Usage
         | Raphael.el.red = function () {
         |     var hsb = this.paper.raphael.rgb2hsb(this.attr("fill"));
         |     hsb.h = 1;
         |     this.attr({fill: this.paper.raphael.hsb2rgb(hsb).hex});
         | }
        \*/
        node.raphael = true;
        /*\
         * Element.id
         [ property (number) ]
         **
         * Unique id of the element. Especially useful when you want to listen to events of the element,
         * because all events are fired in format `<module>.<action>.<id>`. Also useful for @Paper.getById method.
        \*/
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.matrix = R.matrix();
        this.realPath = null;
        /*\
         * Element.paper
         [ property (object) ]
         **
         * Internal reference to “paper” where object drawn. Mainly for use in plugins and element extensions.
         > Usage
         | Raphael.el.cross = function () {
         |     this.attr({fill: "red"});
         |     this.paper.path("M10,10L50,50M50,10L10,50")
         |         .attr({stroke: "red"});
         | }
        \*/
        this.paper = svg;
        this.attrs = this.attrs || {};
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            deg: 0,
            dx: 0,
            dy: 0,
            dirty: 1
        };
        !svg.bottom && (svg.bottom = this);
        /*\
         * Element.prev
         [ property (object) ]
         **
         * Reference to the previous element in the hierarchy.
        \*/
        this.prev = svg.top;
        svg.top && (svg.top.next = this);
        svg.top = this;
        /*\
         * Element.next
         [ property (object) ]
         **
         * Reference to the next element in the hierarchy.
        \*/
        this.next = null;
    },
    elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;

    R._engine.path = function (pathString, SVG) {
        var el = $("path");
        SVG.canvas && SVG.canvas.appendChild(el);
        var p = new Element(el, SVG);
        p.type = "path";
        setFillAndStroke(p, {
            fill: "none",
            stroke: "#000",
            path: pathString
        });
        return p;
    };
    /*\
     * Element.rotate
     [ method ]
     **
     * Deprecated! Use @Element.transform instead.
     * Adds rotation by given angle around given point to the list of
     * transformations of the element.
     > Parameters
     - deg (number) angle in degrees
     - cx (number) #optional x coordinate of the centre of rotation
     - cy (number) #optional y coordinate of the centre of rotation
     * If cx & cy aren’t specified centre of the shape is used as a point of rotation.
     = (object) @Element
    \*/
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    /*\
     * Element.scale
     [ method ]
     **
     * Deprecated! Use @Element.transform instead.
     * Adds scale by given amount relative to given point to the list of
     * transformations of the element.
     > Parameters
     - sx (number) horisontal scale amount
     - sy (number) vertical scale amount
     - cx (number) #optional x coordinate of the centre of scale
     - cy (number) #optional y coordinate of the centre of scale
     * If cx & cy aren’t specified centre of the shape is used instead.
     = (object) @Element
    \*/
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        return this;
    };
    /*\
     * Element.translate
     [ method ]
     **
     * Deprecated! Use @Element.transform instead.
     * Adds translation by given amount to the list of transformations of the element.
     > Parameters
     - dx (number) horisontal shift
     - dy (number) vertical shift
     = (object) @Element
    \*/
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    /*\
     * Element.transform
     [ method ]
     **
     * Adds transformation to the element which is separate to other attributes,
     * i.e. translation doesn’t change `x` or `y` of the rectange. The format
     * of transformation string is similar to the path string syntax:
     | "t100,100r30,100,100s2,2,100,100r45s1.5"
     * Each letter is a command. There are four commands: `t` is for translate, `r` is for rotate, `s` is for
     * scale and `m` is for matrix.
     *
     * There are also alternative “absolute” translation, rotation and scale: `T`, `R` and `S`. They will not take previous transformation into account. For example, `...T100,0` will always move element 100 px horisontally, while `...t100,0` could move it vertically if there is `r90` before. Just compare results of `r90t100,0` and `r90T100,0`.
     *
     * So, the example line above could be read like “translate by 100, 100; rotate 30° around 100, 100; scale twice around 100, 100;
     * rotate 45° around centre; scale 1.5 times relative to centre”. As you can see rotate and scale commands have origin
     * coordinates as optional parameters, the default is the centre point of the element.
     * Matrix accepts six parameters.
     > Usage
     | var el = paper.rect(10, 20, 300, 200);
     | // translate 100, 100, rotate 45°, translate -100, 0
     | el.transform("t100,100r45t-100,0");
     | // if you want you can append or prepend transformations
     | el.transform("...t50,50");
     | el.transform("s2...");
     | // or even wrap
     | el.transform("t50,50...t-50-50");
     | // to reset transformation call method with empty string
     | el.transform("");
     | // to get current value call it without parameters
     | console.log(el.transform());
     > Parameters
     - tstr (string) #optional transformation string
     * If tstr isn’t specified
     = (string) current transformation string
     * else
     = (object) @Element
    \*/
    elproto.transform = function (tstr) {
        var _ = this._;
        if (tstr == null) {
            return _.transform;
        }
        R._extractTransform(this, tstr);

        this.clip && $(this.clip, {transform: this.matrix.invert()});
        this.pattern && updatePosition(this);
        this.node && $(this.node, {transform: this.matrix});

        if (_.sx != 1 || _.sy != 1) {
            var sw = this.attrs[has]("stroke-width") ? this.attrs["stroke-width"] : 1;
            this.attr({"stroke-width": sw});
        }

        return this;
    };
    /*\
     * Element.hide
     [ method ]
     **
     * Makes element invisible. See @Element.show.
     = (object) @Element
    \*/
    elproto.hide = function () {
        !this.removed && this.paper.safari(this.node.style.display = "none");
        return this;
    };
    /*\
     * Element.show
     [ method ]
     **
     * Makes element visible. See @Element.hide.
     = (object) @Element
    \*/
    elproto.show = function () {
        !this.removed && this.paper.safari(this.node.style.display = "");
        return this;
    };
    /*\
     * Element.remove
     [ method ]
     **
     * Removes element from the paper.
    \*/
    elproto.remove = function () {
        var node = getRealNode(this.node);
        if (this.removed || !node.parentNode) {
            return;
        }
        var paper = this.paper;
        paper.__set__ && paper.__set__.exclude(this);
        eve.unbind("raphael.*.*." + this.id);
        if (this.gradient) {
            paper.defs.removeChild(this.gradient);
        }
        R._tear(this, paper);

        node.parentNode.removeChild(node);

        // Remove custom data for element
        this.removeData();

        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto._getBBox = function () {
        if (this.node.style.display == "none") {
            this.show();
            var hide = true;
        }
        var canvasHidden = false,
            containerStyle;
        if (this.paper.canvas.parentElement) {
          containerStyle = this.paper.canvas.parentElement.style;
        } //IE10+ can't find parentElement
        else if (this.paper.canvas.parentNode) {
          containerStyle = this.paper.canvas.parentNode.style;
        }

        if(containerStyle && containerStyle.display == "none") {
          canvasHidden = true;
          containerStyle.display = "";
        }
        var bbox = {};
        try {
            bbox = this.node.getBBox();
        } catch(e) {
            // Firefox 3.0.x, 25.0.1 (probably more versions affected) play badly here - possible fix
            bbox = {
                x: this.node.clientLeft,
                y: this.node.clientTop,
                width: this.node.clientWidth,
                height: this.node.clientHeight
            }
        } finally {
            bbox = bbox || {};
            if(canvasHidden){
              containerStyle.display = "none";
            }
        }
        hide && this.hide();
        return bbox;
    };
    /*\
     * Element.attr
     [ method ]
     **
     * Sets the attributes of the element.
     > Parameters
     - attrName (string) attribute’s name
     - value (string) value
     * or
     - params (object) object of name/value pairs
     * or
     - attrName (string) attribute’s name
     * or
     - attrNames (array) in this case method returns array of current values for given attribute names
     = (object) @Element if attrsName & value or params are passed in.
     = (...) value of the attribute if only attrsName is passed in.
     = (array) array of values of the attribute if attrsNames is passed in.
     = (object) object of attributes if nothing is passed in.
     > Possible parameters
     # <p>Please refer to the <a href="http://www.w3.org/TR/SVG/" title="The W3C Recommendation for the SVG language describes these properties in detail.">SVG specification</a> for an explanation of these parameters.</p>
     o arrow-end (string) arrowhead on the end of the path. The format for string is `<type>[-<width>[-<length>]]`. Possible types: `classic`, `block`, `open`, `oval`, `diamond`, `none`, width: `wide`, `narrow`, `medium`, length: `long`, `short`, `midium`.
     o clip-rect (string) comma or space separated values: x, y, width and height
     o cursor (string) CSS type of the cursor
     o cx (number) the x-axis coordinate of the center of the circle, or ellipse
     o cy (number) the y-axis coordinate of the center of the circle, or ellipse
     o fill (string) colour, gradient or image
     o fill-opacity (number)
     o font (string)
     o font-family (string)
     o font-size (number) font size in pixels
     o font-weight (string)
     o height (number)
     o href (string) URL, if specified element behaves as hyperlink
     o opacity (number)
     o path (string) SVG path string format
     o r (number) radius of the circle, ellipse or rounded corner on the rect
     o rx (number) horisontal radius of the ellipse
     o ry (number) vertical radius of the ellipse
     o src (string) image URL, only works for @Element.image element
     o stroke (string) stroke colour
     o stroke-dasharray (string) [“”, “`-`”, “`.`”, “`-.`”, “`-..`”, “`. `”, “`- `”, “`--`”, “`- .`”, “`--.`”, “`--..`”]
     o stroke-linecap (string) [“`butt`”, “`square`”, “`round`”]
     o stroke-linejoin (string) [“`bevel`”, “`round`”, “`miter`”]
     o stroke-miterlimit (number)
     o stroke-opacity (number)
     o stroke-width (number) stroke width in pixels, default is '1'
     o target (string) used with href
     o text (string) contents of the text element. Use `\n` for multiline text
     o text-anchor (string) [“`start`”, “`middle`”, “`end`”], default is “`middle`”
     o title (string) will create tooltip with a given text
     o transform (string) see @Element.transform
     o width (number)
     o x (number)
     o y (number)
     > Gradients
     * Linear gradient format: “`‹angle›-‹colour›[-‹colour›[:‹offset›]]*-‹colour›`”, example: “`90-#fff-#000`” – 90°
     * gradient from white to black or “`0-#fff-#f00:20-#000`” – 0° gradient from white via red (at 20%) to black.
     *
     * radial gradient: “`r[(‹fx›, ‹fy›)]‹colour›[-‹colour›[:‹offset›]]*-‹colour›`”, example: “`r#fff-#000`” –
     * gradient from white to black or “`r(0.25, 0.75)#fff-#000`” – gradient from white to black with focus point
     * at 0.25, 0.75. Focus point coordinates are in 0..1 range. Radial gradients can only be applied to circles and ellipses.
     > Path String
     # <p>Please refer to <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path’s data attribute’s format are described in the SVG specification.">SVG documentation regarding path string</a>. Raphaël fully supports it.</p>
     > Colour Parsing
     # <ul>
     #     <li>Colour name (“<code>red</code>”, “<code>green</code>”, “<code>cornflowerblue</code>”, etc)</li>
     #     <li>#••• — shortened HTML colour: (“<code>#000</code>”, “<code>#fc0</code>”, etc)</li>
     #     <li>#•••••• — full length HTML colour: (“<code>#000000</code>”, “<code>#bd2300</code>”)</li>
     #     <li>rgb(•••, •••, •••) — red, green and blue channels’ values: (“<code>rgb(200,&nbsp;100,&nbsp;0)</code>”)</li>
     #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (“<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>”)</li>
     #     <li>rgba(•••, •••, •••, •••) — red, green and blue channels’ values: (“<code>rgba(200,&nbsp;100,&nbsp;0, .5)</code>”)</li>
     #     <li>rgba(•••%, •••%, •••%, •••%) — same as above, but in %: (“<code>rgba(100%,&nbsp;175%,&nbsp;0%, 50%)</code>”)</li>
     #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (“<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>”)</li>
     #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsba(•••, •••, •••, •••) — same as above, but with opacity</li>
     #     <li>hsl(•••, •••, •••) — almost the same as hsb, see <a href="http://en.wikipedia.org/wiki/HSL_and_HSV" title="HSL and HSV - Wikipedia, the free encyclopedia">Wikipedia page</a></li>
     #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsla(•••, •••, •••, •••) — same as above, but with opacity</li>
     #     <li>Optionally for hsb and hsl you could specify hue as a degree: “<code>hsl(240deg,&nbsp;1,&nbsp;.5)</code>” or, if you want to go fancy, “<code>hsl(240°,&nbsp;1,&nbsp;.5)</code>”</li>
     # </ul>
    \*/
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == "fill" && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            if (name == "transform") {
                return this._.transform;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        if (value != null) {
            var params = {};
            params[name] = value;
        } else if (name != null && R.is(name, "object")) {
            params = name;
        }
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
            var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
            this.attrs[key] = params[key];
            for (var subkey in par) if (par[has](subkey)) {
                params[subkey] = par[subkey];
            }
        }
        setFillAndStroke(this, params);
        return this;
    };
    /*\
     * Element.toFront
     [ method ]
     **
     * Moves the element so it is the closest to the viewer’s eyes, on top of other elements.
     = (object) @Element
    \*/
    elproto.toFront = function () {
        if (this.removed) {
            return this;
        }
        var node = getRealNode(this.node);
        node.parentNode.appendChild(node);
        var svg = this.paper;
        svg.top != this && R._tofront(this, svg);
        return this;
    };
    /*\
     * Element.toBack
     [ method ]
     **
     * Moves the element so it is the furthest from the viewer’s eyes, behind other elements.
     = (object) @Element
    \*/
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        var node = getRealNode(this.node);
        var parentNode = node.parentNode;
        parentNode.insertBefore(node, parentNode.firstChild);
        R._toback(this, this.paper);
        var svg = this.paper;
        return this;
    };
    /*\
     * Element.insertAfter
     [ method ]
     **
     * Inserts current object after the given one.
     = (object) @Element
    \*/
    elproto.insertAfter = function (element) {
        if (this.removed || !element) {
            return this;
        }

        var node = getRealNode(this.node);
        var afterNode = getRealNode(element.node || element[element.length - 1].node);
        if (afterNode.nextSibling) {
            afterNode.parentNode.insertBefore(node, afterNode.nextSibling);
        } else {
            afterNode.parentNode.appendChild(node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    /*\
     * Element.insertBefore
     [ method ]
     **
     * Inserts current object before the given one.
     = (object) @Element
    \*/
    elproto.insertBefore = function (element) {
        if (this.removed || !element) {
            return this;
        }

        var node = getRealNode(this.node);
        var beforeNode = getRealNode(element.node || element[0].node);
        beforeNode.parentNode.insertBefore(node, beforeNode);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        // Experimental. No Safari support. Use it on your own risk.
        var t = this;
        if (+size !== 0) {
            var fltr = $("filter"),
                blur = $("feGaussianBlur");
            t.attrs.blur = size;
            fltr.id = R.createUUID();
            $(blur, {stdDeviation: +size || 1.5});
            fltr.appendChild(blur);
            t.paper.defs.appendChild(fltr);
            t._blur = fltr;
            $(t.node, {filter: "url(#" + fltr.id + ")"});
        } else {
            if (t._blur) {
                t._blur.parentNode.removeChild(t._blur);
                delete t._blur;
                delete t.attrs.blur;
            }
            t.node.removeAttribute("filter");
        }
        return t;
    };
    R._engine.circle = function (svg, x, y, r) {
        var el = $("circle");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, r: r, fill: "none", stroke: "#000"};
        res.type = "circle";
        $(el, res.attrs);
        return res;
    };
    R._engine.rect = function (svg, x, y, w, h, r) {
        var el = $("rect");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, rx: r || 0, ry: r || 0, fill: "none", stroke: "#000"};
        res.type = "rect";
        $(el, res.attrs);
        return res;
    };
    R._engine.ellipse = function (svg, x, y, rx, ry) {
        var el = $("ellipse");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, rx: rx, ry: ry, fill: "none", stroke: "#000"};
        res.type = "ellipse";
        $(el, res.attrs);
        return res;
    };
    R._engine.image = function (svg, src, x, y, w, h) {
        var el = $("image");
        $(el, {x: x, y: y, width: w, height: h, preserveAspectRatio: "none"});
        el.setAttributeNS(xlink, "href", src);
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, src: src};
        res.type = "image";
        return res;
    };
    R._engine.text = function (svg, x, y, text) {
        var el = $("text");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {
            x: x,
            y: y,
            "text-anchor": "middle",
            text: text,
            "font-family": R._availableAttrs["font-family"],
            "font-size": R._availableAttrs["font-size"],
            stroke: "none",
            fill: "#000"
        };
        res.type = "text";
        setFillAndStroke(res, res.attrs);
        return res;
    };
    R._engine.setSize = function (width, height) {
        this.width = width || this.width;
        this.height = height || this.height;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        if (this._viewBox) {
            this.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con && con.container,
            x = con.x,
            y = con.y,
            width = con.width,
            height = con.height;
        if (!container) {
            throw new Error("SVG container not found.");
        }
        var cnvs = $("svg"),
            css = "overflow:hidden;",
            isFloating;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        $(cnvs, {
            height: height,
            version: 1.1,
            width: width,
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink"
        });
        if (container == 1) {
            cnvs.style.cssText = css + "position:absolute;left:" + x + "px;top:" + y + "px";
            R._g.doc.body.appendChild(cnvs);
            isFloating = 1;
        } else {
            cnvs.style.cssText = css + "position:relative";
            if (container.firstChild) {
                container.insertBefore(cnvs, container.firstChild);
            } else {
                container.appendChild(cnvs);
            }
        }
        container = new R._Paper;
        container.width = width;
        container.height = height;
        container.canvas = cnvs;
        container.clear();
        container._left = container._top = 0;
        isFloating && (container.renderfix = function () {});
        container.renderfix();
        return container;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var paperSize = this.getSize(),
            size = mmax(w / paperSize.width, h / paperSize.height),
            top = this.top,
            aspectRatio = fit ? "xMidYMid meet" : "xMinYMin",
            vb,
            sw;
        if (x == null) {
            if (this._vbSize) {
                size = 1;
            }
            delete this._vbSize;
            vb = "0 0 " + this.width + S + this.height;
        } else {
            this._vbSize = size;
            vb = x + S + y + S + w + S + h;
        }
        $(this.canvas, {
            viewBox: vb,
            preserveAspectRatio: aspectRatio
        });
        while (size && top) {
            sw = "stroke-width" in top.attrs ? top.attrs["stroke-width"] : 1;
            top.attr({"stroke-width": sw});
            top._.dirty = 1;
            top._.dirtyT = 1;
            top = top.prev;
        }
        this._viewBox = [x, y, w, h, !!fit];
        return this;
    };
    /*\
     * Paper.renderfix
     [ method ]
     **
     * Fixes the issue of Firefox and IE9 regarding subpixel rendering. If paper is dependant
     * on other elements after reflow it could shift half pixel which cause for lines to lost their crispness.
     * This method fixes the issue.
     **
       Special thanks to Mariusz Nowak (http://www.medikoo.com/) for this method.
    \*/
    R.prototype.renderfix = function () {
        var cnvs = this.canvas,
            s = cnvs.style,
            pos;
        try {
            pos = cnvs.getScreenCTM() || cnvs.createSVGMatrix();
        } catch (e) {
            pos = cnvs.createSVGMatrix();
        }
        var left = -pos.e % 1,
            top = -pos.f % 1;
        if (left || top) {
            if (left) {
                this._left = (this._left + left) % 1;
                s.left = this._left + "px";
            }
            if (top) {
                this._top = (this._top + top) % 1;
                s.top = this._top + "px";
            }
        }
    };
    /*\
     * Paper.clear
     [ method ]
     **
     * Clears the paper, i.e. removes all the elements.
    \*/
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        var c = this.canvas;
        while (c.firstChild) {
            c.removeChild(c.firstChild);
        }
        this.bottom = this.top = null;
        (this.desc = $("desc")).appendChild(R._g.doc.createTextNode("Created with Rapha\xebl " + R.version));
        c.appendChild(this.desc);
        c.appendChild(this.defs = $("defs"));
    };
    /*\
     * Paper.remove
     [ method ]
     **
     * Removes the paper from the DOM.
    \*/
    R.prototype.remove = function () {
        eve("raphael.remove", this);
        this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
    };
    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
})();

// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ VML Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\

(function(){
    if (!R.vml) {
        return;
    }
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        math = Math,
        round = math.round,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        fillString = "fill",
        separator = /[, ]+/,
        eve = R.eve,
        ms = " progid:DXImageTransform.Microsoft",
        S = " ",
        E = "",
        map = {M: "m", L: "l", C: "c", Z: "x", m: "t", l: "r", c: "v", z: "x"},
        bites = /([clmz]),?([^clmz]*)/gi,
        blurregexp = / progid:\S+Blur\([^\)]+\)/g,
        val = /-?[^,\s-]+/g,
        cssDot = "position:absolute;left:0;top:0;width:1px;height:1px;behavior:url(#default#VML)",
        zoom = 21600,
        pathTypes = {path: 1, rect: 1, image: 1},
        ovalTypes = {circle: 1, ellipse: 1},
        path2vml = function (path) {
            var total =  /[ahqstv]/ig,
                command = R._pathToAbsolute;
            Str(path).match(total) && (command = R._path2curve);
            total = /[clmz]/g;
            if (command == R._pathToAbsolute && !Str(path).match(total)) {
                var res = Str(path).replace(bites, function (all, command, args) {
                    var vals = [],
                        isMove = command.toLowerCase() == "m",
                        res = map[command];
                    args.replace(val, function (value) {
                        if (isMove && vals.length == 2) {
                            res += vals + map[command == "m" ? "l" : "L"];
                            vals = [];
                        }
                        vals.push(round(value * zoom));
                    });
                    return res + vals;
                });
                return res;
            }
            var pa = command(path), p, r;
            res = [];
            for (var i = 0, ii = pa.length; i < ii; i++) {
                p = pa[i];
                r = pa[i][0].toLowerCase();
                r == "z" && (r = "x");
                for (var j = 1, jj = p.length; j < jj; j++) {
                    r += round(p[j] * zoom) + (j != jj - 1 ? "," : E);
                }
                res.push(r);
            }
            return res.join(S);
        },
        compensation = function (deg, dx, dy) {
            var m = R.matrix();
            m.rotate(-deg, .5, .5);
            return {
                dx: m.x(dx, dy),
                dy: m.y(dx, dy)
            };
        },
        setCoords = function (p, sx, sy, dx, dy, deg) {
            var _ = p._,
                m = p.matrix,
                fillpos = _.fillpos,
                o = p.node,
                s = o.style,
                y = 1,
                flip = "",
                dxdy,
                kx = zoom / sx,
                ky = zoom / sy;
            s.visibility = "hidden";
            if (!sx || !sy) {
                return;
            }
            o.coordsize = abs(kx) + S + abs(ky);
            s.rotation = deg * (sx * sy < 0 ? -1 : 1);
            if (deg) {
                var c = compensation(deg, dx, dy);
                dx = c.dx;
                dy = c.dy;
            }
            sx < 0 && (flip += "x");
            sy < 0 && (flip += " y") && (y = -1);
            s.flip = flip;
            o.coordorigin = (dx * -kx) + S + (dy * -ky);
            if (fillpos || _.fillsize) {
                var fill = o.getElementsByTagName(fillString);
                fill = fill && fill[0];
                o.removeChild(fill);
                if (fillpos) {
                    c = compensation(deg, m.x(fillpos[0], fillpos[1]), m.y(fillpos[0], fillpos[1]));
                    fill.position = c.dx * y + S + c.dy * y;
                }
                if (_.fillsize) {
                    fill.size = _.fillsize[0] * abs(sx) + S + _.fillsize[1] * abs(sy);
                }
                o.appendChild(fill);
            }
            s.visibility = "visible";
        };
    R.toString = function () {
        return  "Your browser doesn\u2019t support SVG. Falling down to VML.\nYou are running Rapha\xebl " + this.version;
    };
    var addArrow = function (o, value, isEnd) {
        var values = Str(value).toLowerCase().split("-"),
            se = isEnd ? "end" : "start",
            i = values.length,
            type = "classic",
            w = "medium",
            h = "medium";
        while (i--) {
            switch (values[i]) {
                case "block":
                case "classic":
                case "oval":
                case "diamond":
                case "open":
                case "none":
                    type = values[i];
                    break;
                case "wide":
                case "narrow": h = values[i]; break;
                case "long":
                case "short": w = values[i]; break;
            }
        }
        var stroke = o.node.getElementsByTagName("stroke")[0];
        stroke[se + "arrow"] = type;
        stroke[se + "arrowlength"] = w;
        stroke[se + "arrowwidth"] = h;
    },
    setFillAndStroke = function (o, params) {
        // o.paper.canvas.style.display = "none";
        o.attrs = o.attrs || {};
        var node = o.node,
            a = o.attrs,
            s = node.style,
            xy,
            newpath = pathTypes[o.type] && (params.x != a.x || params.y != a.y || params.width != a.width || params.height != a.height || params.cx != a.cx || params.cy != a.cy || params.rx != a.rx || params.ry != a.ry || params.r != a.r),
            isOval = ovalTypes[o.type] && (a.cx != params.cx || a.cy != params.cy || a.r != params.r || a.rx != params.rx || a.ry != params.ry),
            res = o;


        for (var par in params) if (params[has](par)) {
            a[par] = params[par];
        }
        if (newpath) {
            a.path = R._getPath[o.type](o);
            o._.dirty = 1;
        }
        params.href && (node.href = params.href);
        params.title && (node.title = params.title);
        params.target && (node.target = params.target);
        params.cursor && (s.cursor = params.cursor);
        "blur" in params && o.blur(params.blur);
        if (params.path && o.type == "path" || newpath) {
            node.path = path2vml(~Str(a.path).toLowerCase().indexOf("r") ? R._pathToAbsolute(a.path) : a.path);
            o._.dirty = 1;
            if (o.type == "image") {
                o._.fillpos = [a.x, a.y];
                o._.fillsize = [a.width, a.height];
                setCoords(o, 1, 1, 0, 0, 0);
            }
        }
        "transform" in params && o.transform(params.transform);
        if (isOval) {
            var cx = +a.cx,
                cy = +a.cy,
                rx = +a.rx || +a.r || 0,
                ry = +a.ry || +a.r || 0;
            node.path = R.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x", round((cx - rx) * zoom), round((cy - ry) * zoom), round((cx + rx) * zoom), round((cy + ry) * zoom), round(cx * zoom));
            o._.dirty = 1;
        }
        if ("clip-rect" in params) {
            var rect = Str(params["clip-rect"]).split(separator);
            if (rect.length == 4) {
                rect[2] = +rect[2] + (+rect[0]);
                rect[3] = +rect[3] + (+rect[1]);
                var div = node.clipRect || R._g.doc.createElement("div"),
                    dstyle = div.style;
                dstyle.clip = R.format("rect({1}px {2}px {3}px {0}px)", rect);
                if (!node.clipRect) {
                    dstyle.position = "absolute";
                    dstyle.top = 0;
                    dstyle.left = 0;
                    dstyle.width = o.paper.width + "px";
                    dstyle.height = o.paper.height + "px";
                    node.parentNode.insertBefore(div, node);
                    div.appendChild(node);
                    node.clipRect = div;
                }
            }
            if (!params["clip-rect"]) {
                node.clipRect && (node.clipRect.style.clip = "auto");
            }
        }
        if (o.textpath) {
            var textpathStyle = o.textpath.style;
            params.font && (textpathStyle.font = params.font);
            params["font-family"] && (textpathStyle.fontFamily = '"' + params["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g, E) + '"');
            params["font-size"] && (textpathStyle.fontSize = params["font-size"]);
            params["font-weight"] && (textpathStyle.fontWeight = params["font-weight"]);
            params["font-style"] && (textpathStyle.fontStyle = params["font-style"]);
        }
        if ("arrow-start" in params) {
            addArrow(res, params["arrow-start"]);
        }
        if ("arrow-end" in params) {
            addArrow(res, params["arrow-end"], 1);
        }
        if (params.opacity != null || 
            params["stroke-width"] != null ||
            params.fill != null ||
            params.src != null ||
            params.stroke != null ||
            params["stroke-width"] != null ||
            params["stroke-opacity"] != null ||
            params["fill-opacity"] != null ||
            params["stroke-dasharray"] != null ||
            params["stroke-miterlimit"] != null ||
            params["stroke-linejoin"] != null ||
            params["stroke-linecap"] != null) {
            var fill = node.getElementsByTagName(fillString),
                newfill = false;
            fill = fill && fill[0];
            !fill && (newfill = fill = createNode(fillString));
            if (o.type == "image" && params.src) {
                fill.src = params.src;
            }
            params.fill && (fill.on = true);
            if (fill.on == null || params.fill == "none" || params.fill === null) {
                fill.on = false;
            }
            if (fill.on && params.fill) {
                var isURL = Str(params.fill).match(R._ISURL);
                if (isURL) {
                    fill.parentNode == node && node.removeChild(fill);
                    fill.rotate = true;
                    fill.src = isURL[1];
                    fill.type = "tile";
                    var bbox = o.getBBox(1);
                    fill.position = bbox.x + S + bbox.y;
                    o._.fillpos = [bbox.x, bbox.y];

                    R._preload(isURL[1], function () {
                        o._.fillsize = [this.offsetWidth, this.offsetHeight];
                    });
                } else {
                    fill.color = R.getRGB(params.fill).hex;
                    fill.src = E;
                    fill.type = "solid";
                    if (R.getRGB(params.fill).error && (res.type in {circle: 1, ellipse: 1} || Str(params.fill).charAt() != "r") && addGradientFill(res, params.fill, fill)) {
                        a.fill = "none";
                        a.gradient = params.fill;
                        fill.rotate = false;
                    }
                }
            }
            if ("fill-opacity" in params || "opacity" in params) {
                var opacity = ((+a["fill-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+R.getRGB(params.fill).o + 1 || 2) - 1);
                opacity = mmin(mmax(opacity, 0), 1);
                fill.opacity = opacity;
                if (fill.src) {
                    fill.color = "none";
                }
            }
            node.appendChild(fill);
            var stroke = (node.getElementsByTagName("stroke") && node.getElementsByTagName("stroke")[0]),
            newstroke = false;
            !stroke && (newstroke = stroke = createNode("stroke"));
            if ((params.stroke && params.stroke != "none") ||
                params["stroke-width"] ||
                params["stroke-opacity"] != null ||
                params["stroke-dasharray"] ||
                params["stroke-miterlimit"] ||
                params["stroke-linejoin"] ||
                params["stroke-linecap"]) {
                stroke.on = true;
            }
            (params.stroke == "none" || params.stroke === null || stroke.on == null || params.stroke == 0 || params["stroke-width"] == 0) && (stroke.on = false);
            var strokeColor = R.getRGB(params.stroke);
            stroke.on && params.stroke && (stroke.color = strokeColor.hex);
            opacity = ((+a["stroke-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+strokeColor.o + 1 || 2) - 1);
            var width = (toFloat(params["stroke-width"]) || 1) * .75;
            opacity = mmin(mmax(opacity, 0), 1);
            params["stroke-width"] == null && (width = a["stroke-width"]);
            params["stroke-width"] && (stroke.weight = width);
            width && width < 1 && (opacity *= width) && (stroke.weight = 1);
            stroke.opacity = opacity;
        
            params["stroke-linejoin"] && (stroke.joinstyle = params["stroke-linejoin"] || "miter");
            stroke.miterlimit = params["stroke-miterlimit"] || 8;
            params["stroke-linecap"] && (stroke.endcap = params["stroke-linecap"] == "butt" ? "flat" : params["stroke-linecap"] == "square" ? "square" : "round");
            if ("stroke-dasharray" in params) {
                var dasharray = {
                    "-": "shortdash",
                    ".": "shortdot",
                    "-.": "shortdashdot",
                    "-..": "shortdashdotdot",
                    ". ": "dot",
                    "- ": "dash",
                    "--": "longdash",
                    "- .": "dashdot",
                    "--.": "longdashdot",
                    "--..": "longdashdotdot"
                };
                stroke.dashstyle = dasharray[has](params["stroke-dasharray"]) ? dasharray[params["stroke-dasharray"]] : E;
            }
            newstroke && node.appendChild(stroke);
        }
        if (res.type == "text") {
            res.paper.canvas.style.display = E;
            var span = res.paper.span,
                m = 100,
                fontSize = a.font && a.font.match(/\d+(?:\.\d*)?(?=px)/);
            s = span.style;
            a.font && (s.font = a.font);
            a["font-family"] && (s.fontFamily = a["font-family"]);
            a["font-weight"] && (s.fontWeight = a["font-weight"]);
            a["font-style"] && (s.fontStyle = a["font-style"]);
            fontSize = toFloat(a["font-size"] || fontSize && fontSize[0]) || 10;
            s.fontSize = fontSize * m + "px";
            res.textpath.string && (span.innerHTML = Str(res.textpath.string).replace(/</g, "&#60;").replace(/&/g, "&#38;").replace(/\n/g, "<br>"));
            var brect = span.getBoundingClientRect();
            res.W = a.w = (brect.right - brect.left) / m;
            res.H = a.h = (brect.bottom - brect.top) / m;
            // res.paper.canvas.style.display = "none";
            res.X = a.x;
            res.Y = a.y + res.H / 2;

            ("x" in params || "y" in params) && (res.path.v = R.format("m{0},{1}l{2},{1}", round(a.x * zoom), round(a.y * zoom), round(a.x * zoom) + 1));
            var dirtyattrs = ["x", "y", "text", "font", "font-family", "font-weight", "font-style", "font-size"];
            for (var d = 0, dd = dirtyattrs.length; d < dd; d++) if (dirtyattrs[d] in params) {
                res._.dirty = 1;
                break;
            }
        
            // text-anchor emulation
            switch (a["text-anchor"]) {
                case "start":
                    res.textpath.style["v-text-align"] = "left";
                    res.bbx = res.W / 2;
                break;
                case "end":
                    res.textpath.style["v-text-align"] = "right";
                    res.bbx = -res.W / 2;
                break;
                default:
                    res.textpath.style["v-text-align"] = "center";
                    res.bbx = 0;
                break;
            }
            res.textpath.style["v-text-kern"] = true;
        }
        // res.paper.canvas.style.display = E;
    },
    addGradientFill = function (o, gradient, fill) {
        o.attrs = o.attrs || {};
        var attrs = o.attrs,
            pow = Math.pow,
            opacity,
            oindex,
            type = "linear",
            fxfy = ".5 .5";
        o.attrs.gradient = gradient;
        gradient = Str(gradient).replace(R._radial_gradient, function (all, fx, fy) {
            type = "radial";
            if (fx && fy) {
                fx = toFloat(fx);
                fy = toFloat(fy);
                pow(fx - .5, 2) + pow(fy - .5, 2) > .25 && (fy = math.sqrt(.25 - pow(fx - .5, 2)) * ((fy > .5) * 2 - 1) + .5);
                fxfy = fx + S + fy;
            }
            return E;
        });
        gradient = gradient.split(/\s*\-\s*/);
        if (type == "linear") {
            var angle = gradient.shift();
            angle = -toFloat(angle);
            if (isNaN(angle)) {
                return null;
            }
        }
        var dots = R._parseDots(gradient);
        if (!dots) {
            return null;
        }
        o = o.shape || o.node;
        if (dots.length) {
            o.removeChild(fill);
            fill.on = true;
            fill.method = "none";
            fill.color = dots[0].color;
            fill.color2 = dots[dots.length - 1].color;
            var clrs = [];
            for (var i = 0, ii = dots.length; i < ii; i++) {
                dots[i].offset && clrs.push(dots[i].offset + S + dots[i].color);
            }
            fill.colors = clrs.length ? clrs.join() : "0% " + fill.color;
            if (type == "radial") {
                fill.type = "gradientTitle";
                fill.focus = "100%";
                fill.focussize = "0 0";
                fill.focusposition = fxfy;
                fill.angle = 0;
            } else {
                // fill.rotate= true;
                fill.type = "gradient";
                fill.angle = (270 - angle) % 360;
            }
            o.appendChild(fill);
        }
        return 1;
    },
    Element = function (node, vml) {
        this[0] = this.node = node;
        node.raphael = true;
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.X = 0;
        this.Y = 0;
        this.attrs = {};
        this.paper = vml;
        this.matrix = R.matrix();
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            dx: 0,
            dy: 0,
            deg: 0,
            dirty: 1,
            dirtyT: 1
        };
        !vml.bottom && (vml.bottom = this);
        this.prev = vml.top;
        vml.top && (vml.top.next = this);
        vml.top = this;
        this.next = null;
    };
    var elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;
    elproto.transform = function (tstr) {
        if (tstr == null) {
            return this._.transform;
        }
        var vbs = this.paper._viewBoxShift,
            vbt = vbs ? "s" + [vbs.scale, vbs.scale] + "-1-1t" + [vbs.dx, vbs.dy] : E,
            oldt;
        if (vbs) {
            oldt = tstr = Str(tstr).replace(/\.{3}|\u2026/g, this._.transform || E);
        }
        R._extractTransform(this, vbt + tstr);
        var matrix = this.matrix.clone(),
            skew = this.skew,
            o = this.node,
            split,
            isGrad = ~Str(this.attrs.fill).indexOf("-"),
            isPatt = !Str(this.attrs.fill).indexOf("url(");
        matrix.translate(1, 1);
        if (isPatt || isGrad || this.type == "image") {
            skew.matrix = "1 0 0 1";
            skew.offset = "0 0";
            split = matrix.split();
            if ((isGrad && split.noRotation) || !split.isSimple) {
                o.style.filter = matrix.toFilter();
                var bb = this.getBBox(),
                    bbt = this.getBBox(1),
                    dx = bb.x - bbt.x,
                    dy = bb.y - bbt.y;
                o.coordorigin = (dx * -zoom) + S + (dy * -zoom);
                setCoords(this, 1, 1, dx, dy, 0);
            } else {
                o.style.filter = E;
                setCoords(this, split.scalex, split.scaley, split.dx, split.dy, split.rotate);
            }
        } else {
            o.style.filter = E;
            skew.matrix = Str(matrix);
            skew.offset = matrix.offset();
        }
        if (oldt !== null) { // empty string value is true as well
            this._.transform = oldt;
            R._extractTransform(this, oldt);
        }
        return this;
    };
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        if (deg == null) {
            return;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this._.dirtyT = 1;
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        if (this._.bbox) {
            this._.bbox.x += dx;
            this._.bbox.y += dy;
        }
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
            isNaN(cx) && (cx = null);
            isNaN(cy) && (cy = null);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
    
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        this._.dirtyT = 1;
        return this;
    };
    elproto.hide = function () {
        !this.removed && (this.node.style.display = "none");
        return this;
    };
    elproto.show = function () {
        !this.removed && (this.node.style.display = E);
        return this;
    };
    // Needed to fix the vml setViewBox issues
    elproto.auxGetBBox = R.el.getBBox;
    elproto.getBBox = function(){
      var b = this.auxGetBBox();
      if (this.paper && this.paper._viewBoxShift)
      {
        var c = {};
        var z = 1/this.paper._viewBoxShift.scale;
        c.x = b.x - this.paper._viewBoxShift.dx;
        c.x *= z;
        c.y = b.y - this.paper._viewBoxShift.dy;
        c.y *= z;
        c.width  = b.width  * z;
        c.height = b.height * z;
        c.x2 = c.x + c.width;
        c.y2 = c.y + c.height;
        return c;
      }
      return b;
    };
    elproto._getBBox = function () {
        if (this.removed) {
            return {};
        }
        return {
            x: this.X + (this.bbx || 0) - this.W / 2,
            y: this.Y - this.H,
            width: this.W,
            height: this.H
        };
    };
    elproto.remove = function () {
        if (this.removed || !this.node.parentNode) {
            return;
        }
        this.paper.__set__ && this.paper.__set__.exclude(this);
        R.eve.unbind("raphael.*.*." + this.id);
        R._tear(this, this.paper);
        this.node.parentNode.removeChild(this.node);
        this.shape && this.shape.parentNode.removeChild(this.shape);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == fillString && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (this.attrs && value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        var params;
        if (value != null) {
            params = {};
            params[name] = value;
        }
        value == null && R.is(name, "object") && (params = name);
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        if (params) {
            for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
                var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
                this.attrs[key] = params[key];
                for (var subkey in par) if (par[has](subkey)) {
                    params[subkey] = par[subkey];
                }
            }
            // this.paper.canvas.style.display = "none";
            if (params.text && this.type == "text") {
                this.textpath.string = params.text;
            }
            setFillAndStroke(this, params);
            // this.paper.canvas.style.display = E;
        }
        return this;
    };
    elproto.toFront = function () {
        !this.removed && this.node.parentNode.appendChild(this.node);
        this.paper && this.paper.top != this && R._tofront(this, this.paper);
        return this;
    };
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        if (this.node.parentNode.firstChild != this.node) {
            this.node.parentNode.insertBefore(this.node, this.node.parentNode.firstChild);
            R._toback(this, this.paper);
        }
        return this;
    };
    elproto.insertAfter = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[element.length - 1];
        }
        if (element.node.nextSibling) {
            element.node.parentNode.insertBefore(this.node, element.node.nextSibling);
        } else {
            element.node.parentNode.appendChild(this.node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    elproto.insertBefore = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[0];
        }
        element.node.parentNode.insertBefore(this.node, element.node);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        var s = this.node.runtimeStyle,
            f = s.filter;
        f = f.replace(blurregexp, E);
        if (+size !== 0) {
            this.attrs.blur = size;
            s.filter = f + S + ms + ".Blur(pixelradius=" + (+size || 1.5) + ")";
            s.margin = R.format("-{0}px 0 0 -{0}px", round(+size || 1.5));
        } else {
            s.filter = f;
            s.margin = 0;
            delete this.attrs.blur;
        }
        return this;
    };

    R._engine.path = function (pathString, vml) {
        var el = createNode("shape");
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = vml.coordorigin;
        var p = new Element(el, vml),
            attr = {fill: "none", stroke: "#000"};
        pathString && (attr.path = pathString);
        p.type = "path";
        p.path = [];
        p.Path = E;
        setFillAndStroke(p, attr);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.rect = function (vml, x, y, w, h, r) {
        var path = R._rectPath(x, y, w, h, r),
            res = vml.path(path),
            a = res.attrs;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.r = r;
        a.path = path;
        res.type = "rect";
        return res;
    };
    R._engine.ellipse = function (vml, x, y, rx, ry) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - rx;
        res.Y = y - ry;
        res.W = rx * 2;
        res.H = ry * 2;
        res.type = "ellipse";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            rx: rx,
            ry: ry
        });
        return res;
    };
    R._engine.circle = function (vml, x, y, r) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - r;
        res.Y = y - r;
        res.W = res.H = r * 2;
        res.type = "circle";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            r: r
        });
        return res;
    };
    R._engine.image = function (vml, src, x, y, w, h) {
        var path = R._rectPath(x, y, w, h),
            res = vml.path(path).attr({stroke: "none"}),
            a = res.attrs,
            node = res.node,
            fill = node.getElementsByTagName(fillString)[0];
        a.src = src;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.path = path;
        res.type = "image";
        fill.parentNode == node && node.removeChild(fill);
        fill.rotate = true;
        fill.src = src;
        fill.type = "tile";
        res._.fillpos = [x, y];
        res._.fillsize = [w, h];
        node.appendChild(fill);
        setCoords(res, 1, 1, 0, 0, 0);
        return res;
    };
    R._engine.text = function (vml, x, y, text) {
        var el = createNode("shape"),
            path = createNode("path"),
            o = createNode("textpath");
        x = x || 0;
        y = y || 0;
        text = text || "";
        path.v = R.format("m{0},{1}l{2},{1}", round(x * zoom), round(y * zoom), round(x * zoom) + 1);
        path.textpathok = true;
        o.string = Str(text);
        o.on = true;
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = "0 0";
        var p = new Element(el, vml),
            attr = {
                fill: "#000",
                stroke: "none",
                font: R._availableAttrs.font,
                text: text
            };
        p.shape = el;
        p.path = path;
        p.textpath = o;
        p.type = "text";
        p.attrs.text = Str(text);
        p.attrs.x = x;
        p.attrs.y = y;
        p.attrs.w = 1;
        p.attrs.h = 1;
        setFillAndStroke(p, attr);
        el.appendChild(o);
        el.appendChild(path);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.setSize = function (width, height) {
        var cs = this.canvas.style;
        this.width = width;
        this.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        cs.width = width;
        cs.height = height;
        cs.clip = "rect(0 " + width + " " + height + " 0)";
        if (this._viewBox) {
            R._engine.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        R.eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var paperSize = this.getSize(),
            width = paperSize.width,
            height = paperSize.height,
            H, W;
        if (fit) {
            H = height / h;
            W = width / w;
            if (w * H < width) {
                x -= (width - w * H) / 2 / H;
            }
            if (h * W < height) {
                y -= (height - h * W) / 2 / W;
            }
        }
        this._viewBox = [x, y, w, h, !!fit];
        this._viewBoxShift = {
            dx: -x,
            dy: -y,
            scale: paperSize
        };
        this.forEach(function (el) {
            el.transform("...");
        });
        return this;
    };
    var createNode;
    R._engine.initWin = function (win) {
            var doc = win.document;
            if (doc.styleSheets.length < 31) {
                doc.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
            } else {
                // no more room, add to the existing one
                // http://msdn.microsoft.com/en-us/library/ms531194%28VS.85%29.aspx
                doc.styleSheets[0].addRule(".rvml", "behavior:url(#default#VML)");
            }
            try {
                !doc.namespaces.rvml && doc.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
                createNode = function (tagName) {
                    return doc.createElement('<rvml:' + tagName + ' class="rvml">');
                };
            } catch (e) {
                createNode = function (tagName) {
                    return doc.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
                };
            }
        };
    R._engine.initWin(R._g.win);
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con.container,
            height = con.height,
            s,
            width = con.width,
            x = con.x,
            y = con.y;
        if (!container) {
            throw new Error("VML container not found.");
        }
        var res = new R._Paper,
            c = res.canvas = R._g.doc.createElement("div"),
            cs = c.style;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        res.width = width;
        res.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        res.coordsize = zoom * 1e3 + S + zoom * 1e3;
        res.coordorigin = "0 0";
        res.span = R._g.doc.createElement("span");
        res.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;";
        c.appendChild(res.span);
        cs.cssText = R.format("top:0;left:0;width:{0};height:{1};display:inline-block;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden", width, height);
        if (container == 1) {
            R._g.doc.body.appendChild(c);
            cs.left = x + "px";
            cs.top = y + "px";
            cs.position = "absolute";
        } else {
            if (container.firstChild) {
                container.insertBefore(c, container.firstChild);
            } else {
                container.appendChild(c);
            }
        }
        res.renderfix = function () {};
        return res;
    };
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        this.canvas.innerHTML = E;
        this.span = R._g.doc.createElement("span");
        this.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;";
        this.canvas.appendChild(this.span);
        this.bottom = this.top = null;
    };
    R.prototype.remove = function () {
        R.eve("raphael.remove", this);
        this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        return true;
    };

    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
})();

    // EXPOSE
    // SVG and VML are appended just before the EXPOSE line
    // Even with AMD, Raphael should be defined globally
    oldRaphael.was ? (g.win.Raphael = R) : (Raphael = R);

    if(typeof exports == "object"){
        module.exports = R;
    }
    return R;
}));

},{"eve":1}],3:[function(require,module,exports){
Polymer({
  is: 'text-flow-line',
  properties: {
    indent: {
      type: Number,
      value: 0
    }
  },
  ready: function() {},
  getOffsetRect: function() {
    return this.getContentChildren().map(function(child) {
      return child.getOffsetRect();
    }).reduce(function(dimensions, offsets) {
      return {
        width: dimensions.width + offsets.width,
        height: Math.max(offsets.height, dimensions.height),
        left: dimensions.left,
        top: dimensions.top
      };
    });
  },
  _tabStyle: function(indent) {
    return ("width: " + (20 * indent) + "px;") + "display: inline-block;";
  }
});


},{}],4:[function(require,module,exports){
Polymer({
  is: 'text-flow-piece',
  properties: {
    nodeId: {
      type: String,
      value: ''
    }
  },
  listeners: {
    'up': '_onUp'
  },
  getOffsetRect: function() {
    return {
      width: this.offsetWidth,
      height: this.offsetHeight,
      left: this.offsetLeft,
      top: this.offsetTop
    };
  },
  _onUp: function() {
    return this.fire('select', {
      nodeId: this.nodeId
    });
  }
});


},{}],5:[function(require,module,exports){
var Raphael;

Raphael = require('raphael');

require('text-flow-line');

require('text-flow-piece');

Polymer({
  is: 'text-flow',
  ready: function() {
    this._paper = Raphael(this.$.canvas, this.$.body.offsetWidth, this.$.body.offsetHeight);
    this._shapes = {};
    return this._shapes.highlights = {};
  },
  attached: function() {
    return this.async((function(_this) {
      return function() {
        return _this._paper.setSize(_this.$.body.offsetWidth, _this.$.body.offsetHeight);
      };
    })(this));
  },
  updateChildren: function() {
    return this.attached();
  },
  getPiecesForNode: function(nodeId) {
    return this.getContentChildren().map(function(elm) {
      return Array.prototype.slice.call(elm.querySelectorAll('text-flow-piece'));
    }).reduce(function(acc, elm) {
      return acc.concat(elm);
    }).filter(function(pc) {
      return pc.nodeId.split(/\s/).filter(function(id) {
        return id === nodeId;
      }).length > 0;
    });
  },
  highlightNode: function(nodeId, attrs) {
    var rects;
    rects = (this.getPiecesForNode(nodeId)).map(function(pc) {
      return pc.getOffsetRect();
    });
    this._shapes.highlights[nodeId] = this._drawRects(this._paper, attrs, rects);
    return (function(_this) {
      return function() {
        return _this._shapes.highlights[nodeId].forEach(function(shape) {
          return shape.remove();
        });
      };
    })(this);
  },
  drawBackground: function() {
    var attrs, rects;
    if (this._shapes.background != null) {
      this._shapes.background.forEach(function(shape) {
        return shape.remove();
      });
    }
    attrs = {
      fill: '#fcc',
      stroke: 'none',
      borderRadius: 4
    };
    rects = this.getContentChildren().map(function(child) {
      return child.getOffsetRect();
    });
    return this._drawRects(this._paper, attrs, rects);
  },
  _drawRects: function(paper, attrs, rects) {
    return rects.map(function(rect) {
      var attr, borderRadius, elm, val;
      borderRadius = attrs.borderRadius != null ? attrs.borderRadius : 0;
      elm = paper.rect(rect.left, rect.top, rect.width, rect.height, borderRadius);
      for (attr in attrs) {
        val = attrs[attr];
        elm.attr(attr, val);
      }
      return elm;
    });
  }
});


},{"raphael":2,"text-flow-line":3,"text-flow-piece":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvcmFwaGFlbC9ub2RlX21vZHVsZXMvZXZlL2V2ZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9yYXBoYWVsL3JhcGhhZWwuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy90ZXh0LWZsb3ctbGluZS5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy90ZXh0LWZsb3ctcGllY2UuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL3RleHQtZmxvdy9zcmMvdGV4dC1mbG93LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvaVFBLE9BQUEsQ0FDRTtFQUFBLEVBQUEsRUFBSSxnQkFBSjtFQUVBLFVBQUEsRUFDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxNQUFOO01BQ0EsS0FBQSxFQUFPLENBRFA7S0FERjtHQUhGO0VBT0EsS0FBQSxFQUFPLFNBQUEsR0FBQSxDQVBQO0VBU0EsYUFBQSxFQUFlLFNBQUE7V0FDYixJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUNFLENBQUMsR0FESCxDQUNPLFNBQUMsS0FBRDthQUFXLEtBQUssQ0FBQyxhQUFOLENBQUE7SUFBWCxDQURQLENBRUUsQ0FBQyxNQUZILENBRVUsU0FBQyxVQUFELEVBQWEsT0FBYjthQUNOO1FBQUEsS0FBQSxFQUFPLFVBQVUsQ0FBQyxLQUFYLEdBQW1CLE9BQU8sQ0FBQyxLQUFsQztRQUNBLE1BQUEsRUFBUSxJQUFJLENBQUMsR0FBTCxDQUFTLE9BQU8sQ0FBQyxNQUFqQixFQUF5QixVQUFVLENBQUMsTUFBcEMsQ0FEUjtRQUVBLElBQUEsRUFBTSxVQUFVLENBQUMsSUFGakI7UUFHQSxHQUFBLEVBQUssVUFBVSxDQUFDLEdBSGhCOztJQURNLENBRlY7RUFEYSxDQVRmO0VBa0JBLFNBQUEsRUFBVyxTQUFDLE1BQUQ7V0FDVCxDQUFBLFNBQUEsR0FBUyxDQUFDLEVBQUEsR0FBSyxNQUFOLENBQVQsR0FBc0IsS0FBdEIsQ0FBQSxHQUNBO0VBRlMsQ0FsQlg7Q0FERjs7OztBQ0FBLE9BQUEsQ0FDRTtFQUFBLEVBQUEsRUFBSSxpQkFBSjtFQUVBLFVBQUEsRUFDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxNQUFOO01BQ0EsS0FBQSxFQUFPLEVBRFA7S0FERjtHQUhGO0VBT0EsU0FBQSxFQUNFO0lBQUEsSUFBQSxFQUFNLE9BQU47R0FSRjtFQVVBLGFBQUEsRUFBZSxTQUFBO1dBQ2I7TUFBQSxLQUFBLEVBQU8sSUFBQyxDQUFBLFdBQVI7TUFDQSxNQUFBLEVBQVEsSUFBQyxDQUFBLFlBRFQ7TUFFQSxJQUFBLEVBQU0sSUFBQyxDQUFBLFVBRlA7TUFHQSxHQUFBLEVBQUssSUFBQyxDQUFBLFNBSE47O0VBRGEsQ0FWZjtFQWlCQSxLQUFBLEVBQU8sU0FBQTtXQUNMLElBQUMsQ0FBQSxJQUFELENBQU0sUUFBTixFQUNFO01BQUEsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFUO0tBREY7RUFESyxDQWpCUDtDQURGOzs7O0FDQUEsSUFBQTs7QUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0FBQ1YsT0FBQSxDQUFRLGdCQUFSOztBQUNBLE9BQUEsQ0FBUSxpQkFBUjs7QUFFQSxPQUFBLENBQ0U7RUFBQSxFQUFBLEVBQUksV0FBSjtFQUVBLEtBQUEsRUFBTyxTQUFBO0lBQ0wsSUFBQyxDQUFBLE1BQUQsR0FBVSxPQUFBLENBQVEsSUFBQyxDQUFBLENBQUMsQ0FBQyxNQUFYLEVBQW1CLElBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQTNCLEVBQXdDLElBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQWhEO0lBRVYsSUFBQyxDQUFBLE9BQUQsR0FBVztXQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVCxHQUFzQjtFQUpqQixDQUZQO0VBUUEsUUFBQSxFQUFVLFNBQUE7V0FDUixJQUFDLENBQUEsS0FBRCxDQUFPLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQTtlQUNMLEtBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFnQixLQUFDLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUF4QixFQUFxQyxLQUFDLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUE3QztNQURLO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFQO0VBRFEsQ0FSVjtFQVlBLGNBQUEsRUFBZ0IsU0FBQTtXQUFTLElBQUMsQ0FBQSxRQUFKLENBQUE7RUFBTixDQVpoQjtFQWNBLGdCQUFBLEVBQWtCLFNBQUMsTUFBRDtXQUNoQixJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUNFLENBQUMsR0FESCxDQUNPLFNBQUMsR0FBRDthQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQXRCLENBQTJCLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixpQkFBckIsQ0FBM0I7SUFERyxDQURQLENBR0UsQ0FBQyxNQUhILENBR1UsU0FBQyxHQUFELEVBQU0sR0FBTjthQUNOLEdBQUcsQ0FBQyxNQUFKLENBQVcsR0FBWDtJQURNLENBSFYsQ0FLRSxDQUFDLE1BTEgsQ0FLVSxTQUFDLEVBQUQ7YUFDTixFQUFFLENBQUMsTUFDRCxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxNQUZILENBRVUsU0FBQyxFQUFEO2VBQVEsRUFBQSxLQUFNO01BQWQsQ0FGVixDQUdFLENBQUMsTUFISCxHQUdZO0lBSk4sQ0FMVjtFQURnQixDQWRsQjtFQTBCQSxhQUFBLEVBQWUsU0FBQyxNQUFELEVBQVMsS0FBVDtBQUNiLFFBQUE7SUFBQSxLQUFBLEdBQ0UsQ0FBQyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEIsQ0FBRCxDQUNFLENBQUMsR0FESCxDQUNPLFNBQUMsRUFBRDthQUFRLEVBQUUsQ0FBQyxhQUFILENBQUE7SUFBUixDQURQO0lBRUYsSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFXLENBQUEsTUFBQSxDQUFwQixHQUE4QixJQUFDLENBQUEsVUFBRCxDQUFZLElBQUMsQ0FBQSxNQUFiLEVBQXFCLEtBQXJCLEVBQTRCLEtBQTVCO0FBRTlCLFdBQU8sQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQU0sS0FBQyxDQUFBLE9BQU8sQ0FBQyxVQUFXLENBQUEsTUFBQSxDQUFPLENBQUMsT0FBNUIsQ0FBb0MsU0FBQyxLQUFEO2lCQUFXLEtBQUssQ0FBQyxNQUFOLENBQUE7UUFBWCxDQUFwQztNQUFOO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtFQU5NLENBMUJmO0VBa0NBLGNBQUEsRUFBZ0IsU0FBQTtBQUNkLFFBQUE7SUFBQSxJQUFHLCtCQUFIO01BQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBcEIsQ0FBNEIsU0FBQyxLQUFEO2VBQVcsS0FBSyxDQUFDLE1BQU4sQ0FBQTtNQUFYLENBQTVCLEVBREY7O0lBR0EsS0FBQSxHQUNFO01BQUEsSUFBQSxFQUFNLE1BQU47TUFDQSxNQUFBLEVBQVEsTUFEUjtNQUVBLFlBQUEsRUFBYyxDQUZkOztJQUdGLEtBQUEsR0FDRSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUNFLENBQUMsR0FESCxDQUNPLFNBQUMsS0FBRDthQUFXLEtBQUssQ0FBQyxhQUFOLENBQUE7SUFBWCxDQURQO1dBR0YsSUFBQyxDQUFBLFVBQUQsQ0FDRSxJQUFDLENBQUEsTUFESCxFQUVFLEtBRkYsRUFHRSxLQUhGO0VBWmMsQ0FsQ2hCO0VBbURBLFVBQUEsRUFBWSxTQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsS0FBZjtXQUNWLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBQyxJQUFEO0FBQ1IsVUFBQTtNQUFBLFlBQUEsR0FDSywwQkFBSCxHQUNLLEtBQUssQ0FBQyxZQURYLEdBRUs7TUFDUCxHQUFBLEdBQU0sS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFJLENBQUMsSUFBaEIsRUFBc0IsSUFBSSxDQUFDLEdBQTNCLEVBQWdDLElBQUksQ0FBQyxLQUFyQyxFQUE0QyxJQUFJLENBQUMsTUFBakQsRUFBeUQsWUFBekQ7QUFDTixXQUFBLGFBQUE7O1FBQ0UsR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFULEVBQWUsR0FBZjtBQURGO0FBRUEsYUFBTztJQVJDLENBQVY7RUFEVSxDQW5EWjtDQURGIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8vIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCBcXFxcXG4vLyDilIIgRXZlIDAuNC4yIC0gSmF2YVNjcmlwdCBFdmVudHMgTGlicmFyeSAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBBdXRob3IgRG1pdHJ5IEJhcmFub3Zza2l5IChodHRwOi8vZG1pdHJ5LmJhcmFub3Zza2l5LmNvbS8pIOKUgiBcXFxcXG4vLyDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggXFxcXFxuXG4oZnVuY3Rpb24gKGdsb2IpIHtcbiAgICB2YXIgdmVyc2lvbiA9IFwiMC40LjJcIixcbiAgICAgICAgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBzZXBhcmF0b3IgPSAvW1xcLlxcL10vLFxuICAgICAgICB3aWxkY2FyZCA9IFwiKlwiLFxuICAgICAgICBmdW4gPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgbnVtc29ydCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRfZXZlbnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGV2ZW50cyA9IHtuOiB7fX0sXG4gICAgLypcXFxuICAgICAqIGV2ZVxuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBGaXJlcyBldmVudCB3aXRoIGdpdmVuIGBuYW1lYCwgZ2l2ZW4gc2NvcGUgYW5kIG90aGVyIHBhcmFtZXRlcnMuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgKmV2ZW50KiwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuICAgICAtIHNjb3BlIChvYmplY3QpIGNvbnRleHQgZm9yIHRoZSBldmVudCBoYW5kbGVyc1xuICAgICAtIHZhcmFyZ3MgKC4uLikgdGhlIHJlc3Qgb2YgYXJndW1lbnRzIHdpbGwgYmUgc2VudCB0byBldmVudCBoYW5kbGVyc1xuXG4gICAgID0gKG9iamVjdCkgYXJyYXkgb2YgcmV0dXJuZWQgdmFsdWVzIGZyb20gdGhlIGxpc3RlbmVyc1xuICAgIFxcKi9cbiAgICAgICAgZXZlID0gZnVuY3Rpb24gKG5hbWUsIHNjb3BlKSB7XG5cdFx0XHRuYW1lID0gU3RyaW5nKG5hbWUpO1xuICAgICAgICAgICAgdmFyIGUgPSBldmVudHMsXG4gICAgICAgICAgICAgICAgb2xkc3RvcCA9IHN0b3AsXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMiksXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gZXZlLmxpc3RlbmVycyhuYW1lKSxcbiAgICAgICAgICAgICAgICB6ID0gMCxcbiAgICAgICAgICAgICAgICBmID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICBpbmRleGVkID0gW10sXG4gICAgICAgICAgICAgICAgcXVldWUgPSB7fSxcbiAgICAgICAgICAgICAgICBvdXQgPSBbXSxcbiAgICAgICAgICAgICAgICBjZSA9IGN1cnJlbnRfZXZlbnQsXG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gbmFtZTtcbiAgICAgICAgICAgIHN0b3AgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChcInpJbmRleFwiIGluIGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgIGluZGV4ZWQucHVzaChsaXN0ZW5lcnNbaV0uekluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLnpJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWVbbGlzdGVuZXJzW2ldLnpJbmRleF0gPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXhlZC5zb3J0KG51bXNvcnQpO1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4ZWRbel0gPCAwKSB7XG4gICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbeisrXV07XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbCA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoXCJ6SW5kZXhcIiBpbiBsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsLnpJbmRleCA9PSBpbmRleGVkW3pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHorKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6XV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCAmJiBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAobClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlW2wuekluZGV4XSA9IGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IGNlO1xuICAgICAgICAgICAgcmV0dXJuIG91dC5sZW5ndGggPyBvdXQgOiBudWxsO1xuICAgICAgICB9O1xuXHRcdC8vIFVuZG9jdW1lbnRlZC4gRGVidWcgb25seS5cblx0XHRldmUuX2V2ZW50cyA9IGV2ZW50cztcbiAgICAvKlxcXG4gICAgICogZXZlLmxpc3RlbmVyc1xuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBJbnRlcm5hbCBtZXRob2Qgd2hpY2ggZ2l2ZXMgeW91IGFycmF5IG9mIGFsbCBldmVudCBoYW5kbGVycyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBgbmFtZWAuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcblxuICAgICA9IChhcnJheSkgYXJyYXkgb2YgZXZlbnQgaGFuZGxlcnNcbiAgICBcXCovXG4gICAgZXZlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgIGUgPSBldmVudHMsXG4gICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgaXRlbXMsXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGlpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGpqLFxuICAgICAgICAgICAgbmVzLFxuICAgICAgICAgICAgZXMgPSBbZV0sXG4gICAgICAgICAgICBvdXQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBuZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZXMubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIGUgPSBlc1tqXS5uO1xuICAgICAgICAgICAgICAgIGl0ZW1zID0gW2VbbmFtZXNbaV1dLCBlW3dpbGRjYXJkXV07XG4gICAgICAgICAgICAgICAgayA9IDI7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGstLSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbXNba107XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dCA9IG91dC5jb25jYXQoaXRlbS5mIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVzID0gbmVzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBcbiAgICAvKlxcXG4gICAgICogZXZlLm9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCaW5kcyBnaXZlbiBldmVudCBoYW5kbGVyIHdpdGggYSBnaXZlbiBuYW1lLiBZb3UgY2FuIHVzZSB3aWxkY2FyZHMg4oCcYCpg4oCdIGZvciB0aGUgbmFtZXM6XG4gICAgIHwgZXZlLm9uKFwiKi51bmRlci4qXCIsIGYpO1xuICAgICB8IGV2ZShcIm1vdXNlLnVuZGVyLmZsb29yXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgICogVXNlIEBldmUgdG8gdHJpZ2dlciB0aGUgbGlzdGVuZXIuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgICAqKlxuICAgICA9IChmdW5jdGlvbikgcmV0dXJuZWQgZnVuY3Rpb24gYWNjZXB0cyBhIHNpbmdsZSBudW1lcmljIHBhcmFtZXRlciB0aGF0IHJlcHJlc2VudHMgei1pbmRleCBvZiB0aGUgaGFuZGxlci4gSXQgaXMgYW4gb3B0aW9uYWwgZmVhdHVyZSBhbmQgb25seSB1c2VkIHdoZW4geW91IG5lZWQgdG8gZW5zdXJlIHRoYXQgc29tZSBzdWJzZXQgb2YgaGFuZGxlcnMgd2lsbCBiZSBpbnZva2VkIGluIGEgZ2l2ZW4gb3JkZXIsIGRlc3BpdGUgb2YgdGhlIG9yZGVyIG9mIGFzc2lnbm1lbnQuIFxuICAgICA+IEV4YW1wbGU6XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgZWF0SXQpKDIpO1xuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIHNjcmVhbSk7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgY2F0Y2hJdCkoMSk7XG4gICAgICogVGhpcyB3aWxsIGVuc3VyZSB0aGF0IGBjYXRjaEl0KClgIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSBgZWF0SXQoKWAuXG5cdCAqXG4gICAgICogSWYgeW91IHdhbnQgdG8gcHV0IHlvdXIgaGFuZGxlciBiZWZvcmUgbm9uLWluZGV4ZWQgaGFuZGxlcnMsIHNwZWNpZnkgYSBuZWdhdGl2ZSB2YWx1ZS5cbiAgICAgKiBOb3RlOiBJIGFzc3VtZSBtb3N0IG9mIHRoZSB0aW1lIHlvdSBkb27igJl0IG5lZWQgdG8gd29ycnkgYWJvdXQgei1pbmRleCwgYnV0IGl04oCZcyBuaWNlIHRvIGhhdmUgdGhpcyBmZWF0dXJlIOKAnGp1c3QgaW4gY2FzZeKAnS5cbiAgICBcXCovXG4gICAgZXZlLm9uID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcblx0XHRuYW1lID0gU3RyaW5nKG5hbWUpO1xuXHRcdGlmICh0eXBlb2YgZiAhPSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbiAoKSB7fTtcblx0XHR9XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgIGUgPSBldmVudHM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICBlID0gZS5oYXNPd25Qcm9wZXJ0eShuYW1lc1tpXSkgJiYgZVtuYW1lc1tpXV0gfHwgKGVbbmFtZXNbaV1dID0ge246IHt9fSk7XG4gICAgICAgIH1cbiAgICAgICAgZS5mID0gZS5mIHx8IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGUuZi5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoZS5mW2ldID09IGYpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW47XG4gICAgICAgIH1cbiAgICAgICAgZS5mLnB1c2goZik7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoekluZGV4KSB7XG4gICAgICAgICAgICBpZiAoK3pJbmRleCA9PSArekluZGV4KSB7XG4gICAgICAgICAgICAgICAgZi56SW5kZXggPSArekluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5mXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIGdpdmVuIGV2ZW50IHdpdGggb3B0aW9uYWwgYXJndW1lbnRzLlxuXHQgKiBBcmd1bWVudHMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgcmVzdWx0IGZ1bmN0aW9uIHdpbGwgYmUgYWxzb1xuXHQgKiBjb25jYXRlZCB0byB0aGUgbGlzdCBvZiBmaW5hbCBhcmd1bWVudHMuXG4gXHQgfCBlbC5vbmNsaWNrID0gZXZlLmYoXCJjbGlja1wiLCAxLCAyKTtcbiBcdCB8IGV2ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gXHQgfCAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7IC8vIDEsIDIsIFtldmVudCBvYmplY3RdXG4gXHQgfCB9KTtcbiAgICAgPiBBcmd1bWVudHNcblx0IC0gZXZlbnQgKHN0cmluZykgZXZlbnQgbmFtZVxuXHQgLSB2YXJhcmdzICjigKYpIGFuZCBhbnkgb3RoZXIgYXJndW1lbnRzXG5cdCA9IChmdW5jdGlvbikgcG9zc2libGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgIFxcKi9cblx0ZXZlLmYgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHR2YXIgYXR0cnMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRcdGV2ZS5hcHBseShudWxsLCBbZXZlbnQsIG51bGxdLmNvbmNhdChhdHRycykuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpO1xuXHRcdH07XG5cdH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5zdG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJcyB1c2VkIGluc2lkZSBhbiBldmVudCBoYW5kbGVyIHRvIHN0b3AgdGhlIGV2ZW50LCBwcmV2ZW50aW5nIGFueSBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGZpcmluZy5cbiAgICBcXCovXG4gICAgZXZlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0b3AgPSAxO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5udFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBzdWJuYW1lIChzdHJpbmcpICNvcHRpb25hbCBzdWJuYW1lIG9mIHRoZSBldmVudFxuICAgICAqKlxuICAgICA9IChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBpZiBgc3VibmFtZWAgaXMgbm90IHNwZWNpZmllZFxuICAgICAqIG9yXG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCwgaWYgY3VycmVudCBldmVudOKAmXMgbmFtZSBjb250YWlucyBgc3VibmFtZWBcbiAgICBcXCovXG4gICAgZXZlLm50ID0gZnVuY3Rpb24gKHN1Ym5hbWUpIHtcbiAgICAgICAgaWYgKHN1Ym5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFwiKD86XFxcXC58XFxcXC98XilcIiArIHN1Ym5hbWUgKyBcIig/OlxcXFwufFxcXFwvfCQpXCIpLnRlc3QoY3VycmVudF9ldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnJlbnRfZXZlbnQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50c1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgKipcbiAgICAgPSAoYXJyYXkpIG5hbWVzIG9mIHRoZSBldmVudFxuICAgIFxcKi9cbiAgICBldmUubnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudF9ldmVudC5zcGxpdChzZXBhcmF0b3IpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vZmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZ2l2ZW4gZnVuY3Rpb24gZnJvbSB0aGUgbGlzdCBvZiBldmVudCBsaXN0ZW5lcnMgYXNzaWduZWQgdG8gZ2l2ZW4gbmFtZS5cblx0ICogSWYgbm8gYXJndW1lbnRzIHNwZWNpZmllZCBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIGNsZWFyZWQuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogZXZlLnVuYmluZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBldmUub2ZmXG4gICAgXFwqL1xuICAgIGV2ZS5vZmYgPSBldmUudW5iaW5kID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcblx0XHRpZiAoIW5hbWUpIHtcblx0XHQgICAgZXZlLl9ldmVudHMgPSBldmVudHMgPSB7bjoge319O1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHNwbGljZSxcbiAgICAgICAgICAgIGksIGlpLCBqLCBqaixcbiAgICAgICAgICAgIGN1ciA9IFtldmVudHNdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBjdXIubGVuZ3RoOyBqICs9IHNwbGljZS5sZW5ndGggLSAyKSB7XG4gICAgICAgICAgICAgICAgc3BsaWNlID0gW2osIDFdO1xuICAgICAgICAgICAgICAgIGUgPSBjdXJbal0ubjtcbiAgICAgICAgICAgICAgICBpZiAobmFtZXNbaV0gIT0gd2lsZGNhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVbbmFtZXNbaV1dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW25hbWVzW2ldXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlKSBpZiAoZVtoYXNdKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGljZS5wdXNoKGVba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VyLnNwbGljZS5hcHBseShjdXIsIHNwbGljZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBjdXIubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZSA9IGN1cltpXTtcbiAgICAgICAgICAgIHdoaWxlIChlLm4pIHtcbiAgICAgICAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGUuZi5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZS5mW2pdID09IGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmYuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIWUuZi5sZW5ndGggJiYgZGVsZXRlIGUuZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmdW5jcyA9IGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGZ1bmNzLmxlbmd0aDsgaiA8IGpqOyBqKyspIGlmIChmdW5jc1tqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Muc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIWZ1bmNzLmxlbmd0aCAmJiBkZWxldGUgZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUubikgaWYgKGUubltoYXNdKGtleSkgJiYgZS5uW2tleV0uZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZSA9IGUubjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vbmNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCaW5kcyBnaXZlbiBldmVudCBoYW5kbGVyIHdpdGggYSBnaXZlbiBuYW1lIHRvIG9ubHkgcnVuIG9uY2UgdGhlbiB1bmJpbmQgaXRzZWxmLlxuICAgICB8IGV2ZS5vbmNlKFwibG9naW5cIiwgZik7XG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIHRyaWdnZXJzIGZcbiAgICAgfCBldmUoXCJsb2dpblwiKTsgLy8gbm8gbGlzdGVuZXJzXG4gICAgICogVXNlIEBldmUgdG8gdHJpZ2dlciB0aGUgbGlzdGVuZXIuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgICAqKlxuICAgICA9IChmdW5jdGlvbikgc2FtZSByZXR1cm4gZnVuY3Rpb24gYXMgQGV2ZS5vblxuICAgIFxcKi9cbiAgICBldmUub25jZSA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG4gICAgICAgIHZhciBmMiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV2ZS51bmJpbmQobmFtZSwgZjIpO1xuICAgICAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGV2ZS5vbihuYW1lLCBmMik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLnZlcnNpb25cbiAgICAgWyBwcm9wZXJ0eSAoc3RyaW5nKSBdXG4gICAgICoqXG4gICAgICogQ3VycmVudCB2ZXJzaW9uIG9mIHRoZSBsaWJyYXJ5LlxuICAgIFxcKi9cbiAgICBldmUudmVyc2lvbiA9IHZlcnNpb247XG4gICAgZXZlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJZb3UgYXJlIHJ1bm5pbmcgRXZlIFwiICsgdmVyc2lvbjtcbiAgICB9O1xuICAgICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpID8gKG1vZHVsZS5leHBvcnRzID0gZXZlKSA6ICh0eXBlb2YgZGVmaW5lICE9IFwidW5kZWZpbmVkXCIgPyAoZGVmaW5lKFwiZXZlXCIsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIGV2ZTsgfSkpIDogKGdsb2IuZXZlID0gZXZlKSk7XG59KSh0aGlzKTtcbiIsIi8vIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCBcXFxcXG4vLyDilIIgUmFwaGHDq2wgMi4xLjMgLSBKYXZhU2NyaXB0IFZlY3RvciBMaWJyYXJ5ICAgICAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgwqkgMjAwOC0yMDEyIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL3JhcGhhZWxqcy5jb20pICAgIOKUgiBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IMKpIDIwMDgtMjAxMiBTZW5jaGEgTGFicyAoaHR0cDovL3NlbmNoYS5jb20pICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIChodHRwOi8vcmFwaGFlbGpzLmNvbS9saWNlbnNlLmh0bWwpIGxpY2Vuc2Uu4pSCIFxcXFxcbi8vIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCBcXFxcXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIEV2ZSAwLjQuMiAtIEphdmFTY3JpcHQgRXZlbnRzIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQXV0aG9yIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL2RtaXRyeS5iYXJhbm92c2tpeS5jb20vKSDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uIChnbG9iKSB7XG4gICAgdmFyIHZlcnNpb24gPSBcIjAuNC4yXCIsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgc2VwYXJhdG9yID0gL1tcXC5cXC9dLyxcbiAgICAgICAgd2lsZGNhcmQgPSBcIipcIixcbiAgICAgICAgZnVuID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG51bXNvcnQgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgICB9LFxuICAgICAgICBjdXJyZW50X2V2ZW50LFxuICAgICAgICBzdG9wLFxuICAgICAgICBldmVudHMgPSB7bjoge319LFxuICAgIC8qXFxcbiAgICAgKiBldmVcbiAgICAgWyBtZXRob2QgXVxuXG4gICAgICogRmlyZXMgZXZlbnQgd2l0aCBnaXZlbiBgbmFtZWAsIGdpdmVuIHNjb3BlIGFuZCBvdGhlciBwYXJhbWV0ZXJzLlxuXG4gICAgID4gQXJndW1lbnRzXG5cbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlICpldmVudCosIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcbiAgICAgLSBzY29wZSAob2JqZWN0KSBjb250ZXh0IGZvciB0aGUgZXZlbnQgaGFuZGxlcnNcbiAgICAgLSB2YXJhcmdzICguLi4pIHRoZSByZXN0IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHNlbnQgdG8gZXZlbnQgaGFuZGxlcnNcblxuICAgICA9IChvYmplY3QpIGFycmF5IG9mIHJldHVybmVkIHZhbHVlcyBmcm9tIHRoZSBsaXN0ZW5lcnNcbiAgICBcXCovXG4gICAgICAgIGV2ZSA9IGZ1bmN0aW9uIChuYW1lLCBzY29wZSkge1xuXHRcdFx0bmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICAgICAgICAgIHZhciBlID0gZXZlbnRzLFxuICAgICAgICAgICAgICAgIG9sZHN0b3AgPSBzdG9wLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLFxuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGV2ZS5saXN0ZW5lcnMobmFtZSksXG4gICAgICAgICAgICAgICAgeiA9IDAsXG4gICAgICAgICAgICAgICAgZiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGwsXG4gICAgICAgICAgICAgICAgaW5kZXhlZCA9IFtdLFxuICAgICAgICAgICAgICAgIHF1ZXVlID0ge30sXG4gICAgICAgICAgICAgICAgb3V0ID0gW10sXG4gICAgICAgICAgICAgICAgY2UgPSBjdXJyZW50X2V2ZW50LFxuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IG5hbWU7XG4gICAgICAgICAgICBzdG9wID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoXCJ6SW5kZXhcIiBpbiBsaXN0ZW5lcnNbaV0pIHtcbiAgICAgICAgICAgICAgICBpbmRleGVkLnB1c2gobGlzdGVuZXJzW2ldLnpJbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS56SW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlW2xpc3RlbmVyc1tpXS56SW5kZXhdID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGV4ZWQuc29ydChudW1zb3J0KTtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleGVkW3pdIDwgMCkge1xuICAgICAgICAgICAgICAgIGwgPSBxdWV1ZVtpbmRleGVkW3orK11dO1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gb2xkc3RvcDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGwgPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKFwiekluZGV4XCIgaW4gbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobC56SW5kZXggPT0gaW5kZXhlZFt6XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbel1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgJiYgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGwpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZVtsLnpJbmRleF0gPSBsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9wID0gb2xkc3RvcDtcbiAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSBjZTtcbiAgICAgICAgICAgIHJldHVybiBvdXQubGVuZ3RoID8gb3V0IDogbnVsbDtcbiAgICAgICAgfTtcblx0XHQvLyBVbmRvY3VtZW50ZWQuIERlYnVnIG9ubHkuXG5cdFx0ZXZlLl9ldmVudHMgPSBldmVudHM7XG4gICAgLypcXFxuICAgICAqIGV2ZS5saXN0ZW5lcnNcbiAgICAgWyBtZXRob2QgXVxuXG4gICAgICogSW50ZXJuYWwgbWV0aG9kIHdoaWNoIGdpdmVzIHlvdSBhcnJheSBvZiBhbGwgZXZlbnQgaGFuZGxlcnMgdGhhdCB3aWxsIGJlIHRyaWdnZXJlZCBieSB0aGUgZ2l2ZW4gYG5hbWVgLlxuXG4gICAgID4gQXJndW1lbnRzXG5cbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkXG5cbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIGV2ZW50IGhhbmRsZXJzXG4gICAgXFwqL1xuICAgIGV2ZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICBlID0gZXZlbnRzLFxuICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgIGl0ZW1zLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBpaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBqaixcbiAgICAgICAgICAgIG5lcyxcbiAgICAgICAgICAgIGVzID0gW2VdLFxuICAgICAgICAgICAgb3V0ID0gW107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgbmVzID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGVzLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICBlID0gZXNbal0ubjtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtlW25hbWVzW2ldXSwgZVt3aWxkY2FyZF1dO1xuICAgICAgICAgICAgICAgIGsgPSAyO1xuICAgICAgICAgICAgICAgIHdoaWxlIChrLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2tdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQgPSBvdXQuY29uY2F0KGl0ZW0uZiB8fCBbXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlcyA9IG5lcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgXG4gICAgLypcXFxuICAgICAqIGV2ZS5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZS4gWW91IGNhbiB1c2Ugd2lsZGNhcmRzIOKAnGAqYOKAnSBmb3IgdGhlIG5hbWVzOlxuICAgICB8IGV2ZS5vbihcIioudW5kZXIuKlwiLCBmKTtcbiAgICAgfCBldmUoXCJtb3VzZS51bmRlci5mbG9vclwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHJldHVybmVkIGZ1bmN0aW9uIGFjY2VwdHMgYSBzaW5nbGUgbnVtZXJpYyBwYXJhbWV0ZXIgdGhhdCByZXByZXNlbnRzIHotaW5kZXggb2YgdGhlIGhhbmRsZXIuIEl0IGlzIGFuIG9wdGlvbmFsIGZlYXR1cmUgYW5kIG9ubHkgdXNlZCB3aGVuIHlvdSBuZWVkIHRvIGVuc3VyZSB0aGF0IHNvbWUgc3Vic2V0IG9mIGhhbmRsZXJzIHdpbGwgYmUgaW52b2tlZCBpbiBhIGdpdmVuIG9yZGVyLCBkZXNwaXRlIG9mIHRoZSBvcmRlciBvZiBhc3NpZ25tZW50LiBcbiAgICAgPiBFeGFtcGxlOlxuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIGVhdEl0KSgyKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBzY3JlYW0pO1xuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIGNhdGNoSXQpKDEpO1xuICAgICAqIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCBgY2F0Y2hJdCgpYCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBiZWZvcmUgYGVhdEl0KClgLlxuXHQgKlxuICAgICAqIElmIHlvdSB3YW50IHRvIHB1dCB5b3VyIGhhbmRsZXIgYmVmb3JlIG5vbi1pbmRleGVkIGhhbmRsZXJzLCBzcGVjaWZ5IGEgbmVnYXRpdmUgdmFsdWUuXG4gICAgICogTm90ZTogSSBhc3N1bWUgbW9zdCBvZiB0aGUgdGltZSB5b3UgZG9u4oCZdCBuZWVkIHRvIHdvcnJ5IGFib3V0IHotaW5kZXgsIGJ1dCBpdOKAmXMgbmljZSB0byBoYXZlIHRoaXMgZmVhdHVyZSDigJxqdXN0IGluIGNhc2XigJ0uXG4gICAgXFwqL1xuICAgIGV2ZS5vbiA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG5cdFx0bmFtZSA9IFN0cmluZyhuYW1lKTtcblx0XHRpZiAodHlwZW9mIGYgIT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge307XG5cdFx0fVxuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICBlID0gZXZlbnRzO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBlID0gZS5uO1xuICAgICAgICAgICAgZSA9IGUuaGFzT3duUHJvcGVydHkobmFtZXNbaV0pICYmIGVbbmFtZXNbaV1dIHx8IChlW25hbWVzW2ldXSA9IHtuOiB7fX0pO1xuICAgICAgICB9XG4gICAgICAgIGUuZiA9IGUuZiB8fCBbXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBlLmYubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKGUuZltpXSA9PSBmKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuO1xuICAgICAgICB9XG4gICAgICAgIGUuZi5wdXNoKGYpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHpJbmRleCkge1xuICAgICAgICAgICAgaWYgKCt6SW5kZXggPT0gK3pJbmRleCkge1xuICAgICAgICAgICAgICAgIGYuekluZGV4ID0gK3pJbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBmdW5jdGlvbiB0aGF0IHdpbGwgZmlyZSBnaXZlbiBldmVudCB3aXRoIG9wdGlvbmFsIGFyZ3VtZW50cy5cblx0ICogQXJndW1lbnRzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIHJlc3VsdCBmdW5jdGlvbiB3aWxsIGJlIGFsc29cblx0ICogY29uY2F0ZWQgdG8gdGhlIGxpc3Qgb2YgZmluYWwgYXJndW1lbnRzLlxuIFx0IHwgZWwub25jbGljayA9IGV2ZS5mKFwiY2xpY2tcIiwgMSwgMik7XG4gXHQgfCBldmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuIFx0IHwgICAgIGNvbnNvbGUubG9nKGEsIGIsIGMpOyAvLyAxLCAyLCBbZXZlbnQgb2JqZWN0XVxuIFx0IHwgfSk7XG4gICAgID4gQXJndW1lbnRzXG5cdCAtIGV2ZW50IChzdHJpbmcpIGV2ZW50IG5hbWVcblx0IC0gdmFyYXJncyAo4oCmKSBhbmQgYW55IG90aGVyIGFyZ3VtZW50c1xuXHQgPSAoZnVuY3Rpb24pIHBvc3NpYmxlIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG5cdGV2ZS5mID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0dmFyIGF0dHJzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRldmUuYXBwbHkobnVsbCwgW2V2ZW50LCBudWxsXS5jb25jYXQoYXR0cnMpLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTtcblx0XHR9O1xuXHR9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuc3RvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSXMgdXNlZCBpbnNpZGUgYW4gZXZlbnQgaGFuZGxlciB0byBzdG9wIHRoZSBldmVudCwgcHJldmVudGluZyBhbnkgc3Vic2VxdWVudCBsaXN0ZW5lcnMgZnJvbSBmaXJpbmcuXG4gICAgXFwqL1xuICAgIGV2ZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzdG9wID0gMTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUubnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvdWxkIGJlIHVzZWQgaW5zaWRlIGV2ZW50IGhhbmRsZXIgdG8gZmlndXJlIG91dCBhY3R1YWwgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gc3VibmFtZSAoc3RyaW5nKSAjb3B0aW9uYWwgc3VibmFtZSBvZiB0aGUgZXZlbnRcbiAgICAgKipcbiAgICAgPSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgaWYgYHN1Ym5hbWVgIGlzIG5vdCBzcGVjaWZpZWRcbiAgICAgKiBvclxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAsIGlmIGN1cnJlbnQgZXZlbnTigJlzIG5hbWUgY29udGFpbnMgYHN1Ym5hbWVgXG4gICAgXFwqL1xuICAgIGV2ZS5udCA9IGZ1bmN0aW9uIChzdWJuYW1lKSB7XG4gICAgICAgIGlmIChzdWJuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcIig/OlxcXFwufFxcXFwvfF4pXCIgKyBzdWJuYW1lICsgXCIoPzpcXFxcLnxcXFxcL3wkKVwiKS50ZXN0KGN1cnJlbnRfZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyZW50X2V2ZW50O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5udHNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvdWxkIGJlIHVzZWQgaW5zaWRlIGV2ZW50IGhhbmRsZXIgdG8gZmlndXJlIG91dCBhY3R1YWwgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICoqXG4gICAgICoqXG4gICAgID0gKGFycmF5KSBuYW1lcyBvZiB0aGUgZXZlbnRcbiAgICBcXCovXG4gICAgZXZlLm50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRfZXZlbnQuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub2ZmXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGdpdmVuIGZ1bmN0aW9uIGZyb20gdGhlIGxpc3Qgb2YgZXZlbnQgbGlzdGVuZXJzIGFzc2lnbmVkIHRvIGdpdmVuIG5hbWUuXG5cdCAqIElmIG5vIGFyZ3VtZW50cyBzcGVjaWZpZWQgYWxsIHRoZSBldmVudHMgd2lsbCBiZSBjbGVhcmVkLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIGV2ZS51bmJpbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBAZXZlLm9mZlxuICAgIFxcKi9cbiAgICBldmUub2ZmID0gZXZlLnVuYmluZCA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG5cdFx0aWYgKCFuYW1lKSB7XG5cdFx0ICAgIGV2ZS5fZXZlbnRzID0gZXZlbnRzID0ge246IHt9fTtcblx0XHRcdHJldHVybjtcblx0XHR9XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgIGUsXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBzcGxpY2UsXG4gICAgICAgICAgICBpLCBpaSwgaiwgamosXG4gICAgICAgICAgICBjdXIgPSBbZXZlbnRzXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY3VyLmxlbmd0aDsgaiArPSBzcGxpY2UubGVuZ3RoIC0gMikge1xuICAgICAgICAgICAgICAgIHNwbGljZSA9IFtqLCAxXTtcbiAgICAgICAgICAgICAgICBlID0gY3VyW2pdLm47XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzW2ldICE9IHdpbGRjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlW25hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtuYW1lc1tpXV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZSkgaWYgKGVbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1ci5zcGxpY2UuYXBwbHkoY3VyLCBzcGxpY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gY3VyLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGUgPSBjdXJbaV07XG4gICAgICAgICAgICB3aGlsZSAoZS5uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUuZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlLmYubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGUuZltqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5mLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFlLmYubGVuZ3RoICYmIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnVuY3MgPSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBmdW5jcy5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZnVuY3Nbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNzLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFmdW5jcy5sZW5ndGggJiYgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub25jZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZSB0byBvbmx5IHJ1biBvbmNlIHRoZW4gdW5iaW5kIGl0c2VsZi5cbiAgICAgfCBldmUub25jZShcImxvZ2luXCIsIGYpO1xuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIG5vIGxpc3RlbmVyc1xuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHNhbWUgcmV0dXJuIGZ1bmN0aW9uIGFzIEBldmUub25cbiAgICBcXCovXG4gICAgZXZlLm9uY2UgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuICAgICAgICB2YXIgZjIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBldmUudW5iaW5kKG5hbWUsIGYyKTtcbiAgICAgICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBldmUub24obmFtZSwgZjIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS52ZXJzaW9uXG4gICAgIFsgcHJvcGVydHkgKHN0cmluZykgXVxuICAgICAqKlxuICAgICAqIEN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgbGlicmFyeS5cbiAgICBcXCovXG4gICAgZXZlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgIGV2ZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWW91IGFyZSBydW5uaW5nIEV2ZSBcIiArIHZlcnNpb247XG4gICAgfTtcbiAgICAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSA/IChtb2R1bGUuZXhwb3J0cyA9IGV2ZSkgOiAodHlwZW9mIGRlZmluZSAhPSBcInVuZGVmaW5lZFwiID8gKGRlZmluZShcImV2ZVwiLCBbXSwgZnVuY3Rpb24oKSB7IHJldHVybiBldmU7IH0pKSA6IChnbG9iLmV2ZSA9IGV2ZSkpO1xufSkod2luZG93IHx8IHRoaXMpO1xuLy8g4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQIFxcXFxcbi8vIOKUgiBcIlJhcGhhw6tsIDIuMS4yXCIgLSBKYXZhU2NyaXB0IFZlY3RvciBMaWJyYXJ5ICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIENvcHlyaWdodCAoYykgMjAwOC0yMDExIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL3JhcGhhZWxqcy5jb20pICAg4pSCIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMSBTZW5jaGEgTGFicyAoaHR0cDovL3NlbmNoYS5jb20pICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilIIgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCAoaHR0cDovL3JhcGhhZWxqcy5jb20vbGljZW5zZS5odG1sKSBsaWNlbnNlLiDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uIChnbG9iLCBmYWN0b3J5KSB7XG4gICAgLy8gQU1EIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gRGVmaW5lIGFzIGFuIGFub255bW91cyBtb2R1bGVcbiAgICAgICAgZGVmaW5lKFtcImV2ZVwiXSwgZnVuY3Rpb24oIGV2ZSApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KGdsb2IsIGV2ZSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAoZ2xvYiBpcyB3aW5kb3cpXG4gICAgICAgIC8vIFJhcGhhZWwgYWRkcyBpdHNlbGYgdG8gd2luZG93XG4gICAgICAgIGZhY3RvcnkoZ2xvYiwgZ2xvYi5ldmUgfHwgKHR5cGVvZiByZXF1aXJlID09IFwiZnVuY3Rpb25cIiAmJiByZXF1aXJlKCdldmUnKSkgKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uICh3aW5kb3csIGV2ZSkge1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgY2FudmFzIG9iamVjdCBvbiB3aGljaCB0byBkcmF3LlxuICAgICAqIFlvdSBtdXN0IGRvIHRoaXMgZmlyc3QsIGFzIGFsbCBmdXR1cmUgY2FsbHMgdG8gZHJhd2luZyBtZXRob2RzXG4gICAgICogZnJvbSB0aGlzIGluc3RhbmNlIHdpbGwgYmUgYm91bmQgdG8gdGhpcyBjYW52YXMuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGNvbnRhaW5lciAoSFRNTEVsZW1lbnR8c3RyaW5nKSBET00gZWxlbWVudCBvciBpdHMgSUQgd2hpY2ggaXMgZ29pbmcgdG8gYmUgYSBwYXJlbnQgZm9yIGRyYXdpbmcgc3VyZmFjZVxuICAgICAtIHdpZHRoIChudW1iZXIpXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gd2hpY2ggaXMgZ29pbmcgdG8gYmUgZXhlY3V0ZWQgaW4gdGhlIGNvbnRleHQgb2YgbmV3bHkgY3JlYXRlZCBwYXBlclxuICAgICAqIG9yXG4gICAgIC0geCAobnVtYmVyKVxuICAgICAtIHkgKG51bWJlcilcbiAgICAgLSB3aWR0aCAobnVtYmVyKVxuICAgICAtIGhlaWdodCAobnVtYmVyKVxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHdoaWNoIGlzIGdvaW5nIHRvIGJlIGV4ZWN1dGVkIGluIHRoZSBjb250ZXh0IG9mIG5ld2x5IGNyZWF0ZWQgcGFwZXJcbiAgICAgKiBvclxuICAgICAtIGFsbCAoYXJyYXkpIChmaXJzdCAzIG9yIDQgZWxlbWVudHMgaW4gdGhlIGFycmF5IGFyZSBlcXVhbCB0byBbY29udGFpbmVySUQsIHdpZHRoLCBoZWlnaHRdIG9yIFt4LCB5LCB3aWR0aCwgaGVpZ2h0XS4gVGhlIHJlc3QgYXJlIGVsZW1lbnQgZGVzY3JpcHRpb25zIGluIGZvcm1hdCB7dHlwZTogdHlwZSwgPGF0dHJpYnV0ZXM+fSkuIFNlZSBAUGFwZXIuYWRkLlxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHdoaWNoIGlzIGdvaW5nIHRvIGJlIGV4ZWN1dGVkIGluIHRoZSBjb250ZXh0IG9mIG5ld2x5IGNyZWF0ZWQgcGFwZXJcbiAgICAgKiBvclxuICAgICAtIG9uUmVhZHlDYWxsYmFjayAoZnVuY3Rpb24pIGZ1bmN0aW9uIHRoYXQgaXMgZ29pbmcgdG8gYmUgY2FsbGVkIG9uIERPTSByZWFkeSBldmVudC4gWW91IGNhbiBhbHNvIHN1YnNjcmliZSB0byB0aGlzIGV2ZW50IHZpYSBFdmXigJlzIOKAnERPTUxvYWTigJ0gZXZlbnQuIEluIHRoaXMgY2FzZSBtZXRob2QgcmV0dXJucyBgdW5kZWZpbmVkYC5cbiAgICAgPSAob2JqZWN0KSBAUGFwZXJcbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIEVhY2ggb2YgdGhlIGZvbGxvd2luZyBleGFtcGxlcyBjcmVhdGUgYSBjYW52YXNcbiAgICAgfCAvLyB0aGF0IGlzIDMyMHB4IHdpZGUgYnkgMjAwcHggaGlnaC5cbiAgICAgfCAvLyBDYW52YXMgaXMgY3JlYXRlZCBhdCB0aGUgdmlld3BvcnTigJlzIDEwLDUwIGNvb3JkaW5hdGUuXG4gICAgIHwgdmFyIHBhcGVyID0gUmFwaGFlbCgxMCwgNTAsIDMyMCwgMjAwKTtcbiAgICAgfCAvLyBDYW52YXMgaXMgY3JlYXRlZCBhdCB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIHRoZSAjbm90ZXBhZCBlbGVtZW50XG4gICAgIHwgLy8gKG9yIGl0cyB0b3AgcmlnaHQgY29ybmVyIGluIGRpcj1cInJ0bFwiIGVsZW1lbnRzKVxuICAgICB8IHZhciBwYXBlciA9IFJhcGhhZWwoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJub3RlcGFkXCIpLCAzMjAsIDIwMCk7XG4gICAgIHwgLy8gU2FtZSBhcyBhYm92ZVxuICAgICB8IHZhciBwYXBlciA9IFJhcGhhZWwoXCJub3RlcGFkXCIsIDMyMCwgMjAwKTtcbiAgICAgfCAvLyBJbWFnZSBkdW1wXG4gICAgIHwgdmFyIHNldCA9IFJhcGhhZWwoW1wibm90ZXBhZFwiLCAzMjAsIDIwMCwge1xuICAgICB8ICAgICB0eXBlOiBcInJlY3RcIixcbiAgICAgfCAgICAgeDogMTAsXG4gICAgIHwgICAgIHk6IDEwLFxuICAgICB8ICAgICB3aWR0aDogMjUsXG4gICAgIHwgICAgIGhlaWdodDogMjUsXG4gICAgIHwgICAgIHN0cm9rZTogXCIjZjAwXCJcbiAgICAgfCB9LCB7XG4gICAgIHwgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICB8ICAgICB4OiAzMCxcbiAgICAgfCAgICAgeTogNDAsXG4gICAgIHwgICAgIHRleHQ6IFwiRHVtcFwiXG4gICAgIHwgfV0pO1xuICAgIFxcKi9cbiAgICBmdW5jdGlvbiBSKGZpcnN0KSB7XG4gICAgICAgIGlmIChSLmlzKGZpcnN0LCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZGVkID8gZmlyc3QoKSA6IGV2ZS5vbihcInJhcGhhZWwuRE9NbG9hZFwiLCBmaXJzdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoUi5pcyhmaXJzdCwgYXJyYXkpKSB7XG4gICAgICAgICAgICByZXR1cm4gUi5fZW5naW5lLmNyZWF0ZVthcHBseV0oUiwgZmlyc3Quc3BsaWNlKDAsIDMgKyBSLmlzKGZpcnN0WzBdLCBudSkpKS5hZGQoZmlyc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgICAgICAgaWYgKFIuaXMoYXJnc1thcmdzLmxlbmd0aCAtIDFdLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGYgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2FkZWQgPyBmLmNhbGwoUi5fZW5naW5lLmNyZWF0ZVthcHBseV0oUiwgYXJncykpIDogZXZlLm9uKFwicmFwaGFlbC5ET01sb2FkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZi5jYWxsKFIuX2VuZ2luZS5jcmVhdGVbYXBwbHldKFIsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFIuX2VuZ2luZS5jcmVhdGVbYXBwbHldKFIsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgUi52ZXJzaW9uID0gXCIyLjEuMlwiO1xuICAgIFIuZXZlID0gZXZlO1xuICAgIHZhciBsb2FkZWQsXG4gICAgICAgIHNlcGFyYXRvciA9IC9bLCBdKy8sXG4gICAgICAgIGVsZW1lbnRzID0ge2NpcmNsZTogMSwgcmVjdDogMSwgcGF0aDogMSwgZWxsaXBzZTogMSwgdGV4dDogMSwgaW1hZ2U6IDF9LFxuICAgICAgICBmb3JtYXRyZyA9IC9cXHsoXFxkKylcXH0vZyxcbiAgICAgICAgcHJvdG8gPSBcInByb3RvdHlwZVwiLFxuICAgICAgICBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIGcgPSB7XG4gICAgICAgICAgICBkb2M6IGRvY3VtZW50LFxuICAgICAgICAgICAgd2luOiB3aW5kb3dcbiAgICAgICAgfSxcbiAgICAgICAgb2xkUmFwaGFlbCA9IHtcbiAgICAgICAgICAgIHdhczogT2JqZWN0LnByb3RvdHlwZVtoYXNdLmNhbGwoZy53aW4sIFwiUmFwaGFlbFwiKSxcbiAgICAgICAgICAgIGlzOiBnLndpbi5SYXBoYWVsXG4gICAgICAgIH0sXG4gICAgICAgIFBhcGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLypcXFxuICAgICAgICAgICAgICogUGFwZXIuY2FcbiAgICAgICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICAgICAqKlxuICAgICAgICAgICAgICogU2hvcnRjdXQgZm9yIEBQYXBlci5jdXN0b21BdHRyaWJ1dGVzXG4gICAgICAgICAgICBcXCovXG4gICAgICAgICAgICAvKlxcXG4gICAgICAgICAgICAgKiBQYXBlci5jdXN0b21BdHRyaWJ1dGVzXG4gICAgICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAgICAgKipcbiAgICAgICAgICAgICAqIElmIHlvdSBoYXZlIGEgc2V0IG9mIGF0dHJpYnV0ZXMgdGhhdCB5b3Ugd291bGQgbGlrZSB0byByZXByZXNlbnRcbiAgICAgICAgICAgICAqIGFzIGEgZnVuY3Rpb24gb2Ygc29tZSBudW1iZXIgeW91IGNhbiBkbyBpdCBlYXNpbHkgd2l0aCBjdXN0b20gYXR0cmlidXRlczpcbiAgICAgICAgICAgICA+IFVzYWdlXG4gICAgICAgICAgICAgfCBwYXBlci5jdXN0b21BdHRyaWJ1dGVzLmh1ZSA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICAgICAgICAgICB8ICAgICBudW0gPSBudW0gJSAxO1xuICAgICAgICAgICAgIHwgICAgIHJldHVybiB7ZmlsbDogXCJoc2IoXCIgKyBudW0gKyBcIiwgMC43NSwgMSlcIn07XG4gICAgICAgICAgICAgfCB9O1xuICAgICAgICAgICAgIHwgLy8gQ3VzdG9tIGF0dHJpYnV0ZSDigJxodWXigJ0gd2lsbCBjaGFuZ2UgZmlsbFxuICAgICAgICAgICAgIHwgLy8gdG8gYmUgZ2l2ZW4gaHVlIHdpdGggZml4ZWQgc2F0dXJhdGlvbiBhbmQgYnJpZ2h0bmVzcy5cbiAgICAgICAgICAgICB8IC8vIE5vdyB5b3UgY2FuIHVzZSBpdCBsaWtlIHRoaXM6XG4gICAgICAgICAgICAgfCB2YXIgYyA9IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDEwKS5hdHRyKHtodWU6IC40NX0pO1xuICAgICAgICAgICAgIHwgLy8gb3IgZXZlbiBsaWtlIHRoaXM6XG4gICAgICAgICAgICAgfCBjLmFuaW1hdGUoe2h1ZTogMX0sIDFlMyk7XG4gICAgICAgICAgICAgfFxuICAgICAgICAgICAgIHwgLy8gWW91IGNvdWxkIGFsc28gY3JlYXRlIGN1c3RvbSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICB8IC8vIHdpdGggbXVsdGlwbGUgcGFyYW1ldGVyczpcbiAgICAgICAgICAgICB8IHBhcGVyLmN1c3RvbUF0dHJpYnV0ZXMuaHNiID0gZnVuY3Rpb24gKGgsIHMsIGIpIHtcbiAgICAgICAgICAgICB8ICAgICByZXR1cm4ge2ZpbGw6IFwiaHNiKFwiICsgW2gsIHMsIGJdLmpvaW4oXCIsXCIpICsgXCIpXCJ9O1xuICAgICAgICAgICAgIHwgfTtcbiAgICAgICAgICAgICB8IGMuYXR0cih7aHNiOiBcIjAuNSAuOCAxXCJ9KTtcbiAgICAgICAgICAgICB8IGMuYW5pbWF0ZSh7aHNiOiBbMSwgMCwgMC41XX0sIDFlMyk7XG4gICAgICAgICAgICBcXCovXG4gICAgICAgICAgICB0aGlzLmNhID0gdGhpcy5jdXN0b21BdHRyaWJ1dGVzID0ge307XG4gICAgICAgIH0sXG4gICAgICAgIHBhcGVycHJvdG8sXG4gICAgICAgIGFwcGVuZENoaWxkID0gXCJhcHBlbmRDaGlsZFwiLFxuICAgICAgICBhcHBseSA9IFwiYXBwbHlcIixcbiAgICAgICAgY29uY2F0ID0gXCJjb25jYXRcIixcbiAgICAgICAgc3VwcG9ydHNUb3VjaCA9ICgnb250b3VjaHN0YXJ0JyBpbiBnLndpbikgfHwgZy53aW4uRG9jdW1lbnRUb3VjaCAmJiBnLmRvYyBpbnN0YW5jZW9mIERvY3VtZW50VG91Y2gsIC8vdGFrZW4gZnJvbSBNb2Rlcm5penIgdG91Y2ggdGVzdFxuICAgICAgICBFID0gXCJcIixcbiAgICAgICAgUyA9IFwiIFwiLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIHNwbGl0ID0gXCJzcGxpdFwiLFxuICAgICAgICBldmVudHMgPSBcImNsaWNrIGRibGNsaWNrIG1vdXNlZG93biBtb3VzZW1vdmUgbW91c2VvdXQgbW91c2VvdmVyIG1vdXNldXAgdG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWxcIltzcGxpdF0oUyksXG4gICAgICAgIHRvdWNoTWFwID0ge1xuICAgICAgICAgICAgbW91c2Vkb3duOiBcInRvdWNoc3RhcnRcIixcbiAgICAgICAgICAgIG1vdXNlbW92ZTogXCJ0b3VjaG1vdmVcIixcbiAgICAgICAgICAgIG1vdXNldXA6IFwidG91Y2hlbmRcIlxuICAgICAgICB9LFxuICAgICAgICBsb3dlckNhc2UgPSBTdHIucHJvdG90eXBlLnRvTG93ZXJDYXNlLFxuICAgICAgICBtYXRoID0gTWF0aCxcbiAgICAgICAgbW1heCA9IG1hdGgubWF4LFxuICAgICAgICBtbWluID0gbWF0aC5taW4sXG4gICAgICAgIGFicyA9IG1hdGguYWJzLFxuICAgICAgICBwb3cgPSBtYXRoLnBvdyxcbiAgICAgICAgUEkgPSBtYXRoLlBJLFxuICAgICAgICBudSA9IFwibnVtYmVyXCIsXG4gICAgICAgIHN0cmluZyA9IFwic3RyaW5nXCIsXG4gICAgICAgIGFycmF5ID0gXCJhcnJheVwiLFxuICAgICAgICB0b1N0cmluZyA9IFwidG9TdHJpbmdcIixcbiAgICAgICAgZmlsbFN0cmluZyA9IFwiZmlsbFwiLFxuICAgICAgICBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgIHBhcGVyID0ge30sXG4gICAgICAgIHB1c2ggPSBcInB1c2hcIixcbiAgICAgICAgSVNVUkwgPSBSLl9JU1VSTCA9IC9edXJsXFwoWydcIl0/KC4rPylbJ1wiXT9cXCkkL2ksXG4gICAgICAgIGNvbG91clJlZ0V4cCA9IC9eXFxzKigoI1thLWZcXGRdezZ9KXwoI1thLWZcXGRdezN9KXxyZ2JhP1xcKFxccyooW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyU/KD86XFxzKixcXHMqW1xcZFxcLl0rJT8pPylcXHMqXFwpfGhzYmE/XFwoXFxzKihbXFxkXFwuXSsoPzpkZWd8XFx4YjB8JSk/XFxzKixcXHMqW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSsoPzolP1xccyosXFxzKltcXGRcXC5dKyk/KSU/XFxzKlxcKXxoc2xhP1xcKFxccyooW1xcZFxcLl0rKD86ZGVnfFxceGIwfCUpP1xccyosXFxzKltcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rKD86JT9cXHMqLFxccypbXFxkXFwuXSspPyklP1xccypcXCkpXFxzKiQvaSxcbiAgICAgICAgaXNuYW4gPSB7XCJOYU5cIjogMSwgXCJJbmZpbml0eVwiOiAxLCBcIi1JbmZpbml0eVwiOiAxfSxcbiAgICAgICAgYmV6aWVycmcgPSAvXig/OmN1YmljLSk/YmV6aWVyXFwoKFteLF0rKSwoW14sXSspLChbXixdKyksKFteXFwpXSspXFwpLyxcbiAgICAgICAgcm91bmQgPSBtYXRoLnJvdW5kLFxuICAgICAgICBzZXRBdHRyaWJ1dGUgPSBcInNldEF0dHJpYnV0ZVwiLFxuICAgICAgICB0b0Zsb2F0ID0gcGFyc2VGbG9hdCxcbiAgICAgICAgdG9JbnQgPSBwYXJzZUludCxcbiAgICAgICAgdXBwZXJDYXNlID0gU3RyLnByb3RvdHlwZS50b1VwcGVyQ2FzZSxcbiAgICAgICAgYXZhaWxhYmxlQXR0cnMgPSBSLl9hdmFpbGFibGVBdHRycyA9IHtcbiAgICAgICAgICAgIFwiYXJyb3ctZW5kXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgXCJhcnJvdy1zdGFydFwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIGJsdXI6IDAsXG4gICAgICAgICAgICBcImNsaXAtcmVjdFwiOiBcIjAgMCAxZTkgMWU5XCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwiZGVmYXVsdFwiLFxuICAgICAgICAgICAgY3g6IDAsXG4gICAgICAgICAgICBjeTogMCxcbiAgICAgICAgICAgIGZpbGw6IFwiI2ZmZlwiLFxuICAgICAgICAgICAgXCJmaWxsLW9wYWNpdHlcIjogMSxcbiAgICAgICAgICAgIGZvbnQ6ICcxMHB4IFwiQXJpYWxcIicsXG4gICAgICAgICAgICBcImZvbnQtZmFtaWx5XCI6ICdcIkFyaWFsXCInLFxuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIxMFwiLFxuICAgICAgICAgICAgXCJmb250LXN0eWxlXCI6IFwibm9ybWFsXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IDQwMCxcbiAgICAgICAgICAgIGdyYWRpZW50OiAwLFxuICAgICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICAgICAgaHJlZjogXCJodHRwOi8vcmFwaGFlbGpzLmNvbS9cIixcbiAgICAgICAgICAgIFwibGV0dGVyLXNwYWNpbmdcIjogMCxcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICBwYXRoOiBcIk0wLDBcIixcbiAgICAgICAgICAgIHI6IDAsXG4gICAgICAgICAgICByeDogMCxcbiAgICAgICAgICAgIHJ5OiAwLFxuICAgICAgICAgICAgc3JjOiBcIlwiLFxuICAgICAgICAgICAgc3Ryb2tlOiBcIiMwMDBcIixcbiAgICAgICAgICAgIFwic3Ryb2tlLWRhc2hhcnJheVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJzdHJva2UtbGluZWNhcFwiOiBcImJ1dHRcIixcbiAgICAgICAgICAgIFwic3Ryb2tlLWxpbmVqb2luXCI6IFwiYnV0dFwiLFxuICAgICAgICAgICAgXCJzdHJva2UtbWl0ZXJsaW1pdFwiOiAwLFxuICAgICAgICAgICAgXCJzdHJva2Utb3BhY2l0eVwiOiAxLFxuICAgICAgICAgICAgXCJzdHJva2Utd2lkdGhcIjogMSxcbiAgICAgICAgICAgIHRhcmdldDogXCJfYmxhbmtcIixcbiAgICAgICAgICAgIFwidGV4dC1hbmNob3JcIjogXCJtaWRkbGVcIixcbiAgICAgICAgICAgIHRpdGxlOiBcIlJhcGhhZWxcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJcIixcbiAgICAgICAgICAgIHdpZHRoOiAwLFxuICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgIHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgYXZhaWxhYmxlQW5pbUF0dHJzID0gUi5fYXZhaWxhYmxlQW5pbUF0dHJzID0ge1xuICAgICAgICAgICAgYmx1cjogbnUsXG4gICAgICAgICAgICBcImNsaXAtcmVjdFwiOiBcImNzdlwiLFxuICAgICAgICAgICAgY3g6IG51LFxuICAgICAgICAgICAgY3k6IG51LFxuICAgICAgICAgICAgZmlsbDogXCJjb2xvdXJcIixcbiAgICAgICAgICAgIFwiZmlsbC1vcGFjaXR5XCI6IG51LFxuICAgICAgICAgICAgXCJmb250LXNpemVcIjogbnUsXG4gICAgICAgICAgICBoZWlnaHQ6IG51LFxuICAgICAgICAgICAgb3BhY2l0eTogbnUsXG4gICAgICAgICAgICBwYXRoOiBcInBhdGhcIixcbiAgICAgICAgICAgIHI6IG51LFxuICAgICAgICAgICAgcng6IG51LFxuICAgICAgICAgICAgcnk6IG51LFxuICAgICAgICAgICAgc3Ryb2tlOiBcImNvbG91clwiLFxuICAgICAgICAgICAgXCJzdHJva2Utb3BhY2l0eVwiOiBudSxcbiAgICAgICAgICAgIFwic3Ryb2tlLXdpZHRoXCI6IG51LFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgd2lkdGg6IG51LFxuICAgICAgICAgICAgeDogbnUsXG4gICAgICAgICAgICB5OiBudVxuICAgICAgICB9LFxuICAgICAgICB3aGl0ZXNwYWNlID0gL1tcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0vZyxcbiAgICAgICAgY29tbWFTcGFjZXMgPSAvW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSosW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSovLFxuICAgICAgICBoc3JnID0ge2hzOiAxLCByZzogMX0sXG4gICAgICAgIHAycyA9IC8sPyhbYWNobG1xcnN0dnh6XSksPy9naSxcbiAgICAgICAgcGF0aENvbW1hbmQgPSAvKFthY2hsbXJxc3R2el0pW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5LF0qKCgtP1xcZCpcXC4/XFxkKig/OmVbXFwtK10/XFxkKyk/W1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSosP1tcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qKSspL2lnLFxuICAgICAgICB0Q29tbWFuZCA9IC8oW3JzdG1dKVtcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOSxdKigoLT9cXGQqXFwuP1xcZCooPzplW1xcLStdP1xcZCspP1tcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qLD9bXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKikrKS9pZyxcbiAgICAgICAgcGF0aFZhbHVlcyA9IC8oLT9cXGQqXFwuP1xcZCooPzplW1xcLStdP1xcZCspPylbXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKiw/W1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSovaWcsXG4gICAgICAgIHJhZGlhbF9ncmFkaWVudCA9IFIuX3JhZGlhbF9ncmFkaWVudCA9IC9ecig/OlxcKChbXixdKz8pW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSosW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSooW15cXCldKz8pXFwpKT8vLFxuICAgICAgICBlbGRhdGEgPSB7fSxcbiAgICAgICAgc29ydEJ5S2V5ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLmtleSAtIGIua2V5O1xuICAgICAgICB9LFxuICAgICAgICBzb3J0QnlOdW1iZXIgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIHRvRmxvYXQoYSkgLSB0b0Zsb2F0KGIpO1xuICAgICAgICB9LFxuICAgICAgICBmdW4gPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgcGlwZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSxcbiAgICAgICAgcmVjdFBhdGggPSBSLl9yZWN0UGF0aCA9IGZ1bmN0aW9uICh4LCB5LCB3LCBoLCByKSB7XG4gICAgICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgICAgIHJldHVybiBbW1wiTVwiLCB4ICsgciwgeV0sIFtcImxcIiwgdyAtIHIgKiAyLCAwXSwgW1wiYVwiLCByLCByLCAwLCAwLCAxLCByLCByXSwgW1wibFwiLCAwLCBoIC0gciAqIDJdLCBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIC1yLCByXSwgW1wibFwiLCByICogMiAtIHcsIDBdLCBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIC1yLCAtcl0sIFtcImxcIiwgMCwgciAqIDIgLSBoXSwgW1wiYVwiLCByLCByLCAwLCAwLCAxLCByLCAtcl0sIFtcInpcIl1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtbXCJNXCIsIHgsIHldLCBbXCJsXCIsIHcsIDBdLCBbXCJsXCIsIDAsIGhdLCBbXCJsXCIsIC13LCAwXSwgW1wielwiXV07XG4gICAgICAgIH0sXG4gICAgICAgIGVsbGlwc2VQYXRoID0gZnVuY3Rpb24gKHgsIHksIHJ4LCByeSkge1xuICAgICAgICAgICAgaWYgKHJ5ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByeSA9IHJ4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtbXCJNXCIsIHgsIHldLCBbXCJtXCIsIDAsIC1yeV0sIFtcImFcIiwgcngsIHJ5LCAwLCAxLCAxLCAwLCAyICogcnldLCBbXCJhXCIsIHJ4LCByeSwgMCwgMSwgMSwgMCwgLTIgKiByeV0sIFtcInpcIl1dO1xuICAgICAgICB9LFxuICAgICAgICBnZXRQYXRoID0gUi5fZ2V0UGF0aCA9IHtcbiAgICAgICAgICAgIHBhdGg6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5hdHRyKFwicGF0aFwiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaXJjbGU6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gZWwuYXR0cnM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsbGlwc2VQYXRoKGEuY3gsIGEuY3ksIGEucik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZWxsaXBzZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBlbC5hdHRycztcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxsaXBzZVBhdGgoYS5jeCwgYS5jeSwgYS5yeCwgYS5yeSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVjdDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBlbC5hdHRycztcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjdFBhdGgoYS54LCBhLnksIGEud2lkdGgsIGEuaGVpZ2h0LCBhLnIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltYWdlOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGVsLmF0dHJzO1xuICAgICAgICAgICAgICAgIHJldHVybiByZWN0UGF0aChhLngsIGEueSwgYS53aWR0aCwgYS5oZWlnaHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRleHQ6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBiYm94ID0gZWwuX2dldEJCb3goKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjdFBhdGgoYmJveC54LCBiYm94LnksIGJib3gud2lkdGgsIGJib3guaGVpZ2h0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQgOiBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICAgIHZhciBiYm94ID0gZWwuX2dldEJCb3goKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjdFBhdGgoYmJveC54LCBiYm94LnksIGJib3gud2lkdGgsIGJib3guaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBSYXBoYWVsLm1hcFBhdGhcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFRyYW5zZm9ybSB0aGUgcGF0aCBzdHJpbmcgd2l0aCBnaXZlbiBtYXRyaXguXG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAgICAgLSBtYXRyaXggKG9iamVjdCkgc2VlIEBNYXRyaXhcbiAgICAgICAgID0gKHN0cmluZykgdHJhbnNmb3JtZWQgcGF0aCBzdHJpbmdcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXBQYXRoID0gUi5tYXBQYXRoID0gZnVuY3Rpb24gKHBhdGgsIG1hdHJpeCkge1xuICAgICAgICAgICAgaWYgKCFtYXRyaXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB4LCB5LCBpLCBqLCBpaSwgamosIHBhdGhpO1xuICAgICAgICAgICAgcGF0aCA9IHBhdGgyY3VydmUocGF0aCk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhdGhpID0gcGF0aFtpXTtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBqaiA9IHBhdGhpLmxlbmd0aDsgaiA8IGpqOyBqICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9IG1hdHJpeC54KHBhdGhpW2pdLCBwYXRoaVtqICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICB5ID0gbWF0cml4LnkocGF0aGlbal0sIHBhdGhpW2ogKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIHBhdGhpW2pdID0geDtcbiAgICAgICAgICAgICAgICAgICAgcGF0aGlbaiArIDFdID0geTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgfTtcblxuICAgIFIuX2cgPSBnO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnR5cGVcbiAgICAgWyBwcm9wZXJ0eSAoc3RyaW5nKSBdXG4gICAgICoqXG4gICAgICogQ2FuIGJlIOKAnFNWR+KAnSwg4oCcVk1M4oCdIG9yIGVtcHR5LCBkZXBlbmRpbmcgb24gYnJvd3NlciBzdXBwb3J0LlxuICAgIFxcKi9cbiAgICBSLnR5cGUgPSAoZy53aW4uU1ZHQW5nbGUgfHwgZy5kb2MuaW1wbGVtZW50YXRpb24uaGFzRmVhdHVyZShcImh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjQmFzaWNTdHJ1Y3R1cmVcIiwgXCIxLjFcIikgPyBcIlNWR1wiIDogXCJWTUxcIik7XG4gICAgaWYgKFIudHlwZSA9PSBcIlZNTFwiKSB7XG4gICAgICAgIHZhciBkID0gZy5kb2MuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcbiAgICAgICAgICAgIGI7XG4gICAgICAgIGQuaW5uZXJIVE1MID0gJzx2OnNoYXBlIGFkaj1cIjFcIi8+JztcbiAgICAgICAgYiA9IGQuZmlyc3RDaGlsZDtcbiAgICAgICAgYi5zdHlsZS5iZWhhdmlvciA9IFwidXJsKCNkZWZhdWx0I1ZNTClcIjtcbiAgICAgICAgaWYgKCEoYiAmJiB0eXBlb2YgYi5hZGogPT0gXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgIHJldHVybiAoUi50eXBlID0gRSk7XG4gICAgICAgIH1cbiAgICAgICAgZCA9IG51bGw7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnN2Z1xuICAgICBbIHByb3BlcnR5IChib29sZWFuKSBdXG4gICAgICoqXG4gICAgICogYHRydWVgIGlmIGJyb3dzZXIgc3VwcG9ydHMgU1ZHLlxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC52bWxcbiAgICAgWyBwcm9wZXJ0eSAoYm9vbGVhbikgXVxuICAgICAqKlxuICAgICAqIGB0cnVlYCBpZiBicm93c2VyIHN1cHBvcnRzIFZNTC5cbiAgICBcXCovXG4gICAgUi5zdmcgPSAhKFIudm1sID0gUi50eXBlID09IFwiVk1MXCIpO1xuICAgIFIuX1BhcGVyID0gUGFwZXI7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZm5cbiAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICoqXG4gICAgICogWW91IGNhbiBhZGQgeW91ciBvd24gbWV0aG9kIHRvIHRoZSBjYW52YXMuIEZvciBleGFtcGxlIGlmIHlvdSB3YW50IHRvIGRyYXcgYSBwaWUgY2hhcnQsXG4gICAgICogeW91IGNhbiBjcmVhdGUgeW91ciBvd24gcGllIGNoYXJ0IGZ1bmN0aW9uIGFuZCBzaGlwIGl0IGFzIGEgUmFwaGHDq2wgcGx1Z2luLiBUbyBkbyB0aGlzXG4gICAgICogeW91IG5lZWQgdG8gZXh0ZW5kIHRoZSBgUmFwaGFlbC5mbmAgb2JqZWN0LiBZb3Ugc2hvdWxkIG1vZGlmeSB0aGUgYGZuYCBvYmplY3QgYmVmb3JlIGFcbiAgICAgKiBSYXBoYcOrbCBpbnN0YW5jZSBpcyBjcmVhdGVkLCBvdGhlcndpc2UgaXQgd2lsbCB0YWtlIG5vIGVmZmVjdC4gUGxlYXNlIG5vdGUgdGhhdCB0aGVcbiAgICAgKiBhYmlsaXR5IGZvciBuYW1lc3BhY2VkIHBsdWdpbnMgd2FzIHJlbW92ZWQgaW4gUmFwaGFlbCAyLjAuIEl0IGlzIHVwIHRvIHRoZSBwbHVnaW4gdG9cbiAgICAgKiBlbnN1cmUgYW55IG5hbWVzcGFjaW5nIGVuc3VyZXMgcHJvcGVyIGNvbnRleHQuXG4gICAgID4gVXNhZ2VcbiAgICAgfCBSYXBoYWVsLmZuLmFycm93ID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyLCBzaXplKSB7XG4gICAgIHwgICAgIHJldHVybiB0aGlzLnBhdGgoIC4uLiApO1xuICAgICB8IH07XG4gICAgIHwgLy8gb3IgY3JlYXRlIG5hbWVzcGFjZVxuICAgICB8IFJhcGhhZWwuZm4ubXlzdHVmZiA9IHtcbiAgICAgfCAgICAgYXJyb3c6IGZ1bmN0aW9uICgpIHvigKZ9LFxuICAgICB8ICAgICBzdGFyOiBmdW5jdGlvbiAoKSB74oCmfSxcbiAgICAgfCAgICAgLy8gZXRj4oCmXG4gICAgIHwgfTtcbiAgICAgfCB2YXIgcGFwZXIgPSBSYXBoYWVsKDEwLCAxMCwgNjMwLCA0ODApO1xuICAgICB8IC8vIHRoZW4gdXNlIGl0XG4gICAgIHwgcGFwZXIuYXJyb3coMTAsIDEwLCAzMCwgMzAsIDUpLmF0dHIoe2ZpbGw6IFwiI2YwMFwifSk7XG4gICAgIHwgcGFwZXIubXlzdHVmZi5hcnJvdygpO1xuICAgICB8IHBhcGVyLm15c3R1ZmYuc3RhcigpO1xuICAgIFxcKi9cbiAgICBSLmZuID0gcGFwZXJwcm90byA9IFBhcGVyLnByb3RvdHlwZSA9IFIucHJvdG90eXBlO1xuICAgIFIuX2lkID0gMDtcbiAgICBSLl9vaWQgPSAwO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmlzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBIYW5kZnVsIG9mIHJlcGxhY2VtZW50cyBmb3IgYHR5cGVvZmAgb3BlcmF0b3IuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIG8gKOKApikgYW55IG9iamVjdCBvciBwcmltaXRpdmVcbiAgICAgLSB0eXBlIChzdHJpbmcpIG5hbWUgb2YgdGhlIHR5cGUsIGkuZS4g4oCcc3RyaW5n4oCdLCDigJxmdW5jdGlvbuKAnSwg4oCcbnVtYmVy4oCdLCBldGMuXG4gICAgID0gKGJvb2xlYW4pIGlzIGdpdmVuIHZhbHVlIGlzIG9mIGdpdmVuIHR5cGVcbiAgICBcXCovXG4gICAgUi5pcyA9IGZ1bmN0aW9uIChvLCB0eXBlKSB7XG4gICAgICAgIHR5cGUgPSBsb3dlckNhc2UuY2FsbCh0eXBlKTtcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJmaW5pdGVcIikge1xuICAgICAgICAgICAgcmV0dXJuICFpc25hbltoYXNdKCtvKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PSBcImFycmF5XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBvIGluc3RhbmNlb2YgQXJyYXk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICAodHlwZSA9PSBcIm51bGxcIiAmJiBvID09PSBudWxsKSB8fFxuICAgICAgICAgICAgICAgICh0eXBlID09IHR5cGVvZiBvICYmIG8gIT09IG51bGwpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGUgPT0gXCJvYmplY3RcIiAmJiBvID09PSBPYmplY3QobykpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGUgPT0gXCJhcnJheVwiICYmIEFycmF5LmlzQXJyYXkgJiYgQXJyYXkuaXNBcnJheShvKSkgfHxcbiAgICAgICAgICAgICAgICBvYmplY3RUb1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpID09IHR5cGU7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNsb25lKG9iaikge1xuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PSBcImZ1bmN0aW9uXCIgfHwgT2JqZWN0KG9iaikgIT09IG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzID0gbmV3IG9iai5jb25zdHJ1Y3RvcjtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKG9ialtoYXNdKGtleSkpIHtcbiAgICAgICAgICAgIHJlc1trZXldID0gY2xvbmUob2JqW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuYW5nbGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW5nbGUgYmV0d2VlbiB0d28gb3IgdGhyZWUgcG9pbnRzXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHgxIChudW1iZXIpIHggY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAgICAgLSB5MSAobnVtYmVyKSB5IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gICAgIC0geDIgKG51bWJlcikgeCBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiAgICAgLSB5MiAobnVtYmVyKSB5IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuICAgICAtIHgzIChudW1iZXIpICNvcHRpb25hbCB4IGNvb3JkIG9mIHRoaXJkIHBvaW50XG4gICAgIC0geTMgKG51bWJlcikgI29wdGlvbmFsIHkgY29vcmQgb2YgdGhpcmQgcG9pbnRcbiAgICAgPSAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzLlxuICAgIFxcKi9cbiAgICBSLmFuZ2xlID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMpIHtcbiAgICAgICAgaWYgKHgzID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciB4ID0geDEgLSB4MixcbiAgICAgICAgICAgICAgICB5ID0geTEgLSB5MjtcbiAgICAgICAgICAgIGlmICgheCAmJiAheSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICgxODAgKyBtYXRoLmF0YW4yKC15LCAteCkgKiAxODAgLyBQSSArIDM2MCkgJSAzNjA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUi5hbmdsZSh4MSwgeTEsIHgzLCB5MykgLSBSLmFuZ2xlKHgyLCB5MiwgeDMsIHkzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucmFkXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBUcmFuc2Zvcm0gYW5nbGUgdG8gcmFkaWFuc1xuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBkZWcgKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuICAgICA9IChudW1iZXIpIGFuZ2xlIGluIHJhZGlhbnMuXG4gICAgXFwqL1xuICAgIFIucmFkID0gZnVuY3Rpb24gKGRlZykge1xuICAgICAgICByZXR1cm4gZGVnICUgMzYwICogUEkgLyAxODA7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5kZWdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFRyYW5zZm9ybSBhbmdsZSB0byBkZWdyZWVzXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHJhZCAobnVtYmVyKSBhbmdsZSBpbiByYWRpYW5zXG4gICAgID0gKG51bWJlcikgYW5nbGUgaW4gZGVncmVlcy5cbiAgICBcXCovXG4gICAgUi5kZWcgPSBmdW5jdGlvbiAocmFkKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kICgocmFkICogMTgwIC8gUEklIDM2MCkqIDEwMDApIC8gMTAwMDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnNuYXBUb1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU25hcHMgZ2l2ZW4gdmFsdWUgdG8gZ2l2ZW4gZ3JpZC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gdmFsdWVzIChhcnJheXxudW1iZXIpIGdpdmVuIGFycmF5IG9mIHZhbHVlcyBvciBzdGVwIG9mIHRoZSBncmlkXG4gICAgIC0gdmFsdWUgKG51bWJlcikgdmFsdWUgdG8gYWRqdXN0XG4gICAgIC0gdG9sZXJhbmNlIChudW1iZXIpICNvcHRpb25hbCB0b2xlcmFuY2UgZm9yIHNuYXBwaW5nLiBEZWZhdWx0IGlzIGAxMGAuXG4gICAgID0gKG51bWJlcikgYWRqdXN0ZWQgdmFsdWUuXG4gICAgXFwqL1xuICAgIFIuc25hcFRvID0gZnVuY3Rpb24gKHZhbHVlcywgdmFsdWUsIHRvbGVyYW5jZSkge1xuICAgICAgICB0b2xlcmFuY2UgPSBSLmlzKHRvbGVyYW5jZSwgXCJmaW5pdGVcIikgPyB0b2xlcmFuY2UgOiAxMDtcbiAgICAgICAgaWYgKFIuaXModmFsdWVzLCBhcnJheSkpIHtcbiAgICAgICAgICAgIHZhciBpID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIGlmIChhYnModmFsdWVzW2ldIC0gdmFsdWUpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSArdmFsdWVzO1xuICAgICAgICAgICAgdmFyIHJlbSA9IHZhbHVlICUgdmFsdWVzO1xuICAgICAgICAgICAgaWYgKHJlbSA8IHRvbGVyYW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSAtIHJlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZW0gPiB2YWx1ZXMgLSB0b2xlcmFuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUgLSByZW0gKyB2YWx1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5jcmVhdGVVVUlEXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIFJGQzQxMjIsIHZlcnNpb24gNCBJRFxuICAgIFxcKi9cbiAgICB2YXIgY3JlYXRlVVVJRCA9IFIuY3JlYXRlVVVJRCA9IChmdW5jdGlvbiAodXVpZFJlZ0V4LCB1dWlkUmVwbGFjZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBcInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiLnJlcGxhY2UodXVpZFJlZ0V4LCB1dWlkUmVwbGFjZXIpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIH07XG4gICAgfSkoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIHIgPSBtYXRoLnJhbmRvbSgpICogMTYgfCAwLFxuICAgICAgICAgICAgdiA9IGMgPT0gXCJ4XCIgPyByIDogKHIgJiAzIHwgOCk7XG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcblxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnNldFdpbmRvd1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXNlZCB3aGVuIHlvdSBuZWVkIHRvIGRyYXcgaW4gYCZsdDtpZnJhbWU+YC4gU3dpdGNoZWQgd2luZG93IHRvIHRoZSBpZnJhbWUgb25lLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBuZXd3aW4gKHdpbmRvdykgbmV3IHdpbmRvdyBvYmplY3RcbiAgICBcXCovXG4gICAgUi5zZXRXaW5kb3cgPSBmdW5jdGlvbiAobmV3d2luKSB7XG4gICAgICAgIGV2ZShcInJhcGhhZWwuc2V0V2luZG93XCIsIFIsIGcud2luLCBuZXd3aW4pO1xuICAgICAgICBnLndpbiA9IG5ld3dpbjtcbiAgICAgICAgZy5kb2MgPSBnLndpbi5kb2N1bWVudDtcbiAgICAgICAgaWYgKFIuX2VuZ2luZS5pbml0V2luKSB7XG4gICAgICAgICAgICBSLl9lbmdpbmUuaW5pdFdpbihnLndpbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciB0b0hleCA9IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICBpZiAoUi52bWwpIHtcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9kZWFuLmVkd2FyZHMubmFtZS93ZWJsb2cvMjAwOS8xMC9jb252ZXJ0LWFueS1jb2xvdXItdmFsdWUtdG8taGV4LWluLW1zaWUvXG4gICAgICAgICAgICB2YXIgdHJpbSA9IC9eXFxzK3xcXHMrJC9nO1xuICAgICAgICAgICAgdmFyIGJvZDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIGRvY3VtID0gbmV3IEFjdGl2ZVhPYmplY3QoXCJodG1sZmlsZVwiKTtcbiAgICAgICAgICAgICAgICBkb2N1bS53cml0ZShcIjxib2R5PlwiKTtcbiAgICAgICAgICAgICAgICBkb2N1bS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIGJvZCA9IGRvY3VtLmJvZHk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICBib2QgPSBjcmVhdGVQb3B1cCgpLmRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBib2QuY3JlYXRlVGV4dFJhbmdlKCk7XG4gICAgICAgICAgICB0b0hleCA9IGNhY2hlcihmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBib2Quc3R5bGUuY29sb3IgPSBTdHIoY29sb3IpLnJlcGxhY2UodHJpbSwgRSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHJhbmdlLnF1ZXJ5Q29tbWFuZFZhbHVlKFwiRm9yZUNvbG9yXCIpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICgodmFsdWUgJiAyNTUpIDw8IDE2KSB8ICh2YWx1ZSAmIDY1MjgwKSB8ICgodmFsdWUgJiAxNjcxMTY4MCkgPj4+IDE2KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiI1wiICsgKFwiMDAwMDAwXCIgKyB2YWx1ZS50b1N0cmluZygxNikpLnNsaWNlKC02KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGkgPSBnLmRvYy5jcmVhdGVFbGVtZW50KFwiaVwiKTtcbiAgICAgICAgICAgIGkudGl0bGUgPSBcIlJhcGhhXFx4ZWJsIENvbG91ciBQaWNrZXJcIjtcbiAgICAgICAgICAgIGkuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZy5kb2MuYm9keS5hcHBlbmRDaGlsZChpKTtcbiAgICAgICAgICAgIHRvSGV4ID0gY2FjaGVyKGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICAgICAgICAgIGkuc3R5bGUuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gZy5kb2MuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShpLCBFKS5nZXRQcm9wZXJ0eVZhbHVlKFwiY29sb3JcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9IZXgoY29sb3IpO1xuICAgIH0sXG4gICAgaHNidG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcImhzYihcIiArIFt0aGlzLmgsIHRoaXMucywgdGhpcy5iXSArIFwiKVwiO1xuICAgIH0sXG4gICAgaHNsdG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcImhzbChcIiArIFt0aGlzLmgsIHRoaXMucywgdGhpcy5sXSArIFwiKVwiO1xuICAgIH0sXG4gICAgcmdidG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhleDtcbiAgICB9LFxuICAgIHByZXBhcmVSR0IgPSBmdW5jdGlvbiAociwgZywgYikge1xuICAgICAgICBpZiAoZyA9PSBudWxsICYmIFIuaXMociwgXCJvYmplY3RcIikgJiYgXCJyXCIgaW4gciAmJiBcImdcIiBpbiByICYmIFwiYlwiIGluIHIpIHtcbiAgICAgICAgICAgIGIgPSByLmI7XG4gICAgICAgICAgICBnID0gci5nO1xuICAgICAgICAgICAgciA9IHIucjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZyA9PSBudWxsICYmIFIuaXMociwgc3RyaW5nKSkge1xuICAgICAgICAgICAgdmFyIGNsciA9IFIuZ2V0UkdCKHIpO1xuICAgICAgICAgICAgciA9IGNsci5yO1xuICAgICAgICAgICAgZyA9IGNsci5nO1xuICAgICAgICAgICAgYiA9IGNsci5iO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyID4gMSB8fCBnID4gMSB8fCBiID4gMSkge1xuICAgICAgICAgICAgciAvPSAyNTU7XG4gICAgICAgICAgICBnIC89IDI1NTtcbiAgICAgICAgICAgIGIgLz0gMjU1O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFtyLCBnLCBiXTtcbiAgICB9LFxuICAgIHBhY2thZ2VSR0IgPSBmdW5jdGlvbiAociwgZywgYiwgbykge1xuICAgICAgICByICo9IDI1NTtcbiAgICAgICAgZyAqPSAyNTU7XG4gICAgICAgIGIgKj0gMjU1O1xuICAgICAgICB2YXIgcmdiID0ge1xuICAgICAgICAgICAgcjogcixcbiAgICAgICAgICAgIGc6IGcsXG4gICAgICAgICAgICBiOiBiLFxuICAgICAgICAgICAgaGV4OiBSLnJnYihyLCBnLCBiKSxcbiAgICAgICAgICAgIHRvU3RyaW5nOiByZ2J0b1N0cmluZ1xuICAgICAgICB9O1xuICAgICAgICBSLmlzKG8sIFwiZmluaXRlXCIpICYmIChyZ2Iub3BhY2l0eSA9IG8pO1xuICAgICAgICByZXR1cm4gcmdiO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5jb2xvclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUGFyc2VzIHRoZSBjb2xvciBzdHJpbmcgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggYWxsIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGNvbG9yLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBjbHIgKHN0cmluZykgY29sb3Igc3RyaW5nIGluIG9uZSBvZiB0aGUgc3VwcG9ydGVkIGZvcm1hdHMgKHNlZSBAUmFwaGFlbC5nZXRSR0IpXG4gICAgID0gKG9iamVjdCkgQ29tYmluZWQgUkdCICYgSFNCIG9iamVjdCBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICByIChudW1iZXIpIHJlZCxcbiAgICAgbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiAgICAgbyAgICAgYiAobnVtYmVyKSBibHVlLFxuICAgICBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiLFxuICAgICBvICAgICBlcnJvciAoYm9vbGVhbikgYHRydWVgIGlmIHN0cmluZyBjYW7igJl0IGJlIHBhcnNlZCxcbiAgICAgbyAgICAgaCAobnVtYmVyKSBodWUsXG4gICAgIG8gICAgIHMgKG51bWJlcikgc2F0dXJhdGlvbixcbiAgICAgbyAgICAgdiAobnVtYmVyKSB2YWx1ZSAoYnJpZ2h0bmVzcyksXG4gICAgIG8gICAgIGwgKG51bWJlcikgbGlnaHRuZXNzXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLmNvbG9yID0gZnVuY3Rpb24gKGNscikge1xuICAgICAgICB2YXIgcmdiO1xuICAgICAgICBpZiAoUi5pcyhjbHIsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGNsciAmJiBcInNcIiBpbiBjbHIgJiYgXCJiXCIgaW4gY2xyKSB7XG4gICAgICAgICAgICByZ2IgPSBSLmhzYjJyZ2IoY2xyKTtcbiAgICAgICAgICAgIGNsci5yID0gcmdiLnI7XG4gICAgICAgICAgICBjbHIuZyA9IHJnYi5nO1xuICAgICAgICAgICAgY2xyLmIgPSByZ2IuYjtcbiAgICAgICAgICAgIGNsci5oZXggPSByZ2IuaGV4O1xuICAgICAgICB9IGVsc2UgaWYgKFIuaXMoY2xyLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBjbHIgJiYgXCJzXCIgaW4gY2xyICYmIFwibFwiIGluIGNscikge1xuICAgICAgICAgICAgcmdiID0gUi5oc2wycmdiKGNscik7XG4gICAgICAgICAgICBjbHIuciA9IHJnYi5yO1xuICAgICAgICAgICAgY2xyLmcgPSByZ2IuZztcbiAgICAgICAgICAgIGNsci5iID0gcmdiLmI7XG4gICAgICAgICAgICBjbHIuaGV4ID0gcmdiLmhleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChSLmlzKGNsciwgXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgICAgICBjbHIgPSBSLmdldFJHQihjbHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFIuaXMoY2xyLCBcIm9iamVjdFwiKSAmJiBcInJcIiBpbiBjbHIgJiYgXCJnXCIgaW4gY2xyICYmIFwiYlwiIGluIGNscikge1xuICAgICAgICAgICAgICAgIHJnYiA9IFIucmdiMmhzbChjbHIpO1xuICAgICAgICAgICAgICAgIGNsci5oID0gcmdiLmg7XG4gICAgICAgICAgICAgICAgY2xyLnMgPSByZ2IucztcbiAgICAgICAgICAgICAgICBjbHIubCA9IHJnYi5sO1xuICAgICAgICAgICAgICAgIHJnYiA9IFIucmdiMmhzYihjbHIpO1xuICAgICAgICAgICAgICAgIGNsci52ID0gcmdiLmI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsciA9IHtoZXg6IFwibm9uZVwifTtcbiAgICAgICAgICAgICAgICBjbHIuciA9IGNsci5nID0gY2xyLmIgPSBjbHIuaCA9IGNsci5zID0gY2xyLnYgPSBjbHIubCA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNsci50b1N0cmluZyA9IHJnYnRvU3RyaW5nO1xuICAgICAgICByZXR1cm4gY2xyO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaHNiMnJnYlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ29udmVydHMgSFNCIHZhbHVlcyB0byBSR0Igb2JqZWN0LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoIChudW1iZXIpIGh1ZVxuICAgICAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuICAgICAtIHYgKG51bWJlcikgdmFsdWUgb3IgYnJpZ2h0bmVzc1xuICAgICA9IChvYmplY3QpIFJHQiBvYmplY3QgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgciAobnVtYmVyKSByZWQsXG4gICAgIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gICAgIG8gICAgIGIgKG51bWJlcikgYmx1ZSxcbiAgICAgbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAolxuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5oc2IycmdiID0gZnVuY3Rpb24gKGgsIHMsIHYsIG8pIHtcbiAgICAgICAgaWYgKHRoaXMuaXMoaCwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gaCAmJiBcInNcIiBpbiBoICYmIFwiYlwiIGluIGgpIHtcbiAgICAgICAgICAgIHYgPSBoLmI7XG4gICAgICAgICAgICBzID0gaC5zO1xuICAgICAgICAgICAgbyA9IGgubztcbiAgICAgICAgICAgIGggPSBoLmg7XG4gICAgICAgIH1cbiAgICAgICAgaCAqPSAzNjA7XG4gICAgICAgIHZhciBSLCBHLCBCLCBYLCBDO1xuICAgICAgICBoID0gKGggJSAzNjApIC8gNjA7XG4gICAgICAgIEMgPSB2ICogcztcbiAgICAgICAgWCA9IEMgKiAoMSAtIGFicyhoICUgMiAtIDEpKTtcbiAgICAgICAgUiA9IEcgPSBCID0gdiAtIEM7XG5cbiAgICAgICAgaCA9IH5+aDtcbiAgICAgICAgUiArPSBbQywgWCwgMCwgMCwgWCwgQ11baF07XG4gICAgICAgIEcgKz0gW1gsIEMsIEMsIFgsIDAsIDBdW2hdO1xuICAgICAgICBCICs9IFswLCAwLCBYLCBDLCBDLCBYXVtoXTtcbiAgICAgICAgcmV0dXJuIHBhY2thZ2VSR0IoUiwgRywgQiwgbyk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5oc2wycmdiXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBIU0wgdmFsdWVzIHRvIFJHQiBvYmplY3QuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGggKG51bWJlcikgaHVlXG4gICAgIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gICAgIC0gbCAobnVtYmVyKSBsdW1pbm9zaXR5XG4gICAgID0gKG9iamVjdCkgUkdCIG9iamVjdCBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICByIChudW1iZXIpIHJlZCxcbiAgICAgbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiAgICAgbyAgICAgYiAobnVtYmVyKSBibHVlLFxuICAgICBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLmhzbDJyZ2IgPSBmdW5jdGlvbiAoaCwgcywgbCwgbykge1xuICAgICAgICBpZiAodGhpcy5pcyhoLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBoICYmIFwic1wiIGluIGggJiYgXCJsXCIgaW4gaCkge1xuICAgICAgICAgICAgbCA9IGgubDtcbiAgICAgICAgICAgIHMgPSBoLnM7XG4gICAgICAgICAgICBoID0gaC5oO1xuICAgICAgICB9XG4gICAgICAgIGlmIChoID4gMSB8fCBzID4gMSB8fCBsID4gMSkge1xuICAgICAgICAgICAgaCAvPSAzNjA7XG4gICAgICAgICAgICBzIC89IDEwMDtcbiAgICAgICAgICAgIGwgLz0gMTAwO1xuICAgICAgICB9XG4gICAgICAgIGggKj0gMzYwO1xuICAgICAgICB2YXIgUiwgRywgQiwgWCwgQztcbiAgICAgICAgaCA9IChoICUgMzYwKSAvIDYwO1xuICAgICAgICBDID0gMiAqIHMgKiAobCA8IC41ID8gbCA6IDEgLSBsKTtcbiAgICAgICAgWCA9IEMgKiAoMSAtIGFicyhoICUgMiAtIDEpKTtcbiAgICAgICAgUiA9IEcgPSBCID0gbCAtIEMgLyAyO1xuXG4gICAgICAgIGggPSB+fmg7XG4gICAgICAgIFIgKz0gW0MsIFgsIDAsIDAsIFgsIENdW2hdO1xuICAgICAgICBHICs9IFtYLCBDLCBDLCBYLCAwLCAwXVtoXTtcbiAgICAgICAgQiArPSBbMCwgMCwgWCwgQywgQywgWF1baF07XG4gICAgICAgIHJldHVybiBwYWNrYWdlUkdCKFIsIEcsIEIsIG8pO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucmdiMmhzYlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ29udmVydHMgUkdCIHZhbHVlcyB0byBIU0Igb2JqZWN0LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSByIChudW1iZXIpIHJlZFxuICAgICAtIGcgKG51bWJlcikgZ3JlZW5cbiAgICAgLSBiIChudW1iZXIpIGJsdWVcbiAgICAgPSAob2JqZWN0KSBIU0Igb2JqZWN0IGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIGggKG51bWJlcikgaHVlXG4gICAgIG8gICAgIHMgKG51bWJlcikgc2F0dXJhdGlvblxuICAgICBvICAgICBiIChudW1iZXIpIGJyaWdodG5lc3NcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIucmdiMmhzYiA9IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgICAgIGIgPSBwcmVwYXJlUkdCKHIsIGcsIGIpO1xuICAgICAgICByID0gYlswXTtcbiAgICAgICAgZyA9IGJbMV07XG4gICAgICAgIGIgPSBiWzJdO1xuXG4gICAgICAgIHZhciBILCBTLCBWLCBDO1xuICAgICAgICBWID0gbW1heChyLCBnLCBiKTtcbiAgICAgICAgQyA9IFYgLSBtbWluKHIsIGcsIGIpO1xuICAgICAgICBIID0gKEMgPT0gMCA/IG51bGwgOlxuICAgICAgICAgICAgIFYgPT0gciA/IChnIC0gYikgLyBDIDpcbiAgICAgICAgICAgICBWID09IGcgPyAoYiAtIHIpIC8gQyArIDIgOlxuICAgICAgICAgICAgICAgICAgICAgIChyIC0gZykgLyBDICsgNFxuICAgICAgICAgICAgKTtcbiAgICAgICAgSCA9ICgoSCArIDM2MCkgJSA2KSAqIDYwIC8gMzYwO1xuICAgICAgICBTID0gQyA9PSAwID8gMCA6IEMgLyBWO1xuICAgICAgICByZXR1cm4ge2g6IEgsIHM6IFMsIGI6IFYsIHRvU3RyaW5nOiBoc2J0b1N0cmluZ307XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5yZ2IyaHNsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBSR0IgdmFsdWVzIHRvIEhTTCBvYmplY3QuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHIgKG51bWJlcikgcmVkXG4gICAgIC0gZyAobnVtYmVyKSBncmVlblxuICAgICAtIGIgKG51bWJlcikgYmx1ZVxuICAgICA9IChvYmplY3QpIEhTTCBvYmplY3QgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgaCAobnVtYmVyKSBodWVcbiAgICAgbyAgICAgcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gICAgIG8gICAgIGwgKG51bWJlcikgbHVtaW5vc2l0eVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5yZ2IyaHNsID0gZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICAgICAgYiA9IHByZXBhcmVSR0IociwgZywgYik7XG4gICAgICAgIHIgPSBiWzBdO1xuICAgICAgICBnID0gYlsxXTtcbiAgICAgICAgYiA9IGJbMl07XG5cbiAgICAgICAgdmFyIEgsIFMsIEwsIE0sIG0sIEM7XG4gICAgICAgIE0gPSBtbWF4KHIsIGcsIGIpO1xuICAgICAgICBtID0gbW1pbihyLCBnLCBiKTtcbiAgICAgICAgQyA9IE0gLSBtO1xuICAgICAgICBIID0gKEMgPT0gMCA/IG51bGwgOlxuICAgICAgICAgICAgIE0gPT0gciA/IChnIC0gYikgLyBDIDpcbiAgICAgICAgICAgICBNID09IGcgPyAoYiAtIHIpIC8gQyArIDIgOlxuICAgICAgICAgICAgICAgICAgICAgIChyIC0gZykgLyBDICsgNCk7XG4gICAgICAgIEggPSAoKEggKyAzNjApICUgNikgKiA2MCAvIDM2MDtcbiAgICAgICAgTCA9IChNICsgbSkgLyAyO1xuICAgICAgICBTID0gKEMgPT0gMCA/IDAgOlxuICAgICAgICAgICAgIEwgPCAuNSA/IEMgLyAoMiAqIEwpIDpcbiAgICAgICAgICAgICAgICAgICAgICBDIC8gKDIgLSAyICogTCkpO1xuICAgICAgICByZXR1cm4ge2g6IEgsIHM6IFMsIGw6IEwsIHRvU3RyaW5nOiBoc2x0b1N0cmluZ307XG4gICAgfTtcbiAgICBSLl9wYXRoMnN0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuam9pbihcIixcIikucmVwbGFjZShwMnMsIFwiJDFcIik7XG4gICAgfTtcbiAgICBmdW5jdGlvbiByZXB1c2goYXJyYXksIGl0ZW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXJyYXkubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXkucHVzaChhcnJheS5zcGxpY2UoaSwgMSlbMF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNhY2hlcihmLCBzY29wZSwgcG9zdHByb2Nlc3Nvcikge1xuICAgICAgICBmdW5jdGlvbiBuZXdmKCkge1xuICAgICAgICAgICAgdmFyIGFyZyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCksXG4gICAgICAgICAgICAgICAgYXJncyA9IGFyZy5qb2luKFwiXFx1MjQwMFwiKSxcbiAgICAgICAgICAgICAgICBjYWNoZSA9IG5ld2YuY2FjaGUgPSBuZXdmLmNhY2hlIHx8IHt9LFxuICAgICAgICAgICAgICAgIGNvdW50ID0gbmV3Zi5jb3VudCA9IG5ld2YuY291bnQgfHwgW107XG4gICAgICAgICAgICBpZiAoY2FjaGVbaGFzXShhcmdzKSkge1xuICAgICAgICAgICAgICAgIHJlcHVzaChjb3VudCwgYXJncyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzb3IgPyBwb3N0cHJvY2Vzc29yKGNhY2hlW2FyZ3NdKSA6IGNhY2hlW2FyZ3NdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY291bnQubGVuZ3RoID49IDFlMyAmJiBkZWxldGUgY2FjaGVbY291bnQuc2hpZnQoKV07XG4gICAgICAgICAgICBjb3VudC5wdXNoKGFyZ3MpO1xuICAgICAgICAgICAgY2FjaGVbYXJnc10gPSBmW2FwcGx5XShzY29wZSwgYXJnKTtcbiAgICAgICAgICAgIHJldHVybiBwb3N0cHJvY2Vzc29yID8gcG9zdHByb2Nlc3NvcihjYWNoZVthcmdzXSkgOiBjYWNoZVthcmdzXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3ZjtcbiAgICB9XG5cbiAgICB2YXIgcHJlbG9hZCA9IFIuX3ByZWxvYWQgPSBmdW5jdGlvbiAoc3JjLCBmKSB7XG4gICAgICAgIHZhciBpbWcgPSBnLmRvYy5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgICBpbWcuc3R5bGUuY3NzVGV4dCA9IFwicG9zaXRpb246YWJzb2x1dGU7bGVmdDotOTk5OWVtO3RvcDotOTk5OWVtXCI7XG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB0aGlzLm9ubG9hZCA9IG51bGw7XG4gICAgICAgICAgICBnLmRvYy5ib2R5LnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgICAgICB9O1xuICAgICAgICBpbWcub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGcuZG9jLmJvZHkucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgICAgIH07XG4gICAgICAgIGcuZG9jLmJvZHkuYXBwZW5kQ2hpbGQoaW1nKTtcbiAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY2xyVG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhleDtcbiAgICB9XG5cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5nZXRSR0JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFBhcnNlcyBjb2xvdXIgc3RyaW5nIGFzIFJHQiBvYmplY3RcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gY29sb3VyIChzdHJpbmcpIGNvbG91ciBzdHJpbmcgaW4gb25lIG9mIGZvcm1hdHM6XG4gICAgICMgPHVsPlxuICAgICAjICAgICA8bGk+Q29sb3VyIG5hbWUgKOKAnDxjb2RlPnJlZDwvY29kZT7igJ0sIOKAnDxjb2RlPmdyZWVuPC9jb2RlPuKAnSwg4oCcPGNvZGU+Y29ybmZsb3dlcmJsdWU8L2NvZGU+4oCdLCBldGMpPC9saT5cbiAgICAgIyAgICAgPGxpPiPigKLigKLigKIg4oCUIHNob3J0ZW5lZCBIVE1MIGNvbG91cjogKOKAnDxjb2RlPiMwMDA8L2NvZGU+4oCdLCDigJw8Y29kZT4jZmMwPC9jb2RlPuKAnSwgZXRjKTwvbGk+XG4gICAgICMgICAgIDxsaT4j4oCi4oCi4oCi4oCi4oCi4oCiIOKAlCBmdWxsIGxlbmd0aCBIVE1MIGNvbG91cjogKOKAnDxjb2RlPiMwMDAwMDA8L2NvZGU+4oCdLCDigJw8Y29kZT4jYmQyMzAwPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+cmdiKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCByZWQsIGdyZWVuIGFuZCBibHVlIGNoYW5uZWxz4oCZIHZhbHVlczogKOKAnDxjb2RlPnJnYigyMDAsJm5ic3A7MTAwLCZuYnNwOzApPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+cmdiKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTogKOKAnDxjb2RlPnJnYigxMDAlLCZuYnNwOzE3NSUsJm5ic3A7MCUpPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+aHNiKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBodWUsIHNhdHVyYXRpb24gYW5kIGJyaWdodG5lc3MgdmFsdWVzOiAo4oCcPGNvZGU+aHNiKDAuNSwmbmJzcDswLjI1LCZuYnNwOzEpPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+aHNiKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2wo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIHNhbWUgYXMgaHNiPC9saT5cbiAgICAgIyAgICAgPGxpPmhzbCjigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBoc2I8L2xpPlxuICAgICAjIDwvdWw+XG4gICAgID0gKG9iamVjdCkgUkdCIG9iamVjdCBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICByIChudW1iZXIpIHJlZCxcbiAgICAgbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiAgICAgbyAgICAgYiAobnVtYmVyKSBibHVlXG4gICAgIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKIsXG4gICAgIG8gICAgIGVycm9yIChib29sZWFuKSB0cnVlIGlmIHN0cmluZyBjYW7igJl0IGJlIHBhcnNlZFxuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5nZXRSR0IgPSBjYWNoZXIoZnVuY3Rpb24gKGNvbG91cikge1xuICAgICAgICBpZiAoIWNvbG91ciB8fCAhISgoY29sb3VyID0gU3RyKGNvbG91cikpLmluZGV4T2YoXCItXCIpICsgMSkpIHtcbiAgICAgICAgICAgIHJldHVybiB7cjogLTEsIGc6IC0xLCBiOiAtMSwgaGV4OiBcIm5vbmVcIiwgZXJyb3I6IDEsIHRvU3RyaW5nOiBjbHJUb1N0cmluZ307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbG91ciA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgcmV0dXJuIHtyOiAtMSwgZzogLTEsIGI6IC0xLCBoZXg6IFwibm9uZVwiLCB0b1N0cmluZzogY2xyVG9TdHJpbmd9O1xuICAgICAgICB9XG4gICAgICAgICEoaHNyZ1toYXNdKGNvbG91ci50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygwLCAyKSkgfHwgY29sb3VyLmNoYXJBdCgpID09IFwiI1wiKSAmJiAoY29sb3VyID0gdG9IZXgoY29sb3VyKSk7XG4gICAgICAgIHZhciByZXMsXG4gICAgICAgICAgICByZWQsXG4gICAgICAgICAgICBncmVlbixcbiAgICAgICAgICAgIGJsdWUsXG4gICAgICAgICAgICBvcGFjaXR5LFxuICAgICAgICAgICAgdCxcbiAgICAgICAgICAgIHZhbHVlcyxcbiAgICAgICAgICAgIHJnYiA9IGNvbG91ci5tYXRjaChjb2xvdXJSZWdFeHApO1xuICAgICAgICBpZiAocmdiKSB7XG4gICAgICAgICAgICBpZiAocmdiWzJdKSB7XG4gICAgICAgICAgICAgICAgYmx1ZSA9IHRvSW50KHJnYlsyXS5zdWJzdHJpbmcoNSksIDE2KTtcbiAgICAgICAgICAgICAgICBncmVlbiA9IHRvSW50KHJnYlsyXS5zdWJzdHJpbmcoMywgNSksIDE2KTtcbiAgICAgICAgICAgICAgICByZWQgPSB0b0ludChyZ2JbMl0uc3Vic3RyaW5nKDEsIDMpLCAxNik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmdiWzNdKSB7XG4gICAgICAgICAgICAgICAgYmx1ZSA9IHRvSW50KCh0ID0gcmdiWzNdLmNoYXJBdCgzKSkgKyB0LCAxNik7XG4gICAgICAgICAgICAgICAgZ3JlZW4gPSB0b0ludCgodCA9IHJnYlszXS5jaGFyQXQoMikpICsgdCwgMTYpO1xuICAgICAgICAgICAgICAgIHJlZCA9IHRvSW50KCh0ID0gcmdiWzNdLmNoYXJBdCgxKSkgKyB0LCAxNik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmdiWzRdKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzID0gcmdiWzRdW3NwbGl0XShjb21tYVNwYWNlcyk7XG4gICAgICAgICAgICAgICAgcmVkID0gdG9GbG9hdCh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKHJlZCAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICBncmVlbiA9IHRvRmxvYXQodmFsdWVzWzFdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMV0uc2xpY2UoLTEpID09IFwiJVwiICYmIChncmVlbiAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICBibHVlID0gdG9GbG9hdCh2YWx1ZXNbMl0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1syXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGJsdWUgKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgcmdiWzFdLnRvTG93ZXJDYXNlKCkuc2xpY2UoMCwgNCkgPT0gXCJyZ2JhXCIgJiYgKG9wYWNpdHkgPSB0b0Zsb2F0KHZhbHVlc1szXSkpO1xuICAgICAgICAgICAgICAgIHZhbHVlc1szXSAmJiB2YWx1ZXNbM10uc2xpY2UoLTEpID09IFwiJVwiICYmIChvcGFjaXR5IC89IDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmdiWzVdKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzID0gcmdiWzVdW3NwbGl0XShjb21tYVNwYWNlcyk7XG4gICAgICAgICAgICAgICAgcmVkID0gdG9GbG9hdCh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKHJlZCAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICBncmVlbiA9IHRvRmxvYXQodmFsdWVzWzFdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMV0uc2xpY2UoLTEpID09IFwiJVwiICYmIChncmVlbiAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICBibHVlID0gdG9GbG9hdCh2YWx1ZXNbMl0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1syXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGJsdWUgKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgKHZhbHVlc1swXS5zbGljZSgtMykgPT0gXCJkZWdcIiB8fCB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiXFx4YjBcIikgJiYgKHJlZCAvPSAzNjApO1xuICAgICAgICAgICAgICAgIHJnYlsxXS50b0xvd2VyQ2FzZSgpLnNsaWNlKDAsIDQpID09IFwiaHNiYVwiICYmIChvcGFjaXR5ID0gdG9GbG9hdCh2YWx1ZXNbM10pKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbM10gJiYgdmFsdWVzWzNdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAob3BhY2l0eSAvPSAxMDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBSLmhzYjJyZ2IocmVkLCBncmVlbiwgYmx1ZSwgb3BhY2l0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmdiWzZdKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzID0gcmdiWzZdW3NwbGl0XShjb21tYVNwYWNlcyk7XG4gICAgICAgICAgICAgICAgcmVkID0gdG9GbG9hdCh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKHJlZCAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICBncmVlbiA9IHRvRmxvYXQodmFsdWVzWzFdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMV0uc2xpY2UoLTEpID09IFwiJVwiICYmIChncmVlbiAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICBibHVlID0gdG9GbG9hdCh2YWx1ZXNbMl0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1syXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGJsdWUgKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgKHZhbHVlc1swXS5zbGljZSgtMykgPT0gXCJkZWdcIiB8fCB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiXFx4YjBcIikgJiYgKHJlZCAvPSAzNjApO1xuICAgICAgICAgICAgICAgIHJnYlsxXS50b0xvd2VyQ2FzZSgpLnNsaWNlKDAsIDQpID09IFwiaHNsYVwiICYmIChvcGFjaXR5ID0gdG9GbG9hdCh2YWx1ZXNbM10pKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbM10gJiYgdmFsdWVzWzNdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAob3BhY2l0eSAvPSAxMDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBSLmhzbDJyZ2IocmVkLCBncmVlbiwgYmx1ZSwgb3BhY2l0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZ2IgPSB7cjogcmVkLCBnOiBncmVlbiwgYjogYmx1ZSwgdG9TdHJpbmc6IGNsclRvU3RyaW5nfTtcbiAgICAgICAgICAgIHJnYi5oZXggPSBcIiNcIiArICgxNjc3NzIxNiB8IGJsdWUgfCAoZ3JlZW4gPDwgOCkgfCAocmVkIDw8IDE2KSkudG9TdHJpbmcoMTYpLnNsaWNlKDEpO1xuICAgICAgICAgICAgUi5pcyhvcGFjaXR5LCBcImZpbml0ZVwiKSAmJiAocmdiLm9wYWNpdHkgPSBvcGFjaXR5KTtcbiAgICAgICAgICAgIHJldHVybiByZ2I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtyOiAtMSwgZzogLTEsIGI6IC0xLCBoZXg6IFwibm9uZVwiLCBlcnJvcjogMSwgdG9TdHJpbmc6IGNsclRvU3RyaW5nfTtcbiAgICB9LCBSKTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5oc2JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIEhTQiB2YWx1ZXMgdG8gaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvdXIuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGggKG51bWJlcikgaHVlXG4gICAgIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gICAgIC0gYiAobnVtYmVyKSB2YWx1ZSBvciBicmlnaHRuZXNzXG4gICAgID0gKHN0cmluZykgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvdXIuXG4gICAgXFwqL1xuICAgIFIuaHNiID0gY2FjaGVyKGZ1bmN0aW9uIChoLCBzLCBiKSB7XG4gICAgICAgIHJldHVybiBSLmhzYjJyZ2IoaCwgcywgYikuaGV4O1xuICAgIH0pO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmhzbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ29udmVydHMgSFNMIHZhbHVlcyB0byBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG91ci5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaCAobnVtYmVyKSBodWVcbiAgICAgLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAgICAgLSBsIChudW1iZXIpIGx1bWlub3NpdHlcbiAgICAgPSAoc3RyaW5nKSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG91ci5cbiAgICBcXCovXG4gICAgUi5oc2wgPSBjYWNoZXIoZnVuY3Rpb24gKGgsIHMsIGwpIHtcbiAgICAgICAgcmV0dXJuIFIuaHNsMnJnYihoLCBzLCBsKS5oZXg7XG4gICAgfSk7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucmdiXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBSR0IgdmFsdWVzIHRvIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3VyLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSByIChudW1iZXIpIHJlZFxuICAgICAtIGcgKG51bWJlcikgZ3JlZW5cbiAgICAgLSBiIChudW1iZXIpIGJsdWVcbiAgICAgPSAoc3RyaW5nKSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG91ci5cbiAgICBcXCovXG4gICAgUi5yZ2IgPSBjYWNoZXIoZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICAgICAgcmV0dXJuIFwiI1wiICsgKDE2Nzc3MjE2IHwgYiB8IChnIDw8IDgpIHwgKHIgPDwgMTYpKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG4gICAgfSk7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZ2V0Q29sb3JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE9uIGVhY2ggY2FsbCByZXR1cm5zIG5leHQgY29sb3VyIGluIHRoZSBzcGVjdHJ1bS4gVG8gcmVzZXQgaXQgYmFjayB0byByZWQgY2FsbCBAUmFwaGFlbC5nZXRDb2xvci5yZXNldFxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSB2YWx1ZSAobnVtYmVyKSAjb3B0aW9uYWwgYnJpZ2h0bmVzcywgZGVmYXVsdCBpcyBgMC43NWBcbiAgICAgPSAoc3RyaW5nKSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG91ci5cbiAgICBcXCovXG4gICAgUi5nZXRDb2xvciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgc3RhcnQgPSB0aGlzLmdldENvbG9yLnN0YXJ0ID0gdGhpcy5nZXRDb2xvci5zdGFydCB8fCB7aDogMCwgczogMSwgYjogdmFsdWUgfHwgLjc1fSxcbiAgICAgICAgICAgIHJnYiA9IHRoaXMuaHNiMnJnYihzdGFydC5oLCBzdGFydC5zLCBzdGFydC5iKTtcbiAgICAgICAgc3RhcnQuaCArPSAuMDc1O1xuICAgICAgICBpZiAoc3RhcnQuaCA+IDEpIHtcbiAgICAgICAgICAgIHN0YXJ0LmggPSAwO1xuICAgICAgICAgICAgc3RhcnQucyAtPSAuMjtcbiAgICAgICAgICAgIHN0YXJ0LnMgPD0gMCAmJiAodGhpcy5nZXRDb2xvci5zdGFydCA9IHtoOiAwLCBzOiAxLCBiOiBzdGFydC5ifSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJnYi5oZXg7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5nZXRDb2xvci5yZXNldFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVzZXRzIHNwZWN0cnVtIHBvc2l0aW9uIGZvciBAUmFwaGFlbC5nZXRDb2xvciBiYWNrIHRvIHJlZC5cbiAgICBcXCovXG4gICAgUi5nZXRDb2xvci5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuc3RhcnQ7XG4gICAgfTtcblxuICAgIC8vIGh0dHA6Ly9zY2hlcGVycy5jYy9nZXR0aW5nLXRvLXRoZS1wb2ludFxuICAgIGZ1bmN0aW9uIGNhdG11bGxSb20yYmV6aWVyKGNycCwgeikge1xuICAgICAgICB2YXIgZCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaUxlbiA9IGNycC5sZW5ndGg7IGlMZW4gLSAyICogIXogPiBpOyBpICs9IDIpIHtcbiAgICAgICAgICAgIHZhciBwID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaSAtIDJdLCB5OiArY3JwW2kgLSAxXX0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpXSwgICAgIHk6ICtjcnBbaSArIDFdfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2kgKyAyXSwgeTogK2NycFtpICsgM119LFxuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaSArIDRdLCB5OiArY3JwW2kgKyA1XX1cbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmICh6KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbMF0gPSB7eDogK2NycFtpTGVuIC0gMl0sIHk6ICtjcnBbaUxlbiAtIDFdfTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlMZW4gLSA0ID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFszXSA9IHt4OiArY3JwWzBdLCB5OiArY3JwWzFdfTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlMZW4gLSAyID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFsyXSA9IHt4OiArY3JwWzBdLCB5OiArY3JwWzFdfTtcbiAgICAgICAgICAgICAgICAgICAgcFszXSA9IHt4OiArY3JwWzJdLCB5OiArY3JwWzNdfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChpTGVuIC0gNCA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbM10gPSBwWzJdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFswXSA9IHt4OiArY3JwW2ldLCB5OiArY3JwW2kgKyAxXX07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZC5wdXNoKFtcIkNcIixcbiAgICAgICAgICAgICAgICAgICgtcFswXS54ICsgNiAqIHBbMV0ueCArIHBbMl0ueCkgLyA2LFxuICAgICAgICAgICAgICAgICAgKC1wWzBdLnkgKyA2ICogcFsxXS55ICsgcFsyXS55KSAvIDYsXG4gICAgICAgICAgICAgICAgICAocFsxXS54ICsgNiAqIHBbMl0ueCAtIHBbM10ueCkgLyA2LFxuICAgICAgICAgICAgICAgICAgKHBbMV0ueSArIDYqcFsyXS55IC0gcFszXS55KSAvIDYsXG4gICAgICAgICAgICAgICAgICBwWzJdLngsXG4gICAgICAgICAgICAgICAgICBwWzJdLnlcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGQ7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnBhcnNlUGF0aFN0cmluZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBQYXJzZXMgZ2l2ZW4gcGF0aCBzdHJpbmcgaW50byBhbiBhcnJheSBvZiBhcnJheXMgb2YgcGF0aCBzZWdtZW50cy5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcGF0aFN0cmluZyAoc3RyaW5nfGFycmF5KSBwYXRoIHN0cmluZyBvciBhcnJheSBvZiBzZWdtZW50cyAoaW4gdGhlIGxhc3QgY2FzZSBpdCB3aWxsIGJlIHJldHVybmVkIHN0cmFpZ2h0IGF3YXkpXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiBzZWdtZW50cy5cbiAgICBcXCovXG4gICAgUi5wYXJzZVBhdGhTdHJpbmcgPSBmdW5jdGlvbiAocGF0aFN0cmluZykge1xuICAgICAgICBpZiAoIXBhdGhTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwdGggPSBwYXRocyhwYXRoU3RyaW5nKTtcbiAgICAgICAgaWYgKHB0aC5hcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoQ2xvbmUocHRoLmFycik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFyYW1Db3VudHMgPSB7YTogNywgYzogNiwgaDogMSwgbDogMiwgbTogMiwgcjogNCwgcTogNCwgczogNCwgdDogMiwgdjogMSwgejogMH0sXG4gICAgICAgICAgICBkYXRhID0gW107XG4gICAgICAgIGlmIChSLmlzKHBhdGhTdHJpbmcsIGFycmF5KSAmJiBSLmlzKHBhdGhTdHJpbmdbMF0sIGFycmF5KSkgeyAvLyByb3VnaCBhc3N1bXB0aW9uXG4gICAgICAgICAgICBkYXRhID0gcGF0aENsb25lKHBhdGhTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgICAgIFN0cihwYXRoU3RyaW5nKS5yZXBsYWNlKHBhdGhDb21tYW5kLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBjLnJlcGxhY2UocGF0aFZhbHVlcywgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgYiAmJiBwYXJhbXMucHVzaCgrYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT0gXCJtXCIgJiYgcGFyYW1zLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiXVtjb25jYXRdKHBhcmFtcy5zcGxpY2UoMCwgMikpKTtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IFwibFwiO1xuICAgICAgICAgICAgICAgICAgICBiID0gYiA9PSBcIm1cIiA/IFwibFwiIDogXCJMXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09IFwiclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYl1bY29uY2F0XShwYXJhbXMpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Ugd2hpbGUgKHBhcmFtcy5sZW5ndGggPj0gcGFyYW1Db3VudHNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiXVtjb25jYXRdKHBhcmFtcy5zcGxpY2UoMCwgcGFyYW1Db3VudHNbbmFtZV0pKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyYW1Db3VudHNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZGF0YS50b1N0cmluZyA9IFIuX3BhdGgyc3RyaW5nO1xuICAgICAgICBwdGguYXJyID0gcGF0aENsb25lKGRhdGEpO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnBhcnNlVHJhbnNmb3JtU3RyaW5nXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFBhcnNlcyBnaXZlbiBwYXRoIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mIHRyYW5zZm9ybWF0aW9ucy5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gVFN0cmluZyAoc3RyaW5nfGFycmF5KSB0cmFuc2Zvcm0gc3RyaW5nIG9yIGFycmF5IG9mIHRyYW5zZm9ybWF0aW9ucyAoaW4gdGhlIGxhc3QgY2FzZSBpdCB3aWxsIGJlIHJldHVybmVkIHN0cmFpZ2h0IGF3YXkpXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiB0cmFuc2Zvcm1hdGlvbnMuXG4gICAgXFwqL1xuICAgIFIucGFyc2VUcmFuc2Zvcm1TdHJpbmcgPSBjYWNoZXIoZnVuY3Rpb24gKFRTdHJpbmcpIHtcbiAgICAgICAgaWYgKCFUU3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyYW1Db3VudHMgPSB7cjogMywgczogNCwgdDogMiwgbTogNn0sXG4gICAgICAgICAgICBkYXRhID0gW107XG4gICAgICAgIGlmIChSLmlzKFRTdHJpbmcsIGFycmF5KSAmJiBSLmlzKFRTdHJpbmdbMF0sIGFycmF5KSkgeyAvLyByb3VnaCBhc3N1bXB0aW9uXG4gICAgICAgICAgICBkYXRhID0gcGF0aENsb25lKFRTdHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgICAgIFN0cihUU3RyaW5nKS5yZXBsYWNlKHRDb21tYW5kLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGxvd2VyQ2FzZS5jYWxsKGIpO1xuICAgICAgICAgICAgICAgIGMucmVwbGFjZShwYXRoVmFsdWVzLCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICBiICYmIHBhcmFtcy5wdXNoKCtiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2JdW2NvbmNhdF0ocGFyYW1zKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhLnRvU3RyaW5nID0gUi5fcGF0aDJzdHJpbmc7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0pO1xuICAgIC8vIFBBVEhTXG4gICAgdmFyIHBhdGhzID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgICAgIHZhciBwID0gcGF0aHMucHMgPSBwYXRocy5wcyB8fCB7fTtcbiAgICAgICAgaWYgKHBbcHNdKSB7XG4gICAgICAgICAgICBwW3BzXS5zbGVlcCA9IDEwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBbcHNdID0ge1xuICAgICAgICAgICAgICAgIHNsZWVwOiAxMDBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcCkgaWYgKHBbaGFzXShrZXkpICYmIGtleSAhPSBwcykge1xuICAgICAgICAgICAgICAgIHBba2V5XS5zbGVlcC0tO1xuICAgICAgICAgICAgICAgICFwW2tleV0uc2xlZXAgJiYgZGVsZXRlIHBba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwW3BzXTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmZpbmREb3RzQXRTZWdtZW50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIEZpbmQgZG90IGNvb3JkaW5hdGVzIG9uIHRoZSBnaXZlbiBjdWJpYyBiZXppZXIgY3VydmUgYXQgdGhlIGdpdmVuIHQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHAxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSB0IChudW1iZXIpIHBvc2l0aW9uIG9uIHRoZSBjdXJ2ZSAoMC4uMSlcbiAgICAgPSAob2JqZWN0KSBwb2ludCBpbmZvcm1hdGlvbiBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgbyAgICAgbToge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IGFuY2hvclxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IGFuY2hvclxuICAgICBvICAgICB9XG4gICAgIG8gICAgIG46IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYW5jaG9yXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGFuY2hvclxuICAgICBvICAgICB9XG4gICAgIG8gICAgIHN0YXJ0OiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHN0YXJ0IG9mIHRoZSBjdXJ2ZVxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBzdGFydCBvZiB0aGUgY3VydmVcbiAgICAgbyAgICAgfVxuICAgICBvICAgICBlbmQ6IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgZW5kIG9mIHRoZSBjdXJ2ZVxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBlbmQgb2YgdGhlIGN1cnZlXG4gICAgIG8gICAgIH1cbiAgICAgbyAgICAgYWxwaGE6IChudW1iZXIpIGFuZ2xlIG9mIHRoZSBjdXJ2ZSBkZXJpdmF0aXZlIGF0IHRoZSBwb2ludFxuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5maW5kRG90c0F0U2VnbWVudCA9IGZ1bmN0aW9uIChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdCkge1xuICAgICAgICB2YXIgdDEgPSAxIC0gdCxcbiAgICAgICAgICAgIHQxMyA9IHBvdyh0MSwgMyksXG4gICAgICAgICAgICB0MTIgPSBwb3codDEsIDIpLFxuICAgICAgICAgICAgdDIgPSB0ICogdCxcbiAgICAgICAgICAgIHQzID0gdDIgKiB0LFxuICAgICAgICAgICAgeCA9IHQxMyAqIHAxeCArIHQxMiAqIDMgKiB0ICogYzF4ICsgdDEgKiAzICogdCAqIHQgKiBjMnggKyB0MyAqIHAyeCxcbiAgICAgICAgICAgIHkgPSB0MTMgKiBwMXkgKyB0MTIgKiAzICogdCAqIGMxeSArIHQxICogMyAqIHQgKiB0ICogYzJ5ICsgdDMgKiBwMnksXG4gICAgICAgICAgICBteCA9IHAxeCArIDIgKiB0ICogKGMxeCAtIHAxeCkgKyB0MiAqIChjMnggLSAyICogYzF4ICsgcDF4KSxcbiAgICAgICAgICAgIG15ID0gcDF5ICsgMiAqIHQgKiAoYzF5IC0gcDF5KSArIHQyICogKGMyeSAtIDIgKiBjMXkgKyBwMXkpLFxuICAgICAgICAgICAgbnggPSBjMXggKyAyICogdCAqIChjMnggLSBjMXgpICsgdDIgKiAocDJ4IC0gMiAqIGMyeCArIGMxeCksXG4gICAgICAgICAgICBueSA9IGMxeSArIDIgKiB0ICogKGMyeSAtIGMxeSkgKyB0MiAqIChwMnkgLSAyICogYzJ5ICsgYzF5KSxcbiAgICAgICAgICAgIGF4ID0gdDEgKiBwMXggKyB0ICogYzF4LFxuICAgICAgICAgICAgYXkgPSB0MSAqIHAxeSArIHQgKiBjMXksXG4gICAgICAgICAgICBjeCA9IHQxICogYzJ4ICsgdCAqIHAyeCxcbiAgICAgICAgICAgIGN5ID0gdDEgKiBjMnkgKyB0ICogcDJ5LFxuICAgICAgICAgICAgYWxwaGEgPSAoOTAgLSBtYXRoLmF0YW4yKG14IC0gbngsIG15IC0gbnkpICogMTgwIC8gUEkpO1xuICAgICAgICAobXggPiBueCB8fCBteSA8IG55KSAmJiAoYWxwaGEgKz0gMTgwKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgbToge3g6IG14LCB5OiBteX0sXG4gICAgICAgICAgICBuOiB7eDogbngsIHk6IG55fSxcbiAgICAgICAgICAgIHN0YXJ0OiB7eDogYXgsIHk6IGF5fSxcbiAgICAgICAgICAgIGVuZDoge3g6IGN4LCB5OiBjeX0sXG4gICAgICAgICAgICBhbHBoYTogYWxwaGFcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmJlemllckJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJuIGJvdW5kaW5nIGJveCBvZiBhIGdpdmVuIGN1YmljIGJlemllciBjdXJ2ZVxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgICogb3JcbiAgICAgLSBiZXogKGFycmF5KSBhcnJheSBvZiBzaXggcG9pbnRzIGZvciBiZXppZXIgY3VydmVcbiAgICAgPSAob2JqZWN0KSBwb2ludCBpbmZvcm1hdGlvbiBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICBtaW46IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCBwb2ludFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSB0b3AgcG9pbnRcbiAgICAgbyAgICAgfVxuICAgICBvICAgICBtYXg6IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgcG9pbnRcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgYm90dG9tIHBvaW50XG4gICAgIG8gICAgIH1cbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIuYmV6aWVyQkJveCA9IGZ1bmN0aW9uIChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSkge1xuICAgICAgICBpZiAoIVIuaXMocDF4LCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBwMXggPSBbcDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBiYm94ID0gY3VydmVEaW0uYXBwbHkobnVsbCwgcDF4KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGJib3gubWluLngsXG4gICAgICAgICAgICB5OiBiYm94Lm1pbi55LFxuICAgICAgICAgICAgeDI6IGJib3gubWF4LngsXG4gICAgICAgICAgICB5MjogYmJveC5tYXgueSxcbiAgICAgICAgICAgIHdpZHRoOiBiYm94Lm1heC54IC0gYmJveC5taW4ueCxcbiAgICAgICAgICAgIGhlaWdodDogYmJveC5tYXgueSAtIGJib3gubWluLnlcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmlzUG9pbnRJbnNpZGVCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGdpdmVuIHBvaW50IGlzIGluc2lkZSBib3VuZGluZyBib3hlcy5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gYmJveCAoc3RyaW5nKSBib3VuZGluZyBib3hcbiAgICAgLSB4IChzdHJpbmcpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgLSB5IChzdHJpbmcpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIHBvaW50IGluc2lkZVxuICAgIFxcKi9cbiAgICBSLmlzUG9pbnRJbnNpZGVCQm94ID0gZnVuY3Rpb24gKGJib3gsIHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggPj0gYmJveC54ICYmIHggPD0gYmJveC54MiAmJiB5ID49IGJib3gueSAmJiB5IDw9IGJib3gueTI7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5pc0JCb3hJbnRlcnNlY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdHdvIGJvdW5kaW5nIGJveGVzIGludGVyc2VjdFxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBiYm94MSAoc3RyaW5nKSBmaXJzdCBib3VuZGluZyBib3hcbiAgICAgLSBiYm94MiAoc3RyaW5nKSBzZWNvbmQgYm91bmRpbmcgYm94XG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiB0aGV5IGludGVyc2VjdFxuICAgIFxcKi9cbiAgICBSLmlzQkJveEludGVyc2VjdCA9IGZ1bmN0aW9uIChiYm94MSwgYmJveDIpIHtcbiAgICAgICAgdmFyIGkgPSBSLmlzUG9pbnRJbnNpZGVCQm94O1xuICAgICAgICByZXR1cm4gaShiYm94MiwgYmJveDEueCwgYmJveDEueSlcbiAgICAgICAgICAgIHx8IGkoYmJveDIsIGJib3gxLngyLCBiYm94MS55KVxuICAgICAgICAgICAgfHwgaShiYm94MiwgYmJveDEueCwgYmJveDEueTIpXG4gICAgICAgICAgICB8fCBpKGJib3gyLCBiYm94MS54MiwgYmJveDEueTIpXG4gICAgICAgICAgICB8fCBpKGJib3gxLCBiYm94Mi54LCBiYm94Mi55KVxuICAgICAgICAgICAgfHwgaShiYm94MSwgYmJveDIueDIsIGJib3gyLnkpXG4gICAgICAgICAgICB8fCBpKGJib3gxLCBiYm94Mi54LCBiYm94Mi55MilcbiAgICAgICAgICAgIHx8IGkoYmJveDEsIGJib3gyLngyLCBiYm94Mi55MilcbiAgICAgICAgICAgIHx8IChiYm94MS54IDwgYmJveDIueDIgJiYgYmJveDEueCA+IGJib3gyLnggfHwgYmJveDIueCA8IGJib3gxLngyICYmIGJib3gyLnggPiBiYm94MS54KVxuICAgICAgICAgICAgJiYgKGJib3gxLnkgPCBiYm94Mi55MiAmJiBiYm94MS55ID4gYmJveDIueSB8fCBiYm94Mi55IDwgYmJveDEueTIgJiYgYmJveDIueSA+IGJib3gxLnkpO1xuICAgIH07XG4gICAgZnVuY3Rpb24gYmFzZTModCwgcDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgdmFyIHQxID0gLTMgKiBwMSArIDkgKiBwMiAtIDkgKiBwMyArIDMgKiBwNCxcbiAgICAgICAgICAgIHQyID0gdCAqIHQxICsgNiAqIHAxIC0gMTIgKiBwMiArIDYgKiBwMztcbiAgICAgICAgcmV0dXJuIHQgKiB0MiAtIDMgKiBwMSArIDMgKiBwMjtcbiAgICB9XG4gICAgZnVuY3Rpb24gYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgeikge1xuICAgICAgICBpZiAoeiA9PSBudWxsKSB7XG4gICAgICAgICAgICB6ID0gMTtcbiAgICAgICAgfVxuICAgICAgICB6ID0geiA+IDEgPyAxIDogeiA8IDAgPyAwIDogejtcbiAgICAgICAgdmFyIHoyID0geiAvIDIsXG4gICAgICAgICAgICBuID0gMTIsXG4gICAgICAgICAgICBUdmFsdWVzID0gWy0wLjEyNTIsMC4xMjUyLC0wLjM2NzgsMC4zNjc4LC0wLjU4NzMsMC41ODczLC0wLjc2OTksMC43Njk5LC0wLjkwNDEsMC45MDQxLC0wLjk4MTYsMC45ODE2XSxcbiAgICAgICAgICAgIEN2YWx1ZXMgPSBbMC4yNDkxLDAuMjQ5MSwwLjIzMzUsMC4yMzM1LDAuMjAzMiwwLjIwMzIsMC4xNjAxLDAuMTYwMSwwLjEwNjksMC4xMDY5LDAuMDQ3MiwwLjA0NzJdLFxuICAgICAgICAgICAgc3VtID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjdCA9IHoyICogVHZhbHVlc1tpXSArIHoyLFxuICAgICAgICAgICAgICAgIHhiYXNlID0gYmFzZTMoY3QsIHgxLCB4MiwgeDMsIHg0KSxcbiAgICAgICAgICAgICAgICB5YmFzZSA9IGJhc2UzKGN0LCB5MSwgeTIsIHkzLCB5NCksXG4gICAgICAgICAgICAgICAgY29tYiA9IHhiYXNlICogeGJhc2UgKyB5YmFzZSAqIHliYXNlO1xuICAgICAgICAgICAgc3VtICs9IEN2YWx1ZXNbaV0gKiBtYXRoLnNxcnQoY29tYik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHoyICogc3VtO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRUYXRMZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCBsbCkge1xuICAgICAgICBpZiAobGwgPCAwIHx8IGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQpIDwgbGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdCA9IDEsXG4gICAgICAgICAgICBzdGVwID0gdCAvIDIsXG4gICAgICAgICAgICB0MiA9IHQgLSBzdGVwLFxuICAgICAgICAgICAgbCxcbiAgICAgICAgICAgIGUgPSAuMDE7XG4gICAgICAgIGwgPSBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCB0Mik7XG4gICAgICAgIHdoaWxlIChhYnMobCAtIGxsKSA+IGUpIHtcbiAgICAgICAgICAgIHN0ZXAgLz0gMjtcbiAgICAgICAgICAgIHQyICs9IChsIDwgbGwgPyAxIDogLTEpICogc3RlcDtcbiAgICAgICAgICAgIGwgPSBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCB0Mik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlcnNlY3QoeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG1tYXgoeDEsIHgyKSA8IG1taW4oeDMsIHg0KSB8fFxuICAgICAgICAgICAgbW1pbih4MSwgeDIpID4gbW1heCh4MywgeDQpIHx8XG4gICAgICAgICAgICBtbWF4KHkxLCB5MikgPCBtbWluKHkzLCB5NCkgfHxcbiAgICAgICAgICAgIG1taW4oeTEsIHkyKSA+IG1tYXgoeTMsIHk0KVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbnggPSAoeDEgKiB5MiAtIHkxICogeDIpICogKHgzIC0geDQpIC0gKHgxIC0geDIpICogKHgzICogeTQgLSB5MyAqIHg0KSxcbiAgICAgICAgICAgIG55ID0gKHgxICogeTIgLSB5MSAqIHgyKSAqICh5MyAtIHk0KSAtICh5MSAtIHkyKSAqICh4MyAqIHk0IC0geTMgKiB4NCksXG4gICAgICAgICAgICBkZW5vbWluYXRvciA9ICh4MSAtIHgyKSAqICh5MyAtIHk0KSAtICh5MSAtIHkyKSAqICh4MyAtIHg0KTtcblxuICAgICAgICBpZiAoIWRlbm9taW5hdG9yKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHB4ID0gbnggLyBkZW5vbWluYXRvcixcbiAgICAgICAgICAgIHB5ID0gbnkgLyBkZW5vbWluYXRvcixcbiAgICAgICAgICAgIHB4MiA9ICtweC50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgcHkyID0gK3B5LnRvRml4ZWQoMik7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHB4MiA8ICttbWluKHgxLCB4MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHgyID4gK21tYXgoeDEsIHgyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweDIgPCArbW1pbih4MywgeDQpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB4MiA+ICttbWF4KHgzLCB4NCkudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyIDwgK21taW4oeTEsIHkyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPiArbW1heCh5MSwgeTIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA8ICttbWluKHkzLCB5NCkudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyID4gK21tYXgoeTMsIHk0KS50b0ZpeGVkKDIpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7eDogcHgsIHk6IHB5fTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXIoYmV6MSwgYmV6Mikge1xuICAgICAgICByZXR1cm4gaW50ZXJIZWxwZXIoYmV6MSwgYmV6Mik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyQ291bnQoYmV6MSwgYmV6Mikge1xuICAgICAgICByZXR1cm4gaW50ZXJIZWxwZXIoYmV6MSwgYmV6MiwgMSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVySGVscGVyKGJlejEsIGJlejIsIGp1c3RDb3VudCkge1xuICAgICAgICB2YXIgYmJveDEgPSBSLmJlemllckJCb3goYmV6MSksXG4gICAgICAgICAgICBiYm94MiA9IFIuYmV6aWVyQkJveChiZXoyKTtcbiAgICAgICAgaWYgKCFSLmlzQkJveEludGVyc2VjdChiYm94MSwgYmJveDIpKSB7XG4gICAgICAgICAgICByZXR1cm4ganVzdENvdW50ID8gMCA6IFtdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsMSA9IGJlemxlbi5hcHBseSgwLCBiZXoxKSxcbiAgICAgICAgICAgIGwyID0gYmV6bGVuLmFwcGx5KDAsIGJlejIpLFxuICAgICAgICAgICAgbjEgPSBtbWF4KH5+KGwxIC8gNSksIDEpLFxuICAgICAgICAgICAgbjIgPSBtbWF4KH5+KGwyIC8gNSksIDEpLFxuICAgICAgICAgICAgZG90czEgPSBbXSxcbiAgICAgICAgICAgIGRvdHMyID0gW10sXG4gICAgICAgICAgICB4eSA9IHt9LFxuICAgICAgICAgICAgcmVzID0ganVzdENvdW50ID8gMCA6IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4xICsgMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcCA9IFIuZmluZERvdHNBdFNlZ21lbnQuYXBwbHkoUiwgYmV6MS5jb25jYXQoaSAvIG4xKSk7XG4gICAgICAgICAgICBkb3RzMS5wdXNoKHt4OiBwLngsIHk6IHAueSwgdDogaSAvIG4xfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4yICsgMTsgaSsrKSB7XG4gICAgICAgICAgICBwID0gUi5maW5kRG90c0F0U2VnbWVudC5hcHBseShSLCBiZXoyLmNvbmNhdChpIC8gbjIpKTtcbiAgICAgICAgICAgIGRvdHMyLnB1c2goe3g6IHAueCwgeTogcC55LCB0OiBpIC8gbjJ9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjE7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuMjsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpID0gZG90czFbaV0sXG4gICAgICAgICAgICAgICAgICAgIGRpMSA9IGRvdHMxW2kgKyAxXSxcbiAgICAgICAgICAgICAgICAgICAgZGogPSBkb3RzMltqXSxcbiAgICAgICAgICAgICAgICAgICAgZGoxID0gZG90czJbaiArIDFdLFxuICAgICAgICAgICAgICAgICAgICBjaSA9IGFicyhkaTEueCAtIGRpLngpIDwgLjAwMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIGNqID0gYWJzKGRqMS54IC0gZGoueCkgPCAuMDAxID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgaXMgPSBpbnRlcnNlY3QoZGkueCwgZGkueSwgZGkxLngsIGRpMS55LCBkai54LCBkai55LCBkajEueCwgZGoxLnkpO1xuICAgICAgICAgICAgICAgIGlmIChpcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeHlbaXMueC50b0ZpeGVkKDQpXSA9PSBpcy55LnRvRml4ZWQoNCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHh5W2lzLngudG9GaXhlZCg0KV0gPSBpcy55LnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0MSA9IGRpLnQgKyBhYnMoKGlzW2NpXSAtIGRpW2NpXSkgLyAoZGkxW2NpXSAtIGRpW2NpXSkpICogKGRpMS50IC0gZGkudCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0MiA9IGRqLnQgKyBhYnMoKGlzW2NqXSAtIGRqW2NqXSkgLyAoZGoxW2NqXSAtIGRqW2NqXSkpICogKGRqMS50IC0gZGoudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0MSA+PSAwICYmIHQxIDw9IDEuMDAxICYmIHQyID49IDAgJiYgdDIgPD0gMS4wMDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqdXN0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBpcy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBpcy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MTogbW1pbih0MSwgMSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQyOiBtbWluKHQyLCAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnBhdGhJbnRlcnNlY3Rpb25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogRmluZHMgaW50ZXJzZWN0aW9ucyBvZiB0d28gcGF0aHNcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcGF0aDEgKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgLSBwYXRoMiAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICA9IChhcnJheSkgZG90cyBvZiBpbnRlcnNlY3Rpb25cbiAgICAgbyBbXG4gICAgIG8gICAgIHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgbyAgICAgICAgIHQxOiAobnVtYmVyKSB0IHZhbHVlIGZvciBzZWdtZW50IG9mIHBhdGgxXG4gICAgIG8gICAgICAgICB0MjogKG51bWJlcikgdCB2YWx1ZSBmb3Igc2VnbWVudCBvZiBwYXRoMlxuICAgICBvICAgICAgICAgc2VnbWVudDE6IChudW1iZXIpIG9yZGVyIG51bWJlciBmb3Igc2VnbWVudCBvZiBwYXRoMVxuICAgICBvICAgICAgICAgc2VnbWVudDI6IChudW1iZXIpIG9yZGVyIG51bWJlciBmb3Igc2VnbWVudCBvZiBwYXRoMlxuICAgICBvICAgICAgICAgYmV6MTogKGFycmF5KSBlaWdodCBjb29yZGluYXRlcyByZXByZXNlbnRpbmcgYmV6acOpciBjdXJ2ZSBmb3IgdGhlIHNlZ21lbnQgb2YgcGF0aDFcbiAgICAgbyAgICAgICAgIGJlejI6IChhcnJheSkgZWlnaHQgY29vcmRpbmF0ZXMgcmVwcmVzZW50aW5nIGJlemnDqXIgY3VydmUgZm9yIHRoZSBzZWdtZW50IG9mIHBhdGgyXG4gICAgIG8gICAgIH1cbiAgICAgbyBdXG4gICAgXFwqL1xuICAgIFIucGF0aEludGVyc2VjdGlvbiA9IGZ1bmN0aW9uIChwYXRoMSwgcGF0aDIpIHtcbiAgICAgICAgcmV0dXJuIGludGVyUGF0aEhlbHBlcihwYXRoMSwgcGF0aDIpO1xuICAgIH07XG4gICAgUi5wYXRoSW50ZXJzZWN0aW9uTnVtYmVyID0gZnVuY3Rpb24gKHBhdGgxLCBwYXRoMikge1xuICAgICAgICByZXR1cm4gaW50ZXJQYXRoSGVscGVyKHBhdGgxLCBwYXRoMiwgMSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBpbnRlclBhdGhIZWxwZXIocGF0aDEsIHBhdGgyLCBqdXN0Q291bnQpIHtcbiAgICAgICAgcGF0aDEgPSBSLl9wYXRoMmN1cnZlKHBhdGgxKTtcbiAgICAgICAgcGF0aDIgPSBSLl9wYXRoMmN1cnZlKHBhdGgyKTtcbiAgICAgICAgdmFyIHgxLCB5MSwgeDIsIHkyLCB4MW0sIHkxbSwgeDJtLCB5Mm0sIGJlejEsIGJlejIsXG4gICAgICAgICAgICByZXMgPSBqdXN0Q291bnQgPyAwIDogW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhdGgxLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwaSA9IHBhdGgxW2ldO1xuICAgICAgICAgICAgaWYgKHBpWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgeDEgPSB4MW0gPSBwaVsxXTtcbiAgICAgICAgICAgICAgICB5MSA9IHkxbSA9IHBpWzJdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAocGlbMF0gPT0gXCJDXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYmV6MSA9IFt4MSwgeTFdLmNvbmNhdChwaS5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgIHgxID0gYmV6MVs2XTtcbiAgICAgICAgICAgICAgICAgICAgeTEgPSBiZXoxWzddO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJlejEgPSBbeDEsIHkxLCB4MSwgeTEsIHgxbSwgeTFtLCB4MW0sIHkxbV07XG4gICAgICAgICAgICAgICAgICAgIHgxID0geDFtO1xuICAgICAgICAgICAgICAgICAgICB5MSA9IHkxbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpqID0gcGF0aDIubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGogPSBwYXRoMltqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBqWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IHgybSA9IHBqWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSB5Mm0gPSBwalsyXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwalswXSA9PSBcIkNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlejIgPSBbeDIsIHkyXS5jb25jYXQocGouc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gYmV6Mls2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGJlejJbN107XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlejIgPSBbeDIsIHkyLCB4MiwgeTIsIHgybSwgeTJtLCB4Mm0sIHkybV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4Mm07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSB5Mm07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW50ciA9IGludGVySGVscGVyKGJlejEsIGJlejIsIGp1c3RDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanVzdENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IGludHI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBrayA9IGludHIubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLnNlZ21lbnQxID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5zZWdtZW50MiA9IGo7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uYmV6MSA9IGJlejE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uYmV6MiA9IGJlejI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoaW50cik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaXNQb2ludEluc2lkZVBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgZ2l2ZW4gcG9pbnQgaXMgaW5zaWRlIGEgZ2l2ZW4gY2xvc2VkIHBhdGguXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgLSB4IChudW1iZXIpIHggb2YgdGhlIHBvaW50XG4gICAgIC0geSAobnVtYmVyKSB5IG9mIHRoZSBwb2ludFxuICAgICA9IChib29sZWFuKSB0cnVlLCBpZiBwb2ludCBpcyBpbnNpZGUgdGhlIHBhdGhcbiAgICBcXCovXG4gICAgUi5pc1BvaW50SW5zaWRlUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCB4LCB5KSB7XG4gICAgICAgIHZhciBiYm94ID0gUi5wYXRoQkJveChwYXRoKTtcbiAgICAgICAgcmV0dXJuIFIuaXNQb2ludEluc2lkZUJCb3goYmJveCwgeCwgeSkgJiZcbiAgICAgICAgICAgICAgIGludGVyUGF0aEhlbHBlcihwYXRoLCBbW1wiTVwiLCB4LCB5XSwgW1wiSFwiLCBiYm94LngyICsgMTBdXSwgMSkgJSAyID09IDE7XG4gICAgfTtcbiAgICBSLl9yZW1vdmVkRmFjdG9yeSA9IGZ1bmN0aW9uIChtZXRob2RuYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBldmUoXCJyYXBoYWVsLmxvZ1wiLCBudWxsLCBcIlJhcGhhXFx4ZWJsOiB5b3UgYXJlIGNhbGxpbmcgdG8gbWV0aG9kIFxcdTIwMWNcIiArIG1ldGhvZG5hbWUgKyBcIlxcdTIwMWQgb2YgcmVtb3ZlZCBvYmplY3RcIiwgbWV0aG9kbmFtZSk7XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5wYXRoQkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm4gYm91bmRpbmcgYm94IG9mIGEgZ2l2ZW4gcGF0aFxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgID0gKG9iamVjdCkgYm91bmRpbmcgYm94XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgdG9wIHBvaW50IG9mIHRoZSBib3hcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IHRvcCBwb2ludCBvZiB0aGUgYm94XG4gICAgIG8gICAgIHgyOiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGJvdHRvbSBwb2ludCBvZiB0aGUgYm94XG4gICAgIG8gICAgIHkyOiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGJvdHRvbSBwb2ludCBvZiB0aGUgYm94XG4gICAgIG8gICAgIHdpZHRoOiAobnVtYmVyKSB3aWR0aCBvZiB0aGUgYm94XG4gICAgIG8gICAgIGhlaWdodDogKG51bWJlcikgaGVpZ2h0IG9mIHRoZSBib3hcbiAgICAgbyAgICAgY3g6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgY2VudGVyIG9mIHRoZSBib3hcbiAgICAgbyAgICAgY3k6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgY2VudGVyIG9mIHRoZSBib3hcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIHZhciBwYXRoRGltZW5zaW9ucyA9IFIucGF0aEJCb3ggPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICB2YXIgcHRoID0gcGF0aHMocGF0aCk7XG4gICAgICAgIGlmIChwdGguYmJveCkge1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lKHB0aC5iYm94KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7eDogMCwgeTogMCwgd2lkdGg6IDAsIGhlaWdodDogMCwgeDI6IDAsIHkyOiAwfTtcbiAgICAgICAgfVxuICAgICAgICBwYXRoID0gcGF0aDJjdXJ2ZShwYXRoKTtcbiAgICAgICAgdmFyIHggPSAwLFxuICAgICAgICAgICAgeSA9IDAsXG4gICAgICAgICAgICBYID0gW10sXG4gICAgICAgICAgICBZID0gW10sXG4gICAgICAgICAgICBwO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHAgPSBwYXRoW2ldO1xuICAgICAgICAgICAgaWYgKHBbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICB4ID0gcFsxXTtcbiAgICAgICAgICAgICAgICB5ID0gcFsyXTtcbiAgICAgICAgICAgICAgICBYLnB1c2goeCk7XG4gICAgICAgICAgICAgICAgWS5wdXNoKHkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZGltID0gY3VydmVEaW0oeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSk7XG4gICAgICAgICAgICAgICAgWCA9IFhbY29uY2F0XShkaW0ubWluLngsIGRpbS5tYXgueCk7XG4gICAgICAgICAgICAgICAgWSA9IFlbY29uY2F0XShkaW0ubWluLnksIGRpbS5tYXgueSk7XG4gICAgICAgICAgICAgICAgeCA9IHBbNV07XG4gICAgICAgICAgICAgICAgeSA9IHBbNl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHhtaW4gPSBtbWluW2FwcGx5XSgwLCBYKSxcbiAgICAgICAgICAgIHltaW4gPSBtbWluW2FwcGx5XSgwLCBZKSxcbiAgICAgICAgICAgIHhtYXggPSBtbWF4W2FwcGx5XSgwLCBYKSxcbiAgICAgICAgICAgIHltYXggPSBtbWF4W2FwcGx5XSgwLCBZKSxcbiAgICAgICAgICAgIHdpZHRoID0geG1heCAtIHhtaW4sXG4gICAgICAgICAgICBoZWlnaHQgPSB5bWF4IC0geW1pbixcbiAgICAgICAgICAgICAgICBiYiA9IHtcbiAgICAgICAgICAgICAgICB4OiB4bWluLFxuICAgICAgICAgICAgICAgIHk6IHltaW4sXG4gICAgICAgICAgICAgICAgeDI6IHhtYXgsXG4gICAgICAgICAgICAgICAgeTI6IHltYXgsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgIGN4OiB4bWluICsgd2lkdGggLyAyLFxuICAgICAgICAgICAgICAgIGN5OiB5bWluICsgaGVpZ2h0IC8gMlxuICAgICAgICAgICAgfTtcbiAgICAgICAgcHRoLmJib3ggPSBjbG9uZShiYik7XG4gICAgICAgIHJldHVybiBiYjtcbiAgICB9LFxuICAgICAgICBwYXRoQ2xvbmUgPSBmdW5jdGlvbiAocGF0aEFycmF5KSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gY2xvbmUocGF0aEFycmF5KTtcbiAgICAgICAgICAgIHJlcy50b1N0cmluZyA9IFIuX3BhdGgyc3RyaW5nO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSxcbiAgICAgICAgcGF0aFRvUmVsYXRpdmUgPSBSLl9wYXRoVG9SZWxhdGl2ZSA9IGZ1bmN0aW9uIChwYXRoQXJyYXkpIHtcbiAgICAgICAgICAgIHZhciBwdGggPSBwYXRocyhwYXRoQXJyYXkpO1xuICAgICAgICAgICAgaWYgKHB0aC5yZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aENsb25lKHB0aC5yZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFSLmlzKHBhdGhBcnJheSwgYXJyYXkpIHx8ICFSLmlzKHBhdGhBcnJheSAmJiBwYXRoQXJyYXlbMF0sIGFycmF5KSkgeyAvLyByb3VnaCBhc3N1bXB0aW9uXG4gICAgICAgICAgICAgICAgcGF0aEFycmF5ID0gUi5wYXJzZVBhdGhTdHJpbmcocGF0aEFycmF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXMgPSBbXSxcbiAgICAgICAgICAgICAgICB4ID0gMCxcbiAgICAgICAgICAgICAgICB5ID0gMCxcbiAgICAgICAgICAgICAgICBteCA9IDAsXG4gICAgICAgICAgICAgICAgbXkgPSAwLFxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgICAgICAgIGlmIChwYXRoQXJyYXlbMF1bMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICB4ID0gcGF0aEFycmF5WzBdWzFdO1xuICAgICAgICAgICAgICAgIHkgPSBwYXRoQXJyYXlbMF1bMl07XG4gICAgICAgICAgICAgICAgbXggPSB4O1xuICAgICAgICAgICAgICAgIG15ID0geTtcbiAgICAgICAgICAgICAgICBzdGFydCsrO1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKFtcIk1cIiwgeCwgeV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0LCBpaSA9IHBhdGhBcnJheS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSByZXNbaV0gPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgcGEgPSBwYXRoQXJyYXlbaV07XG4gICAgICAgICAgICAgICAgaWYgKHBhWzBdICE9IGxvd2VyQ2FzZS5jYWxsKHBhWzBdKSkge1xuICAgICAgICAgICAgICAgICAgICByWzBdID0gbG93ZXJDYXNlLmNhbGwocGFbMF0pO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9IHBhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbMl0gPSBwYVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzNdID0gcGFbM107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls0XSA9IHBhWzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbNV0gPSBwYVs1XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzZdID0gKyhwYVs2XSAtIHgpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls3XSA9ICsocGFbN10gLSB5KS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gKyhwYVsxXSAtIHkpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14ID0gcGFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXkgPSBwYVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDEsIGpqID0gcGEubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByW2pdID0gKyhwYVtqXSAtICgoaiAlIDIpID8geCA6IHkpKS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHIgPSByZXNbaV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhWzBdID09IFwibVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBteCA9IHBhWzFdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG15ID0gcGFbMl0gKyB5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBrayA9IHBhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc1tpXVtrXSA9IHBhW2tdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBsZW4gPSByZXNbaV0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAocmVzW2ldWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ6XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gbXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gbXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggKz0gK3Jlc1tpXVtsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeSArPSArcmVzW2ldW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ICs9ICtyZXNbaV1bbGVuIC0gMl07XG4gICAgICAgICAgICAgICAgICAgICAgICB5ICs9ICtyZXNbaV1bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnRvU3RyaW5nID0gUi5fcGF0aDJzdHJpbmc7XG4gICAgICAgICAgICBwdGgucmVsID0gcGF0aENsb25lKHJlcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LFxuICAgICAgICBwYXRoVG9BYnNvbHV0ZSA9IFIuX3BhdGhUb0Fic29sdXRlID0gZnVuY3Rpb24gKHBhdGhBcnJheSkge1xuICAgICAgICAgICAgdmFyIHB0aCA9IHBhdGhzKHBhdGhBcnJheSk7XG4gICAgICAgICAgICBpZiAocHRoLmFicykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoQ2xvbmUocHRoLmFicyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIVIuaXMocGF0aEFycmF5LCBhcnJheSkgfHwgIVIuaXMocGF0aEFycmF5ICYmIHBhdGhBcnJheVswXSwgYXJyYXkpKSB7IC8vIHJvdWdoIGFzc3VtcHRpb25cbiAgICAgICAgICAgICAgICBwYXRoQXJyYXkgPSBSLnBhcnNlUGF0aFN0cmluZyhwYXRoQXJyYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwYXRoQXJyYXkgfHwgIXBhdGhBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1tcIk1cIiwgMCwgMF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlcyA9IFtdLFxuICAgICAgICAgICAgICAgIHggPSAwLFxuICAgICAgICAgICAgICAgIHkgPSAwLFxuICAgICAgICAgICAgICAgIG14ID0gMCxcbiAgICAgICAgICAgICAgICBteSA9IDAsXG4gICAgICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICAgICAgaWYgKHBhdGhBcnJheVswXVswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgIHggPSArcGF0aEFycmF5WzBdWzFdO1xuICAgICAgICAgICAgICAgIHkgPSArcGF0aEFycmF5WzBdWzJdO1xuICAgICAgICAgICAgICAgIG14ID0geDtcbiAgICAgICAgICAgICAgICBteSA9IHk7XG4gICAgICAgICAgICAgICAgc3RhcnQrKztcbiAgICAgICAgICAgICAgICByZXNbMF0gPSBbXCJNXCIsIHgsIHldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNyeiA9IHBhdGhBcnJheS5sZW5ndGggPT0gMyAmJiBwYXRoQXJyYXlbMF1bMF0gPT0gXCJNXCIgJiYgcGF0aEFycmF5WzFdWzBdLnRvVXBwZXJDYXNlKCkgPT0gXCJSXCIgJiYgcGF0aEFycmF5WzJdWzBdLnRvVXBwZXJDYXNlKCkgPT0gXCJaXCI7XG4gICAgICAgICAgICBmb3IgKHZhciByLCBwYSwgaSA9IHN0YXJ0LCBpaSA9IHBhdGhBcnJheS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2gociA9IFtdKTtcbiAgICAgICAgICAgICAgICBwYSA9IHBhdGhBcnJheVtpXTtcbiAgICAgICAgICAgICAgICBpZiAocGFbMF0gIT0gdXBwZXJDYXNlLmNhbGwocGFbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJbMF0gPSB1cHBlckNhc2UuY2FsbChwYVswXSk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoclswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gcGFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclsyXSA9IHBhWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbM10gPSBwYVszXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzRdID0gcGFbNF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls1XSA9IHBhWzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbNl0gPSArKHBhWzZdICsgeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls3XSA9ICsocGFbN10gKyB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJWXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9ICtwYVsxXSArIHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSArcGFbMV0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZG90cyA9IFt4LCB5XVtjb25jYXRdKHBhLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMiwgamogPSBkb3RzLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG90c1tqXSA9ICtkb3RzW2pdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG90c1srK2pdID0gK2RvdHNbal0gKyB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzW2NvbmNhdF0oY2F0bXVsbFJvbTJiZXppZXIoZG90cywgY3J6KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14ID0gK3BhWzFdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteSA9ICtwYVsyXSArIHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGpqID0gcGEubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByW2pdID0gK3BhW2pdICsgKChqICUgMikgPyB4IDogeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYVswXSA9PSBcIlJcIikge1xuICAgICAgICAgICAgICAgICAgICBkb3RzID0gW3gsIHldW2NvbmNhdF0ocGEuc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlc1tjb25jYXRdKGNhdG11bGxSb20yYmV6aWVyKGRvdHMsIGNyeikpO1xuICAgICAgICAgICAgICAgICAgICByID0gW1wiUlwiXVtjb25jYXRdKHBhLnNsaWNlKC0yKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDAsIGtrID0gcGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcltrXSA9IHBhW2tdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN3aXRjaCAoclswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiWlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IG14O1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IG15O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gclsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHJbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG14ID0gcltyLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXkgPSByW3IubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gcltyLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHJbci5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMudG9TdHJpbmcgPSBSLl9wYXRoMnN0cmluZztcbiAgICAgICAgICAgIHB0aC5hYnMgPSBwYXRoQ2xvbmUocmVzKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGwyYyA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICAgICAgcmV0dXJuIFt4MSwgeTEsIHgyLCB5MiwgeDIsIHkyXTtcbiAgICAgICAgfSxcbiAgICAgICAgcTJjID0gZnVuY3Rpb24gKHgxLCB5MSwgYXgsIGF5LCB4MiwgeTIpIHtcbiAgICAgICAgICAgIHZhciBfMTMgPSAxIC8gMyxcbiAgICAgICAgICAgICAgICBfMjMgPSAyIC8gMztcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgIF8xMyAqIHgxICsgXzIzICogYXgsXG4gICAgICAgICAgICAgICAgICAgIF8xMyAqIHkxICsgXzIzICogYXksXG4gICAgICAgICAgICAgICAgICAgIF8xMyAqIHgyICsgXzIzICogYXgsXG4gICAgICAgICAgICAgICAgICAgIF8xMyAqIHkyICsgXzIzICogYXksXG4gICAgICAgICAgICAgICAgICAgIHgyLFxuICAgICAgICAgICAgICAgICAgICB5MlxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgIH0sXG4gICAgICAgIGEyYyA9IGZ1bmN0aW9uICh4MSwgeTEsIHJ4LCByeSwgYW5nbGUsIGxhcmdlX2FyY19mbGFnLCBzd2VlcF9mbGFnLCB4MiwgeTIsIHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgLy8gZm9yIG1vcmUgaW5mb3JtYXRpb24gb2Ygd2hlcmUgdGhpcyBtYXRoIGNhbWUgZnJvbSB2aXNpdDpcbiAgICAgICAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ltcGxub3RlLmh0bWwjQXJjSW1wbGVtZW50YXRpb25Ob3Rlc1xuICAgICAgICAgICAgdmFyIF8xMjAgPSBQSSAqIDEyMCAvIDE4MCxcbiAgICAgICAgICAgICAgICByYWQgPSBQSSAvIDE4MCAqICgrYW5nbGUgfHwgMCksXG4gICAgICAgICAgICAgICAgcmVzID0gW10sXG4gICAgICAgICAgICAgICAgeHksXG4gICAgICAgICAgICAgICAgcm90YXRlID0gY2FjaGVyKGZ1bmN0aW9uICh4LCB5LCByYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIFggPSB4ICogbWF0aC5jb3MocmFkKSAtIHkgKiBtYXRoLnNpbihyYWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgWSA9IHggKiBtYXRoLnNpbihyYWQpICsgeSAqIG1hdGguY29zKHJhZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7eDogWCwgeTogWX07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIXJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIHh5ID0gcm90YXRlKHgxLCB5MSwgLXJhZCk7XG4gICAgICAgICAgICAgICAgeDEgPSB4eS54O1xuICAgICAgICAgICAgICAgIHkxID0geHkueTtcbiAgICAgICAgICAgICAgICB4eSA9IHJvdGF0ZSh4MiwgeTIsIC1yYWQpO1xuICAgICAgICAgICAgICAgIHgyID0geHkueDtcbiAgICAgICAgICAgICAgICB5MiA9IHh5Lnk7XG4gICAgICAgICAgICAgICAgdmFyIGNvcyA9IG1hdGguY29zKFBJIC8gMTgwICogYW5nbGUpLFxuICAgICAgICAgICAgICAgICAgICBzaW4gPSBtYXRoLnNpbihQSSAvIDE4MCAqIGFuZ2xlKSxcbiAgICAgICAgICAgICAgICAgICAgeCA9ICh4MSAtIHgyKSAvIDIsXG4gICAgICAgICAgICAgICAgICAgIHkgPSAoeTEgLSB5MikgLyAyO1xuICAgICAgICAgICAgICAgIHZhciBoID0gKHggKiB4KSAvIChyeCAqIHJ4KSArICh5ICogeSkgLyAocnkgKiByeSk7XG4gICAgICAgICAgICAgICAgaWYgKGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGggPSBtYXRoLnNxcnQoaCk7XG4gICAgICAgICAgICAgICAgICAgIHJ4ID0gaCAqIHJ4O1xuICAgICAgICAgICAgICAgICAgICByeSA9IGggKiByeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHJ4MiA9IHJ4ICogcngsXG4gICAgICAgICAgICAgICAgICAgIHJ5MiA9IHJ5ICogcnksXG4gICAgICAgICAgICAgICAgICAgIGsgPSAobGFyZ2VfYXJjX2ZsYWcgPT0gc3dlZXBfZmxhZyA/IC0xIDogMSkgKlxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0aC5zcXJ0KGFicygocngyICogcnkyIC0gcngyICogeSAqIHkgLSByeTIgKiB4ICogeCkgLyAocngyICogeSAqIHkgKyByeTIgKiB4ICogeCkpKSxcbiAgICAgICAgICAgICAgICAgICAgY3ggPSBrICogcnggKiB5IC8gcnkgKyAoeDEgKyB4MikgLyAyLFxuICAgICAgICAgICAgICAgICAgICBjeSA9IGsgKiAtcnkgKiB4IC8gcnggKyAoeTEgKyB5MikgLyAyLFxuICAgICAgICAgICAgICAgICAgICBmMSA9IG1hdGguYXNpbigoKHkxIC0gY3kpIC8gcnkpLnRvRml4ZWQoOSkpLFxuICAgICAgICAgICAgICAgICAgICBmMiA9IG1hdGguYXNpbigoKHkyIC0gY3kpIC8gcnkpLnRvRml4ZWQoOSkpO1xuXG4gICAgICAgICAgICAgICAgZjEgPSB4MSA8IGN4ID8gUEkgLSBmMSA6IGYxO1xuICAgICAgICAgICAgICAgIGYyID0geDIgPCBjeCA/IFBJIC0gZjIgOiBmMjtcbiAgICAgICAgICAgICAgICBmMSA8IDAgJiYgKGYxID0gUEkgKiAyICsgZjEpO1xuICAgICAgICAgICAgICAgIGYyIDwgMCAmJiAoZjIgPSBQSSAqIDIgKyBmMik7XG4gICAgICAgICAgICAgICAgaWYgKHN3ZWVwX2ZsYWcgJiYgZjEgPiBmMikge1xuICAgICAgICAgICAgICAgICAgICBmMSA9IGYxIC0gUEkgKiAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXN3ZWVwX2ZsYWcgJiYgZjIgPiBmMSkge1xuICAgICAgICAgICAgICAgICAgICBmMiA9IGYyIC0gUEkgKiAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZjEgPSByZWN1cnNpdmVbMF07XG4gICAgICAgICAgICAgICAgZjIgPSByZWN1cnNpdmVbMV07XG4gICAgICAgICAgICAgICAgY3ggPSByZWN1cnNpdmVbMl07XG4gICAgICAgICAgICAgICAgY3kgPSByZWN1cnNpdmVbM107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZGYgPSBmMiAtIGYxO1xuICAgICAgICAgICAgaWYgKGFicyhkZikgPiBfMTIwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGYyb2xkID0gZjIsXG4gICAgICAgICAgICAgICAgICAgIHgyb2xkID0geDIsXG4gICAgICAgICAgICAgICAgICAgIHkyb2xkID0geTI7XG4gICAgICAgICAgICAgICAgZjIgPSBmMSArIF8xMjAgKiAoc3dlZXBfZmxhZyAmJiBmMiA+IGYxID8gMSA6IC0xKTtcbiAgICAgICAgICAgICAgICB4MiA9IGN4ICsgcnggKiBtYXRoLmNvcyhmMik7XG4gICAgICAgICAgICAgICAgeTIgPSBjeSArIHJ5ICogbWF0aC5zaW4oZjIpO1xuICAgICAgICAgICAgICAgIHJlcyA9IGEyYyh4MiwgeTIsIHJ4LCByeSwgYW5nbGUsIDAsIHN3ZWVwX2ZsYWcsIHgyb2xkLCB5Mm9sZCwgW2YyLCBmMm9sZCwgY3gsIGN5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZiA9IGYyIC0gZjE7XG4gICAgICAgICAgICB2YXIgYzEgPSBtYXRoLmNvcyhmMSksXG4gICAgICAgICAgICAgICAgczEgPSBtYXRoLnNpbihmMSksXG4gICAgICAgICAgICAgICAgYzIgPSBtYXRoLmNvcyhmMiksXG4gICAgICAgICAgICAgICAgczIgPSBtYXRoLnNpbihmMiksXG4gICAgICAgICAgICAgICAgdCA9IG1hdGgudGFuKGRmIC8gNCksXG4gICAgICAgICAgICAgICAgaHggPSA0IC8gMyAqIHJ4ICogdCxcbiAgICAgICAgICAgICAgICBoeSA9IDQgLyAzICogcnkgKiB0LFxuICAgICAgICAgICAgICAgIG0xID0gW3gxLCB5MV0sXG4gICAgICAgICAgICAgICAgbTIgPSBbeDEgKyBoeCAqIHMxLCB5MSAtIGh5ICogYzFdLFxuICAgICAgICAgICAgICAgIG0zID0gW3gyICsgaHggKiBzMiwgeTIgLSBoeSAqIGMyXSxcbiAgICAgICAgICAgICAgICBtNCA9IFt4MiwgeTJdO1xuICAgICAgICAgICAgbTJbMF0gPSAyICogbTFbMF0gLSBtMlswXTtcbiAgICAgICAgICAgIG0yWzFdID0gMiAqIG0xWzFdIC0gbTJbMV07XG4gICAgICAgICAgICBpZiAocmVjdXJzaXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFttMiwgbTMsIG00XVtjb25jYXRdKHJlcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyA9IFttMiwgbTMsIG00XVtjb25jYXRdKHJlcykuam9pbigpW3NwbGl0XShcIixcIik7XG4gICAgICAgICAgICAgICAgdmFyIG5ld3JlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHJlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld3Jlc1tpXSA9IGkgJSAyID8gcm90YXRlKHJlc1tpIC0gMV0sIHJlc1tpXSwgcmFkKS55IDogcm90YXRlKHJlc1tpXSwgcmVzW2kgKyAxXSwgcmFkKS54O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3cmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBmaW5kRG90QXRTZWdtZW50ID0gZnVuY3Rpb24gKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0KSB7XG4gICAgICAgICAgICB2YXIgdDEgPSAxIC0gdDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogcG93KHQxLCAzKSAqIHAxeCArIHBvdyh0MSwgMikgKiAzICogdCAqIGMxeCArIHQxICogMyAqIHQgKiB0ICogYzJ4ICsgcG93KHQsIDMpICogcDJ4LFxuICAgICAgICAgICAgICAgIHk6IHBvdyh0MSwgMykgKiBwMXkgKyBwb3codDEsIDIpICogMyAqIHQgKiBjMXkgKyB0MSAqIDMgKiB0ICogdCAqIGMyeSArIHBvdyh0LCAzKSAqIHAyeVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgY3VydmVEaW0gPSBjYWNoZXIoZnVuY3Rpb24gKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5KSB7XG4gICAgICAgICAgICB2YXIgYSA9IChjMnggLSAyICogYzF4ICsgcDF4KSAtIChwMnggLSAyICogYzJ4ICsgYzF4KSxcbiAgICAgICAgICAgICAgICBiID0gMiAqIChjMXggLSBwMXgpIC0gMiAqIChjMnggLSBjMXgpLFxuICAgICAgICAgICAgICAgIGMgPSBwMXggLSBjMXgsXG4gICAgICAgICAgICAgICAgdDEgPSAoLWIgKyBtYXRoLnNxcnQoYiAqIGIgLSA0ICogYSAqIGMpKSAvIDIgLyBhLFxuICAgICAgICAgICAgICAgIHQyID0gKC1iIC0gbWF0aC5zcXJ0KGIgKiBiIC0gNCAqIGEgKiBjKSkgLyAyIC8gYSxcbiAgICAgICAgICAgICAgICB5ID0gW3AxeSwgcDJ5XSxcbiAgICAgICAgICAgICAgICB4ID0gW3AxeCwgcDJ4XSxcbiAgICAgICAgICAgICAgICBkb3Q7XG4gICAgICAgICAgICBhYnModDEpID4gXCIxZTEyXCIgJiYgKHQxID0gLjUpO1xuICAgICAgICAgICAgYWJzKHQyKSA+IFwiMWUxMlwiICYmICh0MiA9IC41KTtcbiAgICAgICAgICAgIGlmICh0MSA+IDAgJiYgdDEgPCAxKSB7XG4gICAgICAgICAgICAgICAgZG90ID0gZmluZERvdEF0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdDEpO1xuICAgICAgICAgICAgICAgIHgucHVzaChkb3QueCk7XG4gICAgICAgICAgICAgICAgeS5wdXNoKGRvdC55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0MiA+IDAgJiYgdDIgPCAxKSB7XG4gICAgICAgICAgICAgICAgZG90ID0gZmluZERvdEF0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdDIpO1xuICAgICAgICAgICAgICAgIHgucHVzaChkb3QueCk7XG4gICAgICAgICAgICAgICAgeS5wdXNoKGRvdC55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEgPSAoYzJ5IC0gMiAqIGMxeSArIHAxeSkgLSAocDJ5IC0gMiAqIGMyeSArIGMxeSk7XG4gICAgICAgICAgICBiID0gMiAqIChjMXkgLSBwMXkpIC0gMiAqIChjMnkgLSBjMXkpO1xuICAgICAgICAgICAgYyA9IHAxeSAtIGMxeTtcbiAgICAgICAgICAgIHQxID0gKC1iICsgbWF0aC5zcXJ0KGIgKiBiIC0gNCAqIGEgKiBjKSkgLyAyIC8gYTtcbiAgICAgICAgICAgIHQyID0gKC1iIC0gbWF0aC5zcXJ0KGIgKiBiIC0gNCAqIGEgKiBjKSkgLyAyIC8gYTtcbiAgICAgICAgICAgIGFicyh0MSkgPiBcIjFlMTJcIiAmJiAodDEgPSAuNSk7XG4gICAgICAgICAgICBhYnModDIpID4gXCIxZTEyXCIgJiYgKHQyID0gLjUpO1xuICAgICAgICAgICAgaWYgKHQxID4gMCAmJiB0MSA8IDEpIHtcbiAgICAgICAgICAgICAgICBkb3QgPSBmaW5kRG90QXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0MSk7XG4gICAgICAgICAgICAgICAgeC5wdXNoKGRvdC54KTtcbiAgICAgICAgICAgICAgICB5LnB1c2goZG90LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQyID4gMCAmJiB0MiA8IDEpIHtcbiAgICAgICAgICAgICAgICBkb3QgPSBmaW5kRG90QXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0Mik7XG4gICAgICAgICAgICAgICAgeC5wdXNoKGRvdC54KTtcbiAgICAgICAgICAgICAgICB5LnB1c2goZG90LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtaW46IHt4OiBtbWluW2FwcGx5XSgwLCB4KSwgeTogbW1pblthcHBseV0oMCwgeSl9LFxuICAgICAgICAgICAgICAgIG1heDoge3g6IG1tYXhbYXBwbHldKDAsIHgpLCB5OiBtbWF4W2FwcGx5XSgwLCB5KX1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pLFxuICAgICAgICBwYXRoMmN1cnZlID0gUi5fcGF0aDJjdXJ2ZSA9IGNhY2hlcihmdW5jdGlvbiAocGF0aCwgcGF0aDIpIHtcbiAgICAgICAgICAgIHZhciBwdGggPSAhcGF0aDIgJiYgcGF0aHMocGF0aCk7XG4gICAgICAgICAgICBpZiAoIXBhdGgyICYmIHB0aC5jdXJ2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoQ2xvbmUocHRoLmN1cnZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwID0gcGF0aFRvQWJzb2x1dGUocGF0aCksXG4gICAgICAgICAgICAgICAgcDIgPSBwYXRoMiAmJiBwYXRoVG9BYnNvbHV0ZShwYXRoMiksXG4gICAgICAgICAgICAgICAgYXR0cnMgPSB7eDogMCwgeTogMCwgYng6IDAsIGJ5OiAwLCBYOiAwLCBZOiAwLCBxeDogbnVsbCwgcXk6IG51bGx9LFxuICAgICAgICAgICAgICAgIGF0dHJzMiA9IHt4OiAwLCB5OiAwLCBieDogMCwgYnk6IDAsIFg6IDAsIFk6IDAsIHF4OiBudWxsLCBxeTogbnVsbH0sXG4gICAgICAgICAgICAgICAgcHJvY2Vzc1BhdGggPSBmdW5jdGlvbiAocGF0aCwgZCwgcGNvbSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbngsIG55LCB0cSA9IHtUOjEsIFE6MX07XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtcIkNcIiwgZC54LCBkLnksIGQueCwgZC55LCBkLngsIGQueV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgIShwYXRoWzBdIGluIHRxKSAmJiAoZC5xeCA9IGQucXkgPSBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChwYXRoWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuWCA9IHBhdGhbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5ZID0gcGF0aFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl1bY29uY2F0XShhMmNbYXBwbHldKDAsIFtkLngsIGQueV1bY29uY2F0XShwYXRoLnNsaWNlKDEpKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGNvbSA9PSBcIkNcIiB8fCBwY29tID09IFwiU1wiKSB7IC8vIEluIFwiU1wiIGNhc2Ugd2UgaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCwgaWYgdGhlIHByZXZpb3VzIGNvbW1hbmQgaXMgQy9TLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBueCA9IGQueCAqIDIgLSBkLmJ4OyAgICAgICAgICAvLyBBbmQgcmVmbGVjdCB0aGUgcHJldmlvdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnkgPSBkLnkgKiAyIC0gZC5ieTsgICAgICAgICAgLy8gY29tbWFuZCdzIGNvbnRyb2wgcG9pbnQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgcG9pbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvciBzb21lIGVsc2Ugb3Igbm90aGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBueCA9IGQueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnkgPSBkLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCIsIG54LCBueV1bY29uY2F0XShwYXRoLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBjb20gPT0gXCJRXCIgfHwgcGNvbSA9PSBcIlRcIikgeyAvLyBJbiBcIlRcIiBjYXNlIHdlIGhhdmUgdG8gdGFrZSBpbnRvIGFjY291bnQsIGlmIHRoZSBwcmV2aW91cyBjb21tYW5kIGlzIFEvVC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeCA9IGQueCAqIDIgLSBkLnF4OyAgICAgICAgLy8gQW5kIG1ha2UgYSByZWZsZWN0aW9uIHNpbWlsYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeSA9IGQueSAqIDIgLSBkLnF5OyAgICAgICAgLy8gdG8gY2FzZSBcIlNcIi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9yIHNvbWV0aGluZyBlbHNlIG9yIG5vdGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeCA9IGQueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeSA9IGQueTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl1bY29uY2F0XShxMmMoZC54LCBkLnksIGQucXgsIGQucXksIHBhdGhbMV0sIHBhdGhbMl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJRXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeCA9IHBhdGhbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeSA9IHBhdGhbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl1bY29uY2F0XShxMmMoZC54LCBkLnksIHBhdGhbMV0sIHBhdGhbMl0sIHBhdGhbM10sIHBhdGhbNF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl1bY29uY2F0XShsMmMoZC54LCBkLnksIHBhdGhbMV0sIHBhdGhbMl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl1bY29uY2F0XShsMmMoZC54LCBkLnksIHBhdGhbMV0sIGQueSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXVtjb25jYXRdKGwyYyhkLngsIGQueSwgZC54LCBwYXRoWzFdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiWlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdW2NvbmNhdF0obDJjKGQueCwgZC55LCBkLlgsIGQuWSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZml4QXJjID0gZnVuY3Rpb24gKHBwLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcFtpXS5sZW5ndGggPiA3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcFtpXS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBpID0gcHBbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAocGkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGNvbXMxW2ldPVwiQVwiOyAvLyBpZiBjcmVhdGVkIG11bHRpcGxlIEM6cywgdGhlaXIgb3JpZ2luYWwgc2VnIGlzIHNhdmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcDIgJiYgKHBjb21zMltpXT1cIkFcIik7IC8vIHRoZSBzYW1lIGFzIGFib3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHAuc3BsaWNlKGkrKywgMCwgW1wiQ1wiXVtjb25jYXRdKHBpLnNwbGljZSgwLCA2KSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcHAuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWkgPSBtbWF4KHAubGVuZ3RoLCBwMiAmJiBwMi5sZW5ndGggfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZpeE0gPSBmdW5jdGlvbiAocGF0aDEsIHBhdGgyLCBhMSwgYTIsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGgxICYmIHBhdGgyICYmIHBhdGgxW2ldWzBdID09IFwiTVwiICYmIHBhdGgyW2ldWzBdICE9IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoMi5zcGxpY2UoaSwgMCwgW1wiTVwiLCBhMi54LCBhMi55XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhMS5ieCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBhMS5ieSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBhMS54ID0gcGF0aDFbaV1bMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBhMS55ID0gcGF0aDFbaV1bMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBpaSA9IG1tYXgocC5sZW5ndGgsIHAyICYmIHAyLmxlbmd0aCB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcGNvbXMxID0gW10sIC8vIHBhdGggY29tbWFuZHMgb2Ygb3JpZ2luYWwgcGF0aCBwXG4gICAgICAgICAgICAgICAgcGNvbXMyID0gW10sIC8vIHBhdGggY29tbWFuZHMgb2Ygb3JpZ2luYWwgcGF0aCBwMlxuICAgICAgICAgICAgICAgIHBmaXJzdCA9IFwiXCIsIC8vIHRlbXBvcmFyeSBob2xkZXIgZm9yIG9yaWdpbmFsIHBhdGggY29tbWFuZFxuICAgICAgICAgICAgICAgIHBjb20gPSBcIlwiOyAvLyBob2xkZXIgZm9yIHByZXZpb3VzIHBhdGggY29tbWFuZCBvZiBvcmlnaW5hbCBwYXRoXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBtbWF4KHAubGVuZ3RoLCBwMiAmJiBwMi5sZW5ndGggfHwgMCk7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcFtpXSAmJiAocGZpcnN0ID0gcFtpXVswXSk7IC8vIHNhdmUgY3VycmVudCBwYXRoIGNvbW1hbmRcblxuICAgICAgICAgICAgICAgIGlmIChwZmlyc3QgIT0gXCJDXCIpIC8vIEMgaXMgbm90IHNhdmVkIHlldCwgYmVjYXVzZSBpdCBtYXkgYmUgcmVzdWx0IG9mIGNvbnZlcnNpb25cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHBjb21zMVtpXSA9IHBmaXJzdDsgLy8gU2F2ZSBjdXJyZW50IHBhdGggY29tbWFuZFxuICAgICAgICAgICAgICAgICAgICBpICYmICggcGNvbSA9IHBjb21zMVtpLTFdKTsgLy8gR2V0IHByZXZpb3VzIHBhdGggY29tbWFuZCBwY29tXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBbaV0gPSBwcm9jZXNzUGF0aChwW2ldLCBhdHRycywgcGNvbSk7IC8vIFByZXZpb3VzIHBhdGggY29tbWFuZCBpcyBpbnB1dHRlZCB0byBwcm9jZXNzUGF0aFxuXG4gICAgICAgICAgICAgICAgaWYgKHBjb21zMVtpXSAhPSBcIkFcIiAmJiBwZmlyc3QgPT0gXCJDXCIpIHBjb21zMVtpXSA9IFwiQ1wiOyAvLyBBIGlzIHRoZSBvbmx5IGNvbW1hbmRcbiAgICAgICAgICAgICAgICAvLyB3aGljaCBtYXkgcHJvZHVjZSBtdWx0aXBsZSBDOnNcbiAgICAgICAgICAgICAgICAvLyBzbyB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IEMgaXMgYWxzbyBDIGluIG9yaWdpbmFsIHBhdGhcblxuICAgICAgICAgICAgICAgIGZpeEFyYyhwLCBpKTsgLy8gZml4QXJjIGFkZHMgYWxzbyB0aGUgcmlnaHQgYW1vdW50IG9mIEE6cyB0byBwY29tczFcblxuICAgICAgICAgICAgICAgIGlmIChwMikgeyAvLyB0aGUgc2FtZSBwcm9jZWR1cmVzIGlzIGRvbmUgdG8gcDJcbiAgICAgICAgICAgICAgICAgICAgcDJbaV0gJiYgKHBmaXJzdCA9IHAyW2ldWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBmaXJzdCAhPSBcIkNcIilcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGNvbXMyW2ldID0gcGZpcnN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaSAmJiAocGNvbSA9IHBjb21zMltpLTFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwMltpXSA9IHByb2Nlc3NQYXRoKHAyW2ldLCBhdHRyczIsIHBjb20pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwY29tczJbaV0hPVwiQVwiICYmIHBmaXJzdD09XCJDXCIpIHBjb21zMltpXT1cIkNcIjtcblxuICAgICAgICAgICAgICAgICAgICBmaXhBcmMocDIsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaXhNKHAsIHAyLCBhdHRycywgYXR0cnMyLCBpKTtcbiAgICAgICAgICAgICAgICBmaXhNKHAyLCBwLCBhdHRyczIsIGF0dHJzLCBpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2VnID0gcFtpXSxcbiAgICAgICAgICAgICAgICAgICAgc2VnMiA9IHAyICYmIHAyW2ldLFxuICAgICAgICAgICAgICAgICAgICBzZWdsZW4gPSBzZWcubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBzZWcybGVuID0gcDIgJiYgc2VnMi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgYXR0cnMueCA9IHNlZ1tzZWdsZW4gLSAyXTtcbiAgICAgICAgICAgICAgICBhdHRycy55ID0gc2VnW3NlZ2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgIGF0dHJzLmJ4ID0gdG9GbG9hdChzZWdbc2VnbGVuIC0gNF0pIHx8IGF0dHJzLng7XG4gICAgICAgICAgICAgICAgYXR0cnMuYnkgPSB0b0Zsb2F0KHNlZ1tzZWdsZW4gLSAzXSkgfHwgYXR0cnMueTtcbiAgICAgICAgICAgICAgICBhdHRyczIuYnggPSBwMiAmJiAodG9GbG9hdChzZWcyW3NlZzJsZW4gLSA0XSkgfHwgYXR0cnMyLngpO1xuICAgICAgICAgICAgICAgIGF0dHJzMi5ieSA9IHAyICYmICh0b0Zsb2F0KHNlZzJbc2VnMmxlbiAtIDNdKSB8fCBhdHRyczIueSk7XG4gICAgICAgICAgICAgICAgYXR0cnMyLnggPSBwMiAmJiBzZWcyW3NlZzJsZW4gLSAyXTtcbiAgICAgICAgICAgICAgICBhdHRyczIueSA9IHAyICYmIHNlZzJbc2VnMmxlbiAtIDFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwMikge1xuICAgICAgICAgICAgICAgIHB0aC5jdXJ2ZSA9IHBhdGhDbG9uZShwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwMiA/IFtwLCBwMl0gOiBwO1xuICAgICAgICB9LCBudWxsLCBwYXRoQ2xvbmUpLFxuICAgICAgICBwYXJzZURvdHMgPSBSLl9wYXJzZURvdHMgPSBjYWNoZXIoZnVuY3Rpb24gKGdyYWRpZW50KSB7XG4gICAgICAgICAgICB2YXIgZG90cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZ3JhZGllbnQubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBkb3QgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyID0gZ3JhZGllbnRbaV0ubWF0Y2goL14oW146XSopOj8oW1xcZFxcLl0qKS8pO1xuICAgICAgICAgICAgICAgIGRvdC5jb2xvciA9IFIuZ2V0UkdCKHBhclsxXSk7XG4gICAgICAgICAgICAgICAgaWYgKGRvdC5jb2xvci5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG90LmNvbG9yID0gZG90LmNvbG9yLmhleDtcbiAgICAgICAgICAgICAgICBwYXJbMl0gJiYgKGRvdC5vZmZzZXQgPSBwYXJbMl0gKyBcIiVcIik7XG4gICAgICAgICAgICAgICAgZG90cy5wdXNoKGRvdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAxLCBpaSA9IGRvdHMubGVuZ3RoIC0gMTsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIWRvdHNbaV0ub2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGFydCA9IHRvRmxvYXQoZG90c1tpIC0gMV0ub2Zmc2V0IHx8IDApLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgKyAxOyBqIDwgaWk7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvdHNbal0ub2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kID0gZG90c1tqXS5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGogPSBpaTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbmQgPSB0b0Zsb2F0KGVuZCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkID0gKGVuZCAtIHN0YXJ0KSAvIChqIC0gaSArIDEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgKz0gZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvdHNbaV0ub2Zmc2V0ID0gc3RhcnQgKyBcIiVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb3RzO1xuICAgICAgICB9KSxcbiAgICAgICAgdGVhciA9IFIuX3RlYXIgPSBmdW5jdGlvbiAoZWwsIHBhcGVyKSB7XG4gICAgICAgICAgICBlbCA9PSBwYXBlci50b3AgJiYgKHBhcGVyLnRvcCA9IGVsLnByZXYpO1xuICAgICAgICAgICAgZWwgPT0gcGFwZXIuYm90dG9tICYmIChwYXBlci5ib3R0b20gPSBlbC5uZXh0KTtcbiAgICAgICAgICAgIGVsLm5leHQgJiYgKGVsLm5leHQucHJldiA9IGVsLnByZXYpO1xuICAgICAgICAgICAgZWwucHJldiAmJiAoZWwucHJldi5uZXh0ID0gZWwubmV4dCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZnJvbnQgPSBSLl90b2Zyb250ID0gZnVuY3Rpb24gKGVsLCBwYXBlcikge1xuICAgICAgICAgICAgaWYgKHBhcGVyLnRvcCA9PT0gZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZWFyKGVsLCBwYXBlcik7XG4gICAgICAgICAgICBlbC5uZXh0ID0gbnVsbDtcbiAgICAgICAgICAgIGVsLnByZXYgPSBwYXBlci50b3A7XG4gICAgICAgICAgICBwYXBlci50b3AubmV4dCA9IGVsO1xuICAgICAgICAgICAgcGFwZXIudG9wID0gZWw7XG4gICAgICAgIH0sXG4gICAgICAgIHRvYmFjayA9IFIuX3RvYmFjayA9IGZ1bmN0aW9uIChlbCwgcGFwZXIpIHtcbiAgICAgICAgICAgIGlmIChwYXBlci5ib3R0b20gPT09IGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGVhcihlbCwgcGFwZXIpO1xuICAgICAgICAgICAgZWwubmV4dCA9IHBhcGVyLmJvdHRvbTtcbiAgICAgICAgICAgIGVsLnByZXYgPSBudWxsO1xuICAgICAgICAgICAgcGFwZXIuYm90dG9tLnByZXYgPSBlbDtcbiAgICAgICAgICAgIHBhcGVyLmJvdHRvbSA9IGVsO1xuICAgICAgICB9LFxuICAgICAgICBpbnNlcnRhZnRlciA9IFIuX2luc2VydGFmdGVyID0gZnVuY3Rpb24gKGVsLCBlbDIsIHBhcGVyKSB7XG4gICAgICAgICAgICB0ZWFyKGVsLCBwYXBlcik7XG4gICAgICAgICAgICBlbDIgPT0gcGFwZXIudG9wICYmIChwYXBlci50b3AgPSBlbCk7XG4gICAgICAgICAgICBlbDIubmV4dCAmJiAoZWwyLm5leHQucHJldiA9IGVsKTtcbiAgICAgICAgICAgIGVsLm5leHQgPSBlbDIubmV4dDtcbiAgICAgICAgICAgIGVsLnByZXYgPSBlbDI7XG4gICAgICAgICAgICBlbDIubmV4dCA9IGVsO1xuICAgICAgICB9LFxuICAgICAgICBpbnNlcnRiZWZvcmUgPSBSLl9pbnNlcnRiZWZvcmUgPSBmdW5jdGlvbiAoZWwsIGVsMiwgcGFwZXIpIHtcbiAgICAgICAgICAgIHRlYXIoZWwsIHBhcGVyKTtcbiAgICAgICAgICAgIGVsMiA9PSBwYXBlci5ib3R0b20gJiYgKHBhcGVyLmJvdHRvbSA9IGVsKTtcbiAgICAgICAgICAgIGVsMi5wcmV2ICYmIChlbDIucHJldi5uZXh0ID0gZWwpO1xuICAgICAgICAgICAgZWwucHJldiA9IGVsMi5wcmV2O1xuICAgICAgICAgICAgZWwyLnByZXYgPSBlbDtcbiAgICAgICAgICAgIGVsLm5leHQgPSBlbDI7XG4gICAgICAgIH0sXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUmFwaGFlbC50b01hdHJpeFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgbWF0cml4IG9mIHRyYW5zZm9ybWF0aW9ucyBhcHBsaWVkIHRvIGEgZ2l2ZW4gcGF0aFxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgICAgIC0gdHJhbnNmb3JtIChzdHJpbmd8YXJyYXkpIHRyYW5zZm9ybWF0aW9uIHN0cmluZ1xuICAgICAgICAgPSAob2JqZWN0KSBATWF0cml4XG4gICAgICAgIFxcKi9cbiAgICAgICAgdG9NYXRyaXggPSBSLnRvTWF0cml4ID0gZnVuY3Rpb24gKHBhdGgsIHRyYW5zZm9ybSkge1xuICAgICAgICAgICAgdmFyIGJiID0gcGF0aERpbWVuc2lvbnMocGF0aCksXG4gICAgICAgICAgICAgICAgZWwgPSB7XG4gICAgICAgICAgICAgICAgICAgIF86IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogRVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXRCQm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgZXh0cmFjdFRyYW5zZm9ybShlbCwgdHJhbnNmb3JtKTtcbiAgICAgICAgICAgIHJldHVybiBlbC5tYXRyaXg7XG4gICAgICAgIH0sXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUmFwaGFlbC50cmFuc2Zvcm1QYXRoXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBwYXRoIHRyYW5zZm9ybWVkIGJ5IGEgZ2l2ZW4gdHJhbnNmb3JtYXRpb25cbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgICAgICAtIHRyYW5zZm9ybSAoc3RyaW5nfGFycmF5KSB0cmFuc2Zvcm1hdGlvbiBzdHJpbmdcbiAgICAgICAgID0gKHN0cmluZykgcGF0aFxuICAgICAgICBcXCovXG4gICAgICAgIHRyYW5zZm9ybVBhdGggPSBSLnRyYW5zZm9ybVBhdGggPSBmdW5jdGlvbiAocGF0aCwgdHJhbnNmb3JtKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwUGF0aChwYXRoLCB0b01hdHJpeChwYXRoLCB0cmFuc2Zvcm0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgZXh0cmFjdFRyYW5zZm9ybSA9IFIuX2V4dHJhY3RUcmFuc2Zvcm0gPSBmdW5jdGlvbiAoZWwsIHRzdHIpIHtcbiAgICAgICAgICAgIGlmICh0c3RyID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuXy50cmFuc2Zvcm07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0c3RyID0gU3RyKHRzdHIpLnJlcGxhY2UoL1xcLnszfXxcXHUyMDI2L2csIGVsLl8udHJhbnNmb3JtIHx8IEUpO1xuICAgICAgICAgICAgdmFyIHRkYXRhID0gUi5wYXJzZVRyYW5zZm9ybVN0cmluZyh0c3RyKSxcbiAgICAgICAgICAgICAgICBkZWcgPSAwLFxuICAgICAgICAgICAgICAgIGR4ID0gMCxcbiAgICAgICAgICAgICAgICBkeSA9IDAsXG4gICAgICAgICAgICAgICAgc3ggPSAxLFxuICAgICAgICAgICAgICAgIHN5ID0gMSxcbiAgICAgICAgICAgICAgICBfID0gZWwuXyxcbiAgICAgICAgICAgICAgICBtID0gbmV3IE1hdHJpeDtcbiAgICAgICAgICAgIF8udHJhbnNmb3JtID0gdGRhdGEgfHwgW107XG4gICAgICAgICAgICBpZiAodGRhdGEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0ZGF0YS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gdGRhdGFbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0bGVuID0gdC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gU3RyKHRbMF0pLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBhYnNvbHV0ZSA9IHRbMF0gIT0gY29tbWFuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGludmVyID0gYWJzb2x1dGUgPyBtLmludmVydCgpIDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHgxLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTEsXG4gICAgICAgICAgICAgICAgICAgICAgICB4MixcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21tYW5kID09IFwidFwiICYmIHRsZW4gPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFic29sdXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDEgPSBpbnZlci54KDAsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkxID0gaW52ZXIueSgwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGludmVyLngodFsxXSwgdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBpbnZlci55KHRbMV0sIHRbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0udHJhbnNsYXRlKHgyIC0geDEsIHkyIC0geTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnRyYW5zbGF0ZSh0WzFdLCB0WzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tYW5kID09IFwiclwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGxlbiA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmIgPSBiYiB8fCBlbC5nZXRCQm94KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0ucm90YXRlKHRbMV0sIGJiLnggKyBiYi53aWR0aCAvIDIsIGJiLnkgKyBiYi5oZWlnaHQgLyAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWcgKz0gdFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGxlbiA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFic29sdXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gaW52ZXIueCh0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBpbnZlci55KHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnJvdGF0ZSh0WzFdLCB4MiwgeTIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0ucm90YXRlKHRbMV0sIHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWcgKz0gdFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tYW5kID09IFwic1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGxlbiA9PSAyIHx8IHRsZW4gPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJiID0gYmIgfHwgZWwuZ2V0QkJveCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbdGxlbiAtIDFdLCBiYi54ICsgYmIud2lkdGggLyAyLCBiYi55ICsgYmIuaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ggKj0gdFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeSAqPSB0W3RsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGxlbiA9PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFic29sdXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gaW52ZXIueCh0WzNdLCB0WzRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBpbnZlci55KHRbM10sIHRbNF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbMl0sIHgyLCB5Mik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0WzJdLCB0WzNdLCB0WzRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ggKj0gdFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeSAqPSB0WzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT0gXCJtXCIgJiYgdGxlbiA9PSA3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLmFkZCh0WzFdLCB0WzJdLCB0WzNdLCB0WzRdLCB0WzVdLCB0WzZdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfLmRpcnR5VCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGVsLm1hdHJpeCA9IG07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxcXG4gICAgICAgICAgICAgKiBFbGVtZW50Lm1hdHJpeFxuICAgICAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgICAgICoqXG4gICAgICAgICAgICAgKiBLZWVwcyBATWF0cml4IG9iamVjdCwgd2hpY2ggcmVwcmVzZW50cyBlbGVtZW50IHRyYW5zZm9ybWF0aW9uXG4gICAgICAgICAgICBcXCovXG4gICAgICAgICAgICBlbC5tYXRyaXggPSBtO1xuXG4gICAgICAgICAgICBfLnN4ID0gc3g7XG4gICAgICAgICAgICBfLnN5ID0gc3k7XG4gICAgICAgICAgICBfLmRlZyA9IGRlZztcbiAgICAgICAgICAgIF8uZHggPSBkeCA9IG0uZTtcbiAgICAgICAgICAgIF8uZHkgPSBkeSA9IG0uZjtcblxuICAgICAgICAgICAgaWYgKHN4ID09IDEgJiYgc3kgPT0gMSAmJiAhZGVnICYmIF8uYmJveCkge1xuICAgICAgICAgICAgICAgIF8uYmJveC54ICs9ICtkeDtcbiAgICAgICAgICAgICAgICBfLmJib3gueSArPSArZHk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF8uZGlydHlUID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2V0RW1wdHkgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgdmFyIGwgPSBpdGVtWzBdO1xuICAgICAgICAgICAgc3dpdGNoIChsLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwidFwiOiByZXR1cm4gW2wsIDAsIDBdO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJtXCI6IHJldHVybiBbbCwgMSwgMCwgMCwgMSwgMCwgMF07XG4gICAgICAgICAgICAgICAgY2FzZSBcInJcIjogaWYgKGl0ZW0ubGVuZ3RoID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAwLCBpdGVtWzJdLCBpdGVtWzNdXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIFwic1wiOiBpZiAoaXRlbS5sZW5ndGggPT0gNSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDEsIDEsIGl0ZW1bM10sIGl0ZW1bNF1dO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDEsIDFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlcXVhbGlzZVRyYW5zZm9ybSA9IFIuX2VxdWFsaXNlVHJhbnNmb3JtID0gZnVuY3Rpb24gKHQxLCB0Mikge1xuICAgICAgICAgICAgdDIgPSBTdHIodDIpLnJlcGxhY2UoL1xcLnszfXxcXHUyMDI2L2csIHQxKTtcbiAgICAgICAgICAgIHQxID0gUi5wYXJzZVRyYW5zZm9ybVN0cmluZyh0MSkgfHwgW107XG4gICAgICAgICAgICB0MiA9IFIucGFyc2VUcmFuc2Zvcm1TdHJpbmcodDIpIHx8IFtdO1xuICAgICAgICAgICAgdmFyIG1heGxlbmd0aCA9IG1tYXgodDEubGVuZ3RoLCB0Mi5sZW5ndGgpLFxuICAgICAgICAgICAgICAgIGZyb20gPSBbXSxcbiAgICAgICAgICAgICAgICB0byA9IFtdLFxuICAgICAgICAgICAgICAgIGkgPSAwLCBqLCBqaixcbiAgICAgICAgICAgICAgICB0dDEsIHR0MjtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbWF4bGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0dDEgPSB0MVtpXSB8fCBnZXRFbXB0eSh0MltpXSk7XG4gICAgICAgICAgICAgICAgdHQyID0gdDJbaV0gfHwgZ2V0RW1wdHkodHQxKTtcbiAgICAgICAgICAgICAgICBpZiAoKHR0MVswXSAhPSB0dDJbMF0pIHx8XG4gICAgICAgICAgICAgICAgICAgICh0dDFbMF0udG9Mb3dlckNhc2UoKSA9PSBcInJcIiAmJiAodHQxWzJdICE9IHR0MlsyXSB8fCB0dDFbM10gIT0gdHQyWzNdKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKHR0MVswXS50b0xvd2VyQ2FzZSgpID09IFwic1wiICYmICh0dDFbM10gIT0gdHQyWzNdIHx8IHR0MVs0XSAhPSB0dDJbNF0pKVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmcm9tW2ldID0gW107XG4gICAgICAgICAgICAgICAgdG9baV0gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IG1tYXgodHQxLmxlbmd0aCwgdHQyLmxlbmd0aCk7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGogaW4gdHQxICYmIChmcm9tW2ldW2pdID0gdHQxW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgaiBpbiB0dDIgJiYgKHRvW2ldW2pdID0gdHQyW2pdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IGZyb20sXG4gICAgICAgICAgICAgICAgdG86IHRvXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIFIuX2dldENvbnRhaW5lciA9IGZ1bmN0aW9uICh4LCB5LCB3LCBoKSB7XG4gICAgICAgIHZhciBjb250YWluZXI7XG4gICAgICAgIGNvbnRhaW5lciA9IGggPT0gbnVsbCAmJiAhUi5pcyh4LCBcIm9iamVjdFwiKSA/IGcuZG9jLmdldEVsZW1lbnRCeUlkKHgpIDogeDtcbiAgICAgICAgaWYgKGNvbnRhaW5lciA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRhaW5lci50YWdOYW1lKSB7XG4gICAgICAgICAgICBpZiAoeSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBjb250YWluZXIuc3R5bGUucGl4ZWxXaWR0aCB8fCBjb250YWluZXIub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogY29udGFpbmVyLnN0eWxlLnBpeGVsSGVpZ2h0IHx8IGNvbnRhaW5lci5vZmZzZXRIZWlnaHRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHksXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogd1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbnRhaW5lcjogMSxcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgd2lkdGg6IHcsXG4gICAgICAgICAgICBoZWlnaHQ6IGhcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnBhdGhUb1JlbGF0aXZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIHBhdGggdG8gcmVsYXRpdmUgZm9ybVxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwYXRoU3RyaW5nIChzdHJpbmd8YXJyYXkpIHBhdGggc3RyaW5nIG9yIGFycmF5IG9mIHNlZ21lbnRzXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiBzZWdtZW50cy5cbiAgICBcXCovXG4gICAgUi5wYXRoVG9SZWxhdGl2ZSA9IHBhdGhUb1JlbGF0aXZlO1xuICAgIFIuX2VuZ2luZSA9IHt9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnBhdGgyY3VydmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogQ29udmVydHMgcGF0aCB0byBhIG5ldyBwYXRoIHdoZXJlIGFsbCBzZWdtZW50cyBhcmUgY3ViaWMgYmV6aWVyIGN1cnZlcy5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcGF0aFN0cmluZyAoc3RyaW5nfGFycmF5KSBwYXRoIHN0cmluZyBvciBhcnJheSBvZiBzZWdtZW50c1xuICAgICA9IChhcnJheSkgYXJyYXkgb2Ygc2VnbWVudHMuXG4gICAgXFwqL1xuICAgIFIucGF0aDJjdXJ2ZSA9IHBhdGgyY3VydmU7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwubWF0cml4XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgbWF0cml4IGJhc2VkIG9uIGdpdmVuIHBhcmFtZXRlcnMuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGEgKG51bWJlcilcbiAgICAgLSBiIChudW1iZXIpXG4gICAgIC0gYyAobnVtYmVyKVxuICAgICAtIGQgKG51bWJlcilcbiAgICAgLSBlIChudW1iZXIpXG4gICAgIC0gZiAobnVtYmVyKVxuICAgICA9IChvYmplY3QpIEBNYXRyaXhcbiAgICBcXCovXG4gICAgUi5tYXRyaXggPSBmdW5jdGlvbiAoYSwgYiwgYywgZCwgZSwgZikge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIE1hdHJpeChhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYSA9ICthO1xuICAgICAgICAgICAgdGhpcy5iID0gK2I7XG4gICAgICAgICAgICB0aGlzLmMgPSArYztcbiAgICAgICAgICAgIHRoaXMuZCA9ICtkO1xuICAgICAgICAgICAgdGhpcy5lID0gK2U7XG4gICAgICAgICAgICB0aGlzLmYgPSArZjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYSA9IDE7XG4gICAgICAgICAgICB0aGlzLmIgPSAwO1xuICAgICAgICAgICAgdGhpcy5jID0gMDtcbiAgICAgICAgICAgIHRoaXMuZCA9IDE7XG4gICAgICAgICAgICB0aGlzLmUgPSAwO1xuICAgICAgICAgICAgdGhpcy5mID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAoZnVuY3Rpb24gKG1hdHJpeHByb3RvKSB7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LmFkZFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogQWRkcyBnaXZlbiBtYXRyaXggdG8gZXhpc3Rpbmcgb25lLlxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIGEgKG51bWJlcilcbiAgICAgICAgIC0gYiAobnVtYmVyKVxuICAgICAgICAgLSBjIChudW1iZXIpXG4gICAgICAgICAtIGQgKG51bWJlcilcbiAgICAgICAgIC0gZSAobnVtYmVyKVxuICAgICAgICAgLSBmIChudW1iZXIpXG4gICAgICAgICBvclxuICAgICAgICAgLSBtYXRyaXggKG9iamVjdCkgQE1hdHJpeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLmFkZCA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgICAgICB2YXIgb3V0ID0gW1tdLCBbXSwgW11dLFxuICAgICAgICAgICAgICAgIG0gPSBbW3RoaXMuYSwgdGhpcy5jLCB0aGlzLmVdLCBbdGhpcy5iLCB0aGlzLmQsIHRoaXMuZl0sIFswLCAwLCAxXV0sXG4gICAgICAgICAgICAgICAgbWF0cml4ID0gW1thLCBjLCBlXSwgW2IsIGQsIGZdLCBbMCwgMCwgMV1dLFxuICAgICAgICAgICAgICAgIHgsIHksIHosIHJlcztcblxuICAgICAgICAgICAgaWYgKGEgJiYgYSBpbnN0YW5jZW9mIE1hdHJpeCkge1xuICAgICAgICAgICAgICAgIG1hdHJpeCA9IFtbYS5hLCBhLmMsIGEuZV0sIFthLmIsIGEuZCwgYS5mXSwgWzAsIDAsIDFdXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh4ID0gMDsgeCA8IDM7IHgrKykge1xuICAgICAgICAgICAgICAgIGZvciAoeSA9IDA7IHkgPCAzOyB5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh6ID0gMDsgeiA8IDM7IHorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IG1beF1bel0gKiBtYXRyaXhbel1beV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0W3hdW3ldID0gcmVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYSA9IG91dFswXVswXTtcbiAgICAgICAgICAgIHRoaXMuYiA9IG91dFsxXVswXTtcbiAgICAgICAgICAgIHRoaXMuYyA9IG91dFswXVsxXTtcbiAgICAgICAgICAgIHRoaXMuZCA9IG91dFsxXVsxXTtcbiAgICAgICAgICAgIHRoaXMuZSA9IG91dFswXVsyXTtcbiAgICAgICAgICAgIHRoaXMuZiA9IG91dFsxXVsyXTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguaW52ZXJ0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIGludmVydGVkIHZlcnNpb24gb2YgdGhlIG1hdHJpeFxuICAgICAgICAgPSAob2JqZWN0KSBATWF0cml4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uaW52ZXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICB4ID0gbWUuYSAqIG1lLmQgLSBtZS5iICogbWUuYztcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWF0cml4KG1lLmQgLyB4LCAtbWUuYiAvIHgsIC1tZS5jIC8geCwgbWUuYSAvIHgsIChtZS5jICogbWUuZiAtIG1lLmQgKiBtZS5lKSAvIHgsIChtZS5iICogbWUuZSAtIG1lLmEgKiBtZS5mKSAvIHgpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5jbG9uZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBjb3B5IG9mIHRoZSBtYXRyaXhcbiAgICAgICAgID0gKG9iamVjdCkgQE1hdHJpeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgodGhpcy5hLCB0aGlzLmIsIHRoaXMuYywgdGhpcy5kLCB0aGlzLmUsIHRoaXMuZik7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnRyYW5zbGF0ZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogVHJhbnNsYXRlIHRoZSBtYXRyaXhcbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSB4IChudW1iZXIpXG4gICAgICAgICAtIHkgKG51bWJlcilcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by50cmFuc2xhdGUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgdGhpcy5hZGQoMSwgMCwgMCwgMSwgeCwgeSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnNjYWxlXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBTY2FsZXMgdGhlIG1hdHJpeFxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIHggKG51bWJlcilcbiAgICAgICAgIC0geSAobnVtYmVyKSAjb3B0aW9uYWxcbiAgICAgICAgIC0gY3ggKG51bWJlcikgI29wdGlvbmFsXG4gICAgICAgICAtIGN5IChudW1iZXIpICNvcHRpb25hbFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnNjYWxlID0gZnVuY3Rpb24gKHgsIHksIGN4LCBjeSkge1xuICAgICAgICAgICAgeSA9PSBudWxsICYmICh5ID0geCk7XG4gICAgICAgICAgICAoY3ggfHwgY3kpICYmIHRoaXMuYWRkKDEsIDAsIDAsIDEsIGN4LCBjeSk7XG4gICAgICAgICAgICB0aGlzLmFkZCh4LCAwLCAwLCB5LCAwLCAwKTtcbiAgICAgICAgICAgIChjeCB8fCBjeSkgJiYgdGhpcy5hZGQoMSwgMCwgMCwgMSwgLWN4LCAtY3kpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5yb3RhdGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJvdGF0ZXMgdGhlIG1hdHJpeFxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIGEgKG51bWJlcilcbiAgICAgICAgIC0geCAobnVtYmVyKVxuICAgICAgICAgLSB5IChudW1iZXIpXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8ucm90YXRlID0gZnVuY3Rpb24gKGEsIHgsIHkpIHtcbiAgICAgICAgICAgIGEgPSBSLnJhZChhKTtcbiAgICAgICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgICAgICB5ID0geSB8fCAwO1xuICAgICAgICAgICAgdmFyIGNvcyA9ICttYXRoLmNvcyhhKS50b0ZpeGVkKDkpLFxuICAgICAgICAgICAgICAgIHNpbiA9ICttYXRoLnNpbihhKS50b0ZpeGVkKDkpO1xuICAgICAgICAgICAgdGhpcy5hZGQoY29zLCBzaW4sIC1zaW4sIGNvcywgeCwgeSk7XG4gICAgICAgICAgICB0aGlzLmFkZCgxLCAwLCAwLCAxLCAteCwgLXkpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC54XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm4geCBjb29yZGluYXRlIGZvciBnaXZlbiBwb2ludCBhZnRlciB0cmFuc2Zvcm1hdGlvbiBkZXNjcmliZWQgYnkgdGhlIG1hdHJpeC4gU2VlIGFsc28gQE1hdHJpeC55XG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0geCAobnVtYmVyKVxuICAgICAgICAgLSB5IChudW1iZXIpXG4gICAgICAgICA9IChudW1iZXIpIHhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by54ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiB4ICogdGhpcy5hICsgeSAqIHRoaXMuYyArIHRoaXMuZTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgueVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJuIHkgY29vcmRpbmF0ZSBmb3IgZ2l2ZW4gcG9pbnQgYWZ0ZXIgdHJhbnNmb3JtYXRpb24gZGVzY3JpYmVkIGJ5IHRoZSBtYXRyaXguIFNlZSBhbHNvIEBNYXRyaXgueFxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIHggKG51bWJlcilcbiAgICAgICAgIC0geSAobnVtYmVyKVxuICAgICAgICAgPSAobnVtYmVyKSB5XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8ueSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICByZXR1cm4geCAqIHRoaXMuYiArIHkgKiB0aGlzLmQgKyB0aGlzLmY7XG4gICAgICAgIH07XG4gICAgICAgIG1hdHJpeHByb3RvLmdldCA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICByZXR1cm4gK3RoaXNbU3RyLmZyb21DaGFyQ29kZSg5NyArIGkpXS50b0ZpeGVkKDQpO1xuICAgICAgICB9O1xuICAgICAgICBtYXRyaXhwcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBSLnN2ZyA/XG4gICAgICAgICAgICAgICAgXCJtYXRyaXgoXCIgKyBbdGhpcy5nZXQoMCksIHRoaXMuZ2V0KDEpLCB0aGlzLmdldCgyKSwgdGhpcy5nZXQoMyksIHRoaXMuZ2V0KDQpLCB0aGlzLmdldCg1KV0uam9pbigpICsgXCIpXCIgOlxuICAgICAgICAgICAgICAgIFt0aGlzLmdldCgwKSwgdGhpcy5nZXQoMiksIHRoaXMuZ2V0KDEpLCB0aGlzLmdldCgzKSwgMCwgMF0uam9pbigpO1xuICAgICAgICB9O1xuICAgICAgICBtYXRyaXhwcm90by50b0ZpbHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBcInByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5NYXRyaXgoTTExPVwiICsgdGhpcy5nZXQoMCkgK1xuICAgICAgICAgICAgICAgIFwiLCBNMTI9XCIgKyB0aGlzLmdldCgyKSArIFwiLCBNMjE9XCIgKyB0aGlzLmdldCgxKSArIFwiLCBNMjI9XCIgKyB0aGlzLmdldCgzKSArXG4gICAgICAgICAgICAgICAgXCIsIER4PVwiICsgdGhpcy5nZXQoNCkgKyBcIiwgRHk9XCIgKyB0aGlzLmdldCg1KSArIFwiLCBzaXppbmdtZXRob2Q9J2F1dG8gZXhwYW5kJylcIjtcbiAgICAgICAgfTtcbiAgICAgICAgbWF0cml4cHJvdG8ub2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmUudG9GaXhlZCg0KSwgdGhpcy5mLnRvRml4ZWQoNCldO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBub3JtKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBhWzBdICogYVswXSArIGFbMV0gKiBhWzFdO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShhKSB7XG4gICAgICAgICAgICB2YXIgbWFnID0gbWF0aC5zcXJ0KG5vcm0oYSkpO1xuICAgICAgICAgICAgYVswXSAmJiAoYVswXSAvPSBtYWcpO1xuICAgICAgICAgICAgYVsxXSAmJiAoYVsxXSAvPSBtYWcpO1xuICAgICAgICB9XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnNwbGl0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBTcGxpdHMgbWF0cml4IGludG8gcHJpbWl0aXZlIHRyYW5zZm9ybWF0aW9uc1xuICAgICAgICAgPSAob2JqZWN0KSBpbiBmb3JtYXQ6XG4gICAgICAgICBvIGR4IChudW1iZXIpIHRyYW5zbGF0aW9uIGJ5IHhcbiAgICAgICAgIG8gZHkgKG51bWJlcikgdHJhbnNsYXRpb24gYnkgeVxuICAgICAgICAgbyBzY2FsZXggKG51bWJlcikgc2NhbGUgYnkgeFxuICAgICAgICAgbyBzY2FsZXkgKG51bWJlcikgc2NhbGUgYnkgeVxuICAgICAgICAgbyBzaGVhciAobnVtYmVyKSBzaGVhclxuICAgICAgICAgbyByb3RhdGUgKG51bWJlcikgcm90YXRpb24gaW4gZGVnXG4gICAgICAgICBvIGlzU2ltcGxlIChib29sZWFuKSBjb3VsZCBpdCBiZSByZXByZXNlbnRlZCB2aWEgc2ltcGxlIHRyYW5zZm9ybWF0aW9uc1xuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnNwbGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG91dCA9IHt9O1xuICAgICAgICAgICAgLy8gdHJhbnNsYXRpb25cbiAgICAgICAgICAgIG91dC5keCA9IHRoaXMuZTtcbiAgICAgICAgICAgIG91dC5keSA9IHRoaXMuZjtcblxuICAgICAgICAgICAgLy8gc2NhbGUgYW5kIHNoZWFyXG4gICAgICAgICAgICB2YXIgcm93ID0gW1t0aGlzLmEsIHRoaXMuY10sIFt0aGlzLmIsIHRoaXMuZF1dO1xuICAgICAgICAgICAgb3V0LnNjYWxleCA9IG1hdGguc3FydChub3JtKHJvd1swXSkpO1xuICAgICAgICAgICAgbm9ybWFsaXplKHJvd1swXSk7XG5cbiAgICAgICAgICAgIG91dC5zaGVhciA9IHJvd1swXVswXSAqIHJvd1sxXVswXSArIHJvd1swXVsxXSAqIHJvd1sxXVsxXTtcbiAgICAgICAgICAgIHJvd1sxXSA9IFtyb3dbMV1bMF0gLSByb3dbMF1bMF0gKiBvdXQuc2hlYXIsIHJvd1sxXVsxXSAtIHJvd1swXVsxXSAqIG91dC5zaGVhcl07XG5cbiAgICAgICAgICAgIG91dC5zY2FsZXkgPSBtYXRoLnNxcnQobm9ybShyb3dbMV0pKTtcbiAgICAgICAgICAgIG5vcm1hbGl6ZShyb3dbMV0pO1xuICAgICAgICAgICAgb3V0LnNoZWFyIC89IG91dC5zY2FsZXk7XG5cbiAgICAgICAgICAgIC8vIHJvdGF0aW9uXG4gICAgICAgICAgICB2YXIgc2luID0gLXJvd1swXVsxXSxcbiAgICAgICAgICAgICAgICBjb3MgPSByb3dbMV1bMV07XG4gICAgICAgICAgICBpZiAoY29zIDwgMCkge1xuICAgICAgICAgICAgICAgIG91dC5yb3RhdGUgPSBSLmRlZyhtYXRoLmFjb3MoY29zKSk7XG4gICAgICAgICAgICAgICAgaWYgKHNpbiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnJvdGF0ZSA9IDM2MCAtIG91dC5yb3RhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXQucm90YXRlID0gUi5kZWcobWF0aC5hc2luKHNpbikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXQuaXNTaW1wbGUgPSAhK291dC5zaGVhci50b0ZpeGVkKDkpICYmIChvdXQuc2NhbGV4LnRvRml4ZWQoOSkgPT0gb3V0LnNjYWxleS50b0ZpeGVkKDkpIHx8ICFvdXQucm90YXRlKTtcbiAgICAgICAgICAgIG91dC5pc1N1cGVyU2ltcGxlID0gIStvdXQuc2hlYXIudG9GaXhlZCg5KSAmJiBvdXQuc2NhbGV4LnRvRml4ZWQoOSkgPT0gb3V0LnNjYWxleS50b0ZpeGVkKDkpICYmICFvdXQucm90YXRlO1xuICAgICAgICAgICAgb3V0Lm5vUm90YXRpb24gPSAhK291dC5zaGVhci50b0ZpeGVkKDkpICYmICFvdXQucm90YXRlO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgudG9UcmFuc2Zvcm1TdHJpbmdcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybiB0cmFuc2Zvcm0gc3RyaW5nIHRoYXQgcmVwcmVzZW50cyBnaXZlbiBtYXRyaXhcbiAgICAgICAgID0gKHN0cmluZykgdHJhbnNmb3JtIHN0cmluZ1xuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnRvVHJhbnNmb3JtU3RyaW5nID0gZnVuY3Rpb24gKHNob3J0ZXIpIHtcbiAgICAgICAgICAgIHZhciBzID0gc2hvcnRlciB8fCB0aGlzW3NwbGl0XSgpO1xuICAgICAgICAgICAgaWYgKHMuaXNTaW1wbGUpIHtcbiAgICAgICAgICAgICAgICBzLnNjYWxleCA9ICtzLnNjYWxleC50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgIHMuc2NhbGV5ID0gK3Muc2NhbGV5LnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgcy5yb3RhdGUgPSArcy5yb3RhdGUudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gIChzLmR4IHx8IHMuZHkgPyBcInRcIiArIFtzLmR4LCBzLmR5XSA6IEUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIChzLnNjYWxleCAhPSAxIHx8IHMuc2NhbGV5ICE9IDEgPyBcInNcIiArIFtzLnNjYWxleCwgcy5zY2FsZXksIDAsIDBdIDogRSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgKHMucm90YXRlID8gXCJyXCIgKyBbcy5yb3RhdGUsIDAsIDBdIDogRSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm1cIiArIFt0aGlzLmdldCgwKSwgdGhpcy5nZXQoMSksIHRoaXMuZ2V0KDIpLCB0aGlzLmdldCgzKSwgdGhpcy5nZXQoNCksIHRoaXMuZ2V0KDUpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KShNYXRyaXgucHJvdG90eXBlKTtcblxuICAgIC8vIFdlYktpdCByZW5kZXJpbmcgYnVnIHdvcmthcm91bmQgbWV0aG9kXG4gICAgdmFyIHZlcnNpb24gPSBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9WZXJzaW9uXFwvKC4qPylcXHMvKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9DaHJvbWVcXC8oXFxkKykvKTtcbiAgICBpZiAoKG5hdmlnYXRvci52ZW5kb3IgPT0gXCJBcHBsZSBDb21wdXRlciwgSW5jLlwiKSAmJiAodmVyc2lvbiAmJiB2ZXJzaW9uWzFdIDwgNCB8fCBuYXZpZ2F0b3IucGxhdGZvcm0uc2xpY2UoMCwgMikgPT0gXCJpUFwiKSB8fFxuICAgICAgICAobmF2aWdhdG9yLnZlbmRvciA9PSBcIkdvb2dsZSBJbmMuXCIgJiYgdmVyc2lvbiAmJiB2ZXJzaW9uWzFdIDwgOCkpIHtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBQYXBlci5zYWZhcmlcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFRoZXJlIGlzIGFuIGluY29udmVuaWVudCByZW5kZXJpbmcgYnVnIGluIFNhZmFyaSAoV2ViS2l0KTpcbiAgICAgICAgICogc29tZXRpbWVzIHRoZSByZW5kZXJpbmcgc2hvdWxkIGJlIGZvcmNlZC5cbiAgICAgICAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGhlbHAgd2l0aCBkZWFsaW5nIHdpdGggdGhpcyBidWcuXG4gICAgICAgIFxcKi9cbiAgICAgICAgcGFwZXJwcm90by5zYWZhcmkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVjdCA9IHRoaXMucmVjdCgtOTksIC05OSwgdGhpcy53aWR0aCArIDk5LCB0aGlzLmhlaWdodCArIDk5KS5hdHRyKHtzdHJva2U6IFwibm9uZVwifSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtyZWN0LnJlbW92ZSgpO30pO1xuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcGVycHJvdG8uc2FmYXJpID0gZnVuO1xuICAgIH1cblxuICAgIHZhciBwcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgcHJldmVudFRvdWNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmlnaW5hbEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSxcbiAgICBzdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICB9LFxuICAgIHN0b3BUb3VjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWxFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIGdldEV2ZW50UG9zaXRpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgc2Nyb2xsWSA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZy5kb2MuYm9keS5zY3JvbGxUb3AsXG4gICAgICAgICAgICBzY3JvbGxYID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgfHwgZy5kb2MuYm9keS5zY3JvbGxMZWZ0O1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBlLmNsaWVudFggKyBzY3JvbGxYLFxuICAgICAgICAgICAgeTogZS5jbGllbnRZICsgc2Nyb2xsWVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgYWRkRXZlbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZy5kb2MuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIHR5cGUsIGZuLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zID0gZ2V0RXZlbnRQb3NpdGlvbihlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwoZWxlbWVudCwgZSwgcG9zLngsIHBvcy55KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGYsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIGlmIChzdXBwb3J0c1RvdWNoICYmIHRvdWNoTWFwW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfZiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcG9zID0gZ2V0RXZlbnRQb3NpdGlvbihlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRlID0gZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZS50YXJnZXRUb3VjaGVzICYmIGUudGFyZ2V0VG91Y2hlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUudGFyZ2V0VG91Y2hlc1tpXS50YXJnZXQgPT0gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUgPSBlLnRhcmdldFRvdWNoZXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUub3JpZ2luYWxFdmVudCA9IG9sZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPSBwcmV2ZW50VG91Y2g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gc3RvcFRvdWNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKGVsZW1lbnQsIGUsIHBvcy54LCBwb3MueSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKHRvdWNoTWFwW3R5cGVdLCBfZiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGYsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNUb3VjaCAmJiB0b3VjaE1hcFt0eXBlXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKHRvdWNoTWFwW3R5cGVdLCBfZiwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKGcuZG9jLmF0dGFjaEV2ZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgdHlwZSwgZm4sIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBlIHx8IGcud2luLmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsWSA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZy5kb2MuYm9keS5zY3JvbGxUb3AsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxYID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgfHwgZy5kb2MuYm9keS5zY3JvbGxMZWZ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGUuY2xpZW50WCArIHNjcm9sbFgsXG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gZS5jbGllbnRZICsgc2Nyb2xsWTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA9IGUucHJldmVudERlZmF1bHQgfHwgcHJldmVudERlZmF1bHQ7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgc3RvcFByb3BhZ2F0aW9uO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbChlbGVtZW50LCBlLCB4LCB5KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG9iai5hdHRhY2hFdmVudChcIm9uXCIgKyB0eXBlLCBmKTtcbiAgICAgICAgICAgICAgICB2YXIgZGV0YWNoZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5kZXRhY2hFdmVudChcIm9uXCIgKyB0eXBlLCBmKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGV0YWNoZXI7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSkoKSxcbiAgICBkcmFnID0gW10sXG4gICAgZHJhZ01vdmUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgeCA9IGUuY2xpZW50WCxcbiAgICAgICAgICAgIHkgPSBlLmNsaWVudFksXG4gICAgICAgICAgICBzY3JvbGxZID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBnLmRvYy5ib2R5LnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbFggPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCBnLmRvYy5ib2R5LnNjcm9sbExlZnQsXG4gICAgICAgICAgICBkcmFnaSxcbiAgICAgICAgICAgIGogPSBkcmFnLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICAgICAgZHJhZ2kgPSBkcmFnW2pdO1xuICAgICAgICAgICAgaWYgKHN1cHBvcnRzVG91Y2ggJiYgZS50b3VjaGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBlLnRvdWNoZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICB0b3VjaDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoID0gZS50b3VjaGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PSBkcmFnaS5lbC5fZHJhZy5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRvdWNoLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gdG91Y2guY2xpZW50WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChlLm9yaWdpbmFsRXZlbnQgPyBlLm9yaWdpbmFsRXZlbnQgOiBlKS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBub2RlID0gZHJhZ2kuZWwubm9kZSxcbiAgICAgICAgICAgICAgICBvLFxuICAgICAgICAgICAgICAgIG5leHQgPSBub2RlLm5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICAgIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5ID0gbm9kZS5zdHlsZS5kaXNwbGF5O1xuICAgICAgICAgICAgZy53aW4ub3BlcmEgJiYgcGFyZW50LnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBvID0gZHJhZ2kuZWwucGFwZXIuZ2V0RWxlbWVudEJ5UG9pbnQoeCwgeSk7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5O1xuICAgICAgICAgICAgZy53aW4ub3BlcmEgJiYgKG5leHQgPyBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIG5leHQpIDogcGFyZW50LmFwcGVuZENoaWxkKG5vZGUpKTtcbiAgICAgICAgICAgIG8gJiYgZXZlKFwicmFwaGFlbC5kcmFnLm92ZXIuXCIgKyBkcmFnaS5lbC5pZCwgZHJhZ2kuZWwsIG8pO1xuICAgICAgICAgICAgeCArPSBzY3JvbGxYO1xuICAgICAgICAgICAgeSArPSBzY3JvbGxZO1xuICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5kcmFnLm1vdmUuXCIgKyBkcmFnaS5lbC5pZCwgZHJhZ2kubW92ZV9zY29wZSB8fCBkcmFnaS5lbCwgeCAtIGRyYWdpLmVsLl9kcmFnLngsIHkgLSBkcmFnaS5lbC5fZHJhZy55LCB4LCB5LCBlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZHJhZ1VwID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgUi51bm1vdXNlbW92ZShkcmFnTW92ZSkudW5tb3VzZXVwKGRyYWdVcCk7XG4gICAgICAgIHZhciBpID0gZHJhZy5sZW5ndGgsXG4gICAgICAgICAgICBkcmFnaTtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgZHJhZ2kgPSBkcmFnW2ldO1xuICAgICAgICAgICAgZHJhZ2kuZWwuX2RyYWcgPSB7fTtcbiAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuZHJhZy5lbmQuXCIgKyBkcmFnaS5lbC5pZCwgZHJhZ2kuZW5kX3Njb3BlIHx8IGRyYWdpLnN0YXJ0X3Njb3BlIHx8IGRyYWdpLm1vdmVfc2NvcGUgfHwgZHJhZ2kuZWwsIGUpO1xuICAgICAgICB9XG4gICAgICAgIGRyYWcgPSBbXTtcbiAgICB9LFxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmVsXG4gICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAqKlxuICAgICAqIFlvdSBjYW4gYWRkIHlvdXIgb3duIG1ldGhvZCB0byBlbGVtZW50cy4gVGhpcyBpcyB1c2VmdWxsIHdoZW4geW91IHdhbnQgdG8gaGFjayBkZWZhdWx0IGZ1bmN0aW9uYWxpdHkgb3JcbiAgICAgKiB3YW50IHRvIHdyYXAgc29tZSBjb21tb24gdHJhbnNmb3JtYXRpb24gb3IgYXR0cmlidXRlcyBpbiBvbmUgbWV0aG9kLiBJbiBkaWZmZXJlbmNlIHRvIGNhbnZhcyBtZXRob2RzLFxuICAgICAqIHlvdSBjYW4gcmVkZWZpbmUgZWxlbWVudCBtZXRob2QgYXQgYW55IHRpbWUuIEV4cGVuZGluZyBlbGVtZW50IG1ldGhvZHMgd291bGRu4oCZdCBhZmZlY3Qgc2V0LlxuICAgICA+IFVzYWdlXG4gICAgIHwgUmFwaGFlbC5lbC5yZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgIHwgICAgIHRoaXMuYXR0cih7ZmlsbDogXCIjZjAwXCJ9KTtcbiAgICAgfCB9O1xuICAgICB8IC8vIHRoZW4gdXNlIGl0XG4gICAgIHwgcGFwZXIuY2lyY2xlKDEwMCwgMTAwLCAyMCkucmVkKCk7XG4gICAgXFwqL1xuICAgIGVscHJvdG8gPSBSLmVsID0ge307XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgY2xpY2sgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5jbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciBjbGljayBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5kYmxjbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciBkb3VibGUgY2xpY2sgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5kYmxjbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciBkb3VibGUgY2xpY2sgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2Vkb3duXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlZG93biBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlZG93blxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZWRvd24gZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2Vtb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlbW92ZSBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlbW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZW1vdmUgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2VvdXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2VvdXQgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZW91dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZW91dCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZW92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2VvdmVyIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2VvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlb3ZlciBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZXVwXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNldXAgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZXVwXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNldXAgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2hzdGFydFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaHN0YXJ0IGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2hzdGFydFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaHN0YXJ0IGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNobW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaG1vdmUgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaG1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2htb3ZlIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNoZW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNoZW5kIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2hlbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2hlbmQgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2hjYW5jZWxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2hjYW5jZWwgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaGNhbmNlbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaGNhbmNlbCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZm9yICh2YXIgaSA9IGV2ZW50cy5sZW5ndGg7IGktLTspIHtcbiAgICAgICAgKGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgICAgIFJbZXZlbnROYW1lXSA9IGVscHJvdG9bZXZlbnROYW1lXSA9IGZ1bmN0aW9uIChmbiwgc2NvcGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoUi5pcyhmbiwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cyA9IHRoaXMuZXZlbnRzIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy5wdXNoKHtuYW1lOiBldmVudE5hbWUsIGY6IGZuLCB1bmJpbmQ6IGFkZEV2ZW50KHRoaXMuc2hhcGUgfHwgdGhpcy5ub2RlIHx8IGcuZG9jLCBldmVudE5hbWUsIGZuLCBzY29wZSB8fCB0aGlzKX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBSW1widW5cIiArIGV2ZW50TmFtZV0gPSBlbHByb3RvW1widW5cIiArIGV2ZW50TmFtZV0gPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIGwgPSBldmVudHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pe1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRzW2xdLm5hbWUgPT0gZXZlbnROYW1lICYmIChSLmlzKGZuLCBcInVuZGVmaW5lZFwiKSB8fCBldmVudHNbbF0uZiA9PSBmbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50c1tsXS51bmJpbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5zcGxpY2UobCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAhZXZlbnRzLmxlbmd0aCAmJiBkZWxldGUgdGhpcy5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShldmVudHNbaV0pO1xuICAgIH1cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmRhdGFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgb3IgcmV0cmlldmVzIGdpdmVuIHZhbHVlIGFzb2NpYXRlZCB3aXRoIGdpdmVuIGtleS5cbiAgICAgKipcbiAgICAgKiBTZWUgYWxzbyBARWxlbWVudC5yZW1vdmVEYXRhXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGtleSAoc3RyaW5nKSBrZXkgdG8gc3RvcmUgZGF0YVxuICAgICAtIHZhbHVlIChhbnkpICNvcHRpb25hbCB2YWx1ZSB0byBzdG9yZVxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgICogb3IsIGlmIHZhbHVlIGlzIG5vdCBzcGVjaWZpZWQ6XG4gICAgID0gKGFueSkgdmFsdWVcbiAgICAgKiBvciwgaWYga2V5IGFuZCB2YWx1ZSBhcmUgbm90IHNwZWNpZmllZDpcbiAgICAgPSAob2JqZWN0KSBLZXkvdmFsdWUgcGFpcnMgZm9yIGFsbCB0aGUgZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGVsZW1lbnQuXG4gICAgID4gVXNhZ2VcbiAgICAgfCBmb3IgKHZhciBpID0gMCwgaSA8IDUsIGkrKykge1xuICAgICB8ICAgICBwYXBlci5jaXJjbGUoMTAgKyAxNSAqIGksIDEwLCAxMClcbiAgICAgfCAgICAgICAgICAuYXR0cih7ZmlsbDogXCIjMDAwXCJ9KVxuICAgICB8ICAgICAgICAgIC5kYXRhKFwiaVwiLCBpKVxuICAgICB8ICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgIHwgICAgICAgICAgICAgYWxlcnQodGhpcy5kYXRhKFwiaVwiKSk7XG4gICAgIHwgICAgICAgICAgfSk7XG4gICAgIHwgfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmRhdGEgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICB2YXIgZGF0YSA9IGVsZGF0YVt0aGlzLmlkXSA9IGVsZGF0YVt0aGlzLmlkXSB8fCB7fTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgaWYgKFIuaXMoa2V5LCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4ga2V5KSBpZiAoa2V5W2hhc10oaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhKGksIGtleVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5kYXRhLmdldC5cIiArIHRoaXMuaWQsIHRoaXMsIGRhdGFba2V5XSwga2V5KTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZGF0YVtrZXldID0gdmFsdWU7XG4gICAgICAgIGV2ZShcInJhcGhhZWwuZGF0YS5zZXQuXCIgKyB0aGlzLmlkLCB0aGlzLCB2YWx1ZSwga2V5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5yZW1vdmVEYXRhXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCBhbiBlbGVtZW50IGJ5IGdpdmVuIGtleS5cbiAgICAgKiBJZiBrZXkgaXMgbm90IHByb3ZpZGVkLCByZW1vdmVzIGFsbCB0aGUgZGF0YSBvZiB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0ga2V5IChzdHJpbmcpICNvcHRpb25hbCBrZXlcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnJlbW92ZURhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCkge1xuICAgICAgICAgICAgZWxkYXRhW3RoaXMuaWRdID0ge307XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGRhdGFbdGhpcy5pZF0gJiYgZGVsZXRlIGVsZGF0YVt0aGlzLmlkXVtrZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldERhdGFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHJpZXZlcyB0aGUgZWxlbWVudCBkYXRhXG4gICAgID0gKG9iamVjdCkgZGF0YVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldERhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjbG9uZShlbGRhdGFbdGhpcy5pZF0gfHwge30pO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaG92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGhvdmVyIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gZl9pbiAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIGluXG4gICAgIC0gZl9vdXQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBvdXRcbiAgICAgLSBpY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgaG92ZXIgaW4gaGFuZGxlclxuICAgICAtIG9jb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBob3ZlciBvdXQgaGFuZGxlclxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaG92ZXIgPSBmdW5jdGlvbiAoZl9pbiwgZl9vdXQsIHNjb3BlX2luLCBzY29wZV9vdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW91c2VvdmVyKGZfaW4sIHNjb3BlX2luKS5tb3VzZW91dChmX291dCwgc2NvcGVfb3V0IHx8IHNjb3BlX2luKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuaG92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlcnMgZm9yIGhvdmVyIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gZl9pbiAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIGluXG4gICAgIC0gZl9vdXQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBvdXRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnVuaG92ZXIgPSBmdW5jdGlvbiAoZl9pbiwgZl9vdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudW5tb3VzZW92ZXIoZl9pbikudW5tb3VzZW91dChmX291dCk7XG4gICAgfTtcbiAgICB2YXIgZHJhZ2dhYmxlID0gW107XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZHJhZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgZHJhZyBvZiB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gb25tb3ZlIChmdW5jdGlvbikgaGFuZGxlciBmb3IgbW92aW5nXG4gICAgIC0gb25zdGFydCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGRyYWcgc3RhcnRcbiAgICAgLSBvbmVuZCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGRyYWcgZW5kXG4gICAgIC0gbWNvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIG1vdmluZyBoYW5kbGVyXG4gICAgIC0gc2NvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGRyYWcgc3RhcnQgaGFuZGxlclxuICAgICAtIGVjb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBkcmFnIGVuZCBoYW5kbGVyXG4gICAgICogQWRkaXRpb25hbHkgZm9sbG93aW5nIGBkcmFnYCBldmVudHMgd2lsbCBiZSB0cmlnZ2VyZWQ6IGBkcmFnLnN0YXJ0LjxpZD5gIG9uIHN0YXJ0LFxuICAgICAqIGBkcmFnLmVuZC48aWQ+YCBvbiBlbmQgYW5kIGBkcmFnLm1vdmUuPGlkPmAgb24gZXZlcnkgbW92ZS4gV2hlbiBlbGVtZW50IHdpbGwgYmUgZHJhZ2dlZCBvdmVyIGFub3RoZXIgZWxlbWVudFxuICAgICAqIGBkcmFnLm92ZXIuPGlkPmAgd2lsbCBiZSBmaXJlZCBhcyB3ZWxsLlxuICAgICAqXG4gICAgICogU3RhcnQgZXZlbnQgYW5kIHN0YXJ0IGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQgaW4gc3BlY2lmaWVkIGNvbnRleHQgb3IgaW4gY29udGV4dCBvZiB0aGUgZWxlbWVudCB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICAgICBvIHggKG51bWJlcikgeCBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyB5IChudW1iZXIpIHkgcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8gZXZlbnQgKG9iamVjdCkgRE9NIGV2ZW50IG9iamVjdFxuICAgICAqIE1vdmUgZXZlbnQgYW5kIG1vdmUgaGFuZGxlciB3aWxsIGJlIGNhbGxlZCBpbiBzcGVjaWZpZWQgY29udGV4dCBvciBpbiBjb250ZXh0IG9mIHRoZSBlbGVtZW50IHdpdGggZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gICAgIG8gZHggKG51bWJlcikgc2hpZnQgYnkgeCBmcm9tIHRoZSBzdGFydCBwb2ludFxuICAgICBvIGR5IChudW1iZXIpIHNoaWZ0IGJ5IHkgZnJvbSB0aGUgc3RhcnQgcG9pbnRcbiAgICAgbyB4IChudW1iZXIpIHggcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8geSAobnVtYmVyKSB5IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIGV2ZW50IChvYmplY3QpIERPTSBldmVudCBvYmplY3RcbiAgICAgKiBFbmQgZXZlbnQgYW5kIGVuZCBoYW5kbGVyIHdpbGwgYmUgY2FsbGVkIGluIHNwZWNpZmllZCBjb250ZXh0IG9yIGluIGNvbnRleHQgb2YgdGhlIGVsZW1lbnQgd2l0aCBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICAgbyBldmVudCAob2JqZWN0KSBET00gZXZlbnQgb2JqZWN0XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5kcmFnID0gZnVuY3Rpb24gKG9ubW92ZSwgb25zdGFydCwgb25lbmQsIG1vdmVfc2NvcGUsIHN0YXJ0X3Njb3BlLCBlbmRfc2NvcGUpIHtcbiAgICAgICAgZnVuY3Rpb24gc3RhcnQoZSkge1xuICAgICAgICAgICAgKGUub3JpZ2luYWxFdmVudCB8fCBlKS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyIHggPSBlLmNsaWVudFgsXG4gICAgICAgICAgICAgICAgeSA9IGUuY2xpZW50WSxcbiAgICAgICAgICAgICAgICBzY3JvbGxZID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBnLmRvYy5ib2R5LnNjcm9sbFRvcCxcbiAgICAgICAgICAgICAgICBzY3JvbGxYID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgfHwgZy5kb2MuYm9keS5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgdGhpcy5fZHJhZy5pZCA9IGUuaWRlbnRpZmllcjtcbiAgICAgICAgICAgIGlmIChzdXBwb3J0c1RvdWNoICYmIGUudG91Y2hlcykge1xuICAgICAgICAgICAgICAgIHZhciBpID0gZS50b3VjaGVzLmxlbmd0aCwgdG91Y2g7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICB0b3VjaCA9IGUudG91Y2hlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZHJhZy5pZCA9IHRvdWNoLmlkZW50aWZpZXI7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3VjaC5pZGVudGlmaWVyID09IHRoaXMuX2RyYWcuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSB0b3VjaC5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHRvdWNoLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2RyYWcueCA9IHggKyBzY3JvbGxYO1xuICAgICAgICAgICAgdGhpcy5fZHJhZy55ID0geSArIHNjcm9sbFk7XG4gICAgICAgICAgICAhZHJhZy5sZW5ndGggJiYgUi5tb3VzZW1vdmUoZHJhZ01vdmUpLm1vdXNldXAoZHJhZ1VwKTtcbiAgICAgICAgICAgIGRyYWcucHVzaCh7ZWw6IHRoaXMsIG1vdmVfc2NvcGU6IG1vdmVfc2NvcGUsIHN0YXJ0X3Njb3BlOiBzdGFydF9zY29wZSwgZW5kX3Njb3BlOiBlbmRfc2NvcGV9KTtcbiAgICAgICAgICAgIG9uc3RhcnQgJiYgZXZlLm9uKFwicmFwaGFlbC5kcmFnLnN0YXJ0LlwiICsgdGhpcy5pZCwgb25zdGFydCk7XG4gICAgICAgICAgICBvbm1vdmUgJiYgZXZlLm9uKFwicmFwaGFlbC5kcmFnLm1vdmUuXCIgKyB0aGlzLmlkLCBvbm1vdmUpO1xuICAgICAgICAgICAgb25lbmQgJiYgZXZlLm9uKFwicmFwaGFlbC5kcmFnLmVuZC5cIiArIHRoaXMuaWQsIG9uZW5kKTtcbiAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuZHJhZy5zdGFydC5cIiArIHRoaXMuaWQsIHN0YXJ0X3Njb3BlIHx8IG1vdmVfc2NvcGUgfHwgdGhpcywgZS5jbGllbnRYICsgc2Nyb2xsWCwgZS5jbGllbnRZICsgc2Nyb2xsWSwgZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZHJhZyA9IHt9O1xuICAgICAgICBkcmFnZ2FibGUucHVzaCh7ZWw6IHRoaXMsIHN0YXJ0OiBzdGFydH0pO1xuICAgICAgICB0aGlzLm1vdXNlZG93bihzdGFydCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQub25EcmFnT3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2hvcnRjdXQgZm9yIGFzc2lnbmluZyBldmVudCBoYW5kbGVyIGZvciBgZHJhZy5vdmVyLjxpZD5gIGV2ZW50LCB3aGVyZSBpZCBpcyBpZCBvZiB0aGUgZWxlbWVudCAoc2VlIEBFbGVtZW50LmlkKS5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGV2ZW50LCBmaXJzdCBhcmd1bWVudCB3b3VsZCBiZSB0aGUgZWxlbWVudCB5b3UgYXJlIGRyYWdnaW5nIG92ZXJcbiAgICBcXCovXG4gICAgZWxwcm90by5vbkRyYWdPdmVyID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZiA/IGV2ZS5vbihcInJhcGhhZWwuZHJhZy5vdmVyLlwiICsgdGhpcy5pZCwgZikgOiBldmUudW5iaW5kKFwicmFwaGFlbC5kcmFnLm92ZXIuXCIgKyB0aGlzLmlkKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuZHJhZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhbGwgZHJhZyBldmVudCBoYW5kbGVycyBmcm9tIGdpdmVuIGVsZW1lbnQuXG4gICAgXFwqL1xuICAgIGVscHJvdG8udW5kcmFnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaSA9IGRyYWdnYWJsZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIGlmIChkcmFnZ2FibGVbaV0uZWwgPT0gdGhpcykge1xuICAgICAgICAgICAgdGhpcy51bm1vdXNlZG93bihkcmFnZ2FibGVbaV0uc3RhcnQpO1xuICAgICAgICAgICAgZHJhZ2dhYmxlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGV2ZS51bmJpbmQoXCJyYXBoYWVsLmRyYWcuKi5cIiArIHRoaXMuaWQpO1xuICAgICAgICB9XG4gICAgICAgICFkcmFnZ2FibGUubGVuZ3RoICYmIFIudW5tb3VzZW1vdmUoZHJhZ01vdmUpLnVubW91c2V1cChkcmFnVXApO1xuICAgICAgICBkcmFnID0gW107XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuY2lyY2xlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhIGNpcmNsZS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSByIChudW1iZXIpIHJhZGl1c1xuICAgICA9IChvYmplY3QpIFJhcGhhw6tsIGVsZW1lbnQgb2JqZWN0IHdpdGggdHlwZSDigJxjaXJjbGXigJ1cbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIuY2lyY2xlKDUwLCA1MCwgNDApO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmNpcmNsZSA9IGZ1bmN0aW9uICh4LCB5LCByKSB7XG4gICAgICAgIHZhciBvdXQgPSBSLl9lbmdpbmUuY2lyY2xlKHRoaXMsIHggfHwgMCwgeSB8fCAwLCByIHx8IDApO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5yZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIERyYXdzIGEgcmVjdGFuZ2xlLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgdG9wIGxlZnQgY29ybmVyXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHRvcCBsZWZ0IGNvcm5lclxuICAgICAtIHdpZHRoIChudW1iZXIpIHdpZHRoXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpIGhlaWdodFxuICAgICAtIHIgKG51bWJlcikgI29wdGlvbmFsIHJhZGl1cyBmb3Igcm91bmRlZCBjb3JuZXJzLCBkZWZhdWx0IGlzIDBcbiAgICAgPSAob2JqZWN0KSBSYXBoYcOrbCBlbGVtZW50IG9iamVjdCB3aXRoIHR5cGUg4oCccmVjdOKAnVxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgLy8gcmVndWxhciByZWN0YW5nbGVcbiAgICAgfCB2YXIgYyA9IHBhcGVyLnJlY3QoMTAsIDEwLCA1MCwgNTApO1xuICAgICB8IC8vIHJlY3RhbmdsZSB3aXRoIHJvdW5kZWQgY29ybmVyc1xuICAgICB8IHZhciBjID0gcGFwZXIucmVjdCg0MCwgNDAsIDUwLCA1MCwgMTApO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnJlY3QgPSBmdW5jdGlvbiAoeCwgeSwgdywgaCwgcikge1xuICAgICAgICB2YXIgb3V0ID0gUi5fZW5naW5lLnJlY3QodGhpcywgeCB8fCAwLCB5IHx8IDAsIHcgfHwgMCwgaCB8fCAwLCByIHx8IDApO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5lbGxpcHNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhbiBlbGxpcHNlLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHJ4IChudW1iZXIpIGhvcml6b250YWwgcmFkaXVzXG4gICAgIC0gcnkgKG51bWJlcikgdmVydGljYWwgcmFkaXVzXG4gICAgID0gKG9iamVjdCkgUmFwaGHDq2wgZWxlbWVudCBvYmplY3Qgd2l0aCB0eXBlIOKAnGVsbGlwc2XigJ1cbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIuZWxsaXBzZSg1MCwgNTAsIDQwLCAyMCk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZWxsaXBzZSA9IGZ1bmN0aW9uICh4LCB5LCByeCwgcnkpIHtcbiAgICAgICAgdmFyIG91dCA9IFIuX2VuZ2luZS5lbGxpcHNlKHRoaXMsIHggfHwgMCwgeSB8fCAwLCByeCB8fCAwLCByeSB8fCAwKTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIHBhdGggZWxlbWVudCBieSBnaXZlbiBwYXRoIGRhdGEgc3RyaW5nLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwYXRoU3RyaW5nIChzdHJpbmcpICNvcHRpb25hbCBwYXRoIHN0cmluZyBpbiBTVkcgZm9ybWF0LlxuICAgICAqIFBhdGggc3RyaW5nIGNvbnNpc3RzIG9mIG9uZS1sZXR0ZXIgY29tbWFuZHMsIGZvbGxvd2VkIGJ5IGNvbW1hIHNlcHJhcmF0ZWQgYXJndW1lbnRzIGluIG51bWVyY2FsIGZvcm0uIEV4YW1wbGU6XG4gICAgIHwgXCJNMTAsMjBMMzAsNDBcIlxuICAgICAqIEhlcmUgd2UgY2FuIHNlZSB0d28gY29tbWFuZHM6IOKAnE3igJ0sIHdpdGggYXJndW1lbnRzIGAoMTAsIDIwKWAgYW5kIOKAnEzigJ0gd2l0aCBhcmd1bWVudHMgYCgzMCwgNDApYC4gVXBwZXIgY2FzZSBsZXR0ZXIgbWVhbiBjb21tYW5kIGlzIGFic29sdXRlLCBsb3dlciBjYXNl4oCUcmVsYXRpdmUuXG4gICAgICpcbiAgICAgIyA8cD5IZXJlIGlzIHNob3J0IGxpc3Qgb2YgY29tbWFuZHMgYXZhaWxhYmxlLCBmb3IgbW9yZSBkZXRhaWxzIHNlZSA8YSBocmVmPVwiaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL3BhdGhzLmh0bWwjUGF0aERhdGFcIiB0aXRsZT1cIkRldGFpbHMgb2YgYSBwYXRoJ3MgZGF0YSBhdHRyaWJ1dGUncyBmb3JtYXQgYXJlIGRlc2NyaWJlZCBpbiB0aGUgU1ZHIHNwZWNpZmljYXRpb24uXCI+U1ZHIHBhdGggc3RyaW5nIGZvcm1hdDwvYT4uPC9wPlxuICAgICAjIDx0YWJsZT48dGhlYWQ+PHRyPjx0aD5Db21tYW5kPC90aD48dGg+TmFtZTwvdGg+PHRoPlBhcmFtZXRlcnM8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+XG4gICAgICMgPHRyPjx0ZD5NPC90ZD48dGQ+bW92ZXRvPC90ZD48dGQ+KHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+WjwvdGQ+PHRkPmNsb3NlcGF0aDwvdGQ+PHRkPihub25lKTwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkw8L3RkPjx0ZD5saW5ldG88L3RkPjx0ZD4oeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5IPC90ZD48dGQ+aG9yaXpvbnRhbCBsaW5ldG88L3RkPjx0ZD54KzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlY8L3RkPjx0ZD52ZXJ0aWNhbCBsaW5ldG88L3RkPjx0ZD55KzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkM8L3RkPjx0ZD5jdXJ2ZXRvPC90ZD48dGQ+KHgxIHkxIHgyIHkyIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+UzwvdGQ+PHRkPnNtb290aCBjdXJ2ZXRvPC90ZD48dGQ+KHgyIHkyIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+UTwvdGQ+PHRkPnF1YWRyYXRpYyBCw6l6aWVyIGN1cnZldG88L3RkPjx0ZD4oeDEgeTEgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5UPC90ZD48dGQ+c21vb3RoIHF1YWRyYXRpYyBCw6l6aWVyIGN1cnZldG88L3RkPjx0ZD4oeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5BPC90ZD48dGQ+ZWxsaXB0aWNhbCBhcmM8L3RkPjx0ZD4ocnggcnkgeC1heGlzLXJvdGF0aW9uIGxhcmdlLWFyYy1mbGFnIHN3ZWVwLWZsYWcgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5SPC90ZD48dGQ+PGEgaHJlZj1cImh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ2F0bXVsbOKAk1JvbV9zcGxpbmUjQ2F0bXVsbC5FMi44MC45M1JvbV9zcGxpbmVcIj5DYXRtdWxsLVJvbSBjdXJ2ZXRvPC9hPio8L3RkPjx0ZD54MSB5MSAoeCB5KSs8L3RkPjwvdHI+PC90Ym9keT48L3RhYmxlPlxuICAgICAqICog4oCcQ2F0bXVsbC1Sb20gY3VydmV0b+KAnSBpcyBhIG5vdCBzdGFuZGFyZCBTVkcgY29tbWFuZCBhbmQgYWRkZWQgaW4gMi4wIHRvIG1ha2UgbGlmZSBlYXNpZXIuXG4gICAgICogTm90ZTogdGhlcmUgaXMgYSBzcGVjaWFsIGNhc2Ugd2hlbiBwYXRoIGNvbnNpc3Qgb2YganVzdCB0aHJlZSBjb21tYW5kczog4oCcTTEwLDEwUuKApnrigJ0uIEluIHRoaXMgY2FzZSBwYXRoIHdpbGwgc21vb3RobHkgY29ubmVjdHMgdG8gaXRzIGJlZ2lubmluZy5cbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIucGF0aChcIk0xMCAxMEw5MCA5MFwiKTtcbiAgICAgfCAvLyBkcmF3IGEgZGlhZ29uYWwgbGluZTpcbiAgICAgfCAvLyBtb3ZlIHRvIDEwLDEwLCBsaW5lIHRvIDkwLDkwXG4gICAgICogRm9yIGV4YW1wbGUgb2YgcGF0aCBzdHJpbmdzLCBjaGVjayBvdXQgdGhlc2UgaWNvbnM6IGh0dHA6Ly9yYXBoYWVsanMuY29tL2ljb25zL1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnBhdGggPSBmdW5jdGlvbiAocGF0aFN0cmluZykge1xuICAgICAgICBwYXRoU3RyaW5nICYmICFSLmlzKHBhdGhTdHJpbmcsIHN0cmluZykgJiYgIVIuaXMocGF0aFN0cmluZ1swXSwgYXJyYXkpICYmIChwYXRoU3RyaW5nICs9IEUpO1xuICAgICAgICB2YXIgb3V0ID0gUi5fZW5naW5lLnBhdGgoUi5mb3JtYXRbYXBwbHldKFIsIGFyZ3VtZW50cyksIHRoaXMpO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5pbWFnZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRW1iZWRzIGFuIGltYWdlIGludG8gdGhlIHN1cmZhY2UuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHNyYyAoc3RyaW5nKSBVUkkgb2YgdGhlIHNvdXJjZSBpbWFnZVxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIHBvc2l0aW9uXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgcG9zaXRpb25cbiAgICAgLSB3aWR0aCAobnVtYmVyKSB3aWR0aCBvZiB0aGUgaW1hZ2VcbiAgICAgLSBoZWlnaHQgKG51bWJlcikgaGVpZ2h0IG9mIHRoZSBpbWFnZVxuICAgICA9IChvYmplY3QpIFJhcGhhw6tsIGVsZW1lbnQgb2JqZWN0IHdpdGggdHlwZSDigJxpbWFnZeKAnVxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5pbWFnZShcImFwcGxlLnBuZ1wiLCAxMCwgMTAsIDgwLCA4MCk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uaW1hZ2UgPSBmdW5jdGlvbiAoc3JjLCB4LCB5LCB3LCBoKSB7XG4gICAgICAgIHZhciBvdXQgPSBSLl9lbmdpbmUuaW1hZ2UodGhpcywgc3JjIHx8IFwiYWJvdXQ6YmxhbmtcIiwgeCB8fCAwLCB5IHx8IDAsIHcgfHwgMCwgaCB8fCAwKTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIudGV4dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYSB0ZXh0IHN0cmluZy4gSWYgeW91IG5lZWQgbGluZSBicmVha3MsIHB1dCDigJxcXG7igJ0gaW4gdGhlIHN0cmluZy5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgcG9zaXRpb25cbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBwb3NpdGlvblxuICAgICAtIHRleHQgKHN0cmluZykgVGhlIHRleHQgc3RyaW5nIHRvIGRyYXdcbiAgICAgPSAob2JqZWN0KSBSYXBoYcOrbCBlbGVtZW50IG9iamVjdCB3aXRoIHR5cGUg4oCcdGV4dOKAnVxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIHQgPSBwYXBlci50ZXh0KDUwLCA1MCwgXCJSYXBoYcOrbFxcbmtpY2tzXFxuYnV0dCFcIik7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8udGV4dCA9IGZ1bmN0aW9uICh4LCB5LCB0ZXh0KSB7XG4gICAgICAgIHZhciBvdXQgPSBSLl9lbmdpbmUudGV4dCh0aGlzLCB4IHx8IDAsIHkgfHwgMCwgU3RyKHRleHQpKTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuc2V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGFycmF5LWxpa2Ugb2JqZWN0IHRvIGtlZXAgYW5kIG9wZXJhdGUgc2V2ZXJhbCBlbGVtZW50cyBhdCBvbmNlLlxuICAgICAqIFdhcm5pbmc6IGl0IGRvZXNu4oCZdCBjcmVhdGUgYW55IGVsZW1lbnRzIGZvciBpdHNlbGYgaW4gdGhlIHBhZ2UsIGl0IGp1c3QgZ3JvdXBzIGV4aXN0aW5nIGVsZW1lbnRzLlxuICAgICAqIFNldHMgYWN0IGFzIHBzZXVkbyBlbGVtZW50cyDigJQgYWxsIG1ldGhvZHMgYXZhaWxhYmxlIHRvIGFuIGVsZW1lbnQgY2FuIGJlIHVzZWQgb24gYSBzZXQuXG4gICAgID0gKG9iamVjdCkgYXJyYXktbGlrZSBvYmplY3QgdGhhdCByZXByZXNlbnRzIHNldCBvZiBlbGVtZW50c1xuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIHN0ID0gcGFwZXIuc2V0KCk7XG4gICAgIHwgc3QucHVzaChcbiAgICAgfCAgICAgcGFwZXIuY2lyY2xlKDEwLCAxMCwgNSksXG4gICAgIHwgICAgIHBhcGVyLmNpcmNsZSgzMCwgMTAsIDUpXG4gICAgIHwgKTtcbiAgICAgfCBzdC5hdHRyKHtmaWxsOiBcInJlZFwifSk7IC8vIGNoYW5nZXMgdGhlIGZpbGwgb2YgYm90aCBjaXJjbGVzXG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uc2V0ID0gZnVuY3Rpb24gKGl0ZW1zQXJyYXkpIHtcbiAgICAgICAgIVIuaXMoaXRlbXNBcnJheSwgXCJhcnJheVwiKSAmJiAoaXRlbXNBcnJheSA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ3VtZW50cy5sZW5ndGgpKTtcbiAgICAgICAgdmFyIG91dCA9IG5ldyBTZXQoaXRlbXNBcnJheSk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICBvdXRbXCJwYXBlclwiXSA9IHRoaXM7XG4gICAgICAgIG91dFtcInR5cGVcIl0gPSBcInNldFwiO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnNldFN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIEBQYXBlci5zZXQuIEFsbCBlbGVtZW50cyB0aGF0IHdpbGwgYmUgY3JlYXRlZCBhZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kIGFuZCBiZWZvcmUgY2FsbGluZ1xuICAgICAqIEBQYXBlci5zZXRGaW5pc2ggd2lsbCBiZSBhZGRlZCB0byB0aGUgc2V0LlxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgcGFwZXIuc2V0U3RhcnQoKTtcbiAgICAgfCBwYXBlci5jaXJjbGUoMTAsIDEwLCA1KSxcbiAgICAgfCBwYXBlci5jaXJjbGUoMzAsIDEwLCA1KVxuICAgICB8IHZhciBzdCA9IHBhcGVyLnNldEZpbmlzaCgpO1xuICAgICB8IHN0LmF0dHIoe2ZpbGw6IFwicmVkXCJ9KTsgLy8gY2hhbmdlcyB0aGUgZmlsbCBvZiBib3RoIGNpcmNsZXNcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5zZXRTdGFydCA9IGZ1bmN0aW9uIChzZXQpIHtcbiAgICAgICAgdGhpcy5fX3NldF9fID0gc2V0IHx8IHRoaXMuc2V0KCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuc2V0RmluaXNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQFBhcGVyLnNldFN0YXJ0LiBUaGlzIG1ldGhvZCBmaW5pc2hlcyBjYXRjaGluZyBhbmQgcmV0dXJucyByZXN1bHRpbmcgc2V0LlxuICAgICAqKlxuICAgICA9IChvYmplY3QpIHNldFxuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnNldEZpbmlzaCA9IGZ1bmN0aW9uIChzZXQpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMuX19zZXRfXztcbiAgICAgICAgZGVsZXRlIHRoaXMuX19zZXRfXztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5nZXRTaXplXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBPYnRhaW5zIGN1cnJlbnQgcGFwZXIgYWN0dWFsIHNpemUuXG4gICAgICoqXG4gICAgID0gKG9iamVjdClcbiAgICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZ2V0U2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuY2FudmFzLnBhcmVudE5vZGU7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogY29udGFpbmVyLm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBjb250YWluZXIub2Zmc2V0SGVpZ2h0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuc2V0U2l6ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSWYgeW91IG5lZWQgdG8gY2hhbmdlIGRpbWVuc2lvbnMgb2YgdGhlIGNhbnZhcyBjYWxsIHRoaXMgbWV0aG9kXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHdpZHRoIChudW1iZXIpIG5ldyB3aWR0aCBvZiB0aGUgY2FudmFzXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpIG5ldyBoZWlnaHQgb2YgdGhlIGNhbnZhc1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnNldFNpemUgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xuICAgICAgICByZXR1cm4gUi5fZW5naW5lLnNldFNpemUuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5zZXRWaWV3Qm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZXRzIHRoZSB2aWV3IGJveCBvZiB0aGUgcGFwZXIuIFByYWN0aWNhbGx5IGl0IGdpdmVzIHlvdSBhYmlsaXR5IHRvIHpvb20gYW5kIHBhbiB3aG9sZSBwYXBlciBzdXJmYWNlIGJ5XG4gICAgICogc3BlY2lmeWluZyBuZXcgYm91bmRhcmllcy5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSBuZXcgeCBwb3NpdGlvbiwgZGVmYXVsdCBpcyBgMGBcbiAgICAgLSB5IChudW1iZXIpIG5ldyB5IHBvc2l0aW9uLCBkZWZhdWx0IGlzIGAwYFxuICAgICAtIHcgKG51bWJlcikgbmV3IHdpZHRoIG9mIHRoZSBjYW52YXNcbiAgICAgLSBoIChudW1iZXIpIG5ldyBoZWlnaHQgb2YgdGhlIGNhbnZhc1xuICAgICAtIGZpdCAoYm9vbGVhbikgYHRydWVgIGlmIHlvdSB3YW50IGdyYXBoaWNzIHRvIGZpdCBpbnRvIG5ldyBib3VuZGFyeSBib3hcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5zZXRWaWV3Qm94ID0gZnVuY3Rpb24gKHgsIHksIHcsIGgsIGZpdCkge1xuICAgICAgICByZXR1cm4gUi5fZW5naW5lLnNldFZpZXdCb3guY2FsbCh0aGlzLCB4LCB5LCB3LCBoLCBmaXQpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnRvcFxuICAgICBbIHByb3BlcnR5IF1cbiAgICAgKipcbiAgICAgKiBQb2ludHMgdG8gdGhlIHRvcG1vc3QgZWxlbWVudCBvbiB0aGUgcGFwZXJcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIFBhcGVyLmJvdHRvbVxuICAgICBbIHByb3BlcnR5IF1cbiAgICAgKipcbiAgICAgKiBQb2ludHMgdG8gdGhlIGJvdHRvbSBlbGVtZW50IG9uIHRoZSBwYXBlclxuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnRvcCA9IHBhcGVycHJvdG8uYm90dG9tID0gbnVsbDtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucmFwaGFlbFxuICAgICBbIHByb3BlcnR5IF1cbiAgICAgKipcbiAgICAgKiBQb2ludHMgdG8gdGhlIEBSYXBoYWVsIG9iamVjdC9mdW5jdGlvblxuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnJhcGhhZWwgPSBSO1xuICAgIHZhciBnZXRPZmZzZXQgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICB2YXIgYm94ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgICAgIGRvYyA9IGVsZW0ub3duZXJEb2N1bWVudCxcbiAgICAgICAgICAgIGJvZHkgPSBkb2MuYm9keSxcbiAgICAgICAgICAgIGRvY0VsZW0gPSBkb2MuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgICAgICAgY2xpZW50VG9wID0gZG9jRWxlbS5jbGllbnRUb3AgfHwgYm9keS5jbGllbnRUb3AgfHwgMCwgY2xpZW50TGVmdCA9IGRvY0VsZW0uY2xpZW50TGVmdCB8fCBib2R5LmNsaWVudExlZnQgfHwgMCxcbiAgICAgICAgICAgIHRvcCAgPSBib3gudG9wICArIChnLndpbi5wYWdlWU9mZnNldCB8fCBkb2NFbGVtLnNjcm9sbFRvcCB8fCBib2R5LnNjcm9sbFRvcCApIC0gY2xpZW50VG9wLFxuICAgICAgICAgICAgbGVmdCA9IGJveC5sZWZ0ICsgKGcud2luLnBhZ2VYT2Zmc2V0IHx8IGRvY0VsZW0uc2Nyb2xsTGVmdCB8fCBib2R5LnNjcm9sbExlZnQpIC0gY2xpZW50TGVmdDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHk6IHRvcCxcbiAgICAgICAgICAgIHg6IGxlZnRcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5nZXRFbGVtZW50QnlQb2ludFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB5b3UgdG9wbW9zdCBlbGVtZW50IHVuZGVyIGdpdmVuIHBvaW50LlxuICAgICAqKlxuICAgICA9IChvYmplY3QpIFJhcGhhw6tsIGVsZW1lbnQgb2JqZWN0XG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIGZyb20gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiB0aGUgd2luZG93XG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgZnJvbSB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIHRoZSB3aW5kb3dcbiAgICAgPiBVc2FnZVxuICAgICB8IHBhcGVyLmdldEVsZW1lbnRCeVBvaW50KG1vdXNlWCwgbW91c2VZKS5hdHRyKHtzdHJva2U6IFwiI2YwMFwifSk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZ2V0RWxlbWVudEJ5UG9pbnQgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB2YXIgcGFwZXIgPSB0aGlzLFxuICAgICAgICAgICAgc3ZnID0gcGFwZXIuY2FudmFzLFxuICAgICAgICAgICAgdGFyZ2V0ID0gZy5kb2MuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcbiAgICAgICAgaWYgKGcud2luLm9wZXJhICYmIHRhcmdldC50YWdOYW1lID09IFwic3ZnXCIpIHtcbiAgICAgICAgICAgIHZhciBzbyA9IGdldE9mZnNldChzdmcpLFxuICAgICAgICAgICAgICAgIHNyID0gc3ZnLmNyZWF0ZVNWR1JlY3QoKTtcbiAgICAgICAgICAgIHNyLnggPSB4IC0gc28ueDtcbiAgICAgICAgICAgIHNyLnkgPSB5IC0gc28ueTtcbiAgICAgICAgICAgIHNyLndpZHRoID0gc3IuaGVpZ2h0ID0gMTtcbiAgICAgICAgICAgIHZhciBoaXRzID0gc3ZnLmdldEludGVyc2VjdGlvbkxpc3Qoc3IsIG51bGwpO1xuICAgICAgICAgICAgaWYgKGhpdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gaGl0c1toaXRzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAodGFyZ2V0LnBhcmVudE5vZGUgJiYgdGFyZ2V0ICE9IHN2Zy5wYXJlbnROb2RlICYmICF0YXJnZXQucmFwaGFlbCkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0ID09IHBhcGVyLmNhbnZhcy5wYXJlbnROb2RlICYmICh0YXJnZXQgPSBzdmcpO1xuICAgICAgICB0YXJnZXQgPSB0YXJnZXQgJiYgdGFyZ2V0LnJhcGhhZWwgPyBwYXBlci5nZXRCeUlkKHRhcmdldC5yYXBoYWVsaWQpIDogbnVsbDtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdldEVsZW1lbnRzQnlCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHNldCBvZiBlbGVtZW50cyB0aGF0IGhhdmUgYW4gaW50ZXJzZWN0aW5nIGJvdW5kaW5nIGJveFxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBiYm94IChvYmplY3QpIGJib3ggdG8gY2hlY2sgd2l0aFxuICAgICA9IChvYmplY3QpIEBTZXRcbiAgICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZ2V0RWxlbWVudHNCeUJCb3ggPSBmdW5jdGlvbiAoYmJveCkge1xuICAgICAgICB2YXIgc2V0ID0gdGhpcy5zZXQoKTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgaWYgKFIuaXNCQm94SW50ZXJzZWN0KGVsLmdldEJCb3goKSwgYmJveCkpIHtcbiAgICAgICAgICAgICAgICBzZXQucHVzaChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2V0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ2V0QnlJZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB5b3UgZWxlbWVudCBieSBpdHMgaW50ZXJuYWwgSUQuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGlkIChudW1iZXIpIGlkXG4gICAgID0gKG9iamVjdCkgUmFwaGHDq2wgZWxlbWVudCBvYmplY3RcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5nZXRCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciBib3QgPSB0aGlzLmJvdHRvbTtcbiAgICAgICAgd2hpbGUgKGJvdCkge1xuICAgICAgICAgICAgaWYgKGJvdC5pZCA9PSBpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBib3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBib3QgPSBib3QubmV4dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5mb3JFYWNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFeGVjdXRlcyBnaXZlbiBmdW5jdGlvbiBmb3IgZWFjaCBlbGVtZW50IG9uIHRoZSBwYXBlclxuICAgICAqXG4gICAgICogSWYgY2FsbGJhY2sgZnVuY3Rpb24gcmV0dXJucyBgZmFsc2VgIGl0IHdpbGwgc3RvcCBsb29wIHJ1bm5pbmcuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgZnVuY3Rpb24gdG8gcnVuXG4gICAgIC0gdGhpc0FyZyAob2JqZWN0KSBjb250ZXh0IG9iamVjdCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgID0gKG9iamVjdCkgUGFwZXIgb2JqZWN0XG4gICAgID4gVXNhZ2VcbiAgICAgfCBwYXBlci5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICB8ICAgICBlbC5hdHRyKHsgc3Ryb2tlOiBcImJsdWVcIiB9KTtcbiAgICAgfCB9KTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgIHZhciBib3QgPSB0aGlzLmJvdHRvbTtcbiAgICAgICAgd2hpbGUgKGJvdCkge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGwodGhpc0FyZywgYm90KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJvdCA9IGJvdC5uZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdldEVsZW1lbnRzQnlQb2ludFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBzZXQgb2YgZWxlbWVudHMgdGhhdCBoYXZlIGNvbW1vbiBwb2ludCBpbnNpZGVcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgID0gKG9iamVjdCkgQFNldFxuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmdldEVsZW1lbnRzQnlQb2ludCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHZhciBzZXQgPSB0aGlzLnNldCgpO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwuaXNQb2ludEluc2lkZSh4LCB5KSkge1xuICAgICAgICAgICAgICAgIHNldC5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZXQ7XG4gICAgfTtcbiAgICBmdW5jdGlvbiB4X3koKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnggKyBTICsgdGhpcy55O1xuICAgIH1cbiAgICBmdW5jdGlvbiB4X3lfd19oKCkge1xuICAgICAgICByZXR1cm4gdGhpcy54ICsgUyArIHRoaXMueSArIFMgKyB0aGlzLndpZHRoICsgXCIgXFx4ZDcgXCIgKyB0aGlzLmhlaWdodDtcbiAgICB9XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaXNQb2ludEluc2lkZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGV0ZXJtaW5lIGlmIGdpdmVuIHBvaW50IGlzIGluc2lkZSB0aGlzIGVsZW1lbnTigJlzIHNoYXBlXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgcG9pbnQgaW5zaWRlIHRoZSBzaGFwZVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmlzUG9pbnRJbnNpZGUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB2YXIgcnAgPSB0aGlzLnJlYWxQYXRoID0gZ2V0UGF0aFt0aGlzLnR5cGVdKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5hdHRyKCd0cmFuc2Zvcm0nKSAmJiB0aGlzLmF0dHIoJ3RyYW5zZm9ybScpLmxlbmd0aCkge1xuICAgICAgICAgICAgcnAgPSBSLnRyYW5zZm9ybVBhdGgocnAsIHRoaXMuYXR0cigndHJhbnNmb3JtJykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBSLmlzUG9pbnRJbnNpZGVQYXRoKHJwLCB4LCB5KTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldEJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybiBib3VuZGluZyBib3ggZm9yIGEgZ2l2ZW4gZWxlbWVudFxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBpc1dpdGhvdXRUcmFuc2Zvcm0gKGJvb2xlYW4pIGZsYWcsIGB0cnVlYCBpZiB5b3Ugd2FudCB0byBoYXZlIGJvdW5kaW5nIGJveCBiZWZvcmUgdHJhbnNmb3JtYXRpb25zLiBEZWZhdWx0IGlzIGBmYWxzZWAuXG4gICAgID0gKG9iamVjdCkgQm91bmRpbmcgYm94IG9iamVjdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHRvcCBsZWZ0IGNvcm5lciB4XG4gICAgIG8gICAgIHk6IChudW1iZXIpIHRvcCBsZWZ0IGNvcm5lciB5XG4gICAgIG8gICAgIHgyOiAobnVtYmVyKSBib3R0b20gcmlnaHQgY29ybmVyIHhcbiAgICAgbyAgICAgeTI6IChudW1iZXIpIGJvdHRvbSByaWdodCBjb3JuZXIgeVxuICAgICBvICAgICB3aWR0aDogKG51bWJlcikgd2lkdGhcbiAgICAgbyAgICAgaGVpZ2h0OiAobnVtYmVyKSBoZWlnaHRcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0QkJveCA9IGZ1bmN0aW9uIChpc1dpdGhvdXRUcmFuc2Zvcm0pIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBfID0gdGhpcy5fO1xuICAgICAgICBpZiAoaXNXaXRob3V0VHJhbnNmb3JtKSB7XG4gICAgICAgICAgICBpZiAoXy5kaXJ0eSB8fCAhXy5iYm94d3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlYWxQYXRoID0gZ2V0UGF0aFt0aGlzLnR5cGVdKHRoaXMpO1xuICAgICAgICAgICAgICAgIF8uYmJveHd0ID0gcGF0aERpbWVuc2lvbnModGhpcy5yZWFsUGF0aCk7XG4gICAgICAgICAgICAgICAgXy5iYm94d3QudG9TdHJpbmcgPSB4X3lfd19oO1xuICAgICAgICAgICAgICAgIF8uZGlydHkgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIF8uYmJveHd0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmRpcnR5IHx8IF8uZGlydHlUIHx8ICFfLmJib3gpIHtcbiAgICAgICAgICAgIGlmIChfLmRpcnR5IHx8ICF0aGlzLnJlYWxQYXRoKSB7XG4gICAgICAgICAgICAgICAgXy5iYm94d3QgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMucmVhbFBhdGggPSBnZXRQYXRoW3RoaXMudHlwZV0odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfLmJib3ggPSBwYXRoRGltZW5zaW9ucyhtYXBQYXRoKHRoaXMucmVhbFBhdGgsIHRoaXMubWF0cml4KSk7XG4gICAgICAgICAgICBfLmJib3gudG9TdHJpbmcgPSB4X3lfd19oO1xuICAgICAgICAgICAgXy5kaXJ0eSA9IF8uZGlydHlUID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXy5iYm94O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuY2xvbmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICA9IChvYmplY3QpIGNsb25lIG9mIGEgZ2l2ZW4gZWxlbWVudFxuICAgICAqKlxuICAgIFxcKi9cbiAgICBlbHByb3RvLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3V0ID0gdGhpcy5wYXBlclt0aGlzLnR5cGVdKCkuYXR0cih0aGlzLmF0dHIoKSk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2xvd1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJuIHNldCBvZiBlbGVtZW50cyB0aGF0IGNyZWF0ZSBnbG93LWxpa2UgZWZmZWN0IGFyb3VuZCBnaXZlbiBlbGVtZW50LiBTZWUgQFBhcGVyLnNldC5cbiAgICAgKlxuICAgICAqIE5vdGU6IEdsb3cgaXMgbm90IGNvbm5lY3RlZCB0byB0aGUgZWxlbWVudC4gSWYgeW91IGNoYW5nZSBlbGVtZW50IGF0dHJpYnV0ZXMgaXQgd29u4oCZdCBhZGp1c3QgaXRzZWxmLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBnbG93IChvYmplY3QpICNvcHRpb25hbCBwYXJhbWV0ZXJzIG9iamVjdCB3aXRoIGFsbCBwcm9wZXJ0aWVzIG9wdGlvbmFsOlxuICAgICBvIHtcbiAgICAgbyAgICAgd2lkdGggKG51bWJlcikgc2l6ZSBvZiB0aGUgZ2xvdywgZGVmYXVsdCBpcyBgMTBgXG4gICAgIG8gICAgIGZpbGwgKGJvb2xlYW4pIHdpbGwgaXQgYmUgZmlsbGVkLCBkZWZhdWx0IGlzIGBmYWxzZWBcbiAgICAgbyAgICAgb3BhY2l0eSAobnVtYmVyKSBvcGFjaXR5LCBkZWZhdWx0IGlzIGAwLjVgXG4gICAgIG8gICAgIG9mZnNldHggKG51bWJlcikgaG9yaXpvbnRhbCBvZmZzZXQsIGRlZmF1bHQgaXMgYDBgXG4gICAgIG8gICAgIG9mZnNldHkgKG51bWJlcikgdmVydGljYWwgb2Zmc2V0LCBkZWZhdWx0IGlzIGAwYFxuICAgICBvICAgICBjb2xvciAoc3RyaW5nKSBnbG93IGNvbG91ciwgZGVmYXVsdCBpcyBgYmxhY2tgXG4gICAgIG8gfVxuICAgICA9IChvYmplY3QpIEBQYXBlci5zZXQgb2YgZWxlbWVudHMgdGhhdCByZXByZXNlbnRzIGdsb3dcbiAgICBcXCovXG4gICAgZWxwcm90by5nbG93ID0gZnVuY3Rpb24gKGdsb3cpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcInRleHRcIikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZ2xvdyA9IGdsb3cgfHwge307XG4gICAgICAgIHZhciBzID0ge1xuICAgICAgICAgICAgd2lkdGg6IChnbG93LndpZHRoIHx8IDEwKSArICgrdGhpcy5hdHRyKFwic3Ryb2tlLXdpZHRoXCIpIHx8IDEpLFxuICAgICAgICAgICAgZmlsbDogZ2xvdy5maWxsIHx8IGZhbHNlLFxuICAgICAgICAgICAgb3BhY2l0eTogZ2xvdy5vcGFjaXR5IHx8IC41LFxuICAgICAgICAgICAgb2Zmc2V0eDogZ2xvdy5vZmZzZXR4IHx8IDAsXG4gICAgICAgICAgICBvZmZzZXR5OiBnbG93Lm9mZnNldHkgfHwgMCxcbiAgICAgICAgICAgIGNvbG9yOiBnbG93LmNvbG9yIHx8IFwiIzAwMFwiXG4gICAgICAgIH0sXG4gICAgICAgICAgICBjID0gcy53aWR0aCAvIDIsXG4gICAgICAgICAgICByID0gdGhpcy5wYXBlcixcbiAgICAgICAgICAgIG91dCA9IHIuc2V0KCksXG4gICAgICAgICAgICBwYXRoID0gdGhpcy5yZWFsUGF0aCB8fCBnZXRQYXRoW3RoaXMudHlwZV0odGhpcyk7XG4gICAgICAgIHBhdGggPSB0aGlzLm1hdHJpeCA/IG1hcFBhdGgocGF0aCwgdGhpcy5tYXRyaXgpIDogcGF0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBjICsgMTsgaSsrKSB7XG4gICAgICAgICAgICBvdXQucHVzaChyLnBhdGgocGF0aCkuYXR0cih7XG4gICAgICAgICAgICAgICAgc3Ryb2tlOiBzLmNvbG9yLFxuICAgICAgICAgICAgICAgIGZpbGw6IHMuZmlsbCA/IHMuY29sb3IgOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBcInN0cm9rZS1saW5lam9pblwiOiBcInJvdW5kXCIsXG4gICAgICAgICAgICAgICAgXCJzdHJva2UtbGluZWNhcFwiOiBcInJvdW5kXCIsXG4gICAgICAgICAgICAgICAgXCJzdHJva2Utd2lkdGhcIjogKyhzLndpZHRoIC8gYyAqIGkpLnRvRml4ZWQoMyksXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogKyhzLm9wYWNpdHkgLyBjKS50b0ZpeGVkKDMpXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dC5pbnNlcnRCZWZvcmUodGhpcykudHJhbnNsYXRlKHMub2Zmc2V0eCwgcy5vZmZzZXR5KTtcbiAgICB9O1xuICAgIHZhciBjdXJ2ZXNsZW5ndGhzID0ge30sXG4gICAgZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGggPSBmdW5jdGlvbiAocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIGxlbmd0aCkge1xuICAgICAgICBpZiAobGVuZ3RoID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBiZXpsZW4ocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFIuZmluZERvdHNBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIGdldFRhdExlbihwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgbGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldExlbmd0aEZhY3RvcnkgPSBmdW5jdGlvbiAoaXN0b3RhbCwgc3VicGF0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHBhdGgsIGxlbmd0aCwgb25seXN0YXJ0KSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aDJjdXJ2ZShwYXRoKTtcbiAgICAgICAgICAgIHZhciB4LCB5LCBwLCBsLCBzcCA9IFwiXCIsIHN1YnBhdGhzID0ge30sIHBvaW50LFxuICAgICAgICAgICAgICAgIGxlbiA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwID0gcGF0aFtpXTtcbiAgICAgICAgICAgICAgICBpZiAocFswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgICAgICB4ID0gK3BbMV07XG4gICAgICAgICAgICAgICAgICAgIHkgPSArcFsyXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsID0gZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGgoeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZW4gKyBsID4gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VicGF0aCAmJiAhc3VicGF0aHMuc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludCA9IGdldFBvaW50QXRTZWdtZW50TGVuZ3RoKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0sIGxlbmd0aCAtIGxlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3AgKz0gW1wiQ1wiICsgcG9pbnQuc3RhcnQueCwgcG9pbnQuc3RhcnQueSwgcG9pbnQubS54LCBwb2ludC5tLnksIHBvaW50LngsIHBvaW50LnldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbmx5c3RhcnQpIHtyZXR1cm4gc3A7fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnBhdGhzLnN0YXJ0ID0gc3A7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3AgPSBbXCJNXCIgKyBwb2ludC54LCBwb2ludC55ICsgXCJDXCIgKyBwb2ludC5uLngsIHBvaW50Lm4ueSwgcG9pbnQuZW5kLngsIHBvaW50LmVuZC55LCBwWzVdLCBwWzZdXS5qb2luKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuICs9IGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCA9ICtwWzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgPSArcFs2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXN0b3RhbCAmJiAhc3VicGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50ID0gZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGgoeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSwgbGVuZ3RoIC0gbGVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge3g6IHBvaW50LngsIHk6IHBvaW50LnksIGFscGhhOiBwb2ludC5hbHBoYX07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGVuICs9IGw7XG4gICAgICAgICAgICAgICAgICAgIHggPSArcFs1XTtcbiAgICAgICAgICAgICAgICAgICAgeSA9ICtwWzZdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzcCArPSBwLnNoaWZ0KCkgKyBwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VicGF0aHMuZW5kID0gc3A7XG4gICAgICAgICAgICBwb2ludCA9IGlzdG90YWwgPyBsZW4gOiBzdWJwYXRoID8gc3VicGF0aHMgOiBSLmZpbmREb3RzQXRTZWdtZW50KHgsIHksIHBbMF0sIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIDEpO1xuICAgICAgICAgICAgcG9pbnQuYWxwaGEgJiYgKHBvaW50ID0ge3g6IHBvaW50LngsIHk6IHBvaW50LnksIGFscGhhOiBwb2ludC5hbHBoYX0pO1xuICAgICAgICAgICAgcmV0dXJuIHBvaW50O1xuICAgICAgICB9O1xuICAgIH07XG4gICAgdmFyIGdldFRvdGFsTGVuZ3RoID0gZ2V0TGVuZ3RoRmFjdG9yeSgxKSxcbiAgICAgICAgZ2V0UG9pbnRBdExlbmd0aCA9IGdldExlbmd0aEZhY3RvcnkoKSxcbiAgICAgICAgZ2V0U3VicGF0aHNBdExlbmd0aCA9IGdldExlbmd0aEZhY3RvcnkoMCwgMSk7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZ2V0VG90YWxMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgbGVuZ3RoIG9mIHRoZSBnaXZlbiBwYXRoIGluIHBpeGVscy5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBTVkcgcGF0aCBzdHJpbmcuXG4gICAgICoqXG4gICAgID0gKG51bWJlcikgbGVuZ3RoLlxuICAgIFxcKi9cbiAgICBSLmdldFRvdGFsTGVuZ3RoID0gZ2V0VG90YWxMZW5ndGg7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJuIGNvb3JkaW5hdGVzIG9mIHRoZSBwb2ludCBsb2NhdGVkIGF0IHRoZSBnaXZlbiBsZW5ndGggb24gdGhlIGdpdmVuIHBhdGguXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHBhdGggKHN0cmluZykgU1ZHIHBhdGggc3RyaW5nXG4gICAgIC0gbGVuZ3RoIChudW1iZXIpXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgcmVwcmVzZW50YXRpb24gb2YgdGhlIHBvaW50OlxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZVxuICAgICBvICAgICBhbHBoYTogKG51bWJlcikgYW5nbGUgb2YgZGVyaXZhdGl2ZVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5nZXRQb2ludEF0TGVuZ3RoID0gZ2V0UG9pbnRBdExlbmd0aDtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5nZXRTdWJwYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm4gc3VicGF0aCBvZiBhIGdpdmVuIHBhdGggZnJvbSBnaXZlbiBsZW5ndGggdG8gZ2l2ZW4gbGVuZ3RoLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBwYXRoIChzdHJpbmcpIFNWRyBwYXRoIHN0cmluZ1xuICAgICAtIGZyb20gKG51bWJlcikgcG9zaXRpb24gb2YgdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50XG4gICAgIC0gdG8gKG51bWJlcikgcG9zaXRpb24gb2YgdGhlIGVuZCBvZiB0aGUgc2VnbWVudFxuICAgICAqKlxuICAgICA9IChzdHJpbmcpIHBhdGhzdHJpbmcgZm9yIHRoZSBzZWdtZW50XG4gICAgXFwqL1xuICAgIFIuZ2V0U3VicGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBmcm9tLCB0bykge1xuICAgICAgICBpZiAodGhpcy5nZXRUb3RhbExlbmd0aChwYXRoKSAtIHRvIDwgMWUtNikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN1YnBhdGhzQXRMZW5ndGgocGF0aCwgZnJvbSkuZW5kO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhID0gZ2V0U3VicGF0aHNBdExlbmd0aChwYXRoLCB0bywgMSk7XG4gICAgICAgIHJldHVybiBmcm9tID8gZ2V0U3VicGF0aHNBdExlbmd0aChhLCBmcm9tKS5lbmQgOiBhO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0VG90YWxMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgbGVuZ3RoIG9mIHRoZSBwYXRoIGluIHBpeGVscy4gT25seSB3b3JrcyBmb3IgZWxlbWVudCBvZiDigJxwYXRo4oCdIHR5cGUuXG4gICAgID0gKG51bWJlcikgbGVuZ3RoLlxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldFRvdGFsTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCgpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5vZGUuZ2V0VG90YWxMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0VG90YWxMZW5ndGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRUb3RhbExlbmd0aChwYXRoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldFBvaW50QXRMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybiBjb29yZGluYXRlcyBvZiB0aGUgcG9pbnQgbG9jYXRlZCBhdCB0aGUgZ2l2ZW4gbGVuZ3RoIG9uIHRoZSBnaXZlbiBwYXRoLiBPbmx5IHdvcmtzIGZvciBlbGVtZW50IG9mIOKAnHBhdGjigJ0gdHlwZS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gbGVuZ3RoIChudW1iZXIpXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgcmVwcmVzZW50YXRpb24gb2YgdGhlIHBvaW50OlxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZVxuICAgICBvICAgICBhbHBoYTogKG51bWJlcikgYW5nbGUgb2YgZGVyaXZhdGl2ZVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRQb2ludEF0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbmd0aCkge1xuICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCgpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRQb2ludEF0TGVuZ3RoKHBhdGgsIGxlbmd0aCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRQYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHBhdGggb2YgdGhlIGVsZW1lbnQuIE9ubHkgd29ya3MgZm9yIGVsZW1lbnRzIG9mIOKAnHBhdGjigJ0gdHlwZSBhbmQgc2ltcGxlIGVsZW1lbnRzIGxpa2UgY2lyY2xlLlxuICAgICA9IChvYmplY3QpIHBhdGhcbiAgICAgKipcbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRQYXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGF0aCxcbiAgICAgICAgICAgIGdldFBhdGggPSBSLl9nZXRQYXRoW3RoaXMudHlwZV07XG5cbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcInRleHRcIiB8fCB0aGlzLnR5cGUgPT0gXCJzZXRcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGdldFBhdGgpIHtcbiAgICAgICAgICAgIHBhdGggPSBnZXRQYXRoKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRTdWJwYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm4gc3VicGF0aCBvZiBhIGdpdmVuIGVsZW1lbnQgZnJvbSBnaXZlbiBsZW5ndGggdG8gZ2l2ZW4gbGVuZ3RoLiBPbmx5IHdvcmtzIGZvciBlbGVtZW50IG9mIOKAnHBhdGjigJ0gdHlwZS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gZnJvbSAobnVtYmVyKSBwb3NpdGlvbiBvZiB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnRcbiAgICAgLSB0byAobnVtYmVyKSBwb3NpdGlvbiBvZiB0aGUgZW5kIG9mIHRoZSBzZWdtZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgcGF0aHN0cmluZyBmb3IgdGhlIHNlZ21lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRTdWJwYXRoID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XG4gICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoKCk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFIuZ2V0U3VicGF0aChwYXRoLCBmcm9tLCB0byk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5lYXNpbmdfZm9ybXVsYXNcbiAgICAgWyBwcm9wZXJ0eSBdXG4gICAgICoqXG4gICAgICogT2JqZWN0IHRoYXQgY29udGFpbnMgZWFzaW5nIGZvcm11bGFzIGZvciBhbmltYXRpb24uIFlvdSBjb3VsZCBleHRlbmQgaXQgd2l0aCB5b3VyIG93bi4gQnkgZGVmYXVsdCBpdCBoYXMgZm9sbG93aW5nIGxpc3Qgb2YgZWFzaW5nOlxuICAgICAjIDx1bD5cbiAgICAgIyAgICAgPGxpPuKAnGxpbmVhcuKAnTwvbGk+XG4gICAgICMgICAgIDxsaT7igJwmbHQ74oCdIG9yIOKAnGVhc2VJbuKAnSBvciDigJxlYXNlLWlu4oCdPC9saT5cbiAgICAgIyAgICAgPGxpPuKAnD7igJ0gb3Ig4oCcZWFzZU91dOKAnSBvciDigJxlYXNlLW91dOKAnTwvbGk+XG4gICAgICMgICAgIDxsaT7igJwmbHQ7PuKAnSBvciDigJxlYXNlSW5PdXTigJ0gb3Ig4oCcZWFzZS1pbi1vdXTigJ08L2xpPlxuICAgICAjICAgICA8bGk+4oCcYmFja0lu4oCdIG9yIOKAnGJhY2staW7igJ08L2xpPlxuICAgICAjICAgICA8bGk+4oCcYmFja091dOKAnSBvciDigJxiYWNrLW91dOKAnTwvbGk+XG4gICAgICMgICAgIDxsaT7igJxlbGFzdGlj4oCdPC9saT5cbiAgICAgIyAgICAgPGxpPuKAnGJvdW5jZeKAnTwvbGk+XG4gICAgICMgPC91bD5cbiAgICAgIyA8cD5TZWUgYWxzbyA8YSBocmVmPVwiaHR0cDovL3JhcGhhZWxqcy5jb20vZWFzaW5nLmh0bWxcIj5FYXNpbmcgZGVtbzwvYT4uPC9wPlxuICAgIFxcKi9cbiAgICB2YXIgZWYgPSBSLmVhc2luZ19mb3JtdWxhcyA9IHtcbiAgICAgICAgbGluZWFyOiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH0sXG4gICAgICAgIFwiPFwiOiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgcmV0dXJuIHBvdyhuLCAxLjcpO1xuICAgICAgICB9LFxuICAgICAgICBcIj5cIjogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHJldHVybiBwb3cobiwgLjQ4KTtcbiAgICAgICAgfSxcbiAgICAgICAgXCI8PlwiOiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgdmFyIHEgPSAuNDggLSBuIC8gMS4wNCxcbiAgICAgICAgICAgICAgICBRID0gbWF0aC5zcXJ0KC4xNzM0ICsgcSAqIHEpLFxuICAgICAgICAgICAgICAgIHggPSBRIC0gcSxcbiAgICAgICAgICAgICAgICBYID0gcG93KGFicyh4KSwgMSAvIDMpICogKHggPCAwID8gLTEgOiAxKSxcbiAgICAgICAgICAgICAgICB5ID0gLVEgLSBxLFxuICAgICAgICAgICAgICAgIFkgPSBwb3coYWJzKHkpLCAxIC8gMykgKiAoeSA8IDAgPyAtMSA6IDEpLFxuICAgICAgICAgICAgICAgIHQgPSBYICsgWSArIC41O1xuICAgICAgICAgICAgcmV0dXJuICgxIC0gdCkgKiAzICogdCAqIHQgKyB0ICogdCAqIHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGJhY2tJbjogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgICAgICAgIHJldHVybiBuICogbiAqICgocyArIDEpICogbiAtIHMpO1xuICAgICAgICB9LFxuICAgICAgICBiYWNrT3V0OiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgbiA9IG4gLSAxO1xuICAgICAgICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgICAgICAgcmV0dXJuIG4gKiBuICogKChzICsgMSkgKiBuICsgcykgKyAxO1xuICAgICAgICB9LFxuICAgICAgICBlbGFzdGljOiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgaWYgKG4gPT0gISFuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcG93KDIsIC0xMCAqIG4pICogbWF0aC5zaW4oKG4gLSAuMDc1KSAqICgyICogUEkpIC8gLjMpICsgMTtcbiAgICAgICAgfSxcbiAgICAgICAgYm91bmNlOiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgdmFyIHMgPSA3LjU2MjUsXG4gICAgICAgICAgICAgICAgcCA9IDIuNzUsXG4gICAgICAgICAgICAgICAgbDtcbiAgICAgICAgICAgIGlmIChuIDwgKDEgLyBwKSkge1xuICAgICAgICAgICAgICAgIGwgPSBzICogbiAqIG47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChuIDwgKDIgLyBwKSkge1xuICAgICAgICAgICAgICAgICAgICBuIC09ICgxLjUgLyBwKTtcbiAgICAgICAgICAgICAgICAgICAgbCA9IHMgKiBuICogbiArIC43NTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAobiA8ICgyLjUgLyBwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbiAtPSAoMi4yNSAvIHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IHMgKiBuICogbiArIC45Mzc1O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbiAtPSAoMi42MjUgLyBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBzICogbiAqIG4gKyAuOTg0Mzc1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGVmLmVhc2VJbiA9IGVmW1wiZWFzZS1pblwiXSA9IGVmW1wiPFwiXTtcbiAgICBlZi5lYXNlT3V0ID0gZWZbXCJlYXNlLW91dFwiXSA9IGVmW1wiPlwiXTtcbiAgICBlZi5lYXNlSW5PdXQgPSBlZltcImVhc2UtaW4tb3V0XCJdID0gZWZbXCI8PlwiXTtcbiAgICBlZltcImJhY2staW5cIl0gPSBlZi5iYWNrSW47XG4gICAgZWZbXCJiYWNrLW91dFwiXSA9IGVmLmJhY2tPdXQ7XG5cbiAgICB2YXIgYW5pbWF0aW9uRWxlbWVudHMgPSBbXSxcbiAgICAgICAgcmVxdWVzdEFuaW1GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgIGFuaW1hdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBOb3cgPSArbmV3IERhdGUsXG4gICAgICAgICAgICAgICAgbCA9IDA7XG4gICAgICAgICAgICBmb3IgKDsgbCA8IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDsgbCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSBhbmltYXRpb25FbGVtZW50c1tsXTtcbiAgICAgICAgICAgICAgICBpZiAoZS5lbC5yZW1vdmVkIHx8IGUucGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdGltZSA9IE5vdyAtIGUuc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIG1zID0gZS5tcyxcbiAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gZS5lYXNpbmcsXG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSBlLmZyb20sXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPSBlLmRpZmYsXG4gICAgICAgICAgICAgICAgICAgIHRvID0gZS50byxcbiAgICAgICAgICAgICAgICAgICAgdCA9IGUudCxcbiAgICAgICAgICAgICAgICAgICAgdGhhdCA9IGUuZWwsXG4gICAgICAgICAgICAgICAgICAgIHNldCA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBub3csXG4gICAgICAgICAgICAgICAgICAgIGluaXQgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAga2V5O1xuICAgICAgICAgICAgICAgIGlmIChlLmluaXRzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZSA9IChlLmluaXRzdGF0dXMgKiBlLmFuaW0udG9wIC0gZS5wcmV2KSAvIChlLnBlcmNlbnQgLSBlLnByZXYpICogbXM7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RhdHVzID0gZS5pbml0c3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5pbml0c3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3AgJiYgYW5pbWF0aW9uRWxlbWVudHMuc3BsaWNlKGwtLSwgMSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdGF0dXMgPSAoZS5wcmV2ICsgKGUucGVyY2VudCAtIGUucHJldikgKiAodGltZSAvIG1zKSkgLyBlLmFuaW0udG9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGltZSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aW1lIDwgbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvcyA9IGVhc2luZyh0aW1lIC8gbXMpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhdHRyIGluIGZyb20pIGlmIChmcm9tW2hhc10oYXR0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYXZhaWxhYmxlQW5pbUF0dHJzW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBudTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gK2Zyb21bYXR0cl0gKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjb2xvdXJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gXCJyZ2IoXCIgKyBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHRvMjU1KHJvdW5kKGZyb21bYXR0cl0uciArIHBvcyAqIG1zICogZGlmZlthdHRyXS5yKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHRvMjU1KHJvdW5kKGZyb21bYXR0cl0uZyArIHBvcyAqIG1zICogZGlmZlthdHRyXS5nKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHRvMjU1KHJvdW5kKGZyb21bYXR0cl0uYiArIHBvcyAqIG1zICogZGlmZlthdHRyXS5iKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXS5qb2luKFwiLFwiKSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicGF0aFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZnJvbVthdHRyXS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3dbaV0gPSBbZnJvbVthdHRyXVtpXVswXV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMSwgamogPSBmcm9tW2F0dHJdW2ldLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3dbaV1bal0gPSArZnJvbVthdHRyXVtpXVtqXSArIHBvcyAqIG1zICogZGlmZlthdHRyXVtpXVtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vd1tpXSA9IG5vd1tpXS5qb2luKFMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IG5vdy5qb2luKFMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwidHJhbnNmb3JtXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaWZmW2F0dHJdLnJlYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBmcm9tW2F0dHJdLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3dbaV0gPSBbZnJvbVthdHRyXVtpXVswXV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgamogPSBmcm9tW2F0dHJdW2ldLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93W2ldW2pdID0gZnJvbVthdHRyXVtpXVtqXSArIHBvcyAqIG1zICogZGlmZlthdHRyXVtpXVtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ2V0ID0gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gK2Zyb21bYXR0cl1baV0gKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl1baV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm93ID0gW1tcInJcIiwgZ2V0KDIpLCAwLCAwXSwgW1widFwiLCBnZXQoMyksIGdldCg0KV0sIFtcInNcIiwgZ2V0KDApLCBnZXQoMSksIDAsIDBdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IFtbXCJtXCIsIGdldCgwKSwgZ2V0KDEpLCBnZXQoMiksIGdldCgzKSwgZ2V0KDQpLCBnZXQoNSldXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY3N2XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRyID09IFwiY2xpcC1yZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93W2ldID0gK2Zyb21bYXR0cl1baV0gKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl1baV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZyb20yID0gW11bY29uY2F0XShmcm9tW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSB0aGF0LnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbYXR0cl0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3dbaV0gPSArZnJvbTJbaV0gKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl1baV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRbYXR0cl0gPSBub3c7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5hdHRyKHNldCk7XG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoaWQsIHRoYXQsIGFuaW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuYW5pbS5mcmFtZS5cIiArIGlkLCB0aGF0LCBhbmltKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KSh0aGF0LmlkLCB0aGF0LCBlLmFuaW0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbihmLCBlbCwgYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmUoXCJyYXBoYWVsLmFuaW0uZnJhbWUuXCIgKyBlbC5pZCwgZWwsIGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuYW5pbS5maW5pc2guXCIgKyBlbC5pZCwgZWwsIGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIuaXMoZiwgXCJmdW5jdGlvblwiKSAmJiBmLmNhbGwoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKGUuY2FsbGJhY2ssIHRoYXQsIGUuYW5pbSk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYXR0cih0byk7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzLnNwbGljZShsLS0sIDEpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5yZXBlYXQgPiAxICYmICFlLm5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHRvKSBpZiAodG9baGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdFtrZXldID0gZS50b3RhbE9yaWdpbltrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZS5lbC5hdHRyKGluaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVuQW5pbWF0aW9uKGUuYW5pbSwgZS5lbCwgZS5hbmltLnBlcmNlbnRzWzBdLCBudWxsLCBlLnRvdGFsT3JpZ2luLCBlLnJlcGVhdCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLm5leHQgJiYgIWUuc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVuQW5pbWF0aW9uKGUuYW5pbSwgZS5lbCwgZS5uZXh0LCBudWxsLCBlLnRvdGFsT3JpZ2luLCBlLnJlcGVhdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBSLnN2ZyAmJiB0aGF0ICYmIHRoYXQucGFwZXIgJiYgdGhhdC5wYXBlci5zYWZhcmkoKTtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aCAmJiByZXF1ZXN0QW5pbUZyYW1lKGFuaW1hdGlvbik7XG4gICAgICAgIH0sXG4gICAgICAgIHVwdG8yNTUgPSBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xvciA+IDI1NSA/IDI1NSA6IGNvbG9yIDwgMCA/IDAgOiBjb2xvcjtcbiAgICAgICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hbmltYXRlV2l0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWN0cyBzaW1pbGFyIHRvIEBFbGVtZW50LmFuaW1hdGUsIGJ1dCBlbnN1cmUgdGhhdCBnaXZlbiBhbmltYXRpb24gcnVucyBpbiBzeW5jIHdpdGggYW5vdGhlciBnaXZlbiBlbGVtZW50LlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBlbCAob2JqZWN0KSBlbGVtZW50IHRvIHN5bmMgd2l0aFxuICAgICAtIGFuaW0gKG9iamVjdCkgYW5pbWF0aW9uIHRvIHN5bmMgd2l0aFxuICAgICAtIHBhcmFtcyAob2JqZWN0KSAjb3B0aW9uYWwgZmluYWwgYXR0cmlidXRlcyBmb3IgdGhlIGVsZW1lbnQsIHNlZSBhbHNvIEBFbGVtZW50LmF0dHJcbiAgICAgLSBtcyAobnVtYmVyKSAjb3B0aW9uYWwgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBmb3IgYW5pbWF0aW9uIHRvIHJ1blxuICAgICAtIGVhc2luZyAoc3RyaW5nKSAjb3B0aW9uYWwgZWFzaW5nIHR5cGUuIEFjY2VwdCBvbiBvZiBAUmFwaGFlbC5lYXNpbmdfZm9ybXVsYXMgb3IgQ1NTIGZvcm1hdDogYGN1YmljJiN4MjAxMDtiZXppZXIoWFgsJiMxNjA7WFgsJiMxNjA7WFgsJiMxNjA7WFgpYFxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBhdCB0aGUgZW5kIG9mIGFuaW1hdGlvbi5cbiAgICAgKiBvclxuICAgICAtIGVsZW1lbnQgKG9iamVjdCkgZWxlbWVudCB0byBzeW5jIHdpdGhcbiAgICAgLSBhbmltIChvYmplY3QpIGFuaW1hdGlvbiB0byBzeW5jIHdpdGhcbiAgICAgLSBhbmltYXRpb24gKG9iamVjdCkgI29wdGlvbmFsIGFuaW1hdGlvbiBvYmplY3QsIHNlZSBAUmFwaGFlbC5hbmltYXRpb25cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uYW5pbWF0ZVdpdGggPSBmdW5jdGlvbiAoZWwsIGFuaW0sIHBhcmFtcywgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVkKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjay5jYWxsKGVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGEgPSBwYXJhbXMgaW5zdGFuY2VvZiBBbmltYXRpb24gPyBwYXJhbXMgOiBSLmFuaW1hdGlvbihwYXJhbXMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSxcbiAgICAgICAgICAgIHgsIHk7XG4gICAgICAgIHJ1bkFuaW1hdGlvbihhLCBlbGVtZW50LCBhLnBlcmNlbnRzWzBdLCBudWxsLCBlbGVtZW50LmF0dHIoKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhbmltYXRpb25FbGVtZW50c1tpXS5hbmltID09IGFuaW0gJiYgYW5pbWF0aW9uRWxlbWVudHNbaV0uZWwgPT0gZWwpIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FbGVtZW50c1tpaSAtIDFdLnN0YXJ0ID0gYW5pbWF0aW9uRWxlbWVudHNbaV0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgIC8vXG4gICAgICAgIC8vXG4gICAgICAgIC8vIHZhciBhID0gcGFyYW1zID8gUi5hbmltYXRpb24ocGFyYW1zLCBtcywgZWFzaW5nLCBjYWxsYmFjaykgOiBhbmltLFxuICAgICAgICAvLyAgICAgc3RhdHVzID0gZWxlbWVudC5zdGF0dXMoYW5pbSk7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLmFuaW1hdGUoYSkuc3RhdHVzKGEsIHN0YXR1cyAqIGFuaW0ubXMgLyBhLm1zKTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIEN1YmljQmV6aWVyQXRUaW1lKHQsIHAxeCwgcDF5LCBwMngsIHAyeSwgZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIGN4ID0gMyAqIHAxeCxcbiAgICAgICAgICAgIGJ4ID0gMyAqIChwMnggLSBwMXgpIC0gY3gsXG4gICAgICAgICAgICBheCA9IDEgLSBjeCAtIGJ4LFxuICAgICAgICAgICAgY3kgPSAzICogcDF5LFxuICAgICAgICAgICAgYnkgPSAzICogKHAyeSAtIHAxeSkgLSBjeSxcbiAgICAgICAgICAgIGF5ID0gMSAtIGN5IC0gYnk7XG4gICAgICAgIGZ1bmN0aW9uIHNhbXBsZUN1cnZlWCh0KSB7XG4gICAgICAgICAgICByZXR1cm4gKChheCAqIHQgKyBieCkgKiB0ICsgY3gpICogdDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzb2x2ZSh4LCBlcHNpbG9uKSB7XG4gICAgICAgICAgICB2YXIgdCA9IHNvbHZlQ3VydmVYKHgsIGVwc2lsb24pO1xuICAgICAgICAgICAgcmV0dXJuICgoYXkgKiB0ICsgYnkpICogdCArIGN5KSAqIHQ7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc29sdmVDdXJ2ZVgoeCwgZXBzaWxvbikge1xuICAgICAgICAgICAgdmFyIHQwLCB0MSwgdDIsIHgyLCBkMiwgaTtcbiAgICAgICAgICAgIGZvcih0MiA9IHgsIGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICAgICAgICAgICAgeDIgPSBzYW1wbGVDdXJ2ZVgodDIpIC0geDtcbiAgICAgICAgICAgICAgICBpZiAoYWJzKHgyKSA8IGVwc2lsb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkMiA9ICgzICogYXggKiB0MiArIDIgKiBieCkgKiB0MiArIGN4O1xuICAgICAgICAgICAgICAgIGlmIChhYnMoZDIpIDwgMWUtNikge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdDIgPSB0MiAtIHgyIC8gZDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0MCA9IDA7XG4gICAgICAgICAgICB0MSA9IDE7XG4gICAgICAgICAgICB0MiA9IHg7XG4gICAgICAgICAgICBpZiAodDIgPCB0MCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0MiA+IHQxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKHQwIDwgdDEpIHtcbiAgICAgICAgICAgICAgICB4MiA9IHNhbXBsZUN1cnZlWCh0Mik7XG4gICAgICAgICAgICAgICAgaWYgKGFicyh4MiAtIHgpIDwgZXBzaWxvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh4ID4geDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdDAgPSB0MjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0MSA9IHQyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0MiA9ICh0MSAtIHQwKSAvIDIgKyB0MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0MjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc29sdmUodCwgMSAvICgyMDAgKiBkdXJhdGlvbikpO1xuICAgIH1cbiAgICBlbHByb3RvLm9uQW5pbWF0aW9uID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZiA/IGV2ZS5vbihcInJhcGhhZWwuYW5pbS5mcmFtZS5cIiArIHRoaXMuaWQsIGYpIDogZXZlLnVuYmluZChcInJhcGhhZWwuYW5pbS5mcmFtZS5cIiArIHRoaXMuaWQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGZ1bmN0aW9uIEFuaW1hdGlvbihhbmltLCBtcykge1xuICAgICAgICB2YXIgcGVyY2VudHMgPSBbXSxcbiAgICAgICAgICAgIG5ld0FuaW0gPSB7fTtcbiAgICAgICAgdGhpcy5tcyA9IG1zO1xuICAgICAgICB0aGlzLnRpbWVzID0gMTtcbiAgICAgICAgaWYgKGFuaW0pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGF0dHIgaW4gYW5pbSkgaWYgKGFuaW1baGFzXShhdHRyKSkge1xuICAgICAgICAgICAgICAgIG5ld0FuaW1bdG9GbG9hdChhdHRyKV0gPSBhbmltW2F0dHJdO1xuICAgICAgICAgICAgICAgIHBlcmNlbnRzLnB1c2godG9GbG9hdChhdHRyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZXJjZW50cy5zb3J0KHNvcnRCeU51bWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hbmltID0gbmV3QW5pbTtcbiAgICAgICAgdGhpcy50b3AgPSBwZXJjZW50c1twZXJjZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgdGhpcy5wZXJjZW50cyA9IHBlcmNlbnRzO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogQW5pbWF0aW9uLmRlbGF5XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgY29weSBvZiBleGlzdGluZyBhbmltYXRpb24gb2JqZWN0IHdpdGggZ2l2ZW4gZGVsYXkuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGRlbGF5IChudW1iZXIpIG51bWJlciBvZiBtcyB0byBwYXNzIGJldHdlZW4gYW5pbWF0aW9uIHN0YXJ0IGFuZCBhY3R1YWwgYW5pbWF0aW9uXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgbmV3IGFsdGVyZWQgQW5pbWF0aW9uIG9iamVjdFxuICAgICB8IHZhciBhbmltID0gUmFwaGFlbC5hbmltYXRpb24oe2N4OiAxMCwgY3k6IDIwfSwgMmUzKTtcbiAgICAgfCBjaXJjbGUxLmFuaW1hdGUoYW5pbSk7IC8vIHJ1biB0aGUgZ2l2ZW4gYW5pbWF0aW9uIGltbWVkaWF0ZWx5XG4gICAgIHwgY2lyY2xlMi5hbmltYXRlKGFuaW0uZGVsYXkoNTAwKSk7IC8vIHJ1biB0aGUgZ2l2ZW4gYW5pbWF0aW9uIGFmdGVyIDUwMCBtc1xuICAgIFxcKi9cbiAgICBBbmltYXRpb24ucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKGRlbGF5KSB7XG4gICAgICAgIHZhciBhID0gbmV3IEFuaW1hdGlvbih0aGlzLmFuaW0sIHRoaXMubXMpO1xuICAgICAgICBhLnRpbWVzID0gdGhpcy50aW1lcztcbiAgICAgICAgYS5kZWwgPSArZGVsYXkgfHwgMDtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogQW5pbWF0aW9uLnJlcGVhdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGNvcHkgb2YgZXhpc3RpbmcgYW5pbWF0aW9uIG9iamVjdCB3aXRoIGdpdmVuIHJlcGV0aXRpb24uXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHJlcGVhdCAobnVtYmVyKSBudW1iZXIgaXRlcmF0aW9ucyBvZiBhbmltYXRpb24uIEZvciBpbmZpbml0ZSBhbmltYXRpb24gcGFzcyBgSW5maW5pdHlgXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgbmV3IGFsdGVyZWQgQW5pbWF0aW9uIG9iamVjdFxuICAgIFxcKi9cbiAgICBBbmltYXRpb24ucHJvdG90eXBlLnJlcGVhdCA9IGZ1bmN0aW9uICh0aW1lcykge1xuICAgICAgICB2YXIgYSA9IG5ldyBBbmltYXRpb24odGhpcy5hbmltLCB0aGlzLm1zKTtcbiAgICAgICAgYS5kZWwgPSB0aGlzLmRlbDtcbiAgICAgICAgYS50aW1lcyA9IG1hdGguZmxvb3IobW1heCh0aW1lcywgMCkpIHx8IDE7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH07XG4gICAgZnVuY3Rpb24gcnVuQW5pbWF0aW9uKGFuaW0sIGVsZW1lbnQsIHBlcmNlbnQsIHN0YXR1cywgdG90YWxPcmlnaW4sIHRpbWVzKSB7XG4gICAgICAgIHBlcmNlbnQgPSB0b0Zsb2F0KHBlcmNlbnQpO1xuICAgICAgICB2YXIgcGFyYW1zLFxuICAgICAgICAgICAgaXNJbkFuaW0sXG4gICAgICAgICAgICBpc0luQW5pbVNldCxcbiAgICAgICAgICAgIHBlcmNlbnRzID0gW10sXG4gICAgICAgICAgICBuZXh0LFxuICAgICAgICAgICAgcHJldixcbiAgICAgICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAgICAgIG1zID0gYW5pbS5tcyxcbiAgICAgICAgICAgIGZyb20gPSB7fSxcbiAgICAgICAgICAgIHRvID0ge30sXG4gICAgICAgICAgICBkaWZmID0ge307XG4gICAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBlID0gYW5pbWF0aW9uRWxlbWVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGUuZWwuaWQgPT0gZWxlbWVudC5pZCAmJiBlLmFuaW0gPT0gYW5pbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5wZXJjZW50ICE9IHBlcmNlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzSW5BbmltU2V0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzSW5BbmltID0gZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmF0dHIoZS50b3RhbE9yaWdpbik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXR1cyA9ICt0bzsgLy8gTmFOXG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYW5pbS5wZXJjZW50cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYW5pbS5wZXJjZW50c1tpXSA9PSBwZXJjZW50IHx8IGFuaW0ucGVyY2VudHNbaV0gPiBzdGF0dXMgKiBhbmltLnRvcCkge1xuICAgICAgICAgICAgICAgIHBlcmNlbnQgPSBhbmltLnBlcmNlbnRzW2ldO1xuICAgICAgICAgICAgICAgIHByZXYgPSBhbmltLnBlcmNlbnRzW2kgLSAxXSB8fCAwO1xuICAgICAgICAgICAgICAgIG1zID0gbXMgLyBhbmltLnRvcCAqIChwZXJjZW50IC0gcHJldik7XG4gICAgICAgICAgICAgICAgbmV4dCA9IGFuaW0ucGVyY2VudHNbaSArIDFdO1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IGFuaW0uYW5pbVtwZXJjZW50XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5hdHRyKGFuaW0uYW5pbVthbmltLnBlcmNlbnRzW2ldXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwYXJhbXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzSW5BbmltKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBhdHRyIGluIHBhcmFtcykgaWYgKHBhcmFtc1toYXNdKGF0dHIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGF2YWlsYWJsZUFuaW1BdHRyc1toYXNdKGF0dHIpIHx8IGVsZW1lbnQucGFwZXIuY3VzdG9tQXR0cmlidXRlc1toYXNdKGF0dHIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb21bYXR0cl0gPSBlbGVtZW50LmF0dHIoYXR0cik7XG4gICAgICAgICAgICAgICAgICAgIChmcm9tW2F0dHJdID09IG51bGwpICYmIChmcm9tW2F0dHJdID0gYXZhaWxhYmxlQXR0cnNbYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICB0b1thdHRyXSA9IHBhcmFtc1thdHRyXTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChhdmFpbGFibGVBbmltQXR0cnNbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgbnU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXSA9ICh0b1thdHRyXSAtIGZyb21bYXR0cl0pIC8gbXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY29sb3VyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbVthdHRyXSA9IFIuZ2V0UkdCKGZyb21bYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b0NvbG91ciA9IFIuZ2V0UkdCKHRvW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByOiAodG9Db2xvdXIuciAtIGZyb21bYXR0cl0ucikgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZzogKHRvQ29sb3VyLmcgLSBmcm9tW2F0dHJdLmcpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGI6ICh0b0NvbG91ci5iIC0gZnJvbVthdHRyXS5iKSAvIG1zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJwYXRoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhdGhlcyA9IHBhdGgyY3VydmUoZnJvbVthdHRyXSwgdG9bYXR0cl0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b1BhdGggPSBwYXRoZXNbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbVthdHRyXSA9IHBhdGhlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBmcm9tW2F0dHJdLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXVtpXSA9IFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDEsIGpqID0gZnJvbVthdHRyXVtpXS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdW2ldW2pdID0gKHRvUGF0aFtpXVtqXSAtIGZyb21bYXR0cl1baV1bal0pIC8gbXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwidHJhbnNmb3JtXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF8gPSBlbGVtZW50Ll8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVxID0gZXF1YWxpc2VUcmFuc2Zvcm0oX1thdHRyXSwgdG9bYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tW2F0dHJdID0gZXEuZnJvbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9bYXR0cl0gPSBlcS50bztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdLnJlYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGZyb21bYXR0cl0ubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXVtpXSA9IFtmcm9tW2F0dHJdW2ldWzBdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGpqID0gZnJvbVthdHRyXVtpXS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXVtpXVtqXSA9ICh0b1thdHRyXVtpXVtqXSAtIGZyb21bYXR0cl1baV1bal0pIC8gbXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbSA9IChlbGVtZW50Lm1hdHJpeCB8fCBuZXcgTWF0cml4KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvMiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfOiB7dHJhbnNmb3JtOiBfLnRyYW5zZm9ybX0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0QkJveDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5nZXRCQm94KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21bYXR0cl0gPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLmZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdFRyYW5zZm9ybSh0bzIsIHRvW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9bYXR0cl0gPSB0bzIuXy50cmFuc2Zvcm07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0gPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG8yLm1hdHJpeC5hIC0gbS5hKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRvMi5tYXRyaXguYiAtIG0uYikgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0bzIubWF0cml4LmMgLSBtLmMpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG8yLm1hdHJpeC5kIC0gbS5kKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRvMi5tYXRyaXguZSAtIG0uZSkgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0bzIubWF0cml4LmYgLSBtLmYpIC8gbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZnJvbVthdHRyXSA9IFtfLnN4LCBfLnN5LCBfLmRlZywgXy5keCwgXy5keV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZhciB0bzIgPSB7Xzp7fSwgZ2V0QkJveDogZnVuY3Rpb24gKCkgeyByZXR1cm4gZWxlbWVudC5nZXRCQm94KCk7IH19O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleHRyYWN0VHJhbnNmb3JtKHRvMiwgdG9bYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaWZmW2F0dHJdID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgKHRvMi5fLnN4IC0gXy5zeCkgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICh0bzIuXy5zeSAtIF8uc3kpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAodG8yLl8uZGVnIC0gXy5kZWcpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAodG8yLl8uZHggLSBfLmR4KSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgKHRvMi5fLmR5IC0gXy5keSkgLyBtc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjc3ZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gU3RyKHBhcmFtc1thdHRyXSlbc3BsaXRdKHNlcGFyYXRvciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20yID0gU3RyKGZyb21bYXR0cl0pW3NwbGl0XShzZXBhcmF0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRyID09IFwiY2xpcC1yZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbVthdHRyXSA9IGZyb20yO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBmcm9tMi5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl1baV0gPSAodmFsdWVzW2ldIC0gZnJvbVthdHRyXVtpXSkgLyBtcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b1thdHRyXSA9IHZhbHVlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW11bY29uY2F0XShwYXJhbXNbYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20yID0gW11bY29uY2F0XShmcm9tW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IGVsZW1lbnQucGFwZXIuY3VzdG9tQXR0cmlidXRlc1thdHRyXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdW2ldID0gKCh2YWx1ZXNbaV0gfHwgMCkgLSAoZnJvbTJbaV0gfHwgMCkpIC8gbXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGVhc2luZyA9IHBhcmFtcy5lYXNpbmcsXG4gICAgICAgICAgICAgICAgZWFzeWVhc3kgPSBSLmVhc2luZ19mb3JtdWxhc1tlYXNpbmddO1xuICAgICAgICAgICAgaWYgKCFlYXN5ZWFzeSkge1xuICAgICAgICAgICAgICAgIGVhc3llYXN5ID0gU3RyKGVhc2luZykubWF0Y2goYmV6aWVycmcpO1xuICAgICAgICAgICAgICAgIGlmIChlYXN5ZWFzeSAmJiBlYXN5ZWFzeS5sZW5ndGggPT0gNSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VydmUgPSBlYXN5ZWFzeTtcbiAgICAgICAgICAgICAgICAgICAgZWFzeWVhc3kgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEN1YmljQmV6aWVyQXRUaW1lKHQsICtjdXJ2ZVsxXSwgK2N1cnZlWzJdLCArY3VydmVbM10sICtjdXJ2ZVs0XSwgbXMpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVhc3llYXN5ID0gcGlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aW1lc3RhbXAgPSBwYXJhbXMuc3RhcnQgfHwgYW5pbS5zdGFydCB8fCArbmV3IERhdGU7XG4gICAgICAgICAgICBlID0ge1xuICAgICAgICAgICAgICAgIGFuaW06IGFuaW0sXG4gICAgICAgICAgICAgICAgcGVyY2VudDogcGVyY2VudCxcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IHRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICBzdGFydDogdGltZXN0YW1wICsgKGFuaW0uZGVsIHx8IDApLFxuICAgICAgICAgICAgICAgIHN0YXR1czogMCxcbiAgICAgICAgICAgICAgICBpbml0c3RhdHVzOiBzdGF0dXMgfHwgMCxcbiAgICAgICAgICAgICAgICBzdG9wOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtczogbXMsXG4gICAgICAgICAgICAgICAgZWFzaW5nOiBlYXN5ZWFzeSxcbiAgICAgICAgICAgICAgICBmcm9tOiBmcm9tLFxuICAgICAgICAgICAgICAgIGRpZmY6IGRpZmYsXG4gICAgICAgICAgICAgICAgdG86IHRvLFxuICAgICAgICAgICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBwYXJhbXMuY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgcHJldjogcHJldixcbiAgICAgICAgICAgICAgICBuZXh0OiBuZXh0LFxuICAgICAgICAgICAgICAgIHJlcGVhdDogdGltZXMgfHwgYW5pbS50aW1lcyxcbiAgICAgICAgICAgICAgICBvcmlnaW46IGVsZW1lbnQuYXR0cigpLFxuICAgICAgICAgICAgICAgIHRvdGFsT3JpZ2luOiB0b3RhbE9yaWdpblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzLnB1c2goZSk7XG4gICAgICAgICAgICBpZiAoc3RhdHVzICYmICFpc0luQW5pbSAmJiAhaXNJbkFuaW1TZXQpIHtcbiAgICAgICAgICAgICAgICBlLnN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGUuc3RhcnQgPSBuZXcgRGF0ZSAtIG1zICogc3RhdHVzO1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb25FbGVtZW50cy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzSW5BbmltU2V0KSB7XG4gICAgICAgICAgICAgICAgZS5zdGFydCA9IG5ldyBEYXRlIC0gZS5tcyAqIHN0YXR1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aCA9PSAxICYmIHJlcXVlc3RBbmltRnJhbWUoYW5pbWF0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlzSW5BbmltLmluaXRzdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgICAgICBpc0luQW5pbS5zdGFydCA9IG5ldyBEYXRlIC0gaXNJbkFuaW0ubXMgKiBzdGF0dXM7XG4gICAgICAgIH1cbiAgICAgICAgZXZlKFwicmFwaGFlbC5hbmltLnN0YXJ0LlwiICsgZWxlbWVudC5pZCwgZWxlbWVudCwgYW5pbSk7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmFuaW1hdGlvblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhbiBhbmltYXRpb24gb2JqZWN0IHRoYXQgY2FuIGJlIHBhc3NlZCB0byB0aGUgQEVsZW1lbnQuYW5pbWF0ZSBvciBARWxlbWVudC5hbmltYXRlV2l0aCBtZXRob2RzLlxuICAgICAqIFNlZSBhbHNvIEBBbmltYXRpb24uZGVsYXkgYW5kIEBBbmltYXRpb24ucmVwZWF0IG1ldGhvZHMuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHBhcmFtcyAob2JqZWN0KSBmaW5hbCBhdHRyaWJ1dGVzIGZvciB0aGUgZWxlbWVudCwgc2VlIGFsc28gQEVsZW1lbnQuYXR0clxuICAgICAtIG1zIChudW1iZXIpIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZm9yIGFuaW1hdGlvbiB0byBydW5cbiAgICAgLSBlYXNpbmcgKHN0cmluZykgI29wdGlvbmFsIGVhc2luZyB0eXBlLiBBY2NlcHQgb25lIG9mIEBSYXBoYWVsLmVhc2luZ19mb3JtdWxhcyBvciBDU1MgZm9ybWF0OiBgY3ViaWMmI3gyMDEwO2JlemllcihYWCwmIzE2MDtYWCwmIzE2MDtYWCwmIzE2MDtYWClgXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGF0IHRoZSBlbmQgb2YgYW5pbWF0aW9uLlxuICAgICAqKlxuICAgICA9IChvYmplY3QpIEBBbmltYXRpb25cbiAgICBcXCovXG4gICAgUi5hbmltYXRpb24gPSBmdW5jdGlvbiAocGFyYW1zLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAocGFyYW1zIGluc3RhbmNlb2YgQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICB9XG4gICAgICAgIGlmIChSLmlzKGVhc2luZywgXCJmdW5jdGlvblwiKSB8fCAhZWFzaW5nKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGVhc2luZyB8fCBudWxsO1xuICAgICAgICAgICAgZWFzaW5nID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBwYXJhbXMgPSBPYmplY3QocGFyYW1zKTtcbiAgICAgICAgbXMgPSArbXMgfHwgMDtcbiAgICAgICAgdmFyIHAgPSB7fSxcbiAgICAgICAgICAgIGpzb24sXG4gICAgICAgICAgICBhdHRyO1xuICAgICAgICBmb3IgKGF0dHIgaW4gcGFyYW1zKSBpZiAocGFyYW1zW2hhc10oYXR0cikgJiYgdG9GbG9hdChhdHRyKSAhPSBhdHRyICYmIHRvRmxvYXQoYXR0cikgKyBcIiVcIiAhPSBhdHRyKSB7XG4gICAgICAgICAgICBqc29uID0gdHJ1ZTtcbiAgICAgICAgICAgIHBbYXR0cl0gPSBwYXJhbXNbYXR0cl07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFqc29uKSB7XG4gICAgICAgICAgICAvLyBpZiBwZXJjZW50LWxpa2Ugc3ludGF4IGlzIHVzZWQgYW5kIGVuZC1vZi1hbGwgYW5pbWF0aW9uIGNhbGxiYWNrIHVzZWRcbiAgICAgICAgICAgIGlmKGNhbGxiYWNrKXtcbiAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBsYXN0IG9uZVxuICAgICAgICAgICAgICAgIHZhciBsYXN0S2V5ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGkgaW4gcGFyYW1zKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnQgPSB0b0ludChpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocGFyYW1zW2hhc10oaSkgJiYgcGVyY2VudCA+IGxhc3RLZXkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEtleSA9IHBlcmNlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGFzdEtleSArPSAnJSc7XG4gICAgICAgICAgICAgICAgLy8gaWYgYWxyZWFkeSBkZWZpbmVkIGNhbGxiYWNrIGluIHRoZSBsYXN0IGtleWZyYW1lLCBza2lwXG4gICAgICAgICAgICAgICAgIXBhcmFtc1tsYXN0S2V5XS5jYWxsYmFjayAmJiAocGFyYW1zW2xhc3RLZXldLmNhbGxiYWNrID0gY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgQW5pbWF0aW9uKHBhcmFtcywgbXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWFzaW5nICYmIChwLmVhc2luZyA9IGVhc2luZyk7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiAocC5jYWxsYmFjayA9IGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQW5pbWF0aW9uKHsxMDA6IHB9LCBtcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFuaW1hdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYW5kIHN0YXJ0cyBhbmltYXRpb24gZm9yIGdpdmVuIGVsZW1lbnQuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHBhcmFtcyAob2JqZWN0KSBmaW5hbCBhdHRyaWJ1dGVzIGZvciB0aGUgZWxlbWVudCwgc2VlIGFsc28gQEVsZW1lbnQuYXR0clxuICAgICAtIG1zIChudW1iZXIpIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZm9yIGFuaW1hdGlvbiB0byBydW5cbiAgICAgLSBlYXNpbmcgKHN0cmluZykgI29wdGlvbmFsIGVhc2luZyB0eXBlLiBBY2NlcHQgb25lIG9mIEBSYXBoYWVsLmVhc2luZ19mb3JtdWxhcyBvciBDU1MgZm9ybWF0OiBgY3ViaWMmI3gyMDEwO2JlemllcihYWCwmIzE2MDtYWCwmIzE2MDtYWCwmIzE2MDtYWClgXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGF0IHRoZSBlbmQgb2YgYW5pbWF0aW9uLlxuICAgICAqIG9yXG4gICAgIC0gYW5pbWF0aW9uIChvYmplY3QpIGFuaW1hdGlvbiBvYmplY3QsIHNlZSBAUmFwaGFlbC5hbmltYXRpb25cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uYW5pbWF0ZSA9IGZ1bmN0aW9uIChwYXJhbXMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlZCkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2suY2FsbChlbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIHZhciBhbmltID0gcGFyYW1zIGluc3RhbmNlb2YgQW5pbWF0aW9uID8gcGFyYW1zIDogUi5hbmltYXRpb24ocGFyYW1zLCBtcywgZWFzaW5nLCBjYWxsYmFjayk7XG4gICAgICAgIHJ1bkFuaW1hdGlvbihhbmltLCBlbGVtZW50LCBhbmltLnBlcmNlbnRzWzBdLCBudWxsLCBlbGVtZW50LmF0dHIoKSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc2V0VGltZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2V0cyB0aGUgc3RhdHVzIG9mIGFuaW1hdGlvbiBvZiB0aGUgZWxlbWVudCBpbiBtaWxsaXNlY29uZHMuIFNpbWlsYXIgdG8gQEVsZW1lbnQuc3RhdHVzIG1ldGhvZC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gYW5pbSAob2JqZWN0KSBhbmltYXRpb24gb2JqZWN0XG4gICAgIC0gdmFsdWUgKG51bWJlcikgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFuaW1hdGlvblxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnQgaWYgYHZhbHVlYCBpcyBzcGVjaWZpZWRcbiAgICAgKiBOb3RlLCB0aGF0IGR1cmluZyBhbmltYXRpb24gZm9sbG93aW5nIGV2ZW50cyBhcmUgdHJpZ2dlcmVkOlxuICAgICAqXG4gICAgICogT24gZWFjaCBhbmltYXRpb24gZnJhbWUgZXZlbnQgYGFuaW0uZnJhbWUuPGlkPmAsIG9uIHN0YXJ0IGBhbmltLnN0YXJ0LjxpZD5gIGFuZCBvbiBlbmQgYGFuaW0uZmluaXNoLjxpZD5gLlxuICAgIFxcKi9cbiAgICBlbHByb3RvLnNldFRpbWUgPSBmdW5jdGlvbiAoYW5pbSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGFuaW0gJiYgdmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXMoYW5pbSwgbW1pbih2YWx1ZSwgYW5pbS5tcykgLyBhbmltLm1zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnN0YXR1c1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBzdGF0dXMgb2YgYW5pbWF0aW9uIG9mIHRoZSBlbGVtZW50LlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBhbmltIChvYmplY3QpICNvcHRpb25hbCBhbmltYXRpb24gb2JqZWN0XG4gICAgIC0gdmFsdWUgKG51bWJlcikgI29wdGlvbmFsIDAg4oCTIDEuIElmIHNwZWNpZmllZCwgbWV0aG9kIHdvcmtzIGxpa2UgYSBzZXR0ZXIgYW5kIHNldHMgdGhlIHN0YXR1cyBvZiBhIGdpdmVuIGFuaW1hdGlvbiB0byB0aGUgdmFsdWUuIFRoaXMgd2lsbCBjYXVzZSBhbmltYXRpb24gdG8ganVtcCB0byB0aGUgZ2l2ZW4gcG9zaXRpb24uXG4gICAgICoqXG4gICAgID0gKG51bWJlcikgc3RhdHVzXG4gICAgICogb3JcbiAgICAgPSAoYXJyYXkpIHN0YXR1cyBpZiBgYW5pbWAgaXMgbm90IHNwZWNpZmllZC4gQXJyYXkgb2Ygb2JqZWN0cyBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICBhbmltOiAob2JqZWN0KSBhbmltYXRpb24gb2JqZWN0XG4gICAgIG8gICAgIHN0YXR1czogKG51bWJlcikgc3RhdHVzXG4gICAgIG8gfVxuICAgICAqIG9yXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudCBpZiBgdmFsdWVgIGlzIHNwZWNpZmllZFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnN0YXR1cyA9IGZ1bmN0aW9uIChhbmltLCB2YWx1ZSkge1xuICAgICAgICB2YXIgb3V0ID0gW10sXG4gICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIGU7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBydW5BbmltYXRpb24oYW5pbSwgdGhpcywgLTEsIG1taW4odmFsdWUsIDEpKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGVuID0gYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGUgPSBhbmltYXRpb25FbGVtZW50c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoZS5lbC5pZCA9PSB0aGlzLmlkICYmICghYW5pbSB8fCBlLmFuaW0gPT0gYW5pbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFuaW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlLnN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltOiBlLmFuaW0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGUuc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhbmltKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5wYXVzZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU3RvcHMgYW5pbWF0aW9uIG9mIHRoZSBlbGVtZW50IHdpdGggYWJpbGl0eSB0byByZXN1bWUgaXQgbGF0ZXIgb24uXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGFuaW0gKG9iamVjdCkgI29wdGlvbmFsIGFuaW1hdGlvbiBvYmplY3RcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucGF1c2UgPSBmdW5jdGlvbiAoYW5pbSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBpZiAoYW5pbWF0aW9uRWxlbWVudHNbaV0uZWwuaWQgPT0gdGhpcy5pZCAmJiAoIWFuaW0gfHwgYW5pbWF0aW9uRWxlbWVudHNbaV0uYW5pbSA9PSBhbmltKSkge1xuICAgICAgICAgICAgaWYgKGV2ZShcInJhcGhhZWwuYW5pbS5wYXVzZS5cIiArIHRoaXMuaWQsIHRoaXMsIGFuaW1hdGlvbkVsZW1lbnRzW2ldLmFuaW0pICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzW2ldLnBhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5yZXN1bWVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlc3VtZXMgYW5pbWF0aW9uIGlmIGl0IHdhcyBwYXVzZWQgd2l0aCBARWxlbWVudC5wYXVzZSBtZXRob2QuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGFuaW0gKG9iamVjdCkgI29wdGlvbmFsIGFuaW1hdGlvbiBvYmplY3RcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucmVzdW1lID0gZnVuY3Rpb24gKGFuaW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7IGkrKykgaWYgKGFuaW1hdGlvbkVsZW1lbnRzW2ldLmVsLmlkID09IHRoaXMuaWQgJiYgKCFhbmltIHx8IGFuaW1hdGlvbkVsZW1lbnRzW2ldLmFuaW0gPT0gYW5pbSkpIHtcbiAgICAgICAgICAgIHZhciBlID0gYW5pbWF0aW9uRWxlbWVudHNbaV07XG4gICAgICAgICAgICBpZiAoZXZlKFwicmFwaGFlbC5hbmltLnJlc3VtZS5cIiArIHRoaXMuaWQsIHRoaXMsIGUuYW5pbSkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGUucGF1c2VkO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzKGUuYW5pbSwgZS5zdGF0dXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc3RvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU3RvcHMgYW5pbWF0aW9uIG9mIHRoZSBlbGVtZW50LlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBhbmltIChvYmplY3QpICNvcHRpb25hbCBhbmltYXRpb24gb2JqZWN0XG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnN0b3AgPSBmdW5jdGlvbiAoYW5pbSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBpZiAoYW5pbWF0aW9uRWxlbWVudHNbaV0uZWwuaWQgPT0gdGhpcy5pZCAmJiAoIWFuaW0gfHwgYW5pbWF0aW9uRWxlbWVudHNbaV0uYW5pbSA9PSBhbmltKSkge1xuICAgICAgICAgICAgaWYgKGV2ZShcInJhcGhhZWwuYW5pbS5zdG9wLlwiICsgdGhpcy5pZCwgdGhpcywgYW5pbWF0aW9uRWxlbWVudHNbaV0uYW5pbSkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHMuc3BsaWNlKGktLSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBzdG9wQW5pbWF0aW9uKHBhcGVyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoOyBpKyspIGlmIChhbmltYXRpb25FbGVtZW50c1tpXS5lbC5wYXBlciA9PSBwYXBlcikge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHMuc3BsaWNlKGktLSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZXZlLm9uKFwicmFwaGFlbC5yZW1vdmVcIiwgc3RvcEFuaW1hdGlvbik7XG4gICAgZXZlLm9uKFwicmFwaGFlbC5jbGVhclwiLCBzdG9wQW5pbWF0aW9uKTtcbiAgICBlbHByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJSYXBoYVxceGVibFxcdTIwMTlzIG9iamVjdFwiO1xuICAgIH07XG5cbiAgICAvLyBTZXRcbiAgICB2YXIgU2V0ID0gZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnR5cGUgPSBcInNldFwiO1xuICAgICAgICBpZiAoaXRlbXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGl0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXNbaV0gJiYgKGl0ZW1zW2ldLmNvbnN0cnVjdG9yID09IGVscHJvdG8uY29uc3RydWN0b3IgfHwgaXRlbXNbaV0uY29uc3RydWN0b3IgPT0gU2V0KSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzW3RoaXMuaXRlbXMubGVuZ3RoXSA9IHRoaXMuaXRlbXNbdGhpcy5pdGVtcy5sZW5ndGhdID0gaXRlbXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVuZ3RoKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZXRwcm90byA9IFNldC5wcm90b3R5cGU7XG4gICAgLypcXFxuICAgICAqIFNldC5wdXNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGVhY2ggYXJndW1lbnQgdG8gdGhlIGN1cnJlbnQgc2V0LlxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8ucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICBsZW47XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgKGl0ZW0uY29uc3RydWN0b3IgPT0gZWxwcm90by5jb25zdHJ1Y3RvciB8fCBpdGVtLmNvbnN0cnVjdG9yID09IFNldCkpIHtcbiAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzW2xlbl0gPSB0aGlzLml0ZW1zW2xlbl0gPSBpdGVtO1xuICAgICAgICAgICAgICAgIHRoaXMubGVuZ3RoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LnBvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBsYXN0IGVsZW1lbnQgYW5kIHJldHVybnMgaXQuXG4gICAgID0gKG9iamVjdCkgZWxlbWVudFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubGVuZ3RoICYmIGRlbGV0ZSB0aGlzW3RoaXMubGVuZ3RoLS1dO1xuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5wb3AoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuZm9yRWFjaFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRXhlY3V0ZXMgZ2l2ZW4gZnVuY3Rpb24gZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgc2V0LlxuICAgICAqXG4gICAgICogSWYgZnVuY3Rpb24gcmV0dXJucyBgZmFsc2VgIGl0IHdpbGwgc3RvcCBsb29wIHJ1bm5pbmcuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgZnVuY3Rpb24gdG8gcnVuXG4gICAgIC0gdGhpc0FyZyAob2JqZWN0KSBjb250ZXh0IG9iamVjdCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgID0gKG9iamVjdCkgU2V0IG9iamVjdFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5pdGVtc1tpXSwgaSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBmb3IgKHZhciBtZXRob2QgaW4gZWxwcm90bykgaWYgKGVscHJvdG9baGFzXShtZXRob2QpKSB7XG4gICAgICAgIHNldHByb3RvW21ldGhvZF0gPSAoZnVuY3Rpb24gKG1ldGhvZG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICBlbFttZXRob2RuYW1lXVthcHBseV0oZWwsIGFyZyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShtZXRob2QpO1xuICAgIH1cbiAgICBzZXRwcm90by5hdHRyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGlmIChuYW1lICYmIFIuaXMobmFtZSwgYXJyYXkpICYmIFIuaXMobmFtZVswXSwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBqaiA9IG5hbWUubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXNbal0uYXR0cihuYW1lW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXNbaV0uYXR0cihuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmNsZWFyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGFsbCBlbGVtZW50cyBmcm9tIHRoZSBzZXRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wb3AoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5zcGxpY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZ2l2ZW4gZWxlbWVudCBmcm9tIHRoZSBzZXRcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gaW5kZXggKG51bWJlcikgcG9zaXRpb24gb2YgdGhlIGRlbGV0aW9uXG4gICAgIC0gY291bnQgKG51bWJlcikgbnVtYmVyIG9mIGVsZW1lbnQgdG8gcmVtb3ZlXG4gICAgIC0gaW5zZXJ0aW9u4oCmIChvYmplY3QpICNvcHRpb25hbCBlbGVtZW50cyB0byBpbnNlcnRcbiAgICAgPSAob2JqZWN0KSBzZXQgZWxlbWVudHMgdGhhdCB3ZXJlIGRlbGV0ZWRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uc3BsaWNlID0gZnVuY3Rpb24gKGluZGV4LCBjb3VudCwgaW5zZXJ0aW9uKSB7XG4gICAgICAgIGluZGV4ID0gaW5kZXggPCAwID8gbW1heCh0aGlzLmxlbmd0aCArIGluZGV4LCAwKSA6IGluZGV4O1xuICAgICAgICBjb3VudCA9IG1tYXgoMCwgbW1pbih0aGlzLmxlbmd0aCAtIGluZGV4LCBjb3VudCkpO1xuICAgICAgICB2YXIgdGFpbCA9IFtdLFxuICAgICAgICAgICAgdG9kZWwgPSBbXSxcbiAgICAgICAgICAgIGFyZ3MgPSBbXSxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDI7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB0b2RlbC5wdXNoKHRoaXNbaW5kZXggKyBpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7IGkgPCB0aGlzLmxlbmd0aCAtIGluZGV4OyBpKyspIHtcbiAgICAgICAgICAgIHRhaWwucHVzaCh0aGlzW2luZGV4ICsgaV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhcmdsZW4gPSBhcmdzLmxlbmd0aDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFyZ2xlbiArIHRhaWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXNbaW5kZXggKyBpXSA9IHRoaXNbaW5kZXggKyBpXSA9IGkgPCBhcmdsZW4gPyBhcmdzW2ldIDogdGFpbFtpIC0gYXJnbGVuXTtcbiAgICAgICAgfVxuICAgICAgICBpID0gdGhpcy5pdGVtcy5sZW5ndGggPSB0aGlzLmxlbmd0aCAtPSBjb3VudCAtIGFyZ2xlbjtcbiAgICAgICAgd2hpbGUgKHRoaXNbaV0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2krK107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBTZXQodG9kZWwpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5leGNsdWRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGdpdmVuIGVsZW1lbnQgZnJvbSB0aGUgc2V0XG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGVsZW1lbnQgKG9iamVjdCkgZWxlbWVudCB0byByZW1vdmVcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIG9iamVjdCB3YXMgZm91bmQgJiByZW1vdmVkIGZyb20gdGhlIHNldFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5leGNsdWRlID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKHRoaXNbaV0gPT0gZWwpIHtcbiAgICAgICAgICAgIHRoaXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHNldHByb3RvLmFuaW1hdGUgPSBmdW5jdGlvbiAocGFyYW1zLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICAoUi5pcyhlYXNpbmcsIFwiZnVuY3Rpb25cIikgfHwgIWVhc2luZykgJiYgKGNhbGxiYWNrID0gZWFzaW5nIHx8IG51bGwpO1xuICAgICAgICB2YXIgbGVuID0gdGhpcy5pdGVtcy5sZW5ndGgsXG4gICAgICAgICAgICBpID0gbGVuLFxuICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgIHNldCA9IHRoaXMsXG4gICAgICAgICAgICBjb2xsZWN0b3I7XG4gICAgICAgIGlmICghbGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayAmJiAoY29sbGVjdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgIS0tbGVuICYmIGNhbGxiYWNrLmNhbGwoc2V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVhc2luZyA9IFIuaXMoZWFzaW5nLCBzdHJpbmcpID8gZWFzaW5nIDogY29sbGVjdG9yO1xuICAgICAgICB2YXIgYW5pbSA9IFIuYW5pbWF0aW9uKHBhcmFtcywgbXMsIGVhc2luZywgY29sbGVjdG9yKTtcbiAgICAgICAgaXRlbSA9IHRoaXMuaXRlbXNbLS1pXS5hbmltYXRlKGFuaW0pO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2ldICYmICF0aGlzLml0ZW1zW2ldLnJlbW92ZWQgJiYgdGhpcy5pdGVtc1tpXS5hbmltYXRlV2l0aChpdGVtLCBhbmltLCBhbmltKTtcbiAgICAgICAgICAgICh0aGlzLml0ZW1zW2ldICYmICF0aGlzLml0ZW1zW2ldLnJlbW92ZWQpIHx8IGxlbi0tO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgc2V0cHJvdG8uaW5zZXJ0QWZ0ZXIgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtc1tpXS5pbnNlcnRBZnRlcihlbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBzZXRwcm90by5nZXRCQm94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IFtdLFxuICAgICAgICAgICAgeSA9IFtdLFxuICAgICAgICAgICAgeDIgPSBbXSxcbiAgICAgICAgICAgIHkyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaS0tOykgaWYgKCF0aGlzLml0ZW1zW2ldLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHZhciBib3ggPSB0aGlzLml0ZW1zW2ldLmdldEJCb3goKTtcbiAgICAgICAgICAgIHgucHVzaChib3gueCk7XG4gICAgICAgICAgICB5LnB1c2goYm94LnkpO1xuICAgICAgICAgICAgeDIucHVzaChib3gueCArIGJveC53aWR0aCk7XG4gICAgICAgICAgICB5Mi5wdXNoKGJveC55ICsgYm94LmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgeCA9IG1taW5bYXBwbHldKDAsIHgpO1xuICAgICAgICB5ID0gbW1pblthcHBseV0oMCwgeSk7XG4gICAgICAgIHgyID0gbW1heFthcHBseV0oMCwgeDIpO1xuICAgICAgICB5MiA9IG1tYXhbYXBwbHldKDAsIHkyKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgeDI6IHgyLFxuICAgICAgICAgICAgeTI6IHkyLFxuICAgICAgICAgICAgd2lkdGg6IHgyIC0geCxcbiAgICAgICAgICAgIGhlaWdodDogeTIgLSB5XG4gICAgICAgIH07XG4gICAgfTtcbiAgICBzZXRwcm90by5jbG9uZSA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHMgPSB0aGlzLnBhcGVyLnNldCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHMucHVzaCh0aGlzLml0ZW1zW2ldLmNsb25lKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzO1xuICAgIH07XG4gICAgc2V0cHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIlJhcGhhXFx4ZWJsXFx1MjAxOHMgc2V0XCI7XG4gICAgfTtcblxuICAgIHNldHByb3RvLmdsb3cgPSBmdW5jdGlvbihnbG93Q29uZmlnKSB7XG4gICAgICAgIHZhciByZXQgPSB0aGlzLnBhcGVyLnNldCgpO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24oc2hhcGUsIGluZGV4KXtcbiAgICAgICAgICAgIHZhciBnID0gc2hhcGUuZ2xvdyhnbG93Q29uZmlnKTtcbiAgICAgICAgICAgIGlmKGcgIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZy5mb3JFYWNoKGZ1bmN0aW9uKHNoYXBlMiwgaW5kZXgyKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goc2hhcGUyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuXG4gICAgLypcXFxuICAgICAqIFNldC5pc1BvaW50SW5zaWRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXRlcm1pbmUgaWYgZ2l2ZW4gcG9pbnQgaXMgaW5zaWRlIHRoaXMgc2V04oCZcyBlbGVtZW50c1xuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIHBvaW50IGlzIGluc2lkZSBhbnkgb2YgdGhlIHNldCdzIGVsZW1lbnRzXG4gICAgIFxcKi9cbiAgICBzZXRwcm90by5pc1BvaW50SW5zaWRlID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgdmFyIGlzUG9pbnRJbnNpZGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgaWYgKGVsLmlzUG9pbnRJbnNpZGUoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICBpc1BvaW50SW5zaWRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIHN0b3AgbG9vcFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGlzUG9pbnRJbnNpZGU7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnJlZ2lzdGVyRm9udFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBnaXZlbiBmb250IHRvIHRoZSByZWdpc3RlcmVkIHNldCBvZiBmb250cyBmb3IgUmFwaGHDq2wuIFNob3VsZCBiZSB1c2VkIGFzIGFuIGludGVybmFsIGNhbGwgZnJvbSB3aXRoaW4gQ3Vmw7Nu4oCZcyBmb250IGZpbGUuXG4gICAgICogUmV0dXJucyBvcmlnaW5hbCBwYXJhbWV0ZXIsIHNvIGl0IGNvdWxkIGJlIHVzZWQgd2l0aCBjaGFpbmluZy5cbiAgICAgIyA8YSBocmVmPVwiaHR0cDovL3dpa2kuZ2l0aHViLmNvbS9zb3JjY3UvY3Vmb24vYWJvdXRcIj5Nb3JlIGFib3V0IEN1ZsOzbiBhbmQgaG93IHRvIGNvbnZlcnQgeW91ciBmb250IGZvcm0gVFRGLCBPVEYsIGV0YyB0byBKYXZhU2NyaXB0IGZpbGUuPC9hPlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBmb250IChvYmplY3QpIHRoZSBmb250IHRvIHJlZ2lzdGVyXG4gICAgID0gKG9iamVjdCkgdGhlIGZvbnQgeW91IHBhc3NlZCBpblxuICAgICA+IFVzYWdlXG4gICAgIHwgQ3Vmb24ucmVnaXN0ZXJGb250KFJhcGhhZWwucmVnaXN0ZXJGb250KHvigKZ9KSk7XG4gICAgXFwqL1xuICAgIFIucmVnaXN0ZXJGb250ID0gZnVuY3Rpb24gKGZvbnQpIHtcbiAgICAgICAgaWYgKCFmb250LmZhY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmb250O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9udHMgPSB0aGlzLmZvbnRzIHx8IHt9O1xuICAgICAgICB2YXIgZm9udGNvcHkgPSB7XG4gICAgICAgICAgICAgICAgdzogZm9udC53LFxuICAgICAgICAgICAgICAgIGZhY2U6IHt9LFxuICAgICAgICAgICAgICAgIGdseXBoczoge31cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYW1pbHkgPSBmb250LmZhY2VbXCJmb250LWZhbWlseVwiXTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBmb250LmZhY2UpIGlmIChmb250LmZhY2VbaGFzXShwcm9wKSkge1xuICAgICAgICAgICAgZm9udGNvcHkuZmFjZVtwcm9wXSA9IGZvbnQuZmFjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb250c1tmYW1pbHldKSB7XG4gICAgICAgICAgICB0aGlzLmZvbnRzW2ZhbWlseV0ucHVzaChmb250Y29weSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZvbnRzW2ZhbWlseV0gPSBbZm9udGNvcHldO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZm9udC5zdmcpIHtcbiAgICAgICAgICAgIGZvbnRjb3B5LmZhY2VbXCJ1bml0cy1wZXItZW1cIl0gPSB0b0ludChmb250LmZhY2VbXCJ1bml0cy1wZXItZW1cIl0sIDEwKTtcbiAgICAgICAgICAgIGZvciAodmFyIGdseXBoIGluIGZvbnQuZ2x5cGhzKSBpZiAoZm9udC5nbHlwaHNbaGFzXShnbHlwaCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IGZvbnQuZ2x5cGhzW2dseXBoXTtcbiAgICAgICAgICAgICAgICBmb250Y29weS5nbHlwaHNbZ2x5cGhdID0ge1xuICAgICAgICAgICAgICAgICAgICB3OiBwYXRoLncsXG4gICAgICAgICAgICAgICAgICAgIGs6IHt9LFxuICAgICAgICAgICAgICAgICAgICBkOiBwYXRoLmQgJiYgXCJNXCIgKyBwYXRoLmQucmVwbGFjZSgvW21sY3h0cnZdL2csIGZ1bmN0aW9uIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtsOiBcIkxcIiwgYzogXCJDXCIsIHg6IFwielwiLCB0OiBcIm1cIiwgcjogXCJsXCIsIHY6IFwiY1wifVtjb21tYW5kXSB8fCBcIk1cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICsgXCJ6XCJcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBwYXRoLmspIGlmIChwYXRoW2hhc10oaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRjb3B5LmdseXBoc1tnbHlwaF0ua1trXSA9IHBhdGgua1trXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9udDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5nZXRGb250XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBGaW5kcyBmb250IG9iamVjdCBpbiB0aGUgcmVnaXN0ZXJlZCBmb250cyBieSBnaXZlbiBwYXJhbWV0ZXJzLiBZb3UgY291bGQgc3BlY2lmeSBvbmx5IG9uZSB3b3JkIGZyb20gdGhlIGZvbnQgbmFtZSwgbGlrZSDigJxNeXJpYWTigJ0gZm9yIOKAnE15cmlhZCBQcm/igJ0uXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGZhbWlseSAoc3RyaW5nKSBmb250IGZhbWlseSBuYW1lIG9yIGFueSB3b3JkIGZyb20gaXRcbiAgICAgLSB3ZWlnaHQgKHN0cmluZykgI29wdGlvbmFsIGZvbnQgd2VpZ2h0XG4gICAgIC0gc3R5bGUgKHN0cmluZykgI29wdGlvbmFsIGZvbnQgc3R5bGVcbiAgICAgLSBzdHJldGNoIChzdHJpbmcpICNvcHRpb25hbCBmb250IHN0cmV0Y2hcbiAgICAgPSAob2JqZWN0KSB0aGUgZm9udCBvYmplY3RcbiAgICAgPiBVc2FnZVxuICAgICB8IHBhcGVyLnByaW50KDEwMCwgMTAwLCBcIlRlc3Qgc3RyaW5nXCIsIHBhcGVyLmdldEZvbnQoXCJUaW1lc1wiLCA4MDApLCAzMCk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZ2V0Rm9udCA9IGZ1bmN0aW9uIChmYW1pbHksIHdlaWdodCwgc3R5bGUsIHN0cmV0Y2gpIHtcbiAgICAgICAgc3RyZXRjaCA9IHN0cmV0Y2ggfHwgXCJub3JtYWxcIjtcbiAgICAgICAgc3R5bGUgPSBzdHlsZSB8fCBcIm5vcm1hbFwiO1xuICAgICAgICB3ZWlnaHQgPSArd2VpZ2h0IHx8IHtub3JtYWw6IDQwMCwgYm9sZDogNzAwLCBsaWdodGVyOiAzMDAsIGJvbGRlcjogODAwfVt3ZWlnaHRdIHx8IDQwMDtcbiAgICAgICAgaWYgKCFSLmZvbnRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZvbnQgPSBSLmZvbnRzW2ZhbWlseV07XG4gICAgICAgIGlmICghZm9udCkge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBuZXcgUmVnRXhwKFwiKF58XFxcXHMpXCIgKyBmYW1pbHkucmVwbGFjZSgvW15cXHdcXGRcXHMrIX4uOl8tXS9nLCBFKSArIFwiKFxcXFxzfCQpXCIsIFwiaVwiKTtcbiAgICAgICAgICAgIGZvciAodmFyIGZvbnROYW1lIGluIFIuZm9udHMpIGlmIChSLmZvbnRzW2hhc10oZm9udE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUudGVzdChmb250TmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9udCA9IFIuZm9udHNbZm9udE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRoZWZvbnQ7XG4gICAgICAgIGlmIChmb250KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBmb250Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGVmb250ID0gZm9udFtpXTtcbiAgICAgICAgICAgICAgICBpZiAodGhlZm9udC5mYWNlW1wiZm9udC13ZWlnaHRcIl0gPT0gd2VpZ2h0ICYmICh0aGVmb250LmZhY2VbXCJmb250LXN0eWxlXCJdID09IHN0eWxlIHx8ICF0aGVmb250LmZhY2VbXCJmb250LXN0eWxlXCJdKSAmJiB0aGVmb250LmZhY2VbXCJmb250LXN0cmV0Y2hcIl0gPT0gc3RyZXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoZWZvbnQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucHJpbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgcGF0aCB0aGF0IHJlcHJlc2VudCBnaXZlbiB0ZXh0IHdyaXR0ZW4gdXNpbmcgZ2l2ZW4gZm9udCBhdCBnaXZlbiBwb3NpdGlvbiB3aXRoIGdpdmVuIHNpemUuXG4gICAgICogUmVzdWx0IG9mIHRoZSBtZXRob2QgaXMgcGF0aCBlbGVtZW50IHRoYXQgY29udGFpbnMgd2hvbGUgdGV4dCBhcyBhIHNlcGFyYXRlIHBhdGguXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBwb3NpdGlvbiBvZiB0aGUgdGV4dFxuICAgICAtIHkgKG51bWJlcikgeSBwb3NpdGlvbiBvZiB0aGUgdGV4dFxuICAgICAtIHN0cmluZyAoc3RyaW5nKSB0ZXh0IHRvIHByaW50XG4gICAgIC0gZm9udCAob2JqZWN0KSBmb250IG9iamVjdCwgc2VlIEBQYXBlci5nZXRGb250XG4gICAgIC0gc2l6ZSAobnVtYmVyKSAjb3B0aW9uYWwgc2l6ZSBvZiB0aGUgZm9udCwgZGVmYXVsdCBpcyBgMTZgXG4gICAgIC0gb3JpZ2luIChzdHJpbmcpICNvcHRpb25hbCBjb3VsZCBiZSBgXCJiYXNlbGluZVwiYCBvciBgXCJtaWRkbGVcImAsIGRlZmF1bHQgaXMgYFwibWlkZGxlXCJgXG4gICAgIC0gbGV0dGVyX3NwYWNpbmcgKG51bWJlcikgI29wdGlvbmFsIG51bWJlciBpbiByYW5nZSBgLTEuLjFgLCBkZWZhdWx0IGlzIGAwYFxuICAgICAtIGxpbmVfc3BhY2luZyAobnVtYmVyKSAjb3B0aW9uYWwgbnVtYmVyIGluIHJhbmdlIGAxLi4zYCwgZGVmYXVsdCBpcyBgMWBcbiAgICAgPSAob2JqZWN0KSByZXN1bHRpbmcgcGF0aCBlbGVtZW50LCB3aGljaCBjb25zaXN0IG9mIGFsbCBsZXR0ZXJzXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgdHh0ID0gci5wcmludCgxMCwgNTAsIFwicHJpbnRcIiwgci5nZXRGb250KFwiTXVzZW9cIiksIDMwKS5hdHRyKHtmaWxsOiBcIiNmZmZcIn0pO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnByaW50ID0gZnVuY3Rpb24gKHgsIHksIHN0cmluZywgZm9udCwgc2l6ZSwgb3JpZ2luLCBsZXR0ZXJfc3BhY2luZywgbGluZV9zcGFjaW5nKSB7XG4gICAgICAgIG9yaWdpbiA9IG9yaWdpbiB8fCBcIm1pZGRsZVwiOyAvLyBiYXNlbGluZXxtaWRkbGVcbiAgICAgICAgbGV0dGVyX3NwYWNpbmcgPSBtbWF4KG1taW4obGV0dGVyX3NwYWNpbmcgfHwgMCwgMSksIC0xKTtcbiAgICAgICAgbGluZV9zcGFjaW5nID0gbW1heChtbWluKGxpbmVfc3BhY2luZyB8fCAxLCAzKSwgMSk7XG4gICAgICAgIHZhciBsZXR0ZXJzID0gU3RyKHN0cmluZylbc3BsaXRdKEUpLFxuICAgICAgICAgICAgc2hpZnQgPSAwLFxuICAgICAgICAgICAgbm90Zmlyc3QgPSAwLFxuICAgICAgICAgICAgcGF0aCA9IEUsXG4gICAgICAgICAgICBzY2FsZTtcbiAgICAgICAgUi5pcyhmb250LCBcInN0cmluZ1wiKSAmJiAoZm9udCA9IHRoaXMuZ2V0Rm9udChmb250KSk7XG4gICAgICAgIGlmIChmb250KSB7XG4gICAgICAgICAgICBzY2FsZSA9IChzaXplIHx8IDE2KSAvIGZvbnQuZmFjZVtcInVuaXRzLXBlci1lbVwiXTtcbiAgICAgICAgICAgIHZhciBiYiA9IGZvbnQuZmFjZS5iYm94W3NwbGl0XShzZXBhcmF0b3IpLFxuICAgICAgICAgICAgICAgIHRvcCA9ICtiYlswXSxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0ID0gYmJbM10gLSBiYlsxXSxcbiAgICAgICAgICAgICAgICBzaGlmdHkgPSAwLFxuICAgICAgICAgICAgICAgIGhlaWdodCA9ICtiYlsxXSArIChvcmlnaW4gPT0gXCJiYXNlbGluZVwiID8gbGluZUhlaWdodCArICgrZm9udC5mYWNlLmRlc2NlbnQpIDogbGluZUhlaWdodCAvIDIpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbGV0dGVycy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxldHRlcnNbaV0gPT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGN1cnIgPSAwO1xuICAgICAgICAgICAgICAgICAgICBub3RmaXJzdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0eSArPSBsaW5lSGVpZ2h0ICogbGluZV9zcGFjaW5nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2ID0gbm90Zmlyc3QgJiYgZm9udC5nbHlwaHNbbGV0dGVyc1tpIC0gMV1dIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VyciA9IGZvbnQuZ2x5cGhzW2xldHRlcnNbaV1dO1xuICAgICAgICAgICAgICAgICAgICBzaGlmdCArPSBub3RmaXJzdCA/IChwcmV2LncgfHwgZm9udC53KSArIChwcmV2LmsgJiYgcHJldi5rW2xldHRlcnNbaV1dIHx8IDApICsgKGZvbnQudyAqIGxldHRlcl9zcGFjaW5nKSA6IDA7XG4gICAgICAgICAgICAgICAgICAgIG5vdGZpcnN0ID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGN1cnIgJiYgY3Vyci5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGggKz0gUi50cmFuc2Zvcm1QYXRoKGN1cnIuZCwgW1widFwiLCBzaGlmdCAqIHNjYWxlLCBzaGlmdHkgKiBzY2FsZSwgXCJzXCIsIHNjYWxlLCBzY2FsZSwgdG9wLCBoZWlnaHQsIFwidFwiLCAoeCAtIHRvcCkgLyBzY2FsZSwgKHkgLSBoZWlnaHQpIC8gc2NhbGVdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aChwYXRoKS5hdHRyKHtcbiAgICAgICAgICAgIGZpbGw6IFwiIzAwMFwiLFxuICAgICAgICAgICAgc3Ryb2tlOiBcIm5vbmVcIlxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIFBhcGVyLmFkZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSW1wb3J0cyBlbGVtZW50cyBpbiBKU09OIGFycmF5IGluIGZvcm1hdCBge3R5cGU6IHR5cGUsIDxhdHRyaWJ1dGVzPn1gXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGpzb24gKGFycmF5KVxuICAgICA9IChvYmplY3QpIHJlc3VsdGluZyBzZXQgb2YgaW1wb3J0ZWQgZWxlbWVudHNcbiAgICAgPiBVc2FnZVxuICAgICB8IHBhcGVyLmFkZChbXG4gICAgIHwgICAgIHtcbiAgICAgfCAgICAgICAgIHR5cGU6IFwiY2lyY2xlXCIsXG4gICAgIHwgICAgICAgICBjeDogMTAsXG4gICAgIHwgICAgICAgICBjeTogMTAsXG4gICAgIHwgICAgICAgICByOiA1XG4gICAgIHwgICAgIH0sXG4gICAgIHwgICAgIHtcbiAgICAgfCAgICAgICAgIHR5cGU6IFwicmVjdFwiLFxuICAgICB8ICAgICAgICAgeDogMTAsXG4gICAgIHwgICAgICAgICB5OiAxMCxcbiAgICAgfCAgICAgICAgIHdpZHRoOiAxMCxcbiAgICAgfCAgICAgICAgIGhlaWdodDogMTAsXG4gICAgIHwgICAgICAgICBmaWxsOiBcIiNmYzBcIlxuICAgICB8ICAgICB9XG4gICAgIHwgXSk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uYWRkID0gZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgaWYgKFIuaXMoanNvbiwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHRoaXMuc2V0KCksXG4gICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgaWkgPSBqc29uLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBqO1xuICAgICAgICAgICAgZm9yICg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaiA9IGpzb25baV0gfHwge307XG4gICAgICAgICAgICAgICAgZWxlbWVudHNbaGFzXShqLnR5cGUpICYmIHJlcy5wdXNoKHRoaXNbai50eXBlXSgpLmF0dHIoaikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmZvcm1hdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2ltcGxlIGZvcm1hdCBmdW5jdGlvbi4gUmVwbGFjZXMgY29uc3RydWN0aW9uIG9mIHR5cGUg4oCcYHs8bnVtYmVyPn1g4oCdIHRvIHRoZSBjb3JyZXNwb25kaW5nIGFyZ3VtZW50LlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB0b2tlbiAoc3RyaW5nKSBzdHJpbmcgdG8gZm9ybWF0XG4gICAgIC0g4oCmIChzdHJpbmcpIHJlc3Qgb2YgYXJndW1lbnRzIHdpbGwgYmUgdHJlYXRlZCBhcyBwYXJhbWV0ZXJzIGZvciByZXBsYWNlbWVudFxuICAgICA9IChzdHJpbmcpIGZvcm1hdGVkIHN0cmluZ1xuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIHggPSAxMCxcbiAgICAgfCAgICAgeSA9IDIwLFxuICAgICB8ICAgICB3aWR0aCA9IDQwLFxuICAgICB8ICAgICBoZWlnaHQgPSA1MDtcbiAgICAgfCAvLyB0aGlzIHdpbGwgZHJhdyBhIHJlY3Rhbmd1bGFyIHNoYXBlIGVxdWl2YWxlbnQgdG8gXCJNMTAsMjBoNDB2NTBoLTQwelwiXG4gICAgIHwgcGFwZXIucGF0aChSYXBoYWVsLmZvcm1hdChcIk17MH0sezF9aHsyfXZ7M31oezR9elwiLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCAtd2lkdGgpKTtcbiAgICBcXCovXG4gICAgUi5mb3JtYXQgPSBmdW5jdGlvbiAodG9rZW4sIHBhcmFtcykge1xuICAgICAgICB2YXIgYXJncyA9IFIuaXMocGFyYW1zLCBhcnJheSkgPyBbMF1bY29uY2F0XShwYXJhbXMpIDogYXJndW1lbnRzO1xuICAgICAgICB0b2tlbiAmJiBSLmlzKHRva2VuLCBzdHJpbmcpICYmIGFyZ3MubGVuZ3RoIC0gMSAmJiAodG9rZW4gPSB0b2tlbi5yZXBsYWNlKGZvcm1hdHJnLCBmdW5jdGlvbiAoc3RyLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJnc1srK2ldID09IG51bGwgPyBFIDogYXJnc1tpXTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gdG9rZW4gfHwgRTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmZ1bGxmaWxsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBIGxpdHRsZSBiaXQgbW9yZSBhZHZhbmNlZCBmb3JtYXQgZnVuY3Rpb24gdGhhbiBAUmFwaGFlbC5mb3JtYXQuIFJlcGxhY2VzIGNvbnN0cnVjdGlvbiBvZiB0eXBlIOKAnGB7PG5hbWU+fWDigJ0gdG8gdGhlIGNvcnJlc3BvbmRpbmcgYXJndW1lbnQuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHRva2VuIChzdHJpbmcpIHN0cmluZyB0byBmb3JtYXRcbiAgICAgLSBqc29uIChvYmplY3QpIG9iamVjdCB3aGljaCBwcm9wZXJ0aWVzIHdpbGwgYmUgdXNlZCBhcyBhIHJlcGxhY2VtZW50XG4gICAgID0gKHN0cmluZykgZm9ybWF0ZWQgc3RyaW5nXG4gICAgID4gVXNhZ2VcbiAgICAgfCAvLyB0aGlzIHdpbGwgZHJhdyBhIHJlY3Rhbmd1bGFyIHNoYXBlIGVxdWl2YWxlbnQgdG8gXCJNMTAsMjBoNDB2NTBoLTQwelwiXG4gICAgIHwgcGFwZXIucGF0aChSYXBoYWVsLmZ1bGxmaWxsKFwiTXt4fSx7eX1oe2RpbS53aWR0aH12e2RpbS5oZWlnaHR9aHtkaW1bJ25lZ2F0aXZlIHdpZHRoJ119elwiLCB7XG4gICAgIHwgICAgIHg6IDEwLFxuICAgICB8ICAgICB5OiAyMCxcbiAgICAgfCAgICAgZGltOiB7XG4gICAgIHwgICAgICAgICB3aWR0aDogNDAsXG4gICAgIHwgICAgICAgICBoZWlnaHQ6IDUwLFxuICAgICB8ICAgICAgICAgXCJuZWdhdGl2ZSB3aWR0aFwiOiAtNDBcbiAgICAgfCAgICAgfVxuICAgICB8IH0pKTtcbiAgICBcXCovXG4gICAgUi5mdWxsZmlsbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0b2tlblJlZ2V4ID0gL1xceyhbXlxcfV0rKVxcfS9nLFxuICAgICAgICAgICAgb2JqTm90YXRpb25SZWdleCA9IC8oPzooPzpefFxcLikoLis/KSg/PVxcW3xcXC58JHxcXCgpfFxcWygnfFwiKSguKz8pXFwyXFxdKShcXChcXCkpPy9nLCAvLyBtYXRjaGVzIC54eHh4eCBvciBbXCJ4eHh4eFwiXSB0byBydW4gb3ZlciBvYmplY3QgcHJvcGVydGllc1xuICAgICAgICAgICAgcmVwbGFjZXIgPSBmdW5jdGlvbiAoYWxsLCBrZXksIG9iaikge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSBvYmo7XG4gICAgICAgICAgICAgICAga2V5LnJlcGxhY2Uob2JqTm90YXRpb25SZWdleCwgZnVuY3Rpb24gKGFsbCwgbmFtZSwgcXVvdGUsIHF1b3RlZE5hbWUsIGlzRnVuYykge1xuICAgICAgICAgICAgICAgICAgICBuYW1lID0gbmFtZSB8fCBxdW90ZWROYW1lO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiByZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgcmVzID09IFwiZnVuY3Rpb25cIiAmJiBpc0Z1bmMgJiYgKHJlcyA9IHJlcygpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlcyA9IChyZXMgPT0gbnVsbCB8fCByZXMgPT0gb2JqID8gYWxsIDogcmVzKSArIFwiXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoc3RyLCBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBTdHJpbmcoc3RyKS5yZXBsYWNlKHRva2VuUmVnZXgsIGZ1bmN0aW9uIChhbGwsIGtleSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihhbGwsIGtleSwgb2JqKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH0pKCk7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwubmluamFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIElmIHlvdSB3YW50IHRvIGxlYXZlIG5vIHRyYWNlIG9mIFJhcGhhw6tsIChXZWxsLCBSYXBoYcOrbCBjcmVhdGVzIG9ubHkgb25lIGdsb2JhbCB2YXJpYWJsZSBgUmFwaGFlbGAsIGJ1dCBhbnl3YXkuKSBZb3UgY2FuIHVzZSBgbmluamFgIG1ldGhvZC5cbiAgICAgKiBCZXdhcmUsIHRoYXQgaW4gdGhpcyBjYXNlIHBsdWdpbnMgY291bGQgc3RvcCB3b3JraW5nLCBiZWNhdXNlIHRoZXkgYXJlIGRlcGVuZGluZyBvbiBnbG9iYWwgdmFyaWFibGUgZXhpc3RhbmNlLlxuICAgICAqKlxuICAgICA9IChvYmplY3QpIFJhcGhhZWwgb2JqZWN0XG4gICAgID4gVXNhZ2VcbiAgICAgfCAoZnVuY3Rpb24gKGxvY2FsX3JhcGhhZWwpIHtcbiAgICAgfCAgICAgdmFyIHBhcGVyID0gbG9jYWxfcmFwaGFlbCgxMCwgMTAsIDMyMCwgMjAwKTtcbiAgICAgfCAgICAg4oCmXG4gICAgIHwgfSkoUmFwaGFlbC5uaW5qYSgpKTtcbiAgICBcXCovXG4gICAgUi5uaW5qYSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb2xkUmFwaGFlbC53YXMgPyAoZy53aW4uUmFwaGFlbCA9IG9sZFJhcGhhZWwuaXMpIDogZGVsZXRlIFJhcGhhZWw7XG4gICAgICAgIHJldHVybiBSO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuc3RcbiAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICoqXG4gICAgICogWW91IGNhbiBhZGQgeW91ciBvd24gbWV0aG9kIHRvIGVsZW1lbnRzIGFuZCBzZXRzLiBJdCBpcyB3aXNlIHRvIGFkZCBhIHNldCBtZXRob2QgZm9yIGVhY2ggZWxlbWVudCBtZXRob2RcbiAgICAgKiB5b3UgYWRkZWQsIHNvIHlvdSB3aWxsIGJlIGFibGUgdG8gY2FsbCB0aGUgc2FtZSBtZXRob2Qgb24gc2V0cyB0b28uXG4gICAgICoqXG4gICAgICogU2VlIGFsc28gQFJhcGhhZWwuZWwuXG4gICAgID4gVXNhZ2VcbiAgICAgfCBSYXBoYWVsLmVsLnJlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgfCAgICAgdGhpcy5hdHRyKHtmaWxsOiBcIiNmMDBcIn0pO1xuICAgICB8IH07XG4gICAgIHwgUmFwaGFlbC5zdC5yZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgIHwgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgfCAgICAgICAgIGVsLnJlZCgpO1xuICAgICB8ICAgICB9KTtcbiAgICAgfCB9O1xuICAgICB8IC8vIHRoZW4gdXNlIGl0XG4gICAgIHwgcGFwZXIuc2V0KHBhcGVyLmNpcmNsZSgxMDAsIDEwMCwgMjApLCBwYXBlci5jaXJjbGUoMTEwLCAxMDAsIDIwKSkucmVkKCk7XG4gICAgXFwqL1xuICAgIFIuc3QgPSBzZXRwcm90bztcblxuICAgIGV2ZS5vbihcInJhcGhhZWwuRE9NbG9hZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgfSk7XG5cbiAgICAvLyBGaXJlZm94IDwzLjYgZml4OiBodHRwOi8vd2VicmVmbGVjdGlvbi5ibG9nc3BvdC5jb20vMjAwOS8xMS8xOTUtY2hhcnMtdG8taGVscC1sYXp5LWxvYWRpbmcuaHRtbFxuICAgIChmdW5jdGlvbiAoZG9jLCBsb2FkZWQsIGYpIHtcbiAgICAgICAgaWYgKGRvYy5yZWFkeVN0YXRlID09IG51bGwgJiYgZG9jLmFkZEV2ZW50TGlzdGVuZXIpe1xuICAgICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIobG9hZGVkLCBmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKGxvYWRlZCwgZiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGRvYy5yZWFkeVN0YXRlID0gXCJjb21wbGV0ZVwiO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgZG9jLnJlYWR5U3RhdGUgPSBcImxvYWRpbmdcIjtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBpc0xvYWRlZCgpIHtcbiAgICAgICAgICAgICgvaW4vKS50ZXN0KGRvYy5yZWFkeVN0YXRlKSA/IHNldFRpbWVvdXQoaXNMb2FkZWQsIDkpIDogUi5ldmUoXCJyYXBoYWVsLkRPTWxvYWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaXNMb2FkZWQoKTtcbiAgICB9KShkb2N1bWVudCwgXCJET01Db250ZW50TG9hZGVkXCIpO1xuXG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIFJhcGhhw6tsIC0gSmF2YVNjcmlwdCBWZWN0b3IgTGlicmFyeSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIFNWRyBNb2R1bGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTEgRG1pdHJ5IEJhcmFub3Zza2l5IChodHRwOi8vcmFwaGFlbGpzLmNvbSkgICDilIIgXFxcXFxuLy8g4pSCIENvcHlyaWdodCAoYykgMjAwOC0yMDExIFNlbmNoYSBMYWJzIChodHRwOi8vc2VuY2hhLmNvbSkgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUgiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIChodHRwOi8vcmFwaGFlbGpzLmNvbS9saWNlbnNlLmh0bWwpIGxpY2Vuc2UuIOKUgiBcXFxcXG4vLyDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggXFxcXFxuXG4oZnVuY3Rpb24oKXtcbiAgICBpZiAoIVIuc3ZnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICB0b0Zsb2F0ID0gcGFyc2VGbG9hdCxcbiAgICAgICAgdG9JbnQgPSBwYXJzZUludCxcbiAgICAgICAgbWF0aCA9IE1hdGgsXG4gICAgICAgIG1tYXggPSBtYXRoLm1heCxcbiAgICAgICAgYWJzID0gbWF0aC5hYnMsXG4gICAgICAgIHBvdyA9IG1hdGgucG93LFxuICAgICAgICBzZXBhcmF0b3IgPSAvWywgXSsvLFxuICAgICAgICBldmUgPSBSLmV2ZSxcbiAgICAgICAgRSA9IFwiXCIsXG4gICAgICAgIFMgPSBcIiBcIjtcbiAgICB2YXIgeGxpbmsgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIixcbiAgICAgICAgbWFya2VycyA9IHtcbiAgICAgICAgICAgIGJsb2NrOiBcIk01LDAgMCwyLjUgNSw1elwiLFxuICAgICAgICAgICAgY2xhc3NpYzogXCJNNSwwIDAsMi41IDUsNSAzLjUsMyAzLjUsMnpcIixcbiAgICAgICAgICAgIGRpYW1vbmQ6IFwiTTIuNSwwIDUsMi41IDIuNSw1IDAsMi41elwiLFxuICAgICAgICAgICAgb3BlbjogXCJNNiwxIDEsMy41IDYsNlwiLFxuICAgICAgICAgICAgb3ZhbDogXCJNMi41LDBBMi41LDIuNSwwLDAsMSwyLjUsNSAyLjUsMi41LDAsMCwxLDIuNSwwelwiXG4gICAgICAgIH0sXG4gICAgICAgIG1hcmtlckNvdW50ZXIgPSB7fTtcbiAgICBSLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIFwiWW91ciBicm93c2VyIHN1cHBvcnRzIFNWRy5cXG5Zb3UgYXJlIHJ1bm5pbmcgUmFwaGFcXHhlYmwgXCIgKyB0aGlzLnZlcnNpb247XG4gICAgfTtcbiAgICB2YXIgJCA9IGZ1bmN0aW9uIChlbCwgYXR0cikge1xuICAgICAgICBpZiAoYXR0cikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgZWwgPSAkKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhdHRyKSBpZiAoYXR0cltoYXNdKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5LnN1YnN0cmluZygwLCA2KSA9PSBcInhsaW5rOlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKHhsaW5rLCBrZXkuc3Vic3RyaW5nKDYpLCBTdHIoYXR0cltrZXldKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgU3RyKGF0dHJba2V5XSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsID0gUi5fZy5kb2MuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgZWwpO1xuICAgICAgICAgICAgZWwuc3R5bGUgJiYgKGVsLnN0eWxlLndlYmtpdFRhcEhpZ2hsaWdodENvbG9yID0gXCJyZ2JhKDAsMCwwLDApXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9LFxuICAgIGFkZEdyYWRpZW50RmlsbCA9IGZ1bmN0aW9uIChlbGVtZW50LCBncmFkaWVudCkge1xuICAgICAgICB2YXIgdHlwZSA9IFwibGluZWFyXCIsXG4gICAgICAgICAgICBpZCA9IGVsZW1lbnQuaWQgKyBncmFkaWVudCxcbiAgICAgICAgICAgIGZ4ID0gLjUsIGZ5ID0gLjUsXG4gICAgICAgICAgICBvID0gZWxlbWVudC5ub2RlLFxuICAgICAgICAgICAgU1ZHID0gZWxlbWVudC5wYXBlcixcbiAgICAgICAgICAgIHMgPSBvLnN0eWxlLFxuICAgICAgICAgICAgZWwgPSBSLl9nLmRvYy5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGlmICghZWwpIHtcbiAgICAgICAgICAgIGdyYWRpZW50ID0gU3RyKGdyYWRpZW50KS5yZXBsYWNlKFIuX3JhZGlhbF9ncmFkaWVudCwgZnVuY3Rpb24gKGFsbCwgX2Z4LCBfZnkpIHtcbiAgICAgICAgICAgICAgICB0eXBlID0gXCJyYWRpYWxcIjtcbiAgICAgICAgICAgICAgICBpZiAoX2Z4ICYmIF9meSkge1xuICAgICAgICAgICAgICAgICAgICBmeCA9IHRvRmxvYXQoX2Z4KTtcbiAgICAgICAgICAgICAgICAgICAgZnkgPSB0b0Zsb2F0KF9meSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXIgPSAoKGZ5ID4gLjUpICogMiAtIDEpO1xuICAgICAgICAgICAgICAgICAgICBwb3coZnggLSAuNSwgMikgKyBwb3coZnkgLSAuNSwgMikgPiAuMjUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChmeSA9IG1hdGguc3FydCguMjUgLSBwb3coZnggLSAuNSwgMikpICogZGlyICsgLjUpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBmeSAhPSAuNSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGZ5ID0gZnkudG9GaXhlZCg1KSAtIDFlLTUgKiBkaXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gRTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZ3JhZGllbnQgPSBncmFkaWVudC5zcGxpdCgvXFxzKlxcLVxccyovKTtcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwibGluZWFyXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYW5nbGUgPSBncmFkaWVudC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIGFuZ2xlID0gLXRvRmxvYXQoYW5nbGUpO1xuICAgICAgICAgICAgICAgIGlmIChpc05hTihhbmdsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbMCwgMCwgbWF0aC5jb3MoUi5yYWQoYW5nbGUpKSwgbWF0aC5zaW4oUi5yYWQoYW5nbGUpKV0sXG4gICAgICAgICAgICAgICAgICAgIG1heCA9IDEgLyAobW1heChhYnModmVjdG9yWzJdKSwgYWJzKHZlY3RvclszXSkpIHx8IDEpO1xuICAgICAgICAgICAgICAgIHZlY3RvclsyXSAqPSBtYXg7XG4gICAgICAgICAgICAgICAgdmVjdG9yWzNdICo9IG1heDtcbiAgICAgICAgICAgICAgICBpZiAodmVjdG9yWzJdIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3JbMF0gPSAtdmVjdG9yWzJdO1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3JbMl0gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodmVjdG9yWzNdIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3JbMV0gPSAtdmVjdG9yWzNdO1xuICAgICAgICAgICAgICAgICAgICB2ZWN0b3JbM10gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkb3RzID0gUi5fcGFyc2VEb3RzKGdyYWRpZW50KTtcbiAgICAgICAgICAgIGlmICghZG90cykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWQgPSBpZC5yZXBsYWNlKC9bXFwoXFwpXFxzLFxceGIwI10vZywgXCJfXCIpO1xuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5ncmFkaWVudCAmJiBpZCAhPSBlbGVtZW50LmdyYWRpZW50LmlkKSB7XG4gICAgICAgICAgICAgICAgU1ZHLmRlZnMucmVtb3ZlQ2hpbGQoZWxlbWVudC5ncmFkaWVudCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGVsZW1lbnQuZ3JhZGllbnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZWxlbWVudC5ncmFkaWVudCkge1xuICAgICAgICAgICAgICAgIGVsID0gJCh0eXBlICsgXCJHcmFkaWVudFwiLCB7aWQ6IGlkfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5ncmFkaWVudCA9IGVsO1xuICAgICAgICAgICAgICAgICQoZWwsIHR5cGUgPT0gXCJyYWRpYWxcIiA/IHtcbiAgICAgICAgICAgICAgICAgICAgZng6IGZ4LFxuICAgICAgICAgICAgICAgICAgICBmeTogZnlcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICB4MTogdmVjdG9yWzBdLFxuICAgICAgICAgICAgICAgICAgICB5MTogdmVjdG9yWzFdLFxuICAgICAgICAgICAgICAgICAgICB4MjogdmVjdG9yWzJdLFxuICAgICAgICAgICAgICAgICAgICB5MjogdmVjdG9yWzNdLFxuICAgICAgICAgICAgICAgICAgICBncmFkaWVudFRyYW5zZm9ybTogZWxlbWVudC5tYXRyaXguaW52ZXJ0KClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBTVkcuZGVmcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZG90cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKCQoXCJzdG9wXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogZG90c1tpXS5vZmZzZXQgPyBkb3RzW2ldLm9mZnNldCA6IGkgPyBcIjEwMCVcIiA6IFwiMCVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3RvcC1jb2xvclwiOiBkb3RzW2ldLmNvbG9yIHx8IFwiI2ZmZlwiXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgJChvLCB7XG4gICAgICAgICAgICBmaWxsOiBcInVybCgnXCIgKyBkb2N1bWVudC5sb2NhdGlvbiArIFwiI1wiICsgaWQgKyBcIicpXCIsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgXCJmaWxsLW9wYWNpdHlcIjogMVxuICAgICAgICB9KTtcbiAgICAgICAgcy5maWxsID0gRTtcbiAgICAgICAgcy5vcGFjaXR5ID0gMTtcbiAgICAgICAgcy5maWxsT3BhY2l0eSA9IDE7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH0sXG4gICAgdXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbiAobykge1xuICAgICAgICB2YXIgYmJveCA9IG8uZ2V0QkJveCgxKTtcbiAgICAgICAgJChvLnBhdHRlcm4sIHtwYXR0ZXJuVHJhbnNmb3JtOiBvLm1hdHJpeC5pbnZlcnQoKSArIFwiIHRyYW5zbGF0ZShcIiArIGJib3gueCArIFwiLFwiICsgYmJveC55ICsgXCIpXCJ9KTtcbiAgICB9LFxuICAgIGFkZEFycm93ID0gZnVuY3Rpb24gKG8sIHZhbHVlLCBpc0VuZCkge1xuICAgICAgICBpZiAoby50eXBlID09IFwicGF0aFwiKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gU3RyKHZhbHVlKS50b0xvd2VyQ2FzZSgpLnNwbGl0KFwiLVwiKSxcbiAgICAgICAgICAgICAgICBwID0gby5wYXBlcixcbiAgICAgICAgICAgICAgICBzZSA9IGlzRW5kID8gXCJlbmRcIiA6IFwic3RhcnRcIixcbiAgICAgICAgICAgICAgICBub2RlID0gby5ub2RlLFxuICAgICAgICAgICAgICAgIGF0dHJzID0gby5hdHRycyxcbiAgICAgICAgICAgICAgICBzdHJva2UgPSBhdHRyc1tcInN0cm9rZS13aWR0aFwiXSxcbiAgICAgICAgICAgICAgICBpID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB0eXBlID0gXCJjbGFzc2ljXCIsXG4gICAgICAgICAgICAgICAgZnJvbSxcbiAgICAgICAgICAgICAgICB0byxcbiAgICAgICAgICAgICAgICBkeCxcbiAgICAgICAgICAgICAgICByZWZYLFxuICAgICAgICAgICAgICAgIGF0dHIsXG4gICAgICAgICAgICAgICAgdyA9IDMsXG4gICAgICAgICAgICAgICAgaCA9IDMsXG4gICAgICAgICAgICAgICAgdCA9IDU7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZXNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImJsb2NrXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjbGFzc2ljXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJvdmFsXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJkaWFtb25kXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJvcGVuXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJub25lXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gdmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ3aWRlXCI6IGggPSA1OyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hcnJvd1wiOiBoID0gMjsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJsb25nXCI6IHcgPSA1OyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNob3J0XCI6IHcgPSAyOyBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIm9wZW5cIikge1xuICAgICAgICAgICAgICAgIHcgKz0gMjtcbiAgICAgICAgICAgICAgICBoICs9IDI7XG4gICAgICAgICAgICAgICAgdCArPSAyO1xuICAgICAgICAgICAgICAgIGR4ID0gMTtcbiAgICAgICAgICAgICAgICByZWZYID0gaXNFbmQgPyA0IDogMTtcbiAgICAgICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWxsOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBhdHRycy5zdHJva2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWZYID0gZHggPSB3IC8gMjtcbiAgICAgICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWxsOiBhdHRycy5zdHJva2UsXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZTogXCJub25lXCJcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG8uXy5hcnJvd3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNFbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgby5fLmFycm93cy5lbmRQYXRoICYmIG1hcmtlckNvdW50ZXJbby5fLmFycm93cy5lbmRQYXRoXS0tO1xuICAgICAgICAgICAgICAgICAgICBvLl8uYXJyb3dzLmVuZE1hcmtlciAmJiBtYXJrZXJDb3VudGVyW28uXy5hcnJvd3MuZW5kTWFya2VyXS0tO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Muc3RhcnRQYXRoICYmIG1hcmtlckNvdW50ZXJbby5fLmFycm93cy5zdGFydFBhdGhdLS07XG4gICAgICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Muc3RhcnRNYXJrZXIgJiYgbWFya2VyQ291bnRlcltvLl8uYXJyb3dzLnN0YXJ0TWFya2VyXS0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgby5fLmFycm93cyA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGUgIT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aElkID0gXCJyYXBoYWVsLW1hcmtlci1cIiArIHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcklkID0gXCJyYXBoYWVsLW1hcmtlci1cIiArIHNlICsgdHlwZSArIHcgKyBoICsgXCItb2JqXCIgKyBvLmlkO1xuICAgICAgICAgICAgICAgIGlmICghUi5fZy5kb2MuZ2V0RWxlbWVudEJ5SWQocGF0aElkKSkge1xuICAgICAgICAgICAgICAgICAgICBwLmRlZnMuYXBwZW5kQ2hpbGQoJCgkKFwicGF0aFwiKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJzdHJva2UtbGluZWNhcFwiOiBcInJvdW5kXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBkOiBtYXJrZXJzW3R5cGVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHBhdGhJZFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlckNvdW50ZXJbcGF0aElkXSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyQ291bnRlcltwYXRoSWRdKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBSLl9nLmRvYy5nZXRFbGVtZW50QnlJZChtYXJrZXJJZCksXG4gICAgICAgICAgICAgICAgICAgIHVzZTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSAkKCQoXCJtYXJrZXJcIiksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBtYXJrZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlckhlaWdodDogaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlcldpZHRoOiB3LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZW50OiBcImF1dG9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZlg6IHJlZlgsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZZOiBoIC8gMlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdXNlID0gJCgkKFwidXNlXCIpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInhsaW5rOmhyZWZcIjogXCIjXCIgKyBwYXRoSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IChpc0VuZCA/IFwicm90YXRlKDE4MCBcIiArIHcgLyAyICsgXCIgXCIgKyBoIC8gMiArIFwiKSBcIiA6IEUpICsgXCJzY2FsZShcIiArIHcgLyB0ICsgXCIsXCIgKyBoIC8gdCArIFwiKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzdHJva2Utd2lkdGhcIjogKDEgLyAoKHcgLyB0ICsgaCAvIHQpIC8gMikpLnRvRml4ZWQoNClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5hcHBlbmRDaGlsZCh1c2UpO1xuICAgICAgICAgICAgICAgICAgICBwLmRlZnMuYXBwZW5kQ2hpbGQobWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyQ291bnRlclttYXJrZXJJZF0gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlckNvdW50ZXJbbWFya2VySWRdKys7XG4gICAgICAgICAgICAgICAgICAgIHVzZSA9IG1hcmtlci5nZXRFbGVtZW50c0J5VGFnTmFtZShcInVzZVwiKVswXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJCh1c2UsIGF0dHIpO1xuICAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGR4ICogKHR5cGUgIT0gXCJkaWFtb25kXCIgJiYgdHlwZSAhPSBcIm92YWxcIik7XG4gICAgICAgICAgICAgICAgaWYgKGlzRW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSBvLl8uYXJyb3dzLnN0YXJ0ZHggKiBzdHJva2UgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBSLmdldFRvdGFsTGVuZ3RoKGF0dHJzLnBhdGgpIC0gZGVsdGEgKiBzdHJva2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IGRlbHRhICogc3Ryb2tlO1xuICAgICAgICAgICAgICAgICAgICB0byA9IFIuZ2V0VG90YWxMZW5ndGgoYXR0cnMucGF0aCkgLSAoby5fLmFycm93cy5lbmRkeCAqIHN0cm9rZSB8fCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXR0ciA9IHt9O1xuICAgICAgICAgICAgICAgIGF0dHJbXCJtYXJrZXItXCIgKyBzZV0gPSBcInVybCgjXCIgKyBtYXJrZXJJZCArIFwiKVwiO1xuICAgICAgICAgICAgICAgIGlmICh0byB8fCBmcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0dHIuZCA9IFIuZ2V0U3VicGF0aChhdHRycy5wYXRoLCBmcm9tLCB0byk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQobm9kZSwgYXR0cik7XG4gICAgICAgICAgICAgICAgby5fLmFycm93c1tzZSArIFwiUGF0aFwiXSA9IHBhdGhJZDtcbiAgICAgICAgICAgICAgICBvLl8uYXJyb3dzW3NlICsgXCJNYXJrZXJcIl0gPSBtYXJrZXJJZDtcbiAgICAgICAgICAgICAgICBvLl8uYXJyb3dzW3NlICsgXCJkeFwiXSA9IGRlbHRhO1xuICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Nbc2UgKyBcIlR5cGVcIl0gPSB0eXBlO1xuICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Nbc2UgKyBcIlN0cmluZ1wiXSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNFbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IG8uXy5hcnJvd3Muc3RhcnRkeCAqIHN0cm9rZSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICB0byA9IFIuZ2V0VG90YWxMZW5ndGgoYXR0cnMucGF0aCkgLSBmcm9tO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSAwO1xuICAgICAgICAgICAgICAgICAgICB0byA9IFIuZ2V0VG90YWxMZW5ndGgoYXR0cnMucGF0aCkgLSAoby5fLmFycm93cy5lbmRkeCAqIHN0cm9rZSB8fCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgby5fLmFycm93c1tzZSArIFwiUGF0aFwiXSAmJiAkKG5vZGUsIHtkOiBSLmdldFN1YnBhdGgoYXR0cnMucGF0aCwgZnJvbSwgdG8pfSk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG8uXy5hcnJvd3Nbc2UgKyBcIlBhdGhcIl07XG4gICAgICAgICAgICAgICAgZGVsZXRlIG8uXy5hcnJvd3Nbc2UgKyBcIk1hcmtlclwiXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgby5fLmFycm93c1tzZSArIFwiZHhcIl07XG4gICAgICAgICAgICAgICAgZGVsZXRlIG8uXy5hcnJvd3Nbc2UgKyBcIlR5cGVcIl07XG4gICAgICAgICAgICAgICAgZGVsZXRlIG8uXy5hcnJvd3Nbc2UgKyBcIlN0cmluZ1wiXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBtYXJrZXJDb3VudGVyKSBpZiAobWFya2VyQ291bnRlcltoYXNdKGF0dHIpICYmICFtYXJrZXJDb3VudGVyW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBSLl9nLmRvYy5nZXRFbGVtZW50QnlJZChhdHRyKTtcbiAgICAgICAgICAgICAgICBpdGVtICYmIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgZGFzaGFycmF5ID0ge1xuICAgICAgICBcIlwiOiBbMF0sXG4gICAgICAgIFwibm9uZVwiOiBbMF0sXG4gICAgICAgIFwiLVwiOiBbMywgMV0sXG4gICAgICAgIFwiLlwiOiBbMSwgMV0sXG4gICAgICAgIFwiLS5cIjogWzMsIDEsIDEsIDFdLFxuICAgICAgICBcIi0uLlwiOiBbMywgMSwgMSwgMSwgMSwgMV0sXG4gICAgICAgIFwiLiBcIjogWzEsIDNdLFxuICAgICAgICBcIi0gXCI6IFs0LCAzXSxcbiAgICAgICAgXCItLVwiOiBbOCwgM10sXG4gICAgICAgIFwiLSAuXCI6IFs0LCAzLCAxLCAzXSxcbiAgICAgICAgXCItLS5cIjogWzgsIDMsIDEsIDNdLFxuICAgICAgICBcIi0tLi5cIjogWzgsIDMsIDEsIDMsIDEsIDNdXG4gICAgfSxcbiAgICBhZGREYXNoZXMgPSBmdW5jdGlvbiAobywgdmFsdWUsIHBhcmFtcykge1xuICAgICAgICB2YWx1ZSA9IGRhc2hhcnJheVtTdHIodmFsdWUpLnRvTG93ZXJDYXNlKCldO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IG8uYXR0cnNbXCJzdHJva2Utd2lkdGhcIl0gfHwgXCIxXCIsXG4gICAgICAgICAgICAgICAgYnV0dCA9IHtyb3VuZDogd2lkdGgsIHNxdWFyZTogd2lkdGgsIGJ1dHQ6IDB9W28uYXR0cnNbXCJzdHJva2UtbGluZWNhcFwiXSB8fCBwYXJhbXNbXCJzdHJva2UtbGluZWNhcFwiXV0gfHwgMCxcbiAgICAgICAgICAgICAgICBkYXNoZXMgPSBbXSxcbiAgICAgICAgICAgICAgICBpID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIGRhc2hlc1tpXSA9IHZhbHVlW2ldICogd2lkdGggKyAoKGkgJSAyKSA/IDEgOiAtMSkgKiBidXR0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJChvLm5vZGUsIHtcInN0cm9rZS1kYXNoYXJyYXlcIjogZGFzaGVzLmpvaW4oXCIsXCIpfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNldEZpbGxBbmRTdHJva2UgPSBmdW5jdGlvbiAobywgcGFyYW1zKSB7XG4gICAgICAgIHZhciBub2RlID0gby5ub2RlLFxuICAgICAgICAgICAgYXR0cnMgPSBvLmF0dHJzLFxuICAgICAgICAgICAgdmlzID0gbm9kZS5zdHlsZS52aXNpYmlsaXR5O1xuICAgICAgICBub2RlLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICBmb3IgKHZhciBhdHQgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICBpZiAocGFyYW1zW2hhc10oYXR0KSkge1xuICAgICAgICAgICAgICAgIGlmICghUi5fYXZhaWxhYmxlQXR0cnNbaGFzXShhdHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJhbXNbYXR0XTtcbiAgICAgICAgICAgICAgICBhdHRyc1thdHRdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChhdHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImJsdXJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uYmx1cih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRpdGxlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGl0bGUgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGl0bGVcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVzZSB0aGUgZXhpc3RpbmcgPHRpdGxlPi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aXRsZS5sZW5ndGggJiYgKHRpdGxlID0gdGl0bGVbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlLmZpcnN0Q2hpbGQubm9kZVZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZSA9ICQoXCJ0aXRsZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IFIuX2cuZG9jLmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGUuYXBwZW5kQ2hpbGQodmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImhyZWZcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRhcmdldFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBuID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBuLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPSBcImFcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBobCA9ICQoXCJhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuLmluc2VydEJlZm9yZShobCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGwuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG4gPSBobDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHQgPT0gXCJ0YXJnZXRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuLnNldEF0dHJpYnV0ZU5TKHhsaW5rLCBcInNob3dcIiwgdmFsdWUgPT0gXCJibGFua1wiID8gXCJuZXdcIiA6IHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG4uc2V0QXR0cmlidXRlTlMoeGxpbmssIGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjdXJzb3JcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGUuY3Vyc29yID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYW5zZm9ybVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgby50cmFuc2Zvcm0odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJhcnJvdy1zdGFydFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQXJyb3cobywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJhcnJvdy1lbmRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFycm93KG8sIHZhbHVlLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2xpcC1yZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IFN0cih2YWx1ZSkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWN0Lmxlbmd0aCA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5jbGlwICYmIG8uY2xpcC5wYXJlbnROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoby5jbGlwLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbCA9ICQoXCJjbGlwUGF0aFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmMgPSAkKFwicmVjdFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5pZCA9IFIuY3JlYXRlVVVJRCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQocmMsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogcmVjdFswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogcmVjdFsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHJlY3RbMl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcmVjdFszXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHJjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLnBhcGVyLmRlZnMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge1wiY2xpcC1wYXRoXCI6IFwidXJsKCNcIiArIGVsLmlkICsgXCIpXCJ9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLmNsaXAgPSByYztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiY2xpcC1wYXRoXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbGlwID0gUi5fZy5kb2MuZ2V0RWxlbWVudEJ5SWQocGF0aC5yZXBsYWNlKC8oXnVybFxcKCN8XFwpJCkvZywgRSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGlwICYmIGNsaXAucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjbGlwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7XCJjbGlwLXBhdGhcIjogRX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgby5jbGlwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJwYXRoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby50eXBlID09IFwicGF0aFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7ZDogdmFsdWUgPyBhdHRycy5wYXRoID0gUi5fcGF0aFRvQWJzb2x1dGUodmFsdWUpIDogXCJNMCwwXCJ9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLl8uYXJyb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3RhcnRTdHJpbmdcIiBpbiBvLl8uYXJyb3dzICYmIGFkZEFycm93KG8sIG8uXy5hcnJvd3Muc3RhcnRTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVuZFN0cmluZ1wiIGluIG8uXy5hcnJvd3MgJiYgYWRkQXJyb3cobywgby5fLmFycm93cy5lbmRTdHJpbmcsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwid2lkdGhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5meCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dCA9IFwieFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYXR0cnMueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ4XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuZngpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IC1hdHRycy54IC0gKGF0dHJzLndpZHRoIHx8IDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicnhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHQgPT0gXCJyeFwiICYmIG8udHlwZSA9PSBcInJlY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY3hcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5wYXR0ZXJuICYmIHVwZGF0ZVBvc2l0aW9uKG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaGVpZ2h0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuZnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHQgPSBcInlcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGF0dHJzLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwieVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmZ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAtYXR0cnMueSAtIChhdHRycy5oZWlnaHQgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyeVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dCA9PSBcInJ5XCIgJiYgby50eXBlID09IFwicmVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjeVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnBhdHRlcm4gJiYgdXBkYXRlUG9zaXRpb24obyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby50eXBlID09IFwicmVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7cng6IHZhbHVlLCByeTogdmFsdWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzcmNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLnR5cGUgPT0gXCJpbWFnZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGVOUyh4bGluaywgXCJocmVmXCIsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic3Ryb2tlLXdpZHRoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5fLnN4ICE9IDEgfHwgby5fLnN5ICE9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSAvPSBtbWF4KGFicyhvLl8uc3gpLCBhYnMoby5fLnN5KSkgfHwgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzW1wic3Ryb2tlLWRhc2hhcnJheVwiXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZERhc2hlcyhvLCBhdHRyc1tcInN0cm9rZS1kYXNoYXJyYXlcIl0sIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5fLmFycm93cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3RhcnRTdHJpbmdcIiBpbiBvLl8uYXJyb3dzICYmIGFkZEFycm93KG8sIG8uXy5hcnJvd3Muc3RhcnRTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZW5kU3RyaW5nXCIgaW4gby5fLmFycm93cyAmJiBhZGRBcnJvdyhvLCBvLl8uYXJyb3dzLmVuZFN0cmluZywgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInN0cm9rZS1kYXNoYXJyYXlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZERhc2hlcyhvLCB2YWx1ZSwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZmlsbFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVVJMID0gU3RyKHZhbHVlKS5tYXRjaChSLl9JU1VSTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbCA9ICQoXCJwYXR0ZXJuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZyA9ICQoXCJpbWFnZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5pZCA9IFIuY3JlYXRlVVVJRCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoZWwsIHt4OiAwLCB5OiAwLCBwYXR0ZXJuVW5pdHM6IFwidXNlclNwYWNlT25Vc2VcIiwgaGVpZ2h0OiAxLCB3aWR0aDogMX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaWcsIHt4OiAwLCB5OiAwLCBcInhsaW5rOmhyZWZcIjogaXNVUkxbMV19KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChpZyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIuX3ByZWxvYWQoaXNVUkxbMV0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3ID0gdGhpcy5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoID0gdGhpcy5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGVsLCB7d2lkdGg6IHcsIGhlaWdodDogaH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpZywge3dpZHRoOiB3LCBoZWlnaHQ6IGh9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGFwZXIuc2FmYXJpKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLnBhcGVyLmRlZnMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge2ZpbGw6IFwidXJsKCNcIiArIGVsLmlkICsgXCIpXCJ9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLnBhdHRlcm4gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLnBhdHRlcm4gJiYgdXBkYXRlUG9zaXRpb24obyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2xyID0gUi5nZXRSR0IodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjbHIuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcGFyYW1zLmdyYWRpZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBhdHRycy5ncmFkaWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhUi5pcyhhdHRycy5vcGFjaXR5LCBcInVuZGVmaW5lZFwiKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSLmlzKHBhcmFtcy5vcGFjaXR5LCBcInVuZGVmaW5lZFwiKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtvcGFjaXR5OiBhdHRycy5vcGFjaXR5fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIVIuaXMoYXR0cnNbXCJmaWxsLW9wYWNpdHlcIl0sIFwidW5kZWZpbmVkXCIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIuaXMocGFyYW1zW1wiZmlsbC1vcGFjaXR5XCJdLCBcInVuZGVmaW5lZFwiKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtcImZpbGwtb3BhY2l0eVwiOiBhdHRyc1tcImZpbGwtb3BhY2l0eVwiXX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgoby50eXBlID09IFwiY2lyY2xlXCIgfHwgby50eXBlID09IFwiZWxsaXBzZVwiIHx8IFN0cih2YWx1ZSkuY2hhckF0KCkgIT0gXCJyXCIpICYmIGFkZEdyYWRpZW50RmlsbChvLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXCJvcGFjaXR5XCIgaW4gYXR0cnMgfHwgXCJmaWxsLW9wYWNpdHlcIiBpbiBhdHRycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3JhZGllbnQgPSBSLl9nLmRvYy5nZXRFbGVtZW50QnlJZChub2RlLmdldEF0dHJpYnV0ZShcImZpbGxcIikucmVwbGFjZSgvXnVybFxcKCN8XFwpJC9nLCBFKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChncmFkaWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0b3BzID0gZ3JhZGllbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdG9wXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChzdG9wc1tzdG9wcy5sZW5ndGggLSAxXSwge1wic3RvcC1vcGFjaXR5XCI6IChcIm9wYWNpdHlcIiBpbiBhdHRycyA/IGF0dHJzLm9wYWNpdHkgOiAxKSAqIChcImZpbGwtb3BhY2l0eVwiIGluIGF0dHJzID8gYXR0cnNbXCJmaWxsLW9wYWNpdHlcIl0gOiAxKX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzLmdyYWRpZW50ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnMuZmlsbCA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xyW2hhc10oXCJvcGFjaXR5XCIpICYmICQobm9kZSwge1wiZmlsbC1vcGFjaXR5XCI6IGNsci5vcGFjaXR5ID4gMSA/IGNsci5vcGFjaXR5IC8gMTAwIDogY2xyLm9wYWNpdHl9KTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInN0cm9rZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xyID0gUi5nZXRSR0IodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCBjbHIuaGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dCA9PSBcInN0cm9rZVwiICYmIGNscltoYXNdKFwib3BhY2l0eVwiKSAmJiAkKG5vZGUsIHtcInN0cm9rZS1vcGFjaXR5XCI6IGNsci5vcGFjaXR5ID4gMSA/IGNsci5vcGFjaXR5IC8gMTAwIDogY2xyLm9wYWNpdHl9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHQgPT0gXCJzdHJva2VcIiAmJiBvLl8uYXJyb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdGFydFN0cmluZ1wiIGluIG8uXy5hcnJvd3MgJiYgYWRkQXJyb3cobywgby5fLmFycm93cy5zdGFydFN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlbmRTdHJpbmdcIiBpbiBvLl8uYXJyb3dzICYmIGFkZEFycm93KG8sIG8uXy5hcnJvd3MuZW5kU3RyaW5nLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZ3JhZGllbnRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIChvLnR5cGUgPT0gXCJjaXJjbGVcIiB8fCBvLnR5cGUgPT0gXCJlbGxpcHNlXCIgfHwgU3RyKHZhbHVlKS5jaGFyQXQoKSAhPSBcInJcIikgJiYgYWRkR3JhZGllbnRGaWxsKG8sIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwib3BhY2l0eVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmdyYWRpZW50ICYmICFhdHRyc1toYXNdKFwic3Ryb2tlLW9wYWNpdHlcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtcInN0cm9rZS1vcGFjaXR5XCI6IHZhbHVlID4gMSA/IHZhbHVlIC8gMTAwIDogdmFsdWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGxcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImZpbGwtb3BhY2l0eVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmdyYWRpZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhZGllbnQgPSBSLl9nLmRvYy5nZXRFbGVtZW50QnlJZChub2RlLmdldEF0dHJpYnV0ZShcImZpbGxcIikucmVwbGFjZSgvXnVybFxcKCN8XFwpJC9nLCBFKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdyYWRpZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BzID0gZ3JhZGllbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdG9wXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHN0b3BzW3N0b3BzLmxlbmd0aCAtIDFdLCB7XCJzdG9wLW9wYWNpdHlcIjogdmFsdWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBhdHQgPT0gXCJmb250LXNpemVcIiAmJiAodmFsdWUgPSB0b0ludCh2YWx1ZSwgMTApICsgXCJweFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjc3NydWxlID0gYXR0LnJlcGxhY2UoLyhcXC0uKS9nLCBmdW5jdGlvbiAodykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3LnN1YnN0cmluZygxKS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlW2Nzc3J1bGVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0dW5lVGV4dChvLCBwYXJhbXMpO1xuICAgICAgICBub2RlLnN0eWxlLnZpc2liaWxpdHkgPSB2aXM7XG4gICAgfSxcbiAgICBsZWFkaW5nID0gMS4yLFxuICAgIHR1bmVUZXh0ID0gZnVuY3Rpb24gKGVsLCBwYXJhbXMpIHtcbiAgICAgICAgaWYgKGVsLnR5cGUgIT0gXCJ0ZXh0XCIgfHwgIShwYXJhbXNbaGFzXShcInRleHRcIikgfHwgcGFyYW1zW2hhc10oXCJmb250XCIpIHx8IHBhcmFtc1toYXNdKFwiZm9udC1zaXplXCIpIHx8IHBhcmFtc1toYXNdKFwieFwiKSB8fCBwYXJhbXNbaGFzXShcInlcIikpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGEgPSBlbC5hdHRycyxcbiAgICAgICAgICAgIG5vZGUgPSBlbC5ub2RlLFxuICAgICAgICAgICAgZm9udFNpemUgPSBub2RlLmZpcnN0Q2hpbGQgPyB0b0ludChSLl9nLmRvYy5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKG5vZGUuZmlyc3RDaGlsZCwgRSkuZ2V0UHJvcGVydHlWYWx1ZShcImZvbnQtc2l6ZVwiKSwgMTApIDogMTA7XG5cbiAgICAgICAgaWYgKHBhcmFtc1toYXNdKFwidGV4dFwiKSkge1xuICAgICAgICAgICAgYS50ZXh0ID0gcGFyYW1zLnRleHQ7XG4gICAgICAgICAgICB3aGlsZSAobm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRleHRzID0gU3RyKHBhcmFtcy50ZXh0KS5zcGxpdChcIlxcblwiKSxcbiAgICAgICAgICAgICAgICB0c3BhbnMgPSBbXSxcbiAgICAgICAgICAgICAgICB0c3BhbjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRleHRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0c3BhbiA9ICQoXCJ0c3BhblwiKTtcbiAgICAgICAgICAgICAgICBpICYmICQodHNwYW4sIHtkeTogZm9udFNpemUgKiBsZWFkaW5nLCB4OiBhLnh9KTtcbiAgICAgICAgICAgICAgICB0c3Bhbi5hcHBlbmRDaGlsZChSLl9nLmRvYy5jcmVhdGVUZXh0Tm9kZSh0ZXh0c1tpXSkpO1xuICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQodHNwYW4pO1xuICAgICAgICAgICAgICAgIHRzcGFuc1tpXSA9IHRzcGFuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHNwYW5zID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRzcGFuXCIpO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSB0c3BhbnMubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKGkpIHtcbiAgICAgICAgICAgICAgICAkKHRzcGFuc1tpXSwge2R5OiBmb250U2l6ZSAqIGxlYWRpbmcsIHg6IGEueH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKHRzcGFuc1swXSwge2R5OiAwfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgJChub2RlLCB7eDogYS54LCB5OiBhLnl9KTtcbiAgICAgICAgZWwuXy5kaXJ0eSA9IDE7XG4gICAgICAgIHZhciBiYiA9IGVsLl9nZXRCQm94KCksXG4gICAgICAgICAgICBkaWYgPSBhLnkgLSAoYmIueSArIGJiLmhlaWdodCAvIDIpO1xuICAgICAgICBkaWYgJiYgUi5pcyhkaWYsIFwiZmluaXRlXCIpICYmICQodHNwYW5zWzBdLCB7ZHk6IGRpZn0pO1xuICAgIH0sXG4gICAgZ2V0UmVhbE5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5wYXJlbnROb2RlICYmIG5vZGUucGFyZW50Tm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiYVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIEVsZW1lbnQgPSBmdW5jdGlvbiAobm9kZSwgc3ZnKSB7XG4gICAgICAgIHZhciBYID0gMCxcbiAgICAgICAgICAgIFkgPSAwO1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIEVsZW1lbnQubm9kZVxuICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBHaXZlcyB5b3UgYSByZWZlcmVuY2UgdG8gdGhlIERPTSBvYmplY3QsIHNvIHlvdSBjYW4gYXNzaWduIGV2ZW50IGhhbmRsZXJzIG9yIGp1c3QgbWVzcyBhcm91bmQuXG4gICAgICAgICAqKlxuICAgICAgICAgKiBOb3RlOiBEb27igJl0IG1lc3Mgd2l0aCBpdC5cbiAgICAgICAgID4gVXNhZ2VcbiAgICAgICAgIHwgLy8gZHJhdyBhIGNpcmNsZSBhdCBjb29yZGluYXRlIDEwLDEwIHdpdGggcmFkaXVzIG9mIDEwXG4gICAgICAgICB8IHZhciBjID0gcGFwZXIuY2lyY2xlKDEwLCAxMCwgMTApO1xuICAgICAgICAgfCBjLm5vZGUub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIHwgICAgIGMuYXR0cihcImZpbGxcIiwgXCJyZWRcIik7XG4gICAgICAgICB8IH07XG4gICAgICAgIFxcKi9cbiAgICAgICAgdGhpc1swXSA9IHRoaXMubm9kZSA9IG5vZGU7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogRWxlbWVudC5yYXBoYWVsXG4gICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIEludGVybmFsIHJlZmVyZW5jZSB0byBAUmFwaGFlbCBvYmplY3QuIEluIGNhc2UgaXQgaXMgbm90IGF2YWlsYWJsZS5cbiAgICAgICAgID4gVXNhZ2VcbiAgICAgICAgIHwgUmFwaGFlbC5lbC5yZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICB8ICAgICB2YXIgaHNiID0gdGhpcy5wYXBlci5yYXBoYWVsLnJnYjJoc2IodGhpcy5hdHRyKFwiZmlsbFwiKSk7XG4gICAgICAgICB8ICAgICBoc2IuaCA9IDE7XG4gICAgICAgICB8ICAgICB0aGlzLmF0dHIoe2ZpbGw6IHRoaXMucGFwZXIucmFwaGFlbC5oc2IycmdiKGhzYikuaGV4fSk7XG4gICAgICAgICB8IH1cbiAgICAgICAgXFwqL1xuICAgICAgICBub2RlLnJhcGhhZWwgPSB0cnVlO1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIEVsZW1lbnQuaWRcbiAgICAgICAgIFsgcHJvcGVydHkgKG51bWJlcikgXVxuICAgICAgICAgKipcbiAgICAgICAgICogVW5pcXVlIGlkIG9mIHRoZSBlbGVtZW50LiBFc3BlY2lhbGx5IHVzZWZ1bCB3aGVuIHlvdSB3YW50IHRvIGxpc3RlbiB0byBldmVudHMgb2YgdGhlIGVsZW1lbnQsXG4gICAgICAgICAqIGJlY2F1c2UgYWxsIGV2ZW50cyBhcmUgZmlyZWQgaW4gZm9ybWF0IGA8bW9kdWxlPi48YWN0aW9uPi48aWQ+YC4gQWxzbyB1c2VmdWwgZm9yIEBQYXBlci5nZXRCeUlkIG1ldGhvZC5cbiAgICAgICAgXFwqL1xuICAgICAgICB0aGlzLmlkID0gUi5fb2lkKys7XG4gICAgICAgIG5vZGUucmFwaGFlbGlkID0gdGhpcy5pZDtcbiAgICAgICAgdGhpcy5tYXRyaXggPSBSLm1hdHJpeCgpO1xuICAgICAgICB0aGlzLnJlYWxQYXRoID0gbnVsbDtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBFbGVtZW50LnBhcGVyXG4gICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIEludGVybmFsIHJlZmVyZW5jZSB0byDigJxwYXBlcuKAnSB3aGVyZSBvYmplY3QgZHJhd24uIE1haW5seSBmb3IgdXNlIGluIHBsdWdpbnMgYW5kIGVsZW1lbnQgZXh0ZW5zaW9ucy5cbiAgICAgICAgID4gVXNhZ2VcbiAgICAgICAgIHwgUmFwaGFlbC5lbC5jcm9zcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIHwgICAgIHRoaXMuYXR0cih7ZmlsbDogXCJyZWRcIn0pO1xuICAgICAgICAgfCAgICAgdGhpcy5wYXBlci5wYXRoKFwiTTEwLDEwTDUwLDUwTTUwLDEwTDEwLDUwXCIpXG4gICAgICAgICB8ICAgICAgICAgLmF0dHIoe3N0cm9rZTogXCJyZWRcIn0pO1xuICAgICAgICAgfCB9XG4gICAgICAgIFxcKi9cbiAgICAgICAgdGhpcy5wYXBlciA9IHN2ZztcbiAgICAgICAgdGhpcy5hdHRycyA9IHRoaXMuYXR0cnMgfHwge307XG4gICAgICAgIHRoaXMuXyA9IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogW10sXG4gICAgICAgICAgICBzeDogMSxcbiAgICAgICAgICAgIHN5OiAxLFxuICAgICAgICAgICAgZGVnOiAwLFxuICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICBkeTogMCxcbiAgICAgICAgICAgIGRpcnR5OiAxXG4gICAgICAgIH07XG4gICAgICAgICFzdmcuYm90dG9tICYmIChzdmcuYm90dG9tID0gdGhpcyk7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogRWxlbWVudC5wcmV2XG4gICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJlZmVyZW5jZSB0byB0aGUgcHJldmlvdXMgZWxlbWVudCBpbiB0aGUgaGllcmFyY2h5LlxuICAgICAgICBcXCovXG4gICAgICAgIHRoaXMucHJldiA9IHN2Zy50b3A7XG4gICAgICAgIHN2Zy50b3AgJiYgKHN2Zy50b3AubmV4dCA9IHRoaXMpO1xuICAgICAgICBzdmcudG9wID0gdGhpcztcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBFbGVtZW50Lm5leHRcbiAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmVmZXJlbmNlIHRvIHRoZSBuZXh0IGVsZW1lbnQgaW4gdGhlIGhpZXJhcmNoeS5cbiAgICAgICAgXFwqL1xuICAgICAgICB0aGlzLm5leHQgPSBudWxsO1xuICAgIH0sXG4gICAgZWxwcm90byA9IFIuZWw7XG5cbiAgICBFbGVtZW50LnByb3RvdHlwZSA9IGVscHJvdG87XG4gICAgZWxwcm90by5jb25zdHJ1Y3RvciA9IEVsZW1lbnQ7XG5cbiAgICBSLl9lbmdpbmUucGF0aCA9IGZ1bmN0aW9uIChwYXRoU3RyaW5nLCBTVkcpIHtcbiAgICAgICAgdmFyIGVsID0gJChcInBhdGhcIik7XG4gICAgICAgIFNWRy5jYW52YXMgJiYgU1ZHLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciBwID0gbmV3IEVsZW1lbnQoZWwsIFNWRyk7XG4gICAgICAgIHAudHlwZSA9IFwicGF0aFwiO1xuICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHAsIHtcbiAgICAgICAgICAgIGZpbGw6IFwibm9uZVwiLFxuICAgICAgICAgICAgc3Ryb2tlOiBcIiMwMDBcIixcbiAgICAgICAgICAgIHBhdGg6IHBhdGhTdHJpbmdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucm90YXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkISBVc2UgQEVsZW1lbnQudHJhbnNmb3JtIGluc3RlYWQuXG4gICAgICogQWRkcyByb3RhdGlvbiBieSBnaXZlbiBhbmdsZSBhcm91bmQgZ2l2ZW4gcG9pbnQgdG8gdGhlIGxpc3Qgb2ZcbiAgICAgKiB0cmFuc2Zvcm1hdGlvbnMgb2YgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGRlZyAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG4gICAgIC0gY3ggKG51bWJlcikgI29wdGlvbmFsIHggY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlIG9mIHJvdGF0aW9uXG4gICAgIC0gY3kgKG51bWJlcikgI29wdGlvbmFsIHkgY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlIG9mIHJvdGF0aW9uXG4gICAgICogSWYgY3ggJiBjeSBhcmVu4oCZdCBzcGVjaWZpZWQgY2VudHJlIG9mIHRoZSBzaGFwZSBpcyB1c2VkIGFzIGEgcG9pbnQgb2Ygcm90YXRpb24uXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5yb3RhdGUgPSBmdW5jdGlvbiAoZGVnLCBjeCwgY3kpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGVnID0gU3RyKGRlZykuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKGRlZy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBjeCA9IHRvRmxvYXQoZGVnWzFdKTtcbiAgICAgICAgICAgIGN5ID0gdG9GbG9hdChkZWdbMl0pO1xuICAgICAgICB9XG4gICAgICAgIGRlZyA9IHRvRmxvYXQoZGVnWzBdKTtcbiAgICAgICAgKGN5ID09IG51bGwpICYmIChjeCA9IGN5KTtcbiAgICAgICAgaWYgKGN4ID09IG51bGwgfHwgY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGJib3ggPSB0aGlzLmdldEJCb3goMSk7XG4gICAgICAgICAgICBjeCA9IGJib3gueCArIGJib3gud2lkdGggLyAyO1xuICAgICAgICAgICAgY3kgPSBiYm94LnkgKyBiYm94LmhlaWdodCAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50cmFuc2Zvcm0odGhpcy5fLnRyYW5zZm9ybS5jb25jYXQoW1tcInJcIiwgZGVnLCBjeCwgY3ldXSkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnNjYWxlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkISBVc2UgQEVsZW1lbnQudHJhbnNmb3JtIGluc3RlYWQuXG4gICAgICogQWRkcyBzY2FsZSBieSBnaXZlbiBhbW91bnQgcmVsYXRpdmUgdG8gZ2l2ZW4gcG9pbnQgdG8gdGhlIGxpc3Qgb2ZcbiAgICAgKiB0cmFuc2Zvcm1hdGlvbnMgb2YgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHN4IChudW1iZXIpIGhvcmlzb250YWwgc2NhbGUgYW1vdW50XG4gICAgIC0gc3kgKG51bWJlcikgdmVydGljYWwgc2NhbGUgYW1vdW50XG4gICAgIC0gY3ggKG51bWJlcikgI29wdGlvbmFsIHggY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlIG9mIHNjYWxlXG4gICAgIC0gY3kgKG51bWJlcikgI29wdGlvbmFsIHkgY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlIG9mIHNjYWxlXG4gICAgICogSWYgY3ggJiBjeSBhcmVu4oCZdCBzcGVjaWZpZWQgY2VudHJlIG9mIHRoZSBzaGFwZSBpcyB1c2VkIGluc3RlYWQuXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5zY2FsZSA9IGZ1bmN0aW9uIChzeCwgc3ksIGN4LCBjeSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBzeCA9IFN0cihzeCkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKHN4Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHN5ID0gdG9GbG9hdChzeFsxXSk7XG4gICAgICAgICAgICBjeCA9IHRvRmxvYXQoc3hbMl0pO1xuICAgICAgICAgICAgY3kgPSB0b0Zsb2F0KHN4WzNdKTtcbiAgICAgICAgfVxuICAgICAgICBzeCA9IHRvRmxvYXQoc3hbMF0pO1xuICAgICAgICAoc3kgPT0gbnVsbCkgJiYgKHN5ID0gc3gpO1xuICAgICAgICAoY3kgPT0gbnVsbCkgJiYgKGN4ID0gY3kpO1xuICAgICAgICBpZiAoY3ggPT0gbnVsbCB8fCBjeSA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYmJveCA9IHRoaXMuZ2V0QkJveCgxKTtcbiAgICAgICAgfVxuICAgICAgICBjeCA9IGN4ID09IG51bGwgPyBiYm94LnggKyBiYm94LndpZHRoIC8gMiA6IGN4O1xuICAgICAgICBjeSA9IGN5ID09IG51bGwgPyBiYm94LnkgKyBiYm94LmhlaWdodCAvIDIgOiBjeTtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm0odGhpcy5fLnRyYW5zZm9ybS5jb25jYXQoW1tcInNcIiwgc3gsIHN5LCBjeCwgY3ldXSkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRyYW5zbGF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZCEgVXNlIEBFbGVtZW50LnRyYW5zZm9ybSBpbnN0ZWFkLlxuICAgICAqIEFkZHMgdHJhbnNsYXRpb24gYnkgZ2l2ZW4gYW1vdW50IHRvIHRoZSBsaXN0IG9mIHRyYW5zZm9ybWF0aW9ucyBvZiB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gZHggKG51bWJlcikgaG9yaXNvbnRhbCBzaGlmdFxuICAgICAtIGR5IChudW1iZXIpIHZlcnRpY2FsIHNoaWZ0XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by50cmFuc2xhdGUgPSBmdW5jdGlvbiAoZHgsIGR5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGR4ID0gU3RyKGR4KS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICBpZiAoZHgubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgZHkgPSB0b0Zsb2F0KGR4WzFdKTtcbiAgICAgICAgfVxuICAgICAgICBkeCA9IHRvRmxvYXQoZHhbMF0pIHx8IDA7XG4gICAgICAgIGR5ID0gK2R5IHx8IDA7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtKHRoaXMuXy50cmFuc2Zvcm0uY29uY2F0KFtbXCJ0XCIsIGR4LCBkeV1dKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudHJhbnNmb3JtXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIHRyYW5zZm9ybWF0aW9uIHRvIHRoZSBlbGVtZW50IHdoaWNoIGlzIHNlcGFyYXRlIHRvIG90aGVyIGF0dHJpYnV0ZXMsXG4gICAgICogaS5lLiB0cmFuc2xhdGlvbiBkb2VzbuKAmXQgY2hhbmdlIGB4YCBvciBgeWAgb2YgdGhlIHJlY3RhbmdlLiBUaGUgZm9ybWF0XG4gICAgICogb2YgdHJhbnNmb3JtYXRpb24gc3RyaW5nIGlzIHNpbWlsYXIgdG8gdGhlIHBhdGggc3RyaW5nIHN5bnRheDpcbiAgICAgfCBcInQxMDAsMTAwcjMwLDEwMCwxMDBzMiwyLDEwMCwxMDByNDVzMS41XCJcbiAgICAgKiBFYWNoIGxldHRlciBpcyBhIGNvbW1hbmQuIFRoZXJlIGFyZSBmb3VyIGNvbW1hbmRzOiBgdGAgaXMgZm9yIHRyYW5zbGF0ZSwgYHJgIGlzIGZvciByb3RhdGUsIGBzYCBpcyBmb3JcbiAgICAgKiBzY2FsZSBhbmQgYG1gIGlzIGZvciBtYXRyaXguXG4gICAgICpcbiAgICAgKiBUaGVyZSBhcmUgYWxzbyBhbHRlcm5hdGl2ZSDigJxhYnNvbHV0ZeKAnSB0cmFuc2xhdGlvbiwgcm90YXRpb24gYW5kIHNjYWxlOiBgVGAsIGBSYCBhbmQgYFNgLiBUaGV5IHdpbGwgbm90IHRha2UgcHJldmlvdXMgdHJhbnNmb3JtYXRpb24gaW50byBhY2NvdW50LiBGb3IgZXhhbXBsZSwgYC4uLlQxMDAsMGAgd2lsbCBhbHdheXMgbW92ZSBlbGVtZW50IDEwMCBweCBob3Jpc29udGFsbHksIHdoaWxlIGAuLi50MTAwLDBgIGNvdWxkIG1vdmUgaXQgdmVydGljYWxseSBpZiB0aGVyZSBpcyBgcjkwYCBiZWZvcmUuIEp1c3QgY29tcGFyZSByZXN1bHRzIG9mIGByOTB0MTAwLDBgIGFuZCBgcjkwVDEwMCwwYC5cbiAgICAgKlxuICAgICAqIFNvLCB0aGUgZXhhbXBsZSBsaW5lIGFib3ZlIGNvdWxkIGJlIHJlYWQgbGlrZSDigJx0cmFuc2xhdGUgYnkgMTAwLCAxMDA7IHJvdGF0ZSAzMMKwIGFyb3VuZCAxMDAsIDEwMDsgc2NhbGUgdHdpY2UgYXJvdW5kIDEwMCwgMTAwO1xuICAgICAqIHJvdGF0ZSA0NcKwIGFyb3VuZCBjZW50cmU7IHNjYWxlIDEuNSB0aW1lcyByZWxhdGl2ZSB0byBjZW50cmXigJ0uIEFzIHlvdSBjYW4gc2VlIHJvdGF0ZSBhbmQgc2NhbGUgY29tbWFuZHMgaGF2ZSBvcmlnaW5cbiAgICAgKiBjb29yZGluYXRlcyBhcyBvcHRpb25hbCBwYXJhbWV0ZXJzLCB0aGUgZGVmYXVsdCBpcyB0aGUgY2VudHJlIHBvaW50IG9mIHRoZSBlbGVtZW50LlxuICAgICAqIE1hdHJpeCBhY2NlcHRzIHNpeCBwYXJhbWV0ZXJzLlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGVsID0gcGFwZXIucmVjdCgxMCwgMjAsIDMwMCwgMjAwKTtcbiAgICAgfCAvLyB0cmFuc2xhdGUgMTAwLCAxMDAsIHJvdGF0ZSA0NcKwLCB0cmFuc2xhdGUgLTEwMCwgMFxuICAgICB8IGVsLnRyYW5zZm9ybShcInQxMDAsMTAwcjQ1dC0xMDAsMFwiKTtcbiAgICAgfCAvLyBpZiB5b3Ugd2FudCB5b3UgY2FuIGFwcGVuZCBvciBwcmVwZW5kIHRyYW5zZm9ybWF0aW9uc1xuICAgICB8IGVsLnRyYW5zZm9ybShcIi4uLnQ1MCw1MFwiKTtcbiAgICAgfCBlbC50cmFuc2Zvcm0oXCJzMi4uLlwiKTtcbiAgICAgfCAvLyBvciBldmVuIHdyYXBcbiAgICAgfCBlbC50cmFuc2Zvcm0oXCJ0NTAsNTAuLi50LTUwLTUwXCIpO1xuICAgICB8IC8vIHRvIHJlc2V0IHRyYW5zZm9ybWF0aW9uIGNhbGwgbWV0aG9kIHdpdGggZW1wdHkgc3RyaW5nXG4gICAgIHwgZWwudHJhbnNmb3JtKFwiXCIpO1xuICAgICB8IC8vIHRvIGdldCBjdXJyZW50IHZhbHVlIGNhbGwgaXQgd2l0aG91dCBwYXJhbWV0ZXJzXG4gICAgIHwgY29uc29sZS5sb2coZWwudHJhbnNmb3JtKCkpO1xuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSB0c3RyIChzdHJpbmcpICNvcHRpb25hbCB0cmFuc2Zvcm1hdGlvbiBzdHJpbmdcbiAgICAgKiBJZiB0c3RyIGlzbuKAmXQgc3BlY2lmaWVkXG4gICAgID0gKHN0cmluZykgY3VycmVudCB0cmFuc2Zvcm1hdGlvbiBzdHJpbmdcbiAgICAgKiBlbHNlXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbiAodHN0cikge1xuICAgICAgICB2YXIgXyA9IHRoaXMuXztcbiAgICAgICAgaWYgKHRzdHIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIF8udHJhbnNmb3JtO1xuICAgICAgICB9XG4gICAgICAgIFIuX2V4dHJhY3RUcmFuc2Zvcm0odGhpcywgdHN0cik7XG5cbiAgICAgICAgdGhpcy5jbGlwICYmICQodGhpcy5jbGlwLCB7dHJhbnNmb3JtOiB0aGlzLm1hdHJpeC5pbnZlcnQoKX0pO1xuICAgICAgICB0aGlzLnBhdHRlcm4gJiYgdXBkYXRlUG9zaXRpb24odGhpcyk7XG4gICAgICAgIHRoaXMubm9kZSAmJiAkKHRoaXMubm9kZSwge3RyYW5zZm9ybTogdGhpcy5tYXRyaXh9KTtcblxuICAgICAgICBpZiAoXy5zeCAhPSAxIHx8IF8uc3kgIT0gMSkge1xuICAgICAgICAgICAgdmFyIHN3ID0gdGhpcy5hdHRyc1toYXNdKFwic3Ryb2tlLXdpZHRoXCIpID8gdGhpcy5hdHRyc1tcInN0cm9rZS13aWR0aFwiXSA6IDE7XG4gICAgICAgICAgICB0aGlzLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IHN3fSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmhpZGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE1ha2VzIGVsZW1lbnQgaW52aXNpYmxlLiBTZWUgQEVsZW1lbnQuc2hvdy5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICF0aGlzLnJlbW92ZWQgJiYgdGhpcy5wYXBlci5zYWZhcmkodGhpcy5ub2RlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc2hvd1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogTWFrZXMgZWxlbWVudCB2aXNpYmxlLiBTZWUgQEVsZW1lbnQuaGlkZS5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICF0aGlzLnJlbW92ZWQgJiYgdGhpcy5wYXBlci5zYWZhcmkodGhpcy5ub2RlLnN0eWxlLmRpc3BsYXkgPSBcIlwiKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5yZW1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZWxlbWVudCBmcm9tIHRoZSBwYXBlci5cbiAgICBcXCovXG4gICAgZWxwcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlID0gZ2V0UmVhbE5vZGUodGhpcy5ub2RlKTtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCB8fCAhbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcGVyID0gdGhpcy5wYXBlcjtcbiAgICAgICAgcGFwZXIuX19zZXRfXyAmJiBwYXBlci5fX3NldF9fLmV4Y2x1ZGUodGhpcyk7XG4gICAgICAgIGV2ZS51bmJpbmQoXCJyYXBoYWVsLiouKi5cIiArIHRoaXMuaWQpO1xuICAgICAgICBpZiAodGhpcy5ncmFkaWVudCkge1xuICAgICAgICAgICAgcGFwZXIuZGVmcy5yZW1vdmVDaGlsZCh0aGlzLmdyYWRpZW50KTtcbiAgICAgICAgfVxuICAgICAgICBSLl90ZWFyKHRoaXMsIHBhcGVyKTtcblxuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGN1c3RvbSBkYXRhIGZvciBlbGVtZW50XG4gICAgICAgIHRoaXMucmVtb3ZlRGF0YSgpO1xuXG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcykge1xuICAgICAgICAgICAgdGhpc1tpXSA9IHR5cGVvZiB0aGlzW2ldID09IFwiZnVuY3Rpb25cIiA/IFIuX3JlbW92ZWRGYWN0b3J5KGkpIDogbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZWQgPSB0cnVlO1xuICAgIH07XG4gICAgZWxwcm90by5fZ2V0QkJveCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgICAgICAgIHZhciBoaWRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2FudmFzSGlkZGVuID0gZmFsc2UsXG4gICAgICAgICAgICBjb250YWluZXJTdHlsZTtcbiAgICAgICAgaWYgKHRoaXMucGFwZXIuY2FudmFzLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICBjb250YWluZXJTdHlsZSA9IHRoaXMucGFwZXIuY2FudmFzLnBhcmVudEVsZW1lbnQuc3R5bGU7XG4gICAgICAgIH0gLy9JRTEwKyBjYW4ndCBmaW5kIHBhcmVudEVsZW1lbnRcbiAgICAgICAgZWxzZSBpZiAodGhpcy5wYXBlci5jYW52YXMucGFyZW50Tm9kZSkge1xuICAgICAgICAgIGNvbnRhaW5lclN0eWxlID0gdGhpcy5wYXBlci5jYW52YXMucGFyZW50Tm9kZS5zdHlsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGNvbnRhaW5lclN0eWxlICYmIGNvbnRhaW5lclN0eWxlLmRpc3BsYXkgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICBjYW52YXNIaWRkZW4gPSB0cnVlO1xuICAgICAgICAgIGNvbnRhaW5lclN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIHZhciBiYm94ID0ge307XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBiYm94ID0gdGhpcy5ub2RlLmdldEJCb3goKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyBGaXJlZm94IDMuMC54LCAyNS4wLjEgKHByb2JhYmx5IG1vcmUgdmVyc2lvbnMgYWZmZWN0ZWQpIHBsYXkgYmFkbHkgaGVyZSAtIHBvc3NpYmxlIGZpeFxuICAgICAgICAgICAgYmJveCA9IHtcbiAgICAgICAgICAgICAgICB4OiB0aGlzLm5vZGUuY2xpZW50TGVmdCxcbiAgICAgICAgICAgICAgICB5OiB0aGlzLm5vZGUuY2xpZW50VG9wLFxuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLm5vZGUuY2xpZW50V2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLm5vZGUuY2xpZW50SGVpZ2h0XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBiYm94ID0gYmJveCB8fCB7fTtcbiAgICAgICAgICAgIGlmKGNhbnZhc0hpZGRlbil7XG4gICAgICAgICAgICAgIGNvbnRhaW5lclN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBoaWRlICYmIHRoaXMuaGlkZSgpO1xuICAgICAgICByZXR1cm4gYmJveDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmF0dHJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNldHMgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGF0dHJOYW1lIChzdHJpbmcpIGF0dHJpYnV0ZeKAmXMgbmFtZVxuICAgICAtIHZhbHVlIChzdHJpbmcpIHZhbHVlXG4gICAgICogb3JcbiAgICAgLSBwYXJhbXMgKG9iamVjdCkgb2JqZWN0IG9mIG5hbWUvdmFsdWUgcGFpcnNcbiAgICAgKiBvclxuICAgICAtIGF0dHJOYW1lIChzdHJpbmcpIGF0dHJpYnV0ZeKAmXMgbmFtZVxuICAgICAqIG9yXG4gICAgIC0gYXR0ck5hbWVzIChhcnJheSkgaW4gdGhpcyBjYXNlIG1ldGhvZCByZXR1cm5zIGFycmF5IG9mIGN1cnJlbnQgdmFsdWVzIGZvciBnaXZlbiBhdHRyaWJ1dGUgbmFtZXNcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudCBpZiBhdHRyc05hbWUgJiB2YWx1ZSBvciBwYXJhbXMgYXJlIHBhc3NlZCBpbi5cbiAgICAgPSAoLi4uKSB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlIGlmIG9ubHkgYXR0cnNOYW1lIGlzIHBhc3NlZCBpbi5cbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIHZhbHVlcyBvZiB0aGUgYXR0cmlidXRlIGlmIGF0dHJzTmFtZXMgaXMgcGFzc2VkIGluLlxuICAgICA9IChvYmplY3QpIG9iamVjdCBvZiBhdHRyaWJ1dGVzIGlmIG5vdGhpbmcgaXMgcGFzc2VkIGluLlxuICAgICA+IFBvc3NpYmxlIHBhcmFtZXRlcnNcbiAgICAgIyA8cD5QbGVhc2UgcmVmZXIgdG8gdGhlIDxhIGhyZWY9XCJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvXCIgdGl0bGU9XCJUaGUgVzNDIFJlY29tbWVuZGF0aW9uIGZvciB0aGUgU1ZHIGxhbmd1YWdlIGRlc2NyaWJlcyB0aGVzZSBwcm9wZXJ0aWVzIGluIGRldGFpbC5cIj5TVkcgc3BlY2lmaWNhdGlvbjwvYT4gZm9yIGFuIGV4cGxhbmF0aW9uIG9mIHRoZXNlIHBhcmFtZXRlcnMuPC9wPlxuICAgICBvIGFycm93LWVuZCAoc3RyaW5nKSBhcnJvd2hlYWQgb24gdGhlIGVuZCBvZiB0aGUgcGF0aC4gVGhlIGZvcm1hdCBmb3Igc3RyaW5nIGlzIGA8dHlwZT5bLTx3aWR0aD5bLTxsZW5ndGg+XV1gLiBQb3NzaWJsZSB0eXBlczogYGNsYXNzaWNgLCBgYmxvY2tgLCBgb3BlbmAsIGBvdmFsYCwgYGRpYW1vbmRgLCBgbm9uZWAsIHdpZHRoOiBgd2lkZWAsIGBuYXJyb3dgLCBgbWVkaXVtYCwgbGVuZ3RoOiBgbG9uZ2AsIGBzaG9ydGAsIGBtaWRpdW1gLlxuICAgICBvIGNsaXAtcmVjdCAoc3RyaW5nKSBjb21tYSBvciBzcGFjZSBzZXBhcmF0ZWQgdmFsdWVzOiB4LCB5LCB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgIG8gY3Vyc29yIChzdHJpbmcpIENTUyB0eXBlIG9mIHRoZSBjdXJzb3JcbiAgICAgbyBjeCAobnVtYmVyKSB0aGUgeC1heGlzIGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlLCBvciBlbGxpcHNlXG4gICAgIG8gY3kgKG51bWJlcikgdGhlIHktYXhpcyBjb29yZGluYXRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSwgb3IgZWxsaXBzZVxuICAgICBvIGZpbGwgKHN0cmluZykgY29sb3VyLCBncmFkaWVudCBvciBpbWFnZVxuICAgICBvIGZpbGwtb3BhY2l0eSAobnVtYmVyKVxuICAgICBvIGZvbnQgKHN0cmluZylcbiAgICAgbyBmb250LWZhbWlseSAoc3RyaW5nKVxuICAgICBvIGZvbnQtc2l6ZSAobnVtYmVyKSBmb250IHNpemUgaW4gcGl4ZWxzXG4gICAgIG8gZm9udC13ZWlnaHQgKHN0cmluZylcbiAgICAgbyBoZWlnaHQgKG51bWJlcilcbiAgICAgbyBocmVmIChzdHJpbmcpIFVSTCwgaWYgc3BlY2lmaWVkIGVsZW1lbnQgYmVoYXZlcyBhcyBoeXBlcmxpbmtcbiAgICAgbyBvcGFjaXR5IChudW1iZXIpXG4gICAgIG8gcGF0aCAoc3RyaW5nKSBTVkcgcGF0aCBzdHJpbmcgZm9ybWF0XG4gICAgIG8gciAobnVtYmVyKSByYWRpdXMgb2YgdGhlIGNpcmNsZSwgZWxsaXBzZSBvciByb3VuZGVkIGNvcm5lciBvbiB0aGUgcmVjdFxuICAgICBvIHJ4IChudW1iZXIpIGhvcmlzb250YWwgcmFkaXVzIG9mIHRoZSBlbGxpcHNlXG4gICAgIG8gcnkgKG51bWJlcikgdmVydGljYWwgcmFkaXVzIG9mIHRoZSBlbGxpcHNlXG4gICAgIG8gc3JjIChzdHJpbmcpIGltYWdlIFVSTCwgb25seSB3b3JrcyBmb3IgQEVsZW1lbnQuaW1hZ2UgZWxlbWVudFxuICAgICBvIHN0cm9rZSAoc3RyaW5nKSBzdHJva2UgY29sb3VyXG4gICAgIG8gc3Ryb2tlLWRhc2hhcnJheSAoc3RyaW5nKSBb4oCc4oCdLCDigJxgLWDigJ0sIOKAnGAuYOKAnSwg4oCcYC0uYOKAnSwg4oCcYC0uLmDigJ0sIOKAnGAuIGDigJ0sIOKAnGAtIGDigJ0sIOKAnGAtLWDigJ0sIOKAnGAtIC5g4oCdLCDigJxgLS0uYOKAnSwg4oCcYC0tLi5g4oCdXVxuICAgICBvIHN0cm9rZS1saW5lY2FwIChzdHJpbmcpIFvigJxgYnV0dGDigJ0sIOKAnGBzcXVhcmVg4oCdLCDigJxgcm91bmRg4oCdXVxuICAgICBvIHN0cm9rZS1saW5lam9pbiAoc3RyaW5nKSBb4oCcYGJldmVsYOKAnSwg4oCcYHJvdW5kYOKAnSwg4oCcYG1pdGVyYOKAnV1cbiAgICAgbyBzdHJva2UtbWl0ZXJsaW1pdCAobnVtYmVyKVxuICAgICBvIHN0cm9rZS1vcGFjaXR5IChudW1iZXIpXG4gICAgIG8gc3Ryb2tlLXdpZHRoIChudW1iZXIpIHN0cm9rZSB3aWR0aCBpbiBwaXhlbHMsIGRlZmF1bHQgaXMgJzEnXG4gICAgIG8gdGFyZ2V0IChzdHJpbmcpIHVzZWQgd2l0aCBocmVmXG4gICAgIG8gdGV4dCAoc3RyaW5nKSBjb250ZW50cyBvZiB0aGUgdGV4dCBlbGVtZW50LiBVc2UgYFxcbmAgZm9yIG11bHRpbGluZSB0ZXh0XG4gICAgIG8gdGV4dC1hbmNob3IgKHN0cmluZykgW+KAnGBzdGFydGDigJ0sIOKAnGBtaWRkbGVg4oCdLCDigJxgZW5kYOKAnV0sIGRlZmF1bHQgaXMg4oCcYG1pZGRsZWDigJ1cbiAgICAgbyB0aXRsZSAoc3RyaW5nKSB3aWxsIGNyZWF0ZSB0b29sdGlwIHdpdGggYSBnaXZlbiB0ZXh0XG4gICAgIG8gdHJhbnNmb3JtIChzdHJpbmcpIHNlZSBARWxlbWVudC50cmFuc2Zvcm1cbiAgICAgbyB3aWR0aCAobnVtYmVyKVxuICAgICBvIHggKG51bWJlcilcbiAgICAgbyB5IChudW1iZXIpXG4gICAgID4gR3JhZGllbnRzXG4gICAgICogTGluZWFyIGdyYWRpZW50IGZvcm1hdDog4oCcYOKAuWFuZ2xl4oC6LeKAuWNvbG91cuKAulst4oC5Y29sb3Vy4oC6WzrigLlvZmZzZXTigLpdXSot4oC5Y29sb3Vy4oC6YOKAnSwgZXhhbXBsZTog4oCcYDkwLSNmZmYtIzAwMGDigJ0g4oCTIDkwwrBcbiAgICAgKiBncmFkaWVudCBmcm9tIHdoaXRlIHRvIGJsYWNrIG9yIOKAnGAwLSNmZmYtI2YwMDoyMC0jMDAwYOKAnSDigJMgMMKwIGdyYWRpZW50IGZyb20gd2hpdGUgdmlhIHJlZCAoYXQgMjAlKSB0byBibGFjay5cbiAgICAgKlxuICAgICAqIHJhZGlhbCBncmFkaWVudDog4oCcYHJbKOKAuWZ44oC6LCDigLlmeeKAuild4oC5Y29sb3Vy4oC6Wy3igLljb2xvdXLigLpbOuKAuW9mZnNldOKAul1dKi3igLljb2xvdXLigLpg4oCdLCBleGFtcGxlOiDigJxgciNmZmYtIzAwMGDigJ0g4oCTXG4gICAgICogZ3JhZGllbnQgZnJvbSB3aGl0ZSB0byBibGFjayBvciDigJxgcigwLjI1LCAwLjc1KSNmZmYtIzAwMGDigJ0g4oCTIGdyYWRpZW50IGZyb20gd2hpdGUgdG8gYmxhY2sgd2l0aCBmb2N1cyBwb2ludFxuICAgICAqIGF0IDAuMjUsIDAuNzUuIEZvY3VzIHBvaW50IGNvb3JkaW5hdGVzIGFyZSBpbiAwLi4xIHJhbmdlLiBSYWRpYWwgZ3JhZGllbnRzIGNhbiBvbmx5IGJlIGFwcGxpZWQgdG8gY2lyY2xlcyBhbmQgZWxsaXBzZXMuXG4gICAgID4gUGF0aCBTdHJpbmdcbiAgICAgIyA8cD5QbGVhc2UgcmVmZXIgdG8gPGEgaHJlZj1cImh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9wYXRocy5odG1sI1BhdGhEYXRhXCIgdGl0bGU9XCJEZXRhaWxzIG9mIGEgcGF0aOKAmXMgZGF0YSBhdHRyaWJ1dGXigJlzIGZvcm1hdCBhcmUgZGVzY3JpYmVkIGluIHRoZSBTVkcgc3BlY2lmaWNhdGlvbi5cIj5TVkcgZG9jdW1lbnRhdGlvbiByZWdhcmRpbmcgcGF0aCBzdHJpbmc8L2E+LiBSYXBoYcOrbCBmdWxseSBzdXBwb3J0cyBpdC48L3A+XG4gICAgID4gQ29sb3VyIFBhcnNpbmdcbiAgICAgIyA8dWw+XG4gICAgICMgICAgIDxsaT5Db2xvdXIgbmFtZSAo4oCcPGNvZGU+cmVkPC9jb2RlPuKAnSwg4oCcPGNvZGU+Z3JlZW48L2NvZGU+4oCdLCDigJw8Y29kZT5jb3JuZmxvd2VyYmx1ZTwvY29kZT7igJ0sIGV0Yyk8L2xpPlxuICAgICAjICAgICA8bGk+I+KAouKAouKAoiDigJQgc2hvcnRlbmVkIEhUTUwgY29sb3VyOiAo4oCcPGNvZGU+IzAwMDwvY29kZT7igJ0sIOKAnDxjb2RlPiNmYzA8L2NvZGU+4oCdLCBldGMpPC9saT5cbiAgICAgIyAgICAgPGxpPiPigKLigKLigKLigKLigKLigKIg4oCUIGZ1bGwgbGVuZ3RoIEhUTUwgY29sb3VyOiAo4oCcPGNvZGU+IzAwMDAwMDwvY29kZT7igJ0sIOKAnDxjb2RlPiNiZDIzMDA8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5yZ2Io4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIHJlZCwgZ3JlZW4gYW5kIGJsdWUgY2hhbm5lbHPigJkgdmFsdWVzOiAo4oCcPGNvZGU+cmdiKDIwMCwmbmJzcDsxMDAsJm5ic3A7MCk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5yZ2Io4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlOiAo4oCcPGNvZGU+cmdiKDEwMCUsJm5ic3A7MTc1JSwmbmJzcDswJSk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5yZ2JhKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIHJlZCwgZ3JlZW4gYW5kIGJsdWUgY2hhbm5lbHPigJkgdmFsdWVzOiAo4oCcPGNvZGU+cmdiYSgyMDAsJm5ic3A7MTAwLCZuYnNwOzAsIC41KTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPnJnYmEo4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlOiAo4oCcPGNvZGU+cmdiYSgxMDAlLCZuYnNwOzE3NSUsJm5ic3A7MCUsIDUwJSk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2Io4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGh1ZSwgc2F0dXJhdGlvbiBhbmQgYnJpZ2h0bmVzcyB2YWx1ZXM6ICjigJw8Y29kZT5oc2IoMC41LCZuYnNwOzAuMjUsJm5ic3A7MSk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2Io4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlPC9saT5cbiAgICAgIyAgICAgPGxpPmhzYmEo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IHdpdGggb3BhY2l0eTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2wo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGFsbW9zdCB0aGUgc2FtZSBhcyBoc2IsIHNlZSA8YSBocmVmPVwiaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9IU0xfYW5kX0hTVlwiIHRpdGxlPVwiSFNMIGFuZCBIU1YgLSBXaWtpcGVkaWEsIHRoZSBmcmVlIGVuY3ljbG9wZWRpYVwiPldpa2lwZWRpYSBwYWdlPC9hPjwvbGk+XG4gICAgICMgICAgIDxsaT5oc2wo4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlPC9saT5cbiAgICAgIyAgICAgPGxpPmhzbGEo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IHdpdGggb3BhY2l0eTwvbGk+XG4gICAgICMgICAgIDxsaT5PcHRpb25hbGx5IGZvciBoc2IgYW5kIGhzbCB5b3UgY291bGQgc3BlY2lmeSBodWUgYXMgYSBkZWdyZWU6IOKAnDxjb2RlPmhzbCgyNDBkZWcsJm5ic3A7MSwmbmJzcDsuNSk8L2NvZGU+4oCdIG9yLCBpZiB5b3Ugd2FudCB0byBnbyBmYW5jeSwg4oCcPGNvZGU+aHNsKDI0MMKwLCZuYnNwOzEsJm5ic3A7LjUpPC9jb2RlPuKAnTwvbGk+XG4gICAgICMgPC91bD5cbiAgICBcXCovXG4gICAgZWxwcm90by5hdHRyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGEgaW4gdGhpcy5hdHRycykgaWYgKHRoaXMuYXR0cnNbaGFzXShhKSkge1xuICAgICAgICAgICAgICAgIHJlc1thXSA9IHRoaXMuYXR0cnNbYV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuZ3JhZGllbnQgJiYgcmVzLmZpbGwgPT0gXCJub25lXCIgJiYgKHJlcy5maWxsID0gcmVzLmdyYWRpZW50KSAmJiBkZWxldGUgcmVzLmdyYWRpZW50O1xuICAgICAgICAgICAgcmVzLnRyYW5zZm9ybSA9IHRoaXMuXy50cmFuc2Zvcm07XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmIFIuaXMobmFtZSwgXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09IFwiZmlsbFwiICYmIHRoaXMuYXR0cnMuZmlsbCA9PSBcIm5vbmVcIiAmJiB0aGlzLmF0dHJzLmdyYWRpZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXR0cnMuZ3JhZGllbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmFtZSA9PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuXy50cmFuc2Zvcm07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICAgICAgb3V0ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lIGluIHRoaXMuYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0W25hbWVdID0gdGhpcy5hdHRyc1tuYW1lXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFIuaXModGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW25hbWVdLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtuYW1lXSA9IHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1tuYW1lXS5kZWY7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0W25hbWVdID0gUi5fYXZhaWxhYmxlQXR0cnNbbmFtZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGlpIC0gMSA/IG91dCA6IG91dFtuYW1lc1swXV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgUi5pcyhuYW1lLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBvdXQgPSB7fTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb3V0W25hbWVbaV1dID0gdGhpcy5hdHRyKG5hbWVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgcGFyYW1zW25hbWVdID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAobmFtZSAhPSBudWxsICYmIFIuaXMobmFtZSwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgIHBhcmFtcyA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5hdHRyLlwiICsga2V5ICsgXCIuXCIgKyB0aGlzLmlkLCB0aGlzLCBwYXJhbXNba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChrZXkgaW4gdGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzKSBpZiAodGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2hhc10oa2V5KSAmJiBwYXJhbXNbaGFzXShrZXkpICYmIFIuaXModGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2tleV0sIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgIHZhciBwYXIgPSB0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNba2V5XS5hcHBseSh0aGlzLCBbXS5jb25jYXQocGFyYW1zW2tleV0pKTtcbiAgICAgICAgICAgIHRoaXMuYXR0cnNba2V5XSA9IHBhcmFtc1trZXldO1xuICAgICAgICAgICAgZm9yICh2YXIgc3Via2V5IGluIHBhcikgaWYgKHBhcltoYXNdKHN1YmtleSkpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbc3Via2V5XSA9IHBhcltzdWJrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNldEZpbGxBbmRTdHJva2UodGhpcywgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b0Zyb250XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBNb3ZlcyB0aGUgZWxlbWVudCBzbyBpdCBpcyB0aGUgY2xvc2VzdCB0byB0aGUgdmlld2Vy4oCZcyBleWVzLCBvbiB0b3Agb2Ygb3RoZXIgZWxlbWVudHMuXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by50b0Zyb250ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9kZSA9IGdldFJlYWxOb2RlKHRoaXMubm9kZSk7XG4gICAgICAgIG5vZGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgdmFyIHN2ZyA9IHRoaXMucGFwZXI7XG4gICAgICAgIHN2Zy50b3AgIT0gdGhpcyAmJiBSLl90b2Zyb250KHRoaXMsIHN2Zyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG9CYWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBNb3ZlcyB0aGUgZWxlbWVudCBzbyBpdCBpcyB0aGUgZnVydGhlc3QgZnJvbSB0aGUgdmlld2Vy4oCZcyBleWVzLCBiZWhpbmQgb3RoZXIgZWxlbWVudHMuXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by50b0JhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlID0gZ2V0UmVhbE5vZGUodGhpcy5ub2RlKTtcbiAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhcmVudE5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgIFIuX3RvYmFjayh0aGlzLCB0aGlzLnBhcGVyKTtcbiAgICAgICAgdmFyIHN2ZyA9IHRoaXMucGFwZXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaW5zZXJ0QWZ0ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEluc2VydHMgY3VycmVudCBvYmplY3QgYWZ0ZXIgdGhlIGdpdmVuIG9uZS5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmluc2VydEFmdGVyID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCB8fCAhZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbm9kZSA9IGdldFJlYWxOb2RlKHRoaXMubm9kZSk7XG4gICAgICAgIHZhciBhZnRlck5vZGUgPSBnZXRSZWFsTm9kZShlbGVtZW50Lm5vZGUgfHwgZWxlbWVudFtlbGVtZW50Lmxlbmd0aCAtIDFdLm5vZGUpO1xuICAgICAgICBpZiAoYWZ0ZXJOb2RlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBhZnRlck5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgYWZ0ZXJOb2RlLm5leHRTaWJsaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFmdGVyTm9kZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIFIuX2luc2VydGFmdGVyKHRoaXMsIGVsZW1lbnQsIHRoaXMucGFwZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lmluc2VydEJlZm9yZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSW5zZXJ0cyBjdXJyZW50IG9iamVjdCBiZWZvcmUgdGhlIGdpdmVuIG9uZS5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmluc2VydEJlZm9yZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQgfHwgIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5vZGUgPSBnZXRSZWFsTm9kZSh0aGlzLm5vZGUpO1xuICAgICAgICB2YXIgYmVmb3JlTm9kZSA9IGdldFJlYWxOb2RlKGVsZW1lbnQubm9kZSB8fCBlbGVtZW50WzBdLm5vZGUpO1xuICAgICAgICBiZWZvcmVOb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgICBSLl9pbnNlcnRiZWZvcmUodGhpcywgZWxlbWVudCwgdGhpcy5wYXBlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5ibHVyID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgICAgICAgLy8gRXhwZXJpbWVudGFsLiBObyBTYWZhcmkgc3VwcG9ydC4gVXNlIGl0IG9uIHlvdXIgb3duIHJpc2suXG4gICAgICAgIHZhciB0ID0gdGhpcztcbiAgICAgICAgaWYgKCtzaXplICE9PSAwKSB7XG4gICAgICAgICAgICB2YXIgZmx0ciA9ICQoXCJmaWx0ZXJcIiksXG4gICAgICAgICAgICAgICAgYmx1ciA9ICQoXCJmZUdhdXNzaWFuQmx1clwiKTtcbiAgICAgICAgICAgIHQuYXR0cnMuYmx1ciA9IHNpemU7XG4gICAgICAgICAgICBmbHRyLmlkID0gUi5jcmVhdGVVVUlEKCk7XG4gICAgICAgICAgICAkKGJsdXIsIHtzdGREZXZpYXRpb246ICtzaXplIHx8IDEuNX0pO1xuICAgICAgICAgICAgZmx0ci5hcHBlbmRDaGlsZChibHVyKTtcbiAgICAgICAgICAgIHQucGFwZXIuZGVmcy5hcHBlbmRDaGlsZChmbHRyKTtcbiAgICAgICAgICAgIHQuX2JsdXIgPSBmbHRyO1xuICAgICAgICAgICAgJCh0Lm5vZGUsIHtmaWx0ZXI6IFwidXJsKCNcIiArIGZsdHIuaWQgKyBcIilcIn0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHQuX2JsdXIpIHtcbiAgICAgICAgICAgICAgICB0Ll9ibHVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodC5fYmx1cik7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHQuX2JsdXI7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHQuYXR0cnMuYmx1cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHQubm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJmaWx0ZXJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuY2lyY2xlID0gZnVuY3Rpb24gKHN2ZywgeCwgeSwgcikge1xuICAgICAgICB2YXIgZWwgPSAkKFwiY2lyY2xlXCIpO1xuICAgICAgICBzdmcuY2FudmFzICYmIHN2Zy5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgcmVzID0gbmV3IEVsZW1lbnQoZWwsIHN2Zyk7XG4gICAgICAgIHJlcy5hdHRycyA9IHtjeDogeCwgY3k6IHksIHI6IHIsIGZpbGw6IFwibm9uZVwiLCBzdHJva2U6IFwiIzAwMFwifTtcbiAgICAgICAgcmVzLnR5cGUgPSBcImNpcmNsZVwiO1xuICAgICAgICAkKGVsLCByZXMuYXR0cnMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnJlY3QgPSBmdW5jdGlvbiAoc3ZnLCB4LCB5LCB3LCBoLCByKSB7XG4gICAgICAgIHZhciBlbCA9ICQoXCJyZWN0XCIpO1xuICAgICAgICBzdmcuY2FudmFzICYmIHN2Zy5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgcmVzID0gbmV3IEVsZW1lbnQoZWwsIHN2Zyk7XG4gICAgICAgIHJlcy5hdHRycyA9IHt4OiB4LCB5OiB5LCB3aWR0aDogdywgaGVpZ2h0OiBoLCByeDogciB8fCAwLCByeTogciB8fCAwLCBmaWxsOiBcIm5vbmVcIiwgc3Ryb2tlOiBcIiMwMDBcIn07XG4gICAgICAgIHJlcy50eXBlID0gXCJyZWN0XCI7XG4gICAgICAgICQoZWwsIHJlcy5hdHRycyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuZWxsaXBzZSA9IGZ1bmN0aW9uIChzdmcsIHgsIHksIHJ4LCByeSkge1xuICAgICAgICB2YXIgZWwgPSAkKFwiZWxsaXBzZVwiKTtcbiAgICAgICAgc3ZnLmNhbnZhcyAmJiBzdmcuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHJlcyA9IG5ldyBFbGVtZW50KGVsLCBzdmcpO1xuICAgICAgICByZXMuYXR0cnMgPSB7Y3g6IHgsIGN5OiB5LCByeDogcngsIHJ5OiByeSwgZmlsbDogXCJub25lXCIsIHN0cm9rZTogXCIjMDAwXCJ9O1xuICAgICAgICByZXMudHlwZSA9IFwiZWxsaXBzZVwiO1xuICAgICAgICAkKGVsLCByZXMuYXR0cnMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLmltYWdlID0gZnVuY3Rpb24gKHN2Zywgc3JjLCB4LCB5LCB3LCBoKSB7XG4gICAgICAgIHZhciBlbCA9ICQoXCJpbWFnZVwiKTtcbiAgICAgICAgJChlbCwge3g6IHgsIHk6IHksIHdpZHRoOiB3LCBoZWlnaHQ6IGgsIHByZXNlcnZlQXNwZWN0UmF0aW86IFwibm9uZVwifSk7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKHhsaW5rLCBcImhyZWZcIiwgc3JjKTtcbiAgICAgICAgc3ZnLmNhbnZhcyAmJiBzdmcuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHJlcyA9IG5ldyBFbGVtZW50KGVsLCBzdmcpO1xuICAgICAgICByZXMuYXR0cnMgPSB7eDogeCwgeTogeSwgd2lkdGg6IHcsIGhlaWdodDogaCwgc3JjOiBzcmN9O1xuICAgICAgICByZXMudHlwZSA9IFwiaW1hZ2VcIjtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS50ZXh0ID0gZnVuY3Rpb24gKHN2ZywgeCwgeSwgdGV4dCkge1xuICAgICAgICB2YXIgZWwgPSAkKFwidGV4dFwiKTtcbiAgICAgICAgc3ZnLmNhbnZhcyAmJiBzdmcuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHJlcyA9IG5ldyBFbGVtZW50KGVsLCBzdmcpO1xuICAgICAgICByZXMuYXR0cnMgPSB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIFwidGV4dC1hbmNob3JcIjogXCJtaWRkbGVcIixcbiAgICAgICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgICBcImZvbnQtZmFtaWx5XCI6IFIuX2F2YWlsYWJsZUF0dHJzW1wiZm9udC1mYW1pbHlcIl0sXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBSLl9hdmFpbGFibGVBdHRyc1tcImZvbnQtc2l6ZVwiXSxcbiAgICAgICAgICAgIHN0cm9rZTogXCJub25lXCIsXG4gICAgICAgICAgICBmaWxsOiBcIiMwMDBcIlxuICAgICAgICB9O1xuICAgICAgICByZXMudHlwZSA9IFwidGV4dFwiO1xuICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHJlcywgcmVzLmF0dHJzKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5zZXRTaXplID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoIHx8IHRoaXMud2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0O1xuICAgICAgICB0aGlzLmNhbnZhcy5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCB0aGlzLndpZHRoKTtcbiAgICAgICAgdGhpcy5jYW52YXMuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIHRoaXMuaGVpZ2h0KTtcbiAgICAgICAgaWYgKHRoaXMuX3ZpZXdCb3gpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0Vmlld0JveC5hcHBseSh0aGlzLCB0aGlzLl92aWV3Qm94KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb24gPSBSLl9nZXRDb250YWluZXIuYXBwbHkoMCwgYXJndW1lbnRzKSxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IGNvbiAmJiBjb24uY29udGFpbmVyLFxuICAgICAgICAgICAgeCA9IGNvbi54LFxuICAgICAgICAgICAgeSA9IGNvbi55LFxuICAgICAgICAgICAgd2lkdGggPSBjb24ud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQgPSBjb24uaGVpZ2h0O1xuICAgICAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU1ZHIGNvbnRhaW5lciBub3QgZm91bmQuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjbnZzID0gJChcInN2Z1wiKSxcbiAgICAgICAgICAgIGNzcyA9IFwib3ZlcmZsb3c6aGlkZGVuO1wiLFxuICAgICAgICAgICAgaXNGbG9hdGluZztcbiAgICAgICAgeCA9IHggfHwgMDtcbiAgICAgICAgeSA9IHkgfHwgMDtcbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA1MTI7XG4gICAgICAgIGhlaWdodCA9IGhlaWdodCB8fCAzNDI7XG4gICAgICAgICQoY252cywge1xuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICB2ZXJzaW9uOiAxLjEsXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICB4bWxuczogXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFxuICAgICAgICAgICAgXCJ4bWxuczp4bGlua1wiOiBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIlxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNvbnRhaW5lciA9PSAxKSB7XG4gICAgICAgICAgICBjbnZzLnN0eWxlLmNzc1RleHQgPSBjc3MgKyBcInBvc2l0aW9uOmFic29sdXRlO2xlZnQ6XCIgKyB4ICsgXCJweDt0b3A6XCIgKyB5ICsgXCJweFwiO1xuICAgICAgICAgICAgUi5fZy5kb2MuYm9keS5hcHBlbmRDaGlsZChjbnZzKTtcbiAgICAgICAgICAgIGlzRmxvYXRpbmcgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY252cy5zdHlsZS5jc3NUZXh0ID0gY3NzICsgXCJwb3NpdGlvbjpyZWxhdGl2ZVwiO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lci5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShjbnZzLCBjb250YWluZXIuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjbnZzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250YWluZXIgPSBuZXcgUi5fUGFwZXI7XG4gICAgICAgIGNvbnRhaW5lci53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjb250YWluZXIuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBjb250YWluZXIuY2FudmFzID0gY252cztcbiAgICAgICAgY29udGFpbmVyLmNsZWFyKCk7XG4gICAgICAgIGNvbnRhaW5lci5fbGVmdCA9IGNvbnRhaW5lci5fdG9wID0gMDtcbiAgICAgICAgaXNGbG9hdGluZyAmJiAoY29udGFpbmVyLnJlbmRlcmZpeCA9IGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgY29udGFpbmVyLnJlbmRlcmZpeCgpO1xuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnNldFZpZXdCb3ggPSBmdW5jdGlvbiAoeCwgeSwgdywgaCwgZml0KSB7XG4gICAgICAgIGV2ZShcInJhcGhhZWwuc2V0Vmlld0JveFwiLCB0aGlzLCB0aGlzLl92aWV3Qm94LCBbeCwgeSwgdywgaCwgZml0XSk7XG4gICAgICAgIHZhciBwYXBlclNpemUgPSB0aGlzLmdldFNpemUoKSxcbiAgICAgICAgICAgIHNpemUgPSBtbWF4KHcgLyBwYXBlclNpemUud2lkdGgsIGggLyBwYXBlclNpemUuaGVpZ2h0KSxcbiAgICAgICAgICAgIHRvcCA9IHRoaXMudG9wLFxuICAgICAgICAgICAgYXNwZWN0UmF0aW8gPSBmaXQgPyBcInhNaWRZTWlkIG1lZXRcIiA6IFwieE1pbllNaW5cIixcbiAgICAgICAgICAgIHZiLFxuICAgICAgICAgICAgc3c7XG4gICAgICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl92YlNpemUpIHtcbiAgICAgICAgICAgICAgICBzaXplID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl92YlNpemU7XG4gICAgICAgICAgICB2YiA9IFwiMCAwIFwiICsgdGhpcy53aWR0aCArIFMgKyB0aGlzLmhlaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3ZiU2l6ZSA9IHNpemU7XG4gICAgICAgICAgICB2YiA9IHggKyBTICsgeSArIFMgKyB3ICsgUyArIGg7XG4gICAgICAgIH1cbiAgICAgICAgJCh0aGlzLmNhbnZhcywge1xuICAgICAgICAgICAgdmlld0JveDogdmIsXG4gICAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiBhc3BlY3RSYXRpb1xuICAgICAgICB9KTtcbiAgICAgICAgd2hpbGUgKHNpemUgJiYgdG9wKSB7XG4gICAgICAgICAgICBzdyA9IFwic3Ryb2tlLXdpZHRoXCIgaW4gdG9wLmF0dHJzID8gdG9wLmF0dHJzW1wic3Ryb2tlLXdpZHRoXCJdIDogMTtcbiAgICAgICAgICAgIHRvcC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzd30pO1xuICAgICAgICAgICAgdG9wLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgdG9wLl8uZGlydHlUID0gMTtcbiAgICAgICAgICAgIHRvcCA9IHRvcC5wcmV2O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3ZpZXdCb3ggPSBbeCwgeSwgdywgaCwgISFmaXRdO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5yZW5kZXJmaXhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEZpeGVzIHRoZSBpc3N1ZSBvZiBGaXJlZm94IGFuZCBJRTkgcmVnYXJkaW5nIHN1YnBpeGVsIHJlbmRlcmluZy4gSWYgcGFwZXIgaXMgZGVwZW5kYW50XG4gICAgICogb24gb3RoZXIgZWxlbWVudHMgYWZ0ZXIgcmVmbG93IGl0IGNvdWxkIHNoaWZ0IGhhbGYgcGl4ZWwgd2hpY2ggY2F1c2UgZm9yIGxpbmVzIHRvIGxvc3QgdGhlaXIgY3Jpc3BuZXNzLlxuICAgICAqIFRoaXMgbWV0aG9kIGZpeGVzIHRoZSBpc3N1ZS5cbiAgICAgKipcbiAgICAgICBTcGVjaWFsIHRoYW5rcyB0byBNYXJpdXN6IE5vd2FrIChodHRwOi8vd3d3Lm1lZGlrb28uY29tLykgZm9yIHRoaXMgbWV0aG9kLlxuICAgIFxcKi9cbiAgICBSLnByb3RvdHlwZS5yZW5kZXJmaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjbnZzID0gdGhpcy5jYW52YXMsXG4gICAgICAgICAgICBzID0gY252cy5zdHlsZSxcbiAgICAgICAgICAgIHBvcztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBvcyA9IGNudnMuZ2V0U2NyZWVuQ1RNKCkgfHwgY252cy5jcmVhdGVTVkdNYXRyaXgoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcG9zID0gY252cy5jcmVhdGVTVkdNYXRyaXgoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVmdCA9IC1wb3MuZSAlIDEsXG4gICAgICAgICAgICB0b3AgPSAtcG9zLmYgJSAxO1xuICAgICAgICBpZiAobGVmdCB8fCB0b3ApIHtcbiAgICAgICAgICAgIGlmIChsZWZ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGVmdCA9ICh0aGlzLl9sZWZ0ICsgbGVmdCkgJSAxO1xuICAgICAgICAgICAgICAgIHMubGVmdCA9IHRoaXMuX2xlZnQgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodG9wKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdG9wID0gKHRoaXMuX3RvcCArIHRvcCkgJSAxO1xuICAgICAgICAgICAgICAgIHMudG9wID0gdGhpcy5fdG9wICsgXCJweFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuY2xlYXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENsZWFycyB0aGUgcGFwZXIsIGkuZS4gcmVtb3ZlcyBhbGwgdGhlIGVsZW1lbnRzLlxuICAgIFxcKi9cbiAgICBSLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUi5ldmUoXCJyYXBoYWVsLmNsZWFyXCIsIHRoaXMpO1xuICAgICAgICB2YXIgYyA9IHRoaXMuY2FudmFzO1xuICAgICAgICB3aGlsZSAoYy5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICBjLnJlbW92ZUNoaWxkKGMuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ib3R0b20gPSB0aGlzLnRvcCA9IG51bGw7XG4gICAgICAgICh0aGlzLmRlc2MgPSAkKFwiZGVzY1wiKSkuYXBwZW5kQ2hpbGQoUi5fZy5kb2MuY3JlYXRlVGV4dE5vZGUoXCJDcmVhdGVkIHdpdGggUmFwaGFcXHhlYmwgXCIgKyBSLnZlcnNpb24pKTtcbiAgICAgICAgYy5hcHBlbmRDaGlsZCh0aGlzLmRlc2MpO1xuICAgICAgICBjLmFwcGVuZENoaWxkKHRoaXMuZGVmcyA9ICQoXCJkZWZzXCIpKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5yZW1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgdGhlIHBhcGVyIGZyb20gdGhlIERPTS5cbiAgICBcXCovXG4gICAgUi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBldmUoXCJyYXBoYWVsLnJlbW92ZVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZSAmJiB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuY2FudmFzKTtcbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW2ldID0gdHlwZW9mIHRoaXNbaV0gPT0gXCJmdW5jdGlvblwiID8gUi5fcmVtb3ZlZEZhY3RvcnkoaSkgOiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgc2V0cHJvdG8gPSBSLnN0O1xuICAgIGZvciAodmFyIG1ldGhvZCBpbiBlbHByb3RvKSBpZiAoZWxwcm90b1toYXNdKG1ldGhvZCkgJiYgIXNldHByb3RvW2hhc10obWV0aG9kKSkge1xuICAgICAgICBzZXRwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIChtZXRob2RuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxbbWV0aG9kbmFtZV0uYXBwbHkoZWwsIGFyZyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShtZXRob2QpO1xuICAgIH1cbn0pKCk7XG5cbi8vIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCBcXFxcXG4vLyDilIIgUmFwaGHDq2wgLSBKYXZhU2NyaXB0IFZlY3RvciBMaWJyYXJ5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgVk1MIE1vZHVsZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMSBEbWl0cnkgQmFyYW5vdnNraXkgKGh0dHA6Ly9yYXBoYWVsanMuY29tKSAgIOKUgiBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTEgU2VuY2hhIExhYnMgKGh0dHA6Ly9zZW5jaGEuY29tKSAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSCIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgKGh0dHA6Ly9yYXBoYWVsanMuY29tL2xpY2Vuc2UuaHRtbCkgbGljZW5zZS4g4pSCIFxcXFxcbi8vIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCBcXFxcXG5cbihmdW5jdGlvbigpe1xuICAgIGlmICghUi52bWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIHRvRmxvYXQgPSBwYXJzZUZsb2F0LFxuICAgICAgICBtYXRoID0gTWF0aCxcbiAgICAgICAgcm91bmQgPSBtYXRoLnJvdW5kLFxuICAgICAgICBtbWF4ID0gbWF0aC5tYXgsXG4gICAgICAgIG1taW4gPSBtYXRoLm1pbixcbiAgICAgICAgYWJzID0gbWF0aC5hYnMsXG4gICAgICAgIGZpbGxTdHJpbmcgPSBcImZpbGxcIixcbiAgICAgICAgc2VwYXJhdG9yID0gL1ssIF0rLyxcbiAgICAgICAgZXZlID0gUi5ldmUsXG4gICAgICAgIG1zID0gXCIgcHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0XCIsXG4gICAgICAgIFMgPSBcIiBcIixcbiAgICAgICAgRSA9IFwiXCIsXG4gICAgICAgIG1hcCA9IHtNOiBcIm1cIiwgTDogXCJsXCIsIEM6IFwiY1wiLCBaOiBcInhcIiwgbTogXCJ0XCIsIGw6IFwiclwiLCBjOiBcInZcIiwgejogXCJ4XCJ9LFxuICAgICAgICBiaXRlcyA9IC8oW2NsbXpdKSw/KFteY2xtel0qKS9naSxcbiAgICAgICAgYmx1cnJlZ2V4cCA9IC8gcHJvZ2lkOlxcUytCbHVyXFwoW15cXCldK1xcKS9nLFxuICAgICAgICB2YWwgPSAvLT9bXixcXHMtXSsvZyxcbiAgICAgICAgY3NzRG90ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7dG9wOjA7d2lkdGg6MXB4O2hlaWdodDoxcHg7YmVoYXZpb3I6dXJsKCNkZWZhdWx0I1ZNTClcIixcbiAgICAgICAgem9vbSA9IDIxNjAwLFxuICAgICAgICBwYXRoVHlwZXMgPSB7cGF0aDogMSwgcmVjdDogMSwgaW1hZ2U6IDF9LFxuICAgICAgICBvdmFsVHlwZXMgPSB7Y2lyY2xlOiAxLCBlbGxpcHNlOiAxfSxcbiAgICAgICAgcGF0aDJ2bWwgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gIC9bYWhxc3R2XS9pZyxcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gUi5fcGF0aFRvQWJzb2x1dGU7XG4gICAgICAgICAgICBTdHIocGF0aCkubWF0Y2godG90YWwpICYmIChjb21tYW5kID0gUi5fcGF0aDJjdXJ2ZSk7XG4gICAgICAgICAgICB0b3RhbCA9IC9bY2xtel0vZztcbiAgICAgICAgICAgIGlmIChjb21tYW5kID09IFIuX3BhdGhUb0Fic29sdXRlICYmICFTdHIocGF0aCkubWF0Y2godG90YWwpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IFN0cihwYXRoKS5yZXBsYWNlKGJpdGVzLCBmdW5jdGlvbiAoYWxsLCBjb21tYW5kLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWxzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01vdmUgPSBjb21tYW5kLnRvTG93ZXJDYXNlKCkgPT0gXCJtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSBtYXBbY29tbWFuZF07XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MucmVwbGFjZSh2YWwsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTW92ZSAmJiB2YWxzLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IHZhbHMgKyBtYXBbY29tbWFuZCA9PSBcIm1cIiA/IFwibFwiIDogXCJMXCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHMucHVzaChyb3VuZCh2YWx1ZSAqIHpvb20pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXMgKyB2YWxzO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcGEgPSBjb21tYW5kKHBhdGgpLCBwLCByO1xuICAgICAgICAgICAgcmVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcCA9IHBhW2ldO1xuICAgICAgICAgICAgICAgIHIgPSBwYVtpXVswXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHIgPT0gXCJ6XCIgJiYgKHIgPSBcInhcIik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDEsIGpqID0gcC5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHIgKz0gcm91bmQocFtqXSAqIHpvb20pICsgKGogIT0gamogLSAxID8gXCIsXCIgOiBFKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzLnB1c2gocik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzLmpvaW4oUyk7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbXBlbnNhdGlvbiA9IGZ1bmN0aW9uIChkZWcsIGR4LCBkeSkge1xuICAgICAgICAgICAgdmFyIG0gPSBSLm1hdHJpeCgpO1xuICAgICAgICAgICAgbS5yb3RhdGUoLWRlZywgLjUsIC41KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZHg6IG0ueChkeCwgZHkpLFxuICAgICAgICAgICAgICAgIGR5OiBtLnkoZHgsIGR5KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0Q29vcmRzID0gZnVuY3Rpb24gKHAsIHN4LCBzeSwgZHgsIGR5LCBkZWcpIHtcbiAgICAgICAgICAgIHZhciBfID0gcC5fLFxuICAgICAgICAgICAgICAgIG0gPSBwLm1hdHJpeCxcbiAgICAgICAgICAgICAgICBmaWxscG9zID0gXy5maWxscG9zLFxuICAgICAgICAgICAgICAgIG8gPSBwLm5vZGUsXG4gICAgICAgICAgICAgICAgcyA9IG8uc3R5bGUsXG4gICAgICAgICAgICAgICAgeSA9IDEsXG4gICAgICAgICAgICAgICAgZmxpcCA9IFwiXCIsXG4gICAgICAgICAgICAgICAgZHhkeSxcbiAgICAgICAgICAgICAgICBreCA9IHpvb20gLyBzeCxcbiAgICAgICAgICAgICAgICBreSA9IHpvb20gLyBzeTtcbiAgICAgICAgICAgIHMudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICBpZiAoIXN4IHx8ICFzeSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG8uY29vcmRzaXplID0gYWJzKGt4KSArIFMgKyBhYnMoa3kpO1xuICAgICAgICAgICAgcy5yb3RhdGlvbiA9IGRlZyAqIChzeCAqIHN5IDwgMCA/IC0xIDogMSk7XG4gICAgICAgICAgICBpZiAoZGVnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSBjb21wZW5zYXRpb24oZGVnLCBkeCwgZHkpO1xuICAgICAgICAgICAgICAgIGR4ID0gYy5keDtcbiAgICAgICAgICAgICAgICBkeSA9IGMuZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzeCA8IDAgJiYgKGZsaXAgKz0gXCJ4XCIpO1xuICAgICAgICAgICAgc3kgPCAwICYmIChmbGlwICs9IFwiIHlcIikgJiYgKHkgPSAtMSk7XG4gICAgICAgICAgICBzLmZsaXAgPSBmbGlwO1xuICAgICAgICAgICAgby5jb29yZG9yaWdpbiA9IChkeCAqIC1reCkgKyBTICsgKGR5ICogLWt5KTtcbiAgICAgICAgICAgIGlmIChmaWxscG9zIHx8IF8uZmlsbHNpemUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsbCA9IG8uZ2V0RWxlbWVudHNCeVRhZ05hbWUoZmlsbFN0cmluZyk7XG4gICAgICAgICAgICAgICAgZmlsbCA9IGZpbGwgJiYgZmlsbFswXTtcbiAgICAgICAgICAgICAgICBvLnJlbW92ZUNoaWxkKGZpbGwpO1xuICAgICAgICAgICAgICAgIGlmIChmaWxscG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIGMgPSBjb21wZW5zYXRpb24oZGVnLCBtLngoZmlsbHBvc1swXSwgZmlsbHBvc1sxXSksIG0ueShmaWxscG9zWzBdLCBmaWxscG9zWzFdKSk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwucG9zaXRpb24gPSBjLmR4ICogeSArIFMgKyBjLmR5ICogeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF8uZmlsbHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5zaXplID0gXy5maWxsc2l6ZVswXSAqIGFicyhzeCkgKyBTICsgXy5maWxsc2l6ZVsxXSAqIGFicyhzeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG8uYXBwZW5kQ2hpbGQoZmlsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcbiAgICAgICAgfTtcbiAgICBSLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIFwiWW91ciBicm93c2VyIGRvZXNuXFx1MjAxOXQgc3VwcG9ydCBTVkcuIEZhbGxpbmcgZG93biB0byBWTUwuXFxuWW91IGFyZSBydW5uaW5nIFJhcGhhXFx4ZWJsIFwiICsgdGhpcy52ZXJzaW9uO1xuICAgIH07XG4gICAgdmFyIGFkZEFycm93ID0gZnVuY3Rpb24gKG8sIHZhbHVlLCBpc0VuZCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gU3RyKHZhbHVlKS50b0xvd2VyQ2FzZSgpLnNwbGl0KFwiLVwiKSxcbiAgICAgICAgICAgIHNlID0gaXNFbmQgPyBcImVuZFwiIDogXCJzdGFydFwiLFxuICAgICAgICAgICAgaSA9IHZhbHVlcy5sZW5ndGgsXG4gICAgICAgICAgICB0eXBlID0gXCJjbGFzc2ljXCIsXG4gICAgICAgICAgICB3ID0gXCJtZWRpdW1cIixcbiAgICAgICAgICAgIGggPSBcIm1lZGl1bVwiO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHZhbHVlc1tpXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJjbGFzc2ljXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIm92YWxcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiZGlhbW9uZFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJvcGVuXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIm5vbmVcIjpcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIndpZGVcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwibmFycm93XCI6IGggPSB2YWx1ZXNbaV07IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJsb25nXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInNob3J0XCI6IHcgPSB2YWx1ZXNbaV07IGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBzdHJva2UgPSBvLm5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdHJva2VcIilbMF07XG4gICAgICAgIHN0cm9rZVtzZSArIFwiYXJyb3dcIl0gPSB0eXBlO1xuICAgICAgICBzdHJva2Vbc2UgKyBcImFycm93bGVuZ3RoXCJdID0gdztcbiAgICAgICAgc3Ryb2tlW3NlICsgXCJhcnJvd3dpZHRoXCJdID0gaDtcbiAgICB9LFxuICAgIHNldEZpbGxBbmRTdHJva2UgPSBmdW5jdGlvbiAobywgcGFyYW1zKSB7XG4gICAgICAgIC8vIG8ucGFwZXIuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgby5hdHRycyA9IG8uYXR0cnMgfHwge307XG4gICAgICAgIHZhciBub2RlID0gby5ub2RlLFxuICAgICAgICAgICAgYSA9IG8uYXR0cnMsXG4gICAgICAgICAgICBzID0gbm9kZS5zdHlsZSxcbiAgICAgICAgICAgIHh5LFxuICAgICAgICAgICAgbmV3cGF0aCA9IHBhdGhUeXBlc1tvLnR5cGVdICYmIChwYXJhbXMueCAhPSBhLnggfHwgcGFyYW1zLnkgIT0gYS55IHx8IHBhcmFtcy53aWR0aCAhPSBhLndpZHRoIHx8IHBhcmFtcy5oZWlnaHQgIT0gYS5oZWlnaHQgfHwgcGFyYW1zLmN4ICE9IGEuY3ggfHwgcGFyYW1zLmN5ICE9IGEuY3kgfHwgcGFyYW1zLnJ4ICE9IGEucnggfHwgcGFyYW1zLnJ5ICE9IGEucnkgfHwgcGFyYW1zLnIgIT0gYS5yKSxcbiAgICAgICAgICAgIGlzT3ZhbCA9IG92YWxUeXBlc1tvLnR5cGVdICYmIChhLmN4ICE9IHBhcmFtcy5jeCB8fCBhLmN5ICE9IHBhcmFtcy5jeSB8fCBhLnIgIT0gcGFyYW1zLnIgfHwgYS5yeCAhPSBwYXJhbXMucnggfHwgYS5yeSAhPSBwYXJhbXMucnkpLFxuICAgICAgICAgICAgcmVzID0gbztcblxuXG4gICAgICAgIGZvciAodmFyIHBhciBpbiBwYXJhbXMpIGlmIChwYXJhbXNbaGFzXShwYXIpKSB7XG4gICAgICAgICAgICBhW3Bhcl0gPSBwYXJhbXNbcGFyXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV3cGF0aCkge1xuICAgICAgICAgICAgYS5wYXRoID0gUi5fZ2V0UGF0aFtvLnR5cGVdKG8pO1xuICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBwYXJhbXMuaHJlZiAmJiAobm9kZS5ocmVmID0gcGFyYW1zLmhyZWYpO1xuICAgICAgICBwYXJhbXMudGl0bGUgJiYgKG5vZGUudGl0bGUgPSBwYXJhbXMudGl0bGUpO1xuICAgICAgICBwYXJhbXMudGFyZ2V0ICYmIChub2RlLnRhcmdldCA9IHBhcmFtcy50YXJnZXQpO1xuICAgICAgICBwYXJhbXMuY3Vyc29yICYmIChzLmN1cnNvciA9IHBhcmFtcy5jdXJzb3IpO1xuICAgICAgICBcImJsdXJcIiBpbiBwYXJhbXMgJiYgby5ibHVyKHBhcmFtcy5ibHVyKTtcbiAgICAgICAgaWYgKHBhcmFtcy5wYXRoICYmIG8udHlwZSA9PSBcInBhdGhcIiB8fCBuZXdwYXRoKSB7XG4gICAgICAgICAgICBub2RlLnBhdGggPSBwYXRoMnZtbCh+U3RyKGEucGF0aCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKFwiclwiKSA/IFIuX3BhdGhUb0Fic29sdXRlKGEucGF0aCkgOiBhLnBhdGgpO1xuICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgIGlmIChvLnR5cGUgPT0gXCJpbWFnZVwiKSB7XG4gICAgICAgICAgICAgICAgby5fLmZpbGxwb3MgPSBbYS54LCBhLnldO1xuICAgICAgICAgICAgICAgIG8uXy5maWxsc2l6ZSA9IFthLndpZHRoLCBhLmhlaWdodF07XG4gICAgICAgICAgICAgICAgc2V0Q29vcmRzKG8sIDEsIDEsIDAsIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFwidHJhbnNmb3JtXCIgaW4gcGFyYW1zICYmIG8udHJhbnNmb3JtKHBhcmFtcy50cmFuc2Zvcm0pO1xuICAgICAgICBpZiAoaXNPdmFsKSB7XG4gICAgICAgICAgICB2YXIgY3ggPSArYS5jeCxcbiAgICAgICAgICAgICAgICBjeSA9ICthLmN5LFxuICAgICAgICAgICAgICAgIHJ4ID0gK2EucnggfHwgK2EuciB8fCAwLFxuICAgICAgICAgICAgICAgIHJ5ID0gK2EucnkgfHwgK2EuciB8fCAwO1xuICAgICAgICAgICAgbm9kZS5wYXRoID0gUi5mb3JtYXQoXCJhcnswfSx7MX0sezJ9LHszfSx7NH0sezF9LHs0fSx7MX14XCIsIHJvdW5kKChjeCAtIHJ4KSAqIHpvb20pLCByb3VuZCgoY3kgLSByeSkgKiB6b29tKSwgcm91bmQoKGN4ICsgcngpICogem9vbSksIHJvdW5kKChjeSArIHJ5KSAqIHpvb20pLCByb3VuZChjeCAqIHpvb20pKTtcbiAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiY2xpcC1yZWN0XCIgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICB2YXIgcmVjdCA9IFN0cihwYXJhbXNbXCJjbGlwLXJlY3RcIl0pLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgICAgICBpZiAocmVjdC5sZW5ndGggPT0gNCkge1xuICAgICAgICAgICAgICAgIHJlY3RbMl0gPSArcmVjdFsyXSArICgrcmVjdFswXSk7XG4gICAgICAgICAgICAgICAgcmVjdFszXSA9ICtyZWN0WzNdICsgKCtyZWN0WzFdKTtcbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gbm9kZS5jbGlwUmVjdCB8fCBSLl9nLmRvYy5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuICAgICAgICAgICAgICAgICAgICBkc3R5bGUgPSBkaXYuc3R5bGU7XG4gICAgICAgICAgICAgICAgZHN0eWxlLmNsaXAgPSBSLmZvcm1hdChcInJlY3QoezF9cHggezJ9cHggezN9cHggezB9cHgpXCIsIHJlY3QpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZS5jbGlwUmVjdCkge1xuICAgICAgICAgICAgICAgICAgICBkc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgICAgICAgICAgIGRzdHlsZS50b3AgPSAwO1xuICAgICAgICAgICAgICAgICAgICBkc3R5bGUubGVmdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGRzdHlsZS53aWR0aCA9IG8ucGFwZXIud2lkdGggKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgICAgIGRzdHlsZS5oZWlnaHQgPSBvLnBhcGVyLmhlaWdodCArIFwicHhcIjtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShkaXYsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY2xpcFJlY3QgPSBkaXY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwYXJhbXNbXCJjbGlwLXJlY3RcIl0pIHtcbiAgICAgICAgICAgICAgICBub2RlLmNsaXBSZWN0ICYmIChub2RlLmNsaXBSZWN0LnN0eWxlLmNsaXAgPSBcImF1dG9cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG8udGV4dHBhdGgpIHtcbiAgICAgICAgICAgIHZhciB0ZXh0cGF0aFN0eWxlID0gby50ZXh0cGF0aC5zdHlsZTtcbiAgICAgICAgICAgIHBhcmFtcy5mb250ICYmICh0ZXh0cGF0aFN0eWxlLmZvbnQgPSBwYXJhbXMuZm9udCk7XG4gICAgICAgICAgICBwYXJhbXNbXCJmb250LWZhbWlseVwiXSAmJiAodGV4dHBhdGhTdHlsZS5mb250RmFtaWx5ID0gJ1wiJyArIHBhcmFtc1tcImZvbnQtZmFtaWx5XCJdLnNwbGl0KFwiLFwiKVswXS5yZXBsYWNlKC9eWydcIl0rfFsnXCJdKyQvZywgRSkgKyAnXCInKTtcbiAgICAgICAgICAgIHBhcmFtc1tcImZvbnQtc2l6ZVwiXSAmJiAodGV4dHBhdGhTdHlsZS5mb250U2l6ZSA9IHBhcmFtc1tcImZvbnQtc2l6ZVwiXSk7XG4gICAgICAgICAgICBwYXJhbXNbXCJmb250LXdlaWdodFwiXSAmJiAodGV4dHBhdGhTdHlsZS5mb250V2VpZ2h0ID0gcGFyYW1zW1wiZm9udC13ZWlnaHRcIl0pO1xuICAgICAgICAgICAgcGFyYW1zW1wiZm9udC1zdHlsZVwiXSAmJiAodGV4dHBhdGhTdHlsZS5mb250U3R5bGUgPSBwYXJhbXNbXCJmb250LXN0eWxlXCJdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJhcnJvdy1zdGFydFwiIGluIHBhcmFtcykge1xuICAgICAgICAgICAgYWRkQXJyb3cocmVzLCBwYXJhbXNbXCJhcnJvdy1zdGFydFwiXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiYXJyb3ctZW5kXCIgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICBhZGRBcnJvdyhyZXMsIHBhcmFtc1tcImFycm93LWVuZFwiXSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcmFtcy5vcGFjaXR5ICE9IG51bGwgfHwgXG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2Utd2lkdGhcIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zLmZpbGwgIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zLnNyYyAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXMuc3Ryb2tlICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2Utb3BhY2l0eVwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXNbXCJmaWxsLW9wYWNpdHlcIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWRhc2hhcnJheVwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbWl0ZXJsaW1pdFwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbGluZWpvaW5cIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWxpbmVjYXBcIl0gIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGZpbGwgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKGZpbGxTdHJpbmcpLFxuICAgICAgICAgICAgICAgIG5ld2ZpbGwgPSBmYWxzZTtcbiAgICAgICAgICAgIGZpbGwgPSBmaWxsICYmIGZpbGxbMF07XG4gICAgICAgICAgICAhZmlsbCAmJiAobmV3ZmlsbCA9IGZpbGwgPSBjcmVhdGVOb2RlKGZpbGxTdHJpbmcpKTtcbiAgICAgICAgICAgIGlmIChvLnR5cGUgPT0gXCJpbWFnZVwiICYmIHBhcmFtcy5zcmMpIHtcbiAgICAgICAgICAgICAgICBmaWxsLnNyYyA9IHBhcmFtcy5zcmM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJhbXMuZmlsbCAmJiAoZmlsbC5vbiA9IHRydWUpO1xuICAgICAgICAgICAgaWYgKGZpbGwub24gPT0gbnVsbCB8fCBwYXJhbXMuZmlsbCA9PSBcIm5vbmVcIiB8fCBwYXJhbXMuZmlsbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZpbGwub24gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWxsLm9uICYmIHBhcmFtcy5maWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzVVJMID0gU3RyKHBhcmFtcy5maWxsKS5tYXRjaChSLl9JU1VSTCk7XG4gICAgICAgICAgICAgICAgaWYgKGlzVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwucGFyZW50Tm9kZSA9PSBub2RlICYmIG5vZGUucmVtb3ZlQ2hpbGQoZmlsbCk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwucm90YXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5zcmMgPSBpc1VSTFsxXTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC50eXBlID0gXCJ0aWxlXCI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYm94ID0gby5nZXRCQm94KDEpO1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnBvc2l0aW9uID0gYmJveC54ICsgUyArIGJib3gueTtcbiAgICAgICAgICAgICAgICAgICAgby5fLmZpbGxwb3MgPSBbYmJveC54LCBiYm94LnldO1xuXG4gICAgICAgICAgICAgICAgICAgIFIuX3ByZWxvYWQoaXNVUkxbMV0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5maWxsc2l6ZSA9IFt0aGlzLm9mZnNldFdpZHRoLCB0aGlzLm9mZnNldEhlaWdodF07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwuY29sb3IgPSBSLmdldFJHQihwYXJhbXMuZmlsbCkuaGV4O1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnNyYyA9IEU7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwudHlwZSA9IFwic29saWRcIjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFIuZ2V0UkdCKHBhcmFtcy5maWxsKS5lcnJvciAmJiAocmVzLnR5cGUgaW4ge2NpcmNsZTogMSwgZWxsaXBzZTogMX0gfHwgU3RyKHBhcmFtcy5maWxsKS5jaGFyQXQoKSAhPSBcInJcIikgJiYgYWRkR3JhZGllbnRGaWxsKHJlcywgcGFyYW1zLmZpbGwsIGZpbGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhLmZpbGwgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEuZ3JhZGllbnQgPSBwYXJhbXMuZmlsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGwucm90YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXCJmaWxsLW9wYWNpdHlcIiBpbiBwYXJhbXMgfHwgXCJvcGFjaXR5XCIgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wYWNpdHkgPSAoKCthW1wiZmlsbC1vcGFjaXR5XCJdICsgMSB8fCAyKSAtIDEpICogKCgrYS5vcGFjaXR5ICsgMSB8fCAyKSAtIDEpICogKCgrUi5nZXRSR0IocGFyYW1zLmZpbGwpLm8gKyAxIHx8IDIpIC0gMSk7XG4gICAgICAgICAgICAgICAgb3BhY2l0eSA9IG1taW4obW1heChvcGFjaXR5LCAwKSwgMSk7XG4gICAgICAgICAgICAgICAgZmlsbC5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgICAgICAgICAgICBpZiAoZmlsbC5zcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5jb2xvciA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoZmlsbCk7XG4gICAgICAgICAgICB2YXIgc3Ryb2tlID0gKG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdHJva2VcIikgJiYgbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN0cm9rZVwiKVswXSksXG4gICAgICAgICAgICBuZXdzdHJva2UgPSBmYWxzZTtcbiAgICAgICAgICAgICFzdHJva2UgJiYgKG5ld3N0cm9rZSA9IHN0cm9rZSA9IGNyZWF0ZU5vZGUoXCJzdHJva2VcIikpO1xuICAgICAgICAgICAgaWYgKChwYXJhbXMuc3Ryb2tlICYmIHBhcmFtcy5zdHJva2UgIT0gXCJub25lXCIpIHx8XG4gICAgICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLXdpZHRoXCJdIHx8XG4gICAgICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLW9wYWNpdHlcIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1kYXNoYXJyYXlcIl0gfHxcbiAgICAgICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbWl0ZXJsaW1pdFwiXSB8fFxuICAgICAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1saW5lam9pblwiXSB8fFxuICAgICAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1saW5lY2FwXCJdKSB7XG4gICAgICAgICAgICAgICAgc3Ryb2tlLm9uID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIChwYXJhbXMuc3Ryb2tlID09IFwibm9uZVwiIHx8IHBhcmFtcy5zdHJva2UgPT09IG51bGwgfHwgc3Ryb2tlLm9uID09IG51bGwgfHwgcGFyYW1zLnN0cm9rZSA9PSAwIHx8IHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSA9PSAwKSAmJiAoc3Ryb2tlLm9uID0gZmFsc2UpO1xuICAgICAgICAgICAgdmFyIHN0cm9rZUNvbG9yID0gUi5nZXRSR0IocGFyYW1zLnN0cm9rZSk7XG4gICAgICAgICAgICBzdHJva2Uub24gJiYgcGFyYW1zLnN0cm9rZSAmJiAoc3Ryb2tlLmNvbG9yID0gc3Ryb2tlQ29sb3IuaGV4KTtcbiAgICAgICAgICAgIG9wYWNpdHkgPSAoKCthW1wic3Ryb2tlLW9wYWNpdHlcIl0gKyAxIHx8IDIpIC0gMSkgKiAoKCthLm9wYWNpdHkgKyAxIHx8IDIpIC0gMSkgKiAoKCtzdHJva2VDb2xvci5vICsgMSB8fCAyKSAtIDEpO1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gKHRvRmxvYXQocGFyYW1zW1wic3Ryb2tlLXdpZHRoXCJdKSB8fCAxKSAqIC43NTtcbiAgICAgICAgICAgIG9wYWNpdHkgPSBtbWluKG1tYXgob3BhY2l0eSwgMCksIDEpO1xuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLXdpZHRoXCJdID09IG51bGwgJiYgKHdpZHRoID0gYVtcInN0cm9rZS13aWR0aFwiXSk7XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2Utd2lkdGhcIl0gJiYgKHN0cm9rZS53ZWlnaHQgPSB3aWR0aCk7XG4gICAgICAgICAgICB3aWR0aCAmJiB3aWR0aCA8IDEgJiYgKG9wYWNpdHkgKj0gd2lkdGgpICYmIChzdHJva2Uud2VpZ2h0ID0gMSk7XG4gICAgICAgICAgICBzdHJva2Uub3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgICAgIFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWxpbmVqb2luXCJdICYmIChzdHJva2Uuam9pbnN0eWxlID0gcGFyYW1zW1wic3Ryb2tlLWxpbmVqb2luXCJdIHx8IFwibWl0ZXJcIik7XG4gICAgICAgICAgICBzdHJva2UubWl0ZXJsaW1pdCA9IHBhcmFtc1tcInN0cm9rZS1taXRlcmxpbWl0XCJdIHx8IDg7XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbGluZWNhcFwiXSAmJiAoc3Ryb2tlLmVuZGNhcCA9IHBhcmFtc1tcInN0cm9rZS1saW5lY2FwXCJdID09IFwiYnV0dFwiID8gXCJmbGF0XCIgOiBwYXJhbXNbXCJzdHJva2UtbGluZWNhcFwiXSA9PSBcInNxdWFyZVwiID8gXCJzcXVhcmVcIiA6IFwicm91bmRcIik7XG4gICAgICAgICAgICBpZiAoXCJzdHJva2UtZGFzaGFycmF5XCIgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhc2hhcnJheSA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCItXCI6IFwic2hvcnRkYXNoXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLlwiOiBcInNob3J0ZG90XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLS5cIjogXCJzaG9ydGRhc2hkb3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCItLi5cIjogXCJzaG9ydGRhc2hkb3Rkb3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCIuIFwiOiBcImRvdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi0gXCI6IFwiZGFzaFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi0tXCI6IFwibG9uZ2Rhc2hcIixcbiAgICAgICAgICAgICAgICAgICAgXCItIC5cIjogXCJkYXNoZG90XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLS0uXCI6IFwibG9uZ2Rhc2hkb3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCItLS4uXCI6IFwibG9uZ2Rhc2hkb3Rkb3RcIlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc3Ryb2tlLmRhc2hzdHlsZSA9IGRhc2hhcnJheVtoYXNdKHBhcmFtc1tcInN0cm9rZS1kYXNoYXJyYXlcIl0pID8gZGFzaGFycmF5W3BhcmFtc1tcInN0cm9rZS1kYXNoYXJyYXlcIl1dIDogRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld3N0cm9rZSAmJiBub2RlLmFwcGVuZENoaWxkKHN0cm9rZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlcy50eXBlID09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICByZXMucGFwZXIuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSBFO1xuICAgICAgICAgICAgdmFyIHNwYW4gPSByZXMucGFwZXIuc3BhbixcbiAgICAgICAgICAgICAgICBtID0gMTAwLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplID0gYS5mb250ICYmIGEuZm9udC5tYXRjaCgvXFxkKyg/OlxcLlxcZCopPyg/PXB4KS8pO1xuICAgICAgICAgICAgcyA9IHNwYW4uc3R5bGU7XG4gICAgICAgICAgICBhLmZvbnQgJiYgKHMuZm9udCA9IGEuZm9udCk7XG4gICAgICAgICAgICBhW1wiZm9udC1mYW1pbHlcIl0gJiYgKHMuZm9udEZhbWlseSA9IGFbXCJmb250LWZhbWlseVwiXSk7XG4gICAgICAgICAgICBhW1wiZm9udC13ZWlnaHRcIl0gJiYgKHMuZm9udFdlaWdodCA9IGFbXCJmb250LXdlaWdodFwiXSk7XG4gICAgICAgICAgICBhW1wiZm9udC1zdHlsZVwiXSAmJiAocy5mb250U3R5bGUgPSBhW1wiZm9udC1zdHlsZVwiXSk7XG4gICAgICAgICAgICBmb250U2l6ZSA9IHRvRmxvYXQoYVtcImZvbnQtc2l6ZVwiXSB8fCBmb250U2l6ZSAmJiBmb250U2l6ZVswXSkgfHwgMTA7XG4gICAgICAgICAgICBzLmZvbnRTaXplID0gZm9udFNpemUgKiBtICsgXCJweFwiO1xuICAgICAgICAgICAgcmVzLnRleHRwYXRoLnN0cmluZyAmJiAoc3Bhbi5pbm5lckhUTUwgPSBTdHIocmVzLnRleHRwYXRoLnN0cmluZykucmVwbGFjZSgvPC9nLCBcIiYjNjA7XCIpLnJlcGxhY2UoLyYvZywgXCImIzM4O1wiKS5yZXBsYWNlKC9cXG4vZywgXCI8YnI+XCIpKTtcbiAgICAgICAgICAgIHZhciBicmVjdCA9IHNwYW4uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICByZXMuVyA9IGEudyA9IChicmVjdC5yaWdodCAtIGJyZWN0LmxlZnQpIC8gbTtcbiAgICAgICAgICAgIHJlcy5IID0gYS5oID0gKGJyZWN0LmJvdHRvbSAtIGJyZWN0LnRvcCkgLyBtO1xuICAgICAgICAgICAgLy8gcmVzLnBhcGVyLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICByZXMuWCA9IGEueDtcbiAgICAgICAgICAgIHJlcy5ZID0gYS55ICsgcmVzLkggLyAyO1xuXG4gICAgICAgICAgICAoXCJ4XCIgaW4gcGFyYW1zIHx8IFwieVwiIGluIHBhcmFtcykgJiYgKHJlcy5wYXRoLnYgPSBSLmZvcm1hdChcIm17MH0sezF9bHsyfSx7MX1cIiwgcm91bmQoYS54ICogem9vbSksIHJvdW5kKGEueSAqIHpvb20pLCByb3VuZChhLnggKiB6b29tKSArIDEpKTtcbiAgICAgICAgICAgIHZhciBkaXJ0eWF0dHJzID0gW1wieFwiLCBcInlcIiwgXCJ0ZXh0XCIsIFwiZm9udFwiLCBcImZvbnQtZmFtaWx5XCIsIFwiZm9udC13ZWlnaHRcIiwgXCJmb250LXN0eWxlXCIsIFwiZm9udC1zaXplXCJdO1xuICAgICAgICAgICAgZm9yICh2YXIgZCA9IDAsIGRkID0gZGlydHlhdHRycy5sZW5ndGg7IGQgPCBkZDsgZCsrKSBpZiAoZGlydHlhdHRyc1tkXSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICByZXMuXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAgICAgLy8gdGV4dC1hbmNob3IgZW11bGF0aW9uXG4gICAgICAgICAgICBzd2l0Y2ggKGFbXCJ0ZXh0LWFuY2hvclwiXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICAgICAgICAgICAgICByZXMudGV4dHBhdGguc3R5bGVbXCJ2LXRleHQtYWxpZ25cIl0gPSBcImxlZnRcIjtcbiAgICAgICAgICAgICAgICAgICAgcmVzLmJieCA9IHJlcy5XIC8gMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiZW5kXCI6XG4gICAgICAgICAgICAgICAgICAgIHJlcy50ZXh0cGF0aC5zdHlsZVtcInYtdGV4dC1hbGlnblwiXSA9IFwicmlnaHRcIjtcbiAgICAgICAgICAgICAgICAgICAgcmVzLmJieCA9IC1yZXMuVyAvIDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmVzLnRleHRwYXRoLnN0eWxlW1widi10ZXh0LWFsaWduXCJdID0gXCJjZW50ZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgcmVzLmJieCA9IDA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMudGV4dHBhdGguc3R5bGVbXCJ2LXRleHQta2VyblwiXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVzLnBhcGVyLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gRTtcbiAgICB9LFxuICAgIGFkZEdyYWRpZW50RmlsbCA9IGZ1bmN0aW9uIChvLCBncmFkaWVudCwgZmlsbCkge1xuICAgICAgICBvLmF0dHJzID0gby5hdHRycyB8fCB7fTtcbiAgICAgICAgdmFyIGF0dHJzID0gby5hdHRycyxcbiAgICAgICAgICAgIHBvdyA9IE1hdGgucG93LFxuICAgICAgICAgICAgb3BhY2l0eSxcbiAgICAgICAgICAgIG9pbmRleCxcbiAgICAgICAgICAgIHR5cGUgPSBcImxpbmVhclwiLFxuICAgICAgICAgICAgZnhmeSA9IFwiLjUgLjVcIjtcbiAgICAgICAgby5hdHRycy5ncmFkaWVudCA9IGdyYWRpZW50O1xuICAgICAgICBncmFkaWVudCA9IFN0cihncmFkaWVudCkucmVwbGFjZShSLl9yYWRpYWxfZ3JhZGllbnQsIGZ1bmN0aW9uIChhbGwsIGZ4LCBmeSkge1xuICAgICAgICAgICAgdHlwZSA9IFwicmFkaWFsXCI7XG4gICAgICAgICAgICBpZiAoZnggJiYgZnkpIHtcbiAgICAgICAgICAgICAgICBmeCA9IHRvRmxvYXQoZngpO1xuICAgICAgICAgICAgICAgIGZ5ID0gdG9GbG9hdChmeSk7XG4gICAgICAgICAgICAgICAgcG93KGZ4IC0gLjUsIDIpICsgcG93KGZ5IC0gLjUsIDIpID4gLjI1ICYmIChmeSA9IG1hdGguc3FydCguMjUgLSBwb3coZnggLSAuNSwgMikpICogKChmeSA+IC41KSAqIDIgLSAxKSArIC41KTtcbiAgICAgICAgICAgICAgICBmeGZ5ID0gZnggKyBTICsgZnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gRTtcbiAgICAgICAgfSk7XG4gICAgICAgIGdyYWRpZW50ID0gZ3JhZGllbnQuc3BsaXQoL1xccypcXC1cXHMqLyk7XG4gICAgICAgIGlmICh0eXBlID09IFwibGluZWFyXCIpIHtcbiAgICAgICAgICAgIHZhciBhbmdsZSA9IGdyYWRpZW50LnNoaWZ0KCk7XG4gICAgICAgICAgICBhbmdsZSA9IC10b0Zsb2F0KGFuZ2xlKTtcbiAgICAgICAgICAgIGlmIChpc05hTihhbmdsZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZG90cyA9IFIuX3BhcnNlRG90cyhncmFkaWVudCk7XG4gICAgICAgIGlmICghZG90cykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbyA9IG8uc2hhcGUgfHwgby5ub2RlO1xuICAgICAgICBpZiAoZG90cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG8ucmVtb3ZlQ2hpbGQoZmlsbCk7XG4gICAgICAgICAgICBmaWxsLm9uID0gdHJ1ZTtcbiAgICAgICAgICAgIGZpbGwubWV0aG9kID0gXCJub25lXCI7XG4gICAgICAgICAgICBmaWxsLmNvbG9yID0gZG90c1swXS5jb2xvcjtcbiAgICAgICAgICAgIGZpbGwuY29sb3IyID0gZG90c1tkb3RzLmxlbmd0aCAtIDFdLmNvbG9yO1xuICAgICAgICAgICAgdmFyIGNscnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGRvdHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGRvdHNbaV0ub2Zmc2V0ICYmIGNscnMucHVzaChkb3RzW2ldLm9mZnNldCArIFMgKyBkb3RzW2ldLmNvbG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbGwuY29sb3JzID0gY2xycy5sZW5ndGggPyBjbHJzLmpvaW4oKSA6IFwiMCUgXCIgKyBmaWxsLmNvbG9yO1xuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJyYWRpYWxcIikge1xuICAgICAgICAgICAgICAgIGZpbGwudHlwZSA9IFwiZ3JhZGllbnRUaXRsZVwiO1xuICAgICAgICAgICAgICAgIGZpbGwuZm9jdXMgPSBcIjEwMCVcIjtcbiAgICAgICAgICAgICAgICBmaWxsLmZvY3Vzc2l6ZSA9IFwiMCAwXCI7XG4gICAgICAgICAgICAgICAgZmlsbC5mb2N1c3Bvc2l0aW9uID0gZnhmeTtcbiAgICAgICAgICAgICAgICBmaWxsLmFuZ2xlID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZmlsbC5yb3RhdGU9IHRydWU7XG4gICAgICAgICAgICAgICAgZmlsbC50eXBlID0gXCJncmFkaWVudFwiO1xuICAgICAgICAgICAgICAgIGZpbGwuYW5nbGUgPSAoMjcwIC0gYW5nbGUpICUgMzYwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgby5hcHBlbmRDaGlsZChmaWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICB9LFxuICAgIEVsZW1lbnQgPSBmdW5jdGlvbiAobm9kZSwgdm1sKSB7XG4gICAgICAgIHRoaXNbMF0gPSB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICBub2RlLnJhcGhhZWwgPSB0cnVlO1xuICAgICAgICB0aGlzLmlkID0gUi5fb2lkKys7XG4gICAgICAgIG5vZGUucmFwaGFlbGlkID0gdGhpcy5pZDtcbiAgICAgICAgdGhpcy5YID0gMDtcbiAgICAgICAgdGhpcy5ZID0gMDtcbiAgICAgICAgdGhpcy5hdHRycyA9IHt9O1xuICAgICAgICB0aGlzLnBhcGVyID0gdm1sO1xuICAgICAgICB0aGlzLm1hdHJpeCA9IFIubWF0cml4KCk7XG4gICAgICAgIHRoaXMuXyA9IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogW10sXG4gICAgICAgICAgICBzeDogMSxcbiAgICAgICAgICAgIHN5OiAxLFxuICAgICAgICAgICAgZHg6IDAsXG4gICAgICAgICAgICBkeTogMCxcbiAgICAgICAgICAgIGRlZzogMCxcbiAgICAgICAgICAgIGRpcnR5OiAxLFxuICAgICAgICAgICAgZGlydHlUOiAxXG4gICAgICAgIH07XG4gICAgICAgICF2bWwuYm90dG9tICYmICh2bWwuYm90dG9tID0gdGhpcyk7XG4gICAgICAgIHRoaXMucHJldiA9IHZtbC50b3A7XG4gICAgICAgIHZtbC50b3AgJiYgKHZtbC50b3AubmV4dCA9IHRoaXMpO1xuICAgICAgICB2bWwudG9wID0gdGhpcztcbiAgICAgICAgdGhpcy5uZXh0ID0gbnVsbDtcbiAgICB9O1xuICAgIHZhciBlbHByb3RvID0gUi5lbDtcblxuICAgIEVsZW1lbnQucHJvdG90eXBlID0gZWxwcm90bztcbiAgICBlbHByb3RvLmNvbnN0cnVjdG9yID0gRWxlbWVudDtcbiAgICBlbHByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uICh0c3RyKSB7XG4gICAgICAgIGlmICh0c3RyID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl8udHJhbnNmb3JtO1xuICAgICAgICB9XG4gICAgICAgIHZhciB2YnMgPSB0aGlzLnBhcGVyLl92aWV3Qm94U2hpZnQsXG4gICAgICAgICAgICB2YnQgPSB2YnMgPyBcInNcIiArIFt2YnMuc2NhbGUsIHZicy5zY2FsZV0gKyBcIi0xLTF0XCIgKyBbdmJzLmR4LCB2YnMuZHldIDogRSxcbiAgICAgICAgICAgIG9sZHQ7XG4gICAgICAgIGlmICh2YnMpIHtcbiAgICAgICAgICAgIG9sZHQgPSB0c3RyID0gU3RyKHRzdHIpLnJlcGxhY2UoL1xcLnszfXxcXHUyMDI2L2csIHRoaXMuXy50cmFuc2Zvcm0gfHwgRSk7XG4gICAgICAgIH1cbiAgICAgICAgUi5fZXh0cmFjdFRyYW5zZm9ybSh0aGlzLCB2YnQgKyB0c3RyKTtcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMubWF0cml4LmNsb25lKCksXG4gICAgICAgICAgICBza2V3ID0gdGhpcy5za2V3LFxuICAgICAgICAgICAgbyA9IHRoaXMubm9kZSxcbiAgICAgICAgICAgIHNwbGl0LFxuICAgICAgICAgICAgaXNHcmFkID0gflN0cih0aGlzLmF0dHJzLmZpbGwpLmluZGV4T2YoXCItXCIpLFxuICAgICAgICAgICAgaXNQYXR0ID0gIVN0cih0aGlzLmF0dHJzLmZpbGwpLmluZGV4T2YoXCJ1cmwoXCIpO1xuICAgICAgICBtYXRyaXgudHJhbnNsYXRlKDEsIDEpO1xuICAgICAgICBpZiAoaXNQYXR0IHx8IGlzR3JhZCB8fCB0aGlzLnR5cGUgPT0gXCJpbWFnZVwiKSB7XG4gICAgICAgICAgICBza2V3Lm1hdHJpeCA9IFwiMSAwIDAgMVwiO1xuICAgICAgICAgICAgc2tldy5vZmZzZXQgPSBcIjAgMFwiO1xuICAgICAgICAgICAgc3BsaXQgPSBtYXRyaXguc3BsaXQoKTtcbiAgICAgICAgICAgIGlmICgoaXNHcmFkICYmIHNwbGl0Lm5vUm90YXRpb24pIHx8ICFzcGxpdC5pc1NpbXBsZSkge1xuICAgICAgICAgICAgICAgIG8uc3R5bGUuZmlsdGVyID0gbWF0cml4LnRvRmlsdGVyKCk7XG4gICAgICAgICAgICAgICAgdmFyIGJiID0gdGhpcy5nZXRCQm94KCksXG4gICAgICAgICAgICAgICAgICAgIGJidCA9IHRoaXMuZ2V0QkJveCgxKSxcbiAgICAgICAgICAgICAgICAgICAgZHggPSBiYi54IC0gYmJ0LngsXG4gICAgICAgICAgICAgICAgICAgIGR5ID0gYmIueSAtIGJidC55O1xuICAgICAgICAgICAgICAgIG8uY29vcmRvcmlnaW4gPSAoZHggKiAtem9vbSkgKyBTICsgKGR5ICogLXpvb20pO1xuICAgICAgICAgICAgICAgIHNldENvb3Jkcyh0aGlzLCAxLCAxLCBkeCwgZHksIDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvLnN0eWxlLmZpbHRlciA9IEU7XG4gICAgICAgICAgICAgICAgc2V0Q29vcmRzKHRoaXMsIHNwbGl0LnNjYWxleCwgc3BsaXQuc2NhbGV5LCBzcGxpdC5keCwgc3BsaXQuZHksIHNwbGl0LnJvdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvLnN0eWxlLmZpbHRlciA9IEU7XG4gICAgICAgICAgICBza2V3Lm1hdHJpeCA9IFN0cihtYXRyaXgpO1xuICAgICAgICAgICAgc2tldy5vZmZzZXQgPSBtYXRyaXgub2Zmc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9sZHQgIT09IG51bGwpIHsgLy8gZW1wdHkgc3RyaW5nIHZhbHVlIGlzIHRydWUgYXMgd2VsbFxuICAgICAgICAgICAgdGhpcy5fLnRyYW5zZm9ybSA9IG9sZHQ7XG4gICAgICAgICAgICBSLl9leHRyYWN0VHJhbnNmb3JtKHRoaXMsIG9sZHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5yb3RhdGUgPSBmdW5jdGlvbiAoZGVnLCBjeCwgY3kpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZGVnID0gU3RyKGRlZykuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKGRlZy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBjeCA9IHRvRmxvYXQoZGVnWzFdKTtcbiAgICAgICAgICAgIGN5ID0gdG9GbG9hdChkZWdbMl0pO1xuICAgICAgICB9XG4gICAgICAgIGRlZyA9IHRvRmxvYXQoZGVnWzBdKTtcbiAgICAgICAgKGN5ID09IG51bGwpICYmIChjeCA9IGN5KTtcbiAgICAgICAgaWYgKGN4ID09IG51bGwgfHwgY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGJib3ggPSB0aGlzLmdldEJCb3goMSk7XG4gICAgICAgICAgICBjeCA9IGJib3gueCArIGJib3gud2lkdGggLyAyO1xuICAgICAgICAgICAgY3kgPSBiYm94LnkgKyBiYm94LmhlaWdodCAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fLmRpcnR5VCA9IDE7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtKHRoaXMuXy50cmFuc2Zvcm0uY29uY2F0KFtbXCJyXCIsIGRlZywgY3gsIGN5XV0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIChkeCwgZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZHggPSBTdHIoZHgpLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIGlmIChkeC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBkeSA9IHRvRmxvYXQoZHhbMV0pO1xuICAgICAgICB9XG4gICAgICAgIGR4ID0gdG9GbG9hdChkeFswXSkgfHwgMDtcbiAgICAgICAgZHkgPSArZHkgfHwgMDtcbiAgICAgICAgaWYgKHRoaXMuXy5iYm94KSB7XG4gICAgICAgICAgICB0aGlzLl8uYmJveC54ICs9IGR4O1xuICAgICAgICAgICAgdGhpcy5fLmJib3gueSArPSBkeTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyYW5zZm9ybSh0aGlzLl8udHJhbnNmb3JtLmNvbmNhdChbW1widFwiLCBkeCwgZHldXSkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8uc2NhbGUgPSBmdW5jdGlvbiAoc3gsIHN5LCBjeCwgY3kpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgc3ggPSBTdHIoc3gpLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIGlmIChzeC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBzeSA9IHRvRmxvYXQoc3hbMV0pO1xuICAgICAgICAgICAgY3ggPSB0b0Zsb2F0KHN4WzJdKTtcbiAgICAgICAgICAgIGN5ID0gdG9GbG9hdChzeFszXSk7XG4gICAgICAgICAgICBpc05hTihjeCkgJiYgKGN4ID0gbnVsbCk7XG4gICAgICAgICAgICBpc05hTihjeSkgJiYgKGN5ID0gbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgc3ggPSB0b0Zsb2F0KHN4WzBdKTtcbiAgICAgICAgKHN5ID09IG51bGwpICYmIChzeSA9IHN4KTtcbiAgICAgICAgKGN5ID09IG51bGwpICYmIChjeCA9IGN5KTtcbiAgICAgICAgaWYgKGN4ID09IG51bGwgfHwgY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGJib3ggPSB0aGlzLmdldEJCb3goMSk7XG4gICAgICAgIH1cbiAgICAgICAgY3ggPSBjeCA9PSBudWxsID8gYmJveC54ICsgYmJveC53aWR0aCAvIDIgOiBjeDtcbiAgICAgICAgY3kgPSBjeSA9PSBudWxsID8gYmJveC55ICsgYmJveC5oZWlnaHQgLyAyIDogY3k7XG4gICAgXG4gICAgICAgIHRoaXMudHJhbnNmb3JtKHRoaXMuXy50cmFuc2Zvcm0uY29uY2F0KFtbXCJzXCIsIHN4LCBzeSwgY3gsIGN5XV0pKTtcbiAgICAgICAgdGhpcy5fLmRpcnR5VCA9IDE7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAhdGhpcy5yZW1vdmVkICYmICh0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICF0aGlzLnJlbW92ZWQgJiYgKHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID0gRSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLy8gTmVlZGVkIHRvIGZpeCB0aGUgdm1sIHNldFZpZXdCb3ggaXNzdWVzXG4gICAgZWxwcm90by5hdXhHZXRCQm94ID0gUi5lbC5nZXRCQm94O1xuICAgIGVscHJvdG8uZ2V0QkJveCA9IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgYiA9IHRoaXMuYXV4R2V0QkJveCgpO1xuICAgICAgaWYgKHRoaXMucGFwZXIgJiYgdGhpcy5wYXBlci5fdmlld0JveFNoaWZ0KVxuICAgICAge1xuICAgICAgICB2YXIgYyA9IHt9O1xuICAgICAgICB2YXIgeiA9IDEvdGhpcy5wYXBlci5fdmlld0JveFNoaWZ0LnNjYWxlO1xuICAgICAgICBjLnggPSBiLnggLSB0aGlzLnBhcGVyLl92aWV3Qm94U2hpZnQuZHg7XG4gICAgICAgIGMueCAqPSB6O1xuICAgICAgICBjLnkgPSBiLnkgLSB0aGlzLnBhcGVyLl92aWV3Qm94U2hpZnQuZHk7XG4gICAgICAgIGMueSAqPSB6O1xuICAgICAgICBjLndpZHRoICA9IGIud2lkdGggICogejtcbiAgICAgICAgYy5oZWlnaHQgPSBiLmhlaWdodCAqIHo7XG4gICAgICAgIGMueDIgPSBjLnggKyBjLndpZHRoO1xuICAgICAgICBjLnkyID0gYy55ICsgYy5oZWlnaHQ7XG4gICAgICAgIHJldHVybiBjO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGI7XG4gICAgfTtcbiAgICBlbHByb3RvLl9nZXRCQm94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHRoaXMuWCArICh0aGlzLmJieCB8fCAwKSAtIHRoaXMuVyAvIDIsXG4gICAgICAgICAgICB5OiB0aGlzLlkgLSB0aGlzLkgsXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5XLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLkhcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGVscHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkIHx8ICF0aGlzLm5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFwZXIuX19zZXRfXyAmJiB0aGlzLnBhcGVyLl9fc2V0X18uZXhjbHVkZSh0aGlzKTtcbiAgICAgICAgUi5ldmUudW5iaW5kKFwicmFwaGFlbC4qLiouXCIgKyB0aGlzLmlkKTtcbiAgICAgICAgUi5fdGVhcih0aGlzLCB0aGlzLnBhcGVyKTtcbiAgICAgICAgdGhpcy5ub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ub2RlKTtcbiAgICAgICAgdGhpcy5zaGFwZSAmJiB0aGlzLnNoYXBlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5zaGFwZSk7XG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcykge1xuICAgICAgICAgICAgdGhpc1tpXSA9IHR5cGVvZiB0aGlzW2ldID09IFwiZnVuY3Rpb25cIiA/IFIuX3JlbW92ZWRGYWN0b3J5KGkpIDogbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZWQgPSB0cnVlO1xuICAgIH07XG4gICAgZWxwcm90by5hdHRyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGEgaW4gdGhpcy5hdHRycykgaWYgKHRoaXMuYXR0cnNbaGFzXShhKSkge1xuICAgICAgICAgICAgICAgIHJlc1thXSA9IHRoaXMuYXR0cnNbYV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuZ3JhZGllbnQgJiYgcmVzLmZpbGwgPT0gXCJub25lXCIgJiYgKHJlcy5maWxsID0gcmVzLmdyYWRpZW50KSAmJiBkZWxldGUgcmVzLmdyYWRpZW50O1xuICAgICAgICAgICAgcmVzLnRyYW5zZm9ybSA9IHRoaXMuXy50cmFuc2Zvcm07XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmIFIuaXMobmFtZSwgXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09IGZpbGxTdHJpbmcgJiYgdGhpcy5hdHRycy5maWxsID09IFwibm9uZVwiICYmIHRoaXMuYXR0cnMuZ3JhZGllbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hdHRycy5ncmFkaWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgICAgICBvdXQgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gdGhpcy5hdHRycykge1xuICAgICAgICAgICAgICAgICAgICBvdXRbbmFtZV0gPSB0aGlzLmF0dHJzW25hbWVdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoUi5pcyh0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbbmFtZV0sIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0W25hbWVdID0gdGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW25hbWVdLmRlZjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXRbbmFtZV0gPSBSLl9hdmFpbGFibGVBdHRyc1tuYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaWkgLSAxID8gb3V0IDogb3V0W25hbWVzWzBdXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5hdHRycyAmJiB2YWx1ZSA9PSBudWxsICYmIFIuaXMobmFtZSwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgb3V0ID0ge307XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWUubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIG91dFtuYW1lW2ldXSA9IHRoaXMuYXR0cihuYW1lW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcmFtcztcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgcGFyYW1zW25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPT0gbnVsbCAmJiBSLmlzKG5hbWUsIFwib2JqZWN0XCIpICYmIChwYXJhbXMgPSBuYW1lKTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5hdHRyLlwiICsga2V5ICsgXCIuXCIgKyB0aGlzLmlkLCB0aGlzLCBwYXJhbXNba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcmFtcykge1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gdGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzKSBpZiAodGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2hhc10oa2V5KSAmJiBwYXJhbXNbaGFzXShrZXkpICYmIFIuaXModGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2tleV0sIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyID0gdGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2tleV0uYXBwbHkodGhpcywgW10uY29uY2F0KHBhcmFtc1trZXldKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyc1trZXldID0gcGFyYW1zW2tleV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgc3Via2V5IGluIHBhcikgaWYgKHBhcltoYXNdKHN1YmtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zW3N1YmtleV0gPSBwYXJbc3Via2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGlzLnBhcGVyLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBpZiAocGFyYW1zLnRleHQgJiYgdGhpcy50eXBlID09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0cGF0aC5zdHJpbmcgPSBwYXJhbXMudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldEZpbGxBbmRTdHJva2UodGhpcywgcGFyYW1zKTtcbiAgICAgICAgICAgIC8vIHRoaXMucGFwZXIuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSBFO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by50b0Zyb250ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAhdGhpcy5yZW1vdmVkICYmIHRoaXMubm9kZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMubm9kZSk7XG4gICAgICAgIHRoaXMucGFwZXIgJiYgdGhpcy5wYXBlci50b3AgIT0gdGhpcyAmJiBSLl90b2Zyb250KHRoaXMsIHRoaXMucGFwZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8udG9CYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5ub2RlLnBhcmVudE5vZGUuZmlyc3RDaGlsZCAhPSB0aGlzLm5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLm5vZGUsIHRoaXMubm9kZS5wYXJlbnROb2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgUi5fdG9iYWNrKHRoaXMsIHRoaXMucGFwZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5pbnNlcnRBZnRlciA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtZW50LmNvbnN0cnVjdG9yID09IFIuc3QuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50W2VsZW1lbnQubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQubm9kZS5uZXh0U2libGluZykge1xuICAgICAgICAgICAgZWxlbWVudC5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMubm9kZSwgZWxlbWVudC5ub2RlLm5leHRTaWJsaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQubm9kZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMubm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgUi5faW5zZXJ0YWZ0ZXIodGhpcywgZWxlbWVudCwgdGhpcy5wYXBlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5pbnNlcnRCZWZvcmUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxlbWVudC5jb25zdHJ1Y3RvciA9PSBSLnN0LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudFswXTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50Lm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5ub2RlLCBlbGVtZW50Lm5vZGUpO1xuICAgICAgICBSLl9pbnNlcnRiZWZvcmUodGhpcywgZWxlbWVudCwgdGhpcy5wYXBlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5ibHVyID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgICAgICAgdmFyIHMgPSB0aGlzLm5vZGUucnVudGltZVN0eWxlLFxuICAgICAgICAgICAgZiA9IHMuZmlsdGVyO1xuICAgICAgICBmID0gZi5yZXBsYWNlKGJsdXJyZWdleHAsIEUpO1xuICAgICAgICBpZiAoK3NpemUgIT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cnMuYmx1ciA9IHNpemU7XG4gICAgICAgICAgICBzLmZpbHRlciA9IGYgKyBTICsgbXMgKyBcIi5CbHVyKHBpeGVscmFkaXVzPVwiICsgKCtzaXplIHx8IDEuNSkgKyBcIilcIjtcbiAgICAgICAgICAgIHMubWFyZ2luID0gUi5mb3JtYXQoXCItezB9cHggMCAwIC17MH1weFwiLCByb3VuZCgrc2l6ZSB8fCAxLjUpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHMuZmlsdGVyID0gZjtcbiAgICAgICAgICAgIHMubWFyZ2luID0gMDtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmF0dHJzLmJsdXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIFIuX2VuZ2luZS5wYXRoID0gZnVuY3Rpb24gKHBhdGhTdHJpbmcsIHZtbCkge1xuICAgICAgICB2YXIgZWwgPSBjcmVhdGVOb2RlKFwic2hhcGVcIik7XG4gICAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSBjc3NEb3Q7XG4gICAgICAgIGVsLmNvb3Jkc2l6ZSA9IHpvb20gKyBTICsgem9vbTtcbiAgICAgICAgZWwuY29vcmRvcmlnaW4gPSB2bWwuY29vcmRvcmlnaW47XG4gICAgICAgIHZhciBwID0gbmV3IEVsZW1lbnQoZWwsIHZtbCksXG4gICAgICAgICAgICBhdHRyID0ge2ZpbGw6IFwibm9uZVwiLCBzdHJva2U6IFwiIzAwMFwifTtcbiAgICAgICAgcGF0aFN0cmluZyAmJiAoYXR0ci5wYXRoID0gcGF0aFN0cmluZyk7XG4gICAgICAgIHAudHlwZSA9IFwicGF0aFwiO1xuICAgICAgICBwLnBhdGggPSBbXTtcbiAgICAgICAgcC5QYXRoID0gRTtcbiAgICAgICAgc2V0RmlsbEFuZFN0cm9rZShwLCBhdHRyKTtcbiAgICAgICAgdm1sLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciBza2V3ID0gY3JlYXRlTm9kZShcInNrZXdcIik7XG4gICAgICAgIHNrZXcub24gPSB0cnVlO1xuICAgICAgICBlbC5hcHBlbmRDaGlsZChza2V3KTtcbiAgICAgICAgcC5za2V3ID0gc2tldztcbiAgICAgICAgcC50cmFuc2Zvcm0oRSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnJlY3QgPSBmdW5jdGlvbiAodm1sLCB4LCB5LCB3LCBoLCByKSB7XG4gICAgICAgIHZhciBwYXRoID0gUi5fcmVjdFBhdGgoeCwgeSwgdywgaCwgciksXG4gICAgICAgICAgICByZXMgPSB2bWwucGF0aChwYXRoKSxcbiAgICAgICAgICAgIGEgPSByZXMuYXR0cnM7XG4gICAgICAgIHJlcy5YID0gYS54ID0geDtcbiAgICAgICAgcmVzLlkgPSBhLnkgPSB5O1xuICAgICAgICByZXMuVyA9IGEud2lkdGggPSB3O1xuICAgICAgICByZXMuSCA9IGEuaGVpZ2h0ID0gaDtcbiAgICAgICAgYS5yID0gcjtcbiAgICAgICAgYS5wYXRoID0gcGF0aDtcbiAgICAgICAgcmVzLnR5cGUgPSBcInJlY3RcIjtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5lbGxpcHNlID0gZnVuY3Rpb24gKHZtbCwgeCwgeSwgcngsIHJ5KSB7XG4gICAgICAgIHZhciByZXMgPSB2bWwucGF0aCgpLFxuICAgICAgICAgICAgYSA9IHJlcy5hdHRycztcbiAgICAgICAgcmVzLlggPSB4IC0gcng7XG4gICAgICAgIHJlcy5ZID0geSAtIHJ5O1xuICAgICAgICByZXMuVyA9IHJ4ICogMjtcbiAgICAgICAgcmVzLkggPSByeSAqIDI7XG4gICAgICAgIHJlcy50eXBlID0gXCJlbGxpcHNlXCI7XG4gICAgICAgIHNldEZpbGxBbmRTdHJva2UocmVzLCB7XG4gICAgICAgICAgICBjeDogeCxcbiAgICAgICAgICAgIGN5OiB5LFxuICAgICAgICAgICAgcng6IHJ4LFxuICAgICAgICAgICAgcnk6IHJ5XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLmNpcmNsZSA9IGZ1bmN0aW9uICh2bWwsIHgsIHksIHIpIHtcbiAgICAgICAgdmFyIHJlcyA9IHZtbC5wYXRoKCksXG4gICAgICAgICAgICBhID0gcmVzLmF0dHJzO1xuICAgICAgICByZXMuWCA9IHggLSByO1xuICAgICAgICByZXMuWSA9IHkgLSByO1xuICAgICAgICByZXMuVyA9IHJlcy5IID0gciAqIDI7XG4gICAgICAgIHJlcy50eXBlID0gXCJjaXJjbGVcIjtcbiAgICAgICAgc2V0RmlsbEFuZFN0cm9rZShyZXMsIHtcbiAgICAgICAgICAgIGN4OiB4LFxuICAgICAgICAgICAgY3k6IHksXG4gICAgICAgICAgICByOiByXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLmltYWdlID0gZnVuY3Rpb24gKHZtbCwgc3JjLCB4LCB5LCB3LCBoKSB7XG4gICAgICAgIHZhciBwYXRoID0gUi5fcmVjdFBhdGgoeCwgeSwgdywgaCksXG4gICAgICAgICAgICByZXMgPSB2bWwucGF0aChwYXRoKS5hdHRyKHtzdHJva2U6IFwibm9uZVwifSksXG4gICAgICAgICAgICBhID0gcmVzLmF0dHJzLFxuICAgICAgICAgICAgbm9kZSA9IHJlcy5ub2RlLFxuICAgICAgICAgICAgZmlsbCA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZmlsbFN0cmluZylbMF07XG4gICAgICAgIGEuc3JjID0gc3JjO1xuICAgICAgICByZXMuWCA9IGEueCA9IHg7XG4gICAgICAgIHJlcy5ZID0gYS55ID0geTtcbiAgICAgICAgcmVzLlcgPSBhLndpZHRoID0gdztcbiAgICAgICAgcmVzLkggPSBhLmhlaWdodCA9IGg7XG4gICAgICAgIGEucGF0aCA9IHBhdGg7XG4gICAgICAgIHJlcy50eXBlID0gXCJpbWFnZVwiO1xuICAgICAgICBmaWxsLnBhcmVudE5vZGUgPT0gbm9kZSAmJiBub2RlLnJlbW92ZUNoaWxkKGZpbGwpO1xuICAgICAgICBmaWxsLnJvdGF0ZSA9IHRydWU7XG4gICAgICAgIGZpbGwuc3JjID0gc3JjO1xuICAgICAgICBmaWxsLnR5cGUgPSBcInRpbGVcIjtcbiAgICAgICAgcmVzLl8uZmlsbHBvcyA9IFt4LCB5XTtcbiAgICAgICAgcmVzLl8uZmlsbHNpemUgPSBbdywgaF07XG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoZmlsbCk7XG4gICAgICAgIHNldENvb3JkcyhyZXMsIDEsIDEsIDAsIDAsIDApO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnRleHQgPSBmdW5jdGlvbiAodm1sLCB4LCB5LCB0ZXh0KSB7XG4gICAgICAgIHZhciBlbCA9IGNyZWF0ZU5vZGUoXCJzaGFwZVwiKSxcbiAgICAgICAgICAgIHBhdGggPSBjcmVhdGVOb2RlKFwicGF0aFwiKSxcbiAgICAgICAgICAgIG8gPSBjcmVhdGVOb2RlKFwidGV4dHBhdGhcIik7XG4gICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgIHkgPSB5IHx8IDA7XG4gICAgICAgIHRleHQgPSB0ZXh0IHx8IFwiXCI7XG4gICAgICAgIHBhdGgudiA9IFIuZm9ybWF0KFwibXswfSx7MX1sezJ9LHsxfVwiLCByb3VuZCh4ICogem9vbSksIHJvdW5kKHkgKiB6b29tKSwgcm91bmQoeCAqIHpvb20pICsgMSk7XG4gICAgICAgIHBhdGgudGV4dHBhdGhvayA9IHRydWU7XG4gICAgICAgIG8uc3RyaW5nID0gU3RyKHRleHQpO1xuICAgICAgICBvLm9uID0gdHJ1ZTtcbiAgICAgICAgZWwuc3R5bGUuY3NzVGV4dCA9IGNzc0RvdDtcbiAgICAgICAgZWwuY29vcmRzaXplID0gem9vbSArIFMgKyB6b29tO1xuICAgICAgICBlbC5jb29yZG9yaWdpbiA9IFwiMCAwXCI7XG4gICAgICAgIHZhciBwID0gbmV3IEVsZW1lbnQoZWwsIHZtbCksXG4gICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgIGZpbGw6IFwiIzAwMFwiLFxuICAgICAgICAgICAgICAgIHN0cm9rZTogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgZm9udDogUi5fYXZhaWxhYmxlQXR0cnMuZm9udCxcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgICAgICB9O1xuICAgICAgICBwLnNoYXBlID0gZWw7XG4gICAgICAgIHAucGF0aCA9IHBhdGg7XG4gICAgICAgIHAudGV4dHBhdGggPSBvO1xuICAgICAgICBwLnR5cGUgPSBcInRleHRcIjtcbiAgICAgICAgcC5hdHRycy50ZXh0ID0gU3RyKHRleHQpO1xuICAgICAgICBwLmF0dHJzLnggPSB4O1xuICAgICAgICBwLmF0dHJzLnkgPSB5O1xuICAgICAgICBwLmF0dHJzLncgPSAxO1xuICAgICAgICBwLmF0dHJzLmggPSAxO1xuICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHAsIGF0dHIpO1xuICAgICAgICBlbC5hcHBlbmRDaGlsZChvKTtcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQocGF0aCk7XG4gICAgICAgIHZtbC5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgc2tldyA9IGNyZWF0ZU5vZGUoXCJza2V3XCIpO1xuICAgICAgICBza2V3Lm9uID0gdHJ1ZTtcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc2tldyk7XG4gICAgICAgIHAuc2tldyA9IHNrZXc7XG4gICAgICAgIHAudHJhbnNmb3JtKEUpO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5zZXRTaXplID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGNzID0gdGhpcy5jYW52YXMuc3R5bGU7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHdpZHRoID09ICt3aWR0aCAmJiAod2lkdGggKz0gXCJweFwiKTtcbiAgICAgICAgaGVpZ2h0ID09ICtoZWlnaHQgJiYgKGhlaWdodCArPSBcInB4XCIpO1xuICAgICAgICBjcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNzLmNsaXAgPSBcInJlY3QoMCBcIiArIHdpZHRoICsgXCIgXCIgKyBoZWlnaHQgKyBcIiAwKVwiO1xuICAgICAgICBpZiAodGhpcy5fdmlld0JveCkge1xuICAgICAgICAgICAgUi5fZW5naW5lLnNldFZpZXdCb3guYXBwbHkodGhpcywgdGhpcy5fdmlld0JveCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuc2V0Vmlld0JveCA9IGZ1bmN0aW9uICh4LCB5LCB3LCBoLCBmaXQpIHtcbiAgICAgICAgUi5ldmUoXCJyYXBoYWVsLnNldFZpZXdCb3hcIiwgdGhpcywgdGhpcy5fdmlld0JveCwgW3gsIHksIHcsIGgsIGZpdF0pO1xuICAgICAgICB2YXIgcGFwZXJTaXplID0gdGhpcy5nZXRTaXplKCksXG4gICAgICAgICAgICB3aWR0aCA9IHBhcGVyU2l6ZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IHBhcGVyU2l6ZS5oZWlnaHQsXG4gICAgICAgICAgICBILCBXO1xuICAgICAgICBpZiAoZml0KSB7XG4gICAgICAgICAgICBIID0gaGVpZ2h0IC8gaDtcbiAgICAgICAgICAgIFcgPSB3aWR0aCAvIHc7XG4gICAgICAgICAgICBpZiAodyAqIEggPCB3aWR0aCkge1xuICAgICAgICAgICAgICAgIHggLT0gKHdpZHRoIC0gdyAqIEgpIC8gMiAvIEg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaCAqIFcgPCBoZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB5IC09IChoZWlnaHQgLSBoICogVykgLyAyIC8gVztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl92aWV3Qm94ID0gW3gsIHksIHcsIGgsICEhZml0XTtcbiAgICAgICAgdGhpcy5fdmlld0JveFNoaWZ0ID0ge1xuICAgICAgICAgICAgZHg6IC14LFxuICAgICAgICAgICAgZHk6IC15LFxuICAgICAgICAgICAgc2NhbGU6IHBhcGVyU2l6ZVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBlbC50cmFuc2Zvcm0oXCIuLi5cIik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHZhciBjcmVhdGVOb2RlO1xuICAgIFIuX2VuZ2luZS5pbml0V2luID0gZnVuY3Rpb24gKHdpbikge1xuICAgICAgICAgICAgdmFyIGRvYyA9IHdpbi5kb2N1bWVudDtcbiAgICAgICAgICAgIGlmIChkb2Muc3R5bGVTaGVldHMubGVuZ3RoIDwgMzEpIHtcbiAgICAgICAgICAgICAgICBkb2MuY3JlYXRlU3R5bGVTaGVldCgpLmFkZFJ1bGUoXCIucnZtbFwiLCBcImJlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBubyBtb3JlIHJvb20sIGFkZCB0byB0aGUgZXhpc3Rpbmcgb25lXG4gICAgICAgICAgICAgICAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxMTk0JTI4VlMuODUlMjkuYXNweFxuICAgICAgICAgICAgICAgIGRvYy5zdHlsZVNoZWV0c1swXS5hZGRSdWxlKFwiLnJ2bWxcIiwgXCJiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgIWRvYy5uYW1lc3BhY2VzLnJ2bWwgJiYgZG9jLm5hbWVzcGFjZXMuYWRkKFwicnZtbFwiLCBcInVybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206dm1sXCIpO1xuICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAodGFnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jLmNyZWF0ZUVsZW1lbnQoJzxydm1sOicgKyB0YWdOYW1lICsgJyBjbGFzcz1cInJ2bWxcIj4nKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAodGFnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jLmNyZWF0ZUVsZW1lbnQoJzwnICsgdGFnTmFtZSArICcgeG1sbnM9XCJ1cm46c2NoZW1hcy1taWNyb3NvZnQuY29tOnZtbFwiIGNsYXNzPVwicnZtbFwiPicpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgUi5fZW5naW5lLmluaXRXaW4oUi5fZy53aW4pO1xuICAgIFIuX2VuZ2luZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb24gPSBSLl9nZXRDb250YWluZXIuYXBwbHkoMCwgYXJndW1lbnRzKSxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IGNvbi5jb250YWluZXIsXG4gICAgICAgICAgICBoZWlnaHQgPSBjb24uaGVpZ2h0LFxuICAgICAgICAgICAgcyxcbiAgICAgICAgICAgIHdpZHRoID0gY29uLndpZHRoLFxuICAgICAgICAgICAgeCA9IGNvbi54LFxuICAgICAgICAgICAgeSA9IGNvbi55O1xuICAgICAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVk1MIGNvbnRhaW5lciBub3QgZm91bmQuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXMgPSBuZXcgUi5fUGFwZXIsXG4gICAgICAgICAgICBjID0gcmVzLmNhbnZhcyA9IFIuX2cuZG9jLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgICAgICBjcyA9IGMuc3R5bGU7XG4gICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgIHkgPSB5IHx8IDA7XG4gICAgICAgIHdpZHRoID0gd2lkdGggfHwgNTEyO1xuICAgICAgICBoZWlnaHQgPSBoZWlnaHQgfHwgMzQyO1xuICAgICAgICByZXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgcmVzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgd2lkdGggPT0gK3dpZHRoICYmICh3aWR0aCArPSBcInB4XCIpO1xuICAgICAgICBoZWlnaHQgPT0gK2hlaWdodCAmJiAoaGVpZ2h0ICs9IFwicHhcIik7XG4gICAgICAgIHJlcy5jb29yZHNpemUgPSB6b29tICogMWUzICsgUyArIHpvb20gKiAxZTM7XG4gICAgICAgIHJlcy5jb29yZG9yaWdpbiA9IFwiMCAwXCI7XG4gICAgICAgIHJlcy5zcGFuID0gUi5fZy5kb2MuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHJlcy5zcGFuLnN0eWxlLmNzc1RleHQgPSBcInBvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTk5OTllbTt0b3A6LTk5OTllbTtwYWRkaW5nOjA7bWFyZ2luOjA7bGluZS1oZWlnaHQ6MTtcIjtcbiAgICAgICAgYy5hcHBlbmRDaGlsZChyZXMuc3Bhbik7XG4gICAgICAgIGNzLmNzc1RleHQgPSBSLmZvcm1hdChcInRvcDowO2xlZnQ6MDt3aWR0aDp7MH07aGVpZ2h0OnsxfTtkaXNwbGF5OmlubGluZS1ibG9jaztwb3NpdGlvbjpyZWxhdGl2ZTtjbGlwOnJlY3QoMCB7MH0gezF9IDApO292ZXJmbG93OmhpZGRlblwiLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgaWYgKGNvbnRhaW5lciA9PSAxKSB7XG4gICAgICAgICAgICBSLl9nLmRvYy5ib2R5LmFwcGVuZENoaWxkKGMpO1xuICAgICAgICAgICAgY3MubGVmdCA9IHggKyBcInB4XCI7XG4gICAgICAgICAgICBjcy50b3AgPSB5ICsgXCJweFwiO1xuICAgICAgICAgICAgY3MucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGMsIGNvbnRhaW5lci5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcy5yZW5kZXJmaXggPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBSLmV2ZShcInJhcGhhZWwuY2xlYXJcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuY2FudmFzLmlubmVySFRNTCA9IEU7XG4gICAgICAgIHRoaXMuc3BhbiA9IFIuX2cuZG9jLmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLnNwYW4uc3R5bGUuY3NzVGV4dCA9IFwicG9zaXRpb246YWJzb2x1dGU7bGVmdDotOTk5OWVtO3RvcDotOTk5OWVtO3BhZGRpbmc6MDttYXJnaW46MDtsaW5lLWhlaWdodDoxO2Rpc3BsYXk6aW5saW5lO1wiO1xuICAgICAgICB0aGlzLmNhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLnNwYW4pO1xuICAgICAgICB0aGlzLmJvdHRvbSA9IHRoaXMudG9wID0gbnVsbDtcbiAgICB9O1xuICAgIFIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUi5ldmUoXCJyYXBoYWVsLnJlbW92ZVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyk7XG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcykge1xuICAgICAgICAgICAgdGhpc1tpXSA9IHR5cGVvZiB0aGlzW2ldID09IFwiZnVuY3Rpb25cIiA/IFIuX3JlbW92ZWRGYWN0b3J5KGkpIDogbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIHNldHByb3RvID0gUi5zdDtcbiAgICBmb3IgKHZhciBtZXRob2QgaW4gZWxwcm90bykgaWYgKGVscHJvdG9baGFzXShtZXRob2QpICYmICFzZXRwcm90b1toYXNdKG1ldGhvZCkpIHtcbiAgICAgICAgc2V0cHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiAobWV0aG9kbmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsW21ldGhvZG5hbWVdLmFwcGx5KGVsLCBhcmcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkobWV0aG9kKTtcbiAgICB9XG59KSgpO1xuXG4gICAgLy8gRVhQT1NFXG4gICAgLy8gU1ZHIGFuZCBWTUwgYXJlIGFwcGVuZGVkIGp1c3QgYmVmb3JlIHRoZSBFWFBPU0UgbGluZVxuICAgIC8vIEV2ZW4gd2l0aCBBTUQsIFJhcGhhZWwgc2hvdWxkIGJlIGRlZmluZWQgZ2xvYmFsbHlcbiAgICBvbGRSYXBoYWVsLndhcyA/IChnLndpbi5SYXBoYWVsID0gUikgOiAoUmFwaGFlbCA9IFIpO1xuXG4gICAgaWYodHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIil7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gUjtcbiAgICB9XG4gICAgcmV0dXJuIFI7XG59KSk7XG4iLCJQb2x5bWVyXG4gIGlzOiAndGV4dC1mbG93LWxpbmUnXG5cbiAgcHJvcGVydGllczpcbiAgICBpbmRlbnQ6XG4gICAgICB0eXBlOiBOdW1iZXJcbiAgICAgIHZhbHVlOiAwXG5cbiAgcmVhZHk6ICgpIC0+XG5cbiAgZ2V0T2Zmc2V0UmVjdDogKCkgLT5cbiAgICBAZ2V0Q29udGVudENoaWxkcmVuKClcbiAgICAgIC5tYXAgKGNoaWxkKSAtPiBjaGlsZC5nZXRPZmZzZXRSZWN0KClcbiAgICAgIC5yZWR1Y2UgKGRpbWVuc2lvbnMsIG9mZnNldHMpIC0+XG4gICAgICAgIHdpZHRoOiBkaW1lbnNpb25zLndpZHRoICsgb2Zmc2V0cy53aWR0aFxuICAgICAgICBoZWlnaHQ6IE1hdGgubWF4IG9mZnNldHMuaGVpZ2h0LCBkaW1lbnNpb25zLmhlaWdodFxuICAgICAgICBsZWZ0OiBkaW1lbnNpb25zLmxlZnRcbiAgICAgICAgdG9wOiBkaW1lbnNpb25zLnRvcFxuXG4gIF90YWJTdHlsZTogKGluZGVudCkgLT5cbiAgICBcIndpZHRoOiAjezIwICogaW5kZW50fXB4O1wiICtcbiAgICBcImRpc3BsYXk6IGlubGluZS1ibG9jaztcIiIsIlBvbHltZXJcbiAgaXM6ICd0ZXh0LWZsb3ctcGllY2UnXG5cbiAgcHJvcGVydGllczpcbiAgICBub2RlSWQ6XG4gICAgICB0eXBlOiBTdHJpbmdcbiAgICAgIHZhbHVlOiAnJ1xuXG4gIGxpc3RlbmVyczpcbiAgICAndXAnOiAnX29uVXAnXG5cbiAgZ2V0T2Zmc2V0UmVjdDogKCkgLT5cbiAgICB3aWR0aDogQG9mZnNldFdpZHRoXG4gICAgaGVpZ2h0OiBAb2Zmc2V0SGVpZ2h0XG4gICAgbGVmdDogQG9mZnNldExlZnRcbiAgICB0b3A6IEBvZmZzZXRUb3BcblxuXG4gIF9vblVwOiAoKSAtPlxuICAgIEBmaXJlICdzZWxlY3QnLFxuICAgICAgbm9kZUlkOiBAbm9kZUlkIiwiUmFwaGFlbCA9IHJlcXVpcmUgJ3JhcGhhZWwnXG5yZXF1aXJlICd0ZXh0LWZsb3ctbGluZSdcbnJlcXVpcmUgJ3RleHQtZmxvdy1waWVjZSdcblxuUG9seW1lclxuICBpczogJ3RleHQtZmxvdydcblxuICByZWFkeTogKCkgLT5cbiAgICBAX3BhcGVyID0gUmFwaGFlbCBAJC5jYW52YXMsIEAkLmJvZHkub2Zmc2V0V2lkdGgsIEAkLmJvZHkub2Zmc2V0SGVpZ2h0XG5cbiAgICBAX3NoYXBlcyA9IHt9XG4gICAgQF9zaGFwZXMuaGlnaGxpZ2h0cyA9IHt9XG5cbiAgYXR0YWNoZWQ6ICgpIC0+XG4gICAgQGFzeW5jICgpID0+XG4gICAgICBAX3BhcGVyLnNldFNpemUgQCQuYm9keS5vZmZzZXRXaWR0aCwgQCQuYm9keS5vZmZzZXRIZWlnaHRcblxuICB1cGRhdGVDaGlsZHJlbjogKCkgLT4gZG8gQGF0dGFjaGVkXG5cbiAgZ2V0UGllY2VzRm9yTm9kZTogKG5vZGVJZCkgLT5cbiAgICBAZ2V0Q29udGVudENoaWxkcmVuKClcbiAgICAgIC5tYXAgKGVsbSkgLT5cbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwgZWxtLnF1ZXJ5U2VsZWN0b3JBbGwgJ3RleHQtZmxvdy1waWVjZSdcbiAgICAgIC5yZWR1Y2UgKGFjYywgZWxtKSAtPlxuICAgICAgICBhY2MuY29uY2F0IGVsbVxuICAgICAgLmZpbHRlciAocGMpIC0+XG4gICAgICAgIHBjLm5vZGVJZFxuICAgICAgICAgIC5zcGxpdCAvXFxzL1xuICAgICAgICAgIC5maWx0ZXIgKGlkKSAtPiBpZCBpcyBub2RlSWRcbiAgICAgICAgICAubGVuZ3RoID4gMFxuXG4gIGhpZ2hsaWdodE5vZGU6IChub2RlSWQsIGF0dHJzKSAtPlxuICAgIHJlY3RzID1cbiAgICAgIChAZ2V0UGllY2VzRm9yTm9kZSBub2RlSWQpXG4gICAgICAgIC5tYXAgKHBjKSAtPiBwYy5nZXRPZmZzZXRSZWN0KClcbiAgICBAX3NoYXBlcy5oaWdobGlnaHRzW25vZGVJZF0gPSBAX2RyYXdSZWN0cyBAX3BhcGVyLCBhdHRycywgcmVjdHNcblxuICAgIHJldHVybiAoKSA9PiBAX3NoYXBlcy5oaWdobGlnaHRzW25vZGVJZF0uZm9yRWFjaCAoc2hhcGUpIC0+IHNoYXBlLnJlbW92ZSgpXG5cbiAgZHJhd0JhY2tncm91bmQ6ICgpIC0+XG4gICAgaWYgQF9zaGFwZXMuYmFja2dyb3VuZD9cbiAgICAgIEBfc2hhcGVzLmJhY2tncm91bmQuZm9yRWFjaCAoc2hhcGUpIC0+IHNoYXBlLnJlbW92ZSgpXG5cbiAgICBhdHRycyA9XG4gICAgICBmaWxsOiAnI2ZjYydcbiAgICAgIHN0cm9rZTogJ25vbmUnXG4gICAgICBib3JkZXJSYWRpdXM6IDRcbiAgICByZWN0cyA9XG4gICAgICBAZ2V0Q29udGVudENoaWxkcmVuKClcbiAgICAgICAgLm1hcCAoY2hpbGQpIC0+IGNoaWxkLmdldE9mZnNldFJlY3QoKVxuXG4gICAgQF9kcmF3UmVjdHMgXFxcbiAgICAgIEBfcGFwZXIsXG4gICAgICBhdHRycyxcbiAgICAgIHJlY3RzXG5cbiAgX2RyYXdSZWN0czogKHBhcGVyLCBhdHRycywgcmVjdHMpIC0+XG4gICAgcmVjdHMubWFwIChyZWN0KSAtPlxuICAgICAgYm9yZGVyUmFkaXVzID1cbiAgICAgICAgaWYgYXR0cnMuYm9yZGVyUmFkaXVzP1xuICAgICAgICB0aGVuIGF0dHJzLmJvcmRlclJhZGl1c1xuICAgICAgICBlbHNlIDBcbiAgICAgIGVsbSA9IHBhcGVyLnJlY3QgcmVjdC5sZWZ0LCByZWN0LnRvcCwgcmVjdC53aWR0aCwgcmVjdC5oZWlnaHQsIGJvcmRlclJhZGl1c1xuICAgICAgZm9yIGF0dHIsIHZhbCBvZiBhdHRyc1xuICAgICAgICBlbG0uYXR0ciBhdHRyLCB2YWxcbiAgICAgIHJldHVybiBlbG0iXX0=
