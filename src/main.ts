import {Config} from './config.js'
import {Dispatcher} from './dispatcher.js'

const config = await Config.make()
const dispatcher = new Dispatcher(config)
await dispatcher.init()
