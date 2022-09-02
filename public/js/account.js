import axios from 'axios'
import { showAlert } from './alerts'

// type is either 'data' or 'password'
export const updateData = async (data, type) => {
    try {
        const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe'
        const res = await axios({
            method: 'PATCH',
            url,
            data
        })
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} update successfully`)
            // location.reload(true)                   // reload lại trang
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}

export const readImg = (input, imgSrc) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader()
        reader.onload = (e) => {
            document.querySelector(imgSrc).src = e.target.result
        }
        reader.readAsDataURL(input.files[0])
    }
}

