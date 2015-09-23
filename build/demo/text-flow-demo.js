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
  }).forEach(function(lineElm) {
    return Polymer.dom(root).appendChild(lineElm);
  });
};

modelToView();


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy9kZW1vL3RleHQtZmxvdy1kZW1vLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUE7O0FBQUEsSUFBQSxHQUFPOztBQWlCUCxHQUFBLEdBQ0UsSUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxHQUZILENBRU8sU0FBQyxFQUFEO1NBQ0gsRUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxNQUZILENBRVUsQ0FBQyxTQUFDLEdBQUQsRUFBTSxFQUFOO0lBQ1AsSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLENBQWhCO01BQ0ssR0FBRyxDQUFDLFFBQUosR0FETDtLQUFBLE1BQUE7TUFFSyxHQUFHLENBQUMsSUFBSixJQUFZLEdBRmpCOztBQUdBLFdBQU87RUFKQSxDQUFELENBRlYsRUFPSTtJQUFDLFFBQUEsRUFBVSxDQUFYO0lBQWMsSUFBQSxFQUFNLEVBQXBCO0dBUEo7QUFERyxDQUZQOztBQVlGLElBQUEsR0FBTyxRQUFRLENBQUMsYUFBVCxDQUF1QixPQUF2Qjs7QUFFUCxJQUFJLENBQUMsZ0JBQUwsQ0FBc0IsUUFBdEIsRUFBZ0MsU0FBQyxHQUFEO1NBQzlCLE9BQU8sQ0FBQyxHQUFSLENBQVksR0FBRyxDQUFDLE1BQWhCO0FBRDhCLENBQWhDOztBQUdBLFdBQUEsR0FBYyxTQUFBO1NBQ1osR0FDRSxDQUFDLEdBREgsQ0FDTyxTQUFDLEVBQUQ7QUFDSCxRQUFBO0lBQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLGdCQUF2QjtJQUNWLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixpQkFBdkI7SUFDVixRQUFBLEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsTUFBdkI7SUFFWCxPQUFBLEdBQVUsQ0FBQyxJQUFBLEdBQUssU0FBVSxDQUFBLENBQUEsQ0FBaEI7SUFDVixJQUFHLDZCQUFIO01BQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFiLEVBREY7O0lBRUEsSUFBRyw0QkFBSDtNQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsWUFBYixFQURGOztJQUVBLElBQUcsOEJBQUg7TUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLFFBQWIsRUFERjs7SUFHQSxRQUFRLENBQUMsU0FBVCxHQUFxQixFQUFFLENBQUM7SUFDeEIsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsU0FBckIsRUFBaUMsT0FBTyxDQUFDLElBQVIsQ0FBYSxHQUFiLENBQWpDO0lBQ0EsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsUUFBckIsRUFBK0IsRUFBRSxDQUFDLFFBQWxDO0lBRUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxPQUFaLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsUUFBakM7SUFDQSxPQUFPLENBQUMsR0FBUixDQUFZLE9BQVosQ0FBb0IsQ0FBQyxXQUFyQixDQUFpQyxPQUFqQztBQUNBLFdBQU87RUFuQkosQ0FEUCxDQXFCRSxDQUFDLE9BckJILENBcUJXLFNBQUMsT0FBRDtXQUNQLE9BQU8sQ0FBQyxHQUFSLENBQVksSUFBWixDQUFpQixDQUFDLFdBQWxCLENBQThCLE9BQTlCO0VBRE8sQ0FyQlg7QUFEWTs7QUF5QlgsV0FBSCxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInRleHQgPSBcIlwiXCJcbmF0dGFjaGVkOiAoKSAtPlxuICB1bnNlbGVjdCA9IG51bGxcbiAgQGFkZEV2ZW50TGlzdGVuZXIgJ3NlbGVjdCcsIChldnQpID0+XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgbGF5ZXJzID0gZXZ0LmRldGFpbC5ub2RlSWQuc3BsaXQgL1xcXFxzL1xuICAgIG5vZGVJZCA9IGxheWVyc1tsYXllcnMubGVuZ3RoIC0gMV1cblxuICAgIGlmIHVuc2VsZWN0P1xuICAgICAgdW5zZWxlY3QoKVxuXG4gICAgdW5zZWxlY3QgPSBAaGlnaGxpZ2h0Tm9kZSBub2RlSWQsXG4gICAgICBmaWxsOiAnI2NjZidcbiAgICAgIHN0cm9rZTogJ25vbmUnXG4gICAgICBib3JkZXJSYWRpdXM6IDJcblwiXCJcIlxuXG5sbnMgPVxuICB0ZXh0XG4gICAgLnNwbGl0ICdcXG4nXG4gICAgLm1hcCAobG4pIC0+XG4gICAgICBsblxuICAgICAgICAuc3BsaXQgJyAgJ1xuICAgICAgICAucmVkdWNlICgoYWNjLCBwYykgLT5cbiAgICAgICAgICBpZiBwYy5sZW5ndGggaXMgMFxuICAgICAgICAgIHRoZW4gYWNjLnRhYnN0b3BzKytcbiAgICAgICAgICBlbHNlIGFjYy50ZXh0ICs9IHBjXG4gICAgICAgICAgcmV0dXJuIGFjYyksXG4gICAgICAgICAge3RhYnN0b3BzOiAwLCB0ZXh0OiAnJ31cblxucm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgJyNyb290J1xuXG5yb290LmFkZEV2ZW50TGlzdGVuZXIgJ3NlbGVjdCcsIChldnQpIC0+XG4gIGNvbnNvbGUubG9nIGV2dC5kZXRhaWxcblxubW9kZWxUb1ZpZXcgPSAoKSAtPlxuICBsbnNcbiAgICAubWFwIChsbikgLT5cbiAgICAgIGxpbmVFbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0ZXh0LWZsb3ctbGluZSdcbiAgICAgIHRleHRFbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0ZXh0LWZsb3ctcGllY2UnXG4gICAgICB0ZXh0U3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3NwYW4nXG5cbiAgICAgIG5vZGVJZHMgPSBbXCJsbiN7YXJndW1lbnRzWzFdfVwiXVxuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggL1xcLi8pP1xuICAgICAgICBub2RlSWRzLnB1c2ggJ2FjY2VzcydcbiAgICAgIGlmIChsbi50ZXh0Lm1hdGNoIC89Lyk/XG4gICAgICAgIG5vZGVJZHMucHVzaCAnYXNzaWdubWVudCdcbiAgICAgIGlmIChsbi50ZXh0Lm1hdGNoIC9cXDogLyk/XG4gICAgICAgIG5vZGVJZHMucHVzaCAnb2JqZWN0J1xuXG4gICAgICB0ZXh0U3Bhbi5pbm5lclRleHQgPSBsbi50ZXh0XG4gICAgICB0ZXh0RWxtLnNldEF0dHJpYnV0ZSAnbm9kZS1pZCcsIChub2RlSWRzLmpvaW4gJyAnKVxuICAgICAgbGluZUVsbS5zZXRBdHRyaWJ1dGUgJ2luZGVudCcsIGxuLnRhYnN0b3BzXG5cbiAgICAgIFBvbHltZXIuZG9tKHRleHRFbG0pLmFwcGVuZENoaWxkIHRleHRTcGFuXG4gICAgICBQb2x5bWVyLmRvbShsaW5lRWxtKS5hcHBlbmRDaGlsZCB0ZXh0RWxtXG4gICAgICByZXR1cm4gbGluZUVsbVxuICAgIC5mb3JFYWNoIChsaW5lRWxtKSAtPlxuICAgICAgUG9seW1lci5kb20ocm9vdCkuYXBwZW5kQ2hpbGQgbGluZUVsbVxuXG5kbyBtb2RlbFRvVmlldyJdfQ==
