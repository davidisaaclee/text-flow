document.addEventListener 'WebComponentsReady', () ->
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
  document.querySelector '#draw-background'
    .addEventListener 'change', (evt) ->
      root.drawBackground = evt.target.checked
  root.drawBackground = true
  root.backgroundStyle =
    fill: 'rgba(100, 100, 200, 0.2)'
    stroke: 'none'
    r: '2px'
    padding:
      right: 10

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
      .forEach (lineElm, idx) ->
        setTimeout \
          (() ->
            # root.onNextChildAppend () ->
            #   console.log 'added child ', idx
            #   root._drawBackground
            #     fill: 'rgba(100, 100, 200, 0.2)'
            #     stroke: 'none'
            #     r: '2px'
            #     padding:
            #       right: 10


            Polymer.dom(root).appendChild lineElm),
          idx * 500

  do modelToView