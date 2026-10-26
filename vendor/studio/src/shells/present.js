/* The deck runtime: navigation, the counter and fullscreen. A classic script, last child of <body>:
   no module, no fetch, no timer, no autoplay. The only effect of a key press is the user-triggered
   slide change; nothing runs until a key or a control is used. */
(function () {
  'use strict'

  var stage = document.querySelector('.stage')
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'))
  var counter = stage.querySelector('.deck-counter')
  var prevButton = document.getElementById('deck-prev')
  var nextButton = document.getElementById('deck-next')
  var index = 0

  function pad(value) {
    return value < 10 ? '0' + value : String(value)
  }

  /* The fit line: the stage stays a 1280×720 design canvas; only the visual scale follows the window,
     so every computed style keeps its design value. Re-run on resize and when fullscreen changes. */
  function fit() {
    document.documentElement.style.setProperty('--deck-fit',
      String(Math.min(window.innerWidth / 1280, window.innerHeight / 720)))
  }

  function chrome() {
    counter.textContent = pad(index + 1) + ' / ' + pad(slides.length)
    prevButton.disabled = index === 0
    nextButton.disabled = index === slides.length - 1
    document.body.setAttribute('data-slide', slides[index].getAttribute('data-layout'))
  }

  function show(target) {
    if (target < 0 || target >= slides.length || target === index) return
    var entering = slides[target]
    entering.classList.remove('is-settled')
    entering.classList.add('is-entering')
    slides[index].hidden = true
    entering.hidden = false
    /* Flush the 8 px start before settling; a forced reflow, not a timer. */
    void entering.offsetWidth
    entering.classList.add('is-settled')
    index = target
    chrome()
  }

  function next() { show(index + 1) }
  function previous() { show(index - 1) }

  function reportFullscreenRefusal(error) {
    /* The refusal is not drawn on the page; the run report reads it from the console line. */
    console.warn('page-studio: fullscreen refused: ' + (error && error.message ? error.message : String(error)))
  }

  function fullscreen() {
    var request = stage.requestFullscreen()
    if (request && typeof request.catch === 'function') request.catch(reportFullscreenRefusal)
  }

  var goTo = {
    ArrowRight: next, ArrowDown: next, PageDown: next,
    ArrowLeft: previous, ArrowUp: previous, PageUp: previous,
    Home: function () { show(0) },
    End: function () { show(slides.length - 1) }
  }

  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'f' || event.key === 'F') {
      event.preventDefault()
      fullscreen()
      return
    }
    if (event.key === ' ' || event.key === 'Space' || event.code === 'Space') {
      event.preventDefault()
      next()
      return
    }
    if (Object.prototype.hasOwnProperty.call(goTo, event.key)) {
      event.preventDefault()
      goTo[event.key]()
    }
  })

  prevButton.addEventListener('click', previous)
  nextButton.addEventListener('click', next)
  window.addEventListener('resize', fit)
  window.addEventListener('fullscreenchange', fit)

  fit()
  chrome()
})()
