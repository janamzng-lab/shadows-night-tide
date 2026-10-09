export interface MonsterDossier {
  id: string;
  nameEn: string;
  nameAr: string;
  classificationEn: string;
  classificationAr: string;
  dangerRating: 'EXTREME' | 'VERY HIGH' | 'HIGH' | 'MODERATE';
  silhouetteEn: string;
  silhouetteAr: string;
  loreEn: string;
  loreAr: string;
  attackStyleEn: string;
  attackStyleAr: string;
  weaknessEn: string;
  weaknessAr: string;
  soundIdentityEn: string;
  soundIdentityAr: string;
  tacticsEn: string;
  tacticsAr: string;
}

export const MONSTER_DOSSIERS: MonsterDossier[] = [
  {
    id: 'boss_maryam',
    nameEn: 'Maryam — The White Horror',
    nameAr: 'مريم — الرعب الأبيض',
    classificationEn: 'Apex Subject / Alpha Biomorphic Entity',
    classificationAr: 'الكيان الحيوي الرئيسي / الفئة ألفا',
    dangerRating: 'EXTREME',
    silhouetteEn: 'Towering 2.4m emaciated figure cloaked in shredded surgical shroud; hollowed abdominal cavity with exposed, writhing viscera cords.',
    silhouetteAr: 'هيكل نحيل يبلغ طوله 2.4 متر بزي جراحي ممزق ملطخ بالدماء؛ تجويف بطني مفرغ تتدلى منه أحشاء عضوية متحركة.',
    loreEn: 'Formerly Head Researcher Dr. Maryam Vance, patient zero of the Sub-Level 4 anomaly. When the Night Tide ruptured the containment vaults, Vance refused evacuation to shield the specimens. The biological saturation inverted her cellular matrix—dissolving the abdominal wall and externalizing her internal digestive tract while amplifying physical velocity by 300%.',
    loreAr: 'كبيرة الباحثين الدكتورة مريم فانس سابقاً، المريضة صفر في كارثة المستوى الرابع. عند انفجار حواجز مد الظلال، رفضت الإخلاء لحماية العينات، مما أدى إلى قلب بنيتها الخلوية وإذابة جدار البطن مع تعليق الأحشاء الحية وزيادة سرعتها الهجومية ثلاثة أضعاف.',
    attackStyleEn: 'Deceptive slow dragging patrol that transitions instantaneously into terrifying berserk lunges. In close quarters, she lashes with coagulated entrail whips and sweeps elongated bloodied talons.',
    attackStyleAr: 'دوريات خادعة بطيئة تتحول فوراً إلى اندفاع جنوني مرعب. في المسافات القريبة تشن هجمات بسياط أحشائها الحية ومخالبها الدموية الطويلة.',
    weaknessEn: 'High-voltage electrical disruption (Tesla Arc / Shock Prods) overloads exposed abdominal nerve clusters, triggering a 4-second stagger window. Buckshot to the hollowed core deals critical 2.5x damage.',
    weaknessAr: 'الصدمات الكهربائية عالية الجهد (قوس تسلا / الصاعق) تعطل العقد العصبية للأحشاء المكشوفة لمدة 4 ثوانٍ. طلقات الخرطوش في التجويف المكشوف تسبب ضرراً مضاعفاً 2.5x.',
    soundIdentityEn: 'Harrowing banshee screams paired with wet biological dragging noises and deep sub-bass guttural weeping.',
    soundIdentityAr: 'صرخات حادة مفزعة مصحوبة بأصوات زحف أنسجة عضوية رطبة ونحيب عميق من الترددات الخفيضة.',
    tacticsEn: 'Never run straight in long corridors—she accelerates faster than sprint speed. Use door partitions and pillars to break line of sight, forcing her into search state.',
    tacticsAr: 'لا تركض في خط مستقيم في الممرات الطويلة؛ تسارعها يتجاوز سرعة الجري. استغل الأبواب والأعمدة لقطع خط الرؤية وإجبارها على مرحلة التفتيش.',
  },
  {
    id: 'boss_sarah',
    nameEn: 'Sarah — The Sunken Tide',
    nameAr: 'سارة — مد الظلال الغارق',
    classificationEn: 'Abyssal Calcareous Mutation / Apex Ambush Predator',
    classificationAr: 'طفرة كلسية عميقة / مفترس كمائن قمة',
    dangerRating: 'EXTREME',
    silhouetteEn: 'Drowned maritime entity covered in petrified barnacle chitin armor; long wet tangled hair obscuring facial features; right arm mutated into a massive crushing chitin claw.',
    silhouetteAr: 'كيان بحري غارق مغطى بصفائح كلسية من البرنقيل المتحجر؛ شعر أسود رطب يغطي ملامح الوجه؛ الذراع اليمنى تحولت إلى مخلب سلطعوني ضخم.',
    loreEn: 'Recovered from the flooded subterranean marine trench during Excavation Night Tide. Sarah exhibits symbiotic calcification, using seawater minerals to generate stone-hard shell armor. She hunts through acoustic resonance, vibrating chitin plates to locate prey.',
    loreAr: 'تم استردادها من الخندق البحري المغمور تحت الأرض خلال حفريات مد الظلال. تعتمد على تكلس تكافلي مع معادن البحر لتشكيل درع صخري صلب. تصطاد بالرنين الصوتي عبر اهتزاز صفائح البرنقيل.',
    attackStyleEn: 'Shadow stalker AI: clings to periphery, flanks behind obstacles, then delivers a devastating leap-strike with her crushing claw.',
    attackStyleAr: 'ذكاء كمائن الظلال: تتسلل في الزوايا المظلمة وتلتف خلف الأعمدة لتنقض بقفزة ساحقة بمخلبها الضخم.',
    weaknessEn: 'Thermal and coherent photon beams (Prism Arc Laser) melt outer calcified layers. Demolition Cannon concussive blast cracks her shell armor.',
    weaknessAr: 'أشعة الليزر المركزة تذيب القشرة الكلسية، ومقذوفات مدفع الهدم تسحق درعها الصخري وتفقده توازنه.',
    soundIdentityEn: 'Rapid chattering chitin clicks, wet gurgling water echoes, and metallic screeches.',
    soundIdentityAr: 'نقر سريع لصفائح الكيتين، وقرقرة مائية رطبة، وصرير معدني حاد عند الهجوم.',
    tacticsEn: 'Keep flashlight beam focused on her when she flanks; she recoils briefly from direct high-intensity light.',
    tacticsAr: 'سلط ضوء المصباح عليها عند محاولتها الالتفاف؛ تتراجع مؤقتاً عند التعرض للضوء المركز.',
  },
  {
    id: 'follower_crawler',
    nameEn: 'Visceral Lurker (Maryam Follower)',
    nameAr: 'المتربص الحشوي (أتباع مريم)',
    classificationEn: 'Scavenger Quadruped',
    classificationAr: 'رباعي الأطراف الجيفية',
    dangerRating: 'HIGH',
    silhouetteEn: 'Low crawling quad creature bound in torn bloody hospital bandages, scurrying beneath counters and ventilation shafts.',
    silhouetteAr: 'مخلوق رباعي يزحف بارتفاع منخفض ملفوف بأربطة شاش دمية ممزقة.',
    loreEn: 'Biomass discarded during Vance’s transformation that congealed into autonomous predatory swarms.',
    loreAr: 'كتل حيوية انفصلت خلال تحول مريم وتجمعت لتشكل كائنات مفترسة مستقلة.',
    attackStyleEn: 'Fast scurrying charge targeting player legs, inflicting bleed.',
    attackStyleAr: 'اندفاع سريع نحو أقدام اللاعب مسبباً نزيفاً وإعاقة للحركة.',
    weaknessEn: 'Vulnerable to low-angle shotgun blasts and stomp kicks.',
    weaknessAr: 'سريع السقوط أمام طلقات الخرطوش الموجهة للأسفل.',
    soundIdentityEn: 'Skittering bone claws and rapid wet panting.',
    soundIdentityAr: 'خربشة مخالب عظمية على الأرض ولهث رطب متسارع.',
    tacticsEn: 'Crouch-aim with shotgun or rifle when hearing skittering nearby.',
    tacticsAr: 'انحنِ وصوّب للأسفل فور سماع أصوات الخربشة في الممرات.',
  },
  {
    id: 'follower_shambler',
    nameEn: 'Blooded Shambler (Maryam Follower)',
    nameAr: 'المتسارع الملطخ (أتباع مريم)',
    classificationEn: 'Sub-Human Combatant Host',
    classificationAr: 'عائل قتالي شبه بشري',
    dangerRating: 'MODERATE',
    silhouetteEn: 'Upright lumbering patient in soiled medical gowns with asymmetric twitching limbs.',
    silhouetteAr: 'مريض مشوه يقف مترنحاً في رداء طبي متسخ مع أطراف ترتعش بشكل غير متناسق.',
    loreEn: 'Facility medical personnel infected by initial airborne spore dispersal.',
    loreAr: 'أفراد الطاقم الطبي المصابون بالأبواغ المحمولة جواً في بداية الحادث.',
    attackStyleEn: 'Flailing arm swipes and grapple attempts.',
    attackStyleAr: 'ضربات عشوائية ومحاولات إمساك بالضحية.',
    weaknessEn: 'Headshots with 9mm Pistol stagger instantly.',
    weaknessAr: 'إصابات الرأس بمسدس 9 ملم تسبب شللاً فورياً لحركته.',
    soundIdentityEn: 'Agonized human moans and labored breathing.',
    soundIdentityAr: 'أنين بشري متألم وتنفس مجهد ثقيل.',
    tacticsEn: 'Conserve heavy ammo; 2 accurate pistol headshots eliminate them.',
    tacticsAr: 'وفر الذخيرة الثقيلة؛ رصاصتان دقيقتان في الرأس كافيتان لتحييده.',
  },
  {
    id: 'follower_stalker',
    nameEn: 'Shore Stalker (Sarah Follower)',
    nameAr: 'صائد الشاطئ (أتباع سارة)',
    classificationEn: 'Amphibious Flanker',
    classificationAr: 'مهاجم برمائي متسلل',
    dangerRating: 'HIGH',
    silhouetteEn: 'Sleek, dark grey amphibious humanoid with calcified spine spikes.',
    silhouetteAr: 'كائن رمادي داكن رشيق ذو أشواك كلسية على طول العمود الفقري.',
    loreEn: 'Specimens gestated in the flooded bilge chambers of Sector 4.',
    loreAr: 'عينات تخلقت داخل قنوات المياه المغمورة في القطاع 4.',
    attackStyleEn: 'Sprint-flank tactics, leaping through doorways to strike from rear.',
    attackStyleAr: 'تكتيكات الالتفاف السريع والقفز عبر الأبواب لضرب اللاعب من الخلف.',
    weaknessEn: 'Electrical prods stop their sprint instantly.',
    weaknessAr: 'الصواعق الكهربائية توقف ركضهم فوراً.',
    soundIdentityEn: 'Hissing breath and rapid water splashing.',
    soundIdentityAr: 'فحيح حاد وطرطشة مياه سريعة.',
    tacticsEn: 'Watch side corridors and listen for splashing steps in flooded areas.',
    tacticsAr: 'راقب الممرات الجانبية واستمع لخطوات الماء في المناطق المغمورة.',
  },
  {
    id: 'follower_brute',
    nameEn: 'Sunken Heavy (Sarah Follower)',
    nameAr: 'العملاق الغارق (أتباع سارة)',
    classificationEn: 'Armored Tank Class',
    classificationAr: 'فئة الدرع الثقيل',
    dangerRating: 'VERY HIGH',
    silhouetteEn: 'Massive hulking entity encrusted in dense ocean mineral armor.',
    silhouetteAr: 'كيان ضخم مصفح بطبقات سميكة من رواسب المعادن البحرية.',
    loreEn: 'Heavy security guards mutated into dense chitin-plated juggernauts.',
    loreAr: 'حراس أمن تحولوا إلى كائنات مدرعة ضخمة ذات قوة سحق هائلة.',
    attackStyleEn: 'Slow relentless advance followed by heavy ground-pound smash.',
    attackStyleAr: 'تقدم بطيء وثابت يتبعه سحق مدمر للأرض بالمرفقين.',
    weaknessEn: 'Demolition Cannon or close-range 12-gauge to back weakpoint.',
    weaknessAr: 'مدفع الهدم أو طلقات الشوزن الموجهة إلى نقطة الضعف الخلفية.',
    soundIdentityEn: 'Heavy vibrating footsteps and metallic thuds.',
    soundIdentityAr: 'خطوات ثقيلة تهتز لها الأرض وضربات معدنية صلبة.',
    tacticsEn: 'Kite around pillars and maintain distance; never get cornered.',
    tacticsAr: 'استدر حول الأعمدة ولا تسمح له بمحاصرتك في الزوايا الضيقة.',
  },
];

