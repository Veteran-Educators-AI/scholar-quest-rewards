/**
 * Push Daily Quote Edge Function
 *
 * Sends daily inspirational quotes to all students.
 * Designed to be called by a cron job.
 */

import {
  createHandler,
  logRequest,
  createSuccessResponse,
  createServiceClient,
  type MiddlewareContext,
} from "../_shared/index.ts";

/**
 * Quote structure.
 */
interface Quote {
  quote: string;
  author: string;
}

/**
 * Growth mindset quotes for daily notifications.
 */
const DAILY_QUOTES: Quote[] = [
  {
    quote: "Your brain is like a muscle - the more you use it, the stronger it gets!",
    author: "Dr. Carol Dweck",
  },
  {
    quote: "I failed over 1,000 times before creating the light bulb. Each failure taught me something new.",
    author: "Thomas Edison",
  },
  {
    quote: "I wasn't born a good basketball player. I've missed more than 9,000 shots. That is why I succeed.",
    author: "Michael Jordan",
  },
  {
    quote: "I was rejected by 30 publishers before Harry Potter was accepted. Don't fear failure - it's the path to success.",
    author: "J.K. Rowling",
  },
  {
    quote: "The wealthiest people aren't the smartest - they're the most persistent. Consistency beats talent.",
    author: "Success Research",
  },
  {
    quote: "Every expert was once a beginner. The difference? They never stopped practicing.",
    author: "Growth Mindset",
  },
  {
    quote: "When you say 'I can't,' add 'yet.' That one word changes everything!",
    author: "Power of Yet",
  },
  {
    quote: "Rich and successful people aren't born smarter - they just try more times. Keep going!",
    author: "Wealth Research",
  },
  {
    quote: "Struggling means you're growing. Every challenge builds your brain's neural pathways!",
    author: "Neuroscience",
  },
  {
    quote: "I failed my entrance exam twice and was rejected from 30 jobs. I kept applying. Success is getting up again.",
    author: "Jack Ma",
  },
  {
    quote: "Your starting point doesn't determine your ending point. Effort is everything!",
    author: "Mark Zuckerberg",
  },
  {
    quote: "I grew up with nothing, but I studied every day. Your circumstances don't define your future.",
    author: "Howard Schultz",
  },
  {
    quote: "Don't compare your chapter 1 to someone else's chapter 20. Everyone starts somewhere.",
    author: "Growth Mindset Wisdom",
  },
  {
    quote: "Studies show that praising effort helps more than praising smarts. Effort is what you control!",
    author: "Educational Research",
  },
  {
    quote: "Practice hours - not natural talent - best predict who becomes world-class. You've got this!",
    author: "Anders Ericsson",
  },
];

/**
 * Gets today's quote based on day of year.
 */
function getTodaysQuote(): Quote {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

/**
 * Main handler for pushing daily quotes.
 */
async function handlePushDailyQuote(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const supabase = createServiceClient();
  const quote = getTodaysQuote();

  // Get all students
  const { data: students, error: studentsError } = await supabase
    .from("student_profiles")
    .select("user_id");

  if (studentsError) {
    throw studentsError;
  }

  if (!students || students.length === 0) {
    return createSuccessResponse(
      { message: "No students to notify" },
      { cors: ctx.corsHeaders, requestId: ctx.requestId }
    );
  }

  // Create notifications for all students
  const notifications = students.map((student: { user_id: string }) => ({
    user_id: student.user_id,
    type: "inspiration",
    title: "Daily Inspiration",
    message: `"${quote.quote}" - ${quote.author}`,
    icon: "sparkles",
    read: false,
    data: { quote: quote.quote, author: quote.author },
  }));

  const { error: insertError } = await supabase.from("notifications").insert(notifications);

  if (insertError) {
    throw insertError;
  }

  console.log(`Pushed daily quote to ${students.length} students`);

  return createSuccessResponse(
    {
      studentsNotified: students.length,
      quote,
    },
    { cors: ctx.corsHeaders, requestId: ctx.requestId }
  );
}

// Create and export the handler with middleware
// Note: This is typically called by a cron job, so no auth required
Deno.serve(
  createHandler(handlePushDailyQuote, {
    middleware: [logRequest],
  })
);
