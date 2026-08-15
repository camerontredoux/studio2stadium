import { PartnerCard } from "./partner-card";
import type { Partner } from "@/shared/types";

import aestheticEditLogo from "@/assets/partner-logos/aesthetic_edit.png";
import amyGemsLogo from "@/assets/partner-logos/amy_gems.jpg";
import cscaLogo from "@/assets/partner-logos/csca.jpg";
import deeaLogo from "@/assets/partner-logos/deea.png";
import dicLogo from "@/assets/partner-logos/dic.jpg";
import dtuLogo from "@/assets/partner-logos/dtu.jpg";
import ndcaLogo from "@/assets/partner-logos/ndca.jpg";
import vaultLogo from "@/assets/partner-logos/thevault.png";
import velocityLogo from "@/assets/partner-logos/velocity.png";
import ceventLogo from "@/assets/partner-logos/c-event.png";

const partners: Partner[] = [
  {
    id: "prodigy-dance",
    name: "Prodigy Dance Convention",
    description:
      "Exclusive event access for recruiters and dancers attending the convention.",
    logo: vaultLogo,
    loginUrl: "https://app.studio2stadium.com/login",
  },
  {
    id: "ndca",
    name: "National Dance Coaches Association (NDCA)",
    description:
      "Professional organization providing resources, education, and a platform for networking for dance team coaches across all levels.",
    longDescription:
      "The National Dance Coaches Association (NDCA) is a professional organization dedicated to supporting and empowering dance team coaches across the United States. It aims to provide resources, education, and a platform for networking among coaches at various levels, including middle school, high school, collegiate, and all-star dance programs. The NDCA's mission focuses on promoting the advancement of dance team coaching by offering tools like coaching certifications, professional development opportunities, mentorship programs, and access to a comprehensive network of dance professionals.",
    website: "https://nationaldancecoaches.org/",
    logo: ndcaLogo,
  },
  {
    id: "dtu",
    name: "Dance Team Union (DTU)",
    description:
      "Founded in 2016, focuses on coach and dancer-centered training with the motto 'be bold, be authentic, be you'.",
    website: "https://danceteamunion.com/",
    longDescription:
      "Dance Team Union (DTU) was formed in 2016 to provide a new approach to dance team training and competition. DTU strives to be always coach- and dancer-focused and to listen to what coaches and teams say they want/need and provide opportunities that align with it. DTU is committed to providing a positive atmosphere at all our events - including staff who are welcoming and reflect the diverse array of dancers and teams who make up our client base. DTU's motto, \"be bold, be authentic, be you,\" reflects an emphasis on individuality, authentic expression of each team's unique qualities, and a comfort level with the differences among dancers, teams and communities that makes dance team such an exciting and fulfilling sport and art form.",
    logo: dtuLogo,
  },
  {
    id: "amys-gems",
    name: "Amy's Gems",
    description:
      "Audition styling service offering rentals and custom outfits plus complimentary style appointments.",
    logo: amyGemsLogo,
    longDescription:
      "Amy is an audition stylist who offers both rentals and custom purchase outfits. She also helps style dancers for clinics and prep classes, ensuring you look and feel your best. Amy has so many options that no matter what your budget is, you will be happy no matter what! Amy offers in-person and virtual appointments, making her services accessible to everyone. This collaboration is designed to give you an extra boost of confidence, knowing you have a professional stylist in your corner.",
    discount: "15% off for Studio 2 Stadium members",
    website: "https://www.agauditionwear.com/",
  },
  {
    id: "csca",
    name: "Colorado Spirit Coaches Association (CSCA)",
    description:
      "Supports coaches and athletes in Colorado's cheer, dance, and spirit teams; recognizes achievement through the All-Colorado Spirit Team.",
    longDescription:
      "Colorado Spirit Coaches Association supports and recognizes coaches and athletes in Colorado's cheer, dance, all-star, and drill teams. The CSCA's mission is to: Unite coaches, Educate coaches, Network coaches, and Recognize the achievements of coaches and athletes. The CSCA honors coaches and students with the All-Colorado Spirit Team, which is considered one of the highest honors for spirit leaders. The selection is based on talent, academic excellence, and contributions to the sport.",
    logo: cscaLogo,
    website: "https://cscaonline.org/",
  },
  {
    id: "velocity-dance",
    name: "Velocity Dance Convention",
    description:
      "National touring dance convention producing 20+ events annually with classes and competitions across the US.",
    logo: velocityLogo,
    longDescription:
      "Velocity Dance Convention is a nationally touring dance convention and competition focused on providing dancers with exceptional education, performance opportunities, scholarships, and meaningful experiences throughout the year. In partnership with Studio2Stadium, Velocity hosts a Collegiate Dance Team Night at Season Finale, giving dancers the opportunity to connect with collegiate dance programs, meet current team members and coaches, and gain a closer look at the collegiate dance team experience.",
    website: "https://www.velocitydanceconvention.com/",
  },
  {
    id: "deea",
    name: "Dance Education Equity Association (DEEA)",
    description:
      "Offers safety and equity training for dance organizations, including their signature 'BE Courageous Training'.",
    logo: deeaLogo,
    longDescription:
      "Dance Education Equity Association (DEEA) was formed in 2020 to provide dance education training for dance organizations focused on safety, accessibility, and equity. DEEA has a signature 12- hour training (BE Courageous Training) where we help organizations develop policy, procedure, and accountability practices threaded in inclusivity. By working together with respect and empathy, we strive to build dance environments that are open and welcoming to all!",
    website: "https://www.danceequityassociation.com/",
  },
  {
    id: "dance-into-college",
    name: "Dance into College",
    description:
      "College consulting firm connecting dancers with suitable colleges for team, major, or company opportunities.",
    logo: dicLogo,
    longDescription:
      "If you're looking to dance in college—whether on a dance team, as a dance major, or with a dance company—Dance into College is the perfect college consulting firm for you. Dance into College offers a unique college counseling program that connects high school dancers with colleges that align with their dance and academic interests. The team at Dance into College consists of experienced college counselors, professional dancers, dance instructors, evaluators, choreographers, both current and former dance team members, and college essay experts. With their expert knowledge and organizational and planning tools, Dance into College will keep you on top of your game!",
    website: "https://danceintocollege.com/",
  },
  {
    id: "the-aesthetic-edit",
    name: "The Aesthetic Edit | Color Analysis",
    description: "Elevate Your Presence from the Studio to the Sidelines. You’ve mastered the technique and perfected the performance, now it’s time to master your visual impact. In the high-stakes world of collegiate and professional dance auditions, the right look doesn’t just boost your confidence; it ensures you aren’t overlooked in a sea of talent. The Aesthetic Edit offers specialized Color Analysis designed specifically for dancers transitioning to the next level. We identify the precise palette that makes your skin glow, your eyes pop, and your energy radiate under stadium lights. S2S discount offering: The Offer Dancers coming from Studio2Stadium can use code STUDIO2STADIUM for 20% off my services",
    logo: aestheticEditLogo,
    discount: "STUDIO2STADIUM for 20% off services",
    longDescription:
      "Elevate Your Presence from the Studio to the Sidelines. You’ve mastered the technique and perfected the performance, now it’s time to master your visual impact. In the high-stakes world of collegiate and professional dance auditions, the right look doesn’t just boost your confidence; it ensures you aren’t overlooked in a sea of talent. The Aesthetic Edit offers specialized Color Analysis designed specifically for dancers transitioning to the next level. We identify the precise palette that makes your skin glow, your eyes pop, and your energy radiate under stadium lights. S2S discount offering: The Offer Dancers coming from Studio2Stadium can use code STUDIO2STADIUM for 20% off my services: Virtual Experience: $100, In-Person Experience (San Diego/Scottsdale): $200",
    website: "https://theaesthetic-edit.com/service-2-color-analysis",
  },
  {
    id: "c-event-pics",
    name: "C Event Pics",
    description: "C Event Pics provides professional photography for dance competitions, conventions, live events and dance studios, capturing everything from performances on stage to the energy and moments happening throughout the weekend. Their team focuses on creating polished, high-quality images that showcase dancers, studios, and events while preserving the memories that make each experience special.",
    logo: ceventLogo,
    longDescription:
      "C Event Pics provides professional photography for dance competitions, conventions, live events and dance studios, capturing everything from performances on stage to the energy and moments happening throughout the weekend. Their team focuses on creating polished, high-quality images that showcase dancers, studios, and events while preserving the memories that make each experience special.",
    website: "https://www.ceventpics.com/",
  }
];

export function PartnerList() {
  return (
    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3 lg:pt-4">
      {partners.map((partner) => (
        <PartnerCard
          key={partner.id}
          partner={partner}
        />
      ))}
    </div>
  )
}