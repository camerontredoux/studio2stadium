import type { EventFaqSection } from "@/features/org/components/event-faq";

export const coachEventFaqSections: EventFaqSection[] = [
  {
    value: "getting-access",
    title: "Getting Access",
    content: [
      {
        value: "how-to-access",
        question: "How do I access S2S Live for my event?",
        answer: (
          <>
            <p>
              If your program already has an S2S account, event access is
              automatically added once the organizer uploads your registration.
              You can then access both regular S2S features and S2S Live through
              the same account.
            </p>
            <p>
              Make sure the organizer uses the email associated with your
              existing S2S account to prevent duplicate accounts. If your program
              is new to S2S, register through the event organizer to receive
              access. You will receive an email with a unique link to sign up and
              start setting up your profile. Make sure to check spam if you
              don&apos;t see it at first.
            </p>
          </>
        ),
      },
      {
        value: "use-existing-account",
        question: "Should I use my existing S2S coach account?",
        answer: (
          <p>
            Yes. Use your existing account. Once the organizer uploads your
            registration using the matching email address, your account
            automatically receives event access. You do not need to create a new
            account or rebuild your program profile.
          </p>
        ),
      },
      {
        value: "verification",
        question:
          "Do I need to complete S2S coach verification before accessing event participants?",
        answer: (
          <p>
            Coaches joining through the event organizer do not need to complete
            S2S&apos;s separate ID-verification process for event access. The
            organizer confirms your participation and program affiliation through
            its registration process and your in-person attendance.
          </p>
        ),
      },
      {
        value: "multiple-coaches",
        question: "Can multiple coaches from my program participate?",
        answer: (
          <>
            <p>
              Yes. S2S Live uses one shared school profile rather than separate
              accounts for each coach. Coaches from your program will use the
              same account username and password.
            </p>
            <p>
              Notes, ratings, and selections are associated with that shared
              program account.
            </p>
          </>
        ),
      },
      {
        value: "update-before-event",
        question: "What should I update before the event?",
        answer: (
          <>
            <p>
              Make sure your program profile gives dancers a clear understanding
              of your team and its opportunities. Review:
            </p>
            <ul className="list-disc pl-4">
              <li>Your program description and current contact information.</li>
              <li>GPA and other recruiting requirements.</li>
              <li>Scholarships or sponsorship opportunities.</li>
              <li>Performance and travel opportunities.</li>
              <li>Any distinctive benefits or expectations of your program.</li>
              <li>Photo and Video to showcase your team.</li>
            </ul>
            <p>
              Keep this information current so interested dancers can better
              understand whether your program aligns with their goals.
            </p>
          </>
        ),
      },
    ],
  },
  {
    value: "finding-evaluating",
    title: "Finding & Evaluating Dancers",
    content: [
      {
        value: "search-and-filter",
        question: "How do I search and filter event participants?",
        answer: (
          <>
            <p>
              Select Dancers from the dropdown menu. Use the search bar and
              filters to find participants by bib number, name, event, graduation
              year, or state.
            </p>
            <p>
              You can also filter for dancers who selected your program, dancers
              you favorited, and dancers with ratings, notes, or callbacks from
              your program.
            </p>
            <p>
              Hover over an icon to see what it means. Select Clear at the top to
              reset your search and filters.
            </p>
          </>
        ),
      },
      {
        value: "evaluate-every-dancer",
        question:
          "Can I evaluate every dancer or only dancers who selected my program?",
        answer: (
          <>
            <p>
              You can view and evaluate every dancer, regardless of whether they
              selected your program.
            </p>
            <p>
              Use the filter at the top to narrow the list to dancers who
              included your program among their top choices.
            </p>
          </>
        ),
      },
      {
        value: "dancers-who-selected",
        question:
          "Where can I see dancers who selected my program, and what do those choices mean?",
        answer: (
          <>
            <p>
              On the Dancers page, use the interest filter to see participants who
              selected your program.
            </p>
            <p>
              Dancers have a limited number of program choices, set by the event
              organizer. Selecting your program communicates that they are
              particularly interested in your team. Use this information to
              identify interested dancers and evaluate whether they could be a
              fit.
            </p>
          </>
        ),
      },
      {
        value: "record-notes",
        question: "How do I record notes and revisit them later?",
        answer: (
          <>
            <p>
              Select the plus icon next to a dancer&apos;s name, enter your notes
              in the box, and select Save at the bottom.
            </p>
            <p>
              You can return to these notes during and after the event through the
              event&apos;s dancer list.
            </p>
          </>
        ),
      },
      {
        value: "notify-and-privacy",
        question:
          "Does saving or favoriting a dancer notify them? Who can see my evaluations?",
        answer: (
          <>
            <p>
              Saving or favoriting a dancer in S2S Live does not notify them.
              Notes, ratings, and evaluations are private to your program account
              and are not visible to dancers or other programs.
            </p>
            <p>
              Dancers can see your published callbacks. If you want to pursue a
              dancer further, use the contact information on their profile to
              reach out personally.
            </p>
          </>
        ),
      },
      {
        value: "notes-saved",
        question: "How do I know my notes have been saved?",
        answer: (
          <>
            <p>
              After entering your notes, select Save. The plus icon next to the
              dancer&apos;s name will change to a pencil icon, indicating that
              notes have been recorded.
            </p>
            <p>
              Select the pencil to revisit your notes. You can also filter for
              dancers with notes during and after the event.
            </p>
          </>
        ),
      },
    ],
  },
  {
    value: "callbacks",
    title: "Callbacks",
    content: [
      {
        value: "submit-callbacks",
        question: "How do I submit callbacks?",
        answer: (
          <>
            <p>
              Select the Callback button next to each dancer you want to see
              again. The callback count at the top of your dashboard will increase
              as you make selections.
            </p>
            <p>
              Your selections appear in the event organizer&apos;s admin
              dashboard. The organizer controls when callbacks are published to
              dancers.
            </p>
            <p>
              Callback selections reset when results are published or a new round
              begins, allowing you to make selections for subsequent rounds.
            </p>
          </>
        ),
      },
      {
        value: "change-callback",
        question: "Can I change a callback before or after it is published?",
        answer: (
          <>
            <p>
              Before publication, you can remove a callback by deselecting the
              dancer.
            </p>
            <p>
              Once the organizer publishes the callbacks, you cannot edit that
              round&apos;s published selections. Review your choices carefully
              before publication.
            </p>
          </>
        ),
      },
      {
        value: "when-dancers-see",
        question: "When do dancers see my callbacks?",
        answer: (
          <p>
            Dancers see callbacks only after the event organizer selects Publish.
            Selecting a dancer for a callback does not immediately make that
            selection visible to them.
          </p>
        ),
      },
      {
        value: "dancers-notified",
        question: "Are dancers notified when my program calls them back?",
        answer: (
          <>
            <p>
              Yes. Once the organizer publishes results, dancers can see which
              programs called them back for each round.
            </p>
            <p>
              This communicates your interest clearly without requiring individual
              announcements or conversations with every dancer.
            </p>
          </>
        ),
      },
      {
        value: "next-steps-contact",
        question: "How do I provide next-step instructions or contact a dancer?",
        answer: (
          <>
            <p>
              Reach out personally using the contact information on the
              dancer&apos;s profile. Profiles include contact details such as
              email addresses, social media accounts, and optional phone numbers.
            </p>
            <p>
              S2S Live does not have an in-platform messaging system. Keeping
              follow-up direct avoids adding another inbox for coaches and dancers
              to manage.
            </p>
          </>
        ),
      },
    ],
  },
  {
    value: "after-event-help",
    title: "After the Event & Getting Help",
    content: [
      {
        value: "review-duration",
        question:
          "How long can I review dancer profiles, videos, notes, and callbacks after the event?",
        answer: (
          <>
            <p>
              You can review event profiles, videos, notes, and callbacks for
              three months after the event.
            </p>
            <p>
              Your access to the full Studio 2 Stadium platform continues after
              event access expires, so you can keep following dancers, see updates
              to their profiles, and track their progress throughout their
              recruiting journey.
            </p>
          </>
        ),
      },
      {
        value: "find-notes-after",
        question:
          "Where can I find my event notes afterward? Do they carry over to regular S2S?",
        answer: (
          <>
            <p>
              Your event notes are saved to your account. To review them, reopen
              the specific event organization using the circular organization
              logos at the top of your home page or navigate through your profile
              page.
            </p>
            <p>
              Event notes remain associated with their organization during the
              access period, so return to that event to review your evaluations.
            </p>
          </>
        ),
      },
      {
        value: "who-to-contact",
        question: "Who should I contact if a dancer is missing or something isn't working?",
        answer: (
          <>
            <p>
              Contact the event organizer first for missing participants,
              registration or access questions, check-in issues, and callback
              publication questions.
            </p>
            <p>
              For a technical issue or suspected bug, email info@studio2stadium.com.
              Include the event name, your program name, a description of the
              problem, and a screenshot if possible so our team can investigate.
            </p>
          </>
        ),
      },
    ],
  },
];
