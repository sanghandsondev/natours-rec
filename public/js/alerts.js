export const hideAlert = () => {
    const el = document.querySelector('.alert')
    if (el) el.parentElement.removeChild(el)
}

// type is success or error 
export const showAlert = (type, msg, time = 5) => {       // mặc định tắt sau 5s
    hideAlert()
    const markup = `<div class="alert alert--${type}">${msg}</div>`
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup)       // thêm HTML
    window.setTimeout(hideAlert, time * 1000)
}