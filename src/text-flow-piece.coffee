Polymer
  is: 'text-flow-piece'

  properties:
    nodeId:
      type: String
      value: ''
    lineHeight:
      type: Number
      value: 20

  listeners:
    'up': '_onUp'

  ready: () ->
    @style.height = "#{@lineHeight}px"

  getOffsetRect: () ->
    width: @offsetWidth
    height: @offsetHeight
    left: @offsetLeft
    top: @offsetTop


  _onUp: () ->
    @fire 'select',
      nodeId: @nodeId