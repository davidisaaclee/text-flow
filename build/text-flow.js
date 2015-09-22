(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var TreeView, getMatchesFunction;

getMatchesFunction = function(element) {
  var fn;
  fn = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.msMatchesSelector || element.oMatchesSelector;
  if (fn != null) {
    return function() {
      return fn.apply(element, arguments);
    };
  } else {
    return console.error('No `matches` method in element ', element);
  }
};

TreeView = Polymer({
  is: 'tree-view',
  properties: {
    model: {
      type: Object
    }
  },

  /*
  @param [TreeModel] model The `TreeModel` to populate this view.
  
  The `value` of `model` and its children should take the form
  
     * creates a new instance of this node's view
    instantiate: () -> HTMLElement
     * given an instance of this node's view, return the element where this
     *   node's children should be inserted into.
    getChildrenInsertPoint: HTMLElement -> HTMLElement
   */
  factoryImpl: function(model) {
    this.instance = null;
    return this.update(model);
  },

  /*
  Fills this view with the model's subviews.
   */
  fill: function() {
    var insertionPt;
    this.instance = this.model.value.instantiate();
    if (this.model.orderedChildrenKeys.length === 0) {
      return this.instance;
    }
    insertionPt = this.model.value.getChildrenInsertPoint(this.instance);
    if (insertionPt != null) {
      this.model.orderedChildrenKeys.forEach((function(_this) {
        return function(key) {
          var child;
          child = new TreeView(_this.model.getChild(key));
          return insertionPt.appendChild(child);
        };
      })(this));
    }
    return this.instance;
  },
  update: function(model) {
    this.model = model;
    this.clear();
    this.fill();
    return Polymer.dom(this.root).appendChild(this.instance);
  },

  /*
  Clears the instance of its children... and itself!
   */
  clear: function() {
    if (this.instance != null) {
      return Polymer.dom(this.root).removeChild(this.instance);
    }
  }
});


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy90ZXh0LWZsb3cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQ0EsSUFBQTs7QUFBQSxrQkFBQSxHQUFxQixTQUFDLE9BQUQ7QUFDbkIsTUFBQTtFQUFBLEVBQUEsR0FBSyxPQUFPLENBQUMsT0FBUixJQUNBLE9BQU8sQ0FBQyxxQkFEUixJQUVBLE9BQU8sQ0FBQyxrQkFGUixJQUdBLE9BQU8sQ0FBQyxpQkFIUixJQUlBLE9BQU8sQ0FBQztFQUNiLElBQUcsVUFBSDtXQUNLLFNBQUE7YUFBTSxFQUFFLENBQUMsS0FBSCxDQUFTLE9BQVQsRUFBa0IsU0FBbEI7SUFBTixFQURMO0dBQUEsTUFBQTtXQUVLLE9BQU8sQ0FBQyxLQUFSLENBQWMsaUNBQWQsRUFBaUQsT0FBakQsRUFGTDs7QUFObUI7O0FBVXJCLFFBQUEsR0FBVyxPQUFBLENBQ1Q7RUFBQSxFQUFBLEVBQUksV0FBSjtFQUVBLFVBQUEsRUFDRTtJQUFBLEtBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxNQUFOO0tBREY7R0FIRjs7QUFNQTs7Ozs7Ozs7Ozs7RUFXQSxXQUFBLEVBQWEsU0FBQyxLQUFEO0lBQ1gsSUFBQyxDQUFBLFFBQUQsR0FBWTtXQUNaLElBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjtFQUZXLENBakJiOztBQXFCQTs7O0VBR0EsSUFBQSxFQUFNLFNBQUE7QUFDSixRQUFBO0lBQUEsSUFBQyxDQUFBLFFBQUQsR0FBZSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFoQixDQUFBO0lBRVosSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE1BQTNCLEtBQXFDLENBQXhDO0FBRUUsYUFBTyxJQUFDLENBQUEsU0FGVjs7SUFJQSxXQUFBLEdBQWMsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsc0JBQWIsQ0FBb0MsSUFBQyxDQUFBLFFBQXJDO0lBRWQsSUFBRyxtQkFBSDtNQUNFLElBQUMsQ0FBQSxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBM0IsQ0FBbUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDakMsY0FBQTtVQUFBLEtBQUEsR0FBWSxJQUFBLFFBQUEsQ0FBVSxLQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsQ0FBZ0IsR0FBaEIsQ0FBVjtpQkFDWixXQUFXLENBQUMsV0FBWixDQUF3QixLQUF4QjtRQUZpQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbkMsRUFERjs7QUFLQSxXQUFPLElBQUMsQ0FBQTtFQWRKLENBeEJOO0VBd0NBLE1BQUEsRUFBUSxTQUFDLEtBQUQ7SUFDTixJQUFDLENBQUEsS0FBRCxHQUFTO0lBQ04sSUFBQyxDQUFBLEtBQUosQ0FBQTtJQUNHLElBQUMsQ0FBQSxJQUFKLENBQUE7V0FDQSxPQUFPLENBQUMsR0FBUixDQUFZLElBQUMsQ0FBQSxJQUFiLENBQWtCLENBQUMsV0FBbkIsQ0FBK0IsSUFBQyxDQUFBLFFBQWhDO0VBSk0sQ0F4Q1I7O0FBOENBOzs7RUFHQSxLQUFBLEVBQU8sU0FBQTtJQUNMLElBQUcscUJBQUg7YUFDRSxPQUFPLENBQUMsR0FBUixDQUFZLElBQUMsQ0FBQSxJQUFiLENBQWtCLENBQUMsV0FBbkIsQ0FBK0IsSUFBQyxDQUFBLFFBQWhDLEVBREY7O0VBREssQ0FqRFA7Q0FEUyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIjIGNyb3NzLWJyb3dzZXIgc3VwcG9ydCBmb3IgRWxlbWVudC5tYXRjaGVzXG5nZXRNYXRjaGVzRnVuY3Rpb24gPSAoZWxlbWVudCkgLT5cbiAgZm4gPSBlbGVtZW50Lm1hdGNoZXMgfHxcbiAgICAgICBlbGVtZW50LndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgIGVsZW1lbnQubW96TWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICAgZWxlbWVudC5tc01hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgIGVsZW1lbnQub01hdGNoZXNTZWxlY3RvclxuICBpZiBmbj9cbiAgdGhlbiAoKSAtPiBmbi5hcHBseSBlbGVtZW50LCBhcmd1bWVudHNcbiAgZWxzZSBjb25zb2xlLmVycm9yICdObyBgbWF0Y2hlc2AgbWV0aG9kIGluIGVsZW1lbnQgJywgZWxlbWVudFxuXG5UcmVlVmlldyA9IFBvbHltZXJcbiAgaXM6ICd0cmVlLXZpZXcnXG5cbiAgcHJvcGVydGllczpcbiAgICBtb2RlbDpcbiAgICAgIHR5cGU6IE9iamVjdFxuXG4gICMjI1xuICBAcGFyYW0gW1RyZWVNb2RlbF0gbW9kZWwgVGhlIGBUcmVlTW9kZWxgIHRvIHBvcHVsYXRlIHRoaXMgdmlldy5cblxuICBUaGUgYHZhbHVlYCBvZiBgbW9kZWxgIGFuZCBpdHMgY2hpbGRyZW4gc2hvdWxkIHRha2UgdGhlIGZvcm1cblxuICAgICMgY3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGlzIG5vZGUncyB2aWV3XG4gICAgaW5zdGFudGlhdGU6ICgpIC0+IEhUTUxFbGVtZW50XG4gICAgIyBnaXZlbiBhbiBpbnN0YW5jZSBvZiB0aGlzIG5vZGUncyB2aWV3LCByZXR1cm4gdGhlIGVsZW1lbnQgd2hlcmUgdGhpc1xuICAgICMgICBub2RlJ3MgY2hpbGRyZW4gc2hvdWxkIGJlIGluc2VydGVkIGludG8uXG4gICAgZ2V0Q2hpbGRyZW5JbnNlcnRQb2ludDogSFRNTEVsZW1lbnQgLT4gSFRNTEVsZW1lbnRcbiAgIyMjXG4gIGZhY3RvcnlJbXBsOiAobW9kZWwpIC0+XG4gICAgQGluc3RhbmNlID0gbnVsbFxuICAgIEB1cGRhdGUgbW9kZWxcblxuICAjIyNcbiAgRmlsbHMgdGhpcyB2aWV3IHdpdGggdGhlIG1vZGVsJ3Mgc3Vidmlld3MuXG4gICMjI1xuICBmaWxsOiAoKSAtPlxuICAgIEBpbnN0YW5jZSA9IGRvIEBtb2RlbC52YWx1ZS5pbnN0YW50aWF0ZVxuXG4gICAgaWYgQG1vZGVsLm9yZGVyZWRDaGlsZHJlbktleXMubGVuZ3RoIGlzIDBcbiAgICAgICMgbm90aGluZyB0byBmaWxsIHdpdGhcbiAgICAgIHJldHVybiBAaW5zdGFuY2VcblxuICAgIGluc2VydGlvblB0ID0gQG1vZGVsLnZhbHVlLmdldENoaWxkcmVuSW5zZXJ0UG9pbnQgQGluc3RhbmNlXG5cbiAgICBpZiBpbnNlcnRpb25QdD9cbiAgICAgIEBtb2RlbC5vcmRlcmVkQ2hpbGRyZW5LZXlzLmZvckVhY2ggKGtleSkgPT5cbiAgICAgICAgY2hpbGQgPSBuZXcgVHJlZVZpZXcgKEBtb2RlbC5nZXRDaGlsZCBrZXkpXG4gICAgICAgIGluc2VydGlvblB0LmFwcGVuZENoaWxkIGNoaWxkXG5cbiAgICByZXR1cm4gQGluc3RhbmNlXG5cbiAgdXBkYXRlOiAobW9kZWwpIC0+XG4gICAgQG1vZGVsID0gbW9kZWxcbiAgICBkbyBAY2xlYXJcbiAgICBkbyBAZmlsbFxuICAgIFBvbHltZXIuZG9tKEByb290KS5hcHBlbmRDaGlsZCBAaW5zdGFuY2VcblxuICAjIyNcbiAgQ2xlYXJzIHRoZSBpbnN0YW5jZSBvZiBpdHMgY2hpbGRyZW4uLi4gYW5kIGl0c2VsZiFcbiAgIyMjXG4gIGNsZWFyOiAoKSAtPlxuICAgIGlmIEBpbnN0YW5jZT9cbiAgICAgIFBvbHltZXIuZG9tKEByb290KS5yZW1vdmVDaGlsZCBAaW5zdGFuY2UiXX0=
