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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvcmFwaGFlbC9ub2RlX21vZHVsZXMvZXZlL2V2ZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9yYXBoYWVsL3JhcGhhZWwuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy90ZXh0LWZsb3ctbGluZS5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy90ZXh0LWZsb3ctcGllY2UuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL3RleHQtZmxvdy9zcmMvdGV4dC1mbG93LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvaVFBLE9BQUEsQ0FDRTtFQUFBLEVBQUEsRUFBSSxnQkFBSjtFQUVBLFVBQUEsRUFDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxNQUFOO01BQ0EsS0FBQSxFQUFPLENBRFA7S0FERjtHQUhGO0VBT0EsS0FBQSxFQUFPLFNBQUEsR0FBQSxDQVBQO0VBU0EsYUFBQSxFQUFlLFNBQUE7V0FDYixJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUNFLENBQUMsR0FESCxDQUNPLFNBQUMsS0FBRDthQUFXLEtBQUssQ0FBQyxhQUFOLENBQUE7SUFBWCxDQURQLENBRUUsQ0FBQyxNQUZILENBRVUsU0FBQyxVQUFELEVBQWEsT0FBYjthQUNOO1FBQUEsS0FBQSxFQUFPLFVBQVUsQ0FBQyxLQUFYLEdBQW1CLE9BQU8sQ0FBQyxLQUFsQztRQUNBLE1BQUEsRUFBUSxJQUFJLENBQUMsR0FBTCxDQUFTLE9BQU8sQ0FBQyxNQUFqQixFQUF5QixVQUFVLENBQUMsTUFBcEMsQ0FEUjtRQUVBLElBQUEsRUFBTSxVQUFVLENBQUMsSUFGakI7UUFHQSxHQUFBLEVBQUssVUFBVSxDQUFDLEdBSGhCOztJQURNLENBRlY7RUFEYSxDQVRmO0VBa0JBLFNBQUEsRUFBVyxTQUFDLE1BQUQ7V0FDVCxDQUFBLFNBQUEsR0FBUyxDQUFDLEVBQUEsR0FBSyxNQUFOLENBQVQsR0FBc0IsS0FBdEIsQ0FBQSxHQUNBO0VBRlMsQ0FsQlg7Q0FERjs7OztBQ0FBLE9BQUEsQ0FDRTtFQUFBLEVBQUEsRUFBSSxpQkFBSjtFQUVBLFVBQUEsRUFDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxNQUFOO01BQ0EsS0FBQSxFQUFPLEVBRFA7S0FERjtHQUhGO0VBT0EsU0FBQSxFQUNFO0lBQUEsSUFBQSxFQUFNLE9BQU47R0FSRjtFQVVBLGFBQUEsRUFBZSxTQUFBO1dBQ2I7TUFBQSxLQUFBLEVBQU8sSUFBQyxDQUFBLFdBQVI7TUFDQSxNQUFBLEVBQVEsSUFBQyxDQUFBLFlBRFQ7TUFFQSxJQUFBLEVBQU0sSUFBQyxDQUFBLFVBRlA7TUFHQSxHQUFBLEVBQUssSUFBQyxDQUFBLFNBSE47O0VBRGEsQ0FWZjtFQWlCQSxLQUFBLEVBQU8sU0FBQTtXQUNMLElBQUMsQ0FBQSxJQUFELENBQU0sUUFBTixFQUNFO01BQUEsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFUO0tBREY7RUFESyxDQWpCUDtDQURGOzs7O0FDQUEsSUFBQTs7QUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0FBQ1YsT0FBQSxDQUFRLGdCQUFSOztBQUNBLE9BQUEsQ0FBUSxpQkFBUjs7QUFFQSxPQUFBLENBQ0U7RUFBQSxFQUFBLEVBQUksV0FBSjtFQUVBLFVBQUEsRUFDRTs7QUFBQTs7O0lBR0EsY0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLE9BQU47TUFDQSxLQUFBLEVBQU8sS0FEUDtLQUpGO0dBSEY7RUFVQSxPQUFBLEVBQVMsU0FBQSxHQUFBLENBVlQ7RUFZQSxLQUFBLEVBQU8sU0FBQTtBQUNMLFFBQUE7SUFBQSxJQUFDLENBQUEsa0JBQUQsR0FBc0I7SUFDdEIsV0FBQSxHQUFrQixJQUFBLGdCQUFBLENBQWlCLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxPQUFEO1FBQ2pDLEtBQUMsQ0FBQSxrQkFBa0IsQ0FBQyxPQUFwQixDQUE0QixTQUFDLEVBQUQ7aUJBQzFCLEVBQUEsQ0FBRyxPQUFIO1FBRDBCLENBQTVCO1FBRUEsS0FBQyxDQUFBLGtCQUFELEdBQXNCO2VBQ25CLEtBQUMsQ0FBQSxjQUFKLENBQUE7TUFKaUM7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCO0lBS2xCLFdBQVcsQ0FBQyxPQUFaLENBQW9CLElBQUMsQ0FBQSxDQUFDLENBQUMsSUFBdkIsRUFBNkI7TUFBQSxTQUFBLEVBQVcsSUFBWDtLQUE3QjtJQUNBLElBQUMsQ0FBQSxNQUFELEdBQVUsT0FBQSxDQUFRLElBQUMsQ0FBQSxDQUFDLENBQUMsTUFBWCxFQUFtQixJQUFDLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUEzQixFQUF3QyxJQUFDLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFoRDtJQUVWLElBQUMsQ0FBQSxPQUFELEdBQVc7V0FDWCxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVQsR0FBc0I7RUFYakIsQ0FaUDtFQXlCQSxRQUFBLEVBQVUsU0FBQTtXQUNSLElBQUMsQ0FBQSxLQUFELENBQU8sQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQ0wsS0FBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQWdCLEtBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQXhCLEVBQXFDLEtBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQTdDO01BREs7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVA7RUFEUSxDQXpCVjtFQTZCQSxjQUFBLEVBQWdCLFNBQUE7SUFDWCxJQUFDLENBQUEsUUFBSixDQUFBO0lBQ0EsSUFBRyxJQUFDLENBQUEsY0FBSjthQUNLLElBQUMsQ0FBQSxlQUFKLENBQUEsRUFERjs7RUFGYyxDQTdCaEI7O0FBa0NBOzs7RUFHQSxnQkFBQSxFQUFrQixTQUFDLE1BQUQ7V0FDaEIsSUFBQyxDQUFBLGtCQUFELENBQUEsQ0FDRSxDQUFDLEdBREgsQ0FDTyxTQUFDLEdBQUQ7YUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUF0QixDQUEyQixHQUFHLENBQUMsZ0JBQUosQ0FBcUIsaUJBQXJCLENBQTNCO0lBREcsQ0FEUCxDQUdFLENBQUMsTUFISCxDQUdVLFNBQUMsR0FBRCxFQUFNLEdBQU47YUFDTixHQUFHLENBQUMsTUFBSixDQUFXLEdBQVg7SUFETSxDQUhWLENBS0UsQ0FBQyxNQUxILENBS1UsU0FBQyxFQUFEO2FBQ04sRUFBRSxDQUFDLE1BQ0QsQ0FBQyxLQURILENBQ1MsSUFEVCxDQUVFLENBQUMsTUFGSCxDQUVVLFNBQUMsRUFBRDtlQUFRLEVBQUEsS0FBTTtNQUFkLENBRlYsQ0FHRSxDQUFDLE1BSEgsR0FHWTtJQUpOLENBTFY7RUFEZ0IsQ0FyQ2xCO0VBaURBLGFBQUEsRUFBZSxTQUFDLE1BQUQsRUFBUyxLQUFUO0FBQ2IsUUFBQTtJQUFBLEtBQUEsR0FDRSxDQUFDLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixNQUFsQixDQUFELENBQ0UsQ0FBQyxHQURILENBQ08sU0FBQyxFQUFEO2FBQVEsRUFBRSxDQUFDLGFBQUgsQ0FBQTtJQUFSLENBRFA7SUFFRixJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVcsQ0FBQSxNQUFBLENBQXBCLEdBQThCLElBQUMsQ0FBQSxVQUFELENBQVksSUFBQyxDQUFBLE1BQWIsRUFBcUIsS0FBckIsRUFBNEIsS0FBNUI7QUFFOUIsV0FBTyxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7ZUFBTSxLQUFDLENBQUEsT0FBTyxDQUFDLFVBQVcsQ0FBQSxNQUFBLENBQU8sQ0FBQyxPQUE1QixDQUFvQyxTQUFDLEtBQUQ7aUJBQVcsS0FBSyxDQUFDLE1BQU4sQ0FBQTtRQUFYLENBQXBDO01BQU47SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0VBTk0sQ0FqRGY7O0FBeURBOzs7Ozs7O0VBT0EsaUJBQUEsRUFBbUIsU0FBQyxFQUFEO1dBQ2pCLElBQUMsQ0FBQSxrQkFBa0IsQ0FBQyxJQUFwQixDQUF5QixFQUF6QjtFQURpQixDQWhFbkI7RUFtRUEsZUFBQSxFQUFpQixTQUFBO0FBQ2YsUUFBQTtJQUFBLElBQUcsK0JBQUg7TUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFwQixDQUE0QixTQUFDLEtBQUQ7ZUFBVyxLQUFLLENBQUMsTUFBTixDQUFBO01BQVgsQ0FBNUIsRUFERjs7SUFHQSxLQUFBLEdBQ0U7TUFBQSxJQUFBLEVBQU0sTUFBTjtNQUNBLE1BQUEsRUFBUSxNQURSO01BRUEsWUFBQSxFQUFjLENBRmQ7O0lBR0YsS0FBQSxHQUNFLElBQUMsQ0FBQSxrQkFBRCxDQUFBLENBQ0UsQ0FBQyxHQURILENBQ08sU0FBQyxLQUFEO2FBQVcsS0FBSyxDQUFDLGFBQU4sQ0FBQTtJQUFYLENBRFA7V0FHRixJQUFDLENBQUEsVUFBRCxDQUNFLElBQUMsQ0FBQSxNQURILEVBRUUsS0FGRixFQUdFLEtBSEY7RUFaZSxDQW5FakI7RUFvRkEsVUFBQSxFQUFZLFNBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmO1dBQ1YsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFDLElBQUQ7QUFDUixVQUFBO01BQUEsWUFBQSxHQUNLLDBCQUFILEdBQ0ssS0FBSyxDQUFDLFlBRFgsR0FFSztNQUNQLEdBQUEsR0FBTSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUksQ0FBQyxJQUFoQixFQUFzQixJQUFJLENBQUMsR0FBM0IsRUFBZ0MsSUFBSSxDQUFDLEtBQXJDLEVBQTRDLElBQUksQ0FBQyxNQUFqRCxFQUF5RCxZQUF6RDtBQUNOLFdBQUEsYUFBQTs7UUFDRSxHQUFHLENBQUMsSUFBSixDQUFTLElBQVQsRUFBZSxHQUFmO0FBREY7QUFFQSxhQUFPO0lBUkMsQ0FBVjtFQURVLENBcEZaO0NBREYiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLy8g4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQIFxcXFxcbi8vIOKUgiBFdmUgMC40LjIgLSBKYXZhU2NyaXB0IEV2ZW50cyBMaWJyYXJ5ICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIEF1dGhvciBEbWl0cnkgQmFyYW5vdnNraXkgKGh0dHA6Ly9kbWl0cnkuYmFyYW5vdnNraXkuY29tLykg4pSCIFxcXFxcbi8vIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCBcXFxcXG5cbihmdW5jdGlvbiAoZ2xvYikge1xuICAgIHZhciB2ZXJzaW9uID0gXCIwLjQuMlwiLFxuICAgICAgICBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIHNlcGFyYXRvciA9IC9bXFwuXFwvXS8sXG4gICAgICAgIHdpbGRjYXJkID0gXCIqXCIsXG4gICAgICAgIGZ1biA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBudW1zb3J0ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVudF9ldmVudCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZXZlbnRzID0ge246IHt9fSxcbiAgICAvKlxcXG4gICAgICogZXZlXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIEZpcmVzIGV2ZW50IHdpdGggZ2l2ZW4gYG5hbWVgLCBnaXZlbiBzY29wZSBhbmQgb3RoZXIgcGFyYW1ldGVycy5cblxuICAgICA+IEFyZ3VtZW50c1xuXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSAqZXZlbnQqLCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkXG4gICAgIC0gc2NvcGUgKG9iamVjdCkgY29udGV4dCBmb3IgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgIC0gdmFyYXJncyAoLi4uKSB0aGUgcmVzdCBvZiBhcmd1bWVudHMgd2lsbCBiZSBzZW50IHRvIGV2ZW50IGhhbmRsZXJzXG5cbiAgICAgPSAob2JqZWN0KSBhcnJheSBvZiByZXR1cm5lZCB2YWx1ZXMgZnJvbSB0aGUgbGlzdGVuZXJzXG4gICAgXFwqL1xuICAgICAgICBldmUgPSBmdW5jdGlvbiAobmFtZSwgc2NvcGUpIHtcblx0XHRcdG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgICAgICB2YXIgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgICAgICBvbGRzdG9wID0gc3RvcCxcbiAgICAgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSxcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBldmUubGlzdGVuZXJzKG5hbWUpLFxuICAgICAgICAgICAgICAgIHogPSAwLFxuICAgICAgICAgICAgICAgIGYgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBsLFxuICAgICAgICAgICAgICAgIGluZGV4ZWQgPSBbXSxcbiAgICAgICAgICAgICAgICBxdWV1ZSA9IHt9LFxuICAgICAgICAgICAgICAgIG91dCA9IFtdLFxuICAgICAgICAgICAgICAgIGNlID0gY3VycmVudF9ldmVudCxcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSBuYW1lO1xuICAgICAgICAgICAgc3RvcCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKFwiekluZGV4XCIgaW4gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhlZC5wdXNoKGxpc3RlbmVyc1tpXS56SW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0uekluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZVtsaXN0ZW5lcnNbaV0uekluZGV4XSA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleGVkLnNvcnQobnVtc29ydCk7XG4gICAgICAgICAgICB3aGlsZSAoaW5kZXhlZFt6XSA8IDApIHtcbiAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6KytdXTtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IG9sZHN0b3A7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChcInpJbmRleFwiIGluIGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGwuekluZGV4ID09IGluZGV4ZWRbel0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeisrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBxdWV1ZVtpbmRleGVkW3pdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsICYmIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChsKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVbbC56SW5kZXhdID0gbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcCA9IG9sZHN0b3A7XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gY2U7XG4gICAgICAgICAgICByZXR1cm4gb3V0Lmxlbmd0aCA/IG91dCA6IG51bGw7XG4gICAgICAgIH07XG5cdFx0Ly8gVW5kb2N1bWVudGVkLiBEZWJ1ZyBvbmx5LlxuXHRcdGV2ZS5fZXZlbnRzID0gZXZlbnRzO1xuICAgIC8qXFxcbiAgICAgKiBldmUubGlzdGVuZXJzXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIEludGVybmFsIG1ldGhvZCB3aGljaCBnaXZlcyB5b3UgYXJyYXkgb2YgYWxsIGV2ZW50IGhhbmRsZXJzIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIGBuYW1lYC5cblxuICAgICA+IEFyZ3VtZW50c1xuXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiBldmVudCBoYW5kbGVyc1xuICAgIFxcKi9cbiAgICBldmUubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICBpdGVtcyxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaWksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgamosXG4gICAgICAgICAgICBuZXMsXG4gICAgICAgICAgICBlcyA9IFtlXSxcbiAgICAgICAgICAgIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIG5lcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlcy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgZSA9IGVzW2pdLm47XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBbZVtuYW1lc1tpXV0sIGVbd2lsZGNhcmRdXTtcbiAgICAgICAgICAgICAgICBrID0gMjtcbiAgICAgICAgICAgICAgICB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1trXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ID0gb3V0LmNvbmNhdChpdGVtLmYgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXMgPSBuZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBldmUub25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJpbmRzIGdpdmVuIGV2ZW50IGhhbmRsZXIgd2l0aCBhIGdpdmVuIG5hbWUuIFlvdSBjYW4gdXNlIHdpbGRjYXJkcyDigJxgKmDigJ0gZm9yIHRoZSBuYW1lczpcbiAgICAgfCBldmUub24oXCIqLnVuZGVyLipcIiwgZik7XG4gICAgIHwgZXZlKFwibW91c2UudW5kZXIuZmxvb3JcIik7IC8vIHRyaWdnZXJzIGZcbiAgICAgKiBVc2UgQGV2ZSB0byB0cmlnZ2VyIHRoZSBsaXN0ZW5lci5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSByZXR1cm5lZCBmdW5jdGlvbiBhY2NlcHRzIGEgc2luZ2xlIG51bWVyaWMgcGFyYW1ldGVyIHRoYXQgcmVwcmVzZW50cyB6LWluZGV4IG9mIHRoZSBoYW5kbGVyLiBJdCBpcyBhbiBvcHRpb25hbCBmZWF0dXJlIGFuZCBvbmx5IHVzZWQgd2hlbiB5b3UgbmVlZCB0byBlbnN1cmUgdGhhdCBzb21lIHN1YnNldCBvZiBoYW5kbGVycyB3aWxsIGJlIGludm9rZWQgaW4gYSBnaXZlbiBvcmRlciwgZGVzcGl0ZSBvZiB0aGUgb3JkZXIgb2YgYXNzaWdubWVudC4gXG4gICAgID4gRXhhbXBsZTpcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBlYXRJdCkoMik7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgc2NyZWFtKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBjYXRjaEl0KSgxKTtcbiAgICAgKiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgYGNhdGNoSXQoKWAgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYmVmb3JlIGBlYXRJdCgpYC5cblx0ICpcbiAgICAgKiBJZiB5b3Ugd2FudCB0byBwdXQgeW91ciBoYW5kbGVyIGJlZm9yZSBub24taW5kZXhlZCBoYW5kbGVycywgc3BlY2lmeSBhIG5lZ2F0aXZlIHZhbHVlLlxuICAgICAqIE5vdGU6IEkgYXNzdW1lIG1vc3Qgb2YgdGhlIHRpbWUgeW91IGRvbuKAmXQgbmVlZCB0byB3b3JyeSBhYm91dCB6LWluZGV4LCBidXQgaXTigJlzIG5pY2UgdG8gaGF2ZSB0aGlzIGZlYXR1cmUg4oCcanVzdCBpbiBjYXNl4oCdLlxuICAgIFxcKi9cbiAgICBldmUub24gPSBmdW5jdGlvbiAobmFtZSwgZikge1xuXHRcdG5hbWUgPSBTdHJpbmcobmFtZSk7XG5cdFx0aWYgKHR5cGVvZiBmICE9IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHt9O1xuXHRcdH1cbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSA9IGV2ZW50cztcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZSA9IGUubjtcbiAgICAgICAgICAgIGUgPSBlLmhhc093blByb3BlcnR5KG5hbWVzW2ldKSAmJiBlW25hbWVzW2ldXSB8fCAoZVtuYW1lc1tpXV0gPSB7bjoge319KTtcbiAgICAgICAgfVxuICAgICAgICBlLmYgPSBlLmYgfHwgW107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gZS5mLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChlLmZbaV0gPT0gZikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bjtcbiAgICAgICAgfVxuICAgICAgICBlLmYucHVzaChmKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh6SW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgrekluZGV4ID09ICt6SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmLnpJbmRleCA9ICt6SW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgZ2l2ZW4gZXZlbnQgd2l0aCBvcHRpb25hbCBhcmd1bWVudHMuXG5cdCAqIEFyZ3VtZW50cyB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSByZXN1bHQgZnVuY3Rpb24gd2lsbCBiZSBhbHNvXG5cdCAqIGNvbmNhdGVkIHRvIHRoZSBsaXN0IG9mIGZpbmFsIGFyZ3VtZW50cy5cbiBcdCB8IGVsLm9uY2xpY2sgPSBldmUuZihcImNsaWNrXCIsIDEsIDIpO1xuIFx0IHwgZXZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiBcdCB8ICAgICBjb25zb2xlLmxvZyhhLCBiLCBjKTsgLy8gMSwgMiwgW2V2ZW50IG9iamVjdF1cbiBcdCB8IH0pO1xuICAgICA+IEFyZ3VtZW50c1xuXHQgLSBldmVudCAoc3RyaW5nKSBldmVudCBuYW1lXG5cdCAtIHZhcmFyZ3MgKOKApikgYW5kIGFueSBvdGhlciBhcmd1bWVudHNcblx0ID0gKGZ1bmN0aW9uKSBwb3NzaWJsZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgXFwqL1xuXHRldmUuZiA9IGZ1bmN0aW9uIChldmVudCkge1xuXHRcdHZhciBhdHRycyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZXZlLmFwcGx5KG51bGwsIFtldmVudCwgbnVsbF0uY29uY2F0KGF0dHJzKS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7XG5cdFx0fTtcblx0fTtcbiAgICAvKlxcXG4gICAgICogZXZlLnN0b3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIElzIHVzZWQgaW5zaWRlIGFuIGV2ZW50IGhhbmRsZXIgdG8gc3RvcCB0aGUgZXZlbnQsIHByZXZlbnRpbmcgYW55IHN1YnNlcXVlbnQgbGlzdGVuZXJzIGZyb20gZmlyaW5nLlxuICAgIFxcKi9cbiAgICBldmUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RvcCA9IDE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIHN1Ym5hbWUgKHN0cmluZykgI29wdGlvbmFsIHN1Ym5hbWUgb2YgdGhlIGV2ZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGlmIGBzdWJuYW1lYCBpcyBub3Qgc3BlY2lmaWVkXG4gICAgICogb3JcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgLCBpZiBjdXJyZW50IGV2ZW504oCZcyBuYW1lIGNvbnRhaW5zIGBzdWJuYW1lYFxuICAgIFxcKi9cbiAgICBldmUubnQgPSBmdW5jdGlvbiAoc3VibmFtZSkge1xuICAgICAgICBpZiAoc3VibmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCIoPzpcXFxcLnxcXFxcL3xeKVwiICsgc3VibmFtZSArIFwiKD86XFxcXC58XFxcXC98JClcIikudGVzdChjdXJyZW50X2V2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudF9ldmVudDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUubnRzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICAqKlxuICAgICA9IChhcnJheSkgbmFtZXMgb2YgdGhlIGV2ZW50XG4gICAgXFwqL1xuICAgIGV2ZS5udHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50X2V2ZW50LnNwbGl0KHNlcGFyYXRvcik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9mZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGV2ZW50IGxpc3RlbmVycyBhc3NpZ25lZCB0byBnaXZlbiBuYW1lLlxuXHQgKiBJZiBubyBhcmd1bWVudHMgc3BlY2lmaWVkIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgY2xlYXJlZC5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBldmUudW5iaW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQGV2ZS5vZmZcbiAgICBcXCovXG4gICAgZXZlLm9mZiA9IGV2ZS51bmJpbmQgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuXHRcdGlmICghbmFtZSkge1xuXHRcdCAgICBldmUuX2V2ZW50cyA9IGV2ZW50cyA9IHtuOiB7fX07XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICBlLFxuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgc3BsaWNlLFxuICAgICAgICAgICAgaSwgaWksIGosIGpqLFxuICAgICAgICAgICAgY3VyID0gW2V2ZW50c107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGN1ci5sZW5ndGg7IGogKz0gc3BsaWNlLmxlbmd0aCAtIDIpIHtcbiAgICAgICAgICAgICAgICBzcGxpY2UgPSBbaiwgMV07XG4gICAgICAgICAgICAgICAgZSA9IGN1cltqXS5uO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lc1tpXSAhPSB3aWxkY2FyZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZVtuYW1lc1tpXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGljZS5wdXNoKGVbbmFtZXNbaV1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUpIGlmIChlW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtrZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXIuc3BsaWNlLmFwcGx5KGN1ciwgc3BsaWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGN1ci5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBlID0gY3VyW2ldO1xuICAgICAgICAgICAgd2hpbGUgKGUubikge1xuICAgICAgICAgICAgICAgIGlmIChmKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZS5mLmxlbmd0aDsgaiA8IGpqOyBqKyspIGlmIChlLmZbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuZi5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAhZS5mLmxlbmd0aCAmJiBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUubikgaWYgKGUubltoYXNdKGtleSkgJiYgZS5uW2tleV0uZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bmNzID0gZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZnVuY3MubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGZ1bmNzW2pdID09IGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAhZnVuY3MubGVuZ3RoICYmIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGUuZjtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlID0gZS5uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9uY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJpbmRzIGdpdmVuIGV2ZW50IGhhbmRsZXIgd2l0aCBhIGdpdmVuIG5hbWUgdG8gb25seSBydW4gb25jZSB0aGVuIHVuYmluZCBpdHNlbGYuXG4gICAgIHwgZXZlLm9uY2UoXCJsb2dpblwiLCBmKTtcbiAgICAgfCBldmUoXCJsb2dpblwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyBubyBsaXN0ZW5lcnNcbiAgICAgKiBVc2UgQGV2ZSB0byB0cmlnZ2VyIHRoZSBsaXN0ZW5lci5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSBzYW1lIHJldHVybiBmdW5jdGlvbiBhcyBAZXZlLm9uXG4gICAgXFwqL1xuICAgIGV2ZS5vbmNlID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcbiAgICAgICAgdmFyIGYyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlLnVuYmluZChuYW1lLCBmMik7XG4gICAgICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZXZlLm9uKG5hbWUsIGYyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUudmVyc2lvblxuICAgICBbIHByb3BlcnR5IChzdHJpbmcpIF1cbiAgICAgKipcbiAgICAgKiBDdXJyZW50IHZlcnNpb24gb2YgdGhlIGxpYnJhcnkuXG4gICAgXFwqL1xuICAgIGV2ZS52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICBldmUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIllvdSBhcmUgcnVubmluZyBFdmUgXCIgKyB2ZXJzaW9uO1xuICAgIH07XG4gICAgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykgPyAobW9kdWxlLmV4cG9ydHMgPSBldmUpIDogKHR5cGVvZiBkZWZpbmUgIT0gXCJ1bmRlZmluZWRcIiA/IChkZWZpbmUoXCJldmVcIiwgW10sIGZ1bmN0aW9uKCkgeyByZXR1cm4gZXZlOyB9KSkgOiAoZ2xvYi5ldmUgPSBldmUpKTtcbn0pKHRoaXMpO1xuIiwiLy8g4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQIFxcXFxcbi8vIOKUgiBSYXBoYcOrbCAyLjEuMyAtIEphdmFTY3JpcHQgVmVjdG9yIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIENvcHlyaWdodCDCqSAyMDA4LTIwMTIgRG1pdHJ5IEJhcmFub3Zza2l5IChodHRwOi8vcmFwaGFlbGpzLmNvbSkgICAg4pSCIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgwqkgMjAwOC0yMDEyIFNlbmNoYSBMYWJzIChodHRwOi8vc2VuY2hhLmNvbSkgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgKGh0dHA6Ly9yYXBoYWVsanMuY29tL2xpY2Vuc2UuaHRtbCkgbGljZW5zZS7ilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8vIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCBcXFxcXG4vLyDilIIgRXZlIDAuNC4yIC0gSmF2YVNjcmlwdCBFdmVudHMgTGlicmFyeSAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBBdXRob3IgRG1pdHJ5IEJhcmFub3Zza2l5IChodHRwOi8vZG1pdHJ5LmJhcmFub3Zza2l5LmNvbS8pIOKUgiBcXFxcXG4vLyDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggXFxcXFxuXG4oZnVuY3Rpb24gKGdsb2IpIHtcbiAgICB2YXIgdmVyc2lvbiA9IFwiMC40LjJcIixcbiAgICAgICAgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBzZXBhcmF0b3IgPSAvW1xcLlxcL10vLFxuICAgICAgICB3aWxkY2FyZCA9IFwiKlwiLFxuICAgICAgICBmdW4gPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgbnVtc29ydCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRfZXZlbnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGV2ZW50cyA9IHtuOiB7fX0sXG4gICAgLypcXFxuICAgICAqIGV2ZVxuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBGaXJlcyBldmVudCB3aXRoIGdpdmVuIGBuYW1lYCwgZ2l2ZW4gc2NvcGUgYW5kIG90aGVyIHBhcmFtZXRlcnMuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgKmV2ZW50KiwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuICAgICAtIHNjb3BlIChvYmplY3QpIGNvbnRleHQgZm9yIHRoZSBldmVudCBoYW5kbGVyc1xuICAgICAtIHZhcmFyZ3MgKC4uLikgdGhlIHJlc3Qgb2YgYXJndW1lbnRzIHdpbGwgYmUgc2VudCB0byBldmVudCBoYW5kbGVyc1xuXG4gICAgID0gKG9iamVjdCkgYXJyYXkgb2YgcmV0dXJuZWQgdmFsdWVzIGZyb20gdGhlIGxpc3RlbmVyc1xuICAgIFxcKi9cbiAgICAgICAgZXZlID0gZnVuY3Rpb24gKG5hbWUsIHNjb3BlKSB7XG5cdFx0XHRuYW1lID0gU3RyaW5nKG5hbWUpO1xuICAgICAgICAgICAgdmFyIGUgPSBldmVudHMsXG4gICAgICAgICAgICAgICAgb2xkc3RvcCA9IHN0b3AsXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMiksXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gZXZlLmxpc3RlbmVycyhuYW1lKSxcbiAgICAgICAgICAgICAgICB6ID0gMCxcbiAgICAgICAgICAgICAgICBmID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICBpbmRleGVkID0gW10sXG4gICAgICAgICAgICAgICAgcXVldWUgPSB7fSxcbiAgICAgICAgICAgICAgICBvdXQgPSBbXSxcbiAgICAgICAgICAgICAgICBjZSA9IGN1cnJlbnRfZXZlbnQsXG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gbmFtZTtcbiAgICAgICAgICAgIHN0b3AgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChcInpJbmRleFwiIGluIGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgIGluZGV4ZWQucHVzaChsaXN0ZW5lcnNbaV0uekluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLnpJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWVbbGlzdGVuZXJzW2ldLnpJbmRleF0gPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXhlZC5zb3J0KG51bXNvcnQpO1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4ZWRbel0gPCAwKSB7XG4gICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbeisrXV07XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbCA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoXCJ6SW5kZXhcIiBpbiBsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsLnpJbmRleCA9PSBpbmRleGVkW3pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHorKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6XV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCAmJiBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAobClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlW2wuekluZGV4XSA9IGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IGNlO1xuICAgICAgICAgICAgcmV0dXJuIG91dC5sZW5ndGggPyBvdXQgOiBudWxsO1xuICAgICAgICB9O1xuXHRcdC8vIFVuZG9jdW1lbnRlZC4gRGVidWcgb25seS5cblx0XHRldmUuX2V2ZW50cyA9IGV2ZW50cztcbiAgICAvKlxcXG4gICAgICogZXZlLmxpc3RlbmVyc1xuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBJbnRlcm5hbCBtZXRob2Qgd2hpY2ggZ2l2ZXMgeW91IGFycmF5IG9mIGFsbCBldmVudCBoYW5kbGVycyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBgbmFtZWAuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcblxuICAgICA9IChhcnJheSkgYXJyYXkgb2YgZXZlbnQgaGFuZGxlcnNcbiAgICBcXCovXG4gICAgZXZlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgIGUgPSBldmVudHMsXG4gICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgaXRlbXMsXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGlpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGpqLFxuICAgICAgICAgICAgbmVzLFxuICAgICAgICAgICAgZXMgPSBbZV0sXG4gICAgICAgICAgICBvdXQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBuZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZXMubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIGUgPSBlc1tqXS5uO1xuICAgICAgICAgICAgICAgIGl0ZW1zID0gW2VbbmFtZXNbaV1dLCBlW3dpbGRjYXJkXV07XG4gICAgICAgICAgICAgICAgayA9IDI7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGstLSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbXNba107XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dCA9IG91dC5jb25jYXQoaXRlbS5mIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVzID0gbmVzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBcbiAgICAvKlxcXG4gICAgICogZXZlLm9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCaW5kcyBnaXZlbiBldmVudCBoYW5kbGVyIHdpdGggYSBnaXZlbiBuYW1lLiBZb3UgY2FuIHVzZSB3aWxkY2FyZHMg4oCcYCpg4oCdIGZvciB0aGUgbmFtZXM6XG4gICAgIHwgZXZlLm9uKFwiKi51bmRlci4qXCIsIGYpO1xuICAgICB8IGV2ZShcIm1vdXNlLnVuZGVyLmZsb29yXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgICogVXNlIEBldmUgdG8gdHJpZ2dlciB0aGUgbGlzdGVuZXIuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgICAqKlxuICAgICA9IChmdW5jdGlvbikgcmV0dXJuZWQgZnVuY3Rpb24gYWNjZXB0cyBhIHNpbmdsZSBudW1lcmljIHBhcmFtZXRlciB0aGF0IHJlcHJlc2VudHMgei1pbmRleCBvZiB0aGUgaGFuZGxlci4gSXQgaXMgYW4gb3B0aW9uYWwgZmVhdHVyZSBhbmQgb25seSB1c2VkIHdoZW4geW91IG5lZWQgdG8gZW5zdXJlIHRoYXQgc29tZSBzdWJzZXQgb2YgaGFuZGxlcnMgd2lsbCBiZSBpbnZva2VkIGluIGEgZ2l2ZW4gb3JkZXIsIGRlc3BpdGUgb2YgdGhlIG9yZGVyIG9mIGFzc2lnbm1lbnQuIFxuICAgICA+IEV4YW1wbGU6XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgZWF0SXQpKDIpO1xuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIHNjcmVhbSk7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgY2F0Y2hJdCkoMSk7XG4gICAgICogVGhpcyB3aWxsIGVuc3VyZSB0aGF0IGBjYXRjaEl0KClgIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSBgZWF0SXQoKWAuXG5cdCAqXG4gICAgICogSWYgeW91IHdhbnQgdG8gcHV0IHlvdXIgaGFuZGxlciBiZWZvcmUgbm9uLWluZGV4ZWQgaGFuZGxlcnMsIHNwZWNpZnkgYSBuZWdhdGl2ZSB2YWx1ZS5cbiAgICAgKiBOb3RlOiBJIGFzc3VtZSBtb3N0IG9mIHRoZSB0aW1lIHlvdSBkb27igJl0IG5lZWQgdG8gd29ycnkgYWJvdXQgei1pbmRleCwgYnV0IGl04oCZcyBuaWNlIHRvIGhhdmUgdGhpcyBmZWF0dXJlIOKAnGp1c3QgaW4gY2FzZeKAnS5cbiAgICBcXCovXG4gICAgZXZlLm9uID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcblx0XHRuYW1lID0gU3RyaW5nKG5hbWUpO1xuXHRcdGlmICh0eXBlb2YgZiAhPSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbiAoKSB7fTtcblx0XHR9XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgIGUgPSBldmVudHM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICBlID0gZS5oYXNPd25Qcm9wZXJ0eShuYW1lc1tpXSkgJiYgZVtuYW1lc1tpXV0gfHwgKGVbbmFtZXNbaV1dID0ge246IHt9fSk7XG4gICAgICAgIH1cbiAgICAgICAgZS5mID0gZS5mIHx8IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGUuZi5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoZS5mW2ldID09IGYpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW47XG4gICAgICAgIH1cbiAgICAgICAgZS5mLnB1c2goZik7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoekluZGV4KSB7XG4gICAgICAgICAgICBpZiAoK3pJbmRleCA9PSArekluZGV4KSB7XG4gICAgICAgICAgICAgICAgZi56SW5kZXggPSArekluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5mXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIGdpdmVuIGV2ZW50IHdpdGggb3B0aW9uYWwgYXJndW1lbnRzLlxuXHQgKiBBcmd1bWVudHMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgcmVzdWx0IGZ1bmN0aW9uIHdpbGwgYmUgYWxzb1xuXHQgKiBjb25jYXRlZCB0byB0aGUgbGlzdCBvZiBmaW5hbCBhcmd1bWVudHMuXG4gXHQgfCBlbC5vbmNsaWNrID0gZXZlLmYoXCJjbGlja1wiLCAxLCAyKTtcbiBcdCB8IGV2ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gXHQgfCAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7IC8vIDEsIDIsIFtldmVudCBvYmplY3RdXG4gXHQgfCB9KTtcbiAgICAgPiBBcmd1bWVudHNcblx0IC0gZXZlbnQgKHN0cmluZykgZXZlbnQgbmFtZVxuXHQgLSB2YXJhcmdzICjigKYpIGFuZCBhbnkgb3RoZXIgYXJndW1lbnRzXG5cdCA9IChmdW5jdGlvbikgcG9zc2libGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgIFxcKi9cblx0ZXZlLmYgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHR2YXIgYXR0cnMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRcdGV2ZS5hcHBseShudWxsLCBbZXZlbnQsIG51bGxdLmNvbmNhdChhdHRycykuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpO1xuXHRcdH07XG5cdH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5zdG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJcyB1c2VkIGluc2lkZSBhbiBldmVudCBoYW5kbGVyIHRvIHN0b3AgdGhlIGV2ZW50LCBwcmV2ZW50aW5nIGFueSBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGZpcmluZy5cbiAgICBcXCovXG4gICAgZXZlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0b3AgPSAxO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5udFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBzdWJuYW1lIChzdHJpbmcpICNvcHRpb25hbCBzdWJuYW1lIG9mIHRoZSBldmVudFxuICAgICAqKlxuICAgICA9IChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBpZiBgc3VibmFtZWAgaXMgbm90IHNwZWNpZmllZFxuICAgICAqIG9yXG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCwgaWYgY3VycmVudCBldmVudOKAmXMgbmFtZSBjb250YWlucyBgc3VibmFtZWBcbiAgICBcXCovXG4gICAgZXZlLm50ID0gZnVuY3Rpb24gKHN1Ym5hbWUpIHtcbiAgICAgICAgaWYgKHN1Ym5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFwiKD86XFxcXC58XFxcXC98XilcIiArIHN1Ym5hbWUgKyBcIig/OlxcXFwufFxcXFwvfCQpXCIpLnRlc3QoY3VycmVudF9ldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnJlbnRfZXZlbnQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50c1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgKipcbiAgICAgPSAoYXJyYXkpIG5hbWVzIG9mIHRoZSBldmVudFxuICAgIFxcKi9cbiAgICBldmUubnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudF9ldmVudC5zcGxpdChzZXBhcmF0b3IpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vZmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZ2l2ZW4gZnVuY3Rpb24gZnJvbSB0aGUgbGlzdCBvZiBldmVudCBsaXN0ZW5lcnMgYXNzaWduZWQgdG8gZ2l2ZW4gbmFtZS5cblx0ICogSWYgbm8gYXJndW1lbnRzIHNwZWNpZmllZCBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIGNsZWFyZWQuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogZXZlLnVuYmluZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBldmUub2ZmXG4gICAgXFwqL1xuICAgIGV2ZS5vZmYgPSBldmUudW5iaW5kID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcblx0XHRpZiAoIW5hbWUpIHtcblx0XHQgICAgZXZlLl9ldmVudHMgPSBldmVudHMgPSB7bjoge319O1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHNwbGljZSxcbiAgICAgICAgICAgIGksIGlpLCBqLCBqaixcbiAgICAgICAgICAgIGN1ciA9IFtldmVudHNdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBjdXIubGVuZ3RoOyBqICs9IHNwbGljZS5sZW5ndGggLSAyKSB7XG4gICAgICAgICAgICAgICAgc3BsaWNlID0gW2osIDFdO1xuICAgICAgICAgICAgICAgIGUgPSBjdXJbal0ubjtcbiAgICAgICAgICAgICAgICBpZiAobmFtZXNbaV0gIT0gd2lsZGNhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVbbmFtZXNbaV1dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW25hbWVzW2ldXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlKSBpZiAoZVtoYXNdKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGljZS5wdXNoKGVba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VyLnNwbGljZS5hcHBseShjdXIsIHNwbGljZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBjdXIubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZSA9IGN1cltpXTtcbiAgICAgICAgICAgIHdoaWxlIChlLm4pIHtcbiAgICAgICAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGUuZi5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZS5mW2pdID09IGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmYuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIWUuZi5sZW5ndGggJiYgZGVsZXRlIGUuZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmdW5jcyA9IGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGZ1bmNzLmxlbmd0aDsgaiA8IGpqOyBqKyspIGlmIChmdW5jc1tqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Muc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIWZ1bmNzLmxlbmd0aCAmJiBkZWxldGUgZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUubikgaWYgKGUubltoYXNdKGtleSkgJiYgZS5uW2tleV0uZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZSA9IGUubjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vbmNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCaW5kcyBnaXZlbiBldmVudCBoYW5kbGVyIHdpdGggYSBnaXZlbiBuYW1lIHRvIG9ubHkgcnVuIG9uY2UgdGhlbiB1bmJpbmQgaXRzZWxmLlxuICAgICB8IGV2ZS5vbmNlKFwibG9naW5cIiwgZik7XG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIHRyaWdnZXJzIGZcbiAgICAgfCBldmUoXCJsb2dpblwiKTsgLy8gbm8gbGlzdGVuZXJzXG4gICAgICogVXNlIEBldmUgdG8gdHJpZ2dlciB0aGUgbGlzdGVuZXIuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgICAqKlxuICAgICA9IChmdW5jdGlvbikgc2FtZSByZXR1cm4gZnVuY3Rpb24gYXMgQGV2ZS5vblxuICAgIFxcKi9cbiAgICBldmUub25jZSA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG4gICAgICAgIHZhciBmMiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV2ZS51bmJpbmQobmFtZSwgZjIpO1xuICAgICAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGV2ZS5vbihuYW1lLCBmMik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLnZlcnNpb25cbiAgICAgWyBwcm9wZXJ0eSAoc3RyaW5nKSBdXG4gICAgICoqXG4gICAgICogQ3VycmVudCB2ZXJzaW9uIG9mIHRoZSBsaWJyYXJ5LlxuICAgIFxcKi9cbiAgICBldmUudmVyc2lvbiA9IHZlcnNpb247XG4gICAgZXZlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJZb3UgYXJlIHJ1bm5pbmcgRXZlIFwiICsgdmVyc2lvbjtcbiAgICB9O1xuICAgICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpID8gKG1vZHVsZS5leHBvcnRzID0gZXZlKSA6ICh0eXBlb2YgZGVmaW5lICE9IFwidW5kZWZpbmVkXCIgPyAoZGVmaW5lKFwiZXZlXCIsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIGV2ZTsgfSkpIDogKGdsb2IuZXZlID0gZXZlKSk7XG59KSh3aW5kb3cgfHwgdGhpcyk7XG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIFwiUmFwaGHDq2wgMi4xLjJcIiAtIEphdmFTY3JpcHQgVmVjdG9yIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTEgRG1pdHJ5IEJhcmFub3Zza2l5IChodHRwOi8vcmFwaGFlbGpzLmNvbSkgICDilIIgXFxcXFxuLy8g4pSCIENvcHlyaWdodCAoYykgMjAwOC0yMDExIFNlbmNoYSBMYWJzIChodHRwOi8vc2VuY2hhLmNvbSkgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUgiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIChodHRwOi8vcmFwaGFlbGpzLmNvbS9saWNlbnNlLmh0bWwpIGxpY2Vuc2UuIOKUgiBcXFxcXG4vLyDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggXFxcXFxuXG4oZnVuY3Rpb24gKGdsb2IsIGZhY3RvcnkpIHtcbiAgICAvLyBBTUQgc3VwcG9ydFxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBEZWZpbmUgYXMgYW4gYW5vbnltb3VzIG1vZHVsZVxuICAgICAgICBkZWZpbmUoW1wiZXZlXCJdLCBmdW5jdGlvbiggZXZlICkge1xuICAgICAgICAgICAgcmV0dXJuIGZhY3RvcnkoZ2xvYiwgZXZlKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQnJvd3NlciBnbG9iYWxzIChnbG9iIGlzIHdpbmRvdylcbiAgICAgICAgLy8gUmFwaGFlbCBhZGRzIGl0c2VsZiB0byB3aW5kb3dcbiAgICAgICAgZmFjdG9yeShnbG9iLCBnbG9iLmV2ZSB8fCAodHlwZW9mIHJlcXVpcmUgPT0gXCJmdW5jdGlvblwiICYmIHJlcXVpcmUoJ2V2ZScpKSApO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKHdpbmRvdywgZXZlKSB7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBjYW52YXMgb2JqZWN0IG9uIHdoaWNoIHRvIGRyYXcuXG4gICAgICogWW91IG11c3QgZG8gdGhpcyBmaXJzdCwgYXMgYWxsIGZ1dHVyZSBjYWxscyB0byBkcmF3aW5nIG1ldGhvZHNcbiAgICAgKiBmcm9tIHRoaXMgaW5zdGFuY2Ugd2lsbCBiZSBib3VuZCB0byB0aGlzIGNhbnZhcy5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gY29udGFpbmVyIChIVE1MRWxlbWVudHxzdHJpbmcpIERPTSBlbGVtZW50IG9yIGl0cyBJRCB3aGljaCBpcyBnb2luZyB0byBiZSBhIHBhcmVudCBmb3IgZHJhd2luZyBzdXJmYWNlXG4gICAgIC0gd2lkdGggKG51bWJlcilcbiAgICAgLSBoZWlnaHQgKG51bWJlcilcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB3aGljaCBpcyBnb2luZyB0byBiZSBleGVjdXRlZCBpbiB0aGUgY29udGV4dCBvZiBuZXdseSBjcmVhdGVkIHBhcGVyXG4gICAgICogb3JcbiAgICAgLSB4IChudW1iZXIpXG4gICAgIC0geSAobnVtYmVyKVxuICAgICAtIHdpZHRoIChudW1iZXIpXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gd2hpY2ggaXMgZ29pbmcgdG8gYmUgZXhlY3V0ZWQgaW4gdGhlIGNvbnRleHQgb2YgbmV3bHkgY3JlYXRlZCBwYXBlclxuICAgICAqIG9yXG4gICAgIC0gYWxsIChhcnJheSkgKGZpcnN0IDMgb3IgNCBlbGVtZW50cyBpbiB0aGUgYXJyYXkgYXJlIGVxdWFsIHRvIFtjb250YWluZXJJRCwgd2lkdGgsIGhlaWdodF0gb3IgW3gsIHksIHdpZHRoLCBoZWlnaHRdLiBUaGUgcmVzdCBhcmUgZWxlbWVudCBkZXNjcmlwdGlvbnMgaW4gZm9ybWF0IHt0eXBlOiB0eXBlLCA8YXR0cmlidXRlcz59KS4gU2VlIEBQYXBlci5hZGQuXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gd2hpY2ggaXMgZ29pbmcgdG8gYmUgZXhlY3V0ZWQgaW4gdGhlIGNvbnRleHQgb2YgbmV3bHkgY3JlYXRlZCBwYXBlclxuICAgICAqIG9yXG4gICAgIC0gb25SZWFkeUNhbGxiYWNrIChmdW5jdGlvbikgZnVuY3Rpb24gdGhhdCBpcyBnb2luZyB0byBiZSBjYWxsZWQgb24gRE9NIHJlYWR5IGV2ZW50LiBZb3UgY2FuIGFsc28gc3Vic2NyaWJlIHRvIHRoaXMgZXZlbnQgdmlhIEV2ZeKAmXMg4oCcRE9NTG9hZOKAnSBldmVudC4gSW4gdGhpcyBjYXNlIG1ldGhvZCByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgICA9IChvYmplY3QpIEBQYXBlclxuICAgICA+IFVzYWdlXG4gICAgIHwgLy8gRWFjaCBvZiB0aGUgZm9sbG93aW5nIGV4YW1wbGVzIGNyZWF0ZSBhIGNhbnZhc1xuICAgICB8IC8vIHRoYXQgaXMgMzIwcHggd2lkZSBieSAyMDBweCBoaWdoLlxuICAgICB8IC8vIENhbnZhcyBpcyBjcmVhdGVkIGF0IHRoZSB2aWV3cG9ydOKAmXMgMTAsNTAgY29vcmRpbmF0ZS5cbiAgICAgfCB2YXIgcGFwZXIgPSBSYXBoYWVsKDEwLCA1MCwgMzIwLCAyMDApO1xuICAgICB8IC8vIENhbnZhcyBpcyBjcmVhdGVkIGF0IHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgdGhlICNub3RlcGFkIGVsZW1lbnRcbiAgICAgfCAvLyAob3IgaXRzIHRvcCByaWdodCBjb3JuZXIgaW4gZGlyPVwicnRsXCIgZWxlbWVudHMpXG4gICAgIHwgdmFyIHBhcGVyID0gUmFwaGFlbChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vdGVwYWRcIiksIDMyMCwgMjAwKTtcbiAgICAgfCAvLyBTYW1lIGFzIGFib3ZlXG4gICAgIHwgdmFyIHBhcGVyID0gUmFwaGFlbChcIm5vdGVwYWRcIiwgMzIwLCAyMDApO1xuICAgICB8IC8vIEltYWdlIGR1bXBcbiAgICAgfCB2YXIgc2V0ID0gUmFwaGFlbChbXCJub3RlcGFkXCIsIDMyMCwgMjAwLCB7XG4gICAgIHwgICAgIHR5cGU6IFwicmVjdFwiLFxuICAgICB8ICAgICB4OiAxMCxcbiAgICAgfCAgICAgeTogMTAsXG4gICAgIHwgICAgIHdpZHRoOiAyNSxcbiAgICAgfCAgICAgaGVpZ2h0OiAyNSxcbiAgICAgfCAgICAgc3Ryb2tlOiBcIiNmMDBcIlxuICAgICB8IH0sIHtcbiAgICAgfCAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgIHwgICAgIHg6IDMwLFxuICAgICB8ICAgICB5OiA0MCxcbiAgICAgfCAgICAgdGV4dDogXCJEdW1wXCJcbiAgICAgfCB9XSk7XG4gICAgXFwqL1xuICAgIGZ1bmN0aW9uIFIoZmlyc3QpIHtcbiAgICAgICAgaWYgKFIuaXMoZmlyc3QsIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2FkZWQgPyBmaXJzdCgpIDogZXZlLm9uKFwicmFwaGFlbC5ET01sb2FkXCIsIGZpcnN0KTtcbiAgICAgICAgfSBlbHNlIGlmIChSLmlzKGZpcnN0LCBhcnJheSkpIHtcbiAgICAgICAgICAgIHJldHVybiBSLl9lbmdpbmUuY3JlYXRlW2FwcGx5XShSLCBmaXJzdC5zcGxpY2UoMCwgMyArIFIuaXMoZmlyc3RbMF0sIG51KSkpLmFkZChmaXJzdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgICAgICBpZiAoUi5pcyhhcmdzW2FyZ3MubGVuZ3RoIC0gMV0sIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgICB2YXIgZiA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRlZCA/IGYuY2FsbChSLl9lbmdpbmUuY3JlYXRlW2FwcGx5XShSLCBhcmdzKSkgOiBldmUub24oXCJyYXBoYWVsLkRPTWxvYWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBmLmNhbGwoUi5fZW5naW5lLmNyZWF0ZVthcHBseV0oUiwgYXJncykpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUi5fZW5naW5lLmNyZWF0ZVthcHBseV0oUiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBSLnZlcnNpb24gPSBcIjIuMS4yXCI7XG4gICAgUi5ldmUgPSBldmU7XG4gICAgdmFyIGxvYWRlZCxcbiAgICAgICAgc2VwYXJhdG9yID0gL1ssIF0rLyxcbiAgICAgICAgZWxlbWVudHMgPSB7Y2lyY2xlOiAxLCByZWN0OiAxLCBwYXRoOiAxLCBlbGxpcHNlOiAxLCB0ZXh0OiAxLCBpbWFnZTogMX0sXG4gICAgICAgIGZvcm1hdHJnID0gL1xceyhcXGQrKVxcfS9nLFxuICAgICAgICBwcm90byA9IFwicHJvdG90eXBlXCIsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgZyA9IHtcbiAgICAgICAgICAgIGRvYzogZG9jdW1lbnQsXG4gICAgICAgICAgICB3aW46IHdpbmRvd1xuICAgICAgICB9LFxuICAgICAgICBvbGRSYXBoYWVsID0ge1xuICAgICAgICAgICAgd2FzOiBPYmplY3QucHJvdG90eXBlW2hhc10uY2FsbChnLndpbiwgXCJSYXBoYWVsXCIpLFxuICAgICAgICAgICAgaXM6IGcud2luLlJhcGhhZWxcbiAgICAgICAgfSxcbiAgICAgICAgUGFwZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKlxcXG4gICAgICAgICAgICAgKiBQYXBlci5jYVxuICAgICAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgICAgICoqXG4gICAgICAgICAgICAgKiBTaG9ydGN1dCBmb3IgQFBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNcbiAgICAgICAgICAgIFxcKi9cbiAgICAgICAgICAgIC8qXFxcbiAgICAgICAgICAgICAqIFBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNcbiAgICAgICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICAgICAqKlxuICAgICAgICAgICAgICogSWYgeW91IGhhdmUgYSBzZXQgb2YgYXR0cmlidXRlcyB0aGF0IHlvdSB3b3VsZCBsaWtlIHRvIHJlcHJlc2VudFxuICAgICAgICAgICAgICogYXMgYSBmdW5jdGlvbiBvZiBzb21lIG51bWJlciB5b3UgY2FuIGRvIGl0IGVhc2lseSB3aXRoIGN1c3RvbSBhdHRyaWJ1dGVzOlxuICAgICAgICAgICAgID4gVXNhZ2VcbiAgICAgICAgICAgICB8IHBhcGVyLmN1c3RvbUF0dHJpYnV0ZXMuaHVlID0gZnVuY3Rpb24gKG51bSkge1xuICAgICAgICAgICAgIHwgICAgIG51bSA9IG51bSAlIDE7XG4gICAgICAgICAgICAgfCAgICAgcmV0dXJuIHtmaWxsOiBcImhzYihcIiArIG51bSArIFwiLCAwLjc1LCAxKVwifTtcbiAgICAgICAgICAgICB8IH07XG4gICAgICAgICAgICAgfCAvLyBDdXN0b20gYXR0cmlidXRlIOKAnGh1ZeKAnSB3aWxsIGNoYW5nZSBmaWxsXG4gICAgICAgICAgICAgfCAvLyB0byBiZSBnaXZlbiBodWUgd2l0aCBmaXhlZCBzYXR1cmF0aW9uIGFuZCBicmlnaHRuZXNzLlxuICAgICAgICAgICAgIHwgLy8gTm93IHlvdSBjYW4gdXNlIGl0IGxpa2UgdGhpczpcbiAgICAgICAgICAgICB8IHZhciBjID0gcGFwZXIuY2lyY2xlKDEwLCAxMCwgMTApLmF0dHIoe2h1ZTogLjQ1fSk7XG4gICAgICAgICAgICAgfCAvLyBvciBldmVuIGxpa2UgdGhpczpcbiAgICAgICAgICAgICB8IGMuYW5pbWF0ZSh7aHVlOiAxfSwgMWUzKTtcbiAgICAgICAgICAgICB8XG4gICAgICAgICAgICAgfCAvLyBZb3UgY291bGQgYWxzbyBjcmVhdGUgY3VzdG9tIGF0dHJpYnV0ZVxuICAgICAgICAgICAgIHwgLy8gd2l0aCBtdWx0aXBsZSBwYXJhbWV0ZXJzOlxuICAgICAgICAgICAgIHwgcGFwZXIuY3VzdG9tQXR0cmlidXRlcy5oc2IgPSBmdW5jdGlvbiAoaCwgcywgYikge1xuICAgICAgICAgICAgIHwgICAgIHJldHVybiB7ZmlsbDogXCJoc2IoXCIgKyBbaCwgcywgYl0uam9pbihcIixcIikgKyBcIilcIn07XG4gICAgICAgICAgICAgfCB9O1xuICAgICAgICAgICAgIHwgYy5hdHRyKHtoc2I6IFwiMC41IC44IDFcIn0pO1xuICAgICAgICAgICAgIHwgYy5hbmltYXRlKHtoc2I6IFsxLCAwLCAwLjVdfSwgMWUzKTtcbiAgICAgICAgICAgIFxcKi9cbiAgICAgICAgICAgIHRoaXMuY2EgPSB0aGlzLmN1c3RvbUF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgfSxcbiAgICAgICAgcGFwZXJwcm90byxcbiAgICAgICAgYXBwZW5kQ2hpbGQgPSBcImFwcGVuZENoaWxkXCIsXG4gICAgICAgIGFwcGx5ID0gXCJhcHBseVwiLFxuICAgICAgICBjb25jYXQgPSBcImNvbmNhdFwiLFxuICAgICAgICBzdXBwb3J0c1RvdWNoID0gKCdvbnRvdWNoc3RhcnQnIGluIGcud2luKSB8fCBnLndpbi5Eb2N1bWVudFRvdWNoICYmIGcuZG9jIGluc3RhbmNlb2YgRG9jdW1lbnRUb3VjaCwgLy90YWtlbiBmcm9tIE1vZGVybml6ciB0b3VjaCB0ZXN0XG4gICAgICAgIEUgPSBcIlwiLFxuICAgICAgICBTID0gXCIgXCIsXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgc3BsaXQgPSBcInNwbGl0XCIsXG4gICAgICAgIGV2ZW50cyA9IFwiY2xpY2sgZGJsY2xpY2sgbW91c2Vkb3duIG1vdXNlbW92ZSBtb3VzZW91dCBtb3VzZW92ZXIgbW91c2V1cCB0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbFwiW3NwbGl0XShTKSxcbiAgICAgICAgdG91Y2hNYXAgPSB7XG4gICAgICAgICAgICBtb3VzZWRvd246IFwidG91Y2hzdGFydFwiLFxuICAgICAgICAgICAgbW91c2Vtb3ZlOiBcInRvdWNobW92ZVwiLFxuICAgICAgICAgICAgbW91c2V1cDogXCJ0b3VjaGVuZFwiXG4gICAgICAgIH0sXG4gICAgICAgIGxvd2VyQ2FzZSA9IFN0ci5wcm90b3R5cGUudG9Mb3dlckNhc2UsXG4gICAgICAgIG1hdGggPSBNYXRoLFxuICAgICAgICBtbWF4ID0gbWF0aC5tYXgsXG4gICAgICAgIG1taW4gPSBtYXRoLm1pbixcbiAgICAgICAgYWJzID0gbWF0aC5hYnMsXG4gICAgICAgIHBvdyA9IG1hdGgucG93LFxuICAgICAgICBQSSA9IG1hdGguUEksXG4gICAgICAgIG51ID0gXCJudW1iZXJcIixcbiAgICAgICAgc3RyaW5nID0gXCJzdHJpbmdcIixcbiAgICAgICAgYXJyYXkgPSBcImFycmF5XCIsXG4gICAgICAgIHRvU3RyaW5nID0gXCJ0b1N0cmluZ1wiLFxuICAgICAgICBmaWxsU3RyaW5nID0gXCJmaWxsXCIsXG4gICAgICAgIG9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgcGFwZXIgPSB7fSxcbiAgICAgICAgcHVzaCA9IFwicHVzaFwiLFxuICAgICAgICBJU1VSTCA9IFIuX0lTVVJMID0gL151cmxcXChbJ1wiXT8oLis/KVsnXCJdP1xcKSQvaSxcbiAgICAgICAgY29sb3VyUmVnRXhwID0gL15cXHMqKCgjW2EtZlxcZF17Nn0pfCgjW2EtZlxcZF17M30pfHJnYmE/XFwoXFxzKihbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rJT8oPzpcXHMqLFxccypbXFxkXFwuXSslPyk/KVxccypcXCl8aHNiYT9cXChcXHMqKFtcXGRcXC5dKyg/OmRlZ3xcXHhiMHwlKT9cXHMqLFxccypbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyg/OiU/XFxzKixcXHMqW1xcZFxcLl0rKT8pJT9cXHMqXFwpfGhzbGE/XFwoXFxzKihbXFxkXFwuXSsoPzpkZWd8XFx4YjB8JSk/XFxzKixcXHMqW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSsoPzolP1xccyosXFxzKltcXGRcXC5dKyk/KSU/XFxzKlxcKSlcXHMqJC9pLFxuICAgICAgICBpc25hbiA9IHtcIk5hTlwiOiAxLCBcIkluZmluaXR5XCI6IDEsIFwiLUluZmluaXR5XCI6IDF9LFxuICAgICAgICBiZXppZXJyZyA9IC9eKD86Y3ViaWMtKT9iZXppZXJcXCgoW14sXSspLChbXixdKyksKFteLF0rKSwoW15cXCldKylcXCkvLFxuICAgICAgICByb3VuZCA9IG1hdGgucm91bmQsXG4gICAgICAgIHNldEF0dHJpYnV0ZSA9IFwic2V0QXR0cmlidXRlXCIsXG4gICAgICAgIHRvRmxvYXQgPSBwYXJzZUZsb2F0LFxuICAgICAgICB0b0ludCA9IHBhcnNlSW50LFxuICAgICAgICB1cHBlckNhc2UgPSBTdHIucHJvdG90eXBlLnRvVXBwZXJDYXNlLFxuICAgICAgICBhdmFpbGFibGVBdHRycyA9IFIuX2F2YWlsYWJsZUF0dHJzID0ge1xuICAgICAgICAgICAgXCJhcnJvdy1lbmRcIjogXCJub25lXCIsXG4gICAgICAgICAgICBcImFycm93LXN0YXJ0XCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgYmx1cjogMCxcbiAgICAgICAgICAgIFwiY2xpcC1yZWN0XCI6IFwiMCAwIDFlOSAxZTlcIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJkZWZhdWx0XCIsXG4gICAgICAgICAgICBjeDogMCxcbiAgICAgICAgICAgIGN5OiAwLFxuICAgICAgICAgICAgZmlsbDogXCIjZmZmXCIsXG4gICAgICAgICAgICBcImZpbGwtb3BhY2l0eVwiOiAxLFxuICAgICAgICAgICAgZm9udDogJzEwcHggXCJBcmlhbFwiJyxcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogJ1wiQXJpYWxcIicsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjEwXCIsXG4gICAgICAgICAgICBcImZvbnQtc3R5bGVcIjogXCJub3JtYWxcIixcbiAgICAgICAgICAgIFwiZm9udC13ZWlnaHRcIjogNDAwLFxuICAgICAgICAgICAgZ3JhZGllbnQ6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgICBocmVmOiBcImh0dHA6Ly9yYXBoYWVsanMuY29tL1wiLFxuICAgICAgICAgICAgXCJsZXR0ZXItc3BhY2luZ1wiOiAwLFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIHBhdGg6IFwiTTAsMFwiLFxuICAgICAgICAgICAgcjogMCxcbiAgICAgICAgICAgIHJ4OiAwLFxuICAgICAgICAgICAgcnk6IDAsXG4gICAgICAgICAgICBzcmM6IFwiXCIsXG4gICAgICAgICAgICBzdHJva2U6IFwiIzAwMFwiLFxuICAgICAgICAgICAgXCJzdHJva2UtZGFzaGFycmF5XCI6IFwiXCIsXG4gICAgICAgICAgICBcInN0cm9rZS1saW5lY2FwXCI6IFwiYnV0dFwiLFxuICAgICAgICAgICAgXCJzdHJva2UtbGluZWpvaW5cIjogXCJidXR0XCIsXG4gICAgICAgICAgICBcInN0cm9rZS1taXRlcmxpbWl0XCI6IDAsXG4gICAgICAgICAgICBcInN0cm9rZS1vcGFjaXR5XCI6IDEsXG4gICAgICAgICAgICBcInN0cm9rZS13aWR0aFwiOiAxLFxuICAgICAgICAgICAgdGFyZ2V0OiBcIl9ibGFua1wiLFxuICAgICAgICAgICAgXCJ0ZXh0LWFuY2hvclwiOiBcIm1pZGRsZVwiLFxuICAgICAgICAgICAgdGl0bGU6IFwiUmFwaGFlbFwiLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcIlwiLFxuICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgeTogMFxuICAgICAgICB9LFxuICAgICAgICBhdmFpbGFibGVBbmltQXR0cnMgPSBSLl9hdmFpbGFibGVBbmltQXR0cnMgPSB7XG4gICAgICAgICAgICBibHVyOiBudSxcbiAgICAgICAgICAgIFwiY2xpcC1yZWN0XCI6IFwiY3N2XCIsXG4gICAgICAgICAgICBjeDogbnUsXG4gICAgICAgICAgICBjeTogbnUsXG4gICAgICAgICAgICBmaWxsOiBcImNvbG91clwiLFxuICAgICAgICAgICAgXCJmaWxsLW9wYWNpdHlcIjogbnUsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBudSxcbiAgICAgICAgICAgIGhlaWdodDogbnUsXG4gICAgICAgICAgICBvcGFjaXR5OiBudSxcbiAgICAgICAgICAgIHBhdGg6IFwicGF0aFwiLFxuICAgICAgICAgICAgcjogbnUsXG4gICAgICAgICAgICByeDogbnUsXG4gICAgICAgICAgICByeTogbnUsXG4gICAgICAgICAgICBzdHJva2U6IFwiY29sb3VyXCIsXG4gICAgICAgICAgICBcInN0cm9rZS1vcGFjaXR5XCI6IG51LFxuICAgICAgICAgICAgXCJzdHJva2Utd2lkdGhcIjogbnUsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNmb3JtXCIsXG4gICAgICAgICAgICB3aWR0aDogbnUsXG4gICAgICAgICAgICB4OiBudSxcbiAgICAgICAgICAgIHk6IG51XG4gICAgICAgIH0sXG4gICAgICAgIHdoaXRlc3BhY2UgPSAvW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XS9nLFxuICAgICAgICBjb21tYVNwYWNlcyA9IC9bXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKixbXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKi8sXG4gICAgICAgIGhzcmcgPSB7aHM6IDEsIHJnOiAxfSxcbiAgICAgICAgcDJzID0gLyw/KFthY2hsbXFyc3R2eHpdKSw/L2dpLFxuICAgICAgICBwYXRoQ29tbWFuZCA9IC8oW2FjaGxtcnFzdHZ6XSlbXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjksXSooKC0/XFxkKlxcLj9cXGQqKD86ZVtcXC0rXT9cXGQrKT9bXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKiw/W1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSopKykvaWcsXG4gICAgICAgIHRDb21tYW5kID0gLyhbcnN0bV0pW1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5LF0qKCgtP1xcZCpcXC4/XFxkKig/OmVbXFwtK10/XFxkKyk/W1xceDA5XFx4MGFcXHgwYlxceDBjXFx4MGRcXHgyMFxceGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdTIwMjhcXHUyMDI5XSosP1tcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qKSspL2lnLFxuICAgICAgICBwYXRoVmFsdWVzID0gLygtP1xcZCpcXC4/XFxkKig/OmVbXFwtK10/XFxkKyk/KVtcXHgwOVxceDBhXFx4MGJcXHgwY1xceDBkXFx4MjBcXHhhMFxcdTE2ODBcXHUxODBlXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwM1xcdTIwMDRcXHUyMDA1XFx1MjAwNlxcdTIwMDdcXHUyMDA4XFx1MjAwOVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHUyMDI4XFx1MjAyOV0qLD9bXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKi9pZyxcbiAgICAgICAgcmFkaWFsX2dyYWRpZW50ID0gUi5fcmFkaWFsX2dyYWRpZW50ID0gL15yKD86XFwoKFteLF0rPylbXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKixbXFx4MDlcXHgwYVxceDBiXFx4MGNcXHgwZFxceDIwXFx4YTBcXHUxNjgwXFx1MTgwZVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1MjAyOFxcdTIwMjldKihbXlxcKV0rPylcXCkpPy8sXG4gICAgICAgIGVsZGF0YSA9IHt9LFxuICAgICAgICBzb3J0QnlLZXkgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEua2V5IC0gYi5rZXk7XG4gICAgICAgIH0sXG4gICAgICAgIHNvcnRCeU51bWJlciA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9GbG9hdChhKSAtIHRvRmxvYXQoYik7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1biA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBwaXBlID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9LFxuICAgICAgICByZWN0UGF0aCA9IFIuX3JlY3RQYXRoID0gZnVuY3Rpb24gKHgsIHksIHcsIGgsIHIpIHtcbiAgICAgICAgICAgIGlmIChyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtbXCJNXCIsIHggKyByLCB5XSwgW1wibFwiLCB3IC0gciAqIDIsIDBdLCBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIHIsIHJdLCBbXCJsXCIsIDAsIGggLSByICogMl0sIFtcImFcIiwgciwgciwgMCwgMCwgMSwgLXIsIHJdLCBbXCJsXCIsIHIgKiAyIC0gdywgMF0sIFtcImFcIiwgciwgciwgMCwgMCwgMSwgLXIsIC1yXSwgW1wibFwiLCAwLCByICogMiAtIGhdLCBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIHIsIC1yXSwgW1wielwiXV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW1tcIk1cIiwgeCwgeV0sIFtcImxcIiwgdywgMF0sIFtcImxcIiwgMCwgaF0sIFtcImxcIiwgLXcsIDBdLCBbXCJ6XCJdXTtcbiAgICAgICAgfSxcbiAgICAgICAgZWxsaXBzZVBhdGggPSBmdW5jdGlvbiAoeCwgeSwgcngsIHJ5KSB7XG4gICAgICAgICAgICBpZiAocnkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJ5ID0gcng7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW1tcIk1cIiwgeCwgeV0sIFtcIm1cIiwgMCwgLXJ5XSwgW1wiYVwiLCByeCwgcnksIDAsIDEsIDEsIDAsIDIgKiByeV0sIFtcImFcIiwgcngsIHJ5LCAwLCAxLCAxLCAwLCAtMiAqIHJ5XSwgW1wielwiXV07XG4gICAgICAgIH0sXG4gICAgICAgIGdldFBhdGggPSBSLl9nZXRQYXRoID0ge1xuICAgICAgICAgICAgcGF0aDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLmF0dHIoXCJwYXRoXCIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNpcmNsZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBlbC5hdHRycztcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxsaXBzZVBhdGgoYS5jeCwgYS5jeSwgYS5yKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbGxpcHNlOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGVsLmF0dHJzO1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGxpcHNlUGF0aChhLmN4LCBhLmN5LCBhLnJ4LCBhLnJ5KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWN0OiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGVsLmF0dHJzO1xuICAgICAgICAgICAgICAgIHJldHVybiByZWN0UGF0aChhLngsIGEueSwgYS53aWR0aCwgYS5oZWlnaHQsIGEucik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1hZ2U6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gZWwuYXR0cnM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY3RQYXRoKGEueCwgYS55LCBhLndpZHRoLCBhLmhlaWdodCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGV4dDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJib3ggPSBlbC5fZ2V0QkJveCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZWN0UGF0aChiYm94LngsIGJib3gueSwgYmJveC53aWR0aCwgYmJveC5oZWlnaHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCA6IGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJib3ggPSBlbC5fZ2V0QkJveCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZWN0UGF0aChiYm94LngsIGJib3gueSwgYmJveC53aWR0aCwgYmJveC5oZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvKlxcXG4gICAgICAgICAqIFJhcGhhZWwubWFwUGF0aFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogVHJhbnNmb3JtIHRoZSBwYXRoIHN0cmluZyB3aXRoIGdpdmVuIG1hdHJpeC5cbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgICAgICAtIG1hdHJpeCAob2JqZWN0KSBzZWUgQE1hdHJpeFxuICAgICAgICAgPSAoc3RyaW5nKSB0cmFuc2Zvcm1lZCBwYXRoIHN0cmluZ1xuICAgICAgICBcXCovXG4gICAgICAgIG1hcFBhdGggPSBSLm1hcFBhdGggPSBmdW5jdGlvbiAocGF0aCwgbWF0cml4KSB7XG4gICAgICAgICAgICBpZiAoIW1hdHJpeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHgsIHksIGksIGosIGlpLCBqaiwgcGF0aGk7XG4gICAgICAgICAgICBwYXRoID0gcGF0aDJjdXJ2ZShwYXRoKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGF0aGkgPSBwYXRoW2ldO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGpqID0gcGF0aGkubGVuZ3RoOyBqIDwgamo7IGogKz0gMikge1xuICAgICAgICAgICAgICAgICAgICB4ID0gbWF0cml4LngocGF0aGlbal0sIHBhdGhpW2ogKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIHkgPSBtYXRyaXgueShwYXRoaVtqXSwgcGF0aGlbaiArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgcGF0aGlbal0gPSB4O1xuICAgICAgICAgICAgICAgICAgICBwYXRoaVtqICsgMV0gPSB5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICB9O1xuXG4gICAgUi5fZyA9IGc7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwudHlwZVxuICAgICBbIHByb3BlcnR5IChzdHJpbmcpIF1cbiAgICAgKipcbiAgICAgKiBDYW4gYmUg4oCcU1ZH4oCdLCDigJxWTUzigJ0gb3IgZW1wdHksIGRlcGVuZGluZyBvbiBicm93c2VyIHN1cHBvcnQuXG4gICAgXFwqL1xuICAgIFIudHlwZSA9IChnLndpbi5TVkdBbmdsZSB8fCBnLmRvYy5pbXBsZW1lbnRhdGlvbi5oYXNGZWF0dXJlKFwiaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvZmVhdHVyZSNCYXNpY1N0cnVjdHVyZVwiLCBcIjEuMVwiKSA/IFwiU1ZHXCIgOiBcIlZNTFwiKTtcbiAgICBpZiAoUi50eXBlID09IFwiVk1MXCIpIHtcbiAgICAgICAgdmFyIGQgPSBnLmRvYy5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuICAgICAgICAgICAgYjtcbiAgICAgICAgZC5pbm5lckhUTUwgPSAnPHY6c2hhcGUgYWRqPVwiMVwiLz4nO1xuICAgICAgICBiID0gZC5maXJzdENoaWxkO1xuICAgICAgICBiLnN0eWxlLmJlaGF2aW9yID0gXCJ1cmwoI2RlZmF1bHQjVk1MKVwiO1xuICAgICAgICBpZiAoIShiICYmIHR5cGVvZiBiLmFkaiA9PSBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIChSLnR5cGUgPSBFKTtcbiAgICAgICAgfVxuICAgICAgICBkID0gbnVsbDtcbiAgICB9XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuc3ZnXG4gICAgIFsgcHJvcGVydHkgKGJvb2xlYW4pIF1cbiAgICAgKipcbiAgICAgKiBgdHJ1ZWAgaWYgYnJvd3NlciBzdXBwb3J0cyBTVkcuXG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnZtbFxuICAgICBbIHByb3BlcnR5IChib29sZWFuKSBdXG4gICAgICoqXG4gICAgICogYHRydWVgIGlmIGJyb3dzZXIgc3VwcG9ydHMgVk1MLlxuICAgIFxcKi9cbiAgICBSLnN2ZyA9ICEoUi52bWwgPSBSLnR5cGUgPT0gXCJWTUxcIik7XG4gICAgUi5fUGFwZXIgPSBQYXBlcjtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5mblxuICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgKipcbiAgICAgKiBZb3UgY2FuIGFkZCB5b3VyIG93biBtZXRob2QgdG8gdGhlIGNhbnZhcy4gRm9yIGV4YW1wbGUgaWYgeW91IHdhbnQgdG8gZHJhdyBhIHBpZSBjaGFydCxcbiAgICAgKiB5b3UgY2FuIGNyZWF0ZSB5b3VyIG93biBwaWUgY2hhcnQgZnVuY3Rpb24gYW5kIHNoaXAgaXQgYXMgYSBSYXBoYcOrbCBwbHVnaW4uIFRvIGRvIHRoaXNcbiAgICAgKiB5b3UgbmVlZCB0byBleHRlbmQgdGhlIGBSYXBoYWVsLmZuYCBvYmplY3QuIFlvdSBzaG91bGQgbW9kaWZ5IHRoZSBgZm5gIG9iamVjdCBiZWZvcmUgYVxuICAgICAqIFJhcGhhw6tsIGluc3RhbmNlIGlzIGNyZWF0ZWQsIG90aGVyd2lzZSBpdCB3aWxsIHRha2Ugbm8gZWZmZWN0LiBQbGVhc2Ugbm90ZSB0aGF0IHRoZVxuICAgICAqIGFiaWxpdHkgZm9yIG5hbWVzcGFjZWQgcGx1Z2lucyB3YXMgcmVtb3ZlZCBpbiBSYXBoYWVsIDIuMC4gSXQgaXMgdXAgdG8gdGhlIHBsdWdpbiB0b1xuICAgICAqIGVuc3VyZSBhbnkgbmFtZXNwYWNpbmcgZW5zdXJlcyBwcm9wZXIgY29udGV4dC5cbiAgICAgPiBVc2FnZVxuICAgICB8IFJhcGhhZWwuZm4uYXJyb3cgPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIsIHNpemUpIHtcbiAgICAgfCAgICAgcmV0dXJuIHRoaXMucGF0aCggLi4uICk7XG4gICAgIHwgfTtcbiAgICAgfCAvLyBvciBjcmVhdGUgbmFtZXNwYWNlXG4gICAgIHwgUmFwaGFlbC5mbi5teXN0dWZmID0ge1xuICAgICB8ICAgICBhcnJvdzogZnVuY3Rpb24gKCkge+KApn0sXG4gICAgIHwgICAgIHN0YXI6IGZ1bmN0aW9uICgpIHvigKZ9LFxuICAgICB8ICAgICAvLyBldGPigKZcbiAgICAgfCB9O1xuICAgICB8IHZhciBwYXBlciA9IFJhcGhhZWwoMTAsIDEwLCA2MzAsIDQ4MCk7XG4gICAgIHwgLy8gdGhlbiB1c2UgaXRcbiAgICAgfCBwYXBlci5hcnJvdygxMCwgMTAsIDMwLCAzMCwgNSkuYXR0cih7ZmlsbDogXCIjZjAwXCJ9KTtcbiAgICAgfCBwYXBlci5teXN0dWZmLmFycm93KCk7XG4gICAgIHwgcGFwZXIubXlzdHVmZi5zdGFyKCk7XG4gICAgXFwqL1xuICAgIFIuZm4gPSBwYXBlcnByb3RvID0gUGFwZXIucHJvdG90eXBlID0gUi5wcm90b3R5cGU7XG4gICAgUi5faWQgPSAwO1xuICAgIFIuX29pZCA9IDA7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaXNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEhhbmRmdWwgb2YgcmVwbGFjZW1lbnRzIGZvciBgdHlwZW9mYCBvcGVyYXRvci5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gbyAo4oCmKSBhbnkgb2JqZWN0IG9yIHByaW1pdGl2ZVxuICAgICAtIHR5cGUgKHN0cmluZykgbmFtZSBvZiB0aGUgdHlwZSwgaS5lLiDigJxzdHJpbmfigJ0sIOKAnGZ1bmN0aW9u4oCdLCDigJxudW1iZXLigJ0sIGV0Yy5cbiAgICAgPSAoYm9vbGVhbikgaXMgZ2l2ZW4gdmFsdWUgaXMgb2YgZ2l2ZW4gdHlwZVxuICAgIFxcKi9cbiAgICBSLmlzID0gZnVuY3Rpb24gKG8sIHR5cGUpIHtcbiAgICAgICAgdHlwZSA9IGxvd2VyQ2FzZS5jYWxsKHR5cGUpO1xuICAgICAgICBpZiAodHlwZSA9PSBcImZpbml0ZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gIWlzbmFuW2hhc10oK28pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09IFwiYXJyYXlcIikge1xuICAgICAgICAgICAgcmV0dXJuIG8gaW5zdGFuY2VvZiBBcnJheTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gICh0eXBlID09IFwibnVsbFwiICYmIG8gPT09IG51bGwpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGUgPT0gdHlwZW9mIG8gJiYgbyAhPT0gbnVsbCkgfHxcbiAgICAgICAgICAgICAgICAodHlwZSA9PSBcIm9iamVjdFwiICYmIG8gPT09IE9iamVjdChvKSkgfHxcbiAgICAgICAgICAgICAgICAodHlwZSA9PSBcImFycmF5XCIgJiYgQXJyYXkuaXNBcnJheSAmJiBBcnJheS5pc0FycmF5KG8pKSB8fFxuICAgICAgICAgICAgICAgIG9iamVjdFRvU3RyaW5nLmNhbGwobykuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCkgPT0gdHlwZTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY2xvbmUob2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09IFwiZnVuY3Rpb25cIiB8fCBPYmplY3Qob2JqKSAhPT0gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXMgPSBuZXcgb2JqLmNvbnN0cnVjdG9yO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAob2JqW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgcmVzW2tleV0gPSBjbG9uZShvYmpba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5hbmdsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbmdsZSBiZXR3ZWVuIHR3byBvciB0aHJlZSBwb2ludHNcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0geDEgKG51bWJlcikgeCBjb29yZCBvZiBmaXJzdCBwb2ludFxuICAgICAtIHkxIChudW1iZXIpIHkgY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAgICAgLSB4MiAobnVtYmVyKSB4IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuICAgICAtIHkyIChudW1iZXIpIHkgY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gICAgIC0geDMgKG51bWJlcikgI29wdGlvbmFsIHggY29vcmQgb2YgdGhpcmQgcG9pbnRcbiAgICAgLSB5MyAobnVtYmVyKSAjb3B0aW9uYWwgeSBjb29yZCBvZiB0aGlyZCBwb2ludFxuICAgICA9IChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXMuXG4gICAgXFwqL1xuICAgIFIuYW5nbGUgPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIsIHgzLCB5Mykge1xuICAgICAgICBpZiAoeDMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHggPSB4MSAtIHgyLFxuICAgICAgICAgICAgICAgIHkgPSB5MSAtIHkyO1xuICAgICAgICAgICAgaWYgKCF4ICYmICF5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKDE4MCArIG1hdGguYXRhbjIoLXksIC14KSAqIDE4MCAvIFBJICsgMzYwKSAlIDM2MDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBSLmFuZ2xlKHgxLCB5MSwgeDMsIHkzKSAtIFIuYW5nbGUoeDIsIHkyLCB4MywgeTMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5yYWRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFRyYW5zZm9ybSBhbmdsZSB0byByYWRpYW5zXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGRlZyAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG4gICAgID0gKG51bWJlcikgYW5nbGUgaW4gcmFkaWFucy5cbiAgICBcXCovXG4gICAgUi5yYWQgPSBmdW5jdGlvbiAoZGVnKSB7XG4gICAgICAgIHJldHVybiBkZWcgJSAzNjAgKiBQSSAvIDE4MDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmRlZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVHJhbnNmb3JtIGFuZ2xlIHRvIGRlZ3JlZXNcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcmFkIChudW1iZXIpIGFuZ2xlIGluIHJhZGlhbnNcbiAgICAgPSAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzLlxuICAgIFxcKi9cbiAgICBSLmRlZyA9IGZ1bmN0aW9uIChyYWQpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQgKChyYWQgKiAxODAgLyBQSSUgMzYwKSogMTAwMCkgLyAxMDAwO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuc25hcFRvXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTbmFwcyBnaXZlbiB2YWx1ZSB0byBnaXZlbiBncmlkLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSB2YWx1ZXMgKGFycmF5fG51bWJlcikgZ2l2ZW4gYXJyYXkgb2YgdmFsdWVzIG9yIHN0ZXAgb2YgdGhlIGdyaWRcbiAgICAgLSB2YWx1ZSAobnVtYmVyKSB2YWx1ZSB0byBhZGp1c3RcbiAgICAgLSB0b2xlcmFuY2UgKG51bWJlcikgI29wdGlvbmFsIHRvbGVyYW5jZSBmb3Igc25hcHBpbmcuIERlZmF1bHQgaXMgYDEwYC5cbiAgICAgPSAobnVtYmVyKSBhZGp1c3RlZCB2YWx1ZS5cbiAgICBcXCovXG4gICAgUi5zbmFwVG8gPSBmdW5jdGlvbiAodmFsdWVzLCB2YWx1ZSwgdG9sZXJhbmNlKSB7XG4gICAgICAgIHRvbGVyYW5jZSA9IFIuaXModG9sZXJhbmNlLCBcImZpbml0ZVwiKSA/IHRvbGVyYW5jZSA6IDEwO1xuICAgICAgICBpZiAoUi5pcyh2YWx1ZXMsIGFycmF5KSkge1xuICAgICAgICAgICAgdmFyIGkgPSB2YWx1ZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkgaWYgKGFicyh2YWx1ZXNbaV0gLSB2YWx1ZSkgPD0gdG9sZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlcyA9ICt2YWx1ZXM7XG4gICAgICAgICAgICB2YXIgcmVtID0gdmFsdWUgJSB2YWx1ZXM7XG4gICAgICAgICAgICBpZiAocmVtIDwgdG9sZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlIC0gcmVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlbSA+IHZhbHVlcyAtIHRvbGVyYW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSAtIHJlbSArIHZhbHVlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmNyZWF0ZVVVSURcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgUkZDNDEyMiwgdmVyc2lvbiA0IElEXG4gICAgXFwqL1xuICAgIHZhciBjcmVhdGVVVUlEID0gUi5jcmVhdGVVVUlEID0gKGZ1bmN0aW9uICh1dWlkUmVnRXgsIHV1aWRSZXBsYWNlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCIucmVwbGFjZSh1dWlkUmVnRXgsIHV1aWRSZXBsYWNlcikudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfTtcbiAgICB9KSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgciA9IG1hdGgucmFuZG9tKCkgKiAxNiB8IDAsXG4gICAgICAgICAgICB2ID0gYyA9PSBcInhcIiA/IHIgOiAociAmIDMgfCA4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xuXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuc2V0V2luZG93XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVc2VkIHdoZW4geW91IG5lZWQgdG8gZHJhdyBpbiBgJmx0O2lmcmFtZT5gLiBTd2l0Y2hlZCB3aW5kb3cgdG8gdGhlIGlmcmFtZSBvbmUuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIG5ld3dpbiAod2luZG93KSBuZXcgd2luZG93IG9iamVjdFxuICAgIFxcKi9cbiAgICBSLnNldFdpbmRvdyA9IGZ1bmN0aW9uIChuZXd3aW4pIHtcbiAgICAgICAgZXZlKFwicmFwaGFlbC5zZXRXaW5kb3dcIiwgUiwgZy53aW4sIG5ld3dpbik7XG4gICAgICAgIGcud2luID0gbmV3d2luO1xuICAgICAgICBnLmRvYyA9IGcud2luLmRvY3VtZW50O1xuICAgICAgICBpZiAoUi5fZW5naW5lLmluaXRXaW4pIHtcbiAgICAgICAgICAgIFIuX2VuZ2luZS5pbml0V2luKGcud2luKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHRvSGV4ID0gZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgIGlmIChSLnZtbCkge1xuICAgICAgICAgICAgLy8gaHR0cDovL2RlYW4uZWR3YXJkcy5uYW1lL3dlYmxvZy8yMDA5LzEwL2NvbnZlcnQtYW55LWNvbG91ci12YWx1ZS10by1oZXgtaW4tbXNpZS9cbiAgICAgICAgICAgIHZhciB0cmltID0gL15cXHMrfFxccyskL2c7XG4gICAgICAgICAgICB2YXIgYm9kO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgZG9jdW0gPSBuZXcgQWN0aXZlWE9iamVjdChcImh0bWxmaWxlXCIpO1xuICAgICAgICAgICAgICAgIGRvY3VtLndyaXRlKFwiPGJvZHk+XCIpO1xuICAgICAgICAgICAgICAgIGRvY3VtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgYm9kID0gZG9jdW0uYm9keTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIGJvZCA9IGNyZWF0ZVBvcHVwKCkuZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByYW5nZSA9IGJvZC5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgICAgICAgIHRvSGV4ID0gY2FjaGVyKGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGJvZC5zdHlsZS5jb2xvciA9IFN0cihjb2xvcikucmVwbGFjZSh0cmltLCBFKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcmFuZ2UucXVlcnlDb21tYW5kVmFsdWUoXCJGb3JlQ29sb3JcIik7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gKCh2YWx1ZSAmIDI1NSkgPDwgMTYpIHwgKHZhbHVlICYgNjUyODApIHwgKCh2YWx1ZSAmIDE2NzExNjgwKSA+Pj4gMTYpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCIjXCIgKyAoXCIwMDAwMDBcIiArIHZhbHVlLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTYpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaSA9IGcuZG9jLmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xuICAgICAgICAgICAgaS50aXRsZSA9IFwiUmFwaGFcXHhlYmwgQ29sb3VyIFBpY2tlclwiO1xuICAgICAgICAgICAgaS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBnLmRvYy5ib2R5LmFwcGVuZENoaWxkKGkpO1xuICAgICAgICAgICAgdG9IZXggPSBjYWNoZXIoZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgICAgICAgICAgaS5zdHlsZS5jb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgICAgIHJldHVybiBnLmRvYy5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGksIEUpLmdldFByb3BlcnR5VmFsdWUoXCJjb2xvclwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b0hleChjb2xvcik7XG4gICAgfSxcbiAgICBoc2J0b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiaHNiKFwiICsgW3RoaXMuaCwgdGhpcy5zLCB0aGlzLmJdICsgXCIpXCI7XG4gICAgfSxcbiAgICBoc2x0b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiaHNsKFwiICsgW3RoaXMuaCwgdGhpcy5zLCB0aGlzLmxdICsgXCIpXCI7XG4gICAgfSxcbiAgICByZ2J0b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGV4O1xuICAgIH0sXG4gICAgcHJlcGFyZVJHQiA9IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgICAgIGlmIChnID09IG51bGwgJiYgUi5pcyhyLCBcIm9iamVjdFwiKSAmJiBcInJcIiBpbiByICYmIFwiZ1wiIGluIHIgJiYgXCJiXCIgaW4gcikge1xuICAgICAgICAgICAgYiA9IHIuYjtcbiAgICAgICAgICAgIGcgPSByLmc7XG4gICAgICAgICAgICByID0gci5yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnID09IG51bGwgJiYgUi5pcyhyLCBzdHJpbmcpKSB7XG4gICAgICAgICAgICB2YXIgY2xyID0gUi5nZXRSR0Iocik7XG4gICAgICAgICAgICByID0gY2xyLnI7XG4gICAgICAgICAgICBnID0gY2xyLmc7XG4gICAgICAgICAgICBiID0gY2xyLmI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHIgPiAxIHx8IGcgPiAxIHx8IGIgPiAxKSB7XG4gICAgICAgICAgICByIC89IDI1NTtcbiAgICAgICAgICAgIGcgLz0gMjU1O1xuICAgICAgICAgICAgYiAvPSAyNTU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3IsIGcsIGJdO1xuICAgIH0sXG4gICAgcGFja2FnZVJHQiA9IGZ1bmN0aW9uIChyLCBnLCBiLCBvKSB7XG4gICAgICAgIHIgKj0gMjU1O1xuICAgICAgICBnICo9IDI1NTtcbiAgICAgICAgYiAqPSAyNTU7XG4gICAgICAgIHZhciByZ2IgPSB7XG4gICAgICAgICAgICByOiByLFxuICAgICAgICAgICAgZzogZyxcbiAgICAgICAgICAgIGI6IGIsXG4gICAgICAgICAgICBoZXg6IFIucmdiKHIsIGcsIGIpLFxuICAgICAgICAgICAgdG9TdHJpbmc6IHJnYnRvU3RyaW5nXG4gICAgICAgIH07XG4gICAgICAgIFIuaXMobywgXCJmaW5pdGVcIikgJiYgKHJnYi5vcGFjaXR5ID0gbyk7XG4gICAgICAgIHJldHVybiByZ2I7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmNvbG9yXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBQYXJzZXMgdGhlIGNvbG9yIHN0cmluZyBhbmQgcmV0dXJucyBvYmplY3Qgd2l0aCBhbGwgdmFsdWVzIGZvciB0aGUgZ2l2ZW4gY29sb3IuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGNsciAoc3RyaW5nKSBjb2xvciBzdHJpbmcgaW4gb25lIG9mIHRoZSBzdXBwb3J0ZWQgZm9ybWF0cyAoc2VlIEBSYXBoYWVsLmdldFJHQilcbiAgICAgPSAob2JqZWN0KSBDb21iaW5lZCBSR0IgJiBIU0Igb2JqZWN0IGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHIgKG51bWJlcikgcmVkLFxuICAgICBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuICAgICBvICAgICBiIChudW1iZXIpIGJsdWUsXG4gICAgIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKIsXG4gICAgIG8gICAgIGVycm9yIChib29sZWFuKSBgdHJ1ZWAgaWYgc3RyaW5nIGNhbuKAmXQgYmUgcGFyc2VkLFxuICAgICBvICAgICBoIChudW1iZXIpIGh1ZSxcbiAgICAgbyAgICAgcyAobnVtYmVyKSBzYXR1cmF0aW9uLFxuICAgICBvICAgICB2IChudW1iZXIpIHZhbHVlIChicmlnaHRuZXNzKSxcbiAgICAgbyAgICAgbCAobnVtYmVyKSBsaWdodG5lc3NcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIuY29sb3IgPSBmdW5jdGlvbiAoY2xyKSB7XG4gICAgICAgIHZhciByZ2I7XG4gICAgICAgIGlmIChSLmlzKGNsciwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gY2xyICYmIFwic1wiIGluIGNsciAmJiBcImJcIiBpbiBjbHIpIHtcbiAgICAgICAgICAgIHJnYiA9IFIuaHNiMnJnYihjbHIpO1xuICAgICAgICAgICAgY2xyLnIgPSByZ2IucjtcbiAgICAgICAgICAgIGNsci5nID0gcmdiLmc7XG4gICAgICAgICAgICBjbHIuYiA9IHJnYi5iO1xuICAgICAgICAgICAgY2xyLmhleCA9IHJnYi5oZXg7XG4gICAgICAgIH0gZWxzZSBpZiAoUi5pcyhjbHIsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGNsciAmJiBcInNcIiBpbiBjbHIgJiYgXCJsXCIgaW4gY2xyKSB7XG4gICAgICAgICAgICByZ2IgPSBSLmhzbDJyZ2IoY2xyKTtcbiAgICAgICAgICAgIGNsci5yID0gcmdiLnI7XG4gICAgICAgICAgICBjbHIuZyA9IHJnYi5nO1xuICAgICAgICAgICAgY2xyLmIgPSByZ2IuYjtcbiAgICAgICAgICAgIGNsci5oZXggPSByZ2IuaGV4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKFIuaXMoY2xyLCBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgICAgIGNsciA9IFIuZ2V0UkdCKGNscik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoUi5pcyhjbHIsIFwib2JqZWN0XCIpICYmIFwiclwiIGluIGNsciAmJiBcImdcIiBpbiBjbHIgJiYgXCJiXCIgaW4gY2xyKSB7XG4gICAgICAgICAgICAgICAgcmdiID0gUi5yZ2IyaHNsKGNscik7XG4gICAgICAgICAgICAgICAgY2xyLmggPSByZ2IuaDtcbiAgICAgICAgICAgICAgICBjbHIucyA9IHJnYi5zO1xuICAgICAgICAgICAgICAgIGNsci5sID0gcmdiLmw7XG4gICAgICAgICAgICAgICAgcmdiID0gUi5yZ2IyaHNiKGNscik7XG4gICAgICAgICAgICAgICAgY2xyLnYgPSByZ2IuYjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xyID0ge2hleDogXCJub25lXCJ9O1xuICAgICAgICAgICAgICAgIGNsci5yID0gY2xyLmcgPSBjbHIuYiA9IGNsci5oID0gY2xyLnMgPSBjbHIudiA9IGNsci5sID0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2xyLnRvU3RyaW5nID0gcmdidG9TdHJpbmc7XG4gICAgICAgIHJldHVybiBjbHI7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5oc2IycmdiXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBIU0IgdmFsdWVzIHRvIFJHQiBvYmplY3QuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGggKG51bWJlcikgaHVlXG4gICAgIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gICAgIC0gdiAobnVtYmVyKSB2YWx1ZSBvciBicmlnaHRuZXNzXG4gICAgID0gKG9iamVjdCkgUkdCIG9iamVjdCBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICByIChudW1iZXIpIHJlZCxcbiAgICAgbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiAgICAgbyAgICAgYiAobnVtYmVyKSBibHVlLFxuICAgICBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLmhzYjJyZ2IgPSBmdW5jdGlvbiAoaCwgcywgdiwgbykge1xuICAgICAgICBpZiAodGhpcy5pcyhoLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBoICYmIFwic1wiIGluIGggJiYgXCJiXCIgaW4gaCkge1xuICAgICAgICAgICAgdiA9IGguYjtcbiAgICAgICAgICAgIHMgPSBoLnM7XG4gICAgICAgICAgICBvID0gaC5vO1xuICAgICAgICAgICAgaCA9IGguaDtcbiAgICAgICAgfVxuICAgICAgICBoICo9IDM2MDtcbiAgICAgICAgdmFyIFIsIEcsIEIsIFgsIEM7XG4gICAgICAgIGggPSAoaCAlIDM2MCkgLyA2MDtcbiAgICAgICAgQyA9IHYgKiBzO1xuICAgICAgICBYID0gQyAqICgxIC0gYWJzKGggJSAyIC0gMSkpO1xuICAgICAgICBSID0gRyA9IEIgPSB2IC0gQztcblxuICAgICAgICBoID0gfn5oO1xuICAgICAgICBSICs9IFtDLCBYLCAwLCAwLCBYLCBDXVtoXTtcbiAgICAgICAgRyArPSBbWCwgQywgQywgWCwgMCwgMF1baF07XG4gICAgICAgIEIgKz0gWzAsIDAsIFgsIEMsIEMsIFhdW2hdO1xuICAgICAgICByZXR1cm4gcGFja2FnZVJHQihSLCBHLCBCLCBvKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmhzbDJyZ2JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIEhTTCB2YWx1ZXMgdG8gUkdCIG9iamVjdC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaCAobnVtYmVyKSBodWVcbiAgICAgLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAgICAgLSBsIChudW1iZXIpIGx1bWlub3NpdHlcbiAgICAgPSAob2JqZWN0KSBSR0Igb2JqZWN0IGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHIgKG51bWJlcikgcmVkLFxuICAgICBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuICAgICBvICAgICBiIChudW1iZXIpIGJsdWUsXG4gICAgIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKJcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFIuaHNsMnJnYiA9IGZ1bmN0aW9uIChoLCBzLCBsLCBvKSB7XG4gICAgICAgIGlmICh0aGlzLmlzKGgsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGggJiYgXCJzXCIgaW4gaCAmJiBcImxcIiBpbiBoKSB7XG4gICAgICAgICAgICBsID0gaC5sO1xuICAgICAgICAgICAgcyA9IGgucztcbiAgICAgICAgICAgIGggPSBoLmg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGggPiAxIHx8IHMgPiAxIHx8IGwgPiAxKSB7XG4gICAgICAgICAgICBoIC89IDM2MDtcbiAgICAgICAgICAgIHMgLz0gMTAwO1xuICAgICAgICAgICAgbCAvPSAxMDA7XG4gICAgICAgIH1cbiAgICAgICAgaCAqPSAzNjA7XG4gICAgICAgIHZhciBSLCBHLCBCLCBYLCBDO1xuICAgICAgICBoID0gKGggJSAzNjApIC8gNjA7XG4gICAgICAgIEMgPSAyICogcyAqIChsIDwgLjUgPyBsIDogMSAtIGwpO1xuICAgICAgICBYID0gQyAqICgxIC0gYWJzKGggJSAyIC0gMSkpO1xuICAgICAgICBSID0gRyA9IEIgPSBsIC0gQyAvIDI7XG5cbiAgICAgICAgaCA9IH5+aDtcbiAgICAgICAgUiArPSBbQywgWCwgMCwgMCwgWCwgQ11baF07XG4gICAgICAgIEcgKz0gW1gsIEMsIEMsIFgsIDAsIDBdW2hdO1xuICAgICAgICBCICs9IFswLCAwLCBYLCBDLCBDLCBYXVtoXTtcbiAgICAgICAgcmV0dXJuIHBhY2thZ2VSR0IoUiwgRywgQiwgbyk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5yZ2IyaHNiXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBSR0IgdmFsdWVzIHRvIEhTQiBvYmplY3QuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHIgKG51bWJlcikgcmVkXG4gICAgIC0gZyAobnVtYmVyKSBncmVlblxuICAgICAtIGIgKG51bWJlcikgYmx1ZVxuICAgICA9IChvYmplY3QpIEhTQiBvYmplY3QgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgaCAobnVtYmVyKSBodWVcbiAgICAgbyAgICAgcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gICAgIG8gICAgIGIgKG51bWJlcikgYnJpZ2h0bmVzc1xuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5yZ2IyaHNiID0gZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICAgICAgYiA9IHByZXBhcmVSR0IociwgZywgYik7XG4gICAgICAgIHIgPSBiWzBdO1xuICAgICAgICBnID0gYlsxXTtcbiAgICAgICAgYiA9IGJbMl07XG5cbiAgICAgICAgdmFyIEgsIFMsIFYsIEM7XG4gICAgICAgIFYgPSBtbWF4KHIsIGcsIGIpO1xuICAgICAgICBDID0gViAtIG1taW4ociwgZywgYik7XG4gICAgICAgIEggPSAoQyA9PSAwID8gbnVsbCA6XG4gICAgICAgICAgICAgViA9PSByID8gKGcgLSBiKSAvIEMgOlxuICAgICAgICAgICAgIFYgPT0gZyA/IChiIC0gcikgLyBDICsgMiA6XG4gICAgICAgICAgICAgICAgICAgICAgKHIgLSBnKSAvIEMgKyA0XG4gICAgICAgICAgICApO1xuICAgICAgICBIID0gKChIICsgMzYwKSAlIDYpICogNjAgLyAzNjA7XG4gICAgICAgIFMgPSBDID09IDAgPyAwIDogQyAvIFY7XG4gICAgICAgIHJldHVybiB7aDogSCwgczogUywgYjogViwgdG9TdHJpbmc6IGhzYnRvU3RyaW5nfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnJnYjJoc2xcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIFJHQiB2YWx1ZXMgdG8gSFNMIG9iamVjdC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gciAobnVtYmVyKSByZWRcbiAgICAgLSBnIChudW1iZXIpIGdyZWVuXG4gICAgIC0gYiAobnVtYmVyKSBibHVlXG4gICAgID0gKG9iamVjdCkgSFNMIG9iamVjdCBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICBoIChudW1iZXIpIGh1ZVxuICAgICBvICAgICBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAgICAgbyAgICAgbCAobnVtYmVyKSBsdW1pbm9zaXR5XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLnJnYjJoc2wgPSBmdW5jdGlvbiAociwgZywgYikge1xuICAgICAgICBiID0gcHJlcGFyZVJHQihyLCBnLCBiKTtcbiAgICAgICAgciA9IGJbMF07XG4gICAgICAgIGcgPSBiWzFdO1xuICAgICAgICBiID0gYlsyXTtcblxuICAgICAgICB2YXIgSCwgUywgTCwgTSwgbSwgQztcbiAgICAgICAgTSA9IG1tYXgociwgZywgYik7XG4gICAgICAgIG0gPSBtbWluKHIsIGcsIGIpO1xuICAgICAgICBDID0gTSAtIG07XG4gICAgICAgIEggPSAoQyA9PSAwID8gbnVsbCA6XG4gICAgICAgICAgICAgTSA9PSByID8gKGcgLSBiKSAvIEMgOlxuICAgICAgICAgICAgIE0gPT0gZyA/IChiIC0gcikgLyBDICsgMiA6XG4gICAgICAgICAgICAgICAgICAgICAgKHIgLSBnKSAvIEMgKyA0KTtcbiAgICAgICAgSCA9ICgoSCArIDM2MCkgJSA2KSAqIDYwIC8gMzYwO1xuICAgICAgICBMID0gKE0gKyBtKSAvIDI7XG4gICAgICAgIFMgPSAoQyA9PSAwID8gMCA6XG4gICAgICAgICAgICAgTCA8IC41ID8gQyAvICgyICogTCkgOlxuICAgICAgICAgICAgICAgICAgICAgIEMgLyAoMiAtIDIgKiBMKSk7XG4gICAgICAgIHJldHVybiB7aDogSCwgczogUywgbDogTCwgdG9TdHJpbmc6IGhzbHRvU3RyaW5nfTtcbiAgICB9O1xuICAgIFIuX3BhdGgyc3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5qb2luKFwiLFwiKS5yZXBsYWNlKHAycywgXCIkMVwiKTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHJlcHVzaChhcnJheSwgaXRlbSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhcnJheS5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5wdXNoKGFycmF5LnNwbGljZShpLCAxKVswXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gY2FjaGVyKGYsIHNjb3BlLCBwb3N0cHJvY2Vzc29yKSB7XG4gICAgICAgIGZ1bmN0aW9uIG5ld2YoKSB7XG4gICAgICAgICAgICB2YXIgYXJnID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSxcbiAgICAgICAgICAgICAgICBhcmdzID0gYXJnLmpvaW4oXCJcXHUyNDAwXCIpLFxuICAgICAgICAgICAgICAgIGNhY2hlID0gbmV3Zi5jYWNoZSA9IG5ld2YuY2FjaGUgfHwge30sXG4gICAgICAgICAgICAgICAgY291bnQgPSBuZXdmLmNvdW50ID0gbmV3Zi5jb3VudCB8fCBbXTtcbiAgICAgICAgICAgIGlmIChjYWNoZVtoYXNdKGFyZ3MpKSB7XG4gICAgICAgICAgICAgICAgcmVwdXNoKGNvdW50LCBhcmdzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3NvciA/IHBvc3Rwcm9jZXNzb3IoY2FjaGVbYXJnc10pIDogY2FjaGVbYXJnc107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb3VudC5sZW5ndGggPj0gMWUzICYmIGRlbGV0ZSBjYWNoZVtjb3VudC5zaGlmdCgpXTtcbiAgICAgICAgICAgIGNvdW50LnB1c2goYXJncyk7XG4gICAgICAgICAgICBjYWNoZVthcmdzXSA9IGZbYXBwbHldKHNjb3BlLCBhcmcpO1xuICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzb3IgPyBwb3N0cHJvY2Vzc29yKGNhY2hlW2FyZ3NdKSA6IGNhY2hlW2FyZ3NdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdmO1xuICAgIH1cblxuICAgIHZhciBwcmVsb2FkID0gUi5fcHJlbG9hZCA9IGZ1bmN0aW9uIChzcmMsIGYpIHtcbiAgICAgICAgdmFyIGltZyA9IGcuZG9jLmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgICAgIGltZy5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi05OTk5ZW07dG9wOi05OTk5ZW1cIjtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGYuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMub25sb2FkID0gbnVsbDtcbiAgICAgICAgICAgIGcuZG9jLmJvZHkucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgICAgIH07XG4gICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZy5kb2MuYm9keS5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZy5kb2MuYm9keS5hcHBlbmRDaGlsZChpbWcpO1xuICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjbHJUb1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGV4O1xuICAgIH1cblxuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmdldFJHQlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUGFyc2VzIGNvbG91ciBzdHJpbmcgYXMgUkdCIG9iamVjdFxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBjb2xvdXIgKHN0cmluZykgY29sb3VyIHN0cmluZyBpbiBvbmUgb2YgZm9ybWF0czpcbiAgICAgIyA8dWw+XG4gICAgICMgICAgIDxsaT5Db2xvdXIgbmFtZSAo4oCcPGNvZGU+cmVkPC9jb2RlPuKAnSwg4oCcPGNvZGU+Z3JlZW48L2NvZGU+4oCdLCDigJw8Y29kZT5jb3JuZmxvd2VyYmx1ZTwvY29kZT7igJ0sIGV0Yyk8L2xpPlxuICAgICAjICAgICA8bGk+I+KAouKAouKAoiDigJQgc2hvcnRlbmVkIEhUTUwgY29sb3VyOiAo4oCcPGNvZGU+IzAwMDwvY29kZT7igJ0sIOKAnDxjb2RlPiNmYzA8L2NvZGU+4oCdLCBldGMpPC9saT5cbiAgICAgIyAgICAgPGxpPiPigKLigKLigKLigKLigKLigKIg4oCUIGZ1bGwgbGVuZ3RoIEhUTUwgY29sb3VyOiAo4oCcPGNvZGU+IzAwMDAwMDwvY29kZT7igJ0sIOKAnDxjb2RlPiNiZDIzMDA8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5yZ2Io4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIHJlZCwgZ3JlZW4gYW5kIGJsdWUgY2hhbm5lbHPigJkgdmFsdWVzOiAo4oCcPGNvZGU+cmdiKDIwMCwmbmJzcDsxMDAsJm5ic3A7MCk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5yZ2Io4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlOiAo4oCcPGNvZGU+cmdiKDEwMCUsJm5ic3A7MTc1JSwmbmJzcDswJSk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2Io4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGh1ZSwgc2F0dXJhdGlvbiBhbmQgYnJpZ2h0bmVzcyB2YWx1ZXM6ICjigJw8Y29kZT5oc2IoMC41LCZuYnNwOzAuMjUsJm5ic3A7MSk8L2NvZGU+4oCdKTwvbGk+XG4gICAgICMgICAgIDxsaT5oc2Io4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlPC9saT5cbiAgICAgIyAgICAgPGxpPmhzbCjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgc2FtZSBhcyBoc2I8L2xpPlxuICAgICAjICAgICA8bGk+aHNsKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGhzYjwvbGk+XG4gICAgICMgPC91bD5cbiAgICAgPSAob2JqZWN0KSBSR0Igb2JqZWN0IGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHIgKG51bWJlcikgcmVkLFxuICAgICBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuICAgICBvICAgICBiIChudW1iZXIpIGJsdWVcbiAgICAgbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAoixcbiAgICAgbyAgICAgZXJyb3IgKGJvb2xlYW4pIHRydWUgaWYgc3RyaW5nIGNhbuKAmXQgYmUgcGFyc2VkXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLmdldFJHQiA9IGNhY2hlcihmdW5jdGlvbiAoY29sb3VyKSB7XG4gICAgICAgIGlmICghY29sb3VyIHx8ICEhKChjb2xvdXIgPSBTdHIoY29sb3VyKSkuaW5kZXhPZihcIi1cIikgKyAxKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyOiAtMSwgZzogLTEsIGI6IC0xLCBoZXg6IFwibm9uZVwiLCBlcnJvcjogMSwgdG9TdHJpbmc6IGNsclRvU3RyaW5nfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sb3VyID09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4ge3I6IC0xLCBnOiAtMSwgYjogLTEsIGhleDogXCJub25lXCIsIHRvU3RyaW5nOiBjbHJUb1N0cmluZ307XG4gICAgICAgIH1cbiAgICAgICAgIShoc3JnW2hhc10oY29sb3VyLnRvTG93ZXJDYXNlKCkuc3Vic3RyaW5nKDAsIDIpKSB8fCBjb2xvdXIuY2hhckF0KCkgPT0gXCIjXCIpICYmIChjb2xvdXIgPSB0b0hleChjb2xvdXIpKTtcbiAgICAgICAgdmFyIHJlcyxcbiAgICAgICAgICAgIHJlZCxcbiAgICAgICAgICAgIGdyZWVuLFxuICAgICAgICAgICAgYmx1ZSxcbiAgICAgICAgICAgIG9wYWNpdHksXG4gICAgICAgICAgICB0LFxuICAgICAgICAgICAgdmFsdWVzLFxuICAgICAgICAgICAgcmdiID0gY29sb3VyLm1hdGNoKGNvbG91clJlZ0V4cCk7XG4gICAgICAgIGlmIChyZ2IpIHtcbiAgICAgICAgICAgIGlmIChyZ2JbMl0pIHtcbiAgICAgICAgICAgICAgICBibHVlID0gdG9JbnQocmdiWzJdLnN1YnN0cmluZyg1KSwgMTYpO1xuICAgICAgICAgICAgICAgIGdyZWVuID0gdG9JbnQocmdiWzJdLnN1YnN0cmluZygzLCA1KSwgMTYpO1xuICAgICAgICAgICAgICAgIHJlZCA9IHRvSW50KHJnYlsyXS5zdWJzdHJpbmcoMSwgMyksIDE2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZ2JbM10pIHtcbiAgICAgICAgICAgICAgICBibHVlID0gdG9JbnQoKHQgPSByZ2JbM10uY2hhckF0KDMpKSArIHQsIDE2KTtcbiAgICAgICAgICAgICAgICBncmVlbiA9IHRvSW50KCh0ID0gcmdiWzNdLmNoYXJBdCgyKSkgKyB0LCAxNik7XG4gICAgICAgICAgICAgICAgcmVkID0gdG9JbnQoKHQgPSByZ2JbM10uY2hhckF0KDEpKSArIHQsIDE2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZ2JbNF0pIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSByZ2JbNF1bc3BsaXRdKGNvbW1hU3BhY2VzKTtcbiAgICAgICAgICAgICAgICByZWQgPSB0b0Zsb2F0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAocmVkICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgIGdyZWVuID0gdG9GbG9hdCh2YWx1ZXNbMV0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1sxXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGdyZWVuICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgIGJsdWUgPSB0b0Zsb2F0KHZhbHVlc1syXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzJdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoYmx1ZSAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICByZ2JbMV0udG9Mb3dlckNhc2UoKS5zbGljZSgwLCA0KSA9PSBcInJnYmFcIiAmJiAob3BhY2l0eSA9IHRvRmxvYXQodmFsdWVzWzNdKSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzNdICYmIHZhbHVlc1szXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKG9wYWNpdHkgLz0gMTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZ2JbNV0pIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSByZ2JbNV1bc3BsaXRdKGNvbW1hU3BhY2VzKTtcbiAgICAgICAgICAgICAgICByZWQgPSB0b0Zsb2F0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAocmVkICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgIGdyZWVuID0gdG9GbG9hdCh2YWx1ZXNbMV0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1sxXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGdyZWVuICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgIGJsdWUgPSB0b0Zsb2F0KHZhbHVlc1syXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzJdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoYmx1ZSAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICAodmFsdWVzWzBdLnNsaWNlKC0zKSA9PSBcImRlZ1wiIHx8IHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCJcXHhiMFwiKSAmJiAocmVkIC89IDM2MCk7XG4gICAgICAgICAgICAgICAgcmdiWzFdLnRvTG93ZXJDYXNlKCkuc2xpY2UoMCwgNCkgPT0gXCJoc2JhXCIgJiYgKG9wYWNpdHkgPSB0b0Zsb2F0KHZhbHVlc1szXSkpO1xuICAgICAgICAgICAgICAgIHZhbHVlc1szXSAmJiB2YWx1ZXNbM10uc2xpY2UoLTEpID09IFwiJVwiICYmIChvcGFjaXR5IC89IDEwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFIuaHNiMnJnYihyZWQsIGdyZWVuLCBibHVlLCBvcGFjaXR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZ2JbNl0pIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSByZ2JbNl1bc3BsaXRdKGNvbW1hU3BhY2VzKTtcbiAgICAgICAgICAgICAgICByZWQgPSB0b0Zsb2F0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAocmVkICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgIGdyZWVuID0gdG9GbG9hdCh2YWx1ZXNbMV0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1sxXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGdyZWVuICo9IDIuNTUpO1xuICAgICAgICAgICAgICAgIGJsdWUgPSB0b0Zsb2F0KHZhbHVlc1syXSk7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzJdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoYmx1ZSAqPSAyLjU1KTtcbiAgICAgICAgICAgICAgICAodmFsdWVzWzBdLnNsaWNlKC0zKSA9PSBcImRlZ1wiIHx8IHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCJcXHhiMFwiKSAmJiAocmVkIC89IDM2MCk7XG4gICAgICAgICAgICAgICAgcmdiWzFdLnRvTG93ZXJDYXNlKCkuc2xpY2UoMCwgNCkgPT0gXCJoc2xhXCIgJiYgKG9wYWNpdHkgPSB0b0Zsb2F0KHZhbHVlc1szXSkpO1xuICAgICAgICAgICAgICAgIHZhbHVlc1szXSAmJiB2YWx1ZXNbM10uc2xpY2UoLTEpID09IFwiJVwiICYmIChvcGFjaXR5IC89IDEwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFIuaHNsMnJnYihyZWQsIGdyZWVuLCBibHVlLCBvcGFjaXR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJnYiA9IHtyOiByZWQsIGc6IGdyZWVuLCBiOiBibHVlLCB0b1N0cmluZzogY2xyVG9TdHJpbmd9O1xuICAgICAgICAgICAgcmdiLmhleCA9IFwiI1wiICsgKDE2Nzc3MjE2IHwgYmx1ZSB8IChncmVlbiA8PCA4KSB8IChyZWQgPDwgMTYpKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG4gICAgICAgICAgICBSLmlzKG9wYWNpdHksIFwiZmluaXRlXCIpICYmIChyZ2Iub3BhY2l0eSA9IG9wYWNpdHkpO1xuICAgICAgICAgICAgcmV0dXJuIHJnYjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge3I6IC0xLCBnOiAtMSwgYjogLTEsIGhleDogXCJub25lXCIsIGVycm9yOiAxLCB0b1N0cmluZzogY2xyVG9TdHJpbmd9O1xuICAgIH0sIFIpO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmhzYlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ29udmVydHMgSFNCIHZhbHVlcyB0byBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG91ci5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaCAobnVtYmVyKSBodWVcbiAgICAgLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAgICAgLSBiIChudW1iZXIpIHZhbHVlIG9yIGJyaWdodG5lc3NcbiAgICAgPSAoc3RyaW5nKSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG91ci5cbiAgICBcXCovXG4gICAgUi5oc2IgPSBjYWNoZXIoZnVuY3Rpb24gKGgsIHMsIGIpIHtcbiAgICAgICAgcmV0dXJuIFIuaHNiMnJnYihoLCBzLCBiKS5oZXg7XG4gICAgfSk7XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaHNsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBIU0wgdmFsdWVzIHRvIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3VyLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoIChudW1iZXIpIGh1ZVxuICAgICAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuICAgICAtIGwgKG51bWJlcikgbHVtaW5vc2l0eVxuICAgICA9IChzdHJpbmcpIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3VyLlxuICAgIFxcKi9cbiAgICBSLmhzbCA9IGNhY2hlcihmdW5jdGlvbiAoaCwgcywgbCkge1xuICAgICAgICByZXR1cm4gUi5oc2wycmdiKGgsIHMsIGwpLmhleDtcbiAgICB9KTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5yZ2JcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIFJHQiB2YWx1ZXMgdG8gaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvdXIuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHIgKG51bWJlcikgcmVkXG4gICAgIC0gZyAobnVtYmVyKSBncmVlblxuICAgICAtIGIgKG51bWJlcikgYmx1ZVxuICAgICA9IChzdHJpbmcpIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3VyLlxuICAgIFxcKi9cbiAgICBSLnJnYiA9IGNhY2hlcihmdW5jdGlvbiAociwgZywgYikge1xuICAgICAgICByZXR1cm4gXCIjXCIgKyAoMTY3NzcyMTYgfCBiIHwgKGcgPDwgOCkgfCAociA8PCAxNikpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbiAgICB9KTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5nZXRDb2xvclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogT24gZWFjaCBjYWxsIHJldHVybnMgbmV4dCBjb2xvdXIgaW4gdGhlIHNwZWN0cnVtLiBUbyByZXNldCBpdCBiYWNrIHRvIHJlZCBjYWxsIEBSYXBoYWVsLmdldENvbG9yLnJlc2V0XG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHZhbHVlIChudW1iZXIpICNvcHRpb25hbCBicmlnaHRuZXNzLCBkZWZhdWx0IGlzIGAwLjc1YFxuICAgICA9IChzdHJpbmcpIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3VyLlxuICAgIFxcKi9cbiAgICBSLmdldENvbG9yID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBzdGFydCA9IHRoaXMuZ2V0Q29sb3Iuc3RhcnQgPSB0aGlzLmdldENvbG9yLnN0YXJ0IHx8IHtoOiAwLCBzOiAxLCBiOiB2YWx1ZSB8fCAuNzV9LFxuICAgICAgICAgICAgcmdiID0gdGhpcy5oc2IycmdiKHN0YXJ0LmgsIHN0YXJ0LnMsIHN0YXJ0LmIpO1xuICAgICAgICBzdGFydC5oICs9IC4wNzU7XG4gICAgICAgIGlmIChzdGFydC5oID4gMSkge1xuICAgICAgICAgICAgc3RhcnQuaCA9IDA7XG4gICAgICAgICAgICBzdGFydC5zIC09IC4yO1xuICAgICAgICAgICAgc3RhcnQucyA8PSAwICYmICh0aGlzLmdldENvbG9yLnN0YXJ0ID0ge2g6IDAsIHM6IDEsIGI6IHN0YXJ0LmJ9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmdiLmhleDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmdldENvbG9yLnJlc2V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXNldHMgc3BlY3RydW0gcG9zaXRpb24gZm9yIEBSYXBoYWVsLmdldENvbG9yIGJhY2sgdG8gcmVkLlxuICAgIFxcKi9cbiAgICBSLmdldENvbG9yLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWxldGUgdGhpcy5zdGFydDtcbiAgICB9O1xuXG4gICAgLy8gaHR0cDovL3NjaGVwZXJzLmNjL2dldHRpbmctdG8tdGhlLXBvaW50XG4gICAgZnVuY3Rpb24gY2F0bXVsbFJvbTJiZXppZXIoY3JwLCB6KSB7XG4gICAgICAgIHZhciBkID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpTGVuID0gY3JwLmxlbmd0aDsgaUxlbiAtIDIgKiAheiA+IGk7IGkgKz0gMikge1xuICAgICAgICAgICAgdmFyIHAgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpIC0gMl0sIHk6ICtjcnBbaSAtIDFdfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2ldLCAgICAgeTogK2NycFtpICsgMV19LFxuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaSArIDJdLCB5OiArY3JwW2kgKyAzXX0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpICsgNF0sIHk6ICtjcnBbaSArIDVdfVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWYgKHopIHtcbiAgICAgICAgICAgICAgICBpZiAoIWkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFswXSA9IHt4OiArY3JwW2lMZW4gLSAyXSwgeTogK2NycFtpTGVuIC0gMV19O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaUxlbiAtIDQgPT0gaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzNdID0ge3g6ICtjcnBbMF0sIHk6ICtjcnBbMV19O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaUxlbiAtIDIgPT0gaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzJdID0ge3g6ICtjcnBbMF0sIHk6ICtjcnBbMV19O1xuICAgICAgICAgICAgICAgICAgICBwWzNdID0ge3g6ICtjcnBbMl0sIHk6ICtjcnBbM119O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGlMZW4gLSA0ID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFszXSA9IHBbMl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzBdID0ge3g6ICtjcnBbaV0sIHk6ICtjcnBbaSArIDFdfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkLnB1c2goW1wiQ1wiLFxuICAgICAgICAgICAgICAgICAgKC1wWzBdLnggKyA2ICogcFsxXS54ICsgcFsyXS54KSAvIDYsXG4gICAgICAgICAgICAgICAgICAoLXBbMF0ueSArIDYgKiBwWzFdLnkgKyBwWzJdLnkpIC8gNixcbiAgICAgICAgICAgICAgICAgIChwWzFdLnggKyA2ICogcFsyXS54IC0gcFszXS54KSAvIDYsXG4gICAgICAgICAgICAgICAgICAocFsxXS55ICsgNipwWzJdLnkgLSBwWzNdLnkpIC8gNixcbiAgICAgICAgICAgICAgICAgIHBbMl0ueCxcbiAgICAgICAgICAgICAgICAgIHBbMl0ueVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZDtcbiAgICB9XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucGFyc2VQYXRoU3RyaW5nXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFBhcnNlcyBnaXZlbiBwYXRoIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mIGFycmF5cyBvZiBwYXRoIHNlZ21lbnRzLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwYXRoU3RyaW5nIChzdHJpbmd8YXJyYXkpIHBhdGggc3RyaW5nIG9yIGFycmF5IG9mIHNlZ21lbnRzIChpbiB0aGUgbGFzdCBjYXNlIGl0IHdpbGwgYmUgcmV0dXJuZWQgc3RyYWlnaHQgYXdheSlcbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIHNlZ21lbnRzLlxuICAgIFxcKi9cbiAgICBSLnBhcnNlUGF0aFN0cmluZyA9IGZ1bmN0aW9uIChwYXRoU3RyaW5nKSB7XG4gICAgICAgIGlmICghcGF0aFN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHB0aCA9IHBhdGhzKHBhdGhTdHJpbmcpO1xuICAgICAgICBpZiAocHRoLmFycikge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGhDbG9uZShwdGguYXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwYXJhbUNvdW50cyA9IHthOiA3LCBjOiA2LCBoOiAxLCBsOiAyLCBtOiAyLCByOiA0LCBxOiA0LCBzOiA0LCB0OiAyLCB2OiAxLCB6OiAwfSxcbiAgICAgICAgICAgIGRhdGEgPSBbXTtcbiAgICAgICAgaWYgKFIuaXMocGF0aFN0cmluZywgYXJyYXkpICYmIFIuaXMocGF0aFN0cmluZ1swXSwgYXJyYXkpKSB7IC8vIHJvdWdoIGFzc3VtcHRpb25cbiAgICAgICAgICAgIGRhdGEgPSBwYXRoQ2xvbmUocGF0aFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgU3RyKHBhdGhTdHJpbmcpLnJlcGxhY2UocGF0aENvbW1hbmQsIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gYi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGMucmVwbGFjZShwYXRoVmFsdWVzLCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICBiICYmIHBhcmFtcy5wdXNoKCtiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PSBcIm1cIiAmJiBwYXJhbXMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2JdW2NvbmNhdF0ocGFyYW1zLnNwbGljZSgwLCAyKSkpO1xuICAgICAgICAgICAgICAgICAgICBuYW1lID0gXCJsXCI7XG4gICAgICAgICAgICAgICAgICAgIGIgPSBiID09IFwibVwiID8gXCJsXCIgOiBcIkxcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgPT0gXCJyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiXVtjb25jYXRdKHBhcmFtcykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB3aGlsZSAocGFyYW1zLmxlbmd0aCA+PSBwYXJhbUNvdW50c1tuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2JdW2NvbmNhdF0ocGFyYW1zLnNwbGljZSgwLCBwYXJhbUNvdW50c1tuYW1lXSkpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJhbUNvdW50c1tuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhLnRvU3RyaW5nID0gUi5fcGF0aDJzdHJpbmc7XG4gICAgICAgIHB0aC5hcnIgPSBwYXRoQ2xvbmUoZGF0YSk7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucGFyc2VUcmFuc2Zvcm1TdHJpbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUGFyc2VzIGdpdmVuIHBhdGggc3RyaW5nIGludG8gYW4gYXJyYXkgb2YgdHJhbnNmb3JtYXRpb25zLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBUU3RyaW5nIChzdHJpbmd8YXJyYXkpIHRyYW5zZm9ybSBzdHJpbmcgb3IgYXJyYXkgb2YgdHJhbnNmb3JtYXRpb25zIChpbiB0aGUgbGFzdCBjYXNlIGl0IHdpbGwgYmUgcmV0dXJuZWQgc3RyYWlnaHQgYXdheSlcbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIHRyYW5zZm9ybWF0aW9ucy5cbiAgICBcXCovXG4gICAgUi5wYXJzZVRyYW5zZm9ybVN0cmluZyA9IGNhY2hlcihmdW5jdGlvbiAoVFN0cmluZykge1xuICAgICAgICBpZiAoIVRTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJhbUNvdW50cyA9IHtyOiAzLCBzOiA0LCB0OiAyLCBtOiA2fSxcbiAgICAgICAgICAgIGRhdGEgPSBbXTtcbiAgICAgICAgaWYgKFIuaXMoVFN0cmluZywgYXJyYXkpICYmIFIuaXMoVFN0cmluZ1swXSwgYXJyYXkpKSB7IC8vIHJvdWdoIGFzc3VtcHRpb25cbiAgICAgICAgICAgIGRhdGEgPSBwYXRoQ2xvbmUoVFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgU3RyKFRTdHJpbmcpLnJlcGxhY2UodENvbW1hbmQsIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gbG93ZXJDYXNlLmNhbGwoYik7XG4gICAgICAgICAgICAgICAgYy5yZXBsYWNlKHBhdGhWYWx1ZXMsIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGIgJiYgcGFyYW1zLnB1c2goK2IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYl1bY29uY2F0XShwYXJhbXMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEudG9TdHJpbmcgPSBSLl9wYXRoMnN0cmluZztcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSk7XG4gICAgLy8gUEFUSFNcbiAgICB2YXIgcGF0aHMgPSBmdW5jdGlvbiAocHMpIHtcbiAgICAgICAgdmFyIHAgPSBwYXRocy5wcyA9IHBhdGhzLnBzIHx8IHt9O1xuICAgICAgICBpZiAocFtwc10pIHtcbiAgICAgICAgICAgIHBbcHNdLnNsZWVwID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcFtwc10gPSB7XG4gICAgICAgICAgICAgICAgc2xlZXA6IDEwMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBwKSBpZiAocFtoYXNdKGtleSkgJiYga2V5ICE9IHBzKSB7XG4gICAgICAgICAgICAgICAgcFtrZXldLnNsZWVwLS07XG4gICAgICAgICAgICAgICAgIXBba2V5XS5zbGVlcCAmJiBkZWxldGUgcFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHBbcHNdO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZmluZERvdHNBdFNlZ21lbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogRmluZCBkb3QgY29vcmRpbmF0ZXMgb24gdGhlIGdpdmVuIGN1YmljIGJlemllciBjdXJ2ZSBhdCB0aGUgZ2l2ZW4gdC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcDF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHQgKG51bWJlcikgcG9zaXRpb24gb24gdGhlIGN1cnZlICgwLi4xKVxuICAgICA9IChvYmplY3QpIHBvaW50IGluZm9ybWF0aW9uIGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICBvICAgICBtOiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgYW5jaG9yXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgYW5jaG9yXG4gICAgIG8gICAgIH1cbiAgICAgbyAgICAgbjoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSByaWdodCBhbmNob3JcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYW5jaG9yXG4gICAgIG8gICAgIH1cbiAgICAgbyAgICAgc3RhcnQ6IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgb2YgdGhlIGN1cnZlXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHN0YXJ0IG9mIHRoZSBjdXJ2ZVxuICAgICBvICAgICB9XG4gICAgIG8gICAgIGVuZDoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBlbmQgb2YgdGhlIGN1cnZlXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGVuZCBvZiB0aGUgY3VydmVcbiAgICAgbyAgICAgfVxuICAgICBvICAgICBhbHBoYTogKG51bWJlcikgYW5nbGUgb2YgdGhlIGN1cnZlIGRlcml2YXRpdmUgYXQgdGhlIHBvaW50XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLmZpbmREb3RzQXRTZWdtZW50ID0gZnVuY3Rpb24gKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0KSB7XG4gICAgICAgIHZhciB0MSA9IDEgLSB0LFxuICAgICAgICAgICAgdDEzID0gcG93KHQxLCAzKSxcbiAgICAgICAgICAgIHQxMiA9IHBvdyh0MSwgMiksXG4gICAgICAgICAgICB0MiA9IHQgKiB0LFxuICAgICAgICAgICAgdDMgPSB0MiAqIHQsXG4gICAgICAgICAgICB4ID0gdDEzICogcDF4ICsgdDEyICogMyAqIHQgKiBjMXggKyB0MSAqIDMgKiB0ICogdCAqIGMyeCArIHQzICogcDJ4LFxuICAgICAgICAgICAgeSA9IHQxMyAqIHAxeSArIHQxMiAqIDMgKiB0ICogYzF5ICsgdDEgKiAzICogdCAqIHQgKiBjMnkgKyB0MyAqIHAyeSxcbiAgICAgICAgICAgIG14ID0gcDF4ICsgMiAqIHQgKiAoYzF4IC0gcDF4KSArIHQyICogKGMyeCAtIDIgKiBjMXggKyBwMXgpLFxuICAgICAgICAgICAgbXkgPSBwMXkgKyAyICogdCAqIChjMXkgLSBwMXkpICsgdDIgKiAoYzJ5IC0gMiAqIGMxeSArIHAxeSksXG4gICAgICAgICAgICBueCA9IGMxeCArIDIgKiB0ICogKGMyeCAtIGMxeCkgKyB0MiAqIChwMnggLSAyICogYzJ4ICsgYzF4KSxcbiAgICAgICAgICAgIG55ID0gYzF5ICsgMiAqIHQgKiAoYzJ5IC0gYzF5KSArIHQyICogKHAyeSAtIDIgKiBjMnkgKyBjMXkpLFxuICAgICAgICAgICAgYXggPSB0MSAqIHAxeCArIHQgKiBjMXgsXG4gICAgICAgICAgICBheSA9IHQxICogcDF5ICsgdCAqIGMxeSxcbiAgICAgICAgICAgIGN4ID0gdDEgKiBjMnggKyB0ICogcDJ4LFxuICAgICAgICAgICAgY3kgPSB0MSAqIGMyeSArIHQgKiBwMnksXG4gICAgICAgICAgICBhbHBoYSA9ICg5MCAtIG1hdGguYXRhbjIobXggLSBueCwgbXkgLSBueSkgKiAxODAgLyBQSSk7XG4gICAgICAgIChteCA+IG54IHx8IG15IDwgbnkpICYmIChhbHBoYSArPSAxODApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICBtOiB7eDogbXgsIHk6IG15fSxcbiAgICAgICAgICAgIG46IHt4OiBueCwgeTogbnl9LFxuICAgICAgICAgICAgc3RhcnQ6IHt4OiBheCwgeTogYXl9LFxuICAgICAgICAgICAgZW5kOiB7eDogY3gsIHk6IGN5fSxcbiAgICAgICAgICAgIGFscGhhOiBhbHBoYVxuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuYmV6aWVyQkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm4gYm91bmRpbmcgYm94IG9mIGEgZ2l2ZW4gY3ViaWMgYmV6aWVyIGN1cnZlXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHAxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgKiBvclxuICAgICAtIGJleiAoYXJyYXkpIGFycmF5IG9mIHNpeCBwb2ludHMgZm9yIGJlemllciBjdXJ2ZVxuICAgICA9IChvYmplY3QpIHBvaW50IGluZm9ybWF0aW9uIGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIG1pbjoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IHBvaW50XG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHRvcCBwb2ludFxuICAgICBvICAgICB9XG4gICAgIG8gICAgIG1heDoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSByaWdodCBwb2ludFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBib3R0b20gcG9pbnRcbiAgICAgbyAgICAgfVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgUi5iZXppZXJCQm94ID0gZnVuY3Rpb24gKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5KSB7XG4gICAgICAgIGlmICghUi5pcyhwMXgsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHAxeCA9IFtwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJib3ggPSBjdXJ2ZURpbS5hcHBseShudWxsLCBwMXgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogYmJveC5taW4ueCxcbiAgICAgICAgICAgIHk6IGJib3gubWluLnksXG4gICAgICAgICAgICB4MjogYmJveC5tYXgueCxcbiAgICAgICAgICAgIHkyOiBiYm94Lm1heC55LFxuICAgICAgICAgICAgd2lkdGg6IGJib3gubWF4LnggLSBiYm94Lm1pbi54LFxuICAgICAgICAgICAgaGVpZ2h0OiBiYm94Lm1heC55IC0gYmJveC5taW4ueVxuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuaXNQb2ludEluc2lkZUJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgZ2l2ZW4gcG9pbnQgaXMgaW5zaWRlIGJvdW5kaW5nIGJveGVzLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBiYm94IChzdHJpbmcpIGJvdW5kaW5nIGJveFxuICAgICAtIHggKHN0cmluZykgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICAtIHkgKHN0cmluZykgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgcG9pbnQgaW5zaWRlXG4gICAgXFwqL1xuICAgIFIuaXNQb2ludEluc2lkZUJCb3ggPSBmdW5jdGlvbiAoYmJveCwgeCwgeSkge1xuICAgICAgICByZXR1cm4geCA+PSBiYm94LnggJiYgeCA8PSBiYm94LngyICYmIHkgPj0gYmJveC55ICYmIHkgPD0gYmJveC55MjtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmlzQkJveEludGVyc2VjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0d28gYm91bmRpbmcgYm94ZXMgaW50ZXJzZWN0XG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGJib3gxIChzdHJpbmcpIGZpcnN0IGJvdW5kaW5nIGJveFxuICAgICAtIGJib3gyIChzdHJpbmcpIHNlY29uZCBib3VuZGluZyBib3hcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIHRoZXkgaW50ZXJzZWN0XG4gICAgXFwqL1xuICAgIFIuaXNCQm94SW50ZXJzZWN0ID0gZnVuY3Rpb24gKGJib3gxLCBiYm94Mikge1xuICAgICAgICB2YXIgaSA9IFIuaXNQb2ludEluc2lkZUJCb3g7XG4gICAgICAgIHJldHVybiBpKGJib3gyLCBiYm94MS54LCBiYm94MS55KVxuICAgICAgICAgICAgfHwgaShiYm94MiwgYmJveDEueDIsIGJib3gxLnkpXG4gICAgICAgICAgICB8fCBpKGJib3gyLCBiYm94MS54LCBiYm94MS55MilcbiAgICAgICAgICAgIHx8IGkoYmJveDIsIGJib3gxLngyLCBiYm94MS55MilcbiAgICAgICAgICAgIHx8IGkoYmJveDEsIGJib3gyLngsIGJib3gyLnkpXG4gICAgICAgICAgICB8fCBpKGJib3gxLCBiYm94Mi54MiwgYmJveDIueSlcbiAgICAgICAgICAgIHx8IGkoYmJveDEsIGJib3gyLngsIGJib3gyLnkyKVxuICAgICAgICAgICAgfHwgaShiYm94MSwgYmJveDIueDIsIGJib3gyLnkyKVxuICAgICAgICAgICAgfHwgKGJib3gxLnggPCBiYm94Mi54MiAmJiBiYm94MS54ID4gYmJveDIueCB8fCBiYm94Mi54IDwgYmJveDEueDIgJiYgYmJveDIueCA+IGJib3gxLngpXG4gICAgICAgICAgICAmJiAoYmJveDEueSA8IGJib3gyLnkyICYmIGJib3gxLnkgPiBiYm94Mi55IHx8IGJib3gyLnkgPCBiYm94MS55MiAmJiBiYm94Mi55ID4gYmJveDEueSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBiYXNlMyh0LCBwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICB2YXIgdDEgPSAtMyAqIHAxICsgOSAqIHAyIC0gOSAqIHAzICsgMyAqIHA0LFxuICAgICAgICAgICAgdDIgPSB0ICogdDEgKyA2ICogcDEgLSAxMiAqIHAyICsgNiAqIHAzO1xuICAgICAgICByZXR1cm4gdCAqIHQyIC0gMyAqIHAxICsgMyAqIHAyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCB6KSB7XG4gICAgICAgIGlmICh6ID09IG51bGwpIHtcbiAgICAgICAgICAgIHogPSAxO1xuICAgICAgICB9XG4gICAgICAgIHogPSB6ID4gMSA/IDEgOiB6IDwgMCA/IDAgOiB6O1xuICAgICAgICB2YXIgejIgPSB6IC8gMixcbiAgICAgICAgICAgIG4gPSAxMixcbiAgICAgICAgICAgIFR2YWx1ZXMgPSBbLTAuMTI1MiwwLjEyNTIsLTAuMzY3OCwwLjM2NzgsLTAuNTg3MywwLjU4NzMsLTAuNzY5OSwwLjc2OTksLTAuOTA0MSwwLjkwNDEsLTAuOTgxNiwwLjk4MTZdLFxuICAgICAgICAgICAgQ3ZhbHVlcyA9IFswLjI0OTEsMC4yNDkxLDAuMjMzNSwwLjIzMzUsMC4yMDMyLDAuMjAzMiwwLjE2MDEsMC4xNjAxLDAuMTA2OSwwLjEwNjksMC4wNDcyLDAuMDQ3Ml0sXG4gICAgICAgICAgICBzdW0gPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdmFyIGN0ID0gejIgKiBUdmFsdWVzW2ldICsgejIsXG4gICAgICAgICAgICAgICAgeGJhc2UgPSBiYXNlMyhjdCwgeDEsIHgyLCB4MywgeDQpLFxuICAgICAgICAgICAgICAgIHliYXNlID0gYmFzZTMoY3QsIHkxLCB5MiwgeTMsIHk0KSxcbiAgICAgICAgICAgICAgICBjb21iID0geGJhc2UgKiB4YmFzZSArIHliYXNlICogeWJhc2U7XG4gICAgICAgICAgICBzdW0gKz0gQ3ZhbHVlc1tpXSAqIG1hdGguc3FydChjb21iKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gejIgKiBzdW07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFRhdExlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIGxsKSB7XG4gICAgICAgIGlmIChsbCA8IDAgfHwgYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCkgPCBsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0gMSxcbiAgICAgICAgICAgIHN0ZXAgPSB0IC8gMixcbiAgICAgICAgICAgIHQyID0gdCAtIHN0ZXAsXG4gICAgICAgICAgICBsLFxuICAgICAgICAgICAgZSA9IC4wMTtcbiAgICAgICAgbCA9IGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIHQyKTtcbiAgICAgICAgd2hpbGUgKGFicyhsIC0gbGwpID4gZSkge1xuICAgICAgICAgICAgc3RlcCAvPSAyO1xuICAgICAgICAgICAgdDIgKz0gKGwgPCBsbCA/IDEgOiAtMSkgKiBzdGVwO1xuICAgICAgICAgICAgbCA9IGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIHQyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyc2VjdCh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbW1heCh4MSwgeDIpIDwgbW1pbih4MywgeDQpIHx8XG4gICAgICAgICAgICBtbWluKHgxLCB4MikgPiBtbWF4KHgzLCB4NCkgfHxcbiAgICAgICAgICAgIG1tYXgoeTEsIHkyKSA8IG1taW4oeTMsIHk0KSB8fFxuICAgICAgICAgICAgbW1pbih5MSwgeTIpID4gbW1heCh5MywgeTQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBueCA9ICh4MSAqIHkyIC0geTEgKiB4MikgKiAoeDMgLSB4NCkgLSAoeDEgLSB4MikgKiAoeDMgKiB5NCAtIHkzICogeDQpLFxuICAgICAgICAgICAgbnkgPSAoeDEgKiB5MiAtIHkxICogeDIpICogKHkzIC0geTQpIC0gKHkxIC0geTIpICogKHgzICogeTQgLSB5MyAqIHg0KSxcbiAgICAgICAgICAgIGRlbm9taW5hdG9yID0gKHgxIC0geDIpICogKHkzIC0geTQpIC0gKHkxIC0geTIpICogKHgzIC0geDQpO1xuXG4gICAgICAgIGlmICghZGVub21pbmF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHggPSBueCAvIGRlbm9taW5hdG9yLFxuICAgICAgICAgICAgcHkgPSBueSAvIGRlbm9taW5hdG9yLFxuICAgICAgICAgICAgcHgyID0gK3B4LnRvRml4ZWQoMiksXG4gICAgICAgICAgICBweTIgPSArcHkudG9GaXhlZCgyKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgcHgyIDwgK21taW4oeDEsIHgyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweDIgPiArbW1heCh4MSwgeDIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB4MiA8ICttbWluKHgzLCB4NCkudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHgyID4gK21tYXgoeDMsIHg0KS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPCArbW1pbih5MSwgeTIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA+ICttbWF4KHkxLCB5MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyIDwgK21taW4oeTMsIHk0KS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPiArbW1heCh5MywgeTQpLnRvRml4ZWQoMilcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt4OiBweCwgeTogcHl9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlcihiZXoxLCBiZXoyKSB7XG4gICAgICAgIHJldHVybiBpbnRlckhlbHBlcihiZXoxLCBiZXoyKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXJDb3VudChiZXoxLCBiZXoyKSB7XG4gICAgICAgIHJldHVybiBpbnRlckhlbHBlcihiZXoxLCBiZXoyLCAxKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXJIZWxwZXIoYmV6MSwgYmV6MiwganVzdENvdW50KSB7XG4gICAgICAgIHZhciBiYm94MSA9IFIuYmV6aWVyQkJveChiZXoxKSxcbiAgICAgICAgICAgIGJib3gyID0gUi5iZXppZXJCQm94KGJlejIpO1xuICAgICAgICBpZiAoIVIuaXNCQm94SW50ZXJzZWN0KGJib3gxLCBiYm94MikpIHtcbiAgICAgICAgICAgIHJldHVybiBqdXN0Q291bnQgPyAwIDogW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGwxID0gYmV6bGVuLmFwcGx5KDAsIGJlejEpLFxuICAgICAgICAgICAgbDIgPSBiZXpsZW4uYXBwbHkoMCwgYmV6MiksXG4gICAgICAgICAgICBuMSA9IG1tYXgofn4obDEgLyA1KSwgMSksXG4gICAgICAgICAgICBuMiA9IG1tYXgofn4obDIgLyA1KSwgMSksXG4gICAgICAgICAgICBkb3RzMSA9IFtdLFxuICAgICAgICAgICAgZG90czIgPSBbXSxcbiAgICAgICAgICAgIHh5ID0ge30sXG4gICAgICAgICAgICByZXMgPSBqdXN0Q291bnQgPyAwIDogW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjEgKyAxOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwID0gUi5maW5kRG90c0F0U2VnbWVudC5hcHBseShSLCBiZXoxLmNvbmNhdChpIC8gbjEpKTtcbiAgICAgICAgICAgIGRvdHMxLnB1c2goe3g6IHAueCwgeTogcC55LCB0OiBpIC8gbjF9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjIgKyAxOyBpKyspIHtcbiAgICAgICAgICAgIHAgPSBSLmZpbmREb3RzQXRTZWdtZW50LmFwcGx5KFIsIGJlejIuY29uY2F0KGkgLyBuMikpO1xuICAgICAgICAgICAgZG90czIucHVzaCh7eDogcC54LCB5OiBwLnksIHQ6IGkgLyBuMn0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG4yOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZGkgPSBkb3RzMVtpXSxcbiAgICAgICAgICAgICAgICAgICAgZGkxID0gZG90czFbaSArIDFdLFxuICAgICAgICAgICAgICAgICAgICBkaiA9IGRvdHMyW2pdLFxuICAgICAgICAgICAgICAgICAgICBkajEgPSBkb3RzMltqICsgMV0sXG4gICAgICAgICAgICAgICAgICAgIGNpID0gYWJzKGRpMS54IC0gZGkueCkgPCAuMDAxID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgY2ogPSBhYnMoZGoxLnggLSBkai54KSA8IC4wMDEgPyBcInlcIiA6IFwieFwiLFxuICAgICAgICAgICAgICAgICAgICBpcyA9IGludGVyc2VjdChkaS54LCBkaS55LCBkaTEueCwgZGkxLnksIGRqLngsIGRqLnksIGRqMS54LCBkajEueSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4eVtpcy54LnRvRml4ZWQoNCldID09IGlzLnkudG9GaXhlZCg0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgeHlbaXMueC50b0ZpeGVkKDQpXSA9IGlzLnkudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gZGkudCArIGFicygoaXNbY2ldIC0gZGlbY2ldKSAvIChkaTFbY2ldIC0gZGlbY2ldKSkgKiAoZGkxLnQgLSBkaS50KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHQyID0gZGoudCArIGFicygoaXNbY2pdIC0gZGpbY2pdKSAvIChkajFbY2pdIC0gZGpbY2pdKSkgKiAoZGoxLnQgLSBkai50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQxID49IDAgJiYgdDEgPD0gMS4wMDEgJiYgdDIgPj0gMCAmJiB0MiA8PSAxLjAwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGp1c3RDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGlzLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGlzLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQxOiBtbWluKHQxLCAxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdDI6IG1taW4odDIsIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucGF0aEludGVyc2VjdGlvblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBGaW5kcyBpbnRlcnNlY3Rpb25zIG9mIHR3byBwYXRoc1xuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwYXRoMSAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAtIHBhdGgyIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgID0gKGFycmF5KSBkb3RzIG9mIGludGVyc2VjdGlvblxuICAgICBvIFtcbiAgICAgbyAgICAge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICBvICAgICAgICAgdDE6IChudW1iZXIpIHQgdmFsdWUgZm9yIHNlZ21lbnQgb2YgcGF0aDFcbiAgICAgbyAgICAgICAgIHQyOiAobnVtYmVyKSB0IHZhbHVlIGZvciBzZWdtZW50IG9mIHBhdGgyXG4gICAgIG8gICAgICAgICBzZWdtZW50MTogKG51bWJlcikgb3JkZXIgbnVtYmVyIGZvciBzZWdtZW50IG9mIHBhdGgxXG4gICAgIG8gICAgICAgICBzZWdtZW50MjogKG51bWJlcikgb3JkZXIgbnVtYmVyIGZvciBzZWdtZW50IG9mIHBhdGgyXG4gICAgIG8gICAgICAgICBiZXoxOiAoYXJyYXkpIGVpZ2h0IGNvb3JkaW5hdGVzIHJlcHJlc2VudGluZyBiZXppw6lyIGN1cnZlIGZvciB0aGUgc2VnbWVudCBvZiBwYXRoMVxuICAgICBvICAgICAgICAgYmV6MjogKGFycmF5KSBlaWdodCBjb29yZGluYXRlcyByZXByZXNlbnRpbmcgYmV6acOpciBjdXJ2ZSBmb3IgdGhlIHNlZ21lbnQgb2YgcGF0aDJcbiAgICAgbyAgICAgfVxuICAgICBvIF1cbiAgICBcXCovXG4gICAgUi5wYXRoSW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKHBhdGgxLCBwYXRoMikge1xuICAgICAgICByZXR1cm4gaW50ZXJQYXRoSGVscGVyKHBhdGgxLCBwYXRoMik7XG4gICAgfTtcbiAgICBSLnBhdGhJbnRlcnNlY3Rpb25OdW1iZXIgPSBmdW5jdGlvbiAocGF0aDEsIHBhdGgyKSB7XG4gICAgICAgIHJldHVybiBpbnRlclBhdGhIZWxwZXIocGF0aDEsIHBhdGgyLCAxKTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGludGVyUGF0aEhlbHBlcihwYXRoMSwgcGF0aDIsIGp1c3RDb3VudCkge1xuICAgICAgICBwYXRoMSA9IFIuX3BhdGgyY3VydmUocGF0aDEpO1xuICAgICAgICBwYXRoMiA9IFIuX3BhdGgyY3VydmUocGF0aDIpO1xuICAgICAgICB2YXIgeDEsIHkxLCB4MiwgeTIsIHgxbSwgeTFtLCB4Mm0sIHkybSwgYmV6MSwgYmV6MixcbiAgICAgICAgICAgIHJlcyA9IGp1c3RDb3VudCA/IDAgOiBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGF0aDEubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBpID0gcGF0aDFbaV07XG4gICAgICAgICAgICBpZiAocGlbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICB4MSA9IHgxbSA9IHBpWzFdO1xuICAgICAgICAgICAgICAgIHkxID0geTFtID0gcGlbMl07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChwaVswXSA9PSBcIkNcIikge1xuICAgICAgICAgICAgICAgICAgICBiZXoxID0gW3gxLCB5MV0uY29uY2F0KHBpLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgeDEgPSBiZXoxWzZdO1xuICAgICAgICAgICAgICAgICAgICB5MSA9IGJlejFbN107XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYmV6MSA9IFt4MSwgeTEsIHgxLCB5MSwgeDFtLCB5MW0sIHgxbSwgeTFtXTtcbiAgICAgICAgICAgICAgICAgICAgeDEgPSB4MW07XG4gICAgICAgICAgICAgICAgICAgIHkxID0geTFtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgamogPSBwYXRoMi5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwaiA9IHBhdGgyW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGpbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0geDJtID0gcGpbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkybSA9IHBqWzJdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBqWzBdID09IFwiQ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmV6MiA9IFt4MiwgeTJdLmNvbmNhdChwai5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBiZXoyWzZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gYmV6Mls3XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmV6MiA9IFt4MiwgeTIsIHgyLCB5MiwgeDJtLCB5Mm0sIHgybSwgeTJtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MiA9IHgybTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkybTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnRyID0gaW50ZXJIZWxwZXIoYmV6MSwgYmV6MiwganVzdENvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqdXN0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gaW50cjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDAsIGtrID0gaW50ci5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uc2VnbWVudDEgPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLnNlZ21lbnQyID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5iZXoxID0gYmV6MTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5iZXoyID0gYmV6MjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChpbnRyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5pc1BvaW50SW5zaWRlUGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBnaXZlbiBwb2ludCBpcyBpbnNpZGUgYSBnaXZlbiBjbG9zZWQgcGF0aC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAtIHggKG51bWJlcikgeCBvZiB0aGUgcG9pbnRcbiAgICAgLSB5IChudW1iZXIpIHkgb2YgdGhlIHBvaW50XG4gICAgID0gKGJvb2xlYW4pIHRydWUsIGlmIHBvaW50IGlzIGluc2lkZSB0aGUgcGF0aFxuICAgIFxcKi9cbiAgICBSLmlzUG9pbnRJbnNpZGVQYXRoID0gZnVuY3Rpb24gKHBhdGgsIHgsIHkpIHtcbiAgICAgICAgdmFyIGJib3ggPSBSLnBhdGhCQm94KHBhdGgpO1xuICAgICAgICByZXR1cm4gUi5pc1BvaW50SW5zaWRlQkJveChiYm94LCB4LCB5KSAmJlxuICAgICAgICAgICAgICAgaW50ZXJQYXRoSGVscGVyKHBhdGgsIFtbXCJNXCIsIHgsIHldLCBbXCJIXCIsIGJib3gueDIgKyAxMF1dLCAxKSAlIDIgPT0gMTtcbiAgICB9O1xuICAgIFIuX3JlbW92ZWRGYWN0b3J5ID0gZnVuY3Rpb24gKG1ldGhvZG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV2ZShcInJhcGhhZWwubG9nXCIsIG51bGwsIFwiUmFwaGFcXHhlYmw6IHlvdSBhcmUgY2FsbGluZyB0byBtZXRob2QgXFx1MjAxY1wiICsgbWV0aG9kbmFtZSArIFwiXFx1MjAxZCBvZiByZW1vdmVkIG9iamVjdFwiLCBtZXRob2RuYW1lKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLnBhdGhCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybiBib3VuZGluZyBib3ggb2YgYSBnaXZlbiBwYXRoXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgPSAob2JqZWN0KSBib3VuZGluZyBib3hcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCB0b3AgcG9pbnQgb2YgdGhlIGJveFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgdG9wIHBvaW50IG9mIHRoZSBib3hcbiAgICAgbyAgICAgeDI6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYm90dG9tIHBvaW50IG9mIHRoZSBib3hcbiAgICAgbyAgICAgeTI6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYm90dG9tIHBvaW50IG9mIHRoZSBib3hcbiAgICAgbyAgICAgd2lkdGg6IChudW1iZXIpIHdpZHRoIG9mIHRoZSBib3hcbiAgICAgbyAgICAgaGVpZ2h0OiAobnVtYmVyKSBoZWlnaHQgb2YgdGhlIGJveFxuICAgICBvICAgICBjeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIGJveFxuICAgICBvICAgICBjeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBjZW50ZXIgb2YgdGhlIGJveFxuICAgICBvIH1cbiAgICBcXCovXG4gICAgdmFyIHBhdGhEaW1lbnNpb25zID0gUi5wYXRoQkJveCA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHZhciBwdGggPSBwYXRocyhwYXRoKTtcbiAgICAgICAgaWYgKHB0aC5iYm94KSB7XG4gICAgICAgICAgICByZXR1cm4gY2xvbmUocHRoLmJib3gpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHt4OiAwLCB5OiAwLCB3aWR0aDogMCwgaGVpZ2h0OiAwLCB4MjogMCwgeTI6IDB9O1xuICAgICAgICB9XG4gICAgICAgIHBhdGggPSBwYXRoMmN1cnZlKHBhdGgpO1xuICAgICAgICB2YXIgeCA9IDAsXG4gICAgICAgICAgICB5ID0gMCxcbiAgICAgICAgICAgIFggPSBbXSxcbiAgICAgICAgICAgIFkgPSBbXSxcbiAgICAgICAgICAgIHA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcCA9IHBhdGhbaV07XG4gICAgICAgICAgICBpZiAocFswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgIHggPSBwWzFdO1xuICAgICAgICAgICAgICAgIHkgPSBwWzJdO1xuICAgICAgICAgICAgICAgIFgucHVzaCh4KTtcbiAgICAgICAgICAgICAgICBZLnB1c2goeSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBkaW0gPSBjdXJ2ZURpbSh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdKTtcbiAgICAgICAgICAgICAgICBYID0gWFtjb25jYXRdKGRpbS5taW4ueCwgZGltLm1heC54KTtcbiAgICAgICAgICAgICAgICBZID0gWVtjb25jYXRdKGRpbS5taW4ueSwgZGltLm1heC55KTtcbiAgICAgICAgICAgICAgICB4ID0gcFs1XTtcbiAgICAgICAgICAgICAgICB5ID0gcFs2XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgeG1pbiA9IG1taW5bYXBwbHldKDAsIFgpLFxuICAgICAgICAgICAgeW1pbiA9IG1taW5bYXBwbHldKDAsIFkpLFxuICAgICAgICAgICAgeG1heCA9IG1tYXhbYXBwbHldKDAsIFgpLFxuICAgICAgICAgICAgeW1heCA9IG1tYXhbYXBwbHldKDAsIFkpLFxuICAgICAgICAgICAgd2lkdGggPSB4bWF4IC0geG1pbixcbiAgICAgICAgICAgIGhlaWdodCA9IHltYXggLSB5bWluLFxuICAgICAgICAgICAgICAgIGJiID0ge1xuICAgICAgICAgICAgICAgIHg6IHhtaW4sXG4gICAgICAgICAgICAgICAgeTogeW1pbixcbiAgICAgICAgICAgICAgICB4MjogeG1heCxcbiAgICAgICAgICAgICAgICB5MjogeW1heCxcbiAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgY3g6IHhtaW4gKyB3aWR0aCAvIDIsXG4gICAgICAgICAgICAgICAgY3k6IHltaW4gKyBoZWlnaHQgLyAyXG4gICAgICAgICAgICB9O1xuICAgICAgICBwdGguYmJveCA9IGNsb25lKGJiKTtcbiAgICAgICAgcmV0dXJuIGJiO1xuICAgIH0sXG4gICAgICAgIHBhdGhDbG9uZSA9IGZ1bmN0aW9uIChwYXRoQXJyYXkpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBjbG9uZShwYXRoQXJyYXkpO1xuICAgICAgICAgICAgcmVzLnRvU3RyaW5nID0gUi5fcGF0aDJzdHJpbmc7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9LFxuICAgICAgICBwYXRoVG9SZWxhdGl2ZSA9IFIuX3BhdGhUb1JlbGF0aXZlID0gZnVuY3Rpb24gKHBhdGhBcnJheSkge1xuICAgICAgICAgICAgdmFyIHB0aCA9IHBhdGhzKHBhdGhBcnJheSk7XG4gICAgICAgICAgICBpZiAocHRoLnJlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoQ2xvbmUocHRoLnJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIVIuaXMocGF0aEFycmF5LCBhcnJheSkgfHwgIVIuaXMocGF0aEFycmF5ICYmIHBhdGhBcnJheVswXSwgYXJyYXkpKSB7IC8vIHJvdWdoIGFzc3VtcHRpb25cbiAgICAgICAgICAgICAgICBwYXRoQXJyYXkgPSBSLnBhcnNlUGF0aFN0cmluZyhwYXRoQXJyYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlcyA9IFtdLFxuICAgICAgICAgICAgICAgIHggPSAwLFxuICAgICAgICAgICAgICAgIHkgPSAwLFxuICAgICAgICAgICAgICAgIG14ID0gMCxcbiAgICAgICAgICAgICAgICBteSA9IDAsXG4gICAgICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICAgICAgaWYgKHBhdGhBcnJheVswXVswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgIHggPSBwYXRoQXJyYXlbMF1bMV07XG4gICAgICAgICAgICAgICAgeSA9IHBhdGhBcnJheVswXVsyXTtcbiAgICAgICAgICAgICAgICBteCA9IHg7XG4gICAgICAgICAgICAgICAgbXkgPSB5O1xuICAgICAgICAgICAgICAgIHN0YXJ0Kys7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2goW1wiTVwiLCB4LCB5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQsIGlpID0gcGF0aEFycmF5Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHJlc1tpXSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBwYSA9IHBhdGhBcnJheVtpXTtcbiAgICAgICAgICAgICAgICBpZiAocGFbMF0gIT0gbG93ZXJDYXNlLmNhbGwocGFbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJbMF0gPSBsb3dlckNhc2UuY2FsbChwYVswXSk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoclswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gcGFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclsyXSA9IHBhWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbM10gPSBwYVszXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzRdID0gcGFbNF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls1XSA9IHBhWzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbNl0gPSArKHBhWzZdIC0geCkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzddID0gKyhwYVs3XSAtIHkpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSArKHBhWzFdIC0geSkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXggPSBwYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteSA9IHBhWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMSwgamogPSBwYS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbal0gPSArKHBhW2pdIC0gKChqICUgMikgPyB4IDogeSkpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgciA9IHJlc1tpXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFbMF0gPT0gXCJtXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG14ID0gcGFbMV0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbXkgPSBwYVsyXSArIHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDAsIGtrID0gcGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzW2ldW2tdID0gcGFba107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IHJlc1tpXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyZXNbaV1bMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBteDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSBteTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeCArPSArcmVzW2ldW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB5ICs9ICtyZXNbaV1bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggKz0gK3Jlc1tpXVtsZW4gLSAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gK3Jlc1tpXVtsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMudG9TdHJpbmcgPSBSLl9wYXRoMnN0cmluZztcbiAgICAgICAgICAgIHB0aC5yZWwgPSBwYXRoQ2xvbmUocmVzKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0sXG4gICAgICAgIHBhdGhUb0Fic29sdXRlID0gUi5fcGF0aFRvQWJzb2x1dGUgPSBmdW5jdGlvbiAocGF0aEFycmF5KSB7XG4gICAgICAgICAgICB2YXIgcHRoID0gcGF0aHMocGF0aEFycmF5KTtcbiAgICAgICAgICAgIGlmIChwdGguYWJzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhDbG9uZShwdGguYWJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghUi5pcyhwYXRoQXJyYXksIGFycmF5KSB8fCAhUi5pcyhwYXRoQXJyYXkgJiYgcGF0aEFycmF5WzBdLCBhcnJheSkpIHsgLy8gcm91Z2ggYXNzdW1wdGlvblxuICAgICAgICAgICAgICAgIHBhdGhBcnJheSA9IFIucGFyc2VQYXRoU3RyaW5nKHBhdGhBcnJheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXBhdGhBcnJheSB8fCAhcGF0aEFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbW1wiTVwiLCAwLCAwXV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVzID0gW10sXG4gICAgICAgICAgICAgICAgeCA9IDAsXG4gICAgICAgICAgICAgICAgeSA9IDAsXG4gICAgICAgICAgICAgICAgbXggPSAwLFxuICAgICAgICAgICAgICAgIG15ID0gMCxcbiAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICBpZiAocGF0aEFycmF5WzBdWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgeCA9ICtwYXRoQXJyYXlbMF1bMV07XG4gICAgICAgICAgICAgICAgeSA9ICtwYXRoQXJyYXlbMF1bMl07XG4gICAgICAgICAgICAgICAgbXggPSB4O1xuICAgICAgICAgICAgICAgIG15ID0geTtcbiAgICAgICAgICAgICAgICBzdGFydCsrO1xuICAgICAgICAgICAgICAgIHJlc1swXSA9IFtcIk1cIiwgeCwgeV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY3J6ID0gcGF0aEFycmF5Lmxlbmd0aCA9PSAzICYmIHBhdGhBcnJheVswXVswXSA9PSBcIk1cIiAmJiBwYXRoQXJyYXlbMV1bMF0udG9VcHBlckNhc2UoKSA9PSBcIlJcIiAmJiBwYXRoQXJyYXlbMl1bMF0udG9VcHBlckNhc2UoKSA9PSBcIlpcIjtcbiAgICAgICAgICAgIGZvciAodmFyIHIsIHBhLCBpID0gc3RhcnQsIGlpID0gcGF0aEFycmF5Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaChyID0gW10pO1xuICAgICAgICAgICAgICAgIHBhID0gcGF0aEFycmF5W2ldO1xuICAgICAgICAgICAgICAgIGlmIChwYVswXSAhPSB1cHBlckNhc2UuY2FsbChwYVswXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgclswXSA9IHVwcGVyQ2FzZS5jYWxsKHBhWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSBwYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzJdID0gcGFbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclszXSA9IHBhWzNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbNF0gPSBwYVs0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzVdID0gcGFbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcls2XSA9ICsocGFbNl0gKyB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzddID0gKyhwYVs3XSArIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gK3BhWzFdICsgeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9ICtwYVsxXSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkb3RzID0gW3gsIHldW2NvbmNhdF0ocGEuc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAyLCBqaiA9IGRvdHMubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb3RzW2pdID0gK2RvdHNbal0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb3RzWysral0gPSArZG90c1tqXSArIHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXNbY29uY2F0XShjYXRtdWxsUm9tMmJlemllcihkb3RzLCBjcnopKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXggPSArcGFbMV0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG15ID0gK3BhWzJdICsgeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgamogPSBwYS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbal0gPSArcGFbal0gKyAoKGogJSAyKSA/IHggOiB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhWzBdID09IFwiUlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvdHMgPSBbeCwgeV1bY29uY2F0XShwYS5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzW2NvbmNhdF0oY2F0bXVsbFJvbTJiZXppZXIoZG90cywgY3J6KSk7XG4gICAgICAgICAgICAgICAgICAgIHIgPSBbXCJSXCJdW2NvbmNhdF0ocGEuc2xpY2UoLTIpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMCwga2sgPSBwYS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByW2tdID0gcGFba107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gbXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gbXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSByWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJWXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gclsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbXggPSByW3IubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBteSA9IHJbci5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSByW3IubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gcltyLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy50b1N0cmluZyA9IFIuX3BhdGgyc3RyaW5nO1xuICAgICAgICAgICAgcHRoLmFicyA9IHBhdGhDbG9uZShyZXMpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSxcbiAgICAgICAgbDJjID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgICAgICByZXR1cm4gW3gxLCB5MSwgeDIsIHkyLCB4MiwgeTJdO1xuICAgICAgICB9LFxuICAgICAgICBxMmMgPSBmdW5jdGlvbiAoeDEsIHkxLCBheCwgYXksIHgyLCB5Mikge1xuICAgICAgICAgICAgdmFyIF8xMyA9IDEgLyAzLFxuICAgICAgICAgICAgICAgIF8yMyA9IDIgLyAzO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgXzEzICogeDEgKyBfMjMgKiBheCxcbiAgICAgICAgICAgICAgICAgICAgXzEzICogeTEgKyBfMjMgKiBheSxcbiAgICAgICAgICAgICAgICAgICAgXzEzICogeDIgKyBfMjMgKiBheCxcbiAgICAgICAgICAgICAgICAgICAgXzEzICogeTIgKyBfMjMgKiBheSxcbiAgICAgICAgICAgICAgICAgICAgeDIsXG4gICAgICAgICAgICAgICAgICAgIHkyXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICAgICAgYTJjID0gZnVuY3Rpb24gKHgxLCB5MSwgcngsIHJ5LCBhbmdsZSwgbGFyZ2VfYXJjX2ZsYWcsIHN3ZWVwX2ZsYWcsIHgyLCB5MiwgcmVjdXJzaXZlKSB7XG4gICAgICAgICAgICAvLyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvZiB3aGVyZSB0aGlzIG1hdGggY2FtZSBmcm9tIHZpc2l0OlxuICAgICAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvaW1wbG5vdGUuaHRtbCNBcmNJbXBsZW1lbnRhdGlvbk5vdGVzXG4gICAgICAgICAgICB2YXIgXzEyMCA9IFBJICogMTIwIC8gMTgwLFxuICAgICAgICAgICAgICAgIHJhZCA9IFBJIC8gMTgwICogKCthbmdsZSB8fCAwKSxcbiAgICAgICAgICAgICAgICByZXMgPSBbXSxcbiAgICAgICAgICAgICAgICB4eSxcbiAgICAgICAgICAgICAgICByb3RhdGUgPSBjYWNoZXIoZnVuY3Rpb24gKHgsIHksIHJhZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgWCA9IHggKiBtYXRoLmNvcyhyYWQpIC0geSAqIG1hdGguc2luKHJhZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBZID0geCAqIG1hdGguc2luKHJhZCkgKyB5ICogbWF0aC5jb3MocmFkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHt4OiBYLCB5OiBZfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghcmVjdXJzaXZlKSB7XG4gICAgICAgICAgICAgICAgeHkgPSByb3RhdGUoeDEsIHkxLCAtcmFkKTtcbiAgICAgICAgICAgICAgICB4MSA9IHh5Lng7XG4gICAgICAgICAgICAgICAgeTEgPSB4eS55O1xuICAgICAgICAgICAgICAgIHh5ID0gcm90YXRlKHgyLCB5MiwgLXJhZCk7XG4gICAgICAgICAgICAgICAgeDIgPSB4eS54O1xuICAgICAgICAgICAgICAgIHkyID0geHkueTtcbiAgICAgICAgICAgICAgICB2YXIgY29zID0gbWF0aC5jb3MoUEkgLyAxODAgKiBhbmdsZSksXG4gICAgICAgICAgICAgICAgICAgIHNpbiA9IG1hdGguc2luKFBJIC8gMTgwICogYW5nbGUpLFxuICAgICAgICAgICAgICAgICAgICB4ID0gKHgxIC0geDIpIC8gMixcbiAgICAgICAgICAgICAgICAgICAgeSA9ICh5MSAtIHkyKSAvIDI7XG4gICAgICAgICAgICAgICAgdmFyIGggPSAoeCAqIHgpIC8gKHJ4ICogcngpICsgKHkgKiB5KSAvIChyeSAqIHJ5KTtcbiAgICAgICAgICAgICAgICBpZiAoaCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaCA9IG1hdGguc3FydChoKTtcbiAgICAgICAgICAgICAgICAgICAgcnggPSBoICogcng7XG4gICAgICAgICAgICAgICAgICAgIHJ5ID0gaCAqIHJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcngyID0gcnggKiByeCxcbiAgICAgICAgICAgICAgICAgICAgcnkyID0gcnkgKiByeSxcbiAgICAgICAgICAgICAgICAgICAgayA9IChsYXJnZV9hcmNfZmxhZyA9PSBzd2VlcF9mbGFnID8gLTEgOiAxKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRoLnNxcnQoYWJzKChyeDIgKiByeTIgLSByeDIgKiB5ICogeSAtIHJ5MiAqIHggKiB4KSAvIChyeDIgKiB5ICogeSArIHJ5MiAqIHggKiB4KSkpLFxuICAgICAgICAgICAgICAgICAgICBjeCA9IGsgKiByeCAqIHkgLyByeSArICh4MSArIHgyKSAvIDIsXG4gICAgICAgICAgICAgICAgICAgIGN5ID0gayAqIC1yeSAqIHggLyByeCArICh5MSArIHkyKSAvIDIsXG4gICAgICAgICAgICAgICAgICAgIGYxID0gbWF0aC5hc2luKCgoeTEgLSBjeSkgLyByeSkudG9GaXhlZCg5KSksXG4gICAgICAgICAgICAgICAgICAgIGYyID0gbWF0aC5hc2luKCgoeTIgLSBjeSkgLyByeSkudG9GaXhlZCg5KSk7XG5cbiAgICAgICAgICAgICAgICBmMSA9IHgxIDwgY3ggPyBQSSAtIGYxIDogZjE7XG4gICAgICAgICAgICAgICAgZjIgPSB4MiA8IGN4ID8gUEkgLSBmMiA6IGYyO1xuICAgICAgICAgICAgICAgIGYxIDwgMCAmJiAoZjEgPSBQSSAqIDIgKyBmMSk7XG4gICAgICAgICAgICAgICAgZjIgPCAwICYmIChmMiA9IFBJICogMiArIGYyKTtcbiAgICAgICAgICAgICAgICBpZiAoc3dlZXBfZmxhZyAmJiBmMSA+IGYyKSB7XG4gICAgICAgICAgICAgICAgICAgIGYxID0gZjEgLSBQSSAqIDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghc3dlZXBfZmxhZyAmJiBmMiA+IGYxKSB7XG4gICAgICAgICAgICAgICAgICAgIGYyID0gZjIgLSBQSSAqIDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmMSA9IHJlY3Vyc2l2ZVswXTtcbiAgICAgICAgICAgICAgICBmMiA9IHJlY3Vyc2l2ZVsxXTtcbiAgICAgICAgICAgICAgICBjeCA9IHJlY3Vyc2l2ZVsyXTtcbiAgICAgICAgICAgICAgICBjeSA9IHJlY3Vyc2l2ZVszXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkZiA9IGYyIC0gZjE7XG4gICAgICAgICAgICBpZiAoYWJzKGRmKSA+IF8xMjApIHtcbiAgICAgICAgICAgICAgICB2YXIgZjJvbGQgPSBmMixcbiAgICAgICAgICAgICAgICAgICAgeDJvbGQgPSB4MixcbiAgICAgICAgICAgICAgICAgICAgeTJvbGQgPSB5MjtcbiAgICAgICAgICAgICAgICBmMiA9IGYxICsgXzEyMCAqIChzd2VlcF9mbGFnICYmIGYyID4gZjEgPyAxIDogLTEpO1xuICAgICAgICAgICAgICAgIHgyID0gY3ggKyByeCAqIG1hdGguY29zKGYyKTtcbiAgICAgICAgICAgICAgICB5MiA9IGN5ICsgcnkgKiBtYXRoLnNpbihmMik7XG4gICAgICAgICAgICAgICAgcmVzID0gYTJjKHgyLCB5MiwgcngsIHJ5LCBhbmdsZSwgMCwgc3dlZXBfZmxhZywgeDJvbGQsIHkyb2xkLCBbZjIsIGYyb2xkLCBjeCwgY3ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRmID0gZjIgLSBmMTtcbiAgICAgICAgICAgIHZhciBjMSA9IG1hdGguY29zKGYxKSxcbiAgICAgICAgICAgICAgICBzMSA9IG1hdGguc2luKGYxKSxcbiAgICAgICAgICAgICAgICBjMiA9IG1hdGguY29zKGYyKSxcbiAgICAgICAgICAgICAgICBzMiA9IG1hdGguc2luKGYyKSxcbiAgICAgICAgICAgICAgICB0ID0gbWF0aC50YW4oZGYgLyA0KSxcbiAgICAgICAgICAgICAgICBoeCA9IDQgLyAzICogcnggKiB0LFxuICAgICAgICAgICAgICAgIGh5ID0gNCAvIDMgKiByeSAqIHQsXG4gICAgICAgICAgICAgICAgbTEgPSBbeDEsIHkxXSxcbiAgICAgICAgICAgICAgICBtMiA9IFt4MSArIGh4ICogczEsIHkxIC0gaHkgKiBjMV0sXG4gICAgICAgICAgICAgICAgbTMgPSBbeDIgKyBoeCAqIHMyLCB5MiAtIGh5ICogYzJdLFxuICAgICAgICAgICAgICAgIG00ID0gW3gyLCB5Ml07XG4gICAgICAgICAgICBtMlswXSA9IDIgKiBtMVswXSAtIG0yWzBdO1xuICAgICAgICAgICAgbTJbMV0gPSAyICogbTFbMV0gLSBtMlsxXTtcbiAgICAgICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW20yLCBtMywgbTRdW2NvbmNhdF0ocmVzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzID0gW20yLCBtMywgbTRdW2NvbmNhdF0ocmVzKS5qb2luKClbc3BsaXRdKFwiLFwiKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3cmVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcmVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3cmVzW2ldID0gaSAlIDIgPyByb3RhdGUocmVzW2kgLSAxXSwgcmVzW2ldLCByYWQpLnkgOiByb3RhdGUocmVzW2ldLCByZXNbaSArIDFdLCByYWQpLng7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdyZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmREb3RBdFNlZ21lbnQgPSBmdW5jdGlvbiAocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQpIHtcbiAgICAgICAgICAgIHZhciB0MSA9IDEgLSB0O1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBwb3codDEsIDMpICogcDF4ICsgcG93KHQxLCAyKSAqIDMgKiB0ICogYzF4ICsgdDEgKiAzICogdCAqIHQgKiBjMnggKyBwb3codCwgMykgKiBwMngsXG4gICAgICAgICAgICAgICAgeTogcG93KHQxLCAzKSAqIHAxeSArIHBvdyh0MSwgMikgKiAzICogdCAqIGMxeSArIHQxICogMyAqIHQgKiB0ICogYzJ5ICsgcG93KHQsIDMpICogcDJ5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBjdXJ2ZURpbSA9IGNhY2hlcihmdW5jdGlvbiAocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnkpIHtcbiAgICAgICAgICAgIHZhciBhID0gKGMyeCAtIDIgKiBjMXggKyBwMXgpIC0gKHAyeCAtIDIgKiBjMnggKyBjMXgpLFxuICAgICAgICAgICAgICAgIGIgPSAyICogKGMxeCAtIHAxeCkgLSAyICogKGMyeCAtIGMxeCksXG4gICAgICAgICAgICAgICAgYyA9IHAxeCAtIGMxeCxcbiAgICAgICAgICAgICAgICB0MSA9ICgtYiArIG1hdGguc3FydChiICogYiAtIDQgKiBhICogYykpIC8gMiAvIGEsXG4gICAgICAgICAgICAgICAgdDIgPSAoLWIgLSBtYXRoLnNxcnQoYiAqIGIgLSA0ICogYSAqIGMpKSAvIDIgLyBhLFxuICAgICAgICAgICAgICAgIHkgPSBbcDF5LCBwMnldLFxuICAgICAgICAgICAgICAgIHggPSBbcDF4LCBwMnhdLFxuICAgICAgICAgICAgICAgIGRvdDtcbiAgICAgICAgICAgIGFicyh0MSkgPiBcIjFlMTJcIiAmJiAodDEgPSAuNSk7XG4gICAgICAgICAgICBhYnModDIpID4gXCIxZTEyXCIgJiYgKHQyID0gLjUpO1xuICAgICAgICAgICAgaWYgKHQxID4gMCAmJiB0MSA8IDEpIHtcbiAgICAgICAgICAgICAgICBkb3QgPSBmaW5kRG90QXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0MSk7XG4gICAgICAgICAgICAgICAgeC5wdXNoKGRvdC54KTtcbiAgICAgICAgICAgICAgICB5LnB1c2goZG90LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQyID4gMCAmJiB0MiA8IDEpIHtcbiAgICAgICAgICAgICAgICBkb3QgPSBmaW5kRG90QXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0Mik7XG4gICAgICAgICAgICAgICAgeC5wdXNoKGRvdC54KTtcbiAgICAgICAgICAgICAgICB5LnB1c2goZG90LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYSA9IChjMnkgLSAyICogYzF5ICsgcDF5KSAtIChwMnkgLSAyICogYzJ5ICsgYzF5KTtcbiAgICAgICAgICAgIGIgPSAyICogKGMxeSAtIHAxeSkgLSAyICogKGMyeSAtIGMxeSk7XG4gICAgICAgICAgICBjID0gcDF5IC0gYzF5O1xuICAgICAgICAgICAgdDEgPSAoLWIgKyBtYXRoLnNxcnQoYiAqIGIgLSA0ICogYSAqIGMpKSAvIDIgLyBhO1xuICAgICAgICAgICAgdDIgPSAoLWIgLSBtYXRoLnNxcnQoYiAqIGIgLSA0ICogYSAqIGMpKSAvIDIgLyBhO1xuICAgICAgICAgICAgYWJzKHQxKSA+IFwiMWUxMlwiICYmICh0MSA9IC41KTtcbiAgICAgICAgICAgIGFicyh0MikgPiBcIjFlMTJcIiAmJiAodDIgPSAuNSk7XG4gICAgICAgICAgICBpZiAodDEgPiAwICYmIHQxIDwgMSkge1xuICAgICAgICAgICAgICAgIGRvdCA9IGZpbmREb3RBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQxKTtcbiAgICAgICAgICAgICAgICB4LnB1c2goZG90LngpO1xuICAgICAgICAgICAgICAgIHkucHVzaChkb3QueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodDIgPiAwICYmIHQyIDwgMSkge1xuICAgICAgICAgICAgICAgIGRvdCA9IGZpbmREb3RBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQyKTtcbiAgICAgICAgICAgICAgICB4LnB1c2goZG90LngpO1xuICAgICAgICAgICAgICAgIHkucHVzaChkb3QueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1pbjoge3g6IG1taW5bYXBwbHldKDAsIHgpLCB5OiBtbWluW2FwcGx5XSgwLCB5KX0sXG4gICAgICAgICAgICAgICAgbWF4OiB7eDogbW1heFthcHBseV0oMCwgeCksIHk6IG1tYXhbYXBwbHldKDAsIHkpfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSksXG4gICAgICAgIHBhdGgyY3VydmUgPSBSLl9wYXRoMmN1cnZlID0gY2FjaGVyKGZ1bmN0aW9uIChwYXRoLCBwYXRoMikge1xuICAgICAgICAgICAgdmFyIHB0aCA9ICFwYXRoMiAmJiBwYXRocyhwYXRoKTtcbiAgICAgICAgICAgIGlmICghcGF0aDIgJiYgcHRoLmN1cnZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhDbG9uZShwdGguY3VydmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHAgPSBwYXRoVG9BYnNvbHV0ZShwYXRoKSxcbiAgICAgICAgICAgICAgICBwMiA9IHBhdGgyICYmIHBhdGhUb0Fic29sdXRlKHBhdGgyKSxcbiAgICAgICAgICAgICAgICBhdHRycyA9IHt4OiAwLCB5OiAwLCBieDogMCwgYnk6IDAsIFg6IDAsIFk6IDAsIHF4OiBudWxsLCBxeTogbnVsbH0sXG4gICAgICAgICAgICAgICAgYXR0cnMyID0ge3g6IDAsIHk6IDAsIGJ4OiAwLCBieTogMCwgWDogMCwgWTogMCwgcXg6IG51bGwsIHF5OiBudWxsfSxcbiAgICAgICAgICAgICAgICBwcm9jZXNzUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBkLCBwY29tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBueCwgbnksIHRxID0ge1Q6MSwgUToxfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW1wiQ1wiLCBkLngsIGQueSwgZC54LCBkLnksIGQueCwgZC55XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAhKHBhdGhbMF0gaW4gdHEpICYmIChkLnF4ID0gZC5xeSA9IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHBhdGhbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5YID0gcGF0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLlkgPSBwYXRoWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXVtjb25jYXRdKGEyY1thcHBseV0oMCwgW2QueCwgZC55XVtjb25jYXRdKHBhdGguc2xpY2UoMSkpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiU1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwY29tID09IFwiQ1wiIHx8IHBjb20gPT0gXCJTXCIpIHsgLy8gSW4gXCJTXCIgY2FzZSB3ZSBoYXZlIHRvIHRha2UgaW50byBhY2NvdW50LCBpZiB0aGUgcHJldmlvdXMgY29tbWFuZCBpcyBDL1MuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG54ID0gZC54ICogMiAtIGQuYng7ICAgICAgICAgIC8vIEFuZCByZWZsZWN0IHRoZSBwcmV2aW91c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBueSA9IGQueSAqIDIgLSBkLmJ5OyAgICAgICAgICAvLyBjb21tYW5kJ3MgY29udHJvbCBwb2ludCByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwb2ludC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9yIHNvbWUgZWxzZSBvciBub3RoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG54ID0gZC54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBueSA9IGQueTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIiwgbngsIG55XVtjb25jYXRdKHBhdGguc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGNvbSA9PSBcIlFcIiB8fCBwY29tID09IFwiVFwiKSB7IC8vIEluIFwiVFwiIGNhc2Ugd2UgaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCwgaWYgdGhlIHByZXZpb3VzIGNvbW1hbmQgaXMgUS9ULlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF4ID0gZC54ICogMiAtIGQucXg7ICAgICAgICAvLyBBbmQgbWFrZSBhIHJlZmxlY3Rpb24gc2ltaWxhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF5ID0gZC55ICogMiAtIGQucXk7ICAgICAgICAvLyB0byBjYXNlIFwiU1wiLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3Igc29tZXRoaW5nIGVsc2Ugb3Igbm90aGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF4ID0gZC54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF5ID0gZC55O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXVtjb25jYXRdKHEyYyhkLngsIGQueSwgZC5xeCwgZC5xeSwgcGF0aFsxXSwgcGF0aFsyXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF4ID0gcGF0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF5ID0gcGF0aFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXVtjb25jYXRdKHEyYyhkLngsIGQueSwgcGF0aFsxXSwgcGF0aFsyXSwgcGF0aFszXSwgcGF0aFs0XSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXVtjb25jYXRdKGwyYyhkLngsIGQueSwgcGF0aFsxXSwgcGF0aFsyXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXVtjb25jYXRdKGwyYyhkLngsIGQueSwgcGF0aFsxXSwgZC55KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdW2NvbmNhdF0obDJjKGQueCwgZC55LCBkLngsIHBhdGhbMV0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl1bY29uY2F0XShsMmMoZC54LCBkLnksIGQuWCwgZC5ZKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmaXhBcmMgPSBmdW5jdGlvbiAocHAsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBwW2ldLmxlbmd0aCA+IDcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBwW2ldLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGkgPSBwcFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChwaS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwY29tczFbaV09XCJBXCI7IC8vIGlmIGNyZWF0ZWQgbXVsdGlwbGUgQzpzLCB0aGVpciBvcmlnaW5hbCBzZWcgaXMgc2F2ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMiAmJiAocGNvbXMyW2ldPVwiQVwiKTsgLy8gdGhlIHNhbWUgYXMgYWJvdmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcC5zcGxpY2UoaSsrLCAwLCBbXCJDXCJdW2NvbmNhdF0ocGkuc3BsaWNlKDAsIDYpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpaSA9IG1tYXgocC5sZW5ndGgsIHAyICYmIHAyLmxlbmd0aCB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZml4TSA9IGZ1bmN0aW9uIChwYXRoMSwgcGF0aDIsIGExLCBhMiwgaSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aDEgJiYgcGF0aDIgJiYgcGF0aDFbaV1bMF0gPT0gXCJNXCIgJiYgcGF0aDJbaV1bMF0gIT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgyLnNwbGljZShpLCAwLCBbXCJNXCIsIGEyLngsIGEyLnldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGExLmJ4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGExLmJ5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGExLnggPSBwYXRoMVtpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGExLnkgPSBwYXRoMVtpXVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlpID0gbW1heChwLmxlbmd0aCwgcDIgJiYgcDIubGVuZ3RoIHx8IDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwY29tczEgPSBbXSwgLy8gcGF0aCBjb21tYW5kcyBvZiBvcmlnaW5hbCBwYXRoIHBcbiAgICAgICAgICAgICAgICBwY29tczIgPSBbXSwgLy8gcGF0aCBjb21tYW5kcyBvZiBvcmlnaW5hbCBwYXRoIHAyXG4gICAgICAgICAgICAgICAgcGZpcnN0ID0gXCJcIiwgLy8gdGVtcG9yYXJ5IGhvbGRlciBmb3Igb3JpZ2luYWwgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICAgICAgcGNvbSA9IFwiXCI7IC8vIGhvbGRlciBmb3IgcHJldmlvdXMgcGF0aCBjb21tYW5kIG9mIG9yaWdpbmFsIHBhdGhcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG1tYXgocC5sZW5ndGgsIHAyICYmIHAyLmxlbmd0aCB8fCAwKTsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwW2ldICYmIChwZmlyc3QgPSBwW2ldWzBdKTsgLy8gc2F2ZSBjdXJyZW50IHBhdGggY29tbWFuZFxuXG4gICAgICAgICAgICAgICAgaWYgKHBmaXJzdCAhPSBcIkNcIikgLy8gQyBpcyBub3Qgc2F2ZWQgeWV0LCBiZWNhdXNlIGl0IG1heSBiZSByZXN1bHQgb2YgY29udmVyc2lvblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcGNvbXMxW2ldID0gcGZpcnN0OyAvLyBTYXZlIGN1cnJlbnQgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICAgICAgICAgIGkgJiYgKCBwY29tID0gcGNvbXMxW2ktMV0pOyAvLyBHZXQgcHJldmlvdXMgcGF0aCBjb21tYW5kIHBjb21cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcFtpXSA9IHByb2Nlc3NQYXRoKHBbaV0sIGF0dHJzLCBwY29tKTsgLy8gUHJldmlvdXMgcGF0aCBjb21tYW5kIGlzIGlucHV0dGVkIHRvIHByb2Nlc3NQYXRoXG5cbiAgICAgICAgICAgICAgICBpZiAocGNvbXMxW2ldICE9IFwiQVwiICYmIHBmaXJzdCA9PSBcIkNcIikgcGNvbXMxW2ldID0gXCJDXCI7IC8vIEEgaXMgdGhlIG9ubHkgY29tbWFuZFxuICAgICAgICAgICAgICAgIC8vIHdoaWNoIG1heSBwcm9kdWNlIG11bHRpcGxlIEM6c1xuICAgICAgICAgICAgICAgIC8vIHNvIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgQyBpcyBhbHNvIEMgaW4gb3JpZ2luYWwgcGF0aFxuXG4gICAgICAgICAgICAgICAgZml4QXJjKHAsIGkpOyAvLyBmaXhBcmMgYWRkcyBhbHNvIHRoZSByaWdodCBhbW91bnQgb2YgQTpzIHRvIHBjb21zMVxuXG4gICAgICAgICAgICAgICAgaWYgKHAyKSB7IC8vIHRoZSBzYW1lIHByb2NlZHVyZXMgaXMgZG9uZSB0byBwMlxuICAgICAgICAgICAgICAgICAgICBwMltpXSAmJiAocGZpcnN0ID0gcDJbaV1bMF0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGZpcnN0ICE9IFwiQ1wiKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwY29tczJbaV0gPSBwZmlyc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICBpICYmIChwY29tID0gcGNvbXMyW2ktMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHAyW2ldID0gcHJvY2Vzc1BhdGgocDJbaV0sIGF0dHJzMiwgcGNvbSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBjb21zMltpXSE9XCJBXCIgJiYgcGZpcnN0PT1cIkNcIikgcGNvbXMyW2ldPVwiQ1wiO1xuXG4gICAgICAgICAgICAgICAgICAgIGZpeEFyYyhwMiwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpeE0ocCwgcDIsIGF0dHJzLCBhdHRyczIsIGkpO1xuICAgICAgICAgICAgICAgIGZpeE0ocDIsIHAsIGF0dHJzMiwgYXR0cnMsIGkpO1xuICAgICAgICAgICAgICAgIHZhciBzZWcgPSBwW2ldLFxuICAgICAgICAgICAgICAgICAgICBzZWcyID0gcDIgJiYgcDJbaV0sXG4gICAgICAgICAgICAgICAgICAgIHNlZ2xlbiA9IHNlZy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHNlZzJsZW4gPSBwMiAmJiBzZWcyLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBhdHRycy54ID0gc2VnW3NlZ2xlbiAtIDJdO1xuICAgICAgICAgICAgICAgIGF0dHJzLnkgPSBzZWdbc2VnbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgYXR0cnMuYnggPSB0b0Zsb2F0KHNlZ1tzZWdsZW4gLSA0XSkgfHwgYXR0cnMueDtcbiAgICAgICAgICAgICAgICBhdHRycy5ieSA9IHRvRmxvYXQoc2VnW3NlZ2xlbiAtIDNdKSB8fCBhdHRycy55O1xuICAgICAgICAgICAgICAgIGF0dHJzMi5ieCA9IHAyICYmICh0b0Zsb2F0KHNlZzJbc2VnMmxlbiAtIDRdKSB8fCBhdHRyczIueCk7XG4gICAgICAgICAgICAgICAgYXR0cnMyLmJ5ID0gcDIgJiYgKHRvRmxvYXQoc2VnMltzZWcybGVuIC0gM10pIHx8IGF0dHJzMi55KTtcbiAgICAgICAgICAgICAgICBhdHRyczIueCA9IHAyICYmIHNlZzJbc2VnMmxlbiAtIDJdO1xuICAgICAgICAgICAgICAgIGF0dHJzMi55ID0gcDIgJiYgc2VnMltzZWcybGVuIC0gMV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXAyKSB7XG4gICAgICAgICAgICAgICAgcHRoLmN1cnZlID0gcGF0aENsb25lKHApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHAyID8gW3AsIHAyXSA6IHA7XG4gICAgICAgIH0sIG51bGwsIHBhdGhDbG9uZSksXG4gICAgICAgIHBhcnNlRG90cyA9IFIuX3BhcnNlRG90cyA9IGNhY2hlcihmdW5jdGlvbiAoZ3JhZGllbnQpIHtcbiAgICAgICAgICAgIHZhciBkb3RzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBncmFkaWVudC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRvdCA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXIgPSBncmFkaWVudFtpXS5tYXRjaCgvXihbXjpdKik6PyhbXFxkXFwuXSopLyk7XG4gICAgICAgICAgICAgICAgZG90LmNvbG9yID0gUi5nZXRSR0IocGFyWzFdKTtcbiAgICAgICAgICAgICAgICBpZiAoZG90LmNvbG9yLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkb3QuY29sb3IgPSBkb3QuY29sb3IuaGV4O1xuICAgICAgICAgICAgICAgIHBhclsyXSAmJiAoZG90Lm9mZnNldCA9IHBhclsyXSArIFwiJVwiKTtcbiAgICAgICAgICAgICAgICBkb3RzLnB1c2goZG90KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDEsIGlpID0gZG90cy5sZW5ndGggLSAxOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghZG90c1tpXS5vZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gdG9GbG9hdChkb3RzW2kgLSAxXS5vZmZzZXQgfHwgMCksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBpaTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG90c1tqXS5vZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSBkb3RzW2pdLm9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kID0gMTAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgaiA9IGlpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IHRvRmxvYXQoZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSAoZW5kIC0gc3RhcnQpIC8gKGogLSBpICsgMSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydCArPSBkO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG90c1tpXS5vZmZzZXQgPSBzdGFydCArIFwiJVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRvdHM7XG4gICAgICAgIH0pLFxuICAgICAgICB0ZWFyID0gUi5fdGVhciA9IGZ1bmN0aW9uIChlbCwgcGFwZXIpIHtcbiAgICAgICAgICAgIGVsID09IHBhcGVyLnRvcCAmJiAocGFwZXIudG9wID0gZWwucHJldik7XG4gICAgICAgICAgICBlbCA9PSBwYXBlci5ib3R0b20gJiYgKHBhcGVyLmJvdHRvbSA9IGVsLm5leHQpO1xuICAgICAgICAgICAgZWwubmV4dCAmJiAoZWwubmV4dC5wcmV2ID0gZWwucHJldik7XG4gICAgICAgICAgICBlbC5wcmV2ICYmIChlbC5wcmV2Lm5leHQgPSBlbC5uZXh0KTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9mcm9udCA9IFIuX3RvZnJvbnQgPSBmdW5jdGlvbiAoZWwsIHBhcGVyKSB7XG4gICAgICAgICAgICBpZiAocGFwZXIudG9wID09PSBlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlYXIoZWwsIHBhcGVyKTtcbiAgICAgICAgICAgIGVsLm5leHQgPSBudWxsO1xuICAgICAgICAgICAgZWwucHJldiA9IHBhcGVyLnRvcDtcbiAgICAgICAgICAgIHBhcGVyLnRvcC5uZXh0ID0gZWw7XG4gICAgICAgICAgICBwYXBlci50b3AgPSBlbDtcbiAgICAgICAgfSxcbiAgICAgICAgdG9iYWNrID0gUi5fdG9iYWNrID0gZnVuY3Rpb24gKGVsLCBwYXBlcikge1xuICAgICAgICAgICAgaWYgKHBhcGVyLmJvdHRvbSA9PT0gZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZWFyKGVsLCBwYXBlcik7XG4gICAgICAgICAgICBlbC5uZXh0ID0gcGFwZXIuYm90dG9tO1xuICAgICAgICAgICAgZWwucHJldiA9IG51bGw7XG4gICAgICAgICAgICBwYXBlci5ib3R0b20ucHJldiA9IGVsO1xuICAgICAgICAgICAgcGFwZXIuYm90dG9tID0gZWw7XG4gICAgICAgIH0sXG4gICAgICAgIGluc2VydGFmdGVyID0gUi5faW5zZXJ0YWZ0ZXIgPSBmdW5jdGlvbiAoZWwsIGVsMiwgcGFwZXIpIHtcbiAgICAgICAgICAgIHRlYXIoZWwsIHBhcGVyKTtcbiAgICAgICAgICAgIGVsMiA9PSBwYXBlci50b3AgJiYgKHBhcGVyLnRvcCA9IGVsKTtcbiAgICAgICAgICAgIGVsMi5uZXh0ICYmIChlbDIubmV4dC5wcmV2ID0gZWwpO1xuICAgICAgICAgICAgZWwubmV4dCA9IGVsMi5uZXh0O1xuICAgICAgICAgICAgZWwucHJldiA9IGVsMjtcbiAgICAgICAgICAgIGVsMi5uZXh0ID0gZWw7XG4gICAgICAgIH0sXG4gICAgICAgIGluc2VydGJlZm9yZSA9IFIuX2luc2VydGJlZm9yZSA9IGZ1bmN0aW9uIChlbCwgZWwyLCBwYXBlcikge1xuICAgICAgICAgICAgdGVhcihlbCwgcGFwZXIpO1xuICAgICAgICAgICAgZWwyID09IHBhcGVyLmJvdHRvbSAmJiAocGFwZXIuYm90dG9tID0gZWwpO1xuICAgICAgICAgICAgZWwyLnByZXYgJiYgKGVsMi5wcmV2Lm5leHQgPSBlbCk7XG4gICAgICAgICAgICBlbC5wcmV2ID0gZWwyLnByZXY7XG4gICAgICAgICAgICBlbDIucHJldiA9IGVsO1xuICAgICAgICAgICAgZWwubmV4dCA9IGVsMjtcbiAgICAgICAgfSxcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBSYXBoYWVsLnRvTWF0cml4XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBtYXRyaXggb2YgdHJhbnNmb3JtYXRpb25zIGFwcGxpZWQgdG8gYSBnaXZlbiBwYXRoXG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAgICAgLSB0cmFuc2Zvcm0gKHN0cmluZ3xhcnJheSkgdHJhbnNmb3JtYXRpb24gc3RyaW5nXG4gICAgICAgICA9IChvYmplY3QpIEBNYXRyaXhcbiAgICAgICAgXFwqL1xuICAgICAgICB0b01hdHJpeCA9IFIudG9NYXRyaXggPSBmdW5jdGlvbiAocGF0aCwgdHJhbnNmb3JtKSB7XG4gICAgICAgICAgICB2YXIgYmIgPSBwYXRoRGltZW5zaW9ucyhwYXRoKSxcbiAgICAgICAgICAgICAgICBlbCA9IHtcbiAgICAgICAgICAgICAgICAgICAgXzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBFXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGdldEJCb3g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiYjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBleHRyYWN0VHJhbnNmb3JtKGVsLCB0cmFuc2Zvcm0pO1xuICAgICAgICAgICAgcmV0dXJuIGVsLm1hdHJpeDtcbiAgICAgICAgfSxcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBSYXBoYWVsLnRyYW5zZm9ybVBhdGhcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIHBhdGggdHJhbnNmb3JtZWQgYnkgYSBnaXZlbiB0cmFuc2Zvcm1hdGlvblxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgICAgIC0gdHJhbnNmb3JtIChzdHJpbmd8YXJyYXkpIHRyYW5zZm9ybWF0aW9uIHN0cmluZ1xuICAgICAgICAgPSAoc3RyaW5nKSBwYXRoXG4gICAgICAgIFxcKi9cbiAgICAgICAgdHJhbnNmb3JtUGF0aCA9IFIudHJhbnNmb3JtUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCB0cmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBQYXRoKHBhdGgsIHRvTWF0cml4KHBhdGgsIHRyYW5zZm9ybSkpO1xuICAgICAgICB9LFxuICAgICAgICBleHRyYWN0VHJhbnNmb3JtID0gUi5fZXh0cmFjdFRyYW5zZm9ybSA9IGZ1bmN0aW9uIChlbCwgdHN0cikge1xuICAgICAgICAgICAgaWYgKHRzdHIgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5fLnRyYW5zZm9ybTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRzdHIgPSBTdHIodHN0cikucmVwbGFjZSgvXFwuezN9fFxcdTIwMjYvZywgZWwuXy50cmFuc2Zvcm0gfHwgRSk7XG4gICAgICAgICAgICB2YXIgdGRhdGEgPSBSLnBhcnNlVHJhbnNmb3JtU3RyaW5nKHRzdHIpLFxuICAgICAgICAgICAgICAgIGRlZyA9IDAsXG4gICAgICAgICAgICAgICAgZHggPSAwLFxuICAgICAgICAgICAgICAgIGR5ID0gMCxcbiAgICAgICAgICAgICAgICBzeCA9IDEsXG4gICAgICAgICAgICAgICAgc3kgPSAxLFxuICAgICAgICAgICAgICAgIF8gPSBlbC5fLFxuICAgICAgICAgICAgICAgIG0gPSBuZXcgTWF0cml4O1xuICAgICAgICAgICAgXy50cmFuc2Zvcm0gPSB0ZGF0YSB8fCBbXTtcbiAgICAgICAgICAgIGlmICh0ZGF0YSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRkYXRhLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSB0ZGF0YVtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRsZW4gPSB0Lmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBTdHIodFswXSkudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFic29sdXRlID0gdFswXSAhPSBjb21tYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW52ZXIgPSBhYnNvbHV0ZSA/IG0uaW52ZXJ0KCkgOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDEsXG4gICAgICAgICAgICAgICAgICAgICAgICB5MSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTIsXG4gICAgICAgICAgICAgICAgICAgICAgICBiYjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT0gXCJ0XCIgJiYgdGxlbiA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MSA9IGludmVyLngoMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTEgPSBpbnZlci55KDAsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gaW52ZXIueCh0WzFdLCB0WzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGludmVyLnkodFsxXSwgdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbS50cmFuc2xhdGUoeDIgLSB4MSwgeTIgLSB5MSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0udHJhbnNsYXRlKHRbMV0sIHRbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT0gXCJyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bGVuID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYiA9IGJiIHx8IGVsLmdldEJCb3goMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5yb3RhdGUodFsxXSwgYmIueCArIGJiLndpZHRoIC8gMiwgYmIueSArIGJiLmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZyArPSB0WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0bGVuID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBpbnZlci54KHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGludmVyLnkodFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0ucm90YXRlKHRbMV0sIHgyLCB5Mik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5yb3RhdGUodFsxXSwgdFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZyArPSB0WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT0gXCJzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bGVuID09IDIgfHwgdGxlbiA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmIgPSBiYiB8fCBlbC5nZXRCQm94KDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFt0bGVuIC0gMV0sIGJiLnggKyBiYi53aWR0aCAvIDIsIGJiLnkgKyBiYi5oZWlnaHQgLyAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeCAqPSB0WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5ICo9IHRbdGxlbiAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0bGVuID09IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBpbnZlci54KHRbM10sIHRbNF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGludmVyLnkodFszXSwgdFs0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFsyXSwgeDIsIHkyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbMl0sIHRbM10sIHRbNF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeCAqPSB0WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5ICo9IHRbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PSBcIm1cIiAmJiB0bGVuID09IDcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0uYWRkKHRbMV0sIHRbMl0sIHRbM10sIHRbNF0sIHRbNV0sIHRbNl0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF8uZGlydHlUID0gMTtcbiAgICAgICAgICAgICAgICAgICAgZWwubWF0cml4ID0gbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qXFxcbiAgICAgICAgICAgICAqIEVsZW1lbnQubWF0cml4XG4gICAgICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAgICAgKipcbiAgICAgICAgICAgICAqIEtlZXBzIEBNYXRyaXggb2JqZWN0LCB3aGljaCByZXByZXNlbnRzIGVsZW1lbnQgdHJhbnNmb3JtYXRpb25cbiAgICAgICAgICAgIFxcKi9cbiAgICAgICAgICAgIGVsLm1hdHJpeCA9IG07XG5cbiAgICAgICAgICAgIF8uc3ggPSBzeDtcbiAgICAgICAgICAgIF8uc3kgPSBzeTtcbiAgICAgICAgICAgIF8uZGVnID0gZGVnO1xuICAgICAgICAgICAgXy5keCA9IGR4ID0gbS5lO1xuICAgICAgICAgICAgXy5keSA9IGR5ID0gbS5mO1xuXG4gICAgICAgICAgICBpZiAoc3ggPT0gMSAmJiBzeSA9PSAxICYmICFkZWcgJiYgXy5iYm94KSB7XG4gICAgICAgICAgICAgICAgXy5iYm94LnggKz0gK2R4O1xuICAgICAgICAgICAgICAgIF8uYmJveC55ICs9ICtkeTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgXy5kaXJ0eVQgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBnZXRFbXB0eSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICB2YXIgbCA9IGl0ZW1bMF07XG4gICAgICAgICAgICBzd2l0Y2ggKGwudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ0XCI6IHJldHVybiBbbCwgMCwgMF07XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1cIjogcmV0dXJuIFtsLCAxLCAwLCAwLCAxLCAwLCAwXTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiclwiOiBpZiAoaXRlbS5sZW5ndGggPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDAsIGl0ZW1bMl0sIGl0ZW1bM11dO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgXCJzXCI6IGlmIChpdGVtLmxlbmd0aCA9PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMSwgMSwgaXRlbVszXSwgaXRlbVs0XV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLmxlbmd0aCA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMSwgMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVxdWFsaXNlVHJhbnNmb3JtID0gUi5fZXF1YWxpc2VUcmFuc2Zvcm0gPSBmdW5jdGlvbiAodDEsIHQyKSB7XG4gICAgICAgICAgICB0MiA9IFN0cih0MikucmVwbGFjZSgvXFwuezN9fFxcdTIwMjYvZywgdDEpO1xuICAgICAgICAgICAgdDEgPSBSLnBhcnNlVHJhbnNmb3JtU3RyaW5nKHQxKSB8fCBbXTtcbiAgICAgICAgICAgIHQyID0gUi5wYXJzZVRyYW5zZm9ybVN0cmluZyh0MikgfHwgW107XG4gICAgICAgICAgICB2YXIgbWF4bGVuZ3RoID0gbW1heCh0MS5sZW5ndGgsIHQyLmxlbmd0aCksXG4gICAgICAgICAgICAgICAgZnJvbSA9IFtdLFxuICAgICAgICAgICAgICAgIHRvID0gW10sXG4gICAgICAgICAgICAgICAgaSA9IDAsIGosIGpqLFxuICAgICAgICAgICAgICAgIHR0MSwgdHQyO1xuICAgICAgICAgICAgZm9yICg7IGkgPCBtYXhsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHR0MSA9IHQxW2ldIHx8IGdldEVtcHR5KHQyW2ldKTtcbiAgICAgICAgICAgICAgICB0dDIgPSB0MltpXSB8fCBnZXRFbXB0eSh0dDEpO1xuICAgICAgICAgICAgICAgIGlmICgodHQxWzBdICE9IHR0MlswXSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKHR0MVswXS50b0xvd2VyQ2FzZSgpID09IFwiclwiICYmICh0dDFbMl0gIT0gdHQyWzJdIHx8IHR0MVszXSAhPSB0dDJbM10pKSB8fFxuICAgICAgICAgICAgICAgICAgICAodHQxWzBdLnRvTG93ZXJDYXNlKCkgPT0gXCJzXCIgJiYgKHR0MVszXSAhPSB0dDJbM10gfHwgdHQxWzRdICE9IHR0Mls0XSkpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZyb21baV0gPSBbXTtcbiAgICAgICAgICAgICAgICB0b1tpXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gbW1heCh0dDEubGVuZ3RoLCB0dDIubGVuZ3RoKTsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaiBpbiB0dDEgJiYgKGZyb21baV1bal0gPSB0dDFbal0pO1xuICAgICAgICAgICAgICAgICAgICBqIGluIHR0MiAmJiAodG9baV1bal0gPSB0dDJbal0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogZnJvbSxcbiAgICAgICAgICAgICAgICB0bzogdG9cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgUi5fZ2V0Q29udGFpbmVyID0gZnVuY3Rpb24gKHgsIHksIHcsIGgpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lcjtcbiAgICAgICAgY29udGFpbmVyID0gaCA9PSBudWxsICYmICFSLmlzKHgsIFwib2JqZWN0XCIpID8gZy5kb2MuZ2V0RWxlbWVudEJ5SWQoeCkgOiB4O1xuICAgICAgICBpZiAoY29udGFpbmVyID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGFpbmVyLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGlmICh5ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGNvbnRhaW5lci5zdHlsZS5waXhlbFdpZHRoIHx8IGNvbnRhaW5lci5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBjb250YWluZXIuc3R5bGUucGl4ZWxIZWlnaHQgfHwgY29udGFpbmVyLm9mZnNldEhlaWdodFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogeSxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB3XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGFpbmVyOiAxLFxuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB3aWR0aDogdyxcbiAgICAgICAgICAgIGhlaWdodDogaFxuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucGF0aFRvUmVsYXRpdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogQ29udmVydHMgcGF0aCB0byByZWxhdGl2ZSBmb3JtXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHBhdGhTdHJpbmcgKHN0cmluZ3xhcnJheSkgcGF0aCBzdHJpbmcgb3IgYXJyYXkgb2Ygc2VnbWVudHNcbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIHNlZ21lbnRzLlxuICAgIFxcKi9cbiAgICBSLnBhdGhUb1JlbGF0aXZlID0gcGF0aFRvUmVsYXRpdmU7XG4gICAgUi5fZW5naW5lID0ge307XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucGF0aDJjdXJ2ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBwYXRoIHRvIGEgbmV3IHBhdGggd2hlcmUgYWxsIHNlZ21lbnRzIGFyZSBjdWJpYyBiZXppZXIgY3VydmVzLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBwYXRoU3RyaW5nIChzdHJpbmd8YXJyYXkpIHBhdGggc3RyaW5nIG9yIGFycmF5IG9mIHNlZ21lbnRzXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiBzZWdtZW50cy5cbiAgICBcXCovXG4gICAgUi5wYXRoMmN1cnZlID0gcGF0aDJjdXJ2ZTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5tYXRyaXhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBtYXRyaXggYmFzZWQgb24gZ2l2ZW4gcGFyYW1ldGVycy5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gYSAobnVtYmVyKVxuICAgICAtIGIgKG51bWJlcilcbiAgICAgLSBjIChudW1iZXIpXG4gICAgIC0gZCAobnVtYmVyKVxuICAgICAtIGUgKG51bWJlcilcbiAgICAgLSBmIChudW1iZXIpXG4gICAgID0gKG9iamVjdCkgQE1hdHJpeFxuICAgIFxcKi9cbiAgICBSLm1hdHJpeCA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4KGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgIH07XG4gICAgZnVuY3Rpb24gTWF0cml4KGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hID0gK2E7XG4gICAgICAgICAgICB0aGlzLmIgPSArYjtcbiAgICAgICAgICAgIHRoaXMuYyA9ICtjO1xuICAgICAgICAgICAgdGhpcy5kID0gK2Q7XG4gICAgICAgICAgICB0aGlzLmUgPSArZTtcbiAgICAgICAgICAgIHRoaXMuZiA9ICtmO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hID0gMTtcbiAgICAgICAgICAgIHRoaXMuYiA9IDA7XG4gICAgICAgICAgICB0aGlzLmMgPSAwO1xuICAgICAgICAgICAgdGhpcy5kID0gMTtcbiAgICAgICAgICAgIHRoaXMuZSA9IDA7XG4gICAgICAgICAgICB0aGlzLmYgPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIChmdW5jdGlvbiAobWF0cml4cHJvdG8pIHtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguYWRkXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBBZGRzIGdpdmVuIG1hdHJpeCB0byBleGlzdGluZyBvbmUuXG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0gYSAobnVtYmVyKVxuICAgICAgICAgLSBiIChudW1iZXIpXG4gICAgICAgICAtIGMgKG51bWJlcilcbiAgICAgICAgIC0gZCAobnVtYmVyKVxuICAgICAgICAgLSBlIChudW1iZXIpXG4gICAgICAgICAtIGYgKG51bWJlcilcbiAgICAgICAgIG9yXG4gICAgICAgICAtIG1hdHJpeCAob2JqZWN0KSBATWF0cml4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uYWRkID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgICAgIHZhciBvdXQgPSBbW10sIFtdLCBbXV0sXG4gICAgICAgICAgICAgICAgbSA9IFtbdGhpcy5hLCB0aGlzLmMsIHRoaXMuZV0sIFt0aGlzLmIsIHRoaXMuZCwgdGhpcy5mXSwgWzAsIDAsIDFdXSxcbiAgICAgICAgICAgICAgICBtYXRyaXggPSBbW2EsIGMsIGVdLCBbYiwgZCwgZl0sIFswLCAwLCAxXV0sXG4gICAgICAgICAgICAgICAgeCwgeSwgeiwgcmVzO1xuXG4gICAgICAgICAgICBpZiAoYSAmJiBhIGluc3RhbmNlb2YgTWF0cml4KSB7XG4gICAgICAgICAgICAgICAgbWF0cml4ID0gW1thLmEsIGEuYywgYS5lXSwgW2EuYiwgYS5kLCBhLmZdLCBbMCwgMCwgMV1dO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHggPSAwOyB4IDwgMzsgeCsrKSB7XG4gICAgICAgICAgICAgICAgZm9yICh5ID0gMDsgeSA8IDM7IHkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHogPSAwOyB6IDwgMzsgeisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gbVt4XVt6XSAqIG1hdHJpeFt6XVt5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXRbeF1beV0gPSByZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hID0gb3V0WzBdWzBdO1xuICAgICAgICAgICAgdGhpcy5iID0gb3V0WzFdWzBdO1xuICAgICAgICAgICAgdGhpcy5jID0gb3V0WzBdWzFdO1xuICAgICAgICAgICAgdGhpcy5kID0gb3V0WzFdWzFdO1xuICAgICAgICAgICAgdGhpcy5lID0gb3V0WzBdWzJdO1xuICAgICAgICAgICAgdGhpcy5mID0gb3V0WzFdWzJdO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5pbnZlcnRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgaW52ZXJ0ZWQgdmVyc2lvbiBvZiB0aGUgbWF0cml4XG4gICAgICAgICA9IChvYmplY3QpIEBNYXRyaXhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5pbnZlcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgIHggPSBtZS5hICogbWUuZCAtIG1lLmIgKiBtZS5jO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgobWUuZCAvIHgsIC1tZS5iIC8geCwgLW1lLmMgLyB4LCBtZS5hIC8geCwgKG1lLmMgKiBtZS5mIC0gbWUuZCAqIG1lLmUpIC8geCwgKG1lLmIgKiBtZS5lIC0gbWUuYSAqIG1lLmYpIC8geCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LmNsb25lXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIGNvcHkgb2YgdGhlIG1hdHJpeFxuICAgICAgICAgPSAob2JqZWN0KSBATWF0cml4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hdHJpeCh0aGlzLmEsIHRoaXMuYiwgdGhpcy5jLCB0aGlzLmQsIHRoaXMuZSwgdGhpcy5mKTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgudHJhbnNsYXRlXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBUcmFuc2xhdGUgdGhlIG1hdHJpeFxuICAgICAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICAgICAtIHggKG51bWJlcilcbiAgICAgICAgIC0geSAobnVtYmVyKVxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICB0aGlzLmFkZCgxLCAwLCAwLCAxLCB4LCB5KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguc2NhbGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFNjYWxlcyB0aGUgbWF0cml4XG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0geCAobnVtYmVyKVxuICAgICAgICAgLSB5IChudW1iZXIpICNvcHRpb25hbFxuICAgICAgICAgLSBjeCAobnVtYmVyKSAjb3B0aW9uYWxcbiAgICAgICAgIC0gY3kgKG51bWJlcikgI29wdGlvbmFsXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uc2NhbGUgPSBmdW5jdGlvbiAoeCwgeSwgY3gsIGN5KSB7XG4gICAgICAgICAgICB5ID09IG51bGwgJiYgKHkgPSB4KTtcbiAgICAgICAgICAgIChjeCB8fCBjeSkgJiYgdGhpcy5hZGQoMSwgMCwgMCwgMSwgY3gsIGN5KTtcbiAgICAgICAgICAgIHRoaXMuYWRkKHgsIDAsIDAsIHksIDAsIDApO1xuICAgICAgICAgICAgKGN4IHx8IGN5KSAmJiB0aGlzLmFkZCgxLCAwLCAwLCAxLCAtY3gsIC1jeSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnJvdGF0ZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUm90YXRlcyB0aGUgbWF0cml4XG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0gYSAobnVtYmVyKVxuICAgICAgICAgLSB4IChudW1iZXIpXG4gICAgICAgICAtIHkgKG51bWJlcilcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5yb3RhdGUgPSBmdW5jdGlvbiAoYSwgeCwgeSkge1xuICAgICAgICAgICAgYSA9IFIucmFkKGEpO1xuICAgICAgICAgICAgeCA9IHggfHwgMDtcbiAgICAgICAgICAgIHkgPSB5IHx8IDA7XG4gICAgICAgICAgICB2YXIgY29zID0gK21hdGguY29zKGEpLnRvRml4ZWQoOSksXG4gICAgICAgICAgICAgICAgc2luID0gK21hdGguc2luKGEpLnRvRml4ZWQoOSk7XG4gICAgICAgICAgICB0aGlzLmFkZChjb3MsIHNpbiwgLXNpbiwgY29zLCB4LCB5KTtcbiAgICAgICAgICAgIHRoaXMuYWRkKDEsIDAsIDAsIDEsIC14LCAteSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnhcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybiB4IGNvb3JkaW5hdGUgZm9yIGdpdmVuIHBvaW50IGFmdGVyIHRyYW5zZm9ybWF0aW9uIGRlc2NyaWJlZCBieSB0aGUgbWF0cml4LiBTZWUgYWxzbyBATWF0cml4LnlcbiAgICAgICAgID4gUGFyYW1ldGVyc1xuICAgICAgICAgLSB4IChudW1iZXIpXG4gICAgICAgICAtIHkgKG51bWJlcilcbiAgICAgICAgID0gKG51bWJlcikgeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnggPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgcmV0dXJuIHggKiB0aGlzLmEgKyB5ICogdGhpcy5jICsgdGhpcy5lO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC55XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm4geSBjb29yZGluYXRlIGZvciBnaXZlbiBwb2ludCBhZnRlciB0cmFuc2Zvcm1hdGlvbiBkZXNjcmliZWQgYnkgdGhlIG1hdHJpeC4gU2VlIGFsc28gQE1hdHJpeC54XG4gICAgICAgICA+IFBhcmFtZXRlcnNcbiAgICAgICAgIC0geCAobnVtYmVyKVxuICAgICAgICAgLSB5IChudW1iZXIpXG4gICAgICAgICA9IChudW1iZXIpIHlcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by55ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiB4ICogdGhpcy5iICsgeSAqIHRoaXMuZCArIHRoaXMuZjtcbiAgICAgICAgfTtcbiAgICAgICAgbWF0cml4cHJvdG8uZ2V0ID0gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHJldHVybiArdGhpc1tTdHIuZnJvbUNoYXJDb2RlKDk3ICsgaSldLnRvRml4ZWQoNCk7XG4gICAgICAgIH07XG4gICAgICAgIG1hdHJpeHByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFIuc3ZnID9cbiAgICAgICAgICAgICAgICBcIm1hdHJpeChcIiArIFt0aGlzLmdldCgwKSwgdGhpcy5nZXQoMSksIHRoaXMuZ2V0KDIpLCB0aGlzLmdldCgzKSwgdGhpcy5nZXQoNCksIHRoaXMuZ2V0KDUpXS5qb2luKCkgKyBcIilcIiA6XG4gICAgICAgICAgICAgICAgW3RoaXMuZ2V0KDApLCB0aGlzLmdldCgyKSwgdGhpcy5nZXQoMSksIHRoaXMuZ2V0KDMpLCAwLCAwXS5qb2luKCk7XG4gICAgICAgIH07XG4gICAgICAgIG1hdHJpeHByb3RvLnRvRmlsdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0Lk1hdHJpeChNMTE9XCIgKyB0aGlzLmdldCgwKSArXG4gICAgICAgICAgICAgICAgXCIsIE0xMj1cIiArIHRoaXMuZ2V0KDIpICsgXCIsIE0yMT1cIiArIHRoaXMuZ2V0KDEpICsgXCIsIE0yMj1cIiArIHRoaXMuZ2V0KDMpICtcbiAgICAgICAgICAgICAgICBcIiwgRHg9XCIgKyB0aGlzLmdldCg0KSArIFwiLCBEeT1cIiArIHRoaXMuZ2V0KDUpICsgXCIsIHNpemluZ21ldGhvZD0nYXV0byBleHBhbmQnKVwiO1xuICAgICAgICB9O1xuICAgICAgICBtYXRyaXhwcm90by5vZmZzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMuZS50b0ZpeGVkKDQpLCB0aGlzLmYudG9GaXhlZCg0KV07XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIG5vcm0oYSkge1xuICAgICAgICAgICAgcmV0dXJuIGFbMF0gKiBhWzBdICsgYVsxXSAqIGFbMV07XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKGEpIHtcbiAgICAgICAgICAgIHZhciBtYWcgPSBtYXRoLnNxcnQobm9ybShhKSk7XG4gICAgICAgICAgICBhWzBdICYmIChhWzBdIC89IG1hZyk7XG4gICAgICAgICAgICBhWzFdICYmIChhWzFdIC89IG1hZyk7XG4gICAgICAgIH1cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguc3BsaXRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFNwbGl0cyBtYXRyaXggaW50byBwcmltaXRpdmUgdHJhbnNmb3JtYXRpb25zXG4gICAgICAgICA9IChvYmplY3QpIGluIGZvcm1hdDpcbiAgICAgICAgIG8gZHggKG51bWJlcikgdHJhbnNsYXRpb24gYnkgeFxuICAgICAgICAgbyBkeSAobnVtYmVyKSB0cmFuc2xhdGlvbiBieSB5XG4gICAgICAgICBvIHNjYWxleCAobnVtYmVyKSBzY2FsZSBieSB4XG4gICAgICAgICBvIHNjYWxleSAobnVtYmVyKSBzY2FsZSBieSB5XG4gICAgICAgICBvIHNoZWFyIChudW1iZXIpIHNoZWFyXG4gICAgICAgICBvIHJvdGF0ZSAobnVtYmVyKSByb3RhdGlvbiBpbiBkZWdcbiAgICAgICAgIG8gaXNTaW1wbGUgKGJvb2xlYW4pIGNvdWxkIGl0IGJlIHJlcHJlc2VudGVkIHZpYSBzaW1wbGUgdHJhbnNmb3JtYXRpb25zXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uc3BsaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3V0ID0ge307XG4gICAgICAgICAgICAvLyB0cmFuc2xhdGlvblxuICAgICAgICAgICAgb3V0LmR4ID0gdGhpcy5lO1xuICAgICAgICAgICAgb3V0LmR5ID0gdGhpcy5mO1xuXG4gICAgICAgICAgICAvLyBzY2FsZSBhbmQgc2hlYXJcbiAgICAgICAgICAgIHZhciByb3cgPSBbW3RoaXMuYSwgdGhpcy5jXSwgW3RoaXMuYiwgdGhpcy5kXV07XG4gICAgICAgICAgICBvdXQuc2NhbGV4ID0gbWF0aC5zcXJ0KG5vcm0ocm93WzBdKSk7XG4gICAgICAgICAgICBub3JtYWxpemUocm93WzBdKTtcblxuICAgICAgICAgICAgb3V0LnNoZWFyID0gcm93WzBdWzBdICogcm93WzFdWzBdICsgcm93WzBdWzFdICogcm93WzFdWzFdO1xuICAgICAgICAgICAgcm93WzFdID0gW3Jvd1sxXVswXSAtIHJvd1swXVswXSAqIG91dC5zaGVhciwgcm93WzFdWzFdIC0gcm93WzBdWzFdICogb3V0LnNoZWFyXTtcblxuICAgICAgICAgICAgb3V0LnNjYWxleSA9IG1hdGguc3FydChub3JtKHJvd1sxXSkpO1xuICAgICAgICAgICAgbm9ybWFsaXplKHJvd1sxXSk7XG4gICAgICAgICAgICBvdXQuc2hlYXIgLz0gb3V0LnNjYWxleTtcblxuICAgICAgICAgICAgLy8gcm90YXRpb25cbiAgICAgICAgICAgIHZhciBzaW4gPSAtcm93WzBdWzFdLFxuICAgICAgICAgICAgICAgIGNvcyA9IHJvd1sxXVsxXTtcbiAgICAgICAgICAgIGlmIChjb3MgPCAwKSB7XG4gICAgICAgICAgICAgICAgb3V0LnJvdGF0ZSA9IFIuZGVnKG1hdGguYWNvcyhjb3MpKTtcbiAgICAgICAgICAgICAgICBpZiAoc2luIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBvdXQucm90YXRlID0gMzYwIC0gb3V0LnJvdGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dC5yb3RhdGUgPSBSLmRlZyhtYXRoLmFzaW4oc2luKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dC5pc1NpbXBsZSA9ICErb3V0LnNoZWFyLnRvRml4ZWQoOSkgJiYgKG91dC5zY2FsZXgudG9GaXhlZCg5KSA9PSBvdXQuc2NhbGV5LnRvRml4ZWQoOSkgfHwgIW91dC5yb3RhdGUpO1xuICAgICAgICAgICAgb3V0LmlzU3VwZXJTaW1wbGUgPSAhK291dC5zaGVhci50b0ZpeGVkKDkpICYmIG91dC5zY2FsZXgudG9GaXhlZCg5KSA9PSBvdXQuc2NhbGV5LnRvRml4ZWQoOSkgJiYgIW91dC5yb3RhdGU7XG4gICAgICAgICAgICBvdXQubm9Sb3RhdGlvbiA9ICErb3V0LnNoZWFyLnRvRml4ZWQoOSkgJiYgIW91dC5yb3RhdGU7XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC50b1RyYW5zZm9ybVN0cmluZ1xuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJuIHRyYW5zZm9ybSBzdHJpbmcgdGhhdCByZXByZXNlbnRzIGdpdmVuIG1hdHJpeFxuICAgICAgICAgPSAoc3RyaW5nKSB0cmFuc2Zvcm0gc3RyaW5nXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8udG9UcmFuc2Zvcm1TdHJpbmcgPSBmdW5jdGlvbiAoc2hvcnRlcikge1xuICAgICAgICAgICAgdmFyIHMgPSBzaG9ydGVyIHx8IHRoaXNbc3BsaXRdKCk7XG4gICAgICAgICAgICBpZiAocy5pc1NpbXBsZSkge1xuICAgICAgICAgICAgICAgIHMuc2NhbGV4ID0gK3Muc2NhbGV4LnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgcy5zY2FsZXkgPSArcy5zY2FsZXkudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICBzLnJvdGF0ZSA9ICtzLnJvdGF0ZS50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgIHJldHVybiAgKHMuZHggfHwgcy5keSA/IFwidFwiICsgW3MuZHgsIHMuZHldIDogRSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgKHMuc2NhbGV4ICE9IDEgfHwgcy5zY2FsZXkgIT0gMSA/IFwic1wiICsgW3Muc2NhbGV4LCBzLnNjYWxleSwgMCwgMF0gOiBFKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAocy5yb3RhdGUgPyBcInJcIiArIFtzLnJvdGF0ZSwgMCwgMF0gOiBFKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibVwiICsgW3RoaXMuZ2V0KDApLCB0aGlzLmdldCgxKSwgdGhpcy5nZXQoMiksIHRoaXMuZ2V0KDMpLCB0aGlzLmdldCg0KSwgdGhpcy5nZXQoNSldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pKE1hdHJpeC5wcm90b3R5cGUpO1xuXG4gICAgLy8gV2ViS2l0IHJlbmRlcmluZyBidWcgd29ya2Fyb3VuZCBtZXRob2RcbiAgICB2YXIgdmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1ZlcnNpb25cXC8oLio/KVxccy8pIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0Nocm9tZVxcLyhcXGQrKS8pO1xuICAgIGlmICgobmF2aWdhdG9yLnZlbmRvciA9PSBcIkFwcGxlIENvbXB1dGVyLCBJbmMuXCIpICYmICh2ZXJzaW9uICYmIHZlcnNpb25bMV0gPCA0IHx8IG5hdmlnYXRvci5wbGF0Zm9ybS5zbGljZSgwLCAyKSA9PSBcImlQXCIpIHx8XG4gICAgICAgIChuYXZpZ2F0b3IudmVuZG9yID09IFwiR29vZ2xlIEluYy5cIiAmJiB2ZXJzaW9uICYmIHZlcnNpb25bMV0gPCA4KSkge1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIFBhcGVyLnNhZmFyaVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogVGhlcmUgaXMgYW4gaW5jb252ZW5pZW50IHJlbmRlcmluZyBidWcgaW4gU2FmYXJpIChXZWJLaXQpOlxuICAgICAgICAgKiBzb21ldGltZXMgdGhlIHJlbmRlcmluZyBzaG91bGQgYmUgZm9yY2VkLlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgaGVscCB3aXRoIGRlYWxpbmcgd2l0aCB0aGlzIGJ1Zy5cbiAgICAgICAgXFwqL1xuICAgICAgICBwYXBlcnByb3RvLnNhZmFyaSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gdGhpcy5yZWN0KC05OSwgLTk5LCB0aGlzLndpZHRoICsgOTksIHRoaXMuaGVpZ2h0ICsgOTkpLmF0dHIoe3N0cm9rZTogXCJub25lXCJ9KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge3JlY3QucmVtb3ZlKCk7fSk7XG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFwZXJwcm90by5zYWZhcmkgPSBmdW47XG4gICAgfVxuXG4gICAgdmFyIHByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfSxcbiAgICBwcmV2ZW50VG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9LFxuICAgIHN0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgIH0sXG4gICAgc3RvcFRvdWNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmlnaW5hbEV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG4gICAgZ2V0RXZlbnRQb3NpdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBzY3JvbGxZID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBnLmRvYy5ib2R5LnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbFggPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCBnLmRvYy5ib2R5LnNjcm9sbExlZnQ7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGUuY2xpZW50WCArIHNjcm9sbFgsXG4gICAgICAgICAgICB5OiBlLmNsaWVudFkgKyBzY3JvbGxZXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBhZGRFdmVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChnLmRvYy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgdHlwZSwgZm4sIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBnZXRFdmVudFBvc2l0aW9uKGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbChlbGVtZW50LCBlLCBwb3MueCwgcG9zLnkpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZiwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHN1cHBvcnRzVG91Y2ggJiYgdG91Y2hNYXBbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9mID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBnZXRFdmVudFBvc2l0aW9uKGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZGUgPSBlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBlLnRhcmdldFRvdWNoZXMgJiYgZS50YXJnZXRUb3VjaGVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXRUb3VjaGVzW2ldLnRhcmdldCA9PSBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZSA9IGUudGFyZ2V0VG91Y2hlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5vcmlnaW5hbEV2ZW50ID0gb2xkZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA9IHByZXZlbnRUb3VjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24gPSBzdG9wVG91Y2g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwoZWxlbWVudCwgZSwgcG9zLngsIHBvcy55KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIodG91Y2hNYXBbdHlwZV0sIF9mLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZiwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdXBwb3J0c1RvdWNoICYmIHRvdWNoTWFwW3R5cGVdKVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodG91Y2hNYXBbdHlwZV0sIF9mLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoZy5kb2MuYXR0YWNoRXZlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCB0eXBlLCBmbiwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHZhciBmID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IGUgfHwgZy53aW4uZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY3JvbGxZID0gZy5kb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBnLmRvYy5ib2R5LnNjcm9sbFRvcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFggPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCBnLmRvYy5ib2R5LnNjcm9sbExlZnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gZS5jbGllbnRYICsgc2Nyb2xsWCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSBlLmNsaWVudFkgKyBzY3JvbGxZO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID0gZS5wcmV2ZW50RGVmYXVsdCB8fCBwcmV2ZW50RGVmYXVsdDtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBzdG9wUHJvcGFnYXRpb247XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKGVsZW1lbnQsIGUsIHgsIHkpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KFwib25cIiArIHR5cGUsIGYpO1xuICAgICAgICAgICAgICAgIHZhciBkZXRhY2hlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KFwib25cIiArIHR5cGUsIGYpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXRhY2hlcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSgpLFxuICAgIGRyYWcgPSBbXSxcbiAgICBkcmFnTW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciB4ID0gZS5jbGllbnRYLFxuICAgICAgICAgICAgeSA9IGUuY2xpZW50WSxcbiAgICAgICAgICAgIHNjcm9sbFkgPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGcuZG9jLmJvZHkuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgc2Nyb2xsWCA9IGcuZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGcuZG9jLmJvZHkuc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgIGRyYWdpLFxuICAgICAgICAgICAgaiA9IGRyYWcubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgICAgICBkcmFnaSA9IGRyYWdbal07XG4gICAgICAgICAgICBpZiAoc3VwcG9ydHNUb3VjaCAmJiBlLnRvdWNoZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGUudG91Y2hlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHRvdWNoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2ggPSBlLnRvdWNoZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3VjaC5pZGVudGlmaWVyID09IGRyYWdpLmVsLl9kcmFnLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gdG91Y2guY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSB0b3VjaC5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGUub3JpZ2luYWxFdmVudCA/IGUub3JpZ2luYWxFdmVudCA6IGUpLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vZGUgPSBkcmFnaS5lbC5ub2RlLFxuICAgICAgICAgICAgICAgIG8sXG4gICAgICAgICAgICAgICAgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgICAgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlLFxuICAgICAgICAgICAgICAgIGRpc3BsYXkgPSBub2RlLnN0eWxlLmRpc3BsYXk7XG4gICAgICAgICAgICBnLndpbi5vcGVyYSAmJiBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIG8gPSBkcmFnaS5lbC5wYXBlci5nZXRFbGVtZW50QnlQb2ludCh4LCB5KTtcbiAgICAgICAgICAgIG5vZGUuc3R5bGUuZGlzcGxheSA9IGRpc3BsYXk7XG4gICAgICAgICAgICBnLndpbi5vcGVyYSAmJiAobmV4dCA/IHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgbmV4dCkgOiBwYXJlbnQuYXBwZW5kQ2hpbGQobm9kZSkpO1xuICAgICAgICAgICAgbyAmJiBldmUoXCJyYXBoYWVsLmRyYWcub3Zlci5cIiArIGRyYWdpLmVsLmlkLCBkcmFnaS5lbCwgbyk7XG4gICAgICAgICAgICB4ICs9IHNjcm9sbFg7XG4gICAgICAgICAgICB5ICs9IHNjcm9sbFk7XG4gICAgICAgICAgICBldmUoXCJyYXBoYWVsLmRyYWcubW92ZS5cIiArIGRyYWdpLmVsLmlkLCBkcmFnaS5tb3ZlX3Njb3BlIHx8IGRyYWdpLmVsLCB4IC0gZHJhZ2kuZWwuX2RyYWcueCwgeSAtIGRyYWdpLmVsLl9kcmFnLnksIHgsIHksIGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkcmFnVXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBSLnVubW91c2Vtb3ZlKGRyYWdNb3ZlKS51bm1vdXNldXAoZHJhZ1VwKTtcbiAgICAgICAgdmFyIGkgPSBkcmFnLmxlbmd0aCxcbiAgICAgICAgICAgIGRyYWdpO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBkcmFnaSA9IGRyYWdbaV07XG4gICAgICAgICAgICBkcmFnaS5lbC5fZHJhZyA9IHt9O1xuICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5kcmFnLmVuZC5cIiArIGRyYWdpLmVsLmlkLCBkcmFnaS5lbmRfc2NvcGUgfHwgZHJhZ2kuc3RhcnRfc2NvcGUgfHwgZHJhZ2kubW92ZV9zY29wZSB8fCBkcmFnaS5lbCwgZSk7XG4gICAgICAgIH1cbiAgICAgICAgZHJhZyA9IFtdO1xuICAgIH0sXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZWxcbiAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICoqXG4gICAgICogWW91IGNhbiBhZGQgeW91ciBvd24gbWV0aG9kIHRvIGVsZW1lbnRzLiBUaGlzIGlzIHVzZWZ1bGwgd2hlbiB5b3Ugd2FudCB0byBoYWNrIGRlZmF1bHQgZnVuY3Rpb25hbGl0eSBvclxuICAgICAqIHdhbnQgdG8gd3JhcCBzb21lIGNvbW1vbiB0cmFuc2Zvcm1hdGlvbiBvciBhdHRyaWJ1dGVzIGluIG9uZSBtZXRob2QuIEluIGRpZmZlcmVuY2UgdG8gY2FudmFzIG1ldGhvZHMsXG4gICAgICogeW91IGNhbiByZWRlZmluZSBlbGVtZW50IG1ldGhvZCBhdCBhbnkgdGltZS4gRXhwZW5kaW5nIGVsZW1lbnQgbWV0aG9kcyB3b3VsZG7igJl0IGFmZmVjdCBzZXQuXG4gICAgID4gVXNhZ2VcbiAgICAgfCBSYXBoYWVsLmVsLnJlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgfCAgICAgdGhpcy5hdHRyKHtmaWxsOiBcIiNmMDBcIn0pO1xuICAgICB8IH07XG4gICAgIHwgLy8gdGhlbiB1c2UgaXRcbiAgICAgfCBwYXBlci5jaXJjbGUoMTAwLCAxMDAsIDIwKS5yZWQoKTtcbiAgICBcXCovXG4gICAgZWxwcm90byA9IFIuZWwgPSB7fTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5jbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciBjbGljayBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIGNsaWNrIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmRibGNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIGRvdWJsZSBjbGljayBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmRibGNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIGRvdWJsZSBjbGljayBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZWRvd25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2Vkb3duIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2Vkb3duXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlZG93biBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZW1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2Vtb3ZlIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2Vtb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlbW92ZSBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZW91dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZW91dCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlb3V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIG1vdXNlb3V0IGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlb3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciBtb3VzZW92ZXIgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZW92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2VvdmVyIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cblxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNldXBcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2V1cCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNldXBcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlciBmb3IgbW91c2V1cCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaHN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNoc3RhcnQgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaHN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNoc3RhcnQgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2htb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNobW92ZSBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNobW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaG1vdmUgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgI29wdGlvbmFsIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2hlbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlciBmb3IgdG91Y2hlbmQgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaGVuZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaGVuZCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaGNhbmNlbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVyIGZvciB0b3VjaGNhbmNlbCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNoY2FuY2VsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXIgZm9yIHRvdWNoY2FuY2VsIGZvciB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pICNvcHRpb25hbCBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBmb3IgKHZhciBpID0gZXZlbnRzLmxlbmd0aDsgaS0tOykge1xuICAgICAgICAoZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgUltldmVudE5hbWVdID0gZWxwcm90b1tldmVudE5hbWVdID0gZnVuY3Rpb24gKGZuLCBzY29wZSkge1xuICAgICAgICAgICAgICAgIGlmIChSLmlzKGZuLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzID0gdGhpcy5ldmVudHMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLnB1c2goe25hbWU6IGV2ZW50TmFtZSwgZjogZm4sIHVuYmluZDogYWRkRXZlbnQodGhpcy5zaGFwZSB8fCB0aGlzLm5vZGUgfHwgZy5kb2MsIGV2ZW50TmFtZSwgZm4sIHNjb3BlIHx8IHRoaXMpfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFJbXCJ1blwiICsgZXZlbnROYW1lXSA9IGVscHJvdG9bXCJ1blwiICsgZXZlbnROYW1lXSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIHZhciBldmVudHMgPSB0aGlzLmV2ZW50cyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgbCA9IGV2ZW50cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGwtLSl7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudHNbbF0ubmFtZSA9PSBldmVudE5hbWUgJiYgKFIuaXMoZm4sIFwidW5kZWZpbmVkXCIpIHx8IGV2ZW50c1tsXS5mID09IGZuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzW2xdLnVuYmluZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnNwbGljZShsLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICFldmVudHMubGVuZ3RoICYmIGRlbGV0ZSB0aGlzLmV2ZW50cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKGV2ZW50c1tpXSk7XG4gICAgfVxuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZGF0YVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBvciByZXRyaWV2ZXMgZ2l2ZW4gdmFsdWUgYXNvY2lhdGVkIHdpdGggZ2l2ZW4ga2V5LlxuICAgICAqKlxuICAgICAqIFNlZSBhbHNvIEBFbGVtZW50LnJlbW92ZURhdGFcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0ga2V5IChzdHJpbmcpIGtleSB0byBzdG9yZSBkYXRhXG4gICAgIC0gdmFsdWUgKGFueSkgI29wdGlvbmFsIHZhbHVlIHRvIHN0b3JlXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICAgKiBvciwgaWYgdmFsdWUgaXMgbm90IHNwZWNpZmllZDpcbiAgICAgPSAoYW55KSB2YWx1ZVxuICAgICAqIG9yLCBpZiBrZXkgYW5kIHZhbHVlIGFyZSBub3Qgc3BlY2lmaWVkOlxuICAgICA9IChvYmplY3QpIEtleS92YWx1ZSBwYWlycyBmb3IgYWxsIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgZWxlbWVudC5cbiAgICAgPiBVc2FnZVxuICAgICB8IGZvciAodmFyIGkgPSAwLCBpIDwgNSwgaSsrKSB7XG4gICAgIHwgICAgIHBhcGVyLmNpcmNsZSgxMCArIDE1ICogaSwgMTAsIDEwKVxuICAgICB8ICAgICAgICAgIC5hdHRyKHtmaWxsOiBcIiMwMDBcIn0pXG4gICAgIHwgICAgICAgICAgLmRhdGEoXCJpXCIsIGkpXG4gICAgIHwgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgfCAgICAgICAgICAgICBhbGVydCh0aGlzLmRhdGEoXCJpXCIpKTtcbiAgICAgfCAgICAgICAgICB9KTtcbiAgICAgfCB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZGF0YSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHZhciBkYXRhID0gZWxkYXRhW3RoaXMuaWRdID0gZWxkYXRhW3RoaXMuaWRdIHx8IHt9O1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBpZiAoUi5pcyhrZXksIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBrZXkpIGlmIChrZXlbaGFzXShpKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEoaSwga2V5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBldmUoXCJyYXBoYWVsLmRhdGEuZ2V0LlwiICsgdGhpcy5pZCwgdGhpcywgZGF0YVtrZXldLCBrZXkpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgZXZlKFwicmFwaGFlbC5kYXRhLnNldC5cIiArIHRoaXMuaWQsIHRoaXMsIHZhbHVlLCBrZXkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnJlbW92ZURhdGFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQgYnkgZ2l2ZW4ga2V5LlxuICAgICAqIElmIGtleSBpcyBub3QgcHJvdmlkZWQsIHJlbW92ZXMgYWxsIHRoZSBkYXRhIG9mIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBrZXkgKHN0cmluZykgI29wdGlvbmFsIGtleVxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucmVtb3ZlRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgICAgICAgICBlbGRhdGFbdGhpcy5pZF0gPSB7fTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZGF0YVt0aGlzLmlkXSAmJiBkZWxldGUgZWxkYXRhW3RoaXMuaWRdW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0RGF0YVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0cmlldmVzIHRoZSBlbGVtZW50IGRhdGFcbiAgICAgPSAob2JqZWN0KSBkYXRhXG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNsb25lKGVsZGF0YVt0aGlzLmlkXSB8fCB7fSk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5ob3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaG92ZXIgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBmX2luIChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgaW5cbiAgICAgLSBmX291dCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIG91dFxuICAgICAtIGljb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBob3ZlciBpbiBoYW5kbGVyXG4gICAgIC0gb2NvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGhvdmVyIG91dCBoYW5kbGVyXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5ob3ZlciA9IGZ1bmN0aW9uIChmX2luLCBmX291dCwgc2NvcGVfaW4sIHNjb3BlX291dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb3VzZW92ZXIoZl9pbiwgc2NvcGVfaW4pLm1vdXNlb3V0KGZfb3V0LCBzY29wZV9vdXQgfHwgc2NvcGVfaW4pO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5ob3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVycyBmb3IgaG92ZXIgZm9yIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBmX2luIChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgaW5cbiAgICAgLSBmX291dCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIG91dFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udW5ob3ZlciA9IGZ1bmN0aW9uIChmX2luLCBmX291dCkge1xuICAgICAgICByZXR1cm4gdGhpcy51bm1vdXNlb3ZlcihmX2luKS51bm1vdXNlb3V0KGZfb3V0KTtcbiAgICB9O1xuICAgIHZhciBkcmFnZ2FibGUgPSBbXTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5kcmFnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBkcmFnIG9mIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBvbm1vdmUgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBtb3ZpbmdcbiAgICAgLSBvbnN0YXJ0IChmdW5jdGlvbikgaGFuZGxlciBmb3IgZHJhZyBzdGFydFxuICAgICAtIG9uZW5kIChmdW5jdGlvbikgaGFuZGxlciBmb3IgZHJhZyBlbmRcbiAgICAgLSBtY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgbW92aW5nIGhhbmRsZXJcbiAgICAgLSBzY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgZHJhZyBzdGFydCBoYW5kbGVyXG4gICAgIC0gZWNvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGRyYWcgZW5kIGhhbmRsZXJcbiAgICAgKiBBZGRpdGlvbmFseSBmb2xsb3dpbmcgYGRyYWdgIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZDogYGRyYWcuc3RhcnQuPGlkPmAgb24gc3RhcnQsXG4gICAgICogYGRyYWcuZW5kLjxpZD5gIG9uIGVuZCBhbmQgYGRyYWcubW92ZS48aWQ+YCBvbiBldmVyeSBtb3ZlLiBXaGVuIGVsZW1lbnQgd2lsbCBiZSBkcmFnZ2VkIG92ZXIgYW5vdGhlciBlbGVtZW50XG4gICAgICogYGRyYWcub3Zlci48aWQ+YCB3aWxsIGJlIGZpcmVkIGFzIHdlbGwuXG4gICAgICpcbiAgICAgKiBTdGFydCBldmVudCBhbmQgc3RhcnQgaGFuZGxlciB3aWxsIGJlIGNhbGxlZCBpbiBzcGVjaWZpZWQgY29udGV4dCBvciBpbiBjb250ZXh0IG9mIHRoZSBlbGVtZW50IHdpdGggZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gICAgIG8geCAobnVtYmVyKSB4IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIHkgKG51bWJlcikgeSBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyBldmVudCAob2JqZWN0KSBET00gZXZlbnQgb2JqZWN0XG4gICAgICogTW92ZSBldmVudCBhbmQgbW92ZSBoYW5kbGVyIHdpbGwgYmUgY2FsbGVkIGluIHNwZWNpZmllZCBjb250ZXh0IG9yIGluIGNvbnRleHQgb2YgdGhlIGVsZW1lbnQgd2l0aCBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICAgbyBkeCAobnVtYmVyKSBzaGlmdCBieSB4IGZyb20gdGhlIHN0YXJ0IHBvaW50XG4gICAgIG8gZHkgKG51bWJlcikgc2hpZnQgYnkgeSBmcm9tIHRoZSBzdGFydCBwb2ludFxuICAgICBvIHggKG51bWJlcikgeCBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyB5IChudW1iZXIpIHkgcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8gZXZlbnQgKG9iamVjdCkgRE9NIGV2ZW50IG9iamVjdFxuICAgICAqIEVuZCBldmVudCBhbmQgZW5kIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQgaW4gc3BlY2lmaWVkIGNvbnRleHQgb3IgaW4gY29udGV4dCBvZiB0aGUgZWxlbWVudCB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICAgICBvIGV2ZW50IChvYmplY3QpIERPTSBldmVudCBvYmplY3RcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmRyYWcgPSBmdW5jdGlvbiAob25tb3ZlLCBvbnN0YXJ0LCBvbmVuZCwgbW92ZV9zY29wZSwgc3RhcnRfc2NvcGUsIGVuZF9zY29wZSkge1xuICAgICAgICBmdW5jdGlvbiBzdGFydChlKSB7XG4gICAgICAgICAgICAoZS5vcmlnaW5hbEV2ZW50IHx8IGUpLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgeCA9IGUuY2xpZW50WCxcbiAgICAgICAgICAgICAgICB5ID0gZS5jbGllbnRZLFxuICAgICAgICAgICAgICAgIHNjcm9sbFkgPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGcuZG9jLmJvZHkuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgICAgIHNjcm9sbFggPSBnLmRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCBnLmRvYy5ib2R5LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICB0aGlzLl9kcmFnLmlkID0gZS5pZGVudGlmaWVyO1xuICAgICAgICAgICAgaWYgKHN1cHBvcnRzVG91Y2ggJiYgZS50b3VjaGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBlLnRvdWNoZXMubGVuZ3RoLCB0b3VjaDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoID0gZS50b3VjaGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kcmFnLmlkID0gdG91Y2guaWRlbnRpZmllcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdWNoLmlkZW50aWZpZXIgPT0gdGhpcy5fZHJhZy5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRvdWNoLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gdG91Y2guY2xpZW50WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZHJhZy54ID0geCArIHNjcm9sbFg7XG4gICAgICAgICAgICB0aGlzLl9kcmFnLnkgPSB5ICsgc2Nyb2xsWTtcbiAgICAgICAgICAgICFkcmFnLmxlbmd0aCAmJiBSLm1vdXNlbW92ZShkcmFnTW92ZSkubW91c2V1cChkcmFnVXApO1xuICAgICAgICAgICAgZHJhZy5wdXNoKHtlbDogdGhpcywgbW92ZV9zY29wZTogbW92ZV9zY29wZSwgc3RhcnRfc2NvcGU6IHN0YXJ0X3Njb3BlLCBlbmRfc2NvcGU6IGVuZF9zY29wZX0pO1xuICAgICAgICAgICAgb25zdGFydCAmJiBldmUub24oXCJyYXBoYWVsLmRyYWcuc3RhcnQuXCIgKyB0aGlzLmlkLCBvbnN0YXJ0KTtcbiAgICAgICAgICAgIG9ubW92ZSAmJiBldmUub24oXCJyYXBoYWVsLmRyYWcubW92ZS5cIiArIHRoaXMuaWQsIG9ubW92ZSk7XG4gICAgICAgICAgICBvbmVuZCAmJiBldmUub24oXCJyYXBoYWVsLmRyYWcuZW5kLlwiICsgdGhpcy5pZCwgb25lbmQpO1xuICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5kcmFnLnN0YXJ0LlwiICsgdGhpcy5pZCwgc3RhcnRfc2NvcGUgfHwgbW92ZV9zY29wZSB8fCB0aGlzLCBlLmNsaWVudFggKyBzY3JvbGxYLCBlLmNsaWVudFkgKyBzY3JvbGxZLCBlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kcmFnID0ge307XG4gICAgICAgIGRyYWdnYWJsZS5wdXNoKHtlbDogdGhpcywgc3RhcnQ6IHN0YXJ0fSk7XG4gICAgICAgIHRoaXMubW91c2Vkb3duKHN0YXJ0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5vbkRyYWdPdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTaG9ydGN1dCBmb3IgYXNzaWduaW5nIGV2ZW50IGhhbmRsZXIgZm9yIGBkcmFnLm92ZXIuPGlkPmAgZXZlbnQsIHdoZXJlIGlkIGlzIGlkIG9mIHRoZSBlbGVtZW50IChzZWUgQEVsZW1lbnQuaWQpLlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBmIChmdW5jdGlvbikgaGFuZGxlciBmb3IgZXZlbnQsIGZpcnN0IGFyZ3VtZW50IHdvdWxkIGJlIHRoZSBlbGVtZW50IHlvdSBhcmUgZHJhZ2dpbmcgb3ZlclxuICAgIFxcKi9cbiAgICBlbHByb3RvLm9uRHJhZ092ZXIgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmID8gZXZlLm9uKFwicmFwaGFlbC5kcmFnLm92ZXIuXCIgKyB0aGlzLmlkLCBmKSA6IGV2ZS51bmJpbmQoXCJyYXBoYWVsLmRyYWcub3Zlci5cIiArIHRoaXMuaWQpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5kcmFnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGFsbCBkcmFnIGV2ZW50IGhhbmRsZXJzIGZyb20gZ2l2ZW4gZWxlbWVudC5cbiAgICBcXCovXG4gICAgZWxwcm90by51bmRyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpID0gZHJhZ2dhYmxlLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkgaWYgKGRyYWdnYWJsZVtpXS5lbCA9PSB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzLnVubW91c2Vkb3duKGRyYWdnYWJsZVtpXS5zdGFydCk7XG4gICAgICAgICAgICBkcmFnZ2FibGUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgZXZlLnVuYmluZChcInJhcGhhZWwuZHJhZy4qLlwiICsgdGhpcy5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgIWRyYWdnYWJsZS5sZW5ndGggJiYgUi51bm1vdXNlbW92ZShkcmFnTW92ZSkudW5tb3VzZXVwKGRyYWdVcCk7XG4gICAgICAgIGRyYWcgPSBbXTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5jaXJjbGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGEgY2lyY2xlLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHIgKG51bWJlcikgcmFkaXVzXG4gICAgID0gKG9iamVjdCkgUmFwaGHDq2wgZWxlbWVudCBvYmplY3Qgd2l0aCB0eXBlIOKAnGNpcmNsZeKAnVxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5jaXJjbGUoNTAsIDUwLCA0MCk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uY2lyY2xlID0gZnVuY3Rpb24gKHgsIHksIHIpIHtcbiAgICAgICAgdmFyIG91dCA9IFIuX2VuZ2luZS5jaXJjbGUodGhpcywgeCB8fCAwLCB5IHx8IDAsIHIgfHwgMCk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnJlY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRHJhd3MgYSByZWN0YW5nbGUuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSB0b3AgbGVmdCBjb3JuZXJcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgdG9wIGxlZnQgY29ybmVyXG4gICAgIC0gd2lkdGggKG51bWJlcikgd2lkdGhcbiAgICAgLSBoZWlnaHQgKG51bWJlcikgaGVpZ2h0XG4gICAgIC0gciAobnVtYmVyKSAjb3B0aW9uYWwgcmFkaXVzIGZvciByb3VuZGVkIGNvcm5lcnMsIGRlZmF1bHQgaXMgMFxuICAgICA9IChvYmplY3QpIFJhcGhhw6tsIGVsZW1lbnQgb2JqZWN0IHdpdGggdHlwZSDigJxyZWN04oCdXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCAvLyByZWd1bGFyIHJlY3RhbmdsZVxuICAgICB8IHZhciBjID0gcGFwZXIucmVjdCgxMCwgMTAsIDUwLCA1MCk7XG4gICAgIHwgLy8gcmVjdGFuZ2xlIHdpdGggcm91bmRlZCBjb3JuZXJzXG4gICAgIHwgdmFyIGMgPSBwYXBlci5yZWN0KDQwLCA0MCwgNTAsIDUwLCAxMCk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8ucmVjdCA9IGZ1bmN0aW9uICh4LCB5LCB3LCBoLCByKSB7XG4gICAgICAgIHZhciBvdXQgPSBSLl9lbmdpbmUucmVjdCh0aGlzLCB4IHx8IDAsIHkgfHwgMCwgdyB8fCAwLCBoIHx8IDAsIHIgfHwgMCk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmVsbGlwc2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGFuIGVsbGlwc2UuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0gcnggKG51bWJlcikgaG9yaXpvbnRhbCByYWRpdXNcbiAgICAgLSByeSAobnVtYmVyKSB2ZXJ0aWNhbCByYWRpdXNcbiAgICAgPSAob2JqZWN0KSBSYXBoYcOrbCBlbGVtZW50IG9iamVjdCB3aXRoIHR5cGUg4oCcZWxsaXBzZeKAnVxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5lbGxpcHNlKDUwLCA1MCwgNDAsIDIwKTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5lbGxpcHNlID0gZnVuY3Rpb24gKHgsIHksIHJ4LCByeSkge1xuICAgICAgICB2YXIgb3V0ID0gUi5fZW5naW5lLmVsbGlwc2UodGhpcywgeCB8fCAwLCB5IHx8IDAsIHJ4IHx8IDAsIHJ5IHx8IDApO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5wYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgcGF0aCBlbGVtZW50IGJ5IGdpdmVuIHBhdGggZGF0YSBzdHJpbmcuXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHBhdGhTdHJpbmcgKHN0cmluZykgI29wdGlvbmFsIHBhdGggc3RyaW5nIGluIFNWRyBmb3JtYXQuXG4gICAgICogUGF0aCBzdHJpbmcgY29uc2lzdHMgb2Ygb25lLWxldHRlciBjb21tYW5kcywgZm9sbG93ZWQgYnkgY29tbWEgc2VwcmFyYXRlZCBhcmd1bWVudHMgaW4gbnVtZXJjYWwgZm9ybS4gRXhhbXBsZTpcbiAgICAgfCBcIk0xMCwyMEwzMCw0MFwiXG4gICAgICogSGVyZSB3ZSBjYW4gc2VlIHR3byBjb21tYW5kczog4oCcTeKAnSwgd2l0aCBhcmd1bWVudHMgYCgxMCwgMjApYCBhbmQg4oCcTOKAnSB3aXRoIGFyZ3VtZW50cyBgKDMwLCA0MClgLiBVcHBlciBjYXNlIGxldHRlciBtZWFuIGNvbW1hbmQgaXMgYWJzb2x1dGUsIGxvd2VyIGNhc2XigJRyZWxhdGl2ZS5cbiAgICAgKlxuICAgICAjIDxwPkhlcmUgaXMgc2hvcnQgbGlzdCBvZiBjb21tYW5kcyBhdmFpbGFibGUsIGZvciBtb3JlIGRldGFpbHMgc2VlIDxhIGhyZWY9XCJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvcGF0aHMuaHRtbCNQYXRoRGF0YVwiIHRpdGxlPVwiRGV0YWlscyBvZiBhIHBhdGgncyBkYXRhIGF0dHJpYnV0ZSdzIGZvcm1hdCBhcmUgZGVzY3JpYmVkIGluIHRoZSBTVkcgc3BlY2lmaWNhdGlvbi5cIj5TVkcgcGF0aCBzdHJpbmcgZm9ybWF0PC9hPi48L3A+XG4gICAgICMgPHRhYmxlPjx0aGVhZD48dHI+PHRoPkNvbW1hbmQ8L3RoPjx0aD5OYW1lPC90aD48dGg+UGFyYW1ldGVyczwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT5cbiAgICAgIyA8dHI+PHRkPk08L3RkPjx0ZD5tb3ZldG88L3RkPjx0ZD4oeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5aPC90ZD48dGQ+Y2xvc2VwYXRoPC90ZD48dGQ+KG5vbmUpPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+TDwvdGQ+PHRkPmxpbmV0bzwvdGQ+PHRkPih4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkg8L3RkPjx0ZD5ob3Jpem9udGFsIGxpbmV0bzwvdGQ+PHRkPngrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+VjwvdGQ+PHRkPnZlcnRpY2FsIGxpbmV0bzwvdGQ+PHRkPnkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+QzwvdGQ+PHRkPmN1cnZldG88L3RkPjx0ZD4oeDEgeTEgeDIgeTIgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5TPC90ZD48dGQ+c21vb3RoIGN1cnZldG88L3RkPjx0ZD4oeDIgeTIgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5RPC90ZD48dGQ+cXVhZHJhdGljIELDqXppZXIgY3VydmV0bzwvdGQ+PHRkPih4MSB5MSB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlQ8L3RkPjx0ZD5zbW9vdGggcXVhZHJhdGljIELDqXppZXIgY3VydmV0bzwvdGQ+PHRkPih4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkE8L3RkPjx0ZD5lbGxpcHRpY2FsIGFyYzwvdGQ+PHRkPihyeCByeSB4LWF4aXMtcm90YXRpb24gbGFyZ2UtYXJjLWZsYWcgc3dlZXAtZmxhZyB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlI8L3RkPjx0ZD48YSBocmVmPVwiaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DYXRtdWxs4oCTUm9tX3NwbGluZSNDYXRtdWxsLkUyLjgwLjkzUm9tX3NwbGluZVwiPkNhdG11bGwtUm9tIGN1cnZldG88L2E+KjwvdGQ+PHRkPngxIHkxICh4IHkpKzwvdGQ+PC90cj48L3Rib2R5PjwvdGFibGU+XG4gICAgICogKiDigJxDYXRtdWxsLVJvbSBjdXJ2ZXRv4oCdIGlzIGEgbm90IHN0YW5kYXJkIFNWRyBjb21tYW5kIGFuZCBhZGRlZCBpbiAyLjAgdG8gbWFrZSBsaWZlIGVhc2llci5cbiAgICAgKiBOb3RlOiB0aGVyZSBpcyBhIHNwZWNpYWwgY2FzZSB3aGVuIHBhdGggY29uc2lzdCBvZiBqdXN0IHRocmVlIGNvbW1hbmRzOiDigJxNMTAsMTBS4oCmeuKAnS4gSW4gdGhpcyBjYXNlIHBhdGggd2lsbCBzbW9vdGhseSBjb25uZWN0cyB0byBpdHMgYmVnaW5uaW5nLlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5wYXRoKFwiTTEwIDEwTDkwIDkwXCIpO1xuICAgICB8IC8vIGRyYXcgYSBkaWFnb25hbCBsaW5lOlxuICAgICB8IC8vIG1vdmUgdG8gMTAsMTAsIGxpbmUgdG8gOTAsOTBcbiAgICAgKiBGb3IgZXhhbXBsZSBvZiBwYXRoIHN0cmluZ3MsIGNoZWNrIG91dCB0aGVzZSBpY29uczogaHR0cDovL3JhcGhhZWxqcy5jb20vaWNvbnMvXG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8ucGF0aCA9IGZ1bmN0aW9uIChwYXRoU3RyaW5nKSB7XG4gICAgICAgIHBhdGhTdHJpbmcgJiYgIVIuaXMocGF0aFN0cmluZywgc3RyaW5nKSAmJiAhUi5pcyhwYXRoU3RyaW5nWzBdLCBhcnJheSkgJiYgKHBhdGhTdHJpbmcgKz0gRSk7XG4gICAgICAgIHZhciBvdXQgPSBSLl9lbmdpbmUucGF0aChSLmZvcm1hdFthcHBseV0oUiwgYXJndW1lbnRzKSwgdGhpcyk7XG4gICAgICAgIHRoaXMuX19zZXRfXyAmJiB0aGlzLl9fc2V0X18ucHVzaChvdXQpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmltYWdlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFbWJlZHMgYW4gaW1hZ2UgaW50byB0aGUgc3VyZmFjZS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gc3JjIChzdHJpbmcpIFVSSSBvZiB0aGUgc291cmNlIGltYWdlXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgcG9zaXRpb25cbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBwb3NpdGlvblxuICAgICAtIHdpZHRoIChudW1iZXIpIHdpZHRoIG9mIHRoZSBpbWFnZVxuICAgICAtIGhlaWdodCAobnVtYmVyKSBoZWlnaHQgb2YgdGhlIGltYWdlXG4gICAgID0gKG9iamVjdCkgUmFwaGHDq2wgZWxlbWVudCBvYmplY3Qgd2l0aCB0eXBlIOKAnGltYWdl4oCdXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLmltYWdlKFwiYXBwbGUucG5nXCIsIDEwLCAxMCwgODAsIDgwKTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5pbWFnZSA9IGZ1bmN0aW9uIChzcmMsIHgsIHksIHcsIGgpIHtcbiAgICAgICAgdmFyIG91dCA9IFIuX2VuZ2luZS5pbWFnZSh0aGlzLCBzcmMgfHwgXCJhYm91dDpibGFua1wiLCB4IHx8IDAsIHkgfHwgMCwgdyB8fCAwLCBoIHx8IDApO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci50ZXh0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhIHRleHQgc3RyaW5nLiBJZiB5b3UgbmVlZCBsaW5lIGJyZWFrcywgcHV0IOKAnFxcbuKAnSBpbiB0aGUgc3RyaW5nLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBwb3NpdGlvblxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIHBvc2l0aW9uXG4gICAgIC0gdGV4dCAoc3RyaW5nKSBUaGUgdGV4dCBzdHJpbmcgdG8gZHJhd1xuICAgICA9IChvYmplY3QpIFJhcGhhw6tsIGVsZW1lbnQgb2JqZWN0IHdpdGggdHlwZSDigJx0ZXh04oCdXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgdCA9IHBhcGVyLnRleHQoNTAsIDUwLCBcIlJhcGhhw6tsXFxua2lja3NcXG5idXR0IVwiKTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by50ZXh0ID0gZnVuY3Rpb24gKHgsIHksIHRleHQpIHtcbiAgICAgICAgdmFyIG91dCA9IFIuX2VuZ2luZS50ZXh0KHRoaXMsIHggfHwgMCwgeSB8fCAwLCBTdHIodGV4dCkpO1xuICAgICAgICB0aGlzLl9fc2V0X18gJiYgdGhpcy5fX3NldF9fLnB1c2gob3V0KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5zZXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYXJyYXktbGlrZSBvYmplY3QgdG8ga2VlcCBhbmQgb3BlcmF0ZSBzZXZlcmFsIGVsZW1lbnRzIGF0IG9uY2UuXG4gICAgICogV2FybmluZzogaXQgZG9lc27igJl0IGNyZWF0ZSBhbnkgZWxlbWVudHMgZm9yIGl0c2VsZiBpbiB0aGUgcGFnZSwgaXQganVzdCBncm91cHMgZXhpc3RpbmcgZWxlbWVudHMuXG4gICAgICogU2V0cyBhY3QgYXMgcHNldWRvIGVsZW1lbnRzIOKAlCBhbGwgbWV0aG9kcyBhdmFpbGFibGUgdG8gYW4gZWxlbWVudCBjYW4gYmUgdXNlZCBvbiBhIHNldC5cbiAgICAgPSAob2JqZWN0KSBhcnJheS1saWtlIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgc2V0IG9mIGVsZW1lbnRzXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgc3QgPSBwYXBlci5zZXQoKTtcbiAgICAgfCBzdC5wdXNoKFxuICAgICB8ICAgICBwYXBlci5jaXJjbGUoMTAsIDEwLCA1KSxcbiAgICAgfCAgICAgcGFwZXIuY2lyY2xlKDMwLCAxMCwgNSlcbiAgICAgfCApO1xuICAgICB8IHN0LmF0dHIoe2ZpbGw6IFwicmVkXCJ9KTsgLy8gY2hhbmdlcyB0aGUgZmlsbCBvZiBib3RoIGNpcmNsZXNcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5zZXQgPSBmdW5jdGlvbiAoaXRlbXNBcnJheSkge1xuICAgICAgICAhUi5pcyhpdGVtc0FycmF5LCBcImFycmF5XCIpICYmIChpdGVtc0FycmF5ID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJndW1lbnRzLmxlbmd0aCkpO1xuICAgICAgICB2YXIgb3V0ID0gbmV3IFNldChpdGVtc0FycmF5KTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIG91dFtcInBhcGVyXCJdID0gdGhpcztcbiAgICAgICAgb3V0W1widHlwZVwiXSA9IFwic2V0XCI7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuc2V0U3RhcnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgQFBhcGVyLnNldC4gQWxsIGVsZW1lbnRzIHRoYXQgd2lsbCBiZSBjcmVhdGVkIGFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QgYW5kIGJlZm9yZSBjYWxsaW5nXG4gICAgICogQFBhcGVyLnNldEZpbmlzaCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBzZXQuXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCBwYXBlci5zZXRTdGFydCgpO1xuICAgICB8IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDUpLFxuICAgICB8IHBhcGVyLmNpcmNsZSgzMCwgMTAsIDUpXG4gICAgIHwgdmFyIHN0ID0gcGFwZXIuc2V0RmluaXNoKCk7XG4gICAgIHwgc3QuYXR0cih7ZmlsbDogXCJyZWRcIn0pOyAvLyBjaGFuZ2VzIHRoZSBmaWxsIG9mIGJvdGggY2lyY2xlc1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnNldFN0YXJ0ID0gZnVuY3Rpb24gKHNldCkge1xuICAgICAgICB0aGlzLl9fc2V0X18gPSBzZXQgfHwgdGhpcy5zZXQoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5zZXRGaW5pc2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBAUGFwZXIuc2V0U3RhcnQuIFRoaXMgbWV0aG9kIGZpbmlzaGVzIGNhdGNoaW5nIGFuZCByZXR1cm5zIHJlc3VsdGluZyBzZXQuXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgc2V0XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uc2V0RmluaXNoID0gZnVuY3Rpb24gKHNldCkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5fX3NldF9fO1xuICAgICAgICBkZWxldGUgdGhpcy5fX3NldF9fO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdldFNpemVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE9idGFpbnMgY3VycmVudCBwYXBlciBhY3R1YWwgc2l6ZS5cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KVxuICAgICBcXCovXG4gICAgcGFwZXJwcm90by5nZXRTaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5jYW52YXMucGFyZW50Tm9kZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBjb250YWluZXIub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGNvbnRhaW5lci5vZmZzZXRIZWlnaHRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5zZXRTaXplXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJZiB5b3UgbmVlZCB0byBjaGFuZ2UgZGltZW5zaW9ucyBvZiB0aGUgY2FudmFzIGNhbGwgdGhpcyBtZXRob2RcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gd2lkdGggKG51bWJlcikgbmV3IHdpZHRoIG9mIHRoZSBjYW52YXNcbiAgICAgLSBoZWlnaHQgKG51bWJlcikgbmV3IGhlaWdodCBvZiB0aGUgY2FudmFzXG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uc2V0U2l6ZSA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHJldHVybiBSLl9lbmdpbmUuc2V0U2l6ZS5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnNldFZpZXdCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNldHMgdGhlIHZpZXcgYm94IG9mIHRoZSBwYXBlci4gUHJhY3RpY2FsbHkgaXQgZ2l2ZXMgeW91IGFiaWxpdHkgdG8gem9vbSBhbmQgcGFuIHdob2xlIHBhcGVyIHN1cmZhY2UgYnlcbiAgICAgKiBzcGVjaWZ5aW5nIG5ldyBib3VuZGFyaWVzLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIG5ldyB4IHBvc2l0aW9uLCBkZWZhdWx0IGlzIGAwYFxuICAgICAtIHkgKG51bWJlcikgbmV3IHkgcG9zaXRpb24sIGRlZmF1bHQgaXMgYDBgXG4gICAgIC0gdyAobnVtYmVyKSBuZXcgd2lkdGggb2YgdGhlIGNhbnZhc1xuICAgICAtIGggKG51bWJlcikgbmV3IGhlaWdodCBvZiB0aGUgY2FudmFzXG4gICAgIC0gZml0IChib29sZWFuKSBgdHJ1ZWAgaWYgeW91IHdhbnQgZ3JhcGhpY3MgdG8gZml0IGludG8gbmV3IGJvdW5kYXJ5IGJveFxuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLnNldFZpZXdCb3ggPSBmdW5jdGlvbiAoeCwgeSwgdywgaCwgZml0KSB7XG4gICAgICAgIHJldHVybiBSLl9lbmdpbmUuc2V0Vmlld0JveC5jYWxsKHRoaXMsIHgsIHksIHcsIGgsIGZpdCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIudG9wXG4gICAgIFsgcHJvcGVydHkgXVxuICAgICAqKlxuICAgICAqIFBvaW50cyB0byB0aGUgdG9wbW9zdCBlbGVtZW50IG9uIHRoZSBwYXBlclxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogUGFwZXIuYm90dG9tXG4gICAgIFsgcHJvcGVydHkgXVxuICAgICAqKlxuICAgICAqIFBvaW50cyB0byB0aGUgYm90dG9tIGVsZW1lbnQgb24gdGhlIHBhcGVyXG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8udG9wID0gcGFwZXJwcm90by5ib3R0b20gPSBudWxsO1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5yYXBoYWVsXG4gICAgIFsgcHJvcGVydHkgXVxuICAgICAqKlxuICAgICAqIFBvaW50cyB0byB0aGUgQFJhcGhhZWwgb2JqZWN0L2Z1bmN0aW9uXG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8ucmFwaGFlbCA9IFI7XG4gICAgdmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIHZhciBib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICAgICAgZG9jID0gZWxlbS5vd25lckRvY3VtZW50LFxuICAgICAgICAgICAgYm9keSA9IGRvYy5ib2R5LFxuICAgICAgICAgICAgZG9jRWxlbSA9IGRvYy5kb2N1bWVudEVsZW1lbnQsXG4gICAgICAgICAgICBjbGllbnRUb3AgPSBkb2NFbGVtLmNsaWVudFRvcCB8fCBib2R5LmNsaWVudFRvcCB8fCAwLCBjbGllbnRMZWZ0ID0gZG9jRWxlbS5jbGllbnRMZWZ0IHx8IGJvZHkuY2xpZW50TGVmdCB8fCAwLFxuICAgICAgICAgICAgdG9wICA9IGJveC50b3AgICsgKGcud2luLnBhZ2VZT2Zmc2V0IHx8IGRvY0VsZW0uc2Nyb2xsVG9wIHx8IGJvZHkuc2Nyb2xsVG9wICkgLSBjbGllbnRUb3AsXG4gICAgICAgICAgICBsZWZ0ID0gYm94LmxlZnQgKyAoZy53aW4ucGFnZVhPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxMZWZ0IHx8IGJvZHkuc2Nyb2xsTGVmdCkgLSBjbGllbnRMZWZ0O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeTogdG9wLFxuICAgICAgICAgICAgeDogbGVmdFxuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdldEVsZW1lbnRCeVBvaW50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHlvdSB0b3Btb3N0IGVsZW1lbnQgdW5kZXIgZ2l2ZW4gcG9pbnQuXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgUmFwaGHDq2wgZWxlbWVudCBvYmplY3RcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgZnJvbSB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIHRoZSB3aW5kb3dcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBmcm9tIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgdGhlIHdpbmRvd1xuICAgICA+IFVzYWdlXG4gICAgIHwgcGFwZXIuZ2V0RWxlbWVudEJ5UG9pbnQobW91c2VYLCBtb3VzZVkpLmF0dHIoe3N0cm9rZTogXCIjZjAwXCJ9KTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5nZXRFbGVtZW50QnlQb2ludCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHZhciBwYXBlciA9IHRoaXMsXG4gICAgICAgICAgICBzdmcgPSBwYXBlci5jYW52YXMsXG4gICAgICAgICAgICB0YXJnZXQgPSBnLmRvYy5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xuICAgICAgICBpZiAoZy53aW4ub3BlcmEgJiYgdGFyZ2V0LnRhZ05hbWUgPT0gXCJzdmdcIikge1xuICAgICAgICAgICAgdmFyIHNvID0gZ2V0T2Zmc2V0KHN2ZyksXG4gICAgICAgICAgICAgICAgc3IgPSBzdmcuY3JlYXRlU1ZHUmVjdCgpO1xuICAgICAgICAgICAgc3IueCA9IHggLSBzby54O1xuICAgICAgICAgICAgc3IueSA9IHkgLSBzby55O1xuICAgICAgICAgICAgc3Iud2lkdGggPSBzci5oZWlnaHQgPSAxO1xuICAgICAgICAgICAgdmFyIGhpdHMgPSBzdmcuZ2V0SW50ZXJzZWN0aW9uTGlzdChzciwgbnVsbCk7XG4gICAgICAgICAgICBpZiAoaGl0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBoaXRzW2hpdHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh0YXJnZXQucGFyZW50Tm9kZSAmJiB0YXJnZXQgIT0gc3ZnLnBhcmVudE5vZGUgJiYgIXRhcmdldC5yYXBoYWVsKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQgPT0gcGFwZXIuY2FudmFzLnBhcmVudE5vZGUgJiYgKHRhcmdldCA9IHN2Zyk7XG4gICAgICAgIHRhcmdldCA9IHRhcmdldCAmJiB0YXJnZXQucmFwaGFlbCA/IHBhcGVyLmdldEJ5SWQodGFyZ2V0LnJhcGhhZWxpZCkgOiBudWxsO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ2V0RWxlbWVudHNCeUJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgc2V0IG9mIGVsZW1lbnRzIHRoYXQgaGF2ZSBhbiBpbnRlcnNlY3RpbmcgYm91bmRpbmcgYm94XG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGJib3ggKG9iamVjdCkgYmJveCB0byBjaGVjayB3aXRoXG4gICAgID0gKG9iamVjdCkgQFNldFxuICAgICBcXCovXG4gICAgcGFwZXJwcm90by5nZXRFbGVtZW50c0J5QkJveCA9IGZ1bmN0aW9uIChiYm94KSB7XG4gICAgICAgIHZhciBzZXQgPSB0aGlzLnNldCgpO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAoUi5pc0JCb3hJbnRlcnNlY3QoZWwuZ2V0QkJveCgpLCBiYm94KSkge1xuICAgICAgICAgICAgICAgIHNldC5wdXNoKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzZXQ7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBQYXBlci5nZXRCeUlkXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHlvdSBlbGVtZW50IGJ5IGl0cyBpbnRlcm5hbCBJRC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gaWQgKG51bWJlcikgaWRcbiAgICAgPSAob2JqZWN0KSBSYXBoYcOrbCBlbGVtZW50IG9iamVjdFxuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmdldEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGJvdCA9IHRoaXMuYm90dG9tO1xuICAgICAgICB3aGlsZSAoYm90KSB7XG4gICAgICAgICAgICBpZiAoYm90LmlkID09IGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJvdCA9IGJvdC5uZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmZvckVhY2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEV4ZWN1dGVzIGdpdmVuIGZ1bmN0aW9uIGZvciBlYWNoIGVsZW1lbnQgb24gdGhlIHBhcGVyXG4gICAgICpcbiAgICAgKiBJZiBjYWxsYmFjayBmdW5jdGlvbiByZXR1cm5zIGBmYWxzZWAgaXQgd2lsbCBzdG9wIGxvb3AgcnVubmluZy5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSBmdW5jdGlvbiB0byBydW5cbiAgICAgLSB0aGlzQXJnIChvYmplY3QpIGNvbnRleHQgb2JqZWN0IGZvciB0aGUgY2FsbGJhY2tcbiAgICAgPSAob2JqZWN0KSBQYXBlciBvYmplY3RcbiAgICAgPiBVc2FnZVxuICAgICB8IHBhcGVyLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgIHwgICAgIGVsLmF0dHIoeyBzdHJva2U6IFwiYmx1ZVwiIH0pO1xuICAgICB8IH0pO1xuICAgIFxcKi9cbiAgICBwYXBlcnByb3RvLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgdmFyIGJvdCA9IHRoaXMuYm90dG9tO1xuICAgICAgICB3aGlsZSAoYm90KSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2suY2FsbCh0aGlzQXJnLCBib3QpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYm90ID0gYm90Lm5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ2V0RWxlbWVudHNCeVBvaW50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHNldCBvZiBlbGVtZW50cyB0aGF0IGhhdmUgY29tbW9uIHBvaW50IGluc2lkZVxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgPSAob2JqZWN0KSBAU2V0XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8uZ2V0RWxlbWVudHNCeVBvaW50ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgdmFyIHNldCA9IHRoaXMuc2V0KCk7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGlmIChlbC5pc1BvaW50SW5zaWRlKHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgc2V0LnB1c2goZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHNldDtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHhfeSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMueCArIFMgKyB0aGlzLnk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHhfeV93X2goKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnggKyBTICsgdGhpcy55ICsgUyArIHRoaXMud2lkdGggKyBcIiBcXHhkNyBcIiArIHRoaXMuaGVpZ2h0O1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5pc1BvaW50SW5zaWRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXRlcm1pbmUgaWYgZ2l2ZW4gcG9pbnQgaXMgaW5zaWRlIHRoaXMgZWxlbWVudOKAmXMgc2hhcGVcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBwb2ludCBpbnNpZGUgdGhlIHNoYXBlXG4gICAgXFwqL1xuICAgIGVscHJvdG8uaXNQb2ludEluc2lkZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHZhciBycCA9IHRoaXMucmVhbFBhdGggPSBnZXRQYXRoW3RoaXMudHlwZV0odGhpcyk7XG4gICAgICAgIGlmICh0aGlzLmF0dHIoJ3RyYW5zZm9ybScpICYmIHRoaXMuYXR0cigndHJhbnNmb3JtJykubGVuZ3RoKSB7XG4gICAgICAgICAgICBycCA9IFIudHJhbnNmb3JtUGF0aChycCwgdGhpcy5hdHRyKCd0cmFuc2Zvcm0nKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFIuaXNQb2ludEluc2lkZVBhdGgocnAsIHgsIHkpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0QkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJuIGJvdW5kaW5nIGJveCBmb3IgYSBnaXZlbiBlbGVtZW50XG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGlzV2l0aG91dFRyYW5zZm9ybSAoYm9vbGVhbikgZmxhZywgYHRydWVgIGlmIHlvdSB3YW50IHRvIGhhdmUgYm91bmRpbmcgYm94IGJlZm9yZSB0cmFuc2Zvcm1hdGlvbnMuIERlZmF1bHQgaXMgYGZhbHNlYC5cbiAgICAgPSAob2JqZWN0KSBCb3VuZGluZyBib3ggb2JqZWN0OlxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgdG9wIGxlZnQgY29ybmVyIHhcbiAgICAgbyAgICAgeTogKG51bWJlcikgdG9wIGxlZnQgY29ybmVyIHlcbiAgICAgbyAgICAgeDI6IChudW1iZXIpIGJvdHRvbSByaWdodCBjb3JuZXIgeFxuICAgICBvICAgICB5MjogKG51bWJlcikgYm90dG9tIHJpZ2h0IGNvcm5lciB5XG4gICAgIG8gICAgIHdpZHRoOiAobnVtYmVyKSB3aWR0aFxuICAgICBvICAgICBoZWlnaHQ6IChudW1iZXIpIGhlaWdodFxuICAgICBvIH1cbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRCQm94ID0gZnVuY3Rpb24gKGlzV2l0aG91dFRyYW5zZm9ybSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cbiAgICAgICAgdmFyIF8gPSB0aGlzLl87XG4gICAgICAgIGlmIChpc1dpdGhvdXRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIGlmIChfLmRpcnR5IHx8ICFfLmJib3h3dCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVhbFBhdGggPSBnZXRQYXRoW3RoaXMudHlwZV0odGhpcyk7XG4gICAgICAgICAgICAgICAgXy5iYm94d3QgPSBwYXRoRGltZW5zaW9ucyh0aGlzLnJlYWxQYXRoKTtcbiAgICAgICAgICAgICAgICBfLmJib3h3dC50b1N0cmluZyA9IHhfeV93X2g7XG4gICAgICAgICAgICAgICAgXy5kaXJ0eSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXy5iYm94d3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uZGlydHkgfHwgXy5kaXJ0eVQgfHwgIV8uYmJveCkge1xuICAgICAgICAgICAgaWYgKF8uZGlydHkgfHwgIXRoaXMucmVhbFBhdGgpIHtcbiAgICAgICAgICAgICAgICBfLmJib3h3dCA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWFsUGF0aCA9IGdldFBhdGhbdGhpcy50eXBlXSh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF8uYmJveCA9IHBhdGhEaW1lbnNpb25zKG1hcFBhdGgodGhpcy5yZWFsUGF0aCwgdGhpcy5tYXRyaXgpKTtcbiAgICAgICAgICAgIF8uYmJveC50b1N0cmluZyA9IHhfeV93X2g7XG4gICAgICAgICAgICBfLmRpcnR5ID0gXy5kaXJ0eVQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfLmJib3g7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5jbG9uZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgY2xvbmUgb2YgYSBnaXZlbiBlbGVtZW50XG4gICAgICoqXG4gICAgXFwqL1xuICAgIGVscHJvdG8uY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLnBhcGVyW3RoaXMudHlwZV0oKS5hdHRyKHRoaXMuYXR0cigpKTtcbiAgICAgICAgdGhpcy5fX3NldF9fICYmIHRoaXMuX19zZXRfXy5wdXNoKG91dCk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nbG93XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm4gc2V0IG9mIGVsZW1lbnRzIHRoYXQgY3JlYXRlIGdsb3ctbGlrZSBlZmZlY3QgYXJvdW5kIGdpdmVuIGVsZW1lbnQuIFNlZSBAUGFwZXIuc2V0LlxuICAgICAqXG4gICAgICogTm90ZTogR2xvdyBpcyBub3QgY29ubmVjdGVkIHRvIHRoZSBlbGVtZW50LiBJZiB5b3UgY2hhbmdlIGVsZW1lbnQgYXR0cmlidXRlcyBpdCB3b27igJl0IGFkanVzdCBpdHNlbGYuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGdsb3cgKG9iamVjdCkgI29wdGlvbmFsIHBhcmFtZXRlcnMgb2JqZWN0IHdpdGggYWxsIHByb3BlcnRpZXMgb3B0aW9uYWw6XG4gICAgIG8ge1xuICAgICBvICAgICB3aWR0aCAobnVtYmVyKSBzaXplIG9mIHRoZSBnbG93LCBkZWZhdWx0IGlzIGAxMGBcbiAgICAgbyAgICAgZmlsbCAoYm9vbGVhbikgd2lsbCBpdCBiZSBmaWxsZWQsIGRlZmF1bHQgaXMgYGZhbHNlYFxuICAgICBvICAgICBvcGFjaXR5IChudW1iZXIpIG9wYWNpdHksIGRlZmF1bHQgaXMgYDAuNWBcbiAgICAgbyAgICAgb2Zmc2V0eCAobnVtYmVyKSBob3Jpem9udGFsIG9mZnNldCwgZGVmYXVsdCBpcyBgMGBcbiAgICAgbyAgICAgb2Zmc2V0eSAobnVtYmVyKSB2ZXJ0aWNhbCBvZmZzZXQsIGRlZmF1bHQgaXMgYDBgXG4gICAgIG8gICAgIGNvbG9yIChzdHJpbmcpIGdsb3cgY29sb3VyLCBkZWZhdWx0IGlzIGBibGFja2BcbiAgICAgbyB9XG4gICAgID0gKG9iamVjdCkgQFBhcGVyLnNldCBvZiBlbGVtZW50cyB0aGF0IHJlcHJlc2VudHMgZ2xvd1xuICAgIFxcKi9cbiAgICBlbHByb3RvLmdsb3cgPSBmdW5jdGlvbiAoZ2xvdykge1xuICAgICAgICBpZiAodGhpcy50eXBlID09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBnbG93ID0gZ2xvdyB8fCB7fTtcbiAgICAgICAgdmFyIHMgPSB7XG4gICAgICAgICAgICB3aWR0aDogKGdsb3cud2lkdGggfHwgMTApICsgKCt0aGlzLmF0dHIoXCJzdHJva2Utd2lkdGhcIikgfHwgMSksXG4gICAgICAgICAgICBmaWxsOiBnbG93LmZpbGwgfHwgZmFsc2UsXG4gICAgICAgICAgICBvcGFjaXR5OiBnbG93Lm9wYWNpdHkgfHwgLjUsXG4gICAgICAgICAgICBvZmZzZXR4OiBnbG93Lm9mZnNldHggfHwgMCxcbiAgICAgICAgICAgIG9mZnNldHk6IGdsb3cub2Zmc2V0eSB8fCAwLFxuICAgICAgICAgICAgY29sb3I6IGdsb3cuY29sb3IgfHwgXCIjMDAwXCJcbiAgICAgICAgfSxcbiAgICAgICAgICAgIGMgPSBzLndpZHRoIC8gMixcbiAgICAgICAgICAgIHIgPSB0aGlzLnBhcGVyLFxuICAgICAgICAgICAgb3V0ID0gci5zZXQoKSxcbiAgICAgICAgICAgIHBhdGggPSB0aGlzLnJlYWxQYXRoIHx8IGdldFBhdGhbdGhpcy50eXBlXSh0aGlzKTtcbiAgICAgICAgcGF0aCA9IHRoaXMubWF0cml4ID8gbWFwUGF0aChwYXRoLCB0aGlzLm1hdHJpeCkgOiBwYXRoO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGMgKyAxOyBpKyspIHtcbiAgICAgICAgICAgIG91dC5wdXNoKHIucGF0aChwYXRoKS5hdHRyKHtcbiAgICAgICAgICAgICAgICBzdHJva2U6IHMuY29sb3IsXG4gICAgICAgICAgICAgICAgZmlsbDogcy5maWxsID8gcy5jb2xvciA6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIFwic3Ryb2tlLWxpbmVqb2luXCI6IFwicm91bmRcIixcbiAgICAgICAgICAgICAgICBcInN0cm9rZS1saW5lY2FwXCI6IFwicm91bmRcIixcbiAgICAgICAgICAgICAgICBcInN0cm9rZS13aWR0aFwiOiArKHMud2lkdGggLyBjICogaSkudG9GaXhlZCgzKSxcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiArKHMub3BhY2l0eSAvIGMpLnRvRml4ZWQoMylcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0Lmluc2VydEJlZm9yZSh0aGlzKS50cmFuc2xhdGUocy5vZmZzZXR4LCBzLm9mZnNldHkpO1xuICAgIH07XG4gICAgdmFyIGN1cnZlc2xlbmd0aHMgPSB7fSxcbiAgICBnZXRQb2ludEF0U2VnbWVudExlbmd0aCA9IGZ1bmN0aW9uIChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgbGVuZ3RoKSB7XG4gICAgICAgIGlmIChsZW5ndGggPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGJlemxlbihwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUi5maW5kRG90c0F0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgZ2V0VGF0TGVuKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCBsZW5ndGgpKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0TGVuZ3RoRmFjdG9yeSA9IGZ1bmN0aW9uIChpc3RvdGFsLCBzdWJwYXRoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAocGF0aCwgbGVuZ3RoLCBvbmx5c3RhcnQpIHtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoMmN1cnZlKHBhdGgpO1xuICAgICAgICAgICAgdmFyIHgsIHksIHAsIGwsIHNwID0gXCJcIiwgc3VicGF0aHMgPSB7fSwgcG9pbnQsXG4gICAgICAgICAgICAgICAgbGVuID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHAgPSBwYXRoW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSArcFsxXTtcbiAgICAgICAgICAgICAgICAgICAgeSA9ICtwWzJdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGwgPSBnZXRQb2ludEF0U2VnbWVudExlbmd0aCh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlbiArIGwgPiBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJwYXRoICYmICFzdWJwYXRocy5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50ID0gZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGgoeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSwgbGVuZ3RoIC0gbGVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcCArPSBbXCJDXCIgKyBwb2ludC5zdGFydC54LCBwb2ludC5zdGFydC55LCBwb2ludC5tLngsIHBvaW50Lm0ueSwgcG9pbnQueCwgcG9pbnQueV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlzdGFydCkge3JldHVybiBzcDt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VicGF0aHMuc3RhcnQgPSBzcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcCA9IFtcIk1cIiArIHBvaW50LngsIHBvaW50LnkgKyBcIkNcIiArIHBvaW50Lm4ueCwgcG9pbnQubi55LCBwb2ludC5lbmQueCwgcG9pbnQuZW5kLnksIHBbNV0sIHBbNl1dLmpvaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW4gKz0gbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0gK3BbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeSA9ICtwWzZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc3RvdGFsICYmICFzdWJwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSBnZXRQb2ludEF0U2VnbWVudExlbmd0aCh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdLCBsZW5ndGggLSBsZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7eDogcG9pbnQueCwgeTogcG9pbnQueSwgYWxwaGE6IHBvaW50LmFscGhhfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZW4gKz0gbDtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICtwWzVdO1xuICAgICAgICAgICAgICAgICAgICB5ID0gK3BbNl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNwICs9IHAuc2hpZnQoKSArIHA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdWJwYXRocy5lbmQgPSBzcDtcbiAgICAgICAgICAgIHBvaW50ID0gaXN0b3RhbCA/IGxlbiA6IHN1YnBhdGggPyBzdWJwYXRocyA6IFIuZmluZERvdHNBdFNlZ21lbnQoeCwgeSwgcFswXSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgMSk7XG4gICAgICAgICAgICBwb2ludC5hbHBoYSAmJiAocG9pbnQgPSB7eDogcG9pbnQueCwgeTogcG9pbnQueSwgYWxwaGE6IHBvaW50LmFscGhhfSk7XG4gICAgICAgICAgICByZXR1cm4gcG9pbnQ7XG4gICAgICAgIH07XG4gICAgfTtcbiAgICB2YXIgZ2V0VG90YWxMZW5ndGggPSBnZXRMZW5ndGhGYWN0b3J5KDEpLFxuICAgICAgICBnZXRQb2ludEF0TGVuZ3RoID0gZ2V0TGVuZ3RoRmFjdG9yeSgpLFxuICAgICAgICBnZXRTdWJwYXRoc0F0TGVuZ3RoID0gZ2V0TGVuZ3RoRmFjdG9yeSgwLCAxKTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5nZXRUb3RhbExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBsZW5ndGggb2YgdGhlIGdpdmVuIHBhdGggaW4gcGl4ZWxzLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBwYXRoIChzdHJpbmcpIFNWRyBwYXRoIHN0cmluZy5cbiAgICAgKipcbiAgICAgPSAobnVtYmVyKSBsZW5ndGguXG4gICAgXFwqL1xuICAgIFIuZ2V0VG90YWxMZW5ndGggPSBnZXRUb3RhbExlbmd0aDtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm4gY29vcmRpbmF0ZXMgb2YgdGhlIHBvaW50IGxvY2F0ZWQgYXQgdGhlIGdpdmVuIGxlbmd0aCBvbiB0aGUgZ2l2ZW4gcGF0aC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBTVkcgcGF0aCBzdHJpbmdcbiAgICAgLSBsZW5ndGggKG51bWJlcilcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSByZXByZXNlbnRhdGlvbiBvZiB0aGUgcG9pbnQ6XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGVcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlXG4gICAgIG8gICAgIGFscGhhOiAobnVtYmVyKSBhbmdsZSBvZiBkZXJpdmF0aXZlXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBSLmdldFBvaW50QXRMZW5ndGggPSBnZXRQb2ludEF0TGVuZ3RoO1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmdldFN1YnBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybiBzdWJwYXRoIG9mIGEgZ2l2ZW4gcGF0aCBmcm9tIGdpdmVuIGxlbmd0aCB0byBnaXZlbiBsZW5ndGguXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHBhdGggKHN0cmluZykgU1ZHIHBhdGggc3RyaW5nXG4gICAgIC0gZnJvbSAobnVtYmVyKSBwb3NpdGlvbiBvZiB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnRcbiAgICAgLSB0byAobnVtYmVyKSBwb3NpdGlvbiBvZiB0aGUgZW5kIG9mIHRoZSBzZWdtZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgcGF0aHN0cmluZyBmb3IgdGhlIHNlZ21lbnRcbiAgICBcXCovXG4gICAgUi5nZXRTdWJwYXRoID0gZnVuY3Rpb24gKHBhdGgsIGZyb20sIHRvKSB7XG4gICAgICAgIGlmICh0aGlzLmdldFRvdGFsTGVuZ3RoKHBhdGgpIC0gdG8gPCAxZS02KSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3VicGF0aHNBdExlbmd0aChwYXRoLCBmcm9tKS5lbmQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGEgPSBnZXRTdWJwYXRoc0F0TGVuZ3RoKHBhdGgsIHRvLCAxKTtcbiAgICAgICAgcmV0dXJuIGZyb20gPyBnZXRTdWJwYXRoc0F0TGVuZ3RoKGEsIGZyb20pLmVuZCA6IGE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRUb3RhbExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBsZW5ndGggb2YgdGhlIHBhdGggaW4gcGl4ZWxzLiBPbmx5IHdvcmtzIGZvciBlbGVtZW50IG9mIOKAnHBhdGjigJ0gdHlwZS5cbiAgICAgPSAobnVtYmVyKSBsZW5ndGguXG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0VG90YWxMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoKCk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubm9kZS5nZXRUb3RhbExlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5nZXRUb3RhbExlbmd0aCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldFRvdGFsTGVuZ3RoKHBhdGgpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0UG9pbnRBdExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJuIGNvb3JkaW5hdGVzIG9mIHRoZSBwb2ludCBsb2NhdGVkIGF0IHRoZSBnaXZlbiBsZW5ndGggb24gdGhlIGdpdmVuIHBhdGguIE9ubHkgd29ya3MgZm9yIGVsZW1lbnQgb2Yg4oCccGF0aOKAnSB0eXBlLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBsZW5ndGggKG51bWJlcilcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSByZXByZXNlbnRhdGlvbiBvZiB0aGUgcG9pbnQ6XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGVcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlXG4gICAgIG8gICAgIGFscGhhOiAobnVtYmVyKSBhbmdsZSBvZiBkZXJpdmF0aXZlXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldFBvaW50QXRMZW5ndGggPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoKCk7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldFBvaW50QXRMZW5ndGgocGF0aCwgbGVuZ3RoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldFBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgcGF0aCBvZiB0aGUgZWxlbWVudC4gT25seSB3b3JrcyBmb3IgZWxlbWVudHMgb2Yg4oCccGF0aOKAnSB0eXBlIGFuZCBzaW1wbGUgZWxlbWVudHMgbGlrZSBjaXJjbGUuXG4gICAgID0gKG9iamVjdCkgcGF0aFxuICAgICAqKlxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldFBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXRoLFxuICAgICAgICAgICAgZ2V0UGF0aCA9IFIuX2dldFBhdGhbdGhpcy50eXBlXTtcblxuICAgICAgICBpZiAodGhpcy50eXBlID09IFwidGV4dFwiIHx8IHRoaXMudHlwZSA9PSBcInNldFwiKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2V0UGF0aCkge1xuICAgICAgICAgICAgcGF0aCA9IGdldFBhdGgodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldFN1YnBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybiBzdWJwYXRoIG9mIGEgZ2l2ZW4gZWxlbWVudCBmcm9tIGdpdmVuIGxlbmd0aCB0byBnaXZlbiBsZW5ndGguIE9ubHkgd29ya3MgZm9yIGVsZW1lbnQgb2Yg4oCccGF0aOKAnSB0eXBlLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBmcm9tIChudW1iZXIpIHBvc2l0aW9uIG9mIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudFxuICAgICAtIHRvIChudW1iZXIpIHBvc2l0aW9uIG9mIHRoZSBlbmQgb2YgdGhlIHNlZ21lbnRcbiAgICAgKipcbiAgICAgPSAoc3RyaW5nKSBwYXRoc3RyaW5nIGZvciB0aGUgc2VnbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldFN1YnBhdGggPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGgoKTtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUi5nZXRTdWJwYXRoKHBhdGgsIGZyb20sIHRvKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBSYXBoYWVsLmVhc2luZ19mb3JtdWxhc1xuICAgICBbIHByb3BlcnR5IF1cbiAgICAgKipcbiAgICAgKiBPYmplY3QgdGhhdCBjb250YWlucyBlYXNpbmcgZm9ybXVsYXMgZm9yIGFuaW1hdGlvbi4gWW91IGNvdWxkIGV4dGVuZCBpdCB3aXRoIHlvdXIgb3duLiBCeSBkZWZhdWx0IGl0IGhhcyBmb2xsb3dpbmcgbGlzdCBvZiBlYXNpbmc6XG4gICAgICMgPHVsPlxuICAgICAjICAgICA8bGk+4oCcbGluZWFy4oCdPC9saT5cbiAgICAgIyAgICAgPGxpPuKAnCZsdDvigJ0gb3Ig4oCcZWFzZUlu4oCdIG9yIOKAnGVhc2UtaW7igJ08L2xpPlxuICAgICAjICAgICA8bGk+4oCcPuKAnSBvciDigJxlYXNlT3V04oCdIG9yIOKAnGVhc2Utb3V04oCdPC9saT5cbiAgICAgIyAgICAgPGxpPuKAnCZsdDs+4oCdIG9yIOKAnGVhc2VJbk91dOKAnSBvciDigJxlYXNlLWluLW91dOKAnTwvbGk+XG4gICAgICMgICAgIDxsaT7igJxiYWNrSW7igJ0gb3Ig4oCcYmFjay1pbuKAnTwvbGk+XG4gICAgICMgICAgIDxsaT7igJxiYWNrT3V04oCdIG9yIOKAnGJhY2stb3V04oCdPC9saT5cbiAgICAgIyAgICAgPGxpPuKAnGVsYXN0aWPigJ08L2xpPlxuICAgICAjICAgICA8bGk+4oCcYm91bmNl4oCdPC9saT5cbiAgICAgIyA8L3VsPlxuICAgICAjIDxwPlNlZSBhbHNvIDxhIGhyZWY9XCJodHRwOi8vcmFwaGFlbGpzLmNvbS9lYXNpbmcuaHRtbFwiPkVhc2luZyBkZW1vPC9hPi48L3A+XG4gICAgXFwqL1xuICAgIHZhciBlZiA9IFIuZWFzaW5nX2Zvcm11bGFzID0ge1xuICAgICAgICBsaW5lYXI6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgfSxcbiAgICAgICAgXCI8XCI6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICByZXR1cm4gcG93KG4sIDEuNyk7XG4gICAgICAgIH0sXG4gICAgICAgIFwiPlwiOiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgcmV0dXJuIHBvdyhuLCAuNDgpO1xuICAgICAgICB9LFxuICAgICAgICBcIjw+XCI6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICB2YXIgcSA9IC40OCAtIG4gLyAxLjA0LFxuICAgICAgICAgICAgICAgIFEgPSBtYXRoLnNxcnQoLjE3MzQgKyBxICogcSksXG4gICAgICAgICAgICAgICAgeCA9IFEgLSBxLFxuICAgICAgICAgICAgICAgIFggPSBwb3coYWJzKHgpLCAxIC8gMykgKiAoeCA8IDAgPyAtMSA6IDEpLFxuICAgICAgICAgICAgICAgIHkgPSAtUSAtIHEsXG4gICAgICAgICAgICAgICAgWSA9IHBvdyhhYnMoeSksIDEgLyAzKSAqICh5IDwgMCA/IC0xIDogMSksXG4gICAgICAgICAgICAgICAgdCA9IFggKyBZICsgLjU7XG4gICAgICAgICAgICByZXR1cm4gKDEgLSB0KSAqIDMgKiB0ICogdCArIHQgKiB0ICogdDtcbiAgICAgICAgfSxcbiAgICAgICAgYmFja0luOiBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgICAgICAgcmV0dXJuIG4gKiBuICogKChzICsgMSkgKiBuIC0gcyk7XG4gICAgICAgIH0sXG4gICAgICAgIGJhY2tPdXQ6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICBuID0gbiAtIDE7XG4gICAgICAgICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICAgICAgICByZXR1cm4gbiAqIG4gKiAoKHMgKyAxKSAqIG4gKyBzKSArIDE7XG4gICAgICAgIH0sXG4gICAgICAgIGVsYXN0aWM6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICBpZiAobiA9PSAhIW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwb3coMiwgLTEwICogbikgKiBtYXRoLnNpbigobiAtIC4wNzUpICogKDIgKiBQSSkgLyAuMykgKyAxO1xuICAgICAgICB9LFxuICAgICAgICBib3VuY2U6IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICB2YXIgcyA9IDcuNTYyNSxcbiAgICAgICAgICAgICAgICBwID0gMi43NSxcbiAgICAgICAgICAgICAgICBsO1xuICAgICAgICAgICAgaWYgKG4gPCAoMSAvIHApKSB7XG4gICAgICAgICAgICAgICAgbCA9IHMgKiBuICogbjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG4gPCAoMiAvIHApKSB7XG4gICAgICAgICAgICAgICAgICAgIG4gLT0gKDEuNSAvIHApO1xuICAgICAgICAgICAgICAgICAgICBsID0gcyAqIG4gKiBuICsgLjc1O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuIDwgKDIuNSAvIHApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuIC09ICgyLjI1IC8gcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsID0gcyAqIG4gKiBuICsgLjkzNzU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuIC09ICgyLjYyNSAvIHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IHMgKiBuICogbiArIC45ODQzNzU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZWYuZWFzZUluID0gZWZbXCJlYXNlLWluXCJdID0gZWZbXCI8XCJdO1xuICAgIGVmLmVhc2VPdXQgPSBlZltcImVhc2Utb3V0XCJdID0gZWZbXCI+XCJdO1xuICAgIGVmLmVhc2VJbk91dCA9IGVmW1wiZWFzZS1pbi1vdXRcIl0gPSBlZltcIjw+XCJdO1xuICAgIGVmW1wiYmFjay1pblwiXSA9IGVmLmJhY2tJbjtcbiAgICBlZltcImJhY2stb3V0XCJdID0gZWYuYmFja091dDtcblxuICAgIHZhciBhbmltYXRpb25FbGVtZW50cyA9IFtdLFxuICAgICAgICByZXF1ZXN0QW5pbUZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjYWxsYmFjaywgMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgYW5pbWF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIE5vdyA9ICtuZXcgRGF0ZSxcbiAgICAgICAgICAgICAgICBsID0gMDtcbiAgICAgICAgICAgIGZvciAoOyBsIDwgYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoOyBsKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGFuaW1hdGlvbkVsZW1lbnRzW2xdO1xuICAgICAgICAgICAgICAgIGlmIChlLmVsLnJlbW92ZWQgfHwgZS5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0aW1lID0gTm93IC0gZS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgbXMgPSBlLm1zLFxuICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSBlLmVhc2luZyxcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IGUuZnJvbSxcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA9IGUuZGlmZixcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBlLnRvLFxuICAgICAgICAgICAgICAgICAgICB0ID0gZS50LFxuICAgICAgICAgICAgICAgICAgICB0aGF0ID0gZS5lbCxcbiAgICAgICAgICAgICAgICAgICAgc2V0ID0ge30sXG4gICAgICAgICAgICAgICAgICAgIG5vdyxcbiAgICAgICAgICAgICAgICAgICAgaW5pdCA9IHt9LFxuICAgICAgICAgICAgICAgICAgICBrZXk7XG4gICAgICAgICAgICAgICAgaWYgKGUuaW5pdHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICB0aW1lID0gKGUuaW5pdHN0YXR1cyAqIGUuYW5pbS50b3AgLSBlLnByZXYpIC8gKGUucGVyY2VudCAtIGUucHJldikgKiBtcztcbiAgICAgICAgICAgICAgICAgICAgZS5zdGF0dXMgPSBlLmluaXRzdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLmluaXRzdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcCAmJiBhbmltYXRpb25FbGVtZW50cy5zcGxpY2UobC0tLCAxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlLnN0YXR1cyA9IChlLnByZXYgKyAoZS5wZXJjZW50IC0gZS5wcmV2KSAqICh0aW1lIC8gbXMpKSAvIGUuYW5pbS50b3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aW1lIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPCBtcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zID0gZWFzaW5nKHRpbWUgLyBtcyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGF0dHIgaW4gZnJvbSkgaWYgKGZyb21baGFzXShhdHRyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChhdmFpbGFibGVBbmltQXR0cnNbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIG51OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSArZnJvbVthdHRyXSArIHBvcyAqIG1zICogZGlmZlthdHRyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNvbG91clwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSBcInJnYihcIiArIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwdG8yNTUocm91bmQoZnJvbVthdHRyXS5yICsgcG9zICogbXMgKiBkaWZmW2F0dHJdLnIpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwdG8yNTUocm91bmQoZnJvbVthdHRyXS5nICsgcG9zICogbXMgKiBkaWZmW2F0dHJdLmcpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwdG8yNTUocm91bmQoZnJvbVthdHRyXS5iICsgcG9zICogbXMgKiBkaWZmW2F0dHJdLmIpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLmpvaW4oXCIsXCIpICsgXCIpXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJwYXRoXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBmcm9tW2F0dHJdLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vd1tpXSA9IFtmcm9tW2F0dHJdW2ldWzBdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxLCBqaiA9IGZyb21bYXR0cl1baV0ubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vd1tpXVtqXSA9ICtmcm9tW2F0dHJdW2ldW2pdICsgcG9zICogbXMgKiBkaWZmW2F0dHJdW2ldW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93W2ldID0gbm93W2ldLmpvaW4oUyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gbm93LmpvaW4oUyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmFuc2Zvcm1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpZmZbYXR0cl0ucmVhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGZyb21bYXR0cl0ubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vd1tpXSA9IFtmcm9tW2F0dHJdW2ldWzBdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBqaiA9IGZyb21bYXR0cl1baV0ubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3dbaV1bal0gPSBmcm9tW2F0dHJdW2ldW2pdICsgcG9zICogbXMgKiBkaWZmW2F0dHJdW2ldW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBnZXQgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiArZnJvbVthdHRyXVtpXSArIHBvcyAqIG1zICogZGlmZlthdHRyXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub3cgPSBbW1wiclwiLCBnZXQoMiksIDAsIDBdLCBbXCJ0XCIsIGdldCgzKSwgZ2V0KDQpXSwgW1wic1wiLCBnZXQoMCksIGdldCgxKSwgMCwgMF1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gW1tcIm1cIiwgZ2V0KDApLCBnZXQoMSksIGdldCgyKSwgZ2V0KDMpLCBnZXQoNCksIGdldCg1KV1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjc3ZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHIgPT0gXCJjbGlwLXJlY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3dbaV0gPSArZnJvbVthdHRyXVtpXSArIHBvcyAqIG1zICogZGlmZlthdHRyXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnJvbTIgPSBbXVtjb25jYXRdKGZyb21bYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IHRoYXQucGFwZXIuY3VzdG9tQXR0cmlidXRlc1thdHRyXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vd1tpXSA9ICtmcm9tMltpXSArIHBvcyAqIG1zICogZGlmZlthdHRyXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFthdHRyXSA9IG5vdztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LmF0dHIoc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uIChpZCwgdGhhdCwgYW5pbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5hbmltLmZyYW1lLlwiICsgaWQsIHRoYXQsIGFuaW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pKHRoYXQuaWQsIHRoYXQsIGUuYW5pbSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uKGYsIGVsLCBhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZShcInJhcGhhZWwuYW5pbS5mcmFtZS5cIiArIGVsLmlkLCBlbCwgYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlKFwicmFwaGFlbC5hbmltLmZpbmlzaC5cIiArIGVsLmlkLCBlbCwgYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUi5pcyhmLCBcImZ1bmN0aW9uXCIpICYmIGYuY2FsbChlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkoZS5jYWxsYmFjaywgdGhhdCwgZS5hbmltKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5hdHRyKHRvKTtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHMuc3BsaWNlKGwtLSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLnJlcGVhdCA+IDEgJiYgIWUubmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gdG8pIGlmICh0b1toYXNdKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0W2tleV0gPSBlLnRvdGFsT3JpZ2luW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlLmVsLmF0dHIoaW5pdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5BbmltYXRpb24oZS5hbmltLCBlLmVsLCBlLmFuaW0ucGVyY2VudHNbMF0sIG51bGwsIGUudG90YWxPcmlnaW4sIGUucmVwZWF0IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGUubmV4dCAmJiAhZS5zdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5BbmltYXRpb24oZS5hbmltLCBlLmVsLCBlLm5leHQsIG51bGwsIGUudG90YWxPcmlnaW4sIGUucmVwZWF0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFIuc3ZnICYmIHRoYXQgJiYgdGhhdC5wYXBlciAmJiB0aGF0LnBhcGVyLnNhZmFyaSgpO1xuICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoICYmIHJlcXVlc3RBbmltRnJhbWUoYW5pbWF0aW9uKTtcbiAgICAgICAgfSxcbiAgICAgICAgdXB0bzI1NSA9IGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbG9yID4gMjU1ID8gMjU1IDogY29sb3IgPCAwID8gMCA6IGNvbG9yO1xuICAgICAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFuaW1hdGVXaXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBY3RzIHNpbWlsYXIgdG8gQEVsZW1lbnQuYW5pbWF0ZSwgYnV0IGVuc3VyZSB0aGF0IGdpdmVuIGFuaW1hdGlvbiBydW5zIGluIHN5bmMgd2l0aCBhbm90aGVyIGdpdmVuIGVsZW1lbnQuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGVsIChvYmplY3QpIGVsZW1lbnQgdG8gc3luYyB3aXRoXG4gICAgIC0gYW5pbSAob2JqZWN0KSBhbmltYXRpb24gdG8gc3luYyB3aXRoXG4gICAgIC0gcGFyYW1zIChvYmplY3QpICNvcHRpb25hbCBmaW5hbCBhdHRyaWJ1dGVzIGZvciB0aGUgZWxlbWVudCwgc2VlIGFsc28gQEVsZW1lbnQuYXR0clxuICAgICAtIG1zIChudW1iZXIpICNvcHRpb25hbCBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGZvciBhbmltYXRpb24gdG8gcnVuXG4gICAgIC0gZWFzaW5nIChzdHJpbmcpICNvcHRpb25hbCBlYXNpbmcgdHlwZS4gQWNjZXB0IG9uIG9mIEBSYXBoYWVsLmVhc2luZ19mb3JtdWxhcyBvciBDU1MgZm9ybWF0OiBgY3ViaWMmI3gyMDEwO2JlemllcihYWCwmIzE2MDtYWCwmIzE2MDtYWCwmIzE2MDtYWClgXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGF0IHRoZSBlbmQgb2YgYW5pbWF0aW9uLlxuICAgICAqIG9yXG4gICAgIC0gZWxlbWVudCAob2JqZWN0KSBlbGVtZW50IHRvIHN5bmMgd2l0aFxuICAgICAtIGFuaW0gKG9iamVjdCkgYW5pbWF0aW9uIHRvIHN5bmMgd2l0aFxuICAgICAtIGFuaW1hdGlvbiAob2JqZWN0KSAjb3B0aW9uYWwgYW5pbWF0aW9uIG9iamVjdCwgc2VlIEBSYXBoYWVsLmFuaW1hdGlvblxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5hbmltYXRlV2l0aCA9IGZ1bmN0aW9uIChlbCwgYW5pbSwgcGFyYW1zLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgICAgIGlmIChlbGVtZW50LnJlbW92ZWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwoZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYSA9IHBhcmFtcyBpbnN0YW5jZW9mIEFuaW1hdGlvbiA/IHBhcmFtcyA6IFIuYW5pbWF0aW9uKHBhcmFtcywgbXMsIGVhc2luZywgY2FsbGJhY2spLFxuICAgICAgICAgICAgeCwgeTtcbiAgICAgICAgcnVuQW5pbWF0aW9uKGEsIGVsZW1lbnQsIGEucGVyY2VudHNbMF0sIG51bGwsIGVsZW1lbnQuYXR0cigpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkVsZW1lbnRzW2ldLmFuaW0gPT0gYW5pbSAmJiBhbmltYXRpb25FbGVtZW50c1tpXS5lbCA9PSBlbCkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVsZW1lbnRzW2lpIC0gMV0uc3RhcnQgPSBhbmltYXRpb25FbGVtZW50c1tpXS5zdGFydDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgLy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gdmFyIGEgPSBwYXJhbXMgPyBSLmFuaW1hdGlvbihwYXJhbXMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSA6IGFuaW0sXG4gICAgICAgIC8vICAgICBzdGF0dXMgPSBlbGVtZW50LnN0YXR1cyhhbmltKTtcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuYW5pbWF0ZShhKS5zdGF0dXMoYSwgc3RhdHVzICogYW5pbS5tcyAvIGEubXMpO1xuICAgIH07XG4gICAgZnVuY3Rpb24gQ3ViaWNCZXppZXJBdFRpbWUodCwgcDF4LCBwMXksIHAyeCwgcDJ5LCBkdXJhdGlvbikge1xuICAgICAgICB2YXIgY3ggPSAzICogcDF4LFxuICAgICAgICAgICAgYnggPSAzICogKHAyeCAtIHAxeCkgLSBjeCxcbiAgICAgICAgICAgIGF4ID0gMSAtIGN4IC0gYngsXG4gICAgICAgICAgICBjeSA9IDMgKiBwMXksXG4gICAgICAgICAgICBieSA9IDMgKiAocDJ5IC0gcDF5KSAtIGN5LFxuICAgICAgICAgICAgYXkgPSAxIC0gY3kgLSBieTtcbiAgICAgICAgZnVuY3Rpb24gc2FtcGxlQ3VydmVYKHQpIHtcbiAgICAgICAgICAgIHJldHVybiAoKGF4ICogdCArIGJ4KSAqIHQgKyBjeCkgKiB0O1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHNvbHZlKHgsIGVwc2lsb24pIHtcbiAgICAgICAgICAgIHZhciB0ID0gc29sdmVDdXJ2ZVgoeCwgZXBzaWxvbik7XG4gICAgICAgICAgICByZXR1cm4gKChheSAqIHQgKyBieSkgKiB0ICsgY3kpICogdDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzb2x2ZUN1cnZlWCh4LCBlcHNpbG9uKSB7XG4gICAgICAgICAgICB2YXIgdDAsIHQxLCB0MiwgeDIsIGQyLCBpO1xuICAgICAgICAgICAgZm9yKHQyID0geCwgaSA9IDA7IGkgPCA4OyBpKyspIHtcbiAgICAgICAgICAgICAgICB4MiA9IHNhbXBsZUN1cnZlWCh0MikgLSB4O1xuICAgICAgICAgICAgICAgIGlmIChhYnMoeDIpIDwgZXBzaWxvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGQyID0gKDMgKiBheCAqIHQyICsgMiAqIGJ4KSAqIHQyICsgY3g7XG4gICAgICAgICAgICAgICAgaWYgKGFicyhkMikgPCAxZS02KSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0MiA9IHQyIC0geDIgLyBkMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHQwID0gMDtcbiAgICAgICAgICAgIHQxID0gMTtcbiAgICAgICAgICAgIHQyID0geDtcbiAgICAgICAgICAgIGlmICh0MiA8IHQwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQyID4gdDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAodDAgPCB0MSkge1xuICAgICAgICAgICAgICAgIHgyID0gc2FtcGxlQ3VydmVYKHQyKTtcbiAgICAgICAgICAgICAgICBpZiAoYWJzKHgyIC0geCkgPCBlcHNpbG9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0MjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHggPiB4Mikge1xuICAgICAgICAgICAgICAgICAgICB0MCA9IHQyO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHQxID0gdDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHQyID0gKHQxIC0gdDApIC8gMiArIHQwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHQyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzb2x2ZSh0LCAxIC8gKDIwMCAqIGR1cmF0aW9uKSk7XG4gICAgfVxuICAgIGVscHJvdG8ub25BbmltYXRpb24gPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmID8gZXZlLm9uKFwicmFwaGFlbC5hbmltLmZyYW1lLlwiICsgdGhpcy5pZCwgZikgOiBldmUudW5iaW5kKFwicmFwaGFlbC5hbmltLmZyYW1lLlwiICsgdGhpcy5pZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZnVuY3Rpb24gQW5pbWF0aW9uKGFuaW0sIG1zKSB7XG4gICAgICAgIHZhciBwZXJjZW50cyA9IFtdLFxuICAgICAgICAgICAgbmV3QW5pbSA9IHt9O1xuICAgICAgICB0aGlzLm1zID0gbXM7XG4gICAgICAgIHRoaXMudGltZXMgPSAxO1xuICAgICAgICBpZiAoYW5pbSkge1xuICAgICAgICAgICAgZm9yICh2YXIgYXR0ciBpbiBhbmltKSBpZiAoYW5pbVtoYXNdKGF0dHIpKSB7XG4gICAgICAgICAgICAgICAgbmV3QW5pbVt0b0Zsb2F0KGF0dHIpXSA9IGFuaW1bYXR0cl07XG4gICAgICAgICAgICAgICAgcGVyY2VudHMucHVzaCh0b0Zsb2F0KGF0dHIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBlcmNlbnRzLnNvcnQoc29ydEJ5TnVtYmVyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFuaW0gPSBuZXdBbmltO1xuICAgICAgICB0aGlzLnRvcCA9IHBlcmNlbnRzW3BlcmNlbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB0aGlzLnBlcmNlbnRzID0gcGVyY2VudHM7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBBbmltYXRpb24uZGVsYXlcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBjb3B5IG9mIGV4aXN0aW5nIGFuaW1hdGlvbiBvYmplY3Qgd2l0aCBnaXZlbiBkZWxheS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gZGVsYXkgKG51bWJlcikgbnVtYmVyIG9mIG1zIHRvIHBhc3MgYmV0d2VlbiBhbmltYXRpb24gc3RhcnQgYW5kIGFjdHVhbCBhbmltYXRpb25cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBuZXcgYWx0ZXJlZCBBbmltYXRpb24gb2JqZWN0XG4gICAgIHwgdmFyIGFuaW0gPSBSYXBoYWVsLmFuaW1hdGlvbih7Y3g6IDEwLCBjeTogMjB9LCAyZTMpO1xuICAgICB8IGNpcmNsZTEuYW5pbWF0ZShhbmltKTsgLy8gcnVuIHRoZSBnaXZlbiBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgfCBjaXJjbGUyLmFuaW1hdGUoYW5pbS5kZWxheSg1MDApKTsgLy8gcnVuIHRoZSBnaXZlbiBhbmltYXRpb24gYWZ0ZXIgNTAwIG1zXG4gICAgXFwqL1xuICAgIEFuaW1hdGlvbi5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAoZGVsYXkpIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgQW5pbWF0aW9uKHRoaXMuYW5pbSwgdGhpcy5tcyk7XG4gICAgICAgIGEudGltZXMgPSB0aGlzLnRpbWVzO1xuICAgICAgICBhLmRlbCA9ICtkZWxheSB8fCAwO1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBBbmltYXRpb24ucmVwZWF0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgY29weSBvZiBleGlzdGluZyBhbmltYXRpb24gb2JqZWN0IHdpdGggZ2l2ZW4gcmVwZXRpdGlvbi5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gcmVwZWF0IChudW1iZXIpIG51bWJlciBpdGVyYXRpb25zIG9mIGFuaW1hdGlvbi4gRm9yIGluZmluaXRlIGFuaW1hdGlvbiBwYXNzIGBJbmZpbml0eWBcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBuZXcgYWx0ZXJlZCBBbmltYXRpb24gb2JqZWN0XG4gICAgXFwqL1xuICAgIEFuaW1hdGlvbi5wcm90b3R5cGUucmVwZWF0ID0gZnVuY3Rpb24gKHRpbWVzKSB7XG4gICAgICAgIHZhciBhID0gbmV3IEFuaW1hdGlvbih0aGlzLmFuaW0sIHRoaXMubXMpO1xuICAgICAgICBhLmRlbCA9IHRoaXMuZGVsO1xuICAgICAgICBhLnRpbWVzID0gbWF0aC5mbG9vcihtbWF4KHRpbWVzLCAwKSkgfHwgMTtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBydW5BbmltYXRpb24oYW5pbSwgZWxlbWVudCwgcGVyY2VudCwgc3RhdHVzLCB0b3RhbE9yaWdpbiwgdGltZXMpIHtcbiAgICAgICAgcGVyY2VudCA9IHRvRmxvYXQocGVyY2VudCk7XG4gICAgICAgIHZhciBwYXJhbXMsXG4gICAgICAgICAgICBpc0luQW5pbSxcbiAgICAgICAgICAgIGlzSW5BbmltU2V0LFxuICAgICAgICAgICAgcGVyY2VudHMgPSBbXSxcbiAgICAgICAgICAgIG5leHQsXG4gICAgICAgICAgICBwcmV2LFxuICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgbXMgPSBhbmltLm1zLFxuICAgICAgICAgICAgZnJvbSA9IHt9LFxuICAgICAgICAgICAgdG8gPSB7fSxcbiAgICAgICAgICAgIGRpZmYgPSB7fTtcbiAgICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSBhbmltYXRpb25FbGVtZW50c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoZS5lbC5pZCA9PSBlbGVtZW50LmlkICYmIGUuYW5pbSA9PSBhbmltKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLnBlcmNlbnQgIT0gcGVyY2VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNJbkFuaW1TZXQgPSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNJbkFuaW0gPSBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXR0cihlLnRvdGFsT3JpZ2luKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHVzID0gK3RvOyAvLyBOYU5cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhbmltLnBlcmNlbnRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhbmltLnBlcmNlbnRzW2ldID09IHBlcmNlbnQgfHwgYW5pbS5wZXJjZW50c1tpXSA+IHN0YXR1cyAqIGFuaW0udG9wKSB7XG4gICAgICAgICAgICAgICAgcGVyY2VudCA9IGFuaW0ucGVyY2VudHNbaV07XG4gICAgICAgICAgICAgICAgcHJldiA9IGFuaW0ucGVyY2VudHNbaSAtIDFdIHx8IDA7XG4gICAgICAgICAgICAgICAgbXMgPSBtcyAvIGFuaW0udG9wICogKHBlcmNlbnQgLSBwcmV2KTtcbiAgICAgICAgICAgICAgICBuZXh0ID0gYW5pbS5wZXJjZW50c1tpICsgMV07XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gYW5pbS5hbmltW3BlcmNlbnRdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmF0dHIoYW5pbS5hbmltW2FuaW0ucGVyY2VudHNbaV1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhcmFtcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNJbkFuaW0pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGF0dHIgaW4gcGFyYW1zKSBpZiAocGFyYW1zW2hhc10oYXR0cikpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXZhaWxhYmxlQW5pbUF0dHJzW2hhc10oYXR0cikgfHwgZWxlbWVudC5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2hhc10oYXR0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbVthdHRyXSA9IGVsZW1lbnQuYXR0cihhdHRyKTtcbiAgICAgICAgICAgICAgICAgICAgKGZyb21bYXR0cl0gPT0gbnVsbCkgJiYgKGZyb21bYXR0cl0gPSBhdmFpbGFibGVBdHRyc1thdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgIHRvW2F0dHJdID0gcGFyYW1zW2F0dHJdO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGF2YWlsYWJsZUFuaW1BdHRyc1thdHRyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBudTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdID0gKHRvW2F0dHJdIC0gZnJvbVthdHRyXSkgLyBtcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjb2xvdXJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tW2F0dHJdID0gUi5nZXRSR0IoZnJvbVthdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvQ29sb3VyID0gUi5nZXRSR0IodG9bYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHI6ICh0b0NvbG91ci5yIC0gZnJvbVthdHRyXS5yKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnOiAodG9Db2xvdXIuZyAtIGZyb21bYXR0cl0uZykgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYjogKHRvQ29sb3VyLmIgLSBmcm9tW2F0dHJdLmIpIC8gbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInBhdGhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aGVzID0gcGF0aDJjdXJ2ZShmcm9tW2F0dHJdLCB0b1thdHRyXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvUGF0aCA9IHBhdGhlc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tW2F0dHJdID0gcGF0aGVzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGZyb21bYXR0cl0ubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdW2ldID0gWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMSwgamogPSBmcm9tW2F0dHJdW2ldLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl1baV1bal0gPSAodG9QYXRoW2ldW2pdIC0gZnJvbVthdHRyXVtpXVtqXSkgLyBtcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmFuc2Zvcm1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgXyA9IGVsZW1lbnQuXyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXEgPSBlcXVhbGlzZVRyYW5zZm9ybShfW2F0dHJdLCB0b1thdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21bYXR0cl0gPSBlcS5mcm9tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b1thdHRyXSA9IGVxLnRvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0ucmVhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gZnJvbVthdHRyXS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdW2ldID0gW2Zyb21bYXR0cl1baV1bMF1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgamogPSBmcm9tW2F0dHJdW2ldLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWZmW2F0dHJdW2ldW2pdID0gKHRvW2F0dHJdW2ldW2pdIC0gZnJvbVthdHRyXVtpXVtqXSkgLyBtcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtID0gKGVsZW1lbnQubWF0cml4IHx8IG5ldyBNYXRyaXgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF86IHt0cmFuc2Zvcm06IF8udHJhbnNmb3JtfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRCQm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmdldEJCb3goMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbVthdHRyXSA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uYSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uYixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0uZlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0VHJhbnNmb3JtKHRvMiwgdG9bYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b1thdHRyXSA9IHRvMi5fLnRyYW5zZm9ybTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXSA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0bzIubWF0cml4LmEgLSBtLmEpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG8yLm1hdHJpeC5iIC0gbS5iKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRvMi5tYXRyaXguYyAtIG0uYykgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0bzIubWF0cml4LmQgLSBtLmQpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG8yLm1hdHJpeC5lIC0gbS5lKSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRvMi5tYXRyaXguZiAtIG0uZikgLyBtc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmcm9tW2F0dHJdID0gW18uc3gsIF8uc3ksIF8uZGVnLCBfLmR4LCBfLmR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmFyIHRvMiA9IHtfOnt9LCBnZXRCQm94OiBmdW5jdGlvbiAoKSB7IHJldHVybiBlbGVtZW50LmdldEJCb3goKTsgfX07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4dHJhY3RUcmFuc2Zvcm0odG8yLCB0b1thdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpZmZbYXR0cl0gPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAodG8yLl8uc3ggLSBfLnN4KSAvIG1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgKHRvMi5fLnN5IC0gXy5zeSkgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICh0bzIuXy5kZWcgLSBfLmRlZykgLyBtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICh0bzIuXy5keCAtIF8uZHgpIC8gbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAodG8yLl8uZHkgLSBfLmR5KSAvIG1zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNzdlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBTdHIocGFyYW1zW2F0dHJdKVtzcGxpdF0oc2VwYXJhdG9yKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbTIgPSBTdHIoZnJvbVthdHRyXSlbc3BsaXRdKHNlcGFyYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHIgPT0gXCJjbGlwLXJlY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tW2F0dHJdID0gZnJvbTI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IGZyb20yLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlmZlthdHRyXVtpXSA9ICh2YWx1ZXNbaV0gLSBmcm9tW2F0dHJdW2ldKSAvIG1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvW2F0dHJdID0gdmFsdWVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbXVtjb25jYXRdKHBhcmFtc1thdHRyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbTIgPSBbXVtjb25jYXRdKGZyb21bYXR0cl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gZWxlbWVudC5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW2F0dHJdLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZbYXR0cl1baV0gPSAoKHZhbHVlc1tpXSB8fCAwKSAtIChmcm9tMltpXSB8fCAwKSkgLyBtcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZWFzaW5nID0gcGFyYW1zLmVhc2luZyxcbiAgICAgICAgICAgICAgICBlYXN5ZWFzeSA9IFIuZWFzaW5nX2Zvcm11bGFzW2Vhc2luZ107XG4gICAgICAgICAgICBpZiAoIWVhc3llYXN5KSB7XG4gICAgICAgICAgICAgICAgZWFzeWVhc3kgPSBTdHIoZWFzaW5nKS5tYXRjaChiZXppZXJyZyk7XG4gICAgICAgICAgICAgICAgaWYgKGVhc3llYXN5ICYmIGVhc3llYXN5Lmxlbmd0aCA9PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJ2ZSA9IGVhc3llYXN5O1xuICAgICAgICAgICAgICAgICAgICBlYXN5ZWFzeSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQ3ViaWNCZXppZXJBdFRpbWUodCwgK2N1cnZlWzFdLCArY3VydmVbMl0sICtjdXJ2ZVszXSwgK2N1cnZlWzRdLCBtcyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWFzeWVhc3kgPSBwaXBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRpbWVzdGFtcCA9IHBhcmFtcy5zdGFydCB8fCBhbmltLnN0YXJ0IHx8ICtuZXcgRGF0ZTtcbiAgICAgICAgICAgIGUgPSB7XG4gICAgICAgICAgICAgICAgYW5pbTogYW5pbSxcbiAgICAgICAgICAgICAgICBwZXJjZW50OiBwZXJjZW50LFxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogdGltZXN0YW1wLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiB0aW1lc3RhbXAgKyAoYW5pbS5kZWwgfHwgMCksXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAwLFxuICAgICAgICAgICAgICAgIGluaXRzdGF0dXM6IHN0YXR1cyB8fCAwLFxuICAgICAgICAgICAgICAgIHN0b3A6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1zOiBtcyxcbiAgICAgICAgICAgICAgICBlYXNpbmc6IGVhc3llYXN5LFxuICAgICAgICAgICAgICAgIGZyb206IGZyb20sXG4gICAgICAgICAgICAgICAgZGlmZjogZGlmZixcbiAgICAgICAgICAgICAgICB0bzogdG8sXG4gICAgICAgICAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IHBhcmFtcy5jYWxsYmFjayxcbiAgICAgICAgICAgICAgICBwcmV2OiBwcmV2LFxuICAgICAgICAgICAgICAgIG5leHQ6IG5leHQsXG4gICAgICAgICAgICAgICAgcmVwZWF0OiB0aW1lcyB8fCBhbmltLnRpbWVzLFxuICAgICAgICAgICAgICAgIG9yaWdpbjogZWxlbWVudC5hdHRyKCksXG4gICAgICAgICAgICAgICAgdG90YWxPcmlnaW46IHRvdGFsT3JpZ2luXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHMucHVzaChlKTtcbiAgICAgICAgICAgIGlmIChzdGF0dXMgJiYgIWlzSW5BbmltICYmICFpc0luQW5pbVNldCkge1xuICAgICAgICAgICAgICAgIGUuc3RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZS5zdGFydCA9IG5ldyBEYXRlIC0gbXMgKiBzdGF0dXM7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNJbkFuaW1TZXQpIHtcbiAgICAgICAgICAgICAgICBlLnN0YXJ0ID0gbmV3IERhdGUgLSBlLm1zICogc3RhdHVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoID09IDEgJiYgcmVxdWVzdEFuaW1GcmFtZShhbmltYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXNJbkFuaW0uaW5pdHN0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgICAgIGlzSW5BbmltLnN0YXJ0ID0gbmV3IERhdGUgLSBpc0luQW5pbS5tcyAqIHN0YXR1cztcbiAgICAgICAgfVxuICAgICAgICBldmUoXCJyYXBoYWVsLmFuaW0uc3RhcnQuXCIgKyBlbGVtZW50LmlkLCBlbGVtZW50LCBhbmltKTtcbiAgICB9XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuYW5pbWF0aW9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGFuIGFuaW1hdGlvbiBvYmplY3QgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBARWxlbWVudC5hbmltYXRlIG9yIEBFbGVtZW50LmFuaW1hdGVXaXRoIG1ldGhvZHMuXG4gICAgICogU2VlIGFsc28gQEFuaW1hdGlvbi5kZWxheSBhbmQgQEFuaW1hdGlvbi5yZXBlYXQgbWV0aG9kcy5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gcGFyYW1zIChvYmplY3QpIGZpbmFsIGF0dHJpYnV0ZXMgZm9yIHRoZSBlbGVtZW50LCBzZWUgYWxzbyBARWxlbWVudC5hdHRyXG4gICAgIC0gbXMgKG51bWJlcikgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBmb3IgYW5pbWF0aW9uIHRvIHJ1blxuICAgICAtIGVhc2luZyAoc3RyaW5nKSAjb3B0aW9uYWwgZWFzaW5nIHR5cGUuIEFjY2VwdCBvbmUgb2YgQFJhcGhhZWwuZWFzaW5nX2Zvcm11bGFzIG9yIENTUyBmb3JtYXQ6IGBjdWJpYyYjeDIwMTA7YmV6aWVyKFhYLCYjMTYwO1hYLCYjMTYwO1hYLCYjMTYwO1hYKWBcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgYXQgdGhlIGVuZCBvZiBhbmltYXRpb24uXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgQEFuaW1hdGlvblxuICAgIFxcKi9cbiAgICBSLmFuaW1hdGlvbiA9IGZ1bmN0aW9uIChwYXJhbXMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChwYXJhbXMgaW5zdGFuY2VvZiBBbmltYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFIuaXMoZWFzaW5nLCBcImZ1bmN0aW9uXCIpIHx8ICFlYXNpbmcpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZWFzaW5nIHx8IG51bGw7XG4gICAgICAgICAgICBlYXNpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtcyA9IE9iamVjdChwYXJhbXMpO1xuICAgICAgICBtcyA9ICttcyB8fCAwO1xuICAgICAgICB2YXIgcCA9IHt9LFxuICAgICAgICAgICAganNvbixcbiAgICAgICAgICAgIGF0dHI7XG4gICAgICAgIGZvciAoYXR0ciBpbiBwYXJhbXMpIGlmIChwYXJhbXNbaGFzXShhdHRyKSAmJiB0b0Zsb2F0KGF0dHIpICE9IGF0dHIgJiYgdG9GbG9hdChhdHRyKSArIFwiJVwiICE9IGF0dHIpIHtcbiAgICAgICAgICAgIGpzb24gPSB0cnVlO1xuICAgICAgICAgICAgcFthdHRyXSA9IHBhcmFtc1thdHRyXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWpzb24pIHtcbiAgICAgICAgICAgIC8vIGlmIHBlcmNlbnQtbGlrZSBzeW50YXggaXMgdXNlZCBhbmQgZW5kLW9mLWFsbCBhbmltYXRpb24gY2FsbGJhY2sgdXNlZFxuICAgICAgICAgICAgaWYoY2FsbGJhY2spe1xuICAgICAgICAgICAgICAgIC8vIGZpbmQgdGhlIGxhc3Qgb25lXG4gICAgICAgICAgICAgICAgdmFyIGxhc3RLZXkgPSAwO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaSBpbiBwYXJhbXMpe1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGVyY2VudCA9IHRvSW50KGkpO1xuICAgICAgICAgICAgICAgICAgICBpZihwYXJhbXNbaGFzXShpKSAmJiBwZXJjZW50ID4gbGFzdEtleSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0S2V5ID0gcGVyY2VudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsYXN0S2V5ICs9ICclJztcbiAgICAgICAgICAgICAgICAvLyBpZiBhbHJlYWR5IGRlZmluZWQgY2FsbGJhY2sgaW4gdGhlIGxhc3Qga2V5ZnJhbWUsIHNraXBcbiAgICAgICAgICAgICAgICAhcGFyYW1zW2xhc3RLZXldLmNhbGxiYWNrICYmIChwYXJhbXNbbGFzdEtleV0uY2FsbGJhY2sgPSBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBBbmltYXRpb24ocGFyYW1zLCBtcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlYXNpbmcgJiYgKHAuZWFzaW5nID0gZWFzaW5nKTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIChwLmNhbGxiYWNrID0gY2FsbGJhY2spO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBbmltYXRpb24oezEwMDogcH0sIG1zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYW5pbWF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhbmQgc3RhcnRzIGFuaW1hdGlvbiBmb3IgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gcGFyYW1zIChvYmplY3QpIGZpbmFsIGF0dHJpYnV0ZXMgZm9yIHRoZSBlbGVtZW50LCBzZWUgYWxzbyBARWxlbWVudC5hdHRyXG4gICAgIC0gbXMgKG51bWJlcikgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBmb3IgYW5pbWF0aW9uIHRvIHJ1blxuICAgICAtIGVhc2luZyAoc3RyaW5nKSAjb3B0aW9uYWwgZWFzaW5nIHR5cGUuIEFjY2VwdCBvbmUgb2YgQFJhcGhhZWwuZWFzaW5nX2Zvcm11bGFzIG9yIENTUyBmb3JtYXQ6IGBjdWJpYyYjeDIwMTA7YmV6aWVyKFhYLCYjMTYwO1hYLCYjMTYwO1hYLCYjMTYwO1hYKWBcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbi4gV2lsbCBiZSBjYWxsZWQgYXQgdGhlIGVuZCBvZiBhbmltYXRpb24uXG4gICAgICogb3JcbiAgICAgLSBhbmltYXRpb24gKG9iamVjdCkgYW5pbWF0aW9uIG9iamVjdCwgc2VlIEBSYXBoYWVsLmFuaW1hdGlvblxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5hbmltYXRlID0gZnVuY3Rpb24gKHBhcmFtcywgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzO1xuICAgICAgICBpZiAoZWxlbWVudC5yZW1vdmVkKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjay5jYWxsKGVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFuaW0gPSBwYXJhbXMgaW5zdGFuY2VvZiBBbmltYXRpb24gPyBwYXJhbXMgOiBSLmFuaW1hdGlvbihwYXJhbXMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKTtcbiAgICAgICAgcnVuQW5pbWF0aW9uKGFuaW0sIGVsZW1lbnQsIGFuaW0ucGVyY2VudHNbMF0sIG51bGwsIGVsZW1lbnQuYXR0cigpKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zZXRUaW1lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZXRzIHRoZSBzdGF0dXMgb2YgYW5pbWF0aW9uIG9mIHRoZSBlbGVtZW50IGluIG1pbGxpc2Vjb25kcy4gU2ltaWxhciB0byBARWxlbWVudC5zdGF0dXMgbWV0aG9kLlxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBhbmltIChvYmplY3QpIGFuaW1hdGlvbiBvYmplY3RcbiAgICAgLSB2YWx1ZSAobnVtYmVyKSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgYW5pbWF0aW9uXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudCBpZiBgdmFsdWVgIGlzIHNwZWNpZmllZFxuICAgICAqIE5vdGUsIHRoYXQgZHVyaW5nIGFuaW1hdGlvbiBmb2xsb3dpbmcgZXZlbnRzIGFyZSB0cmlnZ2VyZWQ6XG4gICAgICpcbiAgICAgKiBPbiBlYWNoIGFuaW1hdGlvbiBmcmFtZSBldmVudCBgYW5pbS5mcmFtZS48aWQ+YCwgb24gc3RhcnQgYGFuaW0uc3RhcnQuPGlkPmAgYW5kIG9uIGVuZCBgYW5pbS5maW5pc2guPGlkPmAuXG4gICAgXFwqL1xuICAgIGVscHJvdG8uc2V0VGltZSA9IGZ1bmN0aW9uIChhbmltLCB2YWx1ZSkge1xuICAgICAgICBpZiAoYW5pbSAmJiB2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1cyhhbmltLCBtbWluKHZhbHVlLCBhbmltLm1zKSAvIGFuaW0ubXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc3RhdHVzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHN0YXR1cyBvZiBhbmltYXRpb24gb2YgdGhlIGVsZW1lbnQuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGFuaW0gKG9iamVjdCkgI29wdGlvbmFsIGFuaW1hdGlvbiBvYmplY3RcbiAgICAgLSB2YWx1ZSAobnVtYmVyKSAjb3B0aW9uYWwgMCDigJMgMS4gSWYgc3BlY2lmaWVkLCBtZXRob2Qgd29ya3MgbGlrZSBhIHNldHRlciBhbmQgc2V0cyB0aGUgc3RhdHVzIG9mIGEgZ2l2ZW4gYW5pbWF0aW9uIHRvIHRoZSB2YWx1ZS4gVGhpcyB3aWxsIGNhdXNlIGFuaW1hdGlvbiB0byBqdW1wIHRvIHRoZSBnaXZlbiBwb3NpdGlvbi5cbiAgICAgKipcbiAgICAgPSAobnVtYmVyKSBzdGF0dXNcbiAgICAgKiBvclxuICAgICA9IChhcnJheSkgc3RhdHVzIGlmIGBhbmltYCBpcyBub3Qgc3BlY2lmaWVkLiBBcnJheSBvZiBvYmplY3RzIGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIGFuaW06IChvYmplY3QpIGFuaW1hdGlvbiBvYmplY3RcbiAgICAgbyAgICAgc3RhdHVzOiAobnVtYmVyKSBzdGF0dXNcbiAgICAgbyB9XG4gICAgICogb3JcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50IGlmIGB2YWx1ZWAgaXMgc3BlY2lmaWVkXG4gICAgXFwqL1xuICAgIGVscHJvdG8uc3RhdHVzID0gZnVuY3Rpb24gKGFuaW0sIHZhbHVlKSB7XG4gICAgICAgIHZhciBvdXQgPSBbXSxcbiAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgZTtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJ1bkFuaW1hdGlvbihhbmltLCB0aGlzLCAtMSwgbW1pbih2YWx1ZSwgMSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZW4gPSBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZSA9IGFuaW1hdGlvbkVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChlLmVsLmlkID09IHRoaXMuaWQgJiYgKCFhbmltIHx8IGUuYW5pbSA9PSBhbmltKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUuc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW06IGUuYW5pbSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogZS5zdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFuaW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnBhdXNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTdG9wcyBhbmltYXRpb24gb2YgdGhlIGVsZW1lbnQgd2l0aCBhYmlsaXR5IHRvIHJlc3VtZSBpdCBsYXRlciBvbi5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gYW5pbSAob2JqZWN0KSAjb3B0aW9uYWwgYW5pbWF0aW9uIG9iamVjdFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5wYXVzZSA9IGZ1bmN0aW9uIChhbmltKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoOyBpKyspIGlmIChhbmltYXRpb25FbGVtZW50c1tpXS5lbC5pZCA9PSB0aGlzLmlkICYmICghYW5pbSB8fCBhbmltYXRpb25FbGVtZW50c1tpXS5hbmltID09IGFuaW0pKSB7XG4gICAgICAgICAgICBpZiAoZXZlKFwicmFwaGFlbC5hbmltLnBhdXNlLlwiICsgdGhpcy5pZCwgdGhpcywgYW5pbWF0aW9uRWxlbWVudHNbaV0uYW5pbSkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRWxlbWVudHNbaV0ucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnJlc3VtZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVzdW1lcyBhbmltYXRpb24gaWYgaXQgd2FzIHBhdXNlZCB3aXRoIEBFbGVtZW50LnBhdXNlIG1ldGhvZC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gYW5pbSAob2JqZWN0KSAjb3B0aW9uYWwgYW5pbWF0aW9uIG9iamVjdFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5yZXN1bWUgPSBmdW5jdGlvbiAoYW5pbSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuaW1hdGlvbkVsZW1lbnRzLmxlbmd0aDsgaSsrKSBpZiAoYW5pbWF0aW9uRWxlbWVudHNbaV0uZWwuaWQgPT0gdGhpcy5pZCAmJiAoIWFuaW0gfHwgYW5pbWF0aW9uRWxlbWVudHNbaV0uYW5pbSA9PSBhbmltKSkge1xuICAgICAgICAgICAgdmFyIGUgPSBhbmltYXRpb25FbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmIChldmUoXCJyYXBoYWVsLmFuaW0ucmVzdW1lLlwiICsgdGhpcy5pZCwgdGhpcywgZS5hbmltKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgZS5wYXVzZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMoZS5hbmltLCBlLnN0YXR1cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zdG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTdG9wcyBhbmltYXRpb24gb2YgdGhlIGVsZW1lbnQuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGFuaW0gKG9iamVjdCkgI29wdGlvbmFsIGFuaW1hdGlvbiBvYmplY3RcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uc3RvcCA9IGZ1bmN0aW9uIChhbmltKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5pbWF0aW9uRWxlbWVudHMubGVuZ3RoOyBpKyspIGlmIChhbmltYXRpb25FbGVtZW50c1tpXS5lbC5pZCA9PSB0aGlzLmlkICYmICghYW5pbSB8fCBhbmltYXRpb25FbGVtZW50c1tpXS5hbmltID09IGFuaW0pKSB7XG4gICAgICAgICAgICBpZiAoZXZlKFwicmFwaGFlbC5hbmltLnN0b3AuXCIgKyB0aGlzLmlkLCB0aGlzLCBhbmltYXRpb25FbGVtZW50c1tpXS5hbmltKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25FbGVtZW50cy5zcGxpY2UoaS0tLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHN0b3BBbmltYXRpb24ocGFwZXIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmltYXRpb25FbGVtZW50cy5sZW5ndGg7IGkrKykgaWYgKGFuaW1hdGlvbkVsZW1lbnRzW2ldLmVsLnBhcGVyID09IHBhcGVyKSB7XG4gICAgICAgICAgICBhbmltYXRpb25FbGVtZW50cy5zcGxpY2UoaS0tLCAxKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBldmUub24oXCJyYXBoYWVsLnJlbW92ZVwiLCBzdG9wQW5pbWF0aW9uKTtcbiAgICBldmUub24oXCJyYXBoYWVsLmNsZWFyXCIsIHN0b3BBbmltYXRpb24pO1xuICAgIGVscHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIlJhcGhhXFx4ZWJsXFx1MjAxOXMgb2JqZWN0XCI7XG4gICAgfTtcblxuICAgIC8vIFNldFxuICAgIHZhciBTZXQgPSBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudHlwZSA9IFwic2V0XCI7XG4gICAgICAgIGlmIChpdGVtcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtc1tpXSAmJiAoaXRlbXNbaV0uY29uc3RydWN0b3IgPT0gZWxwcm90by5jb25zdHJ1Y3RvciB8fCBpdGVtc1tpXS5jb25zdHJ1Y3RvciA9PSBTZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbdGhpcy5pdGVtcy5sZW5ndGhdID0gdGhpcy5pdGVtc1t0aGlzLml0ZW1zLmxlbmd0aF0gPSBpdGVtc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5ndGgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNldHByb3RvID0gU2V0LnByb3RvdHlwZTtcbiAgICAvKlxcXG4gICAgICogU2V0LnB1c2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZWFjaCBhcmd1bWVudCB0byB0aGUgY3VycmVudCBzZXQuXG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5wdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaXRlbSxcbiAgICAgICAgICAgIGxlbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiAoaXRlbS5jb25zdHJ1Y3RvciA9PSBlbHByb3RvLmNvbnN0cnVjdG9yIHx8IGl0ZW0uY29uc3RydWN0b3IgPT0gU2V0KSkge1xuICAgICAgICAgICAgICAgIGxlbiA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXNbbGVuXSA9IHRoaXMuaXRlbXNbbGVuXSA9IGl0ZW07XG4gICAgICAgICAgICAgICAgdGhpcy5sZW5ndGgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQucG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGxhc3QgZWxlbWVudCBhbmQgcmV0dXJucyBpdC5cbiAgICAgPSAob2JqZWN0KSBlbGVtZW50XG4gICAgXFwqL1xuICAgIHNldHByb3RvLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sZW5ndGggJiYgZGVsZXRlIHRoaXNbdGhpcy5sZW5ndGgtLV07XG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zLnBvcCgpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5mb3JFYWNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFeGVjdXRlcyBnaXZlbiBmdW5jdGlvbiBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBzZXQuXG4gICAgICpcbiAgICAgKiBJZiBmdW5jdGlvbiByZXR1cm5zIGBmYWxzZWAgaXQgd2lsbCBzdG9wIGxvb3AgcnVubmluZy5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSBmdW5jdGlvbiB0byBydW5cbiAgICAgLSB0aGlzQXJnIChvYmplY3QpIGNvbnRleHQgb2JqZWN0IGZvciB0aGUgY2FsbGJhY2tcbiAgICAgPSAob2JqZWN0KSBTZXQgb2JqZWN0XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLml0ZW1zW2ldLCBpKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGZvciAodmFyIG1ldGhvZCBpbiBlbHByb3RvKSBpZiAoZWxwcm90b1toYXNdKG1ldGhvZCkpIHtcbiAgICAgICAgc2V0cHJvdG9bbWV0aG9kXSA9IChmdW5jdGlvbiAobWV0aG9kbmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsW21ldGhvZG5hbWVdW2FwcGx5XShlbCwgYXJnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKG1ldGhvZCk7XG4gICAgfVxuICAgIHNldHByb3RvLmF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKG5hbWUgJiYgUi5pcyhuYW1lLCBhcnJheSkgJiYgUi5pcyhuYW1lWzBdLCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpqID0gbmFtZS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtc1tqXS5hdHRyKG5hbWVbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtc1tpXS5hdHRyKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuY2xlYXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYWxsIGVsZW1lbnRzIGZyb20gdGhlIHNldFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnBvcCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LnNwbGljZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBlbGVtZW50IGZyb20gdGhlIHNldFxuICAgICAqKlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgKipcbiAgICAgLSBpbmRleCAobnVtYmVyKSBwb3NpdGlvbiBvZiB0aGUgZGVsZXRpb25cbiAgICAgLSBjb3VudCAobnVtYmVyKSBudW1iZXIgb2YgZWxlbWVudCB0byByZW1vdmVcbiAgICAgLSBpbnNlcnRpb27igKYgKG9iamVjdCkgI29wdGlvbmFsIGVsZW1lbnRzIHRvIGluc2VydFxuICAgICA9IChvYmplY3QpIHNldCBlbGVtZW50cyB0aGF0IHdlcmUgZGVsZXRlZFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5zcGxpY2UgPSBmdW5jdGlvbiAoaW5kZXgsIGNvdW50LCBpbnNlcnRpb24pIHtcbiAgICAgICAgaW5kZXggPSBpbmRleCA8IDAgPyBtbWF4KHRoaXMubGVuZ3RoICsgaW5kZXgsIDApIDogaW5kZXg7XG4gICAgICAgIGNvdW50ID0gbW1heCgwLCBtbWluKHRoaXMubGVuZ3RoIC0gaW5kZXgsIGNvdW50KSk7XG4gICAgICAgIHZhciB0YWlsID0gW10sXG4gICAgICAgICAgICB0b2RlbCA9IFtdLFxuICAgICAgICAgICAgYXJncyA9IFtdLFxuICAgICAgICAgICAgaTtcbiAgICAgICAgZm9yIChpID0gMjsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHRvZGVsLnB1c2godGhpc1tpbmRleCArIGldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKDsgaSA8IHRoaXMubGVuZ3RoIC0gaW5kZXg7IGkrKykge1xuICAgICAgICAgICAgdGFpbC5wdXNoKHRoaXNbaW5kZXggKyBpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFyZ2xlbiA9IGFyZ3MubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJnbGVuICsgdGFpbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pdGVtc1tpbmRleCArIGldID0gdGhpc1tpbmRleCArIGldID0gaSA8IGFyZ2xlbiA/IGFyZ3NbaV0gOiB0YWlsW2kgLSBhcmdsZW5dO1xuICAgICAgICB9XG4gICAgICAgIGkgPSB0aGlzLml0ZW1zLmxlbmd0aCA9IHRoaXMubGVuZ3RoIC09IGNvdW50IC0gYXJnbGVuO1xuICAgICAgICB3aGlsZSAodGhpc1tpXSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXNbaSsrXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFNldCh0b2RlbCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmV4Y2x1ZGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZ2l2ZW4gZWxlbWVudCBmcm9tIHRoZSBzZXRcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gZWxlbWVudCAob2JqZWN0KSBlbGVtZW50IHRvIHJlbW92ZVxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgb2JqZWN0IHdhcyBmb3VuZCAmIHJlbW92ZWQgZnJvbSB0aGUgc2V0XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmV4Y2x1ZGUgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAodGhpc1tpXSA9PSBlbCkge1xuICAgICAgICAgICAgdGhpcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2V0cHJvdG8uYW5pbWF0ZSA9IGZ1bmN0aW9uIChwYXJhbXMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIChSLmlzKGVhc2luZywgXCJmdW5jdGlvblwiKSB8fCAhZWFzaW5nKSAmJiAoY2FsbGJhY2sgPSBlYXNpbmcgfHwgbnVsbCk7XG4gICAgICAgIHZhciBsZW4gPSB0aGlzLml0ZW1zLmxlbmd0aCxcbiAgICAgICAgICAgIGkgPSBsZW4sXG4gICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgc2V0ID0gdGhpcyxcbiAgICAgICAgICAgIGNvbGxlY3RvcjtcbiAgICAgICAgaWYgKCFsZW4pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrICYmIChjb2xsZWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAhLS1sZW4gJiYgY2FsbGJhY2suY2FsbChzZXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgZWFzaW5nID0gUi5pcyhlYXNpbmcsIHN0cmluZykgPyBlYXNpbmcgOiBjb2xsZWN0b3I7XG4gICAgICAgIHZhciBhbmltID0gUi5hbmltYXRpb24ocGFyYW1zLCBtcywgZWFzaW5nLCBjb2xsZWN0b3IpO1xuICAgICAgICBpdGVtID0gdGhpcy5pdGVtc1stLWldLmFuaW1hdGUoYW5pbSk7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXNbaV0gJiYgIXRoaXMuaXRlbXNbaV0ucmVtb3ZlZCAmJiB0aGlzLml0ZW1zW2ldLmFuaW1hdGVXaXRoKGl0ZW0sIGFuaW0sIGFuaW0pO1xuICAgICAgICAgICAgKHRoaXMuaXRlbXNbaV0gJiYgIXRoaXMuaXRlbXNbaV0ucmVtb3ZlZCkgfHwgbGVuLS07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBzZXRwcm90by5pbnNlcnRBZnRlciA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2ldLmluc2VydEFmdGVyKGVsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHNldHByb3RvLmdldEJCb3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gW10sXG4gICAgICAgICAgICB5ID0gW10sXG4gICAgICAgICAgICB4MiA9IFtdLFxuICAgICAgICAgICAgeTIgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpLS07KSBpZiAoIXRoaXMuaXRlbXNbaV0ucmVtb3ZlZCkge1xuICAgICAgICAgICAgdmFyIGJveCA9IHRoaXMuaXRlbXNbaV0uZ2V0QkJveCgpO1xuICAgICAgICAgICAgeC5wdXNoKGJveC54KTtcbiAgICAgICAgICAgIHkucHVzaChib3gueSk7XG4gICAgICAgICAgICB4Mi5wdXNoKGJveC54ICsgYm94LndpZHRoKTtcbiAgICAgICAgICAgIHkyLnB1c2goYm94LnkgKyBib3guaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICB4ID0gbW1pblthcHBseV0oMCwgeCk7XG4gICAgICAgIHkgPSBtbWluW2FwcGx5XSgwLCB5KTtcbiAgICAgICAgeDIgPSBtbWF4W2FwcGx5XSgwLCB4Mik7XG4gICAgICAgIHkyID0gbW1heFthcHBseV0oMCwgeTIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB4MjogeDIsXG4gICAgICAgICAgICB5MjogeTIsXG4gICAgICAgICAgICB3aWR0aDogeDIgLSB4LFxuICAgICAgICAgICAgaGVpZ2h0OiB5MiAtIHlcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHNldHByb3RvLmNsb25lID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgcyA9IHRoaXMucGFwZXIuc2V0KCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcy5wdXNoKHRoaXMuaXRlbXNbaV0uY2xvbmUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfTtcbiAgICBzZXRwcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiUmFwaGFcXHhlYmxcXHUyMDE4cyBzZXRcIjtcbiAgICB9O1xuXG4gICAgc2V0cHJvdG8uZ2xvdyA9IGZ1bmN0aW9uKGdsb3dDb25maWcpIHtcbiAgICAgICAgdmFyIHJldCA9IHRoaXMucGFwZXIuc2V0KCk7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbihzaGFwZSwgaW5kZXgpe1xuICAgICAgICAgICAgdmFyIGcgPSBzaGFwZS5nbG93KGdsb3dDb25maWcpO1xuICAgICAgICAgICAgaWYoZyAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBnLmZvckVhY2goZnVuY3Rpb24oc2hhcGUyLCBpbmRleDIpe1xuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChzaGFwZTIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG5cbiAgICAvKlxcXG4gICAgICogU2V0LmlzUG9pbnRJbnNpZGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERldGVybWluZSBpZiBnaXZlbiBwb2ludCBpcyBpbnNpZGUgdGhpcyBzZXTigJlzIGVsZW1lbnRzXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgcG9pbnQgaXMgaW5zaWRlIGFueSBvZiB0aGUgc2V0J3MgZWxlbWVudHNcbiAgICAgXFwqL1xuICAgIHNldHByb3RvLmlzUG9pbnRJbnNpZGUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB2YXIgaXNQb2ludEluc2lkZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwuaXNQb2ludEluc2lkZSh4LCB5KSkge1xuICAgICAgICAgICAgICAgIGlzUG9pbnRJbnNpZGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gc3RvcCBsb29wXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXNQb2ludEluc2lkZTtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwucmVnaXN0ZXJGb250XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGdpdmVuIGZvbnQgdG8gdGhlIHJlZ2lzdGVyZWQgc2V0IG9mIGZvbnRzIGZvciBSYXBoYcOrbC4gU2hvdWxkIGJlIHVzZWQgYXMgYW4gaW50ZXJuYWwgY2FsbCBmcm9tIHdpdGhpbiBDdWbDs27igJlzIGZvbnQgZmlsZS5cbiAgICAgKiBSZXR1cm5zIG9yaWdpbmFsIHBhcmFtZXRlciwgc28gaXQgY291bGQgYmUgdXNlZCB3aXRoIGNoYWluaW5nLlxuICAgICAjIDxhIGhyZWY9XCJodHRwOi8vd2lraS5naXRodWIuY29tL3NvcmNjdS9jdWZvbi9hYm91dFwiPk1vcmUgYWJvdXQgQ3Vmw7NuIGFuZCBob3cgdG8gY29udmVydCB5b3VyIGZvbnQgZm9ybSBUVEYsIE9URiwgZXRjIHRvIEphdmFTY3JpcHQgZmlsZS48L2E+XG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIGZvbnQgKG9iamVjdCkgdGhlIGZvbnQgdG8gcmVnaXN0ZXJcbiAgICAgPSAob2JqZWN0KSB0aGUgZm9udCB5b3UgcGFzc2VkIGluXG4gICAgID4gVXNhZ2VcbiAgICAgfCBDdWZvbi5yZWdpc3RlckZvbnQoUmFwaGFlbC5yZWdpc3RlckZvbnQoe+KApn0pKTtcbiAgICBcXCovXG4gICAgUi5yZWdpc3RlckZvbnQgPSBmdW5jdGlvbiAoZm9udCkge1xuICAgICAgICBpZiAoIWZvbnQuZmFjZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZvbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mb250cyA9IHRoaXMuZm9udHMgfHwge307XG4gICAgICAgIHZhciBmb250Y29weSA9IHtcbiAgICAgICAgICAgICAgICB3OiBmb250LncsXG4gICAgICAgICAgICAgICAgZmFjZToge30sXG4gICAgICAgICAgICAgICAgZ2x5cGhzOiB7fVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhbWlseSA9IGZvbnQuZmFjZVtcImZvbnQtZmFtaWx5XCJdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIGZvbnQuZmFjZSkgaWYgKGZvbnQuZmFjZVtoYXNdKHByb3ApKSB7XG4gICAgICAgICAgICBmb250Y29weS5mYWNlW3Byb3BdID0gZm9udC5mYWNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmZvbnRzW2ZhbWlseV0pIHtcbiAgICAgICAgICAgIHRoaXMuZm9udHNbZmFtaWx5XS5wdXNoKGZvbnRjb3B5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZm9udHNbZmFtaWx5XSA9IFtmb250Y29weV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmb250LnN2Zykge1xuICAgICAgICAgICAgZm9udGNvcHkuZmFjZVtcInVuaXRzLXBlci1lbVwiXSA9IHRvSW50KGZvbnQuZmFjZVtcInVuaXRzLXBlci1lbVwiXSwgMTApO1xuICAgICAgICAgICAgZm9yICh2YXIgZ2x5cGggaW4gZm9udC5nbHlwaHMpIGlmIChmb250LmdseXBoc1toYXNdKGdseXBoKSkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRoID0gZm9udC5nbHlwaHNbZ2x5cGhdO1xuICAgICAgICAgICAgICAgIGZvbnRjb3B5LmdseXBoc1tnbHlwaF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHc6IHBhdGgudyxcbiAgICAgICAgICAgICAgICAgICAgazoge30sXG4gICAgICAgICAgICAgICAgICAgIGQ6IHBhdGguZCAmJiBcIk1cIiArIHBhdGguZC5yZXBsYWNlKC9bbWxjeHRydl0vZywgZnVuY3Rpb24gKGNvbW1hbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge2w6IFwiTFwiLCBjOiBcIkNcIiwgeDogXCJ6XCIsIHQ6IFwibVwiLCByOiBcImxcIiwgdjogXCJjXCJ9W2NvbW1hbmRdIHx8IFwiTVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkgKyBcInpcIlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIHBhdGguaykgaWYgKHBhdGhbaGFzXShrKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udGNvcHkuZ2x5cGhzW2dseXBoXS5rW2tdID0gcGF0aC5rW2tdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb250O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdldEZvbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEZpbmRzIGZvbnQgb2JqZWN0IGluIHRoZSByZWdpc3RlcmVkIGZvbnRzIGJ5IGdpdmVuIHBhcmFtZXRlcnMuIFlvdSBjb3VsZCBzcGVjaWZ5IG9ubHkgb25lIHdvcmQgZnJvbSB0aGUgZm9udCBuYW1lLCBsaWtlIOKAnE15cmlhZOKAnSBmb3Ig4oCcTXlyaWFkIFByb+KAnS5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gZmFtaWx5IChzdHJpbmcpIGZvbnQgZmFtaWx5IG5hbWUgb3IgYW55IHdvcmQgZnJvbSBpdFxuICAgICAtIHdlaWdodCAoc3RyaW5nKSAjb3B0aW9uYWwgZm9udCB3ZWlnaHRcbiAgICAgLSBzdHlsZSAoc3RyaW5nKSAjb3B0aW9uYWwgZm9udCBzdHlsZVxuICAgICAtIHN0cmV0Y2ggKHN0cmluZykgI29wdGlvbmFsIGZvbnQgc3RyZXRjaFxuICAgICA9IChvYmplY3QpIHRoZSBmb250IG9iamVjdFxuICAgICA+IFVzYWdlXG4gICAgIHwgcGFwZXIucHJpbnQoMTAwLCAxMDAsIFwiVGVzdCBzdHJpbmdcIiwgcGFwZXIuZ2V0Rm9udChcIlRpbWVzXCIsIDgwMCksIDMwKTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5nZXRGb250ID0gZnVuY3Rpb24gKGZhbWlseSwgd2VpZ2h0LCBzdHlsZSwgc3RyZXRjaCkge1xuICAgICAgICBzdHJldGNoID0gc3RyZXRjaCB8fCBcIm5vcm1hbFwiO1xuICAgICAgICBzdHlsZSA9IHN0eWxlIHx8IFwibm9ybWFsXCI7XG4gICAgICAgIHdlaWdodCA9ICt3ZWlnaHQgfHwge25vcm1hbDogNDAwLCBib2xkOiA3MDAsIGxpZ2h0ZXI6IDMwMCwgYm9sZGVyOiA4MDB9W3dlaWdodF0gfHwgNDAwO1xuICAgICAgICBpZiAoIVIuZm9udHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZm9udCA9IFIuZm9udHNbZmFtaWx5XTtcbiAgICAgICAgaWYgKCFmb250KSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IG5ldyBSZWdFeHAoXCIoXnxcXFxccylcIiArIGZhbWlseS5yZXBsYWNlKC9bXlxcd1xcZFxccyshfi46Xy1dL2csIEUpICsgXCIoXFxcXHN8JClcIiwgXCJpXCIpO1xuICAgICAgICAgICAgZm9yICh2YXIgZm9udE5hbWUgaW4gUi5mb250cykgaWYgKFIuZm9udHNbaGFzXShmb250TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZS50ZXN0KGZvbnROYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBmb250ID0gUi5mb250c1tmb250TmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhlZm9udDtcbiAgICAgICAgaWYgKGZvbnQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGZvbnQubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoZWZvbnQgPSBmb250W2ldO1xuICAgICAgICAgICAgICAgIGlmICh0aGVmb250LmZhY2VbXCJmb250LXdlaWdodFwiXSA9PSB3ZWlnaHQgJiYgKHRoZWZvbnQuZmFjZVtcImZvbnQtc3R5bGVcIl0gPT0gc3R5bGUgfHwgIXRoZWZvbnQuZmFjZVtcImZvbnQtc3R5bGVcIl0pICYmIHRoZWZvbnQuZmFjZVtcImZvbnQtc3RyZXRjaFwiXSA9PSBzdHJldGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhlZm9udDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5wcmludFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBwYXRoIHRoYXQgcmVwcmVzZW50IGdpdmVuIHRleHQgd3JpdHRlbiB1c2luZyBnaXZlbiBmb250IGF0IGdpdmVuIHBvc2l0aW9uIHdpdGggZ2l2ZW4gc2l6ZS5cbiAgICAgKiBSZXN1bHQgb2YgdGhlIG1ldGhvZCBpcyBwYXRoIGVsZW1lbnQgdGhhdCBjb250YWlucyB3aG9sZSB0ZXh0IGFzIGEgc2VwYXJhdGUgcGF0aC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IHBvc2l0aW9uIG9mIHRoZSB0ZXh0XG4gICAgIC0geSAobnVtYmVyKSB5IHBvc2l0aW9uIG9mIHRoZSB0ZXh0XG4gICAgIC0gc3RyaW5nIChzdHJpbmcpIHRleHQgdG8gcHJpbnRcbiAgICAgLSBmb250IChvYmplY3QpIGZvbnQgb2JqZWN0LCBzZWUgQFBhcGVyLmdldEZvbnRcbiAgICAgLSBzaXplIChudW1iZXIpICNvcHRpb25hbCBzaXplIG9mIHRoZSBmb250LCBkZWZhdWx0IGlzIGAxNmBcbiAgICAgLSBvcmlnaW4gKHN0cmluZykgI29wdGlvbmFsIGNvdWxkIGJlIGBcImJhc2VsaW5lXCJgIG9yIGBcIm1pZGRsZVwiYCwgZGVmYXVsdCBpcyBgXCJtaWRkbGVcImBcbiAgICAgLSBsZXR0ZXJfc3BhY2luZyAobnVtYmVyKSAjb3B0aW9uYWwgbnVtYmVyIGluIHJhbmdlIGAtMS4uMWAsIGRlZmF1bHQgaXMgYDBgXG4gICAgIC0gbGluZV9zcGFjaW5nIChudW1iZXIpICNvcHRpb25hbCBudW1iZXIgaW4gcmFuZ2UgYDEuLjNgLCBkZWZhdWx0IGlzIGAxYFxuICAgICA9IChvYmplY3QpIHJlc3VsdGluZyBwYXRoIGVsZW1lbnQsIHdoaWNoIGNvbnNpc3Qgb2YgYWxsIGxldHRlcnNcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciB0eHQgPSByLnByaW50KDEwLCA1MCwgXCJwcmludFwiLCByLmdldEZvbnQoXCJNdXNlb1wiKSwgMzApLmF0dHIoe2ZpbGw6IFwiI2ZmZlwifSk7XG4gICAgXFwqL1xuICAgIHBhcGVycHJvdG8ucHJpbnQgPSBmdW5jdGlvbiAoeCwgeSwgc3RyaW5nLCBmb250LCBzaXplLCBvcmlnaW4sIGxldHRlcl9zcGFjaW5nLCBsaW5lX3NwYWNpbmcpIHtcbiAgICAgICAgb3JpZ2luID0gb3JpZ2luIHx8IFwibWlkZGxlXCI7IC8vIGJhc2VsaW5lfG1pZGRsZVxuICAgICAgICBsZXR0ZXJfc3BhY2luZyA9IG1tYXgobW1pbihsZXR0ZXJfc3BhY2luZyB8fCAwLCAxKSwgLTEpO1xuICAgICAgICBsaW5lX3NwYWNpbmcgPSBtbWF4KG1taW4obGluZV9zcGFjaW5nIHx8IDEsIDMpLCAxKTtcbiAgICAgICAgdmFyIGxldHRlcnMgPSBTdHIoc3RyaW5nKVtzcGxpdF0oRSksXG4gICAgICAgICAgICBzaGlmdCA9IDAsXG4gICAgICAgICAgICBub3RmaXJzdCA9IDAsXG4gICAgICAgICAgICBwYXRoID0gRSxcbiAgICAgICAgICAgIHNjYWxlO1xuICAgICAgICBSLmlzKGZvbnQsIFwic3RyaW5nXCIpICYmIChmb250ID0gdGhpcy5nZXRGb250KGZvbnQpKTtcbiAgICAgICAgaWYgKGZvbnQpIHtcbiAgICAgICAgICAgIHNjYWxlID0gKHNpemUgfHwgMTYpIC8gZm9udC5mYWNlW1widW5pdHMtcGVyLWVtXCJdO1xuICAgICAgICAgICAgdmFyIGJiID0gZm9udC5mYWNlLmJib3hbc3BsaXRdKHNlcGFyYXRvciksXG4gICAgICAgICAgICAgICAgdG9wID0gK2JiWzBdLFxuICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQgPSBiYlszXSAtIGJiWzFdLFxuICAgICAgICAgICAgICAgIHNoaWZ0eSA9IDAsXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gK2JiWzFdICsgKG9yaWdpbiA9PSBcImJhc2VsaW5lXCIgPyBsaW5lSGVpZ2h0ICsgKCtmb250LmZhY2UuZGVzY2VudCkgOiBsaW5lSGVpZ2h0IC8gMik7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBsZXR0ZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGV0dGVyc1tpXSA9PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY3VyciA9IDA7XG4gICAgICAgICAgICAgICAgICAgIG5vdGZpcnN0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnR5ICs9IGxpbmVIZWlnaHQgKiBsaW5lX3NwYWNpbmc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXYgPSBub3RmaXJzdCAmJiBmb250LmdseXBoc1tsZXR0ZXJzW2kgLSAxXV0gfHwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyID0gZm9udC5nbHlwaHNbbGV0dGVyc1tpXV07XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0ICs9IG5vdGZpcnN0ID8gKHByZXYudyB8fCBmb250LncpICsgKHByZXYuayAmJiBwcmV2LmtbbGV0dGVyc1tpXV0gfHwgMCkgKyAoZm9udC53ICogbGV0dGVyX3NwYWNpbmcpIDogMDtcbiAgICAgICAgICAgICAgICAgICAgbm90Zmlyc3QgPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY3VyciAmJiBjdXJyLmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCArPSBSLnRyYW5zZm9ybVBhdGgoY3Vyci5kLCBbXCJ0XCIsIHNoaWZ0ICogc2NhbGUsIHNoaWZ0eSAqIHNjYWxlLCBcInNcIiwgc2NhbGUsIHNjYWxlLCB0b3AsIGhlaWdodCwgXCJ0XCIsICh4IC0gdG9wKSAvIHNjYWxlLCAoeSAtIGhlaWdodCkgLyBzY2FsZV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5wYXRoKHBhdGgpLmF0dHIoe1xuICAgICAgICAgICAgZmlsbDogXCIjMDAwXCIsXG4gICAgICAgICAgICBzdHJva2U6IFwibm9uZVwiXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogUGFwZXIuYWRkXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJbXBvcnRzIGVsZW1lbnRzIGluIEpTT04gYXJyYXkgaW4gZm9ybWF0IGB7dHlwZTogdHlwZSwgPGF0dHJpYnV0ZXM+fWBcbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0ganNvbiAoYXJyYXkpXG4gICAgID0gKG9iamVjdCkgcmVzdWx0aW5nIHNldCBvZiBpbXBvcnRlZCBlbGVtZW50c1xuICAgICA+IFVzYWdlXG4gICAgIHwgcGFwZXIuYWRkKFtcbiAgICAgfCAgICAge1xuICAgICB8ICAgICAgICAgdHlwZTogXCJjaXJjbGVcIixcbiAgICAgfCAgICAgICAgIGN4OiAxMCxcbiAgICAgfCAgICAgICAgIGN5OiAxMCxcbiAgICAgfCAgICAgICAgIHI6IDVcbiAgICAgfCAgICAgfSxcbiAgICAgfCAgICAge1xuICAgICB8ICAgICAgICAgdHlwZTogXCJyZWN0XCIsXG4gICAgIHwgICAgICAgICB4OiAxMCxcbiAgICAgfCAgICAgICAgIHk6IDEwLFxuICAgICB8ICAgICAgICAgd2lkdGg6IDEwLFxuICAgICB8ICAgICAgICAgaGVpZ2h0OiAxMCxcbiAgICAgfCAgICAgICAgIGZpbGw6IFwiI2ZjMFwiXG4gICAgIHwgICAgIH1cbiAgICAgfCBdKTtcbiAgICBcXCovXG4gICAgcGFwZXJwcm90by5hZGQgPSBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICBpZiAoUi5pcyhqc29uLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gdGhpcy5zZXQoKSxcbiAgICAgICAgICAgICAgICBpID0gMCxcbiAgICAgICAgICAgICAgICBpaSA9IGpzb24ubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGo7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBqID0ganNvbltpXSB8fCB7fTtcbiAgICAgICAgICAgICAgICBlbGVtZW50c1toYXNdKGoudHlwZSkgJiYgcmVzLnB1c2godGhpc1tqLnR5cGVdKCkuYXR0cihqKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZm9ybWF0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTaW1wbGUgZm9ybWF0IGZ1bmN0aW9uLiBSZXBsYWNlcyBjb25zdHJ1Y3Rpb24gb2YgdHlwZSDigJxgezxudW1iZXI+fWDigJ0gdG8gdGhlIGNvcnJlc3BvbmRpbmcgYXJndW1lbnQuXG4gICAgICoqXG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAqKlxuICAgICAtIHRva2VuIChzdHJpbmcpIHN0cmluZyB0byBmb3JtYXRcbiAgICAgLSDigKYgKHN0cmluZykgcmVzdCBvZiBhcmd1bWVudHMgd2lsbCBiZSB0cmVhdGVkIGFzIHBhcmFtZXRlcnMgZm9yIHJlcGxhY2VtZW50XG4gICAgID0gKHN0cmluZykgZm9ybWF0ZWQgc3RyaW5nXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgeCA9IDEwLFxuICAgICB8ICAgICB5ID0gMjAsXG4gICAgIHwgICAgIHdpZHRoID0gNDAsXG4gICAgIHwgICAgIGhlaWdodCA9IDUwO1xuICAgICB8IC8vIHRoaXMgd2lsbCBkcmF3IGEgcmVjdGFuZ3VsYXIgc2hhcGUgZXF1aXZhbGVudCB0byBcIk0xMCwyMGg0MHY1MGgtNDB6XCJcbiAgICAgfCBwYXBlci5wYXRoKFJhcGhhZWwuZm9ybWF0KFwiTXswfSx7MX1oezJ9dnszfWh7NH16XCIsIHgsIHksIHdpZHRoLCBoZWlnaHQsIC13aWR0aCkpO1xuICAgIFxcKi9cbiAgICBSLmZvcm1hdCA9IGZ1bmN0aW9uICh0b2tlbiwgcGFyYW1zKSB7XG4gICAgICAgIHZhciBhcmdzID0gUi5pcyhwYXJhbXMsIGFycmF5KSA/IFswXVtjb25jYXRdKHBhcmFtcykgOiBhcmd1bWVudHM7XG4gICAgICAgIHRva2VuICYmIFIuaXModG9rZW4sIHN0cmluZykgJiYgYXJncy5sZW5ndGggLSAxICYmICh0b2tlbiA9IHRva2VuLnJlcGxhY2UoZm9ybWF0cmcsIGZ1bmN0aW9uIChzdHIsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiBhcmdzWysraV0gPT0gbnVsbCA/IEUgOiBhcmdzW2ldO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiB0b2tlbiB8fCBFO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFJhcGhhZWwuZnVsbGZpbGxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEEgbGl0dGxlIGJpdCBtb3JlIGFkdmFuY2VkIGZvcm1hdCBmdW5jdGlvbiB0aGFuIEBSYXBoYWVsLmZvcm1hdC4gUmVwbGFjZXMgY29uc3RydWN0aW9uIG9mIHR5cGUg4oCcYHs8bmFtZT59YOKAnSB0byB0aGUgY29ycmVzcG9uZGluZyBhcmd1bWVudC5cbiAgICAgKipcbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgICoqXG4gICAgIC0gdG9rZW4gKHN0cmluZykgc3RyaW5nIHRvIGZvcm1hdFxuICAgICAtIGpzb24gKG9iamVjdCkgb2JqZWN0IHdoaWNoIHByb3BlcnRpZXMgd2lsbCBiZSB1c2VkIGFzIGEgcmVwbGFjZW1lbnRcbiAgICAgPSAoc3RyaW5nKSBmb3JtYXRlZCBzdHJpbmdcbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIHRoaXMgd2lsbCBkcmF3IGEgcmVjdGFuZ3VsYXIgc2hhcGUgZXF1aXZhbGVudCB0byBcIk0xMCwyMGg0MHY1MGgtNDB6XCJcbiAgICAgfCBwYXBlci5wYXRoKFJhcGhhZWwuZnVsbGZpbGwoXCJNe3h9LHt5fWh7ZGltLndpZHRofXZ7ZGltLmhlaWdodH1oe2RpbVsnbmVnYXRpdmUgd2lkdGgnXX16XCIsIHtcbiAgICAgfCAgICAgeDogMTAsXG4gICAgIHwgICAgIHk6IDIwLFxuICAgICB8ICAgICBkaW06IHtcbiAgICAgfCAgICAgICAgIHdpZHRoOiA0MCxcbiAgICAgfCAgICAgICAgIGhlaWdodDogNTAsXG4gICAgIHwgICAgICAgICBcIm5lZ2F0aXZlIHdpZHRoXCI6IC00MFxuICAgICB8ICAgICB9XG4gICAgIHwgfSkpO1xuICAgIFxcKi9cbiAgICBSLmZ1bGxmaWxsID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRva2VuUmVnZXggPSAvXFx7KFteXFx9XSspXFx9L2csXG4gICAgICAgICAgICBvYmpOb3RhdGlvblJlZ2V4ID0gLyg/Oig/Ol58XFwuKSguKz8pKD89XFxbfFxcLnwkfFxcKCl8XFxbKCd8XCIpKC4rPylcXDJcXF0pKFxcKFxcKSk/L2csIC8vIG1hdGNoZXMgLnh4eHh4IG9yIFtcInh4eHh4XCJdIHRvIHJ1biBvdmVyIG9iamVjdCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICByZXBsYWNlciA9IGZ1bmN0aW9uIChhbGwsIGtleSwgb2JqKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IG9iajtcbiAgICAgICAgICAgICAgICBrZXkucmVwbGFjZShvYmpOb3RhdGlvblJlZ2V4LCBmdW5jdGlvbiAoYWxsLCBuYW1lLCBxdW90ZSwgcXVvdGVkTmFtZSwgaXNGdW5jKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lIHx8IHF1b3RlZE5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuYW1lIGluIHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiByZXMgPT0gXCJmdW5jdGlvblwiICYmIGlzRnVuYyAmJiAocmVzID0gcmVzKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzID0gKHJlcyA9PSBudWxsIHx8IHJlcyA9PSBvYmogPyBhbGwgOiByZXMpICsgXCJcIjtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHIsIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhzdHIpLnJlcGxhY2UodG9rZW5SZWdleCwgZnVuY3Rpb24gKGFsbCwga2V5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VyKGFsbCwga2V5LCBvYmopO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfSkoKTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5uaW5qYVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSWYgeW91IHdhbnQgdG8gbGVhdmUgbm8gdHJhY2Ugb2YgUmFwaGHDq2wgKFdlbGwsIFJhcGhhw6tsIGNyZWF0ZXMgb25seSBvbmUgZ2xvYmFsIHZhcmlhYmxlIGBSYXBoYWVsYCwgYnV0IGFueXdheS4pIFlvdSBjYW4gdXNlIGBuaW5qYWAgbWV0aG9kLlxuICAgICAqIEJld2FyZSwgdGhhdCBpbiB0aGlzIGNhc2UgcGx1Z2lucyBjb3VsZCBzdG9wIHdvcmtpbmcsIGJlY2F1c2UgdGhleSBhcmUgZGVwZW5kaW5nIG9uIGdsb2JhbCB2YXJpYWJsZSBleGlzdGFuY2UuXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgUmFwaGFlbCBvYmplY3RcbiAgICAgPiBVc2FnZVxuICAgICB8IChmdW5jdGlvbiAobG9jYWxfcmFwaGFlbCkge1xuICAgICB8ICAgICB2YXIgcGFwZXIgPSBsb2NhbF9yYXBoYWVsKDEwLCAxMCwgMzIwLCAyMDApO1xuICAgICB8ICAgICDigKZcbiAgICAgfCB9KShSYXBoYWVsLm5pbmphKCkpO1xuICAgIFxcKi9cbiAgICBSLm5pbmphID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBvbGRSYXBoYWVsLndhcyA/IChnLndpbi5SYXBoYWVsID0gb2xkUmFwaGFlbC5pcykgOiBkZWxldGUgUmFwaGFlbDtcbiAgICAgICAgcmV0dXJuIFI7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUmFwaGFlbC5zdFxuICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgKipcbiAgICAgKiBZb3UgY2FuIGFkZCB5b3VyIG93biBtZXRob2QgdG8gZWxlbWVudHMgYW5kIHNldHMuIEl0IGlzIHdpc2UgdG8gYWRkIGEgc2V0IG1ldGhvZCBmb3IgZWFjaCBlbGVtZW50IG1ldGhvZFxuICAgICAqIHlvdSBhZGRlZCwgc28geW91IHdpbGwgYmUgYWJsZSB0byBjYWxsIHRoZSBzYW1lIG1ldGhvZCBvbiBzZXRzIHRvby5cbiAgICAgKipcbiAgICAgKiBTZWUgYWxzbyBAUmFwaGFlbC5lbC5cbiAgICAgPiBVc2FnZVxuICAgICB8IFJhcGhhZWwuZWwucmVkID0gZnVuY3Rpb24gKCkge1xuICAgICB8ICAgICB0aGlzLmF0dHIoe2ZpbGw6IFwiI2YwMFwifSk7XG4gICAgIHwgfTtcbiAgICAgfCBSYXBoYWVsLnN0LnJlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgfCAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICB8ICAgICAgICAgZWwucmVkKCk7XG4gICAgIHwgICAgIH0pO1xuICAgICB8IH07XG4gICAgIHwgLy8gdGhlbiB1c2UgaXRcbiAgICAgfCBwYXBlci5zZXQocGFwZXIuY2lyY2xlKDEwMCwgMTAwLCAyMCksIHBhcGVyLmNpcmNsZSgxMTAsIDEwMCwgMjApKS5yZWQoKTtcbiAgICBcXCovXG4gICAgUi5zdCA9IHNldHByb3RvO1xuXG4gICAgZXZlLm9uKFwicmFwaGFlbC5ET01sb2FkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIC8vIEZpcmVmb3ggPDMuNiBmaXg6IGh0dHA6Ly93ZWJyZWZsZWN0aW9uLmJsb2dzcG90LmNvbS8yMDA5LzExLzE5NS1jaGFycy10by1oZWxwLWxhenktbG9hZGluZy5odG1sXG4gICAgKGZ1bmN0aW9uIChkb2MsIGxvYWRlZCwgZikge1xuICAgICAgICBpZiAoZG9jLnJlYWR5U3RhdGUgPT0gbnVsbCAmJiBkb2MuYWRkRXZlbnRMaXN0ZW5lcil7XG4gICAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihsb2FkZWQsIGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIobG9hZGVkLCBmLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgZG9jLnJlYWR5U3RhdGUgPSBcImNvbXBsZXRlXCI7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICBkb2MucmVhZHlTdGF0ZSA9IFwibG9hZGluZ1wiO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGlzTG9hZGVkKCkge1xuICAgICAgICAgICAgKC9pbi8pLnRlc3QoZG9jLnJlYWR5U3RhdGUpID8gc2V0VGltZW91dChpc0xvYWRlZCwgOSkgOiBSLmV2ZShcInJhcGhhZWwuRE9NbG9hZFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpc0xvYWRlZCgpO1xuICAgIH0pKGRvY3VtZW50LCBcIkRPTUNvbnRlbnRMb2FkZWRcIik7XG5cbi8vIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCBcXFxcXG4vLyDilIIgUmFwaGHDq2wgLSBKYXZhU2NyaXB0IFZlY3RvciBMaWJyYXJ5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgU1ZHIE1vZHVsZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMSBEbWl0cnkgQmFyYW5vdnNraXkgKGh0dHA6Ly9yYXBoYWVsanMuY29tKSAgIOKUgiBcXFxcXG4vLyDilIIgQ29weXJpZ2h0IChjKSAyMDA4LTIwMTEgU2VuY2hhIExhYnMgKGh0dHA6Ly9zZW5jaGEuY29tKSAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSCIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgKGh0dHA6Ly9yYXBoYWVsanMuY29tL2xpY2Vuc2UuaHRtbCkgbGljZW5zZS4g4pSCIFxcXFxcbi8vIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCBcXFxcXG5cbihmdW5jdGlvbigpe1xuICAgIGlmICghUi5zdmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIHRvRmxvYXQgPSBwYXJzZUZsb2F0LFxuICAgICAgICB0b0ludCA9IHBhcnNlSW50LFxuICAgICAgICBtYXRoID0gTWF0aCxcbiAgICAgICAgbW1heCA9IG1hdGgubWF4LFxuICAgICAgICBhYnMgPSBtYXRoLmFicyxcbiAgICAgICAgcG93ID0gbWF0aC5wb3csXG4gICAgICAgIHNlcGFyYXRvciA9IC9bLCBdKy8sXG4gICAgICAgIGV2ZSA9IFIuZXZlLFxuICAgICAgICBFID0gXCJcIixcbiAgICAgICAgUyA9IFwiIFwiO1xuICAgIHZhciB4bGluayA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLFxuICAgICAgICBtYXJrZXJzID0ge1xuICAgICAgICAgICAgYmxvY2s6IFwiTTUsMCAwLDIuNSA1LDV6XCIsXG4gICAgICAgICAgICBjbGFzc2ljOiBcIk01LDAgMCwyLjUgNSw1IDMuNSwzIDMuNSwyelwiLFxuICAgICAgICAgICAgZGlhbW9uZDogXCJNMi41LDAgNSwyLjUgMi41LDUgMCwyLjV6XCIsXG4gICAgICAgICAgICBvcGVuOiBcIk02LDEgMSwzLjUgNiw2XCIsXG4gICAgICAgICAgICBvdmFsOiBcIk0yLjUsMEEyLjUsMi41LDAsMCwxLDIuNSw1IDIuNSwyLjUsMCwwLDEsMi41LDB6XCJcbiAgICAgICAgfSxcbiAgICAgICAgbWFya2VyQ291bnRlciA9IHt9O1xuICAgIFIudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAgXCJZb3VyIGJyb3dzZXIgc3VwcG9ydHMgU1ZHLlxcbllvdSBhcmUgcnVubmluZyBSYXBoYVxceGVibCBcIiArIHRoaXMudmVyc2lvbjtcbiAgICB9O1xuICAgIHZhciAkID0gZnVuY3Rpb24gKGVsLCBhdHRyKSB7XG4gICAgICAgIGlmIChhdHRyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBlbCA9ICQoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGF0dHIpIGlmIChhdHRyW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkuc3Vic3RyaW5nKDAsIDYpID09IFwieGxpbms6XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMoeGxpbmssIGtleS5zdWJzdHJpbmcoNiksIFN0cihhdHRyW2tleV0pKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBTdHIoYXR0cltrZXldKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWwgPSBSLl9nLmRvYy5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBlbCk7XG4gICAgICAgICAgICBlbC5zdHlsZSAmJiAoZWwuc3R5bGUud2Via2l0VGFwSGlnaGxpZ2h0Q29sb3IgPSBcInJnYmEoMCwwLDAsMClcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH0sXG4gICAgYWRkR3JhZGllbnRGaWxsID0gZnVuY3Rpb24gKGVsZW1lbnQsIGdyYWRpZW50KSB7XG4gICAgICAgIHZhciB0eXBlID0gXCJsaW5lYXJcIixcbiAgICAgICAgICAgIGlkID0gZWxlbWVudC5pZCArIGdyYWRpZW50LFxuICAgICAgICAgICAgZnggPSAuNSwgZnkgPSAuNSxcbiAgICAgICAgICAgIG8gPSBlbGVtZW50Lm5vZGUsXG4gICAgICAgICAgICBTVkcgPSBlbGVtZW50LnBhcGVyLFxuICAgICAgICAgICAgcyA9IG8uc3R5bGUsXG4gICAgICAgICAgICBlbCA9IFIuX2cuZG9jLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgaWYgKCFlbCkge1xuICAgICAgICAgICAgZ3JhZGllbnQgPSBTdHIoZ3JhZGllbnQpLnJlcGxhY2UoUi5fcmFkaWFsX2dyYWRpZW50LCBmdW5jdGlvbiAoYWxsLCBfZngsIF9meSkge1xuICAgICAgICAgICAgICAgIHR5cGUgPSBcInJhZGlhbFwiO1xuICAgICAgICAgICAgICAgIGlmIChfZnggJiYgX2Z5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZ4ID0gdG9GbG9hdChfZngpO1xuICAgICAgICAgICAgICAgICAgICBmeSA9IHRvRmxvYXQoX2Z5KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpciA9ICgoZnkgPiAuNSkgKiAyIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHBvdyhmeCAtIC41LCAyKSArIHBvdyhmeSAtIC41LCAyKSA+IC4yNSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGZ5ID0gbWF0aC5zcXJ0KC4yNSAtIHBvdyhmeCAtIC41LCAyKSkgKiBkaXIgKyAuNSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ5ICE9IC41ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoZnkgPSBmeS50b0ZpeGVkKDUpIC0gMWUtNSAqIGRpcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBFO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBncmFkaWVudCA9IGdyYWRpZW50LnNwbGl0KC9cXHMqXFwtXFxzKi8pO1xuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJsaW5lYXJcIikge1xuICAgICAgICAgICAgICAgIHZhciBhbmdsZSA9IGdyYWRpZW50LnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgYW5nbGUgPSAtdG9GbG9hdChhbmdsZSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKGFuZ2xlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHZlY3RvciA9IFswLCAwLCBtYXRoLmNvcyhSLnJhZChhbmdsZSkpLCBtYXRoLnNpbihSLnJhZChhbmdsZSkpXSxcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gMSAvIChtbWF4KGFicyh2ZWN0b3JbMl0pLCBhYnModmVjdG9yWzNdKSkgfHwgMSk7XG4gICAgICAgICAgICAgICAgdmVjdG9yWzJdICo9IG1heDtcbiAgICAgICAgICAgICAgICB2ZWN0b3JbM10gKj0gbWF4O1xuICAgICAgICAgICAgICAgIGlmICh2ZWN0b3JbMl0gPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZlY3RvclswXSA9IC12ZWN0b3JbMl07XG4gICAgICAgICAgICAgICAgICAgIHZlY3RvclsyXSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2ZWN0b3JbM10gPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZlY3RvclsxXSA9IC12ZWN0b3JbM107XG4gICAgICAgICAgICAgICAgICAgIHZlY3RvclszXSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRvdHMgPSBSLl9wYXJzZURvdHMoZ3JhZGllbnQpO1xuICAgICAgICAgICAgaWYgKCFkb3RzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZCA9IGlkLnJlcGxhY2UoL1tcXChcXClcXHMsXFx4YjAjXS9nLCBcIl9cIik7XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LmdyYWRpZW50ICYmIGlkICE9IGVsZW1lbnQuZ3JhZGllbnQuaWQpIHtcbiAgICAgICAgICAgICAgICBTVkcuZGVmcy5yZW1vdmVDaGlsZChlbGVtZW50LmdyYWRpZW50KTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZWxlbWVudC5ncmFkaWVudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFlbGVtZW50LmdyYWRpZW50KSB7XG4gICAgICAgICAgICAgICAgZWwgPSAkKHR5cGUgKyBcIkdyYWRpZW50XCIsIHtpZDogaWR9KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmdyYWRpZW50ID0gZWw7XG4gICAgICAgICAgICAgICAgJChlbCwgdHlwZSA9PSBcInJhZGlhbFwiID8ge1xuICAgICAgICAgICAgICAgICAgICBmeDogZngsXG4gICAgICAgICAgICAgICAgICAgIGZ5OiBmeVxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHgxOiB2ZWN0b3JbMF0sXG4gICAgICAgICAgICAgICAgICAgIHkxOiB2ZWN0b3JbMV0sXG4gICAgICAgICAgICAgICAgICAgIHgyOiB2ZWN0b3JbMl0sXG4gICAgICAgICAgICAgICAgICAgIHkyOiB2ZWN0b3JbM10sXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50VHJhbnNmb3JtOiBlbGVtZW50Lm1hdHJpeC5pbnZlcnQoKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFNWRy5kZWZzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBkb3RzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoJChcInN0b3BcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBkb3RzW2ldLm9mZnNldCA/IGRvdHNbaV0ub2Zmc2V0IDogaSA/IFwiMTAwJVwiIDogXCIwJVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzdG9wLWNvbG9yXCI6IGRvdHNbaV0uY29sb3IgfHwgXCIjZmZmXCJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkKG8sIHtcbiAgICAgICAgICAgIGZpbGw6IFwidXJsKCdcIiArIGRvY3VtZW50LmxvY2F0aW9uICsgXCIjXCIgKyBpZCArIFwiJylcIixcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICBcImZpbGwtb3BhY2l0eVwiOiAxXG4gICAgICAgIH0pO1xuICAgICAgICBzLmZpbGwgPSBFO1xuICAgICAgICBzLm9wYWNpdHkgPSAxO1xuICAgICAgICBzLmZpbGxPcGFjaXR5ID0gMTtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfSxcbiAgICB1cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIHZhciBiYm94ID0gby5nZXRCQm94KDEpO1xuICAgICAgICAkKG8ucGF0dGVybiwge3BhdHRlcm5UcmFuc2Zvcm06IG8ubWF0cml4LmludmVydCgpICsgXCIgdHJhbnNsYXRlKFwiICsgYmJveC54ICsgXCIsXCIgKyBiYm94LnkgKyBcIilcIn0pO1xuICAgIH0sXG4gICAgYWRkQXJyb3cgPSBmdW5jdGlvbiAobywgdmFsdWUsIGlzRW5kKSB7XG4gICAgICAgIGlmIChvLnR5cGUgPT0gXCJwYXRoXCIpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBTdHIodmFsdWUpLnRvTG93ZXJDYXNlKCkuc3BsaXQoXCItXCIpLFxuICAgICAgICAgICAgICAgIHAgPSBvLnBhcGVyLFxuICAgICAgICAgICAgICAgIHNlID0gaXNFbmQgPyBcImVuZFwiIDogXCJzdGFydFwiLFxuICAgICAgICAgICAgICAgIG5vZGUgPSBvLm5vZGUsXG4gICAgICAgICAgICAgICAgYXR0cnMgPSBvLmF0dHJzLFxuICAgICAgICAgICAgICAgIHN0cm9rZSA9IGF0dHJzW1wic3Ryb2tlLXdpZHRoXCJdLFxuICAgICAgICAgICAgICAgIGkgPSB2YWx1ZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHR5cGUgPSBcImNsYXNzaWNcIixcbiAgICAgICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgICAgIHRvLFxuICAgICAgICAgICAgICAgIGR4LFxuICAgICAgICAgICAgICAgIHJlZlgsXG4gICAgICAgICAgICAgICAgYXR0cixcbiAgICAgICAgICAgICAgICB3ID0gMyxcbiAgICAgICAgICAgICAgICBoID0gMyxcbiAgICAgICAgICAgICAgICB0ID0gNTtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHZhbHVlc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNsYXNzaWNcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm92YWxcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImRpYW1vbmRcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5vbmVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSB2YWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIndpZGVcIjogaCA9IDU7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFycm93XCI6IGggPSAyOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImxvbmdcIjogdyA9IDU7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2hvcnRcIjogdyA9IDI7IGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlID09IFwib3BlblwiKSB7XG4gICAgICAgICAgICAgICAgdyArPSAyO1xuICAgICAgICAgICAgICAgIGggKz0gMjtcbiAgICAgICAgICAgICAgICB0ICs9IDI7XG4gICAgICAgICAgICAgICAgZHggPSAxO1xuICAgICAgICAgICAgICAgIHJlZlggPSBpc0VuZCA/IDQgOiAxO1xuICAgICAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGw6IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgICAgICBzdHJva2U6IGF0dHJzLnN0cm9rZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlZlggPSBkeCA9IHcgLyAyO1xuICAgICAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGw6IGF0dHJzLnN0cm9rZSxcbiAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOiBcIm5vbmVcIlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoby5fLmFycm93cykge1xuICAgICAgICAgICAgICAgIGlmIChpc0VuZCkge1xuICAgICAgICAgICAgICAgICAgICBvLl8uYXJyb3dzLmVuZFBhdGggJiYgbWFya2VyQ291bnRlcltvLl8uYXJyb3dzLmVuZFBhdGhdLS07XG4gICAgICAgICAgICAgICAgICAgIG8uXy5hcnJvd3MuZW5kTWFya2VyICYmIG1hcmtlckNvdW50ZXJbby5fLmFycm93cy5lbmRNYXJrZXJdLS07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgby5fLmFycm93cy5zdGFydFBhdGggJiYgbWFya2VyQ291bnRlcltvLl8uYXJyb3dzLnN0YXJ0UGF0aF0tLTtcbiAgICAgICAgICAgICAgICAgICAgby5fLmFycm93cy5zdGFydE1hcmtlciAmJiBtYXJrZXJDb3VudGVyW28uXy5hcnJvd3Muc3RhcnRNYXJrZXJdLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvLl8uYXJyb3dzID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZSAhPSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgIHZhciBwYXRoSWQgPSBcInJhcGhhZWwtbWFya2VyLVwiICsgdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgbWFya2VySWQgPSBcInJhcGhhZWwtbWFya2VyLVwiICsgc2UgKyB0eXBlICsgdyArIGggKyBcIi1vYmpcIiArIG8uaWQ7XG4gICAgICAgICAgICAgICAgaWYgKCFSLl9nLmRvYy5nZXRFbGVtZW50QnlJZChwYXRoSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHAuZGVmcy5hcHBlbmRDaGlsZCgkKCQoXCJwYXRoXCIpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInN0cm9rZS1saW5lY2FwXCI6IFwicm91bmRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGQ6IG1hcmtlcnNbdHlwZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcGF0aElkXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyQ291bnRlcltwYXRoSWRdID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJDb3VudGVyW3BhdGhJZF0rKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG1hcmtlciA9IFIuX2cuZG9jLmdldEVsZW1lbnRCeUlkKG1hcmtlcklkKSxcbiAgICAgICAgICAgICAgICAgICAgdXNlO1xuICAgICAgICAgICAgICAgIGlmICghbWFya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlciA9ICQoJChcIm1hcmtlclwiKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IG1hcmtlcklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VySGVpZ2h0OiBoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyV2lkdGg6IHcsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmllbnQ6IFwiYXV0b1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmWDogcmVmWCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZlk6IGggLyAyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB1c2UgPSAkKCQoXCJ1c2VcIiksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieGxpbms6aHJlZlwiOiBcIiNcIiArIHBhdGhJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogKGlzRW5kID8gXCJyb3RhdGUoMTgwIFwiICsgdyAvIDIgKyBcIiBcIiArIGggLyAyICsgXCIpIFwiIDogRSkgKyBcInNjYWxlKFwiICsgdyAvIHQgKyBcIixcIiArIGggLyB0ICsgXCIpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInN0cm9rZS13aWR0aFwiOiAoMSAvICgodyAvIHQgKyBoIC8gdCkgLyAyKSkudG9GaXhlZCg0KVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyLmFwcGVuZENoaWxkKHVzZSk7XG4gICAgICAgICAgICAgICAgICAgIHAuZGVmcy5hcHBlbmRDaGlsZChtYXJrZXIpO1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJDb3VudGVyW21hcmtlcklkXSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyQ291bnRlclttYXJrZXJJZF0rKztcbiAgICAgICAgICAgICAgICAgICAgdXNlID0gbWFya2VyLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidXNlXCIpWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKHVzZSwgYXR0cik7XG4gICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZHggKiAodHlwZSAhPSBcImRpYW1vbmRcIiAmJiB0eXBlICE9IFwib3ZhbFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNFbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IG8uXy5hcnJvd3Muc3RhcnRkeCAqIHN0cm9rZSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICB0byA9IFIuZ2V0VG90YWxMZW5ndGgoYXR0cnMucGF0aCkgLSBkZWx0YSAqIHN0cm9rZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmcm9tID0gZGVsdGEgKiBzdHJva2U7XG4gICAgICAgICAgICAgICAgICAgIHRvID0gUi5nZXRUb3RhbExlbmd0aChhdHRycy5wYXRoKSAtIChvLl8uYXJyb3dzLmVuZGR4ICogc3Ryb2tlIHx8IDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhdHRyID0ge307XG4gICAgICAgICAgICAgICAgYXR0cltcIm1hcmtlci1cIiArIHNlXSA9IFwidXJsKCNcIiArIG1hcmtlcklkICsgXCIpXCI7XG4gICAgICAgICAgICAgICAgaWYgKHRvIHx8IGZyb20pIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0ci5kID0gUi5nZXRTdWJwYXRoKGF0dHJzLnBhdGgsIGZyb20sIHRvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJChub2RlLCBhdHRyKTtcbiAgICAgICAgICAgICAgICBvLl8uYXJyb3dzW3NlICsgXCJQYXRoXCJdID0gcGF0aElkO1xuICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Nbc2UgKyBcIk1hcmtlclwiXSA9IG1hcmtlcklkO1xuICAgICAgICAgICAgICAgIG8uXy5hcnJvd3Nbc2UgKyBcImR4XCJdID0gZGVsdGE7XG4gICAgICAgICAgICAgICAgby5fLmFycm93c1tzZSArIFwiVHlwZVwiXSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgby5fLmFycm93c1tzZSArIFwiU3RyaW5nXCJdID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChpc0VuZCkge1xuICAgICAgICAgICAgICAgICAgICBmcm9tID0gby5fLmFycm93cy5zdGFydGR4ICogc3Ryb2tlIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIHRvID0gUi5nZXRUb3RhbExlbmd0aChhdHRycy5wYXRoKSAtIGZyb207XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRvID0gUi5nZXRUb3RhbExlbmd0aChhdHRycy5wYXRoKSAtIChvLl8uYXJyb3dzLmVuZGR4ICogc3Ryb2tlIHx8IDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvLl8uYXJyb3dzW3NlICsgXCJQYXRoXCJdICYmICQobm9kZSwge2Q6IFIuZ2V0U3VicGF0aChhdHRycy5wYXRoLCBmcm9tLCB0byl9KTtcbiAgICAgICAgICAgICAgICBkZWxldGUgby5fLmFycm93c1tzZSArIFwiUGF0aFwiXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgby5fLmFycm93c1tzZSArIFwiTWFya2VyXCJdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBvLl8uYXJyb3dzW3NlICsgXCJkeFwiXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgby5fLmFycm93c1tzZSArIFwiVHlwZVwiXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgby5fLmFycm93c1tzZSArIFwiU3RyaW5nXCJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChhdHRyIGluIG1hcmtlckNvdW50ZXIpIGlmIChtYXJrZXJDb3VudGVyW2hhc10oYXR0cikgJiYgIW1hcmtlckNvdW50ZXJbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IFIuX2cuZG9jLmdldEVsZW1lbnRCeUlkKGF0dHIpO1xuICAgICAgICAgICAgICAgIGl0ZW0gJiYgaXRlbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBkYXNoYXJyYXkgPSB7XG4gICAgICAgIFwiXCI6IFswXSxcbiAgICAgICAgXCJub25lXCI6IFswXSxcbiAgICAgICAgXCItXCI6IFszLCAxXSxcbiAgICAgICAgXCIuXCI6IFsxLCAxXSxcbiAgICAgICAgXCItLlwiOiBbMywgMSwgMSwgMV0sXG4gICAgICAgIFwiLS4uXCI6IFszLCAxLCAxLCAxLCAxLCAxXSxcbiAgICAgICAgXCIuIFwiOiBbMSwgM10sXG4gICAgICAgIFwiLSBcIjogWzQsIDNdLFxuICAgICAgICBcIi0tXCI6IFs4LCAzXSxcbiAgICAgICAgXCItIC5cIjogWzQsIDMsIDEsIDNdLFxuICAgICAgICBcIi0tLlwiOiBbOCwgMywgMSwgM10sXG4gICAgICAgIFwiLS0uLlwiOiBbOCwgMywgMSwgMywgMSwgM11cbiAgICB9LFxuICAgIGFkZERhc2hlcyA9IGZ1bmN0aW9uIChvLCB2YWx1ZSwgcGFyYW1zKSB7XG4gICAgICAgIHZhbHVlID0gZGFzaGFycmF5W1N0cih2YWx1ZSkudG9Mb3dlckNhc2UoKV07XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gby5hdHRyc1tcInN0cm9rZS13aWR0aFwiXSB8fCBcIjFcIixcbiAgICAgICAgICAgICAgICBidXR0ID0ge3JvdW5kOiB3aWR0aCwgc3F1YXJlOiB3aWR0aCwgYnV0dDogMH1bby5hdHRyc1tcInN0cm9rZS1saW5lY2FwXCJdIHx8IHBhcmFtc1tcInN0cm9rZS1saW5lY2FwXCJdXSB8fCAwLFxuICAgICAgICAgICAgICAgIGRhc2hlcyA9IFtdLFxuICAgICAgICAgICAgICAgIGkgPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgZGFzaGVzW2ldID0gdmFsdWVbaV0gKiB3aWR0aCArICgoaSAlIDIpID8gMSA6IC0xKSAqIGJ1dHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKG8ubm9kZSwge1wic3Ryb2tlLWRhc2hhcnJheVwiOiBkYXNoZXMuam9pbihcIixcIil9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2V0RmlsbEFuZFN0cm9rZSA9IGZ1bmN0aW9uIChvLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIG5vZGUgPSBvLm5vZGUsXG4gICAgICAgICAgICBhdHRycyA9IG8uYXR0cnMsXG4gICAgICAgICAgICB2aXMgPSBub2RlLnN0eWxlLnZpc2liaWxpdHk7XG4gICAgICAgIG5vZGUuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgIGZvciAodmFyIGF0dCBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmIChwYXJhbXNbaGFzXShhdHQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFSLl9hdmFpbGFibGVBdHRyc1toYXNdKGF0dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcmFtc1thdHRdO1xuICAgICAgICAgICAgICAgIGF0dHJzW2F0dF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGF0dCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYmx1clwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgby5ibHVyKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidGl0bGVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ0aXRsZVwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHRoZSBleGlzdGluZyA8dGl0bGU+LlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRpdGxlLmxlbmd0aCAmJiAodGl0bGUgPSB0aXRsZVswXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGUuZmlyc3RDaGlsZC5ub2RlVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gJChcInRpdGxlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gUi5fZy5kb2MuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZS5hcHBlbmRDaGlsZCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaHJlZlwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidGFyZ2V0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcG4gPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG4udGFnTmFtZS50b0xvd2VyQ2FzZSgpICE9IFwiYVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhsID0gJChcImFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG4uaW5zZXJ0QmVmb3JlKGhsLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBobC5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbiA9IGhsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dCA9PSBcInRhcmdldFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG4uc2V0QXR0cmlidXRlTlMoeGxpbmssIFwic2hvd1wiLCB2YWx1ZSA9PSBcImJsYW5rXCIgPyBcIm5ld1wiIDogdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbi5zZXRBdHRyaWJ1dGVOUyh4bGluaywgYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImN1cnNvclwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZS5jdXJzb3IgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidHJhbnNmb3JtXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnRyYW5zZm9ybSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImFycm93LXN0YXJ0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRBcnJvdyhvLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImFycm93LWVuZFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQXJyb3cobywgdmFsdWUsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjbGlwLXJlY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWN0ID0gU3RyKHZhbHVlKS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlY3QubGVuZ3RoID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLmNsaXAgJiYgby5jbGlwLnBhcmVudE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvLmNsaXAucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gJChcImNsaXBQYXRoXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYyA9ICQoXCJyZWN0XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLmlkID0gUi5jcmVhdGVVVUlEKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChyYywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiByZWN0WzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiByZWN0WzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogcmVjdFsyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiByZWN0WzNdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQocmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGFwZXIuZGVmcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7XCJjbGlwLXBhdGhcIjogXCJ1cmwoI1wiICsgZWwuaWQgKyBcIilcIn0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uY2xpcCA9IHJjO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXRoID0gbm9kZS5nZXRBdHRyaWJ1dGUoXCJjbGlwLXBhdGhcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNsaXAgPSBSLl9nLmRvYy5nZXRFbGVtZW50QnlJZChwYXRoLnJlcGxhY2UoLyhedXJsXFwoI3xcXCkkKS9nLCBFKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaXAgJiYgY2xpcC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNsaXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtcImNsaXAtcGF0aFwiOiBFfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvLmNsaXA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInBhdGhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLnR5cGUgPT0gXCJwYXRoXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtkOiB2YWx1ZSA/IGF0dHJzLnBhdGggPSBSLl9wYXRoVG9BYnNvbHV0ZSh2YWx1ZSkgOiBcIk0wLDBcIn0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8uXy5hcnJvd3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdGFydFN0cmluZ1wiIGluIG8uXy5hcnJvd3MgJiYgYWRkQXJyb3cobywgby5fLmFycm93cy5zdGFydFN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZW5kU3RyaW5nXCIgaW4gby5fLmFycm93cyAmJiBhZGRBcnJvdyhvLCBvLl8uYXJyb3dzLmVuZFN0cmluZywgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ3aWR0aFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmZ4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ID0gXCJ4XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhdHRycy54O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5meCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gLWF0dHJzLnggLSAoYXR0cnMud2lkdGggfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyeFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dCA9PSBcInJ4XCIgJiYgby50eXBlID09IFwicmVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjeFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnBhdHRlcm4gJiYgdXBkYXRlUG9zaXRpb24obyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJoZWlnaHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5meSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dCA9IFwieVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYXR0cnMueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ5XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuZnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IC1hdHRycy55IC0gKGF0dHJzLmhlaWdodCB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJ5XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0ID09IFwicnlcIiAmJiBvLnR5cGUgPT0gXCJyZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImN5XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0dGVybiAmJiB1cGRhdGVQb3NpdGlvbihvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLnR5cGUgPT0gXCJyZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5vZGUsIHtyeDogdmFsdWUsIHJ5OiB2YWx1ZX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNyY1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8udHlwZSA9PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZU5TKHhsaW5rLCBcImhyZWZcIiwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJva2Utd2lkdGhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLl8uc3ggIT0gMSB8fCBvLl8uc3kgIT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlIC89IG1tYXgoYWJzKG8uXy5zeCksIGFicyhvLl8uc3kpKSB8fCAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnNbXCJzdHJva2UtZGFzaGFycmF5XCJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkRGFzaGVzKG8sIGF0dHJzW1wic3Ryb2tlLWRhc2hhcnJheVwiXSwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLl8uYXJyb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdGFydFN0cmluZ1wiIGluIG8uXy5hcnJvd3MgJiYgYWRkQXJyb3cobywgby5fLmFycm93cy5zdGFydFN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlbmRTdHJpbmdcIiBpbiBvLl8uYXJyb3dzICYmIGFkZEFycm93KG8sIG8uXy5hcnJvd3MuZW5kU3RyaW5nLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic3Ryb2tlLWRhc2hhcnJheVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkRGFzaGVzKG8sIHZhbHVlLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmaWxsXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNVUkwgPSBTdHIodmFsdWUpLm1hdGNoKFIuX0lTVVJMKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1VSTCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsID0gJChcInBhdHRlcm5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlnID0gJChcImltYWdlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLmlkID0gUi5jcmVhdGVVVUlEKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChlbCwge3g6IDAsIHk6IDAsIHBhdHRlcm5Vbml0czogXCJ1c2VyU3BhY2VPblVzZVwiLCBoZWlnaHQ6IDEsIHdpZHRoOiAxfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpZywge3g6IDAsIHk6IDAsIFwieGxpbms6aHJlZlwiOiBpc1VSTFsxXX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGlnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUi5fcHJlbG9hZChpc1VSTFsxXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHcgPSB0aGlzLm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGggPSB0aGlzLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoZWwsIHt3aWR0aDogdywgaGVpZ2h0OiBofSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlnLCB7d2lkdGg6IHcsIGhlaWdodDogaH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgby5wYXBlci5zYWZhcmkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkoZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGFwZXIuZGVmcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChub2RlLCB7ZmlsbDogXCJ1cmwoI1wiICsgZWwuaWQgKyBcIilcIn0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0dGVybiA9IGVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0dGVybiAmJiB1cGRhdGVQb3NpdGlvbihvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbHIgPSBSLmdldFJHQih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNsci5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJhbXMuZ3JhZGllbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGF0dHJzLmdyYWRpZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFSLmlzKGF0dHJzLm9wYWNpdHksIFwidW5kZWZpbmVkXCIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIuaXMocGFyYW1zLm9wYWNpdHksIFwidW5kZWZpbmVkXCIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge29wYWNpdHk6IGF0dHJzLm9wYWNpdHl9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhUi5pcyhhdHRyc1tcImZpbGwtb3BhY2l0eVwiXSwgXCJ1bmRlZmluZWRcIikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUi5pcyhwYXJhbXNbXCJmaWxsLW9wYWNpdHlcIl0sIFwidW5kZWZpbmVkXCIpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge1wiZmlsbC1vcGFjaXR5XCI6IGF0dHJzW1wiZmlsbC1vcGFjaXR5XCJdfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChvLnR5cGUgPT0gXCJjaXJjbGVcIiB8fCBvLnR5cGUgPT0gXCJlbGxpcHNlXCIgfHwgU3RyKHZhbHVlKS5jaGFyQXQoKSAhPSBcInJcIikgJiYgYWRkR3JhZGllbnRGaWxsKG8sIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcIm9wYWNpdHlcIiBpbiBhdHRycyB8fCBcImZpbGwtb3BhY2l0eVwiIGluIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBncmFkaWVudCA9IFIuX2cuZG9jLmdldEVsZW1lbnRCeUlkKG5vZGUuZ2V0QXR0cmlidXRlKFwiZmlsbFwiKS5yZXBsYWNlKC9edXJsXFwoI3xcXCkkL2csIEUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdyYWRpZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RvcHMgPSBncmFkaWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN0b3BcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHN0b3BzW3N0b3BzLmxlbmd0aCAtIDFdLCB7XCJzdG9wLW9wYWNpdHlcIjogKFwib3BhY2l0eVwiIGluIGF0dHJzID8gYXR0cnMub3BhY2l0eSA6IDEpICogKFwiZmlsbC1vcGFjaXR5XCIgaW4gYXR0cnMgPyBhdHRyc1tcImZpbGwtb3BhY2l0eVwiXSA6IDEpfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnMuZ3JhZGllbnQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRycy5maWxsID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbHJbaGFzXShcIm9wYWNpdHlcIikgJiYgJChub2RlLCB7XCJmaWxsLW9wYWNpdHlcIjogY2xyLm9wYWNpdHkgPiAxID8gY2xyLm9wYWNpdHkgLyAxMDAgOiBjbHIub3BhY2l0eX0pO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic3Ryb2tlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjbHIgPSBSLmdldFJHQih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIGNsci5oZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXR0ID09IFwic3Ryb2tlXCIgJiYgY2xyW2hhc10oXCJvcGFjaXR5XCIpICYmICQobm9kZSwge1wic3Ryb2tlLW9wYWNpdHlcIjogY2xyLm9wYWNpdHkgPiAxID8gY2xyLm9wYWNpdHkgLyAxMDAgOiBjbHIub3BhY2l0eX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF0dCA9PSBcInN0cm9rZVwiICYmIG8uXy5hcnJvd3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN0YXJ0U3RyaW5nXCIgaW4gby5fLmFycm93cyAmJiBhZGRBcnJvdyhvLCBvLl8uYXJyb3dzLnN0YXJ0U3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVuZFN0cmluZ1wiIGluIG8uXy5hcnJvd3MgJiYgYWRkQXJyb3cobywgby5fLmFycm93cy5lbmRTdHJpbmcsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJncmFkaWVudFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgKG8udHlwZSA9PSBcImNpcmNsZVwiIHx8IG8udHlwZSA9PSBcImVsbGlwc2VcIiB8fCBTdHIodmFsdWUpLmNoYXJBdCgpICE9IFwiclwiKSAmJiBhZGRHcmFkaWVudEZpbGwobywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJvcGFjaXR5XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuZ3JhZGllbnQgJiYgIWF0dHJzW2hhc10oXCJzdHJva2Utb3BhY2l0eVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobm9kZSwge1wic3Ryb2tlLW9wYWNpdHlcIjogdmFsdWUgPiAxID8gdmFsdWUgLyAxMDAgOiB2YWx1ZX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbFxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZmlsbC1vcGFjaXR5XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuZ3JhZGllbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFkaWVudCA9IFIuX2cuZG9jLmdldEVsZW1lbnRCeUlkKG5vZGUuZ2V0QXR0cmlidXRlKFwiZmlsbFwiKS5yZXBsYWNlKC9edXJsXFwoI3xcXCkkL2csIEUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ3JhZGllbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcHMgPSBncmFkaWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN0b3BcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoc3RvcHNbc3RvcHMubGVuZ3RoIC0gMV0sIHtcInN0b3Atb3BhY2l0eVwiOiB2YWx1ZX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dCA9PSBcImZvbnQtc2l6ZVwiICYmICh2YWx1ZSA9IHRvSW50KHZhbHVlLCAxMCkgKyBcInB4XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNzc3J1bGUgPSBhdHQucmVwbGFjZSgvKFxcLS4pL2csIGZ1bmN0aW9uICh3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHcuc3Vic3RyaW5nKDEpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGVbY3NzcnVsZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHR1bmVUZXh0KG8sIHBhcmFtcyk7XG4gICAgICAgIG5vZGUuc3R5bGUudmlzaWJpbGl0eSA9IHZpcztcbiAgICB9LFxuICAgIGxlYWRpbmcgPSAxLjIsXG4gICAgdHVuZVRleHQgPSBmdW5jdGlvbiAoZWwsIHBhcmFtcykge1xuICAgICAgICBpZiAoZWwudHlwZSAhPSBcInRleHRcIiB8fCAhKHBhcmFtc1toYXNdKFwidGV4dFwiKSB8fCBwYXJhbXNbaGFzXShcImZvbnRcIikgfHwgcGFyYW1zW2hhc10oXCJmb250LXNpemVcIikgfHwgcGFyYW1zW2hhc10oXCJ4XCIpIHx8IHBhcmFtc1toYXNdKFwieVwiKSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYSA9IGVsLmF0dHJzLFxuICAgICAgICAgICAgbm9kZSA9IGVsLm5vZGUsXG4gICAgICAgICAgICBmb250U2l6ZSA9IG5vZGUuZmlyc3RDaGlsZCA/IHRvSW50KFIuX2cuZG9jLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUobm9kZS5maXJzdENoaWxkLCBFKS5nZXRQcm9wZXJ0eVZhbHVlKFwiZm9udC1zaXplXCIpLCAxMCkgOiAxMDtcblxuICAgICAgICBpZiAocGFyYW1zW2hhc10oXCJ0ZXh0XCIpKSB7XG4gICAgICAgICAgICBhLnRleHQgPSBwYXJhbXMudGV4dDtcbiAgICAgICAgICAgIHdoaWxlIChub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGV4dHMgPSBTdHIocGFyYW1zLnRleHQpLnNwbGl0KFwiXFxuXCIpLFxuICAgICAgICAgICAgICAgIHRzcGFucyA9IFtdLFxuICAgICAgICAgICAgICAgIHRzcGFuO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGV4dHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHRzcGFuID0gJChcInRzcGFuXCIpO1xuICAgICAgICAgICAgICAgIGkgJiYgJCh0c3Bhbiwge2R5OiBmb250U2l6ZSAqIGxlYWRpbmcsIHg6IGEueH0pO1xuICAgICAgICAgICAgICAgIHRzcGFuLmFwcGVuZENoaWxkKFIuX2cuZG9jLmNyZWF0ZVRleHROb2RlKHRleHRzW2ldKSk7XG4gICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZCh0c3Bhbik7XG4gICAgICAgICAgICAgICAgdHNwYW5zW2ldID0gdHNwYW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0c3BhbnMgPSBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidHNwYW5cIik7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IHRzcGFucy5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoaSkge1xuICAgICAgICAgICAgICAgICQodHNwYW5zW2ldLCB7ZHk6IGZvbnRTaXplICogbGVhZGluZywgeDogYS54fSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQodHNwYW5zWzBdLCB7ZHk6IDB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkKG5vZGUsIHt4OiBhLngsIHk6IGEueX0pO1xuICAgICAgICBlbC5fLmRpcnR5ID0gMTtcbiAgICAgICAgdmFyIGJiID0gZWwuX2dldEJCb3goKSxcbiAgICAgICAgICAgIGRpZiA9IGEueSAtIChiYi55ICsgYmIuaGVpZ2h0IC8gMik7XG4gICAgICAgIGRpZiAmJiBSLmlzKGRpZiwgXCJmaW5pdGVcIikgJiYgJCh0c3BhbnNbMF0sIHtkeTogZGlmfSk7XG4gICAgfSxcbiAgICBnZXRSZWFsTm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnBhcmVudE5vZGUgJiYgbm9kZS5wYXJlbnROb2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJhXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgRWxlbWVudCA9IGZ1bmN0aW9uIChub2RlLCBzdmcpIHtcbiAgICAgICAgdmFyIFggPSAwLFxuICAgICAgICAgICAgWSA9IDA7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogRWxlbWVudC5ub2RlXG4gICAgICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIEdpdmVzIHlvdSBhIHJlZmVyZW5jZSB0byB0aGUgRE9NIG9iamVjdCwgc28geW91IGNhbiBhc3NpZ24gZXZlbnQgaGFuZGxlcnMgb3IganVzdCBtZXNzIGFyb3VuZC5cbiAgICAgICAgICoqXG4gICAgICAgICAqIE5vdGU6IERvbuKAmXQgbWVzcyB3aXRoIGl0LlxuICAgICAgICAgPiBVc2FnZVxuICAgICAgICAgfCAvLyBkcmF3IGEgY2lyY2xlIGF0IGNvb3JkaW5hdGUgMTAsMTAgd2l0aCByYWRpdXMgb2YgMTBcbiAgICAgICAgIHwgdmFyIGMgPSBwYXBlci5jaXJjbGUoMTAsIDEwLCAxMCk7XG4gICAgICAgICB8IGMubm9kZS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgfCAgICAgYy5hdHRyKFwiZmlsbFwiLCBcInJlZFwiKTtcbiAgICAgICAgIHwgfTtcbiAgICAgICAgXFwqL1xuICAgICAgICB0aGlzWzBdID0gdGhpcy5ub2RlID0gbm9kZTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBFbGVtZW50LnJhcGhhZWxcbiAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgKipcbiAgICAgICAgICogSW50ZXJuYWwgcmVmZXJlbmNlIHRvIEBSYXBoYWVsIG9iamVjdC4gSW4gY2FzZSBpdCBpcyBub3QgYXZhaWxhYmxlLlxuICAgICAgICAgPiBVc2FnZVxuICAgICAgICAgfCBSYXBoYWVsLmVsLnJlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIHwgICAgIHZhciBoc2IgPSB0aGlzLnBhcGVyLnJhcGhhZWwucmdiMmhzYih0aGlzLmF0dHIoXCJmaWxsXCIpKTtcbiAgICAgICAgIHwgICAgIGhzYi5oID0gMTtcbiAgICAgICAgIHwgICAgIHRoaXMuYXR0cih7ZmlsbDogdGhpcy5wYXBlci5yYXBoYWVsLmhzYjJyZ2IoaHNiKS5oZXh9KTtcbiAgICAgICAgIHwgfVxuICAgICAgICBcXCovXG4gICAgICAgIG5vZGUucmFwaGFlbCA9IHRydWU7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogRWxlbWVudC5pZFxuICAgICAgICAgWyBwcm9wZXJ0eSAobnVtYmVyKSBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBVbmlxdWUgaWQgb2YgdGhlIGVsZW1lbnQuIEVzcGVjaWFsbHkgdXNlZnVsIHdoZW4geW91IHdhbnQgdG8gbGlzdGVuIHRvIGV2ZW50cyBvZiB0aGUgZWxlbWVudCxcbiAgICAgICAgICogYmVjYXVzZSBhbGwgZXZlbnRzIGFyZSBmaXJlZCBpbiBmb3JtYXQgYDxtb2R1bGU+LjxhY3Rpb24+LjxpZD5gLiBBbHNvIHVzZWZ1bCBmb3IgQFBhcGVyLmdldEJ5SWQgbWV0aG9kLlxuICAgICAgICBcXCovXG4gICAgICAgIHRoaXMuaWQgPSBSLl9vaWQrKztcbiAgICAgICAgbm9kZS5yYXBoYWVsaWQgPSB0aGlzLmlkO1xuICAgICAgICB0aGlzLm1hdHJpeCA9IFIubWF0cml4KCk7XG4gICAgICAgIHRoaXMucmVhbFBhdGggPSBudWxsO1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIEVsZW1lbnQucGFwZXJcbiAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgKipcbiAgICAgICAgICogSW50ZXJuYWwgcmVmZXJlbmNlIHRvIOKAnHBhcGVy4oCdIHdoZXJlIG9iamVjdCBkcmF3bi4gTWFpbmx5IGZvciB1c2UgaW4gcGx1Z2lucyBhbmQgZWxlbWVudCBleHRlbnNpb25zLlxuICAgICAgICAgPiBVc2FnZVxuICAgICAgICAgfCBSYXBoYWVsLmVsLmNyb3NzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgfCAgICAgdGhpcy5hdHRyKHtmaWxsOiBcInJlZFwifSk7XG4gICAgICAgICB8ICAgICB0aGlzLnBhcGVyLnBhdGgoXCJNMTAsMTBMNTAsNTBNNTAsMTBMMTAsNTBcIilcbiAgICAgICAgIHwgICAgICAgICAuYXR0cih7c3Ryb2tlOiBcInJlZFwifSk7XG4gICAgICAgICB8IH1cbiAgICAgICAgXFwqL1xuICAgICAgICB0aGlzLnBhcGVyID0gc3ZnO1xuICAgICAgICB0aGlzLmF0dHJzID0gdGhpcy5hdHRycyB8fCB7fTtcbiAgICAgICAgdGhpcy5fID0ge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiBbXSxcbiAgICAgICAgICAgIHN4OiAxLFxuICAgICAgICAgICAgc3k6IDEsXG4gICAgICAgICAgICBkZWc6IDAsXG4gICAgICAgICAgICBkeDogMCxcbiAgICAgICAgICAgIGR5OiAwLFxuICAgICAgICAgICAgZGlydHk6IDFcbiAgICAgICAgfTtcbiAgICAgICAgIXN2Zy5ib3R0b20gJiYgKHN2Zy5ib3R0b20gPSB0aGlzKTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBFbGVtZW50LnByZXZcbiAgICAgICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmVmZXJlbmNlIHRvIHRoZSBwcmV2aW91cyBlbGVtZW50IGluIHRoZSBoaWVyYXJjaHkuXG4gICAgICAgIFxcKi9cbiAgICAgICAgdGhpcy5wcmV2ID0gc3ZnLnRvcDtcbiAgICAgICAgc3ZnLnRvcCAmJiAoc3ZnLnRvcC5uZXh0ID0gdGhpcyk7XG4gICAgICAgIHN2Zy50b3AgPSB0aGlzO1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIEVsZW1lbnQubmV4dFxuICAgICAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZWZlcmVuY2UgdG8gdGhlIG5leHQgZWxlbWVudCBpbiB0aGUgaGllcmFyY2h5LlxuICAgICAgICBcXCovXG4gICAgICAgIHRoaXMubmV4dCA9IG51bGw7XG4gICAgfSxcbiAgICBlbHByb3RvID0gUi5lbDtcblxuICAgIEVsZW1lbnQucHJvdG90eXBlID0gZWxwcm90bztcbiAgICBlbHByb3RvLmNvbnN0cnVjdG9yID0gRWxlbWVudDtcblxuICAgIFIuX2VuZ2luZS5wYXRoID0gZnVuY3Rpb24gKHBhdGhTdHJpbmcsIFNWRykge1xuICAgICAgICB2YXIgZWwgPSAkKFwicGF0aFwiKTtcbiAgICAgICAgU1ZHLmNhbnZhcyAmJiBTVkcuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHAgPSBuZXcgRWxlbWVudChlbCwgU1ZHKTtcbiAgICAgICAgcC50eXBlID0gXCJwYXRoXCI7XG4gICAgICAgIHNldEZpbGxBbmRTdHJva2UocCwge1xuICAgICAgICAgICAgZmlsbDogXCJub25lXCIsXG4gICAgICAgICAgICBzdHJva2U6IFwiIzAwMFwiLFxuICAgICAgICAgICAgcGF0aDogcGF0aFN0cmluZ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5yb3RhdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQhIFVzZSBARWxlbWVudC50cmFuc2Zvcm0gaW5zdGVhZC5cbiAgICAgKiBBZGRzIHJvdGF0aW9uIGJ5IGdpdmVuIGFuZ2xlIGFyb3VuZCBnaXZlbiBwb2ludCB0byB0aGUgbGlzdCBvZlxuICAgICAqIHRyYW5zZm9ybWF0aW9ucyBvZiB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gZGVnIChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcbiAgICAgLSBjeCAobnVtYmVyKSAjb3B0aW9uYWwgeCBjb29yZGluYXRlIG9mIHRoZSBjZW50cmUgb2Ygcm90YXRpb25cbiAgICAgLSBjeSAobnVtYmVyKSAjb3B0aW9uYWwgeSBjb29yZGluYXRlIG9mIHRoZSBjZW50cmUgb2Ygcm90YXRpb25cbiAgICAgKiBJZiBjeCAmIGN5IGFyZW7igJl0IHNwZWNpZmllZCBjZW50cmUgb2YgdGhlIHNoYXBlIGlzIHVzZWQgYXMgYSBwb2ludCBvZiByb3RhdGlvbi5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnJvdGF0ZSA9IGZ1bmN0aW9uIChkZWcsIGN4LCBjeSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkZWcgPSBTdHIoZGVnKS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICBpZiAoZGVnLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGN4ID0gdG9GbG9hdChkZWdbMV0pO1xuICAgICAgICAgICAgY3kgPSB0b0Zsb2F0KGRlZ1syXSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVnID0gdG9GbG9hdChkZWdbMF0pO1xuICAgICAgICAoY3kgPT0gbnVsbCkgJiYgKGN4ID0gY3kpO1xuICAgICAgICBpZiAoY3ggPT0gbnVsbCB8fCBjeSA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYmJveCA9IHRoaXMuZ2V0QkJveCgxKTtcbiAgICAgICAgICAgIGN4ID0gYmJveC54ICsgYmJveC53aWR0aCAvIDI7XG4gICAgICAgICAgICBjeSA9IGJib3gueSArIGJib3guaGVpZ2h0IC8gMjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyYW5zZm9ybSh0aGlzLl8udHJhbnNmb3JtLmNvbmNhdChbW1wiclwiLCBkZWcsIGN4LCBjeV1dKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc2NhbGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlcHJlY2F0ZWQhIFVzZSBARWxlbWVudC50cmFuc2Zvcm0gaW5zdGVhZC5cbiAgICAgKiBBZGRzIHNjYWxlIGJ5IGdpdmVuIGFtb3VudCByZWxhdGl2ZSB0byBnaXZlbiBwb2ludCB0byB0aGUgbGlzdCBvZlxuICAgICAqIHRyYW5zZm9ybWF0aW9ucyBvZiB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gc3ggKG51bWJlcikgaG9yaXNvbnRhbCBzY2FsZSBhbW91bnRcbiAgICAgLSBzeSAobnVtYmVyKSB2ZXJ0aWNhbCBzY2FsZSBhbW91bnRcbiAgICAgLSBjeCAobnVtYmVyKSAjb3B0aW9uYWwgeCBjb29yZGluYXRlIG9mIHRoZSBjZW50cmUgb2Ygc2NhbGVcbiAgICAgLSBjeSAobnVtYmVyKSAjb3B0aW9uYWwgeSBjb29yZGluYXRlIG9mIHRoZSBjZW50cmUgb2Ygc2NhbGVcbiAgICAgKiBJZiBjeCAmIGN5IGFyZW7igJl0IHNwZWNpZmllZCBjZW50cmUgb2YgdGhlIHNoYXBlIGlzIHVzZWQgaW5zdGVhZC5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnNjYWxlID0gZnVuY3Rpb24gKHN4LCBzeSwgY3gsIGN5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHN4ID0gU3RyKHN4KS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICBpZiAoc3gubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgc3kgPSB0b0Zsb2F0KHN4WzFdKTtcbiAgICAgICAgICAgIGN4ID0gdG9GbG9hdChzeFsyXSk7XG4gICAgICAgICAgICBjeSA9IHRvRmxvYXQoc3hbM10pO1xuICAgICAgICB9XG4gICAgICAgIHN4ID0gdG9GbG9hdChzeFswXSk7XG4gICAgICAgIChzeSA9PSBudWxsKSAmJiAoc3kgPSBzeCk7XG4gICAgICAgIChjeSA9PSBudWxsKSAmJiAoY3ggPSBjeSk7XG4gICAgICAgIGlmIChjeCA9PSBudWxsIHx8IGN5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBiYm94ID0gdGhpcy5nZXRCQm94KDEpO1xuICAgICAgICB9XG4gICAgICAgIGN4ID0gY3ggPT0gbnVsbCA/IGJib3gueCArIGJib3gud2lkdGggLyAyIDogY3g7XG4gICAgICAgIGN5ID0gY3kgPT0gbnVsbCA/IGJib3gueSArIGJib3guaGVpZ2h0IC8gMiA6IGN5O1xuICAgICAgICB0aGlzLnRyYW5zZm9ybSh0aGlzLl8udHJhbnNmb3JtLmNvbmNhdChbW1wic1wiLCBzeCwgc3ksIGN4LCBjeV1dKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudHJhbnNsYXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZXByZWNhdGVkISBVc2UgQEVsZW1lbnQudHJhbnNmb3JtIGluc3RlYWQuXG4gICAgICogQWRkcyB0cmFuc2xhdGlvbiBieSBnaXZlbiBhbW91bnQgdG8gdGhlIGxpc3Qgb2YgdHJhbnNmb3JtYXRpb25zIG9mIHRoZSBlbGVtZW50LlxuICAgICA+IFBhcmFtZXRlcnNcbiAgICAgLSBkeCAobnVtYmVyKSBob3Jpc29udGFsIHNoaWZ0XG4gICAgIC0gZHkgKG51bWJlcikgdmVydGljYWwgc2hpZnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIChkeCwgZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZHggPSBTdHIoZHgpLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIGlmIChkeC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBkeSA9IHRvRmxvYXQoZHhbMV0pO1xuICAgICAgICB9XG4gICAgICAgIGR4ID0gdG9GbG9hdChkeFswXSkgfHwgMDtcbiAgICAgICAgZHkgPSArZHkgfHwgMDtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm0odGhpcy5fLnRyYW5zZm9ybS5jb25jYXQoW1tcInRcIiwgZHgsIGR5XV0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50cmFuc2Zvcm1cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgdHJhbnNmb3JtYXRpb24gdG8gdGhlIGVsZW1lbnQgd2hpY2ggaXMgc2VwYXJhdGUgdG8gb3RoZXIgYXR0cmlidXRlcyxcbiAgICAgKiBpLmUuIHRyYW5zbGF0aW9uIGRvZXNu4oCZdCBjaGFuZ2UgYHhgIG9yIGB5YCBvZiB0aGUgcmVjdGFuZ2UuIFRoZSBmb3JtYXRcbiAgICAgKiBvZiB0cmFuc2Zvcm1hdGlvbiBzdHJpbmcgaXMgc2ltaWxhciB0byB0aGUgcGF0aCBzdHJpbmcgc3ludGF4OlxuICAgICB8IFwidDEwMCwxMDByMzAsMTAwLDEwMHMyLDIsMTAwLDEwMHI0NXMxLjVcIlxuICAgICAqIEVhY2ggbGV0dGVyIGlzIGEgY29tbWFuZC4gVGhlcmUgYXJlIGZvdXIgY29tbWFuZHM6IGB0YCBpcyBmb3IgdHJhbnNsYXRlLCBgcmAgaXMgZm9yIHJvdGF0ZSwgYHNgIGlzIGZvclxuICAgICAqIHNjYWxlIGFuZCBgbWAgaXMgZm9yIG1hdHJpeC5cbiAgICAgKlxuICAgICAqIFRoZXJlIGFyZSBhbHNvIGFsdGVybmF0aXZlIOKAnGFic29sdXRl4oCdIHRyYW5zbGF0aW9uLCByb3RhdGlvbiBhbmQgc2NhbGU6IGBUYCwgYFJgIGFuZCBgU2AuIFRoZXkgd2lsbCBub3QgdGFrZSBwcmV2aW91cyB0cmFuc2Zvcm1hdGlvbiBpbnRvIGFjY291bnQuIEZvciBleGFtcGxlLCBgLi4uVDEwMCwwYCB3aWxsIGFsd2F5cyBtb3ZlIGVsZW1lbnQgMTAwIHB4IGhvcmlzb250YWxseSwgd2hpbGUgYC4uLnQxMDAsMGAgY291bGQgbW92ZSBpdCB2ZXJ0aWNhbGx5IGlmIHRoZXJlIGlzIGByOTBgIGJlZm9yZS4gSnVzdCBjb21wYXJlIHJlc3VsdHMgb2YgYHI5MHQxMDAsMGAgYW5kIGByOTBUMTAwLDBgLlxuICAgICAqXG4gICAgICogU28sIHRoZSBleGFtcGxlIGxpbmUgYWJvdmUgY291bGQgYmUgcmVhZCBsaWtlIOKAnHRyYW5zbGF0ZSBieSAxMDAsIDEwMDsgcm90YXRlIDMwwrAgYXJvdW5kIDEwMCwgMTAwOyBzY2FsZSB0d2ljZSBhcm91bmQgMTAwLCAxMDA7XG4gICAgICogcm90YXRlIDQ1wrAgYXJvdW5kIGNlbnRyZTsgc2NhbGUgMS41IHRpbWVzIHJlbGF0aXZlIHRvIGNlbnRyZeKAnS4gQXMgeW91IGNhbiBzZWUgcm90YXRlIGFuZCBzY2FsZSBjb21tYW5kcyBoYXZlIG9yaWdpblxuICAgICAqIGNvb3JkaW5hdGVzIGFzIG9wdGlvbmFsIHBhcmFtZXRlcnMsIHRoZSBkZWZhdWx0IGlzIHRoZSBjZW50cmUgcG9pbnQgb2YgdGhlIGVsZW1lbnQuXG4gICAgICogTWF0cml4IGFjY2VwdHMgc2l4IHBhcmFtZXRlcnMuXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgZWwgPSBwYXBlci5yZWN0KDEwLCAyMCwgMzAwLCAyMDApO1xuICAgICB8IC8vIHRyYW5zbGF0ZSAxMDAsIDEwMCwgcm90YXRlIDQ1wrAsIHRyYW5zbGF0ZSAtMTAwLCAwXG4gICAgIHwgZWwudHJhbnNmb3JtKFwidDEwMCwxMDByNDV0LTEwMCwwXCIpO1xuICAgICB8IC8vIGlmIHlvdSB3YW50IHlvdSBjYW4gYXBwZW5kIG9yIHByZXBlbmQgdHJhbnNmb3JtYXRpb25zXG4gICAgIHwgZWwudHJhbnNmb3JtKFwiLi4udDUwLDUwXCIpO1xuICAgICB8IGVsLnRyYW5zZm9ybShcInMyLi4uXCIpO1xuICAgICB8IC8vIG9yIGV2ZW4gd3JhcFxuICAgICB8IGVsLnRyYW5zZm9ybShcInQ1MCw1MC4uLnQtNTAtNTBcIik7XG4gICAgIHwgLy8gdG8gcmVzZXQgdHJhbnNmb3JtYXRpb24gY2FsbCBtZXRob2Qgd2l0aCBlbXB0eSBzdHJpbmdcbiAgICAgfCBlbC50cmFuc2Zvcm0oXCJcIik7XG4gICAgIHwgLy8gdG8gZ2V0IGN1cnJlbnQgdmFsdWUgY2FsbCBpdCB3aXRob3V0IHBhcmFtZXRlcnNcbiAgICAgfCBjb25zb2xlLmxvZyhlbC50cmFuc2Zvcm0oKSk7XG4gICAgID4gUGFyYW1ldGVyc1xuICAgICAtIHRzdHIgKHN0cmluZykgI29wdGlvbmFsIHRyYW5zZm9ybWF0aW9uIHN0cmluZ1xuICAgICAqIElmIHRzdHIgaXNu4oCZdCBzcGVjaWZpZWRcbiAgICAgPSAoc3RyaW5nKSBjdXJyZW50IHRyYW5zZm9ybWF0aW9uIHN0cmluZ1xuICAgICAqIGVsc2VcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uICh0c3RyKSB7XG4gICAgICAgIHZhciBfID0gdGhpcy5fO1xuICAgICAgICBpZiAodHN0ciA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gXy50cmFuc2Zvcm07XG4gICAgICAgIH1cbiAgICAgICAgUi5fZXh0cmFjdFRyYW5zZm9ybSh0aGlzLCB0c3RyKTtcblxuICAgICAgICB0aGlzLmNsaXAgJiYgJCh0aGlzLmNsaXAsIHt0cmFuc2Zvcm06IHRoaXMubWF0cml4LmludmVydCgpfSk7XG4gICAgICAgIHRoaXMucGF0dGVybiAmJiB1cGRhdGVQb3NpdGlvbih0aGlzKTtcbiAgICAgICAgdGhpcy5ub2RlICYmICQodGhpcy5ub2RlLCB7dHJhbnNmb3JtOiB0aGlzLm1hdHJpeH0pO1xuXG4gICAgICAgIGlmIChfLnN4ICE9IDEgfHwgXy5zeSAhPSAxKSB7XG4gICAgICAgICAgICB2YXIgc3cgPSB0aGlzLmF0dHJzW2hhc10oXCJzdHJva2Utd2lkdGhcIikgPyB0aGlzLmF0dHJzW1wic3Ryb2tlLXdpZHRoXCJdIDogMTtcbiAgICAgICAgICAgIHRoaXMuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc3d9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaGlkZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogTWFrZXMgZWxlbWVudCBpbnZpc2libGUuIFNlZSBARWxlbWVudC5zaG93LlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIXRoaXMucmVtb3ZlZCAmJiB0aGlzLnBhcGVyLnNhZmFyaSh0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zaG93XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBNYWtlcyBlbGVtZW50IHZpc2libGUuIFNlZSBARWxlbWVudC5oaWRlLlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIXRoaXMucmVtb3ZlZCAmJiB0aGlzLnBhcGVyLnNhZmFyaSh0aGlzLm5vZGUuc3R5bGUuZGlzcGxheSA9IFwiXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnJlbW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBlbGVtZW50IGZyb20gdGhlIHBhcGVyLlxuICAgIFxcKi9cbiAgICBlbHByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGUgPSBnZXRSZWFsTm9kZSh0aGlzLm5vZGUpO1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkIHx8ICFub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFwZXIgPSB0aGlzLnBhcGVyO1xuICAgICAgICBwYXBlci5fX3NldF9fICYmIHBhcGVyLl9fc2V0X18uZXhjbHVkZSh0aGlzKTtcbiAgICAgICAgZXZlLnVuYmluZChcInJhcGhhZWwuKi4qLlwiICsgdGhpcy5pZCk7XG4gICAgICAgIGlmICh0aGlzLmdyYWRpZW50KSB7XG4gICAgICAgICAgICBwYXBlci5kZWZzLnJlbW92ZUNoaWxkKHRoaXMuZ3JhZGllbnQpO1xuICAgICAgICB9XG4gICAgICAgIFIuX3RlYXIodGhpcywgcGFwZXIpO1xuXG4gICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcblxuICAgICAgICAvLyBSZW1vdmUgY3VzdG9tIGRhdGEgZm9yIGVsZW1lbnRcbiAgICAgICAgdGhpcy5yZW1vdmVEYXRhKCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW2ldID0gdHlwZW9mIHRoaXNbaV0gPT0gXCJmdW5jdGlvblwiID8gUi5fcmVtb3ZlZEZhY3RvcnkoaSkgOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlZCA9IHRydWU7XG4gICAgfTtcbiAgICBlbHByb3RvLl9nZXRCQm94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5ub2RlLnN0eWxlLmRpc3BsYXkgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICAgICAgdmFyIGhpZGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYW52YXNIaWRkZW4gPSBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRhaW5lclN0eWxlO1xuICAgICAgICBpZiAodGhpcy5wYXBlci5jYW52YXMucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgIGNvbnRhaW5lclN0eWxlID0gdGhpcy5wYXBlci5jYW52YXMucGFyZW50RWxlbWVudC5zdHlsZTtcbiAgICAgICAgfSAvL0lFMTArIGNhbid0IGZpbmQgcGFyZW50RWxlbWVudFxuICAgICAgICBlbHNlIGlmICh0aGlzLnBhcGVyLmNhbnZhcy5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgY29udGFpbmVyU3R5bGUgPSB0aGlzLnBhcGVyLmNhbnZhcy5wYXJlbnROb2RlLnN0eWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoY29udGFpbmVyU3R5bGUgJiYgY29udGFpbmVyU3R5bGUuZGlzcGxheSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgIGNhbnZhc0hpZGRlbiA9IHRydWU7XG4gICAgICAgICAgY29udGFpbmVyU3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJib3ggPSB7fTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJib3ggPSB0aGlzLm5vZGUuZ2V0QkJveCgpO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIC8vIEZpcmVmb3ggMy4wLngsIDI1LjAuMSAocHJvYmFibHkgbW9yZSB2ZXJzaW9ucyBhZmZlY3RlZCkgcGxheSBiYWRseSBoZXJlIC0gcG9zc2libGUgZml4XG4gICAgICAgICAgICBiYm94ID0ge1xuICAgICAgICAgICAgICAgIHg6IHRoaXMubm9kZS5jbGllbnRMZWZ0LFxuICAgICAgICAgICAgICAgIHk6IHRoaXMubm9kZS5jbGllbnRUb3AsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMubm9kZS5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMubm9kZS5jbGllbnRIZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGJib3ggPSBiYm94IHx8IHt9O1xuICAgICAgICAgICAgaWYoY2FudmFzSGlkZGVuKXtcbiAgICAgICAgICAgICAgY29udGFpbmVyU3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGhpZGUgJiYgdGhpcy5oaWRlKCk7XG4gICAgICAgIHJldHVybiBiYm94O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYXR0clxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2V0cyB0aGUgYXR0cmlidXRlcyBvZiB0aGUgZWxlbWVudC5cbiAgICAgPiBQYXJhbWV0ZXJzXG4gICAgIC0gYXR0ck5hbWUgKHN0cmluZykgYXR0cmlidXRl4oCZcyBuYW1lXG4gICAgIC0gdmFsdWUgKHN0cmluZykgdmFsdWVcbiAgICAgKiBvclxuICAgICAtIHBhcmFtcyAob2JqZWN0KSBvYmplY3Qgb2YgbmFtZS92YWx1ZSBwYWlyc1xuICAgICAqIG9yXG4gICAgIC0gYXR0ck5hbWUgKHN0cmluZykgYXR0cmlidXRl4oCZcyBuYW1lXG4gICAgICogb3JcbiAgICAgLSBhdHRyTmFtZXMgKGFycmF5KSBpbiB0aGlzIGNhc2UgbWV0aG9kIHJldHVybnMgYXJyYXkgb2YgY3VycmVudCB2YWx1ZXMgZm9yIGdpdmVuIGF0dHJpYnV0ZSBuYW1lc1xuICAgICA9IChvYmplY3QpIEBFbGVtZW50IGlmIGF0dHJzTmFtZSAmIHZhbHVlIG9yIHBhcmFtcyBhcmUgcGFzc2VkIGluLlxuICAgICA9ICguLi4pIHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGUgaWYgb25seSBhdHRyc05hbWUgaXMgcGFzc2VkIGluLlxuICAgICA9IChhcnJheSkgYXJyYXkgb2YgdmFsdWVzIG9mIHRoZSBhdHRyaWJ1dGUgaWYgYXR0cnNOYW1lcyBpcyBwYXNzZWQgaW4uXG4gICAgID0gKG9iamVjdCkgb2JqZWN0IG9mIGF0dHJpYnV0ZXMgaWYgbm90aGluZyBpcyBwYXNzZWQgaW4uXG4gICAgID4gUG9zc2libGUgcGFyYW1ldGVyc1xuICAgICAjIDxwPlBsZWFzZSByZWZlciB0byB0aGUgPGEgaHJlZj1cImh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9cIiB0aXRsZT1cIlRoZSBXM0MgUmVjb21tZW5kYXRpb24gZm9yIHRoZSBTVkcgbGFuZ3VhZ2UgZGVzY3JpYmVzIHRoZXNlIHByb3BlcnRpZXMgaW4gZGV0YWlsLlwiPlNWRyBzcGVjaWZpY2F0aW9uPC9hPiBmb3IgYW4gZXhwbGFuYXRpb24gb2YgdGhlc2UgcGFyYW1ldGVycy48L3A+XG4gICAgIG8gYXJyb3ctZW5kIChzdHJpbmcpIGFycm93aGVhZCBvbiB0aGUgZW5kIG9mIHRoZSBwYXRoLiBUaGUgZm9ybWF0IGZvciBzdHJpbmcgaXMgYDx0eXBlPlstPHdpZHRoPlstPGxlbmd0aD5dXWAuIFBvc3NpYmxlIHR5cGVzOiBgY2xhc3NpY2AsIGBibG9ja2AsIGBvcGVuYCwgYG92YWxgLCBgZGlhbW9uZGAsIGBub25lYCwgd2lkdGg6IGB3aWRlYCwgYG5hcnJvd2AsIGBtZWRpdW1gLCBsZW5ndGg6IGBsb25nYCwgYHNob3J0YCwgYG1pZGl1bWAuXG4gICAgIG8gY2xpcC1yZWN0IChzdHJpbmcpIGNvbW1hIG9yIHNwYWNlIHNlcGFyYXRlZCB2YWx1ZXM6IHgsIHksIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgbyBjdXJzb3IgKHN0cmluZykgQ1NTIHR5cGUgb2YgdGhlIGN1cnNvclxuICAgICBvIGN4IChudW1iZXIpIHRoZSB4LWF4aXMgY29vcmRpbmF0ZSBvZiB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUsIG9yIGVsbGlwc2VcbiAgICAgbyBjeSAobnVtYmVyKSB0aGUgeS1heGlzIGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlLCBvciBlbGxpcHNlXG4gICAgIG8gZmlsbCAoc3RyaW5nKSBjb2xvdXIsIGdyYWRpZW50IG9yIGltYWdlXG4gICAgIG8gZmlsbC1vcGFjaXR5IChudW1iZXIpXG4gICAgIG8gZm9udCAoc3RyaW5nKVxuICAgICBvIGZvbnQtZmFtaWx5IChzdHJpbmcpXG4gICAgIG8gZm9udC1zaXplIChudW1iZXIpIGZvbnQgc2l6ZSBpbiBwaXhlbHNcbiAgICAgbyBmb250LXdlaWdodCAoc3RyaW5nKVxuICAgICBvIGhlaWdodCAobnVtYmVyKVxuICAgICBvIGhyZWYgKHN0cmluZykgVVJMLCBpZiBzcGVjaWZpZWQgZWxlbWVudCBiZWhhdmVzIGFzIGh5cGVybGlua1xuICAgICBvIG9wYWNpdHkgKG51bWJlcilcbiAgICAgbyBwYXRoIChzdHJpbmcpIFNWRyBwYXRoIHN0cmluZyBmb3JtYXRcbiAgICAgbyByIChudW1iZXIpIHJhZGl1cyBvZiB0aGUgY2lyY2xlLCBlbGxpcHNlIG9yIHJvdW5kZWQgY29ybmVyIG9uIHRoZSByZWN0XG4gICAgIG8gcnggKG51bWJlcikgaG9yaXNvbnRhbCByYWRpdXMgb2YgdGhlIGVsbGlwc2VcbiAgICAgbyByeSAobnVtYmVyKSB2ZXJ0aWNhbCByYWRpdXMgb2YgdGhlIGVsbGlwc2VcbiAgICAgbyBzcmMgKHN0cmluZykgaW1hZ2UgVVJMLCBvbmx5IHdvcmtzIGZvciBARWxlbWVudC5pbWFnZSBlbGVtZW50XG4gICAgIG8gc3Ryb2tlIChzdHJpbmcpIHN0cm9rZSBjb2xvdXJcbiAgICAgbyBzdHJva2UtZGFzaGFycmF5IChzdHJpbmcpIFvigJzigJ0sIOKAnGAtYOKAnSwg4oCcYC5g4oCdLCDigJxgLS5g4oCdLCDigJxgLS4uYOKAnSwg4oCcYC4gYOKAnSwg4oCcYC0gYOKAnSwg4oCcYC0tYOKAnSwg4oCcYC0gLmDigJ0sIOKAnGAtLS5g4oCdLCDigJxgLS0uLmDigJ1dXG4gICAgIG8gc3Ryb2tlLWxpbmVjYXAgKHN0cmluZykgW+KAnGBidXR0YOKAnSwg4oCcYHNxdWFyZWDigJ0sIOKAnGByb3VuZGDigJ1dXG4gICAgIG8gc3Ryb2tlLWxpbmVqb2luIChzdHJpbmcpIFvigJxgYmV2ZWxg4oCdLCDigJxgcm91bmRg4oCdLCDigJxgbWl0ZXJg4oCdXVxuICAgICBvIHN0cm9rZS1taXRlcmxpbWl0IChudW1iZXIpXG4gICAgIG8gc3Ryb2tlLW9wYWNpdHkgKG51bWJlcilcbiAgICAgbyBzdHJva2Utd2lkdGggKG51bWJlcikgc3Ryb2tlIHdpZHRoIGluIHBpeGVscywgZGVmYXVsdCBpcyAnMSdcbiAgICAgbyB0YXJnZXQgKHN0cmluZykgdXNlZCB3aXRoIGhyZWZcbiAgICAgbyB0ZXh0IChzdHJpbmcpIGNvbnRlbnRzIG9mIHRoZSB0ZXh0IGVsZW1lbnQuIFVzZSBgXFxuYCBmb3IgbXVsdGlsaW5lIHRleHRcbiAgICAgbyB0ZXh0LWFuY2hvciAoc3RyaW5nKSBb4oCcYHN0YXJ0YOKAnSwg4oCcYG1pZGRsZWDigJ0sIOKAnGBlbmRg4oCdXSwgZGVmYXVsdCBpcyDigJxgbWlkZGxlYOKAnVxuICAgICBvIHRpdGxlIChzdHJpbmcpIHdpbGwgY3JlYXRlIHRvb2x0aXAgd2l0aCBhIGdpdmVuIHRleHRcbiAgICAgbyB0cmFuc2Zvcm0gKHN0cmluZykgc2VlIEBFbGVtZW50LnRyYW5zZm9ybVxuICAgICBvIHdpZHRoIChudW1iZXIpXG4gICAgIG8geCAobnVtYmVyKVxuICAgICBvIHkgKG51bWJlcilcbiAgICAgPiBHcmFkaWVudHNcbiAgICAgKiBMaW5lYXIgZ3JhZGllbnQgZm9ybWF0OiDigJxg4oC5YW5nbGXigLot4oC5Y29sb3Vy4oC6Wy3igLljb2xvdXLigLpbOuKAuW9mZnNldOKAul1dKi3igLljb2xvdXLigLpg4oCdLCBleGFtcGxlOiDigJxgOTAtI2ZmZi0jMDAwYOKAnSDigJMgOTDCsFxuICAgICAqIGdyYWRpZW50IGZyb20gd2hpdGUgdG8gYmxhY2sgb3Ig4oCcYDAtI2ZmZi0jZjAwOjIwLSMwMDBg4oCdIOKAkyAwwrAgZ3JhZGllbnQgZnJvbSB3aGl0ZSB2aWEgcmVkIChhdCAyMCUpIHRvIGJsYWNrLlxuICAgICAqXG4gICAgICogcmFkaWFsIGdyYWRpZW50OiDigJxgclso4oC5ZnjigLosIOKAuWZ54oC6KV3igLljb2xvdXLigLpbLeKAuWNvbG91cuKAuls64oC5b2Zmc2V04oC6XV0qLeKAuWNvbG91cuKAumDigJ0sIGV4YW1wbGU6IOKAnGByI2ZmZi0jMDAwYOKAnSDigJNcbiAgICAgKiBncmFkaWVudCBmcm9tIHdoaXRlIHRvIGJsYWNrIG9yIOKAnGByKDAuMjUsIDAuNzUpI2ZmZi0jMDAwYOKAnSDigJMgZ3JhZGllbnQgZnJvbSB3aGl0ZSB0byBibGFjayB3aXRoIGZvY3VzIHBvaW50XG4gICAgICogYXQgMC4yNSwgMC43NS4gRm9jdXMgcG9pbnQgY29vcmRpbmF0ZXMgYXJlIGluIDAuLjEgcmFuZ2UuIFJhZGlhbCBncmFkaWVudHMgY2FuIG9ubHkgYmUgYXBwbGllZCB0byBjaXJjbGVzIGFuZCBlbGxpcHNlcy5cbiAgICAgPiBQYXRoIFN0cmluZ1xuICAgICAjIDxwPlBsZWFzZSByZWZlciB0byA8YSBocmVmPVwiaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL3BhdGhzLmh0bWwjUGF0aERhdGFcIiB0aXRsZT1cIkRldGFpbHMgb2YgYSBwYXRo4oCZcyBkYXRhIGF0dHJpYnV0ZeKAmXMgZm9ybWF0IGFyZSBkZXNjcmliZWQgaW4gdGhlIFNWRyBzcGVjaWZpY2F0aW9uLlwiPlNWRyBkb2N1bWVudGF0aW9uIHJlZ2FyZGluZyBwYXRoIHN0cmluZzwvYT4uIFJhcGhhw6tsIGZ1bGx5IHN1cHBvcnRzIGl0LjwvcD5cbiAgICAgPiBDb2xvdXIgUGFyc2luZ1xuICAgICAjIDx1bD5cbiAgICAgIyAgICAgPGxpPkNvbG91ciBuYW1lICjigJw8Y29kZT5yZWQ8L2NvZGU+4oCdLCDigJw8Y29kZT5ncmVlbjwvY29kZT7igJ0sIOKAnDxjb2RlPmNvcm5mbG93ZXJibHVlPC9jb2RlPuKAnSwgZXRjKTwvbGk+XG4gICAgICMgICAgIDxsaT4j4oCi4oCi4oCiIOKAlCBzaG9ydGVuZWQgSFRNTCBjb2xvdXI6ICjigJw8Y29kZT4jMDAwPC9jb2RlPuKAnSwg4oCcPGNvZGU+I2ZjMDwvY29kZT7igJ0sIGV0Yyk8L2xpPlxuICAgICAjICAgICA8bGk+I+KAouKAouKAouKAouKAouKAoiDigJQgZnVsbCBsZW5ndGggSFRNTCBjb2xvdXI6ICjigJw8Y29kZT4jMDAwMDAwPC9jb2RlPuKAnSwg4oCcPGNvZGU+I2JkMjMwMDwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPnJnYijigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgcmVkLCBncmVlbiBhbmQgYmx1ZSBjaGFubmVsc+KAmSB2YWx1ZXM6ICjigJw8Y29kZT5yZ2IoMjAwLCZuYnNwOzEwMCwmbmJzcDswKTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPnJnYijigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU6ICjigJw8Y29kZT5yZ2IoMTAwJSwmbmJzcDsxNzUlLCZuYnNwOzAlKTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPnJnYmEo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgcmVkLCBncmVlbiBhbmQgYmx1ZSBjaGFubmVsc+KAmSB2YWx1ZXM6ICjigJw8Y29kZT5yZ2JhKDIwMCwmbmJzcDsxMDAsJm5ic3A7MCwgLjUpPC9jb2RlPuKAnSk8L2xpPlxuICAgICAjICAgICA8bGk+cmdiYSjigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU6ICjigJw8Y29kZT5yZ2JhKDEwMCUsJm5ic3A7MTc1JSwmbmJzcDswJSwgNTAlKTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPmhzYijigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgaHVlLCBzYXR1cmF0aW9uIGFuZCBicmlnaHRuZXNzIHZhbHVlczogKOKAnDxjb2RlPmhzYigwLjUsJm5ic3A7MC4yNSwmbmJzcDsxKTwvY29kZT7igJ0pPC9saT5cbiAgICAgIyAgICAgPGxpPmhzYijigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU8L2xpPlxuICAgICAjICAgICA8bGk+aHNiYSjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgd2l0aCBvcGFjaXR5PC9saT5cbiAgICAgIyAgICAgPGxpPmhzbCjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgYWxtb3N0IHRoZSBzYW1lIGFzIGhzYiwgc2VlIDxhIGhyZWY9XCJodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hTTF9hbmRfSFNWXCIgdGl0bGU9XCJIU0wgYW5kIEhTViAtIFdpa2lwZWRpYSwgdGhlIGZyZWUgZW5jeWNsb3BlZGlhXCI+V2lraXBlZGlhIHBhZ2U8L2E+PC9saT5cbiAgICAgIyAgICAgPGxpPmhzbCjigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU8L2xpPlxuICAgICAjICAgICA8bGk+aHNsYSjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgd2l0aCBvcGFjaXR5PC9saT5cbiAgICAgIyAgICAgPGxpPk9wdGlvbmFsbHkgZm9yIGhzYiBhbmQgaHNsIHlvdSBjb3VsZCBzcGVjaWZ5IGh1ZSBhcyBhIGRlZ3JlZTog4oCcPGNvZGU+aHNsKDI0MGRlZywmbmJzcDsxLCZuYnNwOy41KTwvY29kZT7igJ0gb3IsIGlmIHlvdSB3YW50IHRvIGdvIGZhbmN5LCDigJw8Y29kZT5oc2woMjQwwrAsJm5ic3A7MSwmbmJzcDsuNSk8L2NvZGU+4oCdPC9saT5cbiAgICAgIyA8L3VsPlxuICAgIFxcKi9cbiAgICBlbHByb3RvLmF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgYSBpbiB0aGlzLmF0dHJzKSBpZiAodGhpcy5hdHRyc1toYXNdKGEpKSB7XG4gICAgICAgICAgICAgICAgcmVzW2FdID0gdGhpcy5hdHRyc1thXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5ncmFkaWVudCAmJiByZXMuZmlsbCA9PSBcIm5vbmVcIiAmJiAocmVzLmZpbGwgPSByZXMuZ3JhZGllbnQpICYmIGRlbGV0ZSByZXMuZ3JhZGllbnQ7XG4gICAgICAgICAgICByZXMudHJhbnNmb3JtID0gdGhpcy5fLnRyYW5zZm9ybTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgUi5pcyhuYW1lLCBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT0gXCJmaWxsXCIgJiYgdGhpcy5hdHRycy5maWxsID09IFwibm9uZVwiICYmIHRoaXMuYXR0cnMuZ3JhZGllbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hdHRycy5ncmFkaWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lID09IFwidHJhbnNmb3JtXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fLnRyYW5zZm9ybTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgICAgICBvdXQgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gdGhpcy5hdHRycykge1xuICAgICAgICAgICAgICAgICAgICBvdXRbbmFtZV0gPSB0aGlzLmF0dHJzW25hbWVdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoUi5pcyh0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbbmFtZV0sIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0W25hbWVdID0gdGhpcy5wYXBlci5jdXN0b21BdHRyaWJ1dGVzW25hbWVdLmRlZjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXRbbmFtZV0gPSBSLl9hdmFpbGFibGVBdHRyc1tuYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaWkgLSAxID8gb3V0IDogb3V0W25hbWVzWzBdXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCAmJiBSLmlzKG5hbWUsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIG91dCA9IHt9O1xuICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBvdXRbbmFtZVtpXV0gPSB0aGlzLmF0dHIobmFtZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge307XG4gICAgICAgICAgICBwYXJhbXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lICE9IG51bGwgJiYgUi5pcyhuYW1lLCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgcGFyYW1zID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICBldmUoXCJyYXBoYWVsLmF0dHIuXCIgKyBrZXkgKyBcIi5cIiArIHRoaXMuaWQsIHRoaXMsIHBhcmFtc1trZXldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGtleSBpbiB0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXMpIGlmICh0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbaGFzXShrZXkpICYmIHBhcmFtc1toYXNdKGtleSkgJiYgUi5pcyh0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNba2V5XSwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgdmFyIHBhciA9IHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1trZXldLmFwcGx5KHRoaXMsIFtdLmNvbmNhdChwYXJhbXNba2V5XSkpO1xuICAgICAgICAgICAgdGhpcy5hdHRyc1trZXldID0gcGFyYW1zW2tleV07XG4gICAgICAgICAgICBmb3IgKHZhciBzdWJrZXkgaW4gcGFyKSBpZiAocGFyW2hhc10oc3Via2V5KSkge1xuICAgICAgICAgICAgICAgIHBhcmFtc1tzdWJrZXldID0gcGFyW3N1YmtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2V0RmlsbEFuZFN0cm9rZSh0aGlzLCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvRnJvbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE1vdmVzIHRoZSBlbGVtZW50IHNvIGl0IGlzIHRoZSBjbG9zZXN0IHRvIHRoZSB2aWV3ZXLigJlzIGV5ZXMsIG9uIHRvcCBvZiBvdGhlciBlbGVtZW50cy5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnRvRnJvbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlID0gZ2V0UmVhbE5vZGUodGhpcy5ub2RlKTtcbiAgICAgICAgbm9kZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICB2YXIgc3ZnID0gdGhpcy5wYXBlcjtcbiAgICAgICAgc3ZnLnRvcCAhPSB0aGlzICYmIFIuX3RvZnJvbnQodGhpcywgc3ZnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b0JhY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE1vdmVzIHRoZSBlbGVtZW50IHNvIGl0IGlzIHRoZSBmdXJ0aGVzdCBmcm9tIHRoZSB2aWV3ZXLigJlzIGV5ZXMsIGJlaGluZCBvdGhlciBlbGVtZW50cy5cbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnRvQmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vZGUgPSBnZXRSZWFsTm9kZSh0aGlzLm5vZGUpO1xuICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50Tm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgUi5fdG9iYWNrKHRoaXMsIHRoaXMucGFwZXIpO1xuICAgICAgICB2YXIgc3ZnID0gdGhpcy5wYXBlcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5pbnNlcnRBZnRlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSW5zZXJ0cyBjdXJyZW50IG9iamVjdCBhZnRlciB0aGUgZ2l2ZW4gb25lLlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaW5zZXJ0QWZ0ZXIgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkIHx8ICFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBub2RlID0gZ2V0UmVhbE5vZGUodGhpcy5ub2RlKTtcbiAgICAgICAgdmFyIGFmdGVyTm9kZSA9IGdldFJlYWxOb2RlKGVsZW1lbnQubm9kZSB8fCBlbGVtZW50W2VsZW1lbnQubGVuZ3RoIC0gMV0ubm9kZSk7XG4gICAgICAgIGlmIChhZnRlck5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGFmdGVyTm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShub2RlLCBhZnRlck5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWZ0ZXJOb2RlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgUi5faW5zZXJ0YWZ0ZXIodGhpcywgZWxlbWVudCwgdGhpcy5wYXBlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaW5zZXJ0QmVmb3JlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJbnNlcnRzIGN1cnJlbnQgb2JqZWN0IGJlZm9yZSB0aGUgZ2l2ZW4gb25lLlxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaW5zZXJ0QmVmb3JlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCB8fCAhZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbm9kZSA9IGdldFJlYWxOb2RlKHRoaXMubm9kZSk7XG4gICAgICAgIHZhciBiZWZvcmVOb2RlID0gZ2V0UmVhbE5vZGUoZWxlbWVudC5ub2RlIHx8IGVsZW1lbnRbMF0ubm9kZSk7XG4gICAgICAgIGJlZm9yZU5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgICAgIFIuX2luc2VydGJlZm9yZSh0aGlzLCBlbGVtZW50LCB0aGlzLnBhcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLmJsdXIgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICAgICAgICAvLyBFeHBlcmltZW50YWwuIE5vIFNhZmFyaSBzdXBwb3J0LiBVc2UgaXQgb24geW91ciBvd24gcmlzay5cbiAgICAgICAgdmFyIHQgPSB0aGlzO1xuICAgICAgICBpZiAoK3NpemUgIT09IDApIHtcbiAgICAgICAgICAgIHZhciBmbHRyID0gJChcImZpbHRlclwiKSxcbiAgICAgICAgICAgICAgICBibHVyID0gJChcImZlR2F1c3NpYW5CbHVyXCIpO1xuICAgICAgICAgICAgdC5hdHRycy5ibHVyID0gc2l6ZTtcbiAgICAgICAgICAgIGZsdHIuaWQgPSBSLmNyZWF0ZVVVSUQoKTtcbiAgICAgICAgICAgICQoYmx1ciwge3N0ZERldmlhdGlvbjogK3NpemUgfHwgMS41fSk7XG4gICAgICAgICAgICBmbHRyLmFwcGVuZENoaWxkKGJsdXIpO1xuICAgICAgICAgICAgdC5wYXBlci5kZWZzLmFwcGVuZENoaWxkKGZsdHIpO1xuICAgICAgICAgICAgdC5fYmx1ciA9IGZsdHI7XG4gICAgICAgICAgICAkKHQubm9kZSwge2ZpbHRlcjogXCJ1cmwoI1wiICsgZmx0ci5pZCArIFwiKVwifSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodC5fYmx1cikge1xuICAgICAgICAgICAgICAgIHQuX2JsdXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0Ll9ibHVyKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdC5fYmx1cjtcbiAgICAgICAgICAgICAgICBkZWxldGUgdC5hdHRycy5ibHVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdC5ub2RlLnJlbW92ZUF0dHJpYnV0ZShcImZpbHRlclwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5jaXJjbGUgPSBmdW5jdGlvbiAoc3ZnLCB4LCB5LCByKSB7XG4gICAgICAgIHZhciBlbCA9ICQoXCJjaXJjbGVcIik7XG4gICAgICAgIHN2Zy5jYW52YXMgJiYgc3ZnLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciByZXMgPSBuZXcgRWxlbWVudChlbCwgc3ZnKTtcbiAgICAgICAgcmVzLmF0dHJzID0ge2N4OiB4LCBjeTogeSwgcjogciwgZmlsbDogXCJub25lXCIsIHN0cm9rZTogXCIjMDAwXCJ9O1xuICAgICAgICByZXMudHlwZSA9IFwiY2lyY2xlXCI7XG4gICAgICAgICQoZWwsIHJlcy5hdHRycyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUucmVjdCA9IGZ1bmN0aW9uIChzdmcsIHgsIHksIHcsIGgsIHIpIHtcbiAgICAgICAgdmFyIGVsID0gJChcInJlY3RcIik7XG4gICAgICAgIHN2Zy5jYW52YXMgJiYgc3ZnLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciByZXMgPSBuZXcgRWxlbWVudChlbCwgc3ZnKTtcbiAgICAgICAgcmVzLmF0dHJzID0ge3g6IHgsIHk6IHksIHdpZHRoOiB3LCBoZWlnaHQ6IGgsIHJ4OiByIHx8IDAsIHJ5OiByIHx8IDAsIGZpbGw6IFwibm9uZVwiLCBzdHJva2U6IFwiIzAwMFwifTtcbiAgICAgICAgcmVzLnR5cGUgPSBcInJlY3RcIjtcbiAgICAgICAgJChlbCwgcmVzLmF0dHJzKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5lbGxpcHNlID0gZnVuY3Rpb24gKHN2ZywgeCwgeSwgcngsIHJ5KSB7XG4gICAgICAgIHZhciBlbCA9ICQoXCJlbGxpcHNlXCIpO1xuICAgICAgICBzdmcuY2FudmFzICYmIHN2Zy5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgcmVzID0gbmV3IEVsZW1lbnQoZWwsIHN2Zyk7XG4gICAgICAgIHJlcy5hdHRycyA9IHtjeDogeCwgY3k6IHksIHJ4OiByeCwgcnk6IHJ5LCBmaWxsOiBcIm5vbmVcIiwgc3Ryb2tlOiBcIiMwMDBcIn07XG4gICAgICAgIHJlcy50eXBlID0gXCJlbGxpcHNlXCI7XG4gICAgICAgICQoZWwsIHJlcy5hdHRycyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuaW1hZ2UgPSBmdW5jdGlvbiAoc3ZnLCBzcmMsIHgsIHksIHcsIGgpIHtcbiAgICAgICAgdmFyIGVsID0gJChcImltYWdlXCIpO1xuICAgICAgICAkKGVsLCB7eDogeCwgeTogeSwgd2lkdGg6IHcsIGhlaWdodDogaCwgcHJlc2VydmVBc3BlY3RSYXRpbzogXCJub25lXCJ9KTtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMoeGxpbmssIFwiaHJlZlwiLCBzcmMpO1xuICAgICAgICBzdmcuY2FudmFzICYmIHN2Zy5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgcmVzID0gbmV3IEVsZW1lbnQoZWwsIHN2Zyk7XG4gICAgICAgIHJlcy5hdHRycyA9IHt4OiB4LCB5OiB5LCB3aWR0aDogdywgaGVpZ2h0OiBoLCBzcmM6IHNyY307XG4gICAgICAgIHJlcy50eXBlID0gXCJpbWFnZVwiO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnRleHQgPSBmdW5jdGlvbiAoc3ZnLCB4LCB5LCB0ZXh0KSB7XG4gICAgICAgIHZhciBlbCA9ICQoXCJ0ZXh0XCIpO1xuICAgICAgICBzdmcuY2FudmFzICYmIHN2Zy5jYW52YXMuYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICB2YXIgcmVzID0gbmV3IEVsZW1lbnQoZWwsIHN2Zyk7XG4gICAgICAgIHJlcy5hdHRycyA9IHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgXCJ0ZXh0LWFuY2hvclwiOiBcIm1pZGRsZVwiLFxuICAgICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogUi5fYXZhaWxhYmxlQXR0cnNbXCJmb250LWZhbWlseVwiXSxcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFIuX2F2YWlsYWJsZUF0dHJzW1wiZm9udC1zaXplXCJdLFxuICAgICAgICAgICAgc3Ryb2tlOiBcIm5vbmVcIixcbiAgICAgICAgICAgIGZpbGw6IFwiIzAwMFwiXG4gICAgICAgIH07XG4gICAgICAgIHJlcy50eXBlID0gXCJ0ZXh0XCI7XG4gICAgICAgIHNldEZpbGxBbmRTdHJva2UocmVzLCByZXMuYXR0cnMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnNldFNpemUgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGggfHwgdGhpcy53aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgfHwgdGhpcy5oZWlnaHQ7XG4gICAgICAgIHRoaXMuY2FudmFzLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIHRoaXMud2lkdGgpO1xuICAgICAgICB0aGlzLmNhbnZhcy5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgdGhpcy5oZWlnaHQpO1xuICAgICAgICBpZiAodGhpcy5fdmlld0JveCkge1xuICAgICAgICAgICAgdGhpcy5zZXRWaWV3Qm94LmFwcGx5KHRoaXMsIHRoaXMuX3ZpZXdCb3gpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbiA9IFIuX2dldENvbnRhaW5lci5hcHBseSgwLCBhcmd1bWVudHMpLFxuICAgICAgICAgICAgY29udGFpbmVyID0gY29uICYmIGNvbi5jb250YWluZXIsXG4gICAgICAgICAgICB4ID0gY29uLngsXG4gICAgICAgICAgICB5ID0gY29uLnksXG4gICAgICAgICAgICB3aWR0aCA9IGNvbi53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IGNvbi5oZWlnaHQ7XG4gICAgICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTVkcgY29udGFpbmVyIG5vdCBmb3VuZC5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNudnMgPSAkKFwic3ZnXCIpLFxuICAgICAgICAgICAgY3NzID0gXCJvdmVyZmxvdzpoaWRkZW47XCIsXG4gICAgICAgICAgICBpc0Zsb2F0aW5nO1xuICAgICAgICB4ID0geCB8fCAwO1xuICAgICAgICB5ID0geSB8fCAwO1xuICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDUxMjtcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IDM0MjtcbiAgICAgICAgJChjbnZzLCB7XG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHZlcnNpb246IDEuMSxcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIHhtbG5zOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXG4gICAgICAgICAgICBcInhtbG5zOnhsaW5rXCI6IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY29udGFpbmVyID09IDEpIHtcbiAgICAgICAgICAgIGNudnMuc3R5bGUuY3NzVGV4dCA9IGNzcyArIFwicG9zaXRpb246YWJzb2x1dGU7bGVmdDpcIiArIHggKyBcInB4O3RvcDpcIiArIHkgKyBcInB4XCI7XG4gICAgICAgICAgICBSLl9nLmRvYy5ib2R5LmFwcGVuZENoaWxkKGNudnMpO1xuICAgICAgICAgICAgaXNGbG9hdGluZyA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbnZzLnN0eWxlLmNzc1RleHQgPSBjc3MgKyBcInBvc2l0aW9uOnJlbGF0aXZlXCI7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGNudnMsIGNvbnRhaW5lci5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNudnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnRhaW5lciA9IG5ldyBSLl9QYXBlcjtcbiAgICAgICAgY29udGFpbmVyLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNvbnRhaW5lci5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNvbnRhaW5lci5jYW52YXMgPSBjbnZzO1xuICAgICAgICBjb250YWluZXIuY2xlYXIoKTtcbiAgICAgICAgY29udGFpbmVyLl9sZWZ0ID0gY29udGFpbmVyLl90b3AgPSAwO1xuICAgICAgICBpc0Zsb2F0aW5nICYmIChjb250YWluZXIucmVuZGVyZml4ID0gZnVuY3Rpb24gKCkge30pO1xuICAgICAgICBjb250YWluZXIucmVuZGVyZml4KCk7XG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuc2V0Vmlld0JveCA9IGZ1bmN0aW9uICh4LCB5LCB3LCBoLCBmaXQpIHtcbiAgICAgICAgZXZlKFwicmFwaGFlbC5zZXRWaWV3Qm94XCIsIHRoaXMsIHRoaXMuX3ZpZXdCb3gsIFt4LCB5LCB3LCBoLCBmaXRdKTtcbiAgICAgICAgdmFyIHBhcGVyU2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpLFxuICAgICAgICAgICAgc2l6ZSA9IG1tYXgodyAvIHBhcGVyU2l6ZS53aWR0aCwgaCAvIHBhcGVyU2l6ZS5oZWlnaHQpLFxuICAgICAgICAgICAgdG9wID0gdGhpcy50b3AsXG4gICAgICAgICAgICBhc3BlY3RSYXRpbyA9IGZpdCA/IFwieE1pZFlNaWQgbWVldFwiIDogXCJ4TWluWU1pblwiLFxuICAgICAgICAgICAgdmIsXG4gICAgICAgICAgICBzdztcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3ZiU2l6ZSkge1xuICAgICAgICAgICAgICAgIHNpemUgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3ZiU2l6ZTtcbiAgICAgICAgICAgIHZiID0gXCIwIDAgXCIgKyB0aGlzLndpZHRoICsgUyArIHRoaXMuaGVpZ2h0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fdmJTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIHZiID0geCArIFMgKyB5ICsgUyArIHcgKyBTICsgaDtcbiAgICAgICAgfVxuICAgICAgICAkKHRoaXMuY2FudmFzLCB7XG4gICAgICAgICAgICB2aWV3Qm94OiB2YixcbiAgICAgICAgICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGFzcGVjdFJhdGlvXG4gICAgICAgIH0pO1xuICAgICAgICB3aGlsZSAoc2l6ZSAmJiB0b3ApIHtcbiAgICAgICAgICAgIHN3ID0gXCJzdHJva2Utd2lkdGhcIiBpbiB0b3AuYXR0cnMgPyB0b3AuYXR0cnNbXCJzdHJva2Utd2lkdGhcIl0gOiAxO1xuICAgICAgICAgICAgdG9wLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IHN3fSk7XG4gICAgICAgICAgICB0b3AuXy5kaXJ0eSA9IDE7XG4gICAgICAgICAgICB0b3AuXy5kaXJ0eVQgPSAxO1xuICAgICAgICAgICAgdG9wID0gdG9wLnByZXY7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdmlld0JveCA9IFt4LCB5LCB3LCBoLCAhIWZpdF07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnJlbmRlcmZpeFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRml4ZXMgdGhlIGlzc3VlIG9mIEZpcmVmb3ggYW5kIElFOSByZWdhcmRpbmcgc3VicGl4ZWwgcmVuZGVyaW5nLiBJZiBwYXBlciBpcyBkZXBlbmRhbnRcbiAgICAgKiBvbiBvdGhlciBlbGVtZW50cyBhZnRlciByZWZsb3cgaXQgY291bGQgc2hpZnQgaGFsZiBwaXhlbCB3aGljaCBjYXVzZSBmb3IgbGluZXMgdG8gbG9zdCB0aGVpciBjcmlzcG5lc3MuXG4gICAgICogVGhpcyBtZXRob2QgZml4ZXMgdGhlIGlzc3VlLlxuICAgICAqKlxuICAgICAgIFNwZWNpYWwgdGhhbmtzIHRvIE1hcml1c3ogTm93YWsgKGh0dHA6Ly93d3cubWVkaWtvby5jb20vKSBmb3IgdGhpcyBtZXRob2QuXG4gICAgXFwqL1xuICAgIFIucHJvdG90eXBlLnJlbmRlcmZpeCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNudnMgPSB0aGlzLmNhbnZhcyxcbiAgICAgICAgICAgIHMgPSBjbnZzLnN0eWxlLFxuICAgICAgICAgICAgcG9zO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcG9zID0gY252cy5nZXRTY3JlZW5DVE0oKSB8fCBjbnZzLmNyZWF0ZVNWR01hdHJpeCgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBwb3MgPSBjbnZzLmNyZWF0ZVNWR01hdHJpeCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsZWZ0ID0gLXBvcy5lICUgMSxcbiAgICAgICAgICAgIHRvcCA9IC1wb3MuZiAlIDE7XG4gICAgICAgIGlmIChsZWZ0IHx8IHRvcCkge1xuICAgICAgICAgICAgaWYgKGxlZnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sZWZ0ID0gKHRoaXMuX2xlZnQgKyBsZWZ0KSAlIDE7XG4gICAgICAgICAgICAgICAgcy5sZWZ0ID0gdGhpcy5fbGVmdCArIFwicHhcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0b3ApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90b3AgPSAodGhpcy5fdG9wICsgdG9wKSAlIDE7XG4gICAgICAgICAgICAgICAgcy50b3AgPSB0aGlzLl90b3AgKyBcInB4XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5jbGVhclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ2xlYXJzIHRoZSBwYXBlciwgaS5lLiByZW1vdmVzIGFsbCB0aGUgZWxlbWVudHMuXG4gICAgXFwqL1xuICAgIFIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBSLmV2ZShcInJhcGhhZWwuY2xlYXJcIiwgdGhpcyk7XG4gICAgICAgIHZhciBjID0gdGhpcy5jYW52YXM7XG4gICAgICAgIHdoaWxlIChjLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIGMucmVtb3ZlQ2hpbGQoYy5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJvdHRvbSA9IHRoaXMudG9wID0gbnVsbDtcbiAgICAgICAgKHRoaXMuZGVzYyA9ICQoXCJkZXNjXCIpKS5hcHBlbmRDaGlsZChSLl9nLmRvYy5jcmVhdGVUZXh0Tm9kZShcIkNyZWF0ZWQgd2l0aCBSYXBoYVxceGVibCBcIiArIFIudmVyc2lvbikpO1xuICAgICAgICBjLmFwcGVuZENoaWxkKHRoaXMuZGVzYyk7XG4gICAgICAgIGMuYXBwZW5kQ2hpbGQodGhpcy5kZWZzID0gJChcImRlZnNcIikpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnJlbW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyB0aGUgcGFwZXIgZnJvbSB0aGUgRE9NLlxuICAgIFxcKi9cbiAgICBSLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZShcInJhcGhhZWwucmVtb3ZlXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlICYmIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpO1xuICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbaV0gPSB0eXBlb2YgdGhpc1tpXSA9PSBcImZ1bmN0aW9uXCIgPyBSLl9yZW1vdmVkRmFjdG9yeShpKSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBzZXRwcm90byA9IFIuc3Q7XG4gICAgZm9yICh2YXIgbWV0aG9kIGluIGVscHJvdG8pIGlmIChlbHByb3RvW2hhc10obWV0aG9kKSAmJiAhc2V0cHJvdG9baGFzXShtZXRob2QpKSB7XG4gICAgICAgIHNldHByb3RvW21ldGhvZF0gPSAoZnVuY3Rpb24gKG1ldGhvZG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICBlbFttZXRob2RuYW1lXS5hcHBseShlbCwgYXJnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKG1ldGhvZCk7XG4gICAgfVxufSkoKTtcblxuLy8g4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQIFxcXFxcbi8vIOKUgiBSYXBoYcOrbCAtIEphdmFTY3JpcHQgVmVjdG9yIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBWTUwgTW9kdWxlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIENvcHlyaWdodCAoYykgMjAwOC0yMDExIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL3JhcGhhZWxqcy5jb20pICAg4pSCIFxcXFxcbi8vIOKUgiBDb3B5cmlnaHQgKGMpIDIwMDgtMjAxMSBTZW5jaGEgTGFicyAoaHR0cDovL3NlbmNoYS5jb20pICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilIIgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCAoaHR0cDovL3JhcGhhZWxqcy5jb20vbGljZW5zZS5odG1sKSBsaWNlbnNlLiDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uKCl7XG4gICAgaWYgKCFSLnZtbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgdG9GbG9hdCA9IHBhcnNlRmxvYXQsXG4gICAgICAgIG1hdGggPSBNYXRoLFxuICAgICAgICByb3VuZCA9IG1hdGgucm91bmQsXG4gICAgICAgIG1tYXggPSBtYXRoLm1heCxcbiAgICAgICAgbW1pbiA9IG1hdGgubWluLFxuICAgICAgICBhYnMgPSBtYXRoLmFicyxcbiAgICAgICAgZmlsbFN0cmluZyA9IFwiZmlsbFwiLFxuICAgICAgICBzZXBhcmF0b3IgPSAvWywgXSsvLFxuICAgICAgICBldmUgPSBSLmV2ZSxcbiAgICAgICAgbXMgPSBcIiBwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnRcIixcbiAgICAgICAgUyA9IFwiIFwiLFxuICAgICAgICBFID0gXCJcIixcbiAgICAgICAgbWFwID0ge006IFwibVwiLCBMOiBcImxcIiwgQzogXCJjXCIsIFo6IFwieFwiLCBtOiBcInRcIiwgbDogXCJyXCIsIGM6IFwidlwiLCB6OiBcInhcIn0sXG4gICAgICAgIGJpdGVzID0gLyhbY2xtel0pLD8oW15jbG16XSopL2dpLFxuICAgICAgICBibHVycmVnZXhwID0gLyBwcm9naWQ6XFxTK0JsdXJcXChbXlxcKV0rXFwpL2csXG4gICAgICAgIHZhbCA9IC8tP1teLFxccy1dKy9nLFxuICAgICAgICBjc3NEb3QgPSBcInBvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt0b3A6MDt3aWR0aDoxcHg7aGVpZ2h0OjFweDtiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKVwiLFxuICAgICAgICB6b29tID0gMjE2MDAsXG4gICAgICAgIHBhdGhUeXBlcyA9IHtwYXRoOiAxLCByZWN0OiAxLCBpbWFnZTogMX0sXG4gICAgICAgIG92YWxUeXBlcyA9IHtjaXJjbGU6IDEsIGVsbGlwc2U6IDF9LFxuICAgICAgICBwYXRoMnZtbCA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAgL1thaHFzdHZdL2lnLFxuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBSLl9wYXRoVG9BYnNvbHV0ZTtcbiAgICAgICAgICAgIFN0cihwYXRoKS5tYXRjaCh0b3RhbCkgJiYgKGNvbW1hbmQgPSBSLl9wYXRoMmN1cnZlKTtcbiAgICAgICAgICAgIHRvdGFsID0gL1tjbG16XS9nO1xuICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT0gUi5fcGF0aFRvQWJzb2x1dGUgJiYgIVN0cihwYXRoKS5tYXRjaCh0b3RhbCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0gU3RyKHBhdGgpLnJlcGxhY2UoYml0ZXMsIGZ1bmN0aW9uIChhbGwsIGNvbW1hbmQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTW92ZSA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKSA9PSBcIm1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IG1hcFtjb21tYW5kXTtcbiAgICAgICAgICAgICAgICAgICAgYXJncy5yZXBsYWNlKHZhbCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNNb3ZlICYmIHZhbHMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gdmFscyArIG1hcFtjb21tYW5kID09IFwibVwiID8gXCJsXCIgOiBcIkxcIl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFscyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFscy5wdXNoKHJvdW5kKHZhbHVlICogem9vbSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcyArIHZhbHM7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwYSA9IGNvbW1hbmQocGF0aCksIHAsIHI7XG4gICAgICAgICAgICByZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwID0gcGFbaV07XG4gICAgICAgICAgICAgICAgciA9IHBhW2ldWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgciA9PSBcInpcIiAmJiAociA9IFwieFwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMSwgamogPSBwLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgciArPSByb3VuZChwW2pdICogem9vbSkgKyAoaiAhPSBqaiAtIDEgPyBcIixcIiA6IEUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMucHVzaChyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXMuam9pbihTKTtcbiAgICAgICAgfSxcbiAgICAgICAgY29tcGVuc2F0aW9uID0gZnVuY3Rpb24gKGRlZywgZHgsIGR5KSB7XG4gICAgICAgICAgICB2YXIgbSA9IFIubWF0cml4KCk7XG4gICAgICAgICAgICBtLnJvdGF0ZSgtZGVnLCAuNSwgLjUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBkeDogbS54KGR4LCBkeSksXG4gICAgICAgICAgICAgICAgZHk6IG0ueShkeCwgZHkpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBzZXRDb29yZHMgPSBmdW5jdGlvbiAocCwgc3gsIHN5LCBkeCwgZHksIGRlZykge1xuICAgICAgICAgICAgdmFyIF8gPSBwLl8sXG4gICAgICAgICAgICAgICAgbSA9IHAubWF0cml4LFxuICAgICAgICAgICAgICAgIGZpbGxwb3MgPSBfLmZpbGxwb3MsXG4gICAgICAgICAgICAgICAgbyA9IHAubm9kZSxcbiAgICAgICAgICAgICAgICBzID0gby5zdHlsZSxcbiAgICAgICAgICAgICAgICB5ID0gMSxcbiAgICAgICAgICAgICAgICBmbGlwID0gXCJcIixcbiAgICAgICAgICAgICAgICBkeGR5LFxuICAgICAgICAgICAgICAgIGt4ID0gem9vbSAvIHN4LFxuICAgICAgICAgICAgICAgIGt5ID0gem9vbSAvIHN5O1xuICAgICAgICAgICAgcy52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIGlmICghc3ggfHwgIXN5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgby5jb29yZHNpemUgPSBhYnMoa3gpICsgUyArIGFicyhreSk7XG4gICAgICAgICAgICBzLnJvdGF0aW9uID0gZGVnICogKHN4ICogc3kgPCAwID8gLTEgOiAxKTtcbiAgICAgICAgICAgIGlmIChkZWcpIHtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IGNvbXBlbnNhdGlvbihkZWcsIGR4LCBkeSk7XG4gICAgICAgICAgICAgICAgZHggPSBjLmR4O1xuICAgICAgICAgICAgICAgIGR5ID0gYy5keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN4IDwgMCAmJiAoZmxpcCArPSBcInhcIik7XG4gICAgICAgICAgICBzeSA8IDAgJiYgKGZsaXAgKz0gXCIgeVwiKSAmJiAoeSA9IC0xKTtcbiAgICAgICAgICAgIHMuZmxpcCA9IGZsaXA7XG4gICAgICAgICAgICBvLmNvb3Jkb3JpZ2luID0gKGR4ICogLWt4KSArIFMgKyAoZHkgKiAta3kpO1xuICAgICAgICAgICAgaWYgKGZpbGxwb3MgfHwgXy5maWxsc2l6ZSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxsID0gby5nZXRFbGVtZW50c0J5VGFnTmFtZShmaWxsU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBmaWxsID0gZmlsbCAmJiBmaWxsWzBdO1xuICAgICAgICAgICAgICAgIG8ucmVtb3ZlQ2hpbGQoZmlsbCk7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGxwb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgYyA9IGNvbXBlbnNhdGlvbihkZWcsIG0ueChmaWxscG9zWzBdLCBmaWxscG9zWzFdKSwgbS55KGZpbGxwb3NbMF0sIGZpbGxwb3NbMV0pKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5wb3NpdGlvbiA9IGMuZHggKiB5ICsgUyArIGMuZHkgKiB5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXy5maWxsc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnNpemUgPSBfLmZpbGxzaXplWzBdICogYWJzKHN4KSArIFMgKyBfLmZpbGxzaXplWzFdICogYWJzKHN5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgby5hcHBlbmRDaGlsZChmaWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHMudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuICAgICAgICB9O1xuICAgIFIudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAgXCJZb3VyIGJyb3dzZXIgZG9lc25cXHUyMDE5dCBzdXBwb3J0IFNWRy4gRmFsbGluZyBkb3duIHRvIFZNTC5cXG5Zb3UgYXJlIHJ1bm5pbmcgUmFwaGFcXHhlYmwgXCIgKyB0aGlzLnZlcnNpb247XG4gICAgfTtcbiAgICB2YXIgYWRkQXJyb3cgPSBmdW5jdGlvbiAobywgdmFsdWUsIGlzRW5kKSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBTdHIodmFsdWUpLnRvTG93ZXJDYXNlKCkuc3BsaXQoXCItXCIpLFxuICAgICAgICAgICAgc2UgPSBpc0VuZCA/IFwiZW5kXCIgOiBcInN0YXJ0XCIsXG4gICAgICAgICAgICBpID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgICAgICAgIHR5cGUgPSBcImNsYXNzaWNcIixcbiAgICAgICAgICAgIHcgPSBcIm1lZGl1bVwiLFxuICAgICAgICAgICAgaCA9IFwibWVkaXVtXCI7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHN3aXRjaCAodmFsdWVzW2ldKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImJsb2NrXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcImNsYXNzaWNcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwib3ZhbFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJkaWFtb25kXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwibm9uZVwiOlxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gdmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwid2lkZVwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJuYXJyb3dcIjogaCA9IHZhbHVlc1tpXTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImxvbmdcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwic2hvcnRcIjogdyA9IHZhbHVlc1tpXTsgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0cm9rZSA9IG8ubm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN0cm9rZVwiKVswXTtcbiAgICAgICAgc3Ryb2tlW3NlICsgXCJhcnJvd1wiXSA9IHR5cGU7XG4gICAgICAgIHN0cm9rZVtzZSArIFwiYXJyb3dsZW5ndGhcIl0gPSB3O1xuICAgICAgICBzdHJva2Vbc2UgKyBcImFycm93d2lkdGhcIl0gPSBoO1xuICAgIH0sXG4gICAgc2V0RmlsbEFuZFN0cm9rZSA9IGZ1bmN0aW9uIChvLCBwYXJhbXMpIHtcbiAgICAgICAgLy8gby5wYXBlci5jYW52YXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBvLmF0dHJzID0gby5hdHRycyB8fCB7fTtcbiAgICAgICAgdmFyIG5vZGUgPSBvLm5vZGUsXG4gICAgICAgICAgICBhID0gby5hdHRycyxcbiAgICAgICAgICAgIHMgPSBub2RlLnN0eWxlLFxuICAgICAgICAgICAgeHksXG4gICAgICAgICAgICBuZXdwYXRoID0gcGF0aFR5cGVzW28udHlwZV0gJiYgKHBhcmFtcy54ICE9IGEueCB8fCBwYXJhbXMueSAhPSBhLnkgfHwgcGFyYW1zLndpZHRoICE9IGEud2lkdGggfHwgcGFyYW1zLmhlaWdodCAhPSBhLmhlaWdodCB8fCBwYXJhbXMuY3ggIT0gYS5jeCB8fCBwYXJhbXMuY3kgIT0gYS5jeSB8fCBwYXJhbXMucnggIT0gYS5yeCB8fCBwYXJhbXMucnkgIT0gYS5yeSB8fCBwYXJhbXMuciAhPSBhLnIpLFxuICAgICAgICAgICAgaXNPdmFsID0gb3ZhbFR5cGVzW28udHlwZV0gJiYgKGEuY3ggIT0gcGFyYW1zLmN4IHx8IGEuY3kgIT0gcGFyYW1zLmN5IHx8IGEuciAhPSBwYXJhbXMuciB8fCBhLnJ4ICE9IHBhcmFtcy5yeCB8fCBhLnJ5ICE9IHBhcmFtcy5yeSksXG4gICAgICAgICAgICByZXMgPSBvO1xuXG5cbiAgICAgICAgZm9yICh2YXIgcGFyIGluIHBhcmFtcykgaWYgKHBhcmFtc1toYXNdKHBhcikpIHtcbiAgICAgICAgICAgIGFbcGFyXSA9IHBhcmFtc1twYXJdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZXdwYXRoKSB7XG4gICAgICAgICAgICBhLnBhdGggPSBSLl9nZXRQYXRoW28udHlwZV0obyk7XG4gICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtcy5ocmVmICYmIChub2RlLmhyZWYgPSBwYXJhbXMuaHJlZik7XG4gICAgICAgIHBhcmFtcy50aXRsZSAmJiAobm9kZS50aXRsZSA9IHBhcmFtcy50aXRsZSk7XG4gICAgICAgIHBhcmFtcy50YXJnZXQgJiYgKG5vZGUudGFyZ2V0ID0gcGFyYW1zLnRhcmdldCk7XG4gICAgICAgIHBhcmFtcy5jdXJzb3IgJiYgKHMuY3Vyc29yID0gcGFyYW1zLmN1cnNvcik7XG4gICAgICAgIFwiYmx1clwiIGluIHBhcmFtcyAmJiBvLmJsdXIocGFyYW1zLmJsdXIpO1xuICAgICAgICBpZiAocGFyYW1zLnBhdGggJiYgby50eXBlID09IFwicGF0aFwiIHx8IG5ld3BhdGgpIHtcbiAgICAgICAgICAgIG5vZGUucGF0aCA9IHBhdGgydm1sKH5TdHIoYS5wYXRoKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJyXCIpID8gUi5fcGF0aFRvQWJzb2x1dGUoYS5wYXRoKSA6IGEucGF0aCk7XG4gICAgICAgICAgICBvLl8uZGlydHkgPSAxO1xuICAgICAgICAgICAgaWYgKG8udHlwZSA9PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgICAgICBvLl8uZmlsbHBvcyA9IFthLngsIGEueV07XG4gICAgICAgICAgICAgICAgby5fLmZpbGxzaXplID0gW2Eud2lkdGgsIGEuaGVpZ2h0XTtcbiAgICAgICAgICAgICAgICBzZXRDb29yZHMobywgMSwgMSwgMCwgMCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXCJ0cmFuc2Zvcm1cIiBpbiBwYXJhbXMgJiYgby50cmFuc2Zvcm0ocGFyYW1zLnRyYW5zZm9ybSk7XG4gICAgICAgIGlmIChpc092YWwpIHtcbiAgICAgICAgICAgIHZhciBjeCA9ICthLmN4LFxuICAgICAgICAgICAgICAgIGN5ID0gK2EuY3ksXG4gICAgICAgICAgICAgICAgcnggPSArYS5yeCB8fCArYS5yIHx8IDAsXG4gICAgICAgICAgICAgICAgcnkgPSArYS5yeSB8fCArYS5yIHx8IDA7XG4gICAgICAgICAgICBub2RlLnBhdGggPSBSLmZvcm1hdChcImFyezB9LHsxfSx7Mn0sezN9LHs0fSx7MX0sezR9LHsxfXhcIiwgcm91bmQoKGN4IC0gcngpICogem9vbSksIHJvdW5kKChjeSAtIHJ5KSAqIHpvb20pLCByb3VuZCgoY3ggKyByeCkgKiB6b29tKSwgcm91bmQoKGN5ICsgcnkpICogem9vbSksIHJvdW5kKGN4ICogem9vbSkpO1xuICAgICAgICAgICAgby5fLmRpcnR5ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJjbGlwLXJlY3RcIiBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gU3RyKHBhcmFtc1tcImNsaXAtcmVjdFwiXSkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIGlmIChyZWN0Lmxlbmd0aCA9PSA0KSB7XG4gICAgICAgICAgICAgICAgcmVjdFsyXSA9ICtyZWN0WzJdICsgKCtyZWN0WzBdKTtcbiAgICAgICAgICAgICAgICByZWN0WzNdID0gK3JlY3RbM10gKyAoK3JlY3RbMV0pO1xuICAgICAgICAgICAgICAgIHZhciBkaXYgPSBub2RlLmNsaXBSZWN0IHx8IFIuX2cuZG9jLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgICAgICAgICAgICAgIGRzdHlsZSA9IGRpdi5zdHlsZTtcbiAgICAgICAgICAgICAgICBkc3R5bGUuY2xpcCA9IFIuZm9ybWF0KFwicmVjdCh7MX1weCB7Mn1weCB7M31weCB7MH1weClcIiwgcmVjdCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmNsaXBSZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRzdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICAgICAgICAgICAgZHN0eWxlLnRvcCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGRzdHlsZS5sZWZ0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZHN0eWxlLndpZHRoID0gby5wYXBlci53aWR0aCArIFwicHhcIjtcbiAgICAgICAgICAgICAgICAgICAgZHN0eWxlLmhlaWdodCA9IG8ucGFwZXIuaGVpZ2h0ICsgXCJweFwiO1xuICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRpdiwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5jbGlwUmVjdCA9IGRpdjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXBhcmFtc1tcImNsaXAtcmVjdFwiXSkge1xuICAgICAgICAgICAgICAgIG5vZGUuY2xpcFJlY3QgJiYgKG5vZGUuY2xpcFJlY3Quc3R5bGUuY2xpcCA9IFwiYXV0b1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoby50ZXh0cGF0aCkge1xuICAgICAgICAgICAgdmFyIHRleHRwYXRoU3R5bGUgPSBvLnRleHRwYXRoLnN0eWxlO1xuICAgICAgICAgICAgcGFyYW1zLmZvbnQgJiYgKHRleHRwYXRoU3R5bGUuZm9udCA9IHBhcmFtcy5mb250KTtcbiAgICAgICAgICAgIHBhcmFtc1tcImZvbnQtZmFtaWx5XCJdICYmICh0ZXh0cGF0aFN0eWxlLmZvbnRGYW1pbHkgPSAnXCInICsgcGFyYW1zW1wiZm9udC1mYW1pbHlcIl0uc3BsaXQoXCIsXCIpWzBdLnJlcGxhY2UoL15bJ1wiXSt8WydcIl0rJC9nLCBFKSArICdcIicpO1xuICAgICAgICAgICAgcGFyYW1zW1wiZm9udC1zaXplXCJdICYmICh0ZXh0cGF0aFN0eWxlLmZvbnRTaXplID0gcGFyYW1zW1wiZm9udC1zaXplXCJdKTtcbiAgICAgICAgICAgIHBhcmFtc1tcImZvbnQtd2VpZ2h0XCJdICYmICh0ZXh0cGF0aFN0eWxlLmZvbnRXZWlnaHQgPSBwYXJhbXNbXCJmb250LXdlaWdodFwiXSk7XG4gICAgICAgICAgICBwYXJhbXNbXCJmb250LXN0eWxlXCJdICYmICh0ZXh0cGF0aFN0eWxlLmZvbnRTdHlsZSA9IHBhcmFtc1tcImZvbnQtc3R5bGVcIl0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImFycm93LXN0YXJ0XCIgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICBhZGRBcnJvdyhyZXMsIHBhcmFtc1tcImFycm93LXN0YXJ0XCJdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJhcnJvdy1lbmRcIiBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGFkZEFycm93KHJlcywgcGFyYW1zW1wiYXJyb3ctZW5kXCJdLCAxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyYW1zLm9wYWNpdHkgIT0gbnVsbCB8fCBcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXMuZmlsbCAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXMuc3JjICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtcy5zdHJva2UgIT0gbnVsbCB8fFxuICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLXdpZHRoXCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1vcGFjaXR5XCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtc1tcImZpbGwtb3BhY2l0eVwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtZGFzaGFycmF5XCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1taXRlcmxpbWl0XCJdICE9IG51bGwgfHxcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1saW5lam9pblwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbGluZWNhcFwiXSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgZmlsbCA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoZmlsbFN0cmluZyksXG4gICAgICAgICAgICAgICAgbmV3ZmlsbCA9IGZhbHNlO1xuICAgICAgICAgICAgZmlsbCA9IGZpbGwgJiYgZmlsbFswXTtcbiAgICAgICAgICAgICFmaWxsICYmIChuZXdmaWxsID0gZmlsbCA9IGNyZWF0ZU5vZGUoZmlsbFN0cmluZykpO1xuICAgICAgICAgICAgaWYgKG8udHlwZSA9PSBcImltYWdlXCIgJiYgcGFyYW1zLnNyYykge1xuICAgICAgICAgICAgICAgIGZpbGwuc3JjID0gcGFyYW1zLnNyYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmFtcy5maWxsICYmIChmaWxsLm9uID0gdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoZmlsbC5vbiA9PSBudWxsIHx8IHBhcmFtcy5maWxsID09IFwibm9uZVwiIHx8IHBhcmFtcy5maWxsID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZmlsbC5vbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbGwub24gJiYgcGFyYW1zLmZpbGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNVUkwgPSBTdHIocGFyYW1zLmZpbGwpLm1hdGNoKFIuX0lTVVJMKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5wYXJlbnROb2RlID09IG5vZGUgJiYgbm9kZS5yZW1vdmVDaGlsZChmaWxsKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5yb3RhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnNyYyA9IGlzVVJMWzFdO1xuICAgICAgICAgICAgICAgICAgICBmaWxsLnR5cGUgPSBcInRpbGVcIjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJib3ggPSBvLmdldEJCb3goMSk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwucG9zaXRpb24gPSBiYm94LnggKyBTICsgYmJveC55O1xuICAgICAgICAgICAgICAgICAgICBvLl8uZmlsbHBvcyA9IFtiYm94LngsIGJib3gueV07XG5cbiAgICAgICAgICAgICAgICAgICAgUi5fcHJlbG9hZChpc1VSTFsxXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5fLmZpbGxzaXplID0gW3RoaXMub2Zmc2V0V2lkdGgsIHRoaXMub2Zmc2V0SGVpZ2h0XTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC5jb2xvciA9IFIuZ2V0UkdCKHBhcmFtcy5maWxsKS5oZXg7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwuc3JjID0gRTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbC50eXBlID0gXCJzb2xpZFwiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoUi5nZXRSR0IocGFyYW1zLmZpbGwpLmVycm9yICYmIChyZXMudHlwZSBpbiB7Y2lyY2xlOiAxLCBlbGxpcHNlOiAxfSB8fCBTdHIocGFyYW1zLmZpbGwpLmNoYXJBdCgpICE9IFwiclwiKSAmJiBhZGRHcmFkaWVudEZpbGwocmVzLCBwYXJhbXMuZmlsbCwgZmlsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEuZmlsbCA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYS5ncmFkaWVudCA9IHBhcmFtcy5maWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbC5yb3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChcImZpbGwtb3BhY2l0eVwiIGluIHBhcmFtcyB8fCBcIm9wYWNpdHlcIiBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3BhY2l0eSA9ICgoK2FbXCJmaWxsLW9wYWNpdHlcIl0gKyAxIHx8IDIpIC0gMSkgKiAoKCthLm9wYWNpdHkgKyAxIHx8IDIpIC0gMSkgKiAoKCtSLmdldFJHQihwYXJhbXMuZmlsbCkubyArIDEgfHwgMikgLSAxKTtcbiAgICAgICAgICAgICAgICBvcGFjaXR5ID0gbW1pbihtbWF4KG9wYWNpdHksIDApLCAxKTtcbiAgICAgICAgICAgICAgICBmaWxsLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIGlmIChmaWxsLnNyYykge1xuICAgICAgICAgICAgICAgICAgICBmaWxsLmNvbG9yID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChmaWxsKTtcbiAgICAgICAgICAgIHZhciBzdHJva2UgPSAobm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN0cm9rZVwiKSAmJiBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3Ryb2tlXCIpWzBdKSxcbiAgICAgICAgICAgIG5ld3N0cm9rZSA9IGZhbHNlO1xuICAgICAgICAgICAgIXN0cm9rZSAmJiAobmV3c3Ryb2tlID0gc3Ryb2tlID0gY3JlYXRlTm9kZShcInN0cm9rZVwiKSk7XG4gICAgICAgICAgICBpZiAoKHBhcmFtcy5zdHJva2UgJiYgcGFyYW1zLnN0cm9rZSAhPSBcIm5vbmVcIikgfHxcbiAgICAgICAgICAgICAgICBwYXJhbXNbXCJzdHJva2Utd2lkdGhcIl0gfHxcbiAgICAgICAgICAgICAgICBwYXJhbXNbXCJzdHJva2Utb3BhY2l0eVwiXSAhPSBudWxsIHx8XG4gICAgICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWRhc2hhcnJheVwiXSB8fFxuICAgICAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1taXRlcmxpbWl0XCJdIHx8XG4gICAgICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWxpbmVqb2luXCJdIHx8XG4gICAgICAgICAgICAgICAgcGFyYW1zW1wic3Ryb2tlLWxpbmVjYXBcIl0pIHtcbiAgICAgICAgICAgICAgICBzdHJva2Uub24gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKHBhcmFtcy5zdHJva2UgPT0gXCJub25lXCIgfHwgcGFyYW1zLnN0cm9rZSA9PT0gbnVsbCB8fCBzdHJva2Uub24gPT0gbnVsbCB8fCBwYXJhbXMuc3Ryb2tlID09IDAgfHwgcGFyYW1zW1wic3Ryb2tlLXdpZHRoXCJdID09IDApICYmIChzdHJva2Uub24gPSBmYWxzZSk7XG4gICAgICAgICAgICB2YXIgc3Ryb2tlQ29sb3IgPSBSLmdldFJHQihwYXJhbXMuc3Ryb2tlKTtcbiAgICAgICAgICAgIHN0cm9rZS5vbiAmJiBwYXJhbXMuc3Ryb2tlICYmIChzdHJva2UuY29sb3IgPSBzdHJva2VDb2xvci5oZXgpO1xuICAgICAgICAgICAgb3BhY2l0eSA9ICgoK2FbXCJzdHJva2Utb3BhY2l0eVwiXSArIDEgfHwgMikgLSAxKSAqICgoK2Eub3BhY2l0eSArIDEgfHwgMikgLSAxKSAqICgoK3N0cm9rZUNvbG9yLm8gKyAxIHx8IDIpIC0gMSk7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSAodG9GbG9hdChwYXJhbXNbXCJzdHJva2Utd2lkdGhcIl0pIHx8IDEpICogLjc1O1xuICAgICAgICAgICAgb3BhY2l0eSA9IG1taW4obW1heChvcGFjaXR5LCAwKSwgMSk7XG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2Utd2lkdGhcIl0gPT0gbnVsbCAmJiAod2lkdGggPSBhW1wic3Ryb2tlLXdpZHRoXCJdKTtcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS13aWR0aFwiXSAmJiAoc3Ryb2tlLndlaWdodCA9IHdpZHRoKTtcbiAgICAgICAgICAgIHdpZHRoICYmIHdpZHRoIDwgMSAmJiAob3BhY2l0eSAqPSB3aWR0aCkgJiYgKHN0cm9rZS53ZWlnaHQgPSAxKTtcbiAgICAgICAgICAgIHN0cm9rZS5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICAgICAgXG4gICAgICAgICAgICBwYXJhbXNbXCJzdHJva2UtbGluZWpvaW5cIl0gJiYgKHN0cm9rZS5qb2luc3R5bGUgPSBwYXJhbXNbXCJzdHJva2UtbGluZWpvaW5cIl0gfHwgXCJtaXRlclwiKTtcbiAgICAgICAgICAgIHN0cm9rZS5taXRlcmxpbWl0ID0gcGFyYW1zW1wic3Ryb2tlLW1pdGVybGltaXRcIl0gfHwgODtcbiAgICAgICAgICAgIHBhcmFtc1tcInN0cm9rZS1saW5lY2FwXCJdICYmIChzdHJva2UuZW5kY2FwID0gcGFyYW1zW1wic3Ryb2tlLWxpbmVjYXBcIl0gPT0gXCJidXR0XCIgPyBcImZsYXRcIiA6IHBhcmFtc1tcInN0cm9rZS1saW5lY2FwXCJdID09IFwic3F1YXJlXCIgPyBcInNxdWFyZVwiIDogXCJyb3VuZFwiKTtcbiAgICAgICAgICAgIGlmIChcInN0cm9rZS1kYXNoYXJyYXlcIiBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGFzaGFycmF5ID0ge1xuICAgICAgICAgICAgICAgICAgICBcIi1cIjogXCJzaG9ydGRhc2hcIixcbiAgICAgICAgICAgICAgICAgICAgXCIuXCI6IFwic2hvcnRkb3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCItLlwiOiBcInNob3J0ZGFzaGRvdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi0uLlwiOiBcInNob3J0ZGFzaGRvdGRvdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi4gXCI6IFwiZG90XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLSBcIjogXCJkYXNoXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiLS1cIjogXCJsb25nZGFzaFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi0gLlwiOiBcImRhc2hkb3RcIixcbiAgICAgICAgICAgICAgICAgICAgXCItLS5cIjogXCJsb25nZGFzaGRvdFwiLFxuICAgICAgICAgICAgICAgICAgICBcIi0tLi5cIjogXCJsb25nZGFzaGRvdGRvdFwiXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzdHJva2UuZGFzaHN0eWxlID0gZGFzaGFycmF5W2hhc10ocGFyYW1zW1wic3Ryb2tlLWRhc2hhcnJheVwiXSkgPyBkYXNoYXJyYXlbcGFyYW1zW1wic3Ryb2tlLWRhc2hhcnJheVwiXV0gOiBFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3c3Ryb2tlICYmIG5vZGUuYXBwZW5kQ2hpbGQoc3Ryb2tlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzLnR5cGUgPT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgIHJlcy5wYXBlci5jYW52YXMuc3R5bGUuZGlzcGxheSA9IEU7XG4gICAgICAgICAgICB2YXIgc3BhbiA9IHJlcy5wYXBlci5zcGFuLFxuICAgICAgICAgICAgICAgIG0gPSAxMDAsXG4gICAgICAgICAgICAgICAgZm9udFNpemUgPSBhLmZvbnQgJiYgYS5mb250Lm1hdGNoKC9cXGQrKD86XFwuXFxkKik/KD89cHgpLyk7XG4gICAgICAgICAgICBzID0gc3Bhbi5zdHlsZTtcbiAgICAgICAgICAgIGEuZm9udCAmJiAocy5mb250ID0gYS5mb250KTtcbiAgICAgICAgICAgIGFbXCJmb250LWZhbWlseVwiXSAmJiAocy5mb250RmFtaWx5ID0gYVtcImZvbnQtZmFtaWx5XCJdKTtcbiAgICAgICAgICAgIGFbXCJmb250LXdlaWdodFwiXSAmJiAocy5mb250V2VpZ2h0ID0gYVtcImZvbnQtd2VpZ2h0XCJdKTtcbiAgICAgICAgICAgIGFbXCJmb250LXN0eWxlXCJdICYmIChzLmZvbnRTdHlsZSA9IGFbXCJmb250LXN0eWxlXCJdKTtcbiAgICAgICAgICAgIGZvbnRTaXplID0gdG9GbG9hdChhW1wiZm9udC1zaXplXCJdIHx8IGZvbnRTaXplICYmIGZvbnRTaXplWzBdKSB8fCAxMDtcbiAgICAgICAgICAgIHMuZm9udFNpemUgPSBmb250U2l6ZSAqIG0gKyBcInB4XCI7XG4gICAgICAgICAgICByZXMudGV4dHBhdGguc3RyaW5nICYmIChzcGFuLmlubmVySFRNTCA9IFN0cihyZXMudGV4dHBhdGguc3RyaW5nKS5yZXBsYWNlKC88L2csIFwiJiM2MDtcIikucmVwbGFjZSgvJi9nLCBcIiYjMzg7XCIpLnJlcGxhY2UoL1xcbi9nLCBcIjxicj5cIikpO1xuICAgICAgICAgICAgdmFyIGJyZWN0ID0gc3Bhbi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHJlcy5XID0gYS53ID0gKGJyZWN0LnJpZ2h0IC0gYnJlY3QubGVmdCkgLyBtO1xuICAgICAgICAgICAgcmVzLkggPSBhLmggPSAoYnJlY3QuYm90dG9tIC0gYnJlY3QudG9wKSAvIG07XG4gICAgICAgICAgICAvLyByZXMucGFwZXIuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIHJlcy5YID0gYS54O1xuICAgICAgICAgICAgcmVzLlkgPSBhLnkgKyByZXMuSCAvIDI7XG5cbiAgICAgICAgICAgIChcInhcIiBpbiBwYXJhbXMgfHwgXCJ5XCIgaW4gcGFyYW1zKSAmJiAocmVzLnBhdGgudiA9IFIuZm9ybWF0KFwibXswfSx7MX1sezJ9LHsxfVwiLCByb3VuZChhLnggKiB6b29tKSwgcm91bmQoYS55ICogem9vbSksIHJvdW5kKGEueCAqIHpvb20pICsgMSkpO1xuICAgICAgICAgICAgdmFyIGRpcnR5YXR0cnMgPSBbXCJ4XCIsIFwieVwiLCBcInRleHRcIiwgXCJmb250XCIsIFwiZm9udC1mYW1pbHlcIiwgXCJmb250LXdlaWdodFwiLCBcImZvbnQtc3R5bGVcIiwgXCJmb250LXNpemVcIl07XG4gICAgICAgICAgICBmb3IgKHZhciBkID0gMCwgZGQgPSBkaXJ0eWF0dHJzLmxlbmd0aDsgZCA8IGRkOyBkKyspIGlmIChkaXJ0eWF0dHJzW2RdIGluIHBhcmFtcykge1xuICAgICAgICAgICAgICAgIHJlcy5fLmRpcnR5ID0gMTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgICAvLyB0ZXh0LWFuY2hvciBlbXVsYXRpb25cbiAgICAgICAgICAgIHN3aXRjaCAoYVtcInRleHQtYW5jaG9yXCJdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcInN0YXJ0XCI6XG4gICAgICAgICAgICAgICAgICAgIHJlcy50ZXh0cGF0aC5zdHlsZVtcInYtdGV4dC1hbGlnblwiXSA9IFwibGVmdFwiO1xuICAgICAgICAgICAgICAgICAgICByZXMuYmJ4ID0gcmVzLlcgLyAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJlbmRcIjpcbiAgICAgICAgICAgICAgICAgICAgcmVzLnRleHRwYXRoLnN0eWxlW1widi10ZXh0LWFsaWduXCJdID0gXCJyaWdodFwiO1xuICAgICAgICAgICAgICAgICAgICByZXMuYmJ4ID0gLXJlcy5XIC8gMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXMudGV4dHBhdGguc3R5bGVbXCJ2LXRleHQtYWxpZ25cIl0gPSBcImNlbnRlclwiO1xuICAgICAgICAgICAgICAgICAgICByZXMuYmJ4ID0gMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy50ZXh0cGF0aC5zdHlsZVtcInYtdGV4dC1rZXJuXCJdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZXMucGFwZXIuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSBFO1xuICAgIH0sXG4gICAgYWRkR3JhZGllbnRGaWxsID0gZnVuY3Rpb24gKG8sIGdyYWRpZW50LCBmaWxsKSB7XG4gICAgICAgIG8uYXR0cnMgPSBvLmF0dHJzIHx8IHt9O1xuICAgICAgICB2YXIgYXR0cnMgPSBvLmF0dHJzLFxuICAgICAgICAgICAgcG93ID0gTWF0aC5wb3csXG4gICAgICAgICAgICBvcGFjaXR5LFxuICAgICAgICAgICAgb2luZGV4LFxuICAgICAgICAgICAgdHlwZSA9IFwibGluZWFyXCIsXG4gICAgICAgICAgICBmeGZ5ID0gXCIuNSAuNVwiO1xuICAgICAgICBvLmF0dHJzLmdyYWRpZW50ID0gZ3JhZGllbnQ7XG4gICAgICAgIGdyYWRpZW50ID0gU3RyKGdyYWRpZW50KS5yZXBsYWNlKFIuX3JhZGlhbF9ncmFkaWVudCwgZnVuY3Rpb24gKGFsbCwgZngsIGZ5KSB7XG4gICAgICAgICAgICB0eXBlID0gXCJyYWRpYWxcIjtcbiAgICAgICAgICAgIGlmIChmeCAmJiBmeSkge1xuICAgICAgICAgICAgICAgIGZ4ID0gdG9GbG9hdChmeCk7XG4gICAgICAgICAgICAgICAgZnkgPSB0b0Zsb2F0KGZ5KTtcbiAgICAgICAgICAgICAgICBwb3coZnggLSAuNSwgMikgKyBwb3coZnkgLSAuNSwgMikgPiAuMjUgJiYgKGZ5ID0gbWF0aC5zcXJ0KC4yNSAtIHBvdyhmeCAtIC41LCAyKSkgKiAoKGZ5ID4gLjUpICogMiAtIDEpICsgLjUpO1xuICAgICAgICAgICAgICAgIGZ4ZnkgPSBmeCArIFMgKyBmeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFO1xuICAgICAgICB9KTtcbiAgICAgICAgZ3JhZGllbnQgPSBncmFkaWVudC5zcGxpdCgvXFxzKlxcLVxccyovKTtcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJsaW5lYXJcIikge1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gZ3JhZGllbnQuc2hpZnQoKTtcbiAgICAgICAgICAgIGFuZ2xlID0gLXRvRmxvYXQoYW5nbGUpO1xuICAgICAgICAgICAgaWYgKGlzTmFOKGFuZ2xlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBkb3RzID0gUi5fcGFyc2VEb3RzKGdyYWRpZW50KTtcbiAgICAgICAgaWYgKCFkb3RzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBvID0gby5zaGFwZSB8fCBvLm5vZGU7XG4gICAgICAgIGlmIChkb3RzLmxlbmd0aCkge1xuICAgICAgICAgICAgby5yZW1vdmVDaGlsZChmaWxsKTtcbiAgICAgICAgICAgIGZpbGwub24gPSB0cnVlO1xuICAgICAgICAgICAgZmlsbC5tZXRob2QgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGZpbGwuY29sb3IgPSBkb3RzWzBdLmNvbG9yO1xuICAgICAgICAgICAgZmlsbC5jb2xvcjIgPSBkb3RzW2RvdHMubGVuZ3RoIC0gMV0uY29sb3I7XG4gICAgICAgICAgICB2YXIgY2xycyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZG90cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZG90c1tpXS5vZmZzZXQgJiYgY2xycy5wdXNoKGRvdHNbaV0ub2Zmc2V0ICsgUyArIGRvdHNbaV0uY29sb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmlsbC5jb2xvcnMgPSBjbHJzLmxlbmd0aCA/IGNscnMuam9pbigpIDogXCIwJSBcIiArIGZpbGwuY29sb3I7XG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInJhZGlhbFwiKSB7XG4gICAgICAgICAgICAgICAgZmlsbC50eXBlID0gXCJncmFkaWVudFRpdGxlXCI7XG4gICAgICAgICAgICAgICAgZmlsbC5mb2N1cyA9IFwiMTAwJVwiO1xuICAgICAgICAgICAgICAgIGZpbGwuZm9jdXNzaXplID0gXCIwIDBcIjtcbiAgICAgICAgICAgICAgICBmaWxsLmZvY3VzcG9zaXRpb24gPSBmeGZ5O1xuICAgICAgICAgICAgICAgIGZpbGwuYW5nbGUgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBmaWxsLnJvdGF0ZT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmaWxsLnR5cGUgPSBcImdyYWRpZW50XCI7XG4gICAgICAgICAgICAgICAgZmlsbC5hbmdsZSA9ICgyNzAgLSBhbmdsZSkgJSAzNjA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvLmFwcGVuZENoaWxkKGZpbGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAxO1xuICAgIH0sXG4gICAgRWxlbWVudCA9IGZ1bmN0aW9uIChub2RlLCB2bWwpIHtcbiAgICAgICAgdGhpc1swXSA9IHRoaXMubm9kZSA9IG5vZGU7XG4gICAgICAgIG5vZGUucmFwaGFlbCA9IHRydWU7XG4gICAgICAgIHRoaXMuaWQgPSBSLl9vaWQrKztcbiAgICAgICAgbm9kZS5yYXBoYWVsaWQgPSB0aGlzLmlkO1xuICAgICAgICB0aGlzLlggPSAwO1xuICAgICAgICB0aGlzLlkgPSAwO1xuICAgICAgICB0aGlzLmF0dHJzID0ge307XG4gICAgICAgIHRoaXMucGFwZXIgPSB2bWw7XG4gICAgICAgIHRoaXMubWF0cml4ID0gUi5tYXRyaXgoKTtcbiAgICAgICAgdGhpcy5fID0ge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiBbXSxcbiAgICAgICAgICAgIHN4OiAxLFxuICAgICAgICAgICAgc3k6IDEsXG4gICAgICAgICAgICBkeDogMCxcbiAgICAgICAgICAgIGR5OiAwLFxuICAgICAgICAgICAgZGVnOiAwLFxuICAgICAgICAgICAgZGlydHk6IDEsXG4gICAgICAgICAgICBkaXJ0eVQ6IDFcbiAgICAgICAgfTtcbiAgICAgICAgIXZtbC5ib3R0b20gJiYgKHZtbC5ib3R0b20gPSB0aGlzKTtcbiAgICAgICAgdGhpcy5wcmV2ID0gdm1sLnRvcDtcbiAgICAgICAgdm1sLnRvcCAmJiAodm1sLnRvcC5uZXh0ID0gdGhpcyk7XG4gICAgICAgIHZtbC50b3AgPSB0aGlzO1xuICAgICAgICB0aGlzLm5leHQgPSBudWxsO1xuICAgIH07XG4gICAgdmFyIGVscHJvdG8gPSBSLmVsO1xuXG4gICAgRWxlbWVudC5wcm90b3R5cGUgPSBlbHByb3RvO1xuICAgIGVscHJvdG8uY29uc3RydWN0b3IgPSBFbGVtZW50O1xuICAgIGVscHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24gKHRzdHIpIHtcbiAgICAgICAgaWYgKHRzdHIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuXy50cmFuc2Zvcm07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHZicyA9IHRoaXMucGFwZXIuX3ZpZXdCb3hTaGlmdCxcbiAgICAgICAgICAgIHZidCA9IHZicyA/IFwic1wiICsgW3Zicy5zY2FsZSwgdmJzLnNjYWxlXSArIFwiLTEtMXRcIiArIFt2YnMuZHgsIHZicy5keV0gOiBFLFxuICAgICAgICAgICAgb2xkdDtcbiAgICAgICAgaWYgKHZicykge1xuICAgICAgICAgICAgb2xkdCA9IHRzdHIgPSBTdHIodHN0cikucmVwbGFjZSgvXFwuezN9fFxcdTIwMjYvZywgdGhpcy5fLnRyYW5zZm9ybSB8fCBFKTtcbiAgICAgICAgfVxuICAgICAgICBSLl9leHRyYWN0VHJhbnNmb3JtKHRoaXMsIHZidCArIHRzdHIpO1xuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcy5tYXRyaXguY2xvbmUoKSxcbiAgICAgICAgICAgIHNrZXcgPSB0aGlzLnNrZXcsXG4gICAgICAgICAgICBvID0gdGhpcy5ub2RlLFxuICAgICAgICAgICAgc3BsaXQsXG4gICAgICAgICAgICBpc0dyYWQgPSB+U3RyKHRoaXMuYXR0cnMuZmlsbCkuaW5kZXhPZihcIi1cIiksXG4gICAgICAgICAgICBpc1BhdHQgPSAhU3RyKHRoaXMuYXR0cnMuZmlsbCkuaW5kZXhPZihcInVybChcIik7XG4gICAgICAgIG1hdHJpeC50cmFuc2xhdGUoMSwgMSk7XG4gICAgICAgIGlmIChpc1BhdHQgfHwgaXNHcmFkIHx8IHRoaXMudHlwZSA9PSBcImltYWdlXCIpIHtcbiAgICAgICAgICAgIHNrZXcubWF0cml4ID0gXCIxIDAgMCAxXCI7XG4gICAgICAgICAgICBza2V3Lm9mZnNldCA9IFwiMCAwXCI7XG4gICAgICAgICAgICBzcGxpdCA9IG1hdHJpeC5zcGxpdCgpO1xuICAgICAgICAgICAgaWYgKChpc0dyYWQgJiYgc3BsaXQubm9Sb3RhdGlvbikgfHwgIXNwbGl0LmlzU2ltcGxlKSB7XG4gICAgICAgICAgICAgICAgby5zdHlsZS5maWx0ZXIgPSBtYXRyaXgudG9GaWx0ZXIoKTtcbiAgICAgICAgICAgICAgICB2YXIgYmIgPSB0aGlzLmdldEJCb3goKSxcbiAgICAgICAgICAgICAgICAgICAgYmJ0ID0gdGhpcy5nZXRCQm94KDEpLFxuICAgICAgICAgICAgICAgICAgICBkeCA9IGJiLnggLSBiYnQueCxcbiAgICAgICAgICAgICAgICAgICAgZHkgPSBiYi55IC0gYmJ0Lnk7XG4gICAgICAgICAgICAgICAgby5jb29yZG9yaWdpbiA9IChkeCAqIC16b29tKSArIFMgKyAoZHkgKiAtem9vbSk7XG4gICAgICAgICAgICAgICAgc2V0Q29vcmRzKHRoaXMsIDEsIDEsIGR4LCBkeSwgMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG8uc3R5bGUuZmlsdGVyID0gRTtcbiAgICAgICAgICAgICAgICBzZXRDb29yZHModGhpcywgc3BsaXQuc2NhbGV4LCBzcGxpdC5zY2FsZXksIHNwbGl0LmR4LCBzcGxpdC5keSwgc3BsaXQucm90YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG8uc3R5bGUuZmlsdGVyID0gRTtcbiAgICAgICAgICAgIHNrZXcubWF0cml4ID0gU3RyKG1hdHJpeCk7XG4gICAgICAgICAgICBza2V3Lm9mZnNldCA9IG1hdHJpeC5vZmZzZXQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob2xkdCAhPT0gbnVsbCkgeyAvLyBlbXB0eSBzdHJpbmcgdmFsdWUgaXMgdHJ1ZSBhcyB3ZWxsXG4gICAgICAgICAgICB0aGlzLl8udHJhbnNmb3JtID0gb2xkdDtcbiAgICAgICAgICAgIFIuX2V4dHJhY3RUcmFuc2Zvcm0odGhpcywgb2xkdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLnJvdGF0ZSA9IGZ1bmN0aW9uIChkZWcsIGN4LCBjeSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVnID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZWcgPSBTdHIoZGVnKS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICBpZiAoZGVnLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGN4ID0gdG9GbG9hdChkZWdbMV0pO1xuICAgICAgICAgICAgY3kgPSB0b0Zsb2F0KGRlZ1syXSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVnID0gdG9GbG9hdChkZWdbMF0pO1xuICAgICAgICAoY3kgPT0gbnVsbCkgJiYgKGN4ID0gY3kpO1xuICAgICAgICBpZiAoY3ggPT0gbnVsbCB8fCBjeSA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYmJveCA9IHRoaXMuZ2V0QkJveCgxKTtcbiAgICAgICAgICAgIGN4ID0gYmJveC54ICsgYmJveC53aWR0aCAvIDI7XG4gICAgICAgICAgICBjeSA9IGJib3gueSArIGJib3guaGVpZ2h0IC8gMjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl8uZGlydHlUID0gMTtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm0odGhpcy5fLnRyYW5zZm9ybS5jb25jYXQoW1tcInJcIiwgZGVnLCBjeCwgY3ldXSkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8udHJhbnNsYXRlID0gZnVuY3Rpb24gKGR4LCBkeSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBkeCA9IFN0cihkeCkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKGR4Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGR5ID0gdG9GbG9hdChkeFsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgZHggPSB0b0Zsb2F0KGR4WzBdKSB8fCAwO1xuICAgICAgICBkeSA9ICtkeSB8fCAwO1xuICAgICAgICBpZiAodGhpcy5fLmJib3gpIHtcbiAgICAgICAgICAgIHRoaXMuXy5iYm94LnggKz0gZHg7XG4gICAgICAgICAgICB0aGlzLl8uYmJveC55ICs9IGR5O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHJhbnNmb3JtKHRoaXMuXy50cmFuc2Zvcm0uY29uY2F0KFtbXCJ0XCIsIGR4LCBkeV1dKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by5zY2FsZSA9IGZ1bmN0aW9uIChzeCwgc3ksIGN4LCBjeSkge1xuICAgICAgICBpZiAodGhpcy5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBzeCA9IFN0cihzeCkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKHN4Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHN5ID0gdG9GbG9hdChzeFsxXSk7XG4gICAgICAgICAgICBjeCA9IHRvRmxvYXQoc3hbMl0pO1xuICAgICAgICAgICAgY3kgPSB0b0Zsb2F0KHN4WzNdKTtcbiAgICAgICAgICAgIGlzTmFOKGN4KSAmJiAoY3ggPSBudWxsKTtcbiAgICAgICAgICAgIGlzTmFOKGN5KSAmJiAoY3kgPSBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBzeCA9IHRvRmxvYXQoc3hbMF0pO1xuICAgICAgICAoc3kgPT0gbnVsbCkgJiYgKHN5ID0gc3gpO1xuICAgICAgICAoY3kgPT0gbnVsbCkgJiYgKGN4ID0gY3kpO1xuICAgICAgICBpZiAoY3ggPT0gbnVsbCB8fCBjeSA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYmJveCA9IHRoaXMuZ2V0QkJveCgxKTtcbiAgICAgICAgfVxuICAgICAgICBjeCA9IGN4ID09IG51bGwgPyBiYm94LnggKyBiYm94LndpZHRoIC8gMiA6IGN4O1xuICAgICAgICBjeSA9IGN5ID09IG51bGwgPyBiYm94LnkgKyBiYm94LmhlaWdodCAvIDIgOiBjeTtcbiAgICBcbiAgICAgICAgdGhpcy50cmFuc2Zvcm0odGhpcy5fLnRyYW5zZm9ybS5jb25jYXQoW1tcInNcIiwgc3gsIHN5LCBjeCwgY3ldXSkpO1xuICAgICAgICB0aGlzLl8uZGlydHlUID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICF0aGlzLnJlbW92ZWQgJiYgKHRoaXMubm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIGVscHJvdG8uc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIXRoaXMucmVtb3ZlZCAmJiAodGhpcy5ub2RlLnN0eWxlLmRpc3BsYXkgPSBFKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvLyBOZWVkZWQgdG8gZml4IHRoZSB2bWwgc2V0Vmlld0JveCBpc3N1ZXNcbiAgICBlbHByb3RvLmF1eEdldEJCb3ggPSBSLmVsLmdldEJCb3g7XG4gICAgZWxwcm90by5nZXRCQm94ID0gZnVuY3Rpb24oKXtcbiAgICAgIHZhciBiID0gdGhpcy5hdXhHZXRCQm94KCk7XG4gICAgICBpZiAodGhpcy5wYXBlciAmJiB0aGlzLnBhcGVyLl92aWV3Qm94U2hpZnQpXG4gICAgICB7XG4gICAgICAgIHZhciBjID0ge307XG4gICAgICAgIHZhciB6ID0gMS90aGlzLnBhcGVyLl92aWV3Qm94U2hpZnQuc2NhbGU7XG4gICAgICAgIGMueCA9IGIueCAtIHRoaXMucGFwZXIuX3ZpZXdCb3hTaGlmdC5keDtcbiAgICAgICAgYy54ICo9IHo7XG4gICAgICAgIGMueSA9IGIueSAtIHRoaXMucGFwZXIuX3ZpZXdCb3hTaGlmdC5keTtcbiAgICAgICAgYy55ICo9IHo7XG4gICAgICAgIGMud2lkdGggID0gYi53aWR0aCAgKiB6O1xuICAgICAgICBjLmhlaWdodCA9IGIuaGVpZ2h0ICogejtcbiAgICAgICAgYy54MiA9IGMueCArIGMud2lkdGg7XG4gICAgICAgIGMueTIgPSBjLnkgKyBjLmhlaWdodDtcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgICB9XG4gICAgICByZXR1cm4gYjtcbiAgICB9O1xuICAgIGVscHJvdG8uX2dldEJCb3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogdGhpcy5YICsgKHRoaXMuYmJ4IHx8IDApIC0gdGhpcy5XIC8gMixcbiAgICAgICAgICAgIHk6IHRoaXMuWSAtIHRoaXMuSCxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLlcsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuSFxuICAgICAgICB9O1xuICAgIH07XG4gICAgZWxwcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQgfHwgIXRoaXMubm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wYXBlci5fX3NldF9fICYmIHRoaXMucGFwZXIuX19zZXRfXy5leGNsdWRlKHRoaXMpO1xuICAgICAgICBSLmV2ZS51bmJpbmQoXCJyYXBoYWVsLiouKi5cIiArIHRoaXMuaWQpO1xuICAgICAgICBSLl90ZWFyKHRoaXMsIHRoaXMucGFwZXIpO1xuICAgICAgICB0aGlzLm5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLnNoYXBlICYmIHRoaXMuc2hhcGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnNoYXBlKTtcbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW2ldID0gdHlwZW9mIHRoaXNbaV0gPT0gXCJmdW5jdGlvblwiID8gUi5fcmVtb3ZlZEZhY3RvcnkoaSkgOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlZCA9IHRydWU7XG4gICAgfTtcbiAgICBlbHByb3RvLmF0dHIgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgYSBpbiB0aGlzLmF0dHJzKSBpZiAodGhpcy5hdHRyc1toYXNdKGEpKSB7XG4gICAgICAgICAgICAgICAgcmVzW2FdID0gdGhpcy5hdHRyc1thXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5ncmFkaWVudCAmJiByZXMuZmlsbCA9PSBcIm5vbmVcIiAmJiAocmVzLmZpbGwgPSByZXMuZ3JhZGllbnQpICYmIGRlbGV0ZSByZXMuZ3JhZGllbnQ7XG4gICAgICAgICAgICByZXMudHJhbnNmb3JtID0gdGhpcy5fLnRyYW5zZm9ybTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgUi5pcyhuYW1lLCBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT0gZmlsbFN0cmluZyAmJiB0aGlzLmF0dHJzLmZpbGwgPT0gXCJub25lXCIgJiYgdGhpcy5hdHRycy5ncmFkaWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmF0dHJzLmdyYWRpZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgICAgIG91dCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiB0aGlzLmF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtuYW1lXSA9IHRoaXMuYXR0cnNbbmFtZV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChSLmlzKHRoaXMucGFwZXIuY3VzdG9tQXR0cmlidXRlc1tuYW1lXSwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRbbmFtZV0gPSB0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbbmFtZV0uZGVmO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFtuYW1lXSA9IFIuX2F2YWlsYWJsZUF0dHJzW25hbWVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpaSAtIDEgPyBvdXQgOiBvdXRbbmFtZXNbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmF0dHJzICYmIHZhbHVlID09IG51bGwgJiYgUi5pcyhuYW1lLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBvdXQgPSB7fTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb3V0W25hbWVbaV1dID0gdGhpcy5hdHRyKG5hbWVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyYW1zO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyYW1zID0ge307XG4gICAgICAgICAgICBwYXJhbXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9PSBudWxsICYmIFIuaXMobmFtZSwgXCJvYmplY3RcIikgJiYgKHBhcmFtcyA9IG5hbWUpO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICBldmUoXCJyYXBoYWVsLmF0dHIuXCIgKyBrZXkgKyBcIi5cIiArIHRoaXMuaWQsIHRoaXMsIHBhcmFtc1trZXldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyYW1zKSB7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiB0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXMpIGlmICh0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNbaGFzXShrZXkpICYmIHBhcmFtc1toYXNdKGtleSkgJiYgUi5pcyh0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNba2V5XSwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgICAgIHZhciBwYXIgPSB0aGlzLnBhcGVyLmN1c3RvbUF0dHJpYnV0ZXNba2V5XS5hcHBseSh0aGlzLCBbXS5jb25jYXQocGFyYW1zW2tleV0pKTtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJzW2tleV0gPSBwYXJhbXNba2V5XTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzdWJrZXkgaW4gcGFyKSBpZiAocGFyW2hhc10oc3Via2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbc3Via2V5XSA9IHBhcltzdWJrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRoaXMucGFwZXIuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGlmIChwYXJhbXMudGV4dCAmJiB0aGlzLnR5cGUgPT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHRwYXRoLnN0cmluZyA9IHBhcmFtcy50ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0RmlsbEFuZFN0cm9rZSh0aGlzLCBwYXJhbXMpO1xuICAgICAgICAgICAgLy8gdGhpcy5wYXBlci5jYW52YXMuc3R5bGUuZGlzcGxheSA9IEU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLnRvRnJvbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICF0aGlzLnJlbW92ZWQgJiYgdGhpcy5ub2RlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKTtcbiAgICAgICAgdGhpcy5wYXBlciAmJiB0aGlzLnBhcGVyLnRvcCAhPSB0aGlzICYmIFIuX3RvZnJvbnQodGhpcywgdGhpcy5wYXBlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgZWxwcm90by50b0JhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm5vZGUucGFyZW50Tm9kZS5maXJzdENoaWxkICE9IHRoaXMubm9kZSkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMubm9kZSwgdGhpcy5ub2RlLnBhcmVudE5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICBSLl90b2JhY2sodGhpcywgdGhpcy5wYXBlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLmluc2VydEFmdGVyID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQuY29uc3RydWN0b3IgPT0gUi5zdC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgZWxlbWVudCA9IGVsZW1lbnRbZWxlbWVudC5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxlbWVudC5ub2RlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5ub2RlLCBlbGVtZW50Lm5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5ub2RlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBSLl9pbnNlcnRhZnRlcih0aGlzLCBlbGVtZW50LCB0aGlzLnBhcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLmluc2VydEJlZm9yZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtZW50LmNvbnN0cnVjdG9yID09IFIuc3QuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50WzBdO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLm5vZGUsIGVsZW1lbnQubm9kZSk7XG4gICAgICAgIFIuX2luc2VydGJlZm9yZSh0aGlzLCBlbGVtZW50LCB0aGlzLnBhcGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBlbHByb3RvLmJsdXIgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICAgICAgICB2YXIgcyA9IHRoaXMubm9kZS5ydW50aW1lU3R5bGUsXG4gICAgICAgICAgICBmID0gcy5maWx0ZXI7XG4gICAgICAgIGYgPSBmLnJlcGxhY2UoYmx1cnJlZ2V4cCwgRSk7XG4gICAgICAgIGlmICgrc2l6ZSAhPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5hdHRycy5ibHVyID0gc2l6ZTtcbiAgICAgICAgICAgIHMuZmlsdGVyID0gZiArIFMgKyBtcyArIFwiLkJsdXIocGl4ZWxyYWRpdXM9XCIgKyAoK3NpemUgfHwgMS41KSArIFwiKVwiO1xuICAgICAgICAgICAgcy5tYXJnaW4gPSBSLmZvcm1hdChcIi17MH1weCAwIDAgLXswfXB4XCIsIHJvdW5kKCtzaXplIHx8IDEuNSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcy5maWx0ZXIgPSBmO1xuICAgICAgICAgICAgcy5tYXJnaW4gPSAwO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuYXR0cnMuYmx1cjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgUi5fZW5naW5lLnBhdGggPSBmdW5jdGlvbiAocGF0aFN0cmluZywgdm1sKSB7XG4gICAgICAgIHZhciBlbCA9IGNyZWF0ZU5vZGUoXCJzaGFwZVwiKTtcbiAgICAgICAgZWwuc3R5bGUuY3NzVGV4dCA9IGNzc0RvdDtcbiAgICAgICAgZWwuY29vcmRzaXplID0gem9vbSArIFMgKyB6b29tO1xuICAgICAgICBlbC5jb29yZG9yaWdpbiA9IHZtbC5jb29yZG9yaWdpbjtcbiAgICAgICAgdmFyIHAgPSBuZXcgRWxlbWVudChlbCwgdm1sKSxcbiAgICAgICAgICAgIGF0dHIgPSB7ZmlsbDogXCJub25lXCIsIHN0cm9rZTogXCIjMDAwXCJ9O1xuICAgICAgICBwYXRoU3RyaW5nICYmIChhdHRyLnBhdGggPSBwYXRoU3RyaW5nKTtcbiAgICAgICAgcC50eXBlID0gXCJwYXRoXCI7XG4gICAgICAgIHAucGF0aCA9IFtdO1xuICAgICAgICBwLlBhdGggPSBFO1xuICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHAsIGF0dHIpO1xuICAgICAgICB2bWwuY2FudmFzLmFwcGVuZENoaWxkKGVsKTtcbiAgICAgICAgdmFyIHNrZXcgPSBjcmVhdGVOb2RlKFwic2tld1wiKTtcbiAgICAgICAgc2tldy5vbiA9IHRydWU7XG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNrZXcpO1xuICAgICAgICBwLnNrZXcgPSBza2V3O1xuICAgICAgICBwLnRyYW5zZm9ybShFKTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUucmVjdCA9IGZ1bmN0aW9uICh2bWwsIHgsIHksIHcsIGgsIHIpIHtcbiAgICAgICAgdmFyIHBhdGggPSBSLl9yZWN0UGF0aCh4LCB5LCB3LCBoLCByKSxcbiAgICAgICAgICAgIHJlcyA9IHZtbC5wYXRoKHBhdGgpLFxuICAgICAgICAgICAgYSA9IHJlcy5hdHRycztcbiAgICAgICAgcmVzLlggPSBhLnggPSB4O1xuICAgICAgICByZXMuWSA9IGEueSA9IHk7XG4gICAgICAgIHJlcy5XID0gYS53aWR0aCA9IHc7XG4gICAgICAgIHJlcy5IID0gYS5oZWlnaHQgPSBoO1xuICAgICAgICBhLnIgPSByO1xuICAgICAgICBhLnBhdGggPSBwYXRoO1xuICAgICAgICByZXMudHlwZSA9IFwicmVjdFwiO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5fZW5naW5lLmVsbGlwc2UgPSBmdW5jdGlvbiAodm1sLCB4LCB5LCByeCwgcnkpIHtcbiAgICAgICAgdmFyIHJlcyA9IHZtbC5wYXRoKCksXG4gICAgICAgICAgICBhID0gcmVzLmF0dHJzO1xuICAgICAgICByZXMuWCA9IHggLSByeDtcbiAgICAgICAgcmVzLlkgPSB5IC0gcnk7XG4gICAgICAgIHJlcy5XID0gcnggKiAyO1xuICAgICAgICByZXMuSCA9IHJ5ICogMjtcbiAgICAgICAgcmVzLnR5cGUgPSBcImVsbGlwc2VcIjtcbiAgICAgICAgc2V0RmlsbEFuZFN0cm9rZShyZXMsIHtcbiAgICAgICAgICAgIGN4OiB4LFxuICAgICAgICAgICAgY3k6IHksXG4gICAgICAgICAgICByeDogcngsXG4gICAgICAgICAgICByeTogcnlcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuY2lyY2xlID0gZnVuY3Rpb24gKHZtbCwgeCwgeSwgcikge1xuICAgICAgICB2YXIgcmVzID0gdm1sLnBhdGgoKSxcbiAgICAgICAgICAgIGEgPSByZXMuYXR0cnM7XG4gICAgICAgIHJlcy5YID0geCAtIHI7XG4gICAgICAgIHJlcy5ZID0geSAtIHI7XG4gICAgICAgIHJlcy5XID0gcmVzLkggPSByICogMjtcbiAgICAgICAgcmVzLnR5cGUgPSBcImNpcmNsZVwiO1xuICAgICAgICBzZXRGaWxsQW5kU3Ryb2tlKHJlcywge1xuICAgICAgICAgICAgY3g6IHgsXG4gICAgICAgICAgICBjeTogeSxcbiAgICAgICAgICAgIHI6IHJcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUuaW1hZ2UgPSBmdW5jdGlvbiAodm1sLCBzcmMsIHgsIHksIHcsIGgpIHtcbiAgICAgICAgdmFyIHBhdGggPSBSLl9yZWN0UGF0aCh4LCB5LCB3LCBoKSxcbiAgICAgICAgICAgIHJlcyA9IHZtbC5wYXRoKHBhdGgpLmF0dHIoe3N0cm9rZTogXCJub25lXCJ9KSxcbiAgICAgICAgICAgIGEgPSByZXMuYXR0cnMsXG4gICAgICAgICAgICBub2RlID0gcmVzLm5vZGUsXG4gICAgICAgICAgICBmaWxsID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShmaWxsU3RyaW5nKVswXTtcbiAgICAgICAgYS5zcmMgPSBzcmM7XG4gICAgICAgIHJlcy5YID0gYS54ID0geDtcbiAgICAgICAgcmVzLlkgPSBhLnkgPSB5O1xuICAgICAgICByZXMuVyA9IGEud2lkdGggPSB3O1xuICAgICAgICByZXMuSCA9IGEuaGVpZ2h0ID0gaDtcbiAgICAgICAgYS5wYXRoID0gcGF0aDtcbiAgICAgICAgcmVzLnR5cGUgPSBcImltYWdlXCI7XG4gICAgICAgIGZpbGwucGFyZW50Tm9kZSA9PSBub2RlICYmIG5vZGUucmVtb3ZlQ2hpbGQoZmlsbCk7XG4gICAgICAgIGZpbGwucm90YXRlID0gdHJ1ZTtcbiAgICAgICAgZmlsbC5zcmMgPSBzcmM7XG4gICAgICAgIGZpbGwudHlwZSA9IFwidGlsZVwiO1xuICAgICAgICByZXMuXy5maWxscG9zID0gW3gsIHldO1xuICAgICAgICByZXMuXy5maWxsc2l6ZSA9IFt3LCBoXTtcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChmaWxsKTtcbiAgICAgICAgc2V0Q29vcmRzKHJlcywgMSwgMSwgMCwgMCwgMCk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICBSLl9lbmdpbmUudGV4dCA9IGZ1bmN0aW9uICh2bWwsIHgsIHksIHRleHQpIHtcbiAgICAgICAgdmFyIGVsID0gY3JlYXRlTm9kZShcInNoYXBlXCIpLFxuICAgICAgICAgICAgcGF0aCA9IGNyZWF0ZU5vZGUoXCJwYXRoXCIpLFxuICAgICAgICAgICAgbyA9IGNyZWF0ZU5vZGUoXCJ0ZXh0cGF0aFwiKTtcbiAgICAgICAgeCA9IHggfHwgMDtcbiAgICAgICAgeSA9IHkgfHwgMDtcbiAgICAgICAgdGV4dCA9IHRleHQgfHwgXCJcIjtcbiAgICAgICAgcGF0aC52ID0gUi5mb3JtYXQoXCJtezB9LHsxfWx7Mn0sezF9XCIsIHJvdW5kKHggKiB6b29tKSwgcm91bmQoeSAqIHpvb20pLCByb3VuZCh4ICogem9vbSkgKyAxKTtcbiAgICAgICAgcGF0aC50ZXh0cGF0aG9rID0gdHJ1ZTtcbiAgICAgICAgby5zdHJpbmcgPSBTdHIodGV4dCk7XG4gICAgICAgIG8ub24gPSB0cnVlO1xuICAgICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gY3NzRG90O1xuICAgICAgICBlbC5jb29yZHNpemUgPSB6b29tICsgUyArIHpvb207XG4gICAgICAgIGVsLmNvb3Jkb3JpZ2luID0gXCIwIDBcIjtcbiAgICAgICAgdmFyIHAgPSBuZXcgRWxlbWVudChlbCwgdm1sKSxcbiAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgZmlsbDogXCIjMDAwXCIsXG4gICAgICAgICAgICAgICAgc3Ryb2tlOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgICBmb250OiBSLl9hdmFpbGFibGVBdHRycy5mb250LFxuICAgICAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIHAuc2hhcGUgPSBlbDtcbiAgICAgICAgcC5wYXRoID0gcGF0aDtcbiAgICAgICAgcC50ZXh0cGF0aCA9IG87XG4gICAgICAgIHAudHlwZSA9IFwidGV4dFwiO1xuICAgICAgICBwLmF0dHJzLnRleHQgPSBTdHIodGV4dCk7XG4gICAgICAgIHAuYXR0cnMueCA9IHg7XG4gICAgICAgIHAuYXR0cnMueSA9IHk7XG4gICAgICAgIHAuYXR0cnMudyA9IDE7XG4gICAgICAgIHAuYXR0cnMuaCA9IDE7XG4gICAgICAgIHNldEZpbGxBbmRTdHJva2UocCwgYXR0cik7XG4gICAgICAgIGVsLmFwcGVuZENoaWxkKG8pO1xuICAgICAgICBlbC5hcHBlbmRDaGlsZChwYXRoKTtcbiAgICAgICAgdm1sLmNhbnZhcy5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgIHZhciBza2V3ID0gY3JlYXRlTm9kZShcInNrZXdcIik7XG4gICAgICAgIHNrZXcub24gPSB0cnVlO1xuICAgICAgICBlbC5hcHBlbmRDaGlsZChza2V3KTtcbiAgICAgICAgcC5za2V3ID0gc2tldztcbiAgICAgICAgcC50cmFuc2Zvcm0oRSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG4gICAgUi5fZW5naW5lLnNldFNpemUgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgY3MgPSB0aGlzLmNhbnZhcy5zdHlsZTtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgd2lkdGggPT0gK3dpZHRoICYmICh3aWR0aCArPSBcInB4XCIpO1xuICAgICAgICBoZWlnaHQgPT0gK2hlaWdodCAmJiAoaGVpZ2h0ICs9IFwicHhcIik7XG4gICAgICAgIGNzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgY3MuY2xpcCA9IFwicmVjdCgwIFwiICsgd2lkdGggKyBcIiBcIiArIGhlaWdodCArIFwiIDApXCI7XG4gICAgICAgIGlmICh0aGlzLl92aWV3Qm94KSB7XG4gICAgICAgICAgICBSLl9lbmdpbmUuc2V0Vmlld0JveC5hcHBseSh0aGlzLCB0aGlzLl92aWV3Qm94KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFIuX2VuZ2luZS5zZXRWaWV3Qm94ID0gZnVuY3Rpb24gKHgsIHksIHcsIGgsIGZpdCkge1xuICAgICAgICBSLmV2ZShcInJhcGhhZWwuc2V0Vmlld0JveFwiLCB0aGlzLCB0aGlzLl92aWV3Qm94LCBbeCwgeSwgdywgaCwgZml0XSk7XG4gICAgICAgIHZhciBwYXBlclNpemUgPSB0aGlzLmdldFNpemUoKSxcbiAgICAgICAgICAgIHdpZHRoID0gcGFwZXJTaXplLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0ID0gcGFwZXJTaXplLmhlaWdodCxcbiAgICAgICAgICAgIEgsIFc7XG4gICAgICAgIGlmIChmaXQpIHtcbiAgICAgICAgICAgIEggPSBoZWlnaHQgLyBoO1xuICAgICAgICAgICAgVyA9IHdpZHRoIC8gdztcbiAgICAgICAgICAgIGlmICh3ICogSCA8IHdpZHRoKSB7XG4gICAgICAgICAgICAgICAgeCAtPSAod2lkdGggLSB3ICogSCkgLyAyIC8gSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoICogVyA8IGhlaWdodCkge1xuICAgICAgICAgICAgICAgIHkgLT0gKGhlaWdodCAtIGggKiBXKSAvIDIgLyBXO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3ZpZXdCb3ggPSBbeCwgeSwgdywgaCwgISFmaXRdO1xuICAgICAgICB0aGlzLl92aWV3Qm94U2hpZnQgPSB7XG4gICAgICAgICAgICBkeDogLXgsXG4gICAgICAgICAgICBkeTogLXksXG4gICAgICAgICAgICBzY2FsZTogcGFwZXJTaXplXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGVsLnRyYW5zZm9ybShcIi4uLlwiKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgdmFyIGNyZWF0ZU5vZGU7XG4gICAgUi5fZW5naW5lLmluaXRXaW4gPSBmdW5jdGlvbiAod2luKSB7XG4gICAgICAgICAgICB2YXIgZG9jID0gd2luLmRvY3VtZW50O1xuICAgICAgICAgICAgaWYgKGRvYy5zdHlsZVNoZWV0cy5sZW5ndGggPCAzMSkge1xuICAgICAgICAgICAgICAgIGRvYy5jcmVhdGVTdHlsZVNoZWV0KCkuYWRkUnVsZShcIi5ydm1sXCIsIFwiYmVoYXZpb3I6dXJsKCNkZWZhdWx0I1ZNTClcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG5vIG1vcmUgcm9vbSwgYWRkIHRvIHRoZSBleGlzdGluZyBvbmVcbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzExOTQlMjhWUy44NSUyOS5hc3B4XG4gICAgICAgICAgICAgICAgZG9jLnN0eWxlU2hlZXRzWzBdLmFkZFJ1bGUoXCIucnZtbFwiLCBcImJlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAhZG9jLm5hbWVzcGFjZXMucnZtbCAmJiBkb2MubmFtZXNwYWNlcy5hZGQoXCJydm1sXCIsIFwidXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp2bWxcIik7XG4gICAgICAgICAgICAgICAgY3JlYXRlTm9kZSA9IGZ1bmN0aW9uICh0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2MuY3JlYXRlRWxlbWVudCgnPHJ2bWw6JyArIHRhZ05hbWUgKyAnIGNsYXNzPVwicnZtbFwiPicpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlTm9kZSA9IGZ1bmN0aW9uICh0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2MuY3JlYXRlRWxlbWVudCgnPCcgKyB0YWdOYW1lICsgJyB4bWxucz1cInVybjpzY2hlbWFzLW1pY3Jvc29mdC5jb206dm1sXCIgY2xhc3M9XCJydm1sXCI+Jyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBSLl9lbmdpbmUuaW5pdFdpbihSLl9nLndpbik7XG4gICAgUi5fZW5naW5lLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbiA9IFIuX2dldENvbnRhaW5lci5hcHBseSgwLCBhcmd1bWVudHMpLFxuICAgICAgICAgICAgY29udGFpbmVyID0gY29uLmNvbnRhaW5lcixcbiAgICAgICAgICAgIGhlaWdodCA9IGNvbi5oZWlnaHQsXG4gICAgICAgICAgICBzLFxuICAgICAgICAgICAgd2lkdGggPSBjb24ud2lkdGgsXG4gICAgICAgICAgICB4ID0gY29uLngsXG4gICAgICAgICAgICB5ID0gY29uLnk7XG4gICAgICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWTUwgY29udGFpbmVyIG5vdCBmb3VuZC5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlcyA9IG5ldyBSLl9QYXBlcixcbiAgICAgICAgICAgIGMgPSByZXMuY2FudmFzID0gUi5fZy5kb2MuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcbiAgICAgICAgICAgIGNzID0gYy5zdHlsZTtcbiAgICAgICAgeCA9IHggfHwgMDtcbiAgICAgICAgeSA9IHkgfHwgMDtcbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA1MTI7XG4gICAgICAgIGhlaWdodCA9IGhlaWdodCB8fCAzNDI7XG4gICAgICAgIHJlcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICByZXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB3aWR0aCA9PSArd2lkdGggJiYgKHdpZHRoICs9IFwicHhcIik7XG4gICAgICAgIGhlaWdodCA9PSAraGVpZ2h0ICYmIChoZWlnaHQgKz0gXCJweFwiKTtcbiAgICAgICAgcmVzLmNvb3Jkc2l6ZSA9IHpvb20gKiAxZTMgKyBTICsgem9vbSAqIDFlMztcbiAgICAgICAgcmVzLmNvb3Jkb3JpZ2luID0gXCIwIDBcIjtcbiAgICAgICAgcmVzLnNwYW4gPSBSLl9nLmRvYy5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgcmVzLnNwYW4uc3R5bGUuY3NzVGV4dCA9IFwicG9zaXRpb246YWJzb2x1dGU7bGVmdDotOTk5OWVtO3RvcDotOTk5OWVtO3BhZGRpbmc6MDttYXJnaW46MDtsaW5lLWhlaWdodDoxO1wiO1xuICAgICAgICBjLmFwcGVuZENoaWxkKHJlcy5zcGFuKTtcbiAgICAgICAgY3MuY3NzVGV4dCA9IFIuZm9ybWF0KFwidG9wOjA7bGVmdDowO3dpZHRoOnswfTtoZWlnaHQ6ezF9O2Rpc3BsYXk6aW5saW5lLWJsb2NrO3Bvc2l0aW9uOnJlbGF0aXZlO2NsaXA6cmVjdCgwIHswfSB7MX0gMCk7b3ZlcmZsb3c6aGlkZGVuXCIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBpZiAoY29udGFpbmVyID09IDEpIHtcbiAgICAgICAgICAgIFIuX2cuZG9jLmJvZHkuYXBwZW5kQ2hpbGQoYyk7XG4gICAgICAgICAgICBjcy5sZWZ0ID0geCArIFwicHhcIjtcbiAgICAgICAgICAgIGNzLnRvcCA9IHkgKyBcInB4XCI7XG4gICAgICAgICAgICBjcy5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjb250YWluZXIuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoYywgY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnJlbmRlcmZpeCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgUi5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFIuZXZlKFwicmFwaGFlbC5jbGVhclwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5jYW52YXMuaW5uZXJIVE1MID0gRTtcbiAgICAgICAgdGhpcy5zcGFuID0gUi5fZy5kb2MuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuc3Bhbi5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi05OTk5ZW07dG9wOi05OTk5ZW07cGFkZGluZzowO21hcmdpbjowO2xpbmUtaGVpZ2h0OjE7ZGlzcGxheTppbmxpbmU7XCI7XG4gICAgICAgIHRoaXMuY2FudmFzLmFwcGVuZENoaWxkKHRoaXMuc3Bhbik7XG4gICAgICAgIHRoaXMuYm90dG9tID0gdGhpcy50b3AgPSBudWxsO1xuICAgIH07XG4gICAgUi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBSLmV2ZShcInJhcGhhZWwucmVtb3ZlXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuY2FudmFzKTtcbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW2ldID0gdHlwZW9mIHRoaXNbaV0gPT0gXCJmdW5jdGlvblwiID8gUi5fcmVtb3ZlZEZhY3RvcnkoaSkgOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICB2YXIgc2V0cHJvdG8gPSBSLnN0O1xuICAgIGZvciAodmFyIG1ldGhvZCBpbiBlbHByb3RvKSBpZiAoZWxwcm90b1toYXNdKG1ldGhvZCkgJiYgIXNldHByb3RvW2hhc10obWV0aG9kKSkge1xuICAgICAgICBzZXRwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uIChtZXRob2RuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxbbWV0aG9kbmFtZV0uYXBwbHkoZWwsIGFyZyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShtZXRob2QpO1xuICAgIH1cbn0pKCk7XG5cbiAgICAvLyBFWFBPU0VcbiAgICAvLyBTVkcgYW5kIFZNTCBhcmUgYXBwZW5kZWQganVzdCBiZWZvcmUgdGhlIEVYUE9TRSBsaW5lXG4gICAgLy8gRXZlbiB3aXRoIEFNRCwgUmFwaGFlbCBzaG91bGQgYmUgZGVmaW5lZCBnbG9iYWxseVxuICAgIG9sZFJhcGhhZWwud2FzID8gKGcud2luLlJhcGhhZWwgPSBSKSA6IChSYXBoYWVsID0gUik7XG5cbiAgICBpZih0eXBlb2YgZXhwb3J0cyA9PSBcIm9iamVjdFwiKXtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBSO1xuICAgIH1cbiAgICByZXR1cm4gUjtcbn0pKTtcbiIsIlBvbHltZXJcbiAgaXM6ICd0ZXh0LWZsb3ctbGluZSdcblxuICBwcm9wZXJ0aWVzOlxuICAgIGluZGVudDpcbiAgICAgIHR5cGU6IE51bWJlclxuICAgICAgdmFsdWU6IDBcblxuICByZWFkeTogKCkgLT5cblxuICBnZXRPZmZzZXRSZWN0OiAoKSAtPlxuICAgIEBnZXRDb250ZW50Q2hpbGRyZW4oKVxuICAgICAgLm1hcCAoY2hpbGQpIC0+IGNoaWxkLmdldE9mZnNldFJlY3QoKVxuICAgICAgLnJlZHVjZSAoZGltZW5zaW9ucywgb2Zmc2V0cykgLT5cbiAgICAgICAgd2lkdGg6IGRpbWVuc2lvbnMud2lkdGggKyBvZmZzZXRzLndpZHRoXG4gICAgICAgIGhlaWdodDogTWF0aC5tYXggb2Zmc2V0cy5oZWlnaHQsIGRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgICAgIGxlZnQ6IGRpbWVuc2lvbnMubGVmdFxuICAgICAgICB0b3A6IGRpbWVuc2lvbnMudG9wXG5cbiAgX3RhYlN0eWxlOiAoaW5kZW50KSAtPlxuICAgIFwid2lkdGg6ICN7MjAgKiBpbmRlbnR9cHg7XCIgK1xuICAgIFwiZGlzcGxheTogaW5saW5lLWJsb2NrO1wiIiwiUG9seW1lclxuICBpczogJ3RleHQtZmxvdy1waWVjZSdcblxuICBwcm9wZXJ0aWVzOlxuICAgIG5vZGVJZDpcbiAgICAgIHR5cGU6IFN0cmluZ1xuICAgICAgdmFsdWU6ICcnXG5cbiAgbGlzdGVuZXJzOlxuICAgICd1cCc6ICdfb25VcCdcblxuICBnZXRPZmZzZXRSZWN0OiAoKSAtPlxuICAgIHdpZHRoOiBAb2Zmc2V0V2lkdGhcbiAgICBoZWlnaHQ6IEBvZmZzZXRIZWlnaHRcbiAgICBsZWZ0OiBAb2Zmc2V0TGVmdFxuICAgIHRvcDogQG9mZnNldFRvcFxuXG5cbiAgX29uVXA6ICgpIC0+XG4gICAgQGZpcmUgJ3NlbGVjdCcsXG4gICAgICBub2RlSWQ6IEBub2RlSWQiLCJSYXBoYWVsID0gcmVxdWlyZSAncmFwaGFlbCdcbnJlcXVpcmUgJ3RleHQtZmxvdy1saW5lJ1xucmVxdWlyZSAndGV4dC1mbG93LXBpZWNlJ1xuXG5Qb2x5bWVyXG4gIGlzOiAndGV4dC1mbG93J1xuXG4gIHByb3BlcnRpZXM6XG4gICAgIyMjXG4gICAgU2V0IHRvIGB0cnVlYCB0byBhdXRvbWF0aWNhbGx5IGRyYXcgYSByYWdnZWQgYmFja2dyb3VuZC5cbiAgICAjIyNcbiAgICBkcmF3QmFja2dyb3VuZDpcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICAgIHZhbHVlOiBmYWxzZVxuXG4gIGNyZWF0ZWQ6ICgpIC0+XG5cbiAgcmVhZHk6ICgpIC0+XG4gICAgQF9tdXRhdGlvbkNhbGxiYWNrcyA9IFtdXG4gICAgbXV0T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlciAocmVjb3JkcykgPT5cbiAgICAgIEBfbXV0YXRpb25DYWxsYmFja3MuZm9yRWFjaCAoY2IpIC0+XG4gICAgICAgIGNiIHJlY29yZHNcbiAgICAgIEBfbXV0YXRpb25DYWxsYmFja3MgPSBbXVxuICAgICAgZG8gQHVwZGF0ZUNoaWxkcmVuXG4gICAgbXV0T2JzZXJ2ZXIub2JzZXJ2ZSBAJC5ib2R5LCBjaGlsZExpc3Q6IHRydWVcbiAgICBAX3BhcGVyID0gUmFwaGFlbCBAJC5jYW52YXMsIEAkLmJvZHkub2Zmc2V0V2lkdGgsIEAkLmJvZHkub2Zmc2V0SGVpZ2h0XG5cbiAgICBAX3NoYXBlcyA9IHt9XG4gICAgQF9zaGFwZXMuaGlnaGxpZ2h0cyA9IHt9XG5cbiAgYXR0YWNoZWQ6ICgpIC0+XG4gICAgQGFzeW5jICgpID0+XG4gICAgICBAX3BhcGVyLnNldFNpemUgQCQuYm9keS5vZmZzZXRXaWR0aCwgQCQuYm9keS5vZmZzZXRIZWlnaHRcblxuICB1cGRhdGVDaGlsZHJlbjogKCkgLT5cbiAgICBkbyBAYXR0YWNoZWRcbiAgICBpZiBAZHJhd0JhY2tncm91bmRcbiAgICAgIGRvIEBfZHJhd0JhY2tncm91bmRcblxuICAjIyNcbiAgQHJldHVybiBBbGwgYHRleHQtZmxvdy1waWVjZWAgZWxlbWVudHMgd2l0aCB0aGUgc3BlY2lmaWVkIG5vZGUgSUQuXG4gICMjI1xuICBnZXRQaWVjZXNGb3JOb2RlOiAobm9kZUlkKSAtPlxuICAgIEBnZXRDb250ZW50Q2hpbGRyZW4oKVxuICAgICAgLm1hcCAoZWxtKSAtPlxuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCBlbG0ucXVlcnlTZWxlY3RvckFsbCAndGV4dC1mbG93LXBpZWNlJ1xuICAgICAgLnJlZHVjZSAoYWNjLCBlbG0pIC0+XG4gICAgICAgIGFjYy5jb25jYXQgZWxtXG4gICAgICAuZmlsdGVyIChwYykgLT5cbiAgICAgICAgcGMubm9kZUlkXG4gICAgICAgICAgLnNwbGl0IC9cXHMvXG4gICAgICAgICAgLmZpbHRlciAoaWQpIC0+IGlkIGlzIG5vZGVJZFxuICAgICAgICAgIC5sZW5ndGggPiAwXG5cbiAgaGlnaGxpZ2h0Tm9kZTogKG5vZGVJZCwgYXR0cnMpIC0+XG4gICAgcmVjdHMgPVxuICAgICAgKEBnZXRQaWVjZXNGb3JOb2RlIG5vZGVJZClcbiAgICAgICAgLm1hcCAocGMpIC0+IHBjLmdldE9mZnNldFJlY3QoKVxuICAgIEBfc2hhcGVzLmhpZ2hsaWdodHNbbm9kZUlkXSA9IEBfZHJhd1JlY3RzIEBfcGFwZXIsIGF0dHJzLCByZWN0c1xuXG4gICAgcmV0dXJuICgpID0+IEBfc2hhcGVzLmhpZ2hsaWdodHNbbm9kZUlkXS5mb3JFYWNoIChzaGFwZSkgLT4gc2hhcGUucmVtb3ZlKClcblxuICAjIyNcbiAgUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBvbiB0aGUgbmV4dCBzdWNjZXNzZnVsIGNoaWxkIGFwcGVuZC5cbiAgRGVzdHJveXMgY2FsbGJhY2sgd2hlbiBpbnZva2VkLlxuXG4gIEBwYXJhbSBbRnVuY3Rpb25dIGNiIEEgZnVuY3Rpb24gdGFraW5nIGluIHRoZSBtdXRhdGlvbiByZWNvcmRzIGFzIHByb3ZpZGVkIGJ5XG4gICAgYSBNdXRhdGlvbk9ic2VydmVyLlxuICAjIyNcbiAgb25OZXh0Q2hpbGRBcHBlbmQ6IChjYikgLT5cbiAgICBAX211dGF0aW9uQ2FsbGJhY2tzLnB1c2ggY2JcblxuICBfZHJhd0JhY2tncm91bmQ6ICgpIC0+XG4gICAgaWYgQF9zaGFwZXMuYmFja2dyb3VuZD9cbiAgICAgIEBfc2hhcGVzLmJhY2tncm91bmQuZm9yRWFjaCAoc2hhcGUpIC0+IHNoYXBlLnJlbW92ZSgpXG5cbiAgICBhdHRycyA9XG4gICAgICBmaWxsOiAnI2ZjYydcbiAgICAgIHN0cm9rZTogJ25vbmUnXG4gICAgICBib3JkZXJSYWRpdXM6IDRcbiAgICByZWN0cyA9XG4gICAgICBAZ2V0Q29udGVudENoaWxkcmVuKClcbiAgICAgICAgLm1hcCAoY2hpbGQpIC0+IGNoaWxkLmdldE9mZnNldFJlY3QoKVxuXG4gICAgQF9kcmF3UmVjdHMgXFxcbiAgICAgIEBfcGFwZXIsXG4gICAgICBhdHRycyxcbiAgICAgIHJlY3RzXG5cbiAgX2RyYXdSZWN0czogKHBhcGVyLCBhdHRycywgcmVjdHMpIC0+XG4gICAgcmVjdHMubWFwIChyZWN0KSAtPlxuICAgICAgYm9yZGVyUmFkaXVzID1cbiAgICAgICAgaWYgYXR0cnMuYm9yZGVyUmFkaXVzP1xuICAgICAgICB0aGVuIGF0dHJzLmJvcmRlclJhZGl1c1xuICAgICAgICBlbHNlIDBcbiAgICAgIGVsbSA9IHBhcGVyLnJlY3QgcmVjdC5sZWZ0LCByZWN0LnRvcCwgcmVjdC53aWR0aCwgcmVjdC5oZWlnaHQsIGJvcmRlclJhZGl1c1xuICAgICAgZm9yIGF0dHIsIHZhbCBvZiBhdHRyc1xuICAgICAgICBlbG0uYXR0ciBhdHRyLCB2YWxcbiAgICAgIHJldHVybiBlbG0iXX0=