export const STORY_BRIEFING = {
  en: {
    title: 'THE NIGHT TIDE INCIDENT: CLASSIFIED DOSSIER',
    subtitle: 'Sector 4 Deep Research Facility — Incident Log #094',
    content: `In late October, deep-core drilling in Sector 4 breached an abyssal bio-mineral deposit known as the Night Tide. Within 48 hours, the facility was severed from surface contact. 

The biological catalyst triggered radical metamorphosis in all human and marine biological specimens. Maryam Vance, chief geneticist, became the epicenter of the terrestrial outbreak—mutating into a terrifying, visceral horror in stained hospital robes whose internal anatomy has burst outwards. Concurrently, maritime specimen Sarah established dominion over the flooded lower drainage vaults, forming an impenetrable calcified barrier.

Your objective: Infiltrate Sector 4, secure the security keycards, neutralize the follower swarms, withstand the horrifying confrontations with Maryam and Sarah, and eradicate the Night Tide core before the breach spreads to the continental shelf.`,
  },
  ar: {
    title: 'حادثة مد الظلال: الملف السري',
    subtitle: 'منشأة الأبحاث العميقة بالقطاع 4 — سجل الحادث #094',
    content: `في أواخر أكتوبر، اخترقت عمليات الحفر العميق في القطاع 4 جيباً حيوياً معدنياً يُعرف باسم "مد الظلال". وخلال 48 ساعة، انقطع الاتصال بالمنشأة تماماً عن السطح.

تسبب المحفز الحيوي في حدوث طفرات جينية عنيفة لدى جميع الكائنات. أصبحت الدكتورة مريم فانس بؤرة التفشي الأرضي—فتحولت إلى كيان مرعب بثوب جراحي ممزق وأحشاء مكشوفة مع سرعة هجومية جنونية. وفي الوقت ذاته، فرضت العينة البحرية سارة سيطرتها على السراديب المغمورة بالمياه مصفحة بدروع كلسية صلبة.

مهمتك: التسلل إلى القطاع 4، جمع بطاقات الأمان، القضاء على أسراب الأتباع، النجاة من المواجهات القاتلة مع مريم وسارة، وتدمير مصدر مد الظلال قبل وصوله للسطح.`,
  },
};
