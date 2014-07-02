
class Stack extends Widget

  opts:
    el: null
    transition: true
    slowTime: 800

  supportHistory: !!(window.history && history.pushState)

  _init: ->
    return unless @supportHistory

    @el = $(@opts.el)
    return unless @el.length > 0

    @el.addClass 'simple-stack'
    @el.addClass 'simple-stack-transition' if @opts.transition

    @stack = []
    @_initStack()
    @currentPage.loadPage()

    $(document).off('click.stack').on 'click.stack', 'a[data-stack]', (e) =>
      e.preventDefault()
      $link = $(e.currentTarget)
      url = simple.url $link.attr 'href'
      return unless url

      $pages = @el.find '.page'
      return unless $pages.length > 0

      $page = $link.closest('.page')
      $page = $pages.last() unless $page.length > 0
      level = $pages.index $page
      page = $page.data 'pjax'

      if page != @currentPage
        return false if @currentPage.unload() == false
        $page.nextAll('.page').remove()
        @stack = @stack.slice(0, level + 1)
        @currentPage = page
        @currentPage.el.empty()
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
      #@currentPage.requestPage state
      @currentPage.loadPage()


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
      slowTime: @opts.slowTime

    pjax.on 'pushstate.pjax', (e, state) =>
      state.html = @el.html()

    pjax.on 'replacestate.pjax', (e, state) =>
      state.html = @el.html()

    pjax.on 'pjaxload', (e, $page, page) =>
      @trigger 'pageload', [$page, page]

    pjax.on 'pjaxunload', (e, $page, page) =>
      @trigger 'pageunload', [$page, page]

    $page.data 'pjax', pjax
    pjax

  load: (url, opts) ->
    if typeof url == 'string'
      url = simple.url url

    if @currentPage.request
      @currentPage.request.abort()
      @currentPage.request = null

    return false if @currentPage.unload() == false

    if opts.replace
      for page, i in @stack
        continue if page == @currentPage
        $link = page.el.find '.link-page-behind'
        pageUrl = simple.url $link.attr('href')
        if pageUrl.pathname == url.pathname
          page.el.nextAll('.page').remove()
          @stack = @stack.slice(0, i + 1)
          @currentPage = page
          @currentPage.el.empty()
          @currentPage.el.removeClass 'page-behind'
          break

      @currentPage.load url,
        nocache: opts.nocache
    else if opts.root
      @el.empty()
      $page = $('<div class="page" />')

      if opts.parent
        $parent = $('<div class="page"><a class="link-page-behind" data-stack></a></div>')
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
      prevPage = @currentPage
      $('<a/>', 
        'class': 'link-page-behind'
        'data-stack': ''
        href: simple.url().toString('relative')
        text: document.title
      ).appendTo @currentPage.el

      $page = $('<div class="page"/>')
        .addClass('transition-start')
        .appendTo(@el)
      pjax = @_initPage $page
      @stack.push pjax
      @currentPage = pjax

      @currentPage.el[0].offsetHeight # force dom reflow
      prevPage.el.addClass 'page-behind'
      @currentPage.el.removeClass 'transition-start'

      @currentPage.load url,
        nocache: opts.nocache


window.simple ||= {}

simple.stack = (opts) ->
  new Stack(opts)

