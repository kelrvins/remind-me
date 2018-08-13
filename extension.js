const vscode = require('vscode')
const WebRequest = require('web-request')
let timer

function activate(context) {
  let cityApi = vscode.commands.registerCommand(
    'extension.remindMe',
    function() {
      const config = vscode.workspace.getConfiguration('remind-me')
      const reg = new RegExp(/^([01][0-9]|2[0-3]):([0-5][0-9])$/)
      const addZero1 = (num, len = 2) => `0${num}`.slice(-len)
      if (config.lunchTime && reg.test(config.lunchTime)) {
        if (timer) clearInterval(timer)
        timer = setInterval(function() {
          const configTime = vscode.workspace.getConfiguration('remind-me')
          const [lh, lm] = configTime.lunchTime.split(':')
          const [gh, gm] = configTime.getOffTime.split(':')
          if (
            lh &&
            lm &&
            addZero1(new Date().getHours()) == lh &&
            addZero1(new Date().getMinutes()) == lm
          ) {
            getWeatherInfo(configTime.defaultCity,1)
          }
          if (
            gh &&
            gm &&
            addZero1(new Date().getHours()) == gh &&
            addZero1(new Date().getMinutes()) == gm
          ) {
            getWeatherInfo(configTime.defaultCity,2)
          }
        }, 60000)
      }
      if (config.defaultCity) {
        getWeatherInfo(config.defaultCity)
      } else {
        const options = {
          ignoreFocusOut: true,
          password: false,
          prompt: 'please input you city (eg.beijing or 北京)，最好在配置文件里填'
        }
        vscode.window.showInputBox(options).then(value => {
          if (!value) {
            vscode.window.showInformationMessage('please input you city')
            return
          }
          const cityName = value.trim()
          getWeatherInfo(cityName)
        })
      }
    }
  )
  context.subscriptions.push(cityApi)
}

/**
 * 获取城市天气
 * @param {string} cityName 城市名
 * @param {string} operation 中午饭、下班 标识
 */
function getWeatherInfo(cityName,operation=-1) {
  const config = vscode.workspace.getConfiguration('remind-me')
  const appkey = config.hefengAppkey
    ? config.hefengAppkey
    : '4f93d387e102d24f1ab79cf545d1bc06'
  WebRequest.get(
    `https://way.jd.com/he/freeweather?city=${encodeURI(
      cityName
    )}&appkey=${appkey}`
  ).then(reps => {
    let rep = JSON.parse(reps.body)
    if (rep.code != 10000) {
      vscode.window.showInformationMessage('sorry please try again')
      return
    }
    const weatherData = rep.result.HeWeather5[0]
    if (weatherData.status !== 'ok') {
      vscode.window.showInformationMessage(`sorry,${weatherData.status}`)
      return
    }
    const tmpLine = renderTmpLine(weatherData.hourly_forecast)
    vscode.window.showInformationMessage(`未来十二小时温度曲线 ：${tmpLine}`)
    // const isRain =
    //   weatherData.hourly_forecast[0].cond.code >= 300 &&
    //   weatherData.hourly_forecast[0].cond.code < 500
    if( weatherData.hourly_forecast[0].cond.code >= 300 &&
      weatherData.hourly_forecast[0].cond.code < 500){
        vscode.window.showInformationMessage(`${weatherData.basic.city}, ${weatherData.now.cond.txt}, ${weatherData.now.tmp}°C, 未来两小时${weatherData.hourly_forecast[0].cond.txt},请携带雨具`,'哦哦')
    }else{
      vscode.window.showInformationMessage(`${weatherData.basic.city}, ${weatherData.now.cond.txt}, ${weatherData.now.tmp}°C, 未来两小时${weatherData.hourly_forecast[0].cond.txt}`)
    }
    if(operation==1){
      vscode.window.showInformationMessage(`吃饭啦`)
    }
    if(operation==2){
      vscode.window.showInformationMessage(`下班啦`)
    }
  })
}

/**
 * 绘制温度曲线
 * @param {Array} parm 天气数组
 */
function renderTmpLine(parm) {
  // ▁▂▃▅▆▇▁▂▃▅▆▇
  let array = []
  let weatherNotice = ''
  parm.forEach(el => {
    if (el.cond.code > 204 && !weatherNotice) {
      weatherNotice = ` , ${
        el.date.substr(8, 2) - new Date().getDate() > 0 ? '明天' : '今天'
      }${el.date.substr(-5, 2)}点后有${el.cond.txt}`
    }
    array.push(el.tmp)
  })
  const tmpSigns = ['__ ', '▁▁ ', '▂  ', '▃ ', '▅  ', '▆  ', '▇  ']
  const tmpRange = {
    max: Math.max.apply(Math, array),
    min: Math.min.apply(Math, array)
  }
  let tmpLine = ''
  array.forEach(el => {
    tmpLine += tmpSigns[el - tmpRange.min > 6 ? 6 : el - tmpRange.min]
  })
  return (
    tmpLine +
    weatherNotice +
    ', 最高: ' +
    tmpRange.max +
    '°C, 最低 : ' +
    tmpRange.min +
    '°C'
  )
}

exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate
