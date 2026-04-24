import { Language, InterviewSession, DimensionKey } from "./types";
import { getDimension } from "./dimensions";

export const MAX_REPLY_TOKENS = 150;
export const SOFT_REPLY_CHAR_LIMIT = 300;
export const MAX_HISTORY_MESSAGES = 28;

export function estimateTokens(text: string): number {
  const cyrillicCount = (text.match(/[а-яёА-ЯЁ]/g) ?? []).length;
  const turkishCount = (text.match(/[çğışöüÇĞİŞÖÜ]/g) ?? []).length;
  const nonLatinRatio = (cyrillicCount + turkishCount) / Math.max(text.length, 1);
  const charsPerToken = nonLatinRatio > 0.3 ? 3 : 4;
  return Math.ceil(text.length / charsPerToken);
}

const DIMENSION_AXES: Record<DimensionKey, Record<Language, string>> = {
  D1: {
    en: "What the person is proud of at work. Real achievements, moments of ownership, concrete results.",
    ru: "Chem chelovek gorditsya na rabote. Realnye dostizheniya, momenty otvetstvennosti, konkretnye rezultaty.",
    tr: "Kişinin işte gurur duyduğu şeyler. Gerçek başarılar, sahiplik anları, somut sonuçlar.",
  },
  D2: {
    en: "Whether the person feels stable and valued. Job security, fair pay, sense of being appreciated.",
    ru: "Chuvstvuet li chelovek stabilnost i cennost. Uverennost v rabote, spravedlivaya oplata.",
    tr: "Kişinin kendini güvende ve değerli hissedip hissetmediği. İş güvencesi, adil ücret.",
  },
  D3: {
    en: "Quality of working relationships. Team dynamics, manager relationship, trust, conflict, support.",
    ru: "Kachestvo rabochikh otnosheniy. Dinamika komandy, otnosheniya s rukovoditelem, doverie, konflikty.",
    tr: "Çalışma ilişkilerinin kalitesi. Ekip dinamiği, yönetici ilişkisi, güven, çatışma.",
  },
  D4: {
    en: "How much control the person has over their work. Freedom to decide, choose methods, set pace.",
    ru: "Naskolko chelovek kontroliruet svoyu rabotu. Svoboda prinimat resheniya, vybrat metody.",
    tr: "Kişinin kendi işi üzerinde ne kadar kontrolü olduğu. Karar verme, yöntem seçme özgürlüğü.",
  },
  D5: {
    en: "Energy and engagement at work. What pulls them in, what drains them.",
    ru: "Energiya i vovlechennost na rabote. Chto zahvatyvaet, chto istoshchaet.",
    tr: "İşteki enerji ve bağlılık. Neyin içine çektiği, neyin tükettiği.",
  },
  D6: {
    en: "Whether the person gets useful feedback and feels their work is seen.",
    ru: "Poluchaet li chelovek poleznuyu obratnuyu svyaz i chuvstvuet li, chto ego rabotu zamechayut.",
    tr: "Kişinin yararlı geri bildirim alıp almadığı ve çalışmasının görülüp görülmediği.",
  },
  D7: {
    en: "Whether the person is growing. New skills, real learning, sense of moving forward.",
    ru: "Rastet li chelovek. Novye navyki, realnoe obuchenie, oshchushchenie dvizheniya vpered.",
    tr: "Kişinin büyüyüp büyümediği. Yeni beceriler, gerçek öğrenme, ilerleme hissi.",
  },
  D8: {
    en: "Whether the work feels meaningful. Connection to something bigger, alignment with personal values.",
    ru: "Oshchushchaet li chelovek smysl v rabote. Svyaz s chem-to bolshim, sootvetstvie cennostyam.",
    tr: "İşin anlamlı hissettirip hissettirmediği. Daha büyük bir şeyle bağlantı, değerlerle uyum.",
  },
  D9: {
    en: "What gets in the way of doing good work. Workload, broken processes, people, tools, bureaucracy.",
    ru: "Chto meshaet delat rabotu horosho. Nagruzka, slomannye processy, lyudi, instrumenty.",
    tr: "İyi iş yapmanın önüne ne geçiyor. İş yükü, bozuk süreçler, insanlar, araçlar.",
  },
  D10: {
    en: "Whether the person feels heard. Can they speak up, does it change anything.",
    ru: "Chuvstvuet li chelovek, chto ego slyshat. Mozhet li vyskazatsya, menyaet li eto chto-to.",
    tr: "Kişinin duyulduğunu hissedip hissetmediği. Sesini yükseltebiliyor mu, bir şeyi değiştiriyor mu.",
  },
};

