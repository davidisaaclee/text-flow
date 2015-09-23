Polymer
  is: 'text-flow-piece'

  properties:
    nodeId:
      type: String
      value: ''

  listeners:
    'up': '_onUp'

  getOffsetRect: () ->
    width: @offsetWidth
    height: @offsetHeight
    left: @offsetLeft
    top: @offsetTop


  _onUp: () ->
    @fire 'select',
      nodeId: @nodeId