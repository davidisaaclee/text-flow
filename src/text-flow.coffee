Raphael = require 'raphael'
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

  created: () ->

  ready: () ->
    @_mutationCallbacks = []
    mutObserver = new MutationObserver (records) =>
      @_mutationCallbacks.forEach (cb) ->
        cb records
      @_mutationCallbacks = []
      do @updateChildren
    mutObserver.observe @$.body, childList: true
    @_paper = Raphael @$.canvas, @$.body.offsetWidth, @$.body.offsetHeight

    @_shapes = {}
    @_shapes.highlights = {}

  attached: () ->
    @async () =>
      @_paper.setSize @$.body.offsetWidth, @$.body.offsetHeight

  updateChildren: () ->
    do @attached
    if @drawBackground
      do @_drawBackground

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

  _drawBackground: () ->
    if @_shapes.background?
      @_shapes.background.forEach (shape) -> shape.remove()

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