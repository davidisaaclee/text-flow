text = """
attached: () ->
  unselect = null
  @addEventListener 'select', (evt) =>
    evt.stopPropagation()
    layers = evt.detail.nodeId.split /\\s/
    nodeId = layers[layers.length - 1]

    if unselect?
      unselect()

    unselect = @highlightNode nodeId,
      fill: '#ccf'
      stroke: 'none'
      borderRadius: 2
"""

lns =
  text
    .split '\n'
    .map (ln) ->
      ln
        .split '  '
        .reduce ((acc, pc) ->
          if pc.length is 0
          then acc.tabstops++
          else acc.text += pc
          return acc),
          {tabstops: 0, text: ''}

root = document.querySelector '#root'

root.addEventListener 'select', (evt) ->
  console.log evt.detail

modelToView = () ->
  lns
    .map (ln) ->
      lineElm = document.createElement 'text-flow-line'
      textElm = document.createElement 'text-flow-piece'
      textSpan = document.createElement 'span'

      nodeIds = ["ln#{arguments[1]}"]
      if (ln.text.match /\./)?
        nodeIds.push 'access'
      if (ln.text.match /=/)?
        nodeIds.push 'assignment'
      if (ln.text.match /\: /)?
        nodeIds.push 'object'

      textSpan.innerText = ln.text
      textElm.setAttribute 'node-id', (nodeIds.join ' ')
      lineElm.setAttribute 'indent', ln.tabstops

      Polymer.dom(textElm).appendChild textSpan
      Polymer.dom(lineElm).appendChild textElm
      return lineElm
    .forEach (lineElm) ->
      Polymer.dom(root).appendChild lineElm

do modelToView