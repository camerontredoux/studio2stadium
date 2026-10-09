import type { EventFaqSection } from "@/features/org/components/event-faq";

export const dancerEventFaqSections: EventFaqSection[] = [
  {
    value: "getting-started",
    title: "Getting Started",
    content: [
      {
        value: "what-is-s2s-live",
        question: "What is S2S Live, and how will I use it at this event?",
        answer: (
          <p>
            S2S Live brings your recruiting event experience into one place.
            You&apos;ll use it to share your dancer profile with coaches, check
            in, select programs you&apos;re interested in, and view published
            callbacks. It helps you stay organized while giving coaches
            information to learn about you during and after the event.
          </p>
        ),
      },
      {
        value: "need-account-or-premium",
        question: "Do I need an S2S account or Premium membership to participate?",
        answer: (
          <>
            <p>
              You do not need an existing S2S account or a Premium membership.
              If you don&apos;t have an account, you&apos;ll receive an email
              with a link to create one and access your event.
            </p>
            <p>
              Event access does not include the full Studio 2 Stadium platform.
              To access additional schools and recruiting tools beyond your
              event, you can purchase a Premium membership.
            </p>
          </>
        ),
      },
      {
        value: "existing-or-new-account",
        question:
          "I already have an S2S account. Should I use it or create a new one?",
        answer: (
          <p>
            Use your existing Studio 2 Stadium account. Before the event, update
            your profile so it accurately reflects who you are as a person and
            dancer. Coaches will use this information to learn about you during
            and after the event.
          </p>
        ),
      },
      {
        value: "how-to-access",
        question: "How do I access my event?",
        answer: (
          <p>
            You&apos;ll receive an email with a unique link to register for
            access to your event in S2S Live. If you don&apos;t see the email,
            check your spam or junk folder. If you still can&apos;t find it,
            contact the event organizer for help.
          </p>
        ),
      },
      {
        value: "complete-profile",
        question: "What should I complete on my profile before the event?",
        answer: (
          <>
            <p>
              Give coaches a clear picture of your dancing, experience, and
              personality. Include:
            </p>
            <ul className="list-disc pl-4">
              <li>
                An About Me section describing who you are, including interests,
                hobbies, volunteering, jobs, or other involvement.
              </li>
              <li>Recent videos showcasing your range of dance styles.</li>
              <li>
                Your current GPA and the studio or high school where you train.
              </li>
              <li>Relevant references and significant awards or achievements.</li>
              <li>Current contact information so coaches can reach you.</li>
            </ul>
            <p>
              Complete your profile before arriving so coaches have useful
              information when evaluating you.
            </p>
          </>
        ),
      },
      {
        value: "registration-clarification",
        question: "Does registering in S2S Live also register me for the event?",
        answer: (
          <>
            <p>
              No. You must complete event registration and any required payment
              directly through the event organizer.
            </p>
            <p>
              S2S Live supports the recruiting experience at the event. Creating
              an account or accessing the event in S2S Live does not reserve your
              place or replace the organizer&apos;s registration process.
            </p>
          </>
        ),
      },
    ],
  },
  {
    value: "program-choices",
    title: "Program Choices",
    content: [
      {
        value: "how-choices-work",
        question: "How do my program choices work?",
        answer: (
          <>
            <p>
              Select the programs you&apos;re most interested in from the schools
              participating in your event. The number you can select depends on
              how the organizer has set up the event.
            </p>
            <p>
              Coaches can filter dancers who selected their program, helping them
              identify interest and use their evaluation time more intentionally.
            </p>
          </>
        ),
      },
      {
        value: "who-can-see-choices",
        question:
          "Who can see my program choices? Can other programs still evaluate me?",
        answer: (
          <>
            <p>
              Only the programs you select can see that you chose them. Other
              participating programs can still evaluate you and call you back,
              even if you didn&apos;t select them.
            </p>
            <p>
              Your choices communicate interest; they do not limit which programs
              can consider you.
            </p>
          </>
        ),
      },
      {
        value: "change-choices",
        question: "Can I change my program choices?",
        answer: (
          <p>
            Yes. You can change your choices at any time. You must stay within
            the selection limit set by the event organizer. If you&apos;ve
            reached that limit, remove a selection before choosing another
            program.
          </p>
        ),
      },
    ],
  },
  {
    value: "callbacks-communication",
    title: "Callbacks & Coach Communication",
    content: [
      {
        value: "where-when-callbacks",
        question: "Where and when will I see my callbacks?",
        answer: (
          <>
            <p>
              Callbacks appear in your Callbacks section as soon as the event
              organizer publishes them. You&apos;ll see which programs called you
              back and the specific showcase associated with each callback.
            </p>
            <p>
              If you did not receive a callback, no program names will appear for
              that showcase. Check whether results have been published before
              interpreting an empty list.
            </p>
          </>
        ),
      },
      {
        value: "callback-meaning",
        question: "What does a callback mean?",
        answer: (
          <>
            <p>
              A callback means a coach or program is interested in seeing you
              dance again as part of the event&apos;s evaluation process. Follow
              the organizer&apos;s instructions for when and where to attend.
            </p>
            <p>
              A callback is not a guaranteed roster spot, an official offer, or
              an invitation to a program&apos;s audition.
            </p>
          </>
        ),
      },
      {
        value: "no-callback-meaning",
        question: "What does it mean if I don't receive a callback?",
        answer: (
          <>
            <p>
              Once results are published, no callback means that a program has
              not selected you for another look during that showcase. It does not
              determine your overall potential or automatically rule out future
              opportunities with that program.
            </p>
            <p>
              Coaches make decisions based on what they observe and what their
              programs need. Continue participating fully in the event, learning
              from the experience, and researching each program&apos;s recruiting
              and audition requirements.
            </p>
          </>
        ),
      },
      {
        value: "see-coach-notes",
        question: "Can I see coach notes, ratings, or evaluations?",
        answer: (
          <p>
            No. Coach notes, ratings, and evaluations are private to the coach
            and their program. You can see your published callbacks, but not the
            evaluations behind those decisions.
          </p>
        ),
      },
      {
        value: "contact-after-event",
        question: "How will coaches contact me after the event?",
        answer: (
          <p>
            Coaches will use the contact information on your profile to reach out
            personally. Make sure those details are current so interested
            programs can contact you.
          </p>
        ),
      },
    ],
  },
  {
    value: "after-event-help",
    title: "After the Event & Getting Help",
    content: [
      {
        value: "access-duration",
        question: "How long can I access my event after it ends?",
        answer: (
          <p>
            You&apos;ll have access to your event profile and event information
            for three months after the event.
          </p>
        ),
      },
      {
        value: "access-expires",
        question: "What happens to my account when event access expires?",
        answer: (
          <>
            <p>
              If your access is provided through the event, your account will
              automatically become a free-tier S2S account after the three-month
              access period ends.
            </p>
            <p>
              You can choose to upgrade to Premium for $25 per month to access
              the full recruiting experience, including additional schools and
              recruiting tools.
            </p>
          </>
        ),
      },
      {
        value: "who-to-contact",
        question: "Who should I contact if I need help?",
        answer: (
          <>
            <p>
              The event organizer should be your first point of contact for event
              access, registration, schedules, check-in, and callback questions.
            </p>
            <p>
              For a technical issue or suspected bug, email info@studio2stadium.com.
              Include the event name, a description of the problem, and a
              screenshot if possible so our team can investigate.
            </p>
          </>
        ),
      },
    ],
  },
];
