// noinspection JSUnusedGlobalSymbols

/**
* @param {String?} selectors
*/
export function clear(selectors)
{
  document.body.querySelectorAll(selectors || 'input[type="file"]')
    .forEach(el => el.parentNode.removeChild(el))
}

/**
* @param {HTMLElement} el
*/
export function hide(el)
{
  el.style.visibility = 'hidden'
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  el.style.top = '-9999px'
}

/**
* @param {String} type
* @param {Boolean} multiple
* @param {Boolean} capture
* @return {Promise<(String|Blob)>}
*/
export function open(type, multiple = false, capture = false)
{
  return new Promise(resolve => {
    const input = document.createElement('input'),
      click = new MouseEvent('click', {
        cancelable: true,
        bubbles: true,
        view: window
      })

    input.multiple = multiple
    input.accept = type
    input.type = 'file'

    if (capture) {
      input.capture = 'camera'
    }

    hide(input)

    input.addEventListener('change', () => {
      const files = Array.from(input.files)
      multiple ? resolve(files) : resolve(files[0])
      clear()

    }, false)

    document.body.appendChild(input)
    input.dispatchEvent(click)
  })
}

/**
* @param {Promise} promise
*/
export function ignore(promise)
{
  if (promise instanceof Promise) {
    promise.catch(() => {})
  }
}
