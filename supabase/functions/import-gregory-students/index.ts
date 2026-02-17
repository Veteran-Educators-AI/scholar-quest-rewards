import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Student data from CSVs
const PERIOD_1_STUDENTS = [
  { first_name: "NANA KWADWO DUAH", last_name: "AMOFA", email: "nanakwadwoduaha@nycstudents.net" },
  { first_name: "Sukanya", last_name: "Brehon", email: "sukanyab5@nycstudents.net" },
  { first_name: "Mikayah", last_name: "Burden", email: "mikayahb@nycstudents.net" },
  { first_name: "Justin", last_name: "Canales Umanzor", email: "justinc1027@nycstudents.net" },
  { first_name: "Joseph", last_name: "Cantillo", email: "josephc867@nycstudents.net" },
  { first_name: "NASIBA", last_name: "CHOUDHURY", email: "nasibac3@nycstudents.net" },
  { first_name: "LYSE", last_name: "GERMAIN", email: "lyseg@nycstudents.net" },
  { first_name: "Sukhdeep", last_name: "Kaur", email: "sukhdeepk6@nycstudents.net" },
  { first_name: "Korful", last_name: "Khan", email: "korfulk@nycstudents.net" },
  { first_name: "Jayden", last_name: "Kissoon", email: "jaydenk49@nycstudents.net" },
  { first_name: "Aalimah", last_name: "Kudbally", email: "aalimahk@nycstudents.net" },
  { first_name: "Caitlin", last_name: "Martinez", email: "caitlinm52@nycstudents.net" },
  { first_name: "Franlis", last_name: "Martinez Lopez", email: "franlism@nycstudents.net" },
  { first_name: "Marilyn", last_name: "Maxi", email: "marilynm42@nycstudents.net" },
  { first_name: "Jose", last_name: "Miranda", email: "josem4303@nycstudents.net" },
  { first_name: "Emilius", last_name: "Narsingh", email: "emillusn@nycstudents.net" },
  { first_name: "Tangilum", last_name: "Nishan", email: "tangllumn@nycstudents.net" },
  { first_name: "Estarlin", last_name: "Peralta Paez", email: "estarlinp3@nycstudents.net" },
  { first_name: "Isaac", last_name: "Perez Perez", email: "isaacp76@nycstudents.net" },
  { first_name: "Habibur", last_name: "Rahman", email: "habiburr11@nycstudents.net" },
  { first_name: "AHANAF", last_name: "RAIYAN", email: "ahanafr4@nycstudents.net" },
  { first_name: "Jonibek", last_name: "Rakhmatov", email: "jonibekrs@nycstudents.net" },
  { first_name: "Cody", last_name: "Ramnarine", email: "codyr21@nycstudents.net" },
  { first_name: "Leonardo", last_name: "Ramrattan", email: "googleclassroom-auto-101083195841910445194@googleclassroom.com" },
  { first_name: "Yashjeet", last_name: "Singh", email: "yashjeets@nycstudents.net" },
  { first_name: "Eldania", last_name: "St Juste", email: "eldanias@nycstudents.net" },
  { first_name: "Yahya", last_name: "Yousof", email: "yahyay2@nycstudents.net" },
];

const PERIOD_5_STUDENTS = [
  { first_name: "Irshan", last_name: "Ahamad", email: "irshana@nycstudents.net" },
  { first_name: "Abdulaziz", last_name: "Alawi", email: "abdulaziza2840@nycstudents.net" },
  { first_name: "Abraham", last_name: "Ali", email: "abrahama80@nycstudents.net" },
  { first_name: "Steve", last_name: "Amon Rea", email: "stevea29@nycstudents.net" },
  { first_name: "Allison", last_name: "Appadu", email: "allisona56@nycstudents.net" },
  { first_name: "Melanic", last_name: "Arbalza", email: "melaniea130@nycstudents.net" },
  { first_name: "JARED", last_name: "BUGA", email: "jaredb62@nycstudents.net" },
  { first_name: "Abdullah", last_name: "Burhan", email: "abdullahb16@nycstudents.net" },
  { first_name: "Pedro", last_name: "Carlevarino", email: "pedroc116@nycstudents.net" },
  { first_name: "ANURIMA", last_name: "CHOWDHURY", email: "anurimac@nycstudents.net" },
  { first_name: "Lucas", last_name: "Frederick", email: "lucasf72@nycstudents.net" },
  { first_name: "Kameela", last_name: "Fuscini", email: "kameelaf2@nycstudents.net" },
  { first_name: "Kimmia", last_name: "Heywood", email: "kimmiah@nycstudents.net" },
  { first_name: "Ahyan", last_name: "Hossain", email: "ahyanh@nycstudents.net" },
  { first_name: "Ibrahim", last_name: "Hossain", email: "ibrahimh60@nycstudents.net" },
  { first_name: "Arbaz", last_name: "Khan", email: "arbazk4@nycstudents.net" },
  { first_name: "Tanzeel", last_name: "Khan", email: "tanzeelk@nycstudents.net" },
  { first_name: "Cristina", last_name: "Lemus-Solis", email: "googleclassroom-auto-100976845203708251657@googleclassroom.com" },
  { first_name: "Alvin", last_name: "Martinez", email: "alvinm55@nycstudents.net" },
  { first_name: "Joshua", last_name: "Martinez", email: "joshuam978@nycstudents.net" },
  { first_name: "Sheyna", last_name: "Martinez", email: "sheynam@nycstudents.net" },
  { first_name: "Cristian", last_name: "Maya", email: "cristianm188@nycstudents.net" },
  { first_name: "William", last_name: "Millares", email: "williamm5312@nycstudents.net" },
  { first_name: "Amelia", last_name: "Mische", email: "amellamisched3@nycstudents.net" },
  { first_name: "Adam", last_name: "Munassar", email: "adamm257@nycstudents.net" },
  { first_name: "Sharada", last_name: "Persaud", email: "sharadap@nycstudents.net" },
  { first_name: "SAMORA", last_name: "PINNOCK", email: "samorap5@nycstudents.net" },
  { first_name: "TAHANA", last_name: "RAHA", email: "tahanar2@nycstudents.net" },
  { first_name: "Kimberly", last_name: "Sanganah", email: "kimberlys5498@nycstudents.net" },
  { first_name: "WALID", last_name: "SHAHID", email: "walids9@nycstudents.net" },
  { first_name: "Rumaysa", last_name: "Siddique", email: "rumaysas5@nycstudents.net" },
  { first_name: "Bhuvana", last_name: "Singh", email: "bhuvanas@nycstudents.net" },
  { first_name: "Alyssa", last_name: "Sookhai", email: "googleclassroom-auto-118433140649312267349@googleclassroom.com" },
  { first_name: "LYSNELI", last_name: "SOSA VARGAS", email: "lysnelis@nycstudents.net" },
];

