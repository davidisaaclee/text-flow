Raphael = require 'raphael'
_ = require 'lodash'
require 'text-flow-line'
require 'text-flow-piece'

Polymer
  is: 'text-flow'

  properties:
    ###
    Set to `true` to automatically draw a ragged background.
    ###
    drawBackground:
      type: Boolean
      value: false
      observer: '_drawBackgroundChanged'
    backgroundStyle:
      type: Object
      value: () -> {}
      observer: '_drawBackgroundChanged'

  created: () ->
    @_shapes =
      highlights: []
      background: []

  ready: () ->
    @_mutationCallbacks = []
    mutObserver = new MutationObserver (records) =>
      @_mutationCallbacks.forEach (cb) ->
        cb records
      @_mutationCallbacks = []
      do @updateChildren
    mutObserver.observe @$.body, childList: true
    @_paper = Raphael @$.canvas, @$.body.offsetWidth, @$.body.offsetHeight

  attached: () ->
    @async () =>
      @_paper.setSize @$.body.offsetWidth, @$.body.offsetHeight

  updateChildren: () ->
    do @attached
    if @drawBackground
      @_drawBackground @backgroundStyle

  ###
  @return All `text-flow-piece` elements with the specified node ID.
  ###
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

  ###
  Registers a callback to be invoked on the next successful child append.
  Destroys callback when invoked.

  @param [Function] cb A function taking in the mutation records as provided by
    a MutationObserver.
  ###
  onNextChildAppend: (cb) ->
    @_mutationCallbacks.push cb

  _clearBackground: () ->
    if @_shapes.background?
      @_shapes.background.forEach (shape) -> shape.remove()

  _drawBackground: (attrs) ->
    fullAttrs = _.defaults attrs,
      fill: '#fcc'

    do @_clearBackground

    baseline = Infinity
    rects =
      @getContentChildren()
        .map (child) ->
          r = child.getOffsetRect()
          if r.left < baseline
            baseline = r.left
          return r
        .map (rect) ->
          left: baseline
          top: rect.top
          width: rect.width + (rect.left - baseline)
          height: rect.height

    @_shapes.background = @_drawRects \
      @_paper,
      fullAttrs,
      rects

  _drawRects: (paper, attrs, rects) ->
    rects.map (rect) ->
      if attrs.padding?
        if _.isNumber attrs.padding
          rect =
            left: rect.left - attrs.padding
            top: rect.top - attrs.padding
            width: rect.width + attrs.padding * 2
            height: rect.height + attrs.padding * 2
        else if _.isObject attrs.padding
          padding = _.defaults attrs.padding,
            left: 0
            right: 0
            top: 0
            bottom: 0
          rect =
            left: rect.left - padding.left
            top: rect.top - padding.top
            width: rect.width + (padding.left + padding.right)
            height: rect.height + (padding.top + padding.bottom)

      elm = paper.rect rect.left, rect.top, rect.width, rect.height
      for attr, val of attrs
        elm.attr attr, val
      return elm

  _drawBackgroundChanged: () ->
    if @drawBackground
      @_drawBackground @backgroundStyle
    else
      do @_clearBackground