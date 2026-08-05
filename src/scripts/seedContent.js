/*
 * One-time content lift: reads the real copy that used to be hardcoded across
 * the 13 static HTML pages and creates matching Page / Blog / Event /
 * Speaker / Testimony / Faq documents, so the CMS and admin dashboard open
 * on day one already showing real, editable content instead of an empty
 * shell. Safe to re-run — every upsert is keyed on a unique field (slug /
 * title+startDate / email) so re-running just leaves existing docs alone.
 *
 * Usage: node src/scripts/seedContent.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Page = require("../models/Page");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const Speaker = require("../models/Speaker");
const Testimony = require("../models/Testimony");
const Faq = require("../models/Faq");

async function upsertPage(doc) {
  const existing = await Page.findOne({ slug: doc.slug });
  if (existing) {
    console.log(`  Page "${doc.slug}" already exists — skipping`);
    return;
  }
  await Page.create(doc);
  console.log(`  Created page "${doc.slug}"`);
}

async function upsertBlog(doc) {
  const existing = await Blog.findOne({ slug: doc.slug });
  if (existing) {
    console.log(`  Blog post "${doc.slug}" already exists — skipping`);
    return;
  }
  await Blog.create(doc);
  console.log(`  Created blog post "${doc.slug}"`);
}

async function upsertEvent(doc) {
  const existing = await Event.findOne({ slug: doc.slug });
  if (existing) {
    console.log(`  Event "${doc.slug}" already exists — skipping`);
    return;
  }
  await Event.create(doc);
  console.log(`  Created event "${doc.slug}"`);
}

async function upsertSpeaker(doc) {
  const existing = await Speaker.findOne({ name: doc.name, type: doc.type });
  if (existing) {
    console.log(`  Speaker "${doc.name}" (${doc.type}) already exists — skipping`);
    return;
  }
  await Speaker.create(doc);
  console.log(`  Created speaker "${doc.name}" (${doc.type})`);
}

async function upsertTestimony(doc) {
  const existing = await Testimony.findOne({ title: doc.title });
  if (existing) {
    console.log(`  Testimony "${doc.title}" already exists — skipping`);
    return;
  }
  await Testimony.create(doc);
  console.log(`  Created testimony "${doc.title}"`);
}

async function upsertFaq(doc) {
  const existing = await Faq.findOne({ question: doc.question, context: doc.context });
  if (existing) {
    console.log(`  FAQ "${doc.question}" already exists — skipping`);
    return;
  }
  await Faq.create(doc);
  console.log(`  Created FAQ "${doc.question}"`);
}

async function seed() {
  await connectDB();

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("No admin account found — run `node src/scripts/seedAdmin.js` first.");
    process.exit(1);
  }

  console.log("Seeding pages...");
  await upsertPage({
    slug: "home",
    title: "Home | Global Grace Activation",
    heroTitle: "Home",
    heroSubtitle:
      "Global Grace Activation is a worldwide movement raised to ignite revival, release destiny, and transform lives through the power of God — one encounter, spreading across nations.",
    content: "",
    seoTitle: "Home | Global Grace Activation",
    seoDescription:
      "Global Grace Activation — a worldwide movement raised to ignite revival, release destiny, and transform lives through the power of God.",
    isPublished: true,
  });

  await upsertPage({
    slug: "about",
    title: "About | Global Grace Activation",
    heroTitle: "A decade of grace, carried across nations.",
    heroSubtitle:
      "Global Grace Activation began as a single night of worship and has grown into a movement reaching over 25 nations — raising a generation that seeks God, walks in purpose, and influences the world.",
    content: `
<section class="section-pad">
  <div class="container two-col">
    <div class="reveal">
      <span class="eyebrow">Vision</span>
      <h2 style="font-size:2.2rem; margin-top:16px;">A generation fully alive in God, activated for global impact.</h2>
      <p style="color:var(--mist); margin-top:18px; font-size:16px;">We see a world where grace is understood not as a doctrine but as a daily reality — where believers everywhere are equipped to walk in their God-given destiny and carry transformation into their spheres of influence: family, business, government, media and the arts.</p>
    </div>
    <div class="img-frame reveal"><img src="/images/worship-crowd-1.jpg" alt="Worshippers at a Global Grace Activation gathering" loading="lazy"></div>
  </div>
</section>

<section class="section-pad-sm" style="background:var(--paper-2);">
  <div class="container two-col">
    <div class="img-frame reveal" style="order:2;"><img src="/images/mission-photo.jpg" alt="Global Grace Activation mission at work" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"></div>
    <div class="reveal" style="order:1;">
      <span class="eyebrow">Mission</span>
      <h2 style="font-size:2.2rem; margin-top:16px;">Ignite revival. Release destiny. Transform lives.</h2>
      <p style="color:var(--mist); margin-top:18px; font-size:16px;">Every gathering, broadcast and outreach exists to bring people into a real encounter with God — through worship, the Word, prayer and community — and to send them out equipped to live out that encounter long after the lights go down.</p>
      <ul style="margin-top:24px; color:var(--mist); font-size:15px; display:flex; flex-direction:column; gap:12px;">
        <li>&#10003; Host an annual global gathering open to every nation</li>
        <li>&#10003; Stream every encounter free, to anywhere with a connection</li>
        <li>&#10003; Equip local churches with resources between gatherings</li>
        <li>&#10003; Fund missions &amp; community projects through giving partners</li>
      </ul>
    </div>
  </div>
</section>

<section class="section-pad">
  <div class="container">
    <div class="center-head reveal">
      <span class="eyebrow">History</span>
      <h2>How the move began</h2>
      <p>From one room of worshippers to a global broadcast reaching a thousand cities.</p>
    </div>
    <ul class="impact-list reveal-stagger" style="max-width:760px; margin:0 auto;">
      <li><span class="yr">2016</span><div><strong>The first gathering.</strong><p style="color:var(--mist); margin-top:6px;">A single night of worship in a rented hall in Lagos with fewer than 200 people in the room.</p></div></li>
      <li><span class="yr">2019</span><div><strong>Going national.</strong><p style="color:var(--mist); margin-top:6px;">GGA moved to Solution Arena and began partnering with churches across Nigeria.</p></div></li>
      <li><span class="yr">2021</span><div><strong>First global broadcast.</strong><p style="color:var(--mist); margin-top:6px;">The gathering streamed live for the first time, reaching viewers in 12 nations overnight.</p></div></li>
      <li><span class="yr">2024</span><div><strong>500,000 lives.</strong><p style="color:var(--mist); margin-top:6px;">Combined in-person and online attendance crossed half a million across a single weekend.</p></div></li>
      <li><span class="yr">2026</span><div><strong>25 nations and counting.</strong><p style="color:var(--mist); margin-top:6px;">GGA 2026 prepares to gather its largest crowd yet, with volunteer hubs in 25 nations.</p></div></li>
    </ul>
  </div>
</section>

<section class="section-pad-sm" style="background:var(--paper-2);">
  <div class="container two-col">
    <div class="reveal">
      <span class="eyebrow">Founder</span>
      <h2 style="font-size:2.1rem; margin-top:16px;">Pastor Daniel Obi</h2>
      <p style="color:var(--mist); margin-top:16px; font-size:16px;">Pastor Daniel Obi convened the first Global Grace Activation gathering in 2016 out of a conviction that a generation was waiting for a genuine encounter with God, not another program. He continues to lead the movement's vision and ministers at every annual gathering, alongside pastoring a local congregation in Lagos.</p>
    </div>
    <div class="leader-card reveal" style="text-align:left;">
      <div class="avatar" style="margin:0 0 18px; border-radius:20px; width:100%; height:280px; overflow:hidden;">
        <img src="/images/pastor-portrait.jpg" alt="Portrait of Pastor Daniel Obi" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
      </div>
    </div>
  </div>
</section>

<section class="section-pad">
  <div class="container">
    <div class="panel-dark reveal">
      <span class="eyebrow">Statement of faith</span>
      <h2 style="font-size:2rem; margin-top:18px;">What we believe</h2>
      <div class="grid-2" style="margin-top:30px; color:var(--text); font-size:15px;">
        <div>
          <p style="margin-bottom:18px;"><strong style="color:var(--ink);">The Scriptures.</strong> We believe the Bible is the inspired, authoritative Word of God.</p>
          <p style="margin-bottom:18px;"><strong style="color:var(--ink);">One God.</strong> We believe in one God, eternally existing as Father, Son and Holy Spirit.</p>
          <p><strong style="color:var(--ink);">Salvation.</strong> We believe salvation is a gift of grace received through faith in Jesus Christ.</p>
        </div>
        <div>
          <p style="margin-bottom:18px;"><strong style="color:var(--ink);">The Holy Spirit.</strong> We believe in the present-day work and gifts of the Holy Spirit.</p>
          <p style="margin-bottom:18px;"><strong style="color:var(--ink);">The Church.</strong> We believe the Church is God's family, called to worship, community and mission.</p>
          <p><strong style="color:var(--ink);">Eternity.</strong> We believe in the bodily resurrection and the eternal reign of Christ.</p>
        </div>
      </div>
    </div>
  </div>
</section>
`.trim(),
    seoTitle: "About | Global Grace Activation",
    seoDescription:
      "The vision, mission, history and leadership behind Global Grace Activation — a worldwide movement raised to ignite revival and activate destiny.",
    isPublished: true,
  });

  await upsertPage({
    slug: "events",
    title: "Events | Global Grace Activation",
    heroTitle: "Every date the fire is lit.",
    heroSubtitle:
      "From the annual global conference to regional activations — find an encounter near you, or join from wherever you are.",
    content: "",
    seoTitle: "Events | Global Grace Activation",
    seoDescription:
      "Register for the GGA Global Conference 2026 and regional activations worldwide, or view the full event calendar and past gatherings.",
    isPublished: true,
  });

  await upsertPage({
    slug: "give",
    title: "Give | Global Grace Activation",
    heroTitle: "Your giving fuels this move of God.",
    heroSubtitle:
      "Every offering, partnership and seed helps transform more lives — funding broadcasts, missions and the next Global Grace Activation gathering.",
    content: "",
    seoTitle: "Give | Global Grace Activation",
    seoDescription:
      "Give securely to Global Grace Activation via Paystack or Flutterwave — one-time or monthly, toward offerings, missions, and the annual conference.",
    isPublished: true,
  });

  await upsertPage({
    slug: "contact",
    title: "Contact | Global Grace Activation",
    heroTitle: "We'd love to hear from you.",
    heroSubtitle: "Questions about an event, partnership, media request or volunteering — reach the GGA team below.",
    content: "",
    seoTitle: "Contact | Global Grace Activation",
    seoDescription:
      "Get in touch with the Global Grace Activation team — general enquiries, partnerships, media requests, and volunteering.",
    isPublished: true,
  });

  await upsertPage({
    slug: "faqs",
    title: "FAQs | Global Grace Activation",
    heroTitle: "Frequently asked questions.",
    heroSubtitle: "Answers to the questions we hear most from first-time guests and partners.",
    content: "",
    seoTitle: "FAQs | Global Grace Activation",
    seoDescription:
      "Frequently asked questions about Global Grace Activation events, registration, giving, volunteering and more.",
    isPublished: true,
  });

  await upsertPage({
    slug: "prayer",
    title: "Prayer Request | Global Grace Activation",
    heroTitle: "Submit a prayer request.",
    heroSubtitle: "Our prayer team stands in agreement with every request received — you're never alone in this.",
    content: "",
    seoTitle: "Prayer Request | Global Grace Activation",
    seoDescription:
      "Submit a prayer request to the Global Grace Activation prayer team — confidential, with an anonymous option.",
    isPublished: true,
  });

  await upsertPage({
    slug: "volunteer",
    title: "Volunteer | Global Grace Activation",
    heroTitle: "Be part of the move.",
    heroSubtitle: "From ushering to media, prayer to logistics — GGA runs on volunteers who give their time to serve nations.",
    content: "",
    seoTitle: "Volunteer | Global Grace Activation",
    seoDescription:
      "Apply to volunteer at Global Grace Activation — ushering, media, prayer ministry, logistics and hospitality teams.",
    isPublished: true,
  });

  await upsertPage({
    slug: "watch-live",
    title: "Watch Live | Global Grace Activation",
    heroTitle: "Join thousands worldwide.",
    heroSubtitle: "Every GGA gathering streams free, everywhere. Set a reminder, and come back here the moment we go live.",
    content: "",
    seoTitle: "Watch Live | Global Grace Activation",
    seoDescription:
      "Watch Global Grace Activation live, join the live chat, submit a prayer request, and give online — all in one place.",
    isPublished: true,
  });

  await upsertPage({
    slug: "gallery",
    title: "Gallery | Global Grace Activation",
    heroTitle: "Moments from the move.",
    heroSubtitle: "Photos and videos from past gatherings — worship, altar calls, volunteers and the nations that showed up.",
    content: "",
    seoTitle: "Gallery | Global Grace Activation",
    seoDescription: "Photos, videos and highlight reels from Global Grace Activation gatherings around the world.",
    isPublished: true,
  });

  await upsertPage({
    slug: "testimonies",
    title: "Testimonies | Global Grace Activation",
    heroTitle: "God is still changing lives.",
    heroSubtitle: "Browse testimonies from across the world, or share your own story of what God has done.",
    content: "",
    seoTitle: "Testimonies | Global Grace Activation",
    seoDescription:
      "Browse healing, deliverance, salvation and breakthrough testimonies from Global Grace Activation, or submit your own.",
    isPublished: true,
  });

  await upsertPage({
    slug: "blog",
    title: "Blog | Global Grace Activation",
    heroTitle: "Messages, devotionals & news.",
    heroSubtitle: "Teaching notes, devotionals, testimonies and updates from the Global Grace Activation movement.",
    content: "",
    seoTitle: "Blog | Global Grace Activation",
    seoDescription: "Messages, devotionals, testimonies and news from the Global Grace Activation movement.",
    isPublished: true,
  });

  console.log("Seeding blog posts...");
  const blogPosts = [
    { title: "Walking in Grace, Not Performance", category: "Devotional", excerpt: "Why the GGA movement is built on grace-empowered living rather than religious striving, and what that looks like daily.", content: "<p>The GGA movement is built on grace-empowered living rather than religious striving. This devotional explores what that looks like in daily life — resting in what Christ has already done rather than laboring to earn God's approval.</p>" },
    { title: "Activating Your God-Given Destiny", category: "Message", excerpt: "Notes from the recent altar-call series on purpose, identity, and stepping into what God has called you to.", content: "<p>Notes from the recent altar-call series on purpose, identity, and stepping into what God has called you to.</p>" },
    { title: "GGA 2026 Venue & Travel Guide", category: "News", excerpt: "Everything international guests need to know ahead of Solution Arena, Lagos this December.", content: "<p>Everything international guests need to know ahead of Solution Arena, Lagos this December — travel, accommodation, and what to expect on arrival.</p>" },
    { title: "The Night Everything Changed", category: "Testimony", excerpt: "A written testimony from a first-time attendee whose family was restored after GGA 2025.", content: "<p>A written testimony from a first-time attendee whose family was restored after GGA 2025.</p>" },
    { title: "Grace for the Ordinary Days", category: "Devotional", excerpt: "A short devotional series on finding God's grace outside of the big moments.", content: "<p>A short devotional series on finding God's grace outside of the big moments — in the ordinary, unremarkable days between encounters.</p>" },
    { title: "Behind the Scenes: Building the Stage", category: "Events", excerpt: "A look at how the GGA production team prepares Solution Arena for two nights of worship.", content: "<p>A look at how the GGA production team prepares Solution Arena for two nights of worship.</p>" },
    { title: "The Sound of a Generation", category: "Message", excerpt: "Reflections on why worship carries the message just as much as preaching does.", content: "<p>Reflections on why worship carries the message just as much as preaching does.</p>" },
    { title: "GGA Partners With Kingdom Broadcast Network", category: "News", excerpt: "Announcing a new partnership to extend GGA's reach into new broadcast markets.", content: "<p>Announcing a new partnership to extend GGA's reach into new broadcast markets.</p>" },
    { title: "Free From Addiction After 15 Years", category: "Testimony", excerpt: "One man's story of deliverance during the altar call at GGA 2024.", content: "<p>One man's story of deliverance during the altar call at GGA 2024.</p>" },
  ];
  for (const post of blogPosts) {
    const slug = post.title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await upsertBlog({
      ...post,
      slug,
      author: admin._id,
      isPublished: true,
      publishedAt: new Date(),
    });
  }

  console.log("Seeding events...");
  await upsertEvent({
    title: "GGA Global Conference 2026",
    slug: "gga-global-conference-2026",
    description: "A divine gathering of worship, the Word, prayer and transformation — two nights of encounter broadcast to every nation, live from Lagos.",
    location: "Solution Arena, Lagos, Nigeria",
    startDate: new Date("2026-12-04T18:00:00+01:00"),
    endDate: new Date("2026-12-05T05:00:00+01:00"),
    featured: true,
    isPublished: true,
    createdBy: admin._id,
  });
  await upsertEvent({
    title: "GGA Regional Activation — Accra",
    slug: "gga-regional-activation-accra",
    description: "A regional night of worship and the Word, gathering churches from across Ghana.",
    location: "Accra International Centre, Ghana",
    startDate: new Date("2026-09-19T17:00:00+00:00"),
    endDate: new Date("2026-09-19T22:00:00+00:00"),
    isPublished: true,
    createdBy: admin._id,
  });
  await upsertEvent({
    title: "GGA Regional Activation — Nairobi",
    slug: "gga-regional-activation-nairobi",
    description: "A regional night of worship and the Word, gathering churches from across Kenya.",
    location: "KICC, Nairobi, Kenya",
    startDate: new Date("2026-09-19T17:00:00+03:00"),
    endDate: new Date("2026-09-19T22:00:00+03:00"),
    isPublished: true,
    createdBy: admin._id,
  });
  await upsertEvent({
    title: "GGA Prayer Night — Online",
    slug: "gga-prayer-night-online",
    description: "A worldwide online night of prayer and intercession ahead of the global conference.",
    location: "Streamed worldwide",
    isVirtual: true,
    startDate: new Date("2026-11-14T21:00:00+01:00"),
    endDate: new Date("2026-11-14T23:00:00+01:00"),
    isPublished: true,
    createdBy: admin._id,
  });
  await upsertEvent({
    title: "GGA Global Conference 2025",
    slug: "gga-global-conference-2025",
    description: "200,000+ joined live across 22 nations for two nights of worship and the Word.",
    location: "Solution Arena, Lagos, Nigeria",
    startDate: new Date("2025-12-05T18:00:00+01:00"),
    endDate: new Date("2025-12-06T05:00:00+01:00"),
    isPublished: true,
    createdBy: admin._id,
  });
  await upsertEvent({
    title: "GGA Global Conference 2024",
    slug: "gga-global-conference-2024",
    description: "The night 500,000 combined lives were reached across broadcast and in-person.",
    location: "Solution Arena, Lagos, Nigeria",
    startDate: new Date("2024-12-06T18:00:00+01:00"),
    endDate: new Date("2024-12-07T05:00:00+01:00"),
    isPublished: true,
    createdBy: admin._id,
  });
  await upsertEvent({
    title: "GGA Regional Tour",
    slug: "gga-regional-tour-2023",
    description: "Five cities, five nations, one message — carried across West Africa.",
    location: "West Africa (multi-city)",
    startDate: new Date("2023-08-01T18:00:00+00:00"),
    endDate: new Date("2023-08-31T22:00:00+00:00"),
    isPublished: true,
    createdBy: admin._id,
  });

  console.log("Seeding speakers...");
  const speakers = [
    { name: "Pastor Daniel Obi", role: "Convener, GGA", bio: "Founder and lead voice of the Global Grace Activation movement since 2016, pastoring a congregation in Lagos and ministering at every annual gathering.", featured: true, order: 1 },
    { name: "Min. Grace Adeyemi", role: "Worship Director", bio: "Leads the GGA worship team, carrying nations into encounter through original songs streamed to millions each year.", featured: true, order: 2 },
    { name: "Rev. Samuel Etim", role: "Guest Minister", bio: "A sought-after voice on destiny, purpose and kingdom influence, ministering across four continents.", featured: true, order: 3 },
    { name: "Pastor Ruth Bassey", role: "Prayer & Intercession", bio: "Heads the GGA prayer altar, coordinating intercession teams across 25 nations ahead of every gathering.", featured: true, order: 4 },
    { name: "Apostle John Mensah", role: "Guest Speaker", bio: "Founder of a network of churches across West Africa, known for his teaching on grace and identity.", order: 5 },
    { name: "Min. Faith Okoro", role: "Worship Minister", bio: "A rising worship voice whose live recordings from GGA have reached congregations worldwide.", order: 6 },
    { name: "Pastor Michael Danso", role: "Guest Minister", bio: "Leads a growing ministry in Accra and serves as a regular contributor to the GGA teaching archive.", order: 7 },
    { name: "Min. Joy Eze", role: "Psalmist", bio: "Known for intimate, spontaneous worship moments that have become signature moments of past gatherings.", order: 8 },
  ];
  for (const s of speakers) {
    await upsertSpeaker({ ...s, type: "conference-speaker", isPublished: true });
  }

  const leadership = [
    { name: "Pastor Daniel Obi", role: "Convener", order: 1 },
    { name: "Min. Grace Adeyemi", role: "Worship Director", order: 2 },
    { name: "Emeka Nwosu", role: "Operations Lead", order: 3 },
    { name: "Blessing Uche", role: "Partnerships & Media", order: 4 },
  ];
  for (const l of leadership) {
    await upsertSpeaker({ ...l, type: "leadership", isPublished: true });
  }

  console.log("Seeding testimonies...");
  const testimonies = [
    { title: "From Sickness to Healing", category: "Healing", location: "Lagos, Nigeria" },
    { title: "Financial Breakthrough", category: "Breakthrough", location: "Accra, Ghana" },
    { title: "Saved & Set Free", category: "Salvation", location: "Nairobi, Kenya" },
    { title: "Miracle Baby After 10 Years", category: "Restoration", location: "London, UK" },
    { title: "Free From a Decade of Addiction", category: "Deliverance", location: "Houston, USA" },
    { title: "Reunited With My Children", category: "Family", location: "Johannesburg, South Africa" },
    { title: "Walking Again After the Accident", category: "Healing", location: "Abuja, Nigeria" },
    { title: "Found Faith at GGA 2024", category: "Salvation", location: "Toronto, Canada" },
  ];
  for (const t of testimonies) {
    await upsertTestimony({ ...t, isPublished: true, featured: true });
  }

  console.log("Seeding FAQs...");
  const generalFaqs = [
    { question: "Is GGA a church or a movement?", answer: "Global Grace Activation is an interdenominational movement — not a single local church — that partners with churches worldwide to host an annual gathering and year-round resources." },
    { question: "How do I register for the conference?", answer: "Visit the Events page and click Register Now. Registration is free and takes less than two minutes." },
    { question: "Can I watch from outside Nigeria?", answer: "Yes — every session streams live and free on the Watch Live page, with live chat and prayer request support in real time." },
    { question: "How do I volunteer?", answer: "Head to the Volunteer page, choose a department, and submit the short application. You'll be added to our WhatsApp coordination group afterward." },
    { question: "How is my giving used?", answer: "Gifts fund the annual conference, regional activations, broadcasts, and missions support. A yearly report is published for full transparency." },
    { question: "How do I submit a testimony or prayer request?", answer: "Use the Testimonies or Prayer Request pages — both accept anonymous submissions if you prefer." },
  ];
  for (let i = 0; i < generalFaqs.length; i++) {
    await upsertFaq({ ...generalFaqs[i], context: "general", order: i + 1, isPublished: true });
  }

  const eventFaqs = [
    { question: "Is registration free?", answer: "Yes — entry to GGA Global Conference is completely free. Registration simply reserves your seat and issues your QR ticket." },
    { question: "Will I get a ticket?", answer: "After registering you'll receive an email and SMS confirmation with a downloadable QR code ticket for check-in at the venue." },
    { question: "Can I attend if I'm not in Lagos?", answer: "Absolutely. Every session streams live and free on our Watch Live page, with live chat and prayer request support." },
    { question: "Is there parking and accommodation nearby?", answer: "Solution Arena has on-site parking, and our team can share a list of partner hotels within 20 minutes of the venue — reach out via our Contact page." },
  ];
  for (let i = 0; i < eventFaqs.length; i++) {
    await upsertFaq({ ...eventFaqs[i], context: "events", order: i + 1, isPublished: true });
  }

  console.log("\nDone.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Content seed failed:", err);
  process.exit(1);
});
