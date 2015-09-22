TreeModel = require 'TreeModel'
TreeTransformer = require 'TreeTransformer'


makeDemoElement = () -> new DemoElement()

makeBElement = (model) ->
  () ->
    elt = document.createElement 'span'
    elt.innerText = 'spanner'
    elt.classList.add 'b'

    button = document.createElement 'button'
    button.innerText = 'Add'
    elt.appendChild button
    button.addEventListener 'click', () ->
      model.put ["__reservedkey#{model.childList.length}__"], type: 'a'

    content = document.createElement 'span'
    content.classList.add 'children'
    content.classList.add 'b-children'

    elt.appendChild content

    return elt

treeView = document.querySelector '#tree-view'
# treeView.directAppend = true
rawModel = new TreeModel type: 'a'
transformer = new TreeTransformer (val) -> new TreeModel val

nodeCount = 0

transformer.addNodeCase \
  (val, model) -> val.type is 'a',
  (val, model) ->
    instantiate: makeDemoElement
    # getChildrenInsertPoint: (elm) -> elm.querySelector '.children',
    getChildrenInsertPoint: (elm) -> elm,
  (val) ->
    r = new TreeModel val
    r.nodeKind = "a#{nodeCount++}"
    return r

transformer.addNodeCase \
  (val, model) -> val.type is 'b',
  (val, model) ->
    instantiate: makeBElement model
    getChildrenInsertPoint: (elm) -> elm.querySelector '.children',
  (val) ->
    r = new TreeModel val
    r.nodeKind = "b#{nodeCount++}"
    return r

transformer.watch rawModel, (transformed, original) ->
  treeView.update transformed

rawModel.batchMutate (model) ->
  model.put ['a'], type: 'a'
  model.put ['b'], type: 'b'
  model.put ['a', 'b1'], type: 'b'
  model.put ['a', 'a1'], type: 'a'
  model.put ['a', 'b2'], type: 'b'
  model.put ['a', 'a2'], type: 'a'