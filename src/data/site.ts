// Source of truth mirrors the MCP server's get_identity / get_education / get_work
// tools. Keep this in sync with those — don't invent facts here.

export const identity = {
  name: "Jerry Lockard",
  location: "Covington, Kentucky",
  coordinates: "39.0837° N, 84.5086° W",
};

export interface WorkItem {
  title: string;
  body: string;
  meta: string[];
}

export interface WorkGroup {
  label: string;
  items: WorkItem[];
}

export const workGroups: WorkGroup[] = [
  {
    label: "Community & public service",
    items: [
      {
        title: "Covington Mayor's Academy",
        body: "A city program on how Covington's departments, budget, and services actually operate. I'm writing up each session as I go — partly to learn it properly, partly because the notes should be useful to somebody else who lives here.",
        meta: ["City of Covington", "Current cohort"],
      },
      {
        title: "Volunteer, Hope Center",
        body: "Served meals and helped out at a shelter in Lexington. The people there were having the worst year of their lives and mostly wanted to be treated like people. It's the clearest thing I've learned about why public services matter.",
        meta: ["Lexington, KY", "Meals & resident support"],
      },
      {
        title: "Substitute teacher",
        body: "Fayette County Public Schools, mostly elementary classrooms. You walk into a room you didn't plan for, with kids who didn't ask for a stranger, and you make the day work anyway. Good training for public work generally.",
        meta: ["Fayette County Schools", "Kentucky certified"],
      },
    ],
  },
  {
    label: "Study",
    items: [
      {
        title: "B.A., Political Science",
        body: "Eastern Kentucky University, 2025. I went in wanting to understand how decisions get made and who they land on, and came out more interested in the ordinary machinery than the headlines. Dean's List in my final full semester.",
        meta: ["EKU · 2025", "Public Administration", "Public Policy · Public Finance", "Civil Liberties · Intro to Law"],
      },
    ],
  },
  {
    label: "Technical",
    items: [
      {
        title: "Self-hosted infrastructure",
        body: "I run my own servers out of the house — the hardware, the network, the backups, and the plan for when it breaks at 2am. Self-taught during lockdown and maintained ever since. Everything is documented well enough that somebody else could take it over.",
        meta: ["Linux · Networking", "Databases · Runbooks", "Sole operator"],
      },
    ],
  },
];

export interface WritingEntry {
  date: string;
  title: string;
  tag: string;
  href: string;
}

// Empty on purpose — no real posts exist yet. See list_todos: "writing-samples".
export const writingEntries: WritingEntry[] = [];