export interface LLMInput {
  dimension: string;
  dimension_name: string;
  language: string;
  question_goal: "extract_fact" | "extract_example" | "deepen";
  axis_definition: string;
  question_anchor: string;
  role_question_template: string;
  required_signal: string[];
  history_summary: string;
  asked_questions: string[]; 
  turn: number;
  max_turns: number;
}

export const FORMATTER_SYSTEM_PROMPT = `You are a deterministic interview question formatter.

YOUR ONLY JOB: Convert the JSON input into exactly ONE interview question.
OUTPUT FORMAT: {"question": "..."}  — nothing else, no explanation, no markdown.

STEP 1 — READ asked_questions FROM INPUT.
These are questions already asked. You MUST NOT generate anything similar.
Before writing your question, verify it shares NO key words with any entry in asked_questions.

STEP 2 — WRITE ONE question that:
- Is in the language specified in the input
- Targets the axis_definition topic
- References the question_anchor (work context)
- Asks for a specific fact, example, or deeper detail
- Is max 2 sentences
- Contains no filler words, HR jargon, or AI disclosure
- Does not start with "How has that", "What would need to", "Can you give me" if those phrases appear in asked_questions

STEP 3 — VERIFY your question does not match any entry in asked_questions.
If it does — rewrite it completely with a different verb, subject, and angle.

HARD RULES:
- Output ONLY {"question": "..."} — nothing else
- Never repeat or rephrase anything from asked_questions
- Never use ambiguous pronouns (that/it/this) as main subject
- No advice, opinions, or suggestions
- No greeting or sequencing language`;

const SIGNAL_KEYWORDS: Record<DimensionKey, string[]> = {
  D1: ["proud","pride","achievement","win","success","result","accomplished","delivered","nailed","milestone","gordost","dostizhenie","rezultat","uspekh","sdelal","poluvilos","spravils","zavershil","gurur","basari","basardim","sonuc","tamamladim","hallettim"],
  D2: ["stable","secure","security","valued","fair","fairness","pay","salary","compensation","job security","recognized","underpaid","overworked","stabilnost","stabilno","cennost","cenyat","spravedlivo","zarplata","bezopasnost","nedoocenivayut","guvenli","guvenlik","degerli","adil","maas","istikrar","degersiz"],
  D3: ["team","colleague","coworker","manager","boss","trust","conflict","support","relationship","together","toxic","alone","isolated","komanda","kollega","rukovoditel","doverie","konflikt","podderzhka","otnosheniya","toksichno","odin","ekip","meslektas","yonetici","guven","catisma","destek","iliski","toksik","yalniz"],
  D4: ["autonomy","control","decide","decision","freedom","independent","ownership","flexibility","micromanage","micromanaged","avtonomiya","kontrol","reshenie","svoboda","samostoyatelno","nezavisimost","mikromenedzhment","ozerklik","karar","ozgurluk","bagimsiz","esneklik"],
  D5: ["energy","motivated","motivation","engaged","flow","drain","drained","boring","excited","passionate","burned out","burnout","exhausted","energiya","motivaciya","vovlechennost","potok","skuchno","interesno","zahvatyvaet","vygoranie","enerji","motivasyon","baglilik","akis","sikici","heyecan","tukenislik"],
  D6: ["feedback","recognition","seen","acknowledged","noticed","credit","praise","review","performance","invisible","ignored","obratnaya svyaz","priznanie","zamechayut","ocenka","otziv","nevidimiy","ignoriruyut","geri bildirim","taninma","fark edilmek","ovgu","degerlendirme","gorunmez","gormezden"],
  D7: ["learn","learning","grow","growth","skill","develop","development","training","course","new","stagnant","stuck","uchitsya","ucheba","rasti","rost","navyk","razvitie","obuchenie","novoe","zastoy","ogren","ogrenmek","buyume","beceri","gelisim","egitim","yeni","duragan"],
  D8: ["purpose","meaning","meaningful","values","matter","impact","mission","believe","pointless","hollow","smysl","znachenie","cennosti","vazhno","missiya","vliyanie","bessmyslenno","pusto","amac","anlam","degerler","onemli","misyon","etki","anlamsiz","bos"],
  D9: ["obstacle","block","blocked","slow","frustrate","frustrated","workload","overload","bureaucracy","process","tool","broken","chaos","prepyatstvie","meshaet","nagruzka","peregruzka","byurokratiya","tormozit","haos","engel","engellendi","is yuku","asiri yuk","burokratsi","surec","yavas","kaos"],
  D10: ["voice","speak up","heard","safe","psychological safety","opinion","idea","suggestion","ignored","silenced","afraid to say","golos","vyskazatsya","uslyshan","bezopasno","mnenie","ideya","ignoriruyut","zamolchali","ses","sesini yukselt","duyulmak","guvenli","fikir","oneri","gormezden","susturuldu"],
};

