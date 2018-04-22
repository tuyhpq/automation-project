const Axios = require('axios')
const QueryString = require('querystring')
const chalk = require('chalk')
const express = require('express')
const $handle = require('./handle.js')
const $config = require('./config.js')

// use express
const app = express()

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
const BASE_URL = $config.BASE_URL
const ID = $config.USER_ID
const ACCESS_TOKEN = $config.ACCESS_TOKEN
const OCR_KEY = $config.OCR_KEY

// global variable
var indexToken = 0
var accessToken = ACCESS_TOKEN[indexToken]
var countSuccess = 0

// config axios
var axios = Axios.create({
  baseURL: BASE_URL
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
  login(name, value) {
    return axios.post('/', QueryString.stringify({
      [name]: value,
      'submit': 'Submit'
    }))
  },
  getAutoRequest() {
    return axios.get('/autorequest.php')
  },
  postAutoRequest(id, captchaBox) {
    return axios.post('/autorequest.php', QueryString.stringify({
      'id': id,
      'captchaBox': captchaBox,
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

      $self.setCookie(cookie.toString())

      login(name)
    })
    .catch(() => {
      restart(15)
    })
}

function login(name) {
  $self.login(name, accessToken)
    .then((res) => {
      if (res.data.indexOf('Logout') === -1) {
        logError('Login failed')
        restart(15)
        return
      } else {
        logNotice('Logged in successfully')
        autoRequest()
      }
    })
    .catch(() => {
      restart(15)
    })
}

function autoRequest() {
  $self.getAutoRequest()
    .then((res) => {
      var data = res.data

      if (data.indexOf('Next Submit') === -1) {
        logError('Cannot load autoRequest form')
        restart()
        return
      }

      var time = $handle.getTime(data)
      var urlCaptcha = $handle.getImage(data)

      if (isNaN(time)) {
        logError('"time" does not exist')
        restart()
        return
      }
      if (!urlCaptcha) {
        logError('"urlCaptcha" does not exist')
        restart()
        return
      }

      logNotice('Time: ' + time)
      if (time > 0) {
        logError('please wait')
        restart(parseInt(time / ACCESS_TOKEN.length))
        return
      }

      urlCaptcha = BASE_URL + urlCaptcha
      getCaptcha(urlCaptcha)
    })
    .catch(() => {
      restart(15)
    })
}

function getCaptcha(urlCaptcha) {
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
                performAutoRequest(stringCaptcha)
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
          restart(15)
        })
    })
    .catch(() => {
      restart(15)
    })
}

function performAutoRequest(stringCaptcha) {
  logNotice('perform AutoRequest...')

  $self.postAutoRequest(ID, stringCaptcha)
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
      restart(15)
    })
}

function restart(second = 0) {
  if (++indexToken >= ACCESS_TOKEN.length) {
    indexToken = 0
  }
  accessToken = ACCESS_TOKEN[indexToken]
  delete axios.defaults.headers.common['Cookie']

  // restart
  logNotice(`restarting, please wait ${second} seconds`)
  setTimeout(accessIndex, second * 1000)
}

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(process.env.PORT || 3000, () => console.log('App listening on port ' + (process.env.PORT || 3000)))