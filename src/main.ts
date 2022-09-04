import {Config} from './config'
import {Dispatcher} from './dispatcher'


(async () => {
  const config = await Config.make()
  const dispatcher = new Dispatcher(config)
  await dispatcher.init()
})()
