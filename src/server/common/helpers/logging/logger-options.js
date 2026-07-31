import { ecsFormat } from '@elastic/ecs-pino-format'
import { config } from '../../../../config/config.js'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')

const formatters = {
  ecs: {
    ...ecsFormat({ serviceName })
  },
  'pino-pretty': { transport: { target: 'pino-pretty' } }
}

export const loggerOptions = {
  enabled: logConfig.enabled,
  ignorePaths: ['/health'],
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format]
}
