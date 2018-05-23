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
const BASE_URL = 'http://like.vipvui.vn'
const ID = '100007665604062'
const ACCESS_TOKEN = [
  'EAAAAAYsX7TsBABZC868Rcsrz1UgSXisln66E5Qr9muMymjey2hKTn60ddSghgaguDJr7PmiLZAZCpDzMXiVX9xn13VR47HK1AGavLBKIacZA8yzm0KpXICKR0D5HpgYZBjC1LugNXZBNBo7QsDJR4csuGqafYfpDdw1xfTlWhV7CrJH4DAM46NWOXTCAFHv2qsiTIby7gQ15Jqmds11udd' // chien
  // naruto
]
const OCR_KEY = $config.OCR_KEY

// global variable
var indexToken = 0
var accessToken = ACCESS_TOKEN[indexToken]
var countSuccess = 0

// config axios
var axios = Axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 303;
  }
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
  accessIndexAndLogin() {
    return axios.get(`/login/friend.php?user=${accessToken}`)
  },
  getAuto() {
    return axios.get('/vnfriend.php?type=addme')
  },
  postAuto(id, name) {
    return axios.post('/vnfriend.php?type=addme', QueryString.stringify({
      [name]: id,
      'submit': 'Tăng Theo Dõi'
    }))
  }
}

// start 
accessIndexAndLogin()

function accessIndexAndLogin() {
  logNotice(countSuccess === 0 ? 'Starting with ' + ID : '...continue with ' + (indexToken + 1))

  $self.accessIndexAndLogin()
    .then((res) => {
      var cookie = res.headers['set-cookie']

      if (!cookie) {
        logError('"cookie" does not exist')
        restart()
        return
      }

      $self.setCookie(cookie.toString())

      $self.getAuto()
        .then((res) => {
          checkLogin(res.data)
        })
        .catch(() => {
          restart()
        })
    })
    .catch(() => {
      restart()
    })
}

function checkLogin(data) {
  if (data.indexOf('Xin chào:') === -1) {
    logError('Login failed')
    restart()
    return
  } else {
    logNotice('Logged in successfully')
    initAuto(data)
  }
}

function initAuto(data) {
  if (data.indexOf('Trạng Thái:') === -1) {
    logError('Cannot load auto form')
    restart()
    return
  }

  var time = $handle.getTime(data)
  var namePost = 'id'

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
    restart(120)
    return
  }

  performAuto(namePost)
}

function performAuto(namePost) {
  logNotice('perform Auto...')

  $self.postAuto(ID, namePost)
    .then((res) => {
      if (res.data.indexOf('TĂNG THEO DÕI THÀNH CÔNG') > -1) {
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

function restart(second = 15) {
  if (++indexToken >= ACCESS_TOKEN.length) {
    indexToken = 0
  }
  accessToken = ACCESS_TOKEN[indexToken]
  delete axios.defaults.headers.common['Cookie']

  // restart
  logNotice(`restarting, please wait ${second} seconds`)
  setTimeout(accessIndexAndLogin, second * 1000)
}
