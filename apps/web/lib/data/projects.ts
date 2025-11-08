import type { Projects } from "@/types/projects";

const data: Projects = [
  {
    name: 'BBC Projects',
    description:
      'I participate in a range of projects at the BBC. Most recently, I transitioned the BBC’s Open Source site to the [WebCore](https://www.bbc.co.uk/webarchive/https%3A%2F%2Fwww.bbc.co.uk%2Fblogs%2Finternet%2Fentries%2F8673fe2a-e876-45fc-9a5f-203c049c9f9c) service to enhance performance, maintainability, accessibility, and user experience. I also contribute to open-source projects, such as [SQS Consumer](https://github.com/bbc/sqs-consumer), and help teams improve their experimentation capabilities.',
    links: [
      {
        title: 'BBC Open Source',
        url: 'https://www.bbc.co.uk/opensource',
      },
      {
        title: 'BBC GitHub',
        url: 'https://github.com/bbc',
      },
    ],
    image: '/uploads/images/projects/bbc_open_source.png',
    imageAlt: "A screenshot of the BBC's Open Source site",
  },
  {
    name: 'A custom CMS',
    description:
      'At Accrosoft, I developed a custom CMS called AccroPress, a fully headless system with a React frontend and a Node.js/Express backend. Designed as a hosted service, it was used by various school and job sites worldwide. AccroPress also offered several microservices, including image processing, contact forms, and more.',
    links: [
      {
        title: 'HireRoad',
        url: 'https://hireroad.com/',
      },
      {
        title: 'AccroPress',
        url: 'https://accropress.com',
      },
    ],
    image: '/uploads/images/projects/accropress.png',
    imageAlt: 'A screenshot of the AccroPress CMS',
  },
  {
    name: 'Career Sites',
    description:
      'While at Vacancy Filler, I collaborated with clients like Bouygues Construction UK to launch career site initiatives that attract and inform potential candidates about roles across their organization. I also worked with brands such as the Woodland Trust, Longleat, and the Devonshire Group, among others.',
    links: [
      {
        title: 'Bouygues',
        url: 'https://careers.bouygues-construction.co.uk/',
      },
      {
        title: 'Woodland Trust',
        url: 'https://jobs.woodlandtrust.org.uk/',
      },
      {
        title: 'Longleat',
        url: 'https://jobs.longleat.co.uk/',
      },
    ],
    image: '/uploads/images/projects/bouygues.png',
    imageAlt: 'A screenshot of the Bouygues Construction UK career site',
  },
  {
    name: 'TechNutty',
    description:
      'TechNutty was a technology news and reviews site that I started during college/uni in 2011, I ran it for some time as a side project and a way of experimenting with developement. Sadly, a few years back I did choose to shut down this site, so Ive included a link to wayback machine instead :)',
    links: [
      {
        title: 'View Archive',
        url: 'https://web.archive.org/web/collections/*/https://technutty.co.uk',
      },
    ],
  },
  {
    name: 'Side Projects',
    description:
      'Alongside my day job, I have a number of side projects that I work on, some of which are open source and can be found on my GitHub. I have a number of projects that I have worked on over the years, some of which are still in development, others are just experiments.',
    links: [
      {
        title: 'My GitHub',
        url: 'https://github.com/nicholasgriffintn',
      },
    ],
  },
];

export async function getProjects(): Promise<Projects> {
	return data;
}