const DIMENSION_ANCHORS: Record<DimensionKey, Record<Language, string>> = {
  D1: { en: "a specific achievement or result at work", ru: "konkretnyy rezultat ili dostizhenie na rabote", tr: "işte belirli bir başarı veya sonuç" },
  D2: { en: "job stability or sense of being valued at work", ru: "stabilnost ili oshchushchenie cennosti na rabote", tr: "işte istikrar veya değer görme hissi" },
  D3: { en: "a specific interaction with a colleague or manager", ru: "konkretnoye vzaimodeystviye s kollegoy ili rukovoditelem", tr: "bir meslektaş veya yöneticiyle belirli bir etkileşim" },
  D4: { en: "a decision or task where you had or lacked control", ru: "resheniye ili zadacha, gde bylo ili ne bylo kontrolya", tr: "kontrol sahibi olduğunuz veya olmadığınız bir karar ya da görev" },
  D5: { en: "a specific task or period that energized or drained you", ru: "konkretnyy proyekt ili period, kotoryy zaryazhal ili istoshchal", tr: "sizi enerji veren veya tüketen belirli bir görev ya da dönem" },
  D6: { en: "a specific piece of feedback or moment of recognition at work", ru: "konkretnyy otzyv ili moment priznaniya na rabote", tr: "işte belirli bir geri bildirim veya takdir anı" },
  D7: { en: "a specific skill or knowledge you gained or tried to gain at work", ru: "konkretnyy navyk ili znanie, poluchennoye ili ne poluchennoye na rabote", tr: "işte kazandığınız veya kazanmaya çalıştığınız belirli bir beceri ya da bilgi" },
  D8: { en: "a specific moment when your work felt meaningful or pointless", ru: "konkretnyy moment, kogda rabota kazalas znachimoy ili bessmyslennoy", tr: "işinizin anlamlı veya anlamsız hissettirdiği belirli bir an" },
  D9: { en: "a specific obstacle or recurring problem that blocked your work", ru: "konkretnoye prepyatstviye ili povtoryayushchayasya problema, meshavshaya rabote", tr: "işinizi engelleyen belirli bir engel veya tekrarlayan sorun" },
  D10: { en: "a specific situation where you spoke up or stayed silent at work", ru: "konkretnyy sluchay, kogda vyskazalsya ili promolchal na rabote", tr: "işte sesini yükselttiğiniz veya sessiz kaldığınız belirli bir durum" },
};

