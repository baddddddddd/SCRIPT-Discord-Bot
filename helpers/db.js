import { configDotenv } from 'dotenv';
configDotenv()

import { createClient } from '@supabase/supabase-js';
import { toUtcTime } from './utils.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

export async function getAllRows(table) {
  let { data, error } = await supabase
  .from(table)
  .select('*')

  return { data, error }
}

export async function insertData(table, values) {
  const { data, error } = await supabase
    .from(table)
    .insert(values)
    .select()

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    // console.log('Inserted data:', data);
  }

  return { data, error }
}

export async function upsertData(table, values) {
  const { data, error } = await supabase
    .from(table)
    .upsert(values)
    .select()

  if (error) {
    console.error('Error upserting data:', error);
  } else {
    // console.log('Upserted data:', data);
  }

  return { data, error }
}

export async function upsertLeetCodeUsername(leetcodeUsername, discordId) {
  const values = {
    "leetcode_username": leetcodeUsername,
    "discord_id": discordId,
  }

  const table = "leetcode_accounts"

  const { data, error } = await upsertData(table, values);

  return { error }
}

export async function uploadActivity(title, description, startDatetime, endDatetime) {
  const values = {
    "title": title,
    "description": description,
    "start_datetime": toUtcTime(startDatetime).toISOString(),
    "end_datetime": toUtcTime(endDatetime).toISOString(),
  }

  const table = "activities"

  const { data, error } = await insertData(table, values)

  return { data, error }
}

export async function fetchActivities() {
  const table = "activities"
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("start_datetime")

  return { data, error }
}

export async function uploadParticipant(discordId, eventId) {
  const table = "activity_participants"

  const values = {
    "discord_id": discordId,
    "event_id": eventId,
  }
  
  const { data, error } = await insertData(table, values)

  return { data, error }
}

export async function fetchActivity(eventId) {
  let { data, error } = await supabase
    .from("activities")
    .select("*, activity_participants(*), leetcode_accounts(*)")
    .eq("id", eventId)
  
  if (error || data.length == 0) {
    return { data, error }
  }

  const details = data[0]
  const title = details.title
  const description = details.description
  const startDatetime = details.start_datetime
  const endDatetime = details.end_datetime

  let ids = []
  for (const participant of details.activity_participants) {
    const discordId = participant.discord_id
    ids.push(discordId)
  }

  let participants = []
  for (const row of details.leetcode_accounts) {
    const discordId = row.discord_id
    const leetcodeUsername = row.leetcode_username
    participants.push({
      discordId: discordId,
      leetcodeUsername: leetcodeUsername,
    })
  }

  data = {
    title: title,
    description: description,
    startDatetime: startDatetime,
    endDatetime: endDatetime,
    participants: participants,
  }

  return { data, error }
}

export async function uploadChallenge(eventId, challengeId, titleSlug, displayTitle, difficulty, points) {
  const table = "activity_challenges"
  const values = {
    "event_id": eventId,
    "challenge_id": challengeId,
    "title_slug": titleSlug,
    "display_title": displayTitle,
    "difficulty": difficulty,
    "points": points,
  }

  const { data, error } = await insertData(table, values)

  return { data, error }
}

export async function fetchChallenges(eventId) {
  const { data, error } = await supabase
    .from("activity_challenges")
    .select("*")
    .eq("event_id", eventId)

    
  return { data, error }
}

export async function getLeetcodeUsername(discordId) {
  const { data, error } = await supabase
    .from('leetcode_accounts')
    .select('leetcode_username')
    .eq("discord_id", discordId)
    .single()

  return { data, error }
}

export async function uploadActivitySolves(solves) {
  let values = []

  for (const solve of solves) {
    values.push({
      "activity_challenge_id": solve.activityChallengeId,
      "discord_id": solve.discordId,
      "submission_id": solve.submissionId,
      "solved_on": solve.solvedOn.toISOString(),
    })
  }

  const { data, error } = await supabase
    .from("activity_solves")
    .upsert(values, { ignoreDuplicates: true })

  return { data, error }
}

export async function getActivitySolves(eventId, discordId) {
  const { data, error } = await supabase
    .from("activity_solves")
    .select("*, activity_challenges(*)")
    .eq("activity_challenges.event_id", eventId)
    .eq("discord_id", discordId)

  return { data, error }
}