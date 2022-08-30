const imageDownloader = require('node-image-downloader')

module.exports = async (uri, filename, dest) => {
    try {
        const info = await imageDownloader({
            imgs: [
                {
                    uri,
                    filename
                }
            ],
            dest
        })
        // console.log(info[0].path.split('.')[1])
        return info[0]
    } catch (err) {
        console.log('something goas bad!', err)
    }
}
