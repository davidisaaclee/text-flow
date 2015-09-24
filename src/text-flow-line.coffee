Polymer
  is: 'text-flow-line'

  properties:
    indent:
      type: Number
      value: 0

  ready: () ->

  getOffsetRect: () ->
    children = @getContentChildren()

    if children.length > 0
      children
        .map (child) -> child.getOffsetRect()
        .reduce (dimensions, offsets) ->
          width: dimensions.width + offsets.width
          height: Math.max offsets.height, dimensions.height
          left: dimensions.left
          top: dimensions.top
    else
      {width: 0, height: 0, left: 0, top: 0}

  _tabStyle: (indent) ->
    "width: #{20 * indent}px;" +
    "display: inline-block;"