import { supabase, isSupabaseConfigured } from './supabase.js';

const DEVICE_KEY = 'elevAIte-device-id';
const USAGE_STORAGE_KEY = 'elevAIte_usage_metrics';
const RESUME_STORAGE_KEY = 'elevAIte_saved_resume_analyses';
const ROADMAPS_STORAGE_KEY = 'elevAIte_saved_roadmaps';

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
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return { userId: session.user.id, deviceId: getDeviceId() };
    }
  } catch {}

  try {
    const stored = localStorage.getItem('elevAIte_session');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.user?.id) {
        return { userId: parsed.user.id, deviceId: getDeviceId() };
      }
    }
  } catch {}

  return {
    userId: null,
    deviceId: getDeviceId(),
  };
}

// ── Usage Metrics ─────────────────────────────────────────────────────────

export async function getUsageMetrics() {
  const local = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '{}');
  const defaults = {
    resume_analyzer_count: local.resume_analyzer_count || 0,
    mock_interview_count: local.mock_interview_count || 0,
    skill_gap_count: local.skill_gap_count || 0,
    internship_count: local.internship_count || 0,
  };

  if (!isSupabaseConfigured) {
    return defaults;
  }

  try {
    const { userId, deviceId } = await getIdentity();
    let query = supabase.from('usage_metrics').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('device_id', deviceId).is('user_id', null);
    }
    const { data } = await query.single();
    if (data) {
      return {
        resume_analyzer_count: Math.max(defaults.resume_analyzer_count, data.resume_analyzer_count || 0),
        mock_interview_count: Math.max(defaults.mock_interview_count, data.mock_interview_count || 0),
        skill_gap_count: Math.max(defaults.skill_gap_count, data.skill_gap_count || 0),
        internship_count: Math.max(defaults.internship_count, data.internship_count || 0),
      };
    }
  } catch {}

  return defaults;
}

export async function bumpUsageMetric(field) {
  try {
    const local = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '{}');
    local[field] = (local[field] || 0) + 1;
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(local));
  } catch {}

  if (!isSupabaseConfigured) return;

  try {
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
  } catch {}
}

// ── Resume Analyses ───────────────────────────────────────────────────────

export async function saveResumeAnalysis(fileName, result, resumeTextHash = '') {
  const hash = resumeTextHash || result?.text_hash || result?.debug_info?.text_hash || '';
  const row = {
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    created_at: new Date().toISOString(),
    file_name: fileName,
    text_hash: hash,
    overall_score: result.overall_score || 85,
    ats_compatibility: result.category_scores?.ats_compatibility ?? 88,
    keyword_match: result.category_scores?.keyword_match ?? 84,
    formatting: result.category_scores?.formatting ?? 90,
    impact_quantification: result.category_scores?.impact_quantification ?? 80,
    experience_level: result.experience_level || 'Mid Level',
    executive_summary: result.executive_summary || '',
    matched_keywords: result.matched_keywords || [],
    missing_keywords: result.missing_keywords || [],
    suggestions: result.suggestions || [],
  };

  // Always save to localStorage first for instant reliability
  // Keyed strictly by hash of the extracted resume text, never by file name
  try {
    const existing = JSON.parse(localStorage.getItem(RESUME_STORAGE_KEY) || '[]');
    const updated = [
      row,
      ...existing.filter(r => (hash && r.text_hash ? r.text_hash !== hash : r.id !== row.id))
    ].slice(0, 20);
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  if (!isSupabaseConfigured) return;

  // Also attempt Supabase sync in background
  try {
    const { userId, deviceId } = await getIdentity();
    const dbRow = {
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
    await supabase.from('resume_analyses').insert(dbRow);
  } catch {}
}

export async function getResumeAnalyses(limit = 10) {
  let localList = [];
  try {
    localList = JSON.parse(localStorage.getItem(RESUME_STORAGE_KEY) || '[]');
  } catch {}

  if (!isSupabaseConfigured) {
    return localList.slice(0, limit);
  }

  try {
    const { userId, deviceId } = await getIdentity();
    let query = supabase.from('resume_analyses').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('device_id', deviceId).is('user_id', null);
    }
    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data && data.length > 0) {
      return data;
    }
  } catch {}

  return localList.slice(0, limit);
}

// ── Saved Roadmaps ────────────────────────────────────────────────────────

export async function getSavedRoadmaps() {
  let localRoadmaps = [];
  try {
    localRoadmaps = JSON.parse(localStorage.getItem(ROADMAPS_STORAGE_KEY) || '[]');
  } catch {}

  if (!isSupabaseConfigured) {
    return localRoadmaps;
  }

  try {
    const { userId, deviceId } = await getIdentity();
    let query = supabase.from('saved_roadmaps').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('device_id', deviceId).is('user_id', null);
    }
    const { data } = await query.order('updated_at', { ascending: false });
    if (data && data.length > 0) return data;
  } catch {}

  return localRoadmaps;
}

export async function saveRoadmap({ title, role, skills, weeks }) {
  const { userId, deviceId } = await getIdentity();
  const id = 'rdm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const row = {
    id,
    device_id: deviceId,
    ...(userId ? { user_id: userId } : {}),
    title,
    role,
    skills,
    weeks,
    progress_pct: 0,
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const localRoadmaps = JSON.parse(localStorage.getItem(ROADMAPS_STORAGE_KEY) || '[]');
    localRoadmaps.unshift(row);
    localStorage.setItem(ROADMAPS_STORAGE_KEY, JSON.stringify(localRoadmaps));
  } catch {}

  if (!isSupabaseConfigured) return row;

  try {
    const { data, error } = await supabase
      .from('saved_roadmaps')
      .insert(row)
      .select()
      .single();
    if (!error && data) return data;
  } catch {}

  return row;
}

export async function updateRoadmap(id, updates) {
  try {
    const localRoadmaps = JSON.parse(localStorage.getItem(ROADMAPS_STORAGE_KEY) || '[]');
    const idx = localRoadmaps.findIndex(r => r.id === id);
    if (idx !== -1) {
      localRoadmaps[idx] = { ...localRoadmaps[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(ROADMAPS_STORAGE_KEY, JSON.stringify(localRoadmaps));
    }
  } catch {}

  if (!isSupabaseConfigured) return;

  try {
    await supabase
      .from('saved_roadmaps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {}
}

export async function deleteRoadmap(id) {
  try {
    const localRoadmaps = JSON.parse(localStorage.getItem(ROADMAPS_STORAGE_KEY) || '[]');
    const filtered = localRoadmaps.filter(r => r.id !== id);
    localStorage.setItem(ROADMAPS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}

  if (!isSupabaseConfigured) return;

  try {
    await supabase
      .from('saved_roadmaps')
      .delete()
      .eq('id', id);
  } catch {}
}
