(function() {

document.body.classList.remove('noJS')

let button = document.querySelector('._menuToggle')
button.addEventListener(
  'click',
  function () {
    let changeTo = 'true'
    if (button.getAttribute('aria-expanded') === 'true') {
       changeTo = 'false'
    }
    button.setAttribute('aria-expanded', changeTo)
  }
)

button.setAttribute('aria-expanded', 'false')

})()
