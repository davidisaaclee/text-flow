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
        return root._drawBackground();
      });
      return Polymer.dom(root).appendChild(lineElm);
    }), idx * 500);
  });
};

modelToView();


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvdGV4dC1mbG93L3NyYy9kZW1vL3RleHQtZmxvdy1kZW1vLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUE7O0FBQUEsSUFBQSxHQUFPOztBQWlCUCxHQUFBLEdBQ0UsSUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxHQUZILENBRU8sU0FBQyxFQUFEO1NBQ0gsRUFDRSxDQUFDLEtBREgsQ0FDUyxJQURULENBRUUsQ0FBQyxNQUZILENBRVUsQ0FBQyxTQUFDLEdBQUQsRUFBTSxFQUFOO0lBQ1AsSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLENBQWhCO01BQ0ssR0FBRyxDQUFDLFFBQUosR0FETDtLQUFBLE1BQUE7TUFFSyxHQUFHLENBQUMsSUFBSixJQUFZLEdBRmpCOztBQUdBLFdBQU87RUFKQSxDQUFELENBRlYsRUFPSTtJQUFDLFFBQUEsRUFBVSxDQUFYO0lBQWMsSUFBQSxFQUFNLEVBQXBCO0dBUEo7QUFERyxDQUZQOztBQVlGLElBQUEsR0FBTyxRQUFRLENBQUMsYUFBVCxDQUF1QixPQUF2Qjs7QUFDUCxJQUFJLENBQUMsY0FBTCxHQUFzQjs7QUFFdEIsSUFBSSxDQUFDLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLFNBQUMsR0FBRDtTQUM5QixPQUFPLENBQUMsR0FBUixDQUFZLEdBQUcsQ0FBQyxNQUFoQjtBQUQ4QixDQUFoQzs7QUFHQSxXQUFBLEdBQWMsU0FBQTtTQUNaLEdBQ0UsQ0FBQyxHQURILENBQ08sU0FBQyxFQUFEO0FBQ0gsUUFBQTtJQUFBLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixnQkFBdkI7SUFDVixPQUFBLEdBQVUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsaUJBQXZCO0lBQ1YsUUFBQSxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCO0lBRVgsT0FBQSxHQUFVLENBQUMsSUFBQSxHQUFLLFNBQVUsQ0FBQSxDQUFBLENBQWhCO0lBQ1YsSUFBRyw2QkFBSDtNQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsUUFBYixFQURGOztJQUVBLElBQUcsNEJBQUg7TUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLFlBQWIsRUFERjs7SUFFQSxJQUFHLDhCQUFIO01BQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxRQUFiLEVBREY7O0lBR0EsUUFBUSxDQUFDLFNBQVQsR0FBcUIsRUFBRSxDQUFDO0lBQ3hCLE9BQU8sQ0FBQyxZQUFSLENBQXFCLFNBQXJCLEVBQWlDLE9BQU8sQ0FBQyxJQUFSLENBQWEsR0FBYixDQUFqQztJQUNBLE9BQU8sQ0FBQyxZQUFSLENBQXFCLFFBQXJCLEVBQStCLEVBQUUsQ0FBQyxRQUFsQztJQUVBLE9BQU8sQ0FBQyxHQUFSLENBQVksT0FBWixDQUFvQixDQUFDLFdBQXJCLENBQWlDLFFBQWpDO0lBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxPQUFaLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsT0FBakM7QUFDQSxXQUFPO0VBbkJKLENBRFAsQ0FxQkUsQ0FBQyxPQXJCSCxDQXFCVyxTQUFDLE9BQUQsRUFBVSxHQUFWO1dBQ1AsVUFBQSxDQUNFLENBQUMsU0FBQTtNQUNDLElBQUksQ0FBQyxpQkFBTCxDQUF1QixTQUFBO1FBQ3JCLE9BQU8sQ0FBQyxHQUFSLENBQVksY0FBWixFQUE0QixHQUE1QjtlQUNBLElBQUksQ0FBQyxlQUFMLENBQUE7TUFGcUIsQ0FBdkI7YUFJQSxPQUFPLENBQUMsR0FBUixDQUFZLElBQVosQ0FBaUIsQ0FBQyxXQUFsQixDQUE4QixPQUE5QjtJQUxELENBQUQsQ0FERixFQU9FLEdBQUEsR0FBTSxHQVBSO0VBRE8sQ0FyQlg7QUFEWTs7QUFnQ1gsV0FBSCxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInRleHQgPSBcIlwiXCJcbmF0dGFjaGVkOiAoKSAtPlxuICB1bnNlbGVjdCA9IG51bGxcbiAgQGFkZEV2ZW50TGlzdGVuZXIgJ3NlbGVjdCcsIChldnQpID0+XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgbGF5ZXJzID0gZXZ0LmRldGFpbC5ub2RlSWQuc3BsaXQgL1xcXFxzL1xuICAgIG5vZGVJZCA9IGxheWVyc1tsYXllcnMubGVuZ3RoIC0gMV1cblxuICAgIGlmIHVuc2VsZWN0P1xuICAgICAgdW5zZWxlY3QoKVxuXG4gICAgdW5zZWxlY3QgPSBAaGlnaGxpZ2h0Tm9kZSBub2RlSWQsXG4gICAgICBmaWxsOiAnI2NjZidcbiAgICAgIHN0cm9rZTogJ25vbmUnXG4gICAgICBib3JkZXJSYWRpdXM6IDJcblwiXCJcIlxuXG5sbnMgPVxuICB0ZXh0XG4gICAgLnNwbGl0ICdcXG4nXG4gICAgLm1hcCAobG4pIC0+XG4gICAgICBsblxuICAgICAgICAuc3BsaXQgJyAgJ1xuICAgICAgICAucmVkdWNlICgoYWNjLCBwYykgLT5cbiAgICAgICAgICBpZiBwYy5sZW5ndGggaXMgMFxuICAgICAgICAgIHRoZW4gYWNjLnRhYnN0b3BzKytcbiAgICAgICAgICBlbHNlIGFjYy50ZXh0ICs9IHBjXG4gICAgICAgICAgcmV0dXJuIGFjYyksXG4gICAgICAgICAge3RhYnN0b3BzOiAwLCB0ZXh0OiAnJ31cblxucm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgJyNyb290J1xucm9vdC5kcmF3QmFja2dyb3VuZCA9IGZhbHNlXG5cbnJvb3QuYWRkRXZlbnRMaXN0ZW5lciAnc2VsZWN0JywgKGV2dCkgLT5cbiAgY29uc29sZS5sb2cgZXZ0LmRldGFpbFxuXG5tb2RlbFRvVmlldyA9ICgpIC0+XG4gIGxuc1xuICAgIC5tYXAgKGxuKSAtPlxuICAgICAgbGluZUVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RleHQtZmxvdy1saW5lJ1xuICAgICAgdGV4dEVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RleHQtZmxvdy1waWVjZSdcbiAgICAgIHRleHRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3BhbidcblxuICAgICAgbm9kZUlkcyA9IFtcImxuI3thcmd1bWVudHNbMV19XCJdXG4gICAgICBpZiAobG4udGV4dC5tYXRjaCAvXFwuLyk/XG4gICAgICAgIG5vZGVJZHMucHVzaCAnYWNjZXNzJ1xuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggLz0vKT9cbiAgICAgICAgbm9kZUlkcy5wdXNoICdhc3NpZ25tZW50J1xuICAgICAgaWYgKGxuLnRleHQubWF0Y2ggL1xcOiAvKT9cbiAgICAgICAgbm9kZUlkcy5wdXNoICdvYmplY3QnXG5cbiAgICAgIHRleHRTcGFuLmlubmVyVGV4dCA9IGxuLnRleHRcbiAgICAgIHRleHRFbG0uc2V0QXR0cmlidXRlICdub2RlLWlkJywgKG5vZGVJZHMuam9pbiAnICcpXG4gICAgICBsaW5lRWxtLnNldEF0dHJpYnV0ZSAnaW5kZW50JywgbG4udGFic3RvcHNcblxuICAgICAgUG9seW1lci5kb20odGV4dEVsbSkuYXBwZW5kQ2hpbGQgdGV4dFNwYW5cbiAgICAgIFBvbHltZXIuZG9tKGxpbmVFbG0pLmFwcGVuZENoaWxkIHRleHRFbG1cbiAgICAgIHJldHVybiBsaW5lRWxtXG4gICAgLmZvckVhY2ggKGxpbmVFbG0sIGlkeCkgLT5cbiAgICAgIHNldFRpbWVvdXQgXFxcbiAgICAgICAgKCgpIC0+XG4gICAgICAgICAgcm9vdC5vbk5leHRDaGlsZEFwcGVuZCAoKSAtPlxuICAgICAgICAgICAgY29uc29sZS5sb2cgJ2FkZGVkIGNoaWxkICcsIGlkeFxuICAgICAgICAgICAgcm9vdC5fZHJhd0JhY2tncm91bmQoKVxuXG4gICAgICAgICAgUG9seW1lci5kb20ocm9vdCkuYXBwZW5kQ2hpbGQgbGluZUVsbSksXG4gICAgICAgIGlkeCAqIDUwMFxuXG5kbyBtb2RlbFRvVmlldyJdfQ==
