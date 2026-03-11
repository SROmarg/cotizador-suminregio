/* Hamburger menu toggle */
(function() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.pn-hamburger');
    if (btn) {
      var links = btn.parentElement.querySelector('.pn-links');
      if (links) {
        links.classList.toggle('open');
        btn.setAttribute('aria-expanded', links.classList.contains('open'));
      }
      return;
    }
    // Close menu when clicking outside
    if (!e.target.closest('.pn-links')) {
      var openMenus = document.querySelectorAll('.pn-links.open');
      openMenus.forEach(function(m) { m.classList.remove('open'); });
      var btns = document.querySelectorAll('.pn-hamburger');
      btns.forEach(function(b) { b.setAttribute('aria-expanded', 'false'); });
    }
  });
})();
