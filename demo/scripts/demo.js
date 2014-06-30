(function() {
  $(function() {
    var stack;
    return stack = simple.stack({
      el: '#page-wrapper'
    });
  });

  $(document).on('pjaxload#page-first', function($page, page) {
    return console.log('page 1 loaded');
  });

  $(document).on('pjaxload#page-second', function($page, page) {
    return console.log('page 2 loaded');
  });

  $(document).on('pjaxload#page-third', function($page, page) {
    return console.log('page 3 loaded');
  });

}).call(this);
