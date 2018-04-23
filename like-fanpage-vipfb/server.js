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
const ID = $config.ID
const ACCESS_TOKEN = $config.ACCESS_TOKEN
const OCR_KEY = $config.OCR_KEY

// global variable
var indexToken = 0
var accessToken = ACCESS_TOKEN[indexToken]
var countSuccess = 0
var waitingTime = null

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
    return axios.post('/x_login.php', QueryString.stringify({
      [name]: value,
      'submit': 'submit'
    }))
  },
  getAutoLikePage() {
    return axios.get('/fanpage.php?type=myPageCustom')
  },
  postAutoLikePage(id, name) {
    return axios.post('/fanpage.php?type=myPageCustom', QueryString.stringify({
      'limit': '25',
      [name]: id,
      'submit': ''
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
        autoLikePage()
      }
    })
    .catch(() => {
      restart(15)
    })
}

function autoLikePage() {
  $self.getAutoLikePage()
    .then((res) => {
      var data = res.data

      if (data.indexOf('Next Submit') === -1) {
        logError('Cannot load autoLikePage form')
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
        time = parseInt(time / ACCESS_TOKEN.length)
        if (waitingTime === null || waitingTime > time) {
          waitingTime = time
        }
        logError('please wait')
        restart(waitingTime)
        return
      }

      performAutoLikePage(namePost)
    })
    .catch(() => {
      restart(15)
    })
}

function performAutoLikePage(namePost) {
  logNotice('perform AutoLikePage...')

  $self.postAutoLikePage(ID, namePost)
    .then((res) => {
      if (res.request['path'] && res.request['path'].indexOf('success') > -1) {
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

app.listen(process.env.PORT || 3000, () => console.log('Fanpage App listening on port ' + (process.env.PORT || 3001)))