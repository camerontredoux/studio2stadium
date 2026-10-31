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

export const faqSections: FaqSection[] = [
  {
    value: "access-questions",
    title: "Access & Account Settings",
    content: [
      {
        value: "cost",
        question: "Is there a cost for college coaches to use S2S?",
        answer: (
          <p>
            No. College coach access is free.
          </p>
        ),
      },
      {
        value: "college-coach-verified",
        question: "How are college coaches verified?",
        answer: (
          <p>
            Coaches submit a government-issued or school ID. Our team manually 
            reviews applications within 24-48 hours, cross-referencing the ID with 
            the coach’s school email, the email used to register, and information 
            on school staff websites and social media to confirm their affiliation 
            with a college dance program.
          </p>
        ),
      },
      {
        value: "coach-application-info",
        question: "Where can I see my coach application information?",
        answer: (
          <p>
            Open Settings → Application to view your application information. 
            Allow 24-48 hours for review. You can begin setting up your program 
            profile while waiting.
          </p>
        ),
      },
      {
        value: "change-email-number-pswd",
        question: "Where can I change my email, phone number, or password?",
        answer: (
          <>
            <p>
              For email and phone, open Settings → Account, update the fields, and 
              select Update Profile.
            </p>
            <p>
              To change your password while signed in, open Settings → Password, 
              enter your current and new passwords, and select Update Password. If 
              you cannot sign in, select Forgot password? on the login page.
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
    value: "program-profile",
    title: "Your Program Profile",
    content: [
      {
        value: "edit-profile",
        question: "How do I edit my program profile?",
        answer: (
          <>
            <p>
              Open Profile. Edit Profile opens the About, Mission Statement, What 
              We Do, and Benefits sections.
            </p>
            <p>
              Use Edit program details at the top to update program details. Contact 
              Information and Team Information have their own Edit controls, while 
              Media Gallery, Skills, and Hosting Events have their own add controls.
            </p>
          </>
        ),
      },
    ],
  },
  {
    value: "discover-review",
    title: "Discovering & Reviewing Dancers",
    content: [
      {
        value: "search-for-dancers",
        question: "How do I search for dancers?",
        answer: (
          <>
            <p>
              Open Explore to reach Explore Dancers. Search by Dancer Name or use 
              filters such as Following, Premium, GPA Range, Location, Sports, and 
              Styles.
            </p>
            <p>
              Use Clear to remove filters and the page controls to see more results.
            </p>
          </>
        ),
      },
      {
        value: "saved-dancers",
        question: "Where are my saved dancers, ratings, and notes?",
        answer: (
          <p>
            Open Resources to find the saved-dancer table, which includes Dancer, Rating,
             Notes, and Favorited columns. Use column headers to organize the list and 
             page controls to move through results.
          </p>
        ),
      },
      {
        value: "coach-notes-privacy",
        question: "Who can see my coach notes?",
        answer: (
          <p>
            Your notes are private and visible only to you. Dancers and other coaches cannot 
            see the notes you write.
          </p>
        ),
      },
      {
        value: "dancer-interest-follow",
        question: "What happens when a dancer Follows or Shows Interest in my program?",
        answer: (
          <>
            <p>
              Both actions send you an email and notification with a direct link to the dancer’s 
              profile.
            </p>
            <p>
              Follow introduces the dancer’s profile to your program. Show Interest reminds you 
              of their interest and encourages you to reach out if you’re interested in them, too.
            </p>
          </>
        ),
      },
      {
        value: "dancer-recommended",
        question: "Why are certain dancers recommended to my program?",
        answer: (
          <>
            <p>
              Premium dancer recommendations consider profile information such as skills, styles, GPA, 
              and training level to identify potential fits for your program.
            </p>
            <p>
             Recommendations help you discover dancers to evaluate further. They do not replace your 
             program’s recruiting criteria or selection decisions.
            </p>
          </>
        ),
      },
      {
        value: "favorite-dancer",
        question: "What happens when I favorite a dancer?",
        answer: (
          <p>
            Favoriting a dancer lets them know you are interested and automatically follows their 
            profile. Whenever they upload new content, their updates will appear on your home screen, 
            making it easy to track their progress over time. You can unfavorite a dancer at any time, 
            which will also unfollow their profile.
          </p>
        ),
      },
      {
        value: "message-dancers",
        question: "Can I message dancers directly through S2S?",
        answer: (
          <p>
            S2S does not include a direct messaging system. We intentionally chose not to add another 
            inbox for coaches and dancers to manage. If you are genuinely interested in a dancer, it 
            is the coach’s responsibility to make direct contact. Each dancer’s profile includes their 
            available email address, phone number, and social media handle so you can easily reach out 
            through your preferred method.
          </p>
        ),
      },
    ],
  },
  {
    value: "common-recruiting",
    title: "Common Recruiting",
    content: [
      {
        value: "common-recruiting-eligibility",
        question: "Who is eligible to submit a Common Recruiting video, and when are the deadlines?",
        answer: (
          <p>
            Common Recruiting submissions are available only to current graduating seniors and older 
            dancers. Submission deadlines are September 1 and January 1.
          </p>
        ),
      },
      {
        value: "common-recruiting-review",
        question: "Where do I review Common Recruiting submissions?",
        answer: (
          <p>
            Select Recruiting in the main navigation, marked with the stars icon. The Common 
            Recruiting page lists submissions to your program and shows totals for Unwatched, 
            Pending, In Review, Accepted, and Released.
          </p>
        ),
      },
      {
        value: "recruiting-no-submissions",
        question: "Why does Recruiting show no submissions?",
        answer: (
          <>
            <p>
              Open Filters and check Status and Watched. Broaden those filters to see whether 
              submissions are hidden by your current selections.
            </p>
            <p>
              If the list is still empty, confirm you are signed into the account connected to 
              the intended program.
            </p>
          </>
        ),
      },
      {
        value: "inreview-accepted-released",
        question: "When should I use In Review, Accepted, or Released?",
        answer: (
          <>
            <p>
              Use In Review while evaluating a submission.
            </p>
            <p>
              Use Accepted when you want the dancer to move forward to your next recruiting step.
            </p>
            <p>
              Use Released when you are not moving the submission forward at this time.
            </p>
            <p>
              Status updates communicate your decision to dancers by email. Provide your program’s 
              specific next-step instructions, requirements, and deadlines when following up.
            </p>
          </>
        ),
      },
      {
        value: "dancer-accepted",
        question: "Does marking a dancer Accepted mean I am offering them a roster spot?",
        answer: (
          <p>
            No. Accepted indicates that you want the dancer to move to the next step in your 
            recruiting process. It does not represent an official offer, guarantee a roster spot, 
            or waive your program’s remaining requirements.
          </p>
        ),
      },
    ],
  },
];
