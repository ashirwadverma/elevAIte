import { supabase } from './supabase.js';

const DEVICE_KEY = 'elevAIte-device-id';

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// Returns { userId, deviceId } — userId is set when logged in
async function getIdentity() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    userId: session?.user?.id ?? null,
    deviceId: getDeviceId(),
  };
}

// ── Usage Metrics ─────────────────────────────────────────────────────────

export async function getUsageMetrics() {
  const { userId, deviceId } = await getIdentity();
  let query = supabase.from('usage_metrics').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('device_id', deviceId).is('user_id', null);
  }
  const { data, error } = await query.single();
  if (error && error.code !== 'PGRST116') console.error('[db] getUsageMetrics', error);
  return data || { resume_analyzer_count: 0, mock_interview_count: 0, skill_gap_count: 0, internship_count: 0 };
}

export async function bumpUsageMetric(field) {
  const { userId, deviceId } = await getIdentity();
  let query = supabase.from('usage_metrics').select('id, ' + field);
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('device_id', deviceId).is('user_id', null);
  }
  const { data: existing } = await query.single();

  const row = userId
    ? { user_id: userId, device_id: deviceId }
    : { device_id: deviceId };

  if (existing) {
    await supabase
      .from('usage_metrics')
      .update({ [field]: (existing[field] || 0) + 1, last_active_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('usage_metrics')
      .insert({ ...row, [field]: 1, last_active_at: new Date().toISOString() });
  }
}

// ── Resume Analyses ───────────────────────────────────────────────────────

export async function saveResumeAnalysis(fileName, result) {
  const { userId, deviceId } = await getIdentity();
  const row = {
    device_id: deviceId,
    ...(userId ? { user_id: userId } : {}),
    file_name: fileName,
    overall_score: result.overall_score,
    ats_compatibility: result.category_scores?.ats_compatibility,
    keyword_match: result.category_scores?.keyword_match,
    formatting: result.category_scores?.formatting,
    impact_quantification: result.category_scores?.impact_quantification,
    experience_level: result.experience_level,
    executive_summary: result.executive_summary,
    matched_keywords: result.matched_keywords || [],
    missing_keywords: result.missing_keywords || [],
    suggestions: result.suggestions || [],
  };
  const { error } = await supabase.from('resume_analyses').insert(row);
  if (error) console.error('[db] saveResumeAnalysis', error);
}

export async function getResumeAnalyses(limit = 10) {
  const { userId, deviceId } = await getIdentity();
  let query = supabase.from('resume_analyses').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('device_id', deviceId).is('user_id', null);
  }
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) console.error('[db] getResumeAnalyses', error);
  return data || [];
}

// ── Saved Roadmaps ────────────────────────────────────────────────────────

export async function getSavedRoadmaps() {
  const { userId, deviceId } = await getIdentity();
  let query = supabase.from('saved_roadmaps').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('device_id', deviceId).is('user_id', null);
  }
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) console.error('[db] getSavedRoadmaps', error);
  return data || [];
}

export async function saveRoadmap({ title, role, skills, weeks }) {
  const { userId, deviceId } = await getIdentity();
  const row = {
    device_id: deviceId,
    ...(userId ? { user_id: userId } : {}),
    title,
    role,
    skills,
    weeks,
    progress_pct: 0,
    notes: '',
  };
  const { data, error } = await supabase
    .from('saved_roadmaps')
    .insert(row)
    .select()
    .single();
  if (error) console.error('[db] saveRoadmap', error);
  return data;
}

export async function updateRoadmap(id, updates) {
  const { error } = await supabase
    .from('saved_roadmaps')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('[db] updateRoadmap', error);
}

export async function deleteRoadmap(id) {
  const { error } = await supabase
    .from('saved_roadmaps')
    .delete()
    .eq('id', id);
  if (error) console.error('[db] deleteRoadmap', error);
}