const ROLE_QUESTION_TEMPLATES: Record<DimensionKey, Record<Language, string>> = {
  D1: {
    en: "What was your role in achieving this result at work?",
    ru: "Kakova byla tvoya rol v dostizhenii etogo rezultata na rabote?",
    tr: "Bu sonucu işte elde etmedeki rolünüz neydi?",
  },
  D2: {
    en: "What was your role in this situation regarding your job stability or recognition at work?",
    ru: "Kakova byla tvoya rol v etoy situatsii, svyazannoy so stabilnostyu ili priznaniyem na rabote?",
    tr: "İşteki istikrarınız veya tanınmanızla ilgili bu durumda rolünüz neydi?",
  },
  D3: {
    en: "What was your role in how this situation with your colleague or manager developed?",
    ru: "Kakova byla tvoya rol v tom, kak razvivalas eta situatsiya s kollegoy ili rukovoditelem?",
    tr: "Bu durumun meslektaşınız veya yöneticinizle nasıl geliştiğindeki rolünüz neydi?",
  },
  D4: {
    en: "What was your role in making or influencing this decision at work?",
    ru: "Kakova byla tvoya rol v prinyatii ili vliyanii na eto resheniye na rabote?",
    tr: "İşteki bu kararı almada veya etkilemede rolünüz neydi?",
  },
  D5: {
    en: "What was your role in this task or project that affected your energy at work?",
    ru: "Kakova byla tvoya rol v etom zadanii ili proyekte, kotoryy povliyal na tvoyu energiyu na rabote?",
    tr: "İşteki enerjinizi etkileyen bu görev veya projedeki rolünüz neydi?",
  },
  D6: {
    en: "What was your role in this situation where your work was or was not recognized?",
    ru: "Kakova byla tvoya rol v etoy situatsii, gde tvoya rabota byla ili ne byla otmechena?",
    tr: "Çalışmanızın tanındığı veya tanınmadığı bu durumda rolünüz neydi?",
  },
  D7: {
    en: "What was your role in pursuing or missing this learning opportunity at work?",
    ru: "Kakova byla tvoya rol v tom, chtoby vospolzovatsya ili upustit etu vozmozhnost obucheniya na rabote?",
    tr: "İşteki bu öğrenme fırsatını takip etmedeki veya kaçırmadaki rolünüz neydi?",
  },
  D8: {
    en: "What was your role in this work situation that felt meaningful or pointless?",
    ru: "Kakova byla tvoya rol v etoy rabochey situatsii, kotoraya kazalas znachimoy ili bessmyslennoy?",
    tr: "Anlamlı veya anlamsız hissettiren bu iş durumundaki rolünüz neydi?",
  },
  D9: {
    en: "What was your role in handling this obstacle at work?",
    ru: "Kakova byla tvoya rol v reshenii etogo prepyatstviya na rabote?",
    tr: "İşteki bu engeli ele almadaki rolünüz neydi?",
  },
  D10: {
    en: "What was your role in this situation where you spoke up or stayed silent at work?",
    ru: "Kakova byla tvoya rol v etoy situatsii, kogda ty vyskazalsya ili promolchal na rabote?",
    tr: "İşte sesini yükselttiğin veya sessiz kaldığın bu durumda rolün neydi?",
  },
};
export function buildLLMInput(session: InterviewSession): LLMInput {
  const lang = session.language as Language;
  const currentDim = getDimension(session.currentDimension);
  const currentCov = session.coverage[session.currentDimension];

  let question_goal: LLMInput["question_goal"] = "extract_fact";
  if (currentCov.turnCount === 0) question_goal = "extract_fact";
  else if (currentCov.signals.length < 2) question_goal = "extract_example";
  else question_goal = "deepen";

  const recentBotQs = session.history
    .filter((m) => m.role === "assistant")
    .slice(-3)
    .map((m) => m.content.slice(0, 60))
    .join(" | ");

  const asked_questions = session.history
    .filter((m) => m.role === "assistant")
    .map((m) => m.content.trim())
    .filter((q) => q.length > 5);
  const required_signal = (SIGNAL_KEYWORDS[session.currentDimension as DimensionKey] ?? [])
    .filter((s) => !currentCov.signals.includes(s))
    .slice(0, 3);

  const anchor = DIMENSION_ANCHORS[session.currentDimension as DimensionKey]?.[lang]
    ?? "a specific work situation";

  const roleTemplate = ROLE_QUESTION_TEMPLATES[session.currentDimension as DimensionKey]?.[lang]
    ?? "What was your specific role in this situation at work?";

  return {
    dimension: currentDim.key,
    dimension_name: currentDim.name[lang],
    language: lang === "ru" ? "Russian" : lang === "tr" ? "Turkish" : "English",
    question_goal,
    axis_definition: DIMENSION_AXES[currentDim.key][lang],
    question_anchor: anchor,
    role_question_template: roleTemplate,
    required_signal,
    history_summary: recentBotQs || "none",
    asked_questions,
    turn: currentCov.turnCount + 1,
    max_turns: currentDim.maxTurns,
  };
}

