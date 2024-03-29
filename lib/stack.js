(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define('simple-stack', ["jquery","simple-module","simple-pjax","simple-url"], function (a0,b1,c2,d3) {
      return (root['stack'] = factory(a0,b1,c2,d3));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("jquery"),require("simple-module"),require("simple-pjax"),require("simple-url"));
  } else {
    root.simple = root.simple || {};
    root.simple['stack'] = factory(root["jQuery"],root["SimpleModule"],root["simple.pjax"],root["simple.url"]);
  }
}(this, function ($, SimpleModule, simplePjax, simpleUrl) {

var Stack, stack,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Stack = (function(superClass) {
  extend(Stack, superClass);

  function Stack() {
    return Stack.__super__.constructor.apply(this, arguments);
  }

  Stack.prototype.opts = {
    el: null,
    title: '{{ name }}',
    transition: true,
    slowTime: 800,
    fluid: false,
    fullscreen: false
  };

  Stack.prototype.supportHistory = !!(window.history && history.pushState);

  Stack.prototype._init = function() {
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
    if (this.el.is('[data-stack-fullscreen]')) {
      this.opts.fullscreen = true;
    }
    this.el.addClass('simple-stack');
    if (this.opts.fluid) {
      this.el.addClass('simple-stack-fluid');
    }
    if (this.opts.fullscreen) {
      this.el.addClass('simple-stack-fullscreen');
    }
    this.stack = [];
    this._initStack();
    this.currentPage.loadPage();
    this.el[0].offsetHeight;
    if (this.opts.transition) {
      this.el.addClass('simple-stack-transition');
    }
    $(document).off('click.stack').on('click.stack', 'a[data-stack]', (function(_this) {
      return function(e) {
        var $link, $page, $pages, level, metaKey, page, parent, url;
        metaKey = /Mac/.test(navigator.userAgent) ? e.metaKey : e.ctrlKey;
        if (metaKey) {
          return;
        }
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
        if (page && page !== _this.currentPage) {
          if (_this.currentPage.unload() === false) {
            return false;
          }
          if ($page.hasClass('page-root')) {
            if ($link.is('[data-stack-fluid]')) {
              _this.el.addClass('simple-stack-fluid');
            }
            if ($link.is('[data-stack-fullscreen]')) {
              _this.el.addClass('simple-stack-fullscreen');
            }
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
          fullscreen: $link.is('[data-stack-fullscreen]'),
          scrollPosition: $link.is('[data-stack-scroll-position]'),
          parent: parent
        });
      };
    })(this));
    return $(window).off('popstate').on('popstate.stack', (function(_this) {
      return function(e) {
        var page, state;
        state = e.originalEvent.state;
        if (!state) {
          return;
        }
        if (_this.currentPage) {
          if (_this.triggerHandler('pageunload', [_this.currentPage.el.children().first(), _this.currentPage.getCache()]) === false) {
            return;
          }
          if (_this.currentPage.request) {
            _this.currentPage.request.abort();
            _this.currentPage.request = null;
          }
        }
        _this.el.html(state.html);
        _this.el.toggleClass('simple-stack-fluid', state.fluid);
        _this.el.toggleClass('simple-stack-fullscreen', state.fullscreen);
        _this._initStack();
        page = _this.currentPage.getCache(state.url);
        if (!page) {
          location.reload();
          return;
        }
        _this.currentPage.el.html(page.html);
        _this.el[0].offsetHeight;
        _this.currentPage.pageTitle(state.name);
        return _this.currentPage.loadPage();
      };
    })(this));
  };

  Stack.prototype._initStack = function() {
    var $pages;
    this.stack.length = 0;
    $pages = this.el.find('.page');
    return $pages.each((function(_this) {
      return function(i, el) {
        var $page, pjax;
        $page = $(el);
        pjax = _this._initPage($page);
        _this.stack.push(pjax);
        if (i === $pages.length - 1) {
          return _this.currentPage = pjax;
        }
      };
    })(this));
  };

  Stack.prototype._initPage = function($page) {
    var $pages, level, pjax;
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
    pjax.on('pushstate.pjax', (function(_this) {
      return function(e, state) {
        var $el;
        $el = _this.el.clone();
        $el.find('.page:last').empty();
        state.html = $el.html();
        state.fluid = _this.el.hasClass('simple-stack-fluid');
        return state.fullscreen = _this.el.hasClass('simple-stack-fullscreen');
      };
    })(this));
    pjax.on('replacestate.pjax', (function(_this) {
      return function(e, state) {
        var $el;
        $el = _this.el.clone();
        $el.find('.page:last').empty();
        state.html = $el.html();
        state.fluid = _this.el.hasClass('simple-stack-fluid');
        return state.fullscreen = _this.el.hasClass('simple-stack-fullscreen');
      };
    })(this));
    pjax.on('pjaxbeforeload', (function(_this) {
      return function(e, page) {
        return _this.trigger('pagebeforeload', [page]);
      };
    })(this));
    pjax.on('pjaxload', (function(_this) {
      return function(e, $page, page, xhr) {
        return _this.trigger('pageload', [$page, page, xhr]);
      };
    })(this));
    pjax.on('pjaxunload', (function(_this) {
      return function(e, $page, page) {
        return _this.triggerHandler('pageunload', [$page, page]);
      };
    })(this));
    $page.data('pjax', pjax);
    return pjax;
  };

  Stack.prototype.load = function(url, opts) {
    var $link, $page, $parent, $prevPage, i, j, len, page, pageUrl, pjax, prevPage, prevPageName, ref;
    if (opts == null) {
      opts = {};
    }
    if (!this.currentPage) {
      return;
    }
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
      this.el.toggleClass('simple-stack-fullscreen', opts.fullscreen || false);
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
        norefresh: opts.norefresh,
        scrollPosition: opts.scrollPosition
      });
    } else if (opts.replace) {
      if (this.currentPage.unload() === false) {
        return false;
      }
      ref = this.stack;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        page = ref[i];
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
        norefresh: opts.norefresh,
        scrollPosition: opts.scrollPosition
      });
    } else {
      prevPage = this.currentPage;
      $prevPage = prevPage.el.children().first();
      prevPageName = $prevPage.data('page-name') || prevPage.pageTitle();
      prevPageName = String(prevPageName).replace(/&/g, '&amp;')
                                         .replace(/"/g, '&quot;')
                                         .replace(/'/g, '&#39;')
                                         .replace(/</g, '&lt;')
                                         .replace(/>/g, '&gt;');
      if (this.currentPage.unload() === false) {
        return false;
      }
      $link = $('<a/>', {
        'class': 'link-page-behind',
        'data-stack': '',
        href: simple.url().toString('relative'),
        html: prevPageName
      }).appendTo(this.currentPage.el);
      if (this.el.hasClass('simple-stack-fluid')) {
        $link.attr('data-stack-fluid', '');
        this.el.removeClass('simple-stack-fluid');
      }
      if (this.el.hasClass('simple-stack-fullscreen')) {
        $link.attr('data-stack-fullscreen', '');
        this.el.removeClass('simple-stack-fullscreen');
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
        norefresh: opts.norefresh,
        scrollPosition: opts.scrollPosition
      });
      return prevPage.el.height('');
    }
  };

  Stack.clearCache = function(url) {
    return simple.pjax.clearCache(url);
  };

  return Stack;

})(SimpleModule);

stack = function(opts) {
  return new Stack(opts);
};

stack.clearCache = Stack.clearCache;

return stack;

}));
