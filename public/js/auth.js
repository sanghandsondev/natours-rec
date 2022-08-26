import axios from 'axios'
import { showAlert } from './alerts'

export const login = async (data) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data
        })
        if (res.data.status === 'success') {
            location.assign('/')
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

export const signup = async (data) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data
        })
        if (res.data.status === 'success') {
            showAlert('success', 'Create new account successfully')
            window.setTimeout(() => {
                location.assign('/')
            }, 1000)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        })
        if (res.data.status === 'success') {
            location.assign('/')
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
        window.setTimeout(() => {
            location.assign('/login')               // chuyển pages sau 2s
        }, 2000)
    }
}

export const forgotPassword = async (email) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/forgotPassword',
            data: {
                email
            }
        })
        if (res.data.status === 'success') {
            showAlert('success', 'Token sent to email. Check your email')
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

export const resetPassword = async (data, resetToken) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: `/api/v1/users/resetPassword/${resetToken}`,
            data
        })
        if (res.data.status === 'success') {
            showAlert('success', 'Your password has changed')
            window.setTimeout(() => {
                location.assign('/')
            }, 2000)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}


