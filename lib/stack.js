(function() {
  var Stack, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Stack = (function(_super) {
    __extends(Stack, _super);

    function Stack() {
      _ref = Stack.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Stack.prototype.opts = {
      el: null,
      title: '{{ name }}',
      transition: true,
      slowTime: 800,
      fluid: false
    };

    Stack.prototype.supportHistory = !!(window.history && history.pushState);

    Stack.prototype._init = function() {
      var _this = this;
      if (!this.supportHistory) {
        return;
      }
      this.el = $(this.opts.el);
      if (!(this.el.length > 0)) {
        return;
      }
      if (this.el.is('[data-stack-fluid]')) {
        this.opts.fluid = true;
      }
      this.el.addClass('simple-stack');
      if (this.opts.fluid) {
        this.el.addClass('simple-stack-fluid');
      }
      this.stack = [];
      this._initStack();
      this.currentPage.loadPage();
      this.el[0].offsetHeight;
      if (this.opts.transition) {
        this.el.addClass('simple-stack-transition');
      }
      $(document).off('click.stack').on('click.stack', 'a[data-stack]', function(e) {
        var $link, $page, $pages, level, page, parent, url;
        e.preventDefault();
        $link = $(e.currentTarget);
        url = simple.url($link.attr('href'));
        if (!url) {
          return;
        }
        $pages = _this.el.find('.page');
        if (!($pages.length > 0)) {
          return;
        }
        $page = $link.closest('.page');
        if (!($page.length > 0)) {
          $page = $pages.last();
        }
        level = $pages.index($page);
        page = $page.data('pjax');
        if (page !== _this.currentPage) {
          if (_this.currentPage.unload() === false) {
            return false;
          }
          if ($page.hasClass('page-root') && $link.is('[data-stack-fluid]')) {
            _this.el.addClass('simple-stack-fluid');
          }
          $page.nextAll('.page').remove();
          _this.stack = _this.stack.slice(0, level + 1);
          _this.currentPage = page;
          _this.currentPage.el.empty();
          _this.currentPage.el.removeClass('page-behind');
          _this.currentPage.load(url, {
            nocache: $link.is('[data-stack-nocache]'),
            norefresh: $link.is('[data-stack-norefresh]'),
            scrollPosition: true
          });
          return;
        }
        if ($link.is('[data-parent-name][data-parent-url]')) {
          parent = {
            name: $link.data('parent-name'),
            url: $link.data('parent-url'),
            fluid: $link.is('[data-parent-fluid]')
          };
        }
        return _this.load(url, {
          nocache: $link.is('[data-stack-nocache]'),
          replace: $link.is('[data-stack-replace]'),
          norefresh: $link.is('[data-stack-norefresh]'),
          root: $link.is('[data-stack-root]'),
          fluid: $link.is('[data-stack-fluid]'),
          parent: parent
        });
      });
      return $(window).off('popstate').on('popstate.stack', function(e) {
        var state;
        state = e.originalEvent.state;
        if (!state) {
          return;
        }
        if (_this.currentPage && _this.currentPage.request) {
          _this.currentPage.request.abort();
          _this.currentPage.request = null;
        }
        _this.el.html(state.html);
        _this.el.toggleClass('simple-stack-fluid', state.fluid);
        _this._initStack();
        _this.currentPage.pageTitle(state.name);
        return _this.currentPage.loadPage();
      });
    };

    Stack.prototype._initStack = function() {
      var $pages,
        _this = this;
      this.stack.length = 0;
      $pages = this.el.find('.page');
      return $pages.each(function(i, el) {
        var $page, pjax;
        $page = $(el);
        pjax = _this._initPage($page);
        _this.stack.push(pjax);
        if (i === $pages.length - 1) {
          return _this.currentPage = pjax;
        }
      });
    };

    Stack.prototype._initPage = function($page) {
      var $pages, level, pjax,
        _this = this;
      $pages = this.el.find('.page');
      level = $pages.index($page);
      $page.addClass('page-' + (level < 1 ? 'root' : level));
      if (level < $pages.length - 1) {
        $page.addClass('page-behind');
      } else {
        $page.removeClass('page-behind');
      }
      pjax = simple.pjax({
        el: $page,
        title: this.opts.title,
        autoload: false,
        history: false,
        slowTime: this.opts.slowTime
      });
      pjax.on('pushstate.pjax', function(e, state) {
        state.html = _this.el.html();
        return state.fluid = _this.el.hasClass('simple-stack-fluid');
      });
      pjax.on('replacestate.pjax', function(e, state) {
        state.html = _this.el.html();
        return state.fluid = _this.el.hasClass('simple-stack-fluid');
      });
      pjax.on('pjaxload', function(e, $page, page) {
        return _this.trigger('pageload', [$page, page]);
      });
      pjax.on('pjaxunload', function(e, $page, page) {
        return _this.trigger('pageunload', [$page, page]);
      });
      $page.data('pjax', pjax);
      return pjax;
    };

    Stack.prototype.load = function(url, opts) {
      var $link, $page, $parent, $prevPage, i, page, pageUrl, pjax, prevPage, prevPageName, _i, _len, _ref1;
      if (typeof url === 'string') {
        url = simple.url(url);
      }
      if (this.currentPage.request) {
        this.currentPage.request.abort();
        this.currentPage.request = null;
      }
      if (opts.root) {
        if (this.currentPage.unload() === false) {
          return false;
        }
        this.el.empty();
        this.el.toggleClass('simple-stack-fluid', opts.fluid || false);
        $page = $('<div class="page" />');
        if (opts.parent) {
          $parent = $('<div class="page"><a class="link-page-behind" data-stack></a></div>').appendTo(this.el).after($page);
          $link = $parent.find('a').text(opts.parent.name).attr('href', opts.parent.url);
          if (opts.parent.fluid) {
            $link.attr('data-stack-fluid', '');
          }
        } else {
          $page.appendTo(this.el);
        }
        this._initStack();
        return this.currentPage.load(url, {
          nocache: opts.nocache,
          norefresh: opts.norefresh
        });
      } else if (opts.replace) {
        if (this.currentPage.unload() === false) {
          return false;
        }
        _ref1 = this.stack;
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          page = _ref1[i];
          if (page === this.currentPage) {
            continue;
          }
          $link = page.el.find('.link-page-behind');
          pageUrl = simple.url($link.attr('href'));
          if (pageUrl.pathname === url.pathname) {
            page.el.nextAll('.page').remove();
            this.stack = this.stack.slice(0, i + 1);
            this.currentPage = page;
            this.currentPage.el.empty();
            this.currentPage.el.removeClass('page-behind');
            break;
          }
        }
        return this.currentPage.load(url, {
          nocache: opts.nocache,
          norefresh: opts.norefresh
        });
      } else {
        prevPage = this.currentPage;
        $prevPage = prevPage.el.children().first();
        prevPageName = $prevPage.data('page-name') || prevPage.pageTitle();
        if (this.currentPage.unload() === false) {
          return false;
        }
        $link = $('<a/>', {
          'class': 'link-page-behind',
          'data-stack': '',
          href: simple.url().toString('relative'),
          text: prevPageName
        }).appendTo(this.currentPage.el);
        if (this.el.hasClass('simple-stack-fluid')) {
          $link.attr('data-stack-fluid', '');
          this.el.removeClass('simple-stack-fluid');
        }
        $page = $('<div class="page"/>').addClass('transition-start').appendTo(this.el);
        pjax = this._initPage($page);
        this.stack.push(pjax);
        this.currentPage = pjax;
        this.currentPage.el[0].offsetHeight;
        prevPage.el.addClass('page-behind');
        this.currentPage.el.removeClass('transition-start');
        this.currentPage.load(url, {
          nocache: opts.nocache,
          norefresh: opts.norefresh
        });
        return prevPage.el.height('');
      }
    };

    Stack.clearCache = function(url) {
      return simple.pjax.clearCache(url);
    };

    return Stack;

  })(Widget);

  window.simple || (window.simple = {});

  simple.stack = function(opts) {
    return new Stack(opts);
  };

  simple.stack.clearCache = Stack.clearCache;

}).call(this);
