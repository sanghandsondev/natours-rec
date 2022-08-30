
module.exports = () => {
    const rootUrl = 'https://www.facebook.com/v14.0/dialog/oauth'

    const options = {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        redirect_uri: process.env.NODE_ENV === 'production' ? process.env.FACEBOOK_REDIRECT_URI : process.env.FACEBOOK_REDIRECT_URI_DEV,
        state: "{st=state123abc,ds=123456789}",
        auth_type: "rerequest",
        response_type: "code"
        // scope: "email",
    }

    // const options = (process.env.NODE_ENV === 'production') ? options1 : options2

    const qs = new URLSearchParams(options)

    return `${rootUrl}?${qs.toString()}`
}