export function parseLLMOutput(raw: string, _lang: Language): string {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.question && typeof parsed.question === "string") return parsed.question.trim();
  } catch {}
  const match = trimmed.match(/"question"\s*:\s*"([^"]+)"/);
  if (match?.[1]) return match[1].trim();
  if (trimmed.includes("?")) return trimmed.replace(/^\W+/, "").trim();
  return "";
}

export function isReplyDuplicate(
  reply: string,
  history: { role: string; content: string }[]
): boolean {
  if (!reply || reply.length < 5) return false;
  const replyLower = reply.toLowerCase().trim();
  const fp = replyLower.replace(/[^a-zа-яёçğışöü\s]/gi, "").replace(/\s+/g, " ").split(" ").slice(0, 6).join(" ");

  return history
    .filter((m) => m.role === "assistant")
    .some((m) => {
      const mLower = m.content.toLowerCase().trim();
      const mFp = mLower.replace(/[^a-zа-яёçğışöü\s]/gi, "").replace(/\s+/g, " ").split(" ").slice(0, 6).join(" ");
      if (mLower === replyLower) return true;
      if (mFp === fp && fp.length > 5) return true;
      if (replyLower.slice(0, 30) === mLower.slice(0, 30) && replyLower.length > 20) return true;
      return false;
    });
}

export function buildSystemPrompt(_session: InterviewSession): string {
  return FORMATTER_SYSTEM_PROMPT;
}
export function buildRoleReminder(_lang: Language, _dimKey: string, _dimName: string): string {
  return "";
}

export function trimHistory(
  history: { role: "assistant" | "user"; content: string }[]
): { role: "assistant" | "user"; content: string }[] {
  if (history.length <= MAX_HISTORY_MESSAGES) return history;
  const first = history.slice(0, 1);
  const recent = history.slice(-(MAX_HISTORY_MESSAGES - 1));
  return [...first, ...recent];
}

export function extractSignals(text: string, dim: DimensionKey): string[] {
  const lower = text.toLowerCase();
  return (SIGNAL_KEYWORDS[dim] ?? []).filter((kw) => lower.includes(kw.toLowerCase()));
}

export type Sentiment = "positive" | "negative" | "neutral";

const POSITIVE_WORDS = ["good","great","love","enjoy","proud","happy","excited","motivated","meaningful","growth","trust","support","horosho","otlichno","nravitsya","gorzhus","rad","motivaciya","doverie","podderzhka","smysl","rost","iyi","harika","seviyorum","gurur","mutlu","motivasyon","guven","destek","anlam","buyume"];
const NEGATIVE_WORDS = ["bad","hate","frustrated","stressed","tired","unfair","ignored","burned out","burnout","toxic","alone","stuck","pointless","broken","ploho","nenavizhu","ustal","stress","nespravedlivo","ignoriruyut","vygoranie","toksichno","odin","zastyal","bessmyslenno","kotu","nefret","yorgun","stres","adaletsiz","gormezden","tukenislik","toksik","yalniz","anlamsiz"];

export function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}
