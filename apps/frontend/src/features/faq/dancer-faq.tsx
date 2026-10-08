import type { ReactNode } from "react";

type FaqItem = {
  value: string;
  question: string;
  answer: ReactNode;
};

type FaqSection = {
  value: string;
  title: string;
  content: FaqItem[];
};

export const dancerFaqSections: FaqSection[] = [
  {
    value: "membership-and-account",
    title: "Membership & Account Settings",
    content: [
      {
        value: "manage-membership",
        question:
          "Where do I manage my membership, payment information, and receipts?",
        answer: (
          <p>
            Go to Settings → Membership to see your membership status and next
            billing date. Select Manage billing to manage your subscription,
            update your payment method, or cancel subscription.
          </p>
        ),
      },
      {
        value: "cancel-membership",
        question: "How do I cancel my membership, and are refunds available?",
        answer: (
          <p>
            Go to Settings → Membership → Manage billing to cancel. Canceling
            stops your next renewal. Membership payments are nonrefundable.
          </p>
        ),
      },
      {
        value: "delete-account-renewal",
        question: "Does deleting my account stop my membership from renewing?",
        answer: (
          <p>
            Yes. Deleting your account stops future membership renewals. Account
            deletion is permanent and removes your associated account data. To
            stop membership renewal without deleting your profile, use Settings
            &gt; Membership &gt; Manage billing &gt; Cancel subscription.
          </p>
        ),
      },
      {
        value: "change-email-number-pswd",
        question: "Where can I change my email, phone number, or password?",
        answer: (
          <>
            <p>
              For email and phone, open Settings → Account, update the fields,
              and select Update Profile.
            </p>
            <p>
              To change your password while signed in, open Settings → Password,
              enter your current and new passwords, and select Update Password.
              If you cannot sign in, select Forgot password? on the login page.
            </p>
          </>
        ),
      },
      {
        value: "manage-notifications",
        question: "Where do I manage notifications?",
        answer: (
          <p>
            Open Settings → Account and find the Notifications switch. To view
            your notifications, select the bell in the top navigation.
          </p>
        ),
      },
    ],
  },
  {
    value: "dancer-profile",
    title: "Your Dancer Profile",
    content: [
      {
        value: "edit-profile",
        question:
          "How do I edit my bio, training, contact details, and dance styles?",
        answer: (
          <>
            <p>
              Open Profile. Use Edit Profile beside About Me to update your bio,
              and the Edit controls beside Contact Information, Education &
              Training, and dance styles to update those sections.
            </p>
            <p>
              Account-level details, including your name, email, phone number,
              and username, are under Settings → Account.
            </p>
          </>
        ),
      },
      {
        value: "add-media-skills",
        question:
          "Where do I add photos, videos, skills, achievements, and references?",
        answer: (
          <p>
            Open Profile and use the add control beside Media Gallery, Skills,
            Achievements, or References. In Media Gallery, Upload Media offers
            separate Image and Video options.
          </p>
        ),
      },
      {
        value: "video-photo-limits",
        question: "How many videos and photos can I add?",
        answer: (
          <>
            <p>
              Premium members can add unlimited YouTube video links and
              unlimited photos. You can also upload up to three videos directly
              from your phone or computer, with a maximum length of two minutes
              per video.
            </p>
            <p>Free members do not have access to video uploads.</p>
          </>
        ),
      },
      {
        value: "preview-profile",
        question: "How can I preview my profile?",
        answer: (
          <p>
            Open Profile and select Preview to see your profile without editing
            controls. Check that your information is accurate and your profile
            is complete before sharing it or connecting with programs.
          </p>
        ),
      },
      {
        value: "other-dancers-visibility",
        question: "Can other dancers see my profile?",
        answer: (
          <p>
            No. Within S2S, dancer profiles are visible to verified college
            coaches and programs, not other dancers. You control the information
            you include on your profile and can update or remove it at any time.
          </p>
        ),
      },
      {
        value: "coach-notes-visibility",
        question: "Can dancers see coach notes?",
        answer: (
          <p>
            No. Coach notes are private and visible only to the coach who wrote
            them.
          </p>
        ),
      },
    ],
  },
  {
    value: "finding-connecting",
    title: "Finding & Connecting with Programs",
    content: [
      {
        value: "find-schools",
        question: "How do I find schools that fit my goals?",
        answer: (
          <p>
            Open Explore. Search by School Name or use filters such as Location,
            GPA Range, Division, Team Selection, Sports, and Styles. Select a
            school to learn about its program. Use Clear to remove filters.
          </p>
        ),
      },
      {
        value: "programs-i-follow",
        question: "Where can I see programs I already follow?",
        answer: (
          <p>
            Open Explore and use the Following filter. You can also select the
            Following count under Your Activity or on your profile to view your
            list.
          </p>
        ),
      },
      {
        value: "follow-vs-show-interest",
        question: "What is the difference between Follow and Show Interest?",
        answer: (
          <>
            <p>
              Follow sends the program&apos;s coach an email and notification
              with a direct link to your dancer profile. Complete your profile
              before following programs so coaches have the information they need
              to learn about you.
            </p>
            <p>
              Show Interest sends another email and notification to remind the
              coach that you&apos;re interested in their program and encourage
              them to reach out if the interest is mutual. Both features help you
              connect with coaches through S2S.
            </p>
          </>
        ),
      },
    ],
  },
  {
    value: "common-recruiting",
    title: "Common Recruiting",
    content: [
      {
        value: "eligibility-deadlines",
        question:
          "Who is eligible for Common Recruiting, and when are the deadlines?",
        answer: (
          <p>
            Common Recruiting is available only to current graduating seniors and
            older dancers. Submission deadlines are September 1 and January 1.
            Younger dancers are not eligible to submit.
          </p>
        ),
      },
      {
        value: "start-submission",
        question: "How do I start a Common Recruiting submission?",
        answer: (
          <p>
            Go to Recruiting → Submit. Enter a valid YouTube video URL, then
            continue through Select Schools and Confirm. Review your selected
            programs and video before sending.
          </p>
        ),
      },
      {
        value: "update-video",
        question: "Where is my recruiting video, and how do I update it?",
        answer: (
          <>
            <p>
              Open Recruiting. Your current video appears under Your Video.
              Select Edit to update the recruiting video link, then Save Changes.
            </p>
            <p>
              You can also use Edit in the Common Recruiting section of your
              profile.
            </p>
          </>
        ),
      },
      {
        value: "track-responses",
        question: "Where can I track school responses to my submission?",
        answer: (
          <p>
            Open Recruiting to see your submissions, program responses, and
            video. Submission cards show status and whether your video has been
            watched. Use Filters to narrow the list.
          </p>
        ),
      },
      {
        value: "accepted-meaning",
        question: "Does Accepted mean I have a spot on the team?",
        answer: (
          <p>
            No. Accepted means the program wants you to take the next step in its
            recruiting process. It is not an official offer, a guaranteed roster
            spot, or an exemption from other requirements. Follow the
            program&apos;s specific next-step instructions.
          </p>
        ),
      },
      {
        value: "in-review-released",
        question: "What do In Review and Released mean?",
        answer: (
          <>
            <p>
              In Review means the program is evaluating your submission and has
              not decided whether to move you forward.
            </p>
            <p>
              Released means the program is not moving your submission forward at
              this time. Each program sets its own audition eligibility and
              recruiting requirements.
            </p>
          </>
        ),
      },
    ],
  },
  {
    value: "events-resources",
    title: "Events & Resources",
    content: [
      {
        value: "training-blogs-partners",
        question:
          "Where can I find training videos, blogs, and partner resources?",
        answer: (
          <>
            <p>
              Open Resources. Tap In opens the training library, Blog opens
              articles, and Partners opens partner information.
            </p>
            <p>
              The dancer training library includes Technique, Choreography, and
              Pro Pointers. Use Load More to see additional videos in a category.
            </p>
          </>
        ),
      },
      {
        value: "school-vs-global-events",
        question: "How do I find school events versus general dance events?",
        answer: (
          <>
            <p>
              Open Events. Schools shows school-run events, while Global shows
              the curated platform-wide list.
            </p>
            <p>
              School Events also includes an Attending switch and Filters. Open
              an event to read its details and organizer information.
            </p>
          </>
        ),
      },
      {
        value: "attend-vs-register",
        question: "Is selecting Attend the same as registering for an event?",
        answer: (
          <>
            <p>
              No. Attend tags the event in S2S; it does not complete
              registration or payment.
            </p>
            <p>
              Select Register to open the organizer&apos;s registration page and
              follow its requirements.
            </p>
          </>
        ),
      },
    ],
  },
];
