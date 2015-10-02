(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
document.addEventListener('WebComponentsReady', function() {
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
  return modelToView();
});


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy9kZW1vL3RleHQtZmxvdy1kZW1vLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixvQkFBMUIsRUFBZ0QsU0FBQTtBQUM5QyxNQUFBO0VBQUEsSUFBQSxHQUFPO0VBaUJQLEdBQUEsR0FDRSxJQUNFLENBQUMsS0FESCxDQUNTLElBRFQsQ0FFRSxDQUFDLEdBRkgsQ0FFTyxTQUFDLEVBQUQ7V0FDSCxFQUNFLENBQUMsS0FESCxDQUNTLElBRFQsQ0FFRSxDQUFDLE1BRkgsQ0FFVSxDQUFDLFNBQUMsR0FBRCxFQUFNLEVBQU47TUFDUCxJQUFHLEVBQUUsQ0FBQyxNQUFILEtBQWEsQ0FBaEI7UUFDSyxHQUFHLENBQUMsUUFBSixHQURMO09BQUEsTUFBQTtRQUVLLEdBQUcsQ0FBQyxJQUFKLElBQVksR0FGakI7O0FBR0EsYUFBTztJQUpBLENBQUQsQ0FGVixFQU9JO01BQUMsUUFBQSxFQUFVLENBQVg7TUFBYyxJQUFBLEVBQU0sRUFBcEI7S0FQSjtFQURHLENBRlA7RUFZRixJQUFBLEdBQU8sUUFBUSxDQUFDLGFBQVQsQ0FBdUIsT0FBdkI7RUFDUCxRQUFRLENBQUMsYUFBVCxDQUF1QixrQkFBdkIsQ0FDRSxDQUFDLGdCQURILENBQ29CLFFBRHBCLEVBQzhCLFNBQUMsR0FBRDtXQUMxQixJQUFJLENBQUMsY0FBTCxHQUFzQixHQUFHLENBQUMsTUFBTSxDQUFDO0VBRFAsQ0FEOUI7RUFHQSxJQUFJLENBQUMsY0FBTCxHQUFzQjtFQUN0QixJQUFJLENBQUMsZUFBTCxHQUNFO0lBQUEsSUFBQSxFQUFNLDBCQUFOO0lBQ0EsTUFBQSxFQUFRLE1BRFI7SUFFQSxDQUFBLEVBQUcsS0FGSDtJQUdBLE9BQUEsRUFDRTtNQUFBLEtBQUEsRUFBTyxFQUFQO0tBSkY7O0VBTUYsSUFBSSxDQUFDLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLFNBQUMsR0FBRDtXQUM5QixPQUFPLENBQUMsR0FBUixDQUFZLEdBQUcsQ0FBQyxNQUFoQjtFQUQ4QixDQUFoQztFQUdBLFdBQUEsR0FBYyxTQUFBO1dBQ1osR0FDRSxDQUFDLEdBREgsQ0FDTyxTQUFDLEVBQUQ7QUFDSCxVQUFBO01BQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLGdCQUF2QjtNQUNWLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixpQkFBdkI7TUFDVixRQUFBLEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsTUFBdkI7TUFFWCxPQUFBLEdBQVUsQ0FBQyxJQUFBLEdBQUssU0FBVSxDQUFBLENBQUEsQ0FBaEI7TUFDVixJQUFHLDZCQUFIO1FBQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFiLEVBREY7O01BRUEsSUFBRyw0QkFBSDtRQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsWUFBYixFQURGOztNQUVBLElBQUcsOEJBQUg7UUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLFFBQWIsRUFERjs7TUFHQSxRQUFRLENBQUMsU0FBVCxHQUFxQixFQUFFLENBQUM7TUFDeEIsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsU0FBckIsRUFBaUMsT0FBTyxDQUFDLElBQVIsQ0FBYSxHQUFiLENBQWpDO01BQ0EsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsUUFBckIsRUFBK0IsRUFBRSxDQUFDLFFBQWxDO01BRUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxPQUFaLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsUUFBakM7TUFDQSxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVosQ0FBb0IsQ0FBQyxXQUFyQixDQUFpQyxPQUFqQztBQUNBLGFBQU87SUFuQkosQ0FEUCxDQXFCRSxDQUFDLE9BckJILENBcUJXLFNBQUMsT0FBRCxFQUFVLEdBQVY7YUFDUCxVQUFBLENBQ0UsQ0FBQyxTQUFBO2VBV0MsT0FBTyxDQUFDLEdBQVIsQ0FBWSxJQUFaLENBQWlCLENBQUMsV0FBbEIsQ0FBOEIsT0FBOUI7TUFYRCxDQUFELENBREYsRUFhRSxHQUFBLEdBQU0sR0FiUjtJQURPLENBckJYO0VBRFk7U0FzQ1gsV0FBSCxDQUFBO0FBcEY4QyxDQUFoRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICdXZWJDb21wb25lbnRzUmVhZHknLCAoKSAtPlxuICB0ZXh0ID0gXCJcIlwiXG4gIGF0dGFjaGVkOiAoKSAtPlxuICAgIHVuc2VsZWN0ID0gbnVsbFxuICAgIEBhZGRFdmVudExpc3RlbmVyICdzZWxlY3QnLCAoZXZ0KSA9PlxuICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICBsYXllcnMgPSBldnQuZGV0YWlsLm5vZGVJZC5zcGxpdCAvXFxcXHMvXG4gICAgICBub2RlSWQgPSBsYXllcnNbbGF5ZXJzLmxlbmd0aCAtIDFdXG5cbiAgICAgIGlmIHVuc2VsZWN0P1xuICAgICAgICB1bnNlbGVjdCgpXG5cbiAgICAgIHVuc2VsZWN0ID0gQGhpZ2hsaWdodE5vZGUgbm9kZUlkLFxuICAgICAgICBmaWxsOiAnI2NjZidcbiAgICAgICAgc3Ryb2tlOiAnbm9uZSdcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAyXG4gIFwiXCJcIlxuXG4gIGxucyA9XG4gICAgdGV4dFxuICAgICAgLnNwbGl0ICdcXG4nXG4gICAgICAubWFwIChsbikgLT5cbiAgICAgICAgbG5cbiAgICAgICAgICAuc3BsaXQgJyAgJ1xuICAgICAgICAgIC5yZWR1Y2UgKChhY2MsIHBjKSAtPlxuICAgICAgICAgICAgaWYgcGMubGVuZ3RoIGlzIDBcbiAgICAgICAgICAgIHRoZW4gYWNjLnRhYnN0b3BzKytcbiAgICAgICAgICAgIGVsc2UgYWNjLnRleHQgKz0gcGNcbiAgICAgICAgICAgIHJldHVybiBhY2MpLFxuICAgICAgICAgICAge3RhYnN0b3BzOiAwLCB0ZXh0OiAnJ31cblxuICByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvciAnI3Jvb3QnXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgJyNkcmF3LWJhY2tncm91bmQnXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIgJ2NoYW5nZScsIChldnQpIC0+XG4gICAgICByb290LmRyYXdCYWNrZ3JvdW5kID0gZXZ0LnRhcmdldC5jaGVja2VkXG4gIHJvb3QuZHJhd0JhY2tncm91bmQgPSB0cnVlXG4gIHJvb3QuYmFja2dyb3VuZFN0eWxlID1cbiAgICBmaWxsOiAncmdiYSgxMDAsIDEwMCwgMjAwLCAwLjIpJ1xuICAgIHN0cm9rZTogJ25vbmUnXG4gICAgcjogJzJweCdcbiAgICBwYWRkaW5nOlxuICAgICAgcmlnaHQ6IDEwXG5cbiAgcm9vdC5hZGRFdmVudExpc3RlbmVyICdzZWxlY3QnLCAoZXZ0KSAtPlxuICAgIGNvbnNvbGUubG9nIGV2dC5kZXRhaWxcblxuICBtb2RlbFRvVmlldyA9ICgpIC0+XG4gICAgbG5zXG4gICAgICAubWFwIChsbikgLT5cbiAgICAgICAgbGluZUVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RleHQtZmxvdy1saW5lJ1xuICAgICAgICB0ZXh0RWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAndGV4dC1mbG93LXBpZWNlJ1xuICAgICAgICB0ZXh0U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3NwYW4nXG5cbiAgICAgICAgbm9kZUlkcyA9IFtcImxuI3thcmd1bWVudHNbMV19XCJdXG4gICAgICAgIGlmIChsbi50ZXh0Lm1hdGNoIC9cXC4vKT9cbiAgICAgICAgICBub2RlSWRzLnB1c2ggJ2FjY2VzcydcbiAgICAgICAgaWYgKGxuLnRleHQubWF0Y2ggLz0vKT9cbiAgICAgICAgICBub2RlSWRzLnB1c2ggJ2Fzc2lnbm1lbnQnXG4gICAgICAgIGlmIChsbi50ZXh0Lm1hdGNoIC9cXDogLyk/XG4gICAgICAgICAgbm9kZUlkcy5wdXNoICdvYmplY3QnXG5cbiAgICAgICAgdGV4dFNwYW4uaW5uZXJUZXh0ID0gbG4udGV4dFxuICAgICAgICB0ZXh0RWxtLnNldEF0dHJpYnV0ZSAnbm9kZS1pZCcsIChub2RlSWRzLmpvaW4gJyAnKVxuICAgICAgICBsaW5lRWxtLnNldEF0dHJpYnV0ZSAnaW5kZW50JywgbG4udGFic3RvcHNcblxuICAgICAgICBQb2x5bWVyLmRvbSh0ZXh0RWxtKS5hcHBlbmRDaGlsZCB0ZXh0U3BhblxuICAgICAgICBQb2x5bWVyLmRvbShsaW5lRWxtKS5hcHBlbmRDaGlsZCB0ZXh0RWxtXG4gICAgICAgIHJldHVybiBsaW5lRWxtXG4gICAgICAuZm9yRWFjaCAobGluZUVsbSwgaWR4KSAtPlxuICAgICAgICBzZXRUaW1lb3V0IFxcXG4gICAgICAgICAgKCgpIC0+XG4gICAgICAgICAgICAjIHJvb3Qub25OZXh0Q2hpbGRBcHBlbmQgKCkgLT5cbiAgICAgICAgICAgICMgICBjb25zb2xlLmxvZyAnYWRkZWQgY2hpbGQgJywgaWR4XG4gICAgICAgICAgICAjICAgcm9vdC5fZHJhd0JhY2tncm91bmRcbiAgICAgICAgICAgICMgICAgIGZpbGw6ICdyZ2JhKDEwMCwgMTAwLCAyMDAsIDAuMiknXG4gICAgICAgICAgICAjICAgICBzdHJva2U6ICdub25lJ1xuICAgICAgICAgICAgIyAgICAgcjogJzJweCdcbiAgICAgICAgICAgICMgICAgIHBhZGRpbmc6XG4gICAgICAgICAgICAjICAgICAgIHJpZ2h0OiAxMFxuXG5cbiAgICAgICAgICAgIFBvbHltZXIuZG9tKHJvb3QpLmFwcGVuZENoaWxkIGxpbmVFbG0pLFxuICAgICAgICAgIGlkeCAqIDUwMFxuXG4gIGRvIG1vZGVsVG9WaWV3Il19
