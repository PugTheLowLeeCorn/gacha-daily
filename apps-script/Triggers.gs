var REMINDER_HANDLER = 'processReminders'

function listReminderTriggers() {
  return ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === REMINDER_HANDLER
  })
}

function createReminderTrigger() {
  var existing = listReminderTriggers()
  if (existing.length) {
    Logger.log('Reminder trigger already exists (' + existing.length + '). Not creating another.')
    return existing[0]
  }
  var trigger = ScriptApp.newTrigger(REMINDER_HANDLER).timeBased().everyMinutes(15).create()
  Logger.log('Created 15-minute time-driven trigger for processReminders.')
  return trigger
}

function deleteReminderTriggers() {
  listReminderTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger)
  })
  Logger.log('Deleted all processReminders triggers.')
}
