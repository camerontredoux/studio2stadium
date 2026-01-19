import type SignupEvent from "#modules/users/signup/event";

export default class VerificationListener {
  async handle(event: SignupEvent) {
    console.log(event.user.displayEmail);
    // await mail.send(new VerifyEmailNotification(user));
    // create the system event here
  }
}
