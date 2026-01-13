export interface GrowthQuote {
  quote: string;
  author: string;
  context?: string;
}

// Quotes emphasizing effort over innate ability, featuring research and real stories
export const growthMindsetQuotes: GrowthQuote[] = [
  // Research-backed
  {
    quote: "The brain is like a muscle - the more you use it, the stronger it gets. Scientists found that students who believe this improve their grades more than those who think intelligence is fixed.",
    author: "Dr. Carol Dweck",
    context: "Stanford University research on growth mindset"
  },
  {
    quote: "In a study of thousands of students, those who believed effort matters more than talent scored higher on tests - even when they started with lower scores.",
    author: "Mindset Research",
    context: "Studies show effort beliefs predict achievement"
  },
  {
    quote: "Your brain creates new connections every time you practice something hard. This is called neuroplasticity - proof that you can literally grow your intelligence!",
    author: "Neuroscience Research",
    context: "The brain physically changes with effort and practice"
  },
  
  // Success stories - wealth and effort
  {
    quote: "I was not the smartest in my class. I failed many times. But I kept trying, and that made all the difference. Hard work beats talent when talent doesn't work hard.",
    author: "Oprah Winfrey",
    context: "From poverty to billionaire through persistence"
  },
  {
    quote: "I'm not the smartest fellow in the world, but I sure can pick smart colleagues. Success isn't about being the smartest - it's about working hard and learning from others.",
    author: "Warren Buffett",
    context: "One of the world's wealthiest, emphasizes learning over innate genius"
  },
  {
    quote: "My teachers said I was 'too stupid to learn.' I was fired from my first job for not being creative enough. But I never gave up on my ideas.",
    author: "Walt Disney",
    context: "Built an empire through persistence, not natural talent"
  },
  {
    quote: "I failed over 1,000 times before creating the light bulb. Each failure taught me something new. Genius is 1% inspiration and 99% perspiration.",
    author: "Thomas Edison",
    context: "Invented the light bulb through relentless effort"
  },
  {
    quote: "I was rejected by 30 publishers before Harry Potter was accepted. If you want to succeed, double your failure rate. Don't fear failure - it's the path to success.",
    author: "J.K. Rowling",
    context: "From welfare to billionaire author through perseverance"
  },
  {
    quote: "I wasn't born a good basketball player. I've missed more than 9,000 shots, lost almost 300 games, and failed over and over. That is why I succeed.",
    author: "Michael Jordan",
    context: "Cut from high school team, became greatest through practice"
  },
  {
    quote: "I was bullied in school and told I'd never amount to anything. But I kept coding every day. Your starting point doesn't determine your ending point.",
    author: "Mark Zuckerberg",
    context: "Built Facebook through dedicated practice, not natural genius"
  },
  
  // Motivation and effort
  {
    quote: "The only thing standing between you and your goal is the story you keep telling yourself that you can't do it. Change your story, change your life.",
    author: "Jordan Belfort",
    context: "Transformed his life through mindset change"
  },
  {
    quote: "Studies show that praising effort ('You worked so hard!') helps kids more than praising smarts ('You're so smart!'). Effort is what you can control!",
    author: "Educational Research",
    context: "How we praise affects how students learn"
  },
  {
    quote: "Rich people and successful people aren't born smarter - they just try more times. A study found that millionaires failed an average of 7 times before succeeding.",
    author: "Wealth Research",
    context: "Success comes from persistence, not intelligence"
  },
  {
    quote: "I grew up in a small apartment with my mom. We had nothing. But I studied every day, worked every job. Your circumstances don't define your future.",
    author: "Howard Schultz",
    context: "From public housing to Starbucks CEO"
  },
  {
    quote: "I didn't go to a fancy school. I taught myself to code from library books. What matters isn't where you start, but how hard you're willing to work.",
    author: "Self-Made Tech Leaders",
    context: "Many tech billionaires are self-taught"
  },
  {
    quote: "Every expert was once a beginner. Every pro was once an amateur. The difference? They never stopped practicing, even when it was hard.",
    author: "Growth Mindset",
    context: "Mastery comes from effort, not natural ability"
  },
  {
    quote: "Scientists found that when students learn that the brain grows with effort, their motivation and grades improve significantly. You have the power to grow!",
    author: "Brain Research",
    context: "Believing in growth actually creates growth"
  },
  {
    quote: "I was told I had a learning disability. I struggled in school. But I realized that struggling means you're growing. Now I help others see the same truth.",
    author: "Many Successful People",
    context: "Challenges don't predict failure - giving up does"
  },
  {
    quote: "The wealthiest people in the world aren't the smartest - they're the most persistent. Intelligence is overrated; consistency is underrated.",
    author: "Success Studies",
    context: "Research on what actually predicts success"
  },
  {
    quote: "Your brain doesn't care if you 'feel' smart. It only cares if you keep trying. Every struggle is building neural pathways that make you smarter.",
    author: "Neuroscience",
    context: "Struggle literally grows your brain"
  },
  {
    quote: "I failed my entrance exam twice. I was rejected from 30 jobs. But I kept applying, kept learning. Success is falling down 7 times and getting up 8.",
    author: "Jack Ma",
    context: "From rejected teacher to Alibaba founder"
  },
  {
    quote: "Don't compare your chapter 1 to someone else's chapter 20. Everyone struggles in the beginning. The ones who succeed are the ones who don't quit.",
    author: "Growth Mindset Wisdom",
    context: "Everyone starts somewhere"
  },
  {
    quote: "A study of professional musicians found that practice hours - not natural talent - best predicted who became world-class. The secret is 10,000 hours of effort.",
    author: "Anders Ericsson",
    context: "Research on deliberate practice"
  },
  {
    quote: "My family couldn't afford college. I worked three jobs while studying. Today I know: the struggle made me stronger than any easy path ever could.",
    author: "First-Generation Success Stories",
    context: "Hardship builds capability"
  },
  {
    quote: "When you say 'I can't do this,' add the word 'yet.' I can't do this YET. That one word changes everything. It reminds you that growth is coming.",
    author: "Power of Yet",
    context: "Simple mindset shift with huge impact"
  }
];

// Get a consistent quote for the day based on the date
export function getDailyQuote(): GrowthQuote {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % growthMindsetQuotes.length;
  return growthMindsetQuotes[index];
}

// Get a random quote
export function getRandomQuote(): GrowthQuote {
  const index = Math.floor(Math.random() * growthMindsetQuotes.length);
  return growthMindsetQuotes[index];
}
