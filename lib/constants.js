'use strict'

const STATUS = Object.freeze({
  SUCCESS: 'success',
  ERROR: 'error'
})

const SOCKETS_PROPERTIES = Object.freeze([
  'createSocketCount',
  'createSocketErrorCount',
  'closeSocketCount',
  'errorSocketCount',
  'timeoutSocketCount'
])

module.exports = {
  STATUS,
  SOCKETS_PROPERTIES
}
