// Team branch mapping extracted from registration data
export const TEAM_BRANCHES = {
  101: { branch: "IT B", members: ["Hukmeet Kaur Chhina", "Arnav Katiyar"] },
  102: { branch: "EI/ETC A", members: ["Shubham kotwani", "Ayush pyasi"] },
  103: { branch: "ETC A", members: ["Meghraj singh rajput", "Ansh Gupta"] },
  104: { branch: "IT A", members: ["Vrushali Jain", "Atharva Upasani"] },
  105: { branch: "CS A/EI", members: ["Shreyash Banzal", "Rhythm Surana"] },
  106: { branch: "CSBS", members: ["Advait Kshirsagar", "Gurpreet Singh Bhatia"] },
  107: { branch: "EI", members: ["Anushka Chandravanshi", "Adarsh Singh"] },
  108: { branch: "EI", members: ["Tanmay Vishwakarma", "Mayank Jain"] },
  109: { branch: "CS A", members: ["PARTH YADAV", "AASTHA AGRAWAL"] },
  110: { branch: "CS A", members: ["Kavya Sahu", "Stuti Jain"] },
  111: { branch: "CS A", members: ["Sarthak Geete", "Kaif Jilani"] },
  112: { branch: "IT A", members: ["Rochak Jain", "Bhavik Agrawal"] },
  113: { branch: "CS A/CS B", members: ["Gajal Gupta", "Shivani Chaurasiya"] },
  114: { branch: "CS B/IT B", members: ["Ansh Zamde", "Tamanna Gupta"] },
  115: { branch: "EI/ETC A", members: ["Prerna Singhal", "Antima Singh Chauhan"] },
  116: { branch: "IT A", members: ["priyanshu", "abhay"] },
  117: { branch: "CSBS", members: ["Parv Bafna", "Yash Yadav"] },
  118: { branch: "CSBS/CS B", members: ["Kanha Agrawal", "Rudra Pratap Singh"] },
  119: { branch: "CS A/IT A", members: ["Pushpit Upadhyay", "Anivartak Jain"] },
  120: { branch: "IT A", members: ["Sunnitesh Sharma", "Ayush gupta"] },
  121: { branch: "IT A", members: ["Aryan Singh", "Dharmendra Gupta"] },
  122: { branch: "IT A", members: ["Yashasvi sharma", "Divyansh dahima"] },
  123: { branch: "IT A", members: ["Rishabh Bohra", "Abhisar Kanude"] },
  124: { branch: "CS B", members: ["Nimisha Agarwal", "Siddhant jain"] },
  125: { branch: "IT A/EI", members: ["Priyanshi Ghosh", "Shivi yadav"] },
  126: { branch: "CS B", members: ["Uthkarsh Mandloi", "Prakhar Porwal"] },
  127: { branch: "CS A/IT B", members: ["Samayara Verma", "Kanishka Joshi"] },
  128: { branch: "IT A", members: ["AMAN AJMERI", "LUCKY LODHI"] },
  129: { branch: "IT A/IT B", members: ["Dron Nema", "Shubham Jha"] },
  130: { branch: "CS B", members: ["Priyanshi Jhariya", "Renée Wadhwa"] },
  131: { branch: "CS A", members: ["Abhijeet Junwal", "Rohan Bairagi"] },
  132: { branch: "CS A/IT B", members: ["Garv Sharma", "Rachna Surjaye"] },
  133: { branch: "EI", members: ["Shubham shah", "Anushka bhandari"] },
  134: { branch: "IT A/IT B", members: ["Om Asati", "Raghav Maheshwari"] },
  135: { branch: "EI", members: ["Ayush Namdev", "Kushal mukati"] },
  136: { branch: "IT B", members: ["Khushi Singh", "Disha Gupta"] },
  137: { branch: "IT B", members: ["Bhavya Agrawat", "Sara Verma"] },
  138: { branch: "CSBS/CS A", members: ["Prakhar", "Piyush Rawat"] },
  139: { branch: "CSBS", members: ["Bhumi Jain", "Gauri Paliwal"] },
  140: { branch: "CS B", members: ["Mahi Rathore", "Mahak Bansal"] },
  141: { branch: "IT B/CSBS", members: ["Radhika Pande", "Bhumika Patil"] },
  142: { branch: "IT A", members: ["Ayush Sharma", "Dhruv Chourey"] },
  143: { branch: "ETC B/IT B", members: ["Anshika Agrawal", "Chitransh Sahu"] },
  144: { branch: "EI/CS B", members: ["Yamini Prajapati", "Sonam Ahirwar"] },
  145: { branch: "CS A", members: ["Sejal Soni", "Pranjal Chawda"] },
  146: { branch: "CS A/CS B", members: ["Amish Mahajan", "Shubhansh Srivastav"] },
  147: { branch: "IT A", members: ["Nidhi Dahare", "Mahak Soni"] },
  148: { branch: "IT A/CS A", members: ["Yashmanglam Soni", "Ritvika jain"] },
  149: { branch: "IT B", members: ["Ayushi Pandey", "Shubhshree Umbarkar"] },
  150: { branch: "IT B", members: ["MohammedKapadia", "Hemant Salame"] },
  151: { branch: "ETC A", members: ["Harmeet", "Antima singh"] },
  152: { branch: "IT B/IT A", members: ["anmol", "Priyanshu"] },
  153: { branch: "IT B", members: ["MohammedKapadia", "Hemant Salame"] },
  156: { branch: "CS A", members: ["Priyanshu arya", "Chandrashekhar rathore"] },
  157: { branch: "IT B", members: ["Jaywardhan Singh Chauhan", "Kuldeep"] },
  158: { branch: "CS B", members: ["Vikas Jaiswal", "Siddhant Jain"] },
} as const;

// Branch categories for analysis
export const BRANCH_CATEGORIES = {
  "Computer Science": ["CS A", "CS B", "CSBS"],
  "Information Technology": ["IT A", "IT B"],
  "Electronics": ["EI", "ETC A", "ETC B"],
  "Mixed": ["CS A/CS B", "IT A/IT B", "EI/ETC A", "CS A/EI", "CSBS/CS A", "ETC B/IT B", "IT B/CSBS", "CS B/IT B", "CS A/IT A", "IT A/EI", "CS A/IT B", "EI/CS B", "IT A/CS A", "CS A/CS B"]
} as const;

export function getTeamBranch(teamId: string): string {
  const id = parseInt(teamId);
  return TEAM_BRANCHES[id as keyof typeof TEAM_BRANCHES]?.branch || "Unknown";
}

export function getTeamMembers(teamId: string): string[] {
  const id = parseInt(teamId);
  return TEAM_BRANCHES[id as keyof typeof TEAM_BRANCHES]?.members || [];
}

export function getBranchCategory(branch: string): string {
  for (const [category, branches] of Object.entries(BRANCH_CATEGORIES)) {
    if (branches.includes(branch as any)) {
      return category;
    }
  }
  return "Other";
}

export function getAllBranches(): string[] {
  return [...new Set(Object.values(TEAM_BRANCHES).map(team => team.branch))];
}
