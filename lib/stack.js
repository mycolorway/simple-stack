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
      transition: true,
      slowTime: 800
    };

    Stack.prototype.supportHistory = !!(window.history && history.pushState);

    Stack.prototype._init = function() {
      var _this = this;
      if (!this.supportHistory) {
        return;
      }
      this.el = this.opts.el ? $(this.opts.el) : $('body');
      this.el.addClass('simple-stack');
      if (this.opts.transition) {
        this.el.addClass('simple-stack-transition');
      }
      this.stack = [];
      this._initStack();
      this.currentPage.loadPage();
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
          $page.nextAll('.page').remove();
          _this.stack = _this.stack.slice(0, level + 1);
          _this.currentPage = page;
          _this.currentPage.el.empty();
          _this.currentPage.el.removeClass('page-behind');
          _this.currentPage.load(url, {
            nocache: $link.is('[data-stack-nocache]')
          });
          return;
        }
        if ($link.is('[data-parent-name][data-parent-url]')) {
          parent = {
            name: $link.data('parent-name'),
            url: $link.data('parent-url')
          };
        }
        return _this.load(url, {
          nocache: $link.is('[data-stack-nocache]'),
          root: $link.is('[data-stack-root]'),
          replace: $link.is('[data-stack-replace]'),
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
        document.title = state.name;
        _this._initStack();
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
        autoload: false,
        history: false,
        slowTime: this.opts.slowTime
      });
      pjax.on('pushstate.pjax', function(e, state) {
        return state.html = _this.el.html();
      });
      pjax.on('replacestate.pjax', function(e, state) {
        return state.html = _this.el.html();
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
      var $link, $page, $parent, i, page, pageUrl, pjax, prevPage, _i, _len, _ref1;
      if (typeof url === 'string') {
        url = simple.url(url);
      }
      if (this.currentPage.request) {
        this.currentPage.request.abort();
        this.currentPage.request = null;
      }
      if (opts.replace) {
        _ref1 = this.stack;
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          page = _ref1[i];
          $link = page.el.find('.link-page-behind');
          pageUrl = simple.url($link.attr('href'));
          if (pageUrl.pathname === url.pathname && page !== this.currentPage) {
            if (this.currentPage.unload() === false) {
              return false;
            }
            page.el.nextAll('.page').remove();
            this.stack = this.stack.slice(0, i + 1);
            this.currentPage = page;
            this.currentPage.el.empty();
            this.currentPage.el.removeClass('page-behind');
            break;
          }
        }
        return this.currentPage.load(url, {
          nocache: opts.nocache
        });
      } else if (opts.root) {
        this.el.empty();
        $page = $('<div class="page" />');
        if (opts.parent) {
          $parent = $('<div class="page"><a class="link-page-behind" data-stack></a></div>').appendTo(this.el).after($page);
          $parent.find('a').text(opts.parent.name).attr('href', simple.url().toString('relative'));
        } else {
          $page.appendTo(this.el);
        }
        this._initStack();
        return this.currentPage.load(url, {
          nocache: opts.nocache
        });
      } else {
        if (this.currentPage.unload() === false) {
          return false;
        }
        prevPage = this.currentPage;
        $('<a/>', {
          'class': 'link-page-behind',
          'data-stack': '',
          href: simple.url().toString('relative'),
          text: document.title
        }).appendTo(this.currentPage.el);
        $page = $('<div class="page"/>').addClass('transition-start').appendTo(this.el);
        pjax = this._initPage($page);
        this.stack.push(pjax);
        this.currentPage = pjax;
        this.currentPage.el[0].offsetHeight;
        prevPage.el.addClass('page-behind');
        this.currentPage.el.removeClass('transition-start');
        return this.currentPage.load(url, {
          nocache: opts.nocache
        });
      }
    };

    return Stack;

  })(Widget);

  window.simple || (window.simple = {});

  simple.stack = function(opts) {
    return new Stack(opts);
  };

}).call(this);
