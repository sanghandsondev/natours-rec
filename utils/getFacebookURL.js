

module.exports = () => {
    const rootUrl = 'https://www.facebook.com/v14.0/dialog/oauth'

    const options = {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        state: "{st=state123abc,ds=123456789}",
        // scope: `email profile`,
        // display: "popup",
        response_type: "code"
    }

    // const options2 = {
    //     client_id: process.env.GOOGLE_CLIENT_ID_DEV,
    //     scope: `email profile`,
    //     redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL_DEV,
    //     // auth_type: "request",
    //     display: "popup",
    //     // access_type: "offline",
    //     // prompt: "consent",
    //     response_type: "code"
    // }

    // const options = (process.env.NODE_ENV === 'production') ? options1 : options2

    const qs = new URLSearchParams(options)

    return `${rootUrl}?${qs.toString()}`
}