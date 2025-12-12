// create event "favorited-dancer"
// payload: {
/**
 * payload: {
 *  schoolId: asd
 *  dancerId: asd
 * }
 *
 * creating favorite is the business logic
 * handling event is just event logic
 *
 * store this payload on outboxevent
 * send outboxevent to our message queue
 * message queue would send message to event processor
 * processor would check event_type, and then create a row in Notifications for the school to dancer favorite
 *
 * if creation of favorite fails or notification fails, dont delete event
 * if try {createNotification; mark event as handled} catch {retryCreateNotification}
 *
 *
 * dancer: createVideoSubmission -> submitting to 100 schools
 */
