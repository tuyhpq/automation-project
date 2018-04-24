const KEY_TIME = 'var seconds = '
const KEY_NAME = 'input type="text" style="border-bottom: 3px solid #0095e8;box-shadow: 0 -3px 0 0 #0095e8; text-align:center;" name="'
const KEY_NAME_POST = 'input type="text" minlength="6" maxlength="500" placeholder="https://www.facebook.com/mertkkcw/posts/392848364471054" style="width:100%;text-align:center;height:2.5em;margin-bottom:1px; border-bottom:3px solid #43a047;box-shadow:0 -3px 0 0 #43a047;" name="'
const KEY_IMAGE = '/capthcax.php'

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
 * Get url of image
 */
exports.getImage = function (data) {
    var start = data.indexOf(KEY_IMAGE)
    var end = data.indexOf('"', start + 1)

    return data.slice(start, end)
}