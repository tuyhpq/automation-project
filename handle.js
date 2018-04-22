const KEY_TIME = 'var seconds = '
const KEY_NAME = 'input type="text" name="'
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
 * Get waiting time
 */
exports.getImage = function (data) {
    var start = data.indexOf(KEY_IMAGE)
    var end = data.indexOf('"', start + 1)

    return data.slice(start, end)
}