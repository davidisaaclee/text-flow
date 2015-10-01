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

document.querySelector('#draw-background').addEventListener('change', function(evt) {
  return root.drawBackground = evt.target.checked;
});

root.drawBackground = true;

root.backgroundStyle = {
  fill: 'rgba(100, 100, 200, 0.2)',
  stroke: 'none',
  r: '2px',
  padding: {
    right: 10
  }
};

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
      return Polymer.dom(root).appendChild(lineElm);
    }), idx * 500);
  });
};

modelToView();


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy9kZW1vL3RleHQtZmxvdy1kZW1vLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0NBLElBQUE7O0FBQUEsSUFBQSxHQUFPOztBQWlCUCxHQUFBLEdBQ0UsSUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxHQUZILENBRU8sU0FBQyxFQUFEO1NBQ0gsRUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxNQUZILENBRVUsQ0FBQyxTQUFDLEdBQUQsRUFBTSxFQUFOO0lBQ1AsSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLENBQWhCO01BQ0ssR0FBRyxDQUFDLFFBQUosR0FETDtLQUFBLE1BQUE7TUFFSyxHQUFHLENBQUMsSUFBSixJQUFZLEdBRmpCOztBQUdBLFdBQU87RUFKQSxDQUFELENBRlYsRUFPSTtJQUFDLFFBQUEsRUFBVSxDQUFYO0lBQWMsSUFBQSxFQUFNLEVBQXBCO0dBUEo7QUFERyxDQUZQOztBQVlGLElBQUEsR0FBTyxRQUFRLENBQUMsYUFBVCxDQUF1QixPQUF2Qjs7QUFDUCxRQUFRLENBQUMsYUFBVCxDQUF1QixrQkFBdkIsQ0FDRSxDQUFDLGdCQURILENBQ29CLFFBRHBCLEVBQzhCLFNBQUMsR0FBRDtTQUMxQixJQUFJLENBQUMsY0FBTCxHQUFzQixHQUFHLENBQUMsTUFBTSxDQUFDO0FBRFAsQ0FEOUI7O0FBR0EsSUFBSSxDQUFDLGNBQUwsR0FBc0I7O0FBQ3RCLElBQUksQ0FBQyxlQUFMLEdBQ0U7RUFBQSxJQUFBLEVBQU0sMEJBQU47RUFDQSxNQUFBLEVBQVEsTUFEUjtFQUVBLENBQUEsRUFBRyxLQUZIO0VBR0EsT0FBQSxFQUNFO0lBQUEsS0FBQSxFQUFPLEVBQVA7R0FKRjs7O0FBTUYsSUFBSSxDQUFDLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLFNBQUMsR0FBRDtTQUM5QixPQUFPLENBQUMsR0FBUixDQUFZLEdBQUcsQ0FBQyxNQUFoQjtBQUQ4QixDQUFoQzs7QUFHQSxXQUFBLEdBQWMsU0FBQTtTQUNaLEdBQ0UsQ0FBQyxHQURILENBQ08sU0FBQyxFQUFEO0FBQ0gsUUFBQTtJQUFBLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixnQkFBdkI7SUFDVixPQUFBLEdBQVUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsaUJBQXZCO0lBQ1YsUUFBQSxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCO0lBRVgsT0FBQSxHQUFVLENBQUMsSUFBQSxHQUFLLFNBQVUsQ0FBQSxDQUFBLENBQWhCO0lBQ1YsSUFBRyw2QkFBSDtNQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsUUFBYixFQURGOztJQUVBLElBQUcsNEJBQUg7TUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLFlBQWIsRUFERjs7SUFFQSxJQUFHLDhCQUFIO01BQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFiLEVBREY7O0lBR0EsUUFBUSxDQUFDLFNBQVQsR0FBcUIsRUFBRSxDQUFDO0lBQ3hCLE9BQU8sQ0FBQyxZQUFSLENBQXFCLFNBQXJCLEVBQWlDLE9BQU8sQ0FBQyxJQUFSLENBQWEsR0FBYixDQUFqQztJQUNBLE9BQU8sQ0FBQyxZQUFSLENBQXFCLFFBQXJCLEVBQStCLEVBQUUsQ0FBQyxRQUFsQztJQUVBLE9BQU8sQ0FBQyxHQUFSLENBQVksT0FBWixDQUFvQixDQUFDLFdBQXJCLENBQWlDLFFBQWpDO0lBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxPQUFaLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsT0FBakM7QUFDQSxXQUFPO0VBbkJKLENBRFAsQ0FxQkUsQ0FBQyxPQXJCSCxDQXFCVyxTQUFDLE9BQUQsRUFBVSxHQUFWO1dBQ1AsVUFBQSxDQUNFLENBQUMsU0FBQTthQVdDLE9BQU8sQ0FBQyxHQUFSLENBQVksSUFBWixDQUFpQixDQUFDLFdBQWxCLENBQThCLE9BQTlCO0lBWEQsQ0FBRCxDQURGLEVBYUUsR0FBQSxHQUFNLEdBYlI7RUFETyxDQXJCWDtBQURZOztBQXNDWCxXQUFILENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG50ZXh0ID0gXCJcIlwiXG5hdHRhY2hlZDogKCkgLT5cbiAgdW5zZWxlY3QgPSBudWxsXG4gIEBhZGRFdmVudExpc3RlbmVyICdzZWxlY3QnLCAoZXZ0KSA9PlxuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGxheWVycyA9IGV2dC5kZXRhaWwubm9kZUlkLnNwbGl0IC9cXFxccy9cbiAgICBub2RlSWQgPSBsYXllcnNbbGF5ZXJzLmxlbmd0aCAtIDFdXG5cbiAgICBpZiB1bnNlbGVjdD9cbiAgICAgIHVuc2VsZWN0KClcblxuICAgIHVuc2VsZWN0ID0gQGhpZ2hsaWdodE5vZGUgbm9kZUlkLFxuICAgICAgZmlsbDogJyNjY2YnXG4gICAgICBzdHJva2U6ICdub25lJ1xuICAgICAgYm9yZGVyUmFkaXVzOiAyXG5cIlwiXCJcblxubG5zID1cbiAgdGV4dFxuICAgIC5zcGxpdCAnXFxuJ1xuICAgIC5tYXAgKGxuKSAtPlxuICAgICAgbG5cbiAgICAgICAgLnNwbGl0ICcgICdcbiAgICAgICAgLnJlZHVjZSAoKGFjYywgcGMpIC0+XG4gICAgICAgICAgaWYgcGMubGVuZ3RoIGlzIDBcbiAgICAgICAgICB0aGVuIGFjYy50YWJzdG9wcysrXG4gICAgICAgICAgZWxzZSBhY2MudGV4dCArPSBwY1xuICAgICAgICAgIHJldHVybiBhY2MpLFxuICAgICAgICAgIHt0YWJzdG9wczogMCwgdGV4dDogJyd9XG5cbnJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yICcjcm9vdCdcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgJyNkcmF3LWJhY2tncm91bmQnXG4gIC5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnLCAoZXZ0KSAtPlxuICAgIHJvb3QuZHJhd0JhY2tncm91bmQgPSBldnQudGFyZ2V0LmNoZWNrZWRcbnJvb3QuZHJhd0JhY2tncm91bmQgPSB0cnVlXG5yb290LmJhY2tncm91bmRTdHlsZSA9XG4gIGZpbGw6ICdyZ2JhKDEwMCwgMTAwLCAyMDAsIDAuMiknXG4gIHN0cm9rZTogJ25vbmUnXG4gIHI6ICcycHgnXG4gIHBhZGRpbmc6XG4gICAgcmlnaHQ6IDEwXG5cbnJvb3QuYWRkRXZlbnRMaXN0ZW5lciAnc2VsZWN0JywgKGV2dCkgLT5cbiAgY29uc29sZS5sb2cgZXZ0LmRldGFpbFxuXG5tb2RlbFRvVmlldyA9ICgpIC0+XG4gIGxuc1xuICAgIC5tYXAgKGxuKSAtPlxuICAgICAgbGluZUVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RleHQtZmxvdy1saW5lJ1xuICAgICAgdGV4dEVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RleHQtZmxvdy1waWVjZSdcbiAgICAgIHRleHRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3BhbidcblxuICAgICAgbm9kZUlkcyA9IFtcImxuI3thcmd1bWVudHNbMV19XCJdXG4gICAgICBpZiAobG4udGV4dC5tYXRjaCAvXFwuLyk/XG4gICAgICAgIG5vZGVJZHMucHVzaCAnYWNjZXNzJ1xuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggLz0vKT9cbiAgICAgICAgbm9kZUlkcy5wdXNoICdhc3NpZ25tZW50J1xuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggL1xcOiAvKT9cbiAgICAgICAgbm9kZUlkcy5wdXNoICdvYmplY3QnXG5cbiAgICAgIHRleHRTcGFuLmlubmVyVGV4dCA9IGxuLnRleHRcbiAgICAgIHRleHRFbG0uc2V0QXR0cmlidXRlICdub2RlLWlkJywgKG5vZGVJZHMuam9pbiAnICcpXG4gICAgICBsaW5lRWxtLnNldEF0dHJpYnV0ZSAnaW5kZW50JywgbG4udGFic3RvcHNcblxuICAgICAgUG9seW1lci5kb20odGV4dEVsbSkuYXBwZW5kQ2hpbGQgdGV4dFNwYW5cbiAgICAgIFBvbHltZXIuZG9tKGxpbmVFbG0pLmFwcGVuZENoaWxkIHRleHRFbG1cbiAgICAgIHJldHVybiBsaW5lRWxtXG4gICAgLmZvckVhY2ggKGxpbmVFbG0sIGlkeCkgLT5cbiAgICAgIHNldFRpbWVvdXQgXFxcbiAgICAgICAgKCgpIC0+XG4gICAgICAgICAgIyByb290Lm9uTmV4dENoaWxkQXBwZW5kICgpIC0+XG4gICAgICAgICAgIyAgIGNvbnNvbGUubG9nICdhZGRlZCBjaGlsZCAnLCBpZHhcbiAgICAgICAgICAjICAgcm9vdC5fZHJhd0JhY2tncm91bmRcbiAgICAgICAgICAjICAgICBmaWxsOiAncmdiYSgxMDAsIDEwMCwgMjAwLCAwLjIpJ1xuICAgICAgICAgICMgICAgIHN0cm9rZTogJ25vbmUnXG4gICAgICAgICAgIyAgICAgcjogJzJweCdcbiAgICAgICAgICAjICAgICBwYWRkaW5nOlxuICAgICAgICAgICMgICAgICAgcmlnaHQ6IDEwXG5cblxuICAgICAgICAgIFBvbHltZXIuZG9tKHJvb3QpLmFwcGVuZENoaWxkIGxpbmVFbG0pLFxuICAgICAgICBpZHggKiA1MDBcblxuZG8gbW9kZWxUb1ZpZXciXX0=
