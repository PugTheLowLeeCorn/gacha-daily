var DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh'
var DEFAULT_REMINDER_TIME = '23:30'
var REMINDER_WINDOW_MINUTES = 15
var DASHBOARD_URL = 'https://pugthelowleecorn.github.io/gacha-daily/dashboard'
var FIRESTORE_PROJECT_ID_FALLBACK = 'dk354-daily'

function getConfig_() {
  var props = PropertiesService.getScriptProperties()
  return {
    projectId: props.getProperty('FIRESTORE_PROJECT_ID') || FIRESTORE_PROJECT_ID_FALLBACK,
    dashboardUrl: props.getProperty('DASHBOARD_URL') || DASHBOARD_URL,
    databaseId: props.getProperty('FIRESTORE_DATABASE_ID') || '(default)',
  }
}

function firestoreRoot_() {
  var config = getConfig_()
  return (
    'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(config.projectId) +
    '/databases/' +
    encodeURIComponent(config.databaseId)
  )
}
