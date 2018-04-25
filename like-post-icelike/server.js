const Axios = require('axios')
const QueryString = require('querystring')
const chalk = require('chalk')
const $handle = require('./handle.js')
const $config = require('./../config.js')

// use to log of error and success
const logError = function (message) {
  console.log(chalk.red(message))
}
const logNotice = function (message) {
  console.log(chalk.green(message))
}
const logSuccess = function (message) {
  console.log(chalk.blue(message))
}

// const variable
const BASE_URL = $config.BASE_URL_LIKE
const ID = $config.ID_LIKE
const ACCESS_TOKEN = $config.ACCESS_TOKEN
const OCR_KEY = $config.OCR_KEY

// global variable
var indexToken = 0
var accessToken = ACCESS_TOKEN[indexToken]
var countSuccess = 0

// config axios
var axios = Axios.create({
  baseURL: BASE_URL,
  timeout: 20000
})
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
axios.interceptors.response.use((res) => {
  if (!res.data) {
    logError('Lost data')
  }
  return res
}, (err) => {
  logError('Server error')
  console.log(err.message)
  return Promise.reject(err);
})

// init $self to provide rest api
var $self = {
  setCookie(cookie) {
    if (cookie) {
      axios.defaults.headers.common['Cookie'] = cookie
    }
  },
  accessIndex() {
    return axios.get('/')
  },
  login(name, value, captchaBox) {
    return axios.post('/', QueryString.stringify({
      'captchaBox': captchaBox,
      [name]: value,
      'submit': 'Submit'
    }))
  },
  getAutoLike() {
    return axios.get('/lv_reaction.php?type=custom')
  },
  postAutoLike(id, name) {
    return axios.post('/lv_reaction.php?type=custom', QueryString.stringify({
      'limit': '30',
      [name]: id,
      'emoji': 'RANDOM',
      'submit': ''
    }))
  },
  getCaptcha(url) {
    return axios.get(url, { responseType: 'arraybuffer' })
  },
  parseBase64ImageToString(base64) {
    var privateAxios = Axios.create()
    privateAxios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
    return privateAxios.post('http://api.ocr.space/parse/image', QueryString.stringify({
      'apikey': OCR_KEY,
      'base64Image': 'data:image/png;base64,' + base64
    }))
  }
}

// start 
accessIndex()

function accessIndex() {
  logNotice(countSuccess === 0 ? 'Starting with ' + ID : '...continue')

  $self.accessIndex()
    .then((res) => {
      var name = $handle.getName(res.data)
      var cookie = res.headers['set-cookie']
      var urlCaptcha = $handle.getImage(res.data)

      if (!name) {
        logError('"name" does not exist')
        restart()
        return
      }
      if (!cookie) {
        logError('"cookie" does not exist')
        restart()
        return
      }
      if (!urlCaptcha) {
        logError('"urlCaptcha" does not exist')
        restart()
        return
      }

      $self.setCookie(cookie.toString())

      urlCaptcha = BASE_URL + urlCaptcha
      getCaptcha(urlCaptcha, name)
    })
    .catch(() => {
      restart()
    })
}

function getCaptcha(urlCaptcha, name) {
  $self.getCaptcha(urlCaptcha)
    .then((res) => {
      var captchaBase64 = new Buffer(res.data, 'binary').toString('base64')

      $self.parseBase64ImageToString(captchaBase64)
        .then((res) => {
          if (res.data && res.data['OCRExitCode'] == 1) {
            if (res.data['ParsedResults'] && res.data['ParsedResults'].length > 0 && res.data['ParsedResults'][0]['ParsedText']) {
              var stringCaptcha = res.data['ParsedResults'][0]['ParsedText'].trim()
              if (stringCaptcha && !isNaN(parseInt(stringCaptcha))) {
                logNotice('Get string from captcha successfully: ' + stringCaptcha)
                login(name, stringCaptcha)
              } else {
                logError('String is not found')
                restart()
                return
              }
            } else {
              logError('String is not found')
              restart()
              return
            }
          } else {
            logError('Parsing captcha failed')
            restart()
            return
          }
        })
        .catch(() => {
          restart()
        })
    })
    .catch(() => {
      restart()
    })
}

function login(name, stringCaptcha) {
  $self.login(name, accessToken, stringCaptcha)
    .then((res) => {
      if (res.data.indexOf('Logout') === -1) {
        logError('Login failed')
        restart()
        return
      } else {
        logNotice('Logged in successfully')
        autoLike()
      }
    })
    .catch(() => {
      restart()
    })
}

function autoLike() {
  $self.getAutoLike()
    .then((res) => {
      var data = res.data

      if (data.indexOf('Next Submit') === -1) {
        logError('Cannot load autoLike form')
        restart()
        return
      }

      var time = $handle.getTime(data)
      var namePost = $handle.getNamePost(data)

      if (isNaN(time)) {
        logError('"time" does not exist')
        restart()
        return
      }
      if (!namePost) {
        logError('"namePost" does not exist')
        restart()
        return
      }

      logNotice('Time: ' + time)
      if (time > 0) {
        logError('please wait')
        restart(10)
        return
      }

      performAutoLike(namePost)
    })
    .catch(() => {
      restart()
    })
}

function performAutoLike(namePost) {
  logNotice('perform AutoLike...')

  $self.postAutoLike(ID, namePost)
    .then((res) => {
      var time = $handle.getTime(res.data)

      if (isNaN(time)) {
        logError('"time" does not exist')
        restart()
        return
      }

      if (time > 0) {
        logSuccess('Success: ' + (++countSuccess))
        restart()
        return
      } else {
        logError('Unknown error')
        restart()
        return
      }
    })
    .catch(() => {
      restart()
    })
}

function restart(second = 5) {
  if (++indexToken >= ACCESS_TOKEN.length) {
    indexToken = 0
  }
  accessToken = ACCESS_TOKEN[indexToken]
  delete axios.defaults.headers.common['Cookie']

  // restart
  logNotice(`restarting, please wait ${second} seconds`)
  setTimeout(accessIndex, second * 1000)
}
