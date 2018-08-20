'use strict'

module.exports = {
  filterUndefinedProperties
}

function filterUndefinedProperties (object) {
  return Object.keys(object).reduce((result, key) => {
    if (typeof object[key] !== 'undefined') {
      result[key] = object[key]
    }

    return result
  }, {})
}
