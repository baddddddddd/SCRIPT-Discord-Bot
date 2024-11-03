import { configDotenv } from 'dotenv';
configDotenv()

import { createClient } from '@supabase/supabase-js';

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
    console.log('Inserted data:', data);
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
    console.log('Upserted data:', data);
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
    "start_datetime": startDatetime,
    "end_datetime": endDatetime,
  }

  const table = "activities"

  const { data, error } = await insertData(table, values)

  return { data, error }
}

export async function fetchActivities() {
  const table = "activities"
  const { data, error } = await getAllRows(table)

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