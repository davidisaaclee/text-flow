(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var lns, modelToView, root, text;

text = "attached: () ->\n  unselect = null\n  @addEventListener 'select', (evt) =>\n    evt.stopPropagation()\n    layers = evt.detail.nodeId.split /\\s/\n    nodeId = layers[layers.length - 1]\n\n    if unselect?\n      unselect()\n\n    unselect = @highlightNode nodeId,\n      fill: '#ccf'\n      stroke: 'none'\n      borderRadius: 2";

lns = text.split('\n').map(function(ln) {
  return ln.split('  ').reduce((function(acc, pc) {
    if (pc.length === 0) {
      acc.tabstops++;
    } else {
      acc.text += pc;
    }
    return acc;
  }), {
    tabstops: 0,
    text: ''
  });
});

root = document.querySelector('#root');

root.drawBackground = false;

root.addEventListener('select', function(evt) {
  return console.log(evt.detail);
});

modelToView = function() {
  return lns.map(function(ln) {
    var lineElm, nodeIds, textElm, textSpan;
    lineElm = document.createElement('text-flow-line');
    textElm = document.createElement('text-flow-piece');
    textSpan = document.createElement('span');
    nodeIds = ["ln" + arguments[1]];
    if ((ln.text.match(/\./)) != null) {
      nodeIds.push('access');
    }
    if ((ln.text.match(/=/)) != null) {
      nodeIds.push('assignment');
    }
    if ((ln.text.match(/\: /)) != null) {
      nodeIds.push('object');
    }
    textSpan.innerText = ln.text;
    textElm.setAttribute('node-id', nodeIds.join(' '));
    lineElm.setAttribute('indent', ln.tabstops);
    Polymer.dom(textElm).appendChild(textSpan);
    Polymer.dom(lineElm).appendChild(textElm);
    return lineElm;
  }).forEach(function(lineElm, idx) {
    return setTimeout((function() {
      root.onNextChildAppend(function() {
        console.log('added child ', idx);
        return root._drawBackground({
          fill: 'rgba(100, 100, 200, 0.2)',
          stroke: 'none',
          r: '2px',
          padding: {
            right: 10
          }
        });
      });
      return Polymer.dom(root).appendChild(lineElm);
    }), idx * 500);
  });
};

modelToView();


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy9kZW1vL3RleHQtZmxvdy1kZW1vLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUE7O0FBQUEsSUFBQSxHQUFPOztBQWlCUCxHQUFBLEdBQ0UsSUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxHQUZILENBRU8sU0FBQyxFQUFEO1NBQ0gsRUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxNQUZILENBRVUsQ0FBQyxTQUFDLEdBQUQsRUFBTSxFQUFOO0lBQ1AsSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLENBQWhCO01BQ0ssR0FBRyxDQUFDLFFBQUosR0FETDtLQUFBLE1BQUE7TUFFSyxHQUFHLENBQUMsSUFBSixJQUFZLEdBRmpCOztBQUdBLFdBQU87RUFKQSxDQUFELENBRlYsRUFPSTtJQUFDLFFBQUEsRUFBVSxDQUFYO0lBQWMsSUFBQSxFQUFNLEVBQXBCO0dBUEo7QUFERyxDQUZQOztBQVlGLElBQUEsR0FBTyxRQUFRLENBQUMsYUFBVCxDQUF1QixPQUF2Qjs7QUFDUCxJQUFJLENBQUMsY0FBTCxHQUFzQjs7QUFFdEIsSUFBSSxDQUFDLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLFNBQUMsR0FBRDtTQUM5QixPQUFPLENBQUMsR0FBUixDQUFZLEdBQUcsQ0FBQyxNQUFoQjtBQUQ4QixDQUFoQzs7QUFHQSxXQUFBLEdBQWMsU0FBQTtTQUNaLEdBQ0UsQ0FBQyxHQURILENBQ08sU0FBQyxFQUFEO0FBQ0gsUUFBQTtJQUFBLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixnQkFBdkI7SUFDVixPQUFBLEdBQVUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsaUJBQXZCO0lBQ1YsUUFBQSxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCO0lBRVgsT0FBQSxHQUFVLENBQUMsSUFBQSxHQUFLLFNBQVUsQ0FBQSxDQUFBLENBQWhCO0lBQ1YsSUFBRyw2QkFBSDtNQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsUUFBYixFQURGOztJQUVBLElBQUcsNEJBQUg7TUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLFlBQWIsRUFERjs7SUFFQSxJQUFHLDhCQUFIO01BQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFiLEVBREY7O0lBR0EsUUFBUSxDQUFDLFNBQVQsR0FBcUIsRUFBRSxDQUFDO0lBQ3hCLE9BQU8sQ0FBQyxZQUFSLENBQXFCLFNBQXJCLEVBQWlDLE9BQU8sQ0FBQyxJQUFSLENBQWEsR0FBYixDQUFqQztJQUNBLE9BQU8sQ0FBQyxZQUFSLENBQXFCLFFBQXJCLEVBQStCLEVBQUUsQ0FBQyxRQUFsQztJQUVBLE9BQU8sQ0FBQyxHQUFSLENBQVksT0FBWixDQUFvQixDQUFDLFdBQXJCLENBQWlDLFFBQWpDO0lBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxPQUFaLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsT0FBakM7QUFDQSxXQUFPO0VBbkJKLENBRFAsQ0FxQkUsQ0FBQyxPQXJCSCxDQXFCVyxTQUFDLE9BQUQsRUFBVSxHQUFWO1dBQ1AsVUFBQSxDQUNFLENBQUMsU0FBQTtNQUNDLElBQUksQ0FBQyxpQkFBTCxDQUF1QixTQUFBO1FBQ3JCLE9BQU8sQ0FBQyxHQUFSLENBQVksY0FBWixFQUE0QixHQUE1QjtlQUNBLElBQUksQ0FBQyxlQUFMLENBQ0U7VUFBQSxJQUFBLEVBQU0sMEJBQU47VUFDQSxNQUFBLEVBQVEsTUFEUjtVQUVBLENBQUEsRUFBRyxLQUZIO1VBR0EsT0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLEVBQVA7V0FKRjtTQURGO01BRnFCLENBQXZCO2FBVUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxJQUFaLENBQWlCLENBQUMsV0FBbEIsQ0FBOEIsT0FBOUI7SUFYRCxDQUFELENBREYsRUFhRSxHQUFBLEdBQU0sR0FiUjtFQURPLENBckJYO0FBRFk7O0FBc0NYLFdBQUgsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0ZXh0ID0gXCJcIlwiXG5hdHRhY2hlZDogKCkgLT5cbiAgdW5zZWxlY3QgPSBudWxsXG4gIEBhZGRFdmVudExpc3RlbmVyICdzZWxlY3QnLCAoZXZ0KSA9PlxuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGxheWVycyA9IGV2dC5kZXRhaWwubm9kZUlkLnNwbGl0IC9cXFxccy9cbiAgICBub2RlSWQgPSBsYXllcnNbbGF5ZXJzLmxlbmd0aCAtIDFdXG5cbiAgICBpZiB1bnNlbGVjdD9cbiAgICAgIHVuc2VsZWN0KClcblxuICAgIHVuc2VsZWN0ID0gQGhpZ2hsaWdodE5vZGUgbm9kZUlkLFxuICAgICAgZmlsbDogJyNjY2YnXG4gICAgICBzdHJva2U6ICdub25lJ1xuICAgICAgYm9yZGVyUmFkaXVzOiAyXG5cIlwiXCJcblxubG5zID1cbiAgdGV4dFxuICAgIC5zcGxpdCAnXFxuJ1xuICAgIC5tYXAgKGxuKSAtPlxuICAgICAgbG5cbiAgICAgICAgLnNwbGl0ICcgICdcbiAgICAgICAgLnJlZHVjZSAoKGFjYywgcGMpIC0+XG4gICAgICAgICAgaWYgcGMubGVuZ3RoIGlzIDBcbiAgICAgICAgICB0aGVuIGFjYy50YWJzdG9wcysrXG4gICAgICAgICAgZWxzZSBhY2MudGV4dCArPSBwY1xuICAgICAgICAgIHJldHVybiBhY2MpLFxuICAgICAgICAgIHt0YWJzdG9wczogMCwgdGV4dDogJyd9XG5cbnJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yICcjcm9vdCdcbnJvb3QuZHJhd0JhY2tncm91bmQgPSBmYWxzZVxuXG5yb290LmFkZEV2ZW50TGlzdGVuZXIgJ3NlbGVjdCcsIChldnQpIC0+XG4gIGNvbnNvbGUubG9nIGV2dC5kZXRhaWxcblxubW9kZWxUb1ZpZXcgPSAoKSAtPlxuICBsbnNcbiAgICAubWFwIChsbikgLT5cbiAgICAgIGxpbmVFbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0ZXh0LWZsb3ctbGluZSdcbiAgICAgIHRleHRFbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0ZXh0LWZsb3ctcGllY2UnXG4gICAgICB0ZXh0U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3NwYW4nXG5cbiAgICAgIG5vZGVJZHMgPSBbXCJsbiN7YXJndW1lbnRzWzFdfVwiXVxuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggL1xcLi8pP1xuICAgICAgICBub2RlSWRzLnB1c2ggJ2FjY2VzcydcbiAgICAgIGlmIChsbi50ZXh0Lm1hdGNoIC89Lyk/XG4gICAgICAgIG5vZGVJZHMucHVzaCAnYXNzaWdubWVudCdcbiAgICAgIGlmIChsbi50ZXh0Lm1hdGNoIC9cXDogLyk/XG4gICAgICAgIG5vZGVJZHMucHVzaCAnb2JqZWN0J1xuXG4gICAgICB0ZXh0U3Bhbi5pbm5lclRleHQgPSBsbi50ZXh0XG4gICAgICB0ZXh0RWxtLnNldEF0dHJpYnV0ZSAnbm9kZS1pZCcsIChub2RlSWRzLmpvaW4gJyAnKVxuICAgICAgbGluZUVsbS5zZXRBdHRyaWJ1dGUgJ2luZGVudCcsIGxuLnRhYnN0b3BzXG5cbiAgICAgIFBvbHltZXIuZG9tKHRleHRFbG0pLmFwcGVuZENoaWxkIHRleHRTcGFuXG4gICAgICBQb2x5bWVyLmRvbShsaW5lRWxtKS5hcHBlbmRDaGlsZCB0ZXh0RWxtXG4gICAgICByZXR1cm4gbGluZUVsbVxuICAgIC5mb3JFYWNoIChsaW5lRWxtLCBpZHgpIC0+XG4gICAgICBzZXRUaW1lb3V0IFxcXG4gICAgICAgICgoKSAtPlxuICAgICAgICAgIHJvb3Qub25OZXh0Q2hpbGRBcHBlbmQgKCkgLT5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nICdhZGRlZCBjaGlsZCAnLCBpZHhcbiAgICAgICAgICAgIHJvb3QuX2RyYXdCYWNrZ3JvdW5kXG4gICAgICAgICAgICAgIGZpbGw6ICdyZ2JhKDEwMCwgMTAwLCAyMDAsIDAuMiknXG4gICAgICAgICAgICAgIHN0cm9rZTogJ25vbmUnXG4gICAgICAgICAgICAgIHI6ICcycHgnXG4gICAgICAgICAgICAgIHBhZGRpbmc6XG4gICAgICAgICAgICAgICAgcmlnaHQ6IDEwXG5cblxuICAgICAgICAgIFBvbHltZXIuZG9tKHJvb3QpLmFwcGVuZENoaWxkIGxpbmVFbG0pLFxuICAgICAgICBpZHggKiA1MDBcblxuZG8gbW9kZWxUb1ZpZXciXX0=
