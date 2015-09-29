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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy9kZW1vL3RleHQtZmxvdy1kZW1vLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUE7O0FBQUEsSUFBQSxHQUFPOztBQWlCUCxHQUFBLEdBQ0UsSUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxHQUZILENBRU8sU0FBQyxFQUFEO1NBQ0gsRUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxNQUZILENBRVUsQ0FBQyxTQUFDLEdBQUQsRUFBTSxFQUFOO0lBQ1AsSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLENBQWhCO01BQ0ssR0FBRyxDQUFDLFFBQUosR0FETDtLQUFBLE1BQUE7TUFFSyxHQUFHLENBQUMsSUFBSixJQUFZLEdBRmpCOztBQUdBLFdBQU87RUFKQSxDQUFELENBRlYsRUFPSTtJQUFDLFFBQUEsRUFBVSxDQUFYO0lBQWMsSUFBQSxFQUFNLEVBQXBCO0dBUEo7QUFERyxDQUZQOztBQVlGLElBQUEsR0FBTyxRQUFRLENBQUMsYUFBVCxDQUF1QixPQUF2Qjs7QUFDUCxJQUFJLENBQUMsY0FBTCxHQUFzQjs7QUFDdEIsSUFBSSxDQUFDLGVBQUwsR0FDRTtFQUFBLElBQUEsRUFBTSwwQkFBTjtFQUNBLE1BQUEsRUFBUSxNQURSO0VBRUEsQ0FBQSxFQUFHLEtBRkg7RUFHQSxPQUFBLEVBQ0U7SUFBQSxLQUFBLEVBQU8sRUFBUDtHQUpGOzs7QUFNRixJQUFJLENBQUMsZ0JBQUwsQ0FBc0IsUUFBdEIsRUFBZ0MsU0FBQyxHQUFEO1NBQzlCLE9BQU8sQ0FBQyxHQUFSLENBQVksR0FBRyxDQUFDLE1BQWhCO0FBRDhCLENBQWhDOztBQUdBLFdBQUEsR0FBYyxTQUFBO1NBQ1osR0FDRSxDQUFDLEdBREgsQ0FDTyxTQUFDLEVBQUQ7QUFDSCxRQUFBO0lBQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLGdCQUF2QjtJQUNWLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixpQkFBdkI7SUFDVixRQUFBLEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsTUFBdkI7SUFFWCxPQUFBLEdBQVUsQ0FBQyxJQUFBLEdBQUssU0FBVSxDQUFBLENBQUEsQ0FBaEI7SUFDVixJQUFHLDZCQUFIO01BQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFiLEVBREY7O0lBRUEsSUFBRyw0QkFBSDtNQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsWUFBYixFQURGOztJQUVBLElBQUcsOEJBQUg7TUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLFFBQWIsRUFERjs7SUFHQSxRQUFRLENBQUMsU0FBVCxHQUFxQixFQUFFLENBQUM7SUFDeEIsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsU0FBckIsRUFBaUMsT0FBTyxDQUFDLElBQVIsQ0FBYSxHQUFiLENBQWpDO0lBQ0EsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsUUFBckIsRUFBK0IsRUFBRSxDQUFDLFFBQWxDO0lBRUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxPQUFaLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsUUFBakM7SUFDQSxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVosQ0FBb0IsQ0FBQyxXQUFyQixDQUFpQyxPQUFqQztBQUNBLFdBQU87RUFuQkosQ0FEUCxDQXFCRSxDQUFDLE9BckJILENBcUJXLFNBQUMsT0FBRCxFQUFVLEdBQVY7V0FDUCxVQUFBLENBQ0UsQ0FBQyxTQUFBO2FBV0MsT0FBTyxDQUFDLEdBQVIsQ0FBWSxJQUFaLENBQWlCLENBQUMsV0FBbEIsQ0FBOEIsT0FBOUI7SUFYRCxDQUFELENBREYsRUFhRSxHQUFBLEdBQU0sR0FiUjtFQURPLENBckJYO0FBRFk7O0FBc0NYLFdBQUgsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ0ZXh0ID0gXCJcIlwiXG5hdHRhY2hlZDogKCkgLT5cbiAgdW5zZWxlY3QgPSBudWxsXG4gIEBhZGRFdmVudExpc3RlbmVyICdzZWxlY3QnLCAoZXZ0KSA9PlxuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGxheWVycyA9IGV2dC5kZXRhaWwubm9kZUlkLnNwbGl0IC9cXFxccy9cbiAgICBub2RlSWQgPSBsYXllcnNbbGF5ZXJzLmxlbmd0aCAtIDFdXG5cbiAgICBpZiB1bnNlbGVjdD9cbiAgICAgIHVuc2VsZWN0KClcblxuICAgIHVuc2VsZWN0ID0gQGhpZ2hsaWdodE5vZGUgbm9kZUlkLFxuICAgICAgZmlsbDogJyNjY2YnXG4gICAgICBzdHJva2U6ICdub25lJ1xuICAgICAgYm9yZGVyUmFkaXVzOiAyXG5cIlwiXCJcblxubG5zID1cbiAgdGV4dFxuICAgIC5zcGxpdCAnXFxuJ1xuICAgIC5tYXAgKGxuKSAtPlxuICAgICAgbG5cbiAgICAgICAgLnNwbGl0ICcgICdcbiAgICAgICAgLnJlZHVjZSAoKGFjYywgcGMpIC0+XG4gICAgICAgICAgaWYgcGMubGVuZ3RoIGlzIDBcbiAgICAgICAgICB0aGVuIGFjYy50YWJzdG9wcysrXG4gICAgICAgICAgZWxzZSBhY2MudGV4dCArPSBwY1xuICAgICAgICAgIHJldHVybiBhY2MpLFxuICAgICAgICAgIHt0YWJzdG9wczogMCwgdGV4dDogJyd9XG5cbnJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yICcjcm9vdCdcbnJvb3QuZHJhd0JhY2tncm91bmQgPSB0cnVlXG5yb290LmJhY2tncm91bmRTdHlsZSA9XG4gIGZpbGw6ICdyZ2JhKDEwMCwgMTAwLCAyMDAsIDAuMiknXG4gIHN0cm9rZTogJ25vbmUnXG4gIHI6ICcycHgnXG4gIHBhZGRpbmc6XG4gICAgcmlnaHQ6IDEwXG5cbnJvb3QuYWRkRXZlbnRMaXN0ZW5lciAnc2VsZWN0JywgKGV2dCkgLT5cbiAgY29uc29sZS5sb2cgZXZ0LmRldGFpbFxuXG5tb2RlbFRvVmlldyA9ICgpIC0+XG4gIGxuc1xuICAgIC5tYXAgKGxuKSAtPlxuICAgICAgbGluZUVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RleHQtZmxvdy1saW5lJ1xuICAgICAgdGV4dEVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RleHQtZmxvdy1waWVjZSdcbiAgICAgIHRleHRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3BhbidcblxuICAgICAgbm9kZUlkcyA9IFtcImxuI3thcmd1bWVudHNbMV19XCJdXG4gICAgICBpZiAobG4udGV4dC5tYXRjaCAvXFwuLyk/XG4gICAgICAgIG5vZGVJZHMucHVzaCAnYWNjZXNzJ1xuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggLz0vKT9cbiAgICAgICAgbm9kZUlkcy5wdXNoICdhc3NpZ25tZW50J1xuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggL1xcOiAvKT9cbiAgICAgICAgbm9kZUlkcy5wdXNoICdvYmplY3QnXG5cbiAgICAgIHRleHRTcGFuLmlubmVyVGV4dCA9IGxuLnRleHRcbiAgICAgIHRleHRFbG0uc2V0QXR0cmlidXRlICdub2RlLWlkJywgKG5vZGVJZHMuam9pbiAnICcpXG4gICAgICBsaW5lRWxtLnNldEF0dHJpYnV0ZSAnaW5kZW50JywgbG4udGFic3RvcHNcblxuICAgICAgUG9seW1lci5kb20odGV4dEVsbSkuYXBwZW5kQ2hpbGQgdGV4dFNwYW5cbiAgICAgIFBvbHltZXIuZG9tKGxpbmVFbG0pLmFwcGVuZENoaWxkIHRleHRFbG1cbiAgICAgIHJldHVybiBsaW5lRWxtXG4gICAgLmZvckVhY2ggKGxpbmVFbG0sIGlkeCkgLT5cbiAgICAgIHNldFRpbWVvdXQgXFxcbiAgICAgICAgKCgpIC0+XG4gICAgICAgICAgIyByb290Lm9uTmV4dENoaWxkQXBwZW5kICgpIC0+XG4gICAgICAgICAgIyAgIGNvbnNvbGUubG9nICdhZGRlZCBjaGlsZCAnLCBpZHhcbiAgICAgICAgICAjICAgcm9vdC5fZHJhd0JhY2tncm91bmRcbiAgICAgICAgICAjICAgICBmaWxsOiAncmdiYSgxMDAsIDEwMCwgMjAwLCAwLjIpJ1xuICAgICAgICAgICMgICAgIHN0cm9rZTogJ25vbmUnXG4gICAgICAgICAgIyAgICAgcjogJzJweCdcbiAgICAgICAgICAjICAgICBwYWRkaW5nOlxuICAgICAgICAgICMgICAgICAgcmlnaHQ6IDEwXG5cblxuICAgICAgICAgIFBvbHltZXIuZG9tKHJvb3QpLmFwcGVuZENoaWxkIGxpbmVFbG0pLFxuICAgICAgICBpZHggKiA1MDBcblxuZG8gbW9kZWxUb1ZpZXciXX0=
