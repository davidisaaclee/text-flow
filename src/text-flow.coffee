Raphael = require 'raphael'
require 'text-flow-line'
require 'text-flow-piece'

Polymer
  is: 'text-flow'

  ready: () ->
    @_paper = Raphael @$.canvas, @$.body.offsetWidth, @$.body.offsetHeight

    @_shapes = {}
    @_shapes.highlights = {}

  attached: () ->
    unselect = null
    @addEventListener 'select', (evt) =>
      evt.stopPropagation()
      layers = evt.detail.nodeId.split /\s/
      nodeId = layers[layers.length - 1]

      if unselect?
        unselect()

      unselect = @highlightNode nodeId,
        fill: '#ccf'
        stroke: 'none'
        borderRadius: 2

    @async () =>
      @_paper.setSize @$.body.offsetWidth, @$.body.offsetHeight
      # @drawBackground()

  updateChildren: () -> do @attached

  getPiecesForNode: (nodeId) ->
    @getContentChildren()
      .map (elm) ->
        Array.prototype.slice.call elm.querySelectorAll 'text-flow-piece'
      .reduce (acc, elm) ->
        acc.concat elm
      .filter (pc) ->
        pc.nodeId
          .split /\s/
          .filter (id) -> id is nodeId
          .length > 0

  highlightNode: (nodeId, attrs) ->
    rects =
      (@getPiecesForNode nodeId)
        .map (pc) -> pc.getOffsetRect()
    @_shapes.highlights[nodeId] = @_drawRects @_paper, attrs, rects

    return () => @_shapes.highlights[nodeId].forEach (shape) -> shape.remove()

  drawBackground: () ->
    attrs =
      fill: '#fcc'
      stroke: 'none'
      borderRadius: 4
    rects =
      @getContentChildren()
        .map (child) -> child.getOffsetRect()

    @_drawRects \
      @_paper,
      attrs,
      rects

  _drawRects: (paper, attrs, rects) ->
    rects.map (rect) ->
      borderRadius =
        if attrs.borderRadius?
        then attrs.borderRadius
        else 0
      elm = paper.rect rect.left, rect.top, rect.width, rect.height, borderRadius
      for attr, val of attrs
        elm.attr attr, val
      return elm