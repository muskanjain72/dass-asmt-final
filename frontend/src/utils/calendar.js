import * as ics from 'ics';
import { saveAs } from 'file-saver';

// Helper to format date for Google/Outlook (YYYYMMDDTHHmmSSZ)
const formatDate = (date) => {
    return new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "");
};

export const generateGoogleCalendarUrl = (event) => {
    const startTime = formatDate(event.startDate);
    const endTime = formatDate(event.endDate);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || 'Online');
    const title = encodeURIComponent(event.name);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
};

export const generateOutlookCalendarUrl = (event) => {
    const startTime = new Date(event.startDate).toISOString();
    const endTime = new Date(event.endDate).toISOString();
    const title = encodeURIComponent(event.name);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');

    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startTime}&enddt=${endTime}&subject=${title}&body=${details}&location=${location}`;
};

export const downloadICS = async (events) => {
    const eventList = Array.isArray(events) ? events : [events];

    const icsEvents = eventList.map(evt => {
        const start = new Date(evt.startDate);
        const end = new Date(evt.endDate || new Date(start.getTime() + 2 * 60 * 60 * 1000));

        return {
            start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
            end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()],
            title: evt.name,
            description: evt.description,
            location: evt.location || 'Main Campus',
            url: window.location.origin + `/events/${evt._id}`,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            alarms: [
                { action: 'display', description: 'Reminder', trigger: { minutes: 30, before: true } }
            ]
        };
    });

    const { error, value } = ics.createEvents(icsEvents);

    if (error) {
        console.error("Error generating ICS:", error);
        return;
    }

    const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
    saveAs(blob, eventList.length > 1 ? 'my-events.ics' : `${eventList[0].name.replace(/\s+/g, '_')}.ics`);
};
