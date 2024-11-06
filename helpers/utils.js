import { getAllRows, upsertData } from "./db.js";


const LEETCODE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'content-type': 'application/json',
  'Origin': 'https://leetcode.com',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-GPC': '1',
  'TE': 'trailers'
}

export const isValidUrl = (string) => {
  try {
      new URL(string);
      return true;
  } catch (error) {
      return false;
  }
};


export const getUsernameFromUrl = (url) => {
  const urlObject = new URL(url);
  
  if (urlObject.hostname !== 'leetcode.com') {
    throw new Error('Invalid domain: That is not a LeetCode link >:(');
  }

  const parts = urlObject.pathname.split('/');

  const usernameIndex = parts.indexOf('u') + 1; 
  if (usernameIndex < 1 || usernameIndex >= parts.length) {
    throw new Error('Username not found in the URL.');
  }

  return parts[usernameIndex]; 
};


export const getUserPublicProfile = async (username) => {
  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: LEETCODE_HEADERS,
    body: JSON.stringify({
      'query': '\n    query userPublicProfile($username: String!) {\n  matchedUser(username: $username) {\n    contestBadge {\n      name\n      expired\n      hoverText\n      icon\n    }\n    username\n    githubUrl\n    twitterUrl\n    linkedinUrl\n    profile {\n      ranking\n      userAvatar\n      realName\n      aboutMe\n      school\n      websites\n      countryName\n      company\n      jobTitle\n      skillTags\n      postViewCount\n      postViewCountDiff\n      reputation\n      reputationDiff\n      solutionCount\n      solutionCountDiff\n      categoryDiscussCount\n      categoryDiscussCountDiff\n    }\n  }\n}\n    ',
      'variables': {
        'username': username
      },
      'operationName': 'userPublicProfile'
    })
  });

  return response
};

export async function getStats(username) {
  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: LEETCODE_HEADERS,
    body: JSON.stringify({
      'query': '\n    query userSessionProgress($username: String!) {\n  allQuestionsCount {\n    difficulty\n    count\n  }\n  matchedUser(username: $username) {\n    submitStats {\n      acSubmissionNum {\n        difficulty\n        count\n        submissions\n      }\n      totalSubmissionNum {\n        difficulty\n        count\n        submissions\n      }\n    }\n  }\n}\n    ',
      'variables': {
        'username': username
      },
      'operationName': 'userSessionProgress'
    })
  });

  return response;
}

export async function getTotalSolves(username) {
  const response = await getStats(username);
  const json = await response.json();
  let solves = 0;
  let errors = null;


  if (json.errors) {
    errors = json.errors
    return { solves, errors }
  }

  const stats = json.data.matchedUser.submitStats
  solves = stats.acSubmissionNum[0].count

  return { solves, errors }
}

export async function getAllUsernames() {
  const { data, error } = await getAllRows("leetcode_accounts");
  let usernames = {};

  if (error) {
    return { usernames, error }
  }

  for (const row of data) {
    const discordId = row.discord_id
    const username = row.leetcode_username

    usernames[discordId] = username
  }

  return { usernames, error }
}

export async function getLeaderboard() {
  const { usernames, error } = await getAllUsernames()

  if (error) {
    console.error(error)
    return { error }
  }

  let data = []
  for (const [discordId, username] of Object.entries(usernames)) {
    const { solves, errors } = await getTotalSolves(username)

    if (errors) {
      return { data, errors }
    }

    data.push({
      discordId: discordId,
      username: username,
      solves: solves,
    })
  }

  return { data, error }
}

export async function updateLeaderboard() {
  let { data, error } = await getLeaderboard()

  let rows = []

  for (const row of data) {
    rows.push({
      "discord_id": row.discordId,
      "total_solves": row.solves,
    })
  }

  const table = "leetcode_stats"

  await upsertData(table, rows);

  return { error }
}

export async function fetchLeaderboard() {
  const table = "leetcode_stats"

  const { data, error } = await getAllRows(table)

  let leaderboard = []
  for (const row of data) {
    leaderboard.push({
      discordId: row.discord_id,
      solves: row.total_solves,
    })
  }

  leaderboard = leaderboard.sort((a, b) => b.solves - a.solves)
  return leaderboard
}

export function isValidDateTime(input) {
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
  return regex.test(input);
}

export function formatDateString(dateString) {
  const date = new Date(dateString);
  
  const options = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true, 
      timeZone: 'Asia/Manila'
  };

  const formattedDate = date.toLocaleString('en-US', options)
  return formattedDate;
}

export function formatLongDateString(dateString) {
  const date = new Date(dateString);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: 'Asia/Manila'
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(date);

  return formattedDate
}

export function extractTitleSlug(url) {
  if (!isValidUrl(url)) {
    return null
  }

  const parsedUrl = new URL(url);

  if (parsedUrl.hostname !== 'leetcode.com') {
    throw new Error("URL is not from leetcode.com");
  }

  const pathSegments = parsedUrl.pathname.split('/');

  if (pathSegments[1] === 'problems') {
    return pathSegments[2];
  } else {
    return null;
  }
}

export async function fetchChallengeDetails(titleSlug) {
  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: LEETCODE_HEADERS,
    body: JSON.stringify({
      'query': '\n    query questionTitle($titleSlug: String!) {\n  question(titleSlug: $titleSlug) {\n    questionId\n    questionFrontendId\n    title\n    titleSlug\n    isPaidOnly\n    difficulty\n    likes\n    dislikes\n    categoryTitle\n  }\n}\n    ',
      'variables': {
        'titleSlug': titleSlug
      },
      'operationName': 'questionTitle'
    })
  });

  const json = await response.json()
  const details = json.data.question
  
  return details
}

export function toLocalTime(dateString) {
  const originalDate = new Date(dateString + ' GMT+0800'); 

  const targetTimezone = 'UTC'; 

  const targetDate = new Date(originalDate.toLocaleString('en-US', { timeZone: targetTimezone }));

  return targetDate
}

export function toUtcTime(dateString) {
  const date = new Date(dateString + " +08:00")
  return date;
}

export function getCurrentTime() {
  const now = new Date()

  const offsetInMs = 8 * 60 * 60 * 1000

  const datePH = new Date(now.getTime() + offsetInMs)

  console.log(datePH)
  return datePH
}