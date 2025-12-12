import type SignupEvent from "#features/auth/signup/signup.event";

export default class VerificationListener {
  async handle(event: SignupEvent) {
    console.log(event.user.display_email);
    // await mail.send(new VerifyEmailNotification(user));
    // create the system event here
  }
}
