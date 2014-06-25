
class Stack extends Widget

  opts:
    el: null

  supportHistory: !!(window.history && history.pushState)

  _init: ->
    return unless @supportHistory

    @el = if @opts.el then $(@opts.el) else $('body')
    @el.addClass 'simple-stack'
    @stack = []
    @_initStack()
    @currentPage.loadPage()

    @el.on 'click', 'a[data-stack]', (e) =>
      e.preventDefault()
      $link = $(e.currentTarget)
      url = simple.url $link.attr 'href'
      return unless url

      $page = $link.closest('.page')
      level = @el.find('.page').index $page
      page = $page.data 'pjax'

      if page != @currentPage
        @currentPage.unload()
        $page.nextAll('.page').remove()
        @stack = @stack.slice(0, level + 1)
        @currentPage = page
        @currentPage.el.removeClass 'page-behind'
        @currentPage.load url,
          nocache: $link.is '[data-stack-nocache]'
        return

      if $link.is '[data-parent-name][data-parent-url]'
        parent =
          name: $link.data 'parent-name'
          url: $link.data 'parent-url'

      @load url,
        nocache: $link.is '[data-stack-nocache]'
        root: $link.is '[data-stack-root]'
        replace: $link.is '[data-stack-replace]'
        parent: parent


    $(window).off('popstate').on 'popstate.stack', (e) =>
      state = e.originalEvent.state
      return unless state

      if @currentPage and @currentPage.request
        @currentPage.request.abort()
        @currentPage.request = null

      @el.html state.html
      document.title = state.name
      @_initStack()
      @currentPage.requestPage state


  _initStack: () ->
    @stack.length = 0

    $pages = @el.find('.page')
    $pages.each (i, el) =>
      $page = $(el)
      pjax = @_initPage $page
      @stack.push pjax
      @currentPage = pjax if i == $pages.length - 1

  _initPage: ($page) ->
    $pages = @el.find('.page')
    level = $pages.index($page)
    $page.addClass 'page-' + (if level < 1 then 'root' else level)

    if level < $pages.length - 1
      $page.addClass 'page-behind'
    else
      $page.removeClass 'page-behind'

    pjax = simple.pjax
      el: $page
      autoload: false
      history: false

    pjax.on 'pushstate.pjax', (e, state) =>
      state.html = @el.html()
      history.pushState state, state.name, state.url
      document.title = state.name

    pjax.on 'replacestate.pjax', (e, state) =>
      state.html = @el.html()
      history.replaceState state, state.name, state.url
      document.title = state.name

    $page.data 'pjax', pjax
    pjax

  load: (url, opts) ->
    if @currentPage.request
      @currentPage.request.abort()
      @currentPage.request = null

    if opts.replace
      @currentPage.load url,
        nocache: opts.nocache
    else if opts.root
      @el.empty()
      $page = $('<div class="page" />')

      if opts.parent
        $parent = $('<div class="page"><a data-stack></a></div>')
          .appendTo(@el)
          .after($page)
        $parent.find('a')
          .text(opts.parent.name)
          .attr('href', simple.url().toString('relative'))
      else
        $page.appendTo @el

      @_initStack()
      @currentPage.load url,
        nocache: opts.nocache
    else
      @currentPage.unload()
      @currentPage.el.addClass 'page-behind'
      $('<a/>', 
        'data-stack': ''
        href: simple.url().toString('relative')
        text: document.title
      ).appendTo @currentPage.el

      $page = $('<div class="page"/>').appendTo(@el)
      pjax = @_initPage $page
      @stack.push pjax
      @currentPage = pjax
      @currentPage.load url,
        nocache: opts.nocache


window.simple ||= {}

simple.stack = (opts) ->
  new Stack(opts)

