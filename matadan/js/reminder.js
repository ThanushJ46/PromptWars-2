// reminder.js

function createCalendarReminder() {
  // Use a fixed demo date (next election style) or get from inputs
  const dateInput = document.getElementById('reminderDate')?.value || '2024-05-15';
  const timeInput = document.getElementById('reminderTime')?.value || '08:00';
  
  if (!dateInput || !timeInput) {
      alert("Please select a date and time.");
      return;
  }

  const startDate = `${dateInput}T${timeInput}:00`;
  
  // Calculate end time (+1 hour)
  const timeParts = timeInput.split(':');
  let endHour = parseInt(timeParts[0]) + 1;
  const endDateStr = `${endHour.toString().padStart(2, '0')}:${timeParts[1]}:00`;
  const endDate = `${dateInput}T${endDateStr}`;
  
  const calUrl = new URL('https://calendar.google.com/calendar/render');
  calUrl.searchParams.set('action', 'TEMPLATE');
  calUrl.searchParams.set('text', '🗳️ Election Day — Go Vote!');
  calUrl.searchParams.set('details', `Time to vote! Your polling booth awaits. Voter Helpline: 1950 | electoralsearch.eci.gov.in`);
  calUrl.searchParams.set('dates', `${startDate.replace(/[-:]/g,'')}/${endDate.replace(/[-:]/g,'')}`);
  
  window.open(calUrl.toString(), '_blank');
}

function setNativeReminder() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
        alert("Reminder set successfully! You will be notified on the day.");
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                alert("Reminder set successfully! You will be notified on the day.");
            }
        });
    } else {
        alert("Notifications are blocked. Please use the Google Calendar option.");
    }
}
