// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const axios = require('axios')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  let cityApi = vscode.commands.registerCommand(
    'extension.sayCityAqi',
    function() {
      const options = {
        ignoreFocusOut: true,
        password: false,
        prompt: 'please input you city (eg.beijing or 北京)'
      }

      vscode.window.showInputBox(options).then(value => {
        if (!value) {
          vscode.window.showInformationMessage('please input you city')
          return
        }
        var timer = setInterval(function(){
          console.log(new Date().getSeconds())
          if(new Date().getMinutes()==23){
            clearInterval(timer)
          }
        },5000)
        const cityName = value.trim()
        getWeatherInfo(cityName)
      })
    }
  )
  context.subscriptions.push(cityApi)
}

function getWeatherInfo(cityName){
  axios
    .get(
      `https://way.jd.com/he/freeweather?city=${cityName}&appkey=4f93d387e102d24f1ab79cf545d1bc06`
    )
    .then(rep => {
      if (rep.data.code !== '10000') {
        vscode.window.showInformationMessage('sorry please try again')
        return
      }
      const weatherData = rep.data.result.HeWeather5[0]
      if (weatherData.status !== 'ok') {
        vscode.window.showInformationMessage(
          `sorry,${weatherData.status}`
        )
        return
      }
      const tmpLine = renderTmpLine(weatherData.hourly_forecast)
      vscode.window.showInformationMessage(
        `未来十二小时温度曲线 ：${tmpLine}`
      )
      vscode.window.showInformationMessage(
        `${weatherData.basic.city}, ${weatherData.now.cond.txt}, ${
          weatherData.now.tmp
        }°C, 未来两小时${weatherData.hourly_forecast[0].cond.txt}${weatherData.hourly_forecast[0].cond.code>=300&&weatherData.hourly_forecast[0].cond.code<500?' ,请携带雨具':''
        }`
      )
    })
}
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
    min: Math.min.apply(Math, array),
    range: Math.max.apply(Math, array) - Math.min.apply(Math, array)
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
