// Auth events
import "#modules/auth/forgot-password/event"; //  reset password email
import "#modules/auth/signup/event"; //  verification email + notification

// School events
import "#modules/schools/follow/event"; //  dancer followed notification
import "#modules/schools/show-interest/event"; //  interest email + notification
import "#modules/schools/update-submission/event"; //  prospect status email + notification
import "#modules/schools/view-dancer/event"; //  profile viewed email + notification

// Dancer events
import "#modules/dancers/common-recruiting/create-submission/event"; //  CRV submission notification
import "#modules/dancers/engagement/favorite/event"; //  notification only
import "#modules/dancers/profile/create-achievement/event"; //  achievement notification
import "#modules/dancers/profile/create-dancer/event"; //  dancer welcome email
import "#modules/dancers/profile/create-reference/event"; //  reference notification

// Media events
import "#modules/images/upload-profile-image/event"; //  image upload notification
import "#modules/videos/upload-profile-video/event"; //  video upload notification

// Event events
import "#modules/events/create-event/event"; //  school event created notification
import "#modules/events/save-event/event"; //  event attended notification

// Subscription events
import "#modules/webhooks/stripe/event"; //  premium welcome + subscription ended emails

// Admin events
import "#modules/admin/approve-school/event"; //  school welcome email + global notification

// Contact events
import "#modules/contact/contact-us/event"; //  contact form email
import "#modules/contact/feedback/event"; //  feedback email

// User events
import "#modules/users/delete-account/event"; //  delete account feedback email