const PERIOD_6_STUDENTS = [
  { first_name: "Afiya", last_name: "Agard", email: "afiyaa2@nycstudents.net" },
  { first_name: "MEILIN", last_name: "CALIXTO", email: "mellinc@nycstudents.net" },
  { first_name: "Josue", last_name: "Cifuentes Signor", email: "googleclassroom-auto-108623102871392483734@googleclassroom.com" },
  { first_name: "Angkan", last_name: "Debnath", email: "angkand2789@nycstudents.net" },
  { first_name: "Cedric", last_name: "Dennis", email: "cedricd10@nycstudents.net" },
  { first_name: "Munasser", last_name: "Dinesh", email: "munasserd@nycstudents.net" },
  { first_name: "Sofia Izabelle", last_name: "Garcia", email: "sofiaizabelleg@nycstudents.net" },
  { first_name: "Carmen", last_name: "Garcia Tzic", email: "carmeng46@nycstudents.net" },
  { first_name: "Sarah", last_name: "Graham", email: "sarahg155@nycstudents.net" },
  { first_name: "Meroly", last_name: "Gutierrez", email: "googleclassroom-auto-104858930413967703667@googleclassroom.com" },
  { first_name: "Jayla", last_name: "Hunnighan Cooke", email: "jaylah22@nycstudents.net" },
  { first_name: "Favour", last_name: "Iduseri", email: "favour2@nycstudents.net" },
  { first_name: "Allina", last_name: "Islam", email: "googleclassroom-auto-100360144346102135152@googleclassroom.com" },
  { first_name: "Nathan", last_name: "Jagnandan", email: "nathanj2801@nycstudents.net" },
  { first_name: "Jaylene", last_name: "Jean Baptiste", email: "jaylenej 10@nycstudents.net" },
  { first_name: "Grace", last_name: "Linton", email: "gracel96@nycstudents.net" },
  { first_name: "Michael", last_name: "Lopez III", email: "googleclassroom-auto-113406444257108653490@googleclassroom.com" },
  { first_name: "Karla", last_name: "Maldonado", email: "karlam97@nycstudents.net" },
  { first_name: "David Jose", last_name: "Menchu Xuruc", email: "davidjosem@nycstudents.net" },
  { first_name: "Hamzah", last_name: "Mohamed", email: "hamzahm14@nycstudents.net" },
  { first_name: "PRINCE", last_name: "MOORER", email: "googleclassroom-auto-118358566590273682622@googleclassroom.com" },
  { first_name: "Maryam", last_name: "Munassar", email: "maryamm24@nycstudents.net" },
  { first_name: "Abdool", last_name: "Nazir", email: "googleclassroom-auto-115424535201700499409@googleclassroom.com" },
  { first_name: "Barack", last_name: "Ogle", email: "baracko2@nycstudents.net" },
  { first_name: "Ada", last_name: "Payan", email: "adap2@nycstudents.net" },
  { first_name: "Zariah", last_name: "Powell", email: "googleclassroom-auto-110244084922828475502@googleclassroom.com" },
  { first_name: "Mashrafee", last_name: "Sanjid", email: "mashrafees@nycstudents.net" },
  { first_name: "Jasraj", last_name: "Singh", email: "jasrajs5@nycstudents.net" },
  { first_name: "Jaden", last_name: "Smith", email: "jadens9673@nycstudents.net" },
  { first_name: "STANLEY", last_name: "TOTOYA", email: "googleclassroom-auto-105766806032371852637@googleclassroom.com" },
  { first_name: "Jaylyn", last_name: "Velasquez", email: "jaylynv5@nycstudents.net" },
  { first_name: "Sanya", last_name: "Walker", email: "sanyaw3@nycstudents.net" },
  { first_name: "Kahir", last_name: "Wynn", email: "kahirw@nycstudents.net" },
  { first_name: "Aslin", last_name: "Zelaya", email: "aslina@nycstudents.net" },
];

const PERIOD_13_STUDENTS = [
  { first_name: "Santos Edmilson", last_name: "Aguilar Lopez", email: "santosedmilsona@nycstudents.net" },
  { first_name: "Haroun", last_name: "Ahmed", email: "harouna2@nycstudents.net" },
  { first_name: "Omar", last_name: "Ali", email: "omara225@nycstudents.net" },
  { first_name: "Sadiya", last_name: "Ali", email: "sadiyaa3@nycstudents.net" },
  { first_name: "Amira", last_name: "Bhagwandin", email: "amirab15@nycstudents.net" },
  { first_name: "SHARON", last_name: "CRUZ VILLALOBOS", email: "sharonc2801@nycstudents.net" },
  { first_name: "Rajshree", last_name: "Hariram", email: "rajshreeh@nycstudents.net" },
  { first_name: "Shamkaram", last_name: "Jagroom", email: "shamkaramj@nycstudents.net" },
  { first_name: "Rubaia", last_name: "Khan", email: "rubaiak@nycstudents.net" },
  { first_name: "Yaqeen", last_name: "Kinoshi", email: "yaqeenk@nycstudents.net" },
  { first_name: "Kayla", last_name: "Mundell", email: "kaylam437@nycstudents.net" },
  { first_name: "Sadika", last_name: "Rahman", email: "sadikar4@nycstudents.net" },
  { first_name: "Rachel", last_name: "Rambaran", email: "rachelr2802@nycstudents.net" },
  { first_name: "Richard", last_name: "Ramos-Lebron", email: "richardr244@nycstudents.net" },
  { first_name: "Arjenis", last_name: "Rosario", email: "arjenisr2@nycstudents.net" },
  { first_name: "Devi", last_name: "Sulaiman", email: "devis4@nycstudents.net" },
  { first_name: "Shoniyah", last_name: "Thomas", email: "shoniyaht@nycstudents.net" },
  { first_name: "Jennifer", last_name: "Tzaj Xocol", email: "jennifert170@nycstudents.net" },
  { first_name: "Teneigh", last_name: "Williamson", email: "teneighw@nycstudents.net" },
  { first_name: "Abundio", last_name: "Xelo", email: "abundiox@nycstudents.net" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting import...");

    // Create classes
    const classes = [
      { name: "Period 1 Financial Math", subject: "Financial Math" },
      { name: "Period 5 Geometry", subject: "Geometry" },
      { name: "Period 6 Financial Math", subject: "Financial Math" },
      { name: "Period 13 Financial Math", subject: "Financial Math" },
    ];

    const classIds: Record<number, string> = {};
    
    console.log("📚 Creating classes...");
    for (const cls of classes) {
      const { data, error } = await supabase
        .from("classes")
        .insert(cls)
        .select()
        .single();
      
      if (error) {
        console.error(`Failed to create ${cls.name}:`, error);
        throw error;
      }
      
      // Extract period number
      const period = parseInt(cls.name.split(" ")[1]);
      classIds[period] = data.id;
      console.log(`✅ Created ${cls.name} (${data.id})`);
    }

    // Import students
    const imports = [
      { period: 1, students: PERIOD_1_STUDENTS },
      { period: 5, students: PERIOD_5_STUDENTS },
      { period: 6, students: PERIOD_6_STUDENTS },
      { period: 13, students: PERIOD_13_STUDENTS },
    ];

    let totalImported = 0;
    
    console.log("\n👥 Importing students...");
    for (const { period, students } of imports) {
      const classId = classIds[period];
      const studentsWithClass = students.map(s => ({
        ...s,
        class_id: classId,
      }));
      
      const { data, error } = await supabase
        .from("students")
        .insert(studentsWithClass)
        .select();
      
      if (error) {
        console.error(`Failed to import Period ${period}:`, error);
        throw error;
      }
      
      totalImported += data.length;
      console.log(`✅ Imported ${data.length} students to Period ${period}`);
    }

    console.log(`\n🎉 Import complete! ${totalImported} students imported across 4 classes.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${totalImported} students`,
        classes: classIds,
        breakdown: {
          period_1: PERIOD_1_STUDENTS.length,
          period_5: PERIOD_5_STUDENTS.length,
          period_6: PERIOD_6_STUDENTS.length,
          period_13: PERIOD_13_STUDENTS.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
