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
   /*
   let cat = await getCategory(query);
   let appList = await generateAppList(cat);

   const scores = [];
   try {
      for (const app of appList) {
         const scoreString = await getScore({
            id: app.id,
            title: app.title,
            description: app.description,
            searchPrompt: query,
         });
         console.log(scoreString);
         scores.push(extractJson(scoreString)); // Convert the JSON string to a JSON object
      }
   } catch (e) {
      console.log("Error occured while getting data: ", e);
   }
   const filteredArray = scores.filter((app) => app.score != 1);
   */
   const filteredArray = [
      [
         {
            id: "711923939",
            score: 3,
            reason:
               "Cash App offers features like sending and receiving money, discounts, tax filing, and early paychecks.  However, it does not explicitly provide tracking features for costs or expenses. ",
         },
      ],
      [
         {
            id: "283646709",
            score: 6,
            reason:
               "This application provides an excellent feature for order tracking, allowing users to monitor their packages, even if they didn't pay with PayPal, directly through the app. This feature ensures convenience and peace of mind for users regarding their deliveries.",
         },
      ],
      [
         {
            id: "351727428",
            score: 4,
            reason:
               "Venmo offers a robust platform for managing finances, but it doesn't directly focus on tracking costs. While you can monitor transactions and even earn cashback, it doesn't provide dedicated tools for detailed expense analysis.",
         },
      ],
      [
         {
            id: "1260755201",
            score: 2,
            reason:
               "While Zelle excels in offering quick and convenient peer-to-peer money transfers, it doesn't directly address tracking costs. Its focus is on facilitating seamless payments between individuals, not on managing or monitoring expenditures.",
         },
      ],
      [
         {
            id: "407558537",
            score: 3,
            reason:
               "While the app offers features like viewing balances and exporting statements, it doesn't explicitly focus on tracking spending or providing detailed cost analysis tools.",
         },
      ],
      [
         {
            id: "298867247",
            score: 7,
            reason:
               "This application offers budgeting tools to help you track your spending and manage your finances effectively. You can set a budget and track your debit/credit transactions to understand your spending patterns.",
         },
      ],
      [
         {
            id: "349731802",
            score: 6,
            reason:
               "This application offers convenient bill payment options like credit card, debit card, checking account, or PayPal, allowing users to manage their insurance costs effectively. It also provides access to billing history and upcoming payment schedules, enhancing transparency and control over expenses.",
         },
      ],
      [
         {
            id: "836215269",
            score: 2,
            reason:
               "While Chime offers a variety of financial features and services, it does not explicitly focus on expense tracking. It's more geared towards providing convenient banking solutions, including budgeting tools and overdraft protection, which are indirectly related to managing costs.",
         },
      ],
   ];

   let finalApps = [];

   for (const app of filteredArray) {
      const appId = Number(app[0].id);

      const fullData = await getFullAppData({
         id: appId,
      });
      finalApps.push(fullData); // Convert the JSON string to a JSON object
   }

   return finalApps;
}

async function getFullAppData(appId) {
   let data = {};
   try {
      var store = require("app-store-scraper");
      data = await store.app({ id: appId.id });
      console.log(data);
   } catch (e) {
      //console.log("Error while getting full app data: ", e);
   }
   return data;
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
         num: 20,
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
