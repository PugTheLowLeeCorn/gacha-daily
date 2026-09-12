function formatDateKey_(date, timeZone) {
  return Utilities.formatDate(date, timeZone, 'yyyy-MM-dd')
}

function localMinutes_(date, timeZone) {
  var hhmm = Utilities.formatDate(date, timeZone, 'HH:mm')
  var parts = hhmm.split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

function timeToMinutes_(hhmm) {
  var parts = String(hhmm || DEFAULT_REMINDER_TIME).split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

function isInReminderWindow_(now, timeZone, reminderTime, windowMinutes) {
  windowMinutes = windowMinutes || REMINDER_WINDOW_MINUTES
  var nowMinutes = localMinutes_(now, timeZone)
  var target = timeToMinutes_(reminderTime)
  if (target + windowMinutes <= 24 * 60) {
    return nowMinutes >= target && nowMinutes < target + windowMinutes
  }
  var overflow = target + windowMinutes - 24 * 60
  return nowMinutes >= target || nowMinutes < overflow
}

function shiftDate_(dateKey, amount) {
  var parts = dateKey.split('-').map(Number)
  var utc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + amount))
  return utc.toISOString().slice(0, 10)
}

function overallPerfectStreak_(trackedGameIds, logs, todayKey) {
  if (!trackedGameIds.length) return 0
  var byDate = {}
  logs.forEach(function (log) {
    if (log.status !== 'completed') return
    if (!byDate[log.date]) byDate[log.date] = {}
    byDate[log.date][log.gameId] = true
  })

  var cursor = todayKey
  var streak = 0
  var todaySet = byDate[todayKey] || {}
  var todayPerfect = trackedGameIds.every(function (id) {
    return todaySet[id]
  })
  if (!todayPerfect) cursor = shiftDate_(todayKey, -1)

  while (true) {
    var set = byDate[cursor] || {}
    var perfect = trackedGameIds.every(function (id) {
      return set[id]
    })
    if (!perfect) break
    streak += 1
    cursor = shiftDate_(cursor, -1)
  }
  return streak
}

function listEnabledTrackedGames_(uid) {
  return firestoreRunQuery_('users/' + uid, {
    from: [{ collectionId: 'games' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'enabled' },
        op: 'EQUAL',
        value: { booleanValue: true },
      },
    },
  }).map(function (doc) {
    return Object.assign({ id: doc.id }, doc.data)
  })
}

function listDailyLogsForDate_(uid, dateKey) {
  return firestoreRunQuery_('users/' + uid, {
    from: [{ collectionId: 'dailyLogs' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'date' },
        op: 'EQUAL',
        value: { stringValue: dateKey },
      },
    },
  }).map(function (doc) {
    return Object.assign({ id: doc.id }, doc.data)
  })
}

function listAllDailyLogs_(uid) {
  return firestoreListDocuments_('users/' + uid + '/dailyLogs').map(function (doc) {
    return Object.assign({ id: doc.id }, doc.data)
  })
}

function catalogName_(gameId) {
  var catalog = firestoreGetDocument_('games/' + gameId)
  if (catalog && catalog.data && catalog.data.name) return catalog.data.name
  return gameId
}

/**
 * Production reminder runner. Attach the 15-minute time-driven trigger to this function.
 * @param {{force?: boolean}=} options Set force=true from a test function to ignore the time window.
 */
function processReminders(options) {
  options = options || {}
  var force = options.force === true
  var now = new Date()
  var dashboardUrl = getConfig_().dashboardUrl
  var users = firestoreListDocuments_('users')
  var sent = 0
  var skipped = 0
  var errors = 0

  users.forEach(function (userDoc) {
    try {
      var processed = processUserReminder_(userDoc, now, dashboardUrl, force)
      if (processed === 'sent') sent += 1
      else skipped += 1
    } catch (error) {
      errors += 1
      Logger.log('Failed to process reminder for ' + userDoc.id + ': ' + error)
    }
  })

  Logger.log(
    'Reminder run complete. users=' +
      users.length +
      ' sent=' +
      sent +
      ' skipped=' +
      skipped +
      ' errors=' +
      errors,
  )
  return { users: users.length, sent: sent, skipped: skipped, errors: errors }
}

function processUserReminder_(userDoc, now, dashboardUrl, force) {
  var user = userDoc.data || {}
  var uid = userDoc.id
  if (user.reminderEnabled === false || !user.email) return 'skipped'
  var timeZone = user.timezone || DEFAULT_TIMEZONE
  var reminderTime = user.reminderTime || DEFAULT_REMINDER_TIME
  if (!force && !isInReminderWindow_(now, timeZone, reminderTime)) return 'skipped'

  var dateKey = formatDateKey_(now, timeZone)
  var reminderPath = 'users/' + uid + '/reminderLogs/' + dateKey
  if (firestoreGetDocument_(reminderPath)) return 'skipped'

  var tracked = listEnabledTrackedGames_(uid)
  if (!tracked.length) return 'skipped'

  var todayLogs = listDailyLogsForDate_(uid, dateKey)
  var completedIds = {}
  todayLogs.forEach(function (log) {
    if (log.status === 'completed') completedIds[log.gameId] = true
  })
  var incomplete = tracked.filter(function (game) {
    var gameId = game.gameId || game.id
    return !completedIds[gameId]
  })
  if (!incomplete.length) return 'skipped'

  var incompleteNames = incomplete.map(function (game) {
    return catalogName_(game.gameId || game.id)
  })
  var history = listAllDailyLogs_(uid)
  var streak = overallPerfectStreak_(
    tracked.map(function (game) {
      return game.gameId || game.id
    }),
    history,
    dateKey,
  )

  sendReminderEmail_(user.email, user.displayName, incompleteNames, streak, dashboardUrl)
  firestorePatchDocument_(reminderPath, {
    date: dateKey,
    sentAt: new Date(),
    incompleteGameIds: incomplete.map(function (game) {
      return game.gameId || game.id
    }),
  })
  return 'sent'
}

function processRemindersForce() {
  return processReminders({ force: true })
}

function sendTestReminderEmail() {
  var email = Session.getActiveUser().getEmail()
  sendReminderEmail_(
    email,
    'Tester',
    ['Honkai: Star Rail'],
    17,
    getConfig_().dashboardUrl,
  )
  Logger.log('Sent test reminder to ' + email)
}
