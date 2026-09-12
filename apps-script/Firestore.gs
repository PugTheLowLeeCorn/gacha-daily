function firestoreHeaders_() {
  return {
    Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
    'Content-Type': 'application/json',
  }
}

function firestoreFetch_(url, options) {
  var response = UrlFetchApp.fetch(
    url,
    Object.assign(
      {
        headers: firestoreHeaders_(),
        muteHttpExceptions: true,
        followRedirects: true,
      },
      options || {},
    ),
  )
  var code = response.getResponseCode()
  var body = response.getContentText()
  if (code === 404) return null
  if (code >= 400) {
    throw new Error('Firestore request failed (' + code + ') for ' + url + ': ' + body)
  }
  return body ? JSON.parse(body) : {}
}

function decodeValue_(value) {
  if (!value) return null
  if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue
  if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue
  if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue)
  if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return value.doubleValue
  if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue
  if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null
  if (value.mapValue) return decodeFields_(value.mapValue.fields || {})
  if (value.arrayValue) return (value.arrayValue.values || []).map(decodeValue_)
  return null
}

function decodeFields_(fields) {
  var result = {}
  Object.keys(fields || {}).forEach(function (key) {
    result[key] = decodeValue_(fields[key])
  })
  return result
}

function documentIdFromName_(name) {
  if (!name) return ''
  var parts = String(name).split('/')
  return parts[parts.length - 1]
}

function encodeValue_(value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return { timestampValue: value.toISOString() }
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(encodeValue_),
      },
    }
  }
  return {
    mapValue: {
      fields: encodeFields_(value),
    },
  }
}

function encodeFields_(object) {
  var fields = {}
  Object.keys(object || {}).forEach(function (key) {
    fields[key] = encodeValue_(object[key])
  })
  return fields
}

function firestoreGetDocument_(path) {
  var json = firestoreFetch_(firestoreRoot_() + '/documents/' + path, { method: 'get' })
  if (!json) return null
  return {
    id: documentIdFromName_(json.name),
    data: decodeFields_(json.fields || {}),
  }
}

function firestoreListDocuments_(path) {
  var documents = []
  var pageToken = ''
  do {
    var url = firestoreRoot_() + '/documents/' + path + '?pageSize=100'
    if (pageToken) url += '&pageToken=' + encodeURIComponent(pageToken)
    var json = firestoreFetch_(url, { method: 'get' }) || {}
    ;(json.documents || []).forEach(function (doc) {
      documents.push({
        id: documentIdFromName_(doc.name),
        data: decodeFields_(doc.fields || {}),
      })
    })
    pageToken = json.nextPageToken || ''
  } while (pageToken)
  return documents
}

function firestoreRunQuery_(parentPath, structuredQuery) {
  var url = firestoreRoot_() + '/documents'
  if (parentPath) url += '/' + parentPath
  url += ':runQuery'
  var json = firestoreFetch_(url, {
    method: 'post',
    payload: JSON.stringify({ structuredQuery: structuredQuery }),
  })
  if (!json) return []
  var rows = Array.isArray(json) ? json : []
  return rows
    .filter(function (row) {
      return row.document
    })
    .map(function (row) {
      return {
        id: documentIdFromName_(row.document.name),
        data: decodeFields_(row.document.fields || {}),
      }
    })
}

function firestorePatchDocument_(path, fields) {
  var mask = Object.keys(fields)
    .map(function (key) {
      return 'updateMask.fieldPaths=' + encodeURIComponent(key)
    })
    .join('&')
  var url = firestoreRoot_() + '/documents/' + path + (mask ? '?' + mask : '')
  return firestoreFetch_(url, {
    method: 'patch',
    payload: JSON.stringify({ fields: encodeFields_(fields) }),
  })
}
