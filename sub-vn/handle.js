const KEY_TIME = 'var seconds = '
const KEY_NAME = 'input style="border-bottom: 4px solid #ff8b14;box-shadow: 0 -4px 0 0 #ff8b14;" name="'
const KEY_NAME_POST = 'input type="text" placeholder="FanPage ID or Username" style="width:100%;text-align:center;height:2.5em;margin-bottom:1px; border-bottom:3px solid #3b5998;box-shadow:0 -3px 0 0 #3b5998;" name="'

/**
 * Get name to posting data for login
 */
exports.getName = function (data) {
    var start = data.indexOf(KEY_NAME) + KEY_NAME.length
    var end = data.indexOf('"', start + 1)

    return data.slice(start, end)
}

/**
 * Get waiting time
 */
exports.getTime = function (data) {
    var start = data.indexOf(KEY_TIME) + KEY_TIME.length
    var end = data.indexOf(';', start + 1)

    var number = data.slice(start, end)

    return parseInt(number)
}

/**
 * Get name of posting
 */
exports.getNamePost = function (data) {
    var start = data.indexOf(KEY_NAME_POST) + KEY_NAME_POST.length
    var end = data.indexOf('"', start + 1)

    return data.slice(start, end)
}

/**
 * Get access token
 */
const Axios = require('axios')
exports.getAccessToken = function (username = 'hcm.cangio.010191', password = 'Huaphuquy687%402', next = () => { }) {
    var axios = Axios.create({
        baseURL: 'https://api.facebook.com',
        timeout: 20000,
        maxRedirects: 0,
        validateStatus: function (status) {
            return status >= 200 && status < 303;
        }
    })
    axios.get(`/restserver.php?api_key=3e7c78e35a76a9299309885393b02d97&email=${username}&format=JSON&locale=vi_vn&method=auth.login&password=${password}&return_ssl_resources=0&v=1.0&sig=ffa5e46be3cf9ae9fdae4c2159b8b428`)
        .then((res) => {
            next(null, res.data)
        })
        .catch((err) => {
            next(err, null)
        })
}