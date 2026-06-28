import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Auth client to get user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { image, lesson_id } = await req.json();
    if (!image || !lesson_id) {
      return new Response(JSON.stringify({ error: "Missing image or lesson_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Fetch quiz questions
    const { data: questions, error: qError } = await supabase
      .from("quiz_questions")
      .select("question_text, options, correct_index, explanation")
      .eq("lesson_id", lesson_id)
      .order("order_index");

    if (qError || !questions?.length) {
      return new Response(
        JSON.stringify({ error: "No quiz questions found for this lesson" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Upload image to storage
    const timestamp = Date.now();
    const imagePath = `${userId}/${lesson_id}/${timestamp}.jpg`;

    // Decode base64
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { error: uploadError } = await supabase.storage
      .from("offline-submissions")
      .upload(imagePath, bytes, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage
      .from("offline-submissions")
      .getPublicUrl(imagePath);
    const imageUrl = urlData.publicUrl;

    // Step 4: Build prompt
    const letters = ["A", "B", "C", "D"];
    const mcQuestions = questions.slice(0, 4);
    const shortAnswer = questions[4];

    let promptText = `You are grading a student's handwritten quiz worksheet.
The student has circled their answer to each multiple choice question on a printed sheet.

Here are the 4 multiple choice questions and their correct answers:\n\n`;

    mcQuestions.forEach((q, i) => {
      const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      const correctLetter = letters[q.correct_index];
      promptText += `Q${i + 1}: ${q.question_text}\n`;
      opts.forEach((opt: string, oi: number) => {
        promptText += `${letters[oi]}) ${opt}\n`;
      });
      promptText += `Correct answer: ${correctLetter}\n\n`;
    });

    if (shortAnswer) {
      promptText += `Q5: ${shortAnswer.question_text}
This is an open-ended short answer question. Read what the student wrote and summarize it in 1-2 sentences.\n\n`;
    }

    promptText += `Look at the uploaded image carefully.
For Q1 through Q4: identify which letter the student circled or marked. If you cannot clearly read it, set student_answer to "unclear".
For Q5: read the handwritten response and summarize what the student wrote.
Rate your overall confidence in reading this image as "high", "medium", or "low".

Respond ONLY with valid JSON in this exact format and nothing else:
{
  "confidence": "high",
  "results": [
    {"question_number": 1, "student_answer": "B", "correct_answer": "B", "is_correct": true, "explanation": "..."},
    {"question_number": 2, "student_answer": "A", "correct_answer": "C", "is_correct": false, "explanation": "..."},
    {"question_number": 3, "student_answer": "C", "correct_answer": "B", "is_correct": false, "explanation": "..."},
    {"question_number": 4, "student_answer": "D", "correct_answer": "D", "is_correct": true, "explanation": "..."},
    {"question_number": 5, "student_answer": "open_ended", "correct_answer": "open_ended", "is_correct": true, "short_answer_summary": "..."}
  ],
  "score": 3,
  "total": 5,
  "passed": false
}`;

    // Call Lovable AI with vision
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI grading failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let grading;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      grading = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ error: "Failed to parse grading results" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 5: Check image quality
    const unclearCount = (grading.results || []).filter(
      (r: any) => r.student_answer === "unclear"
    ).length;

    if (grading.confidence === "low" || unclearCount > 2) {
      return new Response(
        JSON.stringify({ success: false, reason: "image_unclear" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure Q5 always gets credit if student wrote something
    if (grading.results?.length >= 5) {
      const q5 = grading.results[4];
      if (q5.question_number === 5 && q5.student_answer === "open_ended") {
        q5.is_correct = true;
      }
    }

    // Recalculate score
    const score = (grading.results || []).filter((r: any) => r.is_correct).length;
    const total = grading.results?.length || 5;
    const passed = score >= 4;
    grading.score = score;
    grading.total = total;
    grading.passed = passed;

    // Step 6: Save to offline_submissions
    await supabase.from("offline_submissions").insert({
      user_id: userId,
      lesson_id,
      image_url: imageUrl,
      score,
      total,
      passed,
      ai_response: grading,
      confidence_level: grading.confidence,
    });

    // Step 7 & 8: If passed, mark complete and award XP
    if (passed) {
      // Check if already completed
      const { data: existing } = await supabase
        .from("lesson_completions")
        .select("id")
        .eq("user_id", userId)
        .eq("lesson_id", lesson_id);

      const alreadyCompleted = existing && existing.length > 0;

      if (!alreadyCompleted) {
        await supabase.from("lesson_completions").insert({
          user_id: userId,
          lesson_id,
          attempts: 1,
          first_attempt_perfect: score === 5,
        });

        // Award XP
        const xpReward = 50;
        await supabase.from("user_xp_log").insert({
          user_id: userId,
          amount: xpReward,
          reason: "Completed lesson via paper submission",
        });
        await supabase.rpc("", {}).catch(() => {}); // fallback
        await supabase
          .from("profiles")
          .update({ xp: undefined }) // we need raw SQL increment
          .eq("id", userId);

        // Use direct update with fetch for increment
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp")
          .eq("id", userId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ xp: profile.xp + xpReward })
            .eq("id", userId);
        }

        if (score === 5) {
          await supabase.from("user_xp_log").insert({
            user_id: userId,
            amount: 25,
            reason: "Perfect score on paper submission",
          });
          if (profile) {
            await supabase
              .from("profiles")
              .update({ xp: profile.xp + xpReward + 25 })
              .eq("id", userId);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        confidence: grading.confidence,
        results: grading.results,
        score,
        total,
        passed,
        image_url: imageUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("grade-paper-submission error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
