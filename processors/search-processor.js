var store = require("app-store-scraper");
require("dotenv").config();
const {
   GoogleGenerativeAI,
   HarmCategory,
   HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
   temperature: 1,
   topP: 0.95,
   topK: 64,
   maxOutputTokens: 8192,
   responseMimeType: "text/plain",
};

const safetySettings = [
   {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
   },
   {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
   },
   {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
   },
   {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
   },
];

async function processSearchQuery(query) {
   let cat = await getCategory(query);
   let appList = await generateAppList(cat);
   const scores = await Promise.all(
      appList.map(async (app) => {
         const scoreString = await getScore({
            id: app.id,
            title: app.title,
            description: app.description,
            searchPrompt: query,
         });
         console.log(scoreString);
         return extractJson(scoreString); // Convert the JSON string to a JSON object
      })
   );

   const filteredArray = scores.filter((app) => app.score >= 5);

   return filteredArray;
}

async function getScore(appData) {
   const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
         "I have a json data for application information. i want you to reply with a score only. use the description as a basis on how well it matches with the searchPrompt field. Use 1-10 scale. 1 being the lowest. Also state the reason on the score given but sound professional and don't mention that you used the description and search prompt as basis, only tell the perks of the application using the description. use json format {id,score,reason}\n",
   });

   const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
   });
   console.log("getting score for: ", appData.id);
   const result = await chatSession.sendMessage(JSON.stringify(appData));

   return result.response.text();
}

async function getCategory(query) {
   const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
         'describe the application description using these categories: BOOKS, BUSINESS, CATALOGS, EDUCATION, ENTERTAINMENT, FINANCE, FOOD_AND_DRINK, GAMES, GAMES_ACTION, GAMES_ADVENTURE, GAMES_ARCADE, GAMES_BOARD, GAMES_CARD, GAMES_CASINO, GAMES_DICE, GAMES_EDUCATIONAL, GAMES_FAMILY, GAMES_MUSIC, GAMES_PUZZLE, GAMES_RACING, GAMES_ROLE_PLAYING, GAMES_SIMULATION, GAMES_SPORTS, GAMES_STRATEGY, GAMES_TRIVIA, GAMES_WORD, HEALTH_AND_FITNESS, LIFESTYLE, MAGAZINES_AND_NEWSPAPERS, MAGAZINES_ARTS, MAGAZINES_AUTOMOTIVE, MAGAZINES_WEDDINGS, MAGAZINES_BUSINESS, MAGAZINES_CHILDREN, MAGAZINES_COMPUTER, MAGAZINES_FOOD, MAGAZINES_CRAFTS, MAGAZINES_ELECTRONICS, MAGAZINES_ENTERTAINMENT, MAGAZINES_FASHION, MAGAZINES_HEALTH, MAGAZINES_HISTORY, MAGAZINES_HOME, MAGAZINES_LITERARY, MAGAZINES_MEN, MAGAZINES_MOVIES_AND_MUSIC, MAGAZINES_POLITICS, MAGAZINES_OUTDOORS, MAGAZINES_FAMILY, MAGAZINES_PETS, MAGAZINES_PROFESSIONAL, MAGAZINES_REGIONAL, MAGAZINES_SCIENCE, MAGAZINES_SPORTS, MAGAZINES_TEENS, MAGAZINES_TRAVEL, MAGAZINES_WOMEN, MEDICAL, MUSIC, NAVIGATION, NEWS, PHOTO_AND_VIDEO, PRODUCTIVITY, REFERENCE, SHOPPING, SOCIAL_NETWORKING, SPORTS, TRAVEL, UTILITIES, WEATHER. Only reply exactly with these categories and nothing else. If description is not enough, respond with "NO_CAT".',
   });

   const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
   });

   const result = await chatSession.sendMessage(query);
   console.log("searching for: ", result.response.text().split(" ")[0]);

   return result.response.text().split(" ")[0];
}

async function generateAppList(query) {
   try {
      let data = await store.list({
         collection: store.collection.TOP_FREE_IOS,
         category: store.category[query],
         num: 10,
      });
      return data;
   } catch (e) {
      console.log("Error occured while getting data: ", e);
      return { error: true, message: "can't retrieve list data" };
   }
}

const extractJson = (str) => {
   const jsonRegex = /(?:\{[^{}]*\}|\[[^\[\]]*\])/g;
   const matches = str.match(jsonRegex);
   if (matches) {
      return matches
         .map((match) => {
            try {
               return JSON.parse(match);
            } catch (error) {
               console.error("Invalid JSON:", match);
               return null;
            }
         })
         .filter((result) => result !== null);
   }
   return [];
};

module.exports = { processSearchQuery };
