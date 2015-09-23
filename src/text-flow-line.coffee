Polymer
  is: 'text-flow-line'

  properties:
    indent:
      type: Number
      value: 0

  ready: () ->

  getOffsetRect: () ->
    @getContentChildren()
      .map (child) -> child.getOffsetRect()
      .reduce (dimensions, offsets) ->
        width: dimensions.width + offsets.width
        height: Math.max offsets.height, dimensions.height
        left: dimensions.left
        top: dimensions.top

  _tabStyle: (indent) ->
    "width: #{20 * indent}px;" +
    "display: inline-block;"