
class Stack extends SimpleModule

  opts:
    el: null
    title: '{{ name }}'
    transition: true
    slowTime: 800
    fluid: false

  supportHistory: !!(window.history && history.pushState)

  _init: ->
    return unless @supportHistory

    @el = $(@opts.el)
    return unless @el.length > 0

    @opts.fluid = true if @el.is '[data-stack-fluid]'

    @el.addClass 'simple-stack'
    @el.addClass 'simple-stack-fluid' if @opts.fluid

    @stack = []
    @_initStack()
    @currentPage.loadPage()

    @el[0].offsetHeight # force reflow
    @el.addClass 'simple-stack-transition' if @opts.transition

    $(document).off('click.stack').on 'click.stack', 'a[data-stack]', (e) =>
      metaKey = if /Mac/.test(navigator.userAgent) then e.metaKey else e.ctrlKey
      return if metaKey

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

      if page and page != @currentPage
        return false if @currentPage.unload() == false
        if $page.hasClass('page-root') and $link.is('[data-stack-fluid]')
          @el.addClass 'simple-stack-fluid'

        $page.nextAll('.page').remove()
        @stack = @stack.slice(0, level + 1)
        @currentPage = page
        @currentPage.el.empty()
        @currentPage.el.removeClass 'page-behind'

        @currentPage.load url,
          nocache: $link.is '[data-stack-nocache]'
          norefresh: $link.is '[data-stack-norefresh]'
          scrollPosition: true
        return

      if $link.is '[data-parent-name][data-parent-url]'
        parent =
          name: $link.data 'parent-name'
          url: $link.data 'parent-url'
          fluid: $link.is '[data-parent-fluid]'

      @load url,
        nocache: $link.is '[data-stack-nocache]'
        replace: $link.is '[data-stack-replace]'
        norefresh: $link.is '[data-stack-norefresh]'
        root: $link.is '[data-stack-root]'
        fluid: $link.is '[data-stack-fluid]'
        parent: parent


    $(window).off('popstate').on 'popstate.stack', (e) =>
      state = e.originalEvent.state
      return unless state

      if @currentPage
        if @triggerHandler('pageunload', [@currentPage.el.children().first(), @currentPage.getCache()]) == false
          return

        if @currentPage.request
          @currentPage.request.abort()
          @currentPage.request = null

      @el.html state.html
      @el.toggleClass 'simple-stack-fluid', state.fluid
      @_initStack()

      page = @currentPage.getCache state.url
      unless page
        location.reload()
        return

      @currentPage.el.html page.html
      @el[0].offsetHeight
      @currentPage.pageTitle state.name
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
      title: @opts.title
      autoload: false
      history: false
      slowTime: @opts.slowTime

    pjax.on 'pushstate.pjax', (e, state) =>
      $el = @el.clone()
      $el.find('.page:last').empty()
      state.html = $el.html()
      state.fluid = @el.hasClass('simple-stack-fluid')

    pjax.on 'replacestate.pjax', (e, state) =>
      $el = @el.clone()
      $el.find('.page:last').empty()
      state.html = $el.html()
      state.fluid = @el.hasClass('simple-stack-fluid')

    pjax.on 'pjaxload', (e, $page, page, xhr) =>
      @trigger 'pageload', [$page, page, xhr]

    pjax.on 'pjaxunload', (e, $page, page) =>
      @triggerHandler 'pageunload', [$page, page]

    $page.data 'pjax', pjax
    pjax

  load: (url, opts = {}) ->
    return unless @currentPage
    if typeof url == 'string'
      url = simple.url url

    if @currentPage.request
      @currentPage.request.abort()
      @currentPage.request = null


    if opts.root
      return false if @currentPage.unload() == false
      @el.empty()
      @el.toggleClass 'simple-stack-fluid', opts.fluid || false
      $page = $('<div class="page" />')

      if opts.parent
        $parent = $('<div class="page"><a class="link-page-behind" data-stack></a></div>')
          .appendTo(@el)
          .after($page)
        $link = $parent.find('a')
          .text(opts.parent.name)
          .attr('href', opts.parent.url)

        $link.attr('data-stack-fluid', '') if opts.parent.fluid
      else
        $page.appendTo @el

      @_initStack()
      @currentPage.load url,
        nocache: opts.nocache
        norefresh: opts.norefresh

    else if opts.replace
      return false if @currentPage.unload() == false
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
        norefresh: opts.norefresh
    else
      prevPage = @currentPage
      $prevPage = prevPage.el.children().first()
      prevPageName = $prevPage.data('page-name') || prevPage.pageTitle()

      return false if @currentPage.unload() == false

      $link = $('<a/>',
        'class': 'link-page-behind'
        'data-stack': ''
        href: simple.url().toString('relative')
        text: prevPageName
      ).appendTo @currentPage.el

      if @el.hasClass 'simple-stack-fluid'
        $link.attr 'data-stack-fluid', ''
        @el.removeClass 'simple-stack-fluid'

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
        norefresh: opts.norefresh

      prevPage.el.height ''

  @clearCache: (url) ->
    simple.pjax.clearCache url


stack = (opts) ->
  new Stack(opts)

stack.clearCache = Stack.clearCache


