Polymer
  is: 'text-flow-piece'

  ready: () ->
    console.log 'text-flow-piece ready'

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