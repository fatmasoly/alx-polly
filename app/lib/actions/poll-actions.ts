"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validatePollInput } from "@/app/lib/validation/poll";
import { ensureSameOrigin, getClientIp, rateLimit } from "@/app/lib/security";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const originCheck = ensureSameOrigin();
  if (!originCheck.ok) return { error: originCheck.error };
  const ip = getClientIp();
  const rl = rateLimit(`createPoll:${ip}`, 10, 60_000);
  if (!rl.ok) return { error: rl.error };

  const question = (formData.get("question") as string) ?? "";
  const rawOptions = (formData.getAll("options") as string[]) || [];
  const options = rawOptions.filter(Boolean);
  const validated = validatePollInput({ question, options });
  if (!validated.success) {
    return { error: validated.error };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: validated.data.question,
      options: validated.data.options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Get the poll data
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  
  // No need to check ownership for viewing a poll - polls are public
  // But we could add visibility settings in the future if needed
  
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();

  const originCheck = ensureSameOrigin();
  if (!originCheck.ok) return { error: originCheck.error };
  const ip = getClientIp();
  const rl = rateLimit(`submitVote:${ip}:${pollId}`, 30, 60_000);
  if (!rl.ok) return { error: rl.error };
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally require login to vote
  // if (!user) return { error: 'You must be logged in to vote.' };
  
  // Basic server-side validation
  if (typeof optionIndex !== "number" || optionIndex < 0 || optionIndex > 100) {
    return { error: "Invalid vote option index" };
  }

  // Simple duplicate vote mitigation per user per poll
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (existingVote) {
      return { error: "You have already voted on this poll." };
    }
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();

  const originCheck = ensureSameOrigin();
  if (!originCheck.ok) return { error: originCheck.error };
  const ip = getClientIp();
  const rl = rateLimit(`deletePoll:${ip}`, 10, 60_000);
  if (!rl.ok) return { error: rl.error };
  
  // Get user from session
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "You must be logged in to delete a poll." };
  }
  
  // Import the isAdmin function
  const { isAdmin } = await import('@/app/lib/security/authorization');
  
  // Check if user is admin
  const adminResult = await isAdmin();
  
  // If user is admin, allow deletion without ownership check
  if (adminResult.ok) {
    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", id);
      
    if (error) return { error: error.message };
    revalidatePath("/polls");
    revalidatePath("/admin");
    return { error: null };
  }
  
  // For regular users, enforce ownership
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
    
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const originCheck = ensureSameOrigin();
  if (!originCheck.ok) return { error: originCheck.error };
  const ip = getClientIp();
  const rl = rateLimit(`updatePoll:${ip}`, 20, 60_000);
  if (!rl.ok) return { error: rl.error };

  const question = (formData.get("question") as string) ?? "";
  const rawOptions = (formData.getAll("options") as string[]) || [];
  const options = rawOptions.filter(Boolean);
  const validated = validatePollInput({ question, options });
  if (!validated.success) {
    return { error: validated.error };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Import the isAdmin function
  const { isAdmin } = await import('@/app/lib/security/authorization');
  
  // Check if user is admin
  const adminResult = await isAdmin();
  
  // If user is admin, allow update without ownership check
  if (adminResult.ok) {
    const { error } = await supabase
      .from("polls")
      .update({
        question: validated.data.question,
        options: validated.data.options,
      })
      .eq("id", pollId);
      
    if (error) return { error: error.message };
    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/polls");
    revalidatePath("/admin");
    return { error: null };
  }
  
  // For regular users, enforce ownership
  const { error } = await supabase
    .from("polls")
    .update({
      question: validated.data.question,
      options: validated.data.options,
    })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/polls/${pollId}`);
  revalidatePath("/polls");
  return { error: null };
}
