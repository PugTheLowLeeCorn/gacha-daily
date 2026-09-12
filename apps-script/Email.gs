function reminderHtml_(displayName, incompleteNames, streak, dashboardUrl) {
  var list = incompleteNames
    .map(function (name) {
      return '❌ ' + name
    })
    .join('<br />')
  return (
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">' +
    '<p>Hello ' +
    (displayName || 'Player') +
    ' 👋</p>' +
    '<p>You still need to complete:</p>' +
    '<p>' +
    list +
    '</p>' +
    '<p>🔥 Current streak: ' +
    streak +
    ' days</p>' +
    "<p>Don't break the chain!</p>" +
    '<p>' +
    '<a href="' +
    dashboardUrl +
    '" style="display:inline-block;background:#e8b84a;color:#111827;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">' +
    'Open Gacha Daily' +
    '</a>' +
    '</p>' +
    '</div>'
  )
}

function reminderText_(displayName, incompleteNames, streak, dashboardUrl) {
  return [
    'Hello ' + (displayName || 'Player'),
    '',
    'You still need to complete:',
  ]
    .concat(
      incompleteNames.map(function (name) {
        return '- ' + name
      }),
    )
    .concat(['', 'Current streak: ' + streak + ' days', "Don't break the chain!", dashboardUrl])
    .join('\n')
}

function sendReminderEmail_(to, displayName, incompleteNames, streak, dashboardUrl) {
  var subject = '⚠️ You still have daily tasks remaining'
  GmailApp.sendEmail(to, subject, reminderText_(displayName, incompleteNames, streak, dashboardUrl), {
    htmlBody: reminderHtml_(displayName, incompleteNames, streak, dashboardUrl),
    name: 'Gacha Daily',
  })
}
