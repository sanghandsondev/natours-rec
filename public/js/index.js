import '@babel/polyfill'
import { login, logout, signup, forgotPassword, resetPassword } from './auth'
import { updateData } from './account'


// DOM ELEMENTS
const loginForm = document.querySelector('.form--login')
const signupForm = document.querySelector('.form--signup')
const logOutBtn = document.querySelector('.nav__el--logout')
const updateDataForm = document.querySelector('.form-user-data')
const updatePasswordForm = document.querySelector('.form-user-password')
const forgotPasswordForm = document.querySelector('.form-forgot-password')
const resetPasswordForm = document.querySelector('.form-reset-password')

// DELEGATION
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault()
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login({ email, password })
    })
}

if (signupForm) {
    signupForm.addEventListener('submit', e => {
        e.preventDefault()
        const name = document.getElementById('name').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('passwordConfirm').value
        signup({ name, email, password, passwordConfirm })
    })
}

if (logOutBtn) logOutBtn.addEventListener('click', logout)

if (updateDataForm) {
    updateDataForm.addEventListener('submit', e => {
        e.preventDefault()
        const form = new FormData()         // 1 object req.body từ input của form
        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0])

        updateData(form, 'data')

        // const name = document.getElementById('name').value
        // const email = document.getElementById('email').value
        // updateData({ name, email }, 'data')
    })
}

if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async e => {
        e.preventDefault()
        document.querySelector('.btn--save-password').textContent = 'Updating...'

        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value
        await updateData({ passwordCurrent, password, passwordConfirm }, 'password')

        document.querySelector('.btn--save-password').textContent = 'Save password'
        document.getElementById('password-current').value = ''
        document.getElementById('password').value = ''
        document.getElementById('password-confirm').value = ''
    })
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async e => {
        e.preventDefault()
        document.querySelector('.btn-forgot-password').textContent = 'Sending...'
        const email = document.getElementById('email').value
        await forgotPassword(email)

        document.querySelector('.btn-forgot-password').textContent = 'Send'
        document.getElementById('email').value = ''
    })
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', e => {
        const resetToken = document.querySelector('h3').innerText
        e.preventDefault()
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('passwordConfirm').value
        resetPassword({ password, passwordConfirm }, resetToken)
    })
}

