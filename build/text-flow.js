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
    var children;
    children = this.getContentChildren();
    if (children.length > 0) {
      return children.map(function(child) {
        return child.getOffsetRect();
      }).reduce(function(dimensions, offsets) {
        return {
          width: dimensions.width + offsets.width,
          height: Math.max(offsets.height, dimensions.height),
          left: dimensions.left,
          top: dimensions.top
        };
      });
    } else {
      return {
        width: 0,
        height: 0,
        left: 0,
        top: 0
      };
    }
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
  properties: {

    /*
    Set to `true` to automatically draw a ragged background.
     */
    drawBackground: {
      type: Boolean,
      value: false
    }
  },
  created: function() {},
  ready: function() {
    var mutObserver;
    this._mutationCallbacks = [];
    mutObserver = new MutationObserver((function(_this) {
      return function(records) {
        _this._mutationCallbacks.forEach(function(cb) {
          return cb(records);
        });
        _this._mutationCallbacks = [];
        return _this.updateChildren();
      };
    })(this));
    mutObserver.observe(this.$.body, {
      childList: true
    });
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
    this.attached();
    if (this.drawBackground) {
      return this._drawBackground();
    }
  },

  /*
  @return All `text-flow-piece` elements with the specified node ID.
   */
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

  /*
  Registers a callback to be invoked on the next successful child append.
  Destroys callback when invoked.
  
  @param [Function] cb A function taking in the mutation records as provided by
    a MutationObserver.
   */
  onNextChildAppend: function(cb) {
    return this._mutationCallbacks.push(cb);
  },
  _drawBackground: function() {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvcmFwaGFlbC9ub2RlX21vZHVsZXMvZXZlL2V2ZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9yYXBoYWVsL3JhcGhhZWwuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy90ZXh0LWZsb3ctbGluZS5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy90ZXh0LWZsb3ctcGllY2UuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL3RleHQtZmxvdy9zcmMvdGV4dC1mbG93LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvaVFBLE9BQUEsQ0FDRTtFQUFBLEVBQUEsRUFBSSxnQkFBSjtFQUVBLFVBQUEsRUFDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxNQUFOO01BQ0EsS0FBQSxFQUFPLENBRFA7S0FERjtHQUhGO0VBT0EsS0FBQSxFQUFPLFNBQUEsR0FBQSxDQVBQO0VBU0EsYUFBQSxFQUFlLFNBQUE7QUFDYixRQUFBO0lBQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0lBRVgsSUFBRyxRQUFRLENBQUMsTUFBVCxHQUFrQixDQUFyQjthQUNFLFFBQ0UsQ0FBQyxHQURILENBQ08sU0FBQyxLQUFEO2VBQVcsS0FBSyxDQUFDLGFBQU4sQ0FBQTtNQUFYLENBRFAsQ0FFRSxDQUFDLE1BRkgsQ0FFVSxTQUFDLFVBQUQsRUFBYSxPQUFiO2VBQ047VUFBQSxLQUFBLEVBQU8sVUFBVSxDQUFDLEtBQVgsR0FBbUIsT0FBTyxDQUFDLEtBQWxDO1VBQ0EsTUFBQSxFQUFRLElBQUksQ0FBQyxHQUFMLENBQVMsT0FBTyxDQUFDLE1BQWpCLEVBQXlCLFVBQVUsQ0FBQyxNQUFwQyxDQURSO1VBRUEsSUFBQSxFQUFNLFVBQVUsQ0FBQyxJQUZqQjtVQUdBLEdBQUEsRUFBSyxVQUFVLENBQUMsR0FIaEI7O01BRE0sQ0FGVixFQURGO0tBQUEsTUFBQTthQVNFO1FBQUMsS0FBQSxFQUFPLENBQVI7UUFBVyxNQUFBLEVBQVEsQ0FBbkI7UUFBc0IsSUFBQSxFQUFNLENBQTVCO1FBQStCLEdBQUEsRUFBSyxDQUFwQztRQVRGOztFQUhhLENBVGY7RUF1QkEsU0FBQSxFQUFXLFNBQUMsTUFBRDtXQUNULENBQUEsU0FBQSxHQUFTLENBQUMsRUFBQSxHQUFLLE1BQU4sQ0FBVCxHQUFzQixLQUF0QixDQUFBLEdBQ0E7RUFGUyxDQXZCWDtDQURGOzs7O0FDQUEsT0FBQSxDQUNFO0VBQUEsRUFBQSxFQUFJLGlCQUFKO0VBRUEsVUFBQSxFQUNFO0lBQUEsTUFBQSxFQUNFO01BQUEsSUFBQSxFQUFNLE1BQU47TUFDQSxLQUFBLEVBQU8sRUFEUDtLQURGO0dBSEY7RUFPQSxTQUFBLEVBQ0U7SUFBQSxJQUFBLEVBQU0sT0FBTjtHQVJGO0VBVUEsYUFBQSxFQUFlLFNBQUE7V0FDYjtNQUFBLEtBQUEsRUFBTyxJQUFDLENBQUEsV0FBUjtNQUNBLE1BQUEsRUFBUSxJQUFDLENBQUEsWUFEVDtNQUVBLElBQUEsRUFBTSxJQUFDLENBQUEsVUFGUDtNQUdBLEdBQUEsRUFBSyxJQUFDLENBQUEsU0FITjs7RUFEYSxDQVZmO0VBaUJBLEtBQUEsRUFBTyxTQUFBO1dBQ0wsSUFBQyxDQUFBLElBQUQsQ0FBTSxRQUFOLEVBQ0U7TUFBQSxNQUFBLEVBQVEsSUFBQyxDQUFBLE1BQVQ7S0FERjtFQURLLENBakJQO0NBREY7Ozs7QUNBQSxJQUFBOztBQUFBLE9BQUEsR0FBVSxPQUFBLENBQVEsU0FBUjs7QUFDVixPQUFBLENBQVEsZ0JBQVI7O0FBQ0EsT0FBQSxDQUFRLGlCQUFSOztBQUVBLE9BQUEsQ0FDRTtFQUFBLEVBQUEsRUFBSSxXQUFKO0VBRUEsVUFBQSxFQUNFOztBQUFBOzs7SUFHQSxjQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sT0FBTjtNQUNBLEtBQUEsRUFBTyxLQURQO0tBSkY7R0FIRjtFQVVBLE9BQUEsRUFBUyxTQUFBLEdBQUEsQ0FWVDtFQVlBLEtBQUEsRUFBTyxTQUFBO0FBQ0wsUUFBQTtJQUFBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQjtJQUN0QixXQUFBLEdBQWtCLElBQUEsZ0JBQUEsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFDLE9BQUQ7UUFDakMsS0FBQyxDQUFBLGtCQUFrQixDQUFDLE9BQXBCLENBQTRCLFNBQUMsRUFBRDtpQkFDMUIsRUFBQSxDQUFHLE9BQUg7UUFEMEIsQ0FBNUI7UUFFQSxLQUFDLENBQUEsa0JBQUQsR0FBc0I7ZUFDbkIsS0FBQyxDQUFBLGNBQUosQ0FBQTtNQUppQztJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7SUFLbEIsV0FBVyxDQUFDLE9BQVosQ0FBb0IsSUFBQyxDQUFBLENBQUMsQ0FBQyxJQUF2QixFQUE2QjtNQUFBLFNBQUEsRUFBVyxJQUFYO0tBQTdCO0lBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxPQUFBLENBQVEsSUFBQyxDQUFBLENBQUMsQ0FBQyxNQUFYLEVBQW1CLElBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQTNCLEVBQXdDLElBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQWhEO0lBRVYsSUFBQyxDQUFBLE9BQUQsR0FBVztXQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVCxHQUFzQjtFQVhqQixDQVpQO0VBeUJBLFFBQUEsRUFBVSxTQUFBO1dBQ1IsSUFBQyxDQUFBLEtBQUQsQ0FBTyxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7ZUFDTCxLQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsS0FBQyxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBeEIsRUFBcUMsS0FBQyxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBN0M7TUFESztJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUDtFQURRLENBekJWO0VBNkJBLGNBQUEsRUFBZ0IsU0FBQTtJQUNYLElBQUMsQ0FBQSxRQUFKLENBQUE7SUFDQSxJQUFHLElBQUMsQ0FBQSxjQUFKO2FBQ0ssSUFBQyxDQUFBLGVBQUosQ0FBQSxFQURGOztFQUZjLENBN0JoQjs7QUFrQ0E7OztFQUdBLGdCQUFBLEVBQWtCLFNBQUMsTUFBRDtXQUNoQixJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUNFLENBQUMsR0FESCxDQUNPLFNBQUMsR0FBRDthQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQXRCLENBQTJCLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixpQkFBckIsQ0FBM0I7SUFERyxDQURQLENBR0UsQ0FBQyxNQUhILENBR1UsU0FBQyxHQUFELEVBQU0sR0FBTjthQUNOLEdBQUcsQ0FBQyxNQUFKLENBQVcsR0FBWDtJQURNLENBSFYsQ0FLRSxDQUFDLE1BTEgsQ0FLVSxTQUFDLEVBQUQ7YUFDTixFQUFFLENBQUMsTUFDRCxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxNQUZILENBRVUsU0FBQyxFQUFEO2VBQVEsRUFBQSxLQUFNO01BQWQsQ0FGVixDQUdFLENBQUMsTUFISCxHQUdZO0lBSk4sQ0FMVjtFQURnQixDQXJDbEI7RUFpREEsYUFBQSxFQUFlLFNBQUMsTUFBRCxFQUFTLEtBQVQ7QUFDYixRQUFBO0lBQUEsS0FBQSxHQUNFLENBQUMsSUFBQyxDQUFBLGdCQUFELENBQWtCLE1BQWxCLENBQUQsQ0FDRSxDQUFDLEdBREgsQ0FDTyxTQUFDLEVBQUQ7YUFBUSxFQUFFLENBQUMsYUFBSCxDQUFBO0lBQVIsQ0FEUDtJQUVGLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVyxDQUFBLE1BQUEsQ0FBcEIsR0FBOEIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFDLENBQUEsTUFBYixFQUFxQixLQUFyQixFQUE0QixLQUE1QjtBQUU5QixXQUFPLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQTtlQUFNLEtBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVyxDQUFBLE1BQUEsQ0FBTyxDQUFDLE9BQTVCLENBQW9DLFNBQUMsS0FBRDtpQkFBVyxLQUFLLENBQUMsTUFBTixDQUFBO1FBQVgsQ0FBcEM7TUFBTjtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7RUFOTSxDQWpEZjs7QUF5REE7Ozs7Ozs7RUFPQSxpQkFBQSxFQUFtQixTQUFDLEVBQUQ7V0FDakIsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQXlCLEVBQXpCO0VBRGlCLENBaEVuQjtFQW1FQSxlQUFBLEVBQWlCLFNBQUE7QUFDZixRQUFBO0lBQUEsSUFBRywrQkFBSDtNQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQXBCLENBQTRCLFNBQUMsS0FBRDtlQUFXLEtBQUssQ0FBQyxNQUFOLENBQUE7TUFBWCxDQUE1QixFQURGOztJQUdBLEtBQUEsR0FDRTtNQUFBLElBQUEsRUFBTSxNQUFOO01BQ0EsTUFBQSxFQUFRLE1BRFI7TUFFQSxZQUFBLEVBQWMsQ0FGZDs7SUFHRixLQUFBLEdBQ0UsSUFBQyxDQUFBLGtCQUFELENBQUEsQ0FDRSxDQUFDLEdBREgsQ0FDTyxTQUFDLEtBQUQ7YUFBVyxLQUFLLENBQUMsYUFBTixDQUFBO0lBQVgsQ0FEUDtXQUdGLElBQUMsQ0FBQSxVQUFELENBQ0UsSUFBQyxDQUFBLE1BREgsRUFFRSxLQUZGLEVBR0UsS0FIRjtFQVplLENBbkVqQjtFQW9GQSxVQUFBLEVBQVksU0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWY7V0FDVixLQUFLLENBQUMsR0FBTixDQUFVLFNBQUMsSUFBRDtBQUNSLFVBQUE7TUFBQSxZQUFBLEdBQ0ssMEJBQUgsR0FDSyxLQUFLLENBQUMsWUFEWCxHQUVLO01BQ1AsR0FBQSxHQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSSxDQUFDLElBQWhCLEVBQXNCLElBQUksQ0FBQyxHQUEzQixFQUFnQyxJQUFJLENBQUMsS0FBckMsRUFBNEMsSUFBSSxDQUFDLE1BQWpELEVBQXlELFlBQXpEO0FBQ04sV0FBQSxhQUFBOztRQUNFLEdBQUcsQ0FBQyxJQUFKLENBQVMsSUFBVCxFQUFlLEdBQWY7QUFERjtBQUVBLGFBQU87SUFSQyxDQUFWO0VBRFUsQ0FwRlo7Q0FERiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIEV2ZSAwLjQuMiAtIEphdmFTY3JpcHQgRXZlbnRzIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQXV0aG9yIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL2RtaXRyeS5iYXJhbm92c2tpeS5jb20vKSDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uIChnbG9iKSB7XG4gICAgdmFyIHZlcnNpb24gPSBcIjAuNC4yXCIsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgc2VwYXJhdG9yID0gL1tcXC5cXC9dLyxcbiAgICAgICAgd2lsZGNhcmQgPSBcIipcIixcbiAgICAgICAgZnVuID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG51bXNvcnQgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgICB9LFxuICAgICAgICBjdXJyZW50X2V2ZW50LFxuICAgICAgICBzdG9wLFxuICAgICAgICBldmVudHMgPSB7bjoge319LFxuICAgIC8qXFxcbiAgICAgKiBldmVcbiAgICAgWyBtZXRob2QgXVxuXG4gICAgICogRmlyZXMgZXZlbnQgd2l0aCBnaXZlbiBgbmFtZWAsIGdpdmVuIHNjb3BlIGFuZCBvdGhlciBwYXJhbWV0ZXJzLlxuXG4gICAgID4gQXJndW1lbnRzXG5cbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlICpldmVudCosIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcbiAgICAgLSBzY29wZSAob2JqZWN0KSBjb250ZXh0IGZvciB0aGUgZXZlbnQgaGFuZGxlcnNcbiAgICAgLSB2YXJhcmdzICguLi4pIHRoZSByZXN0IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHNlbnQgdG8gZXZlbnQgaGFuZGxlcnNcblxuICAgICA9IChvYmplY3QpIGFycmF5IG9mIHJldHVybmVkIHZhbHVlcyBmcm9tIHRoZSBsaXN0ZW5lcnNcbiAgICBcXCovXG4gICAgICAgIGV2ZSA9IGZ1bmN0aW9uIChuYW1lLCBzY29wZSkge1xuXHRcdFx0bmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICAgICAgICAgIHZhciBlID0gZXZlbnRzLFxuICAgICAgICAgICAgICAgIG9sZHN0b3AgPSBzdG9wLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLFxuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGV2ZS5saXN0ZW5lcnMobmFtZSksXG4gICAgICAgICAgICAgICAgeiA9IDAsXG4gICAgICAgICAgICAgICAgZiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGwsXG4gICAgICAgICAgICAgICAgaW5kZXhlZCA9IFtdLFxuICAgICAgICAgICAgICAgIHF1ZXVlID0ge30sXG4gICAgICAgICAgICAgICAgb3V0ID0gW10sXG4gICAgICAgICAgICAgICAgY2UgPSBjdXJyZW50X2V2ZW50LFxuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IG5hbWU7XG4gICAgICAgICAgICBzdG9wID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoXCJ6SW5kZXhcIiBpbiBsaXN0ZW5lcnNbaV0pIHtcbiAgICAgICAgICAgICAgICBpbmRleGVkLnB1c2gobGlzdGVuZXJzW2ldLnpJbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS56SW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlW2xpc3RlbmVyc1tpXS56SW5kZXhdID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGV4ZWQuc29ydChudW1zb3J0KTtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleGVkW3pdIDwgMCkge1xuICAgICAgICAgICAgICAgIGwgPSBxdWV1ZVtpbmRleGVkW3orK11dO1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gb2xkc3RvcDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGwgPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKFwiekluZGV4XCIgaW4gbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobC56SW5kZXggPT0gaW5kZXhlZFt6XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbel1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgJiYgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGwpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZVtsLnpJbmRleF0gPSBsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9wID0gb2xkc3RvcDtcbiAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSBjZTtcbiAgICAgICAgICAgIHJldHVybiBvdXQubGVuZ3RoID8gb3V0IDogbnVsbDtcbiAgICAgICAgfTtcblx0XHQvLyBVbmRvY3VtZW50ZWQuIERlYnVnIG9ubHkuXG5cdFx0ZXZlLl9ldmVudHMgPSBldmVudHM7XG4gICAgLypcXFxuICAgICAqIGV2ZS5saXN0ZW5lcnNcbiAgICAgWyBtZXRob2QgXVxuXG4gICAgICogSW50ZXJuYWwgbWV0aG9kIHdoaWNoIGdpdmVzIHlvdSBhcnJheSBvZiBhbGwgZXZlbnQgaGFuZGxlcnMgdGhhdCB3aWxsIGJlIHRyaWdnZXJlZCBieSB0aGUgZ2l2ZW4gYG5hbWVgLlxuXG4gICAgID4gQXJndW1lbnRzXG5cbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkXG5cbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIGV2ZW50IGhhbmRsZXJzXG4gICAgXFwqL1xuICAgIGV2ZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICBlID0gZXZlbnRzLFxuICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgIGl0ZW1zLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBpaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBqaixcbiAgICAgICAgICAgIG5lcyxcbiAgICAgICAgICAgIGVzID0gW2VdLFxuICAgICAgICAgICAgb3V0ID0gW107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgbmVzID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGVzLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICBlID0gZXNbal0ubjtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtlW25hbWVzW2ldXSwgZVt3aWxkY2FyZF1dO1xuICAgICAgICAgICAgICAgIGsgPSAyO1xuICAgICAgICAgICAgICAgIHdoaWxlIChrLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2tdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQgPSBvdXQuY29uY2F0KGl0ZW0uZiB8fCBbXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlcyA9IG5lcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgXG4gICAgLypcXFxuICAgICAqIGV2ZS5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZS4gWW91IGNhbiB1c2Ugd2lsZGNhcmRzIOKAnGAqYOKAnSBmb3IgdGhlIG5hbWVzOlxuICAgICB8IGV2ZS5vbihcIioudW5kZXIuKlwiLCBmKTtcbiAgICAgfCBldmUoXCJtb3VzZS51bmRlci5mbG9vclwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHJldHVybmVkIGZ1bmN0aW9uIGFjY2VwdHMgYSBzaW5nbGUgbnVtZXJpYyBwYXJhbWV0ZXIgdGhhdCByZXByZXNlbnRzIHotaW5kZXggb2YgdGhlIGhhbmRsZXIuIEl0IGlzIGFuIG9wdGlvbmFsIGZlYXR1cmUgYW5kIG9ubHkgdXNlZCB3aGVuIHlvdSBuZWVkIHRvIGVuc3VyZSB0aGF0IHNvbWUgc3Vic2V0IG9mIGhhbmRsZXJzIHdpbGwgYmUgaW52b2tlZCBpbiBhIGdpdmVuIG9yZGVyLCBkZXNwaXRlIG9mIHRoZSBvcmRlciBvZiBhc3NpZ25tZW50LiBcbiAgICAgPiBFeGFtcGxlOlxuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIGVhdEl0KSgyKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBzY3JlYW0pO1xuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIGNhdGNoSXQpKDEpO1xuICAgICAqIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCBgY2F0Y2hJdCgpYCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBiZWZvcmUgYGVhdEl0KClgLlxuXHQgKlxuICAgICAqIElmIHlvdSB3YW50IHRvIHB1dCB5b3VyIGhhbmRsZXIgYmVmb3JlIG5vbi1pbmRleGVkIGhhbmRsZXJzLCBzcGVjaWZ5IGEgbmVnYXRpdmUgdmFsdWUuXG4gICAgICogTm90ZTogSSBhc3N1bWUgbW9zdCBvZiB0aGUgdGltZSB5b3UgZG9u4oCZdCBuZWVkIHRvIHdvcnJ5IGFib3V0IHotaW5kZXgsIGJ1dCBpdOKAmXMgbmljZSB0byBoYXZlIHRoaXMgZmVhdHVyZSDigJxqdXN0IGluIGNhc2XigJ0uXG4gICAgXFwqL1xuICAgIGV2ZS5vbiA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG5cdFx0bmFtZSA9IFN0cmluZyhuYW1lKTtcblx0XHRpZiAodHlwZW9mIGYgIT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge307XG5cdFx0fVxuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICBlID0gZXZlbnRzO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBlID0gZS5uO1xuICAgICAgICAgICAgZSA9IGUuaGFzT3duUHJvcGVydHkobmFtZXNbaV0pICYmIGVbbmFtZXNbaV1dIHx8IChlW25hbWVzW2ldXSA9IHtuOiB7fX0pO1xuICAgICAgICB9XG4gICAgICAgIGUuZiA9IGUuZiB8fCBbXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBlLmYubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKGUuZltpXSA9PSBmKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuO1xuICAgICAgICB9XG4gICAgICAgIGUuZi5wdXNoKGYpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHpJbmRleCkge1xuICAgICAgICAgICAgaWYgKCt6SW5kZXggPT0gK3pJbmRleCkge1xuICAgICAgICAgICAgICAgIGYuekluZGV4ID0gK3pJbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBmdW5jdGlvbiB0aGF0IHdpbGwgZmlyZSBnaXZlbiBldmVudCB3aXRoIG9wdGlvbmFsIGFyZ3VtZW50cy5cblx0ICogQXJndW1lbnRzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIHJlc3VsdCBmdW5jdGlvbiB3aWxsIGJlIGFsc29cblx0ICogY29uY2F0ZWQgdG8gdGhlIGxpc3Qgb2YgZmluYWwgYXJndW1lbnRzLlxuIFx0IHwgZWwub25jbGljayA9IGV2ZS5mKFwiY2xpY2tcIiwgMSwgMik7XG4gXHQgfCBldmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuIFx0IHwgICAgIGNvbnNvbGUubG9nKGEsIGIsIGMpOyAvLyAxLCAyLCBbZXZlbnQgb2JqZWN0XVxuIFx0IHwgfSk7XG4gICAgID4gQXJndW1lbnRzXG5cdCAtIGV2ZW50IChzdHJpbmcpIGV2ZW50IG5hbWVcblx0IC0gdmFyYXJncyAo4oCmKSBhbmQgYW55IG90aGVyIGFyZ3VtZW50c1xuXHQgPSAoZnVuY3Rpb24pIHBvc3NpYmxlIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG5cdGV2ZS5mID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0dmFyIGF0dHJzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRldmUuYXBwbHkobnVsbCwgW2V2ZW50LCBudWxsXS5jb25jYXQoYXR0cnMpLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTtcblx0XHR9O1xuXHR9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuc3RvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSXMgdXNlZCBpbnNpZGUgYW4gZXZlbnQgaGFuZGxlciB0byBzdG9wIHRoZSBldmVudCwgcHJldmVudGluZyBhbnkgc3Vic2VxdWVudCBsaXN0ZW5lcnMgZnJvbSBmaXJpbmcuXG4gICAgXFwqL1xuICAgIGV2ZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzdG9wID0gMTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUubnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvdWxkIGJlIHVzZWQgaW5zaWRlIGV2ZW50IGhhbmRsZXIgdG8gZmlndXJlIG91dCBhY3R1YWwgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gc3VibmFtZSAoc3RyaW5nKSAjb3B0aW9uYWwgc3VibmFtZSBvZiB0aGUgZXZlbnRcbiAgICAgKipcbiAgICAgPSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgaWYgYHN1Ym5hbWVgIGlzIG5vdCBzcGVjaWZpZWRcbiAgICAgKiBvclxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAsIGlmIGN1cnJlbnQgZXZlbnTigJlzIG5hbWUgY29udGFpbnMgYHN1Ym5hbWVgXG4gICAgXFwqL1xuICAgIGV2ZS5udCA9IGZ1bmN0aW9uIChzdWJuYW1lKSB7XG4gICAgICAgIGlmIChzdWJuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcIig/OlxcXFwufFxcXFwvfF4pXCIgKyBzdWJuYW1lICsgXCIoPzpcXFxcLnxcXFxcL3wkKVwiKS50ZXN0KGN1cnJlbnRfZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyZW50X2V2ZW50O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5udHNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvdWxkIGJlIHVzZWQgaW5zaWRlIGV2ZW50IGhhbmRsZXIgdG8gZmlndXJlIG91dCBhY3R1YWwgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICoqXG4gICAgICoqXG4gICAgID0gKGFycmF5KSBuYW1lcyBvZiB0aGUgZXZlbnRcbiAgICBcXCovXG4gICAgZXZlLm50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRfZXZlbnQuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub2ZmXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGdpdmVuIGZ1bmN0aW9uIGZyb20gdGhlIGxpc3Qgb2YgZXZlbnQgbGlzdGVuZXJzIGFzc2lnbmVkIHRvIGdpdmVuIG5hbWUuXG5cdCAqIElmIG5vIGFyZ3VtZW50cyBzcGVjaWZpZWQgYWxsIHRoZSBldmVudHMgd2lsbCBiZSBjbGVhcmVkLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIGV2ZS51bmJpbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBAZXZlLm9mZlxuICAgIFxcKi9cbiAgICBldmUub2ZmID0gZXZlLnVuYmluZCA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG5cdFx0aWYgKCFuYW1lKSB7XG5cdFx0ICAgIGV2ZS5fZXZlbnRzID0gZXZlbnRzID0ge246IHt9fTtcblx0XHRcdHJldHVybjtcblx0XHR9XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgIGUsXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBzcGxpY2UsXG4gICAgICAgICAgICBpLCBpaSwgaiwgamosXG4gICAgICAgICAgICBjdXIgPSBbZXZlbnRzXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY3VyLmxlbmd0aDsgaiArPSBzcGxpY2UubGVuZ3RoIC0gMikge1xuICAgICAgICAgICAgICAgIHNwbGljZSA9IFtqLCAxXTtcbiAgICAgICAgICAgICAgICBlID0gY3VyW2pdLm47XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzW2ldICE9IHdpbGRjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlW25hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtuYW1lc1tpXV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZSkgaWYgKGVbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1ci5zcGxpY2UuYXBwbHkoY3VyLCBzcGxpY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gY3VyLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGUgPSBjdXJbaV07XG4gICAgICAgICAgICB3aGlsZSAoZS5uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUuZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlLmYubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGUuZltqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5mLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFlLmYubGVuZ3RoICYmIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnVuY3MgPSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBmdW5jcy5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZnVuY3Nbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNzLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFmdW5jcy5sZW5ndGggJiYgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub25jZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZSB0byBvbmx5IHJ1biBvbmNlIHRoZW4gdW5iaW5kIGl0c2VsZi5cbiAgICAgfCBldmUub25jZShcImxvZ2luXCIsIGYpO1xuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIG5vIGxpc3RlbmVyc1xuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHNhbWUgcmV0dXJuIGZ1bmN0aW9uIGFzIEBldmUub25cbiAgICBcXCovXG4gICAgZXZlLm9uY2UgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuICAgICAgICB2YXIgZjIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBldmUudW5iaW5kKG5hbWUsIGYyKTtcbiAgICAgICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBldmUub24obmFtZSwgZjIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS52ZXJzaW9uXG4gICAgIFsgcHJvcGVydHkgKHN0cmluZykgXVxuICAgICAqKlxuICAgICAqIEN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgbGlicmFyeS5cbiAgICBcXCovXG4gICAgZXZlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgIGV2ZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWW91IGFyZSBydW5uaW5nIEV2ZSBcIiArIHZlcnNpb247XG4gICAgfTtcbiAgICAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSA/IChtb2R1bGUuZXhwb3J0cyA9IGV2ZSkgOiAodHlwZW9mIGRlZmluZSAhPSBcInVuZGVmaW5lZFwiID8gKGRlZmluZShcImV2ZVwiLCBbXSwgZnVuY3Rpb24oKSB7IHJldHVybiBldmU7IH0pKSA6IChnbG9iLmV2ZSA9IGV2ZSkpO1xufSkodGhpcyk7XG4iLCIvLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIFJhcGhhw6tsIDIuMS4zIC0gSmF2YVNjcmlwdCBWZWN0b3IgTGlicmFyeSAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IMKpIDIwMDgtMjAxMiBEbWl0cnkgQmFyYW5vdnNraXkgKGh0dHA6Ly9yYXBoYWVsanMuY29tKSAgICDilIIgXFxcXFxuLy8g4pSCIENvcHlyaWdodCDCqSAyMDA4LTIwMTIgU2VuY2hhIExhYnMgKGh0dHA6Ly9zZW5jaGEuY29tKSAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCAoaHR0cDovL3JhcGhhZWxqcy5jb20vbGljZW5zZS5odG1sKSBsaWNlbnNlLuKUgiBcXFxcXG4vLyDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggXFxcXFxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLy8g4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQIFxcXFxcbi8vIOKUgiBFdmUgMC40LjIgLSBKYXZhU2NyaXB0IEV2ZW50cyBMaWJyYXJ5ICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIEF1dGhvciBEbWl0cnkgQmFyYW5vdnNraXkgKGh0dHA6Ly9kbWl0cnkuYmFyYW5vdnNraXkuY29tLykg4pSCIFxcXFxcbi8vIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCBcXFxcXG5cbihmdW5jdGlvbiAoZ2xvYikge1xuICAgIHZhciB2ZXJzaW9uID0gXCIwLjQuMlwiLFxuICAgICAgICBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIHNlcGFyYXRvciA9IC9bXFwuXFwvXS8sXG4gICAgICAgIHdpbGRjYXJkID0gXCIqXCIsXG4gICAgICAgIGZ1biA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBudW1zb3J0ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVudF9ldmVudCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZXZlbnRzID0ge246IHt9fSxcbiAgICAvKlxcXG4gICAgICogZXZlXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIEZpcmVzIGV2ZW50IHdpdGggZ2l2ZW4gYG5hbWVgLCBnaXZlbiBzY29wZSBhbmQgb3RoZXIgcGFyYW1ldGVycy5cblxuICAgICA+IEFyZ3VtZW50c1xuXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSAqZXZlbnQqLCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkXG4gICAgIC0gc2NvcGUgKG9iamVjdCkgY29udGV4dCBmb3IgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgIC0gdmFyYXJncyAoLi4uKSB0aGUgcmVzdCBvZiBhcmd1bWVudHMgd2lsbCBiZSBzZW50IHRvIGV2ZW50IGhhbmRsZXJzXG5cbiAgICAgPSAob2JqZWN0KSBhcnJheSBvZiByZXR1cm5lZCB2YWx1ZXMgZnJvbSB0aGUgbGlzdGVuZXJzXG4gICAgXFwqL1xuICAgICAgICBldmUgPSBmdW5jdGlvbiAobmFtZSwgc2NvcGUpIHtcblx0XHRcdG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgICAgICB2YXIgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgICAgICBvbGRzdG9wID0gc3RvcCxcbiAgICAgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSxcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBldmUubGlzdGVuZXJzKG5hbWUpLFxuICAgICAgICAgICAgICAgIHogPSAwLFxuICAgICAgICAgICAgICAgIGYgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBsLFxuICAgICAgICAgICAgICAgIGluZGV4ZWQgPSBbXSxcbiAgICAgICAgICAgICAgICBxdWV1ZSA9IHt9LFxuICAgICAgICAgICAgICAgIG91dCA9IFtdLFxuICAgICAgICAgICAgICAgIGNlID0gY3VycmVudF9ldmVudCxcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSBuYW1lO1xuICAgICAgICAgICAgc3RvcCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKFwiekluZGV4XCIgaW4gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhlZC5wdXNoKGxpc3RlbmVyc1tpXS56SW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0uekluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZVtsaXN0ZW5lcnNbaV0uekluZGV4XSA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleGVkLnNvcnQobnVtc29ydCk7XG4gICAgICAgICAgICB3aGlsZSAoaW5kZXhlZFt6XSA8IDApIHtcbiAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6KytdXTtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IG9sZHN0b3A7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChcInpJbmRleFwiIGluIGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGwuekluZGV4ID09IGluZGV4ZWRbel0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeisrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBxdWV1ZVtpbmRleGVkW3pdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsICYmIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChsKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVbbC56SW5kZXhdID0gbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcCA9IG9sZHN0b3A7XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gY2U7XG4gICAgICAgICAgICByZXR1cm4gb3V0Lmxlbmd0aCA/IG91dCA6IG51bGw7XG4gICAgICAgIH07XG5cdFx0Ly8gVW5kb2N1bWVudGVkLiBEZWJ1ZyBvbmx5LlxuXHRcdGV2ZS5fZXZlbnRzID0gZXZlbnRzO1xuICAgIC8qXFxcbiAgICAgKiBldmUubGlzdGVuZXJzXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIEludGVybmFsIG1ldGhvZCB3aGljaCBnaXZlcyB5b3UgYXJyYXkgb2YgYWxsIGV2ZW50IGhhbmRsZXJzIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIGBuYW1lYC5cblxuICAgICA+IEFyZ3VtZW50c1xuXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiBldmVudCBoYW5kbGVyc1xuICAgIFxcKi9cbiAgICBldmUubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICBpdGVtcyxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaWksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgamosXG4gICAgICAgICAgICBuZXMsXG4gICAgICAgICAgICBlcyA9IFtlXSxcbiAgICAgICAgICAgIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIG5lcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlcy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgZSA9IGVzW2pdLm47XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBbZVtuYW1lc1tpXV0sIGVbd2lsZGNhcmRdXTtcbiAgICAgICAgICAgICAgICBrID0gMjtcbiAgICAgICAgICAgICAgICB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1trXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ID0gb3V0LmNvbmNhdChpdGVtLmYgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXMgPSBuZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBldmUub25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJpbmRzIGdpdmVuIGV2ZW50IGhhbmRsZXIgd2l0aCBhIGdpdmVuIG5hbWUuIFlvdSBjYW4gdXNlIHdpbGRjYXJkcyDigJxgKmDigJ0gZm9yIHRoZSBuYW1lczpcbiAgICAgfCBldmUub24oXCIqLnVuZGVyLipcIiwgZik7XG4gICAgIHwgZXZlKFwibW91c2UudW5kZXIuZmxvb3JcIik7IC8vIHRyaWdnZXJzIGZcbiAgICAgKiBVc2UgQGV2ZSB0byB0cmlnZ2VyIHRoZSBsaXN0ZW5lci5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSByZXR1cm5lZCBmdW5jdGlvbiBhY2NlcHRzIGEgc2luZ2xlIG51bWVyaWMgcGFyYW1ldGVyIHRoYXQgcmVwcmVzZW50cyB6LWluZGV4IG9mIHRoZSBoYW5kbGVyLiBJdCBpcyBhbiBvcHRpb25hbCBmZWF0dXJlIGFuZCBvbmx5IHVzZWQgd2hlbiB5b3UgbmVlZCB0byBlbnN1cmUgdGhhdCBzb21lIHN1YnNldCBvZiBoYW5kbGVycyB3aWxsIGJlIGludm9rZWQgaW4gYSBnaXZlbiBvcmRlciwgZGVzcGl0ZSBvZiB0aGUgb3JkZXIgb2YgYXNzaWdubWVudC4gXG4gICAgID4gRXhhbXBsZTpcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBlYXRJdCkoMik7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgc2NyZWFtKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBjYXRjaEl0KSgxKTtcbiAgICAgKiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgYGNhdGNoSXQoKWAgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYmVmb3JlIGBlYXRJdCgpYC5cblx0ICpcbiAgICAgKiBJZiB5b3Ugd2FudCB0byBwdXQgeW91ciBoYW5kbGVyIGJlZm9yZSBub24taW5kZXhlZCBoYW5kbGVycywgc3BlY2lmeSBhIG5lZ2F0aXZlIHZhbHVlLlxuICAgICAqIE5vdGU6IEkgYXNzdW1lIG1vc3Qgb2YgdGhlIHRpbWUgeW91IGRvbuKAmXQgbmVlZCB0byB3b3JyeSBhYm91dCB6LWluZGV4LCBidXQgaXTigJlzIG5pY2UgdG8gaGF2ZSB0aGlzIGZlYXR1cmUg4oCcanVzdCBpbiBjYXNl4oCdLlxuICAgIFxcKi9cbiAgICBldmUub24gPSBmdW5jdGlvbiAobmFtZSwgZikge1xuXHRcdG5hbWUgPSBTdHJpbmcobmFtZSk7XG5cdFx0aWYgKHR5cGVvZiBmICE9IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHt9O1xuXHRcdH1cbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSA9IGV2ZW50cztcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZSA9IGUubjtcbiAgICAgICAgICAgIGUgPSBlLmhhc093blByb3BlcnR5KG5hbWVzW2ldKSAmJiBlW25hbWVzW2ldXSB8fCAoZVtuYW1lc1tpXV0gPSB7bjoge319KTtcbiAgICAgICAgfVxuICAgICAgICBlLmYgPSBlLmYgfHwgW107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gZS5mLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChlLmZbaV0gPT0gZikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bjtcbiAgICAgICAgfVxuICAgICAgICBlLmYucHVzaChmKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh6SW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgrekluZGV4ID09ICt6SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmLnpJbmRleCA9ICt6SW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgZ2l2ZW4gZXZlbnQgd2l0aCBvcHRpb25hbCBhcmd1bWVudHMuXG5cdCAqIEFyZ3VtZW50cyB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSByZXN1bHQgZnVuY3Rpb24gd2lsbCBiZSBhbHNvXG5cdCAqIGNvbmNhdGVkIHRvIHRoZSBsaXN0IG9mIGZpbmFsIGFyZ3VtZW50cy5cbiBcdCB8IGVsLm9uY2xpY2sgPSBldmUuZihcImNsaWNrXCIsIDEsIDIpO1xuIFx0IHwgZXZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiBcdCB8ICAgICBjb25zb2xlLmxvZyhhLCBiLCBjKTsgLy8gMSwgMiwgW2V2ZW50IG9iamVjdF1cbiBcdCB8IH0pO1xuICAgICA+IEFyZ3VtZW50c1xuXHQgLSBldmVudCAoc3RyaW5nKSBldmVudCBuYW1lXG5cdCAtIHZhcmFyZ3MgKOKApikgYW5kIGFueSBvdGhlciBhcmd1bWVudHNcblx0ID0gKGZ1bmN0aW9uKSBwb3NzaWJsZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgXFwqL1xuXHRldmUuZiA9IGZ1bmN0aW9uIChldmVudCkge1xuXHRcdHZhciBhdHRycyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZXZlLmFwcGx5KG51bGwsIFtldmVudCwgbnVsbF0uY29uY2F0KGF0dHJzKS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7XG5cdFx0fTtcblx0fTtcbiAgICAvKlxcXG4gICAgICogZXZlLnN0b3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIElzIHVzZWQgaW5zaWRlIGFuIGV2ZW50IGhhbmRsZXIgdG8gc3RvcCB0aGUgZXZlbnQsIHByZXZlbnRpbmcgYW55IHN1YnNlcXVlbnQgbGlzdGVuZXJzIGZyb20gZmlyaW5nLlxuICAgIFxcKi9cbiAgICBldmUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RvcCA9IDE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIHN1Ym5hbWUgKHN0cmluZykgI29wdGlvbmFsIHN1Ym5hbWUgb2YgdGhlIGV2ZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGlmIGBzdWJuYW1lYCBpcyBub3Qgc3BlY2lmaWVkXG4gICAgICogb3JcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgLCBpZiBjdXJyZW50IGV2ZW504oCZcyBuYW1lIGNvbnRhaW5zIGBzdWJuYW1lYFxuICAgIFxcKi9cbiAgICBldmUubnQgPSBmdW5jdGlvbiAoc3VibmFtZSkge1xuICAgICAgICBpZiAoc3VibmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCIoPzpcXFxcLnxcXFxcL3xeKVwiICsgc3VibmFtZSArIFwiKD86XFxcXC58XFxcXC98JClcIikudGVzdChjdXJyZW50X2V2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudF9ldmVudDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUubnRzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICAqKlxuICAgICA9IChhcnJheSkgbmFtZXMgb2YgdGhlIGV2ZW50XG4gICAgXFwqL1xuICAgIGV2ZS5udHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50X2V2ZW50LnNwbGl0KHNlcGFyYXRvcik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9mZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGV2ZW50IGxpc3RlbmVycyBhc3NpZ25lZCB0byBnaXZlbiBuYW1lLlxuXHQgKiBJZiBubyBhcmd1bWVudHMgc3BlY2lmaWVkIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgY2xlYXJlZC5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBldmUudW5iaW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQGV2ZS5vZmZcbiAgICBcXCovXG4gICAgZXZlLm9mZiA9IGV2ZS51bmJpbmQgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuXHRcdGlmICghbmFtZSkge1xuXHRcdCAgICBldmUuX2V2ZW50cyA9IGV2ZW50cyA9IHtuOiB7fX07XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICBlLFxuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgc3BsaWNlLFxuICAgICAgICAgICAgaSwgaWksIGosIGpqLFxuICAgICAgICAgICAgY3VyID0gW2V2ZW50c107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGN1ci5sZW5ndGg7IGogKz0gc3BsaWNlLmxlbmd0aCAtIDIpIHtcbiAgICAgICAgICAgICAgICBzcGxpY2UgPSBbaiwgMV07XG4gICAgICAgICAgICAgICAgZSA9IGN1cltqXS5uO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lc1tpXSAhPSB3aWxkY2FyZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZVtuYW1lc1tpXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGljZS5wdXNoKGVbbmFtZXNbaV1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUpIGlmIChlW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtrZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXIuc3BsaWNlLmFwcGx5KGN1ciwgc3BsaWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGN1ci5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBlID0gY3VyW2ldO1xuICAgICAgICAgICAgd2hpbGUgKGUubikge1xuICAgICAgICAgICAgICAgIGlmIChmKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZS5mLmxlbmd0aDsgaiA8IGpqOyBqKyspIGlmIChlLmZbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuZi5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAhZS5mLmxlbmd0aCAmJiBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUubikgaWYgKGUubltoYXNdKGtleSkgJiYgZS5uW2tleV0uZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bmNzID0gZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZnVuY3MubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGZ1bmNzW2pdID09IGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAhZnVuY3MubGVuZ3RoICYmIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGUuZjtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlID0gZS5uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9uY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJpbmRzIGdpdmVuIGV2ZW50IGhhbmRsZXIgd2l0aCBhIGdpdmVuIG5hbWUgdG8gb25seSBydW4gb25jZSB0aGVuIHVuYmluZCBpdHNlbGYuXG4gICAgIHwgZXZlLm9uY2UoXCJsb2dpblwiLCBmKTtcbiAgICAgfCBldmUoXCJsb2dpblwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyBubyBsaXN0ZW5lcnNcbiAgICAgKiBVc2UgQGV2ZSB0byB0cmlnZ2VyIHRoZSBsaXN0ZW5lci5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSBzYW1lIHJldHVybiBmdW5jdGlvbiBhcyBAZXZlLm9uXG4gICAgXFwqL1xuICAgIGV2ZS5vbmNlID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcbiAgICAgICAgdmFyIGYyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlLnVuYmluZChuYW1lLCBmMik7XG4gICAgICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZXZlLm9uKG5hbWUsIGYyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUudmVyc2lvblxuICAgICBbIHByb3BlcnR5IChzdHJpbmcpIF1cbiAgICAgKipcbiAgICAgKiBDdXJyZW50IHZlcnNpb24gb2YgdGhlIGxpYnJhcnkuXG4gICAgXFwqL1xuICAgIGV2ZS52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICBldmUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIllvdSBhcmUgcnVubmluZyBFdmUgXCIgKyB2ZXJzaW9uO1xuICAgIH07XG4gICAgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykgPyAobW9kdWxlLmV4cG9ydHMgPSBldmUpIDogKHR5cGVvZiBkZWZpbmUgIT0gXCJ1bmRlZmluZWRcIiA/IChkZWZpbmUoXCJldmVcIiwgW10sIGZ1bmN0aW9uKCkgeyByZXR1cm4gZXZlOyB9KSkgOiAoZ2xvYi5ldmUgPSBldmUpKTtcbn0pKHdpbmRvdyB8fCB0aGlzKTtcbi8vIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCBcXFxcXG4vLyDilIIgXCJSYXBoYcOrbCAyLjEuMlwiIC0gSmF2YVNjcmlwdCBWZWN0b3IgTGlicmFyeSAgICAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMSBEbWl0cnkgQmFyYW5vdnNraXkgKGh0dHA6Ly9yYXBoYWVsanMuY29tKSAgIOKUgiBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTEgU2VuY2hhIExhYnMgKGh0dHA6Ly9zZW5jaGEuY29tKSAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSCIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgKGh0dHA6Ly9yYXBoYWVsanMuY29tL2xpY2Vuc2UuaHRtbCkgbGljZW5zZS4g4pSCIFxcXFxcbi8vIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCBcXFxcXG5cbihmdW5jdGlvbiAoZ2xvYiwgZmFjdG9yeSkge1xuICAgIC8vIEFNRCBzdXBwb3J0XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIERlZmluZSBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlXG4gICAgICAgIGRlZmluZShbXCJldmVcIl0sIGZ1bmN0aW9uKCBldmUgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yeShnbG9iLCBldmUpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHMgKGdsb2IgaXMgd2luZG93KVxuICAgICAgICAvLyBSYXBoYWVsIGFkZHMgaXRzZWxmIHRvIHdpbmRvd1xuICAgICAgICBmYWN0b3J5KGdsb2IsIGdsb2IuZXZlIHx8ICh0eXBlb2YgcmVxdWlyZSA9PSBcImZ1bmN0aW9uXCIgJiYgcmVxdWlyZSgnZXZlJykpICk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAod2luZG93LCBldmUpIHtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGNhbnZhcyBvYmplY3Qgb24gd2hpY2ggdG8gZHJhdy5cbiAgICAgKiBZb3UgbXVzdCBkbyB0aGlzIGZpcnN0LCBhcyBhbGwgZnV0dXJlIGNhbGxzIHRvIGRyYXdpbmcgbWV0aG9kc1xuICAgICAqIGZyb20gdGhpcyBpbnN0YW5jZSB3aWxsIGJlIGJvdW5kIHRvIHRoaXMgY2FudmFzLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBjb250YWluZXIgKEhUTUxFbGVtZW50fHN0cmluZykgRE9NIGVsZW1lbnQgb3IgaXRzIElEIHdoaWNoIGlzIGdvaW5nIHRvIGJlIGEgcGFyZW50IGZvciBkcmF3aW5nIHN1cmZhY2VcbiAgICAgLSB3aWR0aCAobnVtYmVyKVxuICAgICAtIGhlaWdodCAobnVtYmVyKVxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHdoaWNoIGlzIGdvaW5nIHRvIGJlIGV4ZWN1dGVkIGluIHRoZSBjb250ZXh0IG9mIG5ld2x5IGNyZWF0ZWQgcGFwZXJcbiAgICAgKiBvclxuICAgICAtIHggKG51bWJlcilcbiAgICAgLSB5IChudW1iZXIpXG4gICAgIC0gd2lkdGggKG51bWJlcilcbiAgICAgLSBoZWlnaHQgKG51bWJlcilcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB3aGljaCBpcyBnb2luZyB0byBiZSBleGVjdXRlZCBpbiB0aGUgY29udGV4dCBvZiBuZXdseSBjcmVhdGVkIHBhcGVyXG4gICAgICogb3JcbiAgICAgLSBhbGwgKGFycmF5KSAoZmlyc3QgMyBvciA0IGVsZW1lbnRzIGluIHRoZSBhcnJheSBhcmUgZXF1YWwgdG8gW2NvbnRhaW5lcklELCB3aWR0aCwgaGVpZ2h0XSBvciBbeCwgeSwgd2lkdGgsIGhlaWdodF0uIFRoZSByZXN0IGFyZSBlbGVtZW50IGRlc2NyaXB0aW9ucyBpbiBmb3JtYXQge3R5cGU6IHR5cGUsIDxhdHRyaWJ1dGVzPn0pLiBTZWUgQFBhcGVyLmFkZC5cbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB3aGljaCBpcyBnb2luZyB0byBiZSBleGVjdXRlZCBpbiB0aGUgY29udGV4dCBvZiBuZXdseSBjcmVhdGVkIHBhcGVyXG4gICAgICogb3JcbiAgICAgLSBvblJlYWR5Q2FsbGJhY2sgKGZ1bmN0aW9uKSBmdW5jdGlvbiB0aGF0IGlzIGdvaW5nIHRvIGJlIGNhbGxlZCBvbiBET00gcmVhZHkgZXZlbnQuIFlvdSBjYW4gYWxzbyBzdWJzY3JpYmUgdG8gdGhpcyBldmVudCB2aWEgRXZl4oCZcyDigJxET01Mb2Fk4oCdIGV2ZW50LiBJbiB0aGlzIGNhc2UgbWV0aG9kIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gICAgID0gKG9iamVjdCkgQFBhcGVyXG4gICAgID4gVXNhZ2VcbiAgICAgfCAvLyBFYWNoIG9mIHRoZSBmb2xsb3dpbmcgZXhhbXBsZXMgY3JlYXRlIGEgY2FudmFzXG4gICAgIHwgLy8gdGhhdCBpcyAzMjBweCB3aWRlIGJ5IDIwMHB4IGhpZ2guXG4gICAgIHwgLy8gQ2FudmFzIGlzIGNyZWF0ZWQgYXQgdGhlIHZpZXdwb3J04oCZcyAxMCw1MCBjb29yZGluYXRlLlxuICAgICB8IHZhciBwYXBlciA9IFJhcGhhZWwoMTAsIDUwLCAzMjAsIDIwMCk7XG4gICAgIHwgLy8gQ2FudmFzIGlzIGNyZWF0ZWQgYXQgdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiB0aGUgI25vdGVwYWQgZWxlbWVudFxuICAgICB8IC8vIChvciBpdHMgdG9wIHJpZ2h0IGNvcm5lciBpbiBkaXI9XCJydGxcIiBlbGVtZW50cylcbiAgICAgfCB2YXIgcGFwZXIgPSBSYXBoYWVsKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90ZXBhZFwiKSwgMzIwLCAyMDApO1xuICAgICB8IC8vIFNhbWUgYXMgYWJvdmVcbiAgICAgfCB2YXIgcGFwZXIgPSBSYXBoYWVsKFwibm90ZXBhZFwiLCAzMjAsIDIwMCk7XG4gICAgIHwgLy8gSW1hZ2UgZHVtcFxuICAgICB8IHZhciBzZXQgPSBSYXBoYWVsKFtcIm5vdGVwYWRcIiwgMzIwLCAyMDAsIHtcbiAgICAgfCAgICAgdHlwZTogXCJyZWN0XCIsXG4gICAgIHwgICAgIHg6IDEwLFxuICAgICB8ICAgICB5OiAxMCxcbiAgICAgfCAgICAgd2lkdGg6IDI1LFxuICAgICB8ICAgICBoZWlnaHQ6IDI1LFxuICAgICB8ICAgICBzdHJva2U6IFwiI2YwMFwiXG4gICAgIHwgfSwge1xuICAgICB8ICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgfCAgICAgeDogMzAsXG4gICAgIHwgICAgIHk6IDQwLFxuICAgICB8ICAgICB0ZXh0OiBcIkR1bXBcIlxuICAgICB8IH1dKTtcbiAgICBcXCovXG4gICAgZnVuY3Rpb24gUihmaXJzdCkge1xuICAgICAgICBpZiAoUi5pcyhmaXJzdCwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRlZCA/IGZpcnN0KCkgOiBldmUub24oXCJyYXBoYWVsLkRPTWxvYWRcIiwgZmlyc3QpO1xuICAgICAgICB9IGVsc2UgaWYgKFIuaXMoZmlyc3QsIGFycmF5KSkge1xuICAgICAgICAgICAgcmV0dXJuIFIuX2VuZ2luZS5jcmVhdGVbYXBwbHldKFIsIGZpcnN0LnNwbGljZSgwLCAzICsgUi5pcyhmaXJzdFswXSwgbnUpKSkuYWRkKGZpcnN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgICAgICAgIGlmIChSLmlzKGFyZ3NbYXJncy5sZW5ndGggLSAxXSwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgICAgIHZhciBmID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9hZGVkID8gZi5jYWxsKFIuX2VuZ2luZS5jcmVhdGVbYXBwbHldKFIsIGFyZ3MpKSA6IGV2ZS5vbihcInJhcGhhZWwuRE9NbG9hZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGYuY2FsbChSLl9lbmdpbmUuY3JlYXRlW2FwcGx5XShSLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBSLl9lbmdpbmUuY3JlYXRlW2FwcGx5XShSLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFIudmVyc2lvbiA9IFwiMi4xLjJcIjtcbiAgICBSLmV2ZSA9IGV2ZTtcbiAgICB2YXIgbG9hZGVkLFxuICAgICAgICBzZXBhcmF0b3IgPSAvWywgXSsvLFxuICAgICAgICBlbGVtZW50cyA9IHtjaXJjbGU6IDEsIHJlY3Q6IDEsIHBhdGg6IDEsIGVsbGlwc2U6IDEsIHRleHQ6IDEsIGltYWdlOiAxfSxcbiAgICAgICAgZm9ybWF0cmcgPSAvXFx7KFxcZCspXFx9L2csXG4gICAgICAgIHByb3RvID0gXCJwcm90b3R5cGVcIixcbiAgICAgICAgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBnID0ge1xuICAgICAgICAgICAgZG9jOiBkb2N1bWVudCxcbiAgICAgICAgICAgIHdpbjogd2luZG93XG4gICAgICAgIH0sXG4gICAgICAgIG9sZFJhcGhhZWwgPSB7XG4gICAgICAgICAgICB3YXM6IE9iamVjdC5wcm90b3R5cGVbaGFzXS5jYWxsKGcud2luLCBcIlJhcGhhZWxcIiksXG4gICAgICAgICAgICBpczogZy53aW4uUmFwaGFlbFxuICAgICAgICB9LFxuICAgICAgICBQYXBlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qXFxcbiAgICAgICAgICAgICAqIFBhcGVyLmNhXG4gICAgICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAgICAgKipcbiAgICAgICAgICAgICAqIFNob3J0Y3V0IGZvciBAUGFwZXIuY3VzdG9tQXR0cmlidXRlc1xuICAgICAgICAgICAgXFwqL1xuICAgICAgICAgICAgLypcXFxuICAgICAgICAgICAgICogUGFwZXIuY3VzdG9tQXR0cmlidXRlc1xuICAgICAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgICAgICoqXG4gICAgICAgICAgICAgKiBJZiB5b3UgaGF2ZSBhIHNldCBvZiBhdHRyaWJ1dGVzIHRoYXQgeW91IHdvdWxkIGxpa2UgdG8gcmVwcmVzZW50XG4gICAgICAgICAgICAgKiBhcyBhIGZ1bmN0aW9uIG9mIHNvbWUgbnVtYmVyIHlvdSBjYW4gZG8gaXQgZWFzaWx5IHdpdGggY3VzdG9tIGF0dHJpYnV0ZXM6XG4gICAgICAgICAgICAgPiBVc2FnZVxuICAgICAgICAgICAgIHwgcGFwZXIuY3VzdG9tQXR0cmlidXRlcy5odWUgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgICAgICAgICAgfCAgICAgbnVtID0gbnVtICUgMTtcbiAgICAgICAgICAgICB8ICAgICByZXR1cm4ge2ZpbGw6IFwiaHNiKFwiICsgbnVtICsgXCIsIDAuNzUsIDEpXCJ9O1xuICAgICAgICAgICAgIHwgfTtcbiAgICAgICAgICAgICB8IC8vIEN1c3RvbSBhdHRyaWJ1dGUg4oCcaHVl4oCdIHdpbGwgY2hhbmdlIGZpbGxcbiAgICAgICAgICAgICB8IC8vIHRvIGJlIGdpdmVuIGh1ZSB3aXRoIGZpeGVkIHNhdHVyYXRpb24gYW5kIGJyaWdodG5lc3MuXG4gICAgICAgICAgICAgfCAvLyBOb3cgeW91IGNhbiB1c2UgaXQgbGlrZSB0aGlzOlxuICAgICAgICAgICAgIHwgdmFyIGMgPSBwYXBlci5jaXJjbGUoMTAsIDEwLCAxMCkuYXR0cih7aHVlOiAuNDV9KTtcbiAgICAgICAgICAgICB8IC8vIG9yIGV2ZW4gbGlrZSB0aGlzOlxuICAgICAgICAgICAgIHwgYy5hbmltYXRlKHtodWU6IDF9LCAxZTMpO1xuICAgICAgICAgICAgIHxcbiAgICAgICAgICAgICB8IC8vIFlvdSBjb3VsZCBhbHNvIGNyZWF0ZSBjdXN0b20gYXR0cmlidXRlXG4gICAgICAgICAgICAgfCAvLyB3aXRoIG11bHRpcGxlIHBhcmFtZXRlcnM6XG4gICAgICAgICAgICAgfCBwYXBlci5jdXN0b21BdHRyaWJ1dGVzLmhzYiA9IGZ1bmN0aW9uIChoLCBzLCBiKSB7XG4gICAgICAgICAgICAgfCAgICAgcmV0dXJuIHtmaWxsOiBcImhzYihcIiArIFtoLCBzLCBiXS5qb2luKFwiLFwiKSArIFwiKVwifTtcbiAgICAgICAgICAgICB8IH07XG4gICAgICAgICAgICAgfCBjLmF0dHIoe2hzYjogXCIwLjUgLjggMVwifSk7XG4gICAgICAgICAgICAgfCBjLmFuaW1hdGUoe2hzYjogWzEsIDAsIDAuNV19LCAxZTMpO1xuICAgICAgICAgICAgXFwqL1xuICAgICAgICAgICAgdGhpcy5jYSA9IHRoaXMuY3VzdG9tQXR0cmlidXRlcyA9IHt9O1xuICAgICAgICB9LFxuICAgICAgICBwYXBlcnByb3RvLFxuICAgICAgICBhcHBlbmRDaGlsZCA9IFwiYXBwZW5kQ2hpbGRcIixcbiAgICAgICAgYXBwbHkgPSBcImFwcGx5XCIsXG4gICAgICAgIGNvbmNhdCA9IFwiY29uY2F0XCIsXG4gICAgICAgIHN1cHBvcnRzVG91Y2ggPSAoJ29udG91Y2hzdGFydCcgaW4gZy53aW4pIHx8IGcud2luLkRvY3VtZW50VG91Y2ggJiYgZy5kb2MgaW5zdGFuY2VvZiBEb2N1bWVudFRvdWNoLCAvL3Rha2VuIGZyb20gTW9kZXJuaXpyIHRvdWNoIHRlc3RcbiAgICAgICAgRSA9IFwiXCIsXG4gICAgICAgIFMgPSBcIiBcIixcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICBzcGxpdCA9IFwic3BsaXRcIixcbiAgICAgICAgZXZlbnRzID0gXCJjbGljayBkYmxjbGljayBtb3VzZWRvd24gbW91c2Vtb3ZlIG1vdXNlb3V0IG1vdXNlb3ZlciBtb3VzZXVwIHRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHRvdWNoY2FuY2VsXCJbc3BsaXRdKFMpLFxuICAgICAgICB0b3VjaE1hcCA9IHtcbiAgICAgICAgICAgIG1vdXNlZG93bjogXCJ0b3VjaHN0YXJ0XCIsXG4gICAgICAgICAgICBtb3VzZW1vdmU6IFwidG91Y2htb3ZlXCIsXG4gICAgICAgICAgICBtb3VzZXVwOiBcInRvdWNoZW5kXCJcbiAgICAgICAgfSxcbiAgICAgICAgbG93ZXJDYXNlID0gU3RyLnByb3RvdHlwZS50b0xvd2VyQ2FzZSxcbiAgICAgICAgbWF0aCA9IE1hdGgsXG4gICAgICAgIG1tYXggPSBtYXRoLm1heCxcbiAgICAgICAgbW1pbiA9IG1hdGgubWluLFxuICAgICAgICBhYnMgPSBtYXRoLmFicyxcbiAgICAgICAgcG93ID0gbWF0aC5wb3csXG4gICAgICAgIFBJID0gbWF0aC5QSSxcbiAgICAgICAgbnUgPSBcIm51bWJlclwiLFxuICAgICAgICBzdHJpbmcgPSBcInN0cmluZ1wiLFxuICAgICAgICBhcnJheSA9IFwiYXJyYXlcIixcbiAgICAgICAgdG9TdHJpbmcgPSBcInRvU3RyaW5nXCIsXG4gICAgICAgIGZpbGxTdHJpbmcgPSBcImZpbGxcIixcbiAgICAgICAgb2JqZWN0VG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBwYXBlciA9IHt9LFxuICAgICAgICBwdXNoID0gXCJwdXNoXCIsXG4gICAgICAgIElTVVJMID0gUi5fSVNVUkwgPSAvXnVybFxcKFsnXCJdPyguKz8pWydcIl0/XFwpJC9pLFxuICAgICAgICBjb2xvdXJSZWdFeHAgPSAvXlxccyooKCNbYS1mXFxkXXs2fSl8KCNbYS1mXFxkXXszfSl8cmdiYT9cXChcXHMqKFtcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSslPyg/OlxccyosXFxzKltcXGRcXC5dKyU/KT8pXFxzKlxcKXxoc2JhP1xcKFxccyooW1xcZFxcLl0rKD86ZGVnfFxceGIwfCUpP1xccyosXFxzKltcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rKD86JT9cXHMqLFxccypbXFxkXFwuXSspPyklP1xccypcXCl8aHNsYT9cXChcXHMqKFtcXGRcXC5dKyg/OmRlZ3xcXHhiMHwlKT9cXHMqLFxccypbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyg/OiU/XFxzKixcXHMqW1xcZFxcLl0rKT8pJT9cXHMqXFwpKVxccyokL2ksXG4gICAgICAgIGlzbmFuID0ge1wiTmFOXCI6IDEsIFwiSW5maW5pdHlcIjogMSwgXCItSW5maW5pdHlcIjogMX0sXG4gICAgICAgIGJlemllcnJnID0gL14oPzpjdWJpYy0pP2JlemllclxcKChbXixdKyksKFteLF0rKSwoW14sXSspLChbXlxcKV0rKVxcKS8sXG4gICAgICAgIHJvdW5kID0gbWF0aC5yb3VuZCxcbiAgICAgICAgc2V0QXR0cmlidXRlID0gXCJzZXRBdHRyaWJ1dGVcIixcbiAgICAgICAgdG9GbG9hdCA9IHBhcnNlRmxvYXQsXG4gICAgICAgIHRvSW50ID0gcGFyc2VJbnQsXG4gICAgICAgIHVwcGVyQ2FzZSA9IFN0ci5wcm90b3R5cGUudG9VcHBlckNhc2UsXG4gICAgICAgIGF2YWlsYWJsZUF0dHJzID0gUi5fYXZhaWxhYmxlQXR0cnMgPSB7XG4gICAgICAgICAgICBcImFycm93LWVuZFwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwiYXJyb3ctc3RhcnRcIjogXCJub25lXCIsXG4gICAgICAgICAgICBibHVyOiAwLFxuICAgICAgICAgICAgXCJjbGlwLXJlY3RcIjogXCIwIDAgMWU5IDFlOVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBcImRlZmF1bHRcIixcbiAgICAgICAgICAgIGN4OiAwLFxuICAgICAgICAgICAgY3k6IDAsXG4gICAgICAgICAgICBmaWxsOiBcIiNmZmZcIixcbiAgICAgICAgICAgIFwiZmlsbC1vcGFjaXR5XCI6IDEsXG4gICAgICAgICAgICBmb250OiAnMTBweCBcIkFyaWFsXCInLFxuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiAnXCJBcmlhbFwiJyxcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMTBcIixcbiAgICAgICAgICAgIFwiZm9udC1zdHlsZVwiOiBcIm5vcm1hbFwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiA0MDAsXG4gICAgICAgICAgICBncmFkaWVudDogMCxcbiAgICAgICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgICAgIGhyZWY6IFwiaHR0cDovL3JhcGhhZWxqcy5jb20vXCIsXG4gICAgICAgICAgICBcImxldHRlci1zcGFjaW5nXCI6IDAsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgcGF0aDogXCJNMCwwXCIsXG4gICAgICAgICAgICByOiAwLFxuICAgICAgICAgICAgcng6IDAsXG4gICAgICAgICAgICByeTogMCxcbiAgICAgICAgICAgIHNyYzogXCJcIixcbiAgICAgICAgICAgIHN0cm9rZTogXCIjMDAwXCIsXG4gICAgICAgICAgICBcInN0cm9rZS1kYXNoYXJyYXlcIjogXCJcIixcbiAgICAgICAgICAgIFwic3Ryb2tlLWxpbmVjYXBcIjogXCJidXR0XCIsXG4gICAgICAgICAgICBcInN0cm9rZS1saW5lam9pblwiOiBcImJ1dHRcIixcbiAgICAgICAgICAgIFwic3Ryb2tlLW1pdGVybGltaXRcIjogMCxcbiAgICAgICAgICAgIFwic3Ryb2tlLW9wYWNpdHlcIjogMSxcbiAgICAgICAgICAgIFwic3Ryb2tlLXdpZHRoXCI6IDEsXG4gICAgICAgICAgICB0YXJnZXQ6IFwiX2JsYW5rXCIsXG4gICAgICAgICAgICBcInRleHQtYW5jaG9yXCI6IFwibWlkZGxlXCIsXG4gICAgICAgICAgICB0aXRsZTogXCJSYXBoYWVsXCIsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwiXCIsXG4gICAgICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwXG4gICAgICAgIH0sXG4gICAgICAgIGF2YWlsYWJsZUFuaW1BdHRycyA9IFIuX2F2YWlsYWJsZUFuaW1BdHRycyA9IHtcbiAgICAgICAgICAgIGJsdXI6IG51LFxuICAgICAgICAgICAgXCJjbGlwLXJlY3RcIjogXCJjc3ZcIixcbiAgICAgICAgICAgIGN4OiBudSxcbiAgICAgICAgICAgIGN5OiBudSxcbiAgICAgICAgICAgIGZpbGw6IFwiY29sb3VyXCIsXG4gICAgICAgICAgICBcImZpbGwtb3BhY2l0eVwiOiBudSxcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IG51LFxuICAgICAgICAgICAgaGVpZ2h0OiBudSxcbiAgICAgICAgICAgIG9wYWNpdHk6IG51LFxuICAgICAgICAgICAgcGF0aDogXCJwYXRoXCIsXG4gICAgICAgICAgICByOiBudSxcbiAgICAgICAgICAgIHJ4OiBudSxcbiAgICAgICAgICAgIHJ5OiBudSxcbiAgICAgICAgICAgIHN0cm9rZTogXCJjb2xvdXJcIixcbiAgICAgICAgICAgIFwic3Ryb2tlLW9wYWNpdHlcIjogbnUsXG4gICAgICAgICAgICBcInN0cm9rZS13aWR0aFwiOiBudSxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2Zvcm1cIixcbiAgICAgICAgICAgIHdpZHRoOiBudSxcbiAgICAgICAgICAgIHg6IG51LFxuICAgICAgICAgICAgeTogbnVcbiAgICAgICAgfSxcbiAgICAgICAgd2hpdGVzcGFjZSA9IC9bXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldL2csXG4gICAgICAgIGNvbW1hU3BhY2VzID0gL1tcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qLFtcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qLyxcbiAgICAgICAgaHNyZyA9IHtoczogMSwgcmc6IDF9LFxuICAgICAgICBwMnMgPSAvLD8oW2FjaGxtcXJzdHZ4el0pLD8vZ2ksXG4gICAgICAgIHBhdGhDb21tYW5kID0gLyhbYWNobG1ycXN0dnpdKVtcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOSxdKigoLT9cXGQqXFwuP1xcZCooPzplW1xcLStdP1xcZCspP1tcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qLD9bXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKikrKS9pZyxcbiAgICAgICAgdENvbW1hbmQgPSAvKFtyc3RtXSlbXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjksXSooKC0/XFxkKlxcLj9cXGQqKD86ZVtcXC0rXT9cXGQrKT9bXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKiw/W1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSopKykvaWcsXG4gICAgICAgIHBhdGhWYWx1ZXMgPSAvKC0/XFxkKlxcLj9cXGQqKD86ZVtcXC0rXT9cXGQrKT8pW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSosP1tcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qL2lnLFxuICAgICAgICByYWRpYWxfZ3JhZGllbnQgPSBSLl9yYWRpYWxfZ3JhZGllbnQgPSAvXnIoPzpcXCgoW14sXSs/KVtcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qLFtcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qKFteXFwpXSs/KVxcKSk/LyxcbiAgICAgICAgZWxkYXRhID0ge30sXG4gICAgICAgIHNvcnRCeUtleSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5rZXkgLSBiLmtleTtcbiAgICAgICAgfSxcbiAgICAgICAgc29ydEJ5TnVtYmVyID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiB0b0Zsb2F0KGEpIC0gdG9GbG9hdChiKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIHBpcGUgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0sXG4gICAgICAgIHJlY3RQYXRoID0gUi5fcmVjdFBhdGggPSBmdW5jdGlvbiAoeCwgeSwgdywgaCwgcikge1xuICAgICAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1tcIk1cIiwgeCArIHIsIHldLCBbXCJsXCIsIHcgLSByICogMiwgMF0sIFtcImFcIiwgciwgciwgMCwgMCwgMSwgciwgcl0sIFtcImxcIiwgMCwgaCAtIHIgKiAyXSwgW1wiYVwiLCByLCByLCAwLCAwLCAxLCAtciwgcl0sIFtcImxcIiwgciAqIDIgLSB3LCAwXSwgW1wiYVwiLCByLCByLCAwLCAwLCAxLCAtciwgLXJdLCBbXCJsXCIsIDAsIHIgKiAyIC0gaF0sIFtcImFcIiwgciwgciwgMCwgMCwgMSwgciwgLXJdLCBbXCJ6XCJdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbW1wiTVwiLCB4LCB5XSwgW1wibFwiLCB3LCAwXSwgW1wibFwiLCAwLCBoXSwgW1wibFwiLCAtdywgMF0sIFtcInpcIl1dO1xuICAgICAgICB9LFxuICAgICAgICBlbGxpcHNlUGF0aCA9IGZ1bmN0aW9uICh4LCB5LCByeCwgcnkpIHtcbiAgICAgICAgICAgIGlmIChyeSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcnkgPSByeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbW1wiTVwiLCB4LCB5XSwgW1wibVwiLCAwLCAtcnldLCBbXCJhXCIsIHJ4LCByeSwgMCwgMSwgMSwgMCwgMiAqIHJ5XSwgW1wiYVwiLCByeCwgcnksIDAsIDEsIDEsIDAsIC0yICogcnldLCBbXCJ6XCJdXTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0UGF0aCA9IFIuX2dldFBhdGggPSB7XG4gICAgICAgICAgICBwYXRoOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuYXR0cihcInBhdGhcIik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2lyY2xlOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGVsLmF0dHJzO1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGxpcHNlUGF0aChhLmN4LCBhLmN5LCBhLnIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVsbGlwc2U6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gZWwuYXR0cnM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsbGlwc2VQYXRoKGEuY3gsIGEuY3ksIGEucngsIGEucnkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlY3Q6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gZWwuYXR0cnM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY3RQYXRoKGEueCwgYS55LCBhLndpZHRoLCBhLmhlaWdodCwgYS5yKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbWFnZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBlbC5hdHRycztcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjdFBhdGgoYS54LCBhLnksIGEud2lkdGgsIGEuaGVpZ2h0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXh0OiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmJveCA9IGVsLl9nZXRCQm94KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY3RQYXRoKGJib3gueCwgYmJveC55LCBiYm94LndpZHRoLCBiYm94LmhlaWdodCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0IDogZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmJveCA9IGVsLl9nZXRCQm94KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY3RQYXRoKGJib3gueCwgYmJveC55LCBiYm94LndpZHRoLCBiYm94LmhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUmFwaGFlbC5tYXBQYXRoXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBUcmFuc2Zvcm0gdGhlIHBhdGggc3RyaW5nIHdpdGggZ2l2ZW4gbWF0cml4LlxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgICAgIC0gbWF0cml4IChvYmplY3QpIHNlZSBATWF0cml4XG4gICAgICAgICA9IChzdHJpbmcpIHRyYW5zZm9ybWVkIHBhdGggc3RyaW5nXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWFwUGF0aCA9IFIubWFwUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBtYXRyaXgpIHtcbiAgICAgICAgICAgIGlmICghbWF0cml4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgeCwgeSwgaSwgaiwgaWksIGpqLCBwYXRoaTtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoMmN1cnZlKHBhdGgpO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwYXRoaSA9IHBhdGhbaV07XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMSwgamogPSBwYXRoaS5sZW5ndGg7IGogPCBqajsgaiArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSBtYXRyaXgueChwYXRoaVtqXSwgcGF0aGlbaiArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgeSA9IG1hdHJpeC55KHBhdGhpW2pdLCBwYXRoaVtqICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICBwYXRoaVtqXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgIHBhdGhpW2ogKyAxXSA9IHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH07XG5cbiAgICBSLl9nID0gZztcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC50eXBlXG4gICAgIFsgcHJvcGVydHkgKHN0cmluZykgXVxuICAgICAqKlxuICAgICAqIENhbiBiZSDigJxTVkfigJ0sIOKAnFZNTOKAnSBvciBlbXB0eSwgZGVwZW5kaW5nIG9uIGJyb3dzZXIgc3VwcG9ydC5cbiAgICBcXCovXG4gICAgUi50eXBlID0gKGcud2luLlNWR0FuZ2xlIHx8IGcuZG9jLmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoXCJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9mZWF0dXJlI0Jhc2ljU3RydWN0dXJlXCIsIFwiMS4xXCIpID8gXCJTVkdcIiA6IFwiVk1MXCIpO1xuICAgIGlmIChSLnR5cGUgPT0gXCJWTUxcIikge1xuICAgICAgICB2YXIgZCA9IGcuZG9jLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgICAgICBiO1xuICAgICAgICBkLmlubmVySFRNTCA9ICc8djpzaGFwZSBhZGo9XCIxXCIvPic7XG4gICAgICAgIGIgPSBkLmZpcnN0Q2hpbGQ7XG4gICAgICAgIGIuc3R5bGUuYmVoYXZpb3IgPSBcInVybCgjZGVmYXVsdCNWTUwpXCI7XG4gICAgICAgIGlmICghKGIgJiYgdHlwZW9mIGIuYWRqID09IFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gKFIudHlwZSA9IEUpO1xuICAgICAgICB9XG4gICAgICAgIGQgPSBudWxsO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5zdmdcbiAgICAgWyBwcm9wZXJ0eSAoYm9vbGVhbikgXVxuICAgICAqKlxuICAgICAqIGB0cnVlYCBpZiBicm93c2VyIHN1cHBvcnRzIFNWRy5cbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwudm1sXG4gICAgIFsgcHJvcGVydHkgKGJvb2xlYW4pIF1cbiAgICAgKipcbiAgICAgKiBgdHJ1ZWAgaWYgYnJvd3NlciBzdXBwb3J0cyBWTUwuXG4gICAgXFwqL1xuICAgIFIuc3ZnID0gIShSLnZtbCA9IFIudHlwZSA9PSBcIlZNTFwiKTtcbiAgICBSLl9QYXBlciA9IFBhcGVyO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmZuXG4gICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAqKlxuICAgICAqIFlvdSBjYW4gYWRkIHlvdXIgb3duIG1ldGhvZCB0byB0aGUgY2FudmFzLiBGb3IgZXhhbXBsZSBpZiB5b3Ugd2FudCB0byBkcmF3IGEgcGllIGNoYXJ0LFxuICAgICAqIHlvdSBjYW4gY3JlYXRlIHlvdXIgb3duIHBpZSBjaGFydCBmdW5jdGlvbiBhbmQgc2hpcCBpdCBhcyBhIFJhcGhhw6tsIHBsdWdpbi4gVG8gZG8gdGhpc1xuICAgICAqIHlvdSBuZWVkIHRvIGV4dGVuZCB0aGUgYFJhcGhhZWwuZm5gIG9iamVjdC4gWW91IHNob3VsZCBtb2RpZnkgdGhlIGBmbmAgb2JqZWN0IGJlZm9yZSBhXG4gICAgICogUmFwaGHDq2wgaW5zdGFuY2UgaXMgY3JlYXRlZCwgb3RoZXJ3aXNlIGl0IHdpbGwgdGFrZSBubyBlZmZlY3QuIFBsZWFzZSBub3RlIHRoYXQgdGhlXG4gICAgICogYWJpbGl0eSBmb3IgbmFtZXNwYWNlZCBwbHVnaW5zIHdhcyByZW1vdmVkIGluIFJhcGhhZWwgMi4wLiBJdCBpcyB1cCB0byB0aGUgcGx1Z2luIHRvXG4gICAgICogZW5zdXJlIGFueSBuYW1lc3BhY2luZyBlbnN1cmVzIHByb3BlciBjb250ZXh0LlxuICAgICA+IFVzYWdlXG4gICAgIHwgUmFwaGFlbC5mbi5hcnJvdyA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Miwgc2l6ZSkge1xuICAgICB8ICAgICByZXR1cm4gdGhpcy5wYXRoKCAuLi4gKTtcbiAgICAgfCB9O1xuICAgICB8IC8vIG9yIGNyZWF0ZSBuYW1lc3BhY2VcbiAgICAgfCBSYXBoYWVsLmZuLm15c3R1ZmYgPSB7XG4gICAgIHwgICAgIGFycm93OiBmdW5jdGlvbiAoKSB74oCmfSxcbiAgICAgfCAgICAgc3RhcjogZnVuY3Rpb24gKCkge+KApn0sXG4gICAgIHwgICAgIC8vIGV0Y+KAplxuICAgICB8IH07XG4gICAgIHwgdmFyIHBhcGVyID0gUmFwaGFlbCgxMCwgMTAsIDYzMCwgNDgwKTtcbiAgICAgfCAvLyB0aGVuIHVzZSBpdFxuICAgICB8IHBhcGVyLmFycm93KDEwLCAxMCwgMzAsIDMwLCA1KS5hdHRyKHtmaWxsOiBcIiNmMDBcIn0pO1xuICAgICB8IHBhcGVyLm15c3R1ZmYuYXJyb3coKTtcbiAgICAgfCBwYXBlci5teXN0dWZmLnN0YXIoKTtcbiAgICBcXCovXG4gICAgUi5mbiA9IHBhcGVycHJvdG8gPSBQYXBlci5wcm90b3R5cGUgPSBSLnByb3RvdHlwZTtcbiAgICBSLl9pZCA9IDA7XG4gICAgUi5fb2lkID0gMDtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5pc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSGFuZGZ1bCBvZiByZXBsYWNlbWVudHMgZm9yIGB0eXBlb2ZgIG9wZXJhdG9yLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBvICjigKYpIGFueSBvYmplY3Qgb3IgcHJpbWl0aXZlXG4gICAgIC0gdHlwZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSB0eXBlLCBpLmUuIOKAnHN0cmluZ+KAnSwg4oCcZnVuY3Rpb27igJ0sIOKAnG51bWJlcuKAnSwgZXRjLlxuICAgICA9IChib29sZWFuKSBpcyBnaXZlbiB2YWx1ZSBpcyBvZiBnaXZlbiB0eXBlXG4gICAgXFwqL1xuICAgIFIuaXMgPSBmdW5jdGlvbiAobywgdHlwZSkge1xuICAgICAgICB0eXBlID0gbG93ZXJDYXNlLmNhbGwodHlwZSk7XG4gICAgICAgIGlmICh0eXBlID09IFwiZmluaXRlXCIpIHtcbiAgICAgICAgICAgIHJldHVybiAhaXNuYW5baGFzXSgrbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT0gXCJhcnJheVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbyBpbnN0YW5jZW9mIEFycmF5O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAgKHR5cGUgPT0gXCJudWxsXCIgJiYgbyA9PT0gbnVsbCkgfHxcbiAgICAgICAgICAgICAgICAodHlwZSA9PSB0eXBlb2YgbyAmJiBvICE9PSBudWxsKSB8fFxuICAgICAgICAgICAgICAgICh0eXBlID09IFwib2JqZWN0XCIgJiYgbyA9PT0gT2JqZWN0KG8pKSB8fFxuICAgICAgICAgICAgICAgICh0eXBlID09IFwiYXJyYXlcIiAmJiBBcnJheS5pc0FycmF5ICYmIEFycmF5LmlzQXJyYXkobykpIHx8XG4gICAgICAgICAgICAgICAgb2JqZWN0VG9TdHJpbmcuY2FsbChvKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKSA9PSB0eXBlO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjbG9uZShvYmopIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT0gXCJmdW5jdGlvblwiIHx8IE9iamVjdChvYmopICE9PSBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlcyA9IG5ldyBvYmouY29uc3RydWN0b3I7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChvYmpbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICByZXNba2V5XSA9IGNsb25lKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmFuZ2xlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuZ2xlIGJldHdlZW4gdHdvIG9yIHRocmVlIHBvaW50c1xuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSB4MSAobnVtYmVyKSB4IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gICAgIC0geTEgKG51bWJlcikgeSBjb29yZCBvZiBmaXJzdCBwb2ludFxuICAgICAtIHgyIChudW1iZXIpIHggY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gICAgIC0geTIgKG51bWJlcikgeSBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiAgICAgLSB4MyAobnVtYmVyKSAjb3B0aW9uYWwgeCBjb29yZCBvZiB0aGlyZCBwb2ludFxuICAgICAtIHkzIChudW1iZXIpICNvcHRpb25hbCB5IGNvb3JkIG9mIHRoaXJkIHBvaW50XG4gICAgID0gKG51bWJlcikgYW5nbGUgaW4gZGVncmVlcy5cbiAgICBcXCovXG4gICAgUi5hbmdsZSA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzKSB7XG4gICAgICAgIGlmICh4MyA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgeCA9IHgxIC0geDIsXG4gICAgICAgICAgICAgICAgeSA9IHkxIC0geTI7XG4gICAgICAgICAgICBpZiAoIXggJiYgIXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAoMTgwICsgbWF0aC5hdGFuMigteSwgLXgpICogMTgwIC8gUEkgKyAzNjApICUgMzYwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFIuYW5nbGUoeDEsIHkxLCB4MywgeTMpIC0gUi5hbmdsZSh4MiwgeTIsIHgzLCB5Myk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnJhZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVHJhbnNmb3JtIGFuZ2xlIHRvIHJhZGlhbnNcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gZGVnIChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcbiAgICAgPSAobnVtYmVyKSBhbmdsZSBpbiByYWRpYW5zLlxuICAgIFxcKi9cbiAgICBSLnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcbiAgICAgICAgcmV0dXJuIGRlZyAlIDM2MCAqIFBJIC8gMTgwO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZGVnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBUcmFuc2Zvcm0gYW5nbGUgdG8gZGVncmVlc1xuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSByYWQgKG51bWJlcikgYW5nbGUgaW4gcmFkaWFuc1xuICAgICA9IChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXMuXG4gICAgXFwqL1xuICAgIFIuZGVnID0gZnVuY3Rpb24gKHJhZCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCAoKHJhZCAqIDE4MCAvIFBJJSAzNjApKiAxMDAwKSAvIDEwMDA7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5zbmFwVG9cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNuYXBzIGdpdmVuIHZhbHVlIHRvIGdpdmVuIGdyaWQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHZhbHVlcyAoYXJyYXl8bnVtYmVyKSBnaXZlbiBhcnJheSBvZiB2YWx1ZXMgb3Igc3RlcCBvZiB0aGUgZ3JpZFxuICAgICAtIHZhbHVlIChudW1iZXIpIHZhbHVlIHRvIGFkanVzdFxuICAgICAtIHRvbGVyYW5jZSAobnVtYmVyKSAjb3B0aW9uYWwgdG9sZXJhbmNlIGZvciBzbmFwcGluZy4gRGVmYXVsdCBpcyBgMTBgLlxuICAgICA9IChudW1iZXIpIGFkanVzdGVkIHZhbHVlLlxuICAgIFxcKi9cbiAgICBSLnNuYXBUbyA9IGZ1bmN0aW9uICh2YWx1ZXMsIHZhbHVlLCB0b2xlcmFuY2UpIHtcbiAgICAgICAgdG9sZXJhbmNlID0gUi5pcyh0b2xlcmFuY2UsIFwiZmluaXRlXCIpID8gdG9sZXJhbmNlIDogMTA7XG4gICAgICAgIGlmIChSLmlzKHZhbHVlcywgYXJyYXkpKSB7XG4gICAgICAgICAgICB2YXIgaSA9IHZhbHVlcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKSBpZiAoYWJzKHZhbHVlc1tpXSAtIHZhbHVlKSA8PSB0b2xlcmFuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWVzID0gK3ZhbHVlcztcbiAgICAgICAgICAgIHZhciByZW0gPSB2YWx1ZSAlIHZhbHVlcztcbiAgICAgICAgICAgIGlmIChyZW0gPCB0b2xlcmFuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUgLSByZW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVtID4gdmFsdWVzIC0gdG9sZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlIC0gcmVtICsgdmFsdWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuY3JlYXRlVVVJRFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBSRkM0MTIyLCB2ZXJzaW9uIDQgSURcbiAgICBcXCovXG4gICAgdmFyIGNyZWF0ZVVVSUQgPSBSLmNyZWF0ZVVVSUQgPSAoZnVuY3Rpb24gKHV1aWRSZWdFeCwgdXVpZFJlcGxhY2VyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHhcIi5yZXBsYWNlKHV1aWRSZWdFeCwgdXVpZFJlcGxhY2VyKS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICB9O1xuICAgIH0pKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciByID0gbWF0aC5yYW5kb20oKSAqIDE2IHwgMCxcbiAgICAgICAgICAgIHYgPSBjID09IFwieFwiID8gciA6IChyICYgMyB8IDgpO1xuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG5cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5zZXRXaW5kb3dcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFVzZWQgd2hlbiB5b3UgbmVlZCB0byBkcmF3IGluIGAmbHQ7aWZyYW1lPmAuIFN3aXRjaGVkIHdpbmRvdyB0byB0aGUgaWZyYW1lIG9uZS5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gbmV3d2luICh3aW5kb3cpIG5ldyB3aW5kb3cgb2JqZWN0XG4gICAgXFwqL1xuICAgIFIuc2V0V2luZG93ID0gZnVuY3Rpb24gKG5ld3dpbikge1xuICAgICAgICBldmUoXCJyYXBoYWVsLnNldFdpbmRvd1wiLCBSLCBnLndpbiwgbmV3d2luKTtcbiAgICAgICAgZy53aW4gPSBuZXd3aW47XG4gICAgICAgIGcuZG9jID0gZy53aW4uZG9jdW1lbnQ7XG4gICAgICAgIGlmIChSLl9lbmdpbmUuaW5pdFdpbikge1xuICAgICAgICAgICAgUi5fZW5naW5lLmluaXRXaW4oZy53aW4pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgdG9IZXggPSBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKFIudm1sKSB7XG4gICAgICAgICAgICAvLyBodHRwOi8vZGVhbi5lZHdhcmRzLm5hbWUvd2VibG9nLzIwMDkvMTAvY29udmVydC1hbnktY29sb3VyLXZhbHVlLXRvLWhleC1pbi1tc2llL1xuICAgICAgICAgICAgdmFyIHRyaW0gPSAvXlxccyt8XFxzKyQvZztcbiAgICAgICAgICAgIHZhciBib2Q7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBkb2N1bSA9IG5ldyBBY3RpdmVYT2JqZWN0KFwiaHRtbGZpbGVcIik7XG4gICAgICAgICAgICAgICAgZG9jdW0ud3JpdGUoXCI8Ym9keT5cIik7XG4gICAgICAgICAgICAgICAgZG9jdW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBib2QgPSBkb2N1bS5ib2R5O1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgYm9kID0gY3JlYXRlUG9wdXAoKS5kb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJhbmdlID0gYm9kLmNyZWF0ZVRleHRSYW5nZSgpO1xuICAgICAgICAgICAgdG9IZXggPSBjYWNoZXIoZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYm9kLnN0eWxlLmNvbG9yID0gU3RyKGNvbG9yKS5yZXBsYWNlKHRyaW0sIEUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSByYW5nZS5xdWVyeUNvbW1hbmRWYWx1ZShcIkZvcmVDb2xvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAoKHZhbHVlICYgMjU1KSA8PCAxNikgfCAodmFsdWUgJiA2NTI4MCkgfCAoKHZhbHVlICYgMTY3MTE2ODApID4+PiAxNik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIiNcIiArIChcIjAwMDAwMFwiICsgdmFsdWUudG9TdHJpbmcoMTYpKS5zbGljZSgtNik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpID0gZy5kb2MuY3JlYXRlRWxlbWVudChcImlcIik7XG4gICAgICAgICAgICBpLnRpdGxlID0gXCJSYXBoYVxceGVibCBDb2xvdXIgUGlja2VyXCI7XG4gICAgICAgICAgICBpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGcuZG9jLmJvZHkuYXBwZW5kQ2hpbGQoaSk7XG4gICAgICAgICAgICB0b0hleCA9IGNhY2hlcihmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgICAgICAgICBpLnN0eWxlLmNvbG9yID0gY29sb3I7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGcuZG9jLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoaSwgRSkuZ2V0UHJvcGVydHlWYWx1ZShcImNvbG9yXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvSGV4KGNvbG9yKTtcbiAgICB9LFxuICAgIGhzYnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJoc2IoXCIgKyBbdGhpcy5oLCB0aGlzLnMsIHRoaXMuYl0gKyBcIilcIjtcbiAgICB9LFxuICAgIGhzbHRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJoc2woXCIgKyBbdGhpcy5oLCB0aGlzLnMsIHRoaXMubF0gKyBcIilcIjtcbiAgICB9LFxuICAgIHJnYnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oZXg7XG4gICAgfSxcbiAgICBwcmVwYXJlUkdCID0gZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICAgICAgaWYgKGcgPT0gbnVsbCAmJiBSLmlzKHIsIFwib2JqZWN0XCIpICYmIFwiclwiIGluIHIgJiYgXCJnXCIgaW4gciAmJiBcImJcIiBpbiByKSB7XG4gICAgICAgICAgICBiID0gci5iO1xuICAgICAgICAgICAgZyA9IHIuZztcbiAgICAgICAgICAgIHIgPSByLnI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGcgPT0gbnVsbCAmJiBSLmlzKHIsIHN0cmluZykpIHtcbiAgICAgICAgICAgIHZhciBjbHIgPSBSLmdldFJHQihyKTtcbiAgICAgICAgICAgIHIgPSBjbHIucjtcbiAgICAgICAgICAgIGcgPSBjbHIuZztcbiAgICAgICAgICAgIGIgPSBjbHIuYjtcbiAgICAgICAgfVxuICAgICAgICBpZiAociA+IDEgfHwgZyA+IDEgfHwgYiA+IDEpIHtcbiAgICAgICAgICAgIHIgLz0gMjU1O1xuICAgICAgICAgICAgZyAvPSAyNTU7XG4gICAgICAgICAgICBiIC89IDI1NTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbciwgZywgYl07XG4gICAgfSxcbiAgICBwYWNrYWdlUkdCID0gZnVuY3Rpb24gKHIsIGcsIGIsIG8pIHtcbiAgICAgICAgciAqPSAyNTU7XG4gICAgICAgIGcgKj0gMjU1O1xuICAgICAgICBiICo9IDI1NTtcbiAgICAgICAgdmFyIHJnYiA9IHtcbiAgICAgICAgICAgIHI6IHIsXG4gICAgICAgICAgICBnOiBnLFxuICAgICAgICAgICAgYjogYixcbiAgICAgICAgICAgIGhleDogUi5yZ2IociwgZywgYiksXG4gICAgICAgICAgICB0b1N0cmluZzogcmdidG9TdHJpbmdcbiAgICAgICAgfTtcbiAgICAgICAgUi5pcyhvLCBcImZpbml0ZVwiKSAmJiAocmdiLm9wYWNpdHkgPSBvKTtcbiAgICAgICAgcmV0dXJuIHJnYjtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuY29sb3JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFBhcnNlcyB0aGUgY29sb3Igc3RyaW5nIGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIGFsbCB2YWx1ZXMgZm9yIHRoZSBnaXZlbiBjb2xvci5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gY2xyIChzdHJpbmcpIGNvbG9yIHN0cmluZyBpbiBvbmUgb2YgdGhlIHN1cHBvcnRlZCBmb3JtYXRzIChzZWUgQFJhcGhhZWwuZ2V0UkdCKVxuICAgICA9IChvYmplY3QpIENvbWJpbmVkIFJHQiAmIEhTQiBvYmplY3QgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgciAobnVtYmVyKSByZWQsXG4gICAgIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gICAgIG8gICAgIGIgKG51bWJlcikgYmx1ZSxcbiAgICAgbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAoixcbiAgICAgbyAgICAgZXJyb3IgKGJvb2xlYW4pIGB0cnVlYCBpZiBzdHJpbmcgY2Fu4oCZdCBiZSBwYXJzZWQsXG4gICAgIG8gICAgIGggKG51bWJlcikgaHVlLFxuICAgICBvICAgICBzIChudW1iZXIpIHNhdHVyYXRpb24sXG4gICAgIG8gICAgIHYgKG51bWJlcikgdmFsdWUgKGJyaWdodG5lc3MpLFxuICAgICBvICAgICBsIChudW1iZXIpIGxpZ2h0bmVzc1xuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5jb2xvciA9IGZ1bmN0aW9uIChjbHIpIHtcbiAgICAgICAgdmFyIHJnYjtcbiAgICAgICAgaWYgKFIuaXMoY2xyLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBjbHIgJiYgXCJzXCIgaW4gY2xyICYmIFwiYlwiIGluIGNscikge1xuICAgICAgICAgICAgcmdiID0gUi5oc2IycmdiKGNscik7XG4gICAgICAgICAgICBjbHIuciA9IHJnYi5yO1xuICAgICAgICAgICAgY2xyLmcgPSByZ2IuZztcbiAgICAgICAgICAgIGNsci5iID0gcmdiLmI7XG4gICAgICAgICAgICBjbHIuaGV4ID0gcmdiLmhleDtcbiAgICAgICAgfSBlbHNlIGlmIChSLmlzKGNsciwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gY2xyICYmIFwic1wiIGluIGNsciAmJiBcImxcIiBpbiBjbHIpIHtcbiAgICAgICAgICAgIHJnYiA9IFIuaHNsMnJnYihjbHIpO1xuICAgICAgICAgICAgY2xyLnIgPSByZ2IucjtcbiAgICAgICAgICAgIGNsci5nID0gcmdiLmc7XG4gICAgICAgICAgICBjbHIuYiA9IHJnYi5iO1xuICAgICAgICAgICAgY2xyLmhleCA9IHJnYi5oZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoUi5pcyhjbHIsIFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgY2xyID0gUi5nZXRSR0IoY2xyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChSLmlzKGNsciwgXCJvYmplY3RcIikgJiYgXCJyXCIgaW4gY2xyICYmIFwiZ1wiIGluIGNsciAmJiBcImJcIiBpbiBjbHIpIHtcbiAgICAgICAgICAgICAgICByZ2IgPSBSLnJnYjJoc2woY2xyKTtcbiAgICAgICAgICAgICAgICBjbHIuaCA9IHJnYi5oO1xuICAgICAgICAgICAgICAgIGNsci5zID0gcmdiLnM7XG4gICAgICAgICAgICAgICAgY2xyLmwgPSByZ2IubDtcbiAgICAgICAgICAgICAgICByZ2IgPSBSLnJnYjJoc2IoY2xyKTtcbiAgICAgICAgICAgICAgICBjbHIudiA9IHJnYi5iO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbHIgPSB7aGV4OiBcIm5vbmVcIn07XG4gICAgICAgICAgICAgICAgY2xyLnIgPSBjbHIuZyA9IGNsci5iID0gY2xyLmggPSBjbHIucyA9IGNsci52ID0gY2xyLmwgPSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjbHIudG9TdHJpbmcgPSByZ2J0b1N0cmluZztcbiAgICAgICAgcmV0dXJuIGNscjtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmhzYjJyZ2JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIEhTQiB2YWx1ZXMgdG8gUkdCIG9iamVjdC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaCAobnVtYmVyKSBodWVcbiAgICAgLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAgICAgLSB2IChudW1iZXIpIHZhbHVlIG9yIGJyaWdodG5lc3NcbiAgICAgPSAob2JqZWN0KSBSR0Igb2JqZWN0IGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHIgKG51bWJlcikgcmVkLFxuICAgICBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuICAgICBvICAgICBiIChudW1iZXIpIGJsdWUsXG4gICAgIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKJcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIuaHNiMnJnYiA9IGZ1bmN0aW9uIChoLCBzLCB2LCBvKSB7XG4gICAgICAgIGlmICh0aGlzLmlzKGgsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGggJiYgXCJzXCIgaW4gaCAmJiBcImJcIiBpbiBoKSB7XG4gICAgICAgICAgICB2ID0gaC5iO1xuICAgICAgICAgICAgcyA9IGgucztcbiAgICAgICAgICAgIG8gPSBoLm87XG4gICAgICAgICAgICBoID0gaC5oO1xuICAgICAgICB9XG4gICAgICAgIGggKj0gMzYwO1xuICAgICAgICB2YXIgUiwgRywgQiwgWCwgQztcbiAgICAgICAgaCA9IChoICUgMzYwKSAvIDYwO1xuICAgICAgICBDID0gdiAqIHM7XG4gICAgICAgIFggPSBDICogKDEgLSBhYnMoaCAlIDIgLSAxKSk7XG4gICAgICAgIFIgPSBHID0gQiA9IHYgLSBDO1xuXG4gICAgICAgIGggPSB+fmg7XG4gICAgICAgIFIgKz0gW0MsIFgsIDAsIDAsIFgsIENdW2hdO1xuICAgICAgICBHICs9IFtYLCBDLCBDLCBYLCAwLCAwXVtoXTtcbiAgICAgICAgQiArPSBbMCwgMCwgWCwgQywgQywgWF1baF07XG4gICAgICAgIHJldHVybiBwYWNrYWdlUkdCKFIsIEcsIEIsIG8pO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaHNsMnJnYlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ29udmVydHMgSFNMIHZhbHVlcyB0byBSR0Igb2JqZWN0LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoIChudW1iZXIpIGh1ZVxuICAgICAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuICAgICAtIGwgKG51bWJlcikgbHVtaW5vc2l0eVxuICAgICA9IChvYmplY3QpIFJHQiBvYmplY3QgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgciAobnVtYmVyKSByZWQsXG4gICAgIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gICAgIG8gICAgIGIgKG51bWJlcikgYmx1ZSxcbiAgICAgbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAolxuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5oc2wycmdiID0gZnVuY3Rpb24gKGgsIHMsIGwsIG8pIHtcbiAgICAgICAgaWYgKHRoaXMuaXMoaCwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gaCAmJiBcInNcIiBpbiBoICYmIFwibFwiIGluIGgpIHtcbiAgICAgICAgICAgIGwgPSBoLmw7XG4gICAgICAgICAgICBzID0gaC5zO1xuICAgICAgICAgICAgaCA9IGguaDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaCA+IDEgfHwgcyA+IDEgfHwgbCA+IDEpIHtcbiAgICAgICAgICAgIGggLz0gMzYwO1xuICAgICAgICAgICAgcyAvPSAxMDA7XG4gICAgICAgICAgICBsIC89IDEwMDtcbiAgICAgICAgfVxuICAgICAgICBoICo9IDM2MDtcbiAgICAgICAgdmFyIFIsIEcsIEIsIFgsIEM7XG4gICAgICAgIGggPSAoaCAlIDM2MCkgLyA2MDtcbiAgICAgICAgQyA9IDIgKiBzICogKGwgPCAuNSA/IGwgOiAxIC0gbCk7XG4gICAgICAgIFggPSBDICogKDEgLSBhYnMoaCAlIDIgLSAxKSk7XG4gICAgICAgIFIgPSBHID0gQiA9IGwgLSBDIC8gMjtcblxuICAgICAgICBoID0gfn5oO1xuICAgICAgICBSICs9IFtDLCBYLCAwLCAwLCBYLCBDXVtoXTtcbiAgICAgICAgRyArPSBbWCwgQywgQywgWCwgMCwgMF1baF07XG4gICAgICAgIEIgKz0gWzAsIDAsIFgsIEMsIEMsIFhdW2hdO1xuICAgICAgICByZXR1cm4gcGFja2FnZVJHQihSLCBHLCBCLCBvKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnJnYjJoc2JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIFJHQiB2YWx1ZXMgdG8gSFNCIG9iamVjdC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gciAobnVtYmVyKSByZWRcbiAgICAgLSBnIChudW1iZXIpIGdyZWVuXG4gICAgIC0gYiAobnVtYmVyKSBibHVlXG4gICAgID0gKG9iamVjdCkgSFNCIG9iamVjdCBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICBoIChudW1iZXIpIGh1ZVxuICAgICBvICAgICBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAgICAgbyAgICAgYiAobnVtYmVyKSBicmlnaHRuZXNzXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLnJnYjJoc2IgPSBmdW5jdGlvbiAociwgZywgYikge1xuICAgICAgICBiID0gcHJlcGFyZVJHQihyLCBnLCBiKTtcbiAgICAgICAgciA9IGJbMF07XG4gICAgICAgIGcgPSBiWzFdO1xuICAgICAgICBiID0gYlsyXTtcblxuICAgICAgICB2YXIgSCwgUywgViwgQztcbiAgICAgICAgViA9IG1tYXgociwgZywgYik7XG4gICAgICAgIEMgPSBWIC0gbW1pbihyLCBnLCBiKTtcbiAgICAgICAgSCA9IChDID09IDAgPyBudWxsIDpcbiAgICAgICAgICAgICBWID09IHIgPyAoZyAtIGIpIC8gQyA6XG4gICAgICAgICAgICAgViA9PSBnID8gKGIgLSByKSAvIEMgKyAyIDpcbiAgICAgICAgICAgICAgICAgICAgICAociAtIGcpIC8gQyArIDRcbiAgICAgICAgICAgICk7XG4gICAgICAgIEggPSAoKEggKyAzNjApICUgNikgKiA2MCAvIDM2MDtcbiAgICAgICAgUyA9IEMgPT0gMCA/IDAgOiBDIC8gVjtcbiAgICAgICAgcmV0dXJuIHtoOiBILCBzOiBTLCBiOiBWLCB0b1N0cmluZzogaHNidG9TdHJpbmd9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucmdiMmhzbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ29udmVydHMgUkdCIHZhbHVlcyB0byBIU0wgb2JqZWN0LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSByIChudW1iZXIpIHJlZFxuICAgICAtIGcgKG51bWJlcikgZ3JlZW5cbiAgICAgLSBiIChudW1iZXIpIGJsdWVcbiAgICAgPSAob2JqZWN0KSBIU0wgb2JqZWN0IGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIGggKG51bWJlcikgaHVlXG4gICAgIG8gICAgIHMgKG51bWJlcikgc2F0dXJhdGlvblxuICAgICBvICAgICBsIChudW1iZXIpIGx1bWlub3NpdHlcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIucmdiMmhzbCA9IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgICAgIGIgPSBwcmVwYXJlUkdCKHIsIGcsIGIpO1xuICAgICAgICByID0gYlswXTtcbiAgICAgICAgZyA9IGJbMV07XG4gICAgICAgIGIgPSBiWzJdO1xuXG4gICAgICAgIHZhciBILCBTLCBMLCBNLCBtLCBDO1xuICAgICAgICBNID0gbW1heChyLCBnLCBiKTtcbiAgICAgICAgbSA9IG1taW4ociwgZywgYik7XG4gICAgICAgIEMgPSBNIC0gbTtcbiAgICAgICAgSCA9IChDID09IDAgPyBudWxsIDpcbiAgICAgICAgICAgICBNID09IHIgPyAoZyAtIGIpIC8gQyA6XG4gICAgICAgICAgICAgTSA9PSBnID8gKGIgLSByKSAvIEMgKyAyIDpcbiAgICAgICAgICAgICAgICAgICAgICAociAtIGcpIC8gQyArIDQpO1xuICAgICAgICBIID0gKChIICsgMzYwKSAlIDYpICogNjAgLyAzNjA7XG4gICAgICAgIEwgPSAoTSArIG0pIC8gMjtcbiAgICAgICAgUyA9IChDID09IDAgPyAwIDpcbiAgICAgICAgICAgICBMIDwgLjUgPyBDIC8gKDIgKiBMKSA6XG4gICAgICAgICAgICAgICAgICAgICAgQyAvICgyIC0gMiAqIEwpKTtcbiAgICAgICAgcmV0dXJuIHtoOiBILCBzOiBTLCBsOiBMLCB0b1N0cmluZzogaHNsdG9TdHJpbmd9O1xuICAgIH07XG4gICAgUi5fcGF0aDJzdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmpvaW4oXCIsXCIpLnJlcGxhY2UocDJzLCBcIiQxXCIpO1xuICAgIH07XG4gICAgZnVuY3Rpb24gcmVwdXNoKGFycmF5LCBpdGVtKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFycmF5Lmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5LnB1c2goYXJyYXkuc3BsaWNlKGksIDEpWzBdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBjYWNoZXIoZiwgc2NvcGUsIHBvc3Rwcm9jZXNzb3IpIHtcbiAgICAgICAgZnVuY3Rpb24gbmV3ZigpIHtcbiAgICAgICAgICAgIHZhciBhcmcgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmcuam9pbihcIlxcdTI0MDBcIiksXG4gICAgICAgICAgICAgICAgY2FjaGUgPSBuZXdmLmNhY2hlID0gbmV3Zi5jYWNoZSB8fCB7fSxcbiAgICAgICAgICAgICAgICBjb3VudCA9IG5ld2YuY291bnQgPSBuZXdmLmNvdW50IHx8IFtdO1xuICAgICAgICAgICAgaWYgKGNhY2hlW2hhc10oYXJncykpIHtcbiAgICAgICAgICAgICAgICByZXB1c2goY291bnQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3N0cHJvY2Vzc29yID8gcG9zdHByb2Nlc3NvcihjYWNoZVthcmdzXSkgOiBjYWNoZVthcmdzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvdW50Lmxlbmd0aCA+PSAxZTMgJiYgZGVsZXRlIGNhY2hlW2NvdW50LnNoaWZ0KCldO1xuICAgICAgICAgICAgY291bnQucHVzaChhcmdzKTtcbiAgICAgICAgICAgIGNhY2hlW2FyZ3NdID0gZlthcHBseV0oc2NvcGUsIGFyZyk7XG4gICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3NvciA/IHBvc3Rwcm9jZXNzb3IoY2FjaGVbYXJnc10pIDogY2FjaGVbYXJnc107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld2Y7XG4gICAgfVxuXG4gICAgdmFyIHByZWxvYWQgPSBSLl9wcmVsb2FkID0gZnVuY3Rpb24gKHNyYywgZikge1xuICAgICAgICB2YXIgaW1nID0gZy5kb2MuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgaW1nLnN0eWxlLmNzc1RleHQgPSBcInBvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTk5OTllbTt0b3A6LTk5OTllbVwiO1xuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZi5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5vbmxvYWQgPSBudWxsO1xuICAgICAgICAgICAgZy5kb2MuYm9keS5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBnLmRvYy5ib2R5LnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgICAgICB9O1xuICAgICAgICBnLmRvYy5ib2R5LmFwcGVuZENoaWxkKGltZyk7XG4gICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNsclRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oZXg7XG4gICAgfVxuXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZ2V0UkdCXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBQYXJzZXMgY29sb3VyIHN0cmluZyBhcyBSR0Igb2JqZWN0XG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGNvbG91ciAoc3RyaW5nKSBjb2xvdXIgc3RyaW5nIGluIG9uZSBvZiBmb3JtYXRzOlxuICAgICAjIDx1bD5cbiAgICAgIyAgICAgPGxpPkNvbG91ciBuYW1lICjigJw8Y29kZT5yZWQ8L2NvZGU+4oCdLCDigJw8Y29kZT5ncmVlbjwvY29kZT7igJ0sIOKAnDxjb2RlPmNvcm5mbG93ZXJibHVlPC9jb2RlPuKAnSwgZXRjKTwvbGk+XG4gICAgICMgICAgIDxsaT4j4oCi4oCi4oCiIOKAlCBzaG9ydGVuZWQgSFRNTCBjb2xvdXI6ICjigJw8Y29kZT4jMDAwPC9jb2RlPuKAnSwg4oCcPGNvZGU+I2ZjMDwvY29kZT7igJ0sIGV0Yyk8L2xpPlxuICAgICAjICAgICA8bGk+I+KAouKAouKAouKAouKAouKAoiDigJQgZnVsbCBsZW5ndGggSFRNTCBjb2xvdXI6ICjigJw8Y29kZT4jMDAwMDAwPC9jb2RlPuKAnSwg4oCcPGNvZGU+I2JkMjMwMDwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPnJnYijigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgcmVkLCBncmVlbiBhbmQgYmx1ZSBjaGFubmVsc+KAmSB2YWx1ZXM6ICjigJw8Y29kZT5yZ2IoMjAwLCZuYnNwOzEwMCwmbmJzcDswKTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPnJnYijigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU6ICjigJw8Y29kZT5yZ2IoMTAwJSwmbmJzcDsxNzUlLCZuYnNwOzAlKTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPmhzYijigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgaHVlLCBzYXR1cmF0aW9uIGFuZCBicmlnaHRuZXNzIHZhbHVlczogKOKAnDxjb2RlPmhzYigwLjUsJm5ic3A7MC4yNSwmbmJzcDsxKTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPmhzYijigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU8L2xpPlxuICAgICAjICAgICA8bGk+aHNsKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBzYW1lIGFzIGhzYjwvbGk+XG4gICAgICMgICAgIDxsaT5oc2wo4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgaHNiPC9saT5cbiAgICAgIyA8L3VsPlxuICAgICA9IChvYmplY3QpIFJHQiBvYmplY3QgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgciAobnVtYmVyKSByZWQsXG4gICAgIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gICAgIG8gICAgIGIgKG51bWJlcikgYmx1ZVxuICAgICBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiLFxuICAgICBvICAgICBlcnJvciAoYm9vbGVhbikgdHJ1ZSBpZiBzdHJpbmcgY2Fu4oCZdCBiZSBwYXJzZWRcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIuZ2V0UkdCID0gY2FjaGVyKGZ1bmN0aW9uIChjb2xvdXIpIHtcbiAgICAgICAgaWYgKCFjb2xvdXIgfHwgISEoKGNvbG91ciA9IFN0cihjb2xvdXIpKS5pbmRleE9mKFwiLVwiKSArIDEpKSB7XG4gICAgICAgICAgICByZXR1cm4ge3I6IC0xLCBnOiAtMSwgYjogLTEsIGhleDogXCJub25lXCIsIGVycm9yOiAxLCB0b1N0cmluZzogY2xyVG9TdHJpbmd9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xvdXIgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB7cjogLTEsIGc6IC0xLCBiOiAtMSwgaGV4OiBcIm5vbmVcIiwgdG9TdHJpbmc6IGNsclRvU3RyaW5nfTtcbiAgICAgICAgfVxuICAgICAgICAhKGhzcmdbaGFzXShjb2xvdXIudG9Mb3dlckNhc2UoKS5zdWJzdHJpbmcoMCwgMikpIHx8IGNvbG91ci5jaGFyQXQoKSA9PSBcIiNcIikgJiYgKGNvbG91ciA9IHRvSGV4KGNvbG91cikpO1xuICAgICAgICB2YXIgcmVzLFxuICAgICAgICAgICAgcmVkLFxuICAgICAgICAgICAgZ3JlZW4sXG4gICAgICAgICAgICBibHVlLFxuICAgICAgICAgICAgb3BhY2l0eSxcbiAgICAgICAgICAgIHQsXG4gICAgICAgICAgICB2YWx1ZXMsXG4gICAgICAgICAgICByZ2IgPSBjb2xvdXIubWF0Y2goY29sb3VyUmVnRXhwKTtcbiAgICAgICAgaWYgKHJnYikge1xuICAgICAgICAgICAgaWYgKHJnYlsyXSkge1xuICAgICAgICAgICAgICAgIGJsdWUgPSB0b0ludChyZ2JbMl0uc3Vic3RyaW5nKDUpLCAxNik7XG4gICAgICAgICAgICAgICAgZ3JlZW4gPSB0b0ludChyZ2JbMl0uc3Vic3RyaW5nKDMsIDUpLCAxNik7XG4gICAgICAgICAgICAgICAgcmVkID0gdG9JbnQocmdiWzJdLnN1YnN0cmluZygxLCAzKSwgMTYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJnYlszXSkge1xuICAgICAgICAgICAgICAgIGJsdWUgPSB0b0ludCgodCA9IHJnYlszXS5jaGFyQXQoMykpICsgdCwgMTYpO1xuICAgICAgICAgICAgICAgIGdyZWVuID0gdG9JbnQoKHQgPSByZ2JbM10uY2hhckF0KDIpKSArIHQsIDE2KTtcbiAgICAgICAgICAgICAgICByZWQgPSB0b0ludCgodCA9IHJnYlszXS5jaGFyQXQoMSkpICsgdCwgMTYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJnYls0XSkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IHJnYls0XVtzcGxpdF0oY29tbWFTcGFjZXMpO1xuICAgICAgICAgICAgICAgIHJlZCA9IHRvRmxvYXQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiJVwiICYmIChyZWQgKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgZ3JlZW4gPSB0b0Zsb2F0KHZhbHVlc1sxXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzFdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoZ3JlZW4gKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgYmx1ZSA9IHRvRmxvYXQodmFsdWVzWzJdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMl0uc2xpY2UoLTEpID09IFwiJVwiICYmIChibHVlICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgIHJnYlsxXS50b0xvd2VyQ2FzZSgpLnNsaWNlKDAsIDQpID09IFwicmdiYVwiICYmIChvcGFjaXR5ID0gdG9GbG9hdCh2YWx1ZXNbM10pKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbM10gJiYgdmFsdWVzWzNdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAob3BhY2l0eSAvPSAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJnYls1XSkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IHJnYls1XVtzcGxpdF0oY29tbWFTcGFjZXMpO1xuICAgICAgICAgICAgICAgIHJlZCA9IHRvRmxvYXQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiJVwiICYmIChyZWQgKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgZ3JlZW4gPSB0b0Zsb2F0KHZhbHVlc1sxXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzFdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoZ3JlZW4gKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgYmx1ZSA9IHRvRmxvYXQodmFsdWVzWzJdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMl0uc2xpY2UoLTEpID09IFwiJVwiICYmIChibHVlICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgICh2YWx1ZXNbMF0uc2xpY2UoLTMpID09IFwiZGVnXCIgfHwgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIlxceGIwXCIpICYmIChyZWQgLz0gMzYwKTtcbiAgICAgICAgICAgICAgICByZ2JbMV0udG9Mb3dlckNhc2UoKS5zbGljZSgwLCA0KSA9PSBcImhzYmFcIiAmJiAob3BhY2l0eSA9IHRvRmxvYXQodmFsdWVzWzNdKSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzNdICYmIHZhbHVlc1szXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKG9wYWNpdHkgLz0gMTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUi5oc2IycmdiKHJlZCwgZ3JlZW4sIGJsdWUsIG9wYWNpdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJnYls2XSkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IHJnYls2XVtzcGxpdF0oY29tbWFTcGFjZXMpO1xuICAgICAgICAgICAgICAgIHJlZCA9IHRvRmxvYXQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiJVwiICYmIChyZWQgKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgZ3JlZW4gPSB0b0Zsb2F0KHZhbHVlc1sxXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzFdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoZ3JlZW4gKj0gMi41NSk7XG4gICAgICAgICAgICAgICAgYmx1ZSA9IHRvRmxvYXQodmFsdWVzWzJdKTtcbiAgICAgICAgICAgICAgICB2YWx1ZXNbMl0uc2xpY2UoLTEpID09IFwiJVwiICYmIChibHVlICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgICh2YWx1ZXNbMF0uc2xpY2UoLTMpID09IFwiZGVnXCIgfHwgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIlxceGIwXCIpICYmIChyZWQgLz0gMzYwKTtcbiAgICAgICAgICAgICAgICByZ2JbMV0udG9Mb3dlckNhc2UoKS5zbGljZSgwLCA0KSA9PSBcImhzbGFcIiAmJiAob3BhY2l0eSA9IHRvRmxvYXQodmFsdWVzWzNdKSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzNdICYmIHZhbHVlc1szXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKG9wYWNpdHkgLz0gMTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUi5oc2wycmdiKHJlZCwgZ3JlZW4sIGJsdWUsIG9wYWNpdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmdiID0ge3I6IHJlZCwgZzogZ3JlZW4sIGI6IGJsdWUsIHRvU3RyaW5nOiBjbHJUb1N0cmluZ307XG4gICAgICAgICAgICByZ2IuaGV4ID0gXCIjXCIgKyAoMTY3NzcyMTYgfCBibHVlIHwgKGdyZWVuIDw8IDgpIHwgKHJlZCA8PCAxNikpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbiAgICAgICAgICAgIFIuaXMob3BhY2l0eSwgXCJmaW5pdGVcIikgJiYgKHJnYi5vcGFjaXR5ID0gb3BhY2l0eSk7XG4gICAgICAgICAgICByZXR1cm4gcmdiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7cjogLTEsIGc6IC0xLCBiOiAtMSwgaGV4OiBcIm5vbmVcIiwgZXJyb3I6IDEsIHRvU3RyaW5nOiBjbHJUb1N0cmluZ307XG4gICAgfSwgUik7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaHNiXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBIU0IgdmFsdWVzIHRvIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3VyLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoIChudW1iZXIpIGh1ZVxuICAgICAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuICAgICAtIGIgKG51bWJlcikgdmFsdWUgb3IgYnJpZ2h0bmVzc1xuICAgICA9IChzdHJpbmcpIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3VyLlxuICAgIFxcKi9cbiAgICBSLmhzYiA9IGNhY2hlcihmdW5jdGlvbiAoaCwgcywgYikge1xuICAgICAgICByZXR1cm4gUi5oc2IycmdiKGgsIHMsIGIpLmhleDtcbiAgICB9KTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5oc2xcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIEhTTCB2YWx1ZXMgdG8gaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvdXIuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGggKG51bWJlcikgaHVlXG4gICAgIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gICAgIC0gbCAobnVtYmVyKSBsdW1pbm9zaXR5XG4gICAgID0gKHN0cmluZykgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvdXIuXG4gICAgXFwqL1xuICAgIFIuaHNsID0gY2FjaGVyKGZ1bmN0aW9uIChoLCBzLCBsKSB7XG4gICAgICAgIHJldHVybiBSLmhzbDJyZ2IoaCwgcywgbCkuaGV4O1xuICAgIH0pO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnJnYlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ29udmVydHMgUkdCIHZhbHVlcyB0byBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG91ci5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gciAobnVtYmVyKSByZWRcbiAgICAgLSBnIChudW1iZXIpIGdyZWVuXG4gICAgIC0gYiAobnVtYmVyKSBibHVlXG4gICAgID0gKHN0cmluZykgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvdXIuXG4gICAgXFwqL1xuICAgIFIucmdiID0gY2FjaGVyKGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgICAgIHJldHVybiBcIiNcIiArICgxNjc3NzIxNiB8IGIgfCAoZyA8PCA4KSB8IChyIDw8IDE2KSkudG9TdHJpbmcoMTYpLnNsaWNlKDEpO1xuICAgIH0pO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmdldENvbG9yXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBPbiBlYWNoIGNhbGwgcmV0dXJucyBuZXh0IGNvbG91ciBpbiB0aGUgc3BlY3RydW0uIFRvIHJlc2V0IGl0IGJhY2sgdG8gcmVkIGNhbGwgQFJhcGhhZWwuZ2V0Q29sb3IucmVzZXRcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gdmFsdWUgKG51bWJlcikgI29wdGlvbmFsIGJyaWdodG5lc3MsIGRlZmF1bHQgaXMgYDAuNzVgXG4gICAgID0gKHN0cmluZykgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvdXIuXG4gICAgXFwqL1xuICAgIFIuZ2V0Q29sb3IgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gdGhpcy5nZXRDb2xvci5zdGFydCA9IHRoaXMuZ2V0Q29sb3Iuc3RhcnQgfHwge2g6IDAsIHM6IDEsIGI6IHZhbHVlIHx8IC43NX0sXG4gICAgICAgICAgICByZ2IgPSB0aGlzLmhzYjJyZ2Ioc3RhcnQuaCwgc3RhcnQucywgc3RhcnQuYik7XG4gICAgICAgIHN0YXJ0LmggKz0gLjA3NTtcbiAgICAgICAgaWYgKHN0YXJ0LmggPiAxKSB7XG4gICAgICAgICAgICBzdGFydC5oID0gMDtcbiAgICAgICAgICAgIHN0YXJ0LnMgLT0gLjI7XG4gICAgICAgICAgICBzdGFydC5zIDw9IDAgJiYgKHRoaXMuZ2V0Q29sb3Iuc3RhcnQgPSB7aDogMCwgczogMSwgYjogc3RhcnQuYn0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZ2IuaGV4O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZ2V0Q29sb3IucmVzZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlc2V0cyBzcGVjdHJ1bSBwb3NpdGlvbiBmb3IgQFJhcGhhZWwuZ2V0Q29sb3IgYmFjayB0byByZWQuXG4gICAgXFwqL1xuICAgIFIuZ2V0Q29sb3IucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnN0YXJ0O1xuICAgIH07XG5cbiAgICAvLyBodHRwOi8vc2NoZXBlcnMuY2MvZ2V0dGluZy10by10aGUtcG9pbnRcbiAgICBmdW5jdGlvbiBjYXRtdWxsUm9tMmJlemllcihjcnAsIHopIHtcbiAgICAgICAgdmFyIGQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlMZW4gPSBjcnAubGVuZ3RoOyBpTGVuIC0gMiAqICF6ID4gaTsgaSArPSAyKSB7XG4gICAgICAgICAgICB2YXIgcCA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2kgLSAyXSwgeTogK2NycFtpIC0gMV19LFxuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaV0sICAgICB5OiArY3JwW2kgKyAxXX0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpICsgMl0sIHk6ICtjcnBbaSArIDNdfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2kgKyA0XSwgeTogK2NycFtpICsgNV19XG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICBpZiAoeikge1xuICAgICAgICAgICAgICAgIGlmICghaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzBdID0ge3g6ICtjcnBbaUxlbiAtIDJdLCB5OiArY3JwW2lMZW4gLSAxXX07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpTGVuIC0gNCA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbM10gPSB7eDogK2NycFswXSwgeTogK2NycFsxXX07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpTGVuIC0gMiA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbMl0gPSB7eDogK2NycFswXSwgeTogK2NycFsxXX07XG4gICAgICAgICAgICAgICAgICAgIHBbM10gPSB7eDogK2NycFsyXSwgeTogK2NycFszXX07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoaUxlbiAtIDQgPT0gaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzNdID0gcFsyXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbMF0gPSB7eDogK2NycFtpXSwgeTogK2NycFtpICsgMV19O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGQucHVzaChbXCJDXCIsXG4gICAgICAgICAgICAgICAgICAoLXBbMF0ueCArIDYgKiBwWzFdLnggKyBwWzJdLngpIC8gNixcbiAgICAgICAgICAgICAgICAgICgtcFswXS55ICsgNiAqIHBbMV0ueSArIHBbMl0ueSkgLyA2LFxuICAgICAgICAgICAgICAgICAgKHBbMV0ueCArIDYgKiBwWzJdLnggLSBwWzNdLngpIC8gNixcbiAgICAgICAgICAgICAgICAgIChwWzFdLnkgKyA2KnBbMl0ueSAtIHBbM10ueSkgLyA2LFxuICAgICAgICAgICAgICAgICAgcFsyXS54LFxuICAgICAgICAgICAgICAgICAgcFsyXS55XG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5wYXJzZVBhdGhTdHJpbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUGFyc2VzIGdpdmVuIHBhdGggc3RyaW5nIGludG8gYW4gYXJyYXkgb2YgYXJyYXlzIG9mIHBhdGggc2VnbWVudHMuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHBhdGhTdHJpbmcgKHN0cmluZ3xhcnJheSkgcGF0aCBzdHJpbmcgb3IgYXJyYXkgb2Ygc2VnbWVudHMgKGluIHRoZSBsYXN0IGNhc2UgaXQgd2lsbCBiZSByZXR1cm5lZCBzdHJhaWdodCBhd2F5KVxuICAgICA9IChhcnJheSkgYXJyYXkgb2Ygc2VnbWVudHMuXG4gICAgXFwqL1xuICAgIFIucGFyc2VQYXRoU3RyaW5nID0gZnVuY3Rpb24gKHBhdGhTdHJpbmcpIHtcbiAgICAgICAgaWYgKCFwYXRoU3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHRoID0gcGF0aHMocGF0aFN0cmluZyk7XG4gICAgICAgIGlmIChwdGguYXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aENsb25lKHB0aC5hcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBhcmFtQ291bnRzID0ge2E6IDcsIGM6IDYsIGg6IDEsIGw6IDIsIG06IDIsIHI6IDQsIHE6IDQsIHM6IDQsIHQ6IDIsIHY6IDEsIHo6IDB9LFxuICAgICAgICAgICAgZGF0YSA9IFtdO1xuICAgICAgICBpZiAoUi5pcyhwYXRoU3RyaW5nLCBhcnJheSkgJiYgUi5pcyhwYXRoU3RyaW5nWzBdLCBhcnJheSkpIHsgLy8gcm91Z2ggYXNzdW1wdGlvblxuICAgICAgICAgICAgZGF0YSA9IHBhdGhDbG9uZShwYXRoU3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICBTdHIocGF0aFN0cmluZykucmVwbGFjZShwYXRoQ29tbWFuZCwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0gW10sXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgYy5yZXBsYWNlKHBhdGhWYWx1ZXMsIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGIgJiYgcGFyYW1zLnB1c2goK2IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lID09IFwibVwiICYmIHBhcmFtcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYl1bY29uY2F0XShwYXJhbXMuc3BsaWNlKDAsIDIpKSk7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBcImxcIjtcbiAgICAgICAgICAgICAgICAgICAgYiA9IGIgPT0gXCJtXCIgPyBcImxcIiA6IFwiTFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PSBcInJcIikge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2JdW2NvbmNhdF0ocGFyYW1zKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHdoaWxlIChwYXJhbXMubGVuZ3RoID49IHBhcmFtQ291bnRzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYl1bY29uY2F0XShwYXJhbXMuc3BsaWNlKDAsIHBhcmFtQ291bnRzW25hbWVdKSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmFtQ291bnRzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEudG9TdHJpbmcgPSBSLl9wYXRoMnN0cmluZztcbiAgICAgICAgcHRoLmFyciA9IHBhdGhDbG9uZShkYXRhKTtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5wYXJzZVRyYW5zZm9ybVN0cmluZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBQYXJzZXMgZ2l2ZW4gcGF0aCBzdHJpbmcgaW50byBhbiBhcnJheSBvZiB0cmFuc2Zvcm1hdGlvbnMuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIFRTdHJpbmcgKHN0cmluZ3xhcnJheSkgdHJhbnNmb3JtIHN0cmluZyBvciBhcnJheSBvZiB0cmFuc2Zvcm1hdGlvbnMgKGluIHRoZSBsYXN0IGNhc2UgaXQgd2lsbCBiZSByZXR1cm5lZCBzdHJhaWdodCBhd2F5KVxuICAgICA9IChhcnJheSkgYXJyYXkgb2YgdHJhbnNmb3JtYXRpb25zLlxuICAgIFxcKi9cbiAgICBSLnBhcnNlVHJhbnNmb3JtU3RyaW5nID0gY2FjaGVyKGZ1bmN0aW9uIChUU3RyaW5nKSB7XG4gICAgICAgIGlmICghVFN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcmFtQ291bnRzID0ge3I6IDMsIHM6IDQsIHQ6IDIsIG06IDZ9LFxuICAgICAgICAgICAgZGF0YSA9IFtdO1xuICAgICAgICBpZiAoUi5pcyhUU3RyaW5nLCBhcnJheSkgJiYgUi5pcyhUU3RyaW5nWzBdLCBhcnJheSkpIHsgLy8gcm91Z2ggYXNzdW1wdGlvblxuICAgICAgICAgICAgZGF0YSA9IHBhdGhDbG9uZShUU3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICBTdHIoVFN0cmluZykucmVwbGFjZSh0Q29tbWFuZCwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0gW10sXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBsb3dlckNhc2UuY2FsbChiKTtcbiAgICAgICAgICAgICAgICBjLnJlcGxhY2UocGF0aFZhbHVlcywgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgYiAmJiBwYXJhbXMucHVzaCgrYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiXVtjb25jYXRdKHBhcmFtcykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZGF0YS50b1N0cmluZyA9IFIuX3BhdGgyc3RyaW5nO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9KTtcbiAgICAvLyBQQVRIU1xuICAgIHZhciBwYXRocyA9IGZ1bmN0aW9uIChwcykge1xuICAgICAgICB2YXIgcCA9IHBhdGhzLnBzID0gcGF0aHMucHMgfHwge307XG4gICAgICAgIGlmIChwW3BzXSkge1xuICAgICAgICAgICAgcFtwc10uc2xlZXAgPSAxMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwW3BzXSA9IHtcbiAgICAgICAgICAgICAgICBzbGVlcDogMTAwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHApIGlmIChwW2hhc10oa2V5KSAmJiBrZXkgIT0gcHMpIHtcbiAgICAgICAgICAgICAgICBwW2tleV0uc2xlZXAtLTtcbiAgICAgICAgICAgICAgICAhcFtrZXldLnNsZWVwICYmIGRlbGV0ZSBwW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcFtwc107XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5maW5kRG90c0F0U2VnbWVudFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBGaW5kIGRvdCBjb29yZGluYXRlcyBvbiB0aGUgZ2l2ZW4gY3ViaWMgYmV6aWVyIGN1cnZlIGF0IHRoZSBnaXZlbiB0LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gdCAobnVtYmVyKSBwb3NpdGlvbiBvbiB0aGUgY3VydmUgKDAuLjEpXG4gICAgID0gKG9iamVjdCkgcG9pbnQgaW5mb3JtYXRpb24gaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIG8gICAgIG06IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCBhbmNob3JcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCBhbmNob3JcbiAgICAgbyAgICAgfVxuICAgICBvICAgICBuOiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGFuY2hvclxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSByaWdodCBhbmNob3JcbiAgICAgbyAgICAgfVxuICAgICBvICAgICBzdGFydDoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBzdGFydCBvZiB0aGUgY3VydmVcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgb2YgdGhlIGN1cnZlXG4gICAgIG8gICAgIH1cbiAgICAgbyAgICAgZW5kOiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGVuZCBvZiB0aGUgY3VydmVcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgZW5kIG9mIHRoZSBjdXJ2ZVxuICAgICBvICAgICB9XG4gICAgIG8gICAgIGFscGhhOiAobnVtYmVyKSBhbmdsZSBvZiB0aGUgY3VydmUgZGVyaXZhdGl2ZSBhdCB0aGUgcG9pbnRcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIuZmluZERvdHNBdFNlZ21lbnQgPSBmdW5jdGlvbiAocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQpIHtcbiAgICAgICAgdmFyIHQxID0gMSAtIHQsXG4gICAgICAgICAgICB0MTMgPSBwb3codDEsIDMpLFxuICAgICAgICAgICAgdDEyID0gcG93KHQxLCAyKSxcbiAgICAgICAgICAgIHQyID0gdCAqIHQsXG4gICAgICAgICAgICB0MyA9IHQyICogdCxcbiAgICAgICAgICAgIHggPSB0MTMgKiBwMXggKyB0MTIgKiAzICogdCAqIGMxeCArIHQxICogMyAqIHQgKiB0ICogYzJ4ICsgdDMgKiBwMngsXG4gICAgICAgICAgICB5ID0gdDEzICogcDF5ICsgdDEyICogMyAqIHQgKiBjMXkgKyB0MSAqIDMgKiB0ICogdCAqIGMyeSArIHQzICogcDJ5LFxuICAgICAgICAgICAgbXggPSBwMXggKyAyICogdCAqIChjMXggLSBwMXgpICsgdDIgKiAoYzJ4IC0gMiAqIGMxeCArIHAxeCksXG4gICAgICAgICAgICBteSA9IHAxeSArIDIgKiB0ICogKGMxeSAtIHAxeSkgKyB0MiAqIChjMnkgLSAyICogYzF5ICsgcDF5KSxcbiAgICAgICAgICAgIG54ID0gYzF4ICsgMiAqIHQgKiAoYzJ4IC0gYzF4KSArIHQyICogKHAyeCAtIDIgKiBjMnggKyBjMXgpLFxuICAgICAgICAgICAgbnkgPSBjMXkgKyAyICogdCAqIChjMnkgLSBjMXkpICsgdDIgKiAocDJ5IC0gMiAqIGMyeSArIGMxeSksXG4gICAgICAgICAgICBheCA9IHQxICogcDF4ICsgdCAqIGMxeCxcbiAgICAgICAgICAgIGF5ID0gdDEgKiBwMXkgKyB0ICogYzF5LFxuICAgICAgICAgICAgY3ggPSB0MSAqIGMyeCArIHQgKiBwMngsXG4gICAgICAgICAgICBjeSA9IHQxICogYzJ5ICsgdCAqIHAyeSxcbiAgICAgICAgICAgIGFscGhhID0gKDkwIC0gbWF0aC5hdGFuMihteCAtIG54LCBteSAtIG55KSAqIDE4MCAvIFBJKTtcbiAgICAgICAgKG14ID4gbnggfHwgbXkgPCBueSkgJiYgKGFscGhhICs9IDE4MCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIG06IHt4OiBteCwgeTogbXl9LFxuICAgICAgICAgICAgbjoge3g6IG54LCB5OiBueX0sXG4gICAgICAgICAgICBzdGFydDoge3g6IGF4LCB5OiBheX0sXG4gICAgICAgICAgICBlbmQ6IHt4OiBjeCwgeTogY3l9LFxuICAgICAgICAgICAgYWxwaGE6IGFscGhhXG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5iZXppZXJCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybiBib3VuZGluZyBib3ggb2YgYSBnaXZlbiBjdWJpYyBiZXppZXIgY3VydmVcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcDF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAqIG9yXG4gICAgIC0gYmV6IChhcnJheSkgYXJyYXkgb2Ygc2l4IHBvaW50cyBmb3IgYmV6aWVyIGN1cnZlXG4gICAgID0gKG9iamVjdCkgcG9pbnQgaW5mb3JtYXRpb24gaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgbWluOiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgcG9pbnRcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgdG9wIHBvaW50XG4gICAgIG8gICAgIH1cbiAgICAgbyAgICAgbWF4OiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IHBvaW50XG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGJvdHRvbSBwb2ludFxuICAgICBvICAgICB9XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLmJlemllckJCb3ggPSBmdW5jdGlvbiAocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnkpIHtcbiAgICAgICAgaWYgKCFSLmlzKHAxeCwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgcDF4ID0gW3AxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5XTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYmJveCA9IGN1cnZlRGltLmFwcGx5KG51bGwsIHAxeCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBiYm94Lm1pbi54LFxuICAgICAgICAgICAgeTogYmJveC5taW4ueSxcbiAgICAgICAgICAgIHgyOiBiYm94Lm1heC54LFxuICAgICAgICAgICAgeTI6IGJib3gubWF4LnksXG4gICAgICAgICAgICB3aWR0aDogYmJveC5tYXgueCAtIGJib3gubWluLngsXG4gICAgICAgICAgICBoZWlnaHQ6IGJib3gubWF4LnkgLSBiYm94Lm1pbi55XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5pc1BvaW50SW5zaWRlQkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBnaXZlbiBwb2ludCBpcyBpbnNpZGUgYm91bmRpbmcgYm94ZXMuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGJib3ggKHN0cmluZykgYm91bmRpbmcgYm94XG4gICAgIC0geCAoc3RyaW5nKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIC0geSAoc3RyaW5nKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBwb2ludCBpbnNpZGVcbiAgICBcXCovXG4gICAgUi5pc1BvaW50SW5zaWRlQkJveCA9IGZ1bmN0aW9uIChiYm94LCB4LCB5KSB7XG4gICAgICAgIHJldHVybiB4ID49IGJib3gueCAmJiB4IDw9IGJib3gueDIgJiYgeSA+PSBiYm94LnkgJiYgeSA8PSBiYm94LnkyO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaXNCQm94SW50ZXJzZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHR3byBib3VuZGluZyBib3hlcyBpbnRlcnNlY3RcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gYmJveDEgKHN0cmluZykgZmlyc3QgYm91bmRpbmcgYm94XG4gICAgIC0gYmJveDIgKHN0cmluZykgc2Vjb25kIGJvdW5kaW5nIGJveFxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgdGhleSBpbnRlcnNlY3RcbiAgICBcXCovXG4gICAgUi5pc0JCb3hJbnRlcnNlY3QgPSBmdW5jdGlvbiAoYmJveDEsIGJib3gyKSB7XG4gICAgICAgIHZhciBpID0gUi5pc1BvaW50SW5zaWRlQkJveDtcbiAgICAgICAgcmV0dXJuIGkoYmJveDIsIGJib3gxLngsIGJib3gxLnkpXG4gICAgICAgICAgICB8fCBpKGJib3gyLCBiYm94MS54MiwgYmJveDEueSlcbiAgICAgICAgICAgIHx8IGkoYmJveDIsIGJib3gxLngsIGJib3gxLnkyKVxuICAgICAgICAgICAgfHwgaShiYm94MiwgYmJveDEueDIsIGJib3gxLnkyKVxuICAgICAgICAgICAgfHwgaShiYm94MSwgYmJveDIueCwgYmJveDIueSlcbiAgICAgICAgICAgIHx8IGkoYmJveDEsIGJib3gyLngyLCBiYm94Mi55KVxuICAgICAgICAgICAgfHwgaShiYm94MSwgYmJveDIueCwgYmJveDIueTIpXG4gICAgICAgICAgICB8fCBpKGJib3gxLCBiYm94Mi54MiwgYmJveDIueTIpXG4gICAgICAgICAgICB8fCAoYmJveDEueCA8IGJib3gyLngyICYmIGJib3gxLnggPiBiYm94Mi54IHx8IGJib3gyLnggPCBiYm94MS54MiAmJiBiYm94Mi54ID4gYmJveDEueClcbiAgICAgICAgICAgICYmIChiYm94MS55IDwgYmJveDIueTIgJiYgYmJveDEueSA+IGJib3gyLnkgfHwgYmJveDIueSA8IGJib3gxLnkyICYmIGJib3gyLnkgPiBiYm94MS55KTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGJhc2UzKHQsIHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgICAgIHZhciB0MSA9IC0zICogcDEgKyA5ICogcDIgLSA5ICogcDMgKyAzICogcDQsXG4gICAgICAgICAgICB0MiA9IHQgKiB0MSArIDYgKiBwMSAtIDEyICogcDIgKyA2ICogcDM7XG4gICAgICAgIHJldHVybiB0ICogdDIgLSAzICogcDEgKyAzICogcDI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIHopIHtcbiAgICAgICAgaWYgKHogPT0gbnVsbCkge1xuICAgICAgICAgICAgeiA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgeiA9IHogPiAxID8gMSA6IHogPCAwID8gMCA6IHo7XG4gICAgICAgIHZhciB6MiA9IHogLyAyLFxuICAgICAgICAgICAgbiA9IDEyLFxuICAgICAgICAgICAgVHZhbHVlcyA9IFstMC4xMjUyLDAuMTI1MiwtMC4zNjc4LDAuMzY3OCwtMC41ODczLDAuNTg3MywtMC43Njk5LDAuNzY5OSwtMC45MDQxLDAuOTA0MSwtMC45ODE2LDAuOTgxNl0sXG4gICAgICAgICAgICBDdmFsdWVzID0gWzAuMjQ5MSwwLjI0OTEsMC4yMzM1LDAuMjMzNSwwLjIwMzIsMC4yMDMyLDAuMTYwMSwwLjE2MDEsMC4xMDY5LDAuMTA2OSwwLjA0NzIsMC4wNDcyXSxcbiAgICAgICAgICAgIHN1bSA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY3QgPSB6MiAqIFR2YWx1ZXNbaV0gKyB6MixcbiAgICAgICAgICAgICAgICB4YmFzZSA9IGJhc2UzKGN0LCB4MSwgeDIsIHgzLCB4NCksXG4gICAgICAgICAgICAgICAgeWJhc2UgPSBiYXNlMyhjdCwgeTEsIHkyLCB5MywgeTQpLFxuICAgICAgICAgICAgICAgIGNvbWIgPSB4YmFzZSAqIHhiYXNlICsgeWJhc2UgKiB5YmFzZTtcbiAgICAgICAgICAgIHN1bSArPSBDdmFsdWVzW2ldICogbWF0aC5zcXJ0KGNvbWIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB6MiAqIHN1bTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0VGF0TGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgbGwpIHtcbiAgICAgICAgaWYgKGxsIDwgMCB8fCBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSA8IGxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHQgPSAxLFxuICAgICAgICAgICAgc3RlcCA9IHQgLyAyLFxuICAgICAgICAgICAgdDIgPSB0IC0gc3RlcCxcbiAgICAgICAgICAgIGwsXG4gICAgICAgICAgICBlID0gLjAxO1xuICAgICAgICBsID0gYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgdDIpO1xuICAgICAgICB3aGlsZSAoYWJzKGwgLSBsbCkgPiBlKSB7XG4gICAgICAgICAgICBzdGVwIC89IDI7XG4gICAgICAgICAgICB0MiArPSAobCA8IGxsID8gMSA6IC0xKSAqIHN0ZXA7XG4gICAgICAgICAgICBsID0gYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgdDIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0MjtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXJzZWN0KHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBtbWF4KHgxLCB4MikgPCBtbWluKHgzLCB4NCkgfHxcbiAgICAgICAgICAgIG1taW4oeDEsIHgyKSA+IG1tYXgoeDMsIHg0KSB8fFxuICAgICAgICAgICAgbW1heCh5MSwgeTIpIDwgbW1pbih5MywgeTQpIHx8XG4gICAgICAgICAgICBtbWluKHkxLCB5MikgPiBtbWF4KHkzLCB5NClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG54ID0gKHgxICogeTIgLSB5MSAqIHgyKSAqICh4MyAtIHg0KSAtICh4MSAtIHgyKSAqICh4MyAqIHk0IC0geTMgKiB4NCksXG4gICAgICAgICAgICBueSA9ICh4MSAqIHkyIC0geTEgKiB4MikgKiAoeTMgLSB5NCkgLSAoeTEgLSB5MikgKiAoeDMgKiB5NCAtIHkzICogeDQpLFxuICAgICAgICAgICAgZGVub21pbmF0b3IgPSAoeDEgLSB4MikgKiAoeTMgLSB5NCkgLSAoeTEgLSB5MikgKiAoeDMgLSB4NCk7XG5cbiAgICAgICAgaWYgKCFkZW5vbWluYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBweCA9IG54IC8gZGVub21pbmF0b3IsXG4gICAgICAgICAgICBweSA9IG55IC8gZGVub21pbmF0b3IsXG4gICAgICAgICAgICBweDIgPSArcHgudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIHB5MiA9ICtweS50b0ZpeGVkKDIpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBweDIgPCArbW1pbih4MSwgeDIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB4MiA+ICttbWF4KHgxLCB4MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHgyIDwgK21taW4oeDMsIHg0KS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweDIgPiArbW1heCh4MywgeDQpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA8ICttbWluKHkxLCB5MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyID4gK21tYXgoeTEsIHkyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPCArbW1pbih5MywgeTQpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA+ICttbWF4KHkzLCB5NCkudG9GaXhlZCgyKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge3g6IHB4LCB5OiBweX07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyKGJlejEsIGJlejIpIHtcbiAgICAgICAgcmV0dXJuIGludGVySGVscGVyKGJlejEsIGJlejIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlckNvdW50KGJlejEsIGJlejIpIHtcbiAgICAgICAgcmV0dXJuIGludGVySGVscGVyKGJlejEsIGJlejIsIDEpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlckhlbHBlcihiZXoxLCBiZXoyLCBqdXN0Q291bnQpIHtcbiAgICAgICAgdmFyIGJib3gxID0gUi5iZXppZXJCQm94KGJlejEpLFxuICAgICAgICAgICAgYmJveDIgPSBSLmJlemllckJCb3goYmV6Mik7XG4gICAgICAgIGlmICghUi5pc0JCb3hJbnRlcnNlY3QoYmJveDEsIGJib3gyKSkge1xuICAgICAgICAgICAgcmV0dXJuIGp1c3RDb3VudCA/IDAgOiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbDEgPSBiZXpsZW4uYXBwbHkoMCwgYmV6MSksXG4gICAgICAgICAgICBsMiA9IGJlemxlbi5hcHBseSgwLCBiZXoyKSxcbiAgICAgICAgICAgIG4xID0gbW1heCh+fihsMSAvIDUpLCAxKSxcbiAgICAgICAgICAgIG4yID0gbW1heCh+fihsMiAvIDUpLCAxKSxcbiAgICAgICAgICAgIGRvdHMxID0gW10sXG4gICAgICAgICAgICBkb3RzMiA9IFtdLFxuICAgICAgICAgICAgeHkgPSB7fSxcbiAgICAgICAgICAgIHJlcyA9IGp1c3RDb3VudCA/IDAgOiBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuMSArIDE7IGkrKykge1xuICAgICAgICAgICAgdmFyIHAgPSBSLmZpbmREb3RzQXRTZWdtZW50LmFwcGx5KFIsIGJlejEuY29uY2F0KGkgLyBuMSkpO1xuICAgICAgICAgICAgZG90czEucHVzaCh7eDogcC54LCB5OiBwLnksIHQ6IGkgLyBuMX0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMiArIDE7IGkrKykge1xuICAgICAgICAgICAgcCA9IFIuZmluZERvdHNBdFNlZ21lbnQuYXBwbHkoUiwgYmV6Mi5jb25jYXQoaSAvIG4yKSk7XG4gICAgICAgICAgICBkb3RzMi5wdXNoKHt4OiBwLngsIHk6IHAueSwgdDogaSAvIG4yfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4xOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjI7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBkaSA9IGRvdHMxW2ldLFxuICAgICAgICAgICAgICAgICAgICBkaTEgPSBkb3RzMVtpICsgMV0sXG4gICAgICAgICAgICAgICAgICAgIGRqID0gZG90czJbal0sXG4gICAgICAgICAgICAgICAgICAgIGRqMSA9IGRvdHMyW2ogKyAxXSxcbiAgICAgICAgICAgICAgICAgICAgY2kgPSBhYnMoZGkxLnggLSBkaS54KSA8IC4wMDEgPyBcInlcIiA6IFwieFwiLFxuICAgICAgICAgICAgICAgICAgICBjaiA9IGFicyhkajEueCAtIGRqLngpIDwgLjAwMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIGlzID0gaW50ZXJzZWN0KGRpLngsIGRpLnksIGRpMS54LCBkaTEueSwgZGoueCwgZGoueSwgZGoxLngsIGRqMS55KTtcbiAgICAgICAgICAgICAgICBpZiAoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHh5W2lzLngudG9GaXhlZCg0KV0gPT0gaXMueS50b0ZpeGVkKDQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB4eVtpcy54LnRvRml4ZWQoNCldID0gaXMueS50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBkaS50ICsgYWJzKChpc1tjaV0gLSBkaVtjaV0pIC8gKGRpMVtjaV0gLSBkaVtjaV0pKSAqIChkaTEudCAtIGRpLnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdDIgPSBkai50ICsgYWJzKChpc1tjal0gLSBkaltjal0pIC8gKGRqMVtjal0gLSBkaltjal0pKSAqIChkajEudCAtIGRqLnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodDEgPj0gMCAmJiB0MSA8PSAxLjAwMSAmJiB0MiA+PSAwICYmIHQyIDw9IDEuMDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanVzdENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogaXMueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogaXMueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdDE6IG1taW4odDEsIDEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MjogbW1pbih0MiwgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5wYXRoSW50ZXJzZWN0aW9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIEZpbmRzIGludGVyc2VjdGlvbnMgb2YgdHdvIHBhdGhzXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHBhdGgxIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgIC0gcGF0aDIgKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgPSAoYXJyYXkpIGRvdHMgb2YgaW50ZXJzZWN0aW9uXG4gICAgIG8gW1xuICAgICBvICAgICB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIG8gICAgICAgICB0MTogKG51bWJlcikgdCB2YWx1ZSBmb3Igc2VnbWVudCBvZiBwYXRoMVxuICAgICBvICAgICAgICAgdDI6IChudW1iZXIpIHQgdmFsdWUgZm9yIHNlZ21lbnQgb2YgcGF0aDJcbiAgICAgbyAgICAgICAgIHNlZ21lbnQxOiAobnVtYmVyKSBvcmRlciBudW1iZXIgZm9yIHNlZ21lbnQgb2YgcGF0aDFcbiAgICAgbyAgICAgICAgIHNlZ21lbnQyOiAobnVtYmVyKSBvcmRlciBudW1iZXIgZm9yIHNlZ21lbnQgb2YgcGF0aDJcbiAgICAgbyAgICAgICAgIGJlejE6IChhcnJheSkgZWlnaHQgY29vcmRpbmF0ZXMgcmVwcmVzZW50aW5nIGJlemnDqXIgY3VydmUgZm9yIHRoZSBzZWdtZW50IG9mIHBhdGgxXG4gICAgIG8gICAgICAgICBiZXoyOiAoYXJyYXkpIGVpZ2h0IGNvb3JkaW5hdGVzIHJlcHJlc2VudGluZyBiZXppw6lyIGN1cnZlIGZvciB0aGUgc2VnbWVudCBvZiBwYXRoMlxuICAgICBvICAgICB9XG4gICAgIG8gXVxuICAgIFxcKi9cbiAgICBSLnBhdGhJbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAocGF0aDEsIHBhdGgyKSB7XG4gICAgICAgIHJldHVybiBpbnRlclBhdGhIZWxwZXIocGF0aDEsIHBhdGgyKTtcbiAgICB9O1xuICAgIFIucGF0aEludGVyc2VjdGlvbk51bWJlciA9IGZ1bmN0aW9uIChwYXRoMSwgcGF0aDIpIHtcbiAgICAgICAgcmV0dXJuIGludGVyUGF0aEhlbHBlcihwYXRoMSwgcGF0aDIsIDEpO1xuICAgIH07XG4gICAgZnVuY3Rpb24gaW50ZXJQYXRoSGVscGVyKHBhdGgxLCBwYXRoMiwganVzdENvdW50KSB7XG4gICAgICAgIHBhdGgxID0gUi5fcGF0aDJjdXJ2ZShwYXRoMSk7XG4gICAgICAgIHBhdGgyID0gUi5fcGF0aDJjdXJ2ZShwYXRoMik7XG4gICAgICAgIHZhciB4MSwgeTEsIHgyLCB5MiwgeDFtLCB5MW0sIHgybSwgeTJtLCBiZXoxLCBiZXoyLFxuICAgICAgICAgICAgcmVzID0ganVzdENvdW50ID8gMCA6IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYXRoMS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGkgPSBwYXRoMVtpXTtcbiAgICAgICAgICAgIGlmIChwaVswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgIHgxID0geDFtID0gcGlbMV07XG4gICAgICAgICAgICAgICAgeTEgPSB5MW0gPSBwaVsyXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHBpWzBdID09IFwiQ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlejEgPSBbeDEsIHkxXS5jb25jYXQocGkuc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICB4MSA9IGJlejFbNl07XG4gICAgICAgICAgICAgICAgICAgIHkxID0gYmV6MVs3XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiZXoxID0gW3gxLCB5MSwgeDEsIHkxLCB4MW0sIHkxbSwgeDFtLCB5MW1dO1xuICAgICAgICAgICAgICAgICAgICB4MSA9IHgxbTtcbiAgICAgICAgICAgICAgICAgICAgeTEgPSB5MW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBqaiA9IHBhdGgyLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBqID0gcGF0aDJbal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwalswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4Mm0gPSBwalsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0geTJtID0gcGpbMl07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGpbMF0gPT0gXCJDXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXoyID0gW3gyLCB5Ml0uY29uY2F0KHBqLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGJlejJbNl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBiZXoyWzddO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXoyID0gW3gyLCB5MiwgeDIsIHkyLCB4Mm0sIHkybSwgeDJtLCB5Mm1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgyID0geDJtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkyID0geTJtO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludHIgPSBpbnRlckhlbHBlcihiZXoxLCBiZXoyLCBqdXN0Q291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGp1c3RDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSBpbnRyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMCwga2sgPSBpbnRyLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5zZWdtZW50MSA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uc2VnbWVudDIgPSBqO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLmJlejEgPSBiZXoxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLmJlejIgPSBiZXoyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGludHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmlzUG9pbnRJbnNpZGVQYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGdpdmVuIHBvaW50IGlzIGluc2lkZSBhIGdpdmVuIGNsb3NlZCBwYXRoLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgIC0geCAobnVtYmVyKSB4IG9mIHRoZSBwb2ludFxuICAgICAtIHkgKG51bWJlcikgeSBvZiB0aGUgcG9pbnRcbiAgICAgPSAoYm9vbGVhbikgdHJ1ZSwgaWYgcG9pbnQgaXMgaW5zaWRlIHRoZSBwYXRoXG4gICAgXFwqL1xuICAgIFIuaXNQb2ludEluc2lkZVBhdGggPSBmdW5jdGlvbiAocGF0aCwgeCwgeSkge1xuICAgICAgICB2YXIgYmJveCA9IFIucGF0aEJCb3gocGF0aCk7XG4gICAgICAgIHJldHVybiBSLmlzUG9pbnRJbnNpZGVCQm94KGJib3gsIHgsIHkpICYmXG4gICAgICAgICAgICAgICBpbnRlclBhdGhIZWxwZXIocGF0aCwgW1tcIk1cIiwgeCwgeV0sIFtcIkhcIiwgYmJveC54MiArIDEwXV0sIDEpICUgMiA9PSAxO1xuICAgIH07XG4gICAgUi5fcmVtb3ZlZEZhY3RvcnkgPSBmdW5jdGlvbiAobWV0aG9kbmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5sb2dcIiwgbnVsbCwgXCJSYXBoYVxceGVibDogeW91IGFyZSBjYWxsaW5nIHRvIG1ldGhvZCBcXHUyMDFjXCIgKyBtZXRob2RuYW1lICsgXCJcXHUyMDFkIG9mIHJlbW92ZWQgb2JqZWN0XCIsIG1ldGhvZG5hbWUpO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucGF0aEJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJuIGJvdW5kaW5nIGJveCBvZiBhIGdpdmVuIHBhdGhcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICA9IChvYmplY3QpIGJvdW5kaW5nIGJveFxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IHRvcCBwb2ludCBvZiB0aGUgYm94XG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCB0b3AgcG9pbnQgb2YgdGhlIGJveFxuICAgICBvICAgICB4MjogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSByaWdodCBib3R0b20gcG9pbnQgb2YgdGhlIGJveFxuICAgICBvICAgICB5MjogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSByaWdodCBib3R0b20gcG9pbnQgb2YgdGhlIGJveFxuICAgICBvICAgICB3aWR0aDogKG51bWJlcikgd2lkdGggb2YgdGhlIGJveFxuICAgICBvICAgICBoZWlnaHQ6IChudW1iZXIpIGhlaWdodCBvZiB0aGUgYm94XG4gICAgIG8gICAgIGN4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgYm94XG4gICAgIG8gICAgIGN5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgYm94XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICB2YXIgcGF0aERpbWVuc2lvbnMgPSBSLnBhdGhCQm94ID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgdmFyIHB0aCA9IHBhdGhzKHBhdGgpO1xuICAgICAgICBpZiAocHRoLmJib3gpIHtcbiAgICAgICAgICAgIHJldHVybiBjbG9uZShwdGguYmJveCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3g6IDAsIHk6IDAsIHdpZHRoOiAwLCBoZWlnaHQ6IDAsIHgyOiAwLCB5MjogMH07XG4gICAgICAgIH1cbiAgICAgICAgcGF0aCA9IHBhdGgyY3VydmUocGF0aCk7XG4gICAgICAgIHZhciB4ID0gMCxcbiAgICAgICAgICAgIHkgPSAwLFxuICAgICAgICAgICAgWCA9IFtdLFxuICAgICAgICAgICAgWSA9IFtdLFxuICAgICAgICAgICAgcDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBwID0gcGF0aFtpXTtcbiAgICAgICAgICAgIGlmIChwWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgeCA9IHBbMV07XG4gICAgICAgICAgICAgICAgeSA9IHBbMl07XG4gICAgICAgICAgICAgICAgWC5wdXNoKHgpO1xuICAgICAgICAgICAgICAgIFkucHVzaCh5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpbSA9IGN1cnZlRGltKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0pO1xuICAgICAgICAgICAgICAgIFggPSBYW2NvbmNhdF0oZGltLm1pbi54LCBkaW0ubWF4LngpO1xuICAgICAgICAgICAgICAgIFkgPSBZW2NvbmNhdF0oZGltLm1pbi55LCBkaW0ubWF4LnkpO1xuICAgICAgICAgICAgICAgIHggPSBwWzVdO1xuICAgICAgICAgICAgICAgIHkgPSBwWzZdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciB4bWluID0gbW1pblthcHBseV0oMCwgWCksXG4gICAgICAgICAgICB5bWluID0gbW1pblthcHBseV0oMCwgWSksXG4gICAgICAgICAgICB4bWF4ID0gbW1heFthcHBseV0oMCwgWCksXG4gICAgICAgICAgICB5bWF4ID0gbW1heFthcHBseV0oMCwgWSksXG4gICAgICAgICAgICB3aWR0aCA9IHhtYXggLSB4bWluLFxuICAgICAgICAgICAgaGVpZ2h0ID0geW1heCAtIHltaW4sXG4gICAgICAgICAgICAgICAgYmIgPSB7XG4gICAgICAgICAgICAgICAgeDogeG1pbixcbiAgICAgICAgICAgICAgICB5OiB5bWluLFxuICAgICAgICAgICAgICAgIHgyOiB4bWF4LFxuICAgICAgICAgICAgICAgIHkyOiB5bWF4LFxuICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgICAgICBjeDogeG1pbiArIHdpZHRoIC8gMixcbiAgICAgICAgICAgICAgICBjeTogeW1pbiArIGhlaWdodCAvIDJcbiAgICAgICAgICAgIH07XG4gICAgICAgIHB0aC5iYm94ID0gY2xvbmUoYmIpO1xuICAgICAgICByZXR1cm4gYmI7XG4gICAgfSxcbiAgICAgICAgcGF0aENsb25lID0gZnVuY3Rpb24gKHBhdGhBcnJheSkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IGNsb25lKHBhdGhBcnJheSk7XG4gICAgICAgICAgICByZXMudG9TdHJpbmcgPSBSLl9wYXRoMnN0cmluZztcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sXG4gICAgICAgIHBhdGhUb1JlbGF0aXZlID0gUi5fcGF0aFRvUmVsYXRpdmUgPSBmdW5jdGlvbiAocGF0aEFycmF5KSB7XG4gICAgICAgICAgICB2YXIgcHRoID0gcGF0aHMocGF0aEFycmF5KTtcbiAgICAgICAgICAgIGlmIChwdGgucmVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhDbG9uZShwdGgucmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghUi5pcyhwYXRoQXJyYXksIGFycmF5KSB8fCAhUi5pcyhwYXRoQXJyYXkgJiYgcGF0aEFycmF5WzBdLCBhcnJheSkpIHsgLy8gcm91Z2ggYXNzdW1wdGlvblxuICAgICAgICAgICAgICAgIHBhdGhBcnJheSA9IFIucGFyc2VQYXRoU3RyaW5nKHBhdGhBcnJheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVzID0gW10sXG4gICAgICAgICAgICAgICAgeCA9IDAsXG4gICAgICAgICAgICAgICAgeSA9IDAsXG4gICAgICAgICAgICAgICAgbXggPSAwLFxuICAgICAgICAgICAgICAgIG15ID0gMCxcbiAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICBpZiAocGF0aEFycmF5WzBdWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgeCA9IHBhdGhBcnJheVswXVsxXTtcbiAgICAgICAgICAgICAgICB5ID0gcGF0aEFycmF5WzBdWzJdO1xuICAgICAgICAgICAgICAgIG14ID0geDtcbiAgICAgICAgICAgICAgICBteSA9IHk7XG4gICAgICAgICAgICAgICAgc3RhcnQrKztcbiAgICAgICAgICAgICAgICByZXMucHVzaChbXCJNXCIsIHgsIHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBzdGFydCwgaWkgPSBwYXRoQXJyYXkubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByID0gcmVzW2ldID0gW10sXG4gICAgICAgICAgICAgICAgICAgIHBhID0gcGF0aEFycmF5W2ldO1xuICAgICAgICAgICAgICAgIGlmIChwYVswXSAhPSBsb3dlckNhc2UuY2FsbChwYVswXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgclswXSA9IGxvd2VyQ2FzZS5jYWxsKHBhWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSBwYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzJdID0gcGFbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclszXSA9IHBhWzNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbNF0gPSBwYVs0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzVdID0gcGFbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls2XSA9ICsocGFbNl0gLSB4KS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbN10gPSArKHBhWzddIC0geSkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9ICsocGFbMV0gLSB5KS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteCA9IHBhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG15ID0gcGFbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxLCBqaiA9IHBhLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcltqXSA9ICsocGFbal0gLSAoKGogJSAyKSA/IHggOiB5KSkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByID0gcmVzW2ldID0gW107XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYVswXSA9PSBcIm1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXggPSBwYVsxXSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBteSA9IHBhWzJdICsgeTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMCwga2sgPSBwYS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNbaV1ba10gPSBwYVtrXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gcmVzW2ldLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc1tpXVswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwielwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IG14O1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IG15O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ICs9ICtyZXNbaV1bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gK3Jlc1tpXVtsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgeCArPSArcmVzW2ldW2xlbiAtIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSArPSArcmVzW2ldW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy50b1N0cmluZyA9IFIuX3BhdGgyc3RyaW5nO1xuICAgICAgICAgICAgcHRoLnJlbCA9IHBhdGhDbG9uZShyZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSxcbiAgICAgICAgcGF0aFRvQWJzb2x1dGUgPSBSLl9wYXRoVG9BYnNvbHV0ZSA9IGZ1bmN0aW9uIChwYXRoQXJyYXkpIHtcbiAgICAgICAgICAgIHZhciBwdGggPSBwYXRocyhwYXRoQXJyYXkpO1xuICAgICAgICAgICAgaWYgKHB0aC5hYnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aENsb25lKHB0aC5hYnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFSLmlzKHBhdGhBcnJheSwgYXJyYXkpIHx8ICFSLmlzKHBhdGhBcnJheSAmJiBwYXRoQXJyYXlbMF0sIGFycmF5KSkgeyAvLyByb3VnaCBhc3N1bXB0aW9uXG4gICAgICAgICAgICAgICAgcGF0aEFycmF5ID0gUi5wYXJzZVBhdGhTdHJpbmcocGF0aEFycmF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcGF0aEFycmF5IHx8ICFwYXRoQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtbXCJNXCIsIDAsIDBdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXMgPSBbXSxcbiAgICAgICAgICAgICAgICB4ID0gMCxcbiAgICAgICAgICAgICAgICB5ID0gMCxcbiAgICAgICAgICAgICAgICBteCA9IDAsXG4gICAgICAgICAgICAgICAgbXkgPSAwLFxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgICAgICAgIGlmIChwYXRoQXJyYXlbMF1bMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICB4ID0gK3BhdGhBcnJheVswXVsxXTtcbiAgICAgICAgICAgICAgICB5ID0gK3BhdGhBcnJheVswXVsyXTtcbiAgICAgICAgICAgICAgICBteCA9IHg7XG4gICAgICAgICAgICAgICAgbXkgPSB5O1xuICAgICAgICAgICAgICAgIHN0YXJ0Kys7XG4gICAgICAgICAgICAgICAgcmVzWzBdID0gW1wiTVwiLCB4LCB5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjcnogPSBwYXRoQXJyYXkubGVuZ3RoID09IDMgJiYgcGF0aEFycmF5WzBdWzBdID09IFwiTVwiICYmIHBhdGhBcnJheVsxXVswXS50b1VwcGVyQ2FzZSgpID09IFwiUlwiICYmIHBhdGhBcnJheVsyXVswXS50b1VwcGVyQ2FzZSgpID09IFwiWlwiO1xuICAgICAgICAgICAgZm9yICh2YXIgciwgcGEsIGkgPSBzdGFydCwgaWkgPSBwYXRoQXJyYXkubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHIgPSBbXSk7XG4gICAgICAgICAgICAgICAgcGEgPSBwYXRoQXJyYXlbaV07XG4gICAgICAgICAgICAgICAgaWYgKHBhWzBdICE9IHVwcGVyQ2FzZS5jYWxsKHBhWzBdKSkge1xuICAgICAgICAgICAgICAgICAgICByWzBdID0gdXBwZXJDYXNlLmNhbGwocGFbMF0pO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9IHBhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbMl0gPSBwYVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzNdID0gcGFbM107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls0XSA9IHBhWzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbNV0gPSBwYVs1XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzZdID0gKyhwYVs2XSArIHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbN10gPSArKHBhWzddICsgeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSArcGFbMV0gKyB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gK3BhWzFdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJSXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvdHMgPSBbeCwgeV1bY29uY2F0XShwYS5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDIsIGpqID0gZG90cy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvdHNbal0gPSArZG90c1tqXSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvdHNbKytqXSA9ICtkb3RzW2pdICsgeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlc1tjb25jYXRdKGNhdG11bGxSb20yYmV6aWVyKGRvdHMsIGNyeikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteCA9ICtwYVsxXSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXkgPSArcGFbMl0gKyB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBqaiA9IHBhLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcltqXSA9ICtwYVtqXSArICgoaiAlIDIpID8geCA6IHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGFbMF0gPT0gXCJSXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZG90cyA9IFt4LCB5XVtjb25jYXRdKHBhLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICByZXMgPSByZXNbY29uY2F0XShjYXRtdWxsUm9tMmJlemllcihkb3RzLCBjcnopKTtcbiAgICAgICAgICAgICAgICAgICAgciA9IFtcIlJcIl1bY29uY2F0XShwYS5zbGljZSgtMikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBrayA9IHBhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJba10gPSBwYVtrXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBteDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSBteTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHJbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSByWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBteCA9IHJbci5sZW5ndGggLSAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG15ID0gcltyLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHJbci5sZW5ndGggLSAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSByW3IubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnRvU3RyaW5nID0gUi5fcGF0aDJzdHJpbmc7XG4gICAgICAgICAgICBwdGguYWJzID0gcGF0aENsb25lKHJlcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LFxuICAgICAgICBsMmMgPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgICAgIHJldHVybiBbeDEsIHkxLCB4MiwgeTIsIHgyLCB5Ml07XG4gICAgICAgIH0sXG4gICAgICAgIHEyYyA9IGZ1bmN0aW9uICh4MSwgeTEsIGF4LCBheSwgeDIsIHkyKSB7XG4gICAgICAgICAgICB2YXIgXzEzID0gMSAvIDMsXG4gICAgICAgICAgICAgICAgXzIzID0gMiAvIDM7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICBfMTMgKiB4MSArIF8yMyAqIGF4LFxuICAgICAgICAgICAgICAgICAgICBfMTMgKiB5MSArIF8yMyAqIGF5LFxuICAgICAgICAgICAgICAgICAgICBfMTMgKiB4MiArIF8yMyAqIGF4LFxuICAgICAgICAgICAgICAgICAgICBfMTMgKiB5MiArIF8yMyAqIGF5LFxuICAgICAgICAgICAgICAgICAgICB4MixcbiAgICAgICAgICAgICAgICAgICAgeTJcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICB9LFxuICAgICAgICBhMmMgPSBmdW5jdGlvbiAoeDEsIHkxLCByeCwgcnksIGFuZ2xlLCBsYXJnZV9hcmNfZmxhZywgc3dlZXBfZmxhZywgeDIsIHkyLCByZWN1cnNpdmUpIHtcbiAgICAgICAgICAgIC8vIGZvciBtb3JlIGluZm9ybWF0aW9uIG9mIHdoZXJlIHRoaXMgbWF0aCBjYW1lIGZyb20gdmlzaXQ6XG4gICAgICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9pbXBsbm90ZS5odG1sI0FyY0ltcGxlbWVudGF0aW9uTm90ZXNcbiAgICAgICAgICAgIHZhciBfMTIwID0gUEkgKiAxMjAgLyAxODAsXG4gICAgICAgICAgICAgICAgcmFkID0gUEkgLyAxODAgKiAoK2FuZ2xlIHx8IDApLFxuICAgICAgICAgICAgICAgIHJlcyA9IFtdLFxuICAgICAgICAgICAgICAgIHh5LFxuICAgICAgICAgICAgICAgIHJvdGF0ZSA9IGNhY2hlcihmdW5jdGlvbiAoeCwgeSwgcmFkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBYID0geCAqIG1hdGguY29zKHJhZCkgLSB5ICogbWF0aC5zaW4ocmFkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFkgPSB4ICogbWF0aC5zaW4ocmFkKSArIHkgKiBtYXRoLmNvcyhyYWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge3g6IFgsIHk6IFl9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICB4eSA9IHJvdGF0ZSh4MSwgeTEsIC1yYWQpO1xuICAgICAgICAgICAgICAgIHgxID0geHkueDtcbiAgICAgICAgICAgICAgICB5MSA9IHh5Lnk7XG4gICAgICAgICAgICAgICAgeHkgPSByb3RhdGUoeDIsIHkyLCAtcmFkKTtcbiAgICAgICAgICAgICAgICB4MiA9IHh5Lng7XG4gICAgICAgICAgICAgICAgeTIgPSB4eS55O1xuICAgICAgICAgICAgICAgIHZhciBjb3MgPSBtYXRoLmNvcyhQSSAvIDE4MCAqIGFuZ2xlKSxcbiAgICAgICAgICAgICAgICAgICAgc2luID0gbWF0aC5zaW4oUEkgLyAxODAgKiBhbmdsZSksXG4gICAgICAgICAgICAgICAgICAgIHggPSAoeDEgLSB4MikgLyAyLFxuICAgICAgICAgICAgICAgICAgICB5ID0gKHkxIC0geTIpIC8gMjtcbiAgICAgICAgICAgICAgICB2YXIgaCA9ICh4ICogeCkgLyAocnggKiByeCkgKyAoeSAqIHkpIC8gKHJ5ICogcnkpO1xuICAgICAgICAgICAgICAgIGlmIChoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBoID0gbWF0aC5zcXJ0KGgpO1xuICAgICAgICAgICAgICAgICAgICByeCA9IGggKiByeDtcbiAgICAgICAgICAgICAgICAgICAgcnkgPSBoICogcnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciByeDIgPSByeCAqIHJ4LFxuICAgICAgICAgICAgICAgICAgICByeTIgPSByeSAqIHJ5LFxuICAgICAgICAgICAgICAgICAgICBrID0gKGxhcmdlX2FyY19mbGFnID09IHN3ZWVwX2ZsYWcgPyAtMSA6IDEpICpcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGguc3FydChhYnMoKHJ4MiAqIHJ5MiAtIHJ4MiAqIHkgKiB5IC0gcnkyICogeCAqIHgpIC8gKHJ4MiAqIHkgKiB5ICsgcnkyICogeCAqIHgpKSksXG4gICAgICAgICAgICAgICAgICAgIGN4ID0gayAqIHJ4ICogeSAvIHJ5ICsgKHgxICsgeDIpIC8gMixcbiAgICAgICAgICAgICAgICAgICAgY3kgPSBrICogLXJ5ICogeCAvIHJ4ICsgKHkxICsgeTIpIC8gMixcbiAgICAgICAgICAgICAgICAgICAgZjEgPSBtYXRoLmFzaW4oKCh5MSAtIGN5KSAvIHJ5KS50b0ZpeGVkKDkpKSxcbiAgICAgICAgICAgICAgICAgICAgZjIgPSBtYXRoLmFzaW4oKCh5MiAtIGN5KSAvIHJ5KS50b0ZpeGVkKDkpKTtcblxuICAgICAgICAgICAgICAgIGYxID0geDEgPCBjeCA/IFBJIC0gZjEgOiBmMTtcbiAgICAgICAgICAgICAgICBmMiA9IHgyIDwgY3ggPyBQSSAtIGYyIDogZjI7XG4gICAgICAgICAgICAgICAgZjEgPCAwICYmIChmMSA9IFBJICogMiArIGYxKTtcbiAgICAgICAgICAgICAgICBmMiA8IDAgJiYgKGYyID0gUEkgKiAyICsgZjIpO1xuICAgICAgICAgICAgICAgIGlmIChzd2VlcF9mbGFnICYmIGYxID4gZjIpIHtcbiAgICAgICAgICAgICAgICAgICAgZjEgPSBmMSAtIFBJICogMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFzd2VlcF9mbGFnICYmIGYyID4gZjEpIHtcbiAgICAgICAgICAgICAgICAgICAgZjIgPSBmMiAtIFBJICogMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGYxID0gcmVjdXJzaXZlWzBdO1xuICAgICAgICAgICAgICAgIGYyID0gcmVjdXJzaXZlWzFdO1xuICAgICAgICAgICAgICAgIGN4ID0gcmVjdXJzaXZlWzJdO1xuICAgICAgICAgICAgICAgIGN5ID0gcmVjdXJzaXZlWzNdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRmID0gZjIgLSBmMTtcbiAgICAgICAgICAgIGlmIChhYnMoZGYpID4gXzEyMCkge1xuICAgICAgICAgICAgICAgIHZhciBmMm9sZCA9IGYyLFxuICAgICAgICAgICAgICAgICAgICB4Mm9sZCA9IHgyLFxuICAgICAgICAgICAgICAgICAgICB5Mm9sZCA9IHkyO1xuICAgICAgICAgICAgICAgIGYyID0gZjEgKyBfMTIwICogKHN3ZWVwX2ZsYWcgJiYgZjIgPiBmMSA/IDEgOiAtMSk7XG4gICAgICAgICAgICAgICAgeDIgPSBjeCArIHJ4ICogbWF0aC5jb3MoZjIpO1xuICAgICAgICAgICAgICAgIHkyID0gY3kgKyByeSAqIG1hdGguc2luKGYyKTtcbiAgICAgICAgICAgICAgICByZXMgPSBhMmMoeDIsIHkyLCByeCwgcnksIGFuZ2xlLCAwLCBzd2VlcF9mbGFnLCB4Mm9sZCwgeTJvbGQsIFtmMiwgZjJvbGQsIGN4LCBjeV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGYgPSBmMiAtIGYxO1xuICAgICAgICAgICAgdmFyIGMxID0gbWF0aC5jb3MoZjEpLFxuICAgICAgICAgICAgICAgIHMxID0gbWF0aC5zaW4oZjEpLFxuICAgICAgICAgICAgICAgIGMyID0gbWF0aC5jb3MoZjIpLFxuICAgICAgICAgICAgICAgIHMyID0gbWF0aC5zaW4oZjIpLFxuICAgICAgICAgICAgICAgIHQgPSBtYXRoLnRhbihkZiAvIDQpLFxuICAgICAgICAgICAgICAgIGh4ID0gNCAvIDMgKiByeCAqIHQsXG4gICAgICAgICAgICAgICAgaHkgPSA0IC8gMyAqIHJ5ICogdCxcbiAgICAgICAgICAgICAgICBtMSA9IFt4MSwgeTFdLFxuICAgICAgICAgICAgICAgIG0yID0gW3gxICsgaHggKiBzMSwgeTEgLSBoeSAqIGMxXSxcbiAgICAgICAgICAgICAgICBtMyA9IFt4MiArIGh4ICogczIsIHkyIC0gaHkgKiBjMl0sXG4gICAgICAgICAgICAgICAgbTQgPSBbeDIsIHkyXTtcbiAgICAgICAgICAgIG0yWzBdID0gMiAqIG0xWzBdIC0gbTJbMF07XG4gICAgICAgICAgICBtMlsxXSA9IDIgKiBtMVsxXSAtIG0yWzFdO1xuICAgICAgICAgICAgaWYgKHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbTIsIG0zLCBtNF1bY29uY2F0XShyZXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMgPSBbbTIsIG0zLCBtNF1bY29uY2F0XShyZXMpLmpvaW4oKVtzcGxpdF0oXCIsXCIpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdyZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSByZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBuZXdyZXNbaV0gPSBpICUgMiA/IHJvdGF0ZShyZXNbaSAtIDFdLCByZXNbaV0sIHJhZCkueSA6IHJvdGF0ZShyZXNbaV0sIHJlc1tpICsgMV0sIHJhZCkueDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld3JlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZmluZERvdEF0U2VnbWVudCA9IGZ1bmN0aW9uIChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdCkge1xuICAgICAgICAgICAgdmFyIHQxID0gMSAtIHQ7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IHBvdyh0MSwgMykgKiBwMXggKyBwb3codDEsIDIpICogMyAqIHQgKiBjMXggKyB0MSAqIDMgKiB0ICogdCAqIGMyeCArIHBvdyh0LCAzKSAqIHAyeCxcbiAgICAgICAgICAgICAgICB5OiBwb3codDEsIDMpICogcDF5ICsgcG93KHQxLCAyKSAqIDMgKiB0ICogYzF5ICsgdDEgKiAzICogdCAqIHQgKiBjMnkgKyBwb3codCwgMykgKiBwMnlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnZlRGltID0gY2FjaGVyKGZ1bmN0aW9uIChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSkge1xuICAgICAgICAgICAgdmFyIGEgPSAoYzJ4IC0gMiAqIGMxeCArIHAxeCkgLSAocDJ4IC0gMiAqIGMyeCArIGMxeCksXG4gICAgICAgICAgICAgICAgYiA9IDIgKiAoYzF4IC0gcDF4KSAtIDIgKiAoYzJ4IC0gYzF4KSxcbiAgICAgICAgICAgICAgICBjID0gcDF4IC0gYzF4LFxuICAgICAgICAgICAgICAgIHQxID0gKC1iICsgbWF0aC5zcXJ0KGIgKiBiIC0gNCAqIGEgKiBjKSkgLyAyIC8gYSxcbiAgICAgICAgICAgICAgICB0MiA9ICgtYiAtIG1hdGguc3FydChiICogYiAtIDQgKiBhICogYykpIC8gMiAvIGEsXG4gICAgICAgICAgICAgICAgeSA9IFtwMXksIHAyeV0sXG4gICAgICAgICAgICAgICAgeCA9IFtwMXgsIHAyeF0sXG4gICAgICAgICAgICAgICAgZG90O1xuICAgICAgICAgICAgYWJzKHQxKSA+IFwiMWUxMlwiICYmICh0MSA9IC41KTtcbiAgICAgICAgICAgIGFicyh0MikgPiBcIjFlMTJcIiAmJiAodDIgPSAuNSk7XG4gICAgICAgICAgICBpZiAodDEgPiAwICYmIHQxIDwgMSkge1xuICAgICAgICAgICAgICAgIGRvdCA9IGZpbmREb3RBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQxKTtcbiAgICAgICAgICAgICAgICB4LnB1c2goZG90LngpO1xuICAgICAgICAgICAgICAgIHkucHVzaChkb3QueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodDIgPiAwICYmIHQyIDwgMSkge1xuICAgICAgICAgICAgICAgIGRvdCA9IGZpbmREb3RBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQyKTtcbiAgICAgICAgICAgICAgICB4LnB1c2goZG90LngpO1xuICAgICAgICAgICAgICAgIHkucHVzaChkb3QueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhID0gKGMyeSAtIDIgKiBjMXkgKyBwMXkpIC0gKHAyeSAtIDIgKiBjMnkgKyBjMXkpO1xuICAgICAgICAgICAgYiA9IDIgKiAoYzF5IC0gcDF5KSAtIDIgKiAoYzJ5IC0gYzF5KTtcbiAgICAgICAgICAgIGMgPSBwMXkgLSBjMXk7XG4gICAgICAgICAgICB0MSA9ICgtYiArIG1hdGguc3FydChiICogYiAtIDQgKiBhICogYykpIC8gMiAvIGE7XG4gICAgICAgICAgICB0MiA9ICgtYiAtIG1hdGguc3FydChiICogYiAtIDQgKiBhICogYykpIC8gMiAvIGE7XG4gICAgICAgICAgICBhYnModDEpID4gXCIxZTEyXCIgJiYgKHQxID0gLjUpO1xuICAgICAgICAgICAgYWJzKHQyKSA+IFwiMWUxMlwiICYmICh0MiA9IC41KTtcbiAgICAgICAgICAgIGlmICh0MSA+IDAgJiYgdDEgPCAxKSB7XG4gICAgICAgICAgICAgICAgZG90ID0gZmluZERvdEF0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdDEpO1xuICAgICAgICAgICAgICAgIHgucHVzaChkb3QueCk7XG4gICAgICAgICAgICAgICAgeS5wdXNoKGRvdC55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0MiA+IDAgJiYgdDIgPCAxKSB7XG4gICAgICAgICAgICAgICAgZG90ID0gZmluZERvdEF0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdDIpO1xuICAgICAgICAgICAgICAgIHgucHVzaChkb3QueCk7XG4gICAgICAgICAgICAgICAgeS5wdXNoKGRvdC55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbWluOiB7eDogbW1pblthcHBseV0oMCwgeCksIHk6IG1taW5bYXBwbHldKDAsIHkpfSxcbiAgICAgICAgICAgICAgICBtYXg6IHt4OiBtbWF4W2FwcGx5XSgwLCB4KSwgeTogbW1heFthcHBseV0oMCwgeSl9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgICAgcGF0aDJjdXJ2ZSA9IFIuX3BhdGgyY3VydmUgPSBjYWNoZXIoZnVuY3Rpb24gKHBhdGgsIHBhdGgyKSB7XG4gICAgICAgICAgICB2YXIgcHRoID0gIXBhdGgyICYmIHBhdGhzKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFwYXRoMiAmJiBwdGguY3VydmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aENsb25lKHB0aC5jdXJ2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcCA9IHBhdGhUb0Fic29sdXRlKHBhdGgpLFxuICAgICAgICAgICAgICAgIHAyID0gcGF0aDIgJiYgcGF0aFRvQWJzb2x1dGUocGF0aDIpLFxuICAgICAgICAgICAgICAgIGF0dHJzID0ge3g6IDAsIHk6IDAsIGJ4OiAwLCBieTogMCwgWDogMCwgWTogMCwgcXg6IG51bGwsIHF5OiBudWxsfSxcbiAgICAgICAgICAgICAgICBhdHRyczIgPSB7eDogMCwgeTogMCwgYng6IDAsIGJ5OiAwLCBYOiAwLCBZOiAwLCBxeDogbnVsbCwgcXk6IG51bGx9LFxuICAgICAgICAgICAgICAgIHByb2Nlc3NQYXRoID0gZnVuY3Rpb24gKHBhdGgsIGQsIHBjb20pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG54LCBueSwgdHEgPSB7VDoxLCBROjF9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXCJDXCIsIGQueCwgZC55LCBkLngsIGQueSwgZC54LCBkLnldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICEocGF0aFswXSBpbiB0cSkgJiYgKGQucXggPSBkLnF5ID0gbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocGF0aFswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLlggPSBwYXRoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuWSA9IHBhdGhbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdW2NvbmNhdF0oYTJjW2FwcGx5XSgwLCBbZC54LCBkLnldW2NvbmNhdF0ocGF0aC5zbGljZSgxKSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJTXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBjb20gPT0gXCJDXCIgfHwgcGNvbSA9PSBcIlNcIikgeyAvLyBJbiBcIlNcIiBjYXNlIHdlIGhhdmUgdG8gdGFrZSBpbnRvIGFjY291bnQsIGlmIHRoZSBwcmV2aW91cyBjb21tYW5kIGlzIEMvUy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnggPSBkLnggKiAyIC0gZC5ieDsgICAgICAgICAgLy8gQW5kIHJlZmxlY3QgdGhlIHByZXZpb3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG55ID0gZC55ICogMiAtIGQuYnk7ICAgICAgICAgIC8vIGNvbW1hbmQncyBjb250cm9sIHBvaW50IHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHBvaW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3Igc29tZSBlbHNlIG9yIG5vdGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnggPSBkLng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG55ID0gZC55O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiLCBueCwgbnldW2NvbmNhdF0ocGF0aC5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwY29tID09IFwiUVwiIHx8IHBjb20gPT0gXCJUXCIpIHsgLy8gSW4gXCJUXCIgY2FzZSB3ZSBoYXZlIHRvIHRha2UgaW50byBhY2NvdW50LCBpZiB0aGUgcHJldmlvdXMgY29tbWFuZCBpcyBRL1QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXggPSBkLnggKiAyIC0gZC5xeDsgICAgICAgIC8vIEFuZCBtYWtlIGEgcmVmbGVjdGlvbiBzaW1pbGFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXkgPSBkLnkgKiAyIC0gZC5xeTsgICAgICAgIC8vIHRvIGNhc2UgXCJTXCIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvciBzb21ldGhpbmcgZWxzZSBvciBub3RoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXggPSBkLng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXkgPSBkLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdW2NvbmNhdF0ocTJjKGQueCwgZC55LCBkLnF4LCBkLnF5LCBwYXRoWzFdLCBwYXRoWzJdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXggPSBwYXRoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXkgPSBwYXRoWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdW2NvbmNhdF0ocTJjKGQueCwgZC55LCBwYXRoWzFdLCBwYXRoWzJdLCBwYXRoWzNdLCBwYXRoWzRdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdW2NvbmNhdF0obDJjKGQueCwgZC55LCBwYXRoWzFdLCBwYXRoWzJdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdW2NvbmNhdF0obDJjKGQueCwgZC55LCBwYXRoWzFdLCBkLnkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJWXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl1bY29uY2F0XShsMmMoZC54LCBkLnksIGQueCwgcGF0aFsxXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXVtjb25jYXRdKGwyYyhkLngsIGQueSwgZC5YLCBkLlkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZpeEFyYyA9IGZ1bmN0aW9uIChwcCwgaSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHBbaV0ubGVuZ3RoID4gNykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHBbaV0uc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwaSA9IHBwW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHBpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBjb21zMVtpXT1cIkFcIjsgLy8gaWYgY3JlYXRlZCBtdWx0aXBsZSBDOnMsIHRoZWlyIG9yaWdpbmFsIHNlZyBpcyBzYXZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAyICYmIChwY29tczJbaV09XCJBXCIpOyAvLyB0aGUgc2FtZSBhcyBhYm92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBwLnNwbGljZShpKyssIDAsIFtcIkNcIl1bY29uY2F0XShwaS5zcGxpY2UoMCwgNikpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBwLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlpID0gbW1heChwLmxlbmd0aCwgcDIgJiYgcDIubGVuZ3RoIHx8IDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmaXhNID0gZnVuY3Rpb24gKHBhdGgxLCBwYXRoMiwgYTEsIGEyLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoMSAmJiBwYXRoMiAmJiBwYXRoMVtpXVswXSA9PSBcIk1cIiAmJiBwYXRoMltpXVswXSAhPSBcIk1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDIuc3BsaWNlKGksIDAsIFtcIk1cIiwgYTIueCwgYTIueV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYTEuYnggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYTEuYnkgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYTEueCA9IHBhdGgxW2ldWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYTEueSA9IHBhdGgxW2ldWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWkgPSBtbWF4KHAubGVuZ3RoLCBwMiAmJiBwMi5sZW5ndGggfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHBjb21zMSA9IFtdLCAvLyBwYXRoIGNvbW1hbmRzIG9mIG9yaWdpbmFsIHBhdGggcFxuICAgICAgICAgICAgICAgIHBjb21zMiA9IFtdLCAvLyBwYXRoIGNvbW1hbmRzIG9mIG9yaWdpbmFsIHBhdGggcDJcbiAgICAgICAgICAgICAgICBwZmlyc3QgPSBcIlwiLCAvLyB0ZW1wb3JhcnkgaG9sZGVyIGZvciBvcmlnaW5hbCBwYXRoIGNvbW1hbmRcbiAgICAgICAgICAgICAgICBwY29tID0gXCJcIjsgLy8gaG9sZGVyIGZvciBwcmV2aW91cyBwYXRoIGNvbW1hbmQgb2Ygb3JpZ2luYWwgcGF0aFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbW1heChwLmxlbmd0aCwgcDIgJiYgcDIubGVuZ3RoIHx8IDApOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHBbaV0gJiYgKHBmaXJzdCA9IHBbaV1bMF0pOyAvLyBzYXZlIGN1cnJlbnQgcGF0aCBjb21tYW5kXG5cbiAgICAgICAgICAgICAgICBpZiAocGZpcnN0ICE9IFwiQ1wiKSAvLyBDIGlzIG5vdCBzYXZlZCB5ZXQsIGJlY2F1c2UgaXQgbWF5IGJlIHJlc3VsdCBvZiBjb252ZXJzaW9uXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwY29tczFbaV0gPSBwZmlyc3Q7IC8vIFNhdmUgY3VycmVudCBwYXRoIGNvbW1hbmRcbiAgICAgICAgICAgICAgICAgICAgaSAmJiAoIHBjb20gPSBwY29tczFbaS0xXSk7IC8vIEdldCBwcmV2aW91cyBwYXRoIGNvbW1hbmQgcGNvbVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwW2ldID0gcHJvY2Vzc1BhdGgocFtpXSwgYXR0cnMsIHBjb20pOyAvLyBQcmV2aW91cyBwYXRoIGNvbW1hbmQgaXMgaW5wdXR0ZWQgdG8gcHJvY2Vzc1BhdGhcblxuICAgICAgICAgICAgICAgIGlmIChwY29tczFbaV0gIT0gXCJBXCIgJiYgcGZpcnN0ID09IFwiQ1wiKSBwY29tczFbaV0gPSBcIkNcIjsgLy8gQSBpcyB0aGUgb25seSBjb21tYW5kXG4gICAgICAgICAgICAgICAgLy8gd2hpY2ggbWF5IHByb2R1Y2UgbXVsdGlwbGUgQzpzXG4gICAgICAgICAgICAgICAgLy8gc28gd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBDIGlzIGFsc28gQyBpbiBvcmlnaW5hbCBwYXRoXG5cbiAgICAgICAgICAgICAgICBmaXhBcmMocCwgaSk7IC8vIGZpeEFyYyBhZGRzIGFsc28gdGhlIHJpZ2h0IGFtb3VudCBvZiBBOnMgdG8gcGNvbXMxXG5cbiAgICAgICAgICAgICAgICBpZiAocDIpIHsgLy8gdGhlIHNhbWUgcHJvY2VkdXJlcyBpcyBkb25lIHRvIHAyXG4gICAgICAgICAgICAgICAgICAgIHAyW2ldICYmIChwZmlyc3QgPSBwMltpXVswXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZmlyc3QgIT0gXCJDXCIpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBjb21zMltpXSA9IHBmaXJzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgJiYgKHBjb20gPSBwY29tczJbaS0xXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcDJbaV0gPSBwcm9jZXNzUGF0aChwMltpXSwgYXR0cnMyLCBwY29tKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocGNvbXMyW2ldIT1cIkFcIiAmJiBwZmlyc3Q9PVwiQ1wiKSBwY29tczJbaV09XCJDXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgZml4QXJjKHAyLCBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZml4TShwLCBwMiwgYXR0cnMsIGF0dHJzMiwgaSk7XG4gICAgICAgICAgICAgICAgZml4TShwMiwgcCwgYXR0cnMyLCBhdHRycywgaSk7XG4gICAgICAgICAgICAgICAgdmFyIHNlZyA9IHBbaV0sXG4gICAgICAgICAgICAgICAgICAgIHNlZzIgPSBwMiAmJiBwMltpXSxcbiAgICAgICAgICAgICAgICAgICAgc2VnbGVuID0gc2VnLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgc2VnMmxlbiA9IHAyICYmIHNlZzIubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGF0dHJzLnggPSBzZWdbc2VnbGVuIC0gMl07XG4gICAgICAgICAgICAgICAgYXR0cnMueSA9IHNlZ1tzZWdsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICBhdHRycy5ieCA9IHRvRmxvYXQoc2VnW3NlZ2xlbiAtIDRdKSB8fCBhdHRycy54O1xuICAgICAgICAgICAgICAgIGF0dHJzLmJ5ID0gdG9GbG9hdChzZWdbc2VnbGVuIC0gM10pIHx8IGF0dHJzLnk7XG4gICAgICAgICAgICAgICAgYXR0cnMyLmJ4ID0gcDIgJiYgKHRvRmxvYXQoc2VnMltzZWcybGVuIC0gNF0pIHx8IGF0dHJzMi54KTtcbiAgICAgICAgICAgICAgICBhdHRyczIuYnkgPSBwMiAmJiAodG9GbG9hdChzZWcyW3NlZzJsZW4gLSAzXSkgfHwgYXR0cnMyLnkpO1xuICAgICAgICAgICAgICAgIGF0dHJzMi54ID0gcDIgJiYgc2VnMltzZWcybGVuIC0gMl07XG4gICAgICAgICAgICAgICAgYXR0cnMyLnkgPSBwMiAmJiBzZWcyW3NlZzJsZW4gLSAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcDIpIHtcbiAgICAgICAgICAgICAgICBwdGguY3VydmUgPSBwYXRoQ2xvbmUocCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcDIgPyBbcCwgcDJdIDogcDtcbiAgICAgICAgfSwgbnVsbCwgcGF0aENsb25lKSxcbiAgICAgICAgcGFyc2VEb3RzID0gUi5fcGFyc2VEb3RzID0gY2FjaGVyKGZ1bmN0aW9uIChncmFkaWVudCkge1xuICAgICAgICAgICAgdmFyIGRvdHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGdyYWRpZW50Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZG90ID0ge30sXG4gICAgICAgICAgICAgICAgICAgIHBhciA9IGdyYWRpZW50W2ldLm1hdGNoKC9eKFteOl0qKTo/KFtcXGRcXC5dKikvKTtcbiAgICAgICAgICAgICAgICBkb3QuY29sb3IgPSBSLmdldFJHQihwYXJbMV0pO1xuICAgICAgICAgICAgICAgIGlmIChkb3QuY29sb3IuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvdC5jb2xvciA9IGRvdC5jb2xvci5oZXg7XG4gICAgICAgICAgICAgICAgcGFyWzJdICYmIChkb3Qub2Zmc2V0ID0gcGFyWzJdICsgXCIlXCIpO1xuICAgICAgICAgICAgICAgIGRvdHMucHVzaChkb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMSwgaWkgPSBkb3RzLmxlbmd0aCAtIDE7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkb3RzW2ldLm9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSB0b0Zsb2F0KGRvdHNbaSAtIDFdLm9mZnNldCB8fCAwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBpICsgMTsgaiA8IGlpOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb3RzW2pdLm9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IGRvdHNbal0ub2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSAxMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBqID0gaWk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZW5kID0gdG9GbG9hdChlbmQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZCA9IChlbmQgLSBzdGFydCkgLyAoaiAtIGkgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0ICs9IGQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb3RzW2ldLm9mZnNldCA9IHN0YXJ0ICsgXCIlXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG90cztcbiAgICAgICAgfSksXG4gICAgICAgIHRlYXIgPSBSLl90ZWFyID0gZnVuY3Rpb24gKGVsLCBwYXBlcikge1xuICAgICAgICAgICAgZWwgPT0gcGFwZXIudG9wICYmIChwYXBlci50b3AgPSBlbC5wcmV2KTtcbiAgICAgICAgICAgIGVsID09IHBhcGVyLmJvdHRvbSAmJiAocGFwZXIuYm90dG9tID0gZWwubmV4dCk7XG4gICAgICAgICAgICBlbC5uZXh0ICYmIChlbC5uZXh0LnByZXYgPSBlbC5wcmV2KTtcbiAgICAgICAgICAgIGVsLnByZXYgJiYgKGVsLnByZXYubmV4dCA9IGVsLm5leHQpO1xuICAgICAgICB9LFxuICAgICAgICB0b2Zyb250ID0gUi5fdG9mcm9udCA9IGZ1bmN0aW9uIChlbCwgcGFwZXIpIHtcbiAgICAgICAgICAgIGlmIChwYXBlci50b3AgPT09IGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGVhcihlbCwgcGFwZXIpO1xuICAgICAgICAgICAgZWwubmV4dCA9IG51bGw7XG4gICAgICAgICAgICBlbC5wcmV2ID0gcGFwZXIudG9wO1xuICAgICAgICAgICAgcGFwZXIudG9wLm5leHQgPSBlbDtcbiAgICAgICAgICAgIHBhcGVyLnRvcCA9IGVsO1xuICAgICAgICB9LFxuICAgICAgICB0b2JhY2sgPSBSLl90b2JhY2sgPSBmdW5jdGlvbiAoZWwsIHBhcGVyKSB7XG4gICAgICAgICAgICBpZiAocGFwZXIuYm90dG9tID09PSBlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlYXIoZWwsIHBhcGVyKTtcbiAgICAgICAgICAgIGVsLm5leHQgPSBwYXBlci5ib3R0b207XG4gICAgICAgICAgICBlbC5wcmV2ID0gbnVsbDtcbiAgICAgICAgICAgIHBhcGVyLmJvdHRvbS5wcmV2ID0gZWw7XG4gICAgICAgICAgICBwYXBlci5ib3R0b20gPSBlbDtcbiAgICAgICAgfSxcbiAgICAgICAgaW5zZXJ0YWZ0ZXIgPSBSLl9pbnNlcnRhZnRlciA9IGZ1bmN0aW9uIChlbCwgZWwyLCBwYXBlcikge1xuICAgICAgICAgICAgdGVhcihlbCwgcGFwZXIpO1xuICAgICAgICAgICAgZWwyID09IHBhcGVyLnRvcCAmJiAocGFwZXIudG9wID0gZWwpO1xuICAgICAgICAgICAgZWwyLm5leHQgJiYgKGVsMi5uZXh0LnByZXYgPSBlbCk7XG4gICAgICAgICAgICBlbC5uZXh0ID0gZWwyLm5leHQ7XG4gICAgICAgICAgICBlbC5wcmV2ID0gZWwyO1xuICAgICAgICAgICAgZWwyLm5leHQgPSBlbDtcbiAgICAgICAgfSxcbiAgICAgICAgaW5zZXJ0YmVmb3JlID0gUi5faW5zZXJ0YmVmb3JlID0gZnVuY3Rpb24gKGVsLCBlbDIsIHBhcGVyKSB7XG4gICAgICAgICAgICB0ZWFyKGVsLCBwYXBlcik7XG4gICAgICAgICAgICBlbDIgPT0gcGFwZXIuYm90dG9tICYmIChwYXBlci5ib3R0b20gPSBlbCk7XG4gICAgICAgICAgICBlbDIucHJldiAmJiAoZWwyLnByZXYubmV4dCA9IGVsKTtcbiAgICAgICAgICAgIGVsLnByZXYgPSBlbDIucHJldjtcbiAgICAgICAgICAgIGVsMi5wcmV2ID0gZWw7XG4gICAgICAgICAgICBlbC5uZXh0ID0gZWwyO1xuICAgICAgICB9LFxuICAgICAgICAvKlxcXG4gICAgICAgICAqIFJhcGhhZWwudG9NYXRyaXhcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIG1hdHJpeCBvZiB0cmFuc2Zvcm1hdGlvbnMgYXBwbGllZCB0byBhIGdpdmVuIHBhdGhcbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgICAgICAtIHRyYW5zZm9ybSAoc3RyaW5nfGFycmF5KSB0cmFuc2Zvcm1hdGlvbiBzdHJpbmdcbiAgICAgICAgID0gKG9iamVjdCkgQE1hdHJpeFxuICAgICAgICBcXCovXG4gICAgICAgIHRvTWF0cml4ID0gUi50b01hdHJpeCA9IGZ1bmN0aW9uIChwYXRoLCB0cmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHZhciBiYiA9IHBhdGhEaW1lbnNpb25zKHBhdGgpLFxuICAgICAgICAgICAgICAgIGVsID0ge1xuICAgICAgICAgICAgICAgICAgICBfOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IEVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0QkJveDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGV4dHJhY3RUcmFuc2Zvcm0oZWwsIHRyYW5zZm9ybSk7XG4gICAgICAgICAgICByZXR1cm4gZWwubWF0cml4O1xuICAgICAgICB9LFxuICAgICAgICAvKlxcXG4gICAgICAgICAqIFJhcGhhZWwudHJhbnNmb3JtUGF0aFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgcGF0aCB0cmFuc2Zvcm1lZCBieSBhIGdpdmVuIHRyYW5zZm9ybWF0aW9uXG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAgICAgLSB0cmFuc2Zvcm0gKHN0cmluZ3xhcnJheSkgdHJhbnNmb3JtYXRpb24gc3RyaW5nXG4gICAgICAgICA9IChzdHJpbmcpIHBhdGhcbiAgICAgICAgXFwqL1xuICAgICAgICB0cmFuc2Zvcm1QYXRoID0gUi50cmFuc2Zvcm1QYXRoID0gZnVuY3Rpb24gKHBhdGgsIHRyYW5zZm9ybSkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcFBhdGgocGF0aCwgdG9NYXRyaXgocGF0aCwgdHJhbnNmb3JtKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGV4dHJhY3RUcmFuc2Zvcm0gPSBSLl9leHRyYWN0VHJhbnNmb3JtID0gZnVuY3Rpb24gKGVsLCB0c3RyKSB7XG4gICAgICAgICAgICBpZiAodHN0ciA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLl8udHJhbnNmb3JtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHN0ciA9IFN0cih0c3RyKS5yZXBsYWNlKC9cXC57M318XFx1MjAyNi9nLCBlbC5fLnRyYW5zZm9ybSB8fCBFKTtcbiAgICAgICAgICAgIHZhciB0ZGF0YSA9IFIucGFyc2VUcmFuc2Zvcm1TdHJpbmcodHN0ciksXG4gICAgICAgICAgICAgICAgZGVnID0gMCxcbiAgICAgICAgICAgICAgICBkeCA9IDAsXG4gICAgICAgICAgICAgICAgZHkgPSAwLFxuICAgICAgICAgICAgICAgIHN4ID0gMSxcbiAgICAgICAgICAgICAgICBzeSA9IDEsXG4gICAgICAgICAgICAgICAgXyA9IGVsLl8sXG4gICAgICAgICAgICAgICAgbSA9IG5ldyBNYXRyaXg7XG4gICAgICAgICAgICBfLnRyYW5zZm9ybSA9IHRkYXRhIHx8IFtdO1xuICAgICAgICAgICAgaWYgKHRkYXRhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGRhdGEubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IHRkYXRhW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGxlbiA9IHQubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZCA9IFN0cih0WzBdKS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWJzb2x1dGUgPSB0WzBdICE9IGNvbW1hbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnZlciA9IGFic29sdXRlID8gbS5pbnZlcnQoKSA6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB4MSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkxLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDIsXG4gICAgICAgICAgICAgICAgICAgICAgICB5MixcbiAgICAgICAgICAgICAgICAgICAgICAgIGJiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWFuZCA9PSBcInRcIiAmJiB0bGVuID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgxID0gaW52ZXIueCgwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MSA9IGludmVyLnkoMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBpbnZlci54KHRbMV0sIHRbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gaW52ZXIueSh0WzFdLCB0WzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnRyYW5zbGF0ZSh4MiAtIHgxLCB5MiAtIHkxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbS50cmFuc2xhdGUodFsxXSwgdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PSBcInJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRsZW4gPT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJiID0gYmIgfHwgZWwuZ2V0QkJveCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnJvdGF0ZSh0WzFdLCBiYi54ICsgYmIud2lkdGggLyAyLCBiYi55ICsgYmIuaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVnICs9IHRbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRsZW4gPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGludmVyLngodFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gaW52ZXIueSh0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5yb3RhdGUodFsxXSwgeDIsIHkyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnJvdGF0ZSh0WzFdLCB0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVnICs9IHRbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PSBcInNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRsZW4gPT0gMiB8fCB0bGVuID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYiA9IGJiIHx8IGVsLmdldEJCb3goMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0W3RsZW4gLSAxXSwgYmIueCArIGJiLndpZHRoIC8gMiwgYmIueSArIGJiLmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN4ICo9IHRbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3kgKj0gdFt0bGVuIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRsZW4gPT0gNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGludmVyLngodFszXSwgdFs0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gaW52ZXIueSh0WzNdLCB0WzRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0WzJdLCB4MiwgeTIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFsyXSwgdFszXSwgdFs0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN4ICo9IHRbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3kgKj0gdFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tYW5kID09IFwibVwiICYmIHRsZW4gPT0gNykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbS5hZGQodFsxXSwgdFsyXSwgdFszXSwgdFs0XSwgdFs1XSwgdFs2XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXy5kaXJ0eVQgPSAxO1xuICAgICAgICAgICAgICAgICAgICBlbC5tYXRyaXggPSBtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLypcXFxuICAgICAgICAgICAgICogRWxlbWVudC5tYXRyaXhcbiAgICAgICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICAgICAqKlxuICAgICAgICAgICAgICogS2VlcHMgQE1hdHJpeCBvYmplY3QsIHdoaWNoIHJlcHJlc2VudHMgZWxlbWVudCB0cmFuc2Zvcm1hdGlvblxuICAgICAgICAgICAgXFwqL1xuICAgICAgICAgICAgZWwubWF0cml4ID0gbTtcblxuICAgICAgICAgICAgXy5zeCA9IHN4O1xuICAgICAgICAgICAgXy5zeSA9IHN5O1xuICAgICAgICAgICAgXy5kZWcgPSBkZWc7XG4gICAgICAgICAgICBfLmR4ID0gZHggPSBtLmU7XG4gICAgICAgICAgICBfLmR5ID0gZHkgPSBtLmY7XG5cbiAgICAgICAgICAgIGlmIChzeCA9PSAxICYmIHN5ID09IDEgJiYgIWRlZyAmJiBfLmJib3gpIHtcbiAgICAgICAgICAgICAgICBfLmJib3gueCArPSArZHg7XG4gICAgICAgICAgICAgICAgXy5iYm94LnkgKz0gK2R5O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBfLmRpcnR5VCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGdldEVtcHR5ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBsID0gaXRlbVswXTtcbiAgICAgICAgICAgIHN3aXRjaCAobC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcInRcIjogcmV0dXJuIFtsLCAwLCAwXTtcbiAgICAgICAgICAgICAgICBjYXNlIFwibVwiOiByZXR1cm4gW2wsIDEsIDAsIDAsIDEsIDAsIDBdO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJyXCI6IGlmIChpdGVtLmxlbmd0aCA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMCwgaXRlbVsyXSwgaXRlbVszXV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAwXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBcInNcIjogaWYgKGl0ZW0ubGVuZ3RoID09IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAxLCAxLCBpdGVtWzNdLCBpdGVtWzRdXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0ubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAxLCAxXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXF1YWxpc2VUcmFuc2Zvcm0gPSBSLl9lcXVhbGlzZVRyYW5zZm9ybSA9IGZ1bmN0aW9uICh0MSwgdDIpIHtcbiAgICAgICAgICAgIHQyID0gU3RyKHQyKS5yZXBsYWNlKC9cXC57M318XFx1MjAyNi9nLCB0MSk7XG4gICAgICAgICAgICB0MSA9IFIucGFyc2VUcmFuc2Zvcm1TdHJpbmcodDEpIHx8IFtdO1xuICAgICAgICAgICAgdDIgPSBSLnBhcnNlVHJhbnNmb3JtU3RyaW5nKHQyKSB8fCBbXTtcbiAgICAgICAgICAgIHZhciBtYXhsZW5ndGggPSBtbWF4KHQxLmxlbmd0aCwgdDIubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICBmcm9tID0gW10sXG4gICAgICAgICAgICAgICAgdG8gPSBbXSxcbiAgICAgICAgICAgICAgICBpID0gMCwgaiwgamosXG4gICAgICAgICAgICAgICAgdHQxLCB0dDI7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IG1heGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdHQxID0gdDFbaV0gfHwgZ2V0RW1wdHkodDJbaV0pO1xuICAgICAgICAgICAgICAgIHR0MiA9IHQyW2ldIHx8IGdldEVtcHR5KHR0MSk7XG4gICAgICAgICAgICAgICAgaWYgKCh0dDFbMF0gIT0gdHQyWzBdKSB8fFxuICAgICAgICAgICAgICAgICAgICAodHQxWzBdLnRvTG93ZXJDYXNlKCkgPT0gXCJyXCIgJiYgKHR0MVsyXSAhPSB0dDJbMl0gfHwgdHQxWzNdICE9IHR0MlszXSkpIHx8XG4gICAgICAgICAgICAgICAgICAgICh0dDFbMF0udG9Mb3dlckNhc2UoKSA9PSBcInNcIiAmJiAodHQxWzNdICE9IHR0MlszXSB8fCB0dDFbNF0gIT0gdHQyWzRdKSlcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnJvbVtpXSA9IFtdO1xuICAgICAgICAgICAgICAgIHRvW2ldID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBtbWF4KHR0MS5sZW5ndGgsIHR0Mi5sZW5ndGgpOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBqIGluIHR0MSAmJiAoZnJvbVtpXVtqXSA9IHR0MVtqXSk7XG4gICAgICAgICAgICAgICAgICAgIGogaW4gdHQyICYmICh0b1tpXVtqXSA9IHR0MltqXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBmcm9tLFxuICAgICAgICAgICAgICAgIHRvOiB0b1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICBSLl9nZXRDb250YWluZXIgPSBmdW5jdGlvbiAoeCwgeSwgdywgaCkge1xuICAgICAgICB2YXIgY29udGFpbmVyO1xuICAgICAgICBjb250YWluZXIgPSBoID09IG51bGwgJiYgIVIuaXMoeCwgXCJvYmplY3RcIikgPyBnLmRvYy5nZXRFbGVtZW50QnlJZCh4KSA6IHg7XG4gICAgICAgIGlmIChjb250YWluZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250YWluZXIudGFnTmFtZSkge1xuICAgICAgICAgICAgaWYgKHkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogY29udGFpbmVyLnN0eWxlLnBpeGVsV2lkdGggfHwgY29udGFpbmVyLm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGNvbnRhaW5lci5zdHlsZS5waXhlbEhlaWdodCB8fCBjb250YWluZXIub2Zmc2V0SGVpZ2h0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB5LFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb250YWluZXI6IDEsXG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHdpZHRoOiB3LFxuICAgICAgICAgICAgaGVpZ2h0OiBoXG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5wYXRoVG9SZWxhdGl2ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBwYXRoIHRvIHJlbGF0aXZlIGZvcm1cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcGF0aFN0cmluZyAoc3RyaW5nfGFycmF5KSBwYXRoIHN0cmluZyBvciBhcnJheSBvZiBzZWdtZW50c1xuICAgICA9IChhcnJheSkgYXJyYXkgb2Ygc2VnbWVudHMuXG4gICAgXFwqL1xuICAgIFIucGF0aFRvUmVsYXRpdmUgPSBwYXRoVG9SZWxhdGl2ZTtcbiAgICBSLl9lbmdpbmUgPSB7fTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5wYXRoMmN1cnZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIHBhdGggdG8gYSBuZXcgcGF0aCB3aGVyZSBhbGwgc2VnbWVudHMgYXJlIGN1YmljIGJlemllciBjdXJ2ZXMuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHBhdGhTdHJpbmcgKHN0cmluZ3xhcnJheSkgcGF0aCBzdHJpbmcgb3IgYXJyYXkgb2Ygc2VnbWVudHNcbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIHNlZ21lbnRzLlxuICAgIFxcKi9cbiAgICBSLnBhdGgyY3VydmUgPSBwYXRoMmN1cnZlO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLm1hdHJpeFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIG1hdHJpeCBiYXNlZCBvbiBnaXZlbiBwYXJhbWV0ZXJzLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBhIChudW1iZXIpXG4gICAgIC0gYiAobnVtYmVyKVxuICAgICAtIGMgKG51bWJlcilcbiAgICAgLSBkIChudW1iZXIpXG4gICAgIC0gZSAobnVtYmVyKVxuICAgICAtIGYgKG51bWJlcilcbiAgICAgPSAob2JqZWN0KSBATWF0cml4XG4gICAgXFwqL1xuICAgIFIubWF0cml4ID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgoYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBNYXRyaXgoYSwgYiwgYywgZCwgZSwgZikge1xuICAgICAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmEgPSArYTtcbiAgICAgICAgICAgIHRoaXMuYiA9ICtiO1xuICAgICAgICAgICAgdGhpcy5jID0gK2M7XG4gICAgICAgICAgICB0aGlzLmQgPSArZDtcbiAgICAgICAgICAgIHRoaXMuZSA9ICtlO1xuICAgICAgICAgICAgdGhpcy5mID0gK2Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmEgPSAxO1xuICAgICAgICAgICAgdGhpcy5iID0gMDtcbiAgICAgICAgICAgIHRoaXMuYyA9IDA7XG4gICAgICAgICAgICB0aGlzLmQgPSAxO1xuICAgICAgICAgICAgdGhpcy5lID0gMDtcbiAgICAgICAgICAgIHRoaXMuZiA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgKGZ1bmN0aW9uIChtYXRyaXhwcm90bykge1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5hZGRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIEFkZHMgZ2l2ZW4gbWF0cml4IHRvIGV4aXN0aW5nIG9uZS5cbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSBhIChudW1iZXIpXG4gICAgICAgICAtIGIgKG51bWJlcilcbiAgICAgICAgIC0gYyAobnVtYmVyKVxuICAgICAgICAgLSBkIChudW1iZXIpXG4gICAgICAgICAtIGUgKG51bWJlcilcbiAgICAgICAgIC0gZiAobnVtYmVyKVxuICAgICAgICAgb3JcbiAgICAgICAgIC0gbWF0cml4IChvYmplY3QpIEBNYXRyaXhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5hZGQgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCwgZSwgZikge1xuICAgICAgICAgICAgdmFyIG91dCA9IFtbXSwgW10sIFtdXSxcbiAgICAgICAgICAgICAgICBtID0gW1t0aGlzLmEsIHRoaXMuYywgdGhpcy5lXSwgW3RoaXMuYiwgdGhpcy5kLCB0aGlzLmZdLCBbMCwgMCwgMV1dLFxuICAgICAgICAgICAgICAgIG1hdHJpeCA9IFtbYSwgYywgZV0sIFtiLCBkLCBmXSwgWzAsIDAsIDFdXSxcbiAgICAgICAgICAgICAgICB4LCB5LCB6LCByZXM7XG5cbiAgICAgICAgICAgIGlmIChhICYmIGEgaW5zdGFuY2VvZiBNYXRyaXgpIHtcbiAgICAgICAgICAgICAgICBtYXRyaXggPSBbW2EuYSwgYS5jLCBhLmVdLCBbYS5iLCBhLmQsIGEuZl0sIFswLCAwLCAxXV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoeCA9IDA7IHggPCAzOyB4KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKHkgPSAwOyB5IDwgMzsgeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoeiA9IDA7IHogPCAzOyB6KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSBtW3hdW3pdICogbWF0cml4W3pdW3ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG91dFt4XVt5XSA9IHJlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmEgPSBvdXRbMF1bMF07XG4gICAgICAgICAgICB0aGlzLmIgPSBvdXRbMV1bMF07XG4gICAgICAgICAgICB0aGlzLmMgPSBvdXRbMF1bMV07XG4gICAgICAgICAgICB0aGlzLmQgPSBvdXRbMV1bMV07XG4gICAgICAgICAgICB0aGlzLmUgPSBvdXRbMF1bMl07XG4gICAgICAgICAgICB0aGlzLmYgPSBvdXRbMV1bMl07XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LmludmVydFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBpbnZlcnRlZCB2ZXJzaW9uIG9mIHRoZSBtYXRyaXhcbiAgICAgICAgID0gKG9iamVjdCkgQE1hdHJpeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLmludmVydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgeCA9IG1lLmEgKiBtZS5kIC0gbWUuYiAqIG1lLmM7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChtZS5kIC8geCwgLW1lLmIgLyB4LCAtbWUuYyAvIHgsIG1lLmEgLyB4LCAobWUuYyAqIG1lLmYgLSBtZS5kICogbWUuZSkgLyB4LCAobWUuYiAqIG1lLmUgLSBtZS5hICogbWUuZikgLyB4KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguY2xvbmVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgY29weSBvZiB0aGUgbWF0cml4XG4gICAgICAgICA9IChvYmplY3QpIEBNYXRyaXhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWF0cml4KHRoaXMuYSwgdGhpcy5iLCB0aGlzLmMsIHRoaXMuZCwgdGhpcy5lLCB0aGlzLmYpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC50cmFuc2xhdGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFRyYW5zbGF0ZSB0aGUgbWF0cml4XG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0geCAobnVtYmVyKVxuICAgICAgICAgLSB5IChudW1iZXIpXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8udHJhbnNsYXRlID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkKDEsIDAsIDAsIDEsIHgsIHkpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5zY2FsZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogU2NhbGVzIHRoZSBtYXRyaXhcbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSB4IChudW1iZXIpXG4gICAgICAgICAtIHkgKG51bWJlcikgI29wdGlvbmFsXG4gICAgICAgICAtIGN4IChudW1iZXIpICNvcHRpb25hbFxuICAgICAgICAgLSBjeSAobnVtYmVyKSAjb3B0aW9uYWxcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5zY2FsZSA9IGZ1bmN0aW9uICh4LCB5LCBjeCwgY3kpIHtcbiAgICAgICAgICAgIHkgPT0gbnVsbCAmJiAoeSA9IHgpO1xuICAgICAgICAgICAgKGN4IHx8IGN5KSAmJiB0aGlzLmFkZCgxLCAwLCAwLCAxLCBjeCwgY3kpO1xuICAgICAgICAgICAgdGhpcy5hZGQoeCwgMCwgMCwgeSwgMCwgMCk7XG4gICAgICAgICAgICAoY3ggfHwgY3kpICYmIHRoaXMuYWRkKDEsIDAsIDAsIDEsIC1jeCwgLWN5KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgucm90YXRlXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSb3RhdGVzIHRoZSBtYXRyaXhcbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSBhIChudW1iZXIpXG4gICAgICAgICAtIHggKG51bWJlcilcbiAgICAgICAgIC0geSAobnVtYmVyKVxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnJvdGF0ZSA9IGZ1bmN0aW9uIChhLCB4LCB5KSB7XG4gICAgICAgICAgICBhID0gUi5yYWQoYSk7XG4gICAgICAgICAgICB4ID0geCB8fCAwO1xuICAgICAgICAgICAgeSA9IHkgfHwgMDtcbiAgICAgICAgICAgIHZhciBjb3MgPSArbWF0aC5jb3MoYSkudG9GaXhlZCg5KSxcbiAgICAgICAgICAgICAgICBzaW4gPSArbWF0aC5zaW4oYSkudG9GaXhlZCg5KTtcbiAgICAgICAgICAgIHRoaXMuYWRkKGNvcywgc2luLCAtc2luLCBjb3MsIHgsIHkpO1xuICAgICAgICAgICAgdGhpcy5hZGQoMSwgMCwgMCwgMSwgLXgsIC15KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgueFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJuIHggY29vcmRpbmF0ZSBmb3IgZ2l2ZW4gcG9pbnQgYWZ0ZXIgdHJhbnNmb3JtYXRpb24gZGVzY3JpYmVkIGJ5IHRoZSBtYXRyaXguIFNlZSBhbHNvIEBNYXRyaXgueVxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIHggKG51bWJlcilcbiAgICAgICAgIC0geSAobnVtYmVyKVxuICAgICAgICAgPSAobnVtYmVyKSB4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8ueCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICByZXR1cm4geCAqIHRoaXMuYSArIHkgKiB0aGlzLmMgKyB0aGlzLmU7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnlcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybiB5IGNvb3JkaW5hdGUgZm9yIGdpdmVuIHBvaW50IGFmdGVyIHRyYW5zZm9ybWF0aW9uIGRlc2NyaWJlZCBieSB0aGUgbWF0cml4LiBTZWUgYWxzbyBATWF0cml4LnhcbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSB4IChudW1iZXIpXG4gICAgICAgICAtIHkgKG51bWJlcilcbiAgICAgICAgID0gKG51bWJlcikgeVxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnkgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgcmV0dXJuIHggKiB0aGlzLmIgKyB5ICogdGhpcy5kICsgdGhpcy5mO1xuICAgICAgICB9O1xuICAgICAgICBtYXRyaXhwcm90by5nZXQgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzW1N0ci5mcm9tQ2hhckNvZGUoOTcgKyBpKV0udG9GaXhlZCg0KTtcbiAgICAgICAgfTtcbiAgICAgICAgbWF0cml4cHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gUi5zdmcgP1xuICAgICAgICAgICAgICAgIFwibWF0cml4KFwiICsgW3RoaXMuZ2V0KDApLCB0aGlzLmdldCgxKSwgdGhpcy5nZXQoMiksIHRoaXMuZ2V0KDMpLCB0aGlzLmdldCg0KSwgdGhpcy5nZXQoNSldLmpvaW4oKSArIFwiKVwiIDpcbiAgICAgICAgICAgICAgICBbdGhpcy5nZXQoMCksIHRoaXMuZ2V0KDIpLCB0aGlzLmdldCgxKSwgdGhpcy5nZXQoMyksIDAsIDBdLmpvaW4oKTtcbiAgICAgICAgfTtcbiAgICAgICAgbWF0cml4cHJvdG8udG9GaWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuTWF0cml4KE0xMT1cIiArIHRoaXMuZ2V0KDApICtcbiAgICAgICAgICAgICAgICBcIiwgTTEyPVwiICsgdGhpcy5nZXQoMikgKyBcIiwgTTIxPVwiICsgdGhpcy5nZXQoMSkgKyBcIiwgTTIyPVwiICsgdGhpcy5nZXQoMykgK1xuICAgICAgICAgICAgICAgIFwiLCBEeD1cIiArIHRoaXMuZ2V0KDQpICsgXCIsIER5PVwiICsgdGhpcy5nZXQoNSkgKyBcIiwgc2l6aW5nbWV0aG9kPSdhdXRvIGV4cGFuZCcpXCI7XG4gICAgICAgIH07XG4gICAgICAgIG1hdHJpeHByb3RvLm9mZnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy5lLnRvRml4ZWQoNCksIHRoaXMuZi50b0ZpeGVkKDQpXTtcbiAgICAgICAgfTtcbiAgICAgICAgZnVuY3Rpb24gbm9ybShhKSB7XG4gICAgICAgICAgICByZXR1cm4gYVswXSAqIGFbMF0gKyBhWzFdICogYVsxXTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUoYSkge1xuICAgICAgICAgICAgdmFyIG1hZyA9IG1hdGguc3FydChub3JtKGEpKTtcbiAgICAgICAgICAgIGFbMF0gJiYgKGFbMF0gLz0gbWFnKTtcbiAgICAgICAgICAgIGFbMV0gJiYgKGFbMV0gLz0gbWFnKTtcbiAgICAgICAgfVxuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5zcGxpdFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogU3BsaXRzIG1hdHJpeCBpbnRvIHByaW1pdGl2ZSB0cmFuc2Zvcm1hdGlvbnNcbiAgICAgICAgID0gKG9iamVjdCkgaW4gZm9ybWF0OlxuICAgICAgICAgbyBkeCAobnVtYmVyKSB0cmFuc2xhdGlvbiBieSB4XG4gICAgICAgICBvIGR5IChudW1iZXIpIHRyYW5zbGF0aW9uIGJ5IHlcbiAgICAgICAgIG8gc2NhbGV4IChudW1iZXIpIHNjYWxlIGJ5IHhcbiAgICAgICAgIG8gc2NhbGV5IChudW1iZXIpIHNjYWxlIGJ5IHlcbiAgICAgICAgIG8gc2hlYXIgKG51bWJlcikgc2hlYXJcbiAgICAgICAgIG8gcm90YXRlIChudW1iZXIpIHJvdGF0aW9uIGluIGRlZ1xuICAgICAgICAgbyBpc1NpbXBsZSAoYm9vbGVhbikgY291bGQgaXQgYmUgcmVwcmVzZW50ZWQgdmlhIHNpbXBsZSB0cmFuc2Zvcm1hdGlvbnNcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5zcGxpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvdXQgPSB7fTtcbiAgICAgICAgICAgIC8vIHRyYW5zbGF0aW9uXG4gICAgICAgICAgICBvdXQuZHggPSB0aGlzLmU7XG4gICAgICAgICAgICBvdXQuZHkgPSB0aGlzLmY7XG5cbiAgICAgICAgICAgIC8vIHNjYWxlIGFuZCBzaGVhclxuICAgICAgICAgICAgdmFyIHJvdyA9IFtbdGhpcy5hLCB0aGlzLmNdLCBbdGhpcy5iLCB0aGlzLmRdXTtcbiAgICAgICAgICAgIG91dC5zY2FsZXggPSBtYXRoLnNxcnQobm9ybShyb3dbMF0pKTtcbiAgICAgICAgICAgIG5vcm1hbGl6ZShyb3dbMF0pO1xuXG4gICAgICAgICAgICBvdXQuc2hlYXIgPSByb3dbMF1bMF0gKiByb3dbMV1bMF0gKyByb3dbMF1bMV0gKiByb3dbMV1bMV07XG4gICAgICAgICAgICByb3dbMV0gPSBbcm93WzFdWzBdIC0gcm93WzBdWzBdICogb3V0LnNoZWFyLCByb3dbMV1bMV0gLSByb3dbMF1bMV0gKiBvdXQuc2hlYXJdO1xuXG4gICAgICAgICAgICBvdXQuc2NhbGV5ID0gbWF0aC5zcXJ0KG5vcm0ocm93WzFdKSk7XG4gICAgICAgICAgICBub3JtYWxpemUocm93WzFdKTtcbiAgICAgICAgICAgIG91dC5zaGVhciAvPSBvdXQuc2NhbGV5O1xuXG4gICAgICAgICAgICAvLyByb3RhdGlvblxuICAgICAgICAgICAgdmFyIHNpbiA9IC1yb3dbMF1bMV0sXG4gICAgICAgICAgICAgICAgY29zID0gcm93WzFdWzFdO1xuICAgICAgICAgICAgaWYgKGNvcyA8IDApIHtcbiAgICAgICAgICAgICAgICBvdXQucm90YXRlID0gUi5kZWcobWF0aC5hY29zKGNvcykpO1xuICAgICAgICAgICAgICAgIGlmIChzaW4gPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dC5yb3RhdGUgPSAzNjAgLSBvdXQucm90YXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0LnJvdGF0ZSA9IFIuZGVnKG1hdGguYXNpbihzaW4pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0LmlzU2ltcGxlID0gIStvdXQuc2hlYXIudG9GaXhlZCg5KSAmJiAob3V0LnNjYWxleC50b0ZpeGVkKDkpID09IG91dC5zY2FsZXkudG9GaXhlZCg5KSB8fCAhb3V0LnJvdGF0ZSk7XG4gICAgICAgICAgICBvdXQuaXNTdXBlclNpbXBsZSA9ICErb3V0LnNoZWFyLnRvRml4ZWQoOSkgJiYgb3V0LnNjYWxleC50b0ZpeGVkKDkpID09IG91dC5zY2FsZXkudG9GaXhlZCg5KSAmJiAhb3V0LnJvdGF0ZTtcbiAgICAgICAgICAgIG91dC5ub1JvdGF0aW9uID0gIStvdXQuc2hlYXIudG9GaXhlZCg5KSAmJiAhb3V0LnJvdGF0ZTtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnRvVHJhbnNmb3JtU3RyaW5nXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm4gdHJhbnNmb3JtIHN0cmluZyB0aGF0IHJlcHJlc2VudHMgZ2l2ZW4gbWF0cml4XG4gICAgICAgICA9IChzdHJpbmcpIHRyYW5zZm9ybSBzdHJpbmdcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by50b1RyYW5zZm9ybVN0cmluZyA9IGZ1bmN0aW9uIChzaG9ydGVyKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHNob3J0ZXIgfHwgdGhpc1tzcGxpdF0oKTtcbiAgICAgICAgICAgIGlmIChzLmlzU2ltcGxlKSB7XG4gICAgICAgICAgICAgICAgcy5zY2FsZXggPSArcy5zY2FsZXgudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICBzLnNjYWxleSA9ICtzLnNjYWxleS50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgIHMucm90YXRlID0gK3Mucm90YXRlLnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICAocy5keCB8fCBzLmR5ID8gXCJ0XCIgKyBbcy5keCwgcy5keV0gOiBFKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAocy5zY2FsZXggIT0gMSB8fCBzLnNjYWxleSAhPSAxID8gXCJzXCIgKyBbcy5zY2FsZXgsIHMuc2NhbGV5LCAwLCAwXSA6IEUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIChzLnJvdGF0ZSA/IFwiclwiICsgW3Mucm90YXRlLCAwLCAwXSA6IEUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJtXCIgKyBbdGhpcy5nZXQoMCksIHRoaXMuZ2V0KDEpLCB0aGlzLmdldCgyKSwgdGhpcy5nZXQoMyksIHRoaXMuZ2V0KDQpLCB0aGlzLmdldCg1KV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSkoTWF0cml4LnByb3RvdHlwZSk7XG5cbiAgICAvLyBXZWJLaXQgcmVuZGVyaW5nIGJ1ZyB3b3JrYXJvdW5kIG1ldGhvZFxuICAgIHZhciB2ZXJzaW9uID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvVmVyc2lvblxcLyguKj8pXFxzLykgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQ2hyb21lXFwvKFxcZCspLyk7XG4gICAgaWYgKChuYXZpZ2F0b3IudmVuZG9yID09IFwiQXBwbGUgQ29tcHV0ZXIsIEluYy5cIikgJiYgKHZlcnNpb24gJiYgdmVyc2lvblsxXSA8IDQgfHwgbmF2aWdhdG9yLnBsYXRmb3JtLnNsaWNlKDAsIDIpID09IFwiaVBcIikgfHxcbiAgICAgICAgKG5hdmlnYXRvci52ZW5kb3IgPT0gXCJHb29nbGUgSW5jLlwiICYmIHZlcnNpb24gJiYgdmVyc2lvblsxXSA8IDgpKSB7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUGFwZXIuc2FmYXJpXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBUaGVyZSBpcyBhbiBpbmNvbnZlbmllbnQgcmVuZGVyaW5nIGJ1ZyBpbiBTYWZhcmkgKFdlYktpdCk6XG4gICAgICAgICAqIHNvbWV0aW1lcyB0aGUgcmVuZGVyaW5nIHNob3VsZCBiZSBmb3JjZWQuXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIHNob3VsZCBoZWxwIHdpdGggZGVhbGluZyB3aXRoIHRoaXMgYnVnLlxuICAgICAgICBcXCovXG4gICAgICAgIHBhcGVycHJvdG8uc2FmYXJpID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlY3QgPSB0aGlzLnJlY3QoLTk5LCAtOTksIHRoaXMud2lkdGggKyA5OSwgdGhpcy5oZWlnaHQgKyA5OSkuYXR0cih7c3Ryb2tlOiBcIm5vbmVcIn0pO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7cmVjdC5yZW1vdmUoKTt9KTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXBlcnByb3RvLnNhZmFyaSA9IGZ1bjtcbiAgICB9XG5cbiAgICB2YXIgcHJldmVudERlZmF1bHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9LFxuICAgIHByZXZlbnRUb3VjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWxFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0sXG4gICAgc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNhbmNlbEJ1YmJsZSA9IHRydWU7XG4gICAgfSxcbiAgICBzdG9wVG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICBnZXRFdmVudFBvc2l0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHNjcm9sbFkgPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGcuZG9jLmJvZHkuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgc2Nyb2xsWCA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGcuZG9jLmJvZHkuc2Nyb2xsTGVmdDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogZS5jbGllbnRYICsgc2Nyb2xsWCxcbiAgICAgICAgICAgIHk6IGUuY2xpZW50WSArIHNjcm9sbFlcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGFkZEV2ZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGcuZG9jLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCB0eXBlLCBmbiwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHZhciBmID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvcyA9IGdldEV2ZW50UG9zaXRpb24oZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKGVsZW1lbnQsIGUsIHBvcy54LCBwb3MueSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNUb3VjaCAmJiB0b3VjaE1hcFt0eXBlXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2YgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBvcyA9IGdldEV2ZW50UG9zaXRpb24oZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkZSA9IGU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGUudGFyZ2V0VG91Y2hlcyAmJiBlLnRhcmdldFRvdWNoZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnRhcmdldFRvdWNoZXNbaV0udGFyZ2V0ID09IG9iaikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlID0gZS50YXJnZXRUb3VjaGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLm9yaWdpbmFsRXZlbnQgPSBvbGRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID0gcHJldmVudFRvdWNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IHN0b3BUb3VjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbChlbGVtZW50LCBlLCBwb3MueCwgcG9zLnkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcih0b3VjaE1hcFt0eXBlXSwgX2YsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1cHBvcnRzVG91Y2ggJiYgdG91Y2hNYXBbdHlwZV0pXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcih0b3VjaE1hcFt0eXBlXSwgX2YsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChnLmRvYy5hdHRhY2hFdmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIHR5cGUsIGZuLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlID0gZSB8fCBnLndpbi5ldmVudDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcm9sbFkgPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGcuZG9jLmJvZHkuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsWCA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGcuZG9jLmJvZHkuc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBlLmNsaWVudFggKyBzY3JvbGxYLFxuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IGUuY2xpZW50WSArIHNjcm9sbFk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPSBlLnByZXZlbnREZWZhdWx0IHx8IHByZXZlbnREZWZhdWx0O1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IGUuc3RvcFByb3BhZ2F0aW9uIHx8IHN0b3BQcm9wYWdhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwoZWxlbWVudCwgZSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoXCJvblwiICsgdHlwZSwgZik7XG4gICAgICAgICAgICAgICAgdmFyIGRldGFjaGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoXCJvblwiICsgdHlwZSwgZik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRldGFjaGVyO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pKCksXG4gICAgZHJhZyA9IFtdLFxuICAgIGRyYWdNb3ZlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHggPSBlLmNsaWVudFgsXG4gICAgICAgICAgICB5ID0gZS5jbGllbnRZLFxuICAgICAgICAgICAgc2Nyb2xsWSA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZy5kb2MuYm9keS5zY3JvbGxUb3AsXG4gICAgICAgICAgICBzY3JvbGxYID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgfHwgZy5kb2MuYm9keS5zY3JvbGxMZWZ0LFxuICAgICAgICAgICAgZHJhZ2ksXG4gICAgICAgICAgICBqID0gZHJhZy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgIGRyYWdpID0gZHJhZ1tqXTtcbiAgICAgICAgICAgIGlmIChzdXBwb3J0c1RvdWNoICYmIGUudG91Y2hlcykge1xuICAgICAgICAgICAgICAgIHZhciBpID0gZS50b3VjaGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgdG91Y2g7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICB0b3VjaCA9IGUudG91Y2hlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdWNoLmlkZW50aWZpZXIgPT0gZHJhZ2kuZWwuX2RyYWcuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSB0b3VjaC5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHRvdWNoLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoZS5vcmlnaW5hbEV2ZW50ID8gZS5vcmlnaW5hbEV2ZW50IDogZSkucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbm9kZSA9IGRyYWdpLmVsLm5vZGUsXG4gICAgICAgICAgICAgICAgbyxcbiAgICAgICAgICAgICAgICBuZXh0ID0gbm9kZS5uZXh0U2libGluZyxcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgZGlzcGxheSA9IG5vZGUuc3R5bGUuZGlzcGxheTtcbiAgICAgICAgICAgIGcud2luLm9wZXJhICYmIHBhcmVudC5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgbyA9IGRyYWdpLmVsLnBhcGVyLmdldEVsZW1lbnRCeVBvaW50KHgsIHkpO1xuICAgICAgICAgICAgbm9kZS5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheTtcbiAgICAgICAgICAgIGcud2luLm9wZXJhICYmIChuZXh0ID8gcGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBuZXh0KSA6IHBhcmVudC5hcHBlbmRDaGlsZChub2RlKSk7XG4gICAgICAgICAgICBvICYmIGV2ZShcInJhcGhhZWwuZHJhZy5vdmVyLlwiICsgZHJhZ2kuZWwuaWQsIGRyYWdpLmVsLCBvKTtcbiAgICAgICAgICAgIHggKz0gc2Nyb2xsWDtcbiAgICAgICAgICAgIHkgKz0gc2Nyb2xsWTtcbiAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuZHJhZy5tb3ZlLlwiICsgZHJhZ2kuZWwuaWQsIGRyYWdpLm1vdmVfc2NvcGUgfHwgZHJhZ2kuZWwsIHggLSBkcmFnaS5lbC5fZHJhZy54LCB5IC0gZHJhZ2kuZWwuX2RyYWcueSwgeCwgeSwgZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRyYWdVcCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIFIudW5tb3VzZW1vdmUoZHJhZ01vdmUpLnVubW91c2V1cChkcmFnVXApO1xuICAgICAgICB2YXIgaSA9IGRyYWcubGVuZ3RoLFxuICAgICAgICAgICAgZHJhZ2k7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGRyYWdpID0gZHJhZ1tpXTtcbiAgICAgICAgICAgIGRyYWdpLmVsLl9kcmFnID0ge307XG4gICAgICAgICAgICBldmUoXCJyYXBoYWVsLmRyYWcuZW5kLlwiICsgZHJhZ2kuZWwuaWQsIGRyYWdpLmVuZF9zY29wZSB8fCBkcmFnaS5zdGFydF9zY29wZSB8fCBkcmFnaS5tb3ZlX3Njb3BlIHx8IGRyYWdpLmVsLCBlKTtcbiAgICAgICAgfVxuICAgICAgICBkcmFnID0gW107XG4gICAgfSxcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5lbFxuICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgKipcbiAgICAgKiBZb3UgY2FuIGFkZCB5b3VyIG93biBtZXRob2QgdG8gZWxlbWVudHMuIFRoaXMgaXMgdXNlZnVsbCB3aGVuIHlvdSB3YW50IHRvIGhhY2sgZGVmYXVsdCBmdW5jdGlvbmFsaXR5IG9yXG4gICAgICogd2FudCB0byB3cmFwIHNvbWUgY29tbW9uIHRyYW5zZm9ybWF0aW9uIG9yIGF0dHJpYnV0ZXMgaW4gb25lIG1ldGhvZC4gSW4gZGlmZmVyZW5jZSB0byBjYW52YXMgbWV0aG9kcyxcbiAgICAgKiB5b3UgY2FuIHJlZGVmaW5lIGVsZW1lbnQgbWV0aG9kIGF0IGFueSB0aW1lLiBFeHBlbmRpbmcgZWxlbWVudCBtZXRob2RzIHdvdWxkbuKAmXQgYWZmZWN0IHNldC5cbiAgICAgPiBVc2FnZVxuICAgICB8IFJhcGhhZWwuZWwucmVkID0gZnVuY3Rpb24gKCkge1xuICAgICB8ICAgICB0aGlzLmF0dHIoe2ZpbGw6IFwiI2YwMFwifSk7XG4gICAgIHwgfTtcbiAgICAgfCAvLyB0aGVuIHVzZSBpdFxuICAgICB8IHBhcGVyLmNpcmNsZSgxMDAsIDEwMCwgMjApLnJlZCgpO1xuICAgIFxcKi9cbiAgICBlbHByb3RvID0gUi5lbCA9IHt9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIGNsaWNrIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgY2xpY2sgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZGJsY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgZG91YmxlIGNsaWNrIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuZGJsY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgZG91YmxlIGNsaWNrIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlZG93blxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZWRvd24gZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZWRvd25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2Vkb3duIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlbW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZW1vdmUgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZW1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2Vtb3ZlIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlb3V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlb3V0IGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2VvdXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2VvdXQgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2VvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlb3ZlciBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlb3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZW92ZXIgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2V1cFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZXVwIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2V1cFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZXVwIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNoc3RhcnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2hzdGFydCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNoc3RhcnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2hzdGFydCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaG1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2htb3ZlIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2htb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNobW92ZSBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaGVuZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaGVuZCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNoZW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNoZW5kIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNoY2FuY2VsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNoY2FuY2VsIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2hjYW5jZWxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2hjYW5jZWwgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGZvciAodmFyIGkgPSBldmVudHMubGVuZ3RoOyBpLS07KSB7XG4gICAgICAgIChmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgICAgICBSW2V2ZW50TmFtZV0gPSBlbHByb3RvW2V2ZW50TmFtZV0gPSBmdW5jdGlvbiAoZm4sIHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgaWYgKFIuaXMoZm4sIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMgPSB0aGlzLmV2ZW50cyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMucHVzaCh7bmFtZTogZXZlbnROYW1lLCBmOiBmbiwgdW5iaW5kOiBhZGRFdmVudCh0aGlzLnNoYXBlIHx8IHRoaXMubm9kZSB8fCBnLmRvYywgZXZlbnROYW1lLCBmbiwgc2NvcGUgfHwgdGhpcyl9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUltcInVuXCIgKyBldmVudE5hbWVdID0gZWxwcm90b1tcInVuXCIgKyBldmVudE5hbWVdID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuZXZlbnRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBsID0gZXZlbnRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAobC0tKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50c1tsXS5uYW1lID09IGV2ZW50TmFtZSAmJiAoUi5pcyhmbiwgXCJ1bmRlZmluZWRcIikgfHwgZXZlbnRzW2xdLmYgPT0gZm4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudHNbbF0udW5iaW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudHMuc3BsaWNlKGwsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgIWV2ZW50cy5sZW5ndGggJiYgZGVsZXRlIHRoaXMuZXZlbnRzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoZXZlbnRzW2ldKTtcbiAgICB9XG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5kYXRhXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIG9yIHJldHJpZXZlcyBnaXZlbiB2YWx1ZSBhc29jaWF0ZWQgd2l0aCBnaXZlbiBrZXkuXG4gICAgICoqXG4gICAgICogU2VlIGFsc28gQEVsZW1lbnQucmVtb3ZlRGF0YVxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBrZXkgKHN0cmluZykga2V5IHRvIHN0b3JlIGRhdGFcbiAgICAgLSB2YWx1ZSAoYW55KSAjb3B0aW9uYWwgdmFsdWUgdG8gc3RvcmVcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgICAqIG9yLCBpZiB2YWx1ZSBpcyBub3Qgc3BlY2lmaWVkOlxuICAgICA9IChhbnkpIHZhbHVlXG4gICAgICogb3IsIGlmIGtleSBhbmQgdmFsdWUgYXJlIG5vdCBzcGVjaWZpZWQ6XG4gICAgID0gKG9iamVjdCkgS2V5L3ZhbHVlIHBhaXJzIGZvciBhbGwgdGhlIGRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSBlbGVtZW50LlxuICAgICA+IFVzYWdlXG4gICAgIHwgZm9yICh2YXIgaSA9IDAsIGkgPCA1LCBpKyspIHtcbiAgICAgfCAgICAgcGFwZXIuY2lyY2xlKDEwICsgMTUgKiBpLCAxMCwgMTApXG4gICAgIHwgICAgICAgICAgLmF0dHIoe2ZpbGw6IFwiIzAwMFwifSlcbiAgICAgfCAgICAgICAgICAuZGF0YShcImlcIiwgaSlcbiAgICAgfCAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICB8ICAgICAgICAgICAgIGFsZXJ0KHRoaXMuZGF0YShcImlcIikpO1xuICAgICB8ICAgICAgICAgIH0pO1xuICAgICB8IH1cbiAgICBcXCovXG4gICAgZWxwcm90by5kYXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBlbGRhdGFbdGhpcy5pZF0gPSBlbGRhdGFbdGhpcy5pZF0gfHwge307XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIGlmIChSLmlzKGtleSwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIGtleSkgaWYgKGtleVtoYXNdKGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YShpLCBrZXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuZGF0YS5nZXQuXCIgKyB0aGlzLmlkLCB0aGlzLCBkYXRhW2tleV0sIGtleSk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVtrZXldO1xuICAgICAgICB9XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICBldmUoXCJyYXBoYWVsLmRhdGEuc2V0LlwiICsgdGhpcy5pZCwgdGhpcywgdmFsdWUsIGtleSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucmVtb3ZlRGF0YVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggYW4gZWxlbWVudCBieSBnaXZlbiBrZXkuXG4gICAgICogSWYga2V5IGlzIG5vdCBwcm92aWRlZCwgcmVtb3ZlcyBhbGwgdGhlIGRhdGEgb2YgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGtleSAoc3RyaW5nKSAjb3B0aW9uYWwga2V5XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5yZW1vdmVEYXRhID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgICAgICAgIGVsZGF0YVt0aGlzLmlkXSA9IHt9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxkYXRhW3RoaXMuaWRdICYmIGRlbGV0ZSBlbGRhdGFbdGhpcy5pZF1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXREYXRhXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXRyaWV2ZXMgdGhlIGVsZW1lbnQgZGF0YVxuICAgICA9IChvYmplY3QpIGRhdGFcbiAgICBcXCovXG4gICAgZWxwcm90by5nZXREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2xvbmUoZWxkYXRhW3RoaXMuaWRdIHx8IHt9KTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmhvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBob3ZlciBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGZfaW4gKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBpblxuICAgICAtIGZfb3V0IChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgb3V0XG4gICAgIC0gaWNvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGhvdmVyIGluIGhhbmRsZXJcbiAgICAgLSBvY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgaG92ZXIgb3V0IGhhbmRsZXJcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmhvdmVyID0gZnVuY3Rpb24gKGZfaW4sIGZfb3V0LCBzY29wZV9pbiwgc2NvcGVfb3V0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vdXNlb3ZlcihmX2luLCBzY29wZV9pbikubW91c2VvdXQoZl9vdXQsIHNjb3BlX291dCB8fCBzY29wZV9pbik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmhvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXJzIGZvciBob3ZlciBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGZfaW4gKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBpblxuICAgICAtIGZfb3V0IChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgb3V0XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by51bmhvdmVyID0gZnVuY3Rpb24gKGZfaW4sIGZfb3V0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVubW91c2VvdmVyKGZfaW4pLnVubW91c2VvdXQoZl9vdXQpO1xuICAgIH07XG4gICAgdmFyIGRyYWdnYWJsZSA9IFtdO1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmRyYWdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGRyYWcgb2YgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIG9ubW92ZSAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIG1vdmluZ1xuICAgICAtIG9uc3RhcnQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBkcmFnIHN0YXJ0XG4gICAgIC0gb25lbmQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBkcmFnIGVuZFxuICAgICAtIG1jb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBtb3ZpbmcgaGFuZGxlclxuICAgICAtIHNjb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBkcmFnIHN0YXJ0IGhhbmRsZXJcbiAgICAgLSBlY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgZHJhZyBlbmQgaGFuZGxlclxuICAgICAqIEFkZGl0aW9uYWx5IGZvbGxvd2luZyBgZHJhZ2AgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkOiBgZHJhZy5zdGFydC48aWQ+YCBvbiBzdGFydCxcbiAgICAgKiBgZHJhZy5lbmQuPGlkPmAgb24gZW5kIGFuZCBgZHJhZy5tb3ZlLjxpZD5gIG9uIGV2ZXJ5IG1vdmUuIFdoZW4gZWxlbWVudCB3aWxsIGJlIGRyYWdnZWQgb3ZlciBhbm90aGVyIGVsZW1lbnRcbiAgICAgKiBgZHJhZy5vdmVyLjxpZD5gIHdpbGwgYmUgZmlyZWQgYXMgd2VsbC5cbiAgICAgKlxuICAgICAqIFN0YXJ0IGV2ZW50IGFuZCBzdGFydCBoYW5kbGVyIHdpbGwgYmUgY2FsbGVkIGluIHNwZWNpZmllZCBjb250ZXh0IG9yIGluIGNvbnRleHQgb2YgdGhlIGVsZW1lbnQgd2l0aCBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICAgbyB4IChudW1iZXIpIHggcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8geSAobnVtYmVyKSB5IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIGV2ZW50IChvYmplY3QpIERPTSBldmVudCBvYmplY3RcbiAgICAgKiBNb3ZlIGV2ZW50IGFuZCBtb3ZlIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQgaW4gc3BlY2lmaWVkIGNvbnRleHQgb3IgaW4gY29udGV4dCBvZiB0aGUgZWxlbWVudCB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICAgICBvIGR4IChudW1iZXIpIHNoaWZ0IGJ5IHggZnJvbSB0aGUgc3RhcnQgcG9pbnRcbiAgICAgbyBkeSAobnVtYmVyKSBzaGlmdCBieSB5IGZyb20gdGhlIHN0YXJ0IHBvaW50XG4gICAgIG8geCAobnVtYmVyKSB4IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIHkgKG51bWJlcikgeSBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyBldmVudCAob2JqZWN0KSBET00gZXZlbnQgb2JqZWN0XG4gICAgICogRW5kIGV2ZW50IGFuZCBlbmQgaGFuZGxlciB3aWxsIGJlIGNhbGxlZCBpbiBzcGVjaWZpZWQgY29udGV4dCBvciBpbiBjb250ZXh0IG9mIHRoZSBlbGVtZW50IHdpdGggZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gICAgIG8gZXZlbnQgKG9iamVjdCkgRE9NIGV2ZW50IG9iamVjdFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZHJhZyA9IGZ1bmN0aW9uIChvbm1vdmUsIG9uc3RhcnQsIG9uZW5kLCBtb3ZlX3Njb3BlLCBzdGFydF9zY29wZSwgZW5kX3Njb3BlKSB7XG4gICAgICAgIGZ1bmN0aW9uIHN0YXJ0KGUpIHtcbiAgICAgICAgICAgIChlLm9yaWdpbmFsRXZlbnQgfHwgZSkucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciB4ID0gZS5jbGllbnRYLFxuICAgICAgICAgICAgICAgIHkgPSBlLmNsaWVudFksXG4gICAgICAgICAgICAgICAgc2Nyb2xsWSA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZy5kb2MuYm9keS5zY3JvbGxUb3AsXG4gICAgICAgICAgICAgICAgc2Nyb2xsWCA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGcuZG9jLmJvZHkuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgIHRoaXMuX2RyYWcuaWQgPSBlLmlkZW50aWZpZXI7XG4gICAgICAgICAgICBpZiAoc3VwcG9ydHNUb3VjaCAmJiBlLnRvdWNoZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGUudG91Y2hlcy5sZW5ndGgsIHRvdWNoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2ggPSBlLnRvdWNoZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RyYWcuaWQgPSB0b3VjaC5pZGVudGlmaWVyO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PSB0aGlzLl9kcmFnLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gdG91Y2guY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSB0b3VjaC5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9kcmFnLnggPSB4ICsgc2Nyb2xsWDtcbiAgICAgICAgICAgIHRoaXMuX2RyYWcueSA9IHkgKyBzY3JvbGxZO1xuICAgICAgICAgICAgIWRyYWcubGVuZ3RoICYmIFIubW91c2Vtb3ZlKGRyYWdNb3ZlKS5tb3VzZXVwKGRyYWdVcCk7XG4gICAgICAgICAgICBkcmFnLnB1c2goe2VsOiB0aGlzLCBtb3ZlX3Njb3BlOiBtb3ZlX3Njb3BlLCBzdGFydF9zY29wZTogc3RhcnRfc2NvcGUsIGVuZF9zY29wZTogZW5kX3Njb3BlfSk7XG4gICAgICAgICAgICBvbnN0YXJ0ICYmIGV2ZS5vbihcInJhcGhhZWwuZHJhZy5zdGFydC5cIiArIHRoaXMuaWQsIG9uc3RhcnQpO1xuICAgICAgICAgICAgb25tb3ZlICYmIGV2ZS5vbihcInJhcGhhZWwuZHJhZy5tb3ZlLlwiICsgdGhpcy5pZCwgb25tb3ZlKTtcbiAgICAgICAgICAgIG9uZW5kICYmIGV2ZS5vbihcInJhcGhhZWwuZHJhZy5lbmQuXCIgKyB0aGlzLmlkLCBvbmVuZCk7XG4gICAgICAgICAgICBldmUoXCJyYXBoYWVsLmRyYWcuc3RhcnQuXCIgKyB0aGlzLmlkLCBzdGFydF9zY29wZSB8fCBtb3ZlX3Njb3BlIHx8IHRoaXMsIGUuY2xpZW50WCArIHNjcm9sbFgsIGUuY2xpZW50WSArIHNjcm9sbFksIGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RyYWcgPSB7fTtcbiAgICAgICAgZHJhZ2dhYmxlLnB1c2goe2VsOiB0aGlzLCBzdGFydDogc3RhcnR9KTtcbiAgICAgICAgdGhpcy5tb3VzZWRvd24oc3RhcnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm9uRHJhZ092ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNob3J0Y3V0IGZvciBhc3NpZ25pbmcgZXZlbnQgaGFuZGxlciBmb3IgYGRyYWcub3Zlci48aWQ+YCBldmVudCwgd2hlcmUgaWQgaXMgaWQgb2YgdGhlIGVsZW1lbnQgKHNlZSBARWxlbWVudC5pZCkuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBldmVudCwgZmlyc3QgYXJndW1lbnQgd291bGQgYmUgdGhlIGVsZW1lbnQgeW91IGFyZSBkcmFnZ2luZyBvdmVyXG4gICAgXFwqL1xuICAgIGVscHJvdG8ub25EcmFnT3ZlciA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGYgPyBldmUub24oXCJyYXBoYWVsLmRyYWcub3Zlci5cIiArIHRoaXMuaWQsIGYpIDogZXZlLnVuYmluZChcInJhcGhhZWwuZHJhZy5vdmVyLlwiICsgdGhpcy5pZCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmRyYWdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYWxsIGRyYWcgZXZlbnQgaGFuZGxlcnMgZnJvbSBnaXZlbiBlbGVtZW50LlxuICAgIFxcKi9cbiAgICBlbHByb3RvLnVuZHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGkgPSBkcmFnZ2FibGUubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSBpZiAoZHJhZ2dhYmxlW2ldLmVsID09IHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXMudW5tb3VzZWRvd24oZHJhZ2dhYmxlW2ldLnN0YXJ0KTtcbiAgICAgICAgICAgIGRyYWdnYWJsZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBldmUudW5iaW5kKFwicmFwaGFlbC5kcmFnLiouXCIgKyB0aGlzLmlkKTtcbiAgICAgICAgfVxuICAgICAgICAhZHJhZ2dhYmxlLmxlbmd0aCAmJiBSLnVubW91c2Vtb3ZlKGRyYWdNb3ZlKS51bm1vdXNldXAoZHJhZ1VwKTtcbiAgICAgICAgZHJhZyA9IFtdO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmNpcmNsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYSBjaXJjbGUuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0gciAobnVtYmVyKSByYWRpdXNcbiAgICAgPSAob2JqZWN0KSBSYXBoYcOrbCBlbGVtZW50IG9iamVjdCB3aXRoIHR5cGUg4oCcY2lyY2xl4oCdXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLmNpcmNsZSg1MCwgNTAsIDQwKTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5jaXJjbGUgPSBmdW5jdGlvbiAoeCwgeSwgcikge1xuICAgICAgICB2YXIgb3V0ID0gUi5fZW5naW5lLmNpcmNsZSh0aGlzLCB4IHx8IDAsIHkgfHwgMCwgciB8fCAwKTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucmVjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEcmF3cyBhIHJlY3RhbmdsZS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHRvcCBsZWZ0IGNvcm5lclxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSB0b3AgbGVmdCBjb3JuZXJcbiAgICAgLSB3aWR0aCAobnVtYmVyKSB3aWR0aFxuICAgICAtIGhlaWdodCAobnVtYmVyKSBoZWlnaHRcbiAgICAgLSByIChudW1iZXIpICNvcHRpb25hbCByYWRpdXMgZm9yIHJvdW5kZWQgY29ybmVycywgZGVmYXVsdCBpcyAwXG4gICAgID0gKG9iamVjdCkgUmFwaGHDq2wgZWxlbWVudCBvYmplY3Qgd2l0aCB0eXBlIOKAnHJlY3TigJ1cbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIHJlZ3VsYXIgcmVjdGFuZ2xlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5yZWN0KDEwLCAxMCwgNTAsIDUwKTtcbiAgICAgfCAvLyByZWN0YW5nbGUgd2l0aCByb3VuZGVkIGNvcm5lcnNcbiAgICAgfCB2YXIgYyA9IHBhcGVyLnJlY3QoNDAsIDQwLCA1MCwgNTAsIDEwKTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5yZWN0ID0gZnVuY3Rpb24gKHgsIHksIHcsIGgsIHIpIHtcbiAgICAgICAgdmFyIG91dCA9IFIuX2VuZ2luZS5yZWN0KHRoaXMsIHggfHwgMCwgeSB8fCAwLCB3IHx8IDAsIGggfHwgMCwgciB8fCAwKTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZWxsaXBzZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYW4gZWxsaXBzZS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSByeCAobnVtYmVyKSBob3Jpem9udGFsIHJhZGl1c1xuICAgICAtIHJ5IChudW1iZXIpIHZlcnRpY2FsIHJhZGl1c1xuICAgICA9IChvYmplY3QpIFJhcGhhw6tsIGVsZW1lbnQgb2JqZWN0IHdpdGggdHlwZSDigJxlbGxpcHNl4oCdXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLmVsbGlwc2UoNTAsIDUwLCA0MCwgMjApO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmVsbGlwc2UgPSBmdW5jdGlvbiAoeCwgeSwgcngsIHJ5KSB7XG4gICAgICAgIHZhciBvdXQgPSBSLl9lbmdpbmUuZWxsaXBzZSh0aGlzLCB4IHx8IDAsIHkgfHwgMCwgcnggfHwgMCwgcnkgfHwgMCk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBwYXRoIGVsZW1lbnQgYnkgZ2l2ZW4gcGF0aCBkYXRhIHN0cmluZy5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcGF0aFN0cmluZyAoc3RyaW5nKSAjb3B0aW9uYWwgcGF0aCBzdHJpbmcgaW4gU1ZHIGZvcm1hdC5cbiAgICAgKiBQYXRoIHN0cmluZyBjb25zaXN0cyBvZiBvbmUtbGV0dGVyIGNvbW1hbmRzLCBmb2xsb3dlZCBieSBjb21tYSBzZXByYXJhdGVkIGFyZ3VtZW50cyBpbiBudW1lcmNhbCBmb3JtLiBFeGFtcGxlOlxuICAgICB8IFwiTTEwLDIwTDMwLDQwXCJcbiAgICAgKiBIZXJlIHdlIGNhbiBzZWUgdHdvIGNvbW1hbmRzOiDigJxN4oCdLCB3aXRoIGFyZ3VtZW50cyBgKDEwLCAyMClgIGFuZCDigJxM4oCdIHdpdGggYXJndW1lbnRzIGAoMzAsIDQwKWAuIFVwcGVyIGNhc2UgbGV0dGVyIG1lYW4gY29tbWFuZCBpcyBhYnNvbHV0ZSwgbG93ZXIgY2FzZeKAlHJlbGF0aXZlLlxuICAgICAqXG4gICAgICMgPHA+SGVyZSBpcyBzaG9ydCBsaXN0IG9mIGNvbW1hbmRzIGF2YWlsYWJsZSwgZm9yIG1vcmUgZGV0YWlscyBzZWUgPGEgaHJlZj1cImh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9wYXRocy5odG1sI1BhdGhEYXRhXCIgdGl0bGU9XCJEZXRhaWxzIG9mIGEgcGF0aCdzIGRhdGEgYXR0cmlidXRlJ3MgZm9ybWF0IGFyZSBkZXNjcmliZWQgaW4gdGhlIFNWRyBzcGVjaWZpY2F0aW9uLlwiPlNWRyBwYXRoIHN0cmluZyBmb3JtYXQ8L2E+LjwvcD5cbiAgICAgIyA8dGFibGU+PHRoZWFkPjx0cj48dGg+Q29tbWFuZDwvdGg+PHRoPk5hbWU8L3RoPjx0aD5QYXJhbWV0ZXJzPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PlxuICAgICAjIDx0cj48dGQ+TTwvdGQ+PHRkPm1vdmV0bzwvdGQ+PHRkPih4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlo8L3RkPjx0ZD5jbG9zZXBhdGg8L3RkPjx0ZD4obm9uZSk8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5MPC90ZD48dGQ+bGluZXRvPC90ZD48dGQ+KHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+SDwvdGQ+PHRkPmhvcml6b250YWwgbGluZXRvPC90ZD48dGQ+eCs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5WPC90ZD48dGQ+dmVydGljYWwgbGluZXRvPC90ZD48dGQ+eSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5DPC90ZD48dGQ+Y3VydmV0bzwvdGQ+PHRkPih4MSB5MSB4MiB5MiB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlM8L3RkPjx0ZD5zbW9vdGggY3VydmV0bzwvdGQ+PHRkPih4MiB5MiB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlE8L3RkPjx0ZD5xdWFkcmF0aWMgQsOpemllciBjdXJ2ZXRvPC90ZD48dGQ+KHgxIHkxIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+VDwvdGQ+PHRkPnNtb290aCBxdWFkcmF0aWMgQsOpemllciBjdXJ2ZXRvPC90ZD48dGQ+KHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+QTwvdGQ+PHRkPmVsbGlwdGljYWwgYXJjPC90ZD48dGQ+KHJ4IHJ5IHgtYXhpcy1yb3RhdGlvbiBsYXJnZS1hcmMtZmxhZyBzd2VlcC1mbGFnIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+UjwvdGQ+PHRkPjxhIGhyZWY9XCJodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NhdG11bGzigJNSb21fc3BsaW5lI0NhdG11bGwuRTIuODAuOTNSb21fc3BsaW5lXCI+Q2F0bXVsbC1Sb20gY3VydmV0bzwvYT4qPC90ZD48dGQ+eDEgeTEgKHggeSkrPC90ZD48L3RyPjwvdGJvZHk+PC90YWJsZT5cbiAgICAgKiAqIOKAnENhdG11bGwtUm9tIGN1cnZldG/igJ0gaXMgYSBub3Qgc3RhbmRhcmQgU1ZHIGNvbW1hbmQgYW5kIGFkZGVkIGluIDIuMCB0byBtYWtlIGxpZmUgZWFzaWVyLlxuICAgICAqIE5vdGU6IHRoZXJlIGlzIGEgc3BlY2lhbCBjYXNlIHdoZW4gcGF0aCBjb25zaXN0IG9mIGp1c3QgdGhyZWUgY29tbWFuZHM6IOKAnE0xMCwxMFLigKZ64oCdLiBJbiB0aGlzIGNhc2UgcGF0aCB3aWxsIHNtb290aGx5IGNvbm5lY3RzIHRvIGl0cyBiZWdpbm5pbmcuXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLnBhdGgoXCJNMTAgMTBMOTAgOTBcIik7XG4gICAgIHwgLy8gZHJhdyBhIGRpYWdvbmFsIGxpbmU6XG4gICAgIHwgLy8gbW92ZSB0byAxMCwxMCwgbGluZSB0byA5MCw5MFxuICAgICAqIEZvciBleGFtcGxlIG9mIHBhdGggc3RyaW5ncywgY2hlY2sgb3V0IHRoZXNlIGljb25zOiBodHRwOi8vcmFwaGFlbGpzLmNvbS9pY29ucy9cbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5wYXRoID0gZnVuY3Rpb24gKHBhdGhTdHJpbmcpIHtcbiAgICAgICAgcGF0aFN0cmluZyAmJiAhUi5pcyhwYXRoU3RyaW5nLCBzdHJpbmcpICYmICFSLmlzKHBhdGhTdHJpbmdbMF0sIGFycmF5KSAmJiAocGF0aFN0cmluZyArPSBFKTtcbiAgICAgICAgdmFyIG91dCA9IFIuX2VuZ2luZS5wYXRoKFIuZm9ybWF0W2FwcGx5XShSLCBhcmd1bWVudHMpLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuaW1hZ2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEVtYmVkcyBhbiBpbWFnZSBpbnRvIHRoZSBzdXJmYWNlLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBzcmMgKHN0cmluZykgVVJJIG9mIHRoZSBzb3VyY2UgaW1hZ2VcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBwb3NpdGlvblxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIHBvc2l0aW9uXG4gICAgIC0gd2lkdGggKG51bWJlcikgd2lkdGggb2YgdGhlIGltYWdlXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpIGhlaWdodCBvZiB0aGUgaW1hZ2VcbiAgICAgPSAob2JqZWN0KSBSYXBoYcOrbCBlbGVtZW50IG9iamVjdCB3aXRoIHR5cGUg4oCcaW1hZ2XigJ1cbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIuaW1hZ2UoXCJhcHBsZS5wbmdcIiwgMTAsIDEwLCA4MCwgODApO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmltYWdlID0gZnVuY3Rpb24gKHNyYywgeCwgeSwgdywgaCkge1xuICAgICAgICB2YXIgb3V0ID0gUi5fZW5naW5lLmltYWdlKHRoaXMsIHNyYyB8fCBcImFib3V0OmJsYW5rXCIsIHggfHwgMCwgeSB8fCAwLCB3IHx8IDAsIGggfHwgMCk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnRleHRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGEgdGV4dCBzdHJpbmcuIElmIHlvdSBuZWVkIGxpbmUgYnJlYWtzLCBwdXQg4oCcXFxu4oCdIGluIHRoZSBzdHJpbmcuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIHBvc2l0aW9uXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgcG9zaXRpb25cbiAgICAgLSB0ZXh0IChzdHJpbmcpIFRoZSB0ZXh0IHN0cmluZyB0byBkcmF3XG4gICAgID0gKG9iamVjdCkgUmFwaGHDq2wgZWxlbWVudCBvYmplY3Qgd2l0aCB0eXBlIOKAnHRleHTigJ1cbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciB0ID0gcGFwZXIudGV4dCg1MCwgNTAsIFwiUmFwaGHDq2xcXG5raWNrc1xcbmJ1dHQhXCIpO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnRleHQgPSBmdW5jdGlvbiAoeCwgeSwgdGV4dCkge1xuICAgICAgICB2YXIgb3V0ID0gUi5fZW5naW5lLnRleHQodGhpcywgeCB8fCAwLCB5IHx8IDAsIFN0cih0ZXh0KSk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnNldFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhcnJheS1saWtlIG9iamVjdCB0byBrZWVwIGFuZCBvcGVyYXRlIHNldmVyYWwgZWxlbWVudHMgYXQgb25jZS5cbiAgICAgKiBXYXJuaW5nOiBpdCBkb2VzbuKAmXQgY3JlYXRlIGFueSBlbGVtZW50cyBmb3IgaXRzZWxmIGluIHRoZSBwYWdlLCBpdCBqdXN0IGdyb3VwcyBleGlzdGluZyBlbGVtZW50cy5cbiAgICAgKiBTZXRzIGFjdCBhcyBwc2V1ZG8gZWxlbWVudHMg4oCUIGFsbCBtZXRob2RzIGF2YWlsYWJsZSB0byBhbiBlbGVtZW50IGNhbiBiZSB1c2VkIG9uIGEgc2V0LlxuICAgICA9IChvYmplY3QpIGFycmF5LWxpa2Ugb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBzZXQgb2YgZWxlbWVudHNcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBzdCA9IHBhcGVyLnNldCgpO1xuICAgICB8IHN0LnB1c2goXG4gICAgIHwgICAgIHBhcGVyLmNpcmNsZSgxMCwgMTAsIDUpLFxuICAgICB8ICAgICBwYXBlci5jaXJjbGUoMzAsIDEwLCA1KVxuICAgICB8ICk7XG4gICAgIHwgc3QuYXR0cih7ZmlsbDogXCJyZWRcIn0pOyAvLyBjaGFuZ2VzIHRoZSBmaWxsIG9mIGJvdGggY2lyY2xlc1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnNldCA9IGZ1bmN0aW9uIChpdGVtc0FycmF5KSB7XG4gICAgICAgICFSLmlzKGl0ZW1zQXJyYXksIFwiYXJyYXlcIikgJiYgKGl0ZW1zQXJyYXkgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmd1bWVudHMubGVuZ3RoKSk7XG4gICAgICAgIHZhciBvdXQgPSBuZXcgU2V0KGl0ZW1zQXJyYXkpO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgb3V0W1wicGFwZXJcIl0gPSB0aGlzO1xuICAgICAgICBvdXRbXCJ0eXBlXCJdID0gXCJzZXRcIjtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5zZXRTdGFydFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBAUGFwZXIuc2V0LiBBbGwgZWxlbWVudHMgdGhhdCB3aWxsIGJlIGNyZWF0ZWQgYWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCBhbmQgYmVmb3JlIGNhbGxpbmdcbiAgICAgKiBAUGFwZXIuc2V0RmluaXNoIHdpbGwgYmUgYWRkZWQgdG8gdGhlIHNldC5cbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHBhcGVyLnNldFN0YXJ0KCk7XG4gICAgIHwgcGFwZXIuY2lyY2xlKDEwLCAxMCwgNSksXG4gICAgIHwgcGFwZXIuY2lyY2xlKDMwLCAxMCwgNSlcbiAgICAgfCB2YXIgc3QgPSBwYXBlci5zZXRGaW5pc2goKTtcbiAgICAgfCBzdC5hdHRyKHtmaWxsOiBcInJlZFwifSk7IC8vIGNoYW5nZXMgdGhlIGZpbGwgb2YgYm90aCBjaXJjbGVzXG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uc2V0U3RhcnQgPSBmdW5jdGlvbiAoc2V0KSB7XG4gICAgICAgIHRoaXMuX19zZXRfXyA9IHNldCB8fCB0aGlzLnNldCgpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnNldEZpbmlzaFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBQYXBlci5zZXRTdGFydC4gVGhpcyBtZXRob2QgZmluaXNoZXMgY2F0Y2hpbmcgYW5kIHJldHVybnMgcmVzdWx0aW5nIHNldC5cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBzZXRcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5zZXRGaW5pc2ggPSBmdW5jdGlvbiAoc2V0KSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLl9fc2V0X187XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9fc2V0X187XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ2V0U2l6ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogT2J0YWlucyBjdXJyZW50IHBhcGVyIGFjdHVhbCBzaXplLlxuICAgICAqKlxuICAgICA9IChvYmplY3QpXG4gICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNhbnZhcy5wYXJlbnROb2RlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IGNvbnRhaW5lci5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogY29udGFpbmVyLm9mZnNldEhlaWdodFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnNldFNpemVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIElmIHlvdSBuZWVkIHRvIGNoYW5nZSBkaW1lbnNpb25zIG9mIHRoZSBjYW52YXMgY2FsbCB0aGlzIG1ldGhvZFxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB3aWR0aCAobnVtYmVyKSBuZXcgd2lkdGggb2YgdGhlIGNhbnZhc1xuICAgICAtIGhlaWdodCAobnVtYmVyKSBuZXcgaGVpZ2h0IG9mIHRoZSBjYW52YXNcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5zZXRTaXplID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgcmV0dXJuIFIuX2VuZ2luZS5zZXRTaXplLmNhbGwodGhpcywgd2lkdGgsIGhlaWdodCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuc2V0Vmlld0JveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2V0cyB0aGUgdmlldyBib3ggb2YgdGhlIHBhcGVyLiBQcmFjdGljYWxseSBpdCBnaXZlcyB5b3UgYWJpbGl0eSB0byB6b29tIGFuZCBwYW4gd2hvbGUgcGFwZXIgc3VyZmFjZSBieVxuICAgICAqIHNwZWNpZnlpbmcgbmV3IGJvdW5kYXJpZXMuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgbmV3IHggcG9zaXRpb24sIGRlZmF1bHQgaXMgYDBgXG4gICAgIC0geSAobnVtYmVyKSBuZXcgeSBwb3NpdGlvbiwgZGVmYXVsdCBpcyBgMGBcbiAgICAgLSB3IChudW1iZXIpIG5ldyB3aWR0aCBvZiB0aGUgY2FudmFzXG4gICAgIC0gaCAobnVtYmVyKSBuZXcgaGVpZ2h0IG9mIHRoZSBjYW52YXNcbiAgICAgLSBmaXQgKGJvb2xlYW4pIGB0cnVlYCBpZiB5b3Ugd2FudCBncmFwaGljcyB0byBmaXQgaW50byBuZXcgYm91bmRhcnkgYm94XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uc2V0Vmlld0JveCA9IGZ1bmN0aW9uICh4LCB5LCB3LCBoLCBmaXQpIHtcbiAgICAgICAgcmV0dXJuIFIuX2VuZ2luZS5zZXRWaWV3Qm94LmNhbGwodGhpcywgeCwgeSwgdywgaCwgZml0KTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci50b3BcbiAgICAgWyBwcm9wZXJ0eSBdXG4gICAgICoqXG4gICAgICogUG9pbnRzIHRvIHRoZSB0b3Btb3N0IGVsZW1lbnQgb24gdGhlIHBhcGVyXG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5ib3R0b21cbiAgICAgWyBwcm9wZXJ0eSBdXG4gICAgICoqXG4gICAgICogUG9pbnRzIHRvIHRoZSBib3R0b20gZWxlbWVudCBvbiB0aGUgcGFwZXJcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by50b3AgPSBwYXBlcnByb3RvLmJvdHRvbSA9IG51bGw7XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnJhcGhhZWxcbiAgICAgWyBwcm9wZXJ0eSBdXG4gICAgICoqXG4gICAgICogUG9pbnRzIHRvIHRoZSBAUmFwaGFlbCBvYmplY3QvZnVuY3Rpb25cbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5yYXBoYWVsID0gUjtcbiAgICB2YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgdmFyIGJveCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgICAgICBkb2MgPSBlbGVtLm93bmVyRG9jdW1lbnQsXG4gICAgICAgICAgICBib2R5ID0gZG9jLmJvZHksXG4gICAgICAgICAgICBkb2NFbGVtID0gZG9jLmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgICAgIGNsaWVudFRvcCA9IGRvY0VsZW0uY2xpZW50VG9wIHx8IGJvZHkuY2xpZW50VG9wIHx8IDAsIGNsaWVudExlZnQgPSBkb2NFbGVtLmNsaWVudExlZnQgfHwgYm9keS5jbGllbnRMZWZ0IHx8IDAsXG4gICAgICAgICAgICB0b3AgID0gYm94LnRvcCAgKyAoZy53aW4ucGFnZVlPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxUb3AgfHwgYm9keS5zY3JvbGxUb3AgKSAtIGNsaWVudFRvcCxcbiAgICAgICAgICAgIGxlZnQgPSBib3gubGVmdCArIChnLndpbi5wYWdlWE9mZnNldCB8fCBkb2NFbGVtLnNjcm9sbExlZnQgfHwgYm9keS5zY3JvbGxMZWZ0KSAtIGNsaWVudExlZnQ7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB5OiB0b3AsXG4gICAgICAgICAgICB4OiBsZWZ0XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ2V0RWxlbWVudEJ5UG9pbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgeW91IHRvcG1vc3QgZWxlbWVudCB1bmRlciBnaXZlbiBwb2ludC5cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBSYXBoYcOrbCBlbGVtZW50IG9iamVjdFxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBmcm9tIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgdGhlIHdpbmRvd1xuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIGZyb20gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiB0aGUgd2luZG93XG4gICAgID4gVXNhZ2VcbiAgICAgfCBwYXBlci5nZXRFbGVtZW50QnlQb2ludChtb3VzZVgsIG1vdXNlWSkuYXR0cih7c3Ryb2tlOiBcIiNmMDBcIn0pO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmdldEVsZW1lbnRCeVBvaW50ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgdmFyIHBhcGVyID0gdGhpcyxcbiAgICAgICAgICAgIHN2ZyA9IHBhcGVyLmNhbnZhcyxcbiAgICAgICAgICAgIHRhcmdldCA9IGcuZG9jLmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XG4gICAgICAgIGlmIChnLndpbi5vcGVyYSAmJiB0YXJnZXQudGFnTmFtZSA9PSBcInN2Z1wiKSB7XG4gICAgICAgICAgICB2YXIgc28gPSBnZXRPZmZzZXQoc3ZnKSxcbiAgICAgICAgICAgICAgICBzciA9IHN2Zy5jcmVhdGVTVkdSZWN0KCk7XG4gICAgICAgICAgICBzci54ID0geCAtIHNvLng7XG4gICAgICAgICAgICBzci55ID0geSAtIHNvLnk7XG4gICAgICAgICAgICBzci53aWR0aCA9IHNyLmhlaWdodCA9IDE7XG4gICAgICAgICAgICB2YXIgaGl0cyA9IHN2Zy5nZXRJbnRlcnNlY3Rpb25MaXN0KHNyLCBudWxsKTtcbiAgICAgICAgICAgIGlmIChoaXRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRhcmdldCA9IGhpdHNbaGl0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHRhcmdldC5wYXJlbnROb2RlICYmIHRhcmdldCAhPSBzdmcucGFyZW50Tm9kZSAmJiAhdGFyZ2V0LnJhcGhhZWwpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldCA9PSBwYXBlci5jYW52YXMucGFyZW50Tm9kZSAmJiAodGFyZ2V0ID0gc3ZnKTtcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0ICYmIHRhcmdldC5yYXBoYWVsID8gcGFwZXIuZ2V0QnlJZCh0YXJnZXQucmFwaGFlbGlkKSA6IG51bGw7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBQYXBlci5nZXRFbGVtZW50c0J5QkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBzZXQgb2YgZWxlbWVudHMgdGhhdCBoYXZlIGFuIGludGVyc2VjdGluZyBib3VuZGluZyBib3hcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gYmJveCAob2JqZWN0KSBiYm94IHRvIGNoZWNrIHdpdGhcbiAgICAgPSAob2JqZWN0KSBAU2V0XG4gICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmdldEVsZW1lbnRzQnlCQm94ID0gZnVuY3Rpb24gKGJib3gpIHtcbiAgICAgICAgdmFyIHNldCA9IHRoaXMuc2V0KCk7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGlmIChSLmlzQkJveEludGVyc2VjdChlbC5nZXRCQm94KCksIGJib3gpKSB7XG4gICAgICAgICAgICAgICAgc2V0LnB1c2goZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHNldDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdldEJ5SWRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgeW91IGVsZW1lbnQgYnkgaXRzIGludGVybmFsIElELlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBpZCAobnVtYmVyKSBpZFxuICAgICA9IChvYmplY3QpIFJhcGhhw6tsIGVsZW1lbnQgb2JqZWN0XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZ2V0QnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2YXIgYm90ID0gdGhpcy5ib3R0b207XG4gICAgICAgIHdoaWxlIChib3QpIHtcbiAgICAgICAgICAgIGlmIChib3QuaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm90O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYm90ID0gYm90Lm5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZm9yRWFjaFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRXhlY3V0ZXMgZ2l2ZW4gZnVuY3Rpb24gZm9yIGVhY2ggZWxlbWVudCBvbiB0aGUgcGFwZXJcbiAgICAgKlxuICAgICAqIElmIGNhbGxiYWNrIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYCBpdCB3aWxsIHN0b3AgbG9vcCBydW5uaW5nLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pIGZ1bmN0aW9uIHRvIHJ1blxuICAgICAtIHRoaXNBcmcgKG9iamVjdCkgY29udGV4dCBvYmplY3QgZm9yIHRoZSBjYWxsYmFja1xuICAgICA9IChvYmplY3QpIFBhcGVyIG9iamVjdFxuICAgICA+IFVzYWdlXG4gICAgIHwgcGFwZXIuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgfCAgICAgZWwuYXR0cih7IHN0cm9rZTogXCJibHVlXCIgfSk7XG4gICAgIHwgfSk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgICB2YXIgYm90ID0gdGhpcy5ib3R0b207XG4gICAgICAgIHdoaWxlIChib3QpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjay5jYWxsKHRoaXNBcmcsIGJvdCkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBib3QgPSBib3QubmV4dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5nZXRFbGVtZW50c0J5UG9pbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgc2V0IG9mIGVsZW1lbnRzIHRoYXQgaGF2ZSBjb21tb24gcG9pbnQgaW5zaWRlXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICA9IChvYmplY3QpIEBTZXRcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5nZXRFbGVtZW50c0J5UG9pbnQgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB2YXIgc2V0ID0gdGhpcy5zZXQoKTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgaWYgKGVsLmlzUG9pbnRJbnNpZGUoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICBzZXQucHVzaChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2V0O1xuICAgIH07XG4gICAgZnVuY3Rpb24geF95KCkge1xuICAgICAgICByZXR1cm4gdGhpcy54ICsgUyArIHRoaXMueTtcbiAgICB9XG4gICAgZnVuY3Rpb24geF95X3dfaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMueCArIFMgKyB0aGlzLnkgKyBTICsgdGhpcy53aWR0aCArIFwiIFxceGQ3IFwiICsgdGhpcy5oZWlnaHQ7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmlzUG9pbnRJbnNpZGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERldGVybWluZSBpZiBnaXZlbiBwb2ludCBpcyBpbnNpZGUgdGhpcyBlbGVtZW504oCZcyBzaGFwZVxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIHBvaW50IGluc2lkZSB0aGUgc2hhcGVcbiAgICBcXCovXG4gICAgZWxwcm90by5pc1BvaW50SW5zaWRlID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgdmFyIHJwID0gdGhpcy5yZWFsUGF0aCA9IGdldFBhdGhbdGhpcy50eXBlXSh0aGlzKTtcbiAgICAgICAgaWYgKHRoaXMuYXR0cigndHJhbnNmb3JtJykgJiYgdGhpcy5hdHRyKCd0cmFuc2Zvcm0nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJwID0gUi50cmFuc2Zvcm1QYXRoKHJwLCB0aGlzLmF0dHIoJ3RyYW5zZm9ybScpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUi5pc1BvaW50SW5zaWRlUGF0aChycCwgeCwgeSk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm4gYm91bmRpbmcgYm94IGZvciBhIGdpdmVuIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gaXNXaXRob3V0VHJhbnNmb3JtIChib29sZWFuKSBmbGFnLCBgdHJ1ZWAgaWYgeW91IHdhbnQgdG8gaGF2ZSBib3VuZGluZyBib3ggYmVmb3JlIHRyYW5zZm9ybWF0aW9ucy4gRGVmYXVsdCBpcyBgZmFsc2VgLlxuICAgICA9IChvYmplY3QpIEJvdW5kaW5nIGJveCBvYmplY3Q6XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB0b3AgbGVmdCBjb3JuZXIgeFxuICAgICBvICAgICB5OiAobnVtYmVyKSB0b3AgbGVmdCBjb3JuZXIgeVxuICAgICBvICAgICB4MjogKG51bWJlcikgYm90dG9tIHJpZ2h0IGNvcm5lciB4XG4gICAgIG8gICAgIHkyOiAobnVtYmVyKSBib3R0b20gcmlnaHQgY29ybmVyIHlcbiAgICAgbyAgICAgd2lkdGg6IChudW1iZXIpIHdpZHRoXG4gICAgIG8gICAgIGhlaWdodDogKG51bWJlcikgaGVpZ2h0XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldEJCb3ggPSBmdW5jdGlvbiAoaXNXaXRob3V0VHJhbnNmb3JtKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgXyA9IHRoaXMuXztcbiAgICAgICAgaWYgKGlzV2l0aG91dFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgaWYgKF8uZGlydHkgfHwgIV8uYmJveHd0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWFsUGF0aCA9IGdldFBhdGhbdGhpcy50eXBlXSh0aGlzKTtcbiAgICAgICAgICAgICAgICBfLmJib3h3dCA9IHBhdGhEaW1lbnNpb25zKHRoaXMucmVhbFBhdGgpO1xuICAgICAgICAgICAgICAgIF8uYmJveHd0LnRvU3RyaW5nID0geF95X3dfaDtcbiAgICAgICAgICAgICAgICBfLmRpcnR5ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfLmJib3h3dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXy5kaXJ0eSB8fCBfLmRpcnR5VCB8fCAhXy5iYm94KSB7XG4gICAgICAgICAgICBpZiAoXy5kaXJ0eSB8fCAhdGhpcy5yZWFsUGF0aCkge1xuICAgICAgICAgICAgICAgIF8uYmJveHd0ID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnJlYWxQYXRoID0gZ2V0UGF0aFt0aGlzLnR5cGVdKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXy5iYm94ID0gcGF0aERpbWVuc2lvbnMobWFwUGF0aCh0aGlzLnJlYWxQYXRoLCB0aGlzLm1hdHJpeCkpO1xuICAgICAgICAgICAgXy5iYm94LnRvU3RyaW5nID0geF95X3dfaDtcbiAgICAgICAgICAgIF8uZGlydHkgPSBfLmRpcnR5VCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF8uYmJveDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmNsb25lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBjbG9uZSBvZiBhIGdpdmVuIGVsZW1lbnRcbiAgICAgKipcbiAgICBcXCovXG4gICAgZWxwcm90by5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG91dCA9IHRoaXMucGFwZXJbdGhpcy50eXBlXSgpLmF0dHIodGhpcy5hdHRyKCkpO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lmdsb3dcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybiBzZXQgb2YgZWxlbWVudHMgdGhhdCBjcmVhdGUgZ2xvdy1saWtlIGVmZmVjdCBhcm91bmQgZ2l2ZW4gZWxlbWVudC4gU2VlIEBQYXBlci5zZXQuXG4gICAgICpcbiAgICAgKiBOb3RlOiBHbG93IGlzIG5vdCBjb25uZWN0ZWQgdG8gdGhlIGVsZW1lbnQuIElmIHlvdSBjaGFuZ2UgZWxlbWVudCBhdHRyaWJ1dGVzIGl0IHdvbuKAmXQgYWRqdXN0IGl0c2VsZi5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gZ2xvdyAob2JqZWN0KSAjb3B0aW9uYWwgcGFyYW1ldGVycyBvYmplY3Qgd2l0aCBhbGwgcHJvcGVydGllcyBvcHRpb25hbDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHdpZHRoIChudW1iZXIpIHNpemUgb2YgdGhlIGdsb3csIGRlZmF1bHQgaXMgYDEwYFxuICAgICBvICAgICBmaWxsIChib29sZWFuKSB3aWxsIGl0IGJlIGZpbGxlZCwgZGVmYXVsdCBpcyBgZmFsc2VgXG4gICAgIG8gICAgIG9wYWNpdHkgKG51bWJlcikgb3BhY2l0eSwgZGVmYXVsdCBpcyBgMC41YFxuICAgICBvICAgICBvZmZzZXR4IChudW1iZXIpIGhvcml6b250YWwgb2Zmc2V0LCBkZWZhdWx0IGlzIGAwYFxuICAgICBvICAgICBvZmZzZXR5IChudW1iZXIpIHZlcnRpY2FsIG9mZnNldCwgZGVmYXVsdCBpcyBgMGBcbiAgICAgbyAgICAgY29sb3IgKHN0cmluZykgZ2xvdyBjb2xvdXIsIGRlZmF1bHQgaXMgYGJsYWNrYFxuICAgICBvIH1cbiAgICAgPSAob2JqZWN0KSBAUGFwZXIuc2V0IG9mIGVsZW1lbnRzIHRoYXQgcmVwcmVzZW50cyBnbG93XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2xvdyA9IGZ1bmN0aW9uIChnbG93KSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGdsb3cgPSBnbG93IHx8IHt9O1xuICAgICAgICB2YXIgcyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiAoZ2xvdy53aWR0aCB8fCAxMCkgKyAoK3RoaXMuYXR0cihcInN0cm9rZS13aWR0aFwiKSB8fCAxKSxcbiAgICAgICAgICAgIGZpbGw6IGdsb3cuZmlsbCB8fCBmYWxzZSxcbiAgICAgICAgICAgIG9wYWNpdHk6IGdsb3cub3BhY2l0eSB8fCAuNSxcbiAgICAgICAgICAgIG9mZnNldHg6IGdsb3cub2Zmc2V0eCB8fCAwLFxuICAgICAgICAgICAgb2Zmc2V0eTogZ2xvdy5vZmZzZXR5IHx8IDAsXG4gICAgICAgICAgICBjb2xvcjogZ2xvdy5jb2xvciB8fCBcIiMwMDBcIlxuICAgICAgICB9LFxuICAgICAgICAgICAgYyA9IHMud2lkdGggLyAyLFxuICAgICAgICAgICAgciA9IHRoaXMucGFwZXIsXG4gICAgICAgICAgICBvdXQgPSByLnNldCgpLFxuICAgICAgICAgICAgcGF0aCA9IHRoaXMucmVhbFBhdGggfHwgZ2V0UGF0aFt0aGlzLnR5cGVdKHRoaXMpO1xuICAgICAgICBwYXRoID0gdGhpcy5tYXRyaXggPyBtYXBQYXRoKHBhdGgsIHRoaXMubWF0cml4KSA6IHBhdGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYyArIDE7IGkrKykge1xuICAgICAgICAgICAgb3V0LnB1c2goci5wYXRoKHBhdGgpLmF0dHIoe1xuICAgICAgICAgICAgICAgIHN0cm9rZTogcy5jb2xvcixcbiAgICAgICAgICAgICAgICBmaWxsOiBzLmZpbGwgPyBzLmNvbG9yIDogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgXCJzdHJva2UtbGluZWpvaW5cIjogXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgIFwic3Ryb2tlLWxpbmVjYXBcIjogXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgIFwic3Ryb2tlLXdpZHRoXCI6ICsocy53aWR0aCAvIGMgKiBpKS50b0ZpeGVkKDMpLFxuICAgICAgICAgICAgICAgIG9wYWNpdHk6ICsocy5vcGFjaXR5IC8gYykudG9GaXhlZCgzKVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQuaW5zZXJ0QmVmb3JlKHRoaXMpLnRyYW5zbGF0ZShzLm9mZnNldHgsIHMub2Zmc2V0eSk7XG4gICAgfTtcbiAgICB2YXIgY3VydmVzbGVuZ3RocyA9IHt9LFxuICAgIGdldFBvaW50QXRTZWdtZW50TGVuZ3RoID0gZnVuY3Rpb24gKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCBsZW5ndGgpIHtcbiAgICAgICAgaWYgKGxlbmd0aCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gYmV6bGVuKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBSLmZpbmREb3RzQXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCBnZXRUYXRMZW4ocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIGxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXRMZW5ndGhGYWN0b3J5ID0gZnVuY3Rpb24gKGlzdG90YWwsIHN1YnBhdGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwYXRoLCBsZW5ndGgsIG9ubHlzdGFydCkge1xuICAgICAgICAgICAgcGF0aCA9IHBhdGgyY3VydmUocGF0aCk7XG4gICAgICAgICAgICB2YXIgeCwgeSwgcCwgbCwgc3AgPSBcIlwiLCBzdWJwYXRocyA9IHt9LCBwb2ludCxcbiAgICAgICAgICAgICAgICBsZW4gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcCA9IHBhdGhbaV07XG4gICAgICAgICAgICAgICAgaWYgKHBbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICtwWzFdO1xuICAgICAgICAgICAgICAgICAgICB5ID0gK3BbMl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbCA9IGdldFBvaW50QXRTZWdtZW50TGVuZ3RoKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGVuICsgbCA+IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnBhdGggJiYgIXN1YnBhdGhzLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSBnZXRQb2ludEF0U2VnbWVudExlbmd0aCh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdLCBsZW5ndGggLSBsZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwICs9IFtcIkNcIiArIHBvaW50LnN0YXJ0LngsIHBvaW50LnN0YXJ0LnksIHBvaW50Lm0ueCwgcG9pbnQubS55LCBwb2ludC54LCBwb2ludC55XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seXN0YXJ0KSB7cmV0dXJuIHNwO31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJwYXRocy5zdGFydCA9IHNwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwID0gW1wiTVwiICsgcG9pbnQueCwgcG9pbnQueSArIFwiQ1wiICsgcG9pbnQubi54LCBwb2ludC5uLnksIHBvaW50LmVuZC54LCBwb2ludC5lbmQueSwgcFs1XSwgcFs2XV0uam9pbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbiArPSBsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSArcFs1XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gK3BbNl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzdG90YWwgJiYgIXN1YnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludCA9IGdldFBvaW50QXRTZWdtZW50TGVuZ3RoKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0sIGxlbmd0aCAtIGxlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHt4OiBwb2ludC54LCB5OiBwb2ludC55LCBhbHBoYTogcG9pbnQuYWxwaGF9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxlbiArPSBsO1xuICAgICAgICAgICAgICAgICAgICB4ID0gK3BbNV07XG4gICAgICAgICAgICAgICAgICAgIHkgPSArcFs2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3AgKz0gcC5zaGlmdCgpICsgcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1YnBhdGhzLmVuZCA9IHNwO1xuICAgICAgICAgICAgcG9pbnQgPSBpc3RvdGFsID8gbGVuIDogc3VicGF0aCA/IHN1YnBhdGhzIDogUi5maW5kRG90c0F0U2VnbWVudCh4LCB5LCBwWzBdLCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCAxKTtcbiAgICAgICAgICAgIHBvaW50LmFscGhhICYmIChwb2ludCA9IHt4OiBwb2ludC54LCB5OiBwb2ludC55LCBhbHBoYTogcG9pbnQuYWxwaGF9KTtcbiAgICAgICAgICAgIHJldHVybiBwb2ludDtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHZhciBnZXRUb3RhbExlbmd0aCA9IGdldExlbmd0aEZhY3RvcnkoMSksXG4gICAgICAgIGdldFBvaW50QXRMZW5ndGggPSBnZXRMZW5ndGhGYWN0b3J5KCksXG4gICAgICAgIGdldFN1YnBhdGhzQXRMZW5ndGggPSBnZXRMZW5ndGhGYWN0b3J5KDAsIDEpO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmdldFRvdGFsTGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGxlbmd0aCBvZiB0aGUgZ2l2ZW4gcGF0aCBpbiBwaXhlbHMuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHBhdGggKHN0cmluZykgU1ZHIHBhdGggc3RyaW5nLlxuICAgICAqKlxuICAgICA9IChudW1iZXIpIGxlbmd0aC5cbiAgICBcXCovXG4gICAgUi5nZXRUb3RhbExlbmd0aCA9IGdldFRvdGFsTGVuZ3RoO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybiBjb29yZGluYXRlcyBvZiB0aGUgcG9pbnQgbG9jYXRlZCBhdCB0aGUgZ2l2ZW4gbGVuZ3RoIG9uIHRoZSBnaXZlbiBwYXRoLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBwYXRoIChzdHJpbmcpIFNWRyBwYXRoIHN0cmluZ1xuICAgICAtIGxlbmd0aCAobnVtYmVyKVxuICAgICAqKlxuICAgICA9IChvYmplY3QpIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBwb2ludDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZVxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGVcbiAgICAgbyAgICAgYWxwaGE6IChudW1iZXIpIGFuZ2xlIG9mIGRlcml2YXRpdmVcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIuZ2V0UG9pbnRBdExlbmd0aCA9IGdldFBvaW50QXRMZW5ndGg7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZ2V0U3VicGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJuIHN1YnBhdGggb2YgYSBnaXZlbiBwYXRoIGZyb20gZ2l2ZW4gbGVuZ3RoIHRvIGdpdmVuIGxlbmd0aC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBTVkcgcGF0aCBzdHJpbmdcbiAgICAgLSBmcm9tIChudW1iZXIpIHBvc2l0aW9uIG9mIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudFxuICAgICAtIHRvIChudW1iZXIpIHBvc2l0aW9uIG9mIHRoZSBlbmQgb2YgdGhlIHNlZ21lbnRcbiAgICAgKipcbiAgICAgPSAoc3RyaW5nKSBwYXRoc3RyaW5nIGZvciB0aGUgc2VnbWVudFxuICAgIFxcKi9cbiAgICBSLmdldFN1YnBhdGggPSBmdW5jdGlvbiAocGF0aCwgZnJvbSwgdG8pIHtcbiAgICAgICAgaWYgKHRoaXMuZ2V0VG90YWxMZW5ndGgocGF0aCkgLSB0byA8IDFlLTYpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRTdWJwYXRoc0F0TGVuZ3RoKHBhdGgsIGZyb20pLmVuZDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYSA9IGdldFN1YnBhdGhzQXRMZW5ndGgocGF0aCwgdG8sIDEpO1xuICAgICAgICByZXR1cm4gZnJvbSA/IGdldFN1YnBhdGhzQXRMZW5ndGgoYSwgZnJvbSkuZW5kIDogYTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldFRvdGFsTGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGxlbmd0aCBvZiB0aGUgcGF0aCBpbiBwaXhlbHMuIE9ubHkgd29ya3MgZm9yIGVsZW1lbnQgb2Yg4oCccGF0aOKAnSB0eXBlLlxuICAgICA9IChudW1iZXIpIGxlbmd0aC5cbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRUb3RhbExlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGgoKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ub2RlLmdldFRvdGFsTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ub2RlLmdldFRvdGFsTGVuZ3RoKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0VG90YWxMZW5ndGgocGF0aCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRQb2ludEF0TGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm4gY29vcmRpbmF0ZXMgb2YgdGhlIHBvaW50IGxvY2F0ZWQgYXQgdGhlIGdpdmVuIGxlbmd0aCBvbiB0aGUgZ2l2ZW4gcGF0aC4gT25seSB3b3JrcyBmb3IgZWxlbWVudCBvZiDigJxwYXRo4oCdIHR5cGUuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGxlbmd0aCAobnVtYmVyKVxuICAgICAqKlxuICAgICA9IChvYmplY3QpIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBwb2ludDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZVxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGVcbiAgICAgbyAgICAgYWxwaGE6IChudW1iZXIpIGFuZ2xlIG9mIGRlcml2YXRpdmVcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0UG9pbnRBdExlbmd0aCA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGgoKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0UG9pbnRBdExlbmd0aChwYXRoLCBsZW5ndGgpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0UGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBwYXRoIG9mIHRoZSBlbGVtZW50LiBPbmx5IHdvcmtzIGZvciBlbGVtZW50cyBvZiDigJxwYXRo4oCdIHR5cGUgYW5kIHNpbXBsZSBlbGVtZW50cyBsaWtlIGNpcmNsZS5cbiAgICAgPSAob2JqZWN0KSBwYXRoXG4gICAgICoqXG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0UGF0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhdGgsXG4gICAgICAgICAgICBnZXRQYXRoID0gUi5fZ2V0UGF0aFt0aGlzLnR5cGVdO1xuXG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJ0ZXh0XCIgfHwgdGhpcy50eXBlID09IFwic2V0XCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnZXRQYXRoKSB7XG4gICAgICAgICAgICBwYXRoID0gZ2V0UGF0aCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0U3VicGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJuIHN1YnBhdGggb2YgYSBnaXZlbiBlbGVtZW50IGZyb20gZ2l2ZW4gbGVuZ3RoIHRvIGdpdmVuIGxlbmd0aC4gT25seSB3b3JrcyBmb3IgZWxlbWVudCBvZiDigJxwYXRo4oCdIHR5cGUuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGZyb20gKG51bWJlcikgcG9zaXRpb24gb2YgdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50XG4gICAgIC0gdG8gKG51bWJlcikgcG9zaXRpb24gb2YgdGhlIGVuZCBvZiB0aGUgc2VnbWVudFxuICAgICAqKlxuICAgICA9IChzdHJpbmcpIHBhdGhzdHJpbmcgZm9yIHRoZSBzZWdtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0U3VicGF0aCA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xuICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCgpO1xuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBSLmdldFN1YnBhdGgocGF0aCwgZnJvbSwgdG8pO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZWFzaW5nX2Zvcm11bGFzXG4gICAgIFsgcHJvcGVydHkgXVxuICAgICAqKlxuICAgICAqIE9iamVjdCB0aGF0IGNvbnRhaW5zIGVhc2luZyBmb3JtdWxhcyBmb3IgYW5pbWF0aW9uLiBZb3UgY291bGQgZXh0ZW5kIGl0IHdpdGggeW91ciBvd24uIEJ5IGRlZmF1bHQgaXQgaGFzIGZvbGxvd2luZyBsaXN0IG9mIGVhc2luZzpcbiAgICAgIyA8dWw+XG4gICAgICMgICAgIDxsaT7igJxsaW5lYXLigJ08L2xpPlxuICAgICAjICAgICA8bGk+4oCcJmx0O+KAnSBvciDigJxlYXNlSW7igJ0gb3Ig4oCcZWFzZS1pbuKAnTwvbGk+XG4gICAgICMgICAgIDxsaT7igJw+4oCdIG9yIOKAnGVhc2VPdXTigJ0gb3Ig4oCcZWFzZS1vdXTigJ08L2xpPlxuICAgICAjICAgICA8bGk+4oCcJmx0Oz7igJ0gb3Ig4oCcZWFzZUluT3V04oCdIG9yIOKAnGVhc2UtaW4tb3V04oCdPC9saT5cbiAgICAgIyAgICAgPGxpPuKAnGJhY2tJbuKAnSBvciDigJxiYWNrLWlu4oCdPC9saT5cbiAgICAgIyAgICAgPGxpPuKAnGJhY2tPdXTigJ0gb3Ig4oCcYmFjay1vdXTigJ08L2xpPlxuICAgICAjICAgICA8bGk+4oCcZWxhc3RpY+KAnTwvbGk+XG4gICAgICMgICAgIDxsaT7igJxib3VuY2XigJ08L2xpPlxuICAgICAjIDwvdWw+XG4gICAgICMgPHA+U2VlIGFsc28gPGEgaHJlZj1cImh0dHA6Ly9yYXBoYWVsanMuY29tL2Vhc2luZy5odG1sXCI+RWFzaW5nIGRlbW88L2E+LjwvcD5cbiAgICBcXCovXG4gICAgdmFyIGVmID0gUi5lYXNpbmdfZm9ybXVsYXMgPSB7XG4gICAgICAgIGxpbmVhcjogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICB9LFxuICAgICAgICBcIjxcIjogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHJldHVybiBwb3cobiwgMS43KTtcbiAgICAgICAgfSxcbiAgICAgICAgXCI+XCI6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICByZXR1cm4gcG93KG4sIC40OCk7XG4gICAgICAgIH0sXG4gICAgICAgIFwiPD5cIjogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHZhciBxID0gLjQ4IC0gbiAvIDEuMDQsXG4gICAgICAgICAgICAgICAgUSA9IG1hdGguc3FydCguMTczNCArIHEgKiBxKSxcbiAgICAgICAgICAgICAgICB4ID0gUSAtIHEsXG4gICAgICAgICAgICAgICAgWCA9IHBvdyhhYnMoeCksIDEgLyAzKSAqICh4IDwgMCA/IC0xIDogMSksXG4gICAgICAgICAgICAgICAgeSA9IC1RIC0gcSxcbiAgICAgICAgICAgICAgICBZID0gcG93KGFicyh5KSwgMSAvIDMpICogKHkgPCAwID8gLTEgOiAxKSxcbiAgICAgICAgICAgICAgICB0ID0gWCArIFkgKyAuNTtcbiAgICAgICAgICAgIHJldHVybiAoMSAtIHQpICogMyAqIHQgKiB0ICsgdCAqIHQgKiB0O1xuICAgICAgICB9LFxuICAgICAgICBiYWNrSW46IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICAgICAgICByZXR1cm4gbiAqIG4gKiAoKHMgKyAxKSAqIG4gLSBzKTtcbiAgICAgICAgfSxcbiAgICAgICAgYmFja091dDogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIG4gPSBuIC0gMTtcbiAgICAgICAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgICAgICAgIHJldHVybiBuICogbiAqICgocyArIDEpICogbiArIHMpICsgMTtcbiAgICAgICAgfSxcbiAgICAgICAgZWxhc3RpYzogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIGlmIChuID09ICEhbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBvdygyLCAtMTAgKiBuKSAqIG1hdGguc2luKChuIC0gLjA3NSkgKiAoMiAqIFBJKSAvIC4zKSArIDE7XG4gICAgICAgIH0sXG4gICAgICAgIGJvdW5jZTogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHZhciBzID0gNy41NjI1LFxuICAgICAgICAgICAgICAgIHAgPSAyLjc1LFxuICAgICAgICAgICAgICAgIGw7XG4gICAgICAgICAgICBpZiAobiA8ICgxIC8gcCkpIHtcbiAgICAgICAgICAgICAgICBsID0gcyAqIG4gKiBuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobiA8ICgyIC8gcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbiAtPSAoMS41IC8gcCk7XG4gICAgICAgICAgICAgICAgICAgIGwgPSBzICogbiAqIG4gKyAuNzU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG4gPCAoMi41IC8gcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gLT0gKDIuMjUgLyBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBzICogbiAqIG4gKyAuOTM3NTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gLT0gKDIuNjI1IC8gcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsID0gcyAqIG4gKiBuICsgLjk4NDM3NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBlZi5lYXNlSW4gPSBlZltcImVhc2UtaW5cIl0gPSBlZltcIjxcIl07XG4gICAgZWYuZWFzZU91dCA9IGVmW1wiZWFzZS1vdXRcIl0gPSBlZltcIj5cIl07XG4gICAgZWYuZWFzZUluT3V0ID0gZWZbXCJlYXNlLWluLW91dFwiXSA9IGVmW1wiPD5cIl07XG4gICAgZWZbXCJiYWNrLWluXCJdID0gZWYuYmFja0luO1xuICAgIGVmW1wiYmFjay1vdXRcIl0gPSBlZi5iYWNrT3V0O1xuXG4gICAgdmFyIGFuaW1hdGlvbkVsZW1lbnRzID0gW10sXG4gICAgICAgIHJlcXVlc3RBbmltRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICBhbmltYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgTm93ID0gK25ldyBEYXRlLFxuICAgICAgICAgICAgICAgIGwgPSAwO1xuICAgICAgICAgICAgZm9yICg7IGwgPCBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7IGwrKykge1xuICAgICAgICAgICAgICAgIHZhciBlID0gYW5pbWF0aW9uRWxlbWVudHNbbF07XG4gICAgICAgICAgICAgICAgaWYgKGUuZWwucmVtb3ZlZCB8fCBlLnBhdXNlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRpbWUgPSBOb3cgLSBlLnN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICBtcyA9IGUubXMsXG4gICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IGUuZWFzaW5nLFxuICAgICAgICAgICAgICAgICAgICBmcm9tID0gZS5mcm9tLFxuICAgICAgICAgICAgICAgICAgICBkaWZmID0gZS5kaWZmLFxuICAgICAgICAgICAgICAgICAgICB0byA9IGUudG8sXG4gICAgICAgICAgICAgICAgICAgIHQgPSBlLnQsXG4gICAgICAgICAgICAgICAgICAgIHRoYXQgPSBlLmVsLFxuICAgICAgICAgICAgICAgICAgICBzZXQgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgbm93LFxuICAgICAgICAgICAgICAgICAgICBpbml0ID0ge30sXG4gICAgICAgICAgICAgICAgICAgIGtleTtcbiAgICAgICAgICAgICAgICBpZiAoZS5pbml0c3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWUgPSAoZS5pbml0c3RhdHVzICogZS5hbmltLnRvcCAtIGUucHJldikgLyAoZS5wZXJjZW50IC0gZS5wcmV2KSAqIG1zO1xuICAgICAgICAgICAgICAgICAgICBlLnN0YXR1cyA9IGUuaW5pdHN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGUuaW5pdHN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wICYmIGFuaW1hdGlvbkVsZW1lbnRzLnNwbGljZShsLS0sIDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RhdHVzID0gKGUucHJldiArIChlLnBlcmNlbnQgLSBlLnByZXYpICogKHRpbWUgLyBtcykpIC8gZS5hbmltLnRvcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGltZSA8IG1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBlYXNpbmcodGltZSAvIG1zKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBmcm9tKSBpZiAoZnJvbVtoYXNdKGF0dHIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGF2YWlsYWJsZUFuaW1BdHRyc1thdHRyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgbnU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9ICtmcm9tW2F0dHJdICsgcG9zICogbXMgKiBkaWZmW2F0dHJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY29sb3VyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IFwicmdiKFwiICsgW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXB0bzI1NShyb3VuZChmcm9tW2F0dHJdLnIgKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl0ucikpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXB0bzI1NShyb3VuZChmcm9tW2F0dHJdLmcgKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl0uZykpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXB0bzI1NShyb3VuZChmcm9tW2F0dHJdLmIgKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl0uYikpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0uam9pbihcIixcIikgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInBhdGhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGZyb21bYXR0cl0ubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93W2ldID0gW2Zyb21bYXR0cl1baV1bMF1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDEsIGpqID0gZnJvbVthdHRyXVtpXS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93W2ldW2pdID0gK2Zyb21bYXR0cl1baV1bal0gKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl1baV1bal07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3dbaV0gPSBub3dbaV0uam9pbihTKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSBub3cuam9pbihTKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYW5zZm9ybVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGlmZlthdHRyXS5yZWFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gZnJvbVthdHRyXS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93W2ldID0gW2Zyb21bYXR0cl1baV1bMF1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGpqID0gZnJvbVthdHRyXVtpXS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vd1tpXVtqXSA9IGZyb21bYXR0cl1baV1bal0gKyBwb3MgKiBtcyAqIGRpZmZbYXR0cl1baV1bal07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdldCA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICtmcm9tW2F0dHJdW2ldICsgcG9zICogbXMgKiBkaWZmW2F0dHJdW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdyA9IFtbXCJyXCIsIGdldCgyKSwgMCwgMF0sIFtcInRcIiwgZ2V0KDMpLCBnZXQoNCldLCBbXCJzXCIsIGdldCgwKSwgZ2V0KDEpLCAwLCAwXV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSBbW1wibVwiLCBnZXQoMCksIGdldCgxKSwgZ2V0KDIpLCBnZXQoMyksIGdldCg0KSwgZ2V0KDUpXV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNzdlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ciA9PSBcImNsaXAtcmVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vd1tpXSA9ICtmcm9tW2F0dHJdW2ldICsgcG9zICogbXMgKiBkaWZmW2F0dHJdW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmcm9tMiA9IFtdW2NvbmNhdF0oZnJvbVthdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gdGhhdC5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2F0dHJdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93W2ldID0gK2Zyb20yW2ldICsgcG9zICogbXMgKiBkaWZmW2F0dHJdW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0W2F0dHJdID0gbm93O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYXR0cihzZXQpO1xuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKGlkLCB0aGF0LCBhbmltKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmUoXCJyYXBoYWVsLmFuaW0uZnJhbWUuXCIgKyBpZCwgdGhhdCwgYW5pbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkodGhhdC5pZCwgdGhhdCwgZS5hbmltKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24oZiwgZWwsIGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5hbmltLmZyYW1lLlwiICsgZWwuaWQsIGVsLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmUoXCJyYXBoYWVsLmFuaW0uZmluaXNoLlwiICsgZWwuaWQsIGVsLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSLmlzKGYsIFwiZnVuY3Rpb25cIikgJiYgZi5jYWxsKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KShlLmNhbGxiYWNrLCB0aGF0LCBlLmFuaW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmF0dHIodG8pO1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25FbGVtZW50cy5zcGxpY2UobC0tLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUucmVwZWF0ID4gMSAmJiAhZS5uZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiB0bykgaWYgKHRvW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRba2V5XSA9IGUudG90YWxPcmlnaW5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGUuZWwuYXR0cihpbml0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bkFuaW1hdGlvbihlLmFuaW0sIGUuZWwsIGUuYW5pbS5wZXJjZW50c1swXSwgbnVsbCwgZS50b3RhbE9yaWdpbiwgZS5yZXBlYXQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZS5uZXh0ICYmICFlLnN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bkFuaW1hdGlvbihlLmFuaW0sIGUuZWwsIGUubmV4dCwgbnVsbCwgZS50b3RhbE9yaWdpbiwgZS5yZXBlYXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgUi5zdmcgJiYgdGhhdCAmJiB0aGF0LnBhcGVyICYmIHRoYXQucGFwZXIuc2FmYXJpKCk7XG4gICAgICAgICAgICBhbmltYXRpb25FbGVtZW50cy5sZW5ndGggJiYgcmVxdWVzdEFuaW1GcmFtZShhbmltYXRpb24pO1xuICAgICAgICB9LFxuICAgICAgICB1cHRvMjU1ID0gZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sb3IgPiAyNTUgPyAyNTUgOiBjb2xvciA8IDAgPyAwIDogY29sb3I7XG4gICAgICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYW5pbWF0ZVdpdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFjdHMgc2ltaWxhciB0byBARWxlbWVudC5hbmltYXRlLCBidXQgZW5zdXJlIHRoYXQgZ2l2ZW4gYW5pbWF0aW9uIHJ1bnMgaW4gc3luYyB3aXRoIGFub3RoZXIgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gZWwgKG9iamVjdCkgZWxlbWVudCB0byBzeW5jIHdpdGhcbiAgICAgLSBhbmltIChvYmplY3QpIGFuaW1hdGlvbiB0byBzeW5jIHdpdGhcbiAgICAgLSBwYXJhbXMgKG9iamVjdCkgI29wdGlvbmFsIGZpbmFsIGF0dHJpYnV0ZXMgZm9yIHRoZSBlbGVtZW50LCBzZWUgYWxzbyBARWxlbWVudC5hdHRyXG4gICAgIC0gbXMgKG51bWJlcikgI29wdGlvbmFsIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZm9yIGFuaW1hdGlvbiB0byBydW5cbiAgICAgLSBlYXNpbmcgKHN0cmluZykgI29wdGlvbmFsIGVhc2luZyB0eXBlLiBBY2NlcHQgb24gb2YgQFJhcGhhZWwuZWFzaW5nX2Zvcm11bGFzIG9yIENTUyBmb3JtYXQ6IGBjdWJpYyYjeDIwMTA7YmV6aWVyKFhYLCYjMTYwO1hYLCYjMTYwO1hYLCYjMTYwO1hYKWBcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgYXQgdGhlIGVuZCBvZiBhbmltYXRpb24uXG4gICAgICogb3JcbiAgICAgLSBlbGVtZW50IChvYmplY3QpIGVsZW1lbnQgdG8gc3luYyB3aXRoXG4gICAgIC0gYW5pbSAob2JqZWN0KSBhbmltYXRpb24gdG8gc3luYyB3aXRoXG4gICAgIC0gYW5pbWF0aW9uIChvYmplY3QpICNvcHRpb25hbCBhbmltYXRpb24gb2JqZWN0LCBzZWUgQFJhcGhhZWwuYW5pbWF0aW9uXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFuaW1hdGVXaXRoID0gZnVuY3Rpb24gKGVsLCBhbmltLCBwYXJhbXMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gdGhpcztcbiAgICAgICAgaWYgKGVsZW1lbnQucmVtb3ZlZCkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2suY2FsbChlbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIHZhciBhID0gcGFyYW1zIGluc3RhbmNlb2YgQW5pbWF0aW9uID8gcGFyYW1zIDogUi5hbmltYXRpb24ocGFyYW1zLCBtcywgZWFzaW5nLCBjYWxsYmFjayksXG4gICAgICAgICAgICB4LCB5O1xuICAgICAgICBydW5BbmltYXRpb24oYSwgZWxlbWVudCwgYS5wZXJjZW50c1swXSwgbnVsbCwgZWxlbWVudC5hdHRyKCkpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uRWxlbWVudHNbaV0uYW5pbSA9PSBhbmltICYmIGFuaW1hdGlvbkVsZW1lbnRzW2ldLmVsID09IGVsKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHNbaWkgLSAxXS5zdGFydCA9IGFuaW1hdGlvbkVsZW1lbnRzW2ldLnN0YXJ0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICAvL1xuICAgICAgICAvL1xuICAgICAgICAvLyB2YXIgYSA9IHBhcmFtcyA/IFIuYW5pbWF0aW9uKHBhcmFtcywgbXMsIGVhc2luZywgY2FsbGJhY2spIDogYW5pbSxcbiAgICAgICAgLy8gICAgIHN0YXR1cyA9IGVsZW1lbnQuc3RhdHVzKGFuaW0pO1xuICAgICAgICAvLyByZXR1cm4gdGhpcy5hbmltYXRlKGEpLnN0YXR1cyhhLCBzdGF0dXMgKiBhbmltLm1zIC8gYS5tcyk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBDdWJpY0JlemllckF0VGltZSh0LCBwMXgsIHAxeSwgcDJ4LCBwMnksIGR1cmF0aW9uKSB7XG4gICAgICAgIHZhciBjeCA9IDMgKiBwMXgsXG4gICAgICAgICAgICBieCA9IDMgKiAocDJ4IC0gcDF4KSAtIGN4LFxuICAgICAgICAgICAgYXggPSAxIC0gY3ggLSBieCxcbiAgICAgICAgICAgIGN5ID0gMyAqIHAxeSxcbiAgICAgICAgICAgIGJ5ID0gMyAqIChwMnkgLSBwMXkpIC0gY3ksXG4gICAgICAgICAgICBheSA9IDEgLSBjeSAtIGJ5O1xuICAgICAgICBmdW5jdGlvbiBzYW1wbGVDdXJ2ZVgodCkge1xuICAgICAgICAgICAgcmV0dXJuICgoYXggKiB0ICsgYngpICogdCArIGN4KSAqIHQ7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc29sdmUoeCwgZXBzaWxvbikge1xuICAgICAgICAgICAgdmFyIHQgPSBzb2x2ZUN1cnZlWCh4LCBlcHNpbG9uKTtcbiAgICAgICAgICAgIHJldHVybiAoKGF5ICogdCArIGJ5KSAqIHQgKyBjeSkgKiB0O1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHNvbHZlQ3VydmVYKHgsIGVwc2lsb24pIHtcbiAgICAgICAgICAgIHZhciB0MCwgdDEsIHQyLCB4MiwgZDIsIGk7XG4gICAgICAgICAgICBmb3IodDIgPSB4LCBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgICAgICAgICAgIHgyID0gc2FtcGxlQ3VydmVYKHQyKSAtIHg7XG4gICAgICAgICAgICAgICAgaWYgKGFicyh4MikgPCBlcHNpbG9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0MjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZDIgPSAoMyAqIGF4ICogdDIgKyAyICogYngpICogdDIgKyBjeDtcbiAgICAgICAgICAgICAgICBpZiAoYWJzKGQyKSA8IDFlLTYpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHQyID0gdDIgLSB4MiAvIGQyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdDAgPSAwO1xuICAgICAgICAgICAgdDEgPSAxO1xuICAgICAgICAgICAgdDIgPSB4O1xuICAgICAgICAgICAgaWYgKHQyIDwgdDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodDIgPiB0MSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0MTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlICh0MCA8IHQxKSB7XG4gICAgICAgICAgICAgICAgeDIgPSBzYW1wbGVDdXJ2ZVgodDIpO1xuICAgICAgICAgICAgICAgIGlmIChhYnMoeDIgLSB4KSA8IGVwc2lsb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoeCA+IHgyKSB7XG4gICAgICAgICAgICAgICAgICAgIHQwID0gdDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdDEgPSB0MjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdDIgPSAodDEgLSB0MCkgLyAyICsgdDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdDI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNvbHZlKHQsIDEgLyAoMjAwICogZHVyYXRpb24pKTtcbiAgICB9XG4gICAgZWxwcm90by5vbkFuaW1hdGlvbiA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGYgPyBldmUub24oXCJyYXBoYWVsLmFuaW0uZnJhbWUuXCIgKyB0aGlzLmlkLCBmKSA6IGV2ZS51bmJpbmQoXCJyYXBoYWVsLmFuaW0uZnJhbWUuXCIgKyB0aGlzLmlkKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBBbmltYXRpb24oYW5pbSwgbXMpIHtcbiAgICAgICAgdmFyIHBlcmNlbnRzID0gW10sXG4gICAgICAgICAgICBuZXdBbmltID0ge307XG4gICAgICAgIHRoaXMubXMgPSBtcztcbiAgICAgICAgdGhpcy50aW1lcyA9IDE7XG4gICAgICAgIGlmIChhbmltKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBhdHRyIGluIGFuaW0pIGlmIChhbmltW2hhc10oYXR0cikpIHtcbiAgICAgICAgICAgICAgICBuZXdBbmltW3RvRmxvYXQoYXR0cildID0gYW5pbVthdHRyXTtcbiAgICAgICAgICAgICAgICBwZXJjZW50cy5wdXNoKHRvRmxvYXQoYXR0cikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGVyY2VudHMuc29ydChzb3J0QnlOdW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYW5pbSA9IG5ld0FuaW07XG4gICAgICAgIHRoaXMudG9wID0gcGVyY2VudHNbcGVyY2VudHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHRoaXMucGVyY2VudHMgPSBwZXJjZW50cztcbiAgICB9XG4gICAgLypcXFxuICAgICAqIEFuaW1hdGlvbi5kZWxheVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGNvcHkgb2YgZXhpc3RpbmcgYW5pbWF0aW9uIG9iamVjdCB3aXRoIGdpdmVuIGRlbGF5LlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBkZWxheSAobnVtYmVyKSBudW1iZXIgb2YgbXMgdG8gcGFzcyBiZXR3ZWVuIGFuaW1hdGlvbiBzdGFydCBhbmQgYWN0dWFsIGFuaW1hdGlvblxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG5ldyBhbHRlcmVkIEFuaW1hdGlvbiBvYmplY3RcbiAgICAgfCB2YXIgYW5pbSA9IFJhcGhhZWwuYW5pbWF0aW9uKHtjeDogMTAsIGN5OiAyMH0sIDJlMyk7XG4gICAgIHwgY2lyY2xlMS5hbmltYXRlKGFuaW0pOyAvLyBydW4gdGhlIGdpdmVuIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxuICAgICB8IGNpcmNsZTIuYW5pbWF0ZShhbmltLmRlbGF5KDUwMCkpOyAvLyBydW4gdGhlIGdpdmVuIGFuaW1hdGlvbiBhZnRlciA1MDAgbXNcbiAgICBcXCovXG4gICAgQW5pbWF0aW9uLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uIChkZWxheSkge1xuICAgICAgICB2YXIgYSA9IG5ldyBBbmltYXRpb24odGhpcy5hbmltLCB0aGlzLm1zKTtcbiAgICAgICAgYS50aW1lcyA9IHRoaXMudGltZXM7XG4gICAgICAgIGEuZGVsID0gK2RlbGF5IHx8IDA7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEFuaW1hdGlvbi5yZXBlYXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBjb3B5IG9mIGV4aXN0aW5nIGFuaW1hdGlvbiBvYmplY3Qgd2l0aCBnaXZlbiByZXBldGl0aW9uLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSByZXBlYXQgKG51bWJlcikgbnVtYmVyIGl0ZXJhdGlvbnMgb2YgYW5pbWF0aW9uLiBGb3IgaW5maW5pdGUgYW5pbWF0aW9uIHBhc3MgYEluZmluaXR5YFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG5ldyBhbHRlcmVkIEFuaW1hdGlvbiBvYmplY3RcbiAgICBcXCovXG4gICAgQW5pbWF0aW9uLnByb3RvdHlwZS5yZXBlYXQgPSBmdW5jdGlvbiAodGltZXMpIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgQW5pbWF0aW9uKHRoaXMuYW5pbSwgdGhpcy5tcyk7XG4gICAgICAgIGEuZGVsID0gdGhpcy5kZWw7XG4gICAgICAgIGEudGltZXMgPSBtYXRoLmZsb29yKG1tYXgodGltZXMsIDApKSB8fCAxO1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHJ1bkFuaW1hdGlvbihhbmltLCBlbGVtZW50LCBwZXJjZW50LCBzdGF0dXMsIHRvdGFsT3JpZ2luLCB0aW1lcykge1xuICAgICAgICBwZXJjZW50ID0gdG9GbG9hdChwZXJjZW50KTtcbiAgICAgICAgdmFyIHBhcmFtcyxcbiAgICAgICAgICAgIGlzSW5BbmltLFxuICAgICAgICAgICAgaXNJbkFuaW1TZXQsXG4gICAgICAgICAgICBwZXJjZW50cyA9IFtdLFxuICAgICAgICAgICAgbmV4dCxcbiAgICAgICAgICAgIHByZXYsXG4gICAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgICBtcyA9IGFuaW0ubXMsXG4gICAgICAgICAgICBmcm9tID0ge30sXG4gICAgICAgICAgICB0byA9IHt9LFxuICAgICAgICAgICAgZGlmZiA9IHt9O1xuICAgICAgICBpZiAoc3RhdHVzKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGFuaW1hdGlvbkVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChlLmVsLmlkID09IGVsZW1lbnQuaWQgJiYgZS5hbmltID09IGFuaW0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUucGVyY2VudCAhPSBwZXJjZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25FbGVtZW50cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0luQW5pbVNldCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0luQW5pbSA9IGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hdHRyKGUudG90YWxPcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0dXMgPSArdG87IC8vIE5hTlxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFuaW0ucGVyY2VudHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFuaW0ucGVyY2VudHNbaV0gPT0gcGVyY2VudCB8fCBhbmltLnBlcmNlbnRzW2ldID4gc3RhdHVzICogYW5pbS50b3ApIHtcbiAgICAgICAgICAgICAgICBwZXJjZW50ID0gYW5pbS5wZXJjZW50c1tpXTtcbiAgICAgICAgICAgICAgICBwcmV2ID0gYW5pbS5wZXJjZW50c1tpIC0gMV0gfHwgMDtcbiAgICAgICAgICAgICAgICBtcyA9IG1zIC8gYW5pbS50b3AgKiAocGVyY2VudCAtIHByZXYpO1xuICAgICAgICAgICAgICAgIG5leHQgPSBhbmltLnBlcmNlbnRzW2kgKyAxXTtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBhbmltLmFuaW1bcGVyY2VudF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuYXR0cihhbmltLmFuaW1bYW5pbS5wZXJjZW50c1tpXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghcGFyYW1zKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0luQW5pbSkge1xuICAgICAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBwYXJhbXMpIGlmIChwYXJhbXNbaGFzXShhdHRyKSkge1xuICAgICAgICAgICAgICAgIGlmIChhdmFpbGFibGVBbmltQXR0cnNbaGFzXShhdHRyKSB8fCBlbGVtZW50LnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbaGFzXShhdHRyKSkge1xuICAgICAgICAgICAgICAgICAgICBmcm9tW2F0dHJdID0gZWxlbWVudC5hdHRyKGF0dHIpO1xuICAgICAgICAgICAgICAgICAgICAoZnJvbVthdHRyXSA9PSBudWxsKSAmJiAoZnJvbVthdHRyXSA9IGF2YWlsYWJsZUF0dHJzW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgdG9bYXR0cl0gPSBwYXJhbXNbYXR0cl07XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYXZhaWxhYmxlQW5pbUF0dHJzW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIG51OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0gPSAodG9bYXR0cl0gLSBmcm9tW2F0dHJdKSAvIG1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNvbG91clwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21bYXR0cl0gPSBSLmdldFJHQihmcm9tW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG9Db2xvdXIgPSBSLmdldFJHQih0b1thdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcjogKHRvQ29sb3VyLnIgLSBmcm9tW2F0dHJdLnIpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGc6ICh0b0NvbG91ci5nIC0gZnJvbVthdHRyXS5nKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiOiAodG9Db2xvdXIuYiAtIGZyb21bYXR0cl0uYikgLyBtc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicGF0aFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXRoZXMgPSBwYXRoMmN1cnZlKGZyb21bYXR0cl0sIHRvW2F0dHJdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9QYXRoID0gcGF0aGVzWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21bYXR0cl0gPSBwYXRoZXNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gZnJvbVthdHRyXS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl1baV0gPSBbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxLCBqaiA9IGZyb21bYXR0cl1baV0ubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXVtpXVtqXSA9ICh0b1BhdGhbaV1bal0gLSBmcm9tW2F0dHJdW2ldW2pdKSAvIG1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYW5zZm9ybVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfID0gZWxlbWVudC5fLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcSA9IGVxdWFsaXNlVHJhbnNmb3JtKF9bYXR0cl0sIHRvW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbVthdHRyXSA9IGVxLmZyb207XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvW2F0dHJdID0gZXEudG87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXS5yZWFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBmcm9tW2F0dHJdLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl1baV0gPSBbZnJvbVthdHRyXVtpXVswXV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBqaiA9IGZyb21bYXR0cl1baV0ubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl1baV1bal0gPSAodG9bYXR0cl1baV1bal0gLSBmcm9tW2F0dHJdW2ldW2pdKSAvIG1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG0gPSAoZWxlbWVudC5tYXRyaXggfHwgbmV3IE1hdHJpeCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bzIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXzoge3RyYW5zZm9ybTogXy50cmFuc2Zvcm19LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEJCb3g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQuZ2V0QkJveCgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tW2F0dHJdID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5hLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5iLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5mXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RUcmFuc2Zvcm0odG8yLCB0b1thdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvW2F0dHJdID0gdG8yLl8udHJhbnNmb3JtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRvMi5tYXRyaXguYSAtIG0uYSkgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0bzIubWF0cml4LmIgLSBtLmIpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG8yLm1hdHJpeC5jIC0gbS5jKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRvMi5tYXRyaXguZCAtIG0uZCkgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0bzIubWF0cml4LmUgLSBtLmUpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG8yLm1hdHJpeC5mIC0gbS5mKSAvIG1zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZyb21bYXR0cl0gPSBbXy5zeCwgXy5zeSwgXy5kZWcsIF8uZHgsIF8uZHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2YXIgdG8yID0ge186e30sIGdldEJCb3g6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVsZW1lbnQuZ2V0QkJveCgpOyB9fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXh0cmFjdFRyYW5zZm9ybSh0bzIsIHRvW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlmZlthdHRyXSA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICh0bzIuXy5zeCAtIF8uc3gpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAodG8yLl8uc3kgLSBfLnN5KSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgKHRvMi5fLmRlZyAtIF8uZGVnKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgKHRvMi5fLmR4IC0gXy5keCkgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICh0bzIuXy5keSAtIF8uZHkpIC8gbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY3N2XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFN0cihwYXJhbXNbYXR0cl0pW3NwbGl0XShzZXBhcmF0b3IpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tMiA9IFN0cihmcm9tW2F0dHJdKVtzcGxpdF0oc2VwYXJhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ciA9PSBcImNsaXAtcmVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21bYXR0cl0gPSBmcm9tMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gZnJvbTIubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdW2ldID0gKHZhbHVlc1tpXSAtIGZyb21bYXR0cl1baV0pIC8gbXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9bYXR0cl0gPSB2YWx1ZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtdW2NvbmNhdF0ocGFyYW1zW2F0dHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tMiA9IFtdW2NvbmNhdF0oZnJvbVthdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBlbGVtZW50LnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbYXR0cl0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXVtpXSA9ICgodmFsdWVzW2ldIHx8IDApIC0gKGZyb20yW2ldIHx8IDApKSAvIG1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBlYXNpbmcgPSBwYXJhbXMuZWFzaW5nLFxuICAgICAgICAgICAgICAgIGVhc3llYXN5ID0gUi5lYXNpbmdfZm9ybXVsYXNbZWFzaW5nXTtcbiAgICAgICAgICAgIGlmICghZWFzeWVhc3kpIHtcbiAgICAgICAgICAgICAgICBlYXN5ZWFzeSA9IFN0cihlYXNpbmcpLm1hdGNoKGJlemllcnJnKTtcbiAgICAgICAgICAgICAgICBpZiAoZWFzeWVhc3kgJiYgZWFzeWVhc3kubGVuZ3RoID09IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnZlID0gZWFzeWVhc3k7XG4gICAgICAgICAgICAgICAgICAgIGVhc3llYXN5ID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBDdWJpY0JlemllckF0VGltZSh0LCArY3VydmVbMV0sICtjdXJ2ZVsyXSwgK2N1cnZlWzNdLCArY3VydmVbNF0sIG1zKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlYXN5ZWFzeSA9IHBpcGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGltZXN0YW1wID0gcGFyYW1zLnN0YXJ0IHx8IGFuaW0uc3RhcnQgfHwgK25ldyBEYXRlO1xuICAgICAgICAgICAgZSA9IHtcbiAgICAgICAgICAgICAgICBhbmltOiBhbmltLFxuICAgICAgICAgICAgICAgIHBlcmNlbnQ6IHBlcmNlbnQsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wOiB0aW1lc3RhbXAsXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHRpbWVzdGFtcCArIChhbmltLmRlbCB8fCAwKSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IDAsXG4gICAgICAgICAgICAgICAgaW5pdHN0YXR1czogc3RhdHVzIHx8IDAsXG4gICAgICAgICAgICAgICAgc3RvcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgbXM6IG1zLFxuICAgICAgICAgICAgICAgIGVhc2luZzogZWFzeWVhc3ksXG4gICAgICAgICAgICAgICAgZnJvbTogZnJvbSxcbiAgICAgICAgICAgICAgICBkaWZmOiBkaWZmLFxuICAgICAgICAgICAgICAgIHRvOiB0byxcbiAgICAgICAgICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogcGFyYW1zLmNhbGxiYWNrLFxuICAgICAgICAgICAgICAgIHByZXY6IHByZXYsXG4gICAgICAgICAgICAgICAgbmV4dDogbmV4dCxcbiAgICAgICAgICAgICAgICByZXBlYXQ6IHRpbWVzIHx8IGFuaW0udGltZXMsXG4gICAgICAgICAgICAgICAgb3JpZ2luOiBlbGVtZW50LmF0dHIoKSxcbiAgICAgICAgICAgICAgICB0b3RhbE9yaWdpbjogdG90YWxPcmlnaW5cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhbmltYXRpb25FbGVtZW50cy5wdXNoKGUpO1xuICAgICAgICAgICAgaWYgKHN0YXR1cyAmJiAhaXNJbkFuaW0gJiYgIWlzSW5BbmltU2V0KSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBlLnN0YXJ0ID0gbmV3IERhdGUgLSBtcyAqIHN0YXR1cztcbiAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc0luQW5pbVNldCkge1xuICAgICAgICAgICAgICAgIGUuc3RhcnQgPSBuZXcgRGF0ZSAtIGUubXMgKiBzdGF0dXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhbmltYXRpb25FbGVtZW50cy5sZW5ndGggPT0gMSAmJiByZXF1ZXN0QW5pbUZyYW1lKGFuaW1hdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpc0luQW5pbS5pbml0c3RhdHVzID0gc3RhdHVzO1xuICAgICAgICAgICAgaXNJbkFuaW0uc3RhcnQgPSBuZXcgRGF0ZSAtIGlzSW5BbmltLm1zICogc3RhdHVzO1xuICAgICAgICB9XG4gICAgICAgIGV2ZShcInJhcGhhZWwuYW5pbS5zdGFydC5cIiArIGVsZW1lbnQuaWQsIGVsZW1lbnQsIGFuaW0pO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5hbmltYXRpb25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYW4gYW5pbWF0aW9uIG9iamVjdCB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIEBFbGVtZW50LmFuaW1hdGUgb3IgQEVsZW1lbnQuYW5pbWF0ZVdpdGggbWV0aG9kcy5cbiAgICAgKiBTZWUgYWxzbyBAQW5pbWF0aW9uLmRlbGF5IGFuZCBAQW5pbWF0aW9uLnJlcGVhdCBtZXRob2RzLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBwYXJhbXMgKG9iamVjdCkgZmluYWwgYXR0cmlidXRlcyBmb3IgdGhlIGVsZW1lbnQsIHNlZSBhbHNvIEBFbGVtZW50LmF0dHJcbiAgICAgLSBtcyAobnVtYmVyKSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGZvciBhbmltYXRpb24gdG8gcnVuXG4gICAgIC0gZWFzaW5nIChzdHJpbmcpICNvcHRpb25hbCBlYXNpbmcgdHlwZS4gQWNjZXB0IG9uZSBvZiBAUmFwaGFlbC5lYXNpbmdfZm9ybXVsYXMgb3IgQ1NTIGZvcm1hdDogYGN1YmljJiN4MjAxMDtiZXppZXIoWFgsJiMxNjA7WFgsJiMxNjA7WFgsJiMxNjA7WFgpYFxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBhdCB0aGUgZW5kIG9mIGFuaW1hdGlvbi5cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBAQW5pbWF0aW9uXG4gICAgXFwqL1xuICAgIFIuYW5pbWF0aW9uID0gZnVuY3Rpb24gKHBhcmFtcywgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHBhcmFtcyBpbnN0YW5jZW9mIEFuaW1hdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoUi5pcyhlYXNpbmcsIFwiZnVuY3Rpb25cIikgfHwgIWVhc2luZykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBlYXNpbmcgfHwgbnVsbDtcbiAgICAgICAgICAgIGVhc2luZyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcGFyYW1zID0gT2JqZWN0KHBhcmFtcyk7XG4gICAgICAgIG1zID0gK21zIHx8IDA7XG4gICAgICAgIHZhciBwID0ge30sXG4gICAgICAgICAgICBqc29uLFxuICAgICAgICAgICAgYXR0cjtcbiAgICAgICAgZm9yIChhdHRyIGluIHBhcmFtcykgaWYgKHBhcmFtc1toYXNdKGF0dHIpICYmIHRvRmxvYXQoYXR0cikgIT0gYXR0ciAmJiB0b0Zsb2F0KGF0dHIpICsgXCIlXCIgIT0gYXR0cikge1xuICAgICAgICAgICAganNvbiA9IHRydWU7XG4gICAgICAgICAgICBwW2F0dHJdID0gcGFyYW1zW2F0dHJdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghanNvbikge1xuICAgICAgICAgICAgLy8gaWYgcGVyY2VudC1saWtlIHN5bnRheCBpcyB1c2VkIGFuZCBlbmQtb2YtYWxsIGFuaW1hdGlvbiBjYWxsYmFjayB1c2VkXG4gICAgICAgICAgICBpZihjYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgbGFzdCBvbmVcbiAgICAgICAgICAgICAgICB2YXIgbGFzdEtleSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBpIGluIHBhcmFtcyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwZXJjZW50ID0gdG9JbnQoaSk7XG4gICAgICAgICAgICAgICAgICAgIGlmKHBhcmFtc1toYXNdKGkpICYmIHBlcmNlbnQgPiBsYXN0S2V5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RLZXkgPSBwZXJjZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3RLZXkgKz0gJyUnO1xuICAgICAgICAgICAgICAgIC8vIGlmIGFscmVhZHkgZGVmaW5lZCBjYWxsYmFjayBpbiB0aGUgbGFzdCBrZXlmcmFtZSwgc2tpcFxuICAgICAgICAgICAgICAgICFwYXJhbXNbbGFzdEtleV0uY2FsbGJhY2sgJiYgKHBhcmFtc1tsYXN0S2V5XS5jYWxsYmFjayA9IGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IEFuaW1hdGlvbihwYXJhbXMsIG1zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVhc2luZyAmJiAocC5lYXNpbmcgPSBlYXNpbmcpO1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgKHAuY2FsbGJhY2sgPSBjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEFuaW1hdGlvbih7MTAwOiBwfSwgbXMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hbmltYXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGFuZCBzdGFydHMgYW5pbWF0aW9uIGZvciBnaXZlbiBlbGVtZW50LlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBwYXJhbXMgKG9iamVjdCkgZmluYWwgYXR0cmlidXRlcyBmb3IgdGhlIGVsZW1lbnQsIHNlZSBhbHNvIEBFbGVtZW50LmF0dHJcbiAgICAgLSBtcyAobnVtYmVyKSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGZvciBhbmltYXRpb24gdG8gcnVuXG4gICAgIC0gZWFzaW5nIChzdHJpbmcpICNvcHRpb25hbCBlYXNpbmcgdHlwZS4gQWNjZXB0IG9uZSBvZiBAUmFwaGFlbC5lYXNpbmdfZm9ybXVsYXMgb3IgQ1NTIGZvcm1hdDogYGN1YmljJiN4MjAxMDtiZXppZXIoWFgsJiMxNjA7WFgsJiMxNjA7WFgsJiMxNjA7WFgpYFxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBhdCB0aGUgZW5kIG9mIGFuaW1hdGlvbi5cbiAgICAgKiBvclxuICAgICAtIGFuaW1hdGlvbiAob2JqZWN0KSBhbmltYXRpb24gb2JqZWN0LCBzZWUgQFJhcGhhZWwuYW5pbWF0aW9uXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFuaW1hdGUgPSBmdW5jdGlvbiAocGFyYW1zLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIGlmIChlbGVtZW50LnJlbW92ZWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwoZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYW5pbSA9IHBhcmFtcyBpbnN0YW5jZW9mIEFuaW1hdGlvbiA/IHBhcmFtcyA6IFIuYW5pbWF0aW9uKHBhcmFtcywgbXMsIGVhc2luZywgY2FsbGJhY2spO1xuICAgICAgICBydW5BbmltYXRpb24oYW5pbSwgZWxlbWVudCwgYW5pbS5wZXJjZW50c1swXSwgbnVsbCwgZWxlbWVudC5hdHRyKCkpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnNldFRpbWVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNldHMgdGhlIHN0YXR1cyBvZiBhbmltYXRpb24gb2YgdGhlIGVsZW1lbnQgaW4gbWlsbGlzZWNvbmRzLiBTaW1pbGFyIHRvIEBFbGVtZW50LnN0YXR1cyBtZXRob2QuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGFuaW0gKG9iamVjdCkgYW5pbWF0aW9uIG9iamVjdFxuICAgICAtIHZhbHVlIChudW1iZXIpIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhbmltYXRpb25cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50IGlmIGB2YWx1ZWAgaXMgc3BlY2lmaWVkXG4gICAgICogTm90ZSwgdGhhdCBkdXJpbmcgYW5pbWF0aW9uIGZvbGxvd2luZyBldmVudHMgYXJlIHRyaWdnZXJlZDpcbiAgICAgKlxuICAgICAqIE9uIGVhY2ggYW5pbWF0aW9uIGZyYW1lIGV2ZW50IGBhbmltLmZyYW1lLjxpZD5gLCBvbiBzdGFydCBgYW5pbS5zdGFydC48aWQ+YCBhbmQgb24gZW5kIGBhbmltLmZpbmlzaC48aWQ+YC5cbiAgICBcXCovXG4gICAgZWxwcm90by5zZXRUaW1lID0gZnVuY3Rpb24gKGFuaW0sIHZhbHVlKSB7XG4gICAgICAgIGlmIChhbmltICYmIHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzKGFuaW0sIG1taW4odmFsdWUsIGFuaW0ubXMpIC8gYW5pbS5tcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zdGF0dXNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgc3RhdHVzIG9mIGFuaW1hdGlvbiBvZiB0aGUgZWxlbWVudC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gYW5pbSAob2JqZWN0KSAjb3B0aW9uYWwgYW5pbWF0aW9uIG9iamVjdFxuICAgICAtIHZhbHVlIChudW1iZXIpICNvcHRpb25hbCAwIOKAkyAxLiBJZiBzcGVjaWZpZWQsIG1ldGhvZCB3b3JrcyBsaWtlIGEgc2V0dGVyIGFuZCBzZXRzIHRoZSBzdGF0dXMgb2YgYSBnaXZlbiBhbmltYXRpb24gdG8gdGhlIHZhbHVlLiBUaGlzIHdpbGwgY2F1c2UgYW5pbWF0aW9uIHRvIGp1bXAgdG8gdGhlIGdpdmVuIHBvc2l0aW9uLlxuICAgICAqKlxuICAgICA9IChudW1iZXIpIHN0YXR1c1xuICAgICAqIG9yXG4gICAgID0gKGFycmF5KSBzdGF0dXMgaWYgYGFuaW1gIGlzIG5vdCBzcGVjaWZpZWQuIEFycmF5IG9mIG9iamVjdHMgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgYW5pbTogKG9iamVjdCkgYW5pbWF0aW9uIG9iamVjdFxuICAgICBvICAgICBzdGF0dXM6IChudW1iZXIpIHN0YXR1c1xuICAgICBvIH1cbiAgICAgKiBvclxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnQgaWYgYHZhbHVlYCBpcyBzcGVjaWZpZWRcbiAgICBcXCovXG4gICAgZWxwcm90by5zdGF0dXMgPSBmdW5jdGlvbiAoYW5pbSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIG91dCA9IFtdLFxuICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBlO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgcnVuQW5pbWF0aW9uKGFuaW0sIHRoaXMsIC0xLCBtbWluKHZhbHVlLCAxKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxlbiA9IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlID0gYW5pbWF0aW9uRWxlbWVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGUuZWwuaWQgPT0gdGhpcy5pZCAmJiAoIWFuaW0gfHwgZS5hbmltID09IGFuaW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhbmltKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS5zdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbTogZS5hbmltLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBlLnN0YXR1c1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYW5pbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucGF1c2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFN0b3BzIGFuaW1hdGlvbiBvZiB0aGUgZWxlbWVudCB3aXRoIGFiaWxpdHkgdG8gcmVzdW1lIGl0IGxhdGVyIG9uLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBhbmltIChvYmplY3QpICNvcHRpb25hbCBhbmltYXRpb24gb2JqZWN0XG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnBhdXNlID0gZnVuY3Rpb24gKGFuaW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7IGkrKykgaWYgKGFuaW1hdGlvbkVsZW1lbnRzW2ldLmVsLmlkID09IHRoaXMuaWQgJiYgKCFhbmltIHx8IGFuaW1hdGlvbkVsZW1lbnRzW2ldLmFuaW0gPT0gYW5pbSkpIHtcbiAgICAgICAgICAgIGlmIChldmUoXCJyYXBoYWVsLmFuaW0ucGF1c2UuXCIgKyB0aGlzLmlkLCB0aGlzLCBhbmltYXRpb25FbGVtZW50c1tpXS5hbmltKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FbGVtZW50c1tpXS5wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucmVzdW1lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXN1bWVzIGFuaW1hdGlvbiBpZiBpdCB3YXMgcGF1c2VkIHdpdGggQEVsZW1lbnQucGF1c2UgbWV0aG9kLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBhbmltIChvYmplY3QpICNvcHRpb25hbCBhbmltYXRpb24gb2JqZWN0XG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnJlc3VtZSA9IGZ1bmN0aW9uIChhbmltKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoOyBpKyspIGlmIChhbmltYXRpb25FbGVtZW50c1tpXS5lbC5pZCA9PSB0aGlzLmlkICYmICghYW5pbSB8fCBhbmltYXRpb25FbGVtZW50c1tpXS5hbmltID09IGFuaW0pKSB7XG4gICAgICAgICAgICB2YXIgZSA9IGFuaW1hdGlvbkVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGV2ZShcInJhcGhhZWwuYW5pbS5yZXN1bWUuXCIgKyB0aGlzLmlkLCB0aGlzLCBlLmFuaW0pICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBlLnBhdXNlZDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cyhlLmFuaW0sIGUuc3RhdHVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnN0b3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFN0b3BzIGFuaW1hdGlvbiBvZiB0aGUgZWxlbWVudC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gYW5pbSAob2JqZWN0KSAjb3B0aW9uYWwgYW5pbWF0aW9uIG9iamVjdFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5zdG9wID0gZnVuY3Rpb24gKGFuaW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7IGkrKykgaWYgKGFuaW1hdGlvbkVsZW1lbnRzW2ldLmVsLmlkID09IHRoaXMuaWQgJiYgKCFhbmltIHx8IGFuaW1hdGlvbkVsZW1lbnRzW2ldLmFuaW0gPT0gYW5pbSkpIHtcbiAgICAgICAgICAgIGlmIChldmUoXCJyYXBoYWVsLmFuaW0uc3RvcC5cIiArIHRoaXMuaWQsIHRoaXMsIGFuaW1hdGlvbkVsZW1lbnRzW2ldLmFuaW0pICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzLnNwbGljZShpLS0sIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZnVuY3Rpb24gc3RvcEFuaW1hdGlvbihwYXBlcikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBpZiAoYW5pbWF0aW9uRWxlbWVudHNbaV0uZWwucGFwZXIgPT0gcGFwZXIpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzLnNwbGljZShpLS0sIDEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGV2ZS5vbihcInJhcGhhZWwucmVtb3ZlXCIsIHN0b3BBbmltYXRpb24pO1xuICAgIGV2ZS5vbihcInJhcGhhZWwuY2xlYXJcIiwgc3RvcEFuaW1hdGlvbik7XG4gICAgZWxwcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiUmFwaGFcXHhlYmxcXHUyMDE5cyBvYmplY3RcIjtcbiAgICB9O1xuXG4gICAgLy8gU2V0XG4gICAgdmFyIFNldCA9IGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50eXBlID0gXCJzZXRcIjtcbiAgICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBpdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zW2ldICYmIChpdGVtc1tpXS5jb25zdHJ1Y3RvciA9PSBlbHByb3RvLmNvbnN0cnVjdG9yIHx8IGl0ZW1zW2ldLmNvbnN0cnVjdG9yID09IFNldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1t0aGlzLml0ZW1zLmxlbmd0aF0gPSB0aGlzLml0ZW1zW3RoaXMuaXRlbXMubGVuZ3RoXSA9IGl0ZW1zW2ldO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2V0cHJvdG8gPSBTZXQucHJvdG90eXBlO1xuICAgIC8qXFxcbiAgICAgKiBTZXQucHVzaFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBlYWNoIGFyZ3VtZW50IHRvIHRoZSBjdXJyZW50IHNldC5cbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50XG4gICAgXFwqL1xuICAgIHNldHByb3RvLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpdGVtLFxuICAgICAgICAgICAgbGVuO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIChpdGVtLmNvbnN0cnVjdG9yID09IGVscHJvdG8uY29uc3RydWN0b3IgfHwgaXRlbS5jb25zdHJ1Y3RvciA9PSBTZXQpKSB7XG4gICAgICAgICAgICAgICAgbGVuID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGhpc1tsZW5dID0gdGhpcy5pdGVtc1tsZW5dID0gaXRlbTtcbiAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5wb3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgbGFzdCBlbGVtZW50IGFuZCByZXR1cm5zIGl0LlxuICAgICA9IChvYmplY3QpIGVsZW1lbnRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8ucG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxlbmd0aCAmJiBkZWxldGUgdGhpc1t0aGlzLmxlbmd0aC0tXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMucG9wKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmZvckVhY2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEV4ZWN1dGVzIGdpdmVuIGZ1bmN0aW9uIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIHNldC5cbiAgICAgKlxuICAgICAqIElmIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYCBpdCB3aWxsIHN0b3AgbG9vcCBydW5uaW5nLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pIGZ1bmN0aW9uIHRvIHJ1blxuICAgICAtIHRoaXNBcmcgKG9iamVjdCkgY29udGV4dCBvYmplY3QgZm9yIHRoZSBjYWxsYmFja1xuICAgICA9IChvYmplY3QpIFNldCBvYmplY3RcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHRoaXMuaXRlbXNbaV0sIGkpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZm9yICh2YXIgbWV0aG9kIGluIGVscHJvdG8pIGlmIChlbHByb3RvW2hhc10obWV0aG9kKSkge1xuICAgICAgICBzZXRwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIChtZXRob2RuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxbbWV0aG9kbmFtZV1bYXBwbHldKGVsLCBhcmcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkobWV0aG9kKTtcbiAgICB9XG4gICAgc2V0cHJvdG8uYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICBpZiAobmFtZSAmJiBSLmlzKG5hbWUsIGFycmF5KSAmJiBSLmlzKG5hbWVbMF0sIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgamogPSBuYW1lLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zW2pdLmF0dHIobmFtZVtqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zW2ldLmF0dHIobmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5jbGVhclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhbGwgZWxlbWVudHMgZnJvbSB0aGUgc2V0XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGlsZSAodGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMucG9wKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuc3BsaWNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGdpdmVuIGVsZW1lbnQgZnJvbSB0aGUgc2V0XG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGluZGV4IChudW1iZXIpIHBvc2l0aW9uIG9mIHRoZSBkZWxldGlvblxuICAgICAtIGNvdW50IChudW1iZXIpIG51bWJlciBvZiBlbGVtZW50IHRvIHJlbW92ZVxuICAgICAtIGluc2VydGlvbuKApiAob2JqZWN0KSAjb3B0aW9uYWwgZWxlbWVudHMgdG8gaW5zZXJ0XG4gICAgID0gKG9iamVjdCkgc2V0IGVsZW1lbnRzIHRoYXQgd2VyZSBkZWxldGVkXG4gICAgXFwqL1xuICAgIHNldHByb3RvLnNwbGljZSA9IGZ1bmN0aW9uIChpbmRleCwgY291bnQsIGluc2VydGlvbikge1xuICAgICAgICBpbmRleCA9IGluZGV4IDwgMCA/IG1tYXgodGhpcy5sZW5ndGggKyBpbmRleCwgMCkgOiBpbmRleDtcbiAgICAgICAgY291bnQgPSBtbWF4KDAsIG1taW4odGhpcy5sZW5ndGggLSBpbmRleCwgY291bnQpKTtcbiAgICAgICAgdmFyIHRhaWwgPSBbXSxcbiAgICAgICAgICAgIHRvZGVsID0gW10sXG4gICAgICAgICAgICBhcmdzID0gW10sXG4gICAgICAgICAgICBpO1xuICAgICAgICBmb3IgKGkgPSAyOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdG9kZWwucHVzaCh0aGlzW2luZGV4ICsgaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoOyBpIDwgdGhpcy5sZW5ndGggLSBpbmRleDsgaSsrKSB7XG4gICAgICAgICAgICB0YWlsLnB1c2godGhpc1tpbmRleCArIGldKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXJnbGVuID0gYXJncy5sZW5ndGg7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcmdsZW4gKyB0YWlsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2luZGV4ICsgaV0gPSB0aGlzW2luZGV4ICsgaV0gPSBpIDwgYXJnbGVuID8gYXJnc1tpXSA6IHRhaWxbaSAtIGFyZ2xlbl07XG4gICAgICAgIH1cbiAgICAgICAgaSA9IHRoaXMuaXRlbXMubGVuZ3RoID0gdGhpcy5sZW5ndGggLT0gY291bnQgLSBhcmdsZW47XG4gICAgICAgIHdoaWxlICh0aGlzW2ldKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpc1tpKytdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgU2V0KHRvZGVsKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuZXhjbHVkZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBlbGVtZW50IGZyb20gdGhlIHNldFxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBlbGVtZW50IChvYmplY3QpIGVsZW1lbnQgdG8gcmVtb3ZlXG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBvYmplY3Qgd2FzIGZvdW5kICYgcmVtb3ZlZCBmcm9tIHRoZSBzZXRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uZXhjbHVkZSA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmICh0aGlzW2ldID09IGVsKSB7XG4gICAgICAgICAgICB0aGlzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBzZXRwcm90by5hbmltYXRlID0gZnVuY3Rpb24gKHBhcmFtcywgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgKFIuaXMoZWFzaW5nLCBcImZ1bmN0aW9uXCIpIHx8ICFlYXNpbmcpICYmIChjYWxsYmFjayA9IGVhc2luZyB8fCBudWxsKTtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMuaXRlbXMubGVuZ3RoLFxuICAgICAgICAgICAgaSA9IGxlbixcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICBzZXQgPSB0aGlzLFxuICAgICAgICAgICAgY29sbGVjdG9yO1xuICAgICAgICBpZiAoIWxlbikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2sgJiYgKGNvbGxlY3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICEtLWxlbiAmJiBjYWxsYmFjay5jYWxsKHNldCk7XG4gICAgICAgIH0pO1xuICAgICAgICBlYXNpbmcgPSBSLmlzKGVhc2luZywgc3RyaW5nKSA/IGVhc2luZyA6IGNvbGxlY3RvcjtcbiAgICAgICAgdmFyIGFuaW0gPSBSLmFuaW1hdGlvbihwYXJhbXMsIG1zLCBlYXNpbmcsIGNvbGxlY3Rvcik7XG4gICAgICAgIGl0ZW0gPSB0aGlzLml0ZW1zWy0taV0uYW5pbWF0ZShhbmltKTtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtc1tpXSAmJiAhdGhpcy5pdGVtc1tpXS5yZW1vdmVkICYmIHRoaXMuaXRlbXNbaV0uYW5pbWF0ZVdpdGgoaXRlbSwgYW5pbSwgYW5pbSk7XG4gICAgICAgICAgICAodGhpcy5pdGVtc1tpXSAmJiAhdGhpcy5pdGVtc1tpXS5yZW1vdmVkKSB8fCBsZW4tLTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHNldHByb3RvLmluc2VydEFmdGVyID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXNbaV0uaW5zZXJ0QWZ0ZXIoZWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgc2V0cHJvdG8uZ2V0QkJveCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSBbXSxcbiAgICAgICAgICAgIHkgPSBbXSxcbiAgICAgICAgICAgIHgyID0gW10sXG4gICAgICAgICAgICB5MiA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGktLTspIGlmICghdGhpcy5pdGVtc1tpXS5yZW1vdmVkKSB7XG4gICAgICAgICAgICB2YXIgYm94ID0gdGhpcy5pdGVtc1tpXS5nZXRCQm94KCk7XG4gICAgICAgICAgICB4LnB1c2goYm94LngpO1xuICAgICAgICAgICAgeS5wdXNoKGJveC55KTtcbiAgICAgICAgICAgIHgyLnB1c2goYm94LnggKyBib3gud2lkdGgpO1xuICAgICAgICAgICAgeTIucHVzaChib3gueSArIGJveC5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIHggPSBtbWluW2FwcGx5XSgwLCB4KTtcbiAgICAgICAgeSA9IG1taW5bYXBwbHldKDAsIHkpO1xuICAgICAgICB4MiA9IG1tYXhbYXBwbHldKDAsIHgyKTtcbiAgICAgICAgeTIgPSBtbWF4W2FwcGx5XSgwLCB5Mik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHgyOiB4MixcbiAgICAgICAgICAgIHkyOiB5MixcbiAgICAgICAgICAgIHdpZHRoOiB4MiAtIHgsXG4gICAgICAgICAgICBoZWlnaHQ6IHkyIC0geVxuICAgICAgICB9O1xuICAgIH07XG4gICAgc2V0cHJvdG8uY2xvbmUgPSBmdW5jdGlvbiAocykge1xuICAgICAgICBzID0gdGhpcy5wYXBlci5zZXQoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBzLnB1c2godGhpcy5pdGVtc1tpXS5jbG9uZSgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcztcbiAgICB9O1xuICAgIHNldHByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJSYXBoYVxceGVibFxcdTIwMThzIHNldFwiO1xuICAgIH07XG5cbiAgICBzZXRwcm90by5nbG93ID0gZnVuY3Rpb24oZ2xvd0NvbmZpZykge1xuICAgICAgICB2YXIgcmV0ID0gdGhpcy5wYXBlci5zZXQoKTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHNoYXBlLCBpbmRleCl7XG4gICAgICAgICAgICB2YXIgZyA9IHNoYXBlLmdsb3coZ2xvd0NvbmZpZyk7XG4gICAgICAgICAgICBpZihnICE9IG51bGwpe1xuICAgICAgICAgICAgICAgIGcuZm9yRWFjaChmdW5jdGlvbihzaGFwZTIsIGluZGV4Mil7XG4gICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKHNoYXBlMik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cblxuICAgIC8qXFxcbiAgICAgKiBTZXQuaXNQb2ludEluc2lkZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGV0ZXJtaW5lIGlmIGdpdmVuIHBvaW50IGlzIGluc2lkZSB0aGlzIHNldOKAmXMgZWxlbWVudHNcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBwb2ludCBpcyBpbnNpZGUgYW55IG9mIHRoZSBzZXQncyBlbGVtZW50c1xuICAgICBcXCovXG4gICAgc2V0cHJvdG8uaXNQb2ludEluc2lkZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHZhciBpc1BvaW50SW5zaWRlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGlmIChlbC5pc1BvaW50SW5zaWRlKHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgaXNQb2ludEluc2lkZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBzdG9wIGxvb3BcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpc1BvaW50SW5zaWRlO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5yZWdpc3RlckZvbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZ2l2ZW4gZm9udCB0byB0aGUgcmVnaXN0ZXJlZCBzZXQgb2YgZm9udHMgZm9yIFJhcGhhw6tsLiBTaG91bGQgYmUgdXNlZCBhcyBhbiBpbnRlcm5hbCBjYWxsIGZyb20gd2l0aGluIEN1ZsOzbuKAmXMgZm9udCBmaWxlLlxuICAgICAqIFJldHVybnMgb3JpZ2luYWwgcGFyYW1ldGVyLCBzbyBpdCBjb3VsZCBiZSB1c2VkIHdpdGggY2hhaW5pbmcuXG4gICAgICMgPGEgaHJlZj1cImh0dHA6Ly93aWtpLmdpdGh1Yi5jb20vc29yY2N1L2N1Zm9uL2Fib3V0XCI+TW9yZSBhYm91dCBDdWbDs24gYW5kIGhvdyB0byBjb252ZXJ0IHlvdXIgZm9udCBmb3JtIFRURiwgT1RGLCBldGMgdG8gSmF2YVNjcmlwdCBmaWxlLjwvYT5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gZm9udCAob2JqZWN0KSB0aGUgZm9udCB0byByZWdpc3RlclxuICAgICA9IChvYmplY3QpIHRoZSBmb250IHlvdSBwYXNzZWQgaW5cbiAgICAgPiBVc2FnZVxuICAgICB8IEN1Zm9uLnJlZ2lzdGVyRm9udChSYXBoYWVsLnJlZ2lzdGVyRm9udCh74oCmfSkpO1xuICAgIFxcKi9cbiAgICBSLnJlZ2lzdGVyRm9udCA9IGZ1bmN0aW9uIChmb250KSB7XG4gICAgICAgIGlmICghZm9udC5mYWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9udDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZvbnRzID0gdGhpcy5mb250cyB8fCB7fTtcbiAgICAgICAgdmFyIGZvbnRjb3B5ID0ge1xuICAgICAgICAgICAgICAgIHc6IGZvbnQudyxcbiAgICAgICAgICAgICAgICBmYWNlOiB7fSxcbiAgICAgICAgICAgICAgICBnbHlwaHM6IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmFtaWx5ID0gZm9udC5mYWNlW1wiZm9udC1mYW1pbHlcIl07XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gZm9udC5mYWNlKSBpZiAoZm9udC5mYWNlW2hhc10ocHJvcCkpIHtcbiAgICAgICAgICAgIGZvbnRjb3B5LmZhY2VbcHJvcF0gPSBmb250LmZhY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZm9udHNbZmFtaWx5XSkge1xuICAgICAgICAgICAgdGhpcy5mb250c1tmYW1pbHldLnB1c2goZm9udGNvcHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mb250c1tmYW1pbHldID0gW2ZvbnRjb3B5XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWZvbnQuc3ZnKSB7XG4gICAgICAgICAgICBmb250Y29weS5mYWNlW1widW5pdHMtcGVyLWVtXCJdID0gdG9JbnQoZm9udC5mYWNlW1widW5pdHMtcGVyLWVtXCJdLCAxMCk7XG4gICAgICAgICAgICBmb3IgKHZhciBnbHlwaCBpbiBmb250LmdseXBocykgaWYgKGZvbnQuZ2x5cGhzW2hhc10oZ2x5cGgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSBmb250LmdseXBoc1tnbHlwaF07XG4gICAgICAgICAgICAgICAgZm9udGNvcHkuZ2x5cGhzW2dseXBoXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdzogcGF0aC53LFxuICAgICAgICAgICAgICAgICAgICBrOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgZDogcGF0aC5kICYmIFwiTVwiICsgcGF0aC5kLnJlcGxhY2UoL1ttbGN4dHJ2XS9nLCBmdW5jdGlvbiAoY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7bDogXCJMXCIsIGM6IFwiQ1wiLCB4OiBcInpcIiwgdDogXCJtXCIsIHI6IFwibFwiLCB2OiBcImNcIn1bY29tbWFuZF0gfHwgXCJNXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSArIFwielwiXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5rKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gcGF0aC5rKSBpZiAocGF0aFtoYXNdKGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250Y29weS5nbHlwaHNbZ2x5cGhdLmtba10gPSBwYXRoLmtba107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvbnQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ2V0Rm9udFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRmluZHMgZm9udCBvYmplY3QgaW4gdGhlIHJlZ2lzdGVyZWQgZm9udHMgYnkgZ2l2ZW4gcGFyYW1ldGVycy4gWW91IGNvdWxkIHNwZWNpZnkgb25seSBvbmUgd29yZCBmcm9tIHRoZSBmb250IG5hbWUsIGxpa2Ug4oCcTXlyaWFk4oCdIGZvciDigJxNeXJpYWQgUHJv4oCdLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBmYW1pbHkgKHN0cmluZykgZm9udCBmYW1pbHkgbmFtZSBvciBhbnkgd29yZCBmcm9tIGl0XG4gICAgIC0gd2VpZ2h0IChzdHJpbmcpICNvcHRpb25hbCBmb250IHdlaWdodFxuICAgICAtIHN0eWxlIChzdHJpbmcpICNvcHRpb25hbCBmb250IHN0eWxlXG4gICAgIC0gc3RyZXRjaCAoc3RyaW5nKSAjb3B0aW9uYWwgZm9udCBzdHJldGNoXG4gICAgID0gKG9iamVjdCkgdGhlIGZvbnQgb2JqZWN0XG4gICAgID4gVXNhZ2VcbiAgICAgfCBwYXBlci5wcmludCgxMDAsIDEwMCwgXCJUZXN0IHN0cmluZ1wiLCBwYXBlci5nZXRGb250KFwiVGltZXNcIiwgODAwKSwgMzApO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmdldEZvbnQgPSBmdW5jdGlvbiAoZmFtaWx5LCB3ZWlnaHQsIHN0eWxlLCBzdHJldGNoKSB7XG4gICAgICAgIHN0cmV0Y2ggPSBzdHJldGNoIHx8IFwibm9ybWFsXCI7XG4gICAgICAgIHN0eWxlID0gc3R5bGUgfHwgXCJub3JtYWxcIjtcbiAgICAgICAgd2VpZ2h0ID0gK3dlaWdodCB8fCB7bm9ybWFsOiA0MDAsIGJvbGQ6IDcwMCwgbGlnaHRlcjogMzAwLCBib2xkZXI6IDgwMH1bd2VpZ2h0XSB8fCA0MDA7XG4gICAgICAgIGlmICghUi5mb250cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmb250ID0gUi5mb250c1tmYW1pbHldO1xuICAgICAgICBpZiAoIWZvbnQpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmV3IFJlZ0V4cChcIihefFxcXFxzKVwiICsgZmFtaWx5LnJlcGxhY2UoL1teXFx3XFxkXFxzKyF+LjpfLV0vZywgRSkgKyBcIihcXFxcc3wkKVwiLCBcImlcIik7XG4gICAgICAgICAgICBmb3IgKHZhciBmb250TmFtZSBpbiBSLmZvbnRzKSBpZiAoUi5mb250c1toYXNdKGZvbnROYW1lKSkge1xuICAgICAgICAgICAgICAgIGlmIChuYW1lLnRlc3QoZm9udE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvbnQgPSBSLmZvbnRzW2ZvbnROYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciB0aGVmb250O1xuICAgICAgICBpZiAoZm9udCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZm9udC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhlZm9udCA9IGZvbnRbaV07XG4gICAgICAgICAgICAgICAgaWYgKHRoZWZvbnQuZmFjZVtcImZvbnQtd2VpZ2h0XCJdID09IHdlaWdodCAmJiAodGhlZm9udC5mYWNlW1wiZm9udC1zdHlsZVwiXSA9PSBzdHlsZSB8fCAhdGhlZm9udC5mYWNlW1wiZm9udC1zdHlsZVwiXSkgJiYgdGhlZm9udC5mYWNlW1wiZm9udC1zdHJldGNoXCJdID09IHN0cmV0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGVmb250O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnByaW50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIHBhdGggdGhhdCByZXByZXNlbnQgZ2l2ZW4gdGV4dCB3cml0dGVuIHVzaW5nIGdpdmVuIGZvbnQgYXQgZ2l2ZW4gcG9zaXRpb24gd2l0aCBnaXZlbiBzaXplLlxuICAgICAqIFJlc3VsdCBvZiB0aGUgbWV0aG9kIGlzIHBhdGggZWxlbWVudCB0aGF0IGNvbnRhaW5zIHdob2xlIHRleHQgYXMgYSBzZXBhcmF0ZSBwYXRoLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggcG9zaXRpb24gb2YgdGhlIHRleHRcbiAgICAgLSB5IChudW1iZXIpIHkgcG9zaXRpb24gb2YgdGhlIHRleHRcbiAgICAgLSBzdHJpbmcgKHN0cmluZykgdGV4dCB0byBwcmludFxuICAgICAtIGZvbnQgKG9iamVjdCkgZm9udCBvYmplY3QsIHNlZSBAUGFwZXIuZ2V0Rm9udFxuICAgICAtIHNpemUgKG51bWJlcikgI29wdGlvbmFsIHNpemUgb2YgdGhlIGZvbnQsIGRlZmF1bHQgaXMgYDE2YFxuICAgICAtIG9yaWdpbiAoc3RyaW5nKSAjb3B0aW9uYWwgY291bGQgYmUgYFwiYmFzZWxpbmVcImAgb3IgYFwibWlkZGxlXCJgLCBkZWZhdWx0IGlzIGBcIm1pZGRsZVwiYFxuICAgICAtIGxldHRlcl9zcGFjaW5nIChudW1iZXIpICNvcHRpb25hbCBudW1iZXIgaW4gcmFuZ2UgYC0xLi4xYCwgZGVmYXVsdCBpcyBgMGBcbiAgICAgLSBsaW5lX3NwYWNpbmcgKG51bWJlcikgI29wdGlvbmFsIG51bWJlciBpbiByYW5nZSBgMS4uM2AsIGRlZmF1bHQgaXMgYDFgXG4gICAgID0gKG9iamVjdCkgcmVzdWx0aW5nIHBhdGggZWxlbWVudCwgd2hpY2ggY29uc2lzdCBvZiBhbGwgbGV0dGVyc1xuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIHR4dCA9IHIucHJpbnQoMTAsIDUwLCBcInByaW50XCIsIHIuZ2V0Rm9udChcIk11c2VvXCIpLCAzMCkuYXR0cih7ZmlsbDogXCIjZmZmXCJ9KTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5wcmludCA9IGZ1bmN0aW9uICh4LCB5LCBzdHJpbmcsIGZvbnQsIHNpemUsIG9yaWdpbiwgbGV0dGVyX3NwYWNpbmcsIGxpbmVfc3BhY2luZykge1xuICAgICAgICBvcmlnaW4gPSBvcmlnaW4gfHwgXCJtaWRkbGVcIjsgLy8gYmFzZWxpbmV8bWlkZGxlXG4gICAgICAgIGxldHRlcl9zcGFjaW5nID0gbW1heChtbWluKGxldHRlcl9zcGFjaW5nIHx8IDAsIDEpLCAtMSk7XG4gICAgICAgIGxpbmVfc3BhY2luZyA9IG1tYXgobW1pbihsaW5lX3NwYWNpbmcgfHwgMSwgMyksIDEpO1xuICAgICAgICB2YXIgbGV0dGVycyA9IFN0cihzdHJpbmcpW3NwbGl0XShFKSxcbiAgICAgICAgICAgIHNoaWZ0ID0gMCxcbiAgICAgICAgICAgIG5vdGZpcnN0ID0gMCxcbiAgICAgICAgICAgIHBhdGggPSBFLFxuICAgICAgICAgICAgc2NhbGU7XG4gICAgICAgIFIuaXMoZm9udCwgXCJzdHJpbmdcIikgJiYgKGZvbnQgPSB0aGlzLmdldEZvbnQoZm9udCkpO1xuICAgICAgICBpZiAoZm9udCkge1xuICAgICAgICAgICAgc2NhbGUgPSAoc2l6ZSB8fCAxNikgLyBmb250LmZhY2VbXCJ1bml0cy1wZXItZW1cIl07XG4gICAgICAgICAgICB2YXIgYmIgPSBmb250LmZhY2UuYmJveFtzcGxpdF0oc2VwYXJhdG9yKSxcbiAgICAgICAgICAgICAgICB0b3AgPSArYmJbMF0sXG4gICAgICAgICAgICAgICAgbGluZUhlaWdodCA9IGJiWzNdIC0gYmJbMV0sXG4gICAgICAgICAgICAgICAgc2hpZnR5ID0gMCxcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSArYmJbMV0gKyAob3JpZ2luID09IFwiYmFzZWxpbmVcIiA/IGxpbmVIZWlnaHQgKyAoK2ZvbnQuZmFjZS5kZXNjZW50KSA6IGxpbmVIZWlnaHQgLyAyKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGxldHRlcnMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsZXR0ZXJzW2ldID09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBjdXJyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgbm90Zmlyc3QgPSAwO1xuICAgICAgICAgICAgICAgICAgICBzaGlmdHkgKz0gbGluZUhlaWdodCAqIGxpbmVfc3BhY2luZztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldiA9IG5vdGZpcnN0ICYmIGZvbnQuZ2x5cGhzW2xldHRlcnNbaSAtIDFdXSB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnIgPSBmb250LmdseXBoc1tsZXR0ZXJzW2ldXTtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnQgKz0gbm90Zmlyc3QgPyAocHJldi53IHx8IGZvbnQudykgKyAocHJldi5rICYmIHByZXYua1tsZXR0ZXJzW2ldXSB8fCAwKSArIChmb250LncgKiBsZXR0ZXJfc3BhY2luZykgOiAwO1xuICAgICAgICAgICAgICAgICAgICBub3RmaXJzdCA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjdXJyICYmIGN1cnIuZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXRoICs9IFIudHJhbnNmb3JtUGF0aChjdXJyLmQsIFtcInRcIiwgc2hpZnQgKiBzY2FsZSwgc2hpZnR5ICogc2NhbGUsIFwic1wiLCBzY2FsZSwgc2NhbGUsIHRvcCwgaGVpZ2h0LCBcInRcIiwgKHggLSB0b3ApIC8gc2NhbGUsICh5IC0gaGVpZ2h0KSAvIHNjYWxlXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGgocGF0aCkuYXR0cih7XG4gICAgICAgICAgICBmaWxsOiBcIiMwMDBcIixcbiAgICAgICAgICAgIHN0cm9rZTogXCJub25lXCJcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBQYXBlci5hZGRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEltcG9ydHMgZWxlbWVudHMgaW4gSlNPTiBhcnJheSBpbiBmb3JtYXQgYHt0eXBlOiB0eXBlLCA8YXR0cmlidXRlcz59YFxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBqc29uIChhcnJheSlcbiAgICAgPSAob2JqZWN0KSByZXN1bHRpbmcgc2V0IG9mIGltcG9ydGVkIGVsZW1lbnRzXG4gICAgID4gVXNhZ2VcbiAgICAgfCBwYXBlci5hZGQoW1xuICAgICB8ICAgICB7XG4gICAgIHwgICAgICAgICB0eXBlOiBcImNpcmNsZVwiLFxuICAgICB8ICAgICAgICAgY3g6IDEwLFxuICAgICB8ICAgICAgICAgY3k6IDEwLFxuICAgICB8ICAgICAgICAgcjogNVxuICAgICB8ICAgICB9LFxuICAgICB8ICAgICB7XG4gICAgIHwgICAgICAgICB0eXBlOiBcInJlY3RcIixcbiAgICAgfCAgICAgICAgIHg6IDEwLFxuICAgICB8ICAgICAgICAgeTogMTAsXG4gICAgIHwgICAgICAgICB3aWR0aDogMTAsXG4gICAgIHwgICAgICAgICBoZWlnaHQ6IDEwLFxuICAgICB8ICAgICAgICAgZmlsbDogXCIjZmMwXCJcbiAgICAgfCAgICAgfVxuICAgICB8IF0pO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmFkZCA9IGZ1bmN0aW9uIChqc29uKSB7XG4gICAgICAgIGlmIChSLmlzKGpzb24sIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB0aGlzLnNldCgpLFxuICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgIGlpID0ganNvbi5sZW5ndGgsXG4gICAgICAgICAgICAgICAgajtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGogPSBqc29uW2ldIHx8IHt9O1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzW2hhc10oai50eXBlKSAmJiByZXMucHVzaCh0aGlzW2oudHlwZV0oKS5hdHRyKGopKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5mb3JtYXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNpbXBsZSBmb3JtYXQgZnVuY3Rpb24uIFJlcGxhY2VzIGNvbnN0cnVjdGlvbiBvZiB0eXBlIOKAnGB7PG51bWJlcj59YOKAnSB0byB0aGUgY29ycmVzcG9uZGluZyBhcmd1bWVudC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gdG9rZW4gKHN0cmluZykgc3RyaW5nIHRvIGZvcm1hdFxuICAgICAtIOKApiAoc3RyaW5nKSByZXN0IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHRyZWF0ZWQgYXMgcGFyYW1ldGVycyBmb3IgcmVwbGFjZW1lbnRcbiAgICAgPSAoc3RyaW5nKSBmb3JtYXRlZCBzdHJpbmdcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciB4ID0gMTAsXG4gICAgIHwgICAgIHkgPSAyMCxcbiAgICAgfCAgICAgd2lkdGggPSA0MCxcbiAgICAgfCAgICAgaGVpZ2h0ID0gNTA7XG4gICAgIHwgLy8gdGhpcyB3aWxsIGRyYXcgYSByZWN0YW5ndWxhciBzaGFwZSBlcXVpdmFsZW50IHRvIFwiTTEwLDIwaDQwdjUwaC00MHpcIlxuICAgICB8IHBhcGVyLnBhdGgoUmFwaGFlbC5mb3JtYXQoXCJNezB9LHsxfWh7Mn12ezN9aHs0fXpcIiwgeCwgeSwgd2lkdGgsIGhlaWdodCwgLXdpZHRoKSk7XG4gICAgXFwqL1xuICAgIFIuZm9ybWF0ID0gZnVuY3Rpb24gKHRva2VuLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBSLmlzKHBhcmFtcywgYXJyYXkpID8gWzBdW2NvbmNhdF0ocGFyYW1zKSA6IGFyZ3VtZW50cztcbiAgICAgICAgdG9rZW4gJiYgUi5pcyh0b2tlbiwgc3RyaW5nKSAmJiBhcmdzLmxlbmd0aCAtIDEgJiYgKHRva2VuID0gdG9rZW4ucmVwbGFjZShmb3JtYXRyZywgZnVuY3Rpb24gKHN0ciwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGFyZ3NbKytpXSA9PSBudWxsID8gRSA6IGFyZ3NbaV07XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHRva2VuIHx8IEU7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5mdWxsZmlsbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQSBsaXR0bGUgYml0IG1vcmUgYWR2YW5jZWQgZm9ybWF0IGZ1bmN0aW9uIHRoYW4gQFJhcGhhZWwuZm9ybWF0LiBSZXBsYWNlcyBjb25zdHJ1Y3Rpb24gb2YgdHlwZSDigJxgezxuYW1lPn1g4oCdIHRvIHRoZSBjb3JyZXNwb25kaW5nIGFyZ3VtZW50LlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB0b2tlbiAoc3RyaW5nKSBzdHJpbmcgdG8gZm9ybWF0XG4gICAgIC0ganNvbiAob2JqZWN0KSBvYmplY3Qgd2hpY2ggcHJvcGVydGllcyB3aWxsIGJlIHVzZWQgYXMgYSByZXBsYWNlbWVudFxuICAgICA9IChzdHJpbmcpIGZvcm1hdGVkIHN0cmluZ1xuICAgICA+IFVzYWdlXG4gICAgIHwgLy8gdGhpcyB3aWxsIGRyYXcgYSByZWN0YW5ndWxhciBzaGFwZSBlcXVpdmFsZW50IHRvIFwiTTEwLDIwaDQwdjUwaC00MHpcIlxuICAgICB8IHBhcGVyLnBhdGgoUmFwaGFlbC5mdWxsZmlsbChcIk17eH0se3l9aHtkaW0ud2lkdGh9dntkaW0uaGVpZ2h0fWh7ZGltWyduZWdhdGl2ZSB3aWR0aCddfXpcIiwge1xuICAgICB8ICAgICB4OiAxMCxcbiAgICAgfCAgICAgeTogMjAsXG4gICAgIHwgICAgIGRpbToge1xuICAgICB8ICAgICAgICAgd2lkdGg6IDQwLFxuICAgICB8ICAgICAgICAgaGVpZ2h0OiA1MCxcbiAgICAgfCAgICAgICAgIFwibmVnYXRpdmUgd2lkdGhcIjogLTQwXG4gICAgIHwgICAgIH1cbiAgICAgfCB9KSk7XG4gICAgXFwqL1xuICAgIFIuZnVsbGZpbGwgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9rZW5SZWdleCA9IC9cXHsoW15cXH1dKylcXH0vZyxcbiAgICAgICAgICAgIG9iak5vdGF0aW9uUmVnZXggPSAvKD86KD86XnxcXC4pKC4rPykoPz1cXFt8XFwufCR8XFwoKXxcXFsoJ3xcIikoLis/KVxcMlxcXSkoXFwoXFwpKT8vZywgLy8gbWF0Y2hlcyAueHh4eHggb3IgW1wieHh4eHhcIl0gdG8gcnVuIG92ZXIgb2JqZWN0IHByb3BlcnRpZXNcbiAgICAgICAgICAgIHJlcGxhY2VyID0gZnVuY3Rpb24gKGFsbCwga2V5LCBvYmopIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0gb2JqO1xuICAgICAgICAgICAgICAgIGtleS5yZXBsYWNlKG9iak5vdGF0aW9uUmVnZXgsIGZ1bmN0aW9uIChhbGwsIG5hbWUsIHF1b3RlLCBxdW90ZWROYW1lLCBpc0Z1bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUgfHwgcXVvdGVkTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzW25hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHJlcyA9PSBcImZ1bmN0aW9uXCIgJiYgaXNGdW5jICYmIChyZXMgPSByZXMoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXMgPSAocmVzID09IG51bGwgfHwgcmVzID09IG9iaiA/IGFsbCA6IHJlcykgKyBcIlwiO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHN0ciwgb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHN0cikucmVwbGFjZSh0b2tlblJlZ2V4LCBmdW5jdGlvbiAoYWxsLCBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwbGFjZXIoYWxsLCBrZXksIG9iaik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9KSgpO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLm5pbmphXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJZiB5b3Ugd2FudCB0byBsZWF2ZSBubyB0cmFjZSBvZiBSYXBoYcOrbCAoV2VsbCwgUmFwaGHDq2wgY3JlYXRlcyBvbmx5IG9uZSBnbG9iYWwgdmFyaWFibGUgYFJhcGhhZWxgLCBidXQgYW55d2F5LikgWW91IGNhbiB1c2UgYG5pbmphYCBtZXRob2QuXG4gICAgICogQmV3YXJlLCB0aGF0IGluIHRoaXMgY2FzZSBwbHVnaW5zIGNvdWxkIHN0b3Agd29ya2luZywgYmVjYXVzZSB0aGV5IGFyZSBkZXBlbmRpbmcgb24gZ2xvYmFsIHZhcmlhYmxlIGV4aXN0YW5jZS5cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBSYXBoYWVsIG9iamVjdFxuICAgICA+IFVzYWdlXG4gICAgIHwgKGZ1bmN0aW9uIChsb2NhbF9yYXBoYWVsKSB7XG4gICAgIHwgICAgIHZhciBwYXBlciA9IGxvY2FsX3JhcGhhZWwoMTAsIDEwLCAzMjAsIDIwMCk7XG4gICAgIHwgICAgIOKAplxuICAgICB8IH0pKFJhcGhhZWwubmluamEoKSk7XG4gICAgXFwqL1xuICAgIFIubmluamEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9sZFJhcGhhZWwud2FzID8gKGcud2luLlJhcGhhZWwgPSBvbGRSYXBoYWVsLmlzKSA6IGRlbGV0ZSBSYXBoYWVsO1xuICAgICAgICByZXR1cm4gUjtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnN0XG4gICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAqKlxuICAgICAqIFlvdSBjYW4gYWRkIHlvdXIgb3duIG1ldGhvZCB0byBlbGVtZW50cyBhbmQgc2V0cy4gSXQgaXMgd2lzZSB0byBhZGQgYSBzZXQgbWV0aG9kIGZvciBlYWNoIGVsZW1lbnQgbWV0aG9kXG4gICAgICogeW91IGFkZGVkLCBzbyB5b3Ugd2lsbCBiZSBhYmxlIHRvIGNhbGwgdGhlIHNhbWUgbWV0aG9kIG9uIHNldHMgdG9vLlxuICAgICAqKlxuICAgICAqIFNlZSBhbHNvIEBSYXBoYWVsLmVsLlxuICAgICA+IFVzYWdlXG4gICAgIHwgUmFwaGFlbC5lbC5yZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgIHwgICAgIHRoaXMuYXR0cih7ZmlsbDogXCIjZjAwXCJ9KTtcbiAgICAgfCB9O1xuICAgICB8IFJhcGhhZWwuc3QucmVkID0gZnVuY3Rpb24gKCkge1xuICAgICB8ICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgIHwgICAgICAgICBlbC5yZWQoKTtcbiAgICAgfCAgICAgfSk7XG4gICAgIHwgfTtcbiAgICAgfCAvLyB0aGVuIHVzZSBpdFxuICAgICB8IHBhcGVyLnNldChwYXBlci5jaXJjbGUoMTAwLCAxMDAsIDIwKSwgcGFwZXIuY2lyY2xlKDExMCwgMTAwLCAyMCkpLnJlZCgpO1xuICAgIFxcKi9cbiAgICBSLnN0ID0gc2V0cHJvdG87XG5cbiAgICBldmUub24oXCJyYXBoYWVsLkRPTWxvYWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBsb2FkZWQgPSB0cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gRmlyZWZveCA8My42IGZpeDogaHR0cDovL3dlYnJlZmxlY3Rpb24uYmxvZ3Nwb3QuY29tLzIwMDkvMTEvMTk1LWNoYXJzLXRvLWhlbHAtbGF6eS1sb2FkaW5nLmh0bWxcbiAgICAoZnVuY3Rpb24gKGRvYywgbG9hZGVkLCBmKSB7XG4gICAgICAgIGlmIChkb2MucmVhZHlTdGF0ZSA9PSBudWxsICYmIGRvYy5hZGRFdmVudExpc3RlbmVyKXtcbiAgICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKGxvYWRlZCwgZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihsb2FkZWQsIGYsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBkb2MucmVhZHlTdGF0ZSA9IFwiY29tcGxldGVcIjtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGRvYy5yZWFkeVN0YXRlID0gXCJsb2FkaW5nXCI7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gaXNMb2FkZWQoKSB7XG4gICAgICAgICAgICAoL2luLykudGVzdChkb2MucmVhZHlTdGF0ZSkgPyBzZXRUaW1lb3V0KGlzTG9hZGVkLCA5KSA6IFIuZXZlKFwicmFwaGFlbC5ET01sb2FkXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlzTG9hZGVkKCk7XG4gICAgfSkoZG9jdW1lbnQsIFwiRE9NQ29udGVudExvYWRlZFwiKTtcblxuLy8g4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQIFxcXFxcbi8vIOKUgiBSYXBoYcOrbCAtIEphdmFTY3JpcHQgVmVjdG9yIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBTVkcgTW9kdWxlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIENvcHlyaWdodCAoYykgMjAwOC0yMDExIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL3JhcGhhZWxqcy5jb20pICAg4pSCIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMSBTZW5jaGEgTGFicyAoaHR0cDovL3NlbmNoYS5jb20pICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilIIgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCAoaHR0cDovL3JhcGhhZWxqcy5jb20vbGljZW5zZS5odG1sKSBsaWNlbnNlLiDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uKCl7XG4gICAgaWYgKCFSLnN2Zykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgdG9GbG9hdCA9IHBhcnNlRmxvYXQsXG4gICAgICAgIHRvSW50ID0gcGFyc2VJbnQsXG4gICAgICAgIG1hdGggPSBNYXRoLFxuICAgICAgICBtbWF4ID0gbWF0aC5tYXgsXG4gICAgICAgIGFicyA9IG1hdGguYWJzLFxuICAgICAgICBwb3cgPSBtYXRoLnBvdyxcbiAgICAgICAgc2VwYXJhdG9yID0gL1ssIF0rLyxcbiAgICAgICAgZXZlID0gUi5ldmUsXG4gICAgICAgIEUgPSBcIlwiLFxuICAgICAgICBTID0gXCIgXCI7XG4gICAgdmFyIHhsaW5rID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsXG4gICAgICAgIG1hcmtlcnMgPSB7XG4gICAgICAgICAgICBibG9jazogXCJNNSwwIDAsMi41IDUsNXpcIixcbiAgICAgICAgICAgIGNsYXNzaWM6IFwiTTUsMCAwLDIuNSA1LDUgMy41LDMgMy41LDJ6XCIsXG4gICAgICAgICAgICBkaWFtb25kOiBcIk0yLjUsMCA1LDIuNSAyLjUsNSAwLDIuNXpcIixcbiAgICAgICAgICAgIG9wZW46IFwiTTYsMSAxLDMuNSA2LDZcIixcbiAgICAgICAgICAgIG92YWw6IFwiTTIuNSwwQTIuNSwyLjUsMCwwLDEsMi41LDUgMi41LDIuNSwwLDAsMSwyLjUsMHpcIlxuICAgICAgICB9LFxuICAgICAgICBtYXJrZXJDb3VudGVyID0ge307XG4gICAgUi50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICBcIllvdXIgYnJvd3NlciBzdXBwb3J0cyBTVkcuXFxuWW91IGFyZSBydW5uaW5nIFJhcGhhXFx4ZWJsIFwiICsgdGhpcy52ZXJzaW9uO1xuICAgIH07XG4gICAgdmFyICQgPSBmdW5jdGlvbiAoZWwsIGF0dHIpIHtcbiAgICAgICAgaWYgKGF0dHIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWwgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGVsID0gJChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cikgaWYgKGF0dHJbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleS5zdWJzdHJpbmcoMCwgNikgPT0gXCJ4bGluazpcIikge1xuICAgICAgICAgICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyh4bGluaywga2V5LnN1YnN0cmluZyg2KSwgU3RyKGF0dHJba2V5XSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIFN0cihhdHRyW2tleV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbCA9IFIuX2cuZG9jLmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIGVsKTtcbiAgICAgICAgICAgIGVsLnN0eWxlICYmIChlbC5zdHlsZS53ZWJraXRUYXBIaWdobGlnaHRDb2xvciA9IFwicmdiYSgwLDAsMCwwKVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcbiAgICBhZGRHcmFkaWVudEZpbGwgPSBmdW5jdGlvbiAoZWxlbWVudCwgZ3JhZGllbnQpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBcImxpbmVhclwiLFxuICAgICAgICAgICAgaWQgPSBlbGVtZW50LmlkICsgZ3JhZGllbnQsXG4gICAgICAgICAgICBmeCA9IC41LCBmeSA9IC41LFxuICAgICAgICAgICAgbyA9IGVsZW1lbnQubm9kZSxcbiAgICAgICAgICAgIFNWRyA9IGVsZW1lbnQucGFwZXIsXG4gICAgICAgICAgICBzID0gby5zdHlsZSxcbiAgICAgICAgICAgIGVsID0gUi5fZy5kb2MuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBpZiAoIWVsKSB7XG4gICAgICAgICAgICBncmFkaWVudCA9IFN0cihncmFkaWVudCkucmVwbGFjZShSLl9yYWRpYWxfZ3JhZGllbnQsIGZ1bmN0aW9uIChhbGwsIF9meCwgX2Z5KSB7XG4gICAgICAgICAgICAgICAgdHlwZSA9IFwicmFkaWFsXCI7XG4gICAgICAgICAgICAgICAgaWYgKF9meCAmJiBfZnkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnggPSB0b0Zsb2F0KF9meCk7XG4gICAgICAgICAgICAgICAgICAgIGZ5ID0gdG9GbG9hdChfZnkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyID0gKChmeSA+IC41KSAqIDIgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgcG93KGZ4IC0gLjUsIDIpICsgcG93KGZ5IC0gLjUsIDIpID4gLjI1ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoZnkgPSBtYXRoLnNxcnQoLjI1IC0gcG93KGZ4IC0gLjUsIDIpKSAqIGRpciArIC41KSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgZnkgIT0gLjUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChmeSA9IGZ5LnRvRml4ZWQoNSkgLSAxZS01ICogZGlyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIEU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGdyYWRpZW50ID0gZ3JhZGllbnQuc3BsaXQoL1xccypcXC1cXHMqLyk7XG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImxpbmVhclwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFuZ2xlID0gZ3JhZGllbnQuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBhbmdsZSA9IC10b0Zsb2F0KGFuZ2xlKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4oYW5nbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdmVjdG9yID0gWzAsIDAsIG1hdGguY29zKFIucmFkKGFuZ2xlKSksIG1hdGguc2luKFIucmFkKGFuZ2xlKSldLFxuICAgICAgICAgICAgICAgICAgICBtYXggPSAxIC8gKG1tYXgoYWJzKHZlY3RvclsyXSksIGFicyh2ZWN0b3JbM10pKSB8fCAxKTtcbiAgICAgICAgICAgICAgICB2ZWN0b3JbMl0gKj0gbWF4O1xuICAgICAgICAgICAgICAgIHZlY3RvclszXSAqPSBtYXg7XG4gICAgICAgICAgICAgICAgaWYgKHZlY3RvclsyXSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yWzBdID0gLXZlY3RvclsyXTtcbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yWzJdID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZlY3RvclszXSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yWzFdID0gLXZlY3RvclszXTtcbiAgICAgICAgICAgICAgICAgICAgdmVjdG9yWzNdID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZG90cyA9IFIuX3BhcnNlRG90cyhncmFkaWVudCk7XG4gICAgICAgICAgICBpZiAoIWRvdHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkID0gaWQucmVwbGFjZSgvW1xcKFxcKVxccyxcXHhiMCNdL2csIFwiX1wiKTtcblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuZ3JhZGllbnQgJiYgaWQgIT0gZWxlbWVudC5ncmFkaWVudC5pZCkge1xuICAgICAgICAgICAgICAgIFNWRy5kZWZzLnJlbW92ZUNoaWxkKGVsZW1lbnQuZ3JhZGllbnQpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBlbGVtZW50LmdyYWRpZW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWVsZW1lbnQuZ3JhZGllbnQpIHtcbiAgICAgICAgICAgICAgICBlbCA9ICQodHlwZSArIFwiR3JhZGllbnRcIiwge2lkOiBpZH0pO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuZ3JhZGllbnQgPSBlbDtcbiAgICAgICAgICAgICAgICAkKGVsLCB0eXBlID09IFwicmFkaWFsXCIgPyB7XG4gICAgICAgICAgICAgICAgICAgIGZ4OiBmeCxcbiAgICAgICAgICAgICAgICAgICAgZnk6IGZ5XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgeDE6IHZlY3RvclswXSxcbiAgICAgICAgICAgICAgICAgICAgeTE6IHZlY3RvclsxXSxcbiAgICAgICAgICAgICAgICAgICAgeDI6IHZlY3RvclsyXSxcbiAgICAgICAgICAgICAgICAgICAgeTI6IHZlY3RvclszXSxcbiAgICAgICAgICAgICAgICAgICAgZ3JhZGllbnRUcmFuc2Zvcm06IGVsZW1lbnQubWF0cml4LmludmVydCgpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgU1ZHLmRlZnMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGRvdHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBlbC5hcHBlbmRDaGlsZCgkKFwic3RvcFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IGRvdHNbaV0ub2Zmc2V0ID8gZG90c1tpXS5vZmZzZXQgOiBpID8gXCIxMDAlXCIgOiBcIjAlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInN0b3AtY29sb3JcIjogZG90c1tpXS5jb2xvciB8fCBcIiNmZmZcIlxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICQobywge1xuICAgICAgICAgICAgZmlsbDogXCJ1cmwoJ1wiICsgZG9jdW1lbnQubG9jYXRpb24gKyBcIiNcIiArIGlkICsgXCInKVwiLFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIFwiZmlsbC1vcGFjaXR5XCI6IDFcbiAgICAgICAgfSk7XG4gICAgICAgIHMuZmlsbCA9IEU7XG4gICAgICAgIHMub3BhY2l0eSA9IDE7XG4gICAgICAgIHMuZmlsbE9wYWNpdHkgPSAxO1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9LFxuICAgIHVwZGF0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgdmFyIGJib3ggPSBvLmdldEJCb3goMSk7XG4gICAgICAgICQoby5wYXR0ZXJuLCB7cGF0dGVyblRyYW5zZm9ybTogby5tYXRyaXguaW52ZXJ0KCkgKyBcIiB0cmFuc2xhdGUoXCIgKyBiYm94LnggKyBcIixcIiArIGJib3gueSArIFwiKVwifSk7XG4gICAgfSxcbiAgICBhZGRBcnJvdyA9IGZ1bmN0aW9uIChvLCB2YWx1ZSwgaXNFbmQpIHtcbiAgICAgICAgaWYgKG8udHlwZSA9PSBcInBhdGhcIikge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IFN0cih2YWx1ZSkudG9Mb3dlckNhc2UoKS5zcGxpdChcIi1cIiksXG4gICAgICAgICAgICAgICAgcCA9IG8ucGFwZXIsXG4gICAgICAgICAgICAgICAgc2UgPSBpc0VuZCA/IFwiZW5kXCIgOiBcInN0YXJ0XCIsXG4gICAgICAgICAgICAgICAgbm9kZSA9IG8ubm9kZSxcbiAgICAgICAgICAgICAgICBhdHRycyA9IG8uYXR0cnMsXG4gICAgICAgICAgICAgICAgc3Ryb2tlID0gYXR0cnNbXCJzdHJva2Utd2lkdGhcIl0sXG4gICAgICAgICAgICAgICAgaSA9IHZhbHVlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgdHlwZSA9IFwiY2xhc3NpY1wiLFxuICAgICAgICAgICAgICAgIGZyb20sXG4gICAgICAgICAgICAgICAgdG8sXG4gICAgICAgICAgICAgICAgZHgsXG4gICAgICAgICAgICAgICAgcmVmWCxcbiAgICAgICAgICAgICAgICBhdHRyLFxuICAgICAgICAgICAgICAgIHcgPSAzLFxuICAgICAgICAgICAgICAgIGggPSAzLFxuICAgICAgICAgICAgICAgIHQgPSA1O1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodmFsdWVzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2xhc3NpY1wiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwib3ZhbFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZGlhbW9uZFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwib3BlblwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwibm9uZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwid2lkZVwiOiBoID0gNTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYXJyb3dcIjogaCA9IDI7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwibG9uZ1wiOiB3ID0gNTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzaG9ydFwiOiB3ID0gMjsgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgICAgICB3ICs9IDI7XG4gICAgICAgICAgICAgICAgaCArPSAyO1xuICAgICAgICAgICAgICAgIHQgKz0gMjtcbiAgICAgICAgICAgICAgICBkeCA9IDE7XG4gICAgICAgICAgICAgICAgcmVmWCA9IGlzRW5kID8gNCA6IDE7XG4gICAgICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbDogXCJub25lXCIsXG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZTogYXR0cnMuc3Ryb2tlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVmWCA9IGR4ID0gdyAvIDI7XG4gICAgICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbDogYXR0cnMuc3Ryb2tlLFxuICAgICAgICAgICAgICAgICAgICBzdHJva2U6IFwibm9uZVwiXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvLl8uYXJyb3dzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIG8uXy5hcnJvd3MuZW5kUGF0aCAmJiBtYXJrZXJDb3VudGVyW28uXy5hcnJvd3MuZW5kUGF0aF0tLTtcbiAgICAgICAgICAgICAgICAgICAgby5fLmFycm93cy5lbmRNYXJrZXIgJiYgbWFya2VyQ291bnRlcltvLl8uYXJyb3dzLmVuZE1hcmtlcl0tLTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvLl8uYXJyb3dzLnN0YXJ0UGF0aCAmJiBtYXJrZXJDb3VudGVyW28uXy5hcnJvd3Muc3RhcnRQYXRoXS0tO1xuICAgICAgICAgICAgICAgICAgICBvLl8uYXJyb3dzLnN0YXJ0TWFya2VyICYmIG1hcmtlckNvdW50ZXJbby5fLmFycm93cy5zdGFydE1hcmtlcl0tLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG8uXy5hcnJvd3MgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlICE9IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhJZCA9IFwicmFwaGFlbC1tYXJrZXItXCIgKyB0eXBlLFxuICAgICAgICAgICAgICAgICAgICBtYXJrZXJJZCA9IFwicmFwaGFlbC1tYXJrZXItXCIgKyBzZSArIHR5cGUgKyB3ICsgaCArIFwiLW9ialwiICsgby5pZDtcbiAgICAgICAgICAgICAgICBpZiAoIVIuX2cuZG9jLmdldEVsZW1lbnRCeUlkKHBhdGhJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcC5kZWZzLmFwcGVuZENoaWxkKCQoJChcInBhdGhcIiksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3Ryb2tlLWxpbmVjYXBcIjogXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZDogbWFya2Vyc1t0eXBlXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwYXRoSWRcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJDb3VudGVyW3BhdGhJZF0gPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlckNvdW50ZXJbcGF0aElkXSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbWFya2VyID0gUi5fZy5kb2MuZ2V0RWxlbWVudEJ5SWQobWFya2VySWQpLFxuICAgICAgICAgICAgICAgICAgICB1c2U7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gJCgkKFwibWFya2VyXCIpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogbWFya2VySWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJIZWlnaHQ6IGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJXaWR0aDogdyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWVudDogXCJhdXRvXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZYOiByZWZYLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmWTogaCAvIDJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHVzZSA9ICQoJChcInVzZVwiKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4bGluazpocmVmXCI6IFwiI1wiICsgcGF0aElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAoaXNFbmQgPyBcInJvdGF0ZSgxODAgXCIgKyB3IC8gMiArIFwiIFwiICsgaCAvIDIgKyBcIikgXCIgOiBFKSArIFwic2NhbGUoXCIgKyB3IC8gdCArIFwiLFwiICsgaCAvIHQgKyBcIilcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3Ryb2tlLXdpZHRoXCI6ICgxIC8gKCh3IC8gdCArIGggLyB0KSAvIDIpKS50b0ZpeGVkKDQpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIuYXBwZW5kQ2hpbGQodXNlKTtcbiAgICAgICAgICAgICAgICAgICAgcC5kZWZzLmFwcGVuZENoaWxkKG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlckNvdW50ZXJbbWFya2VySWRdID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJDb3VudGVyW21hcmtlcklkXSsrO1xuICAgICAgICAgICAgICAgICAgICB1c2UgPSBtYXJrZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ1c2VcIilbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQodXNlLCBhdHRyKTtcbiAgICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBkeCAqICh0eXBlICE9IFwiZGlhbW9uZFwiICYmIHR5cGUgIT0gXCJvdmFsXCIpO1xuICAgICAgICAgICAgICAgIGlmIChpc0VuZCkge1xuICAgICAgICAgICAgICAgICAgICBmcm9tID0gby5fLmFycm93cy5zdGFydGR4ICogc3Ryb2tlIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIHRvID0gUi5nZXRUb3RhbExlbmd0aChhdHRycy5wYXRoKSAtIGRlbHRhICogc3Ryb2tlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSBkZWx0YSAqIHN0cm9rZTtcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBSLmdldFRvdGFsTGVuZ3RoKGF0dHJzLnBhdGgpIC0gKG8uXy5hcnJvd3MuZW5kZHggKiBzdHJva2UgfHwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF0dHIgPSB7fTtcbiAgICAgICAgICAgICAgICBhdHRyW1wibWFya2VyLVwiICsgc2VdID0gXCJ1cmwoI1wiICsgbWFya2VySWQgKyBcIilcIjtcbiAgICAgICAgICAgICAgICBpZiAodG8gfHwgZnJvbSkge1xuICAgICAgICAgICAgICAgICAgICBhdHRyLmQgPSBSLmdldFN1YnBhdGgoYXR0cnMucGF0aCwgZnJvbSwgdG8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKG5vZGUsIGF0dHIpO1xuICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Nbc2UgKyBcIlBhdGhcIl0gPSBwYXRoSWQ7XG4gICAgICAgICAgICAgICAgby5fLmFycm93c1tzZSArIFwiTWFya2VyXCJdID0gbWFya2VySWQ7XG4gICAgICAgICAgICAgICAgby5fLmFycm93c1tzZSArIFwiZHhcIl0gPSBkZWx0YTtcbiAgICAgICAgICAgICAgICBvLl8uYXJyb3dzW3NlICsgXCJUeXBlXCJdID0gdHlwZTtcbiAgICAgICAgICAgICAgICBvLl8uYXJyb3dzW3NlICsgXCJTdHJpbmdcIl0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSBvLl8uYXJyb3dzLnN0YXJ0ZHggKiBzdHJva2UgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBSLmdldFRvdGFsTGVuZ3RoKGF0dHJzLnBhdGgpIC0gZnJvbTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBSLmdldFRvdGFsTGVuZ3RoKGF0dHJzLnBhdGgpIC0gKG8uXy5hcnJvd3MuZW5kZHggKiBzdHJva2UgfHwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Nbc2UgKyBcIlBhdGhcIl0gJiYgJChub2RlLCB7ZDogUi5nZXRTdWJwYXRoKGF0dHJzLnBhdGgsIGZyb20sIHRvKX0pO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBvLl8uYXJyb3dzW3NlICsgXCJQYXRoXCJdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBvLl8uYXJyb3dzW3NlICsgXCJNYXJrZXJcIl07XG4gICAgICAgICAgICAgICAgZGVsZXRlIG8uXy5hcnJvd3Nbc2UgKyBcImR4XCJdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBvLl8uYXJyb3dzW3NlICsgXCJUeXBlXCJdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBvLl8uYXJyb3dzW3NlICsgXCJTdHJpbmdcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGF0dHIgaW4gbWFya2VyQ291bnRlcikgaWYgKG1hcmtlckNvdW50ZXJbaGFzXShhdHRyKSAmJiAhbWFya2VyQ291bnRlclthdHRyXSkge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gUi5fZy5kb2MuZ2V0RWxlbWVudEJ5SWQoYXR0cik7XG4gICAgICAgICAgICAgICAgaXRlbSAmJiBpdGVtLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRhc2hhcnJheSA9IHtcbiAgICAgICAgXCJcIjogWzBdLFxuICAgICAgICBcIm5vbmVcIjogWzBdLFxuICAgICAgICBcIi1cIjogWzMsIDFdLFxuICAgICAgICBcIi5cIjogWzEsIDFdLFxuICAgICAgICBcIi0uXCI6IFszLCAxLCAxLCAxXSxcbiAgICAgICAgXCItLi5cIjogWzMsIDEsIDEsIDEsIDEsIDFdLFxuICAgICAgICBcIi4gXCI6IFsxLCAzXSxcbiAgICAgICAgXCItIFwiOiBbNCwgM10sXG4gICAgICAgIFwiLS1cIjogWzgsIDNdLFxuICAgICAgICBcIi0gLlwiOiBbNCwgMywgMSwgM10sXG4gICAgICAgIFwiLS0uXCI6IFs4LCAzLCAxLCAzXSxcbiAgICAgICAgXCItLS4uXCI6IFs4LCAzLCAxLCAzLCAxLCAzXVxuICAgIH0sXG4gICAgYWRkRGFzaGVzID0gZnVuY3Rpb24gKG8sIHZhbHVlLCBwYXJhbXMpIHtcbiAgICAgICAgdmFsdWUgPSBkYXNoYXJyYXlbU3RyKHZhbHVlKS50b0xvd2VyQ2FzZSgpXTtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSBvLmF0dHJzW1wic3Ryb2tlLXdpZHRoXCJdIHx8IFwiMVwiLFxuICAgICAgICAgICAgICAgIGJ1dHQgPSB7cm91bmQ6IHdpZHRoLCBzcXVhcmU6IHdpZHRoLCBidXR0OiAwfVtvLmF0dHJzW1wic3Ryb2tlLWxpbmVjYXBcIl0gfHwgcGFyYW1zW1wic3Ryb2tlLWxpbmVjYXBcIl1dIHx8IDAsXG4gICAgICAgICAgICAgICAgZGFzaGVzID0gW10sXG4gICAgICAgICAgICAgICAgaSA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICBkYXNoZXNbaV0gPSB2YWx1ZVtpXSAqIHdpZHRoICsgKChpICUgMikgPyAxIDogLTEpICogYnV0dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQoby5ub2RlLCB7XCJzdHJva2UtZGFzaGFycmF5XCI6IGRhc2hlcy5qb2luKFwiLFwiKX0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzZXRGaWxsQW5kU3Ryb2tlID0gZnVuY3Rpb24gKG8sIHBhcmFtcykge1xuICAgICAgICB2YXIgbm9kZSA9IG8ubm9kZSxcbiAgICAgICAgICAgIGF0dHJzID0gby5hdHRycyxcbiAgICAgICAgICAgIHZpcyA9IG5vZGUuc3R5bGUudmlzaWJpbGl0eTtcbiAgICAgICAgbm9kZS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgZm9yICh2YXIgYXR0IGluIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHBhcmFtc1toYXNdKGF0dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIVIuX2F2YWlsYWJsZUF0dHJzW2hhc10oYXR0KSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcGFyYW1zW2F0dF07XG4gICAgICAgICAgICAgICAgYXR0cnNbYXR0XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXR0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJibHVyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBvLmJsdXIodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0aXRsZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRpdGxlXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIGV4aXN0aW5nIDx0aXRsZT4uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGl0bGUubGVuZ3RoICYmICh0aXRsZSA9IHRpdGxlWzBdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZS5maXJzdENoaWxkLm5vZGVWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGUgPSAkKFwidGl0bGVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBSLl9nLmRvYy5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlLmFwcGVuZENoaWxkKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQodGl0bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJocmVmXCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0YXJnZXRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwbiA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbi50YWdOYW1lLnRvTG93ZXJDYXNlKCkgIT0gXCJhXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaGwgPSAkKFwiYVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbi5pbnNlcnRCZWZvcmUoaGwsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhsLmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuID0gaGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ID09IFwidGFyZ2V0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbi5zZXRBdHRyaWJ1dGVOUyh4bGluaywgXCJzaG93XCIsIHZhbHVlID09IFwiYmxhbmtcIiA/IFwibmV3XCIgOiB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBuLnNldEF0dHJpYnV0ZU5TKHhsaW5rLCBhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY3Vyc29yXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlLmN1cnNvciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmFuc2Zvcm1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG8udHJhbnNmb3JtKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYXJyb3ctc3RhcnRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFycm93KG8sIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYXJyb3ctZW5kXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRBcnJvdyhvLCB2YWx1ZSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNsaXAtcmVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlY3QgPSBTdHIodmFsdWUpLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVjdC5sZW5ndGggPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uY2xpcCAmJiBvLmNsaXAucGFyZW50Tm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG8uY2xpcC5wYXJlbnROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWwgPSAkKFwiY2xpcFBhdGhcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJjID0gJChcInJlY3RcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuaWQgPSBSLmNyZWF0ZVVVSUQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHJjLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHJlY3RbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHJlY3RbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiByZWN0WzJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHJlY3RbM11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChyYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5wYXBlci5kZWZzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtcImNsaXAtcGF0aFwiOiBcInVybCgjXCIgKyBlbC5pZCArIFwiKVwifSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5jbGlwID0gcmM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhdGggPSBub2RlLmdldEF0dHJpYnV0ZShcImNsaXAtcGF0aFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2xpcCA9IFIuX2cuZG9jLmdldEVsZW1lbnRCeUlkKHBhdGgucmVwbGFjZSgvKF51cmxcXCgjfFxcKSQpL2csIEUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpcCAmJiBjbGlwLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xpcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge1wiY2xpcC1wYXRoXCI6IEV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG8uY2xpcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicGF0aFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8udHlwZSA9PSBcInBhdGhcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge2Q6IHZhbHVlID8gYXR0cnMucGF0aCA9IFIuX3BhdGhUb0Fic29sdXRlKHZhbHVlKSA6IFwiTTAsMFwifSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5fLmFycm93cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN0YXJ0U3RyaW5nXCIgaW4gby5fLmFycm93cyAmJiBhZGRBcnJvdyhvLCBvLl8uYXJyb3dzLnN0YXJ0U3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlbmRTdHJpbmdcIiBpbiBvLl8uYXJyb3dzICYmIGFkZEFycm93KG8sIG8uXy5hcnJvd3MuZW5kU3RyaW5nLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIndpZHRoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuZngpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHQgPSBcInhcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGF0dHJzLng7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwieFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmZ4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAtYXR0cnMueCAtIChhdHRycy53aWR0aCB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJ4XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ID09IFwicnhcIiAmJiBvLnR5cGUgPT0gXCJyZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImN4XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0dGVybiAmJiB1cGRhdGVQb3NpdGlvbihvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImhlaWdodFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmZ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ID0gXCJ5XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhdHRycy55O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5meSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gLWF0dHJzLnkgLSAoYXR0cnMuaGVpZ2h0IHx8IDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicnlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHQgPT0gXCJyeVwiICYmIG8udHlwZSA9PSBcInJlY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY3lcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5wYXR0ZXJuICYmIHVwZGF0ZVBvc2l0aW9uKG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiclwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8udHlwZSA9PSBcInJlY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge3J4OiB2YWx1ZSwgcnk6IHZhbHVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic3JjXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby50eXBlID09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlTlMoeGxpbmssIFwiaHJlZlwiLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInN0cm9rZS13aWR0aFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8uXy5zeCAhPSAxIHx8IG8uXy5zeSAhPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgLz0gbW1heChhYnMoby5fLnN4KSwgYWJzKG8uXy5zeSkpIHx8IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRyc1tcInN0cm9rZS1kYXNoYXJyYXlcIl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGREYXNoZXMobywgYXR0cnNbXCJzdHJva2UtZGFzaGFycmF5XCJdLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8uXy5hcnJvd3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN0YXJ0U3RyaW5nXCIgaW4gby5fLmFycm93cyAmJiBhZGRBcnJvdyhvLCBvLl8uYXJyb3dzLnN0YXJ0U3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVuZFN0cmluZ1wiIGluIG8uXy5hcnJvd3MgJiYgYWRkQXJyb3cobywgby5fLmFycm93cy5lbmRTdHJpbmcsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJva2UtZGFzaGFycmF5XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGREYXNoZXMobywgdmFsdWUsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImZpbGxcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1VSTCA9IFN0cih2YWx1ZSkubWF0Y2goUi5fSVNVUkwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwgPSAkKFwicGF0dGVyblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWcgPSAkKFwiaW1hZ2VcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuaWQgPSBSLmNyZWF0ZVVVSUQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGVsLCB7eDogMCwgeTogMCwgcGF0dGVyblVuaXRzOiBcInVzZXJTcGFjZU9uVXNlXCIsIGhlaWdodDogMSwgd2lkdGg6IDF9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlnLCB7eDogMCwgeTogMCwgXCJ4bGluazpocmVmXCI6IGlzVVJMWzFdfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoaWcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSLl9wcmVsb2FkKGlzVVJMWzFdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdyA9IHRoaXMub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCA9IHRoaXMub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChlbCwge3dpZHRoOiB3LCBoZWlnaHQ6IGh9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaWcsIHt3aWR0aDogdywgaGVpZ2h0OiBofSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLnBhcGVyLnNhZmFyaSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KShlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5wYXBlci5kZWZzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtmaWxsOiBcInVybCgjXCIgKyBlbC5pZCArIFwiKVwifSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5wYXR0ZXJuID0gZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgby5wYXR0ZXJuICYmIHVwZGF0ZVBvc2l0aW9uKG8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNsciA9IFIuZ2V0UkdCKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2xyLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHBhcmFtcy5ncmFkaWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgYXR0cnMuZ3JhZGllbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIVIuaXMoYXR0cnMub3BhY2l0eSwgXCJ1bmRlZmluZWRcIikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUi5pcyhwYXJhbXMub3BhY2l0eSwgXCJ1bmRlZmluZWRcIikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7b3BhY2l0eTogYXR0cnMub3BhY2l0eX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFSLmlzKGF0dHJzW1wiZmlsbC1vcGFjaXR5XCJdLCBcInVuZGVmaW5lZFwiKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSLmlzKHBhcmFtc1tcImZpbGwtb3BhY2l0eVwiXSwgXCJ1bmRlZmluZWRcIikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7XCJmaWxsLW9wYWNpdHlcIjogYXR0cnNbXCJmaWxsLW9wYWNpdHlcIl19KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKG8udHlwZSA9PSBcImNpcmNsZVwiIHx8IG8udHlwZSA9PSBcImVsbGlwc2VcIiB8fCBTdHIodmFsdWUpLmNoYXJBdCgpICE9IFwiclwiKSAmJiBhZGRHcmFkaWVudEZpbGwobywgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFwib3BhY2l0eVwiIGluIGF0dHJzIHx8IFwiZmlsbC1vcGFjaXR5XCIgaW4gYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdyYWRpZW50ID0gUi5fZy5kb2MuZ2V0RWxlbWVudEJ5SWQobm9kZS5nZXRBdHRyaWJ1dGUoXCJmaWxsXCIpLnJlcGxhY2UoL151cmxcXCgjfFxcKSQvZywgRSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ3JhZGllbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdG9wcyA9IGdyYWRpZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3RvcFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoc3RvcHNbc3RvcHMubGVuZ3RoIC0gMV0sIHtcInN0b3Atb3BhY2l0eVwiOiAoXCJvcGFjaXR5XCIgaW4gYXR0cnMgPyBhdHRycy5vcGFjaXR5IDogMSkgKiAoXCJmaWxsLW9wYWNpdHlcIiBpbiBhdHRycyA/IGF0dHJzW1wiZmlsbC1vcGFjaXR5XCJdIDogMSl9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRycy5ncmFkaWVudCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzLmZpbGwgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNscltoYXNdKFwib3BhY2l0eVwiKSAmJiAkKG5vZGUsIHtcImZpbGwtb3BhY2l0eVwiOiBjbHIub3BhY2l0eSA+IDEgPyBjbHIub3BhY2l0eSAvIDEwMCA6IGNsci5vcGFjaXR5fSk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJva2VcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsciA9IFIuZ2V0UkdCKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgY2xyLmhleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdHQgPT0gXCJzdHJva2VcIiAmJiBjbHJbaGFzXShcIm9wYWNpdHlcIikgJiYgJChub2RlLCB7XCJzdHJva2Utb3BhY2l0eVwiOiBjbHIub3BhY2l0eSA+IDEgPyBjbHIub3BhY2l0eSAvIDEwMCA6IGNsci5vcGFjaXR5fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ID09IFwic3Ryb2tlXCIgJiYgby5fLmFycm93cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic3RhcnRTdHJpbmdcIiBpbiBvLl8uYXJyb3dzICYmIGFkZEFycm93KG8sIG8uXy5hcnJvd3Muc3RhcnRTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZW5kU3RyaW5nXCIgaW4gby5fLmFycm93cyAmJiBhZGRBcnJvdyhvLCBvLl8uYXJyb3dzLmVuZFN0cmluZywgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImdyYWRpZW50XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAoby50eXBlID09IFwiY2lyY2xlXCIgfHwgby50eXBlID09IFwiZWxsaXBzZVwiIHx8IFN0cih2YWx1ZSkuY2hhckF0KCkgIT0gXCJyXCIpICYmIGFkZEdyYWRpZW50RmlsbChvLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm9wYWNpdHlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5ncmFkaWVudCAmJiAhYXR0cnNbaGFzXShcInN0cm9rZS1vcGFjaXR5XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7XCJzdHJva2Utb3BhY2l0eVwiOiB2YWx1ZSA+IDEgPyB2YWx1ZSAvIDEwMCA6IHZhbHVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmaWxsLW9wYWNpdHlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5ncmFkaWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYWRpZW50ID0gUi5fZy5kb2MuZ2V0RWxlbWVudEJ5SWQobm9kZS5nZXRBdHRyaWJ1dGUoXCJmaWxsXCIpLnJlcGxhY2UoL151cmxcXCgjfFxcKSQvZywgRSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChncmFkaWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9wcyA9IGdyYWRpZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3RvcFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChzdG9wc1tzdG9wcy5sZW5ndGggLSAxXSwge1wic3RvcC1vcGFjaXR5XCI6IHZhbHVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0ID09IFwiZm9udC1zaXplXCIgJiYgKHZhbHVlID0gdG9JbnQodmFsdWUsIDEwKSArIFwicHhcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3NzcnVsZSA9IGF0dC5yZXBsYWNlKC8oXFwtLikvZywgZnVuY3Rpb24gKHcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdy5zdWJzdHJpbmcoMSkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZVtjc3NydWxlXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHVuZVRleHQobywgcGFyYW1zKTtcbiAgICAgICAgbm9kZS5zdHlsZS52aXNpYmlsaXR5ID0gdmlzO1xuICAgIH0sXG4gICAgbGVhZGluZyA9IDEuMixcbiAgICB0dW5lVGV4dCA9IGZ1bmN0aW9uIChlbCwgcGFyYW1zKSB7XG4gICAgICAgIGlmIChlbC50eXBlICE9IFwidGV4dFwiIHx8ICEocGFyYW1zW2hhc10oXCJ0ZXh0XCIpIHx8IHBhcmFtc1toYXNdKFwiZm9udFwiKSB8fCBwYXJhbXNbaGFzXShcImZvbnQtc2l6ZVwiKSB8fCBwYXJhbXNbaGFzXShcInhcIikgfHwgcGFyYW1zW2hhc10oXCJ5XCIpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhID0gZWwuYXR0cnMsXG4gICAgICAgICAgICBub2RlID0gZWwubm9kZSxcbiAgICAgICAgICAgIGZvbnRTaXplID0gbm9kZS5maXJzdENoaWxkID8gdG9JbnQoUi5fZy5kb2MuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShub2RlLmZpcnN0Q2hpbGQsIEUpLmdldFByb3BlcnR5VmFsdWUoXCJmb250LXNpemVcIiksIDEwKSA6IDEwO1xuXG4gICAgICAgIGlmIChwYXJhbXNbaGFzXShcInRleHRcIikpIHtcbiAgICAgICAgICAgIGEudGV4dCA9IHBhcmFtcy50ZXh0O1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0ZXh0cyA9IFN0cihwYXJhbXMudGV4dCkuc3BsaXQoXCJcXG5cIiksXG4gICAgICAgICAgICAgICAgdHNwYW5zID0gW10sXG4gICAgICAgICAgICAgICAgdHNwYW47XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0ZXh0cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdHNwYW4gPSAkKFwidHNwYW5cIik7XG4gICAgICAgICAgICAgICAgaSAmJiAkKHRzcGFuLCB7ZHk6IGZvbnRTaXplICogbGVhZGluZywgeDogYS54fSk7XG4gICAgICAgICAgICAgICAgdHNwYW4uYXBwZW5kQ2hpbGQoUi5fZy5kb2MuY3JlYXRlVGV4dE5vZGUodGV4dHNbaV0pKTtcbiAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKHRzcGFuKTtcbiAgICAgICAgICAgICAgICB0c3BhbnNbaV0gPSB0c3BhbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRzcGFucyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0c3BhblwiKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gdHNwYW5zLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChpKSB7XG4gICAgICAgICAgICAgICAgJCh0c3BhbnNbaV0sIHtkeTogZm9udFNpemUgKiBsZWFkaW5nLCB4OiBhLnh9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCh0c3BhbnNbMF0sIHtkeTogMH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICQobm9kZSwge3g6IGEueCwgeTogYS55fSk7XG4gICAgICAgIGVsLl8uZGlydHkgPSAxO1xuICAgICAgICB2YXIgYmIgPSBlbC5fZ2V0QkJveCgpLFxuICAgICAgICAgICAgZGlmID0gYS55IC0gKGJiLnkgKyBiYi5oZWlnaHQgLyAyKTtcbiAgICAgICAgZGlmICYmIFIuaXMoZGlmLCBcImZpbml0ZVwiKSAmJiAkKHRzcGFuc1swXSwge2R5OiBkaWZ9KTtcbiAgICB9LFxuICAgIGdldFJlYWxOb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImFcIikge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBFbGVtZW50ID0gZnVuY3Rpb24gKG5vZGUsIHN2Zykge1xuICAgICAgICB2YXIgWCA9IDAsXG4gICAgICAgICAgICBZID0gMDtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBFbGVtZW50Lm5vZGVcbiAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgKipcbiAgICAgICAgICogR2l2ZXMgeW91IGEgcmVmZXJlbmNlIHRvIHRoZSBET00gb2JqZWN0LCBzbyB5b3UgY2FuIGFzc2lnbiBldmVudCBoYW5kbGVycyBvciBqdXN0IG1lc3MgYXJvdW5kLlxuICAgICAgICAgKipcbiAgICAgICAgICogTm90ZTogRG9u4oCZdCBtZXNzIHdpdGggaXQuXG4gICAgICAgICA+IFVzYWdlXG4gICAgICAgICB8IC8vIGRyYXcgYSBjaXJjbGUgYXQgY29vcmRpbmF0ZSAxMCwxMCB3aXRoIHJhZGl1cyBvZiAxMFxuICAgICAgICAgfCB2YXIgYyA9IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDEwKTtcbiAgICAgICAgIHwgYy5ub2RlLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICB8ICAgICBjLmF0dHIoXCJmaWxsXCIsIFwicmVkXCIpO1xuICAgICAgICAgfCB9O1xuICAgICAgICBcXCovXG4gICAgICAgIHRoaXNbMF0gPSB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIEVsZW1lbnQucmFwaGFlbFxuICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBJbnRlcm5hbCByZWZlcmVuY2UgdG8gQFJhcGhhZWwgb2JqZWN0LiBJbiBjYXNlIGl0IGlzIG5vdCBhdmFpbGFibGUuXG4gICAgICAgICA+IFVzYWdlXG4gICAgICAgICB8IFJhcGhhZWwuZWwucmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgfCAgICAgdmFyIGhzYiA9IHRoaXMucGFwZXIucmFwaGFlbC5yZ2IyaHNiKHRoaXMuYXR0cihcImZpbGxcIikpO1xuICAgICAgICAgfCAgICAgaHNiLmggPSAxO1xuICAgICAgICAgfCAgICAgdGhpcy5hdHRyKHtmaWxsOiB0aGlzLnBhcGVyLnJhcGhhZWwuaHNiMnJnYihoc2IpLmhleH0pO1xuICAgICAgICAgfCB9XG4gICAgICAgIFxcKi9cbiAgICAgICAgbm9kZS5yYXBoYWVsID0gdHJ1ZTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBFbGVtZW50LmlkXG4gICAgICAgICBbIHByb3BlcnR5IChudW1iZXIpIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFVuaXF1ZSBpZCBvZiB0aGUgZWxlbWVudC4gRXNwZWNpYWxseSB1c2VmdWwgd2hlbiB5b3Ugd2FudCB0byBsaXN0ZW4gdG8gZXZlbnRzIG9mIHRoZSBlbGVtZW50LFxuICAgICAgICAgKiBiZWNhdXNlIGFsbCBldmVudHMgYXJlIGZpcmVkIGluIGZvcm1hdCBgPG1vZHVsZT4uPGFjdGlvbj4uPGlkPmAuIEFsc28gdXNlZnVsIGZvciBAUGFwZXIuZ2V0QnlJZCBtZXRob2QuXG4gICAgICAgIFxcKi9cbiAgICAgICAgdGhpcy5pZCA9IFIuX29pZCsrO1xuICAgICAgICBub2RlLnJhcGhhZWxpZCA9IHRoaXMuaWQ7XG4gICAgICAgIHRoaXMubWF0cml4ID0gUi5tYXRyaXgoKTtcbiAgICAgICAgdGhpcy5yZWFsUGF0aCA9IG51bGw7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogRWxlbWVudC5wYXBlclxuICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBJbnRlcm5hbCByZWZlcmVuY2UgdG8g4oCccGFwZXLigJ0gd2hlcmUgb2JqZWN0IGRyYXduLiBNYWlubHkgZm9yIHVzZSBpbiBwbHVnaW5zIGFuZCBlbGVtZW50IGV4dGVuc2lvbnMuXG4gICAgICAgICA+IFVzYWdlXG4gICAgICAgICB8IFJhcGhhZWwuZWwuY3Jvc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICB8ICAgICB0aGlzLmF0dHIoe2ZpbGw6IFwicmVkXCJ9KTtcbiAgICAgICAgIHwgICAgIHRoaXMucGFwZXIucGF0aChcIk0xMCwxMEw1MCw1ME01MCwxMEwxMCw1MFwiKVxuICAgICAgICAgfCAgICAgICAgIC5hdHRyKHtzdHJva2U6IFwicmVkXCJ9KTtcbiAgICAgICAgIHwgfVxuICAgICAgICBcXCovXG4gICAgICAgIHRoaXMucGFwZXIgPSBzdmc7XG4gICAgICAgIHRoaXMuYXR0cnMgPSB0aGlzLmF0dHJzIHx8IHt9O1xuICAgICAgICB0aGlzLl8gPSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFtdLFxuICAgICAgICAgICAgc3g6IDEsXG4gICAgICAgICAgICBzeTogMSxcbiAgICAgICAgICAgIGRlZzogMCxcbiAgICAgICAgICAgIGR4OiAwLFxuICAgICAgICAgICAgZHk6IDAsXG4gICAgICAgICAgICBkaXJ0eTogMVxuICAgICAgICB9O1xuICAgICAgICAhc3ZnLmJvdHRvbSAmJiAoc3ZnLmJvdHRvbSA9IHRoaXMpO1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIEVsZW1lbnQucHJldlxuICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZWZlcmVuY2UgdG8gdGhlIHByZXZpb3VzIGVsZW1lbnQgaW4gdGhlIGhpZXJhcmNoeS5cbiAgICAgICAgXFwqL1xuICAgICAgICB0aGlzLnByZXYgPSBzdmcudG9wO1xuICAgICAgICBzdmcudG9wICYmIChzdmcudG9wLm5leHQgPSB0aGlzKTtcbiAgICAgICAgc3ZnLnRvcCA9IHRoaXM7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogRWxlbWVudC5uZXh0XG4gICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJlZmVyZW5jZSB0byB0aGUgbmV4dCBlbGVtZW50IGluIHRoZSBoaWVyYXJjaHkuXG4gICAgICAgIFxcKi9cbiAgICAgICAgdGhpcy5uZXh0ID0gbnVsbDtcbiAgICB9LFxuICAgIGVscHJvdG8gPSBSLmVsO1xuXG4gICAgRWxlbWVudC5wcm90b3R5cGUgPSBlbHByb3RvO1xuICAgIGVscHJvdG8uY29uc3RydWN0b3IgPSBFbGVtZW50O1xuXG4gICAgUi5fZW5naW5lLnBhdGggPSBmdW5jdGlvbiAocGF0aFN0cmluZywgU1ZHKSB7XG4gICAgICAgIHZhciBlbCA9ICQoXCJwYXRoXCIpO1xuICAgICAgICBTVkcuY2FudmFzICYmIFNWRy5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgcCA9IG5ldyBFbGVtZW50KGVsLCBTVkcpO1xuICAgICAgICBwLnR5cGUgPSBcInBhdGhcIjtcbiAgICAgICAgc2V0RmlsbEFuZFN0cm9rZShwLCB7XG4gICAgICAgICAgICBmaWxsOiBcIm5vbmVcIixcbiAgICAgICAgICAgIHN0cm9rZTogXCIjMDAwXCIsXG4gICAgICAgICAgICBwYXRoOiBwYXRoU3RyaW5nXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnJvdGF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZCEgVXNlIEBFbGVtZW50LnRyYW5zZm9ybSBpbnN0ZWFkLlxuICAgICAqIEFkZHMgcm90YXRpb24gYnkgZ2l2ZW4gYW5nbGUgYXJvdW5kIGdpdmVuIHBvaW50IHRvIHRoZSBsaXN0IG9mXG4gICAgICogdHJhbnNmb3JtYXRpb25zIG9mIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBkZWcgKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuICAgICAtIGN4IChudW1iZXIpICNvcHRpb25hbCB4IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZSBvZiByb3RhdGlvblxuICAgICAtIGN5IChudW1iZXIpICNvcHRpb25hbCB5IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZSBvZiByb3RhdGlvblxuICAgICAqIElmIGN4ICYgY3kgYXJlbuKAmXQgc3BlY2lmaWVkIGNlbnRyZSBvZiB0aGUgc2hhcGUgaXMgdXNlZCBhcyBhIHBvaW50IG9mIHJvdGF0aW9uLlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucm90YXRlID0gZnVuY3Rpb24gKGRlZywgY3gsIGN5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGRlZyA9IFN0cihkZWcpLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIGlmIChkZWcubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgY3ggPSB0b0Zsb2F0KGRlZ1sxXSk7XG4gICAgICAgICAgICBjeSA9IHRvRmxvYXQoZGVnWzJdKTtcbiAgICAgICAgfVxuICAgICAgICBkZWcgPSB0b0Zsb2F0KGRlZ1swXSk7XG4gICAgICAgIChjeSA9PSBudWxsKSAmJiAoY3ggPSBjeSk7XG4gICAgICAgIGlmIChjeCA9PSBudWxsIHx8IGN5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBiYm94ID0gdGhpcy5nZXRCQm94KDEpO1xuICAgICAgICAgICAgY3ggPSBiYm94LnggKyBiYm94LndpZHRoIC8gMjtcbiAgICAgICAgICAgIGN5ID0gYmJveC55ICsgYmJveC5oZWlnaHQgLyAyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHJhbnNmb3JtKHRoaXMuXy50cmFuc2Zvcm0uY29uY2F0KFtbXCJyXCIsIGRlZywgY3gsIGN5XV0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zY2FsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVwcmVjYXRlZCEgVXNlIEBFbGVtZW50LnRyYW5zZm9ybSBpbnN0ZWFkLlxuICAgICAqIEFkZHMgc2NhbGUgYnkgZ2l2ZW4gYW1vdW50IHJlbGF0aXZlIHRvIGdpdmVuIHBvaW50IHRvIHRoZSBsaXN0IG9mXG4gICAgICogdHJhbnNmb3JtYXRpb25zIG9mIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBzeCAobnVtYmVyKSBob3Jpc29udGFsIHNjYWxlIGFtb3VudFxuICAgICAtIHN5IChudW1iZXIpIHZlcnRpY2FsIHNjYWxlIGFtb3VudFxuICAgICAtIGN4IChudW1iZXIpICNvcHRpb25hbCB4IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZSBvZiBzY2FsZVxuICAgICAtIGN5IChudW1iZXIpICNvcHRpb25hbCB5IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZSBvZiBzY2FsZVxuICAgICAqIElmIGN4ICYgY3kgYXJlbuKAmXQgc3BlY2lmaWVkIGNlbnRyZSBvZiB0aGUgc2hhcGUgaXMgdXNlZCBpbnN0ZWFkLlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uc2NhbGUgPSBmdW5jdGlvbiAoc3gsIHN5LCBjeCwgY3kpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgc3ggPSBTdHIoc3gpLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIGlmIChzeC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBzeSA9IHRvRmxvYXQoc3hbMV0pO1xuICAgICAgICAgICAgY3ggPSB0b0Zsb2F0KHN4WzJdKTtcbiAgICAgICAgICAgIGN5ID0gdG9GbG9hdChzeFszXSk7XG4gICAgICAgIH1cbiAgICAgICAgc3ggPSB0b0Zsb2F0KHN4WzBdKTtcbiAgICAgICAgKHN5ID09IG51bGwpICYmIChzeSA9IHN4KTtcbiAgICAgICAgKGN5ID09IG51bGwpICYmIChjeCA9IGN5KTtcbiAgICAgICAgaWYgKGN4ID09IG51bGwgfHwgY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGJib3ggPSB0aGlzLmdldEJCb3goMSk7XG4gICAgICAgIH1cbiAgICAgICAgY3ggPSBjeCA9PSBudWxsID8gYmJveC54ICsgYmJveC53aWR0aCAvIDIgOiBjeDtcbiAgICAgICAgY3kgPSBjeSA9PSBudWxsID8gYmJveC55ICsgYmJveC5oZWlnaHQgLyAyIDogY3k7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtKHRoaXMuXy50cmFuc2Zvcm0uY29uY2F0KFtbXCJzXCIsIHN4LCBzeSwgY3gsIGN5XV0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50cmFuc2xhdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQhIFVzZSBARWxlbWVudC50cmFuc2Zvcm0gaW5zdGVhZC5cbiAgICAgKiBBZGRzIHRyYW5zbGF0aW9uIGJ5IGdpdmVuIGFtb3VudCB0byB0aGUgbGlzdCBvZiB0cmFuc2Zvcm1hdGlvbnMgb2YgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGR4IChudW1iZXIpIGhvcmlzb250YWwgc2hpZnRcbiAgICAgLSBkeSAobnVtYmVyKSB2ZXJ0aWNhbCBzaGlmdFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udHJhbnNsYXRlID0gZnVuY3Rpb24gKGR4LCBkeSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkeCA9IFN0cihkeCkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKGR4Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGR5ID0gdG9GbG9hdChkeFsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgZHggPSB0b0Zsb2F0KGR4WzBdKSB8fCAwO1xuICAgICAgICBkeSA9ICtkeSB8fCAwO1xuICAgICAgICB0aGlzLnRyYW5zZm9ybSh0aGlzLl8udHJhbnNmb3JtLmNvbmNhdChbW1widFwiLCBkeCwgZHldXSkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRyYW5zZm9ybVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyB0cmFuc2Zvcm1hdGlvbiB0byB0aGUgZWxlbWVudCB3aGljaCBpcyBzZXBhcmF0ZSB0byBvdGhlciBhdHRyaWJ1dGVzLFxuICAgICAqIGkuZS4gdHJhbnNsYXRpb24gZG9lc27igJl0IGNoYW5nZSBgeGAgb3IgYHlgIG9mIHRoZSByZWN0YW5nZS4gVGhlIGZvcm1hdFxuICAgICAqIG9mIHRyYW5zZm9ybWF0aW9uIHN0cmluZyBpcyBzaW1pbGFyIHRvIHRoZSBwYXRoIHN0cmluZyBzeW50YXg6XG4gICAgIHwgXCJ0MTAwLDEwMHIzMCwxMDAsMTAwczIsMiwxMDAsMTAwcjQ1czEuNVwiXG4gICAgICogRWFjaCBsZXR0ZXIgaXMgYSBjb21tYW5kLiBUaGVyZSBhcmUgZm91ciBjb21tYW5kczogYHRgIGlzIGZvciB0cmFuc2xhdGUsIGByYCBpcyBmb3Igcm90YXRlLCBgc2AgaXMgZm9yXG4gICAgICogc2NhbGUgYW5kIGBtYCBpcyBmb3IgbWF0cml4LlxuICAgICAqXG4gICAgICogVGhlcmUgYXJlIGFsc28gYWx0ZXJuYXRpdmUg4oCcYWJzb2x1dGXigJ0gdHJhbnNsYXRpb24sIHJvdGF0aW9uIGFuZCBzY2FsZTogYFRgLCBgUmAgYW5kIGBTYC4gVGhleSB3aWxsIG5vdCB0YWtlIHByZXZpb3VzIHRyYW5zZm9ybWF0aW9uIGludG8gYWNjb3VudC4gRm9yIGV4YW1wbGUsIGAuLi5UMTAwLDBgIHdpbGwgYWx3YXlzIG1vdmUgZWxlbWVudCAxMDAgcHggaG9yaXNvbnRhbGx5LCB3aGlsZSBgLi4udDEwMCwwYCBjb3VsZCBtb3ZlIGl0IHZlcnRpY2FsbHkgaWYgdGhlcmUgaXMgYHI5MGAgYmVmb3JlLiBKdXN0IGNvbXBhcmUgcmVzdWx0cyBvZiBgcjkwdDEwMCwwYCBhbmQgYHI5MFQxMDAsMGAuXG4gICAgICpcbiAgICAgKiBTbywgdGhlIGV4YW1wbGUgbGluZSBhYm92ZSBjb3VsZCBiZSByZWFkIGxpa2Ug4oCcdHJhbnNsYXRlIGJ5IDEwMCwgMTAwOyByb3RhdGUgMzDCsCBhcm91bmQgMTAwLCAxMDA7IHNjYWxlIHR3aWNlIGFyb3VuZCAxMDAsIDEwMDtcbiAgICAgKiByb3RhdGUgNDXCsCBhcm91bmQgY2VudHJlOyBzY2FsZSAxLjUgdGltZXMgcmVsYXRpdmUgdG8gY2VudHJl4oCdLiBBcyB5b3UgY2FuIHNlZSByb3RhdGUgYW5kIHNjYWxlIGNvbW1hbmRzIGhhdmUgb3JpZ2luXG4gICAgICogY29vcmRpbmF0ZXMgYXMgb3B0aW9uYWwgcGFyYW1ldGVycywgdGhlIGRlZmF1bHQgaXMgdGhlIGNlbnRyZSBwb2ludCBvZiB0aGUgZWxlbWVudC5cbiAgICAgKiBNYXRyaXggYWNjZXB0cyBzaXggcGFyYW1ldGVycy5cbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBlbCA9IHBhcGVyLnJlY3QoMTAsIDIwLCAzMDAsIDIwMCk7XG4gICAgIHwgLy8gdHJhbnNsYXRlIDEwMCwgMTAwLCByb3RhdGUgNDXCsCwgdHJhbnNsYXRlIC0xMDAsIDBcbiAgICAgfCBlbC50cmFuc2Zvcm0oXCJ0MTAwLDEwMHI0NXQtMTAwLDBcIik7XG4gICAgIHwgLy8gaWYgeW91IHdhbnQgeW91IGNhbiBhcHBlbmQgb3IgcHJlcGVuZCB0cmFuc2Zvcm1hdGlvbnNcbiAgICAgfCBlbC50cmFuc2Zvcm0oXCIuLi50NTAsNTBcIik7XG4gICAgIHwgZWwudHJhbnNmb3JtKFwiczIuLi5cIik7XG4gICAgIHwgLy8gb3IgZXZlbiB3cmFwXG4gICAgIHwgZWwudHJhbnNmb3JtKFwidDUwLDUwLi4udC01MC01MFwiKTtcbiAgICAgfCAvLyB0byByZXNldCB0cmFuc2Zvcm1hdGlvbiBjYWxsIG1ldGhvZCB3aXRoIGVtcHR5IHN0cmluZ1xuICAgICB8IGVsLnRyYW5zZm9ybShcIlwiKTtcbiAgICAgfCAvLyB0byBnZXQgY3VycmVudCB2YWx1ZSBjYWxsIGl0IHdpdGhvdXQgcGFyYW1ldGVyc1xuICAgICB8IGNvbnNvbGUubG9nKGVsLnRyYW5zZm9ybSgpKTtcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gdHN0ciAoc3RyaW5nKSAjb3B0aW9uYWwgdHJhbnNmb3JtYXRpb24gc3RyaW5nXG4gICAgICogSWYgdHN0ciBpc27igJl0IHNwZWNpZmllZFxuICAgICA9IChzdHJpbmcpIGN1cnJlbnQgdHJhbnNmb3JtYXRpb24gc3RyaW5nXG4gICAgICogZWxzZVxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24gKHRzdHIpIHtcbiAgICAgICAgdmFyIF8gPSB0aGlzLl87XG4gICAgICAgIGlmICh0c3RyID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnRyYW5zZm9ybTtcbiAgICAgICAgfVxuICAgICAgICBSLl9leHRyYWN0VHJhbnNmb3JtKHRoaXMsIHRzdHIpO1xuXG4gICAgICAgIHRoaXMuY2xpcCAmJiAkKHRoaXMuY2xpcCwge3RyYW5zZm9ybTogdGhpcy5tYXRyaXguaW52ZXJ0KCl9KTtcbiAgICAgICAgdGhpcy5wYXR0ZXJuICYmIHVwZGF0ZVBvc2l0aW9uKHRoaXMpO1xuICAgICAgICB0aGlzLm5vZGUgJiYgJCh0aGlzLm5vZGUsIHt0cmFuc2Zvcm06IHRoaXMubWF0cml4fSk7XG5cbiAgICAgICAgaWYgKF8uc3ggIT0gMSB8fCBfLnN5ICE9IDEpIHtcbiAgICAgICAgICAgIHZhciBzdyA9IHRoaXMuYXR0cnNbaGFzXShcInN0cm9rZS13aWR0aFwiKSA/IHRoaXMuYXR0cnNbXCJzdHJva2Utd2lkdGhcIl0gOiAxO1xuICAgICAgICAgICAgdGhpcy5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzd30pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5oaWRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBNYWtlcyBlbGVtZW50IGludmlzaWJsZS4gU2VlIEBFbGVtZW50LnNob3cuXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAhdGhpcy5yZW1vdmVkICYmIHRoaXMucGFwZXIuc2FmYXJpKHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnNob3dcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE1ha2VzIGVsZW1lbnQgdmlzaWJsZS4gU2VlIEBFbGVtZW50LmhpZGUuXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAhdGhpcy5yZW1vdmVkICYmIHRoaXMucGFwZXIuc2FmYXJpKHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJcIik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucmVtb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGVsZW1lbnQgZnJvbSB0aGUgcGFwZXIuXG4gICAgXFwqL1xuICAgIGVscHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZSA9IGdldFJlYWxOb2RlKHRoaXMubm9kZSk7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQgfHwgIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXBlciA9IHRoaXMucGFwZXI7XG4gICAgICAgIHBhcGVyLl9fc2V0X18gJiYgcGFwZXIuX19zZXRfXy5leGNsdWRlKHRoaXMpO1xuICAgICAgICBldmUudW5iaW5kKFwicmFwaGFlbC4qLiouXCIgKyB0aGlzLmlkKTtcbiAgICAgICAgaWYgKHRoaXMuZ3JhZGllbnQpIHtcbiAgICAgICAgICAgIHBhcGVyLmRlZnMucmVtb3ZlQ2hpbGQodGhpcy5ncmFkaWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgUi5fdGVhcih0aGlzLCBwYXBlcik7XG5cbiAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuXG4gICAgICAgIC8vIFJlbW92ZSBjdXN0b20gZGF0YSBmb3IgZWxlbWVudFxuICAgICAgICB0aGlzLnJlbW92ZURhdGEoKTtcblxuICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbaV0gPSB0eXBlb2YgdGhpc1tpXSA9PSBcImZ1bmN0aW9uXCIgPyBSLl9yZW1vdmVkRmFjdG9yeShpKSA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIGVscHJvdG8uX2dldEJCb3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgdGhpcy5zaG93KCk7XG4gICAgICAgICAgICB2YXIgaGlkZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhbnZhc0hpZGRlbiA9IGZhbHNlLFxuICAgICAgICAgICAgY29udGFpbmVyU3R5bGU7XG4gICAgICAgIGlmICh0aGlzLnBhcGVyLmNhbnZhcy5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgY29udGFpbmVyU3R5bGUgPSB0aGlzLnBhcGVyLmNhbnZhcy5wYXJlbnRFbGVtZW50LnN0eWxlO1xuICAgICAgICB9IC8vSUUxMCsgY2FuJ3QgZmluZCBwYXJlbnRFbGVtZW50XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucGFwZXIuY2FudmFzLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICBjb250YWluZXJTdHlsZSA9IHRoaXMucGFwZXIuY2FudmFzLnBhcmVudE5vZGUuc3R5bGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZihjb250YWluZXJTdHlsZSAmJiBjb250YWluZXJTdHlsZS5kaXNwbGF5ID09IFwibm9uZVwiKSB7XG4gICAgICAgICAgY2FudmFzSGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICBjb250YWluZXJTdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYmJveCA9IHt9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYmJveCA9IHRoaXMubm9kZS5nZXRCQm94KCk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgLy8gRmlyZWZveCAzLjAueCwgMjUuMC4xIChwcm9iYWJseSBtb3JlIHZlcnNpb25zIGFmZmVjdGVkKSBwbGF5IGJhZGx5IGhlcmUgLSBwb3NzaWJsZSBmaXhcbiAgICAgICAgICAgIGJib3ggPSB7XG4gICAgICAgICAgICAgICAgeDogdGhpcy5ub2RlLmNsaWVudExlZnQsXG4gICAgICAgICAgICAgICAgeTogdGhpcy5ub2RlLmNsaWVudFRvcCxcbiAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy5ub2RlLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5ub2RlLmNsaWVudEhlaWdodFxuICAgICAgICAgICAgfVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgYmJveCA9IGJib3ggfHwge307XG4gICAgICAgICAgICBpZihjYW52YXNIaWRkZW4pe1xuICAgICAgICAgICAgICBjb250YWluZXJTdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaGlkZSAmJiB0aGlzLmhpZGUoKTtcbiAgICAgICAgcmV0dXJuIGJib3g7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hdHRyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZXRzIHRoZSBhdHRyaWJ1dGVzIG9mIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBhdHRyTmFtZSAoc3RyaW5nKSBhdHRyaWJ1dGXigJlzIG5hbWVcbiAgICAgLSB2YWx1ZSAoc3RyaW5nKSB2YWx1ZVxuICAgICAqIG9yXG4gICAgIC0gcGFyYW1zIChvYmplY3QpIG9iamVjdCBvZiBuYW1lL3ZhbHVlIHBhaXJzXG4gICAgICogb3JcbiAgICAgLSBhdHRyTmFtZSAoc3RyaW5nKSBhdHRyaWJ1dGXigJlzIG5hbWVcbiAgICAgKiBvclxuICAgICAtIGF0dHJOYW1lcyAoYXJyYXkpIGluIHRoaXMgY2FzZSBtZXRob2QgcmV0dXJucyBhcnJheSBvZiBjdXJyZW50IHZhbHVlcyBmb3IgZ2l2ZW4gYXR0cmlidXRlIG5hbWVzXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnQgaWYgYXR0cnNOYW1lICYgdmFsdWUgb3IgcGFyYW1zIGFyZSBwYXNzZWQgaW4uXG4gICAgID0gKC4uLikgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZSBpZiBvbmx5IGF0dHJzTmFtZSBpcyBwYXNzZWQgaW4uXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiB2YWx1ZXMgb2YgdGhlIGF0dHJpYnV0ZSBpZiBhdHRyc05hbWVzIGlzIHBhc3NlZCBpbi5cbiAgICAgPSAob2JqZWN0KSBvYmplY3Qgb2YgYXR0cmlidXRlcyBpZiBub3RoaW5nIGlzIHBhc3NlZCBpbi5cbiAgICAgPiBQb3NzaWJsZSBwYXJhbWV0ZXJzXG4gICAgICMgPHA+UGxlYXNlIHJlZmVyIHRvIHRoZSA8YSBocmVmPVwiaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL1wiIHRpdGxlPVwiVGhlIFczQyBSZWNvbW1lbmRhdGlvbiBmb3IgdGhlIFNWRyBsYW5ndWFnZSBkZXNjcmliZXMgdGhlc2UgcHJvcGVydGllcyBpbiBkZXRhaWwuXCI+U1ZHIHNwZWNpZmljYXRpb248L2E+IGZvciBhbiBleHBsYW5hdGlvbiBvZiB0aGVzZSBwYXJhbWV0ZXJzLjwvcD5cbiAgICAgbyBhcnJvdy1lbmQgKHN0cmluZykgYXJyb3doZWFkIG9uIHRoZSBlbmQgb2YgdGhlIHBhdGguIFRoZSBmb3JtYXQgZm9yIHN0cmluZyBpcyBgPHR5cGU+Wy08d2lkdGg+Wy08bGVuZ3RoPl1dYC4gUG9zc2libGUgdHlwZXM6IGBjbGFzc2ljYCwgYGJsb2NrYCwgYG9wZW5gLCBgb3ZhbGAsIGBkaWFtb25kYCwgYG5vbmVgLCB3aWR0aDogYHdpZGVgLCBgbmFycm93YCwgYG1lZGl1bWAsIGxlbmd0aDogYGxvbmdgLCBgc2hvcnRgLCBgbWlkaXVtYC5cbiAgICAgbyBjbGlwLXJlY3QgKHN0cmluZykgY29tbWEgb3Igc3BhY2Ugc2VwYXJhdGVkIHZhbHVlczogeCwgeSwgd2lkdGggYW5kIGhlaWdodFxuICAgICBvIGN1cnNvciAoc3RyaW5nKSBDU1MgdHlwZSBvZiB0aGUgY3Vyc29yXG4gICAgIG8gY3ggKG51bWJlcikgdGhlIHgtYXhpcyBjb29yZGluYXRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSwgb3IgZWxsaXBzZVxuICAgICBvIGN5IChudW1iZXIpIHRoZSB5LWF4aXMgY29vcmRpbmF0ZSBvZiB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUsIG9yIGVsbGlwc2VcbiAgICAgbyBmaWxsIChzdHJpbmcpIGNvbG91ciwgZ3JhZGllbnQgb3IgaW1hZ2VcbiAgICAgbyBmaWxsLW9wYWNpdHkgKG51bWJlcilcbiAgICAgbyBmb250IChzdHJpbmcpXG4gICAgIG8gZm9udC1mYW1pbHkgKHN0cmluZylcbiAgICAgbyBmb250LXNpemUgKG51bWJlcikgZm9udCBzaXplIGluIHBpeGVsc1xuICAgICBvIGZvbnQtd2VpZ2h0IChzdHJpbmcpXG4gICAgIG8gaGVpZ2h0IChudW1iZXIpXG4gICAgIG8gaHJlZiAoc3RyaW5nKSBVUkwsIGlmIHNwZWNpZmllZCBlbGVtZW50IGJlaGF2ZXMgYXMgaHlwZXJsaW5rXG4gICAgIG8gb3BhY2l0eSAobnVtYmVyKVxuICAgICBvIHBhdGggKHN0cmluZykgU1ZHIHBhdGggc3RyaW5nIGZvcm1hdFxuICAgICBvIHIgKG51bWJlcikgcmFkaXVzIG9mIHRoZSBjaXJjbGUsIGVsbGlwc2Ugb3Igcm91bmRlZCBjb3JuZXIgb24gdGhlIHJlY3RcbiAgICAgbyByeCAobnVtYmVyKSBob3Jpc29udGFsIHJhZGl1cyBvZiB0aGUgZWxsaXBzZVxuICAgICBvIHJ5IChudW1iZXIpIHZlcnRpY2FsIHJhZGl1cyBvZiB0aGUgZWxsaXBzZVxuICAgICBvIHNyYyAoc3RyaW5nKSBpbWFnZSBVUkwsIG9ubHkgd29ya3MgZm9yIEBFbGVtZW50LmltYWdlIGVsZW1lbnRcbiAgICAgbyBzdHJva2UgKHN0cmluZykgc3Ryb2tlIGNvbG91clxuICAgICBvIHN0cm9rZS1kYXNoYXJyYXkgKHN0cmluZykgW+KAnOKAnSwg4oCcYC1g4oCdLCDigJxgLmDigJ0sIOKAnGAtLmDigJ0sIOKAnGAtLi5g4oCdLCDigJxgLiBg4oCdLCDigJxgLSBg4oCdLCDigJxgLS1g4oCdLCDigJxgLSAuYOKAnSwg4oCcYC0tLmDigJ0sIOKAnGAtLS4uYOKAnV1cbiAgICAgbyBzdHJva2UtbGluZWNhcCAoc3RyaW5nKSBb4oCcYGJ1dHRg4oCdLCDigJxgc3F1YXJlYOKAnSwg4oCcYHJvdW5kYOKAnV1cbiAgICAgbyBzdHJva2UtbGluZWpvaW4gKHN0cmluZykgW+KAnGBiZXZlbGDigJ0sIOKAnGByb3VuZGDigJ0sIOKAnGBtaXRlcmDigJ1dXG4gICAgIG8gc3Ryb2tlLW1pdGVybGltaXQgKG51bWJlcilcbiAgICAgbyBzdHJva2Utb3BhY2l0eSAobnVtYmVyKVxuICAgICBvIHN0cm9rZS13aWR0aCAobnVtYmVyKSBzdHJva2Ugd2lkdGggaW4gcGl4ZWxzLCBkZWZhdWx0IGlzICcxJ1xuICAgICBvIHRhcmdldCAoc3RyaW5nKSB1c2VkIHdpdGggaHJlZlxuICAgICBvIHRleHQgKHN0cmluZykgY29udGVudHMgb2YgdGhlIHRleHQgZWxlbWVudC4gVXNlIGBcXG5gIGZvciBtdWx0aWxpbmUgdGV4dFxuICAgICBvIHRleHQtYW5jaG9yIChzdHJpbmcpIFvigJxgc3RhcnRg4oCdLCDigJxgbWlkZGxlYOKAnSwg4oCcYGVuZGDigJ1dLCBkZWZhdWx0IGlzIOKAnGBtaWRkbGVg4oCdXG4gICAgIG8gdGl0bGUgKHN0cmluZykgd2lsbCBjcmVhdGUgdG9vbHRpcCB3aXRoIGEgZ2l2ZW4gdGV4dFxuICAgICBvIHRyYW5zZm9ybSAoc3RyaW5nKSBzZWUgQEVsZW1lbnQudHJhbnNmb3JtXG4gICAgIG8gd2lkdGggKG51bWJlcilcbiAgICAgbyB4IChudW1iZXIpXG4gICAgIG8geSAobnVtYmVyKVxuICAgICA+IEdyYWRpZW50c1xuICAgICAqIExpbmVhciBncmFkaWVudCBmb3JtYXQ6IOKAnGDigLlhbmdsZeKAui3igLljb2xvdXLigLpbLeKAuWNvbG91cuKAuls64oC5b2Zmc2V04oC6XV0qLeKAuWNvbG91cuKAumDigJ0sIGV4YW1wbGU6IOKAnGA5MC0jZmZmLSMwMDBg4oCdIOKAkyA5MMKwXG4gICAgICogZ3JhZGllbnQgZnJvbSB3aGl0ZSB0byBibGFjayBvciDigJxgMC0jZmZmLSNmMDA6MjAtIzAwMGDigJ0g4oCTIDDCsCBncmFkaWVudCBmcm9tIHdoaXRlIHZpYSByZWQgKGF0IDIwJSkgdG8gYmxhY2suXG4gICAgICpcbiAgICAgKiByYWRpYWwgZ3JhZGllbnQ6IOKAnGByWyjigLlmeOKAuiwg4oC5ZnnigLopXeKAuWNvbG91cuKAulst4oC5Y29sb3Vy4oC6WzrigLlvZmZzZXTigLpdXSot4oC5Y29sb3Vy4oC6YOKAnSwgZXhhbXBsZTog4oCcYHIjZmZmLSMwMDBg4oCdIOKAk1xuICAgICAqIGdyYWRpZW50IGZyb20gd2hpdGUgdG8gYmxhY2sgb3Ig4oCcYHIoMC4yNSwgMC43NSkjZmZmLSMwMDBg4oCdIOKAkyBncmFkaWVudCBmcm9tIHdoaXRlIHRvIGJsYWNrIHdpdGggZm9jdXMgcG9pbnRcbiAgICAgKiBhdCAwLjI1LCAwLjc1LiBGb2N1cyBwb2ludCBjb29yZGluYXRlcyBhcmUgaW4gMC4uMSByYW5nZS4gUmFkaWFsIGdyYWRpZW50cyBjYW4gb25seSBiZSBhcHBsaWVkIHRvIGNpcmNsZXMgYW5kIGVsbGlwc2VzLlxuICAgICA+IFBhdGggU3RyaW5nXG4gICAgICMgPHA+UGxlYXNlIHJlZmVyIHRvIDxhIGhyZWY9XCJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvcGF0aHMuaHRtbCNQYXRoRGF0YVwiIHRpdGxlPVwiRGV0YWlscyBvZiBhIHBhdGjigJlzIGRhdGEgYXR0cmlidXRl4oCZcyBmb3JtYXQgYXJlIGRlc2NyaWJlZCBpbiB0aGUgU1ZHIHNwZWNpZmljYXRpb24uXCI+U1ZHIGRvY3VtZW50YXRpb24gcmVnYXJkaW5nIHBhdGggc3RyaW5nPC9hPi4gUmFwaGHDq2wgZnVsbHkgc3VwcG9ydHMgaXQuPC9wPlxuICAgICA+IENvbG91ciBQYXJzaW5nXG4gICAgICMgPHVsPlxuICAgICAjICAgICA8bGk+Q29sb3VyIG5hbWUgKOKAnDxjb2RlPnJlZDwvY29kZT7igJ0sIOKAnDxjb2RlPmdyZWVuPC9jb2RlPuKAnSwg4oCcPGNvZGU+Y29ybmZsb3dlcmJsdWU8L2NvZGU+4oCdLCBldGMpPC9saT5cbiAgICAgIyAgICAgPGxpPiPigKLigKLigKIg4oCUIHNob3J0ZW5lZCBIVE1MIGNvbG91cjogKOKAnDxjb2RlPiMwMDA8L2NvZGU+4oCdLCDigJw8Y29kZT4jZmMwPC9jb2RlPuKAnSwgZXRjKTwvbGk+XG4gICAgICMgICAgIDxsaT4j4oCi4oCi4oCi4oCi4oCi4oCiIOKAlCBmdWxsIGxlbmd0aCBIVE1MIGNvbG91cjogKOKAnDxjb2RlPiMwMDAwMDA8L2NvZGU+4oCdLCDigJw8Y29kZT4jYmQyMzAwPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+cmdiKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCByZWQsIGdyZWVuIGFuZCBibHVlIGNoYW5uZWxz4oCZIHZhbHVlczogKOKAnDxjb2RlPnJnYigyMDAsJm5ic3A7MTAwLCZuYnNwOzApPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+cmdiKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTogKOKAnDxjb2RlPnJnYigxMDAlLCZuYnNwOzE3NSUsJm5ic3A7MCUpPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+cmdiYSjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCByZWQsIGdyZWVuIGFuZCBibHVlIGNoYW5uZWxz4oCZIHZhbHVlczogKOKAnDxjb2RlPnJnYmEoMjAwLCZuYnNwOzEwMCwmbmJzcDswLCAuNSk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5yZ2JhKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTogKOKAnDxjb2RlPnJnYmEoMTAwJSwmbmJzcDsxNzUlLCZuYnNwOzAlLCA1MCUpPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+aHNiKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBodWUsIHNhdHVyYXRpb24gYW5kIGJyaWdodG5lc3MgdmFsdWVzOiAo4oCcPGNvZGU+aHNiKDAuNSwmbmJzcDswLjI1LCZuYnNwOzEpPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+aHNiKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2JhKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCB3aXRoIG9wYWNpdHk8L2xpPlxuICAgICAjICAgICA8bGk+aHNsKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBhbG1vc3QgdGhlIHNhbWUgYXMgaHNiLCBzZWUgPGEgaHJlZj1cImh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSFNMX2FuZF9IU1ZcIiB0aXRsZT1cIkhTTCBhbmQgSFNWIC0gV2lraXBlZGlhLCB0aGUgZnJlZSBlbmN5Y2xvcGVkaWFcIj5XaWtpcGVkaWEgcGFnZTwvYT48L2xpPlxuICAgICAjICAgICA8bGk+aHNsKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2xhKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCB3aXRoIG9wYWNpdHk8L2xpPlxuICAgICAjICAgICA8bGk+T3B0aW9uYWxseSBmb3IgaHNiIGFuZCBoc2wgeW91IGNvdWxkIHNwZWNpZnkgaHVlIGFzIGEgZGVncmVlOiDigJw8Y29kZT5oc2woMjQwZGVnLCZuYnNwOzEsJm5ic3A7LjUpPC9jb2RlPuKAnSBvciwgaWYgeW91IHdhbnQgdG8gZ28gZmFuY3ksIOKAnDxjb2RlPmhzbCgyNDDCsCwmbmJzcDsxLCZuYnNwOy41KTwvY29kZT7igJ08L2xpPlxuICAgICAjIDwvdWw+XG4gICAgXFwqL1xuICAgIGVscHJvdG8uYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBhIGluIHRoaXMuYXR0cnMpIGlmICh0aGlzLmF0dHJzW2hhc10oYSkpIHtcbiAgICAgICAgICAgICAgICByZXNbYV0gPSB0aGlzLmF0dHJzW2FdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLmdyYWRpZW50ICYmIHJlcy5maWxsID09IFwibm9uZVwiICYmIChyZXMuZmlsbCA9IHJlcy5ncmFkaWVudCkgJiYgZGVsZXRlIHJlcy5ncmFkaWVudDtcbiAgICAgICAgICAgIHJlcy50cmFuc2Zvcm0gPSB0aGlzLl8udHJhbnNmb3JtO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCAmJiBSLmlzKG5hbWUsIFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PSBcImZpbGxcIiAmJiB0aGlzLmF0dHJzLmZpbGwgPT0gXCJub25lXCIgJiYgdGhpcy5hdHRycy5ncmFkaWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmF0dHJzLmdyYWRpZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5hbWUgPT0gXCJ0cmFuc2Zvcm1cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl8udHJhbnNmb3JtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgICAgIG91dCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiB0aGlzLmF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtuYW1lXSA9IHRoaXMuYXR0cnNbbmFtZV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChSLmlzKHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1tuYW1lXSwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRbbmFtZV0gPSB0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbbmFtZV0uZGVmO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtuYW1lXSA9IFIuX2F2YWlsYWJsZUF0dHJzW25hbWVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpaSAtIDEgPyBvdXQgOiBvdXRbbmFtZXNbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmIFIuaXMobmFtZSwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgb3V0ID0ge307XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWUubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIG91dFtuYW1lW2ldXSA9IHRoaXMuYXR0cihuYW1lW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICAgICAgICAgIHBhcmFtc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKG5hbWUgIT0gbnVsbCAmJiBSLmlzKG5hbWUsIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICBwYXJhbXMgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuYXR0ci5cIiArIGtleSArIFwiLlwiICsgdGhpcy5pZCwgdGhpcywgcGFyYW1zW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoa2V5IGluIHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlcykgaWYgKHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1toYXNdKGtleSkgJiYgcGFyYW1zW2hhc10oa2V5KSAmJiBSLmlzKHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1trZXldLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICB2YXIgcGFyID0gdGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2tleV0uYXBwbHkodGhpcywgW10uY29uY2F0KHBhcmFtc1trZXldKSk7XG4gICAgICAgICAgICB0aGlzLmF0dHJzW2tleV0gPSBwYXJhbXNba2V5XTtcbiAgICAgICAgICAgIGZvciAodmFyIHN1YmtleSBpbiBwYXIpIGlmIChwYXJbaGFzXShzdWJrZXkpKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zW3N1YmtleV0gPSBwYXJbc3Via2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHRoaXMsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG9Gcm9udFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogTW92ZXMgdGhlIGVsZW1lbnQgc28gaXQgaXMgdGhlIGNsb3Nlc3QgdG8gdGhlIHZpZXdlcuKAmXMgZXllcywgb24gdG9wIG9mIG90aGVyIGVsZW1lbnRzLlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udG9Gcm9udCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vZGUgPSBnZXRSZWFsTm9kZSh0aGlzLm5vZGUpO1xuICAgICAgICBub2RlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgIHZhciBzdmcgPSB0aGlzLnBhcGVyO1xuICAgICAgICBzdmcudG9wICE9IHRoaXMgJiYgUi5fdG9mcm9udCh0aGlzLCBzdmcpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvQmFja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogTW92ZXMgdGhlIGVsZW1lbnQgc28gaXQgaXMgdGhlIGZ1cnRoZXN0IGZyb20gdGhlIHZpZXdlcuKAmXMgZXllcywgYmVoaW5kIG90aGVyIGVsZW1lbnRzLlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udG9CYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9kZSA9IGdldFJlYWxOb2RlKHRoaXMubm9kZSk7XG4gICAgICAgIHZhciBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShub2RlLCBwYXJlbnROb2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICBSLl90b2JhY2sodGhpcywgdGhpcy5wYXBlcik7XG4gICAgICAgIHZhciBzdmcgPSB0aGlzLnBhcGVyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lmluc2VydEFmdGVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJbnNlcnRzIGN1cnJlbnQgb2JqZWN0IGFmdGVyIHRoZSBnaXZlbiBvbmUuXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5pbnNlcnRBZnRlciA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQgfHwgIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5vZGUgPSBnZXRSZWFsTm9kZSh0aGlzLm5vZGUpO1xuICAgICAgICB2YXIgYWZ0ZXJOb2RlID0gZ2V0UmVhbE5vZGUoZWxlbWVudC5ub2RlIHx8IGVsZW1lbnRbZWxlbWVudC5sZW5ndGggLSAxXS5ub2RlKTtcbiAgICAgICAgaWYgKGFmdGVyTm9kZS5uZXh0U2libGluZykge1xuICAgICAgICAgICAgYWZ0ZXJOb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIGFmdGVyTm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhZnRlck5vZGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBSLl9pbnNlcnRhZnRlcih0aGlzLCBlbGVtZW50LCB0aGlzLnBhcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5pbnNlcnRCZWZvcmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEluc2VydHMgY3VycmVudCBvYmplY3QgYmVmb3JlIHRoZSBnaXZlbiBvbmUuXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5pbnNlcnRCZWZvcmUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkIHx8ICFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBub2RlID0gZ2V0UmVhbE5vZGUodGhpcy5ub2RlKTtcbiAgICAgICAgdmFyIGJlZm9yZU5vZGUgPSBnZXRSZWFsTm9kZShlbGVtZW50Lm5vZGUgfHwgZWxlbWVudFswXS5ub2RlKTtcbiAgICAgICAgYmVmb3JlTm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShub2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgICAgUi5faW5zZXJ0YmVmb3JlKHRoaXMsIGVsZW1lbnQsIHRoaXMucGFwZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8uYmx1ciA9IGZ1bmN0aW9uIChzaXplKSB7XG4gICAgICAgIC8vIEV4cGVyaW1lbnRhbC4gTm8gU2FmYXJpIHN1cHBvcnQuIFVzZSBpdCBvbiB5b3VyIG93biByaXNrLlxuICAgICAgICB2YXIgdCA9IHRoaXM7XG4gICAgICAgIGlmICgrc2l6ZSAhPT0gMCkge1xuICAgICAgICAgICAgdmFyIGZsdHIgPSAkKFwiZmlsdGVyXCIpLFxuICAgICAgICAgICAgICAgIGJsdXIgPSAkKFwiZmVHYXVzc2lhbkJsdXJcIik7XG4gICAgICAgICAgICB0LmF0dHJzLmJsdXIgPSBzaXplO1xuICAgICAgICAgICAgZmx0ci5pZCA9IFIuY3JlYXRlVVVJRCgpO1xuICAgICAgICAgICAgJChibHVyLCB7c3RkRGV2aWF0aW9uOiArc2l6ZSB8fCAxLjV9KTtcbiAgICAgICAgICAgIGZsdHIuYXBwZW5kQ2hpbGQoYmx1cik7XG4gICAgICAgICAgICB0LnBhcGVyLmRlZnMuYXBwZW5kQ2hpbGQoZmx0cik7XG4gICAgICAgICAgICB0Ll9ibHVyID0gZmx0cjtcbiAgICAgICAgICAgICQodC5ub2RlLCB7ZmlsdGVyOiBcInVybCgjXCIgKyBmbHRyLmlkICsgXCIpXCJ9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0Ll9ibHVyKSB7XG4gICAgICAgICAgICAgICAgdC5fYmx1ci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHQuX2JsdXIpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0Ll9ibHVyO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0LmF0dHJzLmJsdXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0Lm5vZGUucmVtb3ZlQXR0cmlidXRlKFwiZmlsdGVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgUi5fZW5naW5lLmNpcmNsZSA9IGZ1bmN0aW9uIChzdmcsIHgsIHksIHIpIHtcbiAgICAgICAgdmFyIGVsID0gJChcImNpcmNsZVwiKTtcbiAgICAgICAgc3ZnLmNhbnZhcyAmJiBzdmcuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHJlcyA9IG5ldyBFbGVtZW50KGVsLCBzdmcpO1xuICAgICAgICByZXMuYXR0cnMgPSB7Y3g6IHgsIGN5OiB5LCByOiByLCBmaWxsOiBcIm5vbmVcIiwgc3Ryb2tlOiBcIiMwMDBcIn07XG4gICAgICAgIHJlcy50eXBlID0gXCJjaXJjbGVcIjtcbiAgICAgICAgJChlbCwgcmVzLmF0dHJzKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5yZWN0ID0gZnVuY3Rpb24gKHN2ZywgeCwgeSwgdywgaCwgcikge1xuICAgICAgICB2YXIgZWwgPSAkKFwicmVjdFwiKTtcbiAgICAgICAgc3ZnLmNhbnZhcyAmJiBzdmcuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHJlcyA9IG5ldyBFbGVtZW50KGVsLCBzdmcpO1xuICAgICAgICByZXMuYXR0cnMgPSB7eDogeCwgeTogeSwgd2lkdGg6IHcsIGhlaWdodDogaCwgcng6IHIgfHwgMCwgcnk6IHIgfHwgMCwgZmlsbDogXCJub25lXCIsIHN0cm9rZTogXCIjMDAwXCJ9O1xuICAgICAgICByZXMudHlwZSA9IFwicmVjdFwiO1xuICAgICAgICAkKGVsLCByZXMuYXR0cnMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLmVsbGlwc2UgPSBmdW5jdGlvbiAoc3ZnLCB4LCB5LCByeCwgcnkpIHtcbiAgICAgICAgdmFyIGVsID0gJChcImVsbGlwc2VcIik7XG4gICAgICAgIHN2Zy5jYW52YXMgJiYgc3ZnLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciByZXMgPSBuZXcgRWxlbWVudChlbCwgc3ZnKTtcbiAgICAgICAgcmVzLmF0dHJzID0ge2N4OiB4LCBjeTogeSwgcng6IHJ4LCByeTogcnksIGZpbGw6IFwibm9uZVwiLCBzdHJva2U6IFwiIzAwMFwifTtcbiAgICAgICAgcmVzLnR5cGUgPSBcImVsbGlwc2VcIjtcbiAgICAgICAgJChlbCwgcmVzLmF0dHJzKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5pbWFnZSA9IGZ1bmN0aW9uIChzdmcsIHNyYywgeCwgeSwgdywgaCkge1xuICAgICAgICB2YXIgZWwgPSAkKFwiaW1hZ2VcIik7XG4gICAgICAgICQoZWwsIHt4OiB4LCB5OiB5LCB3aWR0aDogdywgaGVpZ2h0OiBoLCBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiBcIm5vbmVcIn0pO1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyh4bGluaywgXCJocmVmXCIsIHNyYyk7XG4gICAgICAgIHN2Zy5jYW52YXMgJiYgc3ZnLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciByZXMgPSBuZXcgRWxlbWVudChlbCwgc3ZnKTtcbiAgICAgICAgcmVzLmF0dHJzID0ge3g6IHgsIHk6IHksIHdpZHRoOiB3LCBoZWlnaHQ6IGgsIHNyYzogc3JjfTtcbiAgICAgICAgcmVzLnR5cGUgPSBcImltYWdlXCI7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUudGV4dCA9IGZ1bmN0aW9uIChzdmcsIHgsIHksIHRleHQpIHtcbiAgICAgICAgdmFyIGVsID0gJChcInRleHRcIik7XG4gICAgICAgIHN2Zy5jYW52YXMgJiYgc3ZnLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciByZXMgPSBuZXcgRWxlbWVudChlbCwgc3ZnKTtcbiAgICAgICAgcmVzLmF0dHJzID0ge1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICBcInRleHQtYW5jaG9yXCI6IFwibWlkZGxlXCIsXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiBSLl9hdmFpbGFibGVBdHRyc1tcImZvbnQtZmFtaWx5XCJdLFxuICAgICAgICAgICAgXCJmb250LXNpemVcIjogUi5fYXZhaWxhYmxlQXR0cnNbXCJmb250LXNpemVcIl0sXG4gICAgICAgICAgICBzdHJva2U6IFwibm9uZVwiLFxuICAgICAgICAgICAgZmlsbDogXCIjMDAwXCJcbiAgICAgICAgfTtcbiAgICAgICAgcmVzLnR5cGUgPSBcInRleHRcIjtcbiAgICAgICAgc2V0RmlsbEFuZFN0cm9rZShyZXMsIHJlcy5hdHRycyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuc2V0U2l6ZSA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aCB8fCB0aGlzLndpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodCB8fCB0aGlzLmhlaWdodDtcbiAgICAgICAgdGhpcy5jYW52YXMuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgdGhpcy53aWR0aCk7XG4gICAgICAgIHRoaXMuY2FudmFzLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCB0aGlzLmhlaWdodCk7XG4gICAgICAgIGlmICh0aGlzLl92aWV3Qm94KSB7XG4gICAgICAgICAgICB0aGlzLnNldFZpZXdCb3guYXBwbHkodGhpcywgdGhpcy5fdmlld0JveCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29uID0gUi5fZ2V0Q29udGFpbmVyLmFwcGx5KDAsIGFyZ3VtZW50cyksXG4gICAgICAgICAgICBjb250YWluZXIgPSBjb24gJiYgY29uLmNvbnRhaW5lcixcbiAgICAgICAgICAgIHggPSBjb24ueCxcbiAgICAgICAgICAgIHkgPSBjb24ueSxcbiAgICAgICAgICAgIHdpZHRoID0gY29uLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0ID0gY29uLmhlaWdodDtcbiAgICAgICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNWRyBjb250YWluZXIgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY252cyA9ICQoXCJzdmdcIiksXG4gICAgICAgICAgICBjc3MgPSBcIm92ZXJmbG93OmhpZGRlbjtcIixcbiAgICAgICAgICAgIGlzRmxvYXRpbmc7XG4gICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgIHkgPSB5IHx8IDA7XG4gICAgICAgIHdpZHRoID0gd2lkdGggfHwgNTEyO1xuICAgICAgICBoZWlnaHQgPSBoZWlnaHQgfHwgMzQyO1xuICAgICAgICAkKGNudnMsIHtcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgdmVyc2lvbjogMS4xLFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgeG1sbnM6IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcbiAgICAgICAgICAgIFwieG1sbnM6eGxpbmtcIjogXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjb250YWluZXIgPT0gMSkge1xuICAgICAgICAgICAgY252cy5zdHlsZS5jc3NUZXh0ID0gY3NzICsgXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OlwiICsgeCArIFwicHg7dG9wOlwiICsgeSArIFwicHhcIjtcbiAgICAgICAgICAgIFIuX2cuZG9jLmJvZHkuYXBwZW5kQ2hpbGQoY252cyk7XG4gICAgICAgICAgICBpc0Zsb2F0aW5nID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNudnMuc3R5bGUuY3NzVGV4dCA9IGNzcyArIFwicG9zaXRpb246cmVsYXRpdmVcIjtcbiAgICAgICAgICAgIGlmIChjb250YWluZXIuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoY252cywgY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY252cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29udGFpbmVyID0gbmV3IFIuX1BhcGVyO1xuICAgICAgICBjb250YWluZXIud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY29udGFpbmVyLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgY29udGFpbmVyLmNhbnZhcyA9IGNudnM7XG4gICAgICAgIGNvbnRhaW5lci5jbGVhcigpO1xuICAgICAgICBjb250YWluZXIuX2xlZnQgPSBjb250YWluZXIuX3RvcCA9IDA7XG4gICAgICAgIGlzRmxvYXRpbmcgJiYgKGNvbnRhaW5lci5yZW5kZXJmaXggPSBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgIGNvbnRhaW5lci5yZW5kZXJmaXgoKTtcbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5zZXRWaWV3Qm94ID0gZnVuY3Rpb24gKHgsIHksIHcsIGgsIGZpdCkge1xuICAgICAgICBldmUoXCJyYXBoYWVsLnNldFZpZXdCb3hcIiwgdGhpcywgdGhpcy5fdmlld0JveCwgW3gsIHksIHcsIGgsIGZpdF0pO1xuICAgICAgICB2YXIgcGFwZXJTaXplID0gdGhpcy5nZXRTaXplKCksXG4gICAgICAgICAgICBzaXplID0gbW1heCh3IC8gcGFwZXJTaXplLndpZHRoLCBoIC8gcGFwZXJTaXplLmhlaWdodCksXG4gICAgICAgICAgICB0b3AgPSB0aGlzLnRvcCxcbiAgICAgICAgICAgIGFzcGVjdFJhdGlvID0gZml0ID8gXCJ4TWlkWU1pZCBtZWV0XCIgOiBcInhNaW5ZTWluXCIsXG4gICAgICAgICAgICB2YixcbiAgICAgICAgICAgIHN3O1xuICAgICAgICBpZiAoeCA9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdmJTaXplKSB7XG4gICAgICAgICAgICAgICAgc2l6ZSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fdmJTaXplO1xuICAgICAgICAgICAgdmIgPSBcIjAgMCBcIiArIHRoaXMud2lkdGggKyBTICsgdGhpcy5oZWlnaHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl92YlNpemUgPSBzaXplO1xuICAgICAgICAgICAgdmIgPSB4ICsgUyArIHkgKyBTICsgdyArIFMgKyBoO1xuICAgICAgICB9XG4gICAgICAgICQodGhpcy5jYW52YXMsIHtcbiAgICAgICAgICAgIHZpZXdCb3g6IHZiLFxuICAgICAgICAgICAgcHJlc2VydmVBc3BlY3RSYXRpbzogYXNwZWN0UmF0aW9cbiAgICAgICAgfSk7XG4gICAgICAgIHdoaWxlIChzaXplICYmIHRvcCkge1xuICAgICAgICAgICAgc3cgPSBcInN0cm9rZS13aWR0aFwiIGluIHRvcC5hdHRycyA/IHRvcC5hdHRyc1tcInN0cm9rZS13aWR0aFwiXSA6IDE7XG4gICAgICAgICAgICB0b3AuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc3d9KTtcbiAgICAgICAgICAgIHRvcC5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgIHRvcC5fLmRpcnR5VCA9IDE7XG4gICAgICAgICAgICB0b3AgPSB0b3AucHJldjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl92aWV3Qm94ID0gW3gsIHksIHcsIGgsICEhZml0XTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucmVuZGVyZml4XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBGaXhlcyB0aGUgaXNzdWUgb2YgRmlyZWZveCBhbmQgSUU5IHJlZ2FyZGluZyBzdWJwaXhlbCByZW5kZXJpbmcuIElmIHBhcGVyIGlzIGRlcGVuZGFudFxuICAgICAqIG9uIG90aGVyIGVsZW1lbnRzIGFmdGVyIHJlZmxvdyBpdCBjb3VsZCBzaGlmdCBoYWxmIHBpeGVsIHdoaWNoIGNhdXNlIGZvciBsaW5lcyB0byBsb3N0IHRoZWlyIGNyaXNwbmVzcy5cbiAgICAgKiBUaGlzIG1ldGhvZCBmaXhlcyB0aGUgaXNzdWUuXG4gICAgICoqXG4gICAgICAgU3BlY2lhbCB0aGFua3MgdG8gTWFyaXVzeiBOb3dhayAoaHR0cDovL3d3dy5tZWRpa29vLmNvbS8pIGZvciB0aGlzIG1ldGhvZC5cbiAgICBcXCovXG4gICAgUi5wcm90b3R5cGUucmVuZGVyZml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY252cyA9IHRoaXMuY2FudmFzLFxuICAgICAgICAgICAgcyA9IGNudnMuc3R5bGUsXG4gICAgICAgICAgICBwb3M7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwb3MgPSBjbnZzLmdldFNjcmVlbkNUTSgpIHx8IGNudnMuY3JlYXRlU1ZHTWF0cml4KCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHBvcyA9IGNudnMuY3JlYXRlU1ZHTWF0cml4KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlZnQgPSAtcG9zLmUgJSAxLFxuICAgICAgICAgICAgdG9wID0gLXBvcy5mICUgMTtcbiAgICAgICAgaWYgKGxlZnQgfHwgdG9wKSB7XG4gICAgICAgICAgICBpZiAobGVmdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xlZnQgPSAodGhpcy5fbGVmdCArIGxlZnQpICUgMTtcbiAgICAgICAgICAgICAgICBzLmxlZnQgPSB0aGlzLl9sZWZ0ICsgXCJweFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRvcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RvcCA9ICh0aGlzLl90b3AgKyB0b3ApICUgMTtcbiAgICAgICAgICAgICAgICBzLnRvcCA9IHRoaXMuX3RvcCArIFwicHhcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmNsZWFyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDbGVhcnMgdGhlIHBhcGVyLCBpLmUuIHJlbW92ZXMgYWxsIHRoZSBlbGVtZW50cy5cbiAgICBcXCovXG4gICAgUi5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFIuZXZlKFwicmFwaGFlbC5jbGVhclwiLCB0aGlzKTtcbiAgICAgICAgdmFyIGMgPSB0aGlzLmNhbnZhcztcbiAgICAgICAgd2hpbGUgKGMuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgYy5yZW1vdmVDaGlsZChjLmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYm90dG9tID0gdGhpcy50b3AgPSBudWxsO1xuICAgICAgICAodGhpcy5kZXNjID0gJChcImRlc2NcIikpLmFwcGVuZENoaWxkKFIuX2cuZG9jLmNyZWF0ZVRleHROb2RlKFwiQ3JlYXRlZCB3aXRoIFJhcGhhXFx4ZWJsIFwiICsgUi52ZXJzaW9uKSk7XG4gICAgICAgIGMuYXBwZW5kQ2hpbGQodGhpcy5kZXNjKTtcbiAgICAgICAgYy5hcHBlbmRDaGlsZCh0aGlzLmRlZnMgPSAkKFwiZGVmc1wiKSk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucmVtb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIHRoZSBwYXBlciBmcm9tIHRoZSBET00uXG4gICAgXFwqL1xuICAgIFIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlKFwicmFwaGFlbC5yZW1vdmVcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuY2FudmFzLnBhcmVudE5vZGUgJiYgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyk7XG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcykge1xuICAgICAgICAgICAgdGhpc1tpXSA9IHR5cGVvZiB0aGlzW2ldID09IFwiZnVuY3Rpb25cIiA/IFIuX3JlbW92ZWRGYWN0b3J5KGkpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHNldHByb3RvID0gUi5zdDtcbiAgICBmb3IgKHZhciBtZXRob2QgaW4gZWxwcm90bykgaWYgKGVscHJvdG9baGFzXShtZXRob2QpICYmICFzZXRwcm90b1toYXNdKG1ldGhvZCkpIHtcbiAgICAgICAgc2V0cHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiAobWV0aG9kbmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsW21ldGhvZG5hbWVdLmFwcGx5KGVsLCBhcmcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkobWV0aG9kKTtcbiAgICB9XG59KSgpO1xuXG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIFJhcGhhw6tsIC0gSmF2YVNjcmlwdCBWZWN0b3IgTGlicmFyeSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIFZNTCBNb2R1bGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTEgRG1pdHJ5IEJhcmFub3Zza2l5IChodHRwOi8vcmFwaGFlbGpzLmNvbSkgICDilIIgXFxcXFxuLy8g4pSCIENvcHlyaWdodCAoYykgMjAwOC0yMDExIFNlbmNoYSBMYWJzIChodHRwOi8vc2VuY2hhLmNvbSkgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUgiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIChodHRwOi8vcmFwaGFlbGpzLmNvbS9saWNlbnNlLmh0bWwpIGxpY2Vuc2UuIOKUgiBcXFxcXG4vLyDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggXFxcXFxuXG4oZnVuY3Rpb24oKXtcbiAgICBpZiAoIVIudm1sKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICB0b0Zsb2F0ID0gcGFyc2VGbG9hdCxcbiAgICAgICAgbWF0aCA9IE1hdGgsXG4gICAgICAgIHJvdW5kID0gbWF0aC5yb3VuZCxcbiAgICAgICAgbW1heCA9IG1hdGgubWF4LFxuICAgICAgICBtbWluID0gbWF0aC5taW4sXG4gICAgICAgIGFicyA9IG1hdGguYWJzLFxuICAgICAgICBmaWxsU3RyaW5nID0gXCJmaWxsXCIsXG4gICAgICAgIHNlcGFyYXRvciA9IC9bLCBdKy8sXG4gICAgICAgIGV2ZSA9IFIuZXZlLFxuICAgICAgICBtcyA9IFwiIHByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdFwiLFxuICAgICAgICBTID0gXCIgXCIsXG4gICAgICAgIEUgPSBcIlwiLFxuICAgICAgICBtYXAgPSB7TTogXCJtXCIsIEw6IFwibFwiLCBDOiBcImNcIiwgWjogXCJ4XCIsIG06IFwidFwiLCBsOiBcInJcIiwgYzogXCJ2XCIsIHo6IFwieFwifSxcbiAgICAgICAgYml0ZXMgPSAvKFtjbG16XSksPyhbXmNsbXpdKikvZ2ksXG4gICAgICAgIGJsdXJyZWdleHAgPSAvIHByb2dpZDpcXFMrQmx1clxcKFteXFwpXStcXCkvZyxcbiAgICAgICAgdmFsID0gLy0/W14sXFxzLV0rL2csXG4gICAgICAgIGNzc0RvdCA9IFwicG9zaXRpb246YWJzb2x1dGU7bGVmdDowO3RvcDowO3dpZHRoOjFweDtoZWlnaHQ6MXB4O2JlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpXCIsXG4gICAgICAgIHpvb20gPSAyMTYwMCxcbiAgICAgICAgcGF0aFR5cGVzID0ge3BhdGg6IDEsIHJlY3Q6IDEsIGltYWdlOiAxfSxcbiAgICAgICAgb3ZhbFR5cGVzID0ge2NpcmNsZTogMSwgZWxsaXBzZTogMX0sXG4gICAgICAgIHBhdGgydm1sID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgICAgIHZhciB0b3RhbCA9ICAvW2FocXN0dl0vaWcsXG4gICAgICAgICAgICAgICAgY29tbWFuZCA9IFIuX3BhdGhUb0Fic29sdXRlO1xuICAgICAgICAgICAgU3RyKHBhdGgpLm1hdGNoKHRvdGFsKSAmJiAoY29tbWFuZCA9IFIuX3BhdGgyY3VydmUpO1xuICAgICAgICAgICAgdG90YWwgPSAvW2NsbXpdL2c7XG4gICAgICAgICAgICBpZiAoY29tbWFuZCA9PSBSLl9wYXRoVG9BYnNvbHV0ZSAmJiAhU3RyKHBhdGgpLm1hdGNoKHRvdGFsKSkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSBTdHIocGF0aCkucmVwbGFjZShiaXRlcywgZnVuY3Rpb24gKGFsbCwgY29tbWFuZCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFscyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNb3ZlID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpID09IFwibVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gbWFwW2NvbW1hbmRdO1xuICAgICAgICAgICAgICAgICAgICBhcmdzLnJlcGxhY2UodmFsLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc01vdmUgJiYgdmFscy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSB2YWxzICsgbWFwW2NvbW1hbmQgPT0gXCJtXCIgPyBcImxcIiA6IFwiTFwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxzLnB1c2gocm91bmQodmFsdWUgKiB6b29tKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzICsgdmFscztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHBhID0gY29tbWFuZChwYXRoKSwgcCwgcjtcbiAgICAgICAgICAgIHJlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGEubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHAgPSBwYVtpXTtcbiAgICAgICAgICAgICAgICByID0gcGFbaV1bMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICByID09IFwielwiICYmIChyID0gXCJ4XCIpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxLCBqaiA9IHAubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICByICs9IHJvdW5kKHBbal0gKiB6b29tKSArIChqICE9IGpqIC0gMSA/IFwiLFwiIDogRSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcy5qb2luKFMpO1xuICAgICAgICB9LFxuICAgICAgICBjb21wZW5zYXRpb24gPSBmdW5jdGlvbiAoZGVnLCBkeCwgZHkpIHtcbiAgICAgICAgICAgIHZhciBtID0gUi5tYXRyaXgoKTtcbiAgICAgICAgICAgIG0ucm90YXRlKC1kZWcsIC41LCAuNSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGR4OiBtLngoZHgsIGR5KSxcbiAgICAgICAgICAgICAgICBkeTogbS55KGR4LCBkeSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHNldENvb3JkcyA9IGZ1bmN0aW9uIChwLCBzeCwgc3ksIGR4LCBkeSwgZGVnKSB7XG4gICAgICAgICAgICB2YXIgXyA9IHAuXyxcbiAgICAgICAgICAgICAgICBtID0gcC5tYXRyaXgsXG4gICAgICAgICAgICAgICAgZmlsbHBvcyA9IF8uZmlsbHBvcyxcbiAgICAgICAgICAgICAgICBvID0gcC5ub2RlLFxuICAgICAgICAgICAgICAgIHMgPSBvLnN0eWxlLFxuICAgICAgICAgICAgICAgIHkgPSAxLFxuICAgICAgICAgICAgICAgIGZsaXAgPSBcIlwiLFxuICAgICAgICAgICAgICAgIGR4ZHksXG4gICAgICAgICAgICAgICAga3ggPSB6b29tIC8gc3gsXG4gICAgICAgICAgICAgICAga3kgPSB6b29tIC8gc3k7XG4gICAgICAgICAgICBzLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgaWYgKCFzeCB8fCAhc3kpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvLmNvb3Jkc2l6ZSA9IGFicyhreCkgKyBTICsgYWJzKGt5KTtcbiAgICAgICAgICAgIHMucm90YXRpb24gPSBkZWcgKiAoc3ggKiBzeSA8IDAgPyAtMSA6IDEpO1xuICAgICAgICAgICAgaWYgKGRlZykge1xuICAgICAgICAgICAgICAgIHZhciBjID0gY29tcGVuc2F0aW9uKGRlZywgZHgsIGR5KTtcbiAgICAgICAgICAgICAgICBkeCA9IGMuZHg7XG4gICAgICAgICAgICAgICAgZHkgPSBjLmR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3ggPCAwICYmIChmbGlwICs9IFwieFwiKTtcbiAgICAgICAgICAgIHN5IDwgMCAmJiAoZmxpcCArPSBcIiB5XCIpICYmICh5ID0gLTEpO1xuICAgICAgICAgICAgcy5mbGlwID0gZmxpcDtcbiAgICAgICAgICAgIG8uY29vcmRvcmlnaW4gPSAoZHggKiAta3gpICsgUyArIChkeSAqIC1reSk7XG4gICAgICAgICAgICBpZiAoZmlsbHBvcyB8fCBfLmZpbGxzaXplKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGwgPSBvLmdldEVsZW1lbnRzQnlUYWdOYW1lKGZpbGxTdHJpbmcpO1xuICAgICAgICAgICAgICAgIGZpbGwgPSBmaWxsICYmIGZpbGxbMF07XG4gICAgICAgICAgICAgICAgby5yZW1vdmVDaGlsZChmaWxsKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlsbHBvcykge1xuICAgICAgICAgICAgICAgICAgICBjID0gY29tcGVuc2F0aW9uKGRlZywgbS54KGZpbGxwb3NbMF0sIGZpbGxwb3NbMV0pLCBtLnkoZmlsbHBvc1swXSwgZmlsbHBvc1sxXSkpO1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnBvc2l0aW9uID0gYy5keCAqIHkgKyBTICsgYy5keSAqIHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfLmZpbGxzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwuc2l6ZSA9IF8uZmlsbHNpemVbMF0gKiBhYnMoc3gpICsgUyArIF8uZmlsbHNpemVbMV0gKiBhYnMoc3kpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvLmFwcGVuZENoaWxkKGZpbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcy52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG4gICAgICAgIH07XG4gICAgUi50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICBcIllvdXIgYnJvd3NlciBkb2VzblxcdTIwMTl0IHN1cHBvcnQgU1ZHLiBGYWxsaW5nIGRvd24gdG8gVk1MLlxcbllvdSBhcmUgcnVubmluZyBSYXBoYVxceGVibCBcIiArIHRoaXMudmVyc2lvbjtcbiAgICB9O1xuICAgIHZhciBhZGRBcnJvdyA9IGZ1bmN0aW9uIChvLCB2YWx1ZSwgaXNFbmQpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFN0cih2YWx1ZSkudG9Mb3dlckNhc2UoKS5zcGxpdChcIi1cIiksXG4gICAgICAgICAgICBzZSA9IGlzRW5kID8gXCJlbmRcIiA6IFwic3RhcnRcIixcbiAgICAgICAgICAgIGkgPSB2YWx1ZXMubGVuZ3RoLFxuICAgICAgICAgICAgdHlwZSA9IFwiY2xhc3NpY1wiLFxuICAgICAgICAgICAgdyA9IFwibWVkaXVtXCIsXG4gICAgICAgICAgICBoID0gXCJtZWRpdW1cIjtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgc3dpdGNoICh2YWx1ZXNbaV0pIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiY2xhc3NpY1wiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJvdmFsXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcImRpYW1vbmRcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwib3BlblwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJub25lXCI6XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB2YWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ3aWRlXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIm5hcnJvd1wiOiBoID0gdmFsdWVzW2ldOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwibG9uZ1wiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJzaG9ydFwiOiB3ID0gdmFsdWVzW2ldOyBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgc3Ryb2tlID0gby5ub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3Ryb2tlXCIpWzBdO1xuICAgICAgICBzdHJva2Vbc2UgKyBcImFycm93XCJdID0gdHlwZTtcbiAgICAgICAgc3Ryb2tlW3NlICsgXCJhcnJvd2xlbmd0aFwiXSA9IHc7XG4gICAgICAgIHN0cm9rZVtzZSArIFwiYXJyb3d3aWR0aFwiXSA9IGg7XG4gICAgfSxcbiAgICBzZXRGaWxsQW5kU3Ryb2tlID0gZnVuY3Rpb24gKG8sIHBhcmFtcykge1xuICAgICAgICAvLyBvLnBhcGVyLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIG8uYXR0cnMgPSBvLmF0dHJzIHx8IHt9O1xuICAgICAgICB2YXIgbm9kZSA9IG8ubm9kZSxcbiAgICAgICAgICAgIGEgPSBvLmF0dHJzLFxuICAgICAgICAgICAgcyA9IG5vZGUuc3R5bGUsXG4gICAgICAgICAgICB4eSxcbiAgICAgICAgICAgIG5ld3BhdGggPSBwYXRoVHlwZXNbby50eXBlXSAmJiAocGFyYW1zLnggIT0gYS54IHx8IHBhcmFtcy55ICE9IGEueSB8fCBwYXJhbXMud2lkdGggIT0gYS53aWR0aCB8fCBwYXJhbXMuaGVpZ2h0ICE9IGEuaGVpZ2h0IHx8IHBhcmFtcy5jeCAhPSBhLmN4IHx8IHBhcmFtcy5jeSAhPSBhLmN5IHx8IHBhcmFtcy5yeCAhPSBhLnJ4IHx8IHBhcmFtcy5yeSAhPSBhLnJ5IHx8IHBhcmFtcy5yICE9IGEuciksXG4gICAgICAgICAgICBpc092YWwgPSBvdmFsVHlwZXNbby50eXBlXSAmJiAoYS5jeCAhPSBwYXJhbXMuY3ggfHwgYS5jeSAhPSBwYXJhbXMuY3kgfHwgYS5yICE9IHBhcmFtcy5yIHx8IGEucnggIT0gcGFyYW1zLnJ4IHx8IGEucnkgIT0gcGFyYW1zLnJ5KSxcbiAgICAgICAgICAgIHJlcyA9IG87XG5cblxuICAgICAgICBmb3IgKHZhciBwYXIgaW4gcGFyYW1zKSBpZiAocGFyYW1zW2hhc10ocGFyKSkge1xuICAgICAgICAgICAgYVtwYXJdID0gcGFyYW1zW3Bhcl07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5ld3BhdGgpIHtcbiAgICAgICAgICAgIGEucGF0aCA9IFIuX2dldFBhdGhbby50eXBlXShvKTtcbiAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcGFyYW1zLmhyZWYgJiYgKG5vZGUuaHJlZiA9IHBhcmFtcy5ocmVmKTtcbiAgICAgICAgcGFyYW1zLnRpdGxlICYmIChub2RlLnRpdGxlID0gcGFyYW1zLnRpdGxlKTtcbiAgICAgICAgcGFyYW1zLnRhcmdldCAmJiAobm9kZS50YXJnZXQgPSBwYXJhbXMudGFyZ2V0KTtcbiAgICAgICAgcGFyYW1zLmN1cnNvciAmJiAocy5jdXJzb3IgPSBwYXJhbXMuY3Vyc29yKTtcbiAgICAgICAgXCJibHVyXCIgaW4gcGFyYW1zICYmIG8uYmx1cihwYXJhbXMuYmx1cik7XG4gICAgICAgIGlmIChwYXJhbXMucGF0aCAmJiBvLnR5cGUgPT0gXCJwYXRoXCIgfHwgbmV3cGF0aCkge1xuICAgICAgICAgICAgbm9kZS5wYXRoID0gcGF0aDJ2bWwoflN0cihhLnBhdGgpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcInJcIikgPyBSLl9wYXRoVG9BYnNvbHV0ZShhLnBhdGgpIDogYS5wYXRoKTtcbiAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICBpZiAoby50eXBlID09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgICAgIG8uXy5maWxscG9zID0gW2EueCwgYS55XTtcbiAgICAgICAgICAgICAgICBvLl8uZmlsbHNpemUgPSBbYS53aWR0aCwgYS5oZWlnaHRdO1xuICAgICAgICAgICAgICAgIHNldENvb3JkcyhvLCAxLCAxLCAwLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcInRyYW5zZm9ybVwiIGluIHBhcmFtcyAmJiBvLnRyYW5zZm9ybShwYXJhbXMudHJhbnNmb3JtKTtcbiAgICAgICAgaWYgKGlzT3ZhbCkge1xuICAgICAgICAgICAgdmFyIGN4ID0gK2EuY3gsXG4gICAgICAgICAgICAgICAgY3kgPSArYS5jeSxcbiAgICAgICAgICAgICAgICByeCA9ICthLnJ4IHx8ICthLnIgfHwgMCxcbiAgICAgICAgICAgICAgICByeSA9ICthLnJ5IHx8ICthLnIgfHwgMDtcbiAgICAgICAgICAgIG5vZGUucGF0aCA9IFIuZm9ybWF0KFwiYXJ7MH0sezF9LHsyfSx7M30sezR9LHsxfSx7NH0sezF9eFwiLCByb3VuZCgoY3ggLSByeCkgKiB6b29tKSwgcm91bmQoKGN5IC0gcnkpICogem9vbSksIHJvdW5kKChjeCArIHJ4KSAqIHpvb20pLCByb3VuZCgoY3kgKyByeSkgKiB6b29tKSwgcm91bmQoY3ggKiB6b29tKSk7XG4gICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImNsaXAtcmVjdFwiIGluIHBhcmFtcykge1xuICAgICAgICAgICAgdmFyIHJlY3QgPSBTdHIocGFyYW1zW1wiY2xpcC1yZWN0XCJdKS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICAgICAgaWYgKHJlY3QubGVuZ3RoID09IDQpIHtcbiAgICAgICAgICAgICAgICByZWN0WzJdID0gK3JlY3RbMl0gKyAoK3JlY3RbMF0pO1xuICAgICAgICAgICAgICAgIHJlY3RbM10gPSArcmVjdFszXSArICgrcmVjdFsxXSk7XG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9IG5vZGUuY2xpcFJlY3QgfHwgUi5fZy5kb2MuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcbiAgICAgICAgICAgICAgICAgICAgZHN0eWxlID0gZGl2LnN0eWxlO1xuICAgICAgICAgICAgICAgIGRzdHlsZS5jbGlwID0gUi5mb3JtYXQoXCJyZWN0KHsxfXB4IHsyfXB4IHszfXB4IHswfXB4KVwiLCByZWN0KTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuY2xpcFJlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZHN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgICAgICAgICAgICBkc3R5bGUudG9wID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZHN0eWxlLmxlZnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBkc3R5bGUud2lkdGggPSBvLnBhcGVyLndpZHRoICsgXCJweFwiO1xuICAgICAgICAgICAgICAgICAgICBkc3R5bGUuaGVpZ2h0ID0gby5wYXBlci5oZWlnaHQgKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZGl2LCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBub2RlLmNsaXBSZWN0ID0gZGl2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcGFyYW1zW1wiY2xpcC1yZWN0XCJdKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jbGlwUmVjdCAmJiAobm9kZS5jbGlwUmVjdC5zdHlsZS5jbGlwID0gXCJhdXRvXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvLnRleHRwYXRoKSB7XG4gICAgICAgICAgICB2YXIgdGV4dHBhdGhTdHlsZSA9IG8udGV4dHBhdGguc3R5bGU7XG4gICAgICAgICAgICBwYXJhbXMuZm9udCAmJiAodGV4dHBhdGhTdHlsZS5mb250ID0gcGFyYW1zLmZvbnQpO1xuICAgICAgICAgICAgcGFyYW1zW1wiZm9udC1mYW1pbHlcIl0gJiYgKHRleHRwYXRoU3R5bGUuZm9udEZhbWlseSA9ICdcIicgKyBwYXJhbXNbXCJmb250LWZhbWlseVwiXS5zcGxpdChcIixcIilbMF0ucmVwbGFjZSgvXlsnXCJdK3xbJ1wiXSskL2csIEUpICsgJ1wiJyk7XG4gICAgICAgICAgICBwYXJhbXNbXCJmb250LXNpemVcIl0gJiYgKHRleHRwYXRoU3R5bGUuZm9udFNpemUgPSBwYXJhbXNbXCJmb250LXNpemVcIl0pO1xuICAgICAgICAgICAgcGFyYW1zW1wiZm9udC13ZWlnaHRcIl0gJiYgKHRleHRwYXRoU3R5bGUuZm9udFdlaWdodCA9IHBhcmFtc1tcImZvbnQtd2VpZ2h0XCJdKTtcbiAgICAgICAgICAgIHBhcmFtc1tcImZvbnQtc3R5bGVcIl0gJiYgKHRleHRwYXRoU3R5bGUuZm9udFN0eWxlID0gcGFyYW1zW1wiZm9udC1zdHlsZVwiXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiYXJyb3ctc3RhcnRcIiBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGFkZEFycm93KHJlcywgcGFyYW1zW1wiYXJyb3ctc3RhcnRcIl0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImFycm93LWVuZFwiIGluIHBhcmFtcykge1xuICAgICAgICAgICAgYWRkQXJyb3cocmVzLCBwYXJhbXNbXCJhcnJvdy1lbmRcIl0sIDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJhbXMub3BhY2l0eSAhPSBudWxsIHx8IFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLXdpZHRoXCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtcy5maWxsICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtcy5zcmMgIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zLnN0cm9rZSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2Utd2lkdGhcIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLW9wYWNpdHlcIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zW1wiZmlsbC1vcGFjaXR5XCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1kYXNoYXJyYXlcIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLW1pdGVybGltaXRcIl0gIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWxpbmVqb2luXCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1saW5lY2FwXCJdICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBmaWxsID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShmaWxsU3RyaW5nKSxcbiAgICAgICAgICAgICAgICBuZXdmaWxsID0gZmFsc2U7XG4gICAgICAgICAgICBmaWxsID0gZmlsbCAmJiBmaWxsWzBdO1xuICAgICAgICAgICAgIWZpbGwgJiYgKG5ld2ZpbGwgPSBmaWxsID0gY3JlYXRlTm9kZShmaWxsU3RyaW5nKSk7XG4gICAgICAgICAgICBpZiAoby50eXBlID09IFwiaW1hZ2VcIiAmJiBwYXJhbXMuc3JjKSB7XG4gICAgICAgICAgICAgICAgZmlsbC5zcmMgPSBwYXJhbXMuc3JjO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFyYW1zLmZpbGwgJiYgKGZpbGwub24gPSB0cnVlKTtcbiAgICAgICAgICAgIGlmIChmaWxsLm9uID09IG51bGwgfHwgcGFyYW1zLmZpbGwgPT0gXCJub25lXCIgfHwgcGFyYW1zLmZpbGwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmaWxsLm9uID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsbC5vbiAmJiBwYXJhbXMuZmlsbCkge1xuICAgICAgICAgICAgICAgIHZhciBpc1VSTCA9IFN0cihwYXJhbXMuZmlsbCkubWF0Y2goUi5fSVNVUkwpO1xuICAgICAgICAgICAgICAgIGlmIChpc1VSTCkge1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnBhcmVudE5vZGUgPT0gbm9kZSAmJiBub2RlLnJlbW92ZUNoaWxkKGZpbGwpO1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnJvdGF0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwuc3JjID0gaXNVUkxbMV07XG4gICAgICAgICAgICAgICAgICAgIGZpbGwudHlwZSA9IFwidGlsZVwiO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmJveCA9IG8uZ2V0QkJveCgxKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5wb3NpdGlvbiA9IGJib3gueCArIFMgKyBiYm94Lnk7XG4gICAgICAgICAgICAgICAgICAgIG8uXy5maWxscG9zID0gW2Jib3gueCwgYmJveC55XTtcblxuICAgICAgICAgICAgICAgICAgICBSLl9wcmVsb2FkKGlzVVJMWzFdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLl8uZmlsbHNpemUgPSBbdGhpcy5vZmZzZXRXaWR0aCwgdGhpcy5vZmZzZXRIZWlnaHRdO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmaWxsLmNvbG9yID0gUi5nZXRSR0IocGFyYW1zLmZpbGwpLmhleDtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5zcmMgPSBFO1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnR5cGUgPSBcInNvbGlkXCI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChSLmdldFJHQihwYXJhbXMuZmlsbCkuZXJyb3IgJiYgKHJlcy50eXBlIGluIHtjaXJjbGU6IDEsIGVsbGlwc2U6IDF9IHx8IFN0cihwYXJhbXMuZmlsbCkuY2hhckF0KCkgIT0gXCJyXCIpICYmIGFkZEdyYWRpZW50RmlsbChyZXMsIHBhcmFtcy5maWxsLCBmaWxsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYS5maWxsID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBhLmdyYWRpZW50ID0gcGFyYW1zLmZpbGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsLnJvdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFwiZmlsbC1vcGFjaXR5XCIgaW4gcGFyYW1zIHx8IFwib3BhY2l0eVwiIGluIHBhcmFtcykge1xuICAgICAgICAgICAgICAgIHZhciBvcGFjaXR5ID0gKCgrYVtcImZpbGwtb3BhY2l0eVwiXSArIDEgfHwgMikgLSAxKSAqICgoK2Eub3BhY2l0eSArIDEgfHwgMikgLSAxKSAqICgoK1IuZ2V0UkdCKHBhcmFtcy5maWxsKS5vICsgMSB8fCAyKSAtIDEpO1xuICAgICAgICAgICAgICAgIG9wYWNpdHkgPSBtbWluKG1tYXgob3BhY2l0eSwgMCksIDEpO1xuICAgICAgICAgICAgICAgIGZpbGwub3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGwuc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwuY29sb3IgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKGZpbGwpO1xuICAgICAgICAgICAgdmFyIHN0cm9rZSA9IChub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3Ryb2tlXCIpICYmIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdHJva2VcIilbMF0pLFxuICAgICAgICAgICAgbmV3c3Ryb2tlID0gZmFsc2U7XG4gICAgICAgICAgICAhc3Ryb2tlICYmIChuZXdzdHJva2UgPSBzdHJva2UgPSBjcmVhdGVOb2RlKFwic3Ryb2tlXCIpKTtcbiAgICAgICAgICAgIGlmICgocGFyYW1zLnN0cm9rZSAmJiBwYXJhbXMuc3Ryb2tlICE9IFwibm9uZVwiKSB8fFxuICAgICAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSB8fFxuICAgICAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1vcGFjaXR5XCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtZGFzaGFycmF5XCJdIHx8XG4gICAgICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLW1pdGVybGltaXRcIl0gfHxcbiAgICAgICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbGluZWpvaW5cIl0gfHxcbiAgICAgICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbGluZWNhcFwiXSkge1xuICAgICAgICAgICAgICAgIHN0cm9rZS5vbiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAocGFyYW1zLnN0cm9rZSA9PSBcIm5vbmVcIiB8fCBwYXJhbXMuc3Ryb2tlID09PSBudWxsIHx8IHN0cm9rZS5vbiA9PSBudWxsIHx8IHBhcmFtcy5zdHJva2UgPT0gMCB8fCBwYXJhbXNbXCJzdHJva2Utd2lkdGhcIl0gPT0gMCkgJiYgKHN0cm9rZS5vbiA9IGZhbHNlKTtcbiAgICAgICAgICAgIHZhciBzdHJva2VDb2xvciA9IFIuZ2V0UkdCKHBhcmFtcy5zdHJva2UpO1xuICAgICAgICAgICAgc3Ryb2tlLm9uICYmIHBhcmFtcy5zdHJva2UgJiYgKHN0cm9rZS5jb2xvciA9IHN0cm9rZUNvbG9yLmhleCk7XG4gICAgICAgICAgICBvcGFjaXR5ID0gKCgrYVtcInN0cm9rZS1vcGFjaXR5XCJdICsgMSB8fCAyKSAtIDEpICogKCgrYS5vcGFjaXR5ICsgMSB8fCAyKSAtIDEpICogKCgrc3Ryb2tlQ29sb3IubyArIDEgfHwgMikgLSAxKTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9ICh0b0Zsb2F0KHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSkgfHwgMSkgKiAuNzU7XG4gICAgICAgICAgICBvcGFjaXR5ID0gbW1pbihtbWF4KG9wYWNpdHksIDApLCAxKTtcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSA9PSBudWxsICYmICh3aWR0aCA9IGFbXCJzdHJva2Utd2lkdGhcIl0pO1xuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLXdpZHRoXCJdICYmIChzdHJva2Uud2VpZ2h0ID0gd2lkdGgpO1xuICAgICAgICAgICAgd2lkdGggJiYgd2lkdGggPCAxICYmIChvcGFjaXR5ICo9IHdpZHRoKSAmJiAoc3Ryb2tlLndlaWdodCA9IDEpO1xuICAgICAgICAgICAgc3Ryb2tlLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICBcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1saW5lam9pblwiXSAmJiAoc3Ryb2tlLmpvaW5zdHlsZSA9IHBhcmFtc1tcInN0cm9rZS1saW5lam9pblwiXSB8fCBcIm1pdGVyXCIpO1xuICAgICAgICAgICAgc3Ryb2tlLm1pdGVybGltaXQgPSBwYXJhbXNbXCJzdHJva2UtbWl0ZXJsaW1pdFwiXSB8fCA4O1xuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWxpbmVjYXBcIl0gJiYgKHN0cm9rZS5lbmRjYXAgPSBwYXJhbXNbXCJzdHJva2UtbGluZWNhcFwiXSA9PSBcImJ1dHRcIiA/IFwiZmxhdFwiIDogcGFyYW1zW1wic3Ryb2tlLWxpbmVjYXBcIl0gPT0gXCJzcXVhcmVcIiA/IFwic3F1YXJlXCIgOiBcInJvdW5kXCIpO1xuICAgICAgICAgICAgaWYgKFwic3Ryb2tlLWRhc2hhcnJheVwiIGluIHBhcmFtcykge1xuICAgICAgICAgICAgICAgIHZhciBkYXNoYXJyYXkgPSB7XG4gICAgICAgICAgICAgICAgICAgIFwiLVwiOiBcInNob3J0ZGFzaFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi5cIjogXCJzaG9ydGRvdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi0uXCI6IFwic2hvcnRkYXNoZG90XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLS4uXCI6IFwic2hvcnRkYXNoZG90ZG90XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLiBcIjogXCJkb3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCItIFwiOiBcImRhc2hcIixcbiAgICAgICAgICAgICAgICAgICAgXCItLVwiOiBcImxvbmdkYXNoXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLSAuXCI6IFwiZGFzaGRvdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi0tLlwiOiBcImxvbmdkYXNoZG90XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLS0uLlwiOiBcImxvbmdkYXNoZG90ZG90XCJcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHN0cm9rZS5kYXNoc3R5bGUgPSBkYXNoYXJyYXlbaGFzXShwYXJhbXNbXCJzdHJva2UtZGFzaGFycmF5XCJdKSA/IGRhc2hhcnJheVtwYXJhbXNbXCJzdHJva2UtZGFzaGFycmF5XCJdXSA6IEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXdzdHJva2UgJiYgbm9kZS5hcHBlbmRDaGlsZChzdHJva2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXMudHlwZSA9PSBcInRleHRcIikge1xuICAgICAgICAgICAgcmVzLnBhcGVyLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gRTtcbiAgICAgICAgICAgIHZhciBzcGFuID0gcmVzLnBhcGVyLnNwYW4sXG4gICAgICAgICAgICAgICAgbSA9IDEwMCxcbiAgICAgICAgICAgICAgICBmb250U2l6ZSA9IGEuZm9udCAmJiBhLmZvbnQubWF0Y2goL1xcZCsoPzpcXC5cXGQqKT8oPz1weCkvKTtcbiAgICAgICAgICAgIHMgPSBzcGFuLnN0eWxlO1xuICAgICAgICAgICAgYS5mb250ICYmIChzLmZvbnQgPSBhLmZvbnQpO1xuICAgICAgICAgICAgYVtcImZvbnQtZmFtaWx5XCJdICYmIChzLmZvbnRGYW1pbHkgPSBhW1wiZm9udC1mYW1pbHlcIl0pO1xuICAgICAgICAgICAgYVtcImZvbnQtd2VpZ2h0XCJdICYmIChzLmZvbnRXZWlnaHQgPSBhW1wiZm9udC13ZWlnaHRcIl0pO1xuICAgICAgICAgICAgYVtcImZvbnQtc3R5bGVcIl0gJiYgKHMuZm9udFN0eWxlID0gYVtcImZvbnQtc3R5bGVcIl0pO1xuICAgICAgICAgICAgZm9udFNpemUgPSB0b0Zsb2F0KGFbXCJmb250LXNpemVcIl0gfHwgZm9udFNpemUgJiYgZm9udFNpemVbMF0pIHx8IDEwO1xuICAgICAgICAgICAgcy5mb250U2l6ZSA9IGZvbnRTaXplICogbSArIFwicHhcIjtcbiAgICAgICAgICAgIHJlcy50ZXh0cGF0aC5zdHJpbmcgJiYgKHNwYW4uaW5uZXJIVE1MID0gU3RyKHJlcy50ZXh0cGF0aC5zdHJpbmcpLnJlcGxhY2UoLzwvZywgXCImIzYwO1wiKS5yZXBsYWNlKC8mL2csIFwiJiMzODtcIikucmVwbGFjZSgvXFxuL2csIFwiPGJyPlwiKSk7XG4gICAgICAgICAgICB2YXIgYnJlY3QgPSBzcGFuLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgcmVzLlcgPSBhLncgPSAoYnJlY3QucmlnaHQgLSBicmVjdC5sZWZ0KSAvIG07XG4gICAgICAgICAgICByZXMuSCA9IGEuaCA9IChicmVjdC5ib3R0b20gLSBicmVjdC50b3ApIC8gbTtcbiAgICAgICAgICAgIC8vIHJlcy5wYXBlci5jYW52YXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgcmVzLlggPSBhLng7XG4gICAgICAgICAgICByZXMuWSA9IGEueSArIHJlcy5IIC8gMjtcblxuICAgICAgICAgICAgKFwieFwiIGluIHBhcmFtcyB8fCBcInlcIiBpbiBwYXJhbXMpICYmIChyZXMucGF0aC52ID0gUi5mb3JtYXQoXCJtezB9LHsxfWx7Mn0sezF9XCIsIHJvdW5kKGEueCAqIHpvb20pLCByb3VuZChhLnkgKiB6b29tKSwgcm91bmQoYS54ICogem9vbSkgKyAxKSk7XG4gICAgICAgICAgICB2YXIgZGlydHlhdHRycyA9IFtcInhcIiwgXCJ5XCIsIFwidGV4dFwiLCBcImZvbnRcIiwgXCJmb250LWZhbWlseVwiLCBcImZvbnQtd2VpZ2h0XCIsIFwiZm9udC1zdHlsZVwiLCBcImZvbnQtc2l6ZVwiXTtcbiAgICAgICAgICAgIGZvciAodmFyIGQgPSAwLCBkZCA9IGRpcnR5YXR0cnMubGVuZ3RoOyBkIDwgZGQ7IGQrKykgaWYgKGRpcnR5YXR0cnNbZF0gaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgcmVzLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICAgIC8vIHRleHQtYW5jaG9yIGVtdWxhdGlvblxuICAgICAgICAgICAgc3dpdGNoIChhW1widGV4dC1hbmNob3JcIl0pIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwic3RhcnRcIjpcbiAgICAgICAgICAgICAgICAgICAgcmVzLnRleHRwYXRoLnN0eWxlW1widi10ZXh0LWFsaWduXCJdID0gXCJsZWZ0XCI7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5iYnggPSByZXMuVyAvIDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImVuZFwiOlxuICAgICAgICAgICAgICAgICAgICByZXMudGV4dHBhdGguc3R5bGVbXCJ2LXRleHQtYWxpZ25cIl0gPSBcInJpZ2h0XCI7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5iYnggPSAtcmVzLlcgLyAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJlcy50ZXh0cGF0aC5zdHlsZVtcInYtdGV4dC1hbGlnblwiXSA9IFwiY2VudGVyXCI7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5iYnggPSAwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnRleHRwYXRoLnN0eWxlW1widi10ZXh0LWtlcm5cIl0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlcy5wYXBlci5jYW52YXMuc3R5bGUuZGlzcGxheSA9IEU7XG4gICAgfSxcbiAgICBhZGRHcmFkaWVudEZpbGwgPSBmdW5jdGlvbiAobywgZ3JhZGllbnQsIGZpbGwpIHtcbiAgICAgICAgby5hdHRycyA9IG8uYXR0cnMgfHwge307XG4gICAgICAgIHZhciBhdHRycyA9IG8uYXR0cnMsXG4gICAgICAgICAgICBwb3cgPSBNYXRoLnBvdyxcbiAgICAgICAgICAgIG9wYWNpdHksXG4gICAgICAgICAgICBvaW5kZXgsXG4gICAgICAgICAgICB0eXBlID0gXCJsaW5lYXJcIixcbiAgICAgICAgICAgIGZ4ZnkgPSBcIi41IC41XCI7XG4gICAgICAgIG8uYXR0cnMuZ3JhZGllbnQgPSBncmFkaWVudDtcbiAgICAgICAgZ3JhZGllbnQgPSBTdHIoZ3JhZGllbnQpLnJlcGxhY2UoUi5fcmFkaWFsX2dyYWRpZW50LCBmdW5jdGlvbiAoYWxsLCBmeCwgZnkpIHtcbiAgICAgICAgICAgIHR5cGUgPSBcInJhZGlhbFwiO1xuICAgICAgICAgICAgaWYgKGZ4ICYmIGZ5KSB7XG4gICAgICAgICAgICAgICAgZnggPSB0b0Zsb2F0KGZ4KTtcbiAgICAgICAgICAgICAgICBmeSA9IHRvRmxvYXQoZnkpO1xuICAgICAgICAgICAgICAgIHBvdyhmeCAtIC41LCAyKSArIHBvdyhmeSAtIC41LCAyKSA+IC4yNSAmJiAoZnkgPSBtYXRoLnNxcnQoLjI1IC0gcG93KGZ4IC0gLjUsIDIpKSAqICgoZnkgPiAuNSkgKiAyIC0gMSkgKyAuNSk7XG4gICAgICAgICAgICAgICAgZnhmeSA9IGZ4ICsgUyArIGZ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEU7XG4gICAgICAgIH0pO1xuICAgICAgICBncmFkaWVudCA9IGdyYWRpZW50LnNwbGl0KC9cXHMqXFwtXFxzKi8pO1xuICAgICAgICBpZiAodHlwZSA9PSBcImxpbmVhclwiKSB7XG4gICAgICAgICAgICB2YXIgYW5nbGUgPSBncmFkaWVudC5zaGlmdCgpO1xuICAgICAgICAgICAgYW5nbGUgPSAtdG9GbG9hdChhbmdsZSk7XG4gICAgICAgICAgICBpZiAoaXNOYU4oYW5nbGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRvdHMgPSBSLl9wYXJzZURvdHMoZ3JhZGllbnQpO1xuICAgICAgICBpZiAoIWRvdHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIG8gPSBvLnNoYXBlIHx8IG8ubm9kZTtcbiAgICAgICAgaWYgKGRvdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBvLnJlbW92ZUNoaWxkKGZpbGwpO1xuICAgICAgICAgICAgZmlsbC5vbiA9IHRydWU7XG4gICAgICAgICAgICBmaWxsLm1ldGhvZCA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZmlsbC5jb2xvciA9IGRvdHNbMF0uY29sb3I7XG4gICAgICAgICAgICBmaWxsLmNvbG9yMiA9IGRvdHNbZG90cy5sZW5ndGggLSAxXS5jb2xvcjtcbiAgICAgICAgICAgIHZhciBjbHJzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBkb3RzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkb3RzW2ldLm9mZnNldCAmJiBjbHJzLnB1c2goZG90c1tpXS5vZmZzZXQgKyBTICsgZG90c1tpXS5jb2xvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxsLmNvbG9ycyA9IGNscnMubGVuZ3RoID8gY2xycy5qb2luKCkgOiBcIjAlIFwiICsgZmlsbC5jb2xvcjtcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwicmFkaWFsXCIpIHtcbiAgICAgICAgICAgICAgICBmaWxsLnR5cGUgPSBcImdyYWRpZW50VGl0bGVcIjtcbiAgICAgICAgICAgICAgICBmaWxsLmZvY3VzID0gXCIxMDAlXCI7XG4gICAgICAgICAgICAgICAgZmlsbC5mb2N1c3NpemUgPSBcIjAgMFwiO1xuICAgICAgICAgICAgICAgIGZpbGwuZm9jdXNwb3NpdGlvbiA9IGZ4Znk7XG4gICAgICAgICAgICAgICAgZmlsbC5hbmdsZSA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGZpbGwucm90YXRlPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZpbGwudHlwZSA9IFwiZ3JhZGllbnRcIjtcbiAgICAgICAgICAgICAgICBmaWxsLmFuZ2xlID0gKDI3MCAtIGFuZ2xlKSAlIDM2MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG8uYXBwZW5kQ2hpbGQoZmlsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfSxcbiAgICBFbGVtZW50ID0gZnVuY3Rpb24gKG5vZGUsIHZtbCkge1xuICAgICAgICB0aGlzWzBdID0gdGhpcy5ub2RlID0gbm9kZTtcbiAgICAgICAgbm9kZS5yYXBoYWVsID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pZCA9IFIuX29pZCsrO1xuICAgICAgICBub2RlLnJhcGhhZWxpZCA9IHRoaXMuaWQ7XG4gICAgICAgIHRoaXMuWCA9IDA7XG4gICAgICAgIHRoaXMuWSA9IDA7XG4gICAgICAgIHRoaXMuYXR0cnMgPSB7fTtcbiAgICAgICAgdGhpcy5wYXBlciA9IHZtbDtcbiAgICAgICAgdGhpcy5tYXRyaXggPSBSLm1hdHJpeCgpO1xuICAgICAgICB0aGlzLl8gPSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFtdLFxuICAgICAgICAgICAgc3g6IDEsXG4gICAgICAgICAgICBzeTogMSxcbiAgICAgICAgICAgIGR4OiAwLFxuICAgICAgICAgICAgZHk6IDAsXG4gICAgICAgICAgICBkZWc6IDAsXG4gICAgICAgICAgICBkaXJ0eTogMSxcbiAgICAgICAgICAgIGRpcnR5VDogMVxuICAgICAgICB9O1xuICAgICAgICAhdm1sLmJvdHRvbSAmJiAodm1sLmJvdHRvbSA9IHRoaXMpO1xuICAgICAgICB0aGlzLnByZXYgPSB2bWwudG9wO1xuICAgICAgICB2bWwudG9wICYmICh2bWwudG9wLm5leHQgPSB0aGlzKTtcbiAgICAgICAgdm1sLnRvcCA9IHRoaXM7XG4gICAgICAgIHRoaXMubmV4dCA9IG51bGw7XG4gICAgfTtcbiAgICB2YXIgZWxwcm90byA9IFIuZWw7XG5cbiAgICBFbGVtZW50LnByb3RvdHlwZSA9IGVscHJvdG87XG4gICAgZWxwcm90by5jb25zdHJ1Y3RvciA9IEVsZW1lbnQ7XG4gICAgZWxwcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbiAodHN0cikge1xuICAgICAgICBpZiAodHN0ciA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fLnRyYW5zZm9ybTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdmJzID0gdGhpcy5wYXBlci5fdmlld0JveFNoaWZ0LFxuICAgICAgICAgICAgdmJ0ID0gdmJzID8gXCJzXCIgKyBbdmJzLnNjYWxlLCB2YnMuc2NhbGVdICsgXCItMS0xdFwiICsgW3Zicy5keCwgdmJzLmR5XSA6IEUsXG4gICAgICAgICAgICBvbGR0O1xuICAgICAgICBpZiAodmJzKSB7XG4gICAgICAgICAgICBvbGR0ID0gdHN0ciA9IFN0cih0c3RyKS5yZXBsYWNlKC9cXC57M318XFx1MjAyNi9nLCB0aGlzLl8udHJhbnNmb3JtIHx8IEUpO1xuICAgICAgICB9XG4gICAgICAgIFIuX2V4dHJhY3RUcmFuc2Zvcm0odGhpcywgdmJ0ICsgdHN0cik7XG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLm1hdHJpeC5jbG9uZSgpLFxuICAgICAgICAgICAgc2tldyA9IHRoaXMuc2tldyxcbiAgICAgICAgICAgIG8gPSB0aGlzLm5vZGUsXG4gICAgICAgICAgICBzcGxpdCxcbiAgICAgICAgICAgIGlzR3JhZCA9IH5TdHIodGhpcy5hdHRycy5maWxsKS5pbmRleE9mKFwiLVwiKSxcbiAgICAgICAgICAgIGlzUGF0dCA9ICFTdHIodGhpcy5hdHRycy5maWxsKS5pbmRleE9mKFwidXJsKFwiKTtcbiAgICAgICAgbWF0cml4LnRyYW5zbGF0ZSgxLCAxKTtcbiAgICAgICAgaWYgKGlzUGF0dCB8fCBpc0dyYWQgfHwgdGhpcy50eXBlID09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgc2tldy5tYXRyaXggPSBcIjEgMCAwIDFcIjtcbiAgICAgICAgICAgIHNrZXcub2Zmc2V0ID0gXCIwIDBcIjtcbiAgICAgICAgICAgIHNwbGl0ID0gbWF0cml4LnNwbGl0KCk7XG4gICAgICAgICAgICBpZiAoKGlzR3JhZCAmJiBzcGxpdC5ub1JvdGF0aW9uKSB8fCAhc3BsaXQuaXNTaW1wbGUpIHtcbiAgICAgICAgICAgICAgICBvLnN0eWxlLmZpbHRlciA9IG1hdHJpeC50b0ZpbHRlcigpO1xuICAgICAgICAgICAgICAgIHZhciBiYiA9IHRoaXMuZ2V0QkJveCgpLFxuICAgICAgICAgICAgICAgICAgICBiYnQgPSB0aGlzLmdldEJCb3goMSksXG4gICAgICAgICAgICAgICAgICAgIGR4ID0gYmIueCAtIGJidC54LFxuICAgICAgICAgICAgICAgICAgICBkeSA9IGJiLnkgLSBiYnQueTtcbiAgICAgICAgICAgICAgICBvLmNvb3Jkb3JpZ2luID0gKGR4ICogLXpvb20pICsgUyArIChkeSAqIC16b29tKTtcbiAgICAgICAgICAgICAgICBzZXRDb29yZHModGhpcywgMSwgMSwgZHgsIGR5LCAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgby5zdHlsZS5maWx0ZXIgPSBFO1xuICAgICAgICAgICAgICAgIHNldENvb3Jkcyh0aGlzLCBzcGxpdC5zY2FsZXgsIHNwbGl0LnNjYWxleSwgc3BsaXQuZHgsIHNwbGl0LmR5LCBzcGxpdC5yb3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgby5zdHlsZS5maWx0ZXIgPSBFO1xuICAgICAgICAgICAgc2tldy5tYXRyaXggPSBTdHIobWF0cml4KTtcbiAgICAgICAgICAgIHNrZXcub2Zmc2V0ID0gbWF0cml4Lm9mZnNldCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvbGR0ICE9PSBudWxsKSB7IC8vIGVtcHR5IHN0cmluZyB2YWx1ZSBpcyB0cnVlIGFzIHdlbGxcbiAgICAgICAgICAgIHRoaXMuXy50cmFuc2Zvcm0gPSBvbGR0O1xuICAgICAgICAgICAgUi5fZXh0cmFjdFRyYW5zZm9ybSh0aGlzLCBvbGR0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8ucm90YXRlID0gZnVuY3Rpb24gKGRlZywgY3gsIGN5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWcgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRlZyA9IFN0cihkZWcpLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIGlmIChkZWcubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgY3ggPSB0b0Zsb2F0KGRlZ1sxXSk7XG4gICAgICAgICAgICBjeSA9IHRvRmxvYXQoZGVnWzJdKTtcbiAgICAgICAgfVxuICAgICAgICBkZWcgPSB0b0Zsb2F0KGRlZ1swXSk7XG4gICAgICAgIChjeSA9PSBudWxsKSAmJiAoY3ggPSBjeSk7XG4gICAgICAgIGlmIChjeCA9PSBudWxsIHx8IGN5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBiYm94ID0gdGhpcy5nZXRCQm94KDEpO1xuICAgICAgICAgICAgY3ggPSBiYm94LnggKyBiYm94LndpZHRoIC8gMjtcbiAgICAgICAgICAgIGN5ID0gYmJveC55ICsgYmJveC5oZWlnaHQgLyAyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuXy5kaXJ0eVQgPSAxO1xuICAgICAgICB0aGlzLnRyYW5zZm9ybSh0aGlzLl8udHJhbnNmb3JtLmNvbmNhdChbW1wiclwiLCBkZWcsIGN4LCBjeV1dKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by50cmFuc2xhdGUgPSBmdW5jdGlvbiAoZHgsIGR5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGR4ID0gU3RyKGR4KS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICBpZiAoZHgubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgZHkgPSB0b0Zsb2F0KGR4WzFdKTtcbiAgICAgICAgfVxuICAgICAgICBkeCA9IHRvRmxvYXQoZHhbMF0pIHx8IDA7XG4gICAgICAgIGR5ID0gK2R5IHx8IDA7XG4gICAgICAgIGlmICh0aGlzLl8uYmJveCkge1xuICAgICAgICAgICAgdGhpcy5fLmJib3gueCArPSBkeDtcbiAgICAgICAgICAgIHRoaXMuXy5iYm94LnkgKz0gZHk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50cmFuc2Zvcm0odGhpcy5fLnRyYW5zZm9ybS5jb25jYXQoW1tcInRcIiwgZHgsIGR5XV0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLnNjYWxlID0gZnVuY3Rpb24gKHN4LCBzeSwgY3gsIGN5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHN4ID0gU3RyKHN4KS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICBpZiAoc3gubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgc3kgPSB0b0Zsb2F0KHN4WzFdKTtcbiAgICAgICAgICAgIGN4ID0gdG9GbG9hdChzeFsyXSk7XG4gICAgICAgICAgICBjeSA9IHRvRmxvYXQoc3hbM10pO1xuICAgICAgICAgICAgaXNOYU4oY3gpICYmIChjeCA9IG51bGwpO1xuICAgICAgICAgICAgaXNOYU4oY3kpICYmIChjeSA9IG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHN4ID0gdG9GbG9hdChzeFswXSk7XG4gICAgICAgIChzeSA9PSBudWxsKSAmJiAoc3kgPSBzeCk7XG4gICAgICAgIChjeSA9PSBudWxsKSAmJiAoY3ggPSBjeSk7XG4gICAgICAgIGlmIChjeCA9PSBudWxsIHx8IGN5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBiYm94ID0gdGhpcy5nZXRCQm94KDEpO1xuICAgICAgICB9XG4gICAgICAgIGN4ID0gY3ggPT0gbnVsbCA/IGJib3gueCArIGJib3gud2lkdGggLyAyIDogY3g7XG4gICAgICAgIGN5ID0gY3kgPT0gbnVsbCA/IGJib3gueSArIGJib3guaGVpZ2h0IC8gMiA6IGN5O1xuICAgIFxuICAgICAgICB0aGlzLnRyYW5zZm9ybSh0aGlzLl8udHJhbnNmb3JtLmNvbmNhdChbW1wic1wiLCBzeCwgc3ksIGN4LCBjeV1dKSk7XG4gICAgICAgIHRoaXMuXy5kaXJ0eVQgPSAxO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8uaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIXRoaXMucmVtb3ZlZCAmJiAodGhpcy5ub2RlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAhdGhpcy5yZW1vdmVkICYmICh0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9IEUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8vIE5lZWRlZCB0byBmaXggdGhlIHZtbCBzZXRWaWV3Qm94IGlzc3Vlc1xuICAgIGVscHJvdG8uYXV4R2V0QkJveCA9IFIuZWwuZ2V0QkJveDtcbiAgICBlbHByb3RvLmdldEJCb3ggPSBmdW5jdGlvbigpe1xuICAgICAgdmFyIGIgPSB0aGlzLmF1eEdldEJCb3goKTtcbiAgICAgIGlmICh0aGlzLnBhcGVyICYmIHRoaXMucGFwZXIuX3ZpZXdCb3hTaGlmdClcbiAgICAgIHtcbiAgICAgICAgdmFyIGMgPSB7fTtcbiAgICAgICAgdmFyIHogPSAxL3RoaXMucGFwZXIuX3ZpZXdCb3hTaGlmdC5zY2FsZTtcbiAgICAgICAgYy54ID0gYi54IC0gdGhpcy5wYXBlci5fdmlld0JveFNoaWZ0LmR4O1xuICAgICAgICBjLnggKj0gejtcbiAgICAgICAgYy55ID0gYi55IC0gdGhpcy5wYXBlci5fdmlld0JveFNoaWZ0LmR5O1xuICAgICAgICBjLnkgKj0gejtcbiAgICAgICAgYy53aWR0aCAgPSBiLndpZHRoICAqIHo7XG4gICAgICAgIGMuaGVpZ2h0ID0gYi5oZWlnaHQgKiB6O1xuICAgICAgICBjLngyID0gYy54ICsgYy53aWR0aDtcbiAgICAgICAgYy55MiA9IGMueSArIGMuaGVpZ2h0O1xuICAgICAgICByZXR1cm4gYztcbiAgICAgIH1cbiAgICAgIHJldHVybiBiO1xuICAgIH07XG4gICAgZWxwcm90by5fZ2V0QkJveCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB0aGlzLlggKyAodGhpcy5iYnggfHwgMCkgLSB0aGlzLlcgLyAyLFxuICAgICAgICAgICAgeTogdGhpcy5ZIC0gdGhpcy5ILFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMuVyxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5IXG4gICAgICAgIH07XG4gICAgfTtcbiAgICBlbHByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCB8fCAhdGhpcy5ub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhcGVyLl9fc2V0X18gJiYgdGhpcy5wYXBlci5fX3NldF9fLmV4Y2x1ZGUodGhpcyk7XG4gICAgICAgIFIuZXZlLnVuYmluZChcInJhcGhhZWwuKi4qLlwiICsgdGhpcy5pZCk7XG4gICAgICAgIFIuX3RlYXIodGhpcywgdGhpcy5wYXBlcik7XG4gICAgICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZSk7XG4gICAgICAgIHRoaXMuc2hhcGUgJiYgdGhpcy5zaGFwZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuc2hhcGUpO1xuICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbaV0gPSB0eXBlb2YgdGhpc1tpXSA9PSBcImZ1bmN0aW9uXCIgPyBSLl9yZW1vdmVkRmFjdG9yeShpKSA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIGVscHJvdG8uYXR0ciA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBhIGluIHRoaXMuYXR0cnMpIGlmICh0aGlzLmF0dHJzW2hhc10oYSkpIHtcbiAgICAgICAgICAgICAgICByZXNbYV0gPSB0aGlzLmF0dHJzW2FdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLmdyYWRpZW50ICYmIHJlcy5maWxsID09IFwibm9uZVwiICYmIChyZXMuZmlsbCA9IHJlcy5ncmFkaWVudCkgJiYgZGVsZXRlIHJlcy5ncmFkaWVudDtcbiAgICAgICAgICAgIHJlcy50cmFuc2Zvcm0gPSB0aGlzLl8udHJhbnNmb3JtO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCAmJiBSLmlzKG5hbWUsIFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PSBmaWxsU3RyaW5nICYmIHRoaXMuYXR0cnMuZmlsbCA9PSBcIm5vbmVcIiAmJiB0aGlzLmF0dHJzLmdyYWRpZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXR0cnMuZ3JhZGllbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICAgICAgb3V0ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lIGluIHRoaXMuYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0W25hbWVdID0gdGhpcy5hdHRyc1tuYW1lXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFIuaXModGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW25hbWVdLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtuYW1lXSA9IHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1tuYW1lXS5kZWY7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0W25hbWVdID0gUi5fYXZhaWxhYmxlQXR0cnNbbmFtZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGlpIC0gMSA/IG91dCA6IG91dFtuYW1lc1swXV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYXR0cnMgJiYgdmFsdWUgPT0gbnVsbCAmJiBSLmlzKG5hbWUsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIG91dCA9IHt9O1xuICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBvdXRbbmFtZVtpXV0gPSB0aGlzLmF0dHIobmFtZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJhbXM7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgICAgICAgIHBhcmFtc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlID09IG51bGwgJiYgUi5pcyhuYW1lLCBcIm9iamVjdFwiKSAmJiAocGFyYW1zID0gbmFtZSk7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuYXR0ci5cIiArIGtleSArIFwiLlwiICsgdGhpcy5pZCwgdGhpcywgcGFyYW1zW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJhbXMpIHtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlcykgaWYgKHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1toYXNdKGtleSkgJiYgcGFyYW1zW2hhc10oa2V5KSAmJiBSLmlzKHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1trZXldLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhciA9IHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1trZXldLmFwcGx5KHRoaXMsIFtdLmNvbmNhdChwYXJhbXNba2V5XSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXR0cnNba2V5XSA9IHBhcmFtc1trZXldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHN1YmtleSBpbiBwYXIpIGlmIChwYXJbaGFzXShzdWJrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtc1tzdWJrZXldID0gcGFyW3N1YmtleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdGhpcy5wYXBlci5jYW52YXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgaWYgKHBhcmFtcy50ZXh0ICYmIHRoaXMudHlwZSA9PSBcInRleHRcIikge1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHBhdGguc3RyaW5nID0gcGFyYW1zLnRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHRoaXMsIHBhcmFtcyk7XG4gICAgICAgICAgICAvLyB0aGlzLnBhcGVyLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gRTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8udG9Gcm9udCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIXRoaXMucmVtb3ZlZCAmJiB0aGlzLm5vZGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLnBhcGVyICYmIHRoaXMucGFwZXIudG9wICE9IHRoaXMgJiYgUi5fdG9mcm9udCh0aGlzLCB0aGlzLnBhcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLnRvQmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubm9kZS5wYXJlbnROb2RlLmZpcnN0Q2hpbGQgIT0gdGhpcy5ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5ub2RlLCB0aGlzLm5vZGUucGFyZW50Tm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIFIuX3RvYmFjayh0aGlzLCB0aGlzLnBhcGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8uaW5zZXJ0QWZ0ZXIgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxlbWVudC5jb25zdHJ1Y3RvciA9PSBSLnN0LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudFtlbGVtZW50Lmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtZW50Lm5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGVsZW1lbnQubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLm5vZGUsIGVsZW1lbnQubm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50Lm5vZGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIFIuX2luc2VydGFmdGVyKHRoaXMsIGVsZW1lbnQsIHRoaXMucGFwZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8uaW5zZXJ0QmVmb3JlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQuY29uc3RydWN0b3IgPT0gUi5zdC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnRbMF07XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMubm9kZSwgZWxlbWVudC5ub2RlKTtcbiAgICAgICAgUi5faW5zZXJ0YmVmb3JlKHRoaXMsIGVsZW1lbnQsIHRoaXMucGFwZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8uYmx1ciA9IGZ1bmN0aW9uIChzaXplKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5ub2RlLnJ1bnRpbWVTdHlsZSxcbiAgICAgICAgICAgIGYgPSBzLmZpbHRlcjtcbiAgICAgICAgZiA9IGYucmVwbGFjZShibHVycmVnZXhwLCBFKTtcbiAgICAgICAgaWYgKCtzaXplICE9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmF0dHJzLmJsdXIgPSBzaXplO1xuICAgICAgICAgICAgcy5maWx0ZXIgPSBmICsgUyArIG1zICsgXCIuQmx1cihwaXhlbHJhZGl1cz1cIiArICgrc2l6ZSB8fCAxLjUpICsgXCIpXCI7XG4gICAgICAgICAgICBzLm1hcmdpbiA9IFIuZm9ybWF0KFwiLXswfXB4IDAgMCAtezB9cHhcIiwgcm91bmQoK3NpemUgfHwgMS41KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzLmZpbHRlciA9IGY7XG4gICAgICAgICAgICBzLm1hcmdpbiA9IDA7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5hdHRycy5ibHVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBSLl9lbmdpbmUucGF0aCA9IGZ1bmN0aW9uIChwYXRoU3RyaW5nLCB2bWwpIHtcbiAgICAgICAgdmFyIGVsID0gY3JlYXRlTm9kZShcInNoYXBlXCIpO1xuICAgICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gY3NzRG90O1xuICAgICAgICBlbC5jb29yZHNpemUgPSB6b29tICsgUyArIHpvb207XG4gICAgICAgIGVsLmNvb3Jkb3JpZ2luID0gdm1sLmNvb3Jkb3JpZ2luO1xuICAgICAgICB2YXIgcCA9IG5ldyBFbGVtZW50KGVsLCB2bWwpLFxuICAgICAgICAgICAgYXR0ciA9IHtmaWxsOiBcIm5vbmVcIiwgc3Ryb2tlOiBcIiMwMDBcIn07XG4gICAgICAgIHBhdGhTdHJpbmcgJiYgKGF0dHIucGF0aCA9IHBhdGhTdHJpbmcpO1xuICAgICAgICBwLnR5cGUgPSBcInBhdGhcIjtcbiAgICAgICAgcC5wYXRoID0gW107XG4gICAgICAgIHAuUGF0aCA9IEU7XG4gICAgICAgIHNldEZpbGxBbmRTdHJva2UocCwgYXR0cik7XG4gICAgICAgIHZtbC5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgc2tldyA9IGNyZWF0ZU5vZGUoXCJza2V3XCIpO1xuICAgICAgICBza2V3Lm9uID0gdHJ1ZTtcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc2tldyk7XG4gICAgICAgIHAuc2tldyA9IHNrZXc7XG4gICAgICAgIHAudHJhbnNmb3JtKEUpO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5yZWN0ID0gZnVuY3Rpb24gKHZtbCwgeCwgeSwgdywgaCwgcikge1xuICAgICAgICB2YXIgcGF0aCA9IFIuX3JlY3RQYXRoKHgsIHksIHcsIGgsIHIpLFxuICAgICAgICAgICAgcmVzID0gdm1sLnBhdGgocGF0aCksXG4gICAgICAgICAgICBhID0gcmVzLmF0dHJzO1xuICAgICAgICByZXMuWCA9IGEueCA9IHg7XG4gICAgICAgIHJlcy5ZID0gYS55ID0geTtcbiAgICAgICAgcmVzLlcgPSBhLndpZHRoID0gdztcbiAgICAgICAgcmVzLkggPSBhLmhlaWdodCA9IGg7XG4gICAgICAgIGEuciA9IHI7XG4gICAgICAgIGEucGF0aCA9IHBhdGg7XG4gICAgICAgIHJlcy50eXBlID0gXCJyZWN0XCI7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuZWxsaXBzZSA9IGZ1bmN0aW9uICh2bWwsIHgsIHksIHJ4LCByeSkge1xuICAgICAgICB2YXIgcmVzID0gdm1sLnBhdGgoKSxcbiAgICAgICAgICAgIGEgPSByZXMuYXR0cnM7XG4gICAgICAgIHJlcy5YID0geCAtIHJ4O1xuICAgICAgICByZXMuWSA9IHkgLSByeTtcbiAgICAgICAgcmVzLlcgPSByeCAqIDI7XG4gICAgICAgIHJlcy5IID0gcnkgKiAyO1xuICAgICAgICByZXMudHlwZSA9IFwiZWxsaXBzZVwiO1xuICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHJlcywge1xuICAgICAgICAgICAgY3g6IHgsXG4gICAgICAgICAgICBjeTogeSxcbiAgICAgICAgICAgIHJ4OiByeCxcbiAgICAgICAgICAgIHJ5OiByeVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5jaXJjbGUgPSBmdW5jdGlvbiAodm1sLCB4LCB5LCByKSB7XG4gICAgICAgIHZhciByZXMgPSB2bWwucGF0aCgpLFxuICAgICAgICAgICAgYSA9IHJlcy5hdHRycztcbiAgICAgICAgcmVzLlggPSB4IC0gcjtcbiAgICAgICAgcmVzLlkgPSB5IC0gcjtcbiAgICAgICAgcmVzLlcgPSByZXMuSCA9IHIgKiAyO1xuICAgICAgICByZXMudHlwZSA9IFwiY2lyY2xlXCI7XG4gICAgICAgIHNldEZpbGxBbmRTdHJva2UocmVzLCB7XG4gICAgICAgICAgICBjeDogeCxcbiAgICAgICAgICAgIGN5OiB5LFxuICAgICAgICAgICAgcjogclxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5pbWFnZSA9IGZ1bmN0aW9uICh2bWwsIHNyYywgeCwgeSwgdywgaCkge1xuICAgICAgICB2YXIgcGF0aCA9IFIuX3JlY3RQYXRoKHgsIHksIHcsIGgpLFxuICAgICAgICAgICAgcmVzID0gdm1sLnBhdGgocGF0aCkuYXR0cih7c3Ryb2tlOiBcIm5vbmVcIn0pLFxuICAgICAgICAgICAgYSA9IHJlcy5hdHRycyxcbiAgICAgICAgICAgIG5vZGUgPSByZXMubm9kZSxcbiAgICAgICAgICAgIGZpbGwgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKGZpbGxTdHJpbmcpWzBdO1xuICAgICAgICBhLnNyYyA9IHNyYztcbiAgICAgICAgcmVzLlggPSBhLnggPSB4O1xuICAgICAgICByZXMuWSA9IGEueSA9IHk7XG4gICAgICAgIHJlcy5XID0gYS53aWR0aCA9IHc7XG4gICAgICAgIHJlcy5IID0gYS5oZWlnaHQgPSBoO1xuICAgICAgICBhLnBhdGggPSBwYXRoO1xuICAgICAgICByZXMudHlwZSA9IFwiaW1hZ2VcIjtcbiAgICAgICAgZmlsbC5wYXJlbnROb2RlID09IG5vZGUgJiYgbm9kZS5yZW1vdmVDaGlsZChmaWxsKTtcbiAgICAgICAgZmlsbC5yb3RhdGUgPSB0cnVlO1xuICAgICAgICBmaWxsLnNyYyA9IHNyYztcbiAgICAgICAgZmlsbC50eXBlID0gXCJ0aWxlXCI7XG4gICAgICAgIHJlcy5fLmZpbGxwb3MgPSBbeCwgeV07XG4gICAgICAgIHJlcy5fLmZpbGxzaXplID0gW3csIGhdO1xuICAgICAgICBub2RlLmFwcGVuZENoaWxkKGZpbGwpO1xuICAgICAgICBzZXRDb29yZHMocmVzLCAxLCAxLCAwLCAwLCAwKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS50ZXh0ID0gZnVuY3Rpb24gKHZtbCwgeCwgeSwgdGV4dCkge1xuICAgICAgICB2YXIgZWwgPSBjcmVhdGVOb2RlKFwic2hhcGVcIiksXG4gICAgICAgICAgICBwYXRoID0gY3JlYXRlTm9kZShcInBhdGhcIiksXG4gICAgICAgICAgICBvID0gY3JlYXRlTm9kZShcInRleHRwYXRoXCIpO1xuICAgICAgICB4ID0geCB8fCAwO1xuICAgICAgICB5ID0geSB8fCAwO1xuICAgICAgICB0ZXh0ID0gdGV4dCB8fCBcIlwiO1xuICAgICAgICBwYXRoLnYgPSBSLmZvcm1hdChcIm17MH0sezF9bHsyfSx7MX1cIiwgcm91bmQoeCAqIHpvb20pLCByb3VuZCh5ICogem9vbSksIHJvdW5kKHggKiB6b29tKSArIDEpO1xuICAgICAgICBwYXRoLnRleHRwYXRob2sgPSB0cnVlO1xuICAgICAgICBvLnN0cmluZyA9IFN0cih0ZXh0KTtcbiAgICAgICAgby5vbiA9IHRydWU7XG4gICAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSBjc3NEb3Q7XG4gICAgICAgIGVsLmNvb3Jkc2l6ZSA9IHpvb20gKyBTICsgem9vbTtcbiAgICAgICAgZWwuY29vcmRvcmlnaW4gPSBcIjAgMFwiO1xuICAgICAgICB2YXIgcCA9IG5ldyBFbGVtZW50KGVsLCB2bWwpLFxuICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICBmaWxsOiBcIiMwMDBcIixcbiAgICAgICAgICAgICAgICBzdHJva2U6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIGZvbnQ6IFIuX2F2YWlsYWJsZUF0dHJzLmZvbnQsXG4gICAgICAgICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICAgICAgfTtcbiAgICAgICAgcC5zaGFwZSA9IGVsO1xuICAgICAgICBwLnBhdGggPSBwYXRoO1xuICAgICAgICBwLnRleHRwYXRoID0gbztcbiAgICAgICAgcC50eXBlID0gXCJ0ZXh0XCI7XG4gICAgICAgIHAuYXR0cnMudGV4dCA9IFN0cih0ZXh0KTtcbiAgICAgICAgcC5hdHRycy54ID0geDtcbiAgICAgICAgcC5hdHRycy55ID0geTtcbiAgICAgICAgcC5hdHRycy53ID0gMTtcbiAgICAgICAgcC5hdHRycy5oID0gMTtcbiAgICAgICAgc2V0RmlsbEFuZFN0cm9rZShwLCBhdHRyKTtcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQobyk7XG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHBhdGgpO1xuICAgICAgICB2bWwuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHNrZXcgPSBjcmVhdGVOb2RlKFwic2tld1wiKTtcbiAgICAgICAgc2tldy5vbiA9IHRydWU7XG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNrZXcpO1xuICAgICAgICBwLnNrZXcgPSBza2V3O1xuICAgICAgICBwLnRyYW5zZm9ybShFKTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuc2V0U2l6ZSA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBjcyA9IHRoaXMuY2FudmFzLnN0eWxlO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB3aWR0aCA9PSArd2lkdGggJiYgKHdpZHRoICs9IFwicHhcIik7XG4gICAgICAgIGhlaWdodCA9PSAraGVpZ2h0ICYmIChoZWlnaHQgKz0gXCJweFwiKTtcbiAgICAgICAgY3Mud2lkdGggPSB3aWR0aDtcbiAgICAgICAgY3MuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBjcy5jbGlwID0gXCJyZWN0KDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0ICsgXCIgMClcIjtcbiAgICAgICAgaWYgKHRoaXMuX3ZpZXdCb3gpIHtcbiAgICAgICAgICAgIFIuX2VuZ2luZS5zZXRWaWV3Qm94LmFwcGx5KHRoaXMsIHRoaXMuX3ZpZXdCb3gpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnNldFZpZXdCb3ggPSBmdW5jdGlvbiAoeCwgeSwgdywgaCwgZml0KSB7XG4gICAgICAgIFIuZXZlKFwicmFwaGFlbC5zZXRWaWV3Qm94XCIsIHRoaXMsIHRoaXMuX3ZpZXdCb3gsIFt4LCB5LCB3LCBoLCBmaXRdKTtcbiAgICAgICAgdmFyIHBhcGVyU2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpLFxuICAgICAgICAgICAgd2lkdGggPSBwYXBlclNpemUud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQgPSBwYXBlclNpemUuaGVpZ2h0LFxuICAgICAgICAgICAgSCwgVztcbiAgICAgICAgaWYgKGZpdCkge1xuICAgICAgICAgICAgSCA9IGhlaWdodCAvIGg7XG4gICAgICAgICAgICBXID0gd2lkdGggLyB3O1xuICAgICAgICAgICAgaWYgKHcgKiBIIDwgd2lkdGgpIHtcbiAgICAgICAgICAgICAgICB4IC09ICh3aWR0aCAtIHcgKiBIKSAvIDIgLyBIO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGggKiBXIDwgaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgeSAtPSAoaGVpZ2h0IC0gaCAqIFcpIC8gMiAvIFc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdmlld0JveCA9IFt4LCB5LCB3LCBoLCAhIWZpdF07XG4gICAgICAgIHRoaXMuX3ZpZXdCb3hTaGlmdCA9IHtcbiAgICAgICAgICAgIGR4OiAteCxcbiAgICAgICAgICAgIGR5OiAteSxcbiAgICAgICAgICAgIHNjYWxlOiBwYXBlclNpemVcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgZWwudHJhbnNmb3JtKFwiLi4uXCIpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICB2YXIgY3JlYXRlTm9kZTtcbiAgICBSLl9lbmdpbmUuaW5pdFdpbiA9IGZ1bmN0aW9uICh3aW4pIHtcbiAgICAgICAgICAgIHZhciBkb2MgPSB3aW4uZG9jdW1lbnQ7XG4gICAgICAgICAgICBpZiAoZG9jLnN0eWxlU2hlZXRzLmxlbmd0aCA8IDMxKSB7XG4gICAgICAgICAgICAgICAgZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKS5hZGRSdWxlKFwiLnJ2bWxcIiwgXCJiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKVwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gbW9yZSByb29tLCBhZGQgdG8gdGhlIGV4aXN0aW5nIG9uZVxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTE5NCUyOFZTLjg1JTI5LmFzcHhcbiAgICAgICAgICAgICAgICBkb2Muc3R5bGVTaGVldHNbMF0uYWRkUnVsZShcIi5ydm1sXCIsIFwiYmVoYXZpb3I6dXJsKCNkZWZhdWx0I1ZNTClcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICFkb2MubmFtZXNwYWNlcy5ydm1sICYmIGRvYy5uYW1lc3BhY2VzLmFkZChcInJ2bWxcIiwgXCJ1cm46c2NoZW1hcy1taWNyb3NvZnQtY29tOnZtbFwiKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVOb2RlID0gZnVuY3Rpb24gKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvYy5jcmVhdGVFbGVtZW50KCc8cnZtbDonICsgdGFnTmFtZSArICcgY2xhc3M9XCJydm1sXCI+Jyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVOb2RlID0gZnVuY3Rpb24gKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvYy5jcmVhdGVFbGVtZW50KCc8JyArIHRhZ05hbWUgKyAnIHhtbG5zPVwidXJuOnNjaGVtYXMtbWljcm9zb2Z0LmNvbTp2bWxcIiBjbGFzcz1cInJ2bWxcIj4nKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIFIuX2VuZ2luZS5pbml0V2luKFIuX2cud2luKTtcbiAgICBSLl9lbmdpbmUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29uID0gUi5fZ2V0Q29udGFpbmVyLmFwcGx5KDAsIGFyZ3VtZW50cyksXG4gICAgICAgICAgICBjb250YWluZXIgPSBjb24uY29udGFpbmVyLFxuICAgICAgICAgICAgaGVpZ2h0ID0gY29uLmhlaWdodCxcbiAgICAgICAgICAgIHMsXG4gICAgICAgICAgICB3aWR0aCA9IGNvbi53aWR0aCxcbiAgICAgICAgICAgIHggPSBjb24ueCxcbiAgICAgICAgICAgIHkgPSBjb24ueTtcbiAgICAgICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZNTCBjb250YWluZXIgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzID0gbmV3IFIuX1BhcGVyLFxuICAgICAgICAgICAgYyA9IHJlcy5jYW52YXMgPSBSLl9nLmRvYy5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuICAgICAgICAgICAgY3MgPSBjLnN0eWxlO1xuICAgICAgICB4ID0geCB8fCAwO1xuICAgICAgICB5ID0geSB8fCAwO1xuICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDUxMjtcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IDM0MjtcbiAgICAgICAgcmVzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHJlcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHdpZHRoID09ICt3aWR0aCAmJiAod2lkdGggKz0gXCJweFwiKTtcbiAgICAgICAgaGVpZ2h0ID09ICtoZWlnaHQgJiYgKGhlaWdodCArPSBcInB4XCIpO1xuICAgICAgICByZXMuY29vcmRzaXplID0gem9vbSAqIDFlMyArIFMgKyB6b29tICogMWUzO1xuICAgICAgICByZXMuY29vcmRvcmlnaW4gPSBcIjAgMFwiO1xuICAgICAgICByZXMuc3BhbiA9IFIuX2cuZG9jLmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICByZXMuc3Bhbi5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi05OTk5ZW07dG9wOi05OTk5ZW07cGFkZGluZzowO21hcmdpbjowO2xpbmUtaGVpZ2h0OjE7XCI7XG4gICAgICAgIGMuYXBwZW5kQ2hpbGQocmVzLnNwYW4pO1xuICAgICAgICBjcy5jc3NUZXh0ID0gUi5mb3JtYXQoXCJ0b3A6MDtsZWZ0OjA7d2lkdGg6ezB9O2hlaWdodDp7MX07ZGlzcGxheTppbmxpbmUtYmxvY2s7cG9zaXRpb246cmVsYXRpdmU7Y2xpcDpyZWN0KDAgezB9IHsxfSAwKTtvdmVyZmxvdzpoaWRkZW5cIiwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGlmIChjb250YWluZXIgPT0gMSkge1xuICAgICAgICAgICAgUi5fZy5kb2MuYm9keS5hcHBlbmRDaGlsZChjKTtcbiAgICAgICAgICAgIGNzLmxlZnQgPSB4ICsgXCJweFwiO1xuICAgICAgICAgICAgY3MudG9wID0geSArIFwicHhcIjtcbiAgICAgICAgICAgIGNzLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lci5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShjLCBjb250YWluZXIuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXMucmVuZGVyZml4ID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUi5ldmUoXCJyYXBoYWVsLmNsZWFyXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLmNhbnZhcy5pbm5lckhUTUwgPSBFO1xuICAgICAgICB0aGlzLnNwYW4gPSBSLl9nLmRvYy5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5zcGFuLnN0eWxlLmNzc1RleHQgPSBcInBvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTk5OTllbTt0b3A6LTk5OTllbTtwYWRkaW5nOjA7bWFyZ2luOjA7bGluZS1oZWlnaHQ6MTtkaXNwbGF5OmlubGluZTtcIjtcbiAgICAgICAgdGhpcy5jYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5zcGFuKTtcbiAgICAgICAgdGhpcy5ib3R0b20gPSB0aGlzLnRvcCA9IG51bGw7XG4gICAgfTtcbiAgICBSLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFIuZXZlKFwicmFwaGFlbC5yZW1vdmVcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpO1xuICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbaV0gPSB0eXBlb2YgdGhpc1tpXSA9PSBcImZ1bmN0aW9uXCIgPyBSLl9yZW1vdmVkRmFjdG9yeShpKSA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciBzZXRwcm90byA9IFIuc3Q7XG4gICAgZm9yICh2YXIgbWV0aG9kIGluIGVscHJvdG8pIGlmIChlbHByb3RvW2hhc10obWV0aG9kKSAmJiAhc2V0cHJvdG9baGFzXShtZXRob2QpKSB7XG4gICAgICAgIHNldHByb3RvW21ldGhvZF0gPSAoZnVuY3Rpb24gKG1ldGhvZG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICBlbFttZXRob2RuYW1lXS5hcHBseShlbCwgYXJnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKG1ldGhvZCk7XG4gICAgfVxufSkoKTtcblxuICAgIC8vIEVYUE9TRVxuICAgIC8vIFNWRyBhbmQgVk1MIGFyZSBhcHBlbmRlZCBqdXN0IGJlZm9yZSB0aGUgRVhQT1NFIGxpbmVcbiAgICAvLyBFdmVuIHdpdGggQU1ELCBSYXBoYWVsIHNob3VsZCBiZSBkZWZpbmVkIGdsb2JhbGx5XG4gICAgb2xkUmFwaGFlbC53YXMgPyAoZy53aW4uUmFwaGFlbCA9IFIpIDogKFJhcGhhZWwgPSBSKTtcblxuICAgIGlmKHR5cGVvZiBleHBvcnRzID09IFwib2JqZWN0XCIpe1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IFI7XG4gICAgfVxuICAgIHJldHVybiBSO1xufSkpO1xuIiwiUG9seW1lclxuICBpczogJ3RleHQtZmxvdy1saW5lJ1xuXG4gIHByb3BlcnRpZXM6XG4gICAgaW5kZW50OlxuICAgICAgdHlwZTogTnVtYmVyXG4gICAgICB2YWx1ZTogMFxuXG4gIHJlYWR5OiAoKSAtPlxuXG4gIGdldE9mZnNldFJlY3Q6ICgpIC0+XG4gICAgY2hpbGRyZW4gPSBAZ2V0Q29udGVudENoaWxkcmVuKClcblxuICAgIGlmIGNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgIGNoaWxkcmVuXG4gICAgICAgIC5tYXAgKGNoaWxkKSAtPiBjaGlsZC5nZXRPZmZzZXRSZWN0KClcbiAgICAgICAgLnJlZHVjZSAoZGltZW5zaW9ucywgb2Zmc2V0cykgLT5cbiAgICAgICAgICB3aWR0aDogZGltZW5zaW9ucy53aWR0aCArIG9mZnNldHMud2lkdGhcbiAgICAgICAgICBoZWlnaHQ6IE1hdGgubWF4IG9mZnNldHMuaGVpZ2h0LCBkaW1lbnNpb25zLmhlaWdodFxuICAgICAgICAgIGxlZnQ6IGRpbWVuc2lvbnMubGVmdFxuICAgICAgICAgIHRvcDogZGltZW5zaW9ucy50b3BcbiAgICBlbHNlXG4gICAgICB7d2lkdGg6IDAsIGhlaWdodDogMCwgbGVmdDogMCwgdG9wOiAwfVxuXG4gIF90YWJTdHlsZTogKGluZGVudCkgLT5cbiAgICBcIndpZHRoOiAjezIwICogaW5kZW50fXB4O1wiICtcbiAgICBcImRpc3BsYXk6IGlubGluZS1ibG9jaztcIiIsIlBvbHltZXJcbiAgaXM6ICd0ZXh0LWZsb3ctcGllY2UnXG5cbiAgcHJvcGVydGllczpcbiAgICBub2RlSWQ6XG4gICAgICB0eXBlOiBTdHJpbmdcbiAgICAgIHZhbHVlOiAnJ1xuXG4gIGxpc3RlbmVyczpcbiAgICAndXAnOiAnX29uVXAnXG5cbiAgZ2V0T2Zmc2V0UmVjdDogKCkgLT5cbiAgICB3aWR0aDogQG9mZnNldFdpZHRoXG4gICAgaGVpZ2h0OiBAb2Zmc2V0SGVpZ2h0XG4gICAgbGVmdDogQG9mZnNldExlZnRcbiAgICB0b3A6IEBvZmZzZXRUb3BcblxuXG4gIF9vblVwOiAoKSAtPlxuICAgIEBmaXJlICdzZWxlY3QnLFxuICAgICAgbm9kZUlkOiBAbm9kZUlkIiwiUmFwaGFlbCA9IHJlcXVpcmUgJ3JhcGhhZWwnXG5yZXF1aXJlICd0ZXh0LWZsb3ctbGluZSdcbnJlcXVpcmUgJ3RleHQtZmxvdy1waWVjZSdcblxuUG9seW1lclxuICBpczogJ3RleHQtZmxvdydcblxuICBwcm9wZXJ0aWVzOlxuICAgICMjI1xuICAgIFNldCB0byBgdHJ1ZWAgdG8gYXV0b21hdGljYWxseSBkcmF3IGEgcmFnZ2VkIGJhY2tncm91bmQuXG4gICAgIyMjXG4gICAgZHJhd0JhY2tncm91bmQ6XG4gICAgICB0eXBlOiBCb29sZWFuXG4gICAgICB2YWx1ZTogZmFsc2VcblxuICBjcmVhdGVkOiAoKSAtPlxuXG4gIHJlYWR5OiAoKSAtPlxuICAgIEBfbXV0YXRpb25DYWxsYmFja3MgPSBbXVxuICAgIG11dE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIgKHJlY29yZHMpID0+XG4gICAgICBAX211dGF0aW9uQ2FsbGJhY2tzLmZvckVhY2ggKGNiKSAtPlxuICAgICAgICBjYiByZWNvcmRzXG4gICAgICBAX211dGF0aW9uQ2FsbGJhY2tzID0gW11cbiAgICAgIGRvIEB1cGRhdGVDaGlsZHJlblxuICAgIG11dE9ic2VydmVyLm9ic2VydmUgQCQuYm9keSwgY2hpbGRMaXN0OiB0cnVlXG4gICAgQF9wYXBlciA9IFJhcGhhZWwgQCQuY2FudmFzLCBAJC5ib2R5Lm9mZnNldFdpZHRoLCBAJC5ib2R5Lm9mZnNldEhlaWdodFxuXG4gICAgQF9zaGFwZXMgPSB7fVxuICAgIEBfc2hhcGVzLmhpZ2hsaWdodHMgPSB7fVxuXG4gIGF0dGFjaGVkOiAoKSAtPlxuICAgIEBhc3luYyAoKSA9PlxuICAgICAgQF9wYXBlci5zZXRTaXplIEAkLmJvZHkub2Zmc2V0V2lkdGgsIEAkLmJvZHkub2Zmc2V0SGVpZ2h0XG5cbiAgdXBkYXRlQ2hpbGRyZW46ICgpIC0+XG4gICAgZG8gQGF0dGFjaGVkXG4gICAgaWYgQGRyYXdCYWNrZ3JvdW5kXG4gICAgICBkbyBAX2RyYXdCYWNrZ3JvdW5kXG5cbiAgIyMjXG4gIEByZXR1cm4gQWxsIGB0ZXh0LWZsb3ctcGllY2VgIGVsZW1lbnRzIHdpdGggdGhlIHNwZWNpZmllZCBub2RlIElELlxuICAjIyNcbiAgZ2V0UGllY2VzRm9yTm9kZTogKG5vZGVJZCkgLT5cbiAgICBAZ2V0Q29udGVudENoaWxkcmVuKClcbiAgICAgIC5tYXAgKGVsbSkgLT5cbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwgZWxtLnF1ZXJ5U2VsZWN0b3JBbGwgJ3RleHQtZmxvdy1waWVjZSdcbiAgICAgIC5yZWR1Y2UgKGFjYywgZWxtKSAtPlxuICAgICAgICBhY2MuY29uY2F0IGVsbVxuICAgICAgLmZpbHRlciAocGMpIC0+XG4gICAgICAgIHBjLm5vZGVJZFxuICAgICAgICAgIC5zcGxpdCAvXFxzL1xuICAgICAgICAgIC5maWx0ZXIgKGlkKSAtPiBpZCBpcyBub2RlSWRcbiAgICAgICAgICAubGVuZ3RoID4gMFxuXG4gIGhpZ2hsaWdodE5vZGU6IChub2RlSWQsIGF0dHJzKSAtPlxuICAgIHJlY3RzID1cbiAgICAgIChAZ2V0UGllY2VzRm9yTm9kZSBub2RlSWQpXG4gICAgICAgIC5tYXAgKHBjKSAtPiBwYy5nZXRPZmZzZXRSZWN0KClcbiAgICBAX3NoYXBlcy5oaWdobGlnaHRzW25vZGVJZF0gPSBAX2RyYXdSZWN0cyBAX3BhcGVyLCBhdHRycywgcmVjdHNcblxuICAgIHJldHVybiAoKSA9PiBAX3NoYXBlcy5oaWdobGlnaHRzW25vZGVJZF0uZm9yRWFjaCAoc2hhcGUpIC0+IHNoYXBlLnJlbW92ZSgpXG5cbiAgIyMjXG4gIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgb24gdGhlIG5leHQgc3VjY2Vzc2Z1bCBjaGlsZCBhcHBlbmQuXG4gIERlc3Ryb3lzIGNhbGxiYWNrIHdoZW4gaW52b2tlZC5cblxuICBAcGFyYW0gW0Z1bmN0aW9uXSBjYiBBIGZ1bmN0aW9uIHRha2luZyBpbiB0aGUgbXV0YXRpb24gcmVjb3JkcyBhcyBwcm92aWRlZCBieVxuICAgIGEgTXV0YXRpb25PYnNlcnZlci5cbiAgIyMjXG4gIG9uTmV4dENoaWxkQXBwZW5kOiAoY2IpIC0+XG4gICAgQF9tdXRhdGlvbkNhbGxiYWNrcy5wdXNoIGNiXG5cbiAgX2RyYXdCYWNrZ3JvdW5kOiAoKSAtPlxuICAgIGlmIEBfc2hhcGVzLmJhY2tncm91bmQ/XG4gICAgICBAX3NoYXBlcy5iYWNrZ3JvdW5kLmZvckVhY2ggKHNoYXBlKSAtPiBzaGFwZS5yZW1vdmUoKVxuXG4gICAgYXR0cnMgPVxuICAgICAgZmlsbDogJyNmY2MnXG4gICAgICBzdHJva2U6ICdub25lJ1xuICAgICAgYm9yZGVyUmFkaXVzOiA0XG4gICAgcmVjdHMgPVxuICAgICAgQGdldENvbnRlbnRDaGlsZHJlbigpXG4gICAgICAgIC5tYXAgKGNoaWxkKSAtPiBjaGlsZC5nZXRPZmZzZXRSZWN0KClcblxuICAgIEBfZHJhd1JlY3RzIFxcXG4gICAgICBAX3BhcGVyLFxuICAgICAgYXR0cnMsXG4gICAgICByZWN0c1xuXG4gIF9kcmF3UmVjdHM6IChwYXBlciwgYXR0cnMsIHJlY3RzKSAtPlxuICAgIHJlY3RzLm1hcCAocmVjdCkgLT5cbiAgICAgIGJvcmRlclJhZGl1cyA9XG4gICAgICAgIGlmIGF0dHJzLmJvcmRlclJhZGl1cz9cbiAgICAgICAgdGhlbiBhdHRycy5ib3JkZXJSYWRpdXNcbiAgICAgICAgZWxzZSAwXG4gICAgICBlbG0gPSBwYXBlci5yZWN0IHJlY3QubGVmdCwgcmVjdC50b3AsIHJlY3Qud2lkdGgsIHJlY3QuaGVpZ2h0LCBib3JkZXJSYWRpdXNcbiAgICAgIGZvciBhdHRyLCB2YWwgb2YgYXR0cnNcbiAgICAgICAgZWxtLmF0dHIgYXR0ciwgdmFsXG4gICAgICByZXR1cm4gZWxtIl19
