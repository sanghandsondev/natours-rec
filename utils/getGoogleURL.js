

module.exports = () => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'

    const options1 = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        scope: `email profile`,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
        display: "popup",
        response_type: "code"
    }

    const options2 = {
        client_id: process.env.GOOGLE_CLIENT_ID_DEV,
        scope: `email profile`,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL_DEV,
        // auth_type: "request",
        display: "popup",
        // access_type: "offline",
        // prompt: "consent",
        response_type: "code"
    }

    const options = (process.env.NODE_ENV === 'production') ? options1 : options2

    const qs = new URLSearchParams(options)

    return `${rootUrl}?${qs.toString()}`
}