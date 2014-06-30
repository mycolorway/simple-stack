
$ ->
  stack = simple.stack
    el: '#page-wrapper'

$(document).on 'pjaxload#page-first', ($page, page) ->
  console.log 'page 1 loaded'

$(document).on 'pjaxload#page-second', ($page, page) ->
  console.log 'page 2 loaded'

$(document).on 'pjaxload#page-third', ($page, page) ->
  console.log 'page 3 loaded'